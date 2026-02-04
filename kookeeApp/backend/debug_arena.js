const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'kookee',
    password: 'Kmantalgo#1',
    port: 5432,
});

async function debugArena() {
    let output = '--- DEBUGGING ARENA MALL REPORTS (FILE OUTPUT) ---\n';
    try {
        // 1. Get Outlet ID
        const outletRes = await pool.query("SELECT outlet_id, name FROM outlets WHERE name ILIKE '%Arena%'");
        const arena = outletRes.rows[0];
        if (!arena) {
            output += 'Arena Mall not found!\n';
        } else {
            output += `Outlet: ${arena.name} | ID: ${arena.outlet_id}\n`;

            // 2. Get all reports for this outlet
            const reportsRes = await pool.query(`
        SELECT 
          report_id, 
          submitted_at, 
          TO_CHAR(submitted_at, 'YYYY-MM-DD HH24:MI:SS') as full_ts,
          TO_CHAR(submitted_at, 'YYYY-MM-DD') as date_str,
          merchandiser_id
        FROM reports 
        WHERE outlet_id = $1 
        ORDER BY submitted_at DESC
      `, [arena.outlet_id]);

            output += `\nReports found: ${reportsRes.rows.length}\n`;
            reportsRes.rows.forEach((r, i) => {
                output += `${i}. [${r.date_str}] ID: ${r.report_id} | TS: ${r.full_ts} | Merch: ${r.merchandiser_id}\n`;
            });
        }

        fs.writeFileSync('arena_debug_output.txt', output);
        console.log('Output written to arena_debug_output.txt');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        pool.end();
    }
}

debugArena();
