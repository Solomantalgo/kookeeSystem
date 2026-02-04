const db = require('./db');

async function debug() {
    try {
        console.log('--- TABLE: sales_location_tracking ---');
        const res = await db.query('SELECT * FROM sales_location_tracking ORDER BY timestamp DESC LIMIT 5');
        console.log(JSON.stringify(res.rows, null, 2));

        console.log('\n--- TABLE: sales_users (Active) ---');
        const users = await db.query('SELECT id, display_name, is_active FROM sales_users WHERE is_active = true');
        console.log(JSON.stringify(users.rows, null, 2));

        console.log('\n--- LIVE MAP QUERY TEST ---');
        const live = await db.query(`
            SELECT DISTINCT ON (lt.user_id)
                lt.user_id,
                lt.latitude,
                lt.longitude,
                lt.timestamp,
                u.display_name
            FROM sales_location_tracking lt
            JOIN sales_users u ON lt.user_id = u.id
            WHERE u.is_active = true
            ORDER BY lt.user_id, lt.timestamp DESC
        `);
        console.log(JSON.stringify(live.rows, null, 2));

        process.exit(0);
    } catch (err) {
        console.error('Debug failed:', err);
        process.exit(1);
    }
}

debug();
