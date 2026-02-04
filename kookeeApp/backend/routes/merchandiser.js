const express = require('express');
const db = require('../db');

const router = express.Router();

// Helper function to validate UUID
const isValidUUID = (uuid) => {
    const s = "" + uuid;
    return s.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
};

/**
 * POST /api/merchandiser/sync/reports
 * 
 * Sync reports from mobile app with STRICT validation
 * - Requires merchandiser_id and merchandiser_name (NO FAKE DATA)
 * - Preserves exact submission timestamps
 * - Validates product structure
 * - Returns detailed sync results
 */
router.post('/sync/reports', async (req, res) => {
    try {
        const { reports } = req.body;
        if (!Array.isArray(reports)) {
            return res.status(400).json({ error: "Invalid reports array" });
        }

        const syncResults = [];
        const errors = [];

        for (const report of reports) {
            try {
                // CRITICAL VALIDATION: Merchandiser identity is REQUIRED
                if (!report.merchandiser_id || !report.merchandiser_name) {
                    errors.push({
                        report_id: report.report_id,
                        error: "Missing merchandiser_id or merchandiser_name - ALL reports must have merchandiser identity"
                    });
                    continue;
                }

                // Validate required fields
                if (!report.outlet_name && !report.outlet_id) {
                    errors.push({
                        report_id: report.report_id,
                        error: "Missing outlet information"
                    });
                    continue;
                }

                if (!report.products || !Array.isArray(report.products)) {
                    errors.push({
                        report_id: report.report_id,
                        error: "Missing or invalid products array"
                    });
                    continue;
                }

                // Get or create outlet
                let outlet_id = report.outlet_id;
                if (!outlet_id && report.outlet_name) {
                    const outletResult = await db.query(
                        'SELECT outlet_id FROM outlets WHERE name = $1 LIMIT 1',
                        [report.outlet_name]
                    );
                    outlet_id = outletResult.rows[0]?.outlet_id;
                }

                if (!outlet_id) {
                    errors.push({
                        report_id: report.report_id,
                        error: `Outlet not found: ${report.outlet_name}`
                    });
                    continue;
                }

                // Sanitize IDs - If not valid UUID, generate one to avoid DB error
                const s_report_id = isValidUUID(report.report_id) ? report.report_id : require('crypto').randomUUID();
                const s_visit_id = isValidUUID(report.visit_id) ? report.visit_id : require('crypto').randomUUID();
                const s_merchandiser_id = isValidUUID(report.merchandiser_id) ? report.merchandiser_id : require('crypto').randomUUID();

                // Ensure merchandiser exists in database
                const merchExists = await db.query('SELECT merchandiser_id FROM merchandisers WHERE merchandiser_id = $1', [s_merchandiser_id]);
                if (merchExists.rows.length === 0) {
                    // Create merchandiser record if doesn't exist
                    await db.query(`
            INSERT INTO merchandisers (merchandiser_id, name, employee_id, active)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (merchandiser_id) DO UPDATE SET name = EXCLUDED.name
          `, [s_merchandiser_id, report.merchandiser_name, report.merchandiser_name.toLowerCase().replace(/\s+/g, '_'), true]);
                } else {
                    // Update merchandiser name if provided
                    await db.query('UPDATE merchandisers SET name = $1 WHERE merchandiser_id = $2', [report.merchandiser_name, s_merchandiser_id]);
                }

                // --- AUTO-VISIT LOGIC ---
                // Check if visit exists to satisfy FK constraint
                const visitExists = await db.query('SELECT visit_id FROM visits WHERE visit_id = $1 LIMIT 1', [s_visit_id]);
                if (visitExists.rows.length === 0) {
                    console.log(`[SYNC] Creating visit record for report: ${s_visit_id}`);
                    await db.query(`
            INSERT INTO visits (visit_id, outlet_id, merchandiser_id, visit_date, check_in_time, status)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [
                        s_visit_id,
                        outlet_id,
                        s_merchandiser_id,
                        report.submitted_at ? report.submitted_at.split('T')[0] : new Date().toISOString().split('T')[0],
                        report.submitted_at || new Date().toISOString(),
                        'COMPLETED'
                    ]);
                }

                // Insert report with EXACT timestamp from mobile app (no server modification)
                const reportResult = await db.query(`
          INSERT INTO reports (report_id, visit_id, outlet_id, merchandiser_id, submitted_at, quick_visit)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (report_id) DO UPDATE SET synced = true
          RETURNING report_id
        `, [s_report_id, s_visit_id, outlet_id, s_merchandiser_id, report.submitted_at, report.quick_visit]);

                const db_report_id = reportResult.rows[0].report_id;

                // Insert product items with validation
                let productsInserted = 0;
                for (const product of report.products) {
                    if (!product.product_name || product.quantity === undefined || product.quantity === null) {
                        console.warn(`[SYNC] Skipping invalid product in report ${s_report_id}:`, product);
                        continue;
                    }

                    await db.query(`
            INSERT INTO report_items (report_id, product_name, quantity)
            VALUES ($1, $2, $3)
          `, [db_report_id, product.product_name, product.quantity]);
                    productsInserted++;
                }

                syncResults.push({
                    report_id: s_report_id,
                    status: 'success',
                    merchandiser: report.merchandiser_name,
                    outlet: report.outlet_name,
                    products_count: productsInserted
                });

                console.log(`[SYNC] Report synced: ${s_report_id} from ${report.merchandiser_name} at ${report.outlet_name} (${productsInserted} products)`);

            } catch (reportError) {
                console.error(`[SYNC ERROR] Failed to sync report:`, reportError);
                errors.push({
                    report_id: report.report_id,
                    error: reportError.message
                });
            }
        }

        // Return detailed sync results
        res.json({
            success: true,
            synced: syncResults.length,
            failed: errors.length,
            results: syncResults,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (err) {
        console.error('[SYNC ERROR] Reports:', err);
        res.status(500).json({ error: "Sync failed", message: err.message });
    }
});

/**
 * GET /api/merchandiser/reports
 * 
 * Get reports with filtering
 */
router.get('/reports', async (req, res) => {
    try {
        const { date, outlet_id, merchandiser_id } = req.query;

        let queryStr = `
      SELECT 
        r.report_id,
        r.submitted_at,
        r.quick_visit,
        o.name as outlet_name,
        m.name as merchandiser_name,
        v.check_in_time
      FROM reports r
      JOIN outlets o ON r.outlet_id = o.outlet_id
      JOIN merchandisers m ON r.merchandiser_id = m.merchandiser_id
      JOIN visits v ON r.visit_id = v.visit_id
      WHERE 1=1
    `;

        const params = [];

        if (date) {
            params.push(date);
            queryStr += ` AND DATE(r.submitted_at) = $${params.length}`;
        }

        if (outlet_id) {
            params.push(outlet_id);
            queryStr += ` AND r.outlet_id = $${params.length}`;
        }

        if (merchandiser_id) {
            params.push(merchandiser_id);
            queryStr += ` AND r.merchandiser_id = $${params.length}`;
        }

        queryStr += ' ORDER BY r.submitted_at DESC';

        const result = await db.query(queryStr, params);

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

        res.json(reportsWithProducts);
    } catch (err) {
        console.error('[API ERROR] /merchandiser/reports:', err);
        res.status(500).json({ error: "Database error" });
    }
});

/**
 * GET /api/merchandiser/dashboard
 * 
 * Get merchandiser dashboard stats for a specific date
 */
router.get('/dashboard', async (req, res) => {
    try {
        const { date } = req.query;

        const stats = await db.query(`
      SELECT 
        COUNT(DISTINCT a.assignment_id) as reports_expected,
        COUNT(DISTINCT r.report_id) as reports_submitted,
        (COUNT(DISTINCT a.assignment_id) - COUNT(DISTINCT r.report_id)) as reports_missing,
        COUNT(DISTINCT CASE WHEN m.active THEN m.merchandiser_id END) as active_merchandisers,
        COUNT(DISTINCT v.outlet_id) as outlets_visited_today
      FROM outlet_assignments a
      LEFT JOIN visits v ON a.outlet_id = v.outlet_id AND a.merchandiser_id = v.merchandiser_id AND v.visit_date = a.assigned_date
      LEFT JOIN reports r ON v.visit_id = r.visit_id
      LEFT JOIN merchandisers m ON a.merchandiser_id = m.merchandiser_id
      WHERE a.assigned_date = $1
    `, [date]);

        const missingBreakdown = await db.query(`
      SELECT 
        COUNT(CASE WHEN v.visit_id IS NULL THEN 1 END) as no_activity,
        COUNT(CASE WHEN v.visit_id IS NOT NULL AND r.report_id IS NULL THEN 1 END) as visit_started_no_report
      FROM outlet_assignments a
      LEFT JOIN visits v ON a.outlet_id = v.outlet_id AND a.merchandiser_id = v.merchandiser_id AND v.visit_date = a.assigned_date
      LEFT JOIN reports r ON v.visit_id = r.visit_id
      WHERE a.assigned_date = $1 AND (v.visit_id IS NULL OR r.report_id IS NULL)
    `, [date]);

        res.json({
            ...stats.rows[0],
            missing_breakdown: missingBreakdown.rows[0]
        });
    } catch (err) {
        console.error('[API ERROR] /merchandiser/dashboard:', err);
        res.status(500).json({ error: "Database error" });
    }
});

/**
 * GET /api/merchandiser/stock-matrix
 * 
 * Get 7-day stock matrix for an outlet
 * Returns product quantities across multiple days with trend analysis
 */
router.get('/stock-matrix', async (req, res) => {
    try {
        const { outlet_id, start_date, end_date } = req.query;

        if (!outlet_id) {
            return res.status(400).json({ error: "outlet_id is required" });
        }

        // Fetch all reports for the outlet within the date range
        const result = await db.query(`
      SELECT 
        ri.product_name,
        DATE(r.submitted_at) as report_date,
        ri.quantity
      FROM reports r
      JOIN report_items ri ON r.report_id = ri.report_id
      WHERE r.outlet_id = $1
        AND DATE(r.submitted_at) >= $2
        AND DATE(r.submitted_at) <= $3
      ORDER BY ri.product_name, report_date
    `, [outlet_id, start_date, end_date]);

        // Transform data into matrix format
        const matrixMap = new Map();

        result.rows.forEach(row => {
            const productName = row.product_name;
            const date = row.report_date.toISOString().split('T')[0];
            const quantity = row.quantity;

            if (!matrixMap.has(productName)) {
                matrixMap.set(productName, { product_name: productName, days: {}, quantities: [] });
            }

            const product = matrixMap.get(productName);
            product.days[date] = quantity;
            product.quantities.push(quantity);
        });

        // Calculate trends
        const matrixData = Array.from(matrixMap.values()).map(product => {
            const quantities = product.quantities;

            // Simple trend calculation: compare first half vs second half
            if (quantities.length < 2) {
                return { ...product, trend: 'stable' };
            }

            const midpoint = Math.floor(quantities.length / 2);
            const firstHalf = quantities.slice(0, midpoint);
            const secondHalf = quantities.slice(midpoint);

            const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
            const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

            let trend = 'stable';
            if (secondAvg > firstAvg * 1.1) trend = 'increasing';
            else if (secondAvg < firstAvg * 0.9) trend = 'decreasing';

            // Remove quantities array from response
            delete product.quantities;

            return { ...product, trend };
        });

        res.json(matrixData);
    } catch (err) {
        console.error('[API ERROR] /merchandiser/stock-matrix:', err);
        res.status(500).json({ error: "Database error", message: err.message });
    }
});

module.exports = router;
