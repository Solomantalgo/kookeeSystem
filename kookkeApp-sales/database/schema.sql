-- ============================================================================
-- Sales Route Guidance App - PostgreSQL DDL Schema
-- Version: 1.0
-- Purpose: Primary source of truth for all domain entities
-- ============================================================================

-- ============================================================================
-- FOUNDATIONAL TABLES: Security & Access Control
-- ============================================================================

-- Users table: Core identity for all system actors (Sales Reps, Admins)
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    server_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_by_user_id BIGINT REFERENCES users(id),
    updated_by_user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    client_timestamp TIMESTAMP WITH TIME ZONE,
    server_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Roles table: RBAC authorization levels
CREATE TABLE IF NOT EXISTS roles (
    id BIGSERIAL PRIMARY KEY,
    server_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_system_role BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (name IN ('FIELD_SALES_REP', 'AREA_MANAGER', 'ADMIN', 'SUPER_ADMIN'))
);

-- User-Role mapping table
CREATE TABLE IF NOT EXISTS user_roles (
    id BIGSERIAL PRIMARY KEY,
    server_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    assigned_by_user_id BIGINT REFERENCES users(id),
    UNIQUE(user_id, role_id)
);

-- Permissions table: Fine-grained access control
CREATE TABLE IF NOT EXISTS permissions (
    id BIGSERIAL PRIMARY KEY,
    server_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(resource, action)
);

-- Role-Permission mapping table
CREATE TABLE IF NOT EXISTS role_permissions (
    id BIGSERIAL PRIMARY KEY,
    server_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE(role_id, permission_id)
);

-- Session Tokens: JWT and refresh token tracking
CREATE TABLE IF NOT EXISTS session_tokens (
    id BIGSERIAL PRIMARY KEY,
    server_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    token_type VARCHAR(50) NOT NULL CHECK (token_type IN ('ACCESS', 'REFRESH')),
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    device_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT
);

-- ============================================================================
-- DOMAIN TABLES: CRM & Territory Management
-- ============================================================================

-- Territory table: Geographical and organizational hierarchy
CREATE TABLE IF NOT EXISTS territories (
    id BIGSERIAL PRIMARY KEY,
    server_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    local_id VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_territory_id BIGINT REFERENCES territories(id),
    region_code VARCHAR(50),
    area_code VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_by_user_id BIGINT REFERENCES users(id),
    updated_by_user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    client_timestamp TIMESTAMP WITH TIME ZONE,
    server_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version_number INT NOT NULL DEFAULT 1,
    is_dirty BOOLEAN NOT NULL DEFAULT FALSE,
    last_synced_at TIMESTAMP WITH TIME ZONE
);

-- Customers table: Sales outlets and customer locations
CREATE TABLE IF NOT EXISTS customers (
    id BIGSERIAL PRIMARY KEY,
    server_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    local_id VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL CHECK (category IN ('WHOLESALE', 'RETAIL', 'KEY_ACCOUNT', 'DISTRIBUTOR', 'OTHER')),
    territory_id BIGINT NOT NULL REFERENCES territories(id),
    address VARCHAR(500),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(10, 8),
    location_verified BOOLEAN NOT NULL DEFAULT FALSE,
    geofence_radius_meters INT NOT NULL DEFAULT 50,
    business_type VARCHAR(100),
    owner_name VARCHAR(255),
    phone_primary VARCHAR(20),
    phone_secondary VARCHAR(20),
    email VARCHAR(255),
    whatsapp_number VARCHAR(20),
    has_freezer BOOLEAN DEFAULT FALSE,
    freezer_condition VARCHAR(50),
    last_visited TIMESTAMP WITH TIME ZONE,
    visit_frequency_days INT,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    photo_url VARCHAR(500),
    created_by_user_id BIGINT REFERENCES users(id),
    updated_by_user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    client_timestamp TIMESTAMP WITH TIME ZONE,
    server_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version_number INT NOT NULL DEFAULT 1,
    is_dirty BOOLEAN NOT NULL DEFAULT FALSE,
    last_synced_at TIMESTAMP WITH TIME ZONE
);

