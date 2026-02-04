const db = require('./db');

async function fix() {
    try {
        await db.query(`
            ALTER TABLE merchandisers 
            ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        `);
        console.log('✅ last_seen column added to merchandisers');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error updating table:', err.message);
        process.exit(1);
    }
}

fix();
