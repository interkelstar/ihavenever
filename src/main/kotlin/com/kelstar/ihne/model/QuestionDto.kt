package com.kelstar.ihne.model

import com.opencsv.bean.CsvBindByPosition

data class QuestionDto(@CsvBindByPosition(position = 0) var question: String? = null)