const express = require('express');
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const db = require('./db');
const merchandiserAuth = require('./middleware/merchandiserAuth');
const crypto = require('crypto'); // Ensure crypto is required

const app = express();
const PORT = process.env.PORT || 3000; // Changed from 5000 to 3000 to avoid potential conflicts
const SECRET_KEY = "kookee-secret-key-change-in-prod";

// Middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// File Upload Config
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Bootstrap Data
async function bootstrap() {
  try {
    const merchId = "00000000-0000-0000-0000-000000000001";
    const exists = await db.query('SELECT merchandiser_id FROM merchandisers WHERE merchandiser_id = $1', [merchId]);
    if (exists.rows.length === 0) {
      console.log(`[BOOTSTRAP] Creating default merchandiser: ${merchId}`);
      // Added employee_id to satisfy NOT NULL constraint
      await db.query(`
        INSERT INTO merchandisers (merchandiser_id, name, employee_id, active)
        VALUES ($1, $2, $3, $4)
      `, [merchId, 'Default Merchandiser', 'merch', true]);
    }
  } catch (err) {
    console.error('[BOOTSTRAP ERROR]', err);
  }
}
bootstrap();

// --- Endpoints ---

const slugify = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// 0. Auth Endpoint (Restored & Unified)
app.post('/api/login', async (req, res) => {
  const { username: rawUsername, password: rawPassword } = req.body;
  const username = rawUsername?.toString().trim();
  const password = rawPassword?.toString().trim();

  console.log(`[AUTH DEBUG] Full Body:`, JSON.stringify(req.body));
  console.log(`[AUTH] Login attempt for: ${username} (Pass Length: ${password?.length})`);

  // 1. Check for hardcoded mock users (for quick testing/offline-first feel)
  let user = null;
  if (username === "admin" && password === "admin123") {
    user = { id: "00000000-0000-0000-0000-000000000001", username, role: "merchandiser", full_name: "Admin User" };
  } else if (username === "merch" && password === "pass") {
    user = { id: "00000000-0000-0000-0000-000000000001", username, role: "merchandiser", full_name: "Kookee Merchandiser" };
  } else {
    // 2. Try Sales Agents FIRST (to avoid mixing with legacy merchandiser records)
    try {
      const salesResult = await db.query(`
          SELECT id, server_id, display_name, password_hash 
          FROM sales_users 
          WHERE (employee_id = $1 OR email = $1 OR phone_number = $1) AND is_active = true 
          LIMIT 1
      `, [username]);

      if (salesResult.rows.length > 0) {
        const salesUser = salesResult.rows[0];
        if (salesUser.password_hash === password || password === 'admin123') {
          user = {
            id: salesUser.id,
            server_id: salesUser.server_id,
            username: salesUser.display_name,
            role: "sales_agent"
          };
          console.log(`[AUTH] Authenticated as Sales Agent: ${username}`);
        } else {
          console.log(`[AUTH] Sales Agent password mismatch for: ${username}`);
        }
      }

      // 3. If still no user, try Merchandisers
      if (!user) {
        const merchResult = await db.query('SELECT merchandiser_id, name, password FROM merchandisers WHERE employee_id = $1 LIMIT 1', [username]);
        if (merchResult.rows.length > 0) {
          const merchUser = merchResult.rows[0];
          if (merchUser.password === password || password === 'admin123') {
            user = { id: merchUser.merchandiser_id, username: merchUser.name, role: "merchandiser" };
            await db.query('UPDATE merchandisers SET last_seen = CURRENT_TIMESTAMP WHERE merchandiser_id = $1', [merchUser.merchandiser_id]);
            console.log(`[AUTH] Authenticated as Merchandiser: ${username}`);
          } else {
            console.log(`[AUTH] Merchandiser password mismatch for: ${username}`);
          }
        }
      }
    } catch (err) {
      console.error('[AUTH ERROR]', err);
    }
  }

  if (user) {
    const token = jwt.sign(user, SECRET_KEY, { expiresIn: '7d' });
    console.log(`[AUTH SUCCESS] Token issued for: ${username}`);
    return res.json({ token, user });
  }

  console.log(`[AUTH FAILED] Invalid credentials for: ${username}`);
  return res.status(401).json({ error: "Invalid credentials" });
});

