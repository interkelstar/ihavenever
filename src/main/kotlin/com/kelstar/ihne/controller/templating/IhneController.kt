package com.kelstar.ihne.controller.templating

import com.kelstar.ihne.service.QuestionService
import org.springframework.stereotype.Controller
import org.springframework.ui.Model
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestMethod

@Controller
class IhneController(
    private val questionService: QuestionService
) {
    @GetMapping("/ihne")
    fun showIhnePage(model: Model): String {
        questionService.getRandomNotShown()?.let {
            model.addAttribute("question", it)
        }
        return "ihne"
    }

}