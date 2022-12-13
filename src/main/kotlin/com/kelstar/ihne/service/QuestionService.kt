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
    
    fun addAll(questions: List<Question>) = questionRepository.saveAll(questions) 
    
    fun findAllByRoomOrderByAdded(roomCode: Int): List<Question> {
        return questionRepository.findAllByRoomCodeOrderByDateAdded(roomCode)
    }
    
    fun findAllOrderByAdded(): List<Question> {
        return questionRepository.findAllByOrderByDateAdded()
    }

    fun deleteById(id: Long) {
        questionRepository.deleteById(id)
    }

    fun importQuestionsByParameters(importParametersDto: ImportParametersDto, roomCode: Int): Int {
        try {
            val questionsInRoom = questionRepository.findAllByRoomCode(roomCode)
            
            val ioStream = this.javaClass
                .classLoader
                .getResourceAsStream("questions/${importParametersDto.setName}")
                ?: throw IllegalArgumentException("questions/${importParametersDto.setName} is not found")

            var questionsToAdd = importService.parseQuestionsFromStream(ioStream)
                .map { Question(it.question, roomCode = roomCode) }
                .minus(questionsInRoom)
                .shuffled()
            if (questionsToAdd.size > importParametersDto.size) {
                questionsToAdd = questionsToAdd.subList(0, importParametersDto.size)
            }
            addAll(questionsToAdd)
            return questionsToAdd.size
            
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