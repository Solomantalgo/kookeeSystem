const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testLoginAndAccess() {
    console.log('🧪 Starting Login & Access Test...');

    try {
        // 1. Attempt Login
        console.log('\n1️⃣  Attempting Login with admin/admin123...');
        const loginRes = await axios.post(`${API_URL}/login`, {
            username: 'admin',
            password: 'admin123'
        });

        if (loginRes.status === 200 && loginRes.data.token) {
            console.log('✅ Login Successful!');
            const token = loginRes.data.token;
            console.log('🔑 Received Token:', token.substring(0, 20) + '...');

            // 2. Attempt Access to Protected Endpoint
            console.log('\n2️⃣  Attempting to access /api/merchandiser/dashboard...');
            try {
                const dashboardRes = await axios.get(`${API_URL}/merchandiser/dashboard?date=2026-01-30`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('✅ Dashboard Access Successful!');
                console.log('📊 data:', dashboardRes.data);
            } catch (accessErr) {
                console.error('❌ Dashboard Access Failed:', accessErr.response ? accessErr.response.data : accessErr.message);
                if (accessErr.response?.status === 401 || accessErr.response?.status === 403) {
                    console.log('   (This confirms the backend is rejecting the token it just issued)');
                }
            }

        } else {
            console.error('❌ Login Failed (No Token):', loginRes.data);
        }

    } catch (err) {
        console.error('❌ Login Request Failed:', err.response ? err.response.data : err.message);
    }
}

testLoginAndAccess();
