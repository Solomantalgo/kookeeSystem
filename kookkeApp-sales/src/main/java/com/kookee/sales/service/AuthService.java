package com.kookee.sales.service;

import com.kookee.sales.dto.LoginRequest;
import com.kookee.sales.dto.LoginResponse;
import com.kookee.sales.dto.RefreshTokenResponse;
import com.kookee.sales.entity.User;
import com.kookee.sales.entity.UserRole;
import com.kookee.sales.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Authentication Service
 * Orchestrates login, token generation, and user validation
 */
@Service
public class AuthService {

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private JwtTokenService jwtTokenService;

  @Autowired
  private PasswordEncoder passwordEncoder;

  /**
   * Login user with credentials
   * Returns user info and JWT tokens
   */
  public LoginResponse login(LoginRequest request) {
    // Find user by username
    User user = userRepository.findByUsername(request.getUsername())
      .orElseThrow(() -> new IllegalArgumentException("User not found"));

    // Validate password
    if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
      throw new IllegalArgumentException("Invalid password");
    }

    // Check if user is active
    if (!user.isActive()) {
      throw new IllegalArgumentException("User account is disabled");
    }

    // Validate device binding if enabled
    if (user.getDeviceId() != null && !user.getDeviceId().equals(request.getDeviceId())) {
      throw new IllegalArgumentException("Device binding mismatch. Please contact administrator.");
    }

    // Update last login timestamp
    user.setLastLoginAt(LocalDateTime.now());
    if (request.getDeviceId() != null) {
      user.setDeviceId(request.getDeviceId());
    }
    userRepository.save(user);

    // Generate tokens
    List<String> roles = user.getRoles().stream()
      .map(UserRole::getName)
      .collect(Collectors.toList());

    String accessToken = jwtTokenService.generateAccessToken(
      user.getId(),
      user.getUsername(),
      roles,
      request.getDeviceId() != null ? request.getDeviceId() : user.getDeviceId()
    );

    String refreshToken = jwtTokenService.generateRefreshToken(
      user.getId(),
      user.getUsername(),
      request.getDeviceId() != null ? request.getDeviceId() : user.getDeviceId()
    );

    return new LoginResponse(
      user.toDTO(),
      accessToken,
      refreshToken,
      null,
      null
    );
  }

  /**
   * Refresh access token using refresh token
   */
  public RefreshTokenResponse refreshAccessToken(String refreshToken) {
    // Validate refresh token
    if (!jwtTokenService.validateToken(refreshToken)) {
      throw new IllegalArgumentException("Invalid or expired refresh token");
    }

    // Extract user info from token
    String userId = jwtTokenService.extractUserId(refreshToken);
    User user = userRepository.findById(userId)
      .orElseThrow(() -> new IllegalArgumentException("User not found"));

    // Generate new access token
    List<String> roles = user.getRoles().stream()
      .map(UserRole::getName)
      .collect(Collectors.toList());

    String newAccessToken = jwtTokenService.generateAccessToken(
      user.getId(),
      user.getUsername(),
      roles,
      user.getDeviceId()
    );

    return new RefreshTokenResponse(
      newAccessToken,
      refreshToken,
      null,
      null
    );
  }

  /**
   * Logout user and revoke tokens
   */
  public void logout(String userId) {
    User user = userRepository.findById(userId)
      .orElseThrow(() -> new IllegalArgumentException("User not found"));

    // In production, add token to blacklist
    // For now, just update last activity
    user.setUpdatedAt(LocalDateTime.now());
    userRepository.save(user);
  }

  /**
   * Validate user has required role
   */
  public boolean userHasRole(String userId, String roleName) {
    User user = userRepository.findById(userId)
      .orElse(null);

    if (user == null) {
      return false;
    }

    return user.getRoles().stream()
      .anyMatch(role -> role.getName().equals(roleName));
  }

  /**
   * Check if user can access admin endpoints
   */
  public boolean canAccessAdmin(String userId) {
    return userHasRole(userId, "ADMIN") || userHasRole(userId, "SUPER_ADMIN");
  }

  /**
   * Check if user is field sales rep
   */
  public boolean isFieldRep(String userId) {
    return userHasRole(userId, "FIELD_SALES_REP");
  }
}
