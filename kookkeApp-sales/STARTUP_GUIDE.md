# Kookee Sales Route Guidance App - Startup Guide

## 📋 Project Status

**Architecture**: 8-Agent Distributed System (React Native Expo + Spring Boot Backend)

### Implementation Status by Agent

| Agent | Status | Key Files | Next Steps |
|-------|--------|-----------|-----------|
| **Data Architecture** | ✅ 70% | `database/SCHEMA.md`, `database/schema.sql`, `mobile/src/services/database/` | Complete Java POJOs, finalize backend migrations |
| **Auth & User Management** | 🟡 20% | `mobile/src/screens/PermissionScreens.tsx` | Implement JWT flow, biometrics, RBAC |
| **GPS & Location Services** | ✅ 80% | `mobile/src/services/location/LocationService.ts`, `kalmanFilter.ts`, `geofencingEngine.ts` | Watchdog, battery testing |
| **Navigation & Mapping** | 🟡 30% | `src/components/mapping/`, `NavigationService.ts` | React-native-maps integration, polylines |
| **Customer & Route Management** | 🟡 25% | `src/components/CustomerDirectory.tsx`, `CustomerListItem.tsx`, `RouteSequencer.tsx` | Fuzzy search, drag-drop sequencing |
| **Visit Workflow** | 🟡 20% | `src/services/FormEngine.ts`, `VisitWorkflowContext.tsx` | State machine, form validation, resilience |
| **Photo & Media Management** | 🟡 15% | `src/services/PhotoMediaService.ts` | Camera UI, compression, metadata tagging |
| **Offline & Sync Strategy** | ✅ 75% | `mobile/src/services/sync/`, `outbox.ts`, `conflictResolver.ts` | Network awareness, batching, exponential backoff |

---

## 🚀 Quick Start (Development)

### Prerequisites
- **Node.js** 16+ 
- **npm** or **yarn**
- **Expo CLI**: `npm install -g expo-cli`
- **Android Emulator** or **iOS Simulator** (or physical device with Expo Go app)

### Step 1: Install Dependencies

```bash
# Root workspace
npm install

# Mobile app
cd mobile
npm install
cd ..

# Main React Native app  
npm install

# Sales admin app (if needed)
cd sales-app
npm install
cd ..
```

### Step 2: Start the Development Server

```bash
# From workspace root, start the main mobile app
npm start

# OR from mobile/ directory
cd mobile
npm start
```

### Step 3: Choose Your Platform
- **iOS**: Press `i` in Expo terminal
- **Android**: Press `a` in Expo terminal  
- **Physical Device**: Use Expo Go app, scan QR code
- **Web**: Press `w` (limited functionality)

---

## 📁 Project Structure Explained

```
kookkeApp-sales/
├── database/                          # Backend schema definitions
│   ├── SCHEMA.md                     # Data dictionary & field docs
│   ├── schema.sql                    # PostgreSQL DDL
│   └── schema_ddl.sql                # Alternative DDL format
│
├── mobile/                            # MAIN APP (Field sales rep)
│   ├── src/
│   │   ├── services/
│   │   │   ├── location/             # 🎯 GPS, Kalman filter, geofencing
│   │   │   ├── database/             # SQLite persistence layer
│   │   │   └── sync/                 # Outbox pattern, conflict resolution
│   │   ├── screens/
│   │   │   └── PermissionScreens.tsx # Initial auth/permissions
│   │   └── contexts/
│   └── App.tsx                        # Entry point (NEEDS BUILD-OUT)
│
├── sales-app/                         # Admin/Dispatcher app (optional)
│   └── App.js
│
├── src/                               # Shared components & services
│   ├── components/
│   │   ├── mapping/                  # Map views (partially done)
│   │   ├── navigation/               # Bottom sheet, progress overlay
│   │   ├── visit/                    # Visit workflow UI
│   │   └── customerManagement/       # Directory, profiles
│   ├── services/
│   │   ├── FormEngine.ts             # Dynamic form rendering
│   │   ├── NavigationService.ts      # Route calculation
│   │   └── PhotoMediaService.ts      # Photo capture/compression
│   ├── contexts/
│   │   ├── CustomerManagementContext.tsx
│   │   └── VisitWorkflowContext.tsx
│   └── screens/
│       └── NavigationScreen.tsx
│
└── types/                             # TypeScript models
    ├── shared/
    │   ├── models/
    │   │   └── base.ts, customer.ts, location.ts, visit.ts
    │   └── java/                     # Backend POJOs (Spring Boot)
    └── customerManagement.ts

```

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    MOBILE APP (React Native)                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  UI Layer (Components)                               │  │
│  │  - Customer Directory & Profiles                     │  │
│  │  - Navigation & Maps                                 │  │
│  │  - Visit Workflow Forms                              │  │
│  │  - Photo Capture                                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                         ↓                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Business Logic (Services & Contexts)                │  │
│  │  - LocationService (GPS + Kalman + Geofencing)      │  │
│  │  - FormEngine (Dynamic form rendering)              │  │
│  │  - NavigationService (Route calc)                    │  │
│  │  - PhotoMediaService (Compress + Upload)            │  │
│  └──────────────────────────────────────────────────────┘  │
│                         ↓                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Data Layer (Local Persistence)                      │  │
│  │  - SQLite (via expo-sqlite)                          │  │
│  │  - Outbox Pattern (guaranteed delivery)             │  │
│  │  - Conflict Resolution                               │  │
│  │  - Delta Sync Protocol                               │  │
│  └──────────────────────────────────────────────────────┘  │
│                         ↓ HTTPS                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Backend (Spring Boot)                               │  │
│  │  - REST API (/api/visits, /api/customers, etc.)     │  │
│  │  - JWT Auth + RBAC                                   │  │
│  │  - PostgreSQL Database                               │  │
│  │  - Sync Reconciliation                               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Implementation Priority (Next 30 Days)

