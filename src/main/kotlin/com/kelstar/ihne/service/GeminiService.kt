package com.kelstar.ihne.service

import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.stereotype.Service
import org.springframework.web.client.RestTemplate
import java.net.URI

@Service
class GeminiService(
    @Value("\${gemini.api.key:}") private val apiKey: String
) {
    private val objectMapper = ObjectMapper()
    private val restTemplate = RestTemplate()

    /**
     * Single source of truth for whether Gemini-backed AI question generation is enabled.
     *
     * CRaC subtlety: on a Cloud Run restore, the JVM resumes from a checkpoint taken at
     * training/build time, so `System.getenv()` still reflects the *training-time* process
     * environment - it will NOT pick up a `GEMINI_ENABLED` value set on the fresh Cloud Run
     * revision. run-app.sh only re-dumps `DB_`/`SPRING_DATASOURCE_`/`SPRING_PROFILES_ACTIVE`
     * vars into /tmp/env.properties before restore (see HikariCracResource.afterRestore),
     * and nothing currently promotes `GEMINI_ENABLED` into a JVM system property either. We
     * still fall back to `System.getProperty("gemini.enabled")` so this keeps working for
     * plain (non-CRaC) runs today, and picks up the flag automatically with no further code
     * changes if the env-dump/restore mechanism is ever extended to cover it.
     */
    val isEnabled: Boolean
        get() = System.getenv("GEMINI_ENABLED")?.toBoolean()
            ?: System.getProperty("gemini.enabled")?.toBoolean()
            ?: false

    fun generateQuestions(customQuestions: List<String>, language: String): List<String> {
        val resolvedApiKey = apiKey.takeIf { it.isNotEmpty() }
            ?: System.getenv("GEMINI_API_KEY")
            ?: throw IllegalStateException("GEMINI_API_KEY is not configured")

        val prompt = """
            You are a creative host of the "Never Have I Ever" party game.
            Here is a list of custom statements that players entered during this game session:
            ${customQuestions.joinToString("\n") { "- $it" }}
            
            Analyze these statements to capture the company's vibe, inside jokes, mentioned names, professions, hobbies, locations, or topics.
            Generate exactly 20 new original and engaging "Never Have I Ever" statements in the language of the room: ${language.lowercase()}.
            These statements should build upon the themes interesting to this company, utilize mentioned names if appropriate, but be completely new and fun.
            Return the output strictly as a plain list of statements, one statement per line, without any numbering, bullets, quotes, prefixes (like "Never have I ever" or "Я никогда не"), titles, or introductory/concluding text.
        """.trimIndent()

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
        
        val responseStr = restTemplate.postForObject(URI(url), entity, String::class.java)
            ?: throw RuntimeException("Failed to get response from Gemini API")

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
