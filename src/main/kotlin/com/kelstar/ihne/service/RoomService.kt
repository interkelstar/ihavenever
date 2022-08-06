package com.kelstar.ihne.service

import com.kelstar.ihne.model.Room
import com.kelstar.ihne.repository.RoomRepository
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class RoomService(
    private val roomRepository: RoomRepository
) {

    @Transactional
    fun createNewRoom(): Room {
        val newCode = IntRange(100_000, 999_999)
            .minus(roomRepository.findAll().map { it.code })
            .shuffled()
            .firstOrNull() ?: throw RuntimeException() //TODO change for code not found
        return roomRepository.saveAndFlush(Room(newCode))
    }

    fun roomExists(code: Int) = roomRepository.existsById(code)
    
    fun getRoom(code: Int): Room? = roomRepository.findByIdOrNull(code)

}