### Phase 1: Core Foundation (Days 1-10)
- [ ] **Backend Setup**: Spring Boot project, PostgreSQL schema, API stubs
- [ ] **Auth Flow**: Login screen → JWT tokens → Biometric unlock
- [ ] **App Shell**: Main navigation stack, tab/drawer navigation
- [ ] **Database Init**: SQLite schema on mobile, verify sync schema

**Deliverable**: App boots → Login → Home screen shows placeholder

---

### Phase 2: Navigation & Location (Days 11-20)
- [ ] **Map Integration**: react-native-maps, marker clustering, polylines
- [ ] **Location Tracking**: Background GPS service, Kalman filtering
- [ ] **Route Sequence**: Drag-and-drop route editor, distance calculation
- [ ] **Customer Directory**: Paginated list, fuzzy search, profile view

**Deliverable**: Rep can see map, assigned route, upcoming customers

---

### Phase 3: Visit Workflow (Days 21-30)
- [ ] **Visit State Machine**: Arrived → Check-In → Forms → Check-Out
- [ ] **Dynamic Forms**: Stock counts, field notes, photo uploads
- [ ] **Photo Capture**: Camera UI, compression, metadata tagging
- [ ] **Optimistic UI**: Show pending/synced status badges

**Deliverable**: Rep can complete an end-to-end visit offline

---

### Phase 4: Sync & Polish (Days 31+)
- [ ] **Sync Engine**: Pull assignments, push visit results, handle conflicts
- [ ] **Network Awareness**: Exponential backoff, batching, low-bandwidth mode
- [ ] **Error Handling**: Crash recovery, data validation, user feedback
- [ ] **Performance & Testing**: Battery consumption, sync speed, conflict scenarios

**Deliverable**: Production-ready, tested, ready for field pilot

---

## 🔧 Development Commands

### Mobile App
```bash
cd mobile

# Start Expo dev server
npm start

# Run on Android emulator
npm run android

# Run on iOS simulator
npm run ios

# Run on web (limited)
npm run web
```

### Type Generation
```bash
# Generate TypeScript types from schema (if setup exists)
npm run generate:types

# Generate Java POJOs from types
npm run generate:pojos
```

### Database Utilities
```bash
# Initialize SQLite on device
npm run db:init

# Migrate schema version
npm run db:migrate

# Backup local database
npm run db:backup
```

---

## 🔐 Key Environment Setup

### Mobile App (`.env` in `mobile/` or `app.json`)
```javascript
{
  "expo": {
    "plugins": [
      "expo-location",           // GPS permissions
      "expo-camera",             // Photo capture
      "expo-task-manager",       // Background tasks
      "expo-background-fetch",   // Background sync
      "expo-secure-store"        // Token storage
    ],
    "android": {
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    "ios": {
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "...",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "...",
        "NSCameraUsageDescription": "..."
      }
    }
  }
}
```

### Backend (Spring Boot `application.yml`)
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/kookee_sales
    username: postgres
    password: xxx
  jpa:
    hibernate:
      ddl-auto: validate  # Use schema.sql instead
      
server:
  servlet:
    context-path: /api
