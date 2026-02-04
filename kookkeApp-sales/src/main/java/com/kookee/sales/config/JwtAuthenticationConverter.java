package com.kookee.sales.config;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Custom JWT Authentication Converter
 * Extracts roles from JWT claims and converts to Spring Security authorities
 */
@Component
public class JwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

  private static final String ROLES_CLAIM = "roles";
  private static final String ROLE_PREFIX = "ROLE_";
  private static final String SCOPE_PREFIX = "SCOPE_ROLE_";

  @Override
  public AbstractAuthenticationToken convert(Jwt jwt) {
    Collection<GrantedAuthority> authorities = extractAuthorities(jwt);
    return new JwtAuthenticationToken(jwt, authorities, jwt.getSubject());
  }

  /**
   * Extract roles from JWT and convert to GrantedAuthorities
   */
  private Collection<GrantedAuthority> extractAuthorities(Jwt jwt) {
    @SuppressWarnings("unchecked")
    List<String> roles = (List<String>) jwt.getClaims().get(ROLES_CLAIM);

    if (roles == null || roles.isEmpty()) {
      return Collections.emptyList();
    }

    return roles.stream()
      .map(role -> new SimpleGrantedAuthority(SCOPE_PREFIX + role))
      .collect(Collectors.toList());
  }
}
