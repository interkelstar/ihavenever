package com.kelstar.ihne.service

import com.kelstar.ihne.model.ImportParametersDto
import com.kelstar.ihne.model.Question
import com.kelstar.ihne.model.QuestionDto
import com.kelstar.ihne.repository.QuestionRepository
import org.springframework.data.domain.Example
import org.springframework.data.domain.ExampleMatcher
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.io.InputStream


@Service
class QuestionService(
    private val questionRepository: QuestionRepository,
    private val importService: ImportService
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
                .withIgnorePaths("id", "dateAdded", "question")
            )
        )
    }
    
    @Transactional
    fun addQuestion(questionDto: QuestionDto, roomCode: Int): Boolean {
        val questionToAdd = Question(questionDto.question, roomCode)
        return try {
            if (!questionRepository.exists(Example.of(questionToAdd, ExampleMatcher.matching()
                    .withIgnorePaths("id", "dateAdded", "wasShown")
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
                .withIgnorePaths("id", "dateAdded", "question")
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
        val iStream = this.javaClass
            .classLoader
            .getResourceAsStream("questions/${importParametersDto.datasetName}.txt")
            ?: throw IllegalArgumentException("questions/${importParametersDto.datasetName}.txt is not found")
        
        return importQuestionsFromStream(iStream, roomCode, importParametersDto.size)
    }
    
    fun importQuestionsFromStream(inputStream: InputStream, roomCode: Int, limit: Int = Int.MAX_VALUE): Long {
        try {
            val questionsInRoom = questionRepository.findAllByRoomCode(roomCode)

            var questionsToAdd = importService.parseQuestionsFromStream(inputStream)
                .map { Question(it.question, roomCode = roomCode) }
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

    class QuestionDaoException(cause: Throwable?) : RuntimeException(cause)
    
}