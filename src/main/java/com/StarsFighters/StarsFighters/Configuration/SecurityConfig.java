package com.StarsFighters.StarsFighters.Configuration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/", "/error").permitAll() // Rutas públicas
                        .anyRequest().authenticated()               // Todo lo demás requiere login
                )
                .oauth2Login(withDefaults()); // Habilita el login con Google

        return http.build();
    }
}
