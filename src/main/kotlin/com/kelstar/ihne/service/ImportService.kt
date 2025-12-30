package com.kelstar.ihne.service

import com.kelstar.ihne.model.QuestionDto
import org.springframework.stereotype.Service
import java.io.*


@Service
class ImportService {

    fun parseQuestionsFromStream(inputStream: InputStream): List<QuestionDto> {
        try {
            return inputStream.bufferedReader().useLines { lines ->
                lines.filter { it.isNotBlank() }
                    .map { QuestionDto(it.trim()) }
                    .toList()
            }
        } catch (ex: Exception) {
            throw ImportException(ex)
        }
    }
    
    fun writeQuestions(questions: List<QuestionDto>): ByteArray {
        try {
            val byteArrayOutputStream = ByteArrayOutputStream()
            byteArrayOutputStream.bufferedWriter().use { writer ->
                questions.forEach {
                    writer.write(it.question)
                    writer.newLine()
                }
            }
            return byteArrayOutputStream.toByteArray()
        } catch (ex: Exception) {
            throw ImportException(ex)
        }
    }

    class  ImportException(cause: Throwable?) : RuntimeException(cause)
    
}