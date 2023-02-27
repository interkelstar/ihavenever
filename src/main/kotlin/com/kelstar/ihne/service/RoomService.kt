package com.kelstar.ihne.service

import com.kelstar.ihne.model.Room
import com.kelstar.ihne.repository.RoomRepository
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock
import org.springframework.data.repository.findByIdOrNull
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Duration
import java.time.Instant

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

    @Scheduled(cron = "0 0 */6 * * *")
    @SchedulerLock(name = "deleteOldRooms")
    @Transactional
    fun deleteOldRooms() {
        val roomsToDelete = roomRepository.findAll()
            .filter { room ->
                room.questions.all {
                    Instant.now().epochSecond - it.dateAdded.epochSecond > Duration.ofDays(1).toSeconds()
                }
            }
        roomRepository.deleteAll(roomsToDelete)
        println("${roomsToDelete.size} rooms were deleted")
    }

}