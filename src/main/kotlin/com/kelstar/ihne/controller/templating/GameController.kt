package com.kelstar.ihne.controller.templating

import com.kelstar.ihne.model.ImportParametersDto
import com.kelstar.ihne.model.QuestionDto
import com.kelstar.ihne.service.QuestionService
import com.kelstar.ihne.service.RoomService
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Controller
import org.springframework.ui.Model
import org.springframework.ui.set
import org.springframework.web.bind.annotation.*
import java.time.LocalDate


@Controller
@RequestMapping("room/{code}")
class GameController(
    private val questionService: QuestionService,
    private val roomService: RoomService
) {
    
    @GetMapping
    fun showAskPage(model: Model, @PathVariable code: Int): String {
        return if (roomService.roomExists(code)) {
            model.addAttribute(QuestionDto())
            model.addAttribute(code)
            "asking"
        } else { "roomNotFound" }
    }

    @PostMapping
    fun saveQuestion(model: Model, @ModelAttribute questionDto: QuestionDto, @PathVariable code: Int): String {
        if (!roomService.roomExists(code)) {
            return "roomNotFound"
        }
        try {
            if (questionService.addQuestion(questionDto, code)) {
                model["okMessage"] = "Хорошо, давай ещё!"
            } else {
                model["errorMessage"] = "Такой вопрос уже есть!"
            }
        } catch (e: Exception) {
            model["errorMessage"] = "Error during saving!"
        }
        model.addAttribute(QuestionDto())
        return "asking"
    }


    @GetMapping("/host")
    fun showHostPage(model: Model, @PathVariable code: Int): String {
        return roomService.getRoom(code)?.let {
            model.addAttribute(it.code)
            model.addAttribute(ImportParametersDto())
            "host"
        } ?: "roomNotFound"
    }
    
    @PostMapping("/host")
    fun importQuestionsFromHostPage(model: Model, @ModelAttribute importParametersDto: ImportParametersDto, @PathVariable code: Int): String {
        if (!roomService.roomExists(code)) {
            return "roomNotFound"
        }
        try {
            val count = questionService.importQuestionsByParameters(importParametersDto, code)
            if (count == 0) {
                model["okMessage"] = "Все доступные в этом наборе вопросы уже были загружены"
            } else {
                model["okMessage"] = "$count вопросов было загружено в комнату!"
            }
        } catch (e: Exception) {
            e.printStackTrace()
            model["errorMessage"] = "Произошла ошибка!"
        }
        model.addAttribute(code)
        model.addAttribute(importParametersDto)
        return "host"
    }

    @GetMapping("/game")
    fun showGamePage(model: Model, @PathVariable code: Int): String {
        questionService.getRandomNotShown(code)?.let {
            model["question"] = QuestionDto(it.question)
        }
        return "game"
    }
    
    @PostMapping("/game")
    fun downloadRoomQuestions(@PathVariable code: Int): ResponseEntity<ByteArray> {
        if (roomService.roomExists(code)) {
            val contents = questionService.exportQuestions(code)

            val filename = "questions-$code-${LocalDate.now()}.txt";
            val headers = HttpHeaders()
            headers.contentType = MediaType.TEXT_PLAIN
            headers.cacheControl = "must-revalidate, post-check=0, pre-check=0"
            headers.setContentDispositionFormData(filename, filename);
            
            return ResponseEntity.ok()
                .headers(headers)
                .body(contents)
        }
        return ResponseEntity.notFound().build()
    }
}