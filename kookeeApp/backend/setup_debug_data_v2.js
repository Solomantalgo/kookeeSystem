const db = require('./db');

async function setup() {
    try {
        console.log('Starting data setup v2...');

        // 1. Create Territory
        let tid;
        const checkT = await db.query("SELECT id FROM sales_territories WHERE name = 'Kampala Central'");
        if (checkT.rows.length > 0) {
            tid = checkT.rows[0].id;
            console.log('Territory Exists:', tid);
        } else {
            const t = await db.query("INSERT INTO sales_territories (name) VALUES ('Kampala Central') RETURNING id");
            tid = t.rows[0].id;
            console.log('Territory Created:', tid);
        }

        // 2. Create Route
        let rid;
        const checkR = await db.query("SELECT id FROM sales_routes WHERE name = 'Downtown Route'");
        if (checkR.rows.length > 0) {
            rid = checkR.rows[0].id;
            console.log('Route Exists:', rid);
        } else {
            const r = await db.query("INSERT INTO sales_routes (name, territory_id, is_active) VALUES ('Downtown Route', $1, true) RETURNING id", [tid]);
            rid = r.rows[0].id;
            console.log('Route Created:', rid);
        }

        // 3. Find User
        const serverId = 'df53e79d-509c-450f-a327-0766b41a6f47';
        const u = await db.query("SELECT id FROM sales_users WHERE server_id = $1", [serverId]);

        if (u.rows.length === 0) {
            console.log(`User NOT FOUND with server_id ${serverId}`);
        } else {
            const uid = u.rows[0].id;

            // 4. Assign Route
            const existingAss = await db.query(
                "SELECT id FROM sales_route_assignments WHERE user_id = $1 AND route_id = $2 AND assigned_date = CURRENT_DATE",
                [uid, rid]
            );

            if (existingAss.rows.length === 0) {
                await db.query(`
                    INSERT INTO sales_route_assignments (user_id, route_id, assigned_date, assignment_status) 
                    VALUES ($1, $2, CURRENT_DATE, 'ACTIVE')
                `, [uid, rid]);
                console.log('Assigned Route', rid, 'to User', uid);
            } else {
                console.log('Assignment ALREADY EXISTS for today');
            }
        }

        // 5. Create Customer
        let cid;
        const checkC = await db.query("SELECT id FROM sales_customers WHERE name = 'Test Shop'");
        if (checkC.rows.length > 0) {
            cid = checkC.rows[0].id;
            console.log('Customer Exists:', cid);
        } else {
            const c = await db.query(`
                INSERT INTO sales_customers (name, address, latitude, longitude, phone_primary, is_active) 
                VALUES ('Test Shop', 'Kampala Road', 0.3476, 32.5825, '0700000000', true) 
                RETURNING id
            `);
            cid = c.rows[0].id;
            console.log('Customer Created:', cid);
        }

        // 6. Add Customer to Route
        if (rid && cid) {
            const checkP = await db.query("SELECT id FROM sales_route_points WHERE route_id = $1 AND customer_id = $2", [rid, cid]);
            if (checkP.rows.length > 0) {
                console.log('Route Point Exists');
            } else {
                await db.query("INSERT INTO sales_route_points (route_id, customer_id, sequence_order) VALUES ($1, $2, 1)", [rid, cid]);
                console.log('Customer added to Route');
            }
        }

    } catch (e) {
        console.error('Setup Error:', e);
    } finally {
        process.exit();
    }
}

setup();
