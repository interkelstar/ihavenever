package com.kelstar.ihne.controller.rest

import com.kelstar.ihne.model.ImportParametersDto
import com.kelstar.ihne.model.RoomDto
import com.kelstar.ihne.service.QuestionService
import com.kelstar.ihne.service.RoomService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile


@RestController
@RequestMapping("/api/v1/room")
class RoomRestController(
    private val questionService: QuestionService,
    private val roomService: RoomService
) {
    
    @PostMapping
    fun createRoom(@RequestParam(required = false, defaultValue = "ru") lang: String): RoomDto {
        val room = roomService.createNewRoom(lang)
        return RoomDto(room.code, room.language, room.isPaid ?: false)
    }
    
    @GetMapping("/{code}")
    fun getRoom(@PathVariable code: Int): ResponseEntity<RoomDto> {
        val room = roomService.getRoom(code)
        return if (room != null) {
            ResponseEntity.ok(RoomDto(room.code, room.language, room.isPaid ?: false))
        } else {
            ResponseEntity.notFound().build()
        }
    }    

    @PostMapping("/{code}/pay")
    fun payForRoom(@PathVariable code: Int): ResponseEntity<RoomDto> {
        val room = roomService.getRoom(code)
        return if (room != null) {
            val updatedRoom = roomService.markRoomAsPaid(code)
            ResponseEntity.ok(RoomDto(updatedRoom.code, updatedRoom.language, updatedRoom.isPaid ?: false))
        } else {
            ResponseEntity.notFound().build()
        }
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
        } catch (e: IllegalStateException) {
            if (e.message == "Room is not paid") {
                ResponseEntity.status(402).body(mapOf("error" to e.message))
            } else {
                ResponseEntity.internalServerError().body(mapOf("error" to e.message))
            }
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().body(mapOf("error" to e.message))
        } catch (e: Exception) {
            ResponseEntity.internalServerError().body(mapOf("error" to e.message))
        }
    }
    
}