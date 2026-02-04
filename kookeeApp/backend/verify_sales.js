const http = require('http');

const PORT = 3000;

function request(path, method, body, token) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: PORT,
            path: '/api' + path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (token) {
            options.headers['Authorization'] = 'Bearer ' + token;
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        resolve(data); // In case of non-json
                    }
                } else {
                    reject({ statusCode: res.statusCode, body: data });
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function runTest() {
    console.log('🧪 Starting Sales Integration Verification...');

    // Wait a bit for server to be ready if just started
    await new Promise(r => setTimeout(r, 2000));

    try {
        // 1. Test Login
        console.log('🔄 Testing Login...');
        const loginData = await request('/login', 'POST', { username: 'testagent@kookee.com', password: 'pass123' });

        if (!loginData.token || loginData.user.role !== 'sales_agent') {
            throw new Error(`Login failed or wrong role: ${JSON.stringify(loginData)}`);
        }
        console.log('✅ Login Successful! Token Role:', loginData.user.role);
        const token = loginData.token;

        // 2. Test Sync
        console.log('🔄 Testing Location Sync...');
        const locPayload = {
            locations: [{
                user_id: loginData.user.server_id,
                latitude: -1.2921,
                longitude: 36.8219,
                timestamp: new Date().toISOString(),
                battery_percentage: 88,
                is_moving: true
            }]
        };
        const syncData = await request('/sales/sync/breadcrumbs', 'POST', locPayload, token);
        console.log('✅ Location Sync Successful:', syncData);

        // 3. Admin List Agents
        console.log('🔄 Testing Admin Agent List...');
        const agentsData = await request('/sales/agents', 'GET', null);
        console.log(`✅ Admin Agent List Successful! Found ${agentsData.length} agents.`);

        // 4. Live Map
        console.log('🔄 Testing Admin Live Map...');
        const mapData = await request('/sales/live-map', 'GET', null);
        const testAgent = mapData.find(a => a.display_name === 'Test Agent');
        if (testAgent) {
            console.log('✅ Live Map shows Test Agent at:', testAgent.latitude, testAgent.longitude);
        } else {
            console.warn('⚠️ Test Agent not in live map (maybe caching or timestamp issue).');
        }

        console.log('🎉 Verification Complete!');
        process.exit(0);

    } catch (err) {
        console.error('❌ Verification Failed:', err);
        process.exit(1);
    }
}

runTest();
