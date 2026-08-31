package com.uptimemonitor.api.config;

import com.uptimemonitor.api.auth.CustomOidcUserService;
import com.uptimemonitor.api.auth.OAuth2AuthenticationSuccessHandler;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final CustomOidcUserService customOidcUserService;
    private final OAuth2AuthenticationSuccessHandler successHandler;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    public SecurityConfig(CustomOidcUserService customOidcUserService,
                          OAuth2AuthenticationSuccessHandler successHandler) {
        this.customOidcUserService = customOidcUserService;
        this.successHandler = successHandler;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // CORS — allow frontend origin
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // CSRF disabled: SPA with SameSite cookies + CORS is sufficient for MVP.
            // Will be re-evaluated in production hardening (Phase 13).
            .csrf(csrf -> csrf.disable())

            // Authorization
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/actuator/health",
                    "/v3/api-docs/**",
                    "/swagger-ui/**",
                    "/swagger-ui.html",
                    "/api/auth/login",
                    "/oauth2/**",
                    "/login/**"
                ).permitAll()
                .anyRequest().authenticated()
            )

            // Google OAuth 2.0 login
            .oauth2Login(oauth2 -> oauth2
                .userInfoEndpoint(userInfo -> userInfo
                    .oidcUserService(customOidcUserService)
                )
                .successHandler(successHandler)
            )

            // Logout — invalidate session, clear cookies, and redirect browser to frontend
            .logout(logout -> logout
                .logoutRequestMatcher(new AntPathRequestMatcher("/api/auth/logout"))
                .logoutSuccessHandler((request, response, authentication) -> {
                    String accept = request.getHeader("Accept");
                    String xRequestedWith = request.getHeader("X-Requested-With");
                    if ("XMLHttpRequest".equals(xRequestedWith) || (accept != null && accept.contains("application/json"))) {
                        response.setStatus(HttpServletResponse.SC_OK);
                    } else {
                        response.sendRedirect(frontendUrl);
                    }
                })
                .invalidateHttpSession(true)
                .deleteCookies("JSESSIONID")
            )

            // Return 401 for unauthenticated API requests instead of redirect
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(frontendUrl));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
