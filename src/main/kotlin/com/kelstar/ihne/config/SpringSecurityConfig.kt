package com.kelstar.ihne.config;

import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter
import org.springframework.security.config.web.servlet.invoke
import org.springframework.security.crypto.factory.PasswordEncoderFactories


@Configuration
class SpringSecurityConfig : WebSecurityConfigurerAdapter() {

    override fun configure(http: HttpSecurity) {
        http { 
            httpBasic {}
            authorizeRequests {
                authorize("/admin/**", hasRole("ADMIN"))
                authorize("/**", permitAll)
            }
        }
    }

    override fun configure(auth: AuthenticationManagerBuilder) {
        val encoder = PasswordEncoderFactories.createDelegatingPasswordEncoder()
        auth.inMemoryAuthentication()
            .withUser("admin")
                .password(encoder.encode("nimda"))
                .roles("ADMIN")
    }
}