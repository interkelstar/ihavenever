package com.kelstar.ihne.model

import com.opencsv.bean.CsvBindByPosition

data class QuestionDto(@CsvBindByPosition(position = 0) var question: String = "") {
    constructor(question: Question) : this(question.question)
}

data class ImportParametersDto(var size: Int = 0, var setName: String = "")