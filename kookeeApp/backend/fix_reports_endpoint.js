const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.js');
let content = fs.readFileSync(serverPath, 'utf8');

console.log('Original file size:', content.length);

// Check if the old code exists
if (content.includes('Transform to mobile app expected format')) {
    console.log('Found the old code pattern');

    // Use a more flexible regex-based approach
    const pattern = /const result = await db\.query\(queryStr, params\);[\s\S]*?res\.json\(formatted\);/;

    const replacement = `const result = await db.query(queryStr, params);

    // For admin dashboard: return flat array with product details
    const reportsWithProducts = await Promise.all(
      result.rows.map(async (row) => {
        const itemsResult = await db.query(
          'SELECT product_name, quantity FROM report_items WHERE report_id = $1',
          [row.report_id]
        );
        
        return {
          report_id: row.report_id,
          submitted_at: row.submitted_at,
          quick_visit: row.quick_visit,
          outlet_name: row.outlet_name,
          merchandiser_name: row.merchandiser_name,
          check_in_time: row.check_in_time,
          products: itemsResult.rows
        };
      })
    );

    res.json(reportsWithProducts);`;

    // Find the section between "GET /api/reports" and "GET /api/reports/restore"
    const startMarker = '// GET /api/reports?date=YYYY-MM-DD&outlet_id=XXX&merchandiser_id=XXX';
    const endMarker = '// GET /api/reports/restore';

    const startIdx = content.indexOf(startMarker);
    const endIdx = content.indexOf(endMarker);

    if (startIdx !== -1 && endIdx !== -1) {
        const before = content.substring(0, startIdx);
        const section = content.substring(startIdx, endIdx);
        const after = content.substring(endIdx);

        // Replace within the section
        const newSection = section.replace(pattern, replacement);

        content = before + newSection + after;

        fs.writeFileSync(serverPath, content, 'utf8');
        console.log('✅ Successfully fixed /api/reports endpoint');
        console.log('New file size:', content.length);
    } else {
        console.log('❌ Could not find section markers');
        console.log('startIdx:', startIdx, 'endIdx:', endIdx);
    }
} else {
    console.log('❌ Old code pattern not found - maybe already fixed?');
}
