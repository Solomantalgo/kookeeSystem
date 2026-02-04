# 💻 Code Snippets & Quick Reference

## Essential Setup Code

### 1. Mobile App Shell (mobile/App.tsx)

#### Option A: Using Expo Router (Recommended)

```tsx
// mobile/App.tsx
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

// Providers
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { LocationProvider } from './src/contexts/LocationContext';
import { RouteProvider } from './src/contexts/RouteContext';
import { SyncProvider } from './src/contexts/SyncContext';
import { DatabaseProvider } from './src/contexts/DatabaseContext';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import PermissionScreen from './src/screens/PermissionScreens';
import HomeScreen from './src/screens/HomeScreen';
import NavigationScreen from './src/screens/NavigationScreen';
import CustomerDirectoryScreen from './src/screens/CustomerDirectoryScreen';
import VisitScreen from './src/screens/VisitScreen';
import SettingsScreen from './src/screens/SettingsScreen';

SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null; // SplashScreen still visible
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Navigation" component={NavigationScreen} />
          <Stack.Screen name="Customers" component={CustomerDirectoryScreen} />
          <Stack.Screen name="Visit" component={VisitScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Permissions" component={PermissionScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

export default function App() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize database
        // Initialize location service
        // Restore auth state from SecureStore
        // Any other async operations
        
        await SplashScreen.hideAsync();
        setAppReady(true);
      } catch (e) {
        console.warn(e);
      }
    }

    prepare();
  }, []);

  if (!appReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <DatabaseProvider>
        <AuthProvider>
          <LocationProvider>
            <RouteProvider>
              <SyncProvider>
                <RootNavigator />
              </SyncProvider>
            </RouteProvider>
          </LocationProvider>
        </AuthProvider>
      </DatabaseProvider>
    </GestureHandlerRootView>
  );
}
```

#### Option B: Using React Navigation

```tsx
// mobile/App.tsx (React Navigation version)
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

const AuthStack = createNativeStackNavigator();
const AppStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Permissions" component={PermissionScreen} />
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => {
          // Return icons based on route.name
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Map" component={NavigationScreen} />
      <Tab.Screen name="Customers" component={CustomerDirectoryScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { isAuthenticated } = useAuth();
  
  return (
    <NavigationContainer>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <RootNavigator />
      </LocationProvider>
    </AuthProvider>
  );
}
```

---

### 2. Auth Context (mobile/src/contexts/AuthContext.tsx)

```tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import axios from 'axios';

interface User {
  id: string;
  username: string;
  email: string;
  roleId: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  enableBiometric: () => Promise<void>;
  isBiometricEnabled: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);

  const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api';

  // Restore session on app startup
  useEffect(() => {
    async function restoreSession() {
      try {
        const token = await SecureStore.getItemAsync('access_token');
        if (token) {
          // Validate token is still fresh
          // If near expiry, refresh it
          // If valid, fetch user profile
          
          // const response = await axios.get(`${API_BASE}/users/me`, {
          //   headers: { Authorization: `Bearer ${token}` }
          // });
          // setUser(response.data);
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, {
        email,
        password,
      });

      const { accessToken, refreshToken, user: userData } = response.data;

      // Store tokens securely
      await SecureStore.setItemAsync('access_token', accessToken);
      await SecureStore.setItemAsync('refresh_token', refreshToken);

      setUser(userData);

      // Prompt for biometric
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (compatible) {
        const available = await LocalAuthentication.isAvailableAsync();
        if (available) {
          // Optionally prompt user: "Enable biometric unlock?"
          // await enableBiometric();
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
      setUser(null);
      setIsBiometricEnabled(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const refresh = async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync('refresh_token');
      if (!refreshToken) throw new Error('No refresh token');

      const response = await axios.post(`${API_BASE}/auth/refresh`, {
        refreshToken,
      });

      await SecureStore.setItemAsync('access_token', response.data.accessToken);
    } catch (error) {
      console.error('Token refresh failed:', error);
      await logout();
    }
  };

  const enableBiometric = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        disableDeviceFallback: false,
        reason: 'Verify your identity to enable biometric unlock',
      });

      if (result.success) {
        await SecureStore.setItemAsync('biometric_enabled', 'true');
        setIsBiometricEnabled(true);
      }
    } catch (error) {
      console.error('Biometric setup failed:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refresh,
        enableBiometric,
        isBiometricEnabled,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

---

### 3. API Client (mobile/src/services/api/client.ts)

```typescript
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

