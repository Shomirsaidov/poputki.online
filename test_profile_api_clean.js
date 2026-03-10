
async function testProfile() {
    try {
        console.log('Fetching profile for user 1...');
        const response = await fetch('http://localhost:3000/api/users/1/profile');

        if (!response.ok) {
            console.error('Network response was not ok: ' + response.statusText);
            const text = await response.text();
            console.error('Body:', text);
            return;
        }

        const data = await response.json();
        console.log('API Response:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Error:', e);
    }
}

testProfile();
