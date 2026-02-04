# 🏗️ Architecture & Technical Decisions

## Current State Analysis

### What's Already Built (75% Complete)

| Component | % Done | Quality | Notes |
|-----------|--------|---------|-------|
| Location Service | 80% | ⭐⭐⭐⭐ | Production-ready, just needs testing |
| GPS Kalman Filter | 90% | ⭐⭐⭐⭐⭐ | Sophisticated signal processing |
| Geofencing Engine | 85% | ⭐⭐⭐⭐ | Ready for integration |
| SQLite Schema | 85% | ⭐⭐⭐⭐ | Well-designed, synced with backend |
| Outbox Pattern | 75% | ⭐⭐⭐⭐ | Guaranteed delivery mechanism |
| Conflict Resolver | 75% | ⭐⭐⭐⭐ | Handles "Server Wins" policy |
| Photo Service | 60% | ⭐⭐⭐ | Needs camera UI + compression |
| Form Engine | 50% | ⭐⭐⭐ | Needs integration with Visit workflow |
| Customer Components | 40% | ⭐⭐ | Directory & profiles exist, need polish |
| Auth System | 20% | ⭐⭐ | PermissionScreens basic, needs JWT flow |
| Navigation/Maps | 30% | ⭐⭐ | MapViewport component partial |
| Visit Workflow | 20% | ⭐⭐ | State machine not implemented |
| **App Shell** | **5%** | 🔴 | **CRITICAL BLOCKER** |
| **Backend API** | **0%** | 🔴 | **CRITICAL BLOCKER** |

---

## Key Decision Points

### 1. Frontend Framework: Expo (React Native)

**Decision**: Use Expo (not bare React Native)  
**Rationale**:
- ✅ Zero configuration for build system
- ✅ Built-in support for location, camera, file system
- ✅ Fast iteration: `expo start` → QR code → instant reload on device
- ✅ Easy testing on physical device (Expo Go app)
- ✅ Simplified permissions handling
- ❌ Limited native module customization (but OK for this app)

**Tech Stack**:
- **React Native**: 0.81.5 (latest stable)
- **Expo**: 54+ with LocationService, Camera, TaskManager plugins
- **State Management**: Context API (sufficient for this size app)
- **Navigation**: expo-router (recommended) or React Navigation
- **TypeScript**: 5.9.2 (type safety)

---

### 2. Backend Framework: Spring Boot (Assumed)

**Decision**: Spring Boot 3.x with PostgreSQL  
**Rationale**:
- ✅ Enterprise-grade security (Spring Security 6.x)
- ✅ Type-safe ORM (JPA/Hibernate)
- ✅ Built-in OAuth2 + JWT support
- ✅ REST API generation from entities
- ✅ Strong ecosystem for mobile sync challenges
- ✅ Schema validation matches types/shared/ definitions

**Tech Stack** (Expected):
```
Spring Boot 3.x
├─ Spring Security 6.x (OAuth2, JWT)
├─ Spring Data JPA (Hibernate)
├─ PostgreSQL 14+
├─ Liquibase (schema versioning)
├─ Swagger/OpenAPI (API documentation)
└─ Spring Test (JUnit 5)
```

**Database**: PostgreSQL 14+ (production-grade, JSONB support, spatial extensions available)

---

### 3. Data Synchronization: Outbox + Delta Sync Pattern

**Decision**: Implement Outbox Queue + Delta Sync instead of simple CRUD  
**Why**:
- ❌ Simple sync fails when rep loses signal mid-operation
- ✅ Outbox ensures "At Least Once" delivery
- ✅ Delta sync minimizes data usage + battery drain
- ✅ Conflict resolution happens server-side
- ✅ Idempotency (request_id) prevents duplicate records

**Flow**:
```
Mobile App:
  User Action → Write to Outbox + Local DB → Immediate UI response
  
Background Sync Service:
  Every 30s (if online):
    - Pull new assignments/customers (if modified since last_synced_at)
    - Push outbox records in batches
    - Merge conflicts (server wins)
    - Mark synced, update timestamps

Server:
  POST /api/sync/push (request_id, entities[])
    - Check idempotency: if request_id seen before, return 200 (already processed)
    - Insert/update entities
    - Return version_number for client to store
    
  GET /api/sync/pull?since=2024-01-22T10:00:00Z
    - Return only modified records since timestamp
    - Minimal payload, maximal efficiency
```

---

### 4. Local Persistence: SQLite (via Expo)

