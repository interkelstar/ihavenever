package com.kelstar.ihne.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.google.auth.oauth2.GoogleCredentials
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.http.client.SimpleClientHttpRequestFactory
import org.springframework.stereotype.Service
import org.springframework.web.client.RestClientException
import org.springframework.web.client.RestTemplate
import java.io.IOException
import java.net.URI

@Service
class GeminiService(
    @Value("\${gemini.project-id:ihne-294517}") private val projectId: String
) {
    private val objectMapper = ObjectMapper()

    @Volatile
    private var cachedCredentials: GoogleCredentials? = null

    /**
     * Lazily resolved and cached on first [generate] call - never in the constructor or a
     * field initializer. The app is CRaC-checkpointed at build time inside a container with
     * no Application Default Credentials available, so calling
     * [GoogleCredentials.getApplicationDefault] eagerly would throw during bean creation and
     * kill the checkpoint. At runtime ADC resolves differently depending on where the restored
     * instance actually runs: on Cloud Run it's the metadata server, locally it's whatever
     * `gcloud auth application-default login` left on disk. [GoogleCredentials] caches the
     * access token internally, so refreshing on every call is cheap once a token is cached.
     */
    private fun credentials(): GoogleCredentials {
        cachedCredentials?.let { return it }
        synchronized(this) {
            cachedCredentials?.let { return it }
            val resolved = try {
                GoogleCredentials.getApplicationDefault()
                    .createScoped("https://www.googleapis.com/auth/cloud-platform")
            } catch (e: IOException) {
                throw AiGenerationDisabledException()
            }
            cachedCredentials = resolved
            return resolved
        }
    }

    // A hung Gemini call must not tie up a request thread forever: bound both connect and
    // read time explicitly (RestTemplate has no timeout by default).
    private val restTemplate = RestTemplate(
        SimpleClientHttpRequestFactory().apply {
            setConnectTimeout(10_000)
            setReadTimeout(60_000)
        }
    )

    /**
     * Single source of truth for whether Gemini-backed AI question generation is enabled.
     *
     * CRaC subtlety: on a Cloud Run restore, the JVM resumes from a checkpoint taken at
     * training/build time, so `System.getenv()` still reflects the *training-time* process
     * environment - it will NOT pick up a `GEMINI_ENABLED` value set on the fresh Cloud Run
     * revision. run-app.sh re-dumps `GEMINI_*` vars (alongside `DB_`/`SPRING_DATASOURCE_`/
     * `SPRING_PROFILES_ACTIVE`) into /tmp/env.properties before restore, and
     * HikariCracResource.afterRestore promotes `GEMINI_ENABLED` into the `gemini.enabled`
     * system property - which is what the fallback below picks up.
     */
    val isEnabled: Boolean
        get() = System.getenv("GEMINI_ENABLED")?.toBoolean()
            ?: System.getProperty("gemini.enabled")?.toBoolean()
            ?: false

    /**
     * Composition used by [QuestionService]: build the default prompt from the room's own
     * custom questions, then generate. Public behavior unchanged from before the refactor.
     */
    fun generateQuestions(customQuestions: List<String>, language: String): List<String> =
        generate(buildPrompt(customQuestions, language))

    fun buildPrompt(seedQuestions: List<String>, language: String): String {
        // A room can legitimately have zero custom statements (and the admin AI Lab previews
        // with no seeds at all) - promising the model "here is a list" and giving it nothing
        // makes it refuse instead of generate, so the seedless prompt drops the analysis part.
        val seedSection = if (seedQuestions.isEmpty()) {
            "The players have not entered any custom statements, so aim for universally fun, party-friendly themes."
        } else {
            """
            Here is a list of custom statements that players entered during this game session:
            ${seedQuestions.joinToString("\n") { "- $it" }}

            Analyze these statements to capture the company's vibe, inside jokes, mentioned names, professions, hobbies, locations, or topics.
            These statements should inspire the themes; utilize mentioned names if appropriate, but everything you generate must be completely new.
            """.trimIndent()
        }
        return """
            You are a creative host of the "Never Have I Ever" party game.
            $seedSection
            Generate exactly 20 new original and engaging "Never Have I Ever" statements. ${languageInstruction(language)}
            Return the output strictly as a plain list of statements, one statement per line, without any numbering, bullets, quotes, prefixes (like "Never have I ever" or "Я никогда не"), titles, or introductory/concluding text.
        """.trimIndent()
    }

    private fun languageInstruction(language: String): String {
        val code = language.lowercase()
        return when (code) {
            "ru" -> "Write the statements in Russian (ru)."
            "en" -> "Write the statements in English (en)."
            "uk" -> "Write the statements in Ukrainian (uk)."
            "pl" -> "Write the statements in Polish (pl)."
            else -> "Write the statements in the language of the room: $code."
        }
    }

    fun generate(prompt: String): List<String> {
        val creds = credentials()
        // Token refresh is an HTTP round-trip (metadata server / OAuth endpoint), so a failure
        // here is a runtime request failure - map it to the same 502 as a failed Gemini call,
        // not an unhandled 500.
        val accessToken = try {
            creds.refreshIfExpired()
            creds.accessToken.tokenValue
        } catch (e: IOException) {
            throw GeminiRequestException("Failed to obtain Vertex AI access token: ${e.message}")
        }

        val url = "https://aiplatform.googleapis.com/v1/projects/$projectId/locations/global/publishers/google/models/gemini-2.5-flash:generateContent"

        val headers = HttpHeaders().apply {
            contentType = MediaType.APPLICATION_JSON
            setBearerAuth(accessToken)
        }

        // Unlike the AI-Studio endpoint, Vertex AI rejects contents without an explicit role
        // ("Please use a valid role: user, model").
        val requestBody = mapOf(
            "contents" to listOf(
                mapOf(
                    "role" to "user",
                    "parts" to listOf(
                        mapOf("text" to prompt)
                    )
                )
            )
        )

        val entity = HttpEntity(objectMapper.writeValueAsString(requestBody), headers)

        val responseStr = try {
            restTemplate.postForObject(URI(url), entity, String::class.java)
        } catch (e: RestClientException) {
            throw GeminiRequestException("Gemini request failed: ${e.message}")
        } ?: throw GeminiRequestException("Gemini API returned an empty response")

        return parseGeneratedQuestions(responseStr)
    }

    /**
     * Extracted from [generate] so response parsing is unit-testable with a canned JSON
     * string, without needing an HTTP framework or a live Gemini call.
     */
    internal fun parseGeneratedQuestions(responseStr: String): List<String> {
        val rootNode = objectMapper.readTree(responseStr)
        val textResponse = rootNode.path("candidates")
            .path(0)
            .path("content")
            .path("parts")
            .path(0)
            .path("text")
            .asText()

        return textResponse.lines()
            .map { it.trim() }
            .filter { it.isNotEmpty() }
            .map { cleanQuestion(it) }
            .take(20)
    }

    private fun cleanQuestion(raw: String): String {
        return raw.replace(Regex("^[-*•0-9.\\s]+"), "") // Remove bullets, numbers
            .replace(Regex("^['\"«]+"), "") // Remove leading quotes
            .replace(Regex("['\"»]+$"), "") // Remove trailing quotes
            .trim()
    }
}
