-- 05_add_bus_floor_seats_premium.sql
-- Add per-floor seat counts and premium pricing for bus tickets

ALTER TABLE bus_tickets
  ADD COLUMN IF NOT EXISTS floor1_seats INT,
  ADD COLUMN IF NOT EXISTS floor2_seats INT,
  ADD COLUMN IF NOT EXISTS premium_price INT;
