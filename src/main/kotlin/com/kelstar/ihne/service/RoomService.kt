package com.kelstar.ihne.service

import com.kelstar.ihne.model.Room
import com.kelstar.ihne.model.Statistics
import com.kelstar.ihne.model.ArchivedQuestion
import com.kelstar.ihne.repository.RoomRepository
import com.kelstar.ihne.repository.StatisticsRepository
import com.kelstar.ihne.repository.ArchivedQuestionRepository
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock
import org.springframework.data.repository.findByIdOrNull
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Duration
import java.time.Instant

@Service
class RoomService(
    private val roomRepository: RoomRepository,
    private val statisticsRepository: StatisticsRepository,
    private val archivedQuestionRepository: ArchivedQuestionRepository
) {

    @Transactional
    fun createNewRoom(language: String): Room {
        val newCode = IntRange(100_000, 999_999)
            .minus(roomRepository.findAll().map { it.code }.toSet())
            .shuffled()
            .firstOrNull() ?: throw RuntimeException() //TODO change for code not found
        return roomRepository.saveAndFlush(Room(newCode, language))
    }

    fun roomExists(code: Int) = roomRepository.existsById(code)
    
    fun getRoom(code: Int): Room? = roomRepository.findByIdOrNull(code)

    @Transactional
    fun markRoomAsPaid(code: Int): Room {
        val room = roomRepository.findByIdOrNull(code) ?: throw RoomNotFoundException(code)
        room.isPaid = true
        return roomRepository.saveAndFlush(room)
    }

    @Scheduled(cron = "0 0 0 28 * *")
    @SchedulerLock(name = "deleteOldRooms")
    @Transactional
    fun deleteOldRooms() {
        val roomsToDelete = roomRepository.findAllWithQuestions()
            .filter { room ->
                room.questions.all {
                    Instant.now().epochSecond - it.dateAdded.epochSecond > Duration.ofDays(1).toSeconds()
                }
            }
        roomsToDelete.forEach { room ->
            if (room.questions.isNotEmpty()) {
                statisticsRepository.save(Statistics(
                    room.dateCreated, 
                    room.questions.size, 
                    room.questions.count { it.wasShown }, 
                    room.questions.count { it.isPredefined }
                ))
            }
        }
        
        // Archive custom user questions before deleting rooms
        val customQuestionsToArchive = roomsToDelete.flatMap { room ->
            room.questions
                .filter { !it.isPredefined }
                .map { ArchivedQuestion(it.question, room.language, room.code) }
        }
        if (customQuestionsToArchive.isNotEmpty()) {
            archivedQuestionRepository.saveAll(customQuestionsToArchive)
            println("${customQuestionsToArchive.size} user questions were archived")
        }

        roomRepository.deleteAll(roomsToDelete)
        println("${roomsToDelete.size} rooms were deleted")
    }

}