# 🎯 Development Roadmap & Task Breakdown

## Phase 1: Foundation (Weeks 1-2) - CRITICAL PATH

### 1.1 Backend Infrastructure Setup
- [ ] **Create Spring Boot Project**
  - Spring Boot 3.x starter
  - Gradle/Maven configuration
  - PostgreSQL driver setup
  - Location: `~/backend/` (separate from monorepo, or `backend/` in root)
  
- [ ] **Database Schema Migration**
  - Review `database/schema.sql`
  - Create PostgreSQL database: `CREATE DATABASE kookee_sales`
  - Run DDL: `psql kookee_sales < database/schema.sql`
  - Verify tables created (11 core tables)
  - Test foreign key constraints
  
- [ ] **REST API Scaffolding**
  - AuthController: `POST /auth/login`, `POST /auth/refresh`
  - UserController: `GET /users/{id}`
  - RouteController: `GET /routes/{userId}/{date}`
  - CustomerController: `GET /customers`, `GET /customers/{id}`
  - VisitController: `POST /visits`, `GET /visits/{userId}/{date}`
  - Use Spring Data JPA with custom repositories
  
- [ ] **JWT & Security Setup**
  - Spring Security 6.x with OAuth2 Resource Server
  - Configure token expiry (30min access, 14d refresh)
  - Add RBAC: FIELD_SALES_REP, ADMIN, SUPER_ADMIN
  - Implement permission checks on all endpoints

**Effort**: 3-4 days | **Owner**: Backend Dev | **Blocker**: None

---

### 1.2 Mobile App Shell & Navigation
- [ ] **App.tsx Rebuild** (Replaces skeleton)
  - Install: `expo-router` (or `react-navigation`)
  - Create stack structure:
    ```
    <AuthStack>
      - LoginScreen
      - BiometricUnlockScreen
      - PermissionScreen
    </AuthStack>
    <AppStack>
      - HomeScreen (Dashboard)
      - NavigationScreen (Map)
      - CustomerDirectoryScreen
      - VisitWorkflowScreen
      - SettingsScreen
    </AppStack>
    ```
  - Setup: NavigationContainer, linking configuration, initial route logic

- [ ] **Context Providers**
  - AuthContext: `currentUser`, `isAuthenticated`, `login()`, `logout()`
  - UserContext: `roles`, `permissions`
  - RouteContext: `currentRoute`, `assignedCustomers`
  - LocationContext: `currentLocation`, `isTracking`
  - All wrapped at root in App.tsx

- [ ] **Secure Token Storage**
  - Install: `expo-secure-store`, `axios`
  - Create `services/api/authClient.ts`:
    ```typescript
    const authClient = axios.create({
      baseURL: 'https://api.kookee.com/api',
      interceptors: {
        request: (config) => {
          const token = await SecureStore.getItemAsync('access_token');
          if (token) config.headers.Authorization = `Bearer ${token}`;
          return config;
        },
        response: (error) => {
          if (error.response?.status === 401) {
            // Refresh token logic
          }
        }
      }
    });
    ```

**Effort**: 2-3 days | **Owner**: Frontend Dev | **Blocker**: Backend auth endpoints

---

### 1.3 Authentication UI & Login Flow
- [ ] **Login Screen** (Reference: design mockups)
  - Central logo, "Sales Route Guide" title
  - Email/Username field
  - Password field + "Show/Hide" toggle
  - "Login" button (blue, prominent)
  - Error message display
  - Loading spinner
  
- [ ] **Biometric Unlock**
  - Install: `expo-local-authentication`
  - On successful login: prompt user "Enable biometric unlock?"
  - Store encrypted session token in SecureStore
  - On app resume: offer biometric unlock before requiring password again
  - Implement 3-minute inactivity lock
  
- [ ] **Permission Request Flow** (Already in PermissionScreens.tsx)
  - Location: Always Allow (educate: "Verify you're at customer")
  - Camera: Allow (educate: "Capture product photos")
  - Contacts: Allow (educate: "Call/WhatsApp customer")
  - Implement "Skip" with warning for non-critical permissions

**Effort**: 2-3 days | **Owner**: Frontend Dev | **Blocker**: Backend `/auth/login`

---

### 1.4 Database Initialization & Sync Foundation
- [ ] **Verify database/database.ts initialization**
  - Test `DatabaseManager.initialize()` on app startup
  - Run `CREATE_TABLES` + `CREATE_INDEXES` from `schema.ts`
  - Log: "Database initialized at version X"
  
