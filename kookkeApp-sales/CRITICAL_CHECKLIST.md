# ✅ CRITICAL STARTUP CHECKLIST

## 🔴 BLOCKER ISSUES (Fix Before Running App)

### 1. mobile/App.tsx is a Skeleton
**Issue**: Current file has just basic "Hello World"  
**Impact**: App won't navigate anywhere  
**Fix Required** (2-3 hours):
```tsx
// Replace mobile/App.tsx with proper navigation structure
// Option A: Use expo-router (recommended for monorepos)
npm install expo-router expo-splash-screen
// Option B: Use react-navigation
npm install @react-navigation/native @react-navigation/stack react-native-screens

// Create app routing:
// mobile/src/navigation/AuthNavigator.tsx (Login, Permissions)
// mobile/src/navigation/AppNavigator.tsx (Home, Map, Visit, Settings)
// mobile/App.tsx coordinates between them based on authState
```

### 2. No Backend API Available
**Issue**: Mobile app needs to call `/auth/login`, `/customers`, `/visits` endpoints  
**Impact**: Cannot authenticate or load data  
**Fix Options**:
- **Option A (Recommended)**: Create Spring Boot backend
  - Location: Create `backend/` directory separate from monorepo
  - Use `database/schema.sql` as starting point
  - Implement: `src/main/java/com/kookee/sales/` with controllers
  - Estimated: 3-5 days for MVP (auth + CRUD endpoints)
  
- **Option B (Quick Start)**: Create mock API
  - Use: `json-server` or `miragejs` in frontend
  - Create: `mobile/mockAPI/` with static responses
  - Pros: Start mobile development immediately
  - Cons: Can't test actual sync conflicts/errors
  ```bash
  npm install --save-dev json-server
  echo '{ "users": [], "customers": [], "visits": [] }' > db.json
  json-server --watch db.json --port 3000
  ```

### 3. Mobile App Doesn't Initialize Database
**Issue**: SQLite database not created on first run  
**Impact**: Outbox, breadcrumbs, drafts have nowhere to persist  
**Fix Required** (1-2 hours):
```tsx
// In mobile/App.tsx or mobile/App.tsx:
import { DatabaseManager } from './src/services/database/database';

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  
  useEffect(() => {
    const initDB = async () => {
      const dbManager = new DatabaseManager();
      await dbManager.initialize(); // Creates tables on first run
      setDbReady(true);
    };
    initDB();
  }, []);
  
  if (!dbReady) return <SplashScreen />;
  
  return <RootNavigator />;
}
```

### 4. No Type Sync Between Frontend & Backend
**Issue**: Manual TypeScript type definitions don't match backend POJOs  
**Impact**: Serialization errors, data corruption during sync  
**Fix Required** (1-2 days):
```bash
# Option: Use OpenAPI/Swagger to auto-generate types
# 1. Backend exposes OpenAPI spec: GET /api/docs/openapi.json
# 2. Frontend generates types: npx openapi-generator-cli generate -i http://localhost:8080/api/docs/openapi.json

# OR: Share types directory
# Monorepo structure: types/ shared between backend + frontend
# Backend: Add @JsonProperty annotations matching TypeScript camelCase
```

---

## 🟡 HIGH PRIORITY (Days 1-3)

### 5. No Permissions Configuration
**Current**: `mobile/App.tsx` needs to request location + camera + contacts  
**Install**: expo-permissions plugin
```json
{
  "expo": {
    "plugins": [
      "expo-location",
      "expo-camera",
      ["expo-secure-store", {}]
    ],
    "android": {
      "permissions": [
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.CAMERA",
        "android.permission.READ_CONTACTS"
      ]
    },
    "ios": {
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "We need your location to verify you're at customer locations.",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "We need your location to verify you're at customer locations.",
        "NSCameraUsageDescription": "We need camera access to capture product photos for verification.",
        "NSContactsUsageDescription": "We need contacts to call or message customers."
      }
    }
  }
}
```

