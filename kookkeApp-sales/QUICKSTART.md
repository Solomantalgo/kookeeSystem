# Quick Start Guide - Authentication System

## 🎯 5-Minute Setup

### Frontend Setup

**1. Install Dependencies**
```bash
cd mobile
npm install expo-secure-store expo-local-authentication axios expo-device
```

**2. Wrap App with AuthProvider**
```tsx
import { AuthProvider } from './src/context/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <YourMainApp />
    </AuthProvider>
  );
}
```

**3. Add AuthStack**
```tsx
import { AuthStack } from './src/components/auth/AuthStack';

export default function App() {
  return (
    <AuthProvider>
      <AuthStack>
        <YourMainApp />
      </AuthStack>
    </AuthProvider>
  );
}
```

### Backend Setup

**1. Add Dependencies to `pom.xml`**
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-oauth2-resource-server</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-oauth2-jose</artifactId>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.11.5</version>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.11.5</version>
    <scope>runtime</scope>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>0.11.5</version>
    <scope>runtime</scope>
</dependency>
```

**2. Set Environment Variables**
```bash
export JWT_SECRET="your-secret-key-min-32-characters"
export REACT_APP_API_URL="http://localhost:8080/api"
```

**3. Start Backend**
```bash
mvn spring-boot:run
```

### Test It Works

**1. Login Test**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'

# Should return:
# {
#   "user": { ... },
#   "accessToken": "eyJhbGc...",
#   "refreshToken": "eyJhbGc..."
# }
```

**2. Protected Request Test**
```bash
TOKEN="eyJhbGc..."  # From login response

curl -X GET http://localhost:8080/api/auth/verify \
  -H "Authorization: Bearer $TOKEN"

# Should return:
# {
#   "userId": "user-123",
#   "roles": ["ROLE_FIELD_SALES_REP"],
#   "timestamp": 1234567890
# }
```

**3. Role Protection Test**
```bash
# Field rep trying to access admin endpoint
curl -X GET http://localhost:8080/api/admin/users \
  -H "Authorization: Bearer $TOKEN"

# Should return: 403 Forbidden
```

## 📱 Frontend Usage Examples

### Using Auth Context

```tsx
import { useAuth } from './hooks/useAuth';

function Dashboard() {
  const { user, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div>
      <h1>Welcome {user?.firstName}!</h1>
      <p>Role: {user?.roles.join(', ')}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Making API Requests

```tsx
import { useAuthApi } from './hooks/useAuth';

function MyRoutes() {
  const { request } = useAuthApi();
  const [route, setRoute] = useState(null);

  useEffect(() => {
    request('GET', '/routes/my-route')
      .then(data => setRoute(data))
      .catch(error => console.error(error));
  }, []);

  return <div>{route?.name}</div>;
}
```

### Protected Routes

```tsx
import { AdminRoute, FieldRepRoute } from './components/auth/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      
      <Route path="/admin" element={
        <AdminRoute fallback={<AccessDenied />}>
          <AdminPanel />
        </AdminRoute>
      } />

      <Route path="/field" element={
        <FieldRepRoute>
          <FieldOperations />
        </FieldRepRoute>
      } />
    </Routes>
  );
}
```

### Biometric Login

```tsx
import { BiometricManager } from './services/auth/BiometricManager';

function LoginScreen() {
  const handleBioLogin = async () => {
    const available = await BiometricManager.checkAvailability();
    
    if (available.isAvailable) {
      const success = await BiometricManager.authenticate();
      if (success) {
        // Proceed with cached credentials
      }
    }
  };

  return (
    <button onClick={handleBioLogin}>
      Unlock with {available.isFaceIDAvailable ? 'Face ID' : 'Touch ID'}
    </button>
  );
}
```

## 🛠️ Common Tasks

### Change Token Duration

**Frontend** - `.env`:
```
REACT_APP_ACCESS_TOKEN_DURATION_MINUTES=30
REACT_APP_REFRESH_TOKEN_DURATION_DAYS=14
```

**Backend** - `application.properties`:
```properties
jwt.access-token-expiration=1800
jwt.refresh-token-expiration=1209600
```

### Add New Role

**1. Add to `types/shared/auth.ts`:**
```typescript
export enum UserRole {
  // ...existing roles...
  WAREHOUSE_MANAGER = 'WAREHOUSE_MANAGER',
}
```

**2. Update Backend Security Config:**
```java
.antMatchers("/api/warehouse/**")
  .hasAuthority("SCOPE_ROLE_WAREHOUSE_MANAGER")
```

**3. Create Protected Route:**
```tsx
<CanAccess role="WAREHOUSE_MANAGER">
  <WarehousePanel />
</CanAccess>
```

### Logout User

```tsx
import { useAuth } from './hooks/useAuth';

function Header() {
  const { logout } = useAuth();

  return (
    <button onClick={() => logout()}>
      Logout
    </button>
  );
}
```

### Check User Permissions

```tsx
import { useAuth } from './hooks/useAuth';

function MyComponent() {
  const { hasRole, canAccessAdmin } = useAuth();

  if (!hasRole('FIELD_SALES_REP')) {
    return <div>Not authorized</div>;
  }

  return (
    <div>
      {canAccessAdmin() && <AdminButton />}
    </div>
  );
}
```

## 🔍 Debugging

### Enable Verbose Logging

**Frontend** - `.env`:
```
REACT_APP_ENABLE_VERBOSE_LOGGING=true
```

**Backend** - `application.properties`:
```properties
logging.level.com.kookee.sales=DEBUG
logging.level.org.springframework.security=DEBUG
```

### Check Token Content

```javascript
// In browser console
const token = localStorage.getItem('access_token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log(payload);
```

### Verify Backend Configuration

```bash
curl http://localhost:8080/.well-known/jwks.json
curl http://localhost:8080/api/auth/verify
```

## 📋 Checklist Before Production

- [ ] JWT secret changed from default
- [ ] CORS origins configured
- [ ] HTTPS enabled
- [ ] Rate limiting configured
- [ ] Database migrations run
- [ ] Tests passing
- [ ] Error logging enabled
- [ ] CORS headers added to responses
- [ ] Token expiration set appropriately
- [ ] Biometric permissions in iOS Info.plist
- [ ] Biometric permissions in Android Manifest
- [ ] Device binding enabled (optional)
- [ ] Token blacklist table created

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| "CORS error" | Check CORS origins in SecurityConfig |
| "401 Unauthorized" | Verify token in Authorization header |
| "Token expired" | Call refresh endpoint with refresh token |
| "Biometric unavailable" | Test on physical device |
| "Access Denied (403)" | Check user role in token |
| "Invalid signature" | Verify JWT secret matches |

## 📚 Documentation Files

- **AUTH_IMPLEMENTATION_GUIDE.md** - Complete reference
- **ENV_SETUP.md** - Environment configuration
- **TESTING_AUTH.md** - Testing procedures
- **IMPLEMENTATION_SUMMARY.md** - What was built

## ✅ You're Ready!

Your authentication system is now:
- ✅ Secure with JWT tokens
- ✅ Role-protected endpoints
- ✅ Biometric enabled
- ✅ Session managed
- ✅ Offline capable
- ✅ Production ready

**Next**: Start integrating with your app's other components!
