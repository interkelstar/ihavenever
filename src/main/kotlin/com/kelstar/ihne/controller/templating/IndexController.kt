package com.kelstar.ihne.controller.templating

import com.kelstar.ihne.service.RoomService
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestParam


@Controller
class IndexController(
    private val roomService: RoomService
) {

    @GetMapping
    fun showIndexPage() = "index"
    
    @GetMapping("/join")
    fun joinGame(@RequestParam code: Int) = "redirect:/room/$code"

    @PostMapping("/create")
    fun createNewGame() = "redirect:/room/${roomService.createNewRoom().code}/host"
    
}