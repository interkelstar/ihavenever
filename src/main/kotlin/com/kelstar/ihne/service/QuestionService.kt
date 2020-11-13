package com.kelstar.ihne.service

import com.kelstar.ihne.model.Question
import com.kelstar.ihne.model.QuestionDto
import com.kelstar.ihne.repository.QuestionRepository
import org.springframework.data.domain.Example
import org.springframework.data.domain.ExampleMatcher
import org.springframework.stereotype.Service

@Service
class QuestionService(
    private val questionRepository: QuestionRepository
) {

    fun switchRead(id: Long) {
        val question = questionRepository.getOne(id)
        questionRepository.save(question.run {
            copy(wasShown = !wasShown)
        })
    }
    
    fun refreshAll(): List<Question> {
        return questionRepository.saveAll(
            questionRepository.findAll().map { it.copy(wasShown = false) }
        )
    }
    
    fun getRandomNotShown() : Question? {
        val randomNotShownList = questionRepository.findRandomNotShown()
        return if (randomNotShownList.isNotEmpty()) {
            with(randomNotShownList[0]) {
                questionRepository.save(copy(wasShown = true))
            }
        } else { null }
    }
    
    fun addQuestion(questionDto: QuestionDto): Boolean {
        val questionToAdd = Question(questionDto.question ?: "")
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
    
    fun findAllByAdded(): List<Question> {
        return questionRepository.findAllByOrderByDateAdded()
    }

    fun deleteById(id: Long) {
        questionRepository.deleteById(id)
    }

    class QuestionDaoException(cause: Throwable?) : RuntimeException(cause)
    
}