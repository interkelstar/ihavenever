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

    @GetMapping("/old")
    fun showIndexPage() = "old/index"
    
    @GetMapping("/old/join")
    fun joinGame(@RequestParam code: Int) = "redirect:/old/room/$code"

    @PostMapping("/old/create")
    fun createNewGame() = "redirect:/old/room/${roomService.createNewRoom().code}/host"
    
}