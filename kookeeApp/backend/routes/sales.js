const express = require('express');
const router = express.Router();
const db = require('../db');

// ==========================================
// ADMIN DASHBOARD ENDPOINTS
// ==========================================

// 1. Get All Sales Agents
router.get('/agents', async (req, res) => {
    try {
        const result = await db.query(`
      SELECT 
        id, server_id, first_name, last_name, display_name, 
        email, phone_number, employee_id, is_active, last_synced_at
      FROM sales_users 
      ORDER BY first_name, last_name
    `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching agents:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// 2. Create New Sales Agent
// 2. Create New Sales Agent (with Optional Replacement)
router.post('/agents', async (req, res) => {
    try {
        const { first_name, last_name, email, phone_number, password, employee_id, replaced_agent_id } = req.body;

        if (!first_name || !last_name || !email || !employee_id) {
            return res.status(400).json({ error: 'First Name, Last Name, Email, and Employee ID are required' });
        }

        const displayName = `${first_name} ${last_name}`;
        // In production, hash this password!
        const passwordHash = password || '1234';

        // Start Transaction
        await db.query('BEGIN');

        try {
            // 1. Create New Agent
            const result = await db.query(`
                INSERT INTO sales_users 
                (first_name, last_name, display_name, email, phone_number, password_hash, employee_id, is_active)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `, [first_name, last_name, displayName, email, phone_number, passwordHash, employee_id, true]);

            const newAgent = result.rows[0];

            // 2. Handle Replacement Logic
            if (replaced_agent_id) {
                // Deactivate old agent
                await db.query(`
                    UPDATE sales_users 
                    SET is_active = false, is_dirty = true, updated_at = CURRENT_TIMESTAMP 
                    WHERE id = $1
                `, [replaced_agent_id]);

                // Transfer Appointments/Assignments (Only pending/active ones)
                // Assuming 'PENDING', 'IN_PROGRESS' are statuses we want to transfer.
                // Assignment status column check: sales_route_assignments.assignment_status
                const transferResult = await db.query(`
                    UPDATE sales_route_assignments
                    SET user_id = $1, updated_at = CURRENT_TIMESTAMP, version_number = version_number + 1
                    WHERE user_id = $2 AND assignment_status NOT IN ('COMPLETED', 'CANCELLED')
                `, [newAgent.id, replaced_agent_id]);

                console.log(`Transferred ${transferResult.rowCount} assignments from Agent ${replaced_agent_id} to ${newAgent.id}`);
            }

            await db.query('COMMIT');
            res.status(201).json(newAgent);

        } catch (err) {
            await db.query('ROLLBACK');
            throw err;
        }

    } catch (err) {
        console.error('Error creating agent:', err);
        if (err.code === '23505') {
            return res.status(400).json({ error: 'Email, Employee ID, or Server ID already exists' });
        }
        res.status(500).json({ error: 'Database error' });
    }
});

// 3. Update Agent (Status or Details)
router.put('/agents/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { first_name, last_name, email, phone_number, password, is_active, employee_id } = req.body;

        // Fetch current to merge display name if needed
        const current = await db.query('SELECT first_name, last_name FROM sales_users WHERE id = $1', [id]);
        if (current.rows.length === 0) return res.status(404).json({ error: 'Agent not found' });

        const newFirstName = first_name || current.rows[0].first_name;
        const newLastName = last_name || current.rows[0].last_name;
        const newDisplayName = `${newFirstName} ${newLastName}`;

        const result = await db.query(`
            UPDATE sales_users 
            SET 
                first_name = COALESCE($1, first_name),
                last_name = COALESCE($2, last_name),
                display_name = $3,
                email = COALESCE($4, email),
                phone_number = COALESCE($5, phone_number),
                password_hash = COALESCE($6, password_hash),
                employee_id = COALESCE($7, employee_id),
                is_active = COALESCE($8, is_active),
                is_dirty = true,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $9
            RETURNING *
        `, [first_name, last_name, newDisplayName, email, phone_number, password, employee_id, is_active, id]);

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating agent:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Legacy Status Toggle (Redirect to Update)
router.put('/agents/:id/status', async (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body;
    // Redirect logic handled by reusing the update query internally or just perform simple update
    try {
        const result = await db.query(`
            UPDATE sales_users SET is_active = $1, is_dirty = true WHERE id = $2 RETURNING *
        `, [is_active, id]);
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: 'DB Error' }); }
});

// 3. Get Routes in Tree Format (Territory -> Route -> Customers)
router.get('/routes/tree', async (req, res) => {
    try {
        // 1. Get Territories
        const territories = await db.query('SELECT * FROM sales_territories ORDER BY name');

        // 2. Get Routes
        const routes = await db.query('SELECT * FROM sales_routes ORDER BY name');

        // 3. Get Customers
        const customers = await db.query('SELECT * FROM sales_customers WHERE is_deleted = false ORDER BY name');

        // Fetch Route Points to link Routes <-> Customers
        const routePoints = await db.query('SELECT * FROM sales_route_points');

        // Fetch Assignments for today to show who is on what route
        // Using DATE(assigned_date) = CURRENT_DATE to be safe
        const assignments = await db.query(`
            SELECT ra.route_id, u.id as user_id, u.display_name
            FROM sales_route_assignments ra
            JOIN sales_users u ON ra.user_id = u.id
            WHERE DATE(ra.assigned_date) = CURRENT_DATE
        `);

        // Build Flat Tree: Routes -> Customers
        const treeData = routes.rows.map(r => {
            // Find assignment for today
            const assignment = assignments.rows.find(a => a.route_id == r.id);

            // Find customers in this route via route_points
            const linkedCustomers = routePoints.rows
                .filter(rp => rp.route_id == r.id)
                .map(rp => {
                    const cust = customers.rows.find(c => c.id == rp.customer_id);
                    return cust ? {
                        ...cust,
                        sequence: rp.sequence_number,
                        points_id: rp.id,
                        type: 'customer'
                    } : null;
                })
                .filter(c => c !== null)
                .sort((a, b) => a.sequence - b.sequence);

            return {
                ...r,
                type: 'route',
                assigned_to: assignment ? assignment.display_name : null,
                assigned_user_id: assignment ? assignment.user_id : null,
                children: linkedCustomers
            };
        });

        res.json(treeData);
    } catch (err) {
        console.error('Error fetching tree:', err);
        res.status(500).json({ error: 'Failed to fetch route tree' });
    }
});

// GET /api/sales/breadcrumbs?user_id=...&date=...
router.get('/breadcrumbs', async (req, res) => {
    try {
        const { user_id, userId, date } = req.query;
        const targetUserId = userId || user_id;
        const targetDate = date || new Date().toISOString().split('T')[0];

        if (!targetUserId) {
            return res.status(400).json({ error: 'user_id or userId is required' });
        }

        // Fetch location logs for this user on this day
        // date format expected: YYYY-MM-DD
        const result = await db.query(`
            SELECT latitude, longitude, timestamp, battery_percentage, is_moving
            FROM sales_location_tracking
            WHERE user_id = $1
            AND DATE(timestamp) = $2
            ORDER BY timestamp ASC
        `, [targetUserId, targetDate]);

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching breadcrumbs:', err);
        res.status(500).json({ error: 'Failed to fetch breadcrumbs' });
    }
});

// 4. Live Map Data (Latest Location for Active Agents)
router.get('/live-map', async (req, res) => {
    try {
        // Get distinct on user_id, latest timestamp
        const result = await db.query(`
      SELECT DISTINCT ON (lt.user_id)
        lt.user_id,
        lt.latitude,
        lt.longitude,
        lt.timestamp,
        lt.battery_percentage,
        lt.is_moving,
        lt.accuracy_meters as accuracy,
        u.display_name as name,
        u.employee_id,
        COALESCE(lp.status, 'traveling') as status,
        c.name as current_customer_name
      FROM sales_location_tracking lt
      JOIN sales_users u ON lt.user_id = u.id
      LEFT JOIN sales_live_progress lp ON lt.user_id = lp.user_id
      LEFT JOIN sales_customers c ON lp.current_customer_id = c.id
      WHERE u.is_active = true
      ORDER BY lt.user_id, lt.timestamp DESC
    `);

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching live map:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// ==========================================
// ROUTE MANAGEMENT
// ==========================================

// 5. Create Territory
router.post('/territories', async (req, res) => {
    try {
        const { name } = req.body;
        const result = await db.query(
            "INSERT INTO sales_territories (name) VALUES ($1) RETURNING *",
            [name]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB Error' });
    }
});

// 6. Create Route
router.post('/routes', async (req, res) => {
    try {
        let { name, territory_id } = req.body;

        // Ensure we have a territory_id
        if (!territory_id) {
            const tRes = await db.query('SELECT id FROM sales_territories LIMIT 1');
            if (tRes.rows.length > 0) {
                territory_id = tRes.rows[0].id;
            } else {
                // Create a default territory if none exists
                const newT = await db.query("INSERT INTO sales_territories (name) VALUES ('General Territory') RETURNING id");
                territory_id = newT.rows[0].id;
            }
        }

        const result = await db.query(
            "INSERT INTO sales_routes (name, territory_id, is_active) VALUES ($1, $2, true) RETURNING *",
            [name, territory_id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB Error' });
    }
});

// Update Route (Rename)
router.put('/routes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const result = await db.query(
            "UPDATE sales_routes SET name = $1, is_dirty = true, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
            [name, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB Error' });
    }
});

// 7. Assign Route to User (For Today)
router.post('/assignments', async (req, res) => {
    try {
        const { user_id, route_id } = req.body;

        // Check if already assigned today
        const check = await db.query(
            "SELECT id FROM sales_route_assignments WHERE user_id = $1 AND route_id = $2 AND assigned_date = CURRENT_DATE",
            [user_id, route_id]
        );

        if (check.rows.length > 0) {
            return res.json({ message: 'Already assigned', assignment: check.rows[0] });
        }

        const result = await db.query(`
            INSERT INTO sales_route_assignments (user_id, route_id, assigned_date, assignment_status)
            VALUES ($1, $2, CURRENT_DATE, 'ACTIVE')
            ON CONFLICT (route_id, user_id, assigned_date) 
            DO UPDATE SET assignment_status = 'ACTIVE', updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `, [user_id, route_id]);

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB Error' });
    }
});

// 8. Get Assignments for Route (Who is working here today?)
router.get('/routes/:id/assignments', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(`
            SELECT ra.*, u.display_name as user_name
            FROM sales_route_assignments ra
            JOIN sales_users u ON ra.user_id = u.id
            WHERE ra.route_id = $1 AND ra.assigned_date = CURRENT_DATE
        `, [id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB Error' });
    }
});

// 9. Get Single Customer Coordinates & Details
router.get('/customers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(
            "SELECT id, name, area, latitude, longitude, phone_primary, tin_number, photo_uri, location_notes FROM sales_customers WHERE id = $1",
            [id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB Error' });
    }
});

// 10. Get Sequential Customers for a Route (Route Overview)
router.get('/routes/:id/customers', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(`
            SELECT c.id, c.name, c.latitude, c.longitude, rp.sequence_number
            FROM sales_route_points rp
            JOIN sales_customers c ON rp.customer_id = c.id
            WHERE rp.route_id = $1
            ORDER BY rp.sequence_number ASC
        `, [id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB Error' });
    }
});

module.exports = router;
