package com.kelstar.ihne.repository

import com.kelstar.ihne.model.Question
import com.kelstar.ihne.model.Room
import com.kelstar.ihne.model.Statistics
import com.kelstar.ihne.model.ArchivedQuestion
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.Instant

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

interface ArchivedQuestionRepository : JpaRepository<ArchivedQuestion, Long> {

    fun findAllByRoomCode(roomCode: Int): List<ArchivedQuestion>

    // Room codes are recycled once a room is deleted, so a given roomCode can carry archived
    // batches from unrelated games at different times/languages - group by (roomCode,
    // language) rather than roomCode alone so each row is a coherent AI-preview seed set.
    @Query(
        """
        select aq.roomCode as roomCode, aq.language as language, count(aq) as questionCount, max(aq.dateArchived) as lastArchived
        from ArchivedQuestion aq
        where aq.roomCode is not null
        group by aq.roomCode, aq.language
        order by max(aq.dateArchived) desc
        """
    )
    fun findArchivedRoomSummaries(): List<ArchivedRoomSummary>
}

interface ArchivedRoomSummary {
    fun getRoomCode(): Int
    fun getLanguage(): String
    fun getQuestionCount(): Long
    fun getLastArchived(): Instant
}