package com.kelstar.ihne.service

import com.kelstar.ihne.model.ImportParametersDto
import com.kelstar.ihne.model.Question
import com.kelstar.ihne.model.QuestionDto
import com.kelstar.ihne.repository.QuestionRepository
import com.kelstar.ihne.repository.RoomRepository
import org.springframework.data.domain.Example
import org.springframework.data.domain.ExampleMatcher
import org.springframework.data.repository.findByIdOrNull
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.io.InputStream

@Service
class QuestionService(
    private val questionRepository: QuestionRepository,
    private val importService: ImportService,
    private val roomRepository: RoomRepository,
    private val geminiService: GeminiService
) {

    @Transactional
    fun switchRead(id: Long) {
        questionRepository.findByIdOrNull(id)?.let { 
            it.wasShown = !it.wasShown
            questionRepository.save(it)
        }
    }
    
    @Transactional
    fun refreshAll(): List<Question> {
        return questionRepository.saveAll(
            questionRepository.findAll().onEach { it.wasShown = false }
        )
    }
    
    @Transactional
    fun getRandomNotShown(code: Int): Question? {
        return questionRepository.findRandomNotShown(code)
            .firstOrNull()
            ?.let { 
                it.wasShown = true
                questionRepository.save(it)
            }
    }
    
    @Transactional(readOnly = true)
    fun allWereShown(code: Int): Boolean {
        return !questionRepository.exists(
            Example.of(Question("", code), ExampleMatcher.matching()
                .withIgnorePaths("id", "dateAdded", "question", "isPredefined")
            )
        )
    }
    
    @Transactional
    fun addQuestion(questionDto: QuestionDto, roomCode: Int): Boolean {
        val questionText = sanitizeQuestion(questionDto.question)

        val questionToAdd = Question(questionText, roomCode)
        if (questionToAdd.question.isEmpty()) {
            return false
        }
        return try {
            if (!questionRepository.exists(Example.of(questionToAdd, ExampleMatcher.matching()
                    .withIgnorePaths("id", "dateAdded", "wasShown", "isPredefined")
                    .withIgnoreCase()))) {
                questionRepository.save(questionToAdd)
                true
            } else { false }
        } catch (e: Exception) {
            throw QuestionDaoException(e)
        }
    }    
    
    @Transactional(readOnly = true)
    fun countNotShown(roomCode: Int): Long {
        return questionRepository.count(
            Example.of(Question("", roomCode), ExampleMatcher.matching()
                .withIgnorePaths("id", "dateAdded", "question", "isPredefined")
            )
        )
    }
    
    @Transactional
    fun addAll(questions: List<Question>): List<Question> = questionRepository.saveAll(questions) 
    
    fun findAllByRoomOrderByAdded(roomCode: Int): List<Question> {
        return questionRepository.findAllByRoomCodeOrderByDateAdded(roomCode)
    }
    
    fun findAllOrderByAdded(): List<Question> {
        return questionRepository.findAllByOrderByDateAdded()
    }

    fun deleteById(id: Long) {
        questionRepository.deleteById(id)
    }

    fun importQuestionsByParameters(importParametersDto: ImportParametersDto, roomCode: Int): Long {
        val room = roomRepository.findByIdOrNull(roomCode) ?: throw RoomNotFoundException(roomCode)
        val lang = room.language
        val filename = "questions/${importParametersDto.datasetName}_$lang.txt"
        val iStream = this.javaClass
            .classLoader
            .getResourceAsStream(filename)
            ?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "$filename is not found")

        return importQuestionsFromStream(iStream, roomCode, importParametersDto.size)
    }
    
    fun importQuestionsFromStream(inputStream: InputStream, roomCode: Int, limit: Int = Int.MAX_VALUE): Long {
        try {
            val questionsInRoom = questionRepository.findAllByRoomCode(roomCode)

            var questionsToAdd = importService.parseQuestionsFromStream(inputStream)
                .map { Question(it.question, roomCode = roomCode, isPredefined = true) }
                .minus(questionsInRoom.toSet())
                .shuffled()
            if (questionsToAdd.size > limit) {
                questionsToAdd = questionsToAdd.subList(0, limit)
            }
            return addAll(questionsToAdd).size.toLong()
        } catch (ex: Exception) {
            throw QuestionDaoException(ex)
        }
    }

    fun exportQuestions(roomCode: Int): ByteArray {
        try {
            val questionsInRoom = questionRepository.findAllByRoomCode(roomCode)
                .map(::QuestionDto)
            return importService.writeQuestions(questionsInRoom)
        } catch (ex: Exception) {
            throw QuestionDaoException(ex)
        }
    }

    @Transactional
    fun generateAiQuestions(roomCode: Int): Int {
        if (!geminiService.isEnabled) {
            throw AiGenerationDisabledException()
        }

        val room = roomRepository.findByIdOrNull(roomCode)
            ?: throw IllegalArgumentException("Room $roomCode not found")

        if (room.isPaid != true) {
            throw RoomNotPaidException()
        }

        val roomQuestions = questionRepository.findAllByRoomCode(roomCode)

        val customQuestions = roomQuestions
            .filter { !it.isPredefined }
            .map { it.question }

        if (customQuestions.size < 3) {
            throw IllegalArgumentException("Need at least 3 custom questions to detect the vibe of the room")
        }

        val aiQuestions = geminiService.generateQuestions(customQuestions, room.language)
        if (aiQuestions.isEmpty()) {
            return 0
        }

        val existingQuestions = roomQuestions
            .map { it.question.lowercase() }
            .toSet()

        // Gemini can echo near-duplicate lines within the same batch; without deduping here,
        // saveAll would violate the (question, roomCode) unique constraint and roll back the
        // whole transaction.
        val questionsToSave = aiQuestions
            .filter { it.lowercase() !in existingQuestions }
            .distinctBy { it.lowercase() }
            .map { Question(it, roomCode, isPredefined = false) }

        if (questionsToSave.isNotEmpty()) {
            questionRepository.saveAll(questionsToSave)
        }

        return questionsToSave.size
    }

    private fun sanitizeQuestion(rawQuestion: String): String {
        var questionText = rawQuestion.trim()
        if (questionText.startsWith("я никогда не ", ignoreCase = true)) {
            questionText = questionText.substring(13).trim()
        } else if (questionText.startsWith("не ", ignoreCase = true)) {
            questionText = questionText.substring(3).trim()
        }
        return questionText
    }

    class QuestionDaoException(cause: Throwable?) : RuntimeException(cause)
    
}