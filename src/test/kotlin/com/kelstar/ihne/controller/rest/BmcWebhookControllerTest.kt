package com.kelstar.ihne.controller.rest

import com.fasterxml.jackson.databind.ObjectMapper
import com.kelstar.ihne.model.Room
import com.kelstar.ihne.service.RoomNotFoundException
import com.kelstar.ihne.service.RoomService
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.mockito.Mockito
import org.mockito.Mockito.verify
import org.mockito.Mockito.verifyNoInteractions
import org.springframework.http.HttpStatus

class BmcWebhookControllerTest {

    private val objectMapper = ObjectMapper()
    private val roomService: RoomService = Mockito.mock(RoomService::class.java)

    private fun controller(secret: String = "testsecret123") = BmcWebhookController(secret, roomService)

    // Known test vector, independently verified with:
    //   printf '%s' "$BODY" | openssl dgst -sha256 -hmac "testsecret123" -hex
    private val knownBody =
        """{"event_id":"evt_1","type":"donation.created","live_mode":false,"created":1700000000,"attempt":1,"data":{"support_note":"Room 482913 please!"}}"""
    private val knownSecret = "testsecret123"
    private val knownHex = "0fba9f8e7b47333bf1d614064adc85a75045d34c337915966f5a53f376a23b45"

    // --- HMAC verification ---

    @Test
    fun `computeHmacHex matches an independently computed HMAC-SHA256 test vector`() {
        val hex = controller().computeHmacHex(knownBody, knownSecret)

        assertThat(hex).isEqualTo(knownHex)
    }

    @Test
    fun `isValidSignature accepts the correct signature regardless of hex case`() {
        val c = controller()

        assertThat(c.isValidSignature(knownBody, knownSecret, knownHex)).isTrue()
        assertThat(c.isValidSignature(knownBody, knownSecret, knownHex.uppercase())).isTrue()
    }

    @Test
    fun `isValidSignature rejects a wrong signature or wrong secret`() {
        val c = controller()

        assertThat(c.isValidSignature(knownBody, knownSecret, "deadbeef")).isFalse()
        assertThat(c.isValidSignature(knownBody, "wrong-secret", knownHex)).isFalse()
    }

    // --- Note-field walking / room code extraction ---

    @Test
    fun `findNoteText finds a top-level support_note field`() {
        val data = objectMapper.readTree("""{"support_note":"Room 482913 please!"}""")

        assertThat(controller().findNoteText(data)).isEqualTo("Room 482913 please!")
    }

    @Test
    fun `findNoteText matches message-named fields case-insensitively and recurses into nested objects`() {
        val data = objectMapper.readTree(
            """{"payer":{"name":"Alex"},"nested":{"SupportMessage":"code 731045 thanks!"}}"""
        )

        assertThat(controller().findNoteText(data)).isEqualTo("code 731045 thanks!")
    }

    @Test
    fun `findNoteText returns null when no note or message field exists`() {
        val data = objectMapper.readTree("""{"amount":"5.00","currency":"USD"}""")

        assertThat(controller().findNoteText(data)).isNull()
    }

    @Test
    fun `extractRoomCode pulls the first 6-digit code out of free text`() {
        val c = controller()

        assertThat(c.extractRoomCode("Room 482913 please!")).isEqualTo(482913)
        assertThat(c.extractRoomCode("no code in here")).isNull()
        // A longer digit run must not be mistaken for a 6-digit room code (\b boundary).
        assertThat(c.extractRoomCode("order #12345678 room 731045")).isEqualTo(731045)
    }

    // --- End-to-end webhook handling ---

    @Test
    fun `receiveWebhook marks the room paid when signature is valid and a code is found`() {
        val room = Room(482913, "ru")
        Mockito.`when`(roomService.markRoomAsPaid(482913)).thenReturn(room)

        val response = controller().receiveWebhook(knownBody, knownHex)

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        verify(roomService).markRoomAsPaid(482913)
    }

    @Test
    fun `receiveWebhook returns 401 and does not touch RoomService when the signature is missing or wrong`() {
        val c = controller()

        val missingSig = c.receiveWebhook(knownBody, null)
        val wrongSig = c.receiveWebhook(knownBody, "deadbeef")

        assertThat(missingSig.statusCode).isEqualTo(HttpStatus.UNAUTHORIZED)
        assertThat(wrongSig.statusCode).isEqualTo(HttpStatus.UNAUTHORIZED)
        verifyNoInteractions(roomService)
    }

    @Test
    fun `receiveWebhook returns 503 when no secret is configured`() {
        val response = BmcWebhookController("", roomService).receiveWebhook(knownBody, knownHex)

        assertThat(response.statusCode).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE)
        verifyNoInteractions(roomService)
    }

    @Test
    fun `receiveWebhook ignores non-donation-created events but still returns 200`() {
        val body = """{"event_id":"evt_3","type":"membership.created","live_mode":false,"data":{"support_note":"482913"}}"""
        val hex = controller().computeHmacHex(body, knownSecret)

        val response = controller().receiveWebhook(body, hex)

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        verifyNoInteractions(roomService)
    }

    @Test
    fun `receiveWebhook swallows RoomNotFoundException from markRoomAsPaid and still returns 200`() {
        Mockito.`when`(roomService.markRoomAsPaid(482913)).thenThrow(RoomNotFoundException(482913))

        val response = controller().receiveWebhook(knownBody, knownHex)

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
    }

    @Test
    fun `receiveWebhook returns 200 without calling RoomService when no room code is present`() {
        val body = """{"event_id":"evt_4","type":"donation.created","live_mode":false,"data":{"support_note":"thanks a lot!"}}"""
        val hex = controller().computeHmacHex(body, knownSecret)

        val response = controller().receiveWebhook(body, hex)

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        verifyNoInteractions(roomService)
    }
}
