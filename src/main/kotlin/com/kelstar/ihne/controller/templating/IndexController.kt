package com.kelstar.ihne.controller.templating

import com.kelstar.ihne.model.dto.QuestionDto
import com.kelstar.ihne.service.QuestionService
import org.springframework.stereotype.Controller
import org.springframework.ui.Model
import org.springframework.web.bind.annotation.*


@Controller
class IndexController(
    private val questionService: QuestionService
) {

    @GetMapping
    fun showAskPage(model: Model): String {
        model.addAttribute(QuestionDto())
        return "index"
    }

    @PostMapping
    fun saveQuestion(model: Model, @ModelAttribute("questionForm") questionDto: QuestionDto): String {
        try {
            if (questionService.addQuestion(questionDto)) {
                model.addAttribute("okMessage", "Хорошо, давай ещё!")
            } else {
                model.addAttribute("errorMessage", "Такой вопрос уже есть!")
            }
        } catch (e: Exception) {
            model.addAttribute("errorMessage", "Error during saving!")
        }
        model.addAttribute(QuestionDto())
        return "index"
    }
}