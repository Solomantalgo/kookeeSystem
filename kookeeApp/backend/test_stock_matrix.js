const axios = require('axios');

// Test the stock-matrix endpoint
async function testStockMatrix() {
    try {
        // First, login to get a token
        const loginRes = await axios.post('http://localhost:3000/api/login', {
            username: 'admin',
            password: 'admin123'
        });

        const token = loginRes.data.token;
        console.log('✅ Got auth token');

        // Test stock matrix for Carrefour Lugogo Mall
        const outletId = '2a847b5f-c892-4b67-a909-a0ac3ece26c1';
        const response = await axios.get('http://localhost:3000/api/merchandiser/stock-matrix', {
            params: {
                outlet_id: outletId,
                start_date: '2026-01-01',
                end_date: '2026-12-31'
            },
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('\n✅ Stock Matrix Response:');
        console.log(JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
    process.exit();
}

testStockMatrix();
