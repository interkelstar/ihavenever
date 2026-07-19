package com.kelstar.ihne.controller.rest

import com.kelstar.ihne.model.ImportParametersDto
import com.kelstar.ihne.model.RoomDto
import com.kelstar.ihne.service.GeminiService
import com.kelstar.ihne.service.QuestionService
import com.kelstar.ihne.service.RoomNotFoundException
import com.kelstar.ihne.service.RoomService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.server.ResponseStatusException


@RestController
@RequestMapping("/api/v1/room")
class RoomRestController(
    private val questionService: QuestionService,
    private val roomService: RoomService,
    private val geminiService: GeminiService
) {

    companion object {
        private val ALLOWED_LANGUAGES = setOf("ru", "en", "uk", "pl")
    }

    @PostMapping
    fun createRoom(@RequestParam(required = false, defaultValue = "ru") lang: String): RoomDto {
        if (lang !in ALLOWED_LANGUAGES) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported language: $lang")
        }
        val room = roomService.createNewRoom(lang)
        return RoomDto(room.code, room.language, room.isPaid ?: false, geminiService.isEnabled)
    }

    @GetMapping("/{code}")
    fun getRoom(@PathVariable code: Int): ResponseEntity<RoomDto> {
        val room = roomService.getRoom(code)
        return if (room != null) {
            ResponseEntity.ok(RoomDto(room.code, room.language, room.isPaid ?: false, geminiService.isEnabled))
        } else {
            ResponseEntity.notFound().build()
        }
    }

    /**
     * Payment status check, not a payment action. This used to unconditionally flip the room
     * to paid (the honor system) - now that Buy Me a Coffee webhook verification
     * (see BmcWebhookController) is the only thing that can mark a room paid, this endpoint just
     * reports current state so the frontend's "I paid / Check access" button can poll it after
     * sending a real donation. Keeps the same route/response shape the frontend already polls.
     */
    @PostMapping("/{code}/pay")
    fun checkPaymentStatus(@PathVariable code: Int): RoomDto {
        val room = roomService.getRoom(code) ?: throw RoomNotFoundException(code)
        return RoomDto(room.code, room.language, room.isPaid ?: false, geminiService.isEnabled)
    }

    @GetMapping("/{code}/notShownCount")
    fun getNotShownCount(@PathVariable code: Int): ResponseEntity<Long> {
        return if (roomService.roomExists(code)) {
            val count = questionService.countNotShown(code)
            ResponseEntity.ok(count)
        } else {
            ResponseEntity.notFound().build()
        }
    }    
    
    @PostMapping("/{code}/load")
    fun loadPredefinedQuestionsToRoom(@RequestBody importParametersDto: ImportParametersDto, @PathVariable code: Int): ResponseEntity<Long> {
        return if (roomService.roomExists(code)) {
            val count = questionService.importQuestionsByParameters(importParametersDto, code)
            ResponseEntity.ok(count)
        } else {
            ResponseEntity.notFound().build()
        }
    }
    
    @PostMapping("/{code}/upload")
    fun postQuestion(@RequestParam("file") file: MultipartFile, @PathVariable code: Int): ResponseEntity<Long> {
        return if (roomService.roomExists(code)) {
            val count = questionService.importQuestionsFromStream(file.inputStream, code)
            ResponseEntity.ok(count)
        } else {
            ResponseEntity.notFound().build()
        }
    }

    @PostMapping("/{code}/generate-ai")
    fun generateAiQuestions(@PathVariable code: Int): ResponseEntity<Any> {
        return try {
            val count = questionService.generateAiQuestions(code)
            ResponseEntity.ok(mapOf("count" to count))
        } catch (e: ResponseStatusException) {
            ResponseEntity.status(e.statusCode).body(mapOf("error" to e.reason))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().body(mapOf("error" to e.message))
        } catch (e: Exception) {
            ResponseEntity.internalServerError().body(mapOf("error" to e.message))
        }
    }
    
}