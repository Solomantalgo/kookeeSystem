# Testing Authentication System

## Unit Tests

### Frontend Tests (Jest + React Testing Library)

**File: `mobile/src/services/auth/__tests__/SecureTokenStore.test.ts`**
```typescript
import { SecureTokenStore } from '../SecureTokenStore';
import * as SecureStore from 'expo-secure-store';

jest.mock('expo-secure-store');

describe('SecureTokenStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveAccessToken', () => {
    it('should save access token securely', async () => {
      const token = 'test-token-123';
      await SecureTokenStore.saveAccessToken(token);
      
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'kookee_access_token',
        token
      );
    });

    it('should throw error on save failure', async () => {
      (SecureStore.setItemAsync as jest.Mock).mockRejectedValue(
        new Error('Save failed')
      );

      await expect(
        SecureTokenStore.saveAccessToken('token')
      ).rejects.toThrow();
    });
  });

  describe('getAccessToken', () => {
    it('should retrieve access token', async () => {
      const token = 'test-token-123';
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(token);

      const result = await SecureTokenStore.getAccessToken();
      
      expect(result).toBe(token);
    });

    it('should return null if token not found', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      const result = await SecureTokenStore.getAccessToken();
      
      expect(result).toBeNull();
    });
  });

  describe('saveTokens', () => {
    it('should save both access and refresh tokens', async () => {
      const tokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 1800,
        tokenType: 'Bearer',
      };

      await SecureTokenStore.saveTokens(tokens);

      expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(2);
    });
  });

  describe('clearTokens', () => {
    it('should clear all tokens', async () => {
      await SecureTokenStore.clearTokens();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
        'kookee_access_token'
      );
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
        'kookee_refresh_token'
      );
    });
  });
});
```

### BiometricManager Tests

**File: `mobile/src/services/auth/__tests__/BiometricManager.test.ts`**
```typescript
import { BiometricManager } from '../BiometricManager';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Device from 'expo-device';

jest.mock('expo-local-authentication');
jest.mock('expo-device');

describe('BiometricManager', () => {
  describe('checkAvailability', () => {
    it('should return available biometric methods', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock)
        .mockResolvedValue([
          LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
        ]);

      const availability = await BiometricManager.checkAvailability();

      expect(availability.isAvailable).toBe(true);
      expect(availability.isFaceIDAvailable).toBe(true);
    });

    it('should return unavailable if hardware not present', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(false);

      const availability = await BiometricManager.checkAvailability();

      expect(availability.isAvailable).toBe(false);
    });
  });

  describe('authenticate', () => {
    it('should authenticate successfully', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
        success: true,
      });

      const result = await BiometricManager.authenticate();

      expect(result).toBe(true);
    });

    it('should return false on authentication failure', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
        success: false,
      });

      const result = await BiometricManager.authenticate();

      expect(result).toBe(false);
    });
  });

  describe('getDeviceId', () => {
    it('should return device ID', async () => {
      (Device.getDeviceIdAsync as jest.Mock).mockResolvedValue('device-123');

      const id = await BiometricManager.getDeviceId();

      expect(id).toBe('device-123');
    });
  });
});
```

### Backend Tests (JUnit 5 + Mockito)

**File: `src/test/java/com/kookee/sales/service/JwtTokenServiceTest.java`**
```java
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import static org.junit.jupiter.api.Assertions.*;

class JwtTokenServiceTest {
  
  private JwtTokenService jwtTokenService;

  @BeforeEach
  void setUp() {
    jwtTokenService = new JwtTokenService();
    jwtTokenService.jwtSecret = "test-secret-key-at-least-32-characters-long";
    jwtTokenService.accessTokenExpiration = 1800;
    jwtTokenService.refreshTokenExpiration = 1209600;
  }

  @Test
  void testGenerateAccessToken() {
    String token = jwtTokenService.generateAccessToken(
      "user-123",
      "testuser",
      Arrays.asList("FIELD_SALES_REP"),
      "device-123"
    );

    assertNotNull(token);
    assertTrue(jwtTokenService.validateToken(token));
  }

  @Test
  void testGenerateRefreshToken() {
    String token = jwtTokenService.generateRefreshToken(
      "user-123",
      "testuser",
      "device-123"
    );

    assertNotNull(token);
    assertTrue(jwtTokenService.validateToken(token));
  }

  @Test
  void testValidateToken() {
    String token = jwtTokenService.generateAccessToken(
      "user-123",
      "testuser",
      Arrays.asList("FIELD_SALES_REP"),
      "device-123"
    );

    assertTrue(jwtTokenService.validateToken(token));
  }

  @Test
  void testValidateInvalidToken() {
    assertFalse(jwtTokenService.validateToken("invalid-token"));
  }

  @Test
  void testExtractUserId() {
    String token = jwtTokenService.generateAccessToken(
      "user-123",
      "testuser",
      Arrays.asList("FIELD_SALES_REP"),
      "device-123"
    );

    String userId = jwtTokenService.extractUserId(token);
    assertEquals("user-123", userId);
  }

  @Test
  void testExtractRoles() {
    List<String> roles = Arrays.asList("FIELD_SALES_REP", "ADMIN");
    String token = jwtTokenService.generateAccessToken(
      "user-123",
      "testuser",
      roles,
      "device-123"
    );

    List<String> extractedRoles = jwtTokenService.extractRoles(token);
    assertEquals(roles, extractedRoles);
  }

  @Test
  void testTokenExpiration() {
    jwtTokenService.accessTokenExpiration = 0; // Expire immediately
    String token = jwtTokenService.generateAccessToken(
      "user-123",
      "testuser",
      Arrays.asList("FIELD_SALES_REP"),
      "device-123"
    );

    assertTrue(jwtTokenService.isTokenExpired(token));
  }
}
```

