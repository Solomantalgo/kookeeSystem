const fs = require('fs');
const path = require('path');
const db = require('./db');

async function applySchema() {
    try {
        const schemaPath = path.join(__dirname, 'sales_schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Applying Sales Schema...');
        await db.query(schemaSql);
        console.log('Sales Schema applied successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error applying schema:', err);
        process.exit(1);
    }
}

applySchema();
