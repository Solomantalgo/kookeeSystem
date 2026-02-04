const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'kookee',
    password: 'Kmantalgo#1',
    port: 5432,
});

async function debugReports() {
    try {
        console.log('--- DEBUGGING REPORTS ---');
        console.log('Checking for reports from Jan 29th 2025 onwards...');

        // Check specifically for Carrefour Oasis Mall
        console.log('\n--- OASIS MALL REPORTS ---');
        const oasisId = 'd2a4b00a-282a-419a-bb06-6c23d3eb5200';
        const oasisReports = await pool.query(`
      SELECT report_id, submitted_at, merchandiser_id 
      FROM reports 
      WHERE outlet_id = $1 
      ORDER BY submitted_at DESC
    `, [oasisId]);
        console.table(oasisReports.rows);

        console.log('\n--- CHECKING OUTLETS ---');
        const outlets = await pool.query("SELECT outlet_id, name FROM outlets WHERE name ILIKE '%Carrefour%'");
        console.table(outlets.rows);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        pool.end();
    }
}

debugReports();
