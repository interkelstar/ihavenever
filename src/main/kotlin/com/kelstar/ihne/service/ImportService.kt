package com.kelstar.ihne.service

import com.kelstar.ihne.model.QuestionDto
import com.opencsv.bean.CsvToBeanBuilder
import com.opencsv.bean.StatefulBeanToCsvBuilder
import org.springframework.stereotype.Service
import java.io.*


@Service
class ImportService {

    fun parseQuestionsFromStream(inputStream: InputStream): List<QuestionDto> {
        try {
            return CsvToBeanBuilder<QuestionDto>(BufferedReader(InputStreamReader(inputStream)))
                .withType(QuestionDto::class.java)
                .withIgnoreLeadingWhiteSpace(true)
                .build()
                .parse()
        } catch (ex: Exception) {
            throw ImportException(ex)
        }
    }
    
    fun writeQuestions(questions: List<QuestionDto>): ByteArray {
        try {
            val byteArrayOutputStream = ByteArrayOutputStream()
            OutputStreamWriter(byteArrayOutputStream).use {
                StatefulBeanToCsvBuilder<QuestionDto>(it)
                    .withApplyQuotesToAll(false)
                    .build()
                    .write(questions)
            }
            return byteArrayOutputStream.toByteArray()
        } catch (ex: Exception) {
            throw ImportException(ex)
        }
    }

    class  ImportException(cause: Throwable?) : RuntimeException(cause)
    
}