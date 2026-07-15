package com.kelstar.ihne.config

import org.slf4j.LoggerFactory
import org.springframework.boot.CommandLineRunner
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

@Component
class DatabaseMigration(private val jdbcTemplate: JdbcTemplate) : CommandLineRunner {
    private val logger = LoggerFactory.getLogger(javaClass)

    override fun run(vararg args: String) {
        try {
            // Update historical rooms language to 'ru' if it is NULL
            val updatedRooms = jdbcTemplate.update("UPDATE room SET language = 'ru' WHERE language IS NULL")
            if (updatedRooms > 0) {
                logger.info("DatabaseMigration: updated $updatedRooms historical rooms to default language 'ru'")
            }

            // Update historical archived questions language to 'ru' if it is NULL
            val updatedArchived = jdbcTemplate.update("UPDATE archived_question SET language = 'ru' WHERE language IS NULL")
            if (updatedArchived > 0) {
                logger.info("DatabaseMigration: updated $updatedArchived historical archived questions to default language 'ru'")
            }
        } catch (e: Exception) {
            logger.warn("DatabaseMigration: Update failed (tables might not exist yet or column not created): ${e.message}")
        }
    }
}
