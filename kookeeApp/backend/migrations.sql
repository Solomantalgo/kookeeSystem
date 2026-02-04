-- Merchandisers table
CREATE TABLE IF NOT EXISTS merchandisers (
  merchandiser_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  phone VARCHAR(20),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Outlets table (synced from mobile app array)
CREATE TABLE IF NOT EXISTS outlets (
  outlet_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(name, location)
);

-- Products table (synced from mobile app array)
CREATE TABLE IF NOT EXISTS products (
  product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  category VARCHAR(100),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Daily assignments (admin assigns outlets to merchandisers)
CREATE TABLE IF NOT EXISTS outlet_assignments (
  assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchandiser_id UUID REFERENCES merchandisers(merchandiser_id) ON DELETE CASCADE,
  outlet_id UUID REFERENCES outlets(outlet_id) ON DELETE CASCADE,
  assigned_date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(merchandiser_id, outlet_id, assigned_date)
);

-- Visits (check-ins tracked)
CREATE TABLE IF NOT EXISTS visits (
  visit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id UUID REFERENCES outlets(outlet_id) ON DELETE CASCADE,
  merchandiser_id UUID REFERENCES merchandisers(merchandiser_id) ON DELETE CASCADE,
  visit_date DATE NOT NULL,
  check_in_time TIMESTAMP NOT NULL,
  photo_proof_url TEXT,
  status VARCHAR(50) DEFAULT 'checked_in',
  synced BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Reports (product counts submitted)
CREATE TABLE IF NOT EXISTS reports (
  report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID REFERENCES visits(visit_id) ON DELETE CASCADE,
  outlet_id UUID REFERENCES outlets(outlet_id) ON DELETE CASCADE,
  merchandiser_id UUID REFERENCES merchandisers(merchandiser_id) ON DELETE CASCADE,
  submitted_at TIMESTAMP NOT NULL,
  quick_visit BOOLEAN DEFAULT false,
  synced BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Report items (individual product counts)
CREATE TABLE IF NOT EXISTS report_items (
  item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES reports(report_id) ON DELETE CASCADE,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_reports_date ON reports(submitted_at);
CREATE INDEX IF NOT EXISTS idx_assignments_date ON outlet_assignments(assigned_date);
