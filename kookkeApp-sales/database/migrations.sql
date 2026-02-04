-- ============================================================================
-- Schema Migration Scripts - Sales Route Guidance App
-- ============================================================================

-- Migration 001: Add location_verified column to customers (safe alteration)
-- Status: Example migration for documentation
-- Created: 2024-01-22

-- ============================================================================
-- MIGRATION 001: Add location_verified to customers (SAFE ZERO-DOWNTIME)
-- ============================================================================

-- Step 1: Add column as nullable (won't block reads/writes)
ALTER TABLE customers 
  ADD COLUMN IF NOT EXISTS location_verified BOOLEAN;

-- Step 2: Back-fill with default values (can be batched in production)
UPDATE customers 
  SET location_verified = false 
  WHERE location_verified IS NULL;

-- Step 3: Add NOT NULL constraint once all rows are populated
ALTER TABLE customers 
  ALTER COLUMN location_verified SET NOT NULL,
  ALTER COLUMN location_verified SET DEFAULT false;

-- Step 4: Create index for queries (supports "show verified locations" UI)
CREATE INDEX IF NOT EXISTS idx_customers_location_verified 
  ON customers(location_verified) 
  WHERE location_verified = true;

-- Step 5: Verify data integrity
DO $verification$
DECLARE
  null_count INT;
BEGIN
  SELECT COUNT(*) INTO null_count 
  FROM customers 
  WHERE location_verified IS NULL;
  
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Migration failed: % rows still have NULL location_verified', null_count;
  END IF;
  
  RAISE NOTICE 'Migration successful: All customers have location_verified set';
END $verification$;

-- ============================================================================
-- MIGRATION 002: Add geofence_entry_time tracking (future enhancement)
-- ============================================================================

-- Purpose: Track when rep entered customer geofence for arrival confirmation
-- Status: Template for future migration

/*
ALTER TABLE visits 
  ADD COLUMN IF NOT EXISTS geofence_entry_time TIMESTAMP WITH TIME ZONE;

ALTER TABLE visits 
  ADD COLUMN IF NOT EXISTS geofence_exit_time TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN visits.geofence_entry_time IS 
  'Timestamp when GPS signal first entered customer geofence (auto-computed)';

COMMENT ON COLUMN visits.geofence_exit_time IS 
  'Timestamp when GPS signal last exited customer geofence (auto-computed)';

-- Create index for geofence arrival detection queries
CREATE INDEX IF NOT EXISTS idx_visits_geofence_entry 
  ON visits(user_id, geofence_entry_time) 
  WHERE geofence_entry_time IS NOT NULL;
*/

-- ============================================================================
-- MIGRATION 003: Bulk customer location verification (administrative)
-- ============================================================================

-- Purpose: Mass-verify customer locations via batch geocoding
-- Status: Admin script for one-time usage

/*
-- Step 1: Create temporary table for import
CREATE TEMP TABLE customer_geocodes (
  customer_id BIGINT,
  verified_latitude DECIMAL(10,8),
  verified_longitude DECIMAL(10,8)
);

-- Step 2: Load geocoding results (from external service)
-- Example: COPY customer_geocodes FROM '/data/geocoding_results.csv' CSV;

-- Step 3: Update customers with verified coordinates
UPDATE customers c
SET 
  latitude = cg.verified_latitude,
  longitude = cg.verified_longitude,
  location_verified = true,
  is_dirty = true,
  server_timestamp = NOW()
FROM customer_geocodes cg
WHERE c.id = cg.customer_id;

-- Step 4: Log migration
INSERT INTO schema_migrations (name, description, rows_affected)
VALUES ('bulk_location_verification', 'Mass geocoding update', 
  (SELECT COUNT(*) FROM customer_geocodes));

-- Step 5: Cleanup
DROP TABLE customer_geocodes;
*/

-- ============================================================================
-- ROLLBACK PROCEDURES
-- ============================================================================

-- Rollback Migration 001 (remove location_verified)
-- Caution: Only use if migration was applied incorrectly
/*
DROP INDEX IF EXISTS idx_customers_location_verified;
ALTER TABLE customers DROP COLUMN IF EXISTS location_verified;
*/

-- ============================================================================
-- MIGRATION TRACKING TABLE (schema versioning)
-- ============================================================================

CREATE TABLE IF NOT EXISTS schema_migrations (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  rows_affected BIGINT,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED')),
  error_message TEXT
);

-- Record this migration as completed
INSERT INTO schema_migrations (name, description, status) 
VALUES ('base_schema_and_migrations', 'Create base schema with migration tracking', 'COMPLETED')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- VERIFY ALL CRITICAL INDEXES EXIST
-- ============================================================================

-- Security & Access Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_session_tokens_user_id ON session_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_session_tokens_expires_at ON session_tokens(expires_at) WHERE is_revoked = FALSE;

-- Territory & Customer Indexes
CREATE INDEX IF NOT EXISTS idx_territories_parent_id ON territories(parent_territory_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_customers_territory_id ON customers(territory_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_customers_coordinates ON customers(latitude, longitude) WHERE is_deleted = FALSE AND location_verified = TRUE;
CREATE INDEX IF NOT EXISTS idx_customer_contacts_customer_id ON customer_contacts(customer_id, is_active);

-- Route & Assignment Indexes
CREATE INDEX IF NOT EXISTS idx_routes_territory_id ON routes(territory_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_route_points_route_id ON route_points(route_id);
CREATE INDEX IF NOT EXISTS idx_route_points_customer_id ON route_points(customer_id);
CREATE INDEX IF NOT EXISTS idx_route_assignments_user_date ON route_assignments(user_id, assigned_date);
CREATE INDEX IF NOT EXISTS idx_route_assignments_route_id ON route_assignments(route_id);
CREATE INDEX IF NOT EXISTS idx_route_assignments_status ON route_assignments(assignment_status);

-- Visit Indexes
CREATE INDEX IF NOT EXISTS idx_visits_user_date ON visits(user_id, visit_date);
CREATE INDEX IF NOT EXISTS idx_visits_customer_date ON visits(customer_id, visit_date);
CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(visit_status);
CREATE INDEX IF NOT EXISTS idx_visits_check_in_time ON visits(check_in_time);
CREATE INDEX IF NOT EXISTS idx_visits_route_assignment_id ON visits(route_assignment_id);

-- Task Report Indexes
CREATE INDEX IF NOT EXISTS idx_task_reports_visit_id ON task_reports(visit_id);
CREATE INDEX IF NOT EXISTS idx_task_reports_type_status ON task_reports(task_type, task_status);

-- Stock Inventory Indexes
CREATE INDEX IF NOT EXISTS idx_stock_inventories_visit_id ON stock_inventories(visit_id);
CREATE INDEX IF NOT EXISTS idx_stock_inventories_product_sku ON stock_inventories(product_sku);

-- Location Tracking Indexes
CREATE INDEX IF NOT EXISTS idx_location_tracking_user_date ON location_tracking(user_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_location_tracking_visit_id ON location_tracking(visit_id);
CREATE INDEX IF NOT EXISTS idx_location_tracking_coordinates ON location_tracking USING BRIN (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_location_tracking_timestamp ON location_tracking(timestamp);

-- Geofence Event Indexes
CREATE INDEX IF NOT EXISTS idx_geofence_events_user_customer ON geofence_events(user_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_geofence_events_event_type ON geofence_events(event_type);
CREATE INDEX IF NOT EXISTS idx_geofence_events_timestamp ON geofence_events(event_timestamp);

-- Media Files Indexes
CREATE INDEX IF NOT EXISTS idx_media_files_visit_id ON media_files(visit_id);
CREATE INDEX IF NOT EXISTS idx_media_files_user_id ON media_files(user_id);
CREATE INDEX IF NOT EXISTS idx_media_files_upload_status ON media_files(upload_status);

-- Sync Indexes
CREATE INDEX IF NOT EXISTS idx_outbox_status ON outbox(status);
CREATE INDEX IF NOT EXISTS idx_outbox_entity_type ON outbox(entity_type);
CREATE INDEX IF NOT EXISTS idx_sync_metadata_user_id ON sync_metadata(user_id);

-- ============================================================================
-- DIAGNOSTIC QUERIES (for monitoring)
-- ============================================================================

-- View: Migration history
SELECT * FROM schema_migrations ORDER BY executed_at DESC;

-- View: Index usage statistics (PostgreSQL 13+)
/*
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
*/

-- View: Disk usage by table
/*
SELECT schemaname, tablename, 
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
*/

-- ============================================================================
-- END OF MIGRATION SCRIPTS
-- ============================================================================
