package com.kelstar.ihne.model

import java.time.Instant
import javax.persistence.*
import javax.validation.constraints.Max
import javax.validation.constraints.Min

/*
    Despite all the recommendations not to use data classes for JPA, they are based on auto generating of eQ/hC functions
    Here I use business id approach, where auto eQ/hC are based on a set of immutable, not null, constructor assigned, fields
 */
@Entity
@Table(uniqueConstraints = [UniqueConstraint(columnNames = ["question", "roomCode"])])
data class Question(
    val question: String,
    val roomCode: Int,
    var isPredefined: Boolean = false,
) {
    var wasShown = false
    var dateAdded: Instant = Instant.now()
    @Id
    @GeneratedValue
    var id: Long? = null
}

@Entity
data class Room(
    @Id
    @Min(100_000)
    @Max(999_999)
    val code: Int
) {
    val dateCreated: Instant = Instant.now()
    @OneToMany(mappedBy = "roomCode", cascade = [CascadeType.ALL], fetch = FetchType.LAZY)
    var questions: Set<Question> = emptySet()
}

@Entity
data class Statistics(
    val creationDate: Instant,
    val questionsTotal: Int,
    val questionsShown: Int,
    val questionsPredefined: Int,
) {
    @Id
    @GeneratedValue
    var id: Long? = null
}