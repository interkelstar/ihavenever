package com.kelstar.ihne.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.Customizer.withDefaults
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.core.userdetails.User
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.crypto.factory.PasswordEncoderFactories
import org.springframework.security.core.userdetails.UsernameNotFoundException
import org.springframework.security.web.SecurityFilterChain


@Configuration
@EnableWebSecurity
class SpringSecurityConfig {

    @Bean
    fun configure(http: HttpSecurity): SecurityFilterChain {
        http
            .authorizeHttpRequests { auth ->
                 auth.requestMatchers("/admin/**").hasRole("ADMIN")
                 auth.requestMatchers("/**").permitAll()
            }
            .httpBasic(withDefaults())
            .csrf { it.disable() }
        
        return http.build()
    }

    /**
     * The admin password is resolved per login attempt, NOT at bean creation: this bean is
     * built before the CRaC checkpoint, where the training-time environment has no
     * ADMIN_PASSWORD - an InMemoryUserDetailsManager would freeze the default password into
     * the image forever, silently ignoring whatever the Cloud Run revision sets. At runtime a
     * fresh value arrives via run-app.sh -> /tmp/env.properties -> HikariCracResource, which
     * promotes it to the "admin.password" system property read here. Admin logins are rare,
     * so re-encoding on each attempt costs nothing that matters.
     */
    @Bean
    fun users(): UserDetailsService {
        val encoder = PasswordEncoderFactories.createDelegatingPasswordEncoder()
        return UserDetailsService { username ->
            if (username != "admin") throw UsernameNotFoundException("Unknown user: $username")
            val password = System.getenv("ADMIN_PASSWORD")?.takeIf { it.isNotBlank() }
                ?: System.getProperty("admin.password")?.takeIf { it.isNotBlank() }
                ?: "admin"
            User.builder()
                .username("admin")
                .password(encoder.encode(password))
                .roles("ADMIN")
                .build()
        }
    }
}