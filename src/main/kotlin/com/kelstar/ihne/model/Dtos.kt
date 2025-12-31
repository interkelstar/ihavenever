package com.kelstar.ihne.model

data class QuestionDto(var question: String = "") {
    constructor(question: Question) : this(question.question)
}

data class RoomDto(val code: Int)

data class ImportParametersDto(var size: Int = 0, var datasetName: String = "")