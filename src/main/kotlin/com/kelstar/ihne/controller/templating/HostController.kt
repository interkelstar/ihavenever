package com.kelstar.ihne.controller.templating

import com.kelstar.ihne.model.ImportParametersDto
import com.kelstar.ihne.service.QuestionService
import com.kelstar.ihne.service.RoomService
import org.springframework.stereotype.Controller
import org.springframework.ui.Model
import org.springframework.ui.set
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile


@Controller
@RequestMapping("room/{code}/host")
class HostController(
    private val questionService: QuestionService,
    private val roomService: RoomService
) {
    @GetMapping
    fun showHostPage(@PathVariable code: Int) = "redirect:/room/$code/host/step1"

    @GetMapping("step1")
    fun showHostPageStep1(model: Model, @PathVariable code: Int): String {
        return roomService.getRoom(code)?.let {
            model.addAttribute(it.code)
            model.addAttribute(ImportParametersDto())
            "host/step1"
        } ?: "roomNotFound"
    }
    
    @GetMapping("step2")
    fun showHostPageStep2(model: Model, @PathVariable code: Int): String {
        return roomService.getRoom(code)?.let {
            model.addAttribute(it.code)
            model.addAttribute(ImportParametersDto())
            "host/step2"
        } ?: "roomNotFound"
    }
    
    @PostMapping("step2")
    fun importQuestionsFromHostPage(model: Model, @ModelAttribute importParametersDto: ImportParametersDto, @PathVariable code: Int): String {
        if (!roomService.roomExists(code)) {
            return "roomNotFound"
        }
        try {
            val count = questionService.importQuestionsByParameters(importParametersDto, code)
            if (count == 0L) {
                model["okMessage"] = "Все доступные в этом наборе вопросы уже были загружены"
            } else {
                model["okMessage"] = "$count вопросов было загружено в комнату!"
            }
        } catch (e: Exception) {
            e.printStackTrace()
            model["errorMessage"] = "Произошла ошибка!"
        }
        model.addAttribute(importParametersDto)
        return "host/step2"
    }

    @PostMapping("/step2/upload")
    fun uploadFile(@RequestParam file: MultipartFile, @PathVariable code: Int, model: Model): String {
        // validate file
        if (file.isEmpty) {
            model.let {
                it["uploadError"] = "Please select a file to upload."
            }
        } else {
            try {
                val count = questionService.importQuestionsFromStream(file.inputStream, code)
                model["uploadOk"] = "$count вопросов загружено"
            } catch (ex: Exception) {
                model.let {
                    it["uploadError"] = "An error occurred while processing the file."
                }
            }
        }
        model.addAttribute(ImportParametersDto())
        return "host/step2"
    }
}