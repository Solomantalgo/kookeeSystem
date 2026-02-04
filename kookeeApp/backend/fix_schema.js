
const db = require('./db');

async function fixSchema() {
    try {
        console.log('🔧 Fixing Schema Precision...');

        // Fix sales_location_tracking longitude
        await db.query(`ALTER TABLE sales_location_tracking ALTER COLUMN longitude TYPE DECIMAL(11, 8);`);
        console.log('✅ Updated sales_location_tracking.longitude');

        // Fix sales_customers longitude
        await db.query(`ALTER TABLE sales_customers ALTER COLUMN longitude TYPE DECIMAL(11, 8);`);
        console.log('✅ Updated sales_customers.longitude');

        console.log('🎉 Schema fix complete!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Schema fix failed:', err);
        process.exit(1);
    }
}

fixSchema();