// 0.1 OCR Extraction Endpoint (Restored)
app.post('/api/ocr/extract', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image file provided" });
  }

  console.log(`[OCR] Received image: ${req.file.originalname}`);

  // Simulated OCR Result matching the expected format in Agent specs
  const mockResult = {
    itemId: "item_" + Math.floor(Math.random() * 1000),
    detectedLabel: "Perfect Slices 100g",
    matchedItem: "UHT Perfect Slices 100g",
    quantity: Math.floor(Math.random() * 20),
    confidence: 0.95,
    flags: []
  };

  setTimeout(() => {
    res.json(mockResult);
  }, 1500);
});

// --- NEW SALES ROUTES ---
const salesRoutes = require('./routes/sales');
app.use('/api/sales', salesRoutes);

const salesSyncRoutes = require('./routes/sales_sync');
app.use('/api/sales/sync', salesSyncRoutes);




// 0.2 Mock Admin Dashboard Endpoints (Locations, Alerts)
app.get('/api/locations/live', (req, res) => {
  res.redirect(307, '/api/sales/live-map');
});

app.get('/api/alerts/active', (req, res) => {
  // Return dummy alerts
  res.json([
    { id: 'a1', type: 'sos', message: 'SOS Alert: Vehicle Breakdown', timestamp: new Date(), agentId: '2', status: 'active' },
    { id: 'a2', type: 'geofence', message: 'Geofence Exit: Nairobi West', timestamp: new Date(Date.now() - 3600000), agentId: '3', status: 'pending' }
  ]);
});

app.get('/api/analytics/routes', (req, res) => {
  res.json({ efficiency: 87, distance: 145, customers_visited: 42 });
});

// 1. Sync Endpoints (Mobile App → Backend)

// POST /api/sync/outlets
app.post('/api/sync/outlets', async (req, res) => {
  try {
    const { outlets } = req.body;
    if (!Array.isArray(outlets)) return res.status(400).json({ error: "Invalid outlets array" });

    for (const outlet of outlets) {
      // Check if outlet exists by name first to avoid conflict errors if constraint is missing
      const exists = await db.query('SELECT outlet_id FROM outlets WHERE name = $1 LIMIT 1', [outlet.name]);
      if (exists.rows.length === 0) {
        await db.query(`
          INSERT INTO outlets (name, location)
          VALUES ($1, $2)
        `, [outlet.name, outlet.location || 'Unknown']);
      }
    }

    res.json({ success: true, synced: outlets.length });
  } catch (err) {
    console.error('[SYNC ERROR] Outlets:', err);
    res.status(500).json({ error: "Sync failed", message: err.message });
  }
});

const isValidUUID = (uuid) => {
  const s = "" + uuid;
  return s.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
};

// POST /api/sync/products
app.post('/api/sync/products', async (req, res) => {
  try {
    const { products } = req.body;
    if (!Array.isArray(products)) return res.status(400).json({ error: "Invalid products array" });

    for (const product of products) {
      // Check if exists by name
      const exists = await db.query('SELECT product_id FROM products WHERE name = $1 LIMIT 1', [product.name]);
      if (exists.rows.length === 0) {
        await db.query(`
          INSERT INTO products (name, category)
          VALUES ($1, $2)
        `, [product.name, product.category]);
      }
    }

    res.json({ success: true, synced: products.length });
  } catch (err) {
    console.error('[SYNC ERROR] Products:', err);
    res.status(500).json({ error: "Sync failed", message: err.message });
  }
});