// Request interceptor: Add auth token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await SecureStore.getItemAsync('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle token refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('refresh_token');
        if (!refreshToken) throw new Error('No refresh token');

        const response = await axios.post(`${API_BASE}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data;
        await SecureStore.setItemAsync('access_token', accessToken);

        // Retry original request
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, need to logout
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
        // Trigger logout in app context
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

---

### 4. Database Initialization (mobile/src/services/database/database.ts - Snippet)

```typescript
import * as SQLite from 'expo-sqlite';

export class DatabaseManager {
  private db: SQLite.SQLiteDatabase | null = null;

  async initialize(): Promise<void> {
    if (this.db) return; // Already initialized

    this.db = await SQLite.openDatabaseAsync('sales_route_app.db');

    // Enable foreign keys
    await this.exec('PRAGMA foreign_keys = ON;');

    // Check schema version
    const versionResult = await this.query(
      "SELECT user_version FROM pragma_user_version"
    );
    const currentVersion = versionResult[0]?.user_version || 0;

    // Create tables if needed
    if (currentVersion < 1) {
      await this.createTables();
      await this.exec('PRAGMA user_version = 1');
    }

    console.log('✓ Database initialized');
  }

  private async createTables(): Promise<void> {
    const statements = [
      // Users
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE,
        password_hash TEXT,
        role_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP
      );`,

      // Customers
      `CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        local_id TEXT,
        name TEXT NOT NULL,
        latitude DECIMAL(10,8),
        longitude DECIMAL(11,8),
        address TEXT,
        freezer_presence BOOLEAN,
        created_at TIMESTAMP,
        updated_at TIMESTAMP,
        deleted_at TIMESTAMP,
        version_number INT DEFAULT 1,
        is_dirty BOOLEAN DEFAULT FALSE
      );`,

      // Visits
      `CREATE TABLE IF NOT EXISTS visits (
        id TEXT PRIMARY KEY,
        local_id TEXT,
        customer_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        started_at TIMESTAMP,
        ended_at TIMESTAMP,
        latitude_in DECIMAL(10,8),
        longitude_in DECIMAL(11,8),
        latitude_out DECIMAL(10,8),
        longitude_out DECIMAL(11,8),
        is_dirty BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP,
        updated_at TIMESTAMP,
        FOREIGN KEY(customer_id) REFERENCES customers(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
      );`,

      // Breadcrumbs (Location tracking)
      `CREATE TABLE IF NOT EXISTS location_tracking (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        latitude DECIMAL(10,8),
        longitude DECIMAL(11,8),
        accuracy DECIMAL(8,2),
        speed DECIMAL(8,2),
        altitude DECIMAL(8,2),
        client_timestamp TIMESTAMP,
        server_timestamp TIMESTAMP,
        battery_level INT,
        created_at TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );`,

      // Outbox (Sync queue)
      `CREATE TABLE IF NOT EXISTS outbox (
        id TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL,
        entity_id TEXT,
        data TEXT,
        status TEXT DEFAULT 'pending',
        retry_count INT DEFAULT 0,
        last_error TEXT,
        created_at TIMESTAMP,
        synced_at TIMESTAMP
      );`,

      // Indices
      `CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(id);`,
      `CREATE INDEX IF NOT EXISTS idx_visits_customer_id ON visits(customer_id);`,
      `CREATE INDEX IF NOT EXISTS idx_visits_user_id ON visits(user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_location_user_id ON location_tracking(user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_outbox_status ON outbox(status);`,
    ];

    for (const statement of statements) {
      await this.exec(statement);
    }
  }

  async exec(sql: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.execAsync(sql);
  }

  async query(sql: string, params: any[] = []): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.getAllAsync(sql, params);
    return result;
  }

  async run(sql: string, params: any[] = []): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.runAsync(sql, params);
    return result;
  }
}
```

---

### 5. Location Service Usage

```typescript
import { LocationService } from './src/services/location/LocationService';

export function useLocationTracking() {
  const [location, setLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    const locationService = new LocationService(
      {
        userId: currentUser.id,
        batteryOptimizationEnabled: true,
      },
      dbManager
    );

    // Listen to location updates
    locationService.on('location', (update) => {
      setLocation(update);
      // Map updates in real-time
    });

    // Listen to arrivals
    locationService.on('arrival', (event) => {
      console.log('Arrived at customer:', event.customerId);
      // Trigger arrival UI
    });

    // Start tracking
    locationService.start();
    setIsTracking(true);

    return () => {
      locationService.stop();
      setIsTracking(false);
    };
  }, []);

  return { location, isTracking };
}
```

---

### 6. Outbox Service Usage

```typescript
import { OutboxService } from './src/services/sync/outbox';

export async function saveVisit(visitData: Visit) {
  // Save to local database
  await db.insert('visits', visitData);

  // Queue for sync
  const outbox = new OutboxService(db);
  await outbox.add('visit', visitData.id, visitData);
  
  // Later, when sync runs:
  // const pendingItems = await outbox.getPending();
  // await syncService.push(pendingItems);
  // await outbox.markSynced(item.id);
}
```

---

## Environment Setup

### .env.local (mobile/ root, not committed to git)

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.100:8080/api
EXPO_PUBLIC_ENV=development
EXPO_PUBLIC_LOG_LEVEL=debug
```

### app.json Configuration

```json
{
  "expo": {
    "name": "Kookee Sales",
    "slug": "kookee-sales",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png"
    },
    "updates": {
      "enabled": true,
      "checkAutomatically": "ON_LOAD_RELEASE",
      "fallbackToCacheTimeout": 30000
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": false,
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "We need your location to verify you're at customer locations.",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "We need your location to verify you're at customer locations.",
        "NSCameraUsageDescription": "We need camera access to capture product photos."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png"
      },
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "CAMERA",
        "READ_CONTACTS",
        "WRITE_CONTACTS"
      ]
    },
    "plugins": [
      "expo-location",
      "expo-camera",
      "expo-task-manager",
      "expo-background-fetch",
      ["expo-secure-store", {}]
    ]
  }
}
```

---

## Testing Utilities

### Mock API Setup (for quick development)

```bash
# Install json-server
npm install --save-dev json-server

# Create mobile/mockAPI/db.json
{
  "auth/login": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here",
    "user": {
      "id": "user_1",
      "username": "rep1",
      "email": "rep1@kookee.com",
      "roleId": "role_field_rep"
    }
  },
  "customers": [
    {
      "id": "CUST_001",
      "name": "Lukaya Supermarket",
      "latitude": -1.2345,
      "longitude": 36.7890,
      "address": "Kampala Central"
    }
  ],
  "routes": [
    {
      "id": "ROUTE_001",
      "userId": "user_1",
      "date": "2024-01-22",
      "points": ["CUST_001", "CUST_002", "CUST_003"]
    }
  ]
}

# Run server
npx json-server --watch mobile/mockAPI/db.json --port 3000
```

Then set `EXPO_PUBLIC_API_URL=http://localhost:3000` in .env

---

## Common Commands

```bash
# Install dependencies
npm install && cd mobile && npm install && cd ..

# Start dev server
cd mobile && npm start

# Android emulator
npm run android

# iOS simulator
npm run ios

# Generate types (if setup exists)
npm run generate:types

# Database backup
adb pull /data/data/com.kookee.sales/files/sales_route_app.db ./backup.db

# Check Expo logs
expo logs

# Clear cache
npm start -- --clear
```

---

**Last Updated**: January 22, 2026  
**Snippets Verified**: Against codebase state