-- Customer Contact History: Maintain contact person details evolution
CREATE TABLE IF NOT EXISTS customer_contacts (
    id BIGSERIAL PRIMARY KEY,
    server_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    contact_name VARCHAR(255) NOT NULL,
    contact_role VARCHAR(100),
    phone_number VARCHAR(20),
    email VARCHAR(255),
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valid_to TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- OPERATIONAL TABLES: Routes & Assignments
-- ============================================================================

-- Routes table: Daily or recurring route definitions
CREATE TABLE IF NOT EXISTS routes (
    id BIGSERIAL PRIMARY KEY,
    server_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    local_id VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    route_type VARCHAR(50) NOT NULL CHECK (route_type IN ('DAILY', 'WEEKLY', 'FIXED', 'OPTIMIZED')),
    territory_id BIGINT NOT NULL REFERENCES territories(id),
    is_optimized BOOLEAN NOT NULL DEFAULT FALSE,
    total_stops INT,
    estimated_duration_minutes INT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_by_user_id BIGINT REFERENCES users(id),
    updated_by_user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    client_timestamp TIMESTAMP WITH TIME ZONE,
    server_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version_number INT NOT NULL DEFAULT 1,
    is_dirty BOOLEAN NOT NULL DEFAULT FALSE,
    last_synced_at TIMESTAMP WITH TIME ZONE
);

-- Route Points table: Sequence-ordered stops within a route
CREATE TABLE IF NOT EXISTS route_points (
    id BIGSERIAL PRIMARY KEY,
    server_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    local_id VARCHAR(255),
    route_id BIGINT NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    sequence_number INT NOT NULL,
    estimated_arrival_minutes INT,
    is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    is_visited BOOLEAN NOT NULL DEFAULT FALSE,
    created_by_user_id BIGINT REFERENCES users(id),
    updated_by_user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version_number INT NOT NULL DEFAULT 1,
    is_dirty BOOLEAN NOT NULL DEFAULT FALSE,
    last_synced_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(route_id, sequence_number),
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
);

-- Route Assignments: Maps users to routes on specific dates
CREATE TABLE IF NOT EXISTS route_assignments (
    id BIGSERIAL PRIMARY KEY,
    server_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    local_id VARCHAR(255),
    route_id BIGINT NOT NULL REFERENCES routes(id),
    user_id BIGINT NOT NULL REFERENCES users(id),
    assigned_date DATE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    assignment_status VARCHAR(50) NOT NULL CHECK (assignment_status IN ('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED')),
    completion_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
    assigned_by_user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    client_timestamp TIMESTAMP WITH TIME ZONE,
    server_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version_number INT NOT NULL DEFAULT 1,
    is_dirty BOOLEAN NOT NULL DEFAULT FALSE,
    last_synced_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(route_id, user_id, assigned_date)
);

-- ============================================================================
-- OPERATIONAL TABLES: Visit Management
-- ============================================================================

-- Visits table: Parent object for all field interactions
CREATE TABLE IF NOT EXISTS visits (
    id BIGSERIAL PRIMARY KEY,
    server_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    local_id VARCHAR(255),
    user_id BIGINT NOT NULL REFERENCES users(id),
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    route_assignment_id BIGINT REFERENCES route_assignments(id),
    visit_date DATE NOT NULL,
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INT,
    visit_status VARCHAR(50) NOT NULL CHECK (visit_status IN ('PLANNED', 'ARRIVED', 'CHECKED_IN', 'IN_PROGRESS', 'CHECKED_OUT', 'CANCELLED')),
    check_in_latitude DECIMAL(10, 8),
    check_in_longitude DECIMAL(10, 8),
    check_in_accuracy_meters DECIMAL(10, 2),
    distance_from_customer_pin_meters DECIMAL(10, 2),
    is_within_geofence BOOLEAN,
    cancellation_reason TEXT,
    notes TEXT,
    photo_count INT NOT NULL DEFAULT 0,
    created_by_user_id BIGINT REFERENCES users(id),
    updated_by_user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    client_timestamp TIMESTAMP WITH TIME ZONE,
    server_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version_number INT NOT NULL DEFAULT 1,
    is_dirty BOOLEAN NOT NULL DEFAULT FALSE,
    last_synced_at TIMESTAMP WITH TIME ZONE
);

-- Task Reports table: Dynamic form responses for each visit
CREATE TABLE IF NOT EXISTS task_reports (
    id BIGSERIAL PRIMARY KEY,
    server_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    local_id VARCHAR(255),
    visit_id BIGINT NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    task_type VARCHAR(100) NOT NULL CHECK (task_type IN ('STOCK_AUDIT', 'BRAND_PRESENCE', 'FIELD_INTELLIGENCE', 'MERCHANDISING', 'PAYMENT_COLLECTION')),
    task_status VARCHAR(50) NOT NULL CHECK (task_status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED')),
    is_mandatory BOOLEAN NOT NULL DEFAULT FALSE,
    data JSONB NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_by_user_id BIGINT REFERENCES users(id),
    updated_by_user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    client_timestamp TIMESTAMP WITH TIME ZONE,
    server_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version_number INT NOT NULL DEFAULT 1,
    is_dirty BOOLEAN NOT NULL DEFAULT FALSE,
    last_synced_at TIMESTAMP WITH TIME ZONE
);

-- Stock Inventory table: Inventory snapshot at point of visit
CREATE TABLE IF NOT EXISTS stock_inventories (
    id BIGSERIAL PRIMARY KEY,
    server_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    local_id VARCHAR(255),
    visit_id BIGINT NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    product_sku VARCHAR(100) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity_count INT NOT NULL,
    unit_of_measure VARCHAR(50),
    shelf_position VARCHAR(255),
    condition VARCHAR(50) CHECK (condition IN ('GOOD', 'DAMAGED', 'EXPIRED', 'MISPLACED')),
    notes TEXT,
    created_by_user_id BIGINT REFERENCES users(id),
    updated_by_user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    client_timestamp TIMESTAMP WITH TIME ZONE,
    server_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version_number INT NOT NULL DEFAULT 1,
    is_dirty BOOLEAN NOT NULL DEFAULT FALSE,
    last_synced_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- SPATIOTEMPORAL TABLES: Location Tracking & Geospatial Data
-- ============================================================================

-- Location Tracking (Breadcrumbs) table: High-frequency GPS data
CREATE TABLE IF NOT EXISTS location_tracking (
    id BIGSERIAL PRIMARY KEY,
    server_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    local_id VARCHAR(255),
    user_id BIGINT NOT NULL REFERENCES users(id),
    visit_id BIGINT REFERENCES visits(id),
    route_assignment_id BIGINT REFERENCES route_assignments(id),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(10, 8) NOT NULL,
    accuracy_meters DECIMAL(10, 2),
    altitude_meters DECIMAL(10, 2),
    speed_kmh DECIMAL(10, 2),
    heading_degrees DECIMAL(10, 2),
    battery_percentage SMALLINT,
    is_moving BOOLEAN,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    server_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_dirty BOOLEAN NOT NULL DEFAULT FALSE,
    last_synced_at TIMESTAMP WITH TIME ZONE
);

-- Geofence Events table: Arrival/Departure events at customer locations
CREATE TABLE IF NOT EXISTS geofence_events (
    id BIGSERIAL PRIMARY KEY,
    server_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    local_id VARCHAR(255),
    user_id BIGINT NOT NULL REFERENCES users(id),
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('ENTRY', 'EXIT', 'DWELL')),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(10, 8) NOT NULL,
    accuracy_meters DECIMAL(10, 2),
    event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    dwell_duration_seconds INT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    server_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_dirty BOOLEAN NOT NULL DEFAULT FALSE,
    last_synced_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- MEDIA TABLES: Photo & Document Management
-- ============================================================================

-- Media Files table: Reference to uploaded photos and documents
CREATE TABLE IF NOT EXISTS media_files (
    id BIGSERIAL PRIMARY KEY,
    server_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    local_id VARCHAR(255),
    visit_id BIGINT NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    file_name VARCHAR(500) NOT NULL,
    file_path VARCHAR(1000),
    file_size_bytes BIGINT,
    file_type VARCHAR(50),
    media_type VARCHAR(50) NOT NULL CHECK (media_type IN ('PHOTO', 'DOCUMENT', 'SIGNATURE', 'VIDEO')),
    upload_status VARCHAR(50) NOT NULL CHECK (upload_status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED')),
    gps_latitude DECIMAL(10, 8),
    gps_longitude DECIMAL(10, 8),
    gps_accuracy_meters DECIMAL(10, 2),
    user_id BIGINT NOT NULL REFERENCES users(id),
    customer_id BIGINT REFERENCES customers(id),
    task_report_id BIGINT REFERENCES task_reports(id),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    server_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_dirty BOOLEAN NOT NULL DEFAULT FALSE,
    last_synced_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- SYNC & OFFLINE SUPPORT TABLES: Outbox & Sync Metadata
-- ============================================================================

-- Outbox table: Persistent queue for mutations awaiting sync
CREATE TABLE IF NOT EXISTS outbox (
    id BIGSERIAL PRIMARY KEY,
    server_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    entity_type VARCHAR(100) NOT NULL,
    entity_id BIGINT,
    local_id VARCHAR(255),
    operation VARCHAR(50) NOT NULL CHECK (operation IN ('CREATE', 'UPDATE', 'DELETE')),
    payload JSONB NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED')),
    attempt_count INT NOT NULL DEFAULT 0,
    max_retries INT NOT NULL DEFAULT 5,
    last_error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sync_requested_at TIMESTAMP WITH TIME ZONE
);

-- Sync Metadata table: Track sync state per entity type per user
CREATE TABLE IF NOT EXISTS sync_metadata (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entity_type VARCHAR(100) NOT NULL,
    last_synced_at TIMESTAMP WITH TIME ZONE,
    last_sync_token VARCHAR(500),
    total_records_synced BIGINT NOT NULL DEFAULT 0,
    is_syncing BOOLEAN NOT NULL DEFAULT FALSE,
    sync_error_count INT NOT NULL DEFAULT 0,
    last_error_message TEXT,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, entity_type)
);

-- ============================================================================
-- INDEXES: Performance Optimization
-- ============================================================================

-- User and Authentication Indexes
CREATE INDEX idx_users_email ON users(email) WHERE is_deleted = FALSE;
CREATE INDEX idx_users_phone ON users(phone_number) WHERE is_deleted = FALSE;
CREATE INDEX idx_session_tokens_user_id ON session_tokens(user_id);
CREATE INDEX idx_session_tokens_expires_at ON session_tokens(expires_at) WHERE is_revoked = FALSE;

-- Territory and Customer Indexes
CREATE INDEX idx_territories_parent_id ON territories(parent_territory_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_customers_territory_id ON customers(territory_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_customers_coordinates ON customers(latitude, longitude) WHERE is_deleted = FALSE AND location_verified = TRUE;
CREATE INDEX idx_customers_name ON customers USING GIN(to_tsvector('english', name));
CREATE INDEX idx_customer_contacts_customer_id ON customer_contacts(customer_id, is_active);

-- Route and Assignment Indexes
CREATE INDEX idx_routes_territory_id ON routes(territory_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_route_points_route_id ON route_points(route_id);
CREATE INDEX idx_route_points_customer_id ON route_points(customer_id);
CREATE INDEX idx_route_assignments_user_date ON route_assignments(user_id, assigned_date);
CREATE INDEX idx_route_assignments_route_id ON route_assignments(route_id);
CREATE INDEX idx_route_assignments_status ON route_assignments(assignment_status);

-- Visit Indexes
CREATE INDEX idx_visits_user_date ON visits(user_id, visit_date);
CREATE INDEX idx_visits_customer_date ON visits(customer_id, visit_date);
CREATE INDEX idx_visits_status ON visits(visit_status);
CREATE INDEX idx_visits_check_in_time ON visits(check_in_time);
CREATE INDEX idx_visits_route_assignment_id ON visits(route_assignment_id);

-- Task Report Indexes
CREATE INDEX idx_task_reports_visit_id ON task_reports(visit_id);
CREATE INDEX idx_task_reports_type_status ON task_reports(task_type, task_status);

-- Stock Inventory Indexes
CREATE INDEX idx_stock_inventories_visit_id ON stock_inventories(visit_id);
CREATE INDEX idx_stock_inventories_product_sku ON stock_inventories(product_sku);

-- Location Tracking Indexes
CREATE INDEX idx_location_tracking_user_date ON location_tracking(user_id, recorded_at);
CREATE INDEX idx_location_tracking_visit_id ON location_tracking(visit_id);
CREATE INDEX idx_location_tracking_coordinates ON location_tracking USING BRIN (latitude, longitude);
CREATE INDEX idx_location_tracking_timestamp ON location_tracking(timestamp);

-- Geofence Event Indexes
CREATE INDEX idx_geofence_events_user_customer ON geofence_events(user_id, customer_id);
CREATE INDEX idx_geofence_events_event_type ON geofence_events(event_type);
CREATE INDEX idx_geofence_events_timestamp ON geofence_events(event_timestamp);

-- Media Files Indexes
CREATE INDEX idx_media_files_visit_id ON media_files(visit_id);
CREATE INDEX idx_media_files_user_id ON media_files(user_id);
CREATE INDEX idx_media_files_upload_status ON media_files(upload_status);

-- Sync Indexes
CREATE INDEX idx_outbox_status ON outbox(status);
CREATE INDEX idx_outbox_entity_type ON outbox(entity_type);
CREATE INDEX idx_sync_metadata_user_id ON sync_metadata(user_id);

-- ============================================================================
-- VIEWS: Common Query Patterns
-- ============================================================================

-- View: Current route assignment for a user on a specific date
CREATE OR REPLACE VIEW v_current_assignments AS
SELECT 
    ra.id,
    ra.server_id,
    ra.route_id,
    ra.user_id,
    ra.assigned_date,
    r.name as route_name,
    COUNT(rp.id) as total_stops,
    SUM(CASE WHEN v.id IS NOT NULL THEN 1 ELSE 0 END) as completed_stops,
    ROUND(100.0 * SUM(CASE WHEN v.id IS NOT NULL THEN 1 ELSE 0 END) / COUNT(rp.id), 2) as completion_percentage
FROM route_assignments ra
JOIN routes r ON ra.route_id = r.id
LEFT JOIN route_points rp ON r.id = rp.route_id
LEFT JOIN visits v ON rp.customer_id = v.customer_id AND v.user_id = ra.user_id AND v.visit_date = ra.assigned_date
WHERE ra.assignment_status IN ('ACTIVE', 'PENDING')
GROUP BY ra.id, ra.server_id, ra.route_id, ra.user_id, ra.assigned_date, r.name;

-- View: Visit completion summary by user and month
CREATE OR REPLACE VIEW v_visit_summary AS
SELECT 
    v.user_id,
    DATE_TRUNC('month', v.visit_date)::DATE as month,
    COUNT(DISTINCT v.id) as total_visits,
    COUNT(DISTINCT v.customer_id) as unique_customers,
    AVG(EXTRACT(EPOCH FROM (v.check_out_time - v.check_in_time))/60) as avg_visit_duration_minutes,
    COUNT(DISTINCT CASE WHEN v.photo_count > 0 THEN v.id END) as visits_with_photos
FROM visits v
WHERE v.visit_status = 'CHECKED_OUT'
GROUP BY v.user_id, DATE_TRUNC('month', v.visit_date);

-- ============================================================================
-- INITIAL DATA: Seed Roles and Permissions
-- ============================================================================

INSERT INTO roles (name, description, is_system_role) VALUES
    ('FIELD_SALES_REP', 'Field sales representative with route and visit access', TRUE),
    ('AREA_MANAGER', 'Area manager with assignment and reporting capabilities', TRUE),
    ('ADMIN', 'Administrator with full access except system configuration', TRUE),
    ('SUPER_ADMIN', 'Super administrator with complete system access', TRUE)
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (name, description, resource, action) VALUES
    -- User permissions
    ('view_own_profile', 'View own user profile', 'user', 'read'),
    ('edit_own_profile', 'Edit own user profile', 'user', 'write'),
    ('view_users', 'View all users', 'user', 'read'),
    ('manage_users', 'Create, update, delete users', 'user', 'write'),
    
    -- Route permissions
    ('view_own_routes', 'View own assigned routes', 'route', 'read'),
    ('view_all_routes', 'View all routes', 'route', 'read'),
    ('manage_routes', 'Create, update, delete routes', 'route', 'write'),
    
    -- Customer permissions
    ('view_assigned_customers', 'View customers in assigned territory', 'customer', 'read'),
    ('view_all_customers', 'View all customers', 'customer', 'read'),
    ('manage_customers', 'Create, update, delete customers', 'customer', 'write'),
    
    -- Visit permissions
    ('perform_visits', 'Check in and perform visits', 'visit', 'write'),
    ('view_own_visits', 'View own visits', 'visit', 'read'),
    ('view_all_visits', 'View all visits', 'visit', 'read'),
    
    -- Reporting permissions
    ('view_reports', 'View sales reports', 'report', 'read'),
    ('generate_reports', 'Generate custom reports', 'report', 'write'),
    
    -- Admin permissions
    ('manage_roles', 'Manage roles and permissions', 'admin', 'write'),
    ('manage_sync', 'Manage data sync operations', 'admin', 'write')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'FIELD_SALES_REP' AND p.name IN (
    'view_own_profile', 'edit_own_profile', 'view_own_routes', 
    'view_assigned_customers', 'perform_visits', 'view_own_visits'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'AREA_MANAGER' AND p.name IN (
    'view_own_profile', 'edit_own_profile', 'view_all_routes', 
    'manage_routes', 'view_all_customers', 'manage_customers', 'view_all_visits', 'view_reports'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'ADMIN' AND p.name IN (
    'view_own_profile', 'edit_own_profile', 'view_users', 'manage_users',
    'view_all_routes', 'manage_routes', 'view_all_customers', 'manage_customers',
    'view_all_visits', 'view_reports', 'generate_reports', 'manage_sync'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'SUPER_ADMIN'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- COMMENTS: Schema Documentation
-- ============================================================================

COMMENT ON TABLE users IS 'Core identity table for all system actors (Sales Reps, Admins). Includes sync metadata for offline support.';
COMMENT ON TABLE customers IS 'Sales outlets and customer locations with geofencing support. Includes location verification and custom attributes like freezer presence.';
COMMENT ON TABLE visits IS 'Parent object representing a complete field interaction at a customer location. Can have multiple child task reports and stock inventories.';
COMMENT ON TABLE task_reports IS 'Child objects of visits containing dynamic form responses (stock audits, brand presence, field intelligence).';
COMMENT ON TABLE location_tracking IS 'High-frequency GPS breadcrumb data for tracking representative movement and auditing field activities.';
COMMENT ON TABLE outbox IS 'Persistent queue for mutations awaiting sync to backend, enabling offline-first architecture.';

COMMENT ON COLUMN users.server_id IS 'Server-side UUID for distributed sync. Always unique and never changes after creation.';
COMMENT ON COLUMN users.local_id IS 'Local-only ID used before first sync to backend. Maps to server_id after successful sync.';
COMMENT ON COLUMN users.is_dirty IS 'Flag indicating record has local changes not yet synced to server.';
COMMENT ON COLUMN users.last_synced_at IS 'Timestamp of last successful sync to server. Null if never synced.';
COMMENT ON COLUMN users.version_number IS 'Optimistic locking version to detect concurrent modifications.';
COMMENT ON COLUMN customers.latitude IS 'WGS84 latitude stored as DECIMAL(10,8) for high precision (~1.1mm accuracy).';
COMMENT ON COLUMN customers.longitude IS 'WGS84 longitude stored as DECIMAL(10,8) for high precision (~1.1mm accuracy).';
COMMENT ON COLUMN customers.location_verified IS 'Flag indicating location was manually verified by field representative using pin tool.';
COMMENT ON COLUMN visits.is_within_geofence IS 'Computed flag indicating check-in occurred within customer geofence radius.';
COMMENT ON COLUMN location_tracking.accuracy_meters IS 'Horizontal accuracy radius from GPS device, used for signal quality filtering.';
COMMENT ON COLUMN outbox.server_id IS 'Used for idempotency on retry - if duplicate request received, server returns existing record.';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
