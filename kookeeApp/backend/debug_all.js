const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'kookee',
    password: 'Kmantalgo#1',
    port: 5432,
});

async function debugAll() {
    let output = '--- COMPREHENSIVE REPORTS DEBUG ---\n';
    try {
        const res = await pool.query(`
      SELECT 
        r.report_id, 
        r.outlet_id,
        o.name as outlet_name,
        r.submitted_at,
        TO_CHAR(r.submitted_at, 'YYYY-MM-DD HH24:MI:SS') as full_ts,
        m.name as merchandiser_name
      FROM reports r
      LEFT JOIN outlets o ON r.outlet_id = o.outlet_id
      LEFT JOIN merchandisers m ON r.merchandiser_id = m.merchandiser_id
      ORDER BY r.submitted_at DESC
      LIMIT 100
    `);

        output += `Total reports in DB: ${res.rows.length}\n\n`;
        res.rows.forEach((r, i) => {
            output += `${i}. [${r.full_ts}] Outlet: ${r.outlet_name} | ID: ${r.report_id} | Merch: ${r.merchandiser_name}\n`;
        });

        fs.writeFileSync('all_reports_debug.txt', output);
        console.log('Output written to all_reports_debug.txt');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        pool.end();
    }
}

debugAll();