**Decision**: SQLite (not Firebase, not WatermelonDB)  
**Rationale**:
- ✅ Zero dependencies on cloud platform (works offline)
- ✅ Full SQL query support for complex filtering
- ✅ Proven reliability in mobile apps
- ✅ Easy backup/restore (just a file)
- ✅ Expo-sqlite native implementation
- ❌ Manual migration management (but OK with Liquibase on backend)

**Schema Structure**:
- 11 core tables (users, customers, visits, etc.)
- Sync metadata: version_number, is_dirty, last_synced_at, local_id
- Soft deletes: deleted_at timestamp (never physically delete)
- Indices on: user_id, customer_id, route_sequence, visit_date

---

### 5. Authentication: JWT + Biometric

**Decision**: JWT tokens + Expo LocalAuthentication  
**Token Strategy**:
- **Access Token**: 30-minute duration (short-lived)
- **Refresh Token**: 14-day duration (long-lived, stored in OS Keychain)
- **Biometric**: Unlocks local app session (doesn't bypass server auth)

**Flow**:
```
Initial Login:
  1. User enters email + password
  2. POST /auth/login → Server validates
  3. Return: access_token (JWT), refresh_token
  4. Mobile: Store both in Expo SecureStore
  5. Prompt: "Enable FaceID/TouchID for faster unlock?" → Store session flag

Session Resume (after 3-min inactivity):
  1. Show biometric unlock screen
  2. User touches fingerprint reader
  3. If matches → Load access_token from SecureStore → Resume session
  4. If fails → Show password entry

Background Refresh:
  1. If access_token nearing expiry AND refresh_token valid
  2. POST /auth/refresh (silent, no user interaction)
  3. Update access_token in SecureStore
  4. Continue operation seamlessly

Token Expiry Handling:
  1. API request gets 401 response
  2. Try refresh (if refresh_token valid)
  3. If refresh fails → Force logout, redirect to login screen
```

---

### 6. Location Tracking: Kalman Filter + Geofencing

**Decision**: Sophisticated signal processing (not naive GPS)  
**Why**:
- ❌ Raw GPS has errors: urban canyons, reflections, 30m+ inaccuracy
- ✅ Kalman filter (1D) removes noise, produces smooth trajectory
- ✅ Validates: accuracy radius < 30m before accepting
- ✅ Detects teleportation: speed > 150km/h = invalid, rejected
- ✅ Geofence precision: arrival triggers at 50m with > 95% accuracy

**Implementation**:
```typescript
LocationService extends EventEmitter:
  - Background task: Polls GPS every 5-15s (adaptive based on motion)
  - KalmanFilter2D: Smooths lat/lng, reduces noise
  - GeofencingEngine: Monitors distance to all target customers
  - Breadcrumb: Saved every 500m moved + every 30s (local SQLite)
  - Battery: ~4% per 8 hours (aggressive power optimization)
  
Events Emitted:
  - 'location': { lat, lng, accuracy, timestamp }
  - 'arrival': { customerId, timestamp, accuracy_at_arrival }
  - 'exit': { customerId, timestamp }
  - 'error': { message, retryable }
```

**Geofence Targets**: Loaded from route points (customer coordinates + 50m radius)

---

### 7. Photo Management: Aggressive Compression

**Decision**: Compress images to < 350KB before sync  
**Rationale**:
- 🚀 100 photos fit in ~35MB (vs 500MB+ uncompressed)
- ⚡ Sync time: 5-10 seconds on 4G (vs minutes uncompressed)
- 📱 Device storage: Minimal impact even after 1 week of work
- 📸 Quality: Still readable for delivery notes, shelf photos, signatures

**Pipeline**:
```
Capture → Compress → Metadata → Queue → Upload
   ↓         ↓         ↓         ↓       ↓
 Camera    1200px   EXIF/JSON  Outbox  multipart/form-data
  IMG      <350KB    inject     sync     to backend
```

**Naming**:
- Filename: `[CustomerID]_[YYYYMMDD]_[UnixTimestamp].jpg`
- Example: `CUST_001_20240122_1705946400.jpg`
- Metadata: EXIF tags = Lat/Lng/User/Visit embedded in image
- Or: JSON sidecar = `CUST_001_20240122_1705946400.json`

---

### 8. Forms: Dynamic Schema-Driven

**Decision**: Single FormEngine for all visit types (not hardcoded)  
**Rationale**:
- 🔄 Admin changes form questions → Mobile app auto-updates (next sync)
- 🧩 Modular: Stock audits, brand surveys, field notes = same engine
- ✅ Validation: Real-time, schema-based (not scattered in component logic)
- 📊 Data: Stored as JSONB in database (flexible, queryable)

**Form Schema** (JSON, stored on server):
```json
{
  "customerId": "CUST_001",
  "customerType": "wholesale",
  "fields": [
    {
      "id": "stock_unit_a",
      "label": "Units of Product A on shelf?",
      "type": "number",
      "required": true,
      "min": 0,
      "max": 500,
      "placeholder": "e.g., 24"
    },
    {
      "id": "shelf_condition",
      "label": "Shelf condition rating",
      "type": "rating",
      "required": true,
      "scale": 5
    },
    {
      "id": "notes",
      "label": "Any issues observed?",
      "type": "text",
      "required": false,
      "maxLength": 500
    },
    {
      "id": "proof_photo",
      "label": "Shelf proof photo",
      "type": "photo",
      "required": true
    }
  ]
}
```

**Validation**: React Hook Form + Yup/Zod (real-time error display)

---

### 9. State Management: Context API (not Redux)

**Decision**: Context API + useReducer for complex state  
**Rationale**:
- ✅ No extra dependencies (Expo includes React)
- ✅ Sufficient for this app scope (not e-commerce with hundreds of products)
- ✅ Easier to debug than Redux
- ❌ Potential prop-drilling if deeply nested (but use composition)

**Contexts**:
```typescript
<AuthProvider>              // currentUser, isAuthenticated, login, logout
  <LocationProvider>        // currentLocation, isTracking, precisionMode
    <RouteProvider>         // activeRoute, assignedCustomers, routeProgress
      <SyncProvider>        // syncStatus, queueLength, lastSyncTime
        <VisitProvider>     // activeVisit, visitForm, checkInTime
          <App />
        </VisitProvider>
      </SyncProvider>
    </RouteProvider>
  </LocationProvider>
</AuthProvider>
```

**Why Not Redux?**
- ❌ Overkill for this app (5-6 contexts vs 1 reducer)
- ❌ Extra setup time
- ❌ Harder to debug for team unfamiliar with Redux DevTools

---

### 10. Navigation: Expo Router (Recommended)

**Decision**: Expo Router (next-js-style routing)  
**Rationale**:
- ✅ File-based routing (matches web development patterns)
- ✅ Deep linking out of the box
- ✅ Type-safe route parameters
- ✅ Works with Expo seamlessly
- ✅ Monorepo friendly

**Structure**:
```
mobile/app/
├── _layout.tsx         // Root navigator
├── (auth)/
│   ├── login.tsx
│   ├── biometric.tsx
│   └── permissions.tsx
├── (app)/
│   ├── _layout.tsx     // Tab navigator
│   ├── home.tsx
│   ├── map.tsx
│   ├── customers/
│   │   ├── [id].tsx    // Customer profile (dynamic)
│   │   └── _layout.tsx
│   ├── visit/
│   │   ├── [customerId].tsx  // Visit screen
│   │   └── _layout.tsx
│   └── settings.tsx
└── _not-found.tsx
```

**Alternative**: React Navigation (if team prefers traditional stack-based)

---

## Architectural Layers

```
┌─────────────────────────────────────────────────────────┐
│  Presentation Layer (UI Components)                     │
│  - Screens (LoginScreen, NavigationScreen, VisitScreen) │
│  - Components (CustomerProfile, MapViewport, FormField) │
│  - Navigation (Router configuration)                    │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│  Business Logic Layer (Services & Contexts)             │
│  - LocationService (GPS + Kalman + Geofencing)         │
│  - FormEngine (Dynamic form rendering)                  │
│  - NavigationService (Route calculation)                │
│  - PhotoMediaService (Compress + upload)                │
│  - AuthService (Login + token refresh)                  │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│  Data Layer (Persistence & Sync)                        │
│  - DatabaseManager (SQLite initialization)              │
│  - QueryBuilder (Typed queries)                         │
│  - SyncCoordinator (Outbox + Delta sync)                │
│  - ConflictResolver (Merge strategies)                  │
│  - APIClient (Token injection, retry logic)             │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│  Infrastructure Layer                                   │
│  - Expo APIs (Location, Camera, SecureStore, etc.)      │
│  - SQLite (Local persistence)                           │
│  - Axios (HTTP client)                                  │
│  - NetInfo (Network detection)                          │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│  Backend (Spring Boot + PostgreSQL)                     │
│  - Auth Controller + JWT                                │
│  - CRUD Controllers (Customers, Routes, Visits)         │
│  - Sync Reconciliation (conflict resolution)            │
│  - Business Logic (validation, authorization)           │
└─────────────────────────────────────────────────────────┘
```

---

## Integration Points

### Frontend ↔ Backend

| Feature | Frontend | Backend | Protocol |
|---------|----------|---------|----------|
| **Auth** | Login screen + JWT storage | /auth/login + /auth/refresh | HTTPS POST/JSON |
| **Routes** | LocationService (background) | GET /routes/{userId}/{date} | HTTPS GET/JSON |
| **Customers** | Directory component | GET /customers (delta) | HTTPS GET/JSON |
| **Visits** | Visit workflow state machine | POST /visits, GET /visits/{id} | HTTPS POST/JSON |
| **Photos** | Camera UI + compress | POST /photos (multipart) | HTTPS multipart |
| **Sync** | Outbox service | POST /sync/push, GET /sync/pull | HTTPS POST/GET |
| **Conflicts** | Show reconciliation UI | ConflictResolver (server-side) | HTTPS POST/JSON |

---

## Error Handling Strategy

| Scenario | User Sees | Recovery |
|----------|-----------|----------|
| **No internet** | "Working offline - changes saved" badge | Auto-retry on signal return |
| **Login fails** | "Email or password incorrect" | Retry login screen |
| **Visit sync fails** | "Failed to save - 1 retry pending" | Exponential backoff, show queue |
| **Conflict detected** | "Customer info was updated remotely - refreshing" | Server version wins, UI updates |
| **Photo upload fails** | "Photo pending (1 of 3)" | Queued for retry on next sync |
| **App crash** | User resumes visit | Drafts restored from DB |

---

## Performance Targets

| Operation | Target | Why |
|-----------|--------|-----|
| App startup | < 2s | First impression |
| Login | < 3s | Field user impatience |
| Customer search | < 300ms | Real-time feedback |
| Map load | < 1.5s | Navigation essential |
| Form validation | Instant | Per-field feedback |
| Sync cycle | < 5s (4G) | Transparent background task |
| GPS accuracy | > 95% at 50m | Arrival verification |
| Battery impact | < 5% per 8h | All-day shifts |

---

## Security Considerations

| Layer | Strategy |
|-------|----------|
| **Authentication** | JWT (30min access + 14d refresh), biometric unlock local only |
| **Authorization** | RBAC enforced server-side (FIELD_SALES_REP vs ADMIN) |
| **Transport** | HTTPS only (no HTTP) |
| **Token Storage** | Expo SecureStore (OS keychain, not AsyncStorage) |
| **Data Validation** | Server-side validation of all inputs |
| **SQL Injection** | Parameterized queries via ORM (JPA) |
| **Secrets** | Never commit API keys/passwords (use env vars) |
| **Biometrics** | Never authenticate to server (local session unlock only) |
| **Device Binding** | (Optional) Tie JWT to device ID for multi-device attack prevention |

---

## Deployment Strategy

### Frontend (Mobile)

**Development**: `expo start` → QR code scan  
**Testing**: EAS Build (Expo's CI/CD) → APK/IPA for TestFlight/Google Play  
**Production**: Store submissions via EAS Submit

### Backend (Spring Boot)

**Development**: Local Spring Boot server  
**Testing**: Docker container locally or cloud VM  
**Production**: Cloud deployment (AWS EC2, Azure App Service, GCP Cloud Run)

---

## Monitoring & Observability

### Frontend
- **Sentry** or **Bugsnag** for crash reporting
- **Local logs** for field debugging (downloadable via Settings)
- **User analytics** (opt-in): Session duration, feature usage, crash-free rate

### Backend
- **Spring Boot Actuator** + **Prometheus** for metrics
- **ELK Stack** or **DataDog** for centralized logging
- **PagerDuty** for critical alerts

---

## Cost Estimates

| Component | Estimated Cost (Monthly) | Notes |
|-----------|--------------------------|-------|
| PostgreSQL | $15-50 | Cloud-hosted (AWS RDS, Azure DB) |
| Spring Boot hosting | $20-100 | VM or container platform |
| CDN (photos) | $5-50 | Based on upload volume |
| Analytics | $0-100 | Sentry free tier, then paid |
| **Total** | **$40-300** | Scales with user count & data volume |

---

## Open Questions & Decisions Needed

1. **Backend Deployment**: AWS? Azure? GCP? On-prem?
2. **Photo Storage**: Database BLOB or cloud storage (S3, Azure Blob)?
3. **Real-time Features**: Need live tracking? Or periodic sync OK?
4. **Admin Portal**: Web-based or mobile app?
5. **Multi-language**: English only or support Swahili/local languages?
6. **Analytics**: Track field rep behavior? Performance metrics?
7. **Audit Trail**: Keep full history of all changes for compliance?

---

**Document Created**: January 22, 2026  
**Last Updated**: January 22, 2026  
**Status**: Ready for development