- [ ] **Setup Outbox Table** (If not already in schema)
  ```sql
  CREATE TABLE outbox (
    id UUID PRIMARY KEY,
    entity_type VARCHAR(50),    -- 'visit', 'breadcrumb', 'photo'
    entity_id UUID,
    data JSONB,
    status VARCHAR(20),         -- 'pending', 'syncing', 'synced'
    retry_count INT DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMP,
    synced_at TIMESTAMP
  );
  ```
  
- [ ] **Create sync/SyncCoordinator.ts**
  - `enqueueMutation(entity)` → Writes to Outbox
  - `startSync()` → Pulls assignments, pushes outbox, handles conflicts
  - `isConnected()` → Uses react-native-netinfo
  - Implement exponential backoff: 2s, 4s, 8s, 30s, 5m, 30m, never

**Effort**: 1-2 days | **Owner**: Backend/Frontend | **Blocker**: None

---

## Phase 2: Navigation & Location (Weeks 3-4)

### 2.1 GPS & Background Location
- [ ] **LocationService Integration Test**
  - Already implemented in `mobile/src/services/location/LocationService.ts`
  - Verify `start()` method registers background task
  - Check: Kalman filtering active, breadcrumbs saved to SQLite
  - Monitor: Battery consumption < 5% per 8 hours
  
- [ ] **Geofence Arrival Detection**
  - Set geofence targets from route points
  - Test: Walk toward customer, trigger arrival at 50m
  - Emit: ArrivalEvent with customerId, timestamp, GPS accuracy
  - Persist: Write arrival to database (for sync later)

- [ ] **Location Permissions & Privacy**
  - iOS: "Always Allow" prompt in PermissionScreens
  - Android: Request ACCESS_FINE_LOCATION + ACCESS_COARSE_LOCATION
  - Show: "This app needs location to verify you're at customer locations"
  - Handle: "While Using" vs "Always" states gracefully

**Effort**: 2-3 days | **Owner**: GPS/Location Dev | **Blocker**: None

---

### 2.2 Maps & Navigation UI
- [ ] **Integrate react-native-maps**
  - Install: `react-native-maps` (or use `expo-maps` if compatible)
  - Test on Android emulator + iOS simulator
  
- [ ] **Build MapViewport component** (Already partial in src/components/mapping/)
  - Display user's current location
  - Show assigned route as blue polyline
  - Cluster customer markers (100+ markers without lag)
  - Implement: Camera follow while navigating, "Free-Look" mode when user pans
  
- [ ] **Next Customer Card** (Bottom sheet)
  - Show: Name, category, distance, ETA
  - Recalculate ETA every 60s
  - Update distance in real-time from LocationService
  - "Navigate" button → Open native Maps app (Google Maps / Waze)
  
- [ ] **Route Progress Overlay**
  - Show: "3 of 12 customers completed"
  - Animated progress circle (not just bar)
  - Color gradient: Green → Yellow → Red based on route % complete

**Effort**: 3-4 days | **Owner**: Maps Dev | **Blocker**: LocationService working

---

### 2.3 Customer Directory & Profiles
- [ ] **Customer Directory Screen**
  - Paginated FlashList with 1000+ customers
  - Fuzzy search: "Luk" → "Lukaya Supermarket"
  - Filters: Category, "Visited Today", "Nearby"
  - Sort: Distance, Name, Recent visit
  - Pull-to-refresh to sync latest from server
  
- [ ] **Customer Profile Screen**
  - Header: Photo + customer name + status badge
  - Contact section: Phone (tap to call), WhatsApp (tap to message)
  - Location: GPS pin + "Update Pin" button
  - "What to Expect": Bulleted list (shelves to fill, freezer present, etc.)
  - "Visit History": Last 3 visits with notes
  - "Quick Actions": Check-In button (floating, follows scroll)
  
- [ ] **Pin Verification Tool**
  - Mini-map in profile
  - User can drag pin to correct location
  - Save → Update in local DB → Mark as dirty (sync on next pull)

**Effort**: 3-4 days | **Owner**: Frontend Dev | **Blocker**: Customer data from backend

---

## Phase 3: Visit Workflow (Weeks 5-6)

### 3.1 Visit State Machine & Forms
- [ ] **Implement Visit Lifecycle**
  - States: `NOT_STARTED` → `ARRIVED` → `CHECKED_IN` → `IN_PROGRESS` → `CHECKED_OUT` → `COMPLETED`
  - Illegal transitions: Block "Check-In" if already at another customer
  - Persist: Every state change → timestamp + GPS coords → outbox
  
