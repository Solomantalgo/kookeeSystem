const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testHealth() {
    try {
        const res = await axios.get(`${BASE_URL}/health`);
        console.log('✅ Health Check:', res.data);
    } catch (err) {
        console.error('❌ Health Check Failed:', err.message);
    }
}

async function testSyncOutlets() {
    try {
        const payload = {
            outlets: [
                { name: "Test Outlet " + Date.now(), location: "Test Location" }
            ]
        };
        const res = await axios.post(`${BASE_URL}/sync/outlets`, payload);
        console.log('✅ Sync Outlets:', res.data);
    } catch (err) {
        console.log('❌ Sync Outlets (Exp Error if DB down):', err.response?.data || err.message);
    }
}

async function testSyncProducts() {
    try {
        const payload = {
            products: [
                { name: "Test Product " + Date.now(), category: "Test Category" }
            ]
        };
        const res = await axios.post(`${BASE_URL}/sync/products`, payload);
        console.log('✅ Sync Products:', res.data);
    } catch (err) {
        console.log('❌ Sync Products (Exp Error if DB down):', err.response?.data || err.message);
    }
}

async function testGetMerchandisers() {
    try {
        const res = await axios.get(`${BASE_URL}/merchandisers`);
        console.log('✅ Get Merchandisers:', res.data);
    } catch (err) {
        console.log('❌ Get Merchandisers (Exp Error if DB down):', err.response?.data || err.message);
    }
}

async function runTests() {
    console.log('Starting API Tests...\n');
    await testHealth();
    await testSyncOutlets();
    await testSyncProducts();
    await testGetMerchandisers();
    console.log('\nTests Finished.');
}

runTests();