jwt:
  secret: (generate with: openssl rand -base64 32)
  access-token-expiry: 30m
  refresh-token-expiry: 14d
```

---

## 📱 Testing Scenarios (Per Agent)

### GPS Service
```
1. "The Underground Test": Enter basement, verify no crash, resumes in 10s
2. "Geofence Boundary": Walk toward customer, onArrival fires at 50m threshold
3. "Power Saver Mode": Enable Battery Saver, verify still logs (reduced freq)
```

### Sync Engine
```
1. "The Elevator Test": Check-in → signal loss → complete visit → resume at signal
2. "Version Conflict": Modify customer on admin panel & mobile, verify merge
3. "Massive Queue": Fill with 200 visits + 5000 breadcrumbs, verify batching
```

### Visit Workflow
```
1. "Crash Recovery": Start visit → fill 5 fields → hard-close app → reopen
2. "Validation": Attempt invalid stock count → error appears
3. "Double Check-In": Try check-in while already checked-in → prompt to close first
```

---

## 📚 Documentation Files to Review

1. **[database/SCHEMA.md](database/SCHEMA.md)** - Entity relationships, sync fields, validation rules
2. **[mobile/src/services/location/GPS_IMPLEMENTATION_GUIDE.md](mobile/src/services/location/GPS_IMPLEMENTATION_GUIDE.md)** - Location engine architecture
3. **[mobile/src/services/location/PROJECT_SUMMARY.md](mobile/src/services/location/PROJECT_SUMMARY.md)** - Summary of location module
4. **[mobile/src/services/location/QUICK_REFERENCE.md](mobile/src/services/location/QUICK_REFERENCE.md)** - API quick reference

---

## 🐛 Known Issues & Gaps

| Issue | Severity | Fix |
|-------|----------|-----|
| `mobile/App.tsx` is skeleton | 🔴 HIGH | Build main app shell with navigation stacks |
| No authentication UI | 🔴 HIGH | Implement login screen + JWT flow |
| Maps component incomplete | 🔴 HIGH | Integrate react-native-maps + polylines |
| Visit forms not connected | 🔴 HIGH | Wire FormEngine → VisitWorkflowContext |
| Photo upload untested | 🟡 MEDIUM | Test multipart uploads, compression |
| Network error handling sparse | 🟡 MEDIUM | Add user-facing retry UI, toast notifications |
| No API client setup | 🔴 HIGH | Create Axios wrapper with token injection |

---

## 🎯 Immediate Next Steps

1. **Build the Mobile App Shell** (2-3 hours)
   ```bash
   cd mobile
   # Replace App.tsx with proper navigation structure
   # Install: expo-router or React Navigation
   npm install expo-router (or react-navigation, react-native-screens, etc.)
   ```

2. **Setup Backend Scaffold** (2-3 hours)
   ```bash
   # Create Spring Boot project
   # Database: PostgreSQL with schema from database/schema.sql
   # API stubs: /auth/login, /routes/{userId}, /customers, /visits
   ```

3. **Implement Login Screen** (4-6 hours)
   - Wire PermissionScreens.tsx
   - Add JWT token storage in Expo SecureStore
   - Add biometric unlock flow

4. **Connect Database Layer** (3-4 hours)
   - Verify mobile/src/services/database/database.ts initializes
   - Run schema migrations
   - Test CRUD operations

5. **Test Location Service** (2-3 hours)
   - Verify LocationService starts background task
   - Test geofence arrival detection
   - Monitor battery impact

---

## 📞 Quick Reference: Agent APIs

### LocationService
```typescript
const locationService = new LocationService(config, dbManager);
locationService.start(); // Begin tracking
locationService.on('arrival', (event) => { /* handle arrival */ });
```

### OutboxService
```typescript
const outbox = new OutboxService(db);
await outbox.add('visit', visitData); // Queue mutation
await outbox.sync(); // Push to server
```

### FormEngine
```typescript
const engine = new FormEngine(formSchema, initialData);
const validation = await engine.validate(); // Real-time validation
const submission = engine.serialize(); // Convert to JSON
```

---

## 💡 Pro Tips

- **Use Airplane Mode** for offline testing
- **Device logs**: `expo logs` or Android Studio logcat
- **Performance profiling**: React DevTools Profiler
- **SQLite debugging**: Use `adb pull` to extract `.db` file from device
- **Network throttling**: Android Emulator settings → Extended controls → Network

---

## 📖 Agent Prompt File Location
[agent prompts.txt](agent%20prompts.txt) - Complete specifications for all 8 agents

---

**Last Updated**: January 2026 | **Status**: Development in Progress
