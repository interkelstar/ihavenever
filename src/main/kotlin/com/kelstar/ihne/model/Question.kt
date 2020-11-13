package com.kelstar.ihne.model

import java.time.Instant
import javax.persistence.Column
import javax.persistence.Entity
import javax.persistence.GeneratedValue
import javax.persistence.Id

@Entity
data class Question(
    @Column(unique = true)
    val question: String,
    val wasShown: Boolean = false,
    val dateAdded: Instant = Instant.now(),
    @Id
    @GeneratedValue
    val id: Long? = null
)