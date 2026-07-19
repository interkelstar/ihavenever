package com.kelstar.ihne.model

import com.fasterxml.jackson.annotation.JsonProperty

data class QuestionDto(var question: String = "") {
    constructor(question: Question) : this(question.question)
}

data class RoomDto(val code: Int, val language: String, @get:JsonProperty("isPaid") val isPaid: Boolean, val aiEnabled: Boolean = false)

data class ImportParametersDto(var size: Int = 0, var datasetName: String = "")