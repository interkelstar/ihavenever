package com.kelstar.ihne.controller.rest

import com.kelstar.ihne.model.QuestionDto
import com.kelstar.ihne.service.QuestionService
import com.kelstar.ihne.service.RoomService
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.time.LocalDate


@RestController
@RequestMapping("/api/v1/room/{code}/questions")
class QuestionRestController(
    private val questionService: QuestionService,
    private val roomService: RoomService
) {

    @PostMapping
    fun postQuestion(@RequestBody questionDto: QuestionDto, @PathVariable code: Int): ResponseEntity<Void> {
        if (!roomService.roomExists(code)) {
            return ResponseEntity.notFound().build()
        }
        return if (questionService.addQuestion(questionDto, code)) {
            ResponseEntity.ok().build()
        } else {
            ResponseEntity.status(HttpStatus.CONFLICT).build()
        }
    }
    
    @GetMapping("/random")
    fun getRandomQuestion(@PathVariable code: Int): ResponseEntity<QuestionDto> {
        if (!roomService.roomExists(code)) {
            return ResponseEntity.notFound().build()
        }
        val randomNotShown = questionService.getRandomNotShown(code)
        return if (randomNotShown != null) {
            ResponseEntity.ok(QuestionDto(randomNotShown))
        } else {
            ResponseEntity.noContent().build()
        }
    }    
    
    @GetMapping("/download")
    fun downloadQuestions(@PathVariable code: Int): ResponseEntity<ByteArray> {
        if (!roomService.roomExists(code)) {
            return ResponseEntity.notFound().build()
        }
        if (questionService.allWereShown(code)) {
            val contents = questionService.exportQuestions(code)

            val filename = "questions-$code-${LocalDate.now()}.txt"
            val headers = HttpHeaders()
            headers.contentType = MediaType.TEXT_PLAIN
            headers.cacheControl = "must-revalidate, post-check=0, pre-check=0"
            headers.setContentDispositionFormData(filename, filename)

            return ResponseEntity.ok()
                .headers(headers)
                .body(contents)
        }
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).build()
    }
    
}