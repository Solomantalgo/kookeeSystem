const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
const DATE = '2026-01-29';

async function testAdminDashboard() {
    console.log('--- Testing Admin Dashboard Stats ---');
    try {
        const res = await axios.get(`${BASE_URL}/dashboard/merchandiser?date=${DATE}`);
        const data = res.data;
        console.log('Response Keys:', Object.keys(data));

        // Check for specific keys required by Dashboard.tsx
        const expectedKeys = [
            'reports_submitted',
            'reports_expected',
            'missing_reports',
            'active_merchandisers',
            'visited_outlets',
            'assigned_outlets'
        ];

        expectedKeys.forEach(key => {
            if (data.hasOwnProperty(key)) {
                console.log(`✅ Found key: ${key}`);
            } else {
                console.log(`❌ Missing key: ${key}`);
            }
        });

        // Check for specific keys in missing_breakdown
        if (data.missing_breakdown) {
            console.log('Missing Breakdown Keys:', Object.keys(data.missing_breakdown));
        }

    } catch (err) {
        console.log('❌ Dashboard Test Failed (Exp if DB down):', err.response?.data || err.message);
    }
    console.log('\n');
}

async function testMissingAssignments() {
    console.log('--- Testing Missing Assignments ---');
    try {
        const res = await axios.get(`${BASE_URL}/assignments/missing?date=${DATE}`);
        console.log('✅ Missing Assignments Response Success');
        if (res.data.length > 0) {
            console.log('First Item Keys:', Object.keys(res.data[0]));
        } else {
            console.log('No missing assignments returned (empty DB).');
        }
    } catch (err) {
        console.log('❌ Missing Assignments Failed:', err.response?.data || err.message);
    }
    console.log('\n');
}

async function runTests() {
    await testAdminDashboard();
    await testMissingAssignments();
}

runTests();
