# Sales Route Guidance App - Data Schema Documentation

**Version:** 1.0  
**Last Updated:** January 2026  
**Database Engine:** PostgreSQL 14+  
**Mobile Persistence:** SQLite (via Expo) / WatermelonDB

---

## Table of Contents

1. [Overview](#overview)
2. [Core Principles](#core-principles)
3. [Entity Reference](#entity-reference)
4. [Data Types & Validation](#data-types--validation)
5. [Relationships & Constraints](#relationships--constraints)
6. [Sync Protocol](#sync-protocol)
7. [Performance Considerations](#performance-considerations)
8. [Migration Guide](#migration-guide)
9. [Test Cases & Acceptance Criteria](#test-cases--acceptance-criteria)

---

## Overview

This schema serves as the **single source of truth** for the Sales Route Guidance App, a mission-critical field sales application designed for extreme reliability in both high-connectivity and zero-connectivity environments.

### Design Principles

- **Traceability**: Every record includes `created_by_user_id`, `updated_by_user_id`, `client_timestamp`, and `server_timestamp` for complete audit trails.
- **Sync-First Architecture**: All synchronizable entities include `server_id`, `local_id`, `version_number`, `is_dirty`, and `last_synced_at` fields.
- **Data Integrity**: Foreign key constraints prevent orphaned records; soft-deletes preserve historical data for auditing.
- **Performance**: Strategic indexing on high-volume query patterns (user_id + date, visit status, geofence events).
- **Type Safety**: 1:1 correspondence between TypeScript interfaces and Java JPA entities ensures serialization safety.

---

## Core Principles

### Sync Metadata Pattern

Every synchronizable entity includes:
- `server_id`: UUID generated on backend, immutable, used as sync idempotency key
- `local_id`: Local identifier before first sync
- `version_number`: Optimistic locking version (starts at 1)
- `isDirty`: Boolean flag marking records with local changes
- `lastSyncedAt`: Timestamp of last successful sync

The Offline Sync Agent uses these fields to calculate deltas and prevent duplicate syncs.

### Audit Metadata Pattern

Every entity tracks:
- `created_by_user_id`: ID of user who created the record
- `updated_by_user_id`: ID of user who last modified
- `server_timestamp`: When change reached the server
- `client_timestamp`: When user performed the action (for payroll/audit)

### Soft Delete Strategy

Records are never permanently deleted:
- `is_deleted` column is set to `TRUE`
- Queries filter out deleted records automatically
- Historical data remains intact for auditing

---

## Entity Reference

### SECURITY & ACCESS CONTROL

**users** - Core identity table for all system actors
- Core fields: email (UNIQUE), phone_number, first_name, last_name, display_name
- Auth: password_hash, is_active, is_deleted
- Sync: server_id, local_id, version_number, isDirty, lastSyncedAt
- Audit: createdByUserId, updatedByUserId, clientTimestamp, serverTimestamp
- Foreign keys: created_by_user_id, updated_by_user_id → users

**roles** - RBAC authorization levels
- Fixed set: FIELD_SALES_REP, AREA_MANAGER, ADMIN, SUPER_ADMIN
- is_system_role: Built-in roles cannot be modified

**permissions** - Fine-grained access control
- Format: resource (string) + action (read|write) → permission name
- Example: resource='customer', action='read' → 'view_customers'

**session_tokens** - JWT and refresh token tracking
- token_hash: SHA-256 hash (never expose token value)
- token_type: ACCESS (30 min) | REFRESH (14 days)
- is_revoked: Blacklist check
- device_id: Optional device binding

### CRM & TERRITORY

**territories** - Geographical and organizational hierarchy
- Hierarchical: parent_territory_id allows multi-level territories
- region_code, area_code: Geographic identifiers

**customers** - Sales outlets with geofencing support
- Core: name, category (WHOLESALE|RETAIL|KEY_ACCOUNT|DISTRIBUTOR|OTHER)
- Location: latitude, longitude (DECIMAL 10,8 = ±1.1mm precision)
- Geofence: geofence_radius_meters (default 50), location_verified
- Custom attrs: has_freezer, freezer_condition, business_type
- Contact: owner_name, phone_primary, phone_secondary, email, whatsapp_number
- History: last_visited, visit_frequency_days
- Photo: photo_url

**customer_contacts** - Contact person history with validity periods
- contact_name, contact_role, phone_number, email
- is_primary: Default contact flag
- valid_from/valid_to: Track when person was active

### ROUTES & ASSIGNMENTS

**routes** - Daily or recurring route definitions
- route_type: DAILY|WEEKLY|FIXED|OPTIMIZED
- is_optimized: Auto-sequenced flag
- total_stops, estimated_duration_minutes: Cached metrics

**route_points** - Sequence-ordered stops within a route
- sequence_number: Order (1, 2, 3...)
- estimated_arrival_minutes: ETA from start
- is_mandatory: Must visit flag
- is_visited: Completion flag
- Constraint: UNIQUE(route_id, sequence_number)

**route_assignments** - Maps users to routes on specific dates
- assigned_date: DATE (not TIMESTAMP, to allow flexibility within day)
- assignment_status: PENDING|ACTIVE|COMPLETED|CANCELLED
- completion_percentage: (completed stops / total stops) × 100
- start_time, end_time: Shift times
- Constraint: UNIQUE(route_id, user_id, assigned_date)

### VISIT MANAGEMENT

**visits** - Parent object representing complete field interaction
- State machine: PLANNED → ARRIVED → CHECKED_IN → IN_PROGRESS → CHECKED_OUT
- check_in_time, check_out_time: Timestamps
- check_in_latitude, check_in_longitude: GPS at check-in
- check_in_accuracy_meters: Horizontal accuracy from device
- distance_from_customer_pin_meters: Check-in location vs pinned location
- is_within_geofence: Boolean computed on check-in
- photo_count: Count of attached photos

**task_reports** - Child of visit, dynamic form responses
- task_type: STOCK_AUDIT|BRAND_PRESENCE|FIELD_INTELLIGENCE|MERCHANDISING|PAYMENT_COLLECTION
- task_status: PENDING|IN_PROGRESS|COMPLETED|SKIPPED
- is_mandatory: Cannot checkout until completed
- data: JSONB payload (form field responses)
- submitted_at: When form was submitted

**stock_inventories** - Child of visit, inventory snapshots
- product_sku, product_name: Product identification
- quantity_count: Units counted
- unit_of_measure: 'units'|'cartons'|'boxes'|etc
- shelf_position: Location in store
- condition: GOOD|DAMAGED|EXPIRED|MISPLACED

### SPATIOTEMPORAL DATA

**location_tracking** - High-frequency GPS breadcrumbs (100k+ rows/day at scale)
- latitude, longitude: WGS84 (DECIMAL 10,8)
- accuracy_meters: Horizontal accuracy radius from device
- altitude_meters, speed_kmh, heading_degrees: Movement data
- battery_percentage: Device battery %
- is_moving: Derived from accelerometer
- timestamp: Device-reported time, recorded_at: Server receipt time
- Indexes: idx_location_tracking_user_date, idx_location_tracking_coordinates (BRIN)

**geofence_events** - Arrival/departure events (derived from location stream)
- event_type: ENTRY|EXIT|DWELL
- event_timestamp: When event occurred
- dwell_duration_seconds: For DWELL events only

### MEDIA MANAGEMENT

**media_files** - Photo/document references with geo tagging
- media_type: PHOTO|DOCUMENT|SIGNATURE|VIDEO
- upload_status: PENDING|IN_PROGRESS|COMPLETED|FAILED
- file_name, file_path, file_size_bytes
- gps_latitude, gps_longitude, gps_accuracy_meters: Capture location
- metadata: JSONB with EXIF data
- Naming: {CustomerId}_{YYYYMMDD}_{UnixTime}_{Type}.jpg

### SYNC & OFFLINE

**outbox** - Persistent queue for mutations awaiting sync
- entity_type: 'Visit'|'TaskReport'|'MediaFile'|etc
- operation: CREATE|UPDATE|DELETE
- payload: Full entity JSON for sync
- status: PENDING|IN_PROGRESS|COMPLETED|FAILED
- attempt_count: Retry counter
- Retry policy: Linear backoff (1s, 2s, 4s, 8s, 16s) up to max_retries

**sync_metadata** - Track sync state per user per entity type
- last_synced_at: Last successful full sync
- last_sync_token: Cursor for next delta sync
- total_records_synced: Cumulative count
- is_syncing: Lock to prevent concurrent syncs
- Constraint: UNIQUE(user_id, entity_type)

---

## Data Types & Validation

### GPS Coordinates

| Type | Precision | Accuracy | Notes |
|------|-----------|----------|-------|
| FLOAT | 6 decimals | ±5 meters | Use only for display |
| DECIMAL(10,8) | 8 decimals | ±1.1 mm | **PREFERRED** for storage |
| DOUBLE | 15 decimals | ±1.1 mm | Java/TypeScript only |

**Decision**: Use `DECIMAL(10,8)` for all GPS coordinates.
- Avoids floating-point rounding errors
- Matches mapping library precision
- ~11 bytes per coordinate (acceptable)

### Timestamps

All timestamps stored as `TIMESTAMP WITH TIME ZONE`:
- Client sends with timezone hint
- Server converts to UTC
- For payroll: use `client_timestamp` (when rep took action)
- For auditing: use `server_timestamp` (when cloud received it)

### Phone Numbers

Store as VARCHAR(20) without transformation:
- Accept local and international formats
- Validation: 7-20 digits when non-numeric chars removed
- Display: Use libphonenumber library for formatting

---

## Relationships & Constraints

### Foreign Key Strategy

- **Soft Delete**: Deleted customers remain in database, queries filter `is_deleted = false`
- **Restrict on Delete**: Route points cannot reference deleted customers (RESTRICT)
- **Cascade on Delete**: Visit children (task_reports, stock_inventories, media_files) cascade to parent

### Orphan Prevention

Example: Prevent deleting a customer referenced by route points:
```sql
ALTER TABLE route_points 
  ADD CONSTRAINT fk_route_points_customer
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT;
```

If you try to delete a customer with route points, database rejects it.

---

## Sync Protocol

### Delta Sync Algorithm

**Client → Server (Push)**:
1. Query records where `is_dirty = true`
2. POST to `/api/sync/outbox` with `server_id` (idempotency key)
3. Server returns assigned `server_id` and `version_number`
4. Client updates: `is_dirty = false`, `last_synced_at = now()`

**Server → Client (Pull)**:
1. GET `/api/sync/customers?lastSyncToken=abc123`
2. Server returns records where `server_timestamp > client.lastSyncedAt`
3. Batch size: ≤100 records
4. Client merges: if `server.versionNumber > local.versionNumber`, use server version
5. Loop until `hasMore = false`

### Conflict Resolution

Policy: **"Server Wins Last"**
- If server updated and client didn't: use server
- If client updated and server didn't: use client
- If both updated to same value: no conflict
- If both updated to different values: use server, log conflict

---

## Performance Considerations

### Critical Query Patterns

**Pattern 1**: "All visits for user X in month Y" (target < 50ms on 100k rows)
```sql
SELECT v.* 
FROM visits v
WHERE v.user_id = ? 
  AND DATE_TRUNC('month', v.visit_date) = ?
ORDER BY v.visit_date DESC;
```
Index: `idx_visits_user_date` on (user_id, visit_date)

**Pattern 2**: "Current route assignment for rep today"
```sql
SELECT ra.*, r.name, COUNT(rp.id) as total_stops
FROM route_assignments ra
JOIN routes r ON ra.route_id = r.id
LEFT JOIN route_points rp ON r.id = rp.route_id
WHERE ra.user_id = ? AND ra.assigned_date = CURRENT_DATE;
```
Index: `idx_route_assignments_user_date` on (user_id, assigned_date)

**Pattern 3**: "Find active customers in territory"
```sql
SELECT c.* 
FROM customers c
WHERE c.territory_id = ? AND c.is_deleted = false
ORDER BY c.name;
```
Index: `idx_customers_territory_id` on (territory_id) WHERE is_deleted = false

### Data Volume Estimates

- 1000 field reps
- 10,000 customers
- 50 visits per rep per month = 50,000 visits/month
- 5-minute GPS interval = 100 breadcrumbs/day/rep = 100,000 breadcrumbs/day
- ~3 stock items per visit = 150,000 stock records/month

**Annual growth**: 600,000 visits + 36,500,000 breadcrumbs = manageable with proper indexing and partitioning.

---

## Migration Guide

### Safe Schema Changes Example

**Add `location_verified` column to customers**:

```sql
-- Step 1: Add column as nullable
ALTER TABLE customers 
  ADD COLUMN location_verified BOOLEAN;

-- Step 2: Set default for existing rows
UPDATE customers 
  SET location_verified = false;

-- Step 3: Add NOT NULL constraint
ALTER TABLE customers 
  ALTER COLUMN location_verified SET NOT NULL,
  ALTER COLUMN location_verified SET DEFAULT false;

-- Step 4: Create index
CREATE INDEX idx_customers_location_verified 
  ON customers(location_verified) 
  WHERE location_verified = true;

-- Step 5: Verify
SELECT COUNT(*) FROM customers WHERE location_verified IS NULL;  
-- Should return 0

-- Step 6: Log
INSERT INTO schema_migrations (name) VALUES ('add_location_verified');
```

**Zero-downtime approach**: New code checks column if exists, old code ignores it.

---

## Test Cases & Acceptance Criteria

### ✅ Criterion 1: Visit as Parent with Multiple Children

```sql
SELECT v.id, COUNT(tr.id) as task_reports, COUNT(si.id) as stock_items
FROM visits v
LEFT JOIN task_reports tr ON v.id = tr.visit_id
LEFT JOIN stock_inventories si ON v.id = si.visit_id
WHERE v.id = 123
GROUP BY v.id;

-- Expected: Single visit with multiple children
```

### ✅ Criterion 2: Optimized Data Types

GPS coordinates use `DECIMAL(10,8)` for ±1.1mm precision (vs ±5m with FLOAT).

### ✅ Criterion 3: Sync State Distinction

**Never synced**: `last_synced_at IS NULL AND is_dirty = true`  
**Modified since sync**: `last_synced_at IS NOT NULL AND is_dirty = true`

---

## Summary

This schema provides:
- ✅ 100% audit trail (user, timestamp, action)
- ✅ Offline-first capability (sync metadata)
- ✅ Type-safe TypeScript ↔ Java mapping
- ✅ Scalable to millions of records
- ✅ Zero-downtime migrations

**Canonical Source**: Refer to `database/schema.sql` for exact DDL.  
**Type Definitions**: See `types/shared/models.ts` (TypeScript) and Java entities in `types/shared/java/`.

## 4. Operational Events

### `visits`
The primary unit of work.
- `local_id`: Reference used by the mobile app before the record is synced.
- `started_at` / `ended_at`: Client-side timestamps (local time of the action).
- `latitude_in` / `longitude_in`: GPS coordinates at the moment of check-in.
- `latitude_out` / `longitude_out`: GPS coordinates at the moment of check-out.
- `is_dirty`: Indicates the record has local changes not yet synced to the server.

### `task_reports`
Dynamic form submissions completed during a visit.
- `data_json`: Stores responses in a flexible JSONB format.

---

## 5. Spatiotemporal Data

### `location_tracking`
High-frequency breadcrumbs captured during the day.
- `accuracy`: Horizontal accuracy in meters.
- `client_timestamp`: When the location was captured by the device.
- `server_timestamp`: When the record was received by the backend.
