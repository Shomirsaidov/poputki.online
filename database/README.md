# Database — Migrations & Seeds

This directory contains SQL scripts to prepare a **MySQL** database for the Poputki.online backend.

## Order of Execution (in phpMyAdmin or any MySQL client)

### Step 1: Run Migrations (create tables)
Execute in this exact order:

| File | Purpose |
| :--- | :--- |
| `migrations/01_create_tables.sql` | Creates all 8 tables |
| `migrations/02_add_total_seats_to_vehicles.sql` | Only needed if you skipped adding `total_seats` in step 1 |

> You can run both scripts in phpMyAdmin via the **SQL** tab. Just paste the content and click **Go**.

### Step 2: Run Seeds (insert initial data)

| File | Purpose |
| :--- | :--- |
| `seeds/01_initial_data.sql` | Inserts initial cities + sample records |

---

## Switching the Backend from SQLite to MySQL

### 1. Install the MySQL driver
```bash
cd server
npm install mysql2
```

### 2. Set environment variables
```bash
cp server/.env.example server/.env
# Then edit server/.env with your actual DB credentials
```

### 3. Swap the database module
The file `server/db.mysql.js` is a drop-in replacement for `server/db.js`.
When you have your credentials ready, rename it:
```bash
cp server/db.mysql.js server/db.js
```
> The original SQLite `db.js` is automatically replaced. A backup is recommended first:
> `cp server/db.js server/db.sqlite.bak.js`

### 4. Restart the server
```bash
cd server
npm run dev
```

---

## Notes on Compatibility

- All route files (`routes/*.js`) use `db.prepare().get()`, `.all()`, `.run()`.
- The MySQL adapter (`db.mysql.js`) exposes the **identical API** using async/await internally.
- All existing route handlers will need to be `async` functions and must `await` their DB calls. When you provide credentials, this migration will be applied automatically.
- JSON columns (`reserved_seats`, `row_prices`, etc.) use MySQL's native `JSON` type.
- Date-function differences (e.g., `date('now')` → `CURDATE()`) are handled by the query translator built into `db.mysql.js`.
