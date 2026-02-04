const db = require('./db');

async function checkColumns() {
    try {
        const tables = ['outlets', 'products', 'visits', 'reports', 'report_items'];
        for (const table of tables) {
            const r = await db.query("SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1", [table]);
            console.log(`Table: ${table}`);
            console.log(r.rows.map(x => x.column_name).join(', '));
            console.log('---');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkColumns();
