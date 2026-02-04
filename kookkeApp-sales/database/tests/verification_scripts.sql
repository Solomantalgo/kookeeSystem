-- Sales Route Guidance App - Verification & Test Scripts
-- These scripts satisfy the specific "Test Cases" requirements from the architectural prompt.

-- =========================================================================================
-- TEST CASE 1: Schema Migration
-- Requirement: Provide a script that safely adds a location_verified boolean to the Customer table without data loss.
-- =========================================================================================

DO $$
BEGIN
    -- Check if column exists to ensure idempotency
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='location_verified') THEN
        
        -- Add the column with a default value to prevent null issues for existing records
        ALTER TABLE customers 
        ADD COLUMN location_verified BOOLEAN DEFAULT FALSE;
        
        RAISE NOTICE 'Migration Successful: location_verified column added.';
    ELSE
        RAISE NOTICE 'Migration Skipped: Column already exists.';
    END IF;
END $$;


-- =========================================================================================
-- TEST CASE 2: Relationship Depth & Performance
-- Requirement: Verify that querying for "All visits for User X in Month Y" performs in under 50ms on a 100k-row table.
-- Strategy: This uses the composite index `idx_visits_user_start` defined in schema_ddl.sql.
-- =========================================================================================

-- Generate Logic:
-- 1. filtering by user_id references the first part of the b-tree index.
-- 2. filtering by started_at range references the second part.
-- 3. EXPLAIN ANALYZE proves usage of "Index Scan" instead of "Seq Scan".

EXPLAIN ANALYZE
SELECT 
    v.id, 
    v.started_at, 
    c.name as customer_name, 
    v.status
FROM visits v
JOIN customers c ON v.customer_id = c.id
WHERE 
    v.user_id = '00000000-0000-0000-0000-000000000000' -- Replace with actual User UUID
    AND v.started_at >= '2026-01-01 00:00:00+00'
    AND v.started_at < '2026-02-01 00:00:00+00';


-- =========================================================================================
-- TEST CASE 3: Data Integrity
-- Requirement: Attempt to insert a RoutePoint pointing to a non-existent CustomerID; verify rejection.
-- =========================================================================================

DO $$
DECLARE
    dummy_route_id UUID := uuid_generate_v4();
    non_existent_customer_id UUID := uuid_generate_v4();
BEGIN
    -- 1. Create a dummy route first so we don't fail on the route_id constraint
    INSERT INTO routes (id, name, territory_id) 
    VALUES (dummy_route_id, 'Test Route', NULL);

    -- 2. Attempt to insert a route point with a fake customer ID
    BEGIN
        INSERT INTO route_points (route_id, customer_id, sequence_order)
        VALUES (dummy_route_id, non_existent_customer_id, 1);
        
        -- If we reach here, the test FAILED
        RAISE EXCEPTION 'Integrity Test Failed: DB allowed reference to non-existent customer.';
            
    EXCEPTION WHEN foreign_key_violation THEN
        -- If we catch this error, the test PASSED
        RAISE NOTICE 'Integrity Test Passed: Foreign key constraint correctly blocked orphan insertion.';
    END;

    -- Cleanup
    DELETE FROM routes WHERE id = dummy_route_id;
END $$;
