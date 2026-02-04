-- Sales Route Guidance App - Core Database Schema
-- Database: PostgreSQL
-- Version: 1.0

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Security & Access
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role_id UUID REFERENCES roles(id),
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    version_number BIGINT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by_user_id UUID,
    updated_by_user_id UUID
);

-- 2. CRM Layer
CREATE TABLE territories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    parent_territory_id UUID REFERENCES territories(id),
    version_number BIGINT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    local_id UUID UNIQUE, -- Used for mobile-first record creation
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    address TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    territory_id UUID REFERENCES territories(id),
    freezer_presence BOOLEAN DEFAULT FALSE,
    custom_attributes JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMPTZ, -- Soft delete
    version_number BIGINT DEFAULT 1,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by_user_id UUID REFERENCES users(id),
    updated_by_user_id UUID REFERENCES users(id)
);

CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    position VARCHAR(100),
    version_number BIGINT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Route Graph
CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    territory_id UUID REFERENCES territories(id),
    is_active BOOLEAN DEFAULT TRUE,
    version_number BIGINT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE route_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id),
    sequence_order INT NOT NULL,
    version_number BIGINT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(route_id, sequence_order)
);

CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    route_id UUID REFERENCES routes(id),
    assigned_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED')),
    notes TEXT,
    version_number BIGINT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, route_id, assigned_date)
);

-- 4. Operational Events
CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    local_id UUID UNIQUE NOT NULL, -- Mandatory for mobile sync
    assignment_id UUID REFERENCES assignments(id),
    customer_id UUID REFERENCES customers(id),
    user_id UUID REFERENCES users(id),
    started_at TIMESTAMPTZ NOT NULL, -- client_timestamp
    ended_at TIMESTAMPTZ, -- client_timestamp
    latitude_in DECIMAL(10,8),
    longitude_in DECIMAL(11,8),
    latitude_out DECIMAL(10,8),
    longitude_out DECIMAL(11,8),
    status VARCHAR(20) DEFAULT 'STARTED',
    visit_type VARCHAR(50), -- e.g., 'Scheduled', 'Ad-hoc'
    is_dirty BOOLEAN DEFAULT FALSE,
    version_number BIGINT DEFAULT 1,
    last_synced_at TIMESTAMPTZ,
    server_timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE stock_inventories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    local_id UUID UNIQUE NOT NULL,
    visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
    product_id UUID, -- Assuming a products table exists elsewhere or will be added
    quantity_on_hand INT DEFAULT 0,
    stock_status VARCHAR(50), -- e.g., 'Low', 'Out of stock', 'Healthy'
    version_number BIGINT DEFAULT 1,
    is_dirty BOOLEAN DEFAULT FALSE,
    client_timestamp TIMESTAMPTZ DEFAULT NOW(),
    server_timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE task_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    local_id UUID UNIQUE NOT NULL,
    visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
    task_type VARCHAR(100) NOT NULL, -- e.g., 'Merchandising Check', 'Competitor Scan'
    data_json JSONB NOT NULL,
    version_number BIGINT DEFAULT 1,
    is_dirty BOOLEAN DEFAULT FALSE,
    client_timestamp TIMESTAMPTZ DEFAULT NOW(),
    server_timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Spatiotemporal Data (High Throughput)
CREATE TABLE location_tracking (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    accuracy DECIMAL(10,2),
    speed DECIMAL(10,2),
    heading DECIMAL(10,2),
    client_timestamp TIMESTAMPTZ NOT NULL,
    server_timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for Performance
CREATE INDEX idx_customers_territory ON customers(territory_id);
CREATE INDEX idx_assignments_user_date ON assignments(user_id, assigned_date);
CREATE INDEX idx_visits_assignment ON visits(assignment_id);
CREATE INDEX idx_visits_user_start ON visits(user_id, started_at);
CREATE INDEX idx_location_user_time ON location_tracking(user_id, client_timestamp);
CREATE INDEX idx_task_reports_visit ON task_reports(visit_id);

-- Updated_at Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_modtime BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_territories_modtime BEFORE UPDATE ON territories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_routes_modtime BEFORE UPDATE ON routes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assignments_modtime BEFORE UPDATE ON assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_visits_modtime BEFORE UPDATE ON visits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Photo & Media Management (Aligned with MediaFile.java)
CREATE TABLE media_files (
    id BIGSERIAL PRIMARY KEY,
    server_id VARCHAR(36) UNIQUE NOT NULL, -- UUID string
    local_id VARCHAR(36),
    visit_id BIGINT NOT NULL REFERENCES visits(id),
    user_id BIGINT NOT NULL REFERENCES users(id),
    customer_id BIGINT REFERENCES customers(id),
    task_report_id BIGINT REFERENCES task_reports(id), -- Optional link
    
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT,
    file_size_bytes BIGINT,
    file_type VARCHAR(50), -- content/mime type
    media_type VARCHAR(50) NOT NULL, -- PHOTO, DOCUMENT, SIGNATURE
    upload_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    
    -- Embedded Metadata (denormalized for faster access, detailed in jsonb)
    gps_latitude DECIMAL(10,8),
    gps_longitude DECIMAL(11,8),
    gps_accuracy_meters DECIMAL(10,2),
    
    metadata JSONB, -- Full technical metadata (Exif, device info)
    
    -- BaseEntity Fields
    version_number INT DEFAULT 1,
    is_dirty BOOLEAN DEFAULT FALSE,
    last_synced_at TIMESTAMPTZ,
    created_by_user_id BIGINT,
    updated_by_user_id BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    client_timestamp TIMESTAMPTZ,
    server_timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for Media Files
CREATE INDEX idx_media_files_visit ON media_files(visit_id);
CREATE INDEX idx_media_files_user ON media_files(user_id);
CREATE INDEX idx_media_files_upload_status ON media_files(upload_status);
CREATE INDEX idx_media_files_server_id ON media_files(server_id);

-- Triggers
CREATE TRIGGER update_media_files_modtime BEFORE UPDATE ON media_files FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
