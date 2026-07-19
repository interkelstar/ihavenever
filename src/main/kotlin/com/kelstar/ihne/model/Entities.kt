package com.kelstar.ihne.model

import com.fasterxml.jackson.annotation.JsonProperty
import java.time.Instant
import jakarta.persistence.*
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min

/*
    Despite all the recommendations not to use data classes for JPA, they are based on auto generating of eQ/hC functions
    Here I use business id approach, where auto eQ/hC are based on a set of immutable, not null, constructor assigned, fields
 */
@Entity
@Table(uniqueConstraints = [UniqueConstraint(columnNames = ["question", "roomCode"])])
data class Question(
    val question: String,
    val roomCode: Int,
    @get:JsonProperty("isPredefined")
    var isPredefined: Boolean = false,
) {
    var wasShown = false
    var dateAdded: Instant = Instant.now()
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "question_seq_gen")
    @SequenceGenerator(name = "question_seq_gen", sequenceName = "question_seq", allocationSize = 50)
    var id: Long? = null
}

@Entity
data class Room(
    @Id
    @Min(100_000)
    @Max(999_999)
    val code: Int,
    @Column(name = "language", nullable = false)
    val language: String = "ru"
) {
    val dateCreated: Instant = Instant.now()
    var isPaid: Boolean? = false
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
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "statistics_seq_gen")
    @SequenceGenerator(name = "statistics_seq_gen", sequenceName = "statistics_seq", allocationSize = 50)
    var id: Long? = null
}

@Entity
data class ArchivedQuestion(
    @Column(columnDefinition = "TEXT")
    val question: String,
    @Column(name = "language", nullable = false)
    val language: String = "ru",
    val roomCode: Int? = null
) {
    val dateArchived: Instant = Instant.now()
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "archived_question_seq_gen")
    @SequenceGenerator(name = "archived_question_seq_gen", sequenceName = "archived_question_seq", allocationSize = 50)
    var id: Long? = null
}