package com.kelstar.ihne.controller.templating

import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping

@Controller
class SpaController {

    @GetMapping(value = ["/v2", "/v2/**"])
    fun forwardToSpa(): String {
        return "forward:/v2-static/index.html"
    }
}
