-- Kookee Unified Backend Schema
-- Database: PostgreSQL
-- Version: 1.0

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- Optional, for advanced geo location logic

-- =============================================
-- 1. Users & Auth
-- =============================================
CREATE TYPE user_role AS ENUM ('ADMIN', 'MERCHANDISER');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL,
    phone_number VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Session/Refresh Tokens (for Revocation)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    refresh_token_hash VARCHAR(255) NOT NULL,
    device_info VARCHAR(255),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_revoked BOOLEAN DEFAULT FALSE
);

-- =============================================
-- 2. Master Data (Outlets, Products)
-- =============================================
CREATE TABLE outlets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    address TEXT,
    location_lat DECIMAL(9, 6),
    location_lng DECIMAL(9, 6),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    sku VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(50),
    unit VARCHAR(20), -- e.g., 'g', 'ml', 'pcs'
    is_active BOOLEAN DEFAULT TRUE
);

-- =============================================
-- 3. Assignments (Merchandiser <-> Outlet)
-- =============================================
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchandiser_id UUID NOT NULL REFERENCES users(id),
    outlet_id UUID NOT NULL REFERENCES outlets(id),
    scheduled_date DATE NOT NULL,
    instructions TEXT, -- "Notes" from Admin
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, COMPLETED, MISSED
    created_by UUID REFERENCES users(id), -- Admin who assigned
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(merchandiser_id, outlet_id, scheduled_date)
);

-- =============================================
-- 4. Visits (Physical Presence)
-- =============================================
CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchandiser_id UUID NOT NULL REFERENCES users(id),
    outlet_id UUID NOT NULL REFERENCES outlets(id),
    assignment_id UUID REFERENCES assignments(id), -- Nullable for "Quick Visits"
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    start_location_lat DECIMAL(9, 6),
    start_location_lng DECIMAL(9, 6),
    end_location_lat DECIMAL(9, 6),
    end_location_lng DECIMAL(9, 6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 5. Reports & Stock Counts
-- =============================================
CREATE TYPE report_status AS ENUM ('PENDING_REVIEW', 'AUTO_APPROVED', 'FLAGGED', 'APPROVED', 'REJECTED');

CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visit_id UUID NOT NULL REFERENCES visits(id),
    image_url TEXT NOT NULL, -- S3/Cloudinary URL
    status report_status DEFAULT 'PENDING_REVIEW',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT
);

CREATE TABLE report_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES reports(id),
    product_id UUID REFERENCES products(id), -- Nullable if item not in master list yet
    raw_item_label VARCHAR(100), -- What was read from OCR if product_id not matched
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2), -- Optional
    confidence_score FLOAT, -- 0.0 to 1.0
    is_manual_override BOOLEAN DEFAULT FALSE, -- If admin changed it
    flags TEXT[] -- Array of flags: ['ARITHMETIC_DETECTED', 'CROSSED_OUT']
);

-- =============================================
-- 6. OCR Results (Raw & Audit)
-- =============================================
CREATE TABLE ocr_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES reports(id),
    provider VARCHAR(50) NOT NULL, -- 'GOOGLE_VISION', 'TEXTRACT'
    raw_response JSONB NOT NULL, -- Full raw JSON from provider
    processed_data JSONB, -- The intermediate structure before mapped to report_items
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 7. Audit Logging (Critical)
-- =============================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES users(id), -- Can be null for system actions
    action VARCHAR(50) NOT NULL, -- 'LOGIN', 'UPDATE_STOCK', 'APPROVE_REPORT'
    entity_type VARCHAR(50) NOT NULL, -- 'REPORT', 'USER', 'ASSIGNMENT'
    entity_id UUID NOT NULL,
    old_value JSONB, -- Previous state (for simple fields)
    new_value JSONB, -- New state
    metadata JSONB, -- IP address, user_agent, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Performance
CREATE INDEX idx_assignments_date ON assignments(scheduled_date);
CREATE INDEX idx_visits_merch_date ON visits(merchandiser_id, start_time);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
