package com.kelstar.ihne.service

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class GeminiServiceTest {

    private val geminiService = GeminiService(projectId = "unused-in-these-tests")

    @Test
    fun `buildPrompt embeds seed questions and an explicit language instruction`() {
        val prompt = geminiService.buildPrompt(listOf("Never have I ever gone skydiving"), "ru")

        assertThat(prompt).contains("- Never have I ever gone skydiving")
        assertThat(prompt).contains("Write the statements in Russian (ru).")
    }

    @Test
    fun `buildPrompt falls back to the raw code for unmapped languages`() {
        val prompt = geminiService.buildPrompt(emptyList(), "de")

        assertThat(prompt).contains("Write the statements in the language of the room: de.")
    }

    @Test
    fun `parseGeneratedQuestions extracts, cleans and caps the candidate text`() {
        val responseJson = """
            {
              "candidates": [
                {
                  "content": {
                    "parts": [
                      { "text": "1. First statement\n- Second statement\n\"Third statement\"\n" }
                    ]
                  }
                }
              ]
            }
        """.trimIndent()

        val questions = geminiService.parseGeneratedQuestions(responseJson)

        assertThat(questions).containsExactly(
            "First statement",
            "Second statement",
            "Third statement"
        )
    }

    @Test
    fun `parseGeneratedQuestions caps output at 20 lines`() {
        val lines = (1..25).joinToString("\\n") { "Statement $it" }
        val responseJson = """
            {"candidates":[{"content":{"parts":[{"text":"$lines"}]}}]}
        """.trimIndent()

        val questions = geminiService.parseGeneratedQuestions(responseJson)

        assertThat(questions).hasSize(20)
    }
}
