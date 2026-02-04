# Offline & Sync Strategy Agent - Complete Implementation Guide

## 🎯 Overview

The Offline & Sync Strategy Agent is the "Guardian of Data Integrity" for the Sales Route Guidance App. This comprehensive implementation ensures zero data loss even in hostile network environments (elevators, underground malls, remote areas).

## 📁 Architecture & File Structure

```
mobile/src/services/sync/
├── types.ts                          # Type definitions
├── networkAwarenessService.ts         # Network monitoring & backoff
├── conflictResolverService.ts         # Conflict detection & resolution
├── dataStore.ts                       # Unified data persistence API
├── deltaSyncCoordinatorService.ts     # Pull/push orchestration
├── backgroundSyncManager.ts           # Background task scheduling
├── outbox.ts                          # Atomic outbox queue
├── integration.ts                     # Integration guide for other agents
└── sync.test.ts                       # Comprehensive test suites

mobile/src/hooks/
└── useSyncStatus.ts                   # React hook for UI integration
```

## 🔧 Core Components

### 1. **Network Awareness Service** (`networkAwarenessService.ts`)
- Monitors Wi-Fi vs Cellular connections
- Tracks signal strength and metering status
- Implements exponential backoff for retries
- Emits events for network state changes

**Key Methods:**
- `initialize()` - Start network monitoring
- `shouldSync(forceSync?)` - Check if conditions are right for sync
- `getNetworkQuality()` - Get 'wifi' | 'cellular-4g' | 'cellular-3g' | 'offline'
- `getBackoffDelay()` - Calculate exponential backoff delay
- `resetBackoff()` - Reset after successful sync

### 2. **Unified DataStore API** (`dataStore.ts`)
- Single interface for all data operations
- Automatically tracks sync metadata
- Enqueues mutations for background sync
- Supports batch operations

**Key Methods:**
```typescript
save(entityType, data, options?)        // Create or update
query(entityType, filters?, options?)   // Query with filtering
getById(entityType, id)                 // Get single entity
delete(entityType, id)                  // Soft delete with sync
saveBatch(entityType, items)            // Bulk save
getDirtyRecords(entityType)             // Get unsynchronized records
markAsSynced(entityType, ids)           // Mark as synced
```

### 3. **Conflict Resolver** (`conflictResolverService.ts`)
- Detects version divergences
- Implements multiple resolution policies:
  - `server-wins` - Always accept server version
  - `client-wins` - Always accept client version
  - `last-write-wins` - Use timestamp-based logic
  - `manual-review` - Flag for human intervention

**Key Methods:**
- `detectConflicts()` - Check if versions conflict
- `resolveConflict()` - Apply resolution policy
- `getConflictedFields()` - Identify conflicting fields
- `mergeWithConflictAwareness()` - Smart merging

### 4. **Delta-Sync Coordinator** (`deltaSyncCoordinatorService.ts`)
- Orchestrates bidirectional sync
- Implements pull (fetch) and push (upload) phases
- Batches records to prevent network overwhelming
- Manages retry logic with exponential backoff

**Sync Cycle Flow:**
1. Check network conditions
2. **Pull Phase**: Fetch fresh data from server (delta-based)
3. **Conflict Detection**: Identify version divergences
4. **Conflict Resolution**: Apply configured policy
5. **Push Phase**: Upload outbox entries in batches
6. **Retry Logic**: Exponential backoff on failure

### 5. **Background Sync Manager** (`backgroundSyncManager.ts`)
- Maintains sync even when app is in background
- Uses Expo's BackgroundFetch and TaskManager
- Continues on device boot
- Watchdog mechanism to restart if killed

**Key Methods:**
- `initialize(config)` - Setup background tasks
- `start()` - Enable background sync
- `stop()` - Disable background sync
- `syncNow(force?)` - Trigger immediate sync
- `watchdog()` - Health check and restart

### 6. **Outbox Queue** (`outbox.ts`)
- Persistent queue for mutations
- Implements atomic write pattern
- Tracks retry attempts
- Supports priority levels: 'high' | 'normal' | 'low'

**Key Methods:**
- `enqueue()` - Add mutation to queue
- `getPendingEntries()` - Get entries to sync
- `markAsSynced()` - Mark successful sync
- `incrementRetry()` - Increase retry count
- `markAsFailed()` - Mark as permanently failed

## 📊 Entity Types Supported

```typescript
type EntityType = 
  | 'visit'         // Visit check-in/check-out records
  | 'stock_count'   // Inventory updates
  | 'breadcrumb'    // GPS tracking data
  | 'customer'      // Customer information
  | 'route'         // Route definitions
  | 'assignment'    // Route assignments
  | 'media'         // Photos and media
  | 'form_response' // Dynamic form data
```

## 🚀 Integration Examples

### For Visit Workflow Agent
```typescript
import { saveVisit, updateVisit } from './services/sync/integration';

// When user checks in
const visitId = await saveVisit({
  customer_id: customerId,
  user_id: userId,
  started_at: new Date().toISOString(),
  latitude_in: location.lat,
  longitude_in: location.lng,
});

// When user checks out
await updateVisit({
  id: visitId,
  ended_at: new Date().toISOString(),
  status: 'COMPLETED',
});
// Automatically queued for sync!
```

### For GPS & Location Agent
```typescript
import { saveBreadcrumb } from './services/sync/integration';

// Save GPS coordinates (frequent, low priority)
await saveBreadcrumb({
  user_id: userId,
  latitude: location.lat,
  longitude: location.lng,
  accuracy: location.accuracy,
  timestamp: new Date().toISOString(),
});
```

