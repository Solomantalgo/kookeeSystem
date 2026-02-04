const axios = require('axios');

async function test() {
    try {
        console.log('--- Testing Merchandiser Registration ---');
        const res = await axios.post('http://localhost:3000/api/staff', {
            name: 'Verification kamau',
            employee_id: 'VK001',
            phone: '0711223344'
        });
        console.log('✅ POST /api/staff SUCCESS:', res.data.name);

        const list = await axios.get('http://localhost:3000/api/staff');
        console.log('✅ GET /api/staff SUCCESS, Count:', list.data.length);

        const update = await axios.put(`http://localhost:3000/api/staff/${res.data.merchandiser_id}`, {
            active: false
        });
        console.log('✅ PUT /api/staff SUCCESS, Active:', update.data.active);

    } catch (err) {
        console.error('❌ TEST FAILED:', err.response?.data || err.message);
    }
}

test();