## Integration Tests

### API Security Tests

**File: `src/test/java/com/kookee/sales/controller/AuthControllerIntegrationTest.java`**
```java
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerIntegrationTest {

  @Autowired
  private MockMvc mockMvc;

  @Test
  void testLoginSuccess() throws Exception {
    String loginPayload = """
      {
        "username": "testuser",
        "password": "password123",
        "deviceId": "device-123"
      }
      """;

    mockMvc.perform(post("/api/auth/login")
        .contentType("application/json")
        .content(loginPayload))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.user.id").exists())
      .andExpect(jsonPath("$.accessToken").exists())
      .andExpect(jsonPath("$.refreshToken").exists());
  }

  @Test
  void testLoginInvalidCredentials() throws Exception {
    String loginPayload = """
      {
        "username": "testuser",
        "password": "wrongpassword"
      }
      """;

    mockMvc.perform(post("/api/auth/login")
        .contentType("application/json")
        .content(loginPayload))
      .andExpect(status().isUnauthorized());
  }

  @Test
  void testRefreshToken() throws Exception {
    // First login
    String token = loginAndGetToken();

    // Then refresh
    String refreshPayload = String.format("""
      {
        "refreshToken": "%s"
      }
      """, token);

    mockMvc.perform(post("/api/auth/refresh")
        .contentType("application/json")
        .content(refreshPayload))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.accessToken").exists());
  }

  @Test
  void testAccessAdminEndpointWithFieldRepToken() throws Exception {
    String fieldRepToken = loginAsFieldRep();

    mockMvc.perform(get("/api/admin/users")
        .header("Authorization", "Bearer " + fieldRepToken))
      .andExpect(status().isForbidden());
  }

  @Test
  void testAccessFieldOpEndpointWithAdminToken() throws Exception {
    String adminToken = loginAsAdmin();

    mockMvc.perform(get("/api/routes/my-route")
        .header("Authorization", "Bearer " + adminToken))
      .andExpect(status().isForbidden());
  }

  @Test
  void testAccessWithExpiredToken() throws Exception {
    String expiredToken = "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...";

    mockMvc.perform(get("/api/routes/my-route")
        .header("Authorization", "Bearer " + expiredToken))
      .andExpect(status().isUnauthorized());
  }
}
```

## Manual Testing Checklist

### Login Flow
- [ ] Login with valid credentials
- [ ] Login with invalid password shows error
- [ ] Login with non-existent user shows error
- [ ] Device ID is captured and stored
- [ ] Tokens are stored in secure storage
- [ ] User info is cached locally

### Token Management
- [ ] Access token valid for 30 minutes
- [ ] Refresh token valid for 14 days
- [ ] Automatic token refresh before expiration
- [ ] Manual token refresh works
- [ ] Expired token triggers automatic refresh
- [ ] Refresh with invalid token logs out user

### Biometric
- [ ] FaceID unlock works (iOS)
- [ ] TouchID unlock works (iOS/Android)
- [ ] Device PIN fallback works
- [ ] Failed biometric shows retry option
- [ ] Max failed attempts locks user out

### Lock Screen
- [ ] Session locks after 3 minutes inactivity
- [ ] Biometric unlock resumes session
- [ ] Logout clears session completely
- [ ] New login after logout works

### Role-Based Access
- [ ] FIELD_SALES_REP accesses /api/routes/my-route ✓
- [ ] FIELD_SALES_REP access /api/admin/* blocked
- [ ] ADMIN accesses /api/admin/users ✓
- [ ] SUPER_ADMIN has all access
- [ ] Permission check on every request

### Offline Scenarios
- [ ] App works offline with cached tokens
- [ ] Changes queued when offline
- [ ] Sync on reconnection
- [ ] Offline data cleared on logout

### Security
- [ ] Tokens never logged
- [ ] Tokens never in AsyncStorage
- [ ] CORS headers correct
- [ ] HTTPS enforced in production
- [ ] Rate limiting works

## Performance Benchmarks

```
Login: < 2 seconds
Token Refresh: < 500ms
Biometric Auth: < 1 second
Protected Route Check: < 100ms
Token Validation: < 50ms
```

## Continuous Integration

Add to CI/CD pipeline:
```bash
# Run all tests
mvn test
npm test

# Coverage reports
mvn clean test jacoco:report
npm test -- --coverage

# Security scan
mvn dependency-check:check
npm audit
```
