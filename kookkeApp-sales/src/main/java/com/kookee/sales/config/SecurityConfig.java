package com.kookee.sales.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Spring Security 6.x OAuth2 Resource Server Configuration
 * - JWT token validation
 * - Role-based access control (RBAC)
 * - CORS configuration
 * - Stateless session management (3-minute inactivity lock)
 */
@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(prePostEnabled = true, securedEnabled = true)
public class SecurityConfig {

  private static final String[] PUBLIC_ENDPOINTS = {
    "/api/auth/login",
    "/api/auth/refresh",
    "/api/auth/offline-login",
    "/api/health",
  };

  private static final String[] ADMIN_ENDPOINTS = {
    "/api/admin/**",
    "/api/users/**",
    "/api/roles/**",
    "/api/routes/assign/**",
  };

  private static final String[] FIELD_REP_ENDPOINTS = {
    "/api/routes/my-route",
    "/api/customers/my-territory",
    "/api/visits/**",
    "/api/locations/breadcrumbs",
  };

  /**
   * Configure HTTP security with JWT validation
   */
  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
      .cors()
      .and()
      .csrf().disable() // JWT doesn't need CSRF
      .sessionManagement()
        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
      .and()
      .authorizeRequests()
        // Public endpoints
        .antMatchers(PUBLIC_ENDPOINTS).permitAll()
        // Admin-only endpoints
        .antMatchers(ADMIN_ENDPOINTS).hasAnyAuthority("SCOPE_ROLE_ADMIN", "SCOPE_ROLE_SUPER_ADMIN")
        // Field rep endpoints
        .antMatchers(FIELD_REP_ENDPOINTS).hasAuthority("SCOPE_ROLE_FIELD_SALES_REP")
        // All other requests require authentication
        .anyRequest().authenticated()
      .and()
      .oauth2ResourceServer()
        .jwt()
        .jwtAuthenticationConverter(new JwtAuthenticationConverter());

    return http.build();
  }

  /**
   * Password encoder: BCrypt with strength 12
   */
  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(12);
  }

  /**
   * JWT decoder: Validates JWT signatures
   * In production, fetch public key from authorization server
   */
  @Bean
  public JwtDecoder jwtDecoder() {
    return NimbusJwtDecoder.withJwkSetUri(
      System.getenv("JWT_JWK_SET_URI") != null
        ? System.getenv("JWT_JWK_SET_URI")
        : "http://localhost:8080/.well-known/jwks.json"
    ).build();
  }

  /**
   * CORS configuration: Allow mobile app requests
   */
  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(Arrays.asList(
      "http://localhost:3000",
      "http://localhost:19000", // Expo
      "http://localhost:19006", // Expo web
      System.getenv("MOBILE_APP_URL") != null ? System.getenv("MOBILE_APP_URL") : ""
    ));
    configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
    configuration.setAllowedHeaders(Arrays.asList("*"));
    configuration.setExposedHeaders(Arrays.asList(
      "Authorization",
      "Content-Type",
      "X-Total-Count"
    ));
    configuration.setAllowCredentials(true);
    configuration.setMaxAge(3600L);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
  }
}
