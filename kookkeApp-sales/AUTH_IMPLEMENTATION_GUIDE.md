# Authentication & Authorization Implementation Guide

## Overview
Complete JWT-based authentication system with role-based access control (RBAC), biometric support, and offline capabilities.

## Architecture

### Frontend (React Native/Expo)
- **SecureTokenStore**: Stores tokens in OS Keychain via Expo SecureStore
- **AuthService**: Core auth logic (login, logout, refresh)
- **BiometricManager**: OS-level biometric integration (FaceID, TouchID, PIN)
- **AuthenticatedHttpClient**: Axios wrapper with automatic token management
- **AuthContext**: React Context for global auth state
- **UI Components**: Login Screen, Lock Screen, Protected Routes

### Backend (Spring Boot)
- **SecurityConfig**: Spring Security 6.x OAuth2 configuration
- **JwtTokenService**: JWT creation, validation, and refresh
- **AuthService**: User authentication and role verification
- **JwtAuthenticationConverter**: Custom token-to-authorities converter
- **AuthController**: REST endpoints for auth operations

## Security Features

### Token Management
- **Access Token**: 30-minute duration (configurable)
- **Refresh Token**: 14-day persistent duration
- **Automatic Refresh**: Tokens refresh silently before expiration
- **Token Revocation**: Backend can blacklist compromised tokens

### Role-Based Access Control (RBAC)
Three primary roles:
- **FIELD_SALES_REP**: Field operations only
- **ADMIN**: Administrative functions
- **SUPER_ADMIN**: Full system access

Role-enforced endpoints:
```
/api/admin/** → ADMIN, SUPER_ADMIN only
/api/routes/my-route → FIELD_SALES_REP only
/api/customers/my-territory → FIELD_SALES_REP only
```

### Biometric Authentication
- Biometric unlocks locally stored JWT (not password)
- Supports FaceID, TouchID, and Device PIN fallback
- Never replaces server-side authentication
- Works offline with cached session

### Session Lifecycle
- **Inactivity Lock**: After 3 minutes without activity
- **Session Duration**: User stays logged in for 24 hours
- **Biometric Unlock**: Required to resume after lock
- **Device Binding**: Optional binding prevents multi-device login

## API Endpoints

### Authentication
```
POST /api/auth/login
  Request: { username, password, deviceId? }
  Response: { user, accessToken, refreshToken }
  Status: 200 OK | 401 Unauthorized

POST /api/auth/refresh
  Request: { refreshToken }
  Response: { accessToken, refreshToken, expiresIn }
  Status: 200 OK | 401 Unauthorized

POST /api/auth/logout
  Headers: Authorization: Bearer <token>
  Response: { message }
  Status: 200 OK

GET /api/auth/verify
  Headers: Authorization: Bearer <token>
  Response: { userId, roles, timestamp }
  Status: 200 OK | 401 Unauthorized

POST /api/auth/lock-screen
  Headers: Authorization: Bearer <token>
  Response: { message, requiresBiometric }
  Status: 200 OK
```

## Frontend Usage

### Setup AuthProvider
```tsx
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <YourAppContent />
    </AuthProvider>
  );
}
```

### Using Auth Context
```tsx
import { useAuth } from './context/AuthContext';

function Dashboard() {
  const { user, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <div>Welcome {user.firstName}!</div>;
}
```

### Protected Routes
```tsx
import { AdminRoute, FieldRepRoute } from './components/auth/ProtectedRoute';

<AdminRoute fallback={<AccessDenied />}>
  <AdminPanel />
</AdminRoute>

<FieldRepRoute>
  <FieldOperations />
</FieldRepRoute>
```

### Making Authenticated Requests
```tsx
import { useAuthApi } from './hooks/useAuth';

function MyComponent() {
  const { request } = useAuthApi();

  const getMyRoute = async () => {
    const route = await request('GET', '/routes/my-route');
    console.log(route);
  };
}
```

### Biometric Authentication
```tsx
import { BiometricManager } from './services/auth/BiometricManager';

async function handleBioLogin() {
  const availability = await BiometricManager.checkAvailability();
  if (availability.isAvailable) {
    const success = await BiometricManager.authenticate();
    if (success) {
      // Proceed with login
    }
  }
}
```

## Backend Configuration

