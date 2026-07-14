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
class GeminiService {
    private val objectMapper = ObjectMapper()
    @Value("\${gemini.api.key:}")
    private lateinit var apiKeyEnv: String

    private val restTemplate = RestTemplate()

    fun generateQuestions(customQuestions: List<String>, language: String): List<String> {
        val apiKey = apiKeyEnv.takeIf { it.isNotEmpty() } 
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

        val url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$apiKey"
        
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
