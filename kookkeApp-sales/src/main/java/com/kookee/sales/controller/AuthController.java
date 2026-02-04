package com.kookee.sales.controller;

import com.kookee.sales.dto.LoginRequest;
import com.kookee.sales.dto.LoginResponse;
import com.kookee.sales.dto.RefreshTokenRequest;
import com.kookee.sales.dto.RefreshTokenResponse;
import com.kookee.sales.entity.User;
import com.kookee.sales.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Authentication Controller
 * Handles login, token refresh, logout, and biometric authentication
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:19000"})
public class AuthController {

  @Autowired
  private AuthService authService;

  /**
   * POST /api/auth/login
   * Login with username and password
   */
  @PostMapping("/login")
  public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
    try {
      LoginResponse response = authService.login(request);
      return ResponseEntity.ok(response);
    } catch (IllegalArgumentException e) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
        .body(new LoginResponse(
          null,
          null,
          null,
          "INVALID_CREDENTIALS",
          e.getMessage()
        ));
    } catch (Exception e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(new LoginResponse(
          null,
          null,
          null,
          "LOGIN_ERROR",
          e.getMessage()
        ));
    }
  }

  /**
   * POST /api/auth/refresh
   * Refresh access token using refresh token
   */
  @PostMapping("/refresh")
  public ResponseEntity<RefreshTokenResponse> refreshToken(@RequestBody RefreshTokenRequest request) {
    try {
      RefreshTokenResponse response = authService.refreshAccessToken(request.getRefreshToken());
      return ResponseEntity.ok(response);
    } catch (IllegalArgumentException e) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
        .body(new RefreshTokenResponse(null, null, "TOKEN_EXPIRED", e.getMessage()));
    } catch (Exception e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(new RefreshTokenResponse(null, null, "REFRESH_ERROR", e.getMessage()));
    }
  }

  /**
   * POST /api/auth/logout
   * Logout and revoke tokens
   */
  @PostMapping("/logout")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<?> logout(Authentication authentication) {
    try {
      String userId = (String) authentication.getPrincipal();
      authService.logout(userId);
      return ResponseEntity.ok(new Object() {
        public String message = "Logged out successfully";
      });
    } catch (Exception e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(new Object() {
          public String message = e.getMessage();
        });
    }
  }

  /**
   * POST /api/auth/offline-login
   * Login with cached credentials (offline mode)
   */
  @PostMapping("/offline-login")
  public ResponseEntity<?> offlineLogin(@RequestBody LoginRequest request) {
    // This endpoint would validate cached credentials from local database
    // For now, redirect to online login
    return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
      .body(new Object() {
        public String message = "Offline login not yet available. Please login online first.";
      });
  }

  /**
   * GET /api/auth/verify
   * Verify current session and get user details
   */
  @GetMapping("/verify")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<?> verify(Authentication authentication) {
    String userId = (String) authentication.getPrincipal();
    return ResponseEntity.ok(new Object() {
      public String userId = userId;
      public Object roles = authentication.getAuthorities();
      public long timestamp = System.currentTimeMillis();
    });
  }

  /**
   * POST /api/auth/lock-screen
   * Handle lock screen timeout (3 minutes of inactivity)
   */
  @PostMapping("/lock-screen")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<?> lockScreen(Authentication authentication) {
    String userId = (String) authentication.getPrincipal();
    return ResponseEntity.ok(new Object() {
      public String message = "Session locked due to inactivity";
      public String userId = userId;
      public boolean requiresBiometric = true;
    });
  }
}
