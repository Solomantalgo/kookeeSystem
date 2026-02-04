const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function simulateSync(name, endpoint, payload) {
    console.log(`--- Simulating ${name} ---`);
    try {
        const res = await axios.post(`${BASE_URL}${endpoint}`, payload);
        console.log(`✅ ${name} Success (Response):`, res.data);
    } catch (err) {
        console.log(`❌ ${name} Failed:`, err.response?.data || err.message);
    }
    console.log('\n');
}

async function runSimulation() {
    // 1. Malformed Outlets (Missing array)
    await simulateSync('Sync Outlets (Malformed)', '/sync/outlets', { data: [] });

    // 2. Correct Outlets (Empty array)
    await simulateSync('Sync Outlets (Empty Array)', '/sync/outlets', { outlets: [] });

    // 3. Mock Visits
    await simulateSync('Sync Visits', '/sync/visits', {
        visits: [
            {
                visit_id: "v123",
                outlet_name: "Test Outlet",
                merchandiser_id: "m456",
                visit_date: "2026-01-29",
                check_in_time: "10:00:00",
                photo_proof_url: "http://example.com/photo.jpg",
                status: "checked_in"
            }
        ]
    });

    // 4. Mock Reports
    await simulateSync('Sync Reports', '/sync/reports', {
        reports: [
            {
                report_id: "r789",
                visit_id: "v123",
                outlet_id: "o000",
                merchandiser_id: "m456",
                submitted_at: new Date().toISOString(),
                quick_visit: false,
                products: [
                    { product_name: "Product A", quantity: 5 }
                ]
            }
        ]
    });
}

runSimulation();