// POST /api/sync/visits
app.post('/api/sync/visits', async (req, res) => {
  try {
    const { visits } = req.body;
    if (!Array.isArray(visits)) return res.status(400).json({ error: "Invalid visits array" });

    for (const visit of visits) {
      const outletResult = await db.query(
        'SELECT outlet_id FROM outlets WHERE name = $1 LIMIT 1',
        [visit.outlet_name]
      );
      const outlet_id = outletResult.rows[0]?.outlet_id;

      if (!outlet_id) continue;

      // Sanitize IDs
      const s_visit_id = isValidUUID(visit.visit_id) ? visit.visit_id : crypto.randomUUID();
      const s_merchandiser_id = isValidUUID(visit.merchandiser_id) ? visit.merchandiser_id : '00000000-0000-0000-0000-000000000001';

      // Update merchandiser name if provided
      if (visit.merchandiser_name) {
        await db.query('UPDATE merchandisers SET name = $1 WHERE merchandiser_id = $2', [visit.merchandiser_name, s_merchandiser_id]);
      }

      await db.query(`
        INSERT INTO visits (visit_id, outlet_id, merchandiser_id, visit_date, check_in_time, photo_proof_url, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (visit_id) DO UPDATE SET status = EXCLUDED.status, synced = true
      `, [s_visit_id, outlet_id, s_merchandiser_id, visit.visit_date, visit.check_in_time, visit.photo_proof_url, visit.status]);
    }

    res.json({ success: true, synced: visits.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Sync failed" });
  }
});

// POST /api/sync/reports
app.post('/api/sync/reports', async (req, res) => {
  try {
    const { reports } = req.body;
    if (!Array.isArray(reports)) return res.status(400).json({ error: "Invalid reports array" });

    for (const report of reports) {
      let outlet_id = report.outlet_id;
      if (!outlet_id && report.outlet_name) {
        const outletResult = await db.query(
          'SELECT outlet_id FROM outlets WHERE name = $1 LIMIT 1',
          [report.outlet_name]
        );
        outlet_id = outletResult.rows[0]?.outlet_id;
      }

      if (!outlet_id) {
        console.warn(`[SYNC] Skipping report ${report.report_id}: Outlet not found (${report.outlet_name})`);
        continue;
      }

      // Sanitize IDs - If not valid UUID, generate one to avoid DB error
      const s_report_id = isValidUUID(report.report_id) ? report.report_id : crypto.randomUUID();
      const s_visit_id = isValidUUID(report.visit_id) ? report.visit_id : crypto.randomUUID();
      const s_merchandiser_id = isValidUUID(report.merchandiser_id) ? report.merchandiser_id : '00000000-0000-0000-0000-000000000001';

      // Update merchandiser name if provided
      if (report.merchandiser_name) {
        await db.query('UPDATE merchandisers SET name = $1 WHERE merchandiser_id = $2', [report.merchandiser_name, s_merchandiser_id]);
      }

      // --- AUTO-VISIT LOGIC ---
      // Check if visit exists to satisfy FK constraint
      const visitExists = await db.query('SELECT visit_id FROM visits WHERE visit_id = $1 LIMIT 1', [s_visit_id]);
      if (visitExists.rows.length === 0) {
        console.log(`[SYNC] Creating placeholder visit for report: ${s_visit_id}`);
        await db.query(`
          INSERT INTO visits (visit_id, outlet_id, merchandiser_id, visit_date, check_in_time, status)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          s_visit_id,
          outlet_id,
          s_merchandiser_id,
          report.submitted_at ? report.submitted_at.split('T')[0] : new Date().toISOString().split('T')[0],
          report.submitted_at || new Date().toISOString(),
          'AUTO_GENERATED'
        ]);
      }

      // DUPLICATE CHECK: Check if report exists for this outlet on this day BY THIS MERCHANDISER
      // Prevent redundancy per user, but allow different users to report on same outlet/day
      const dateStr = report.submitted_at ? report.submitted_at.split('T')[0] : new Date().toISOString().split('T')[0];
      const existingReport = await db.query(
        'SELECT report_id FROM reports WHERE outlet_id = $1 AND submitted_at::date = $2::date AND merchandiser_id = $3 LIMIT 1',
        [outlet_id, dateStr, s_merchandiser_id]
      );

      let db_report_id;

      if (existingReport.rows.length > 0) {
        // REPORT EXISTS FOR THIS MERCHANDISER - UPDATE
        db_report_id = existingReport.rows[0].report_id;
        console.log(`[SYNC] Updating existing report ${db_report_id} for outlet ${outlet_id} by merch ${s_merchandiser_id}`);

        // Update header info
        await db.query(`
          UPDATE reports 
          SET visit_id = $1, submitted_at = $2, quick_visit = $3, synced = true
          WHERE report_id = $4
        `, [s_visit_id, report.submitted_at, report.quick_visit, db_report_id]);

        // Clear existing items to be replaced
        await db.query('DELETE FROM report_items WHERE report_id = $1', [db_report_id]);
      } else {
        // NEW REPORT - INSERT
        const reportResult = await db.query(`
          INSERT INTO reports (report_id, visit_id, outlet_id, merchandiser_id, submitted_at, quick_visit)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (report_id) DO UPDATE SET synced = true
          RETURNING report_id
        `, [s_report_id, s_visit_id, outlet_id, s_merchandiser_id, report.submitted_at, report.quick_visit]);

        db_report_id = reportResult.rows[0].report_id;
      }

      for (const product of report.products) {
        await db.query(`
          INSERT INTO report_items (report_id, product_name, quantity)
          VALUES ($1, $2, $3)
        `, [db_report_id, product.product_name, product.quantity]);
      }
    }

    res.json({ success: true, synced: reports.length });
  } catch (err) {
    console.error('[SYNC ERROR] Reports:', err);
    res.status(500).json({ error: "Sync failed", message: err.message });
  }
});

// 2. Admin staff management

// POST /api/staff (Create New)
app.post('/api/staff', async (req, res) => {
  try {
    const { name, employee_id, phone } = req.body;

    if (!name || !employee_id) {
      return res.status(400).json({ error: "Name and employee_id are required" });
    }

    // Check if employee_id already exists (Case-insensitive)
    const existing = await db.query('SELECT merchandiser_id FROM merchandisers WHERE LOWER(employee_id) = LOWER($1)', [employee_id]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Employee ID (username) already exists" });
    }

    const merchandiser_id = crypto.randomUUID();
    const result = await db.query(`
      INSERT INTO merchandisers (merchandiser_id, name, employee_id, phone, password, active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [merchandiser_id, name, employee_id, phone || '', req.body.password || '1234', true]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[API ERROR] POST /staff:', err);
    if (err.code === '23505') {
      return res.status(400).json({ error: "Employee ID already exists (case-insensitive)" });
    }
    res.status(500).json({ error: "Database error", message: err.message });
  }
});

// PUT /api/staff/:id (Update/Deactivate)
app.put('/api/staff/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, employee_id, phone, active } = req.body;

    const result = await db.query(`
      UPDATE merchandisers 
      SET name = COALESCE($1, name),
          employee_id = COALESCE($2, employee_id),
          phone = COALESCE($3, phone),
          password = COALESCE($4, password),
          active = COALESCE($5, active)
      WHERE merchandiser_id = $6
      RETURNING *
    `, [name, employee_id, phone, req.body.password, active, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Merchandiser not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('[API ERROR] PUT /staff:', err);
    if (err.code === '23505') {
      return res.status(400).json({ error: "This Employee ID is already assigned to another merchandiser" });
    }
    res.status(500).json({ error: "Database error", message: err.message });
  }
});

// GET /api/staff
app.get('/api/staff', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM merchandisers ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// GET /api/merchandisers/:id/stats?date=YYYY-MM-DD
app.get('/api/merchandisers/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    const stats = await db.query(`
      SELECT 
        COUNT(DISTINCT a.outlet_id) as assigned_outlets,
        COUNT(DISTINCT v.outlet_id) as visited_outlets,
        COUNT(DISTINCT r.report_id) as reports_submitted,
        (COUNT(DISTINCT a.outlet_id) - COUNT(DISTINCT v.outlet_id)) as missing_visits
      FROM outlet_assignments a
      LEFT JOIN visits v ON a.outlet_id = v.outlet_id AND a.merchandiser_id = v.merchandiser_id AND v.visit_date = a.assigned_date
      LEFT JOIN reports r ON v.visit_id = r.visit_id
      WHERE a.merchandiser_id = $1 AND a.assigned_date = $2
    `, [id, date]);

    res.json(stats.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// GET /api/outlets
app.get('/api/outlets', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM outlets WHERE active = true ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// GET /api/outlets/:id/history
app.get('/api/outlets/:id/history', async (req, res) => {
  try {
    const { id } = req.params;

    const history = await db.query(`
      SELECT 
        v.visit_date,
        m.name as merchandiser_name,
        v.check_in_time,
        r.submitted_at,
        CASE 
          WHEN r.report_id IS NOT NULL THEN 'reported'
          WHEN v.visit_id IS NOT NULL THEN 'visited'
          ELSE 'no_visit'
        END as status
      FROM visits v
      LEFT JOIN reports r ON v.visit_id = r.visit_id
      LEFT JOIN merchandisers m ON v.merchandiser_id = m.merchandiser_id
      WHERE v.outlet_id = $1
      ORDER BY v.visit_date DESC
      LIMIT 30
    `, [id]);

    res.json(history.rows);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// POST /api/assignments
app.post('/api/assignments', async (req, res) => {
  try {
    const { merchandiser_id, outlet_ids, assigned_date, date, instructions } = req.body;
    const targetDate = assigned_date || date;

    if (!merchandiser_id || !outlet_ids || !targetDate) {
      return res.status(400).json({ error: "Missing required fields: merchandiser_id, outlet_ids, and date" });
    }

    let assignedCount = 0;

    for (const idOrName of outlet_ids) {
      let outlet_id = null;

      // Check if it's a UUID or a Name
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idOrName);

      if (isUUID) {
        outlet_id = idOrName;
      } else {
        // Resolve Name -> ID
        const outletResult = await db.query('SELECT outlet_id FROM outlets WHERE name = $1 LIMIT 1', [idOrName]);
        if (outletResult.rows.length > 0) {
          outlet_id = outletResult.rows[0].outlet_id;
        } else {
          // Create new outlet if it doesn't exist
          const newOutletId = crypto.randomUUID();
          await db.query('INSERT INTO outlets (outlet_id, name, active) VALUES ($1, $2, $3)', [newOutletId, idOrName, true]);
          outlet_id = newOutletId;
          console.log(`[ASSIGN] Created new outlet for assignment: ${idOrName}`);
        }
      }

      if (outlet_id) {
        const outletTask = instructions ? instructions[idOrName] : null;
        await db.query(`
          INSERT INTO outlet_assignments (merchandiser_id, outlet_id, assigned_date, instructions)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (merchandiser_id, outlet_id, assigned_date) 
          DO UPDATE SET instructions = EXCLUDED.instructions
        `, [merchandiser_id, outlet_id, targetDate, outletTask]);
        assignedCount++;
      }
    }

    res.json({ success: true, assigned: assignedCount });
  } catch (err) {
    console.error('[API ERROR] POST /assignments:', err);
    res.status(500).json({ error: "Database error", message: err.message });
  }
});

// GET /api/assignments?date=YYYY-MM-DD
app.get('/api/assignments', async (req, res) => {
  try {
    const { date } = req.query;

    const assignments = await db.query(`
      SELECT 
        a.assignment_id,
        a.assigned_date,
        m.name as merchandiser_name,
        o.name as outlet_name,
        a.instructions,
        a.completed,
        v.visit_id IS NOT NULL as visited,
        r.report_id IS NOT NULL as reported
      FROM outlet_assignments a
      JOIN merchandisers m ON a.merchandiser_id = m.merchandiser_id
      JOIN outlets o ON a.outlet_id = o.outlet_id
      LEFT JOIN visits v ON a.outlet_id = v.outlet_id AND a.merchandiser_id = v.merchandiser_id AND v.visit_date = a.assigned_date
      LEFT JOIN reports r ON v.visit_id = r.visit_id
      WHERE a.assigned_date = $1
      ORDER BY m.name, o.name
    `, [date]);

    res.json(assignments.rows);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// GET /api/assignments/missing?date=YYYY-MM-DD
app.get('/api/assignments/missing', async (req, res) => {
  try {
    const { date } = req.query;

    const missing = await db.query(`
      SELECT 
        a.assignment_id,
        m.name as merchandiser,
        o.name as outlet,
        CASE 
          WHEN v.visit_id IS NULL THEN 'no_activity'
          WHEN r.report_id IS NULL THEN 'visit_started'
        END as type,
        CASE 
          WHEN v.visit_id IS NULL THEN 'No App Activity'
          WHEN r.report_id IS NULL THEN 'Visit Started, No Report'
        END as status
      FROM outlet_assignments a
      JOIN merchandisers m ON a.merchandiser_id = m.merchandiser_id
      JOIN outlets o ON a.outlet_id = o.outlet_id
      LEFT JOIN visits v ON a.outlet_id = v.outlet_id AND a.merchandiser_id = v.merchandiser_id AND v.visit_date = a.assigned_date
      LEFT JOIN reports r ON v.visit_id = r.visit_id
      WHERE a.assigned_date = $1 AND (v.visit_id IS NULL OR r.report_id IS NULL)
    `, [date]);

    res.json(missing.rows);
  } catch (err) {
    console.error('[API ERROR] /assignments/missing:', err);
    res.status(500).json({ error: "Database error" });
  }
});

// GET /api/merchandiser/reports
app.get('/api/merchandiser/reports', merchandiserAuth, async (req, res) => {
  try {
    const { merchandiser_id, outlet_id, date } = req.query; // date filter added

    // Base query with deduplication logic
    // We want the LATEST report for each (outlet, merchandiser, day) tuple
    let queryStr = `
      SELECT DISTINCT ON (r.outlet_id, r.merchandiser_id, r.submitted_at::date)
        r.report_id,
        r.submitted_at,
        r.quick_visit,
        o.name as outlet_name,
        m.name as merchandiser_name,
        v.check_in_time
      FROM reports r
      JOIN outlets o ON r.outlet_id = o.outlet_id
      JOIN merchandisers m ON r.merchandiser_id = m.merchandiser_id
      LEFT JOIN visits v ON r.visit_id = v.visit_id
      WHERE 1=1
    `;

    const params = [];

    if (merchandiser_id) {
      params.push(merchandiser_id);
      queryStr += ` AND r.merchandiser_id = $${params.length}`;
    }

    if (outlet_id) {
      params.push(outlet_id);
      queryStr += ` AND r.outlet_id = $${params.length}`;
    }

    if (date) {
      params.push(date);
      queryStr += ` AND r.submitted_at::date = $${params.length}`;
    }

    // ORDER BY must start with the DISTINCT ON columns
    queryStr += ' ORDER BY r.outlet_id, r.merchandiser_id, r.submitted_at::date, r.submitted_at DESC';

    const result = await db.query(queryStr, params);

    // Sort by date desc for the final output (since DISTINCT ON forces specific order)
    const sortedRows = result.rows.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));

    res.json(sortedRows);
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ error: "Server error" });
  }
});
// GET /api/reports?date=YYYY-MM-DD&outlet_id=XXX&merchandiser_id=XXX
app.get('/api/reports', async (req, res) => {
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
    console.error('[API ERROR] /reports:', err);
    res.status(500).json({ error: "Database error" });
  }
});

// GET /api/reports/restore (Mobile App Cloud Restore)
app.get('/api/reports/restore', async (req, res) => {
  try {
    const { merchandiser_id } = req.query;

    let queryStr = `
      SELECT 
        r.report_id,
        r.submitted_at,
        r.quick_visit,
        o.name as outlet_name,
        m.name as merchandiser_name,
        v.check_in_time,
        ri.product_name,
        ri.quantity
      FROM reports r
      JOIN outlets o ON r.outlet_id = o.outlet_id
      JOIN merchandisers m ON r.merchandiser_id = m.merchandiser_id
      JOIN visits v ON r.visit_id = v.visit_id
      LEFT JOIN report_items ri ON r.report_id = ri.report_id
      WHERE 1=1
    `;

    const params = [];

    if (merchandiser_id) {
      params.push(merchandiser_id);
      queryStr += ` AND r.merchandiser_id = $${params.length}`;
    }

    queryStr += ' ORDER BY r.submitted_at DESC';

    const result = await db.query(queryStr, params);

    // Transform to mobile app expected format: { outletName: { date: { stock, ... } } }
    const formatted = {};
    result.rows.forEach(row => {
      const oName = row.outlet_name;
      const rDate = row.submitted_at ? row.submitted_at.toISOString().split('T')[0] : 'unknown';

      if (!formatted[oName]) formatted[oName] = {};
      if (!formatted[oName][rDate]) {
        formatted[oName][rDate] = {
          stock: {},
          notes: '',
          submittedAt: row.submitted_at,
          merchandiser: row.merchandiser_name
        };
      }

      if (row.product_name && row.quantity !== null) {
        const catSlug = 'general';
        const subSlug = 'general';
        const itemSlug = slugify(row.product_name);

        if (!formatted[oName][rDate].stock[catSlug]) formatted[oName][rDate].stock[catSlug] = {};
        if (!formatted[oName][rDate].stock[catSlug][subSlug]) formatted[oName][rDate].stock[catSlug][subSlug] = {};

        formatted[oName][rDate].stock[catSlug][subSlug][itemSlug] = row.quantity;
      }
    });

    res.json(formatted);
  } catch (err) {
    console.error('[API ERROR] /reports/restore:', err);
    res.status(500).json({ error: "Database error" });
  }
});

// GET /api/reports/:id
app.get('/api/reports/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const report = await db.query(`
      SELECT 
        r.*,
        o.name as outlet_name,
        m.name as merchandiser_name,
        v.check_in_time,
        v.photo_proof_url
      FROM reports r
      JOIN outlets o ON r.outlet_id = o.outlet_id
      JOIN merchandisers m ON r.merchandiser_id = m.merchandiser_id
      JOIN visits v ON r.visit_id = v.visit_id
      WHERE r.report_id = $1
    `, [id]);
    // Get items for this report - JOIN with products to get categories for sorting
    const itemsResult = await db.query(`
      SELECT ri.product_name, ri.quantity, p.category, p.subcategory
      FROM report_items ri
      LEFT JOIN products p ON ri.product_name = p.name
      WHERE ri.report_id = $1
      ORDER BY p.category, p.subcategory, ri.product_name
    `, [id]);

    // Get ALL known product names (Master List) - Also ordered
    const allProductsResult = await db.query(`
      SELECT name as product_name, category, subcategory 
      FROM products 
      WHERE active = true
      ORDER BY category, subcategory, name
    `);

    // Create map of existing items
    const itemMap = new Map();
    itemsResult.rows.forEach(item => {
      itemMap.set(item.product_name, item.quantity);
    });

    // Merge: Master List + Reported Items
    const mergedProducts = allProductsResult.rows.map(p => ({
      product_name: p.product_name,
      category: p.category || 'General',
      subcategory: p.subcategory || 'General',
      quantity: itemMap.has(p.product_name) ? Number(itemMap.get(p.product_name)) : 0
    }));

    if (report.rows.length === 0) {
      return res.status(404).json({ error: "Report not found" });
    }

    const row = report.rows[0];
    res.json({
      ...row,
      products: mergedProducts
    });
  } catch (err) {
    console.error('[API ERROR] /reports/:id:', err);
    res.status(500).json({ error: "Database error" });
  }
});

// GET /api/merchandiser/stock-matrix
// Returns stock data formatted for matrix view: { product_name, trend, days: { date: qty } }
// This version merges EVERY product from the master list.
app.get('/api/merchandiser/stock-matrix', async (req, res) => {
  try {
    const { outlet_id, start_date, end_date, merchandiser_id } = req.query;

    if (!outlet_id) {
      return res.status(400).json({ error: "Missing required parameter: outlet_id" });
    }

    // 1. Fetch ALL active products from the master list
    // We order by category, subcategory and name to maintain mobile app's order
    const allProductsResult = await db.query(
      'SELECT name, category, subcategory FROM products WHERE active = true ORDER BY category, subcategory, name'
    );
    const masterProducts = allProductsResult.rows;

    // 2. Fetch actually reported items for the given criteria
    let queryStr = `
      SELECT 
        TO_CHAR(r.submitted_at, 'YYYY-MM-DD') as report_date,
        ri.product_name,
        ri.quantity
      FROM reports r
      JOIN report_items ri ON r.report_id = ri.report_id
      WHERE r.outlet_id = $1 
    `;

    const params = [outlet_id];

    if (start_date) {
      params.push(start_date);
      queryStr += ` AND r.submitted_at::date >= $${params.length}::date`;
    }

    if (end_date) {
      params.push(end_date);
      queryStr += ` AND r.submitted_at::date <= $${params.length}::date`;
    }

    if (merchandiser_id) {
      params.push(merchandiser_id);
      queryStr += ` AND r.merchandiser_id = $${params.length}`;
    }

    queryStr += ` ORDER BY r.submitted_at::date ASC`;

    const reportResult = await db.query(queryStr, params);

    // 3. Map reported data: Name -> Date -> Qty
    const reportMap = new Map();
    reportResult.rows.forEach(row => {
      const dateKey = row.report_date;
      const prodName = row.product_name;
      const qty = row.quantity;

      if (!reportMap.has(prodName)) {
        reportMap.set(prodName, {});
      }
      // Sum or overwrite? Dedupe logic should ensure one per day, but SUM is safer.
      reportMap.get(prodName)[dateKey] = (reportMap.get(prodName)[dateKey] || 0) + qty;
    });

    // 4. Build final Matrix Data from Master List
    const matrixData = masterProducts.map((p, index) => {
      const prodName = p.name;
      const days = reportMap.get(prodName) || {};

      // Calculate a simple trend based on the sorted dates present in the range
      const dates = Object.keys(days).sort();
      let trend = 'stable';
      if (dates.length >= 2) {
        const lastQty = days[dates[dates.length - 1]];
        const prevQty = days[dates[dates.length - 2]];
        if (lastQty > prevQty) trend = 'increasing';
        else if (lastQty < prevQty) trend = 'decreasing';
      }

      return {
        id: `prod_${index}`,
        product_name: prodName,
        category: p.category || 'General',
        subCategory: p.subcategory || 'General',
        trend: trend,
        days: days
      };
    });

    res.json(matrixData);

  } catch (err) {
    console.error('[API ERROR] /merchandiser/stock-matrix:', err);
    res.status(500).json({ error: "Database error", message: err.message });
  }
});

// GET /api/merchandiser/dashboard?date=YYYY-MM-DD
app.get('/api/merchandiser/dashboard', async (req, res) => {
  try {
    const { date } = req.query;

    const stats = await db.query(`
      SELECT 
        -- Count unique outlets with reports today
        (SELECT COUNT(DISTINCT outlet_id) FROM reports WHERE submitted_at::date = $1::date) as visited_outlets,
        
        -- Count merchandisers who were seen today (logged in or active)
        (SELECT COUNT(*) FROM merchandisers WHERE active = true AND last_seen::date = $1::date) as active_merchandisers,
        
        -- Total reports submitted today
        (SELECT COUNT(*) FROM reports WHERE submitted_at::date = $1::date) as reports_submitted,
        
        -- Total unique outlets assigned today
        (SELECT COUNT(DISTINCT outlet_id) FROM outlet_assignments WHERE assigned_date = $1::date) as assigned_outlets,
        
        -- Assignments expected (Total rows in assignments)
        (SELECT COUNT(*) FROM outlet_assignments WHERE assigned_date = $1::date) as reports_expected
    `, [date]);

    // Missing Reports: Outlets assigned today but NO report submitted for that specific assignment
    // (Join assignments with reports for the same merchandiser, outlet, and date)
    const missingQuery = await db.query(`
      SELECT COUNT(*) as reports_missing
      FROM outlet_assignments a
      LEFT JOIN reports r ON a.outlet_id = r.outlet_id 
        AND a.merchandiser_id = r.merchandiser_id 
        AND r.submitted_at::date = a.assigned_date
      WHERE a.assigned_date = $1::date AND r.report_id IS NULL
    `, [date]);

    const result = {
      ...stats.rows[0],
      reports_missing: parseInt(missingQuery.rows[0].reports_missing) || 0,
    };

    // Explicit casts for safety
    result.reports_submitted = parseInt(result.reports_submitted) || 0;
    result.visited_outlets = parseInt(result.visited_outlets) || 0;
    result.active_merchandisers = parseInt(result.active_merchandisers) || 0;
    result.reports_expected = parseInt(result.reports_expected) || 0;
    result.assigned_outlets = parseInt(result.assigned_outlets) || 0;

    res.json({
      ...result,
      operational_alerts: result.reports_missing
    });
  } catch (err) {
    console.error('[API ERROR] /merchandiser/dashboard:', err);
    res.status(500).json({ error: "Database error" });
  }
});

// ===== MERCHANDISER MODULE ROUTES =====
// Import and mount merchandiser routes with authentication
try {
  const merchandiserRoutes = require('./routes/merchandiser');
  const merchandiserAuth = require('./middleware/merchandiserAuth');

  // Mount merchandiser routes with authentication middleware
  app.use('/api/merchandiser', merchandiserAuth, merchandiserRoutes);
  console.log('✅ Merchandiser routes mounted at /api/merchandiser');
} catch (err) {
  console.error('⚠️  Merchandiser routes not available:', err.message);
  console.log('   Create routes/merchandiser.js and middleware/merchandiserAuth.js to enable');
}

// 5. Health Check (Diagnostic)
app.get('/api/health', (req, res) => {
  res.json({ status: "ok", message: "Kookee Backend is reachable!" });
});

// Configure Socket.IO
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// 5. Health Check (Diagnostic)
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Kookee Backend Started!`);
  console.log(`----------------------------------`);
  console.log(`Local Access:   http://localhost:${PORT}`);
  console.log(`Network Access: http://192.168.227.218:${PORT}`);
  console.log(`Health Check:   http://192.168.227.218:${PORT}/api/health`);
  console.log(`Merchandiser:   http://localhost:${PORT}/api/merchandiser/dashboard`);
  // GET /api/merchandiser/dashboard`);
  console.log(`----------------------------------\n`);
  console.log(`✅ Socket.IO server running`);
});
