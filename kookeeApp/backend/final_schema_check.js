const db = require('./db');

async function check() {
    const res = await db.query(`
        SELECT table_name, column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name IN ('outlets', 'products', 'visits', 'reports', 'report_items')
        ORDER BY table_name, ordinal_position
    `);

    const schema = {};
    res.rows.forEach(row => {
        if (!schema[row.table_name]) schema[row.table_name] = [];
        schema[row.table_name].push(row.column_name);
    });

    console.log(JSON.stringify(schema, null, 2));
    process.exit(0);
}

check().catch(err => { console.error(err); process.exit(1); });