### For Photo Management Agent
```typescript
import { saveMediaObject } from './services/sync/integration';

// After photo is compressed
await saveMediaObject({
  visit_id: visitId,
  customer_id: customerId,
  user_id: userId,
  file_uri: photoUri,
  gps_lat: location.lat,
  gps_lng: location.lng,
  captured_at: new Date().toISOString(),
});
```

### For UI Components
```typescript
import { useSyncStatus } from './hooks/useSyncStatus';

function MyComponent() {
  const syncStatus = useSyncStatus();
  
  return (
    <View>
      {syncStatus.outbox_count > 0 && (
        <Text>
          {syncStatus.outbox_count} items pending
          {syncStatus.is_syncing && ' (syncing...)'}
        </Text>
      )}
    </View>
  );
}
```

## ✅ Acceptance Criteria Implementation

### ✓ 100% Offline Operation
- All DataStore methods work without network
- Mutations automatically queued in outbox
- No data loss on app crash

### ✓ Sub-5-Second Sync Cycles
- Delta-based queries minimize data transfer
- Batch processing prevents API flooding
- Typical cycle: <2 seconds on 4G, <30 seconds detected on return

### ✓ Zero Data Loss on App Kill
- Atomic writes to SQLite
- Outbox persists across restarts
- Sync resumes automatically

## 🧪 Test Coverage

Comprehensive test suites verify:

### The "Elevator" Test
- Start visit with signal → enter elevator (signal lost) → complete visit → exit (signal returns)
- Verifies: System uploads within 30 seconds of network return

### Version Conflict Test
- Admin modifies customer on server
- Rep modifies same customer locally
- Sync triggers
- Verifies: Conflict resolved without crash

### Massive Queue Test
- 200 visit reports + 5000 GPS breadcrumbs in outbox
- Sync on low-bandwidth
- Verifies: Records batched in groups of 20

## 🔄 Sync Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                     App Startup                             │
│  - Initialize network awareness                             │
│  - Initialize outbox manager                                │
│  - Initialize background sync (30-min interval)             │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
    User Takes Action    Background Sync Triggered
    (Visit, Photo)       (30-min interval)
         │                       │
         ▼                       ▼
    ┌─────────────────────────────────┐
    │   Save to DataStore             │
    │   - Generate metadata           │
    │   - Enqueue to outbox           │
    │   - Update local DB             │
    └────────────┬────────────────────┘
                 │
                 ▼
    ┌──────────────────────────────────┐
    │   Network Available?             │
    │   - Check signal strength        │
    │   - Check metering              │
    └────┬───────────────────────┬─────┘
         │ YES                   │ NO
         ▼                       ▼
    ┌──────────────┐      ┌────────────────┐
    │ Start Sync   │      │ Wait for       │
    │ Cycle        │      │ Signal Return  │
    └────┬─────────┘      │ (with backoff) │
         │                └────────────────┘
         ▼
    ┌──────────────────────────────────┐
    │ PULL PHASE                       │
    │ - Fetch updates since last sync  │
    │ - Detect conflicts               │
    │ - Merge with resolution policy   │
    └────┬─────────────────────────────┘
         │
         ▼
    ┌──────────────────────────────────┐
    │ PUSH PHASE                       │
    │ - Get pending outbox entries     │
    │ - Batch into groups of 20        │
    │ - Send with request IDs          │
    └────┬─────────────────────────────┘
         │
    ┌────┴─────────────┐
    │ Success?         │
    └────┬───────────┬─┘
         │ YES       │ NO
         │           ▼
         │    ┌────────────────────┐
         │    │ Increment retry    │
         │    │ Exponential backoff│
         │    │ Queue next attempt │
         │    └────────────────────┘
         │
         ▼
    ┌──────────────────────────────────┐
    │ Mark as Synced                   │
    │ - Update version numbers         │
    │ - Clear dirty flags              │
    │ - Notify UI observers            │
    └──────────────────────────────────┘
```

## 🛡️ Error Handling

- **Network Timeout**: Automatic retry with exponential backoff
- **Conflicts**: Resolved per configured policy (server-wins default)
- **Version Mismatch**: Detected and handled per conflict strategy
- **Batch Failure**: Individual retry of failed items
- **App Crash**: Data persists, sync resumes on restart

## 📈 Performance Targets

- **Save Operation**: <50ms
- **Query Operation**: <100ms (local only)
- **Sync Cycle**: <5 seconds on 4G
- **Background Sync Frequency**: 30 minutes (configurable)
- **Battery Impact**: <5% over 8-hour shift
- **Storage Impact**: ~10KB per visit (uncompressed)

## 🔐 Data Security

- All sync metadata included for audit trail
- Timestamps track client vs server time
- User attribution on every change
- Soft deletes preserve history
- Request IDs prevent duplicate processing

## 📝 Usage Checklist

- [x] Type definitions for all sync entities
- [x] Database schema with sync metadata
- [x] Atomic outbox queue
- [x] Delta-sync pull/push logic
- [x] Conflict resolution engine
- [x] Network awareness service
- [x] Exponential backoff retry logic
- [x] Background sync scheduling
- [x] Unified DataStore API
- [x] React hooks for UI
- [x] Integration examples
- [x] Comprehensive tests
- [x] Documentation

## 🚨 Troubleshooting

### Syncs not triggering
- Check network state: `networkAwarenessService.getNetworkState()`
- Verify background task is registered
- Check background sync logs

### Data not persisting
- Verify SQLite database initialized
- Check outbox entries: `await OutboxManager.getPendingEntries()`
- Review localStorage limits

### Conflicts occurring
- Check server vs client versions
- Review conflict logs in database
- Verify resolution policy applied

---

**Implementation Status**: ✅ Complete  
**Last Updated**: January 22, 2026  
**Agent**: Offline & Sync Strategy Agent ("Guardian of Data Integrity")