- [ ] **Dynamic Form Engine** (Already partial in src/services/FormEngine.ts)
  - Load form schema based on customer type
  - Input types: Text, Number, Choice, Star Rating, Photo
  - Validation: Real-time error display (min/max, required fields)
  - Required vs Optional: Show in form header checklist
  - Auto-save drafts to `visit_drafts` table on blur
  
- [ ] **Form Field Examples**
  - Stock Audit: "Units on shelf for product X" (number input)
  - Brand Presence: "Display quality at customer" (star rating)
  - Field Notes: "Any issues observed?" (free text)
  - Photo Proof: "Shelf photo" (camera button)
  
- [ ] **Check-Out Lock Logic**
  - "Check-Out" button stays disabled until:
    - All mandatory fields are filled
    - At least one photo uploaded (if required)
    - GPS confirms still in geofence (or manual override)
  - Once clicked: Show "Job Well Done" summary

**Effort**: 3-4 days | **Owner**: Frontend Dev | **Blocker**: Customer metadata (form schemas)

---

### 3.2 Photo Capture & Management
- [ ] **Camera UI** (expo-camera)
  - Tap-to-focus, manual flash toggle
  - "Guideline overlay" (ghost box for framing)
  - Review/Retake/Save loop (minimize taps)
  
- [ ] **Image Compression Pipeline**
  - Resize to max 1200px (longest edge)
  - Compress JPEG to < 350KB
  - Auto-orient based on device rotation
  - Generate unique filename: `[CustomerID]_[YYYYMMDD]_[UnixTime].jpg`
  
- [ ] **Metadata Tagging**
  - Inject EXIF: Latitude, Longitude, Timestamp, User ID, Customer ID, Visit ID
  - Or: Create JSON sidecar file with metadata
  - Store photos in `/data/kookee/media/pending/` until synced
  
- [ ] **Media Gallery Component**
  - Lazy-load thumbnails (100+ photos responsive)
  - Full-screen preview with swipe
  - Soft-delete (move to trash, not permanent)
  - Show sync status badge (Pending / Synced)

**Effort**: 2-3 days | **Owner**: Media Dev | **Blocker**: Backend photo endpoint

---

### 3.3 Crash Recovery & Resilience
- [ ] **Draft Persistence**
  - Every form field change → Write to `visit_drafts` table
  - On app resume: Check for active visit → auto-navigate to it
  - Load all draft data back into form
  - Resume exactly where user left off
  
- [ ] **Visit Integrity Checks**
  - Prevent orphaned visits (visit without customer_id)
  - Check: Started at customer A, checked in at B → Warn user
  - Validate: Check-out GPS within geofence or require reason
  
- [ ] **Error Toast Notifications**
  - "Failed to save draft: [error]" with "Retry" button
  - "Offline: Changes saved locally, will sync when online"
  - Success: "Visit saved to queue ✓"

**Effort**: 1-2 days | **Owner**: Frontend Dev | **Blocker**: None

---

## Phase 4: Sync & Polish (Weeks 7+)

### 4.1 Full Sync Engine
- [ ] **Pull Cycle**
  - Fetch user's assignments for today
  - Fetch customer list (full or delta based on `last_synced_at`)
  - Fetch route metadata, territory info
  - Save to local SQLite, mark synced timestamp
  
- [ ] **Push Cycle**
  - Query Outbox for all `pending` records
  - Batch into chunks (20 items per request)
  - POST to backend with `request_id` (idempotency key)
  - On success: Update Outbox status → `synced`
  - On failure: Increment retry_count, schedule retry
  
- [ ] **Conflict Resolution**
  - Policy: "Server Wins" (server data overrides local)
  - Compare: version_number on customer/visit
  - If conflict: Log warning, keep server version, drop local changes
  - UI notification: "Customer info updated from server"
  
- [ ] **Network Awareness**
  - Monitor: Wi-Fi vs Cellular vs Offline
  - High-speed: Sync on interval (30s)
  - Low-bandwidth: Defer non-critical syncs (photos, breadcrumbs)
  - Manual: User-initiated "Force Sync" button always works
  
- [ ] **Exponential Backoff**
  - 1st retry: 2s
  - 2nd: 4s, 3rd: 8s, 4th: 30s, 5th: 5m, 6th+: 30m
  - Reset on successful sync
  - User notification: "Retrying in 30 minutes..."

**Effort**: 3-4 days | **Owner**: Backend/Sync Dev | **Blocker**: Backend sync endpoints

---

