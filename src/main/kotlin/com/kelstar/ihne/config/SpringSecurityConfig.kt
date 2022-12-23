package com.kelstar.ihne.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.web.servlet.invoke
import org.springframework.security.core.userdetails.User
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.crypto.factory.PasswordEncoderFactories
import org.springframework.security.provisioning.InMemoryUserDetailsManager
import org.springframework.security.web.SecurityFilterChain


@Configuration
@EnableWebSecurity
class SpringSecurityConfig {

    @Bean
    fun configure(http: HttpSecurity): SecurityFilterChain {
        http { 
            httpBasic {}
            authorizeRequests {
                authorize("/admin/**", hasRole("ADMIN"))
                authorize("/**", permitAll)
            }
            csrf { disable() }
        }
        return http.build()
    }

    @Bean
    fun users(): UserDetailsService {
        val admin = User.builder()
            .username("admin")
            .password(PasswordEncoderFactories.createDelegatingPasswordEncoder().encode(System.getenv("ADMIN_PASSWORD") ?: "admin"))
            .roles("ADMIN")
            .build()
        return InMemoryUserDetailsManager(admin)
    }
}