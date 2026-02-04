const express = require('express');
const router = express.Router();
const db = require('../db');

// Helper to resolve string UUIDs to numeric IDs
async function resolveId(table, identifier, idColumn = 'id', serverIdColumn = 'server_id') {
    if (!identifier) return null;
    if (typeof identifier === 'number') return identifier;
    if (typeof identifier === 'string' && identifier.length < 10) return parseInt(identifier);

    // Attempt lookup by server_id (UUID)
    try {
        const res = await db.query(`SELECT ${idColumn} FROM ${table} WHERE ${serverIdColumn} = $1`, [identifier]);
        return res.rows.length > 0 ? res.rows[0][idColumn] : null;
    } catch (e) {
        console.error(`Resolution failed for ${table}:${identifier}`, e);
        return null;
    }
}

// Sync Entity: Customers
// Sync Entity: Customers (Incremental or by Route)
router.get('/customers', async (req, res) => {
    try {
        const { last_synced, route_id } = req.query;
        let query = 'SELECT * FROM sales_customers WHERE is_active = true';
        const params = [];

        if (route_id) {
            const numericRouteId = await resolveId('sales_routes', route_id);
            if (numericRouteId) {
                query += ' AND id IN (SELECT customer_id FROM sales_route_points WHERE route_id = $1)';
                params.push(numericRouteId);
            }
        }

        if (last_synced) {
            query += ' AND updated_at > $' + (params.length + 1);
            params.push(last_synced);
        }

        // This is a simplification. Usually we'd filter by customers in the user's routes.
        const result = await db.query(query, params);
        res.json({
            items: result.rows,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error('Error syncing customers:', err);
        res.status(500).json({ error: 'Sync failed' });
    }
});

// Sync Entity: Routes (assigned to user)
router.get('/routes', async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) return res.status(400).json({ error: 'user_id required' });

        // Resolve user_id if string UUID provided
        const numericUserId = await resolveId('sales_users', user_id);
        if (!numericUserId) return res.status(404).json({ error: 'User not found' });

        const result = await db.query(`
            SELECT DISTINCT r.* 
            FROM sales_routes r
            JOIN sales_route_assignments ra ON r.id = ra.route_id
            WHERE ra.user_id = $1 AND r.is_active = true
        `, [numericUserId]);

        res.json({
            items: result.rows,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({ error: 'Sync failed' });
    }
});

// Sync Entity: Route Assignments (My Schedule)
router.get('/assignments', async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) return res.status(400).json({ error: 'user_id required' });

        // Resolve user_id if string UUID provided
        const numericUserId = await resolveId('sales_users', user_id);
        if (!numericUserId) return res.status(404).json({ error: 'User not found' });

        const result = await db.query(`
            SELECT ra.*, r.name as route_name 
            FROM sales_route_assignments ra
            JOIN sales_routes r ON ra.route_id = r.id
            WHERE ra.user_id = $1
        `, [numericUserId]);

        res.json({
            items: result.rows,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({ error: 'Sync failed' });
    }
});

// Unified Sync Endpoint (PULL ALL)
router.get('/pull-all', async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) return res.status(400).json({ error: 'user_id required' });

        // Resolve user_id if string UUID provided
        const numericUserId = await resolveId('sales_users', user_id);
        if (!numericUserId) return res.status(404).json({ error: 'User not found' });

        // 1. Get Active Assignments (Today or latest uncompleted)
        const assignments = await db.query(`
            SELECT ra.*, r.name as route_name, r.server_id as route_server_id
            FROM sales_route_assignments ra
            JOIN sales_routes r ON ra.route_id = r.id
            WHERE ra.user_id = $1 
            AND (ra.assigned_date = CURRENT_DATE OR ra.assignment_status = 'PENDING')
            ORDER BY ra.assigned_date DESC
        `, [numericUserId]);

        // 2. Get Routes strictly associated with these assignments
        const routes = await db.query(`
            SELECT DISTINCT r.* 
            FROM sales_routes r
            JOIN sales_route_assignments ra ON r.id = ra.route_id
            WHERE ra.user_id = $1 
            AND (ra.assigned_date = CURRENT_DATE OR ra.assignment_status = 'PENDING')
            AND r.is_active = true
        `, [numericUserId]);

        // 3. Get Customers strictly for these routes via route_points
        const customers = await db.query(`
            SELECT DISTINCT c.*, r.server_id as route_id
            FROM sales_customers c
            JOIN sales_route_points rp ON c.id = rp.customer_id
            JOIN sales_routes r ON rp.route_id = r.id
            JOIN sales_route_assignments ra ON r.id = ra.route_id
            WHERE ra.user_id = $1 
            AND (ra.assigned_date = CURRENT_DATE OR ra.assignment_status = 'PENDING')
            AND c.is_deleted = false
        `, [numericUserId]);

        // 4. Get active territories (General metadata)
        const territories = await db.query('SELECT * FROM sales_territories WHERE is_active = true');

        res.json({
            assignments: assignments.rows,
            routes: routes.rows,
            customers: customers.rows,
            territories: territories.rows,
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        console.error('Pull-all failed:', err);
        res.status(500).json({ error: 'Sync failed' });
    }
});

