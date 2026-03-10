-- 02_add_total_seats_to_vehicles.sql
-- This is a separate migration to add the total_seats column to vehicles,
-- which was added later via ALTER TABLE in the SQLite app.

ALTER TABLE vehicles ADD COLUMN total_seats INT DEFAULT 5;
