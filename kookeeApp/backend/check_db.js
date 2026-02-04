const db = require('./db');

async function checkSchema() {
    try {
        console.log("Checking tables in 'kookee' database...");
        const tables = await db.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log("Tables:", tables.rows.map(r => r.table_name));

        for (const table of tables.rows) {
            const tableName = table.table_name;
            const columns = await db.query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = $1
            `, [tableName]);
            console.log(`\nTable: ${tableName}`);
            columns.rows.forEach(c => {
                console.log(`  - ${c.column_name} (${c.data_type}, nullable: ${c.is_nullable})`);
            });
        }
        process.exit(0);
    } catch (err) {
        console.error("Error checking schema:", err);
        process.exit(1);
    }
}

checkSchema();