// Ingest: Breadcrumbs (Location Tracking - Batch)
router.post('/breadcrumbs', async (req, res) => {
    try {
        const { locations } = req.body; // Expect array
        if (!Array.isArray(locations)) return res.status(400).json({ error: "Invalid locations array" });

        for (const loc of locations) {
            await insertLocation(loc);
        }
        res.json({ success: true, count: locations.length });
    } catch (err) {
        console.error('Error syncing breadcrumbs:', err);
        res.status(500).json({ error: 'Sync failed' });
    }
});

// Ingest: Single Location Update (Mobile Real-time)
router.post('/locations/update', async (req, res) => {
    try {
        const loc = req.body;
        if (!loc || !loc.latitude || !loc.longitude) {
            return res.status(400).json({ error: "Invalid location data" });
        }

        await insertLocation(loc);
        res.json({ success: true });
    } catch (err) {
        console.error('Error syncing location:', err);
        res.status(500).json({ error: 'Sync failed' });
    }
});

// Helper to insert location
async function insertLocation(loc) {
    let userId = await resolveId('sales_users', loc.user_id);
    if (!userId) {
        console.warn(`[Sync] Location update failed: User ${loc.user_id} not found.`);
        return;
    }

    console.log(`[Sync] Inserting location for user ${userId}: ${loc.latitude}, ${loc.longitude}`);

    await db.query(`
        INSERT INTO sales_location_tracking 
        (user_id, latitude, longitude, timestamp, battery_percentage, is_moving, accuracy_meters)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
        userId, loc.latitude, loc.longitude,
        loc.timestamp || new Date(),
        loc.battery_level || loc.battery_percentage || loc.battery || 0,
        loc.is_moving || false,
        loc.accuracy || 0
    ]);
}

// Ingest: Visits/Audits (Sync from Mobile)
router.post('/visits/sync', async (req, res) => {
    try {
        const visit = req.body;
        if (!visit || !visit.visit_id) {
            return res.status(400).json({ error: "Invalid visit data" });
        }

        // Resolve IDs
        const numericUserId = await resolveId('sales_users', visit.user_id);
        const numericCustomerId = await resolveId('sales_customers', visit.customer_id);

        if (!numericUserId) return res.status(404).json({ error: "User not found", server_id: visit.user_id });
        if (!numericCustomerId) return res.status(404).json({ error: "Customer not found", server_id: visit.customer_id });

        // Upsert visit by visit_id (UUID from mobile)
        await db.query(`
            INSERT INTO sales_visits 
            (visit_id, user_id, customer_id, visit_date, completed, arrival_time, completion_time, notes, reason_missed, order_value)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (visit_id) DO UPDATE SET
                completed = EXCLUDED.completed,
                completion_time = EXCLUDED.completion_time,
                notes = EXCLUDED.notes,
                reason_missed = EXCLUDED.reason_missed,
                order_value = EXCLUDED.order_value,
                updated_at = CURRENT_TIMESTAMP
        `, [
            visit.visit_id,
            numericUserId,
            numericCustomerId,
            new Date(visit.arrival_time || new Date()), // Use arrival_time for date
            visit.completed || false,
            visit.arrival_time,
            visit.completion_time,
            visit.notes,
            visit.reason_missed,
            visit.order_value || 0
        ]);

        res.json({ success: true });
    } catch (err) {
        console.error('Error syncing visit:', err);
        res.status(500).json({ error: 'Sync failed' });
    }
});

// Ingest: Live Progress Update
router.post('/progress/update', async (req, res) => {
    try {
        const progress = req.body;
        if (!progress || !progress.user_id) {
            return res.status(400).json({ error: "Invalid progress data" });
        }

        const numericUserId = await resolveId('sales_users', progress.user_id);
        const numericCustomerId = await resolveId('sales_customers', progress.current_customer_id);

        if (!numericUserId) return res.status(404).json({ error: "User not found", server_id: progress.user_id });
        // NOTE: customer_id can be null if not in a visit, so we don't strictly check numericCustomerId if provided but null
        // But if it was provided and didn't resolve, that might be an issue.
        if (progress.current_customer_id && !numericCustomerId) {
            return res.status(404).json({ error: "Customer not found", server_id: progress.current_customer_id });
        }

        await db.query(`
            INSERT INTO sales_live_progress 
            (user_id, current_customer_id, status, arrival_time, last_update)
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id) DO UPDATE SET
                current_customer_id = EXCLUDED.current_customer_id,
                status = EXCLUDED.status,
                arrival_time = EXCLUDED.arrival_time,
                last_update = CURRENT_TIMESTAMP
        `, [
            numericUserId,
            numericCustomerId,
            progress.status || 'active',
            progress.arrival_time
        ]);

        res.json({ success: true });
    } catch (err) {
        console.error('Error updating progress:', err);
        res.status(500).json({ error: 'Update failed' });
    }
});

// Ingest: New Customer (From Mobile)
router.post('/customers/sync', async (req, res) => {
    try {
        const { id, customer_id, name, area, tin_number, territory_id, route_id, latitude, longitude, gps_lat, gps_lng, photo_uri, phone, notes } = req.body;

        // Fallback for fields (handling legacy queue items)
        const effectiveId = id || customer_id;

        // Mobile might send gps_lat/gps_lng from SQLite row
        const effectiveLat = latitude || gps_lat || 0;
        const effectiveLng = longitude || gps_lng || 0;

        if (!name) return res.status(400).json({ error: "Name is required" });

        // Resolve IDs to numeric
        const numericRouteId = await resolveId('sales_routes', route_id);
        const inputTerritoryId = await resolveId('sales_territories', territory_id);

        // Derive territory_id from route_id if missing
        let effectiveTerritoryId = inputTerritoryId;
        if (!effectiveTerritoryId && numericRouteId) {
            const routeRes = await db.query('SELECT territory_id FROM sales_routes WHERE id = $1', [numericRouteId]);
            if (routeRes.rows.length > 0) {
                effectiveTerritoryId = routeRes.rows[0].territory_id;
            }
        }

        if (!effectiveTerritoryId) {
            // Default to first territory if still nothing
            const tRes = await db.query('SELECT id FROM sales_territories LIMIT 1');
            if (tRes.rows.length > 0) effectiveTerritoryId = tRes.rows[0].id;
        }

        // Insert into sales_customers (Using the mobile provided 'id' as 'server_id')
        const result = await db.query(`
            INSERT INTO sales_customers 
            (server_id, name, area, tin_number, territory_id, latitude, longitude, photo_uri, location_notes, phone_primary, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
            ON CONFLICT (server_id) DO UPDATE SET
                name = EXCLUDED.name,
                area = EXCLUDED.area,
                tin_number = EXCLUDED.tin_number,
                territory_id = EXCLUDED.territory_id,
                latitude = EXCLUDED.latitude,
                longitude = EXCLUDED.longitude,
                photo_uri = EXCLUDED.photo_uri,
                location_notes = EXCLUDED.location_notes,
                phone_primary = EXCLUDED.phone_primary,
                updated_at = CURRENT_TIMESTAMP
            RETURNING id, server_id
        `, [
            effectiveId, // Use resolved ID (id or customer_id)
            name,
            area,
            tin_number,
            effectiveTerritoryId,
            effectiveLat,
            effectiveLng,
            photo_uri,
            notes,
            phone
        ]);

        const newCustomer = result.rows[0];

        // Link to Route if numericRouteId exists
        if (numericRouteId) {
            // Get max sequence
            const seqRes = await db.query('SELECT MAX(sequence_number) as max_seq FROM sales_route_points WHERE route_id = $1', [numericRouteId]);
            const nextSeq = (seqRes.rows[0].max_seq || 0) + 1;

            await db.query(`
                INSERT INTO sales_route_points (route_id, customer_id, sequence_number)
                VALUES ($1, $2, $3)
                ON CONFLICT (route_id, customer_id) DO NOTHING
            `, [numericRouteId, newCustomer.id, nextSeq]);
        }

        res.json({ success: true, server_id: newCustomer.server_id });

    } catch (err) {
        console.error('Error syncing customer:', err);
        console.error('Payload was:', req.body);
        res.status(500).json({ error: 'Sync failed', details: err.message, payload: req.body });
    }
});

module.exports = router;
