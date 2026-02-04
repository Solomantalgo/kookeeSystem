const db = require('./db');

async function checkSchemaDetail() {
    try {
        console.log("--- TABLES ---");
        const tables = await db.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log(tables.rows.map(r => r.table_name).join(', '));

        console.log("\n--- CONSTRAINTS ON visits ---");
        const constraints = await db.query(`
            SELECT conname, pg_get_constraintdef(c.oid)
            FROM pg_constraint c
            JOIN pg_namespace n ON n.oid = c.connamespace
            WHERE n.nspname = 'public' AND conrelid = 'visits'::regclass
        `);
        constraints.rows.forEach(r => {
            console.log(`${r.conname}: ${r.pg_get_constraintdef}`);
        });

        console.log("\n--- FIRST USER (IF ANY) ---");
        try {
            const users = await db.query('SELECT * FROM users LIMIT 1');
            console.log("User table exists. First user:", users.rows[0]);
        } catch (e) {
            console.log("User table likely missing or inaccessible:", e.message);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchemaDetail();
