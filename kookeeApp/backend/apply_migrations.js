const db = require('./db');

async function migrate() {
    try {
        console.log('--- Starting Database Migrations ---');

        // 1. Sales Users
        await db.query('ALTER TABLE sales_users ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50) UNIQUE');
        console.log('Checked sales_users: employee_id');

        // 2. Sales Customers
        await db.query('ALTER TABLE sales_customers ADD COLUMN IF NOT EXISTS area VARCHAR(255)');
        await db.query('ALTER TABLE sales_customers ADD COLUMN IF NOT EXISTS tin_number VARCHAR(50)');
        await db.query('ALTER TABLE sales_customers ADD COLUMN IF NOT EXISTS photo_uri VARCHAR(500)');
        await db.query('ALTER TABLE sales_customers ADD COLUMN IF NOT EXISTS location_notes TEXT');
        await db.query('ALTER TABLE sales_customers ADD COLUMN IF NOT EXISTS visit_notes TEXT');
        console.log('Checked sales_customers: area, tin_number, photo_uri, location_notes, visit_notes');

        // 3. Sales Routes
        await db.query('ALTER TABLE sales_routes ADD COLUMN IF NOT EXISTS customer_order TEXT');
        await db.query('ALTER TABLE sales_routes ADD COLUMN IF NOT EXISTS created_by UUID');
        console.log('Checked sales_routes: customer_order, created_by');

        // 4. Sales Visits (Check if table exists, create if not)
        await db.query(`
            CREATE TABLE IF NOT EXISTS sales_visits (
                id BIGSERIAL PRIMARY KEY,
                server_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
                visit_id UUID UNIQUE NOT NULL,
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
        `);
        console.log('Checked sales_visits table');

        console.log('--- Migrations Completed Successfully ---');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
