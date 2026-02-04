package com.kookee.sales.dto;

import com.kookee.sales.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Login Response DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
  private User user;
  private String accessToken;
  private String refreshToken;
  private String errorCode;
  private String message;
}

/**
 * Login Request DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
class LoginRequest {
  private String username;
  private String password;
  private String deviceId;
}

/**
 * Refresh Token Request DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
class RefreshTokenRequest {
  private String refreshToken;
}

/**
 * Refresh Token Response DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
class RefreshTokenResponse {
  private String accessToken;
  private String refreshToken;
  private String errorCode;
  private String message;
}

/**
 * Auth Verify Response DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
class AuthVerifyResponse {
  private String userId;
  private String username;
  private String[] roles;
  private Long timestamp;
  private boolean isAuthenticated;
}

/**
 * Lock Screen Response DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
class LockScreenResponse {
  private String message;
  private String userId;
  private boolean requiresBiometric;
  private Long timeoutAt;
}

/**
 * Device Binding DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
class DeviceBindingRequest {
  private String deviceId;
  private String deviceName;
  private String osType;
  private String osVersion;
}

/**
 * Offline Credentials DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
class OfflineLoginRequest {
  private String username;
  private String passwordHash;
  private String deviceId;
}
