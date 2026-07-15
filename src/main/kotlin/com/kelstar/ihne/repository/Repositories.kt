package com.kelstar.ihne.repository

import com.kelstar.ihne.model.Question
import com.kelstar.ihne.model.Room
import com.kelstar.ihne.model.Statistics
import com.kelstar.ihne.model.ArchivedQuestion
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface RoomRepository : JpaRepository<Room, Int> {
    @EntityGraph(attributePaths = ["questions"])
    @Query("SELECT r FROM Room r")
    fun findAllWithQuestions(): List<Room>
}

interface QuestionRepository : JpaRepository<Question, Long> {

    @Query("select q from Question q where q.wasShown = false and q.roomCode = :code order by random()")
    fun findRandomNotShown(@Param("code") roomCode: Int): List<Question>

    fun findAllByOrderByDateAdded(): List<Question>

    fun findAllByRoomCode(roomCode: Int): List<Question>
    
    fun findAllByRoomCodeOrderByDateAdded(roomCode: Int): List<Question>

}

interface StatisticsRepository : JpaRepository<Statistics, Long>

interface ArchivedQuestionRepository : JpaRepository<ArchivedQuestion, Long>