package com.kelstar.ihne.config

import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import org.crac.Context
import org.crac.Core
import org.crac.Resource
import org.flywaydb.core.Flyway
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

        // GEMINI_ENABLED rides along in the same /tmp/env.properties dump (see run-app.sh) so
        // a fresh Cloud Run revision value reaches the restored JVM despite System.getenv()
        // still reflecting the checkpoint's training-time environment. Unlike the DB_* vars
        // above, nothing here consumes it directly - it's only read by GeminiService.isEnabled,
        // which reads System.getProperty(...) at call time - so just promote it to a system
        // property, once, if present in the dump.
        props.getProperty("GEMINI_ENABLED")?.takeIf { it.isNotBlank() }?.let {
            System.setProperty("gemini.enabled", it)
        }

        // Same dance for the Buy Me a Coffee webhook signing secret - BmcWebhookController
        // resolves "bmc.webhook.secret" at call time (mirroring GeminiService.resolveApiKey),
        // so promoting it here is enough for a fresh Cloud Run revision's BMC_WEBHOOK_SECRET
        // to reach the restored JVM.
        props.getProperty("BMC_WEBHOOK_SECRET")?.takeIf { it.isNotBlank() }?.let {
            System.setProperty("bmc.webhook.secret", it)
        }

        // NOTE: deliberately no catch-all here past this point. A failure while rebuilding
        // the pool or migrating the schema must propagate and kill the instance rather than
        // let it start serving traffic against an unmigrated/broken datasource.
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

        // Run Flyway against the freshly-restored datasource before it is swapped in. Any
        // failure here throws and is intentionally left unhandled: it must abort the
        // restore rather than let the instance serve traffic against a stale/unmigrated
        // schema. baselineOnMigrate/baselineVersion("0") mirror the Spring-managed config
        // used on normal boots (see application-postgres.yml) so this behaves identically
        // whether Flyway first touches the DB via a normal boot or via a CRaC restore.
        if (dbProfile == "postgres") {
            logger.info("CRaC afterRestore: running Flyway migration against restored datasource")
            Flyway.configure()
                .dataSource(newDs)
                .baselineOnMigrate(true)
                .baselineVersion("0")
                .load()
                .migrate()
            logger.info("CRaC afterRestore: Flyway migration completed successfully")
        }

        if (dataSource is RoutingDataSource) {
            dataSource.updateTargetDataSource(newDs)
            logger.info("RoutingDataSource delegate successfully updated with new connection pool")
        } else {
            throw IllegalStateException(
                "Primary DataSource is not an instance of RoutingDataSource. Cannot update target!"
            )
        }
    }
}
