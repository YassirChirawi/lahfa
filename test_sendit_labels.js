
// Diagnostic script to test Sendit API label generation formats
const fetch = require('node-fetch'); // Install via npm if needed

const API_BASE_URL = 'https://app.sendit.ma/api/v1';
const PUBLIC_KEY = '...';
const SECRET_KEY = '...';
const TRACKING_CODES = ['DH12345678', 'DH87654321']; // Use real codes here

async function testFormat(format, deliveries) {
    console.log(`Testing format: ${format}`);
    try {
        const loginRes = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ public_key: PUBLIC_KEY, secret_key: SECRET_KEY })
        });
        const loginData = await loginRes.json();
        const token = loginData.token || loginData.data?.token;

        const res = await fetch(`${API_BASE_URL}/deliveries/getlabels`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ deliveries, printFormat: 1 })
        });

        const text = await res.text();
        console.log(`Status: ${res.status}`);
        console.log(`Response: ${text.substring(0, 200)}...`);
    } catch (e) {
        console.error(`Error with ${format}:`, e.message);
    }
}

async function runTests() {
    await testFormat('STRING', TRACKING_CODES.join(','));
    await testFormat('ARRAY', TRACKING_CODES);
}

runTests();
