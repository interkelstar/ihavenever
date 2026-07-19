package com.kelstar.ihne.controller.rest

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.kelstar.ihne.service.RoomNotFoundException
import com.kelstar.ihne.service.RoomService
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.security.MessageDigest
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

/**
 * Buy Me a Coffee webhook receiver, replacing the old honor-system "click I paid" flow.
 * Configured in BMC Studio -> Integrations with this endpoint's public URL and a per-webhook
 * Signing Secret. BMC sends `{event_id, type, live_mode, created, attempt, data}` and signs the
 * *raw* request body with HMAC-SHA256 keyed by that secret, hex-encoded in the
 * `x-signature-sha256` header.
 *
 * BMC retries a failed delivery up to 4 times with backoff and auto-disables the webhook after
 * 10 *consecutive* failures (non-2xx responses). That means: once the signature is verified and
 * the event is understood, we must return 2xx for anything we handled but chose not to act on
 * (an event type we don't care about, no room code found, no matching room) - those are
 * business-logic misses, not delivery failures, and must never make BMC retry or eventually
 * disable the webhook. Only signature/config failures are allowed to look like a failure to BMC.
 */
@RestController
@RequestMapping("/api/v1/webhooks/bmc")
class BmcWebhookController(
    @Value("\${bmc.webhook.secret:}") private val configuredSecret: String,
    private val roomService: RoomService
) {
    private val logger = LoggerFactory.getLogger(javaClass)
    private val objectMapper = ObjectMapper()

    companion object {
        private const val SIGNATURE_HEADER = "x-signature-sha256"
        private const val HMAC_ALGORITHM = "HmacSHA256"
        private val ROOM_CODE_REGEX = Regex("\\b\\d{6}\\b")
    }

    /**
     * Secret resolution mirrors GeminiService.resolveApiKey: re-checked on every call (never
     * cached) because the @Value-injected [configuredSecret] can be constructed *before*
     * HikariCracResource.afterRestore promotes BMC_WEBHOOK_SECRET into the "bmc.webhook.secret"
     * system property on a CRaC restore. The System.getProperty/getenv fallbacks below - not
     * injection order - are the real guarantee that a fresh secret set on the Cloud Run revision
     * is actually picked up.
     */
    private fun resolveSecret(): String? =
        configuredSecret.takeIf { it.isNotBlank() }
            ?: System.getProperty("bmc.webhook.secret")?.takeIf { it.isNotBlank() }
            ?: System.getenv("BMC_WEBHOOK_SECRET")?.takeIf { it.isNotBlank() }

    @PostMapping
    fun receiveWebhook(
        @RequestBody body: String,
        @RequestHeader(name = SIGNATURE_HEADER, required = false) signature: String?
    ): ResponseEntity<Void> {
        val secret = resolveSecret()
        if (secret == null) {
            logger.warn("BMC webhook received but bmc.webhook.secret is not configured; rejecting")
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build()
        }

        if (signature == null || !isValidSignature(body, secret, signature)) {
            logger.warn("BMC webhook signature missing or invalid; rejecting")
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        }

        // TEMPORARY, deliberate: log the full raw payload at INFO so we can learn the real
        // `data` schema from BMC Studio's "Send test event" button - the field names inside
        // `data` are not officially documented. Downgrade (or drop) this line once the schema
        // has been confirmed from a logged test event.
        logger.info("BMC webhook received: {}", body)

        val root: JsonNode = try {
            objectMapper.readTree(body)
        } catch (e: Exception) {
            logger.warn("BMC webhook payload was not valid JSON: ${e.message}")
            return ResponseEntity.ok().build()
        }

        val eventId = root.path("event_id").asText(null)
        val liveMode = root.path("live_mode").asBoolean(false)
        val type = root.path("type").asText(null)

        if (type != "donation.created") {
            logger.info(
                "BMC webhook event_id={} type={} live_mode={} ignored (not donation.created)",
                eventId, type, liveMode
            )
            return ResponseEntity.ok().build()
        }

        val noteText = findNoteText(root.path("data"))
        val roomCode = noteText?.let { extractRoomCode(it) }

        if (roomCode == null) {
            logger.info(
                "BMC webhook event_id={} live_mode={} donation.created but no room code found in a note/message field",
                eventId, liveMode
            )
            return ResponseEntity.ok().build()
        }

        try {
            roomService.markRoomAsPaid(roomCode)
            logger.info("BMC webhook event_id={} live_mode={} marked room {} as paid", eventId, liveMode, roomCode)
        } catch (e: RoomNotFoundException) {
            logger.info(
                "BMC webhook event_id={} live_mode={} referenced room {} which does not exist",
                eventId, liveMode, roomCode
            )
        }

        return ResponseEntity.ok().build()
    }

    /**
     * HMAC-SHA256 over the raw body, hex-encoded, compared to the header value in constant time
     * via MessageDigest.isEqual. Both sides are lowercased first since hex-encoding case is not
     * part of the contract BMC documents.
     */
    internal fun isValidSignature(body: String, secret: String, providedSignatureHex: String): Boolean {
        val expectedHex = computeHmacHex(body, secret)
        return MessageDigest.isEqual(
            expectedHex.lowercase().toByteArray(Charsets.UTF_8),
            providedSignatureHex.lowercase().toByteArray(Charsets.UTF_8)
        )
    }

    internal fun computeHmacHex(body: String, secret: String): String {
        val mac = Mac.getInstance(HMAC_ALGORITHM)
        mac.init(SecretKeySpec(secret.toByteArray(Charsets.UTF_8), HMAC_ALGORITHM))
        val digest = mac.doFinal(body.toByteArray(Charsets.UTF_8))
        return digest.joinToString("") { "%02x".format(it) }
    }

    internal fun extractRoomCode(text: String): Int? =
        ROOM_CODE_REGEX.find(text)?.value?.toIntOrNull()

    /**
     * Walks [node] (expected to be the webhook's `data` object) looking for the first string
     * field whose name contains "note" or "message" (case-insensitive) - e.g. the legacy BMC
     * API's `support_note`. Checks matching fields at the current level before recursing, so a
     * shallow match wins over a deeper one.
     */
    internal fun findNoteText(node: JsonNode): String? {
        if (node.isObject) {
            val entries = node.properties().toList()
            for ((name, value) in entries) {
                if (isNoteFieldName(name) && value.isTextual) {
                    return value.asText()
                }
            }
            for ((_, value) in entries) {
                if (value.isObject || value.isArray) {
                    findNoteText(value)?.let { return it }
                }
            }
        } else if (node.isArray) {
            for (child in node) {
                findNoteText(child)?.let { return it }
            }
        }
        return null
    }

    private fun isNoteFieldName(name: String): Boolean =
        name.contains("note", ignoreCase = true) || name.contains("message", ignoreCase = true)
}
