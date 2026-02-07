const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'poputki.db');
const db = new Database(dbPath, { verbose: console.log });

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE NOT NULL,
    name TEXT,
    surname TEXT,
    age INTEGER,
    sex TEXT,
    role TEXT DEFAULT 'passenger', -- 'passenger' or 'driver'
    rating REAL DEFAULT 5.0
  );

  CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    plate_number TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS rides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    driver_id INTEGER NOT NULL,
    from_city TEXT NOT NULL,
    to_city TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    price INTEGER NOT NULL,
    seats INTEGER NOT NULL,
    description TEXT,
    is_passenger_entry INTEGER DEFAULT 0, -- 1 if created by passenger
    FOREIGN KEY (driver_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ride_id INTEGER NOT NULL,
    passenger_id INTEGER NOT NULL,
    status TEXT DEFAULT 'confirmed',
    FOREIGN KEY (ride_id) REFERENCES rides(id),
    FOREIGN KEY (passenger_id) REFERENCES users(id)
  );
`);

// Migration for existing databases
try { db.exec("ALTER TABLE users ADD COLUMN surname TEXT;"); } catch (e) { }
try { db.exec("ALTER TABLE users ADD COLUMN age INTEGER;"); } catch (e) { }
try { db.exec("ALTER TABLE users ADD COLUMN sex TEXT;"); } catch (e) { }
try { db.exec("ALTER TABLE rides ADD COLUMN is_passenger_entry INTEGER DEFAULT 0;"); } catch (e) { }


module.exports = db;
