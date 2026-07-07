package com.kelstar.ihne.config

import com.zaxxer.hikari.HikariDataSource
import org.crac.Context
import org.crac.Core
import org.crac.Resource
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Lazy
import org.springframework.stereotype.Component
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
        logger.info("CRaC beforeCheckpoint: preparing to close Hikari connection pool connections")
        if (dataSource is HikariDataSource) {
            try {
                // 1. Suspend the pool: prevents new connection creation and active pool refills
                dataSource.hikariPoolMXBean?.suspendPool()
                logger.info("Hikari pool suspended")

                // 2. Soft evict existing connections to close active/idle socket handles
                dataSource.hikariPoolMXBean?.softEvictConnections()
                logger.info("Hikari pool connections soft-evicted")

                // 3. Make sure connection threads have closed all client sockets
                Thread.sleep(500)
                logger.info("Hikari CRaC preprocessing complete")
            } catch (e: Exception) {
                logger.error("Error suspending/evicting Hikari connection pool: ${e.message}", e)
            }
        }
    }

    override fun afterRestore(context: Context<out Resource>?) {
        logger.info("CRaC afterRestore: resuming Hikari connection pool")
        if (dataSource is HikariDataSource) {
            try {
                dataSource.hikariPoolMXBean?.resumePool()
                logger.info("Hikari pool resumed successfully")
            } catch (e: Exception) {
                logger.error("Error resuming Hikari connection pool: ${e.message}", e)
            }
        }
    }
}
