package com.kelstar.ihne.controller.rest

import com.fasterxml.jackson.annotation.JsonProperty
import com.kelstar.ihne.model.Question
import com.kelstar.ihne.model.Statistics
import com.kelstar.ihne.repository.ArchivedQuestionRepository
import com.kelstar.ihne.repository.QuestionRepository
import com.kelstar.ihne.repository.RoomRepository
import com.kelstar.ihne.repository.StatisticsRepository
import com.kelstar.ihne.service.GeminiService
import com.kelstar.ihne.service.QuestionNotFoundException
import com.kelstar.ihne.service.RoomNotFoundException
import org.springframework.data.repository.findByIdOrNull
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*
import java.time.Instant

@RestController
@RequestMapping("/admin/api")
class AdminRestController(
    private val roomRepository: RoomRepository,
    private val questionRepository: QuestionRepository,
    private val statisticsRepository: StatisticsRepository,
    private val archivedQuestionRepository: ArchivedQuestionRepository,
    private val geminiService: GeminiService
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
        val room = roomRepository.findByIdOrNull(code) ?: throw RoomNotFoundException(code)
        room.isPaid = !(room.isPaid ?: false)
        roomRepository.save(room)
    }

    @GetMapping("/questions")
    @Transactional(readOnly = true)
    fun getAllQuestions(): List<Question> {
        return questionRepository.findAllByOrderByDateAdded()
    }

    @DeleteMapping("/questions/{id}")
    @Transactional
    fun deleteQuestion(@PathVariable id: Long) {
        questionRepository.deleteById(id)
    }

    @PatchMapping("/questions/{id}/toggle-shown")
    @Transactional
    fun toggleQuestionShown(@PathVariable id: Long) {
        val question = questionRepository.findByIdOrNull(id) ?: throw QuestionNotFoundException(id)
        question.wasShown = !question.wasShown
        questionRepository.save(question)
    }

    // AI Lab: lets an admin exercise Gemini generation directly regardless of GEMINI_ENABLED
    // (which only gates the feature from *players*). Only a configured API key is required -
    // see GeminiService.resolveApiKey, which 503s via AiGenerationDisabledException when absent.

    @GetMapping("/ai/archived-rooms")
    @Transactional(readOnly = true)
    fun getArchivedRooms(): List<ArchivedRoomSummaryDto> {
        return archivedQuestionRepository.findArchivedRoomSummaries().map {
            ArchivedRoomSummaryDto(
                roomCode = it.getRoomCode(),
                language = it.getLanguage(),
                questionCount = it.getQuestionCount(),
                lastArchived = it.getLastArchived()
            )
        }
    }

    @PostMapping("/ai/preview")
    @Transactional(readOnly = true)
    fun previewAiQuestions(@RequestBody request: AiPreviewRequestDto): AiPreviewResponseDto {
        val (seedQuestions, resolvedLanguage) = resolveSeeds(request.roomCode, request.language)

        val prompt = request.prompt ?: geminiService.buildPrompt(seedQuestions, resolvedLanguage)
        val questions = geminiService.generate(prompt)

        return AiPreviewResponseDto(
            prompt = prompt,
            language = resolvedLanguage,
            seedCount = seedQuestions.size,
            questions = questions
        )
    }

    /**
     * Seeds come from archived questions of [roomCode] if any exist there; otherwise from the
     * custom (non-predefined) questions of a still-active room with that code. 404s only when
     * neither an archive nor an active room exists for [roomCode] - a live room with zero
     * custom questions yet is a valid (empty-seed) case, not a 404.
     */
    private fun resolveSeeds(roomCode: Int?, language: String?): Pair<List<String>, String> {
        if (roomCode == null) {
            return emptyList<String>() to (language ?: "ru")
        }

        val archived = archivedQuestionRepository.findAllByRoomCode(roomCode)
        if (archived.isNotEmpty()) {
            return archived.map { it.question } to (language ?: archived.first().language)
        }

        val room = roomRepository.findByIdOrNull(roomCode) ?: throw RoomNotFoundException(roomCode)
        val liveCustomQuestions = questionRepository.findAllByRoomCode(roomCode)
            .filter { !it.isPredefined }
            .map { it.question }
        return liveCustomQuestions to (language ?: room.language)
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
    @get:JsonProperty("isPaid")
    val isPaid: Boolean,
    val questionsTotal: Int,
    val questionsShown: Int,
    val questionsPredefined: Int
)

data class ArchivedRoomSummaryDto(
    val roomCode: Int,
    val language: String,
    val questionCount: Long,
    val lastArchived: Instant
)

data class AiPreviewRequestDto(
    val roomCode: Int? = null,
    val language: String? = null,
    val prompt: String? = null
)

data class AiPreviewResponseDto(
    val prompt: String,
    val language: String,
    val seedCount: Int,
    val questions: List<String>
)
