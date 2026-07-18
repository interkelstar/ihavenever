package com.kelstar.ihne.controller.rest

import com.kelstar.ihne.model.Statistics
import com.kelstar.ihne.repository.QuestionRepository
import com.kelstar.ihne.repository.RoomRepository
import com.kelstar.ihne.repository.StatisticsRepository
import org.springframework.data.repository.findByIdOrNull
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*
import java.time.Instant

@RestController
@RequestMapping("/admin/api")
class AdminRestController(
    private val roomRepository: RoomRepository,
    private val questionRepository: QuestionRepository,
    private val statisticsRepository: StatisticsRepository
) {

    @GetMapping("/statistics")
    @Transactional(readOnly = true)
    fun getStatistics(): AdminStatsDto {
        val historical = statisticsRepository.findAll()
        val activeRooms = roomRepository.findAllWithQuestions().map { room ->
            val questions = room.questions
            ActiveRoomStatsDto(
                code = room.code,
                dateCreated = room.dateCreated,
                isPaid = room.isPaid ?: false,
                questionsTotal = questions.size,
                questionsShown = questions.count { it.wasShown },
                questionsPredefined = questions.count { it.isPredefined }
            )
        }

        val totalActiveRooms = activeRooms.size
        val totalActiveQuestions = activeRooms.sumOf { it.questionsTotal }
        val totalActiveShownQuestions = activeRooms.sumOf { it.questionsShown }
        val totalActivePredefinedQuestions = activeRooms.sumOf { it.questionsPredefined }

        return AdminStatsDto(
            historical = historical,
            activeRooms = activeRooms,
            totalActiveRooms = totalActiveRooms,
            totalActiveQuestions = totalActiveQuestions,
            totalActiveShownQuestions = totalActiveShownQuestions,
            totalActivePredefinedQuestions = totalActivePredefinedQuestions
        )
    }

    @DeleteMapping("/rooms/{code}")
    @Transactional
    fun deleteRoom(@PathVariable code: Int) {
        roomRepository.deleteById(code)
    }

    @PatchMapping("/rooms/{code}/toggle-paid")
    @Transactional
    fun toggleRoomPaid(@PathVariable code: Int) {
        val room = roomRepository.findByIdOrNull(code) ?: return
        room.isPaid = !(room.isPaid ?: false)
        roomRepository.save(room)
    }

    @GetMapping("/questions")
    @Transactional(readOnly = true)
    fun getAllQuestions(): List<AdminQuestionDto> {
        return questionRepository.findAllByOrderByDateAdded().map {
            AdminQuestionDto(
                id = it.id!!,
                question = it.question,
                roomCode = it.roomCode,
                isPredefined = it.isPredefined,
                wasShown = it.wasShown,
                dateAdded = it.dateAdded
            )
        }
    }

    @DeleteMapping("/questions/{id}")
    @Transactional
    fun deleteQuestion(@PathVariable id: Long) {
        questionRepository.deleteById(id)
    }

    @PatchMapping("/questions/{id}/toggle-shown")
    @Transactional
    fun toggleQuestionShown(@PathVariable id: Long) {
        val question = questionRepository.findByIdOrNull(id) ?: return
        question.wasShown = !question.wasShown
        questionRepository.save(question)
    }
}

data class AdminStatsDto(
    val historical: List<Statistics>,
    val activeRooms: List<ActiveRoomStatsDto>,
    val totalActiveRooms: Int,
    val totalActiveQuestions: Int,
    val totalActiveShownQuestions: Int,
    val totalActivePredefinedQuestions: Int
)

data class ActiveRoomStatsDto(
    val code: Int,
    val dateCreated: Instant,
    val isPaid: Boolean,
    val questionsTotal: Int,
    val questionsShown: Int,
    val questionsPredefined: Int
)

data class AdminQuestionDto(
    val id: Long,
    val question: String,
    val roomCode: Int,
    val isPredefined: Boolean,
    val wasShown: Boolean,
    val dateAdded: Instant
)
