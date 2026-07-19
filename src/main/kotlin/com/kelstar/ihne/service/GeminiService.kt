package com.kelstar.ihne.service

import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.http.client.SimpleClientHttpRequestFactory
import org.springframework.stereotype.Service
import org.springframework.web.client.RestClientException
import org.springframework.web.client.RestTemplate
import java.net.URI

@Service
class GeminiService(
    @Value("\${gemini.api.key:}") private val apiKey: String
) {
    private val objectMapper = ObjectMapper()

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
     * Single-sourced API key resolution, re-checked on every call (never cached) because the
     * @Value-injected [apiKey] field can be constructed *before* HikariCracResource.afterRestore
     * promotes GEMINI_API_KEY into the "gemini.api.key" system property on a CRaC restore. The
     * System.getProperty/getenv fallbacks below - not injection order - are the real guarantee
     * that a fresh key set on the Cloud Run revision is actually picked up.
     */
    private fun resolveApiKey(): String =
        apiKey.takeIf { it.isNotBlank() }
            ?: System.getProperty("gemini.api.key")?.takeIf { it.isNotBlank() }
            ?: System.getenv("GEMINI_API_KEY")?.takeIf { it.isNotBlank() }
            ?: throw AiGenerationDisabledException()

    /**
     * Composition used by [QuestionService]: build the default prompt from the room's own
     * custom questions, then generate. Public behavior unchanged from before the refactor.
     */
    fun generateQuestions(customQuestions: List<String>, language: String): List<String> =
        generate(buildPrompt(customQuestions, language))

    fun buildPrompt(seedQuestions: List<String>, language: String): String {
        return """
            You are a creative host of the "Never Have I Ever" party game.
            Here is a list of custom statements that players entered during this game session:
            ${seedQuestions.joinToString("\n") { "- $it" }}

            Analyze these statements to capture the company's vibe, inside jokes, mentioned names, professions, hobbies, locations, or topics.
            Generate exactly 20 new original and engaging "Never Have I Ever" statements. ${languageInstruction(language)}
            These statements should build upon the themes interesting to this company, utilize mentioned names if appropriate, but be completely new and fun.
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
        val resolvedApiKey = resolveApiKey()

        val url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$resolvedApiKey"

        val headers = HttpHeaders().apply {
            contentType = MediaType.APPLICATION_JSON
        }

        val requestBody = mapOf(
            "contents" to listOf(
                mapOf(
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
