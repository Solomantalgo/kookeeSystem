# Authentication System Architecture Diagram

## 🏗️ System Architecture Overview

```
┌───────────────────────────────────────────────────────────────────────────┐
│                           KOOKEE SALES APP                                │
│                      Authentication & Authorization                        │
└───────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                            MOBILE FRONTEND                                       │
│                           (React Native/Expo)                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐       │
│  │                         USER INTERFACE LAYER                         │       │
│  ├─────────────────────────────────────────────────────────────────────┤       │
│  │                                                                       │       │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │       │
│  │  │ Login Screen │  │ Lock Screen  │  │  Dashboard   │              │       │
│  │  ├──────────────┤  ├──────────────┤  ├──────────────┤              │       │
│  │  │ • Username   │  │ • Biometric  │  │ • Home       │              │       │
│  │  │ • Password   │  │ • Retry      │  │ • Route      │              │       │
│  │  │ • Biometric  │  │ • Logout     │  │ • Profile    │              │       │
│  │  │ • Remember   │  │              │  │ • Settings   │              │       │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │       │
│  │         ▲                   ▲                  ▲                    │       │
│  │         │                   │                  │                    │       │
│  └─────────┼───────────────────┼──────────────────┼────────────────────┘       │
│            │                   │                  │                            │
│  ┌─────────┼───────────────────┼──────────────────┼────────────────────┐       │
│  │         │  CONTEXT LAYER    │                  │                    │       │
│  │         └──────────────┬────────────────────────┴────────────────────┘       │
│  │                        │                                              │       │
│  │         ┌──────────────▼────────────────────────┐                   │       │
│  │         │      AuthContext (Global State)       │                   │       │
│  │         ├────────────────────────────────────────┤                   │       │
│  │         │ • user: User | null                   │                   │       │
│  │         │ • tokens: AuthTokens | null           │                   │       │
│  │         │ • isAuthenticated: boolean            │                   │       │
│  │         │ • isLocked: boolean (3-min inactivity)│                   │       │
│  │         │ • login(username, password)           │                   │       │
│  │         │ • logout()                            │                   │       │
│  │         │ • refreshToken()                      │                   │       │
│  │         │ • biometricUnlock()                   │                   │       │
│  │         │ • hasRole(role)                       │                   │       │
│  │         └────────────┬─────────────────────────┘                   │       │
│  │                      │                                              │       │
│  │         ┌────────────▼────────────────────────┐                   │       │
│  │         │     Custom Auth Hooks               │                   │       │
│  │         ├────────────────────────────────────────┤                   │       │
│  │         │ • useAuth()                           │                   │       │
│  │         │ • useAuthApi()                        │                   │       │
│  │         │ • useTokenRefresh()                   │                   │       │
│  │         │ • usePermissions()                    │                   │       │
│  │         │ • useSessionManager()                 │                   │       │
│  │         └────────────┬─────────────────────────┘                   │       │
│  │                      │                                              │       │
│  └──────────────────────┼──────────────────────────────────────────────┘       │
│                         │                                                      │
│  ┌──────────────────────┼──────────────────────────────────────────────┐       │
│  │         SERVICES LAYER (Business Logic)                              │       │
│  │         │                                              │             │       │
│  │         ├─────────────────────────────────────────────┘             │       │
│  │         │                                                            │       │
│  │  ┌──────▼─────────────────┐ ┌──────────────────────┐               │       │
│  │  │  AuthService           │ │ BiometricManager     │               │       │
│  │  ├────────────────────────┤ ├──────────────────────┤               │       │
│  │  │ • login()              │ │ • checkAvailability()│               │       │
│  │  │ • logout()             │ │ • authenticate()     │               │       │
│  │  │ • refreshToken()       │ │ • getPrimaryMethod() │               │       │
│  │  │ • hasRole()            │ │ • getDeviceId()      │               │       │
│  │  │ • isAuthenticated()    │ │ • getDeviceInfo()    │               │       │
│  │  │ • verifyDeviceBinding()│ └──────────────────────┘               │       │
│  │  └────────┬──────────────┘                                         │       │
│  │           │                                                        │       │
│  │  ┌────────▼──────────────────┐ ┌────────────────────────────────┐ │       │
│  │  │ SecureTokenStore          │ │ AuthenticatedHttpClient       │ │       │
│  │  ├───────────────────────────┤ ├────────────────────────────────┤ │       │
│  │  │ • saveAccessToken()       │ │ • get(url)                    │ │       │
│  │  │ • getAccessToken()        │ │ • post(url, data)             │ │       │
│  │  │ • saveRefreshToken()      │ │ • put(url, data)              │ │       │
│  │  │ • getRefreshToken()       │ │ • delete(url)                 │ │       │
│  │  │ • saveTokens()            │ │ • patch(url, data)            │ │       │
│  │  │ • getTokens()             │ │ • Automatic token injection   │ │       │
│  │  │ • clearTokens()           │ │ • 401 retry with refresh      │ │       │
│  │  │ • clearAllAuthData()      │ │ • Error parsing               │ │       │
│  │  └────────┬──────────────────┘ └─────────┬──────────────────────┘ │       │
│  │           │                              │                        │       │
│  │           └──────────────────┬───────────┘                        │       │
│  │                              │                                    │       │
│  └──────────────────────────────┼────────────────────────────────────┘       │
│                                 │                                            │
│                        ┌────────▼────────────┐                              │
│                        │   Device Storage    │                              │
│                        ├─────────────────────┤                              │
│                        │ iOS:                │                              │
│                        │ • Keychain          │                              │
│                        │                     │                              │
│                        │ Android:            │                              │
│                        │ • EncryptedSharedPref
                        │                     │
│                        │ Never: AsyncStorage │
│                        └─────────────────────┘
│                                 │
└─────────────────────────────────┼──────────────────────────────────────────────┘
                                  │
                                  │ HTTP/HTTPS
                                  │
┌─────────────────────────────────┼──────────────────────────────────────────────┐
│                            BACKEND (Java/Spring)                               │
│                         (Spring Boot 3.x + Security 6.x)                       │
├─────────────────────────────────┼──────────────────────────────────────────────┤
│                                 │                                              │
│                        ┌────────▼────────────┐                                │
│                        │ API Gateway / Load  │                                │
│                        │ Balancer (NGINX)    │                                │
│                        │ • CORS handling     │                                │
│                        │ • HTTPS termination │                                │
│                        │ • Rate limiting     │                                │
│                        └────────┬────────────┘                                │
│                                 │                                              │
│  ┌──────────────────────────────▼──────────────────────────────────┐          │
│  │              AuthController (REST Endpoints)                    │          │
│  ├──────────────────────────────────────────────────────────────────┤          │
│  │                                                                  │          │
│  │  ┌────────────────────┐ ┌────────────────────┐                 │          │
│  │  │ POST /auth/login   │ │ POST /auth/refresh │                 │          │
│  │  ├────────────────────┤ ├────────────────────┤                 │          │
│  │  │ Request:           │ │ Request:           │                 │          │
│  │  │ • username         │ │ • refreshToken     │                 │          │
│  │  │ • password         │ │                    │                 │          │
│  │  │ • deviceId         │ │ Response:          │                 │          │
│  │  │                    │ │ • accessToken      │                 │          │
│  │  │ Response:          │ │ • expiresIn        │                 │          │
│  │  │ • user             │ │                    │                 │          │
│  │  │ • accessToken      │ │ Status:            │                 │          │
│  │  │ • refreshToken     │ │ • 200 OK           │                 │          │
│  │  │                    │ │ • 401 Unauthorized │                 │          │
│  │  │ Status:            │ │                    │                 │          │
│  │  │ • 200 OK           │ └────────────────────┘                 │          │
│  │  │ • 401 Unauthorized │                                        │          │
│  │  │ • 400 Bad Request  │  ┌────────────────────┐                │          │
│  │  └────────────────────┘  │ POST /auth/logout  │                │          │
│  │                          ├────────────────────┤                │          │
│  │  ┌────────────────────┐  │ Auth: Bearer token │                │          │
│  │  │ GET /auth/verify   │  │                    │                │          │
│  │  ├────────────────────┤  │ Response:          │                │          │
│  │  │ Auth: Bearer token │  │ • message          │                │          │
│  │  │                    │  │                    │                │          │
│  │  │ Response:          │  │ Status:            │                │          │
│  │  │ • userId           │  │ • 200 OK           │                │          │
│  │  │ • roles            │  └────────────────────┘                │          │
│  │  │ • timestamp        │                                        │          │
│  │  └────────────────────┘                                        │          │
│  │                                                                  │          │
│  └──────────────────┬───────────────────────────────────────────────┘          │
│                     │                                                          │
│  ┌──────────────────▼──────────────────────────────────────────────┐          │
│  │     Spring Security 6.x OAuth2 Resource Server                 │          │
│  ├──────────────────────────────────────────────────────────────────┤          │
│  │                                                                  │          │
│  │  ┌──────────────────────────────────────────────────────────┐  │          │
│  │  │ SecurityConfig                                           │  │          │
│  │  ├──────────────────────────────────────────────────────────┤  │          │
│  │  │ • Enable OAuth2 Resource Server                          │  │          │
│  │  │ • Configure JWT decoder                                  │  │          │
│  │  │ • Setup CORS (allowed origins, methods, headers)         │  │          │
│  │  │ • Role-based endpoint protection                         │  │          │
│  │  │   - /api/admin/** → ADMIN, SUPER_ADMIN                  │  │          │
│  │  │   - /api/routes/my-route → FIELD_SALES_REP              │  │          │
│  │  │ • Stateless session (no cookies)                         │  │          │
│  │  │ • Password encoder (BCrypt)                              │  │          │
│  │  └──────────────────────────────────────────────────────────┘  │          │
│  │                          │                                      │          │
│  │  ┌───────────────────────▼──────────────────────────────────┐  │          │
│  │  │ JwtAuthenticationConverter                               │  │          │
│  │  ├──────────────────────────────────────────────────────────┤  │          │
│  │  │ • Extract roles from JWT claims                          │  │          │
│  │  │ • Convert to Spring GrantedAuthorities                   │  │          │
│  │  │ • Add SCOPE_ROLE_ prefix                                 │  │          │
│  │  └──────────────────────────────────────────────────────────┘  │          │
│  │                                                                  │          │
│  └──────────────────────────────────────────────────────────────────┘          │
│                                 │                                              │
│  ┌──────────────────────────────▼──────────────────────────────────┐          │
│  │                  Service Layer                                  │          │
│  ├──────────────────────────────────────────────────────────────────┤          │
│  │                                                                  │          │
│  │  ┌──────────────────────────────────────────────────────────┐  │          │
│  │  │ AuthService                                              │  │          │
│  │  ├──────────────────────────────────────────────────────────┤  │          │
│  │  │ • login(credentials) → validate & generate tokens        │  │          │
│  │  │ • refreshAccessToken(refreshToken)                       │  │          │
│  │  │ • logout(userId) → revoke tokens                         │  │          │
│  │  │ • userHasRole(userId, roleName)                          │  │          │
│  │  │ • canAccessAdmin(userId)                                 │  │          │
│  │  └──────────────┬───────────────────────────────────────────┘  │          │
│  │                 │                                               │          │
│  │  ┌──────────────▼───────────────────────────────────────────┐  │          │
│  │  │ JwtTokenService                                          │  │          │
│  │  ├──────────────────────────────────────────────────────────┤  │          │
│  │  │ • generateAccessToken() → 30-minute duration            │  │          │
│  │  │ • generateRefreshToken() → 14-day duration              │  │          │
│  │  │ • validateToken(token) → check signature                │  │          │
│  │  │ • extractUserId(token)                                   │  │          │
│  │  │ • extractRoles(token)                                    │  │          │
│  │  │ • isTokenExpired(token)                                  │  │          │
│  │  │ • Algorithm: HS512                                       │  │          │
│  │  └──────────────────────────────────────────────────────────┘  │          │
│  │                                                                  │          │
│  └──────────────────────────────────────────────────────────────────┘          │
│                                 │                                              │
│                        ┌────────▼────────────┐                                │
│                        │  Database Layer     │                                │
│                        ├─────────────────────┤                                │
│                        │ PostgreSQL:         │                                │
│                        │ • users table       │                                │
│                        │ • roles table       │                                │
│                        │ • user_roles table  │                                │
│                        │ • token_blacklist   │                                │
│                        │ • login_audit       │                                │
│                        └─────────────────────┘                                │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🔄 Request/Response Flow

```
AUTHENTICATED REQUEST:
┌─────────────┐
│ Mobile App  │
└──────┬──────┘
       │ 1. API request
       │ GET /api/routes/my-route
       │
       ├─→ useAuthApi() hook
       │
       ├─→ AuthenticatedHttpClient.get()
       │   ├─→ SecureTokenStore.getAccessToken()
       │   │   ↓ OS Keychain
       │   ├─→ Add header: "Authorization: Bearer <token>"
       │   └─→ Send request
       │
       ├─ Success (200) ──→ Return response
       │
       └─ Unauthorized (401) ──→ Token Expired
          ├─→ GET refreshToken from SecureStore
          ├─→ POST /api/auth/refresh
          │   └─→ Receive new accessToken
          ├─→ Save new token to SecureStore
          ├─→ Retry original request
          └─→ Return response
