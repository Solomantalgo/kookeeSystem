const db = require('./db');
const fs = require('fs');
const path = require('path');

async function runSchema() {
    try {
        const schemaPath = path.join(__dirname, 'sales_schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Executing Sales Schema...');
        await db.query(schemaSql);
        console.log('✅ Sales Schema Applied Successfully!');

        // Populate some dummy data if empty
        const checkUser = await db.query('SELECT * FROM sales_users LIMIT 1');
        if (checkUser.rows.length === 0) {
            console.log('Seeding initial sales agent...');
            await db.query(`
            INSERT INTO sales_users (server_id, email, first_name, last_name, display_name, password_hash, is_active)
            VALUES 
            ('11111111-1111-1111-1111-111111111111', 'demo@kookee.com', 'Demo', 'Agent', 'Demo Agent', 'hashed_pass_123', true)
        `);
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Error applying schema:', err);
        process.exit(1);
    }
}

runSchema();
