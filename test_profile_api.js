const fetch = require('node-fetch'); // try requiring, or use global fetch if available

async function testProfile() {
    try {
        const response = await fetch('http://localhost:3000/api/users/1/profile');
        if (!response.ok) {
            console.error('Network response was not ok ' + response.statusText);
            return;
        }
        const data = await response.json();
        console.log('Data:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Error:', e);
    }
}

// Node 18+ has global fetch, but just in case
if (typeof fetch === 'undefined') {
    // If running in older node without global fetch
    console.log('Global fetch undefined, attempting require');
    try {
        const nf = require('node-fetch');
        global.fetch = nf;
    } catch (e) {
        console.log('node-fetch not found, please install or check node version');
    }
}

testProfile();
