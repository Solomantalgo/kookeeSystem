const axios = require('axios');
const db = require('./db');

const API_BASE = 'http://localhost:3000/api';

async function verifyUnification() {
    try {
        console.log('--- DB CHECK: Finding Active Sales Agent ---');
        const userRes = await db.query('SELECT id, display_name FROM sales_users WHERE is_active = true LIMIT 1');
        if (userRes.rows.length === 0) {
            console.error('❌ No active sales agents found in DB. Seeding one for test...');
            // Optional: Insert dummy user if needed, but usually there are some.
            process.exit(1);
        }
        const agent = userRes.rows[0];
        console.log(`✅ Using Agent: ${agent.display_name} (ID: ${agent.id})`);

        console.log('\n--- STEP 1: Sending GPS Update (Sync Protocol) ---');
        const locUpdate = {
            user_id: agent.id,
            latitude: -0.3476,
            longitude: 32.5825,
            timestamp: new Date().toISOString(),
            battery_percentage: 99,
            is_moving: true,
            accuracy: 5.2
        };

        // Note: The mobile app hits /api/sales/sync/locations/update
        await axios.post(`${API_BASE}/sales/sync/locations/update`, locUpdate);
        console.log('✅ GPS Update sent successfully');

        console.log('\n--- STEP 2: Verifying Unified Endpoints ---');

        console.log('\nChecking /api/sales/live-map...');
        const liveMapRes = await axios.get(`${API_BASE}/sales/live-map`);
        const foundInMap = liveMapRes.data.find(l => l.user_id == agent.id);
        if (foundInMap) {
            console.log('✅ Found agent in live-map');
            console.log(`   Location: ${foundInMap.latitude}, ${foundInMap.longitude}`);
            console.log(`   Status: ${foundInMap.status}`);
            console.log(`   Accuracy: ${foundInMap.accuracy}`);
        } else {
            console.error('❌ Agent NOT found in live-map');
        }

        console.log('\nChecking /api/locations/live (Legacy Alias)...');
        const legacyRes = await axios.get(`${API_BASE}/locations/live`, { maxRedirects: 5 });
        const foundInLegacy = legacyRes.data.find(l => l.user_id == agent.id);
        if (foundInLegacy) {
            console.log('✅ Found agent in legacy endpoint (Redirect successful)');
        } else {
            console.error('❌ Agent NOT found in legacy endpoint');
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Verification Failed:', err.message);
        if (err.response) console.error('   Response:', err.response.data);
        process.exit(1);
    }
}

verifyUnification();
