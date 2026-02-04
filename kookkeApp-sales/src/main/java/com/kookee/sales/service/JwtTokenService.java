package com.kookee.sales.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * JWT Token Service: Create, validate, and manage JWT tokens
 * - Access Token: 30 minutes (1800 seconds)
 * - Refresh Token: 14 days (1209600 seconds)
 */
@Service
public class JwtTokenService {

  @Value("${jwt.secret:your-secret-key-change-in-production}")
  private String jwtSecret;

  @Value("${jwt.access-token-expiration:1800}")
  private long accessTokenExpiration;

  @Value("${jwt.refresh-token-expiration:1209600}")
  private long refreshTokenExpiration;

  /**
   * Generate access token (30 minutes)
   */
  public String generateAccessToken(String userId, String username, List<String> roles, String deviceId) {
    Map<String, Object> claims = new HashMap<>();
    claims.put("roles", roles);
    claims.put("deviceId", deviceId);
    claims.put("type", "ACCESS");

    return createToken(claims, userId, username, accessTokenExpiration);
  }

  /**
   * Generate refresh token (14 days)
   */
  public String generateRefreshToken(String userId, String username, String deviceId) {
    Map<String, Object> claims = new HashMap<>();
    claims.put("deviceId", deviceId);
    claims.put("type", "REFRESH");

    return createToken(claims, userId, username, refreshTokenExpiration);
  }

  /**
   * Validate token signature and expiration
   */
  public boolean validateToken(String token) {
    try {
      Jwts.parserBuilder()
        .setSigningKey(jwtSecret.getBytes())
        .build()
        .parseClaimsJws(token);
      return true;
    } catch (Exception e) {
      return false;
    }
  }

  /**
   * Extract user ID from token
   */
  public String extractUserId(String token) {
    Claims claims = getAllClaimsFromToken(token);
    return claims.getSubject();
  }

  /**
   * Extract username from token
   */
  public String extractUsername(String token) {
    Claims claims = getAllClaimsFromToken(token);
    return (String) claims.get("username");
  }

  /**
   * Extract roles from token
   */
  @SuppressWarnings("unchecked")
  public List<String> extractRoles(String token) {
    Claims claims = getAllClaimsFromToken(token);
    return (List<String>) claims.get("roles");
  }

  /**
   * Check if token is expired
   */
  public boolean isTokenExpired(String token) {
    try {
      Claims claims = getAllClaimsFromToken(token);
      return claims.getExpiration().before(new Date());
    } catch (Exception e) {
      return true;
    }
  }

  /**
   * Get all claims from token
   */
  private Claims getAllClaimsFromToken(String token) {
    return Jwts.parserBuilder()
      .setSigningKey(jwtSecret.getBytes())
      .build()
      .parseClaimsJws(token)
      .getBody();
  }

  /**
   * Create JWT token with claims
   */
  private String createToken(Map<String, Object> claims, String userId, String username, long expiration) {
    claims.put("username", username);

    Date now = new Date();
    Date expiryDate = new Date(now.getTime() + expiration * 1000);

    return Jwts.builder()
      .setClaims(claims)
      .setSubject(userId)
      .setIssuedAt(now)
      .setExpiration(expiryDate)
      .signWith(SignatureAlgorithm.HS512, jwtSecret.getBytes())
      .compact();
  }
}
