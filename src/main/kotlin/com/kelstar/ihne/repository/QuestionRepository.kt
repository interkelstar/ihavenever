package com.kelstar.ihne.repository

import com.kelstar.ihne.model.Question
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface QuestionRepository : JpaRepository<Question, Long> {
    
    @Query("select q from Question q where q.wasShown = false order by rand()")
    fun findRandomNotShown(): List<Question>

    fun findAllByOrderByDateAdded(): List<Question>
    
}