### 6. API Client Not Implemented
**Current**: No `axios` wrapper for token injection  
**Create**: `mobile/src/services/api/client.ts`
```typescript
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api';

export const apiClient = axios.create({ baseURL: API_BASE });

apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, refresh
      const refreshToken = await SecureStore.getItemAsync('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE}/auth/refresh`, {
            refreshToken,
          });
          await SecureStore.setItemAsync('access_token', response.data.access_token);
          // Retry original request
          return apiClient(error.config);
        } catch {
          // Refresh failed, logout
          throw error;
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## 🟢 MEDIUM PRIORITY (Days 4-7)

### 7. Location Service Needs Testing
**Current**: LocationService.ts is 80% implemented but untested  
**Action**: 
```bash
# Create mobile/src/services/location/LocationService.test.ts (already exists)
# Verify on real device or emulator:
# 1. App requests location permission
# 2. Background task starts
# 3. Breadcrumbs saved to SQLite
# 4. Geofence arrival fires at 50m
# 5. Battery impact < 5% per 8 hours
```

### 8. Navigation Stack Not Connected
**Current**: MapViewport component exists but not integrated  
**Action**: Wire map to LocationService
```tsx
// mobile/src/screens/NavigationScreen.tsx
import { LocationService } from '../services/location/LocationService';
import MapViewport from '../components/mapping/MapViewport';

export function NavigationScreen() {
  const [location, setLocation] = useState(null);
  const [route, setRoute] = useState(null);
  
  useEffect(() => {
    const locationService = new LocationService(config, dbManager);
    locationService.on('location', setLocation);
    locationService.start();
    
    return () => locationService.stop();
  }, []);
  
  return <MapViewport currentLocation={location} route={route} />;
}
```

### 9. Visit Workflow Not Integrated
**Current**: FormEngine exists but no parent Visit screen  
**Action**: Create mobile/src/screens/VisitScreen.tsx that:
- Gets currentCustomerId from route params
- Fetches customer profile from DB
- Loads form schema based on customer type
- Calls FormEngine to render dynamic form
- Persists drafts to visit_drafts table
- On submit: Create visit record → Add to Outbox

---

## 🔥 CRITICAL SUCCESS METRICS

### By End of Week 1:
- [ ] App launches without crash
- [ ] User can log in (even with mock API)
- [ ] SQLite database created on device
- [ ] Permissions requested (location, camera, contacts)
- [ ] Main navigation tabs visible

### By End of Week 2:
- [ ] Location service tracks GPS in background
- [ ] Map displays current location
- [ ] Customer list loads from backend/mock API
- [ ] Tap customer → View profile
- [ ] Tap profile → Arrive at customer (manual button for testing)

### By End of Week 3:
- [ ] Visit check-in works
- [ ] Form renders dynamically
- [ ] Photo capture works
- [ ] Visit saved to Outbox
- [ ] Outbox syncs to server (with mock/real backend)

---

## 🚀 IMMEDIATE ACTIONS (Next 2 Hours)

### Step 1: Run Quick Start Script
```powershell
cd c:\Solomon\Projects\Clients\Kookee\kookkeApp-sales
.\quickstart.ps1
```

### Step 2: Review Documentation
- [ ] Read [STARTUP_GUIDE.md](STARTUP_GUIDE.md) (15 min)
- [ ] Read [DEVELOPMENT_ROADMAP.md](DEVELOPMENT_ROADMAP.md) (20 min)
- [ ] Check [database/SCHEMA.md](database/SCHEMA.md) (10 min)

### Step 3: Decide Backend Approach
- [ ] Backend approach: Spring Boot or Mock API?
- [ ] Create issue/ticket to start backend dev (if Spring Boot)
- [ ] OR: Install json-server (if Mock API)

### Step 4: Fix mobile/App.tsx
- [ ] Implement navigation stack
- [ ] Add database initialization
- [ ] Add permission requests
- [ ] Add context providers (Auth, Location, Route, Sync)

### Step 5: Test on Emulator
```bash
cd mobile
npm start
# Press 'a' for Android or 'i' for iOS
```

---

## 📋 DEPENDENCY CHAIN

```
START HERE:
├─ Backend Setup (Spring Boot + PostgreSQL)
│  └─ Implements: /auth/login, /customers, /routes, /visits
│
├─ Mobile App Shell (navigation + contexts)
│  └─ Implements: navigation stack, database init
│
├─ Auth Flow
│  ├─ Dependency: Backend /auth/login
│  ├─ Implements: Login screen, token storage, refresh
│  └─ Unlocks: All authenticated screens
│
├─ Location Service ✓ (already 80% done)
│  ├─ Dependency: Permissions granted in PermissionScreens
│  ├─ Implements: Background GPS tracking, Kalman filter, geofencing
│  └─ Unlocks: Navigation, arrival detection
│
├─ Maps & Customer Directory
│  ├─ Dependency: Location service + Backend /customers
│  ├─ Implements: Map display, customer list, profiles
│  └─ Unlocks: Visit workflow
│
├─ Visit Workflow
│  ├─ Dependency: Maps + Customer directory
│  ├─ Implements: Check-in → Forms → Check-out
│  └─ Unlocks: Photo management, sync testing
│
├─ Photo Management ✓ (mostly done)
│  ├─ Dependency: Visit workflow
│  ├─ Implements: Camera UI, compression, metadata
│  └─ Unlocks: Full visit completion
│
└─ Sync Engine ✓ (75% done)
   ├─ Dependency: All above features complete
   ├─ Implements: Outbox push, delta sync, conflict resolution
   └─ Unlocks: Offline mode, production readiness
```

---

## 🎯 THIS WEEK'S GOAL

**Get mobile app to launch → Login → Reach home screen**

That's it. Everything else builds on this foundation.

```
Day 1: App shell + navigation + database init
Day 2: Backend OR mock API + auth endpoints
Day 3: Login screen + JWT token storage + biometric unlock
Day 4: Test on emulator/device
Day 5: Polish auth flow, fix bugs
```

---

**Last Updated**: January 22, 2026  
**Status**: Ready for development  
**Next Review**: After week 1 completion