### Environment Variables
```
JWT_SECRET=your-secret-key-min-32-chars
JWT_JWK_SET_URI=http://localhost:8080/.well-known/jwks.json
JWT_ACCESS_TOKEN_EXPIRATION=1800
JWT_REFRESH_TOKEN_EXPIRATION=1209600
MOBILE_APP_URL=http://localhost:19000
```

### Application Properties
```properties
jwt.secret=${JWT_SECRET}
jwt.access-token-expiration=1800
jwt.refresh-token-expiration=1209600
spring.security.oauth2.resourceserver.jwt.issuer-uri=http://localhost:8080
```

### Security Headers
```java
.defaultSecurityFilterChain(http -> http
    .headers(headers -> headers
        .xssProtection()
        .contentSecurityPolicy("default-src 'self'")
    )
)
```

## Testing

### Security Isolation Test
```bash
# Get token for Rep A
TOKEN_A=$(curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"rep_a","password":"password"}' \
  | jq -r '.accessToken')

# Try to access Rep B's data
curl -H "Authorization: Bearer $TOKEN_A" \
  http://localhost:8080/api/routes/rep-b-id

# Expected: 403 Forbidden
```

### Token Refresh Test
```bash
# 1. Login and get tokens
LOGIN=$(curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"password"}')

REFRESH_TOKEN=$(echo $LOGIN | jq -r '.refreshToken')

# 2. Wait for or simulate token expiration

# 3. Call refresh endpoint
curl -X POST http://localhost:8080/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}"

# Should return new access token
```

### Biometric Authentication Test
```javascript
// Test biometric availability
BiometricManager.checkAvailability().then(avail => {
  console.log('FaceID:', avail.isFaceIDAvailable);
  console.log('TouchID:', avail.isTouchIDAvailable);
  console.log('Device PIN:', avail.isDevicePINAvailable);
});

// Test authentication
BiometricManager.authenticate().then(success => {
  console.log('Authenticated:', success);
});
```

## Error Handling

### Common Error Codes
- `INVALID_CREDENTIALS`: Username/password mismatch
- `TOKEN_EXPIRED`: Access token has expired
- `TOKEN_INVALID`: Token signature invalid
- `ACCESS_DENIED`: Insufficient permissions (403)
- `USER_NOT_FOUND`: User doesn't exist
- `BIOMETRIC_FAILED`: Biometric authentication failed
- `SESSION_LOCKED`: Session locked after inactivity

### Error Response Format
```json
{
  "code": "TOKEN_EXPIRED",
  "message": "Your session has expired. Please log in again.",
  "details": {
    "expiresAt": "2024-01-22T14:30:00Z"
  }
}
```

## Security Best Practices

✅ DO:
- Use HTTPS/TLS for all communications
- Store tokens in OS Keychain only
- Validate tokens on every request
- Refresh tokens silently
- Implement rate limiting on login
- Log failed authentication attempts
- Use strong password hashing (BCrypt)

❌ DON'T:
- Store tokens in AsyncStorage
- Log tokens or sensitive data
- Disable CSRF protection
- Allow cross-origin requests from untrusted sources
- Use weak or default secrets
- Store passwords in plaintext
- Reuse tokens across devices

## Offline Login

Currently, offline login requires prior authentication:
1. First login must be online
2. Tokens cached securely on device
3. Tokens remain valid for 24 hours
4. Can access cached route/customer data offline
5. Changes synced when connection restored

Future enhancement:
- Implement offline credential caching
- Support PIN-based offline authentication
- Sync-first approach for data integrity

## Troubleshooting

### Token Refresh Failing
- Check network connectivity
- Verify JWT secret matches frontend/backend
- Check token expiration times
- Review backend logs for errors

### Biometric Not Available
- Check device hardware support
- Verify biometric permissions granted
- Test on physical device (simulator may not support)

### CORS Errors
- Verify CORS config includes app URL
- Check Authorization header is exposed
- Validate Content-Type headers

### Access Denied (403)
- Verify user has required role
- Check role is included in JWT claims
- Confirm role converter is active

## Performance Metrics

- Login request: < 2 seconds
- Token refresh: < 500ms
- Biometric authentication: < 1 second
- Protected route check: < 100ms
- Token validation: < 50ms

## Support

For issues or questions:
1. Check logs: `console.logs` in mobile, backend logs in console
2. Verify configuration matches env variables
3. Test endpoints with Postman/cURL
4. Enable verbose logging for debugging
