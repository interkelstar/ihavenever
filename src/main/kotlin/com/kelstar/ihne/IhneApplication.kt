package com.kelstar.ihne

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.scheduling.annotation.EnableScheduling


@SpringBootApplication
@EnableScheduling
class IhneApplication

fun main(args: Array<String>) {
    runApplication<IhneApplication>(*args)
}