### 4.2 Testing & Validation
- [ ] **Test Scenarios** (From agent prompts)
  - "Elevator Test": Offline → online → verify upload
  - "Conflict Test": Modify customer on admin + mobile → sync → verify merge
  - "Massive Queue": 200 visits + 5000 breadcrumbs → verify batching
  - "Crash Recovery": Kill app mid-visit → reopen → verify resume
  - "Validation": Invalid input → error shown → cannot submit
  
- [ ] **Performance Benchmarks**
  - Map load: < 1.5s
  - List search: < 300ms
  - Sync cycle: < 5s (on 4G)
  - Battery: < 5% per 8 hours
  
- [ ] **Battery & Memory Profiling**
  - Use Android Profiler / Xcode Instruments
  - Monitor: Background location service
  - Reduce: Update intervals if battery impact > 5%

**Effort**: 2-3 days | **Owner**: QA / Full Team | **Blocker**: All features implemented

---

### 4.3 Production Readiness
- [ ] **Error Handling Cleanup**
  - All network calls: Try-catch + user-facing toast
  - Validation: Clear error messages for each field
  - Edge cases: No customers assigned, customer deleted remotely, etc.
  
- [ ] **Logging & Monitoring**
  - Create service: `services/logging/Logger.ts`
  - Log key events: Login, sync start/end, errors
  - Send to backend or local file for debugging
  - User can access logs via Settings screen
  
- [ ] **Documentation**
  - Code comments on complex logic (Kalman filter, conflict resolution)
  - README for backend setup
  - Troubleshooting guide for field reps
  
- [ ] **Security Audit**
  - Verify: No hardcoded secrets
  - Tokens stored in SecureStore (not AsyncStorage)
  - API calls use HTTPS only
  - Permissions requested only when needed

**Effort**: 2-3 days | **Owner**: Full Team | **Blocker**: All above phases

---

## Dependency Graph

```
Auth Flow
├── Backend: /auth/login, /auth/refresh
├── Frontend: LoginScreen, BiometricUnlock
└── Blocker: None (can start immediately)

Location Service
├── Backend: /routes/{userId} (to get geofences)
├── Frontend: LocationService.ts (already 80% done)
├── GPS Permissions in PermissionScreens
└── Blocker: Route assignment from backend

Maps & Navigation
├── Backend: /customers (full list with coords)
├── Frontend: MapViewport, NavigationService
├── Dependency: LocationService + Backend /customers
└── Blocker: Customer data loaded

Visit Workflow
├── Backend: /visits (POST to create)
├── Frontend: FormEngine, Visit state machine
├── Dependency: Customer profiles loaded, location verified
└── Blocker: Customer form schemas defined

Photo Management
├── Backend: /photos/upload (multipart)
├── Frontend: Camera UI, compression
├── Dependency: Visit workflow
└── Blocker: Photo endpoint ready

Sync Engine
├── Backend: /sync endpoints (for bulk push/pull)
├── Frontend: Outbox, ConflictResolver
├── Dependency: All features above
└── Blocker: Backend sync reconciliation logic
```

---

## Team Allocation (Example)

```
Week 1-2 (Foundation):
- Backend Dev 1: Spring Boot setup + Auth endpoints
- Backend Dev 2: Database schema + Customer/Route endpoints
- Frontend Dev 1: App shell + Auth screens + Navigation structure
- Frontend Dev 2: Database initialization + Outbox setup

Week 3-4 (Location & Maps):
- Location Dev: Verify LocationService + Geofencing
- Maps Dev: react-native-maps integration + UI polish
- Frontend Dev 1: Customer directory + profiles
- Backend Dev 1: /customers endpoint optimization

Week 5-6 (Visits):
- Frontend Dev 2: Visit workflow state machine
- Media Dev: Camera UI + compression pipeline
- Backend Dev 1: /visits endpoint + form schema storage
- QA: Manual testing of workflows

Week 7+ (Sync & Polish):
- Sync Dev: Outbox → server push + conflict resolution
- Backend Dev 2: Sync reconciliation endpoints
- QA: Scenario testing (elevator, conflicts, crashes)
- Full Team: Polish, performance tuning, security audit
```

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Backend API delays | Medium | High | Mock API responses in frontend, develop in parallel |
| Location permissions issues | Low | Medium | Test on real devices early, document Android/iOS differences |
| Sync conflicts too common | Low | High | Implement version-number + timestamp strategy, minimize offline edits |
| Battery drain too high | Medium | High | Profile early, reduce update frequency in "idle" state |
| Photo upload failures | Medium | Medium | Implement resumable uploads, retry with exponential backoff |
| Data corruption on crash | Low | Critical | Always write to outbox BEFORE processing, implement crash recovery tests |

---

**Last Updated**: January 2026 | Update as milestones complete
