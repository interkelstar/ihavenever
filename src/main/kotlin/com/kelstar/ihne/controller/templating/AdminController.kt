package com.kelstar.ihne.controller.templating

import com.kelstar.ihne.model.Question
import com.kelstar.ihne.service.ImportService
import com.kelstar.ihne.service.QuestionService
import org.springframework.stereotype.Controller
import org.springframework.ui.Model
import org.springframework.ui.set
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile


@Controller
@RequestMapping("/admin")
class AdminController(
    private val questionService: QuestionService,
    private val importService: ImportService
) {
    @GetMapping
    fun showAdminPage(model: Model): String {
        model["questions"] = questionService.findAllOrderByAdded()
        return "admin"
    }

    @PostMapping("/switchRead/{id}")
    fun switchQuestion(@PathVariable id: Long): String {
        questionService.switchRead(id)
        return "redirect:/admin"
    }

    @PostMapping("/delete/{id}")
    fun deleteQuestion(@PathVariable id: Long): String {
        questionService.deleteById(id)
        return "redirect:/admin"
    }

    @PostMapping("/refreshAll")
    fun refreshAll(): String {
        questionService.refreshAll()
        return "redirect:/admin"
    }

    @PostMapping("/import-csv")
    fun uploadCSVFile(@RequestParam("file") file: MultipartFile, @RequestParam("code") code: Int, model: Model): String {
        // validate file
        if (file.isEmpty) {
            model.let {
                it["message"] = "Please select a CSV file to upload."
                it["hasError"] = true
            }
        } else {
            try {
                val questions = importService.parseQuestionsFromStream(file.inputStream)
                        .map { Question(it.question, roomCode = code) }
                questionService.addAll(questions)
                model["hasError"] = false
            } catch (ex: Exception) {
                model.let {
                    it["message"] = "An error occurred while processing the CSV file."
                    it["hasError"] = true
                }
            }
        }
        model["questions"] = questionService.findAllOrderByAdded()
        return "admin"
    }
}