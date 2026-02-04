-- ADAPTED Sales Schema for Integration
-- Prefixing tables with 'sales_' where conflicts exist or for clarity

-- 1. Sales Users (Agents)
-- 1. Sales Users (Agents)
CREATE TABLE IF NOT EXISTS sales_users (
    id BIGSERIAL PRIMARY KEY,
    server_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    employee_id VARCHAR(50) UNIQUE, -- Added for Mobile Login
    email VARCHAR(255) UNIQUE, -- Keeping for admin comms/recovery
    phone_number VARCHAR(20),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    route_id UUID, -- Link to default route (mobile requirement)
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version_number INT NOT NULL DEFAULT 1,
    is_dirty BOOLEAN NOT NULL DEFAULT FALSE,
    last_synced_at TIMESTAMP WITH TIME ZONE
);

-- 2. Sales Territories
CREATE TABLE IF NOT EXISTS sales_territories (
    id BIGSERIAL PRIMARY KEY,
    server_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_territory_id BIGINT REFERENCES sales_territories(id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version_number INT NOT NULL DEFAULT 1
);

-- 3. Sales Customers (Outlets)
-- Keeping similar structure to 'outlets' but with Sales specific fields
CREATE TABLE IF NOT EXISTS sales_customers (
    id BIGSERIAL PRIMARY KEY,
    server_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    area VARCHAR(255), -- Mobile field
    tin_number VARCHAR(50), -- Mobile field
    category VARCHAR(100),
    territory_id BIGINT REFERENCES sales_territories(id),
    address VARCHAR(500),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    location_verified BOOLEAN NOT NULL DEFAULT FALSE,
    geofence_radius_meters INT NOT NULL DEFAULT 50,
    phone_primary VARCHAR(20),
    photo_uri VARCHAR(500), -- Mobile field (renamed from photo_url to match mobile or generic?) Mobile uses photo_uri
    location_notes TEXT,
    visit_notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version_number INT NOT NULL DEFAULT 1,
    last_synced_at TIMESTAMP WITH TIME ZONE
);

-- 4. Sales Routes
CREATE TABLE IF NOT EXISTS sales_routes (
    id BIGSERIAL PRIMARY KEY,
    server_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    territory_id BIGINT REFERENCES sales_territories(id),
    customer_order TEXT, -- JSON Array for ordering (Mobile requirement)
    created_by UUID, -- Link to sales_user server_id
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version_number INT NOT NULL DEFAULT 1
);

-- 5. Sales Route Points (Stops) - Kept for backend normalization/reporting
CREATE TABLE IF NOT EXISTS sales_route_points (
    id BIGSERIAL PRIMARY KEY,
    server_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    route_id BIGINT NOT NULL REFERENCES sales_routes(id) ON DELETE CASCADE,
    customer_id BIGINT NOT NULL REFERENCES sales_customers(id),
    sequence_number INT NOT NULL,
    is_visited BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version_number INT NOT NULL DEFAULT 1
);

-- 6. Sales Route Assignments
CREATE TABLE IF NOT EXISTS sales_route_assignments (
    id BIGSERIAL PRIMARY KEY,
    server_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    route_id BIGINT NOT NULL REFERENCES sales_routes(id),
    user_id BIGINT NOT NULL REFERENCES sales_users(id),
    assigned_date DATE NOT NULL,
    assignment_status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version_number INT NOT NULL DEFAULT 1,
    UNIQUE(route_id, user_id, assigned_date)
);

-- 7. Sales Visits (New - Matching Mobile Schema)
CREATE TABLE IF NOT EXISTS sales_visits (
    id BIGSERIAL PRIMARY KEY,
    server_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    visit_id UUID UNIQUE NOT NULL, -- Mobile generated ID
    user_id BIGINT NOT NULL REFERENCES sales_users(id),
    customer_id BIGINT NOT NULL REFERENCES sales_customers(id),
    visit_date DATE NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    arrival_time TIMESTAMP WITH TIME ZONE,
    completion_time TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    reason_missed TEXT,
    order_value DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_synced BOOLEAN DEFAULT TRUE
);

-- 8. Sales Location Tracking (Breadcrumbs)
CREATE TABLE IF NOT EXISTS sales_location_tracking (
    id BIGSERIAL PRIMARY KEY,
    server_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL REFERENCES sales_users(id),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy_meters DECIMAL(10, 2),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    battery_percentage SMALLINT,
    is_moving BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9. Sales Live Progress (Real-time Status)
CREATE TABLE IF NOT EXISTS sales_live_progress (
    user_id BIGINT PRIMARY KEY REFERENCES sales_users(id),
    current_customer_id BIGINT REFERENCES sales_customers(id),
    status VARCHAR(50),
    arrival_time TIMESTAMP WITH TIME ZONE,
    last_update TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sales_location_user_time ON sales_location_tracking(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_sales_customers_coords ON sales_customers(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_sales_visits_user_date ON sales_visits(user_id, visit_date);
