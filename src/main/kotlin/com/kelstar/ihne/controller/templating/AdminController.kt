package com.kelstar.ihne.controller.templating

import com.kelstar.ihne.model.dto.QuestionDto
import com.kelstar.ihne.service.QuestionService
import com.opencsv.bean.CsvToBeanBuilder
import org.springframework.stereotype.Controller
import org.springframework.ui.Model
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import java.io.BufferedReader
import java.io.InputStreamReader


@Controller
@RequestMapping("/admin")
class AdminController(
    private val questionService: QuestionService
) {
    @GetMapping
    fun showAdminPage(model: Model): String {
        model.addAttribute("questions", questionService.findAllByAdded())
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
    fun uploadCSVFile(@RequestParam("file") file: MultipartFile, model: Model): String {
        // validate file
        if (file.isEmpty) {
            model.addAttribute("message", "Please select a CSV file to upload.")
            model.addAttribute("hasError", true)
        } else {
            try {
                BufferedReader(InputStreamReader(file.inputStream)).use { reader ->
                    CsvToBeanBuilder<QuestionDto>(reader)
                        .withType(QuestionDto::class.java)
                        .withIgnoreLeadingWhiteSpace(true)
                        .build()
                        .parse()
                        .forEach {
                            try {
                                questionService.addQuestion(it)
                            } catch (e: Exception) {
                                e.printStackTrace()
                            }
                        }
                    model.addAttribute("hasError", false)
                }
            } catch (ex: Exception) {
                model.addAttribute("message", "An error occurred while processing the CSV file.")
                model.addAttribute("hasError", false)
            }
        }
        model.addAttribute("questions", questionService.findAllByAdded())
        return "admin"
    }
}