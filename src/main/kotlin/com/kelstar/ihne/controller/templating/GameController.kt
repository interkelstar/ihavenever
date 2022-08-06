package com.kelstar.ihne.controller.templating

import com.kelstar.ihne.model.QuestionDto
import com.kelstar.ihne.service.QuestionService
import com.kelstar.ihne.service.RoomService
import org.springframework.stereotype.Controller
import org.springframework.ui.Model
import org.springframework.ui.set
import org.springframework.web.bind.annotation.*


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
            "asking"
        } else {
            "error" //TODO change for room doesn't exist
        }
    }

    @PostMapping
    fun saveQuestion(model: Model, @ModelAttribute("questionForm") questionDto: QuestionDto, @PathVariable code: Int): String {
        if (!roomService.roomExists(code)) {
            return "error" //TODO change for room doesn't exist
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
        val room = roomService.getRoom(code)
        return if (room != null) {
            model.addAttribute(room)
            "host"
        } else {
            "error"
        }
    }

    @GetMapping("/game")
    fun showGamePage(model: Model, @PathVariable code: Int): String {
        questionService.getRandomNotShown(code)?.let {
            model["question"] = QuestionDto(it.question)
        }
        return "game"
    }
}