const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://example.com',
  process.env.SUPABASE_KEY || 'fake'
);

(async () => {
  // Let's connect using the actual DB file
  const db = require('./server/db'); 
  const passRes = await db.from('rides').select('*').eq('is_passenger_entry', true).limit(1);
  const drvRes = await db.from('rides').select('*').eq('is_passenger_entry', false).limit(1);
  
  console.log("Pass:", passRes.data?.[0]?.id);
  console.log("Drv:", drvRes.data?.[0]?.id);
  
  if(passRes.data?.[0] && drvRes.data?.[0]) {
      const passengerReqId = passRes.data[0].id;
      const driver_ride_id = drvRes.data[0].id;
      
      try {
        const { data: driverRide, error } = await db
            .from('rides')
            .select(`*, users:driver_id(name, phone)`)
            .eq('id', driver_ride_id)
            .single();
            
        console.log("DriverRide fetch error:", error);
        console.log("DriverRide:", driverRide);
      } catch(err) {
          console.log("Exception:", err);
      }
  }
})();
