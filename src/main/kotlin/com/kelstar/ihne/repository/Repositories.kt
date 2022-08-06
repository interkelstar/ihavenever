package com.kelstar.ihne.repository

import com.kelstar.ihne.model.Question
import com.kelstar.ihne.model.Room
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface RoomRepository : JpaRepository<Room, Int>

interface QuestionRepository : JpaRepository<Question, Long> {

    @Query("select q from Question q where q.wasShown = false and q.roomCode = :code order by rand()")
    fun findRandomNotShown(@Param("code") roomCode: Int): List<Question>

    fun findAllByOrderByDateAdded(): List<Question>

    fun findAllByRoomCodeOrderByDateAdded(roomCode: Int): List<Question>

}