```

## 🔐 Role-Based Access Control (RBAC)

```
USER ROLES HIERARCHY:

SUPER_ADMIN
├── Can access: Everything
├── /api/admin/**
├── /api/users/**
├── /api/system/**
└── + all other roles' permissions

ADMIN
├── Can access: Administrative functions
├── /api/admin/**
├── /api/routes/assign/**
├── /api/users/directory
└── Reports & Analytics

FIELD_SALES_REP
├── Can access: Own sales operations
├── /api/routes/my-route
├── /api/customers/my-territory
├── /api/visits/**
└── /api/locations/breadcrumbs


ENDPOINT PROTECTION:

┌────────────────────────────────────────────────┐
│ PUBLIC ENDPOINTS (No authentication)            │
├────────────────────────────────────────────────┤
│ POST /api/auth/login                          │
│ POST /api/auth/refresh                        │
│ POST /api/auth/offline-login                  │
│ GET  /api/health                              │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ ADMIN-ONLY (@PreAuthorize)                    │
├────────────────────────────────────────────────┤
│ GET/POST/PUT/DELETE /api/admin/**             │
│ GET/POST/PUT/DELETE /api/users/**             │
│ POST /api/roles/**                            │
│ POST /api/routes/assign/**                    │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ FIELD REP-ONLY (@PreAuthorize)                │
├────────────────────────────────────────────────┤
│ GET /api/routes/my-route                      │
│ GET /api/customers/my-territory               │
│ GET/POST /api/visits/**                       │
│ GET/POST /api/locations/breadcrumbs           │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ AUTHENTICATED (Any role)                      │
├────────────────────────────────────────────────┤
│ GET  /api/auth/verify                         │
│ POST /api/auth/logout                         │
│ POST /api/auth/lock-screen                    │
└────────────────────────────────────────────────┘
```

## ⏱️ Session Lifecycle

```
LOGIN
  ↓
[Authenticated] → ActivityDetected → ResetTimer
  ↓
3 Minutes No Activity
  ↓
[Locked] → BiometricPrompt
  ↓
BiometricSuccess → [Authenticated]
BiometricFailed → Retry
MaxAttempts → Logout
  ↓
[Logged Out] → Clear All Data
```

## 🔌 Token Refresh Flow

```
Access Token Generated
  ↓
30 minutes
  ↓
29 minutes passed (auto-refresh at 29 min mark)
  ↓
POST /api/auth/refresh
  ├─ refreshToken: <valid 14-day token>
  ├─ Backend validates signature
  └─ Returns new accessToken (30 min validity)
  ↓
Frontend saves to SecureStore
  ↓
Continue using app (24-hour session)
```

## 🏢 Component Dependencies

```
LoginScreen
├── useAuth (context)
├── BiometricManager (service)
├── AuthService (service)
└── SecureTokenStore (persistence)

Dashboard
├── useAuth (context)
├── useAuthApi (hook)
├── AuthenticatedHttpClient (service)
└── ProtectedRoute (component)

LockScreen
├── useAuth (context)
├── BiometricManager (service)
└── useSessionManager (hook)

ProtectedRoute
├── useAuth (context)
└── useHasRole (hook)

AuthenticatedHttpClient
├── SecureTokenStore (persistence)
├── AuthService (service)
└── axios (library)
```

---

This architecture ensures:
✅ Security (Keychain storage, JWT validation)
✅ Reliability (Automatic refresh, offline support)
✅ Performance (Token caching, efficient API calls)
✅ User Experience (Biometric unlock, 24-hour sessions)
✅ Scalability (Stateless backend, horizontal scaling)
