package com.voting.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public authentication and registration endpoints
                .requestMatchers("/api/auth/**").permitAll()
                // Public read endpoints for elections, candidate rosters, and results
                .requestMatchers(HttpMethod.GET, "/api/elections", "/api/elections/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/candidates/election/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/votes/results/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/payment/config").permitAll()
                // Admin specific endpoints
                .requestMatchers("/api/admin/**", "/api/audit-logs/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/elections", "/api/elections/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/voters", "/api/candidates").hasRole("ADMIN")
                // Candidate specific endpoints
                .requestMatchers("/api/payment/**").hasRole("CANDIDATE")
                .requestMatchers(HttpMethod.POST, "/api/candidates/register-for-election").hasRole("CANDIDATE")
                .requestMatchers(HttpMethod.GET, "/api/candidates/is-registered").hasRole("CANDIDATE")
                // Voter specific endpoints
                .requestMatchers(HttpMethod.POST, "/api/votes/cast").hasRole("VOTER")
                .requestMatchers(HttpMethod.GET, "/api/votes/has-voted/**").hasRole("VOTER")
                // User profile
                .requestMatchers(HttpMethod.GET, "/api/voters/profile").authenticated()
                // Common authenticated
                .anyRequest().authenticated()
            );

        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With", "Accept", "Origin"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
