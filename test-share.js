(async () => {
    try {
        const res = await fetch('http://127.0.0.1:3000/api/rides?all_status=true');
        const data = await res.json();
        const passRide = data.find(r => r.is_passenger_entry);
        const driverRide = data.find(r => !r.is_passenger_entry);
        if (!passRide || !driverRide) { console.log('not enough data'); return; }

        try {
            const shareRes = await fetch(`http://127.0.0.1:3000/api/rides/${passRide.id}/share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ driver_ride_id: driverRide.id })
            });
            const text = await shareRes.text();
            console.log('Share status:', shareRes.status);
            console.log('Share body:', text);
        } catch (err) {
            console.log('Share fetch error:', err.message);
        }
    } catch (e) { console.log('Global error:', e.message); }
})();
