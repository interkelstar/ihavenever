package com.kelstar.ihne.config

import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import org.slf4j.LoggerFactory
import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Primary
import org.springframework.jdbc.datasource.DelegatingDataSource
import org.springframework.stereotype.Component
import javax.sql.DataSource

@Component
@ConfigurationProperties(prefix = "spring.datasource")
class MyDataSourceProperties {
    var url: String? = null
    var username: String? = null
    var password: String? = null
    var driverClassName: String? = null
}

class RoutingDataSource(initialDataSource: DataSource) : DelegatingDataSource(initialDataSource) {
    private val log = LoggerFactory.getLogger(RoutingDataSource::class.java)

    fun updateTargetDataSource(newDataSource: DataSource) {
        val oldDataSource = targetDataSource
        targetDataSource = newDataSource
        log.info("Successfully updated target database datasource pool")
        if (oldDataSource is HikariDataSource) {
            try {
                log.info("Closing old HikariDataSource connection pool...")
                oldDataSource.close()
                log.info("Old HikariDataSource pool closed")
            } catch (e: Exception) {
                log.error("Error closing old HikariDataSource pool: ${e.message}", e)
            }
        }
    }
}

@Configuration
class DataSourceConfig(private val properties: MyDataSourceProperties) {
    private val log = LoggerFactory.getLogger(DataSourceConfig::class.java)

    @Bean
    @Primary
    fun dataSource(): DataSource {
        log.info("Configuring dynamic RoutingDataSource with properties URL: ${properties.url}")
        
        val config = HikariConfig()
        config.jdbcUrl = properties.url
        config.username = properties.username
        config.password = properties.password
        config.driverClassName = properties.driverClassName

        // Apply Hikari connection pool options matching application requirements
        config.isAllowPoolSuspension = true
        config.connectionTestQuery = "SELECT 1"
        config.connectionTimeout = 60000
        config.validationTimeout = 1000
        config.idleTimeout = 300000
        config.minimumIdle = 2
        config.maximumPoolSize = 5
        config.maxLifetime = 600000

        val hikariDS = HikariDataSource(config)
        return RoutingDataSource(hikariDS)
    }
}
