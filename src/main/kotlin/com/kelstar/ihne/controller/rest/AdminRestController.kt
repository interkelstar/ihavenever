package com.kelstar.ihne.controller.rest

import com.kelstar.ihne.model.Statistics
import com.kelstar.ihne.repository.RoomRepository
import com.kelstar.ihne.repository.StatisticsRepository
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.Instant

@RestController
@RequestMapping("/admin/api/statistics")
class AdminRestController(
    private val roomRepository: RoomRepository,
    private val statisticsRepository: StatisticsRepository
) {

    @GetMapping
    @Transactional(readOnly = true)
    fun getStatistics(): AdminStatsDto {
        val historical = statisticsRepository.findAll()
        val activeRooms = roomRepository.findAll().map { room ->
            val questions = room.questions
            ActiveRoomStatsDto(
                code = room.code,
                dateCreated = room.dateCreated,
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
    val questionsTotal: Int,
    val questionsShown: Int,
    val questionsPredefined: Int
)
