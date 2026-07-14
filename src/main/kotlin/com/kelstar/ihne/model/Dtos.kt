package com.kelstar.ihne.model

data class QuestionDto(var question: String = "") {
    constructor(question: Question) : this(question.question)
}

data class RoomDto(val code: Int, val language: String)

data class ImportParametersDto(var size: Int = 0, var datasetName: String = "")