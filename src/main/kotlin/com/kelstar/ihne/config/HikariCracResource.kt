package com.kelstar.ihne.config

import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import org.crac.Context
import org.crac.Core
import org.crac.Resource
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Lazy
import org.springframework.stereotype.Component
import java.io.File
import java.util.Properties
import javax.sql.DataSource

@Component
@Lazy(false)
class HikariCracResource(private val dataSource: DataSource) : Resource {
    private val logger = LoggerFactory.getLogger(javaClass)

    init {
        Core.getGlobalContext().register(this)
        logger.info("Registered HikariCracResource with CRaC Global Context")
    }

    override fun beforeCheckpoint(context: Context<out Resource>?) {
        logger.info("CRaC beforeCheckpoint: preparing to close Hikari connection pool")
        val targetDs = (dataSource as? RoutingDataSource)?.targetDataSource
        if (targetDs is HikariDataSource) {
            try {
                // Completely close the connections so that sockets are released before checkpoint
                targetDs.close()
                logger.info("Hikari connection pool closed successfully before checkpoint")
            } catch (e: Exception) {
                logger.error("Error closing Hikari connection pool: ${e.message}", e)
            }
        } else {
            logger.warn("Underlying datasource was not a HikariDataSource, skipping close")
        }
    }

    override fun afterRestore(context: Context<out Resource>?) {
        logger.info("CRaC afterRestore: loading dynamic configuration and reconstructing datasource pool")

        val props = Properties()
        val propsFile = File("/tmp/env.properties")
        if (propsFile.exists()) {
            try {
                propsFile.inputStream().use { props.load(it) }
                logger.info("Loaded custom settings from /tmp/env.properties")
            } catch (e: Exception) {
                logger.warn("Could not load /tmp/env.properties: ${e.message}", e)
            }
        }

        fun resolveEnv(key: String): String? {
            return props.getProperty(key)?.takeIf { it.isNotBlank() } ?: System.getenv(key)?.takeIf { it.isNotBlank() }
        }

        try {
            val dbProfile = resolveEnv("DB_PROFILE") ?: "postgres"
            val dbUrl = resolveEnv("DB_URL") ?: "localhost"
            val dbPort = resolveEnv("DB_PORT") ?: (if (dbProfile == "mysql") "3306" else "5432")
            val dbName = resolveEnv("DB_NAME") ?: "ihne"
            val dbUser = resolveEnv("DB_USER") ?: "root"
            val dbPass = resolveEnv("DB_PASS") ?: "pw"
            val dbParams = resolveEnv("DB_PARAMS") ?: ""
            val dbInitSql = resolveEnv("DB_INIT_SQL") ?: ""

            val driverClassName = if (dbProfile == "mysql") "com.mysql.cj.jdbc.Driver" else "org.postgresql.Driver"

            val jdbcUrl = if (dbProfile == "mysql") {
                val q = if (dbParams.startsWith("?") || dbParams.isEmpty()) dbParams else "?$dbParams"
                val paramsString = q.ifEmpty { "?useUnicode=yes&characterEncoding=UTF-8" }
                "jdbc:mysql://$dbUrl:$dbPort/$dbName$paramsString"
            } else {
                "jdbc:postgresql://$dbUrl:$dbPort/$dbName$dbParams"
            }

            val springUrl = resolveEnv("SPRING_DATASOURCE_URL")
            val springUser = resolveEnv("SPRING_DATASOURCE_USERNAME")
            val springPass = resolveEnv("SPRING_DATASOURCE_PASSWORD")
            val springDriver = resolveEnv("SPRING_DATASOURCE_DRIVER_CLASS_NAME")

            val finalUrl = springUrl ?: jdbcUrl
            val finalUser = springUser ?: dbUser
            val finalPass = springPass ?: dbPass
            val finalDriver = springDriver ?: driverClassName

            logger.info("Recreating Hikari pool with URL: {}", finalUrl)

            val config = HikariConfig()
            config.jdbcUrl = finalUrl
            config.username = finalUser
            config.password = finalPass
            config.driverClassName = finalDriver

            // Set standard configurations
            config.isAllowPoolSuspension = true
            config.connectionTestQuery = "SELECT 1"
            config.connectionTimeout = 60000
            config.validationTimeout = 1000
            config.idleTimeout = 300000
            config.minimumIdle = 2
            config.maximumPoolSize = 5
            config.maxLifetime = 600000

            if (dbInitSql.isNotBlank()) {
                config.connectionInitSql = dbInitSql
            }

            val newDs = HikariDataSource(config)

            // Trigger Hibernate DDL-auto update programmatically on the new database pool
            // to ensure schema changes (new tables/columns) are applied automatically on restore
            if (dbProfile == "postgres" || dbProfile == "mysql") {
                try {
                    logger.info("CRaC afterRestore: triggering Hibernate schema update (ddl-auto) on the new database")
                    val emfBuilder = org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean()
                    emfBuilder.dataSource = newDs
                    emfBuilder.setPackagesToScan("com.kelstar.ihne.model")
                    emfBuilder.jpaVendorAdapter = org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter()
                    
                    val jpaProperties = java.util.Properties()
                    jpaProperties.setProperty("hibernate.hbm2ddl.auto", "update")
                    jpaProperties.setProperty("hibernate.temp.use_jdbc_metadata_defaults", "false")
                    emfBuilder.setJpaProperties(jpaProperties)
                    
                    emfBuilder.afterPropertiesSet()
                    emfBuilder.destroy()
                    logger.info("CRaC afterRestore: Hibernate schema update completed successfully")
                } catch (e: Exception) {
                    logger.error("Failed to run programmatic Hibernate schema update on afterRestore: ${e.message}", e)
                }
            }

            if (dataSource is RoutingDataSource) {
                dataSource.updateTargetDataSource(newDs)
                logger.info("RoutingDataSource delegate successfully updated with new connection pool")
            } else {
                logger.error("Primary DataSource is not an instance of RoutingDataSource. Cannot update target!")
            }
        } catch (e: Exception) {
            logger.error("Critical error during Hikari connection pool swap in afterRestore(): ${e.message}", e)
        }
    }
}
