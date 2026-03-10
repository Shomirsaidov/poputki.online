-- 01_supabase_schema.sql
-- Run this script to create the initial database structure for PostgreSQL (Supabase).

-- Enable necessary extensions if not already present
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(50),
    surname VARCHAR(50),
    age INT,
    sex VARCHAR(10) CHECK (sex IN ('male', 'female', 'other')),
    role VARCHAR(20) DEFAULT 'passenger',
    rating FLOAT DEFAULT 5.0,
    preferences JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    plate_number VARCHAR(20) NOT NULL,
    total_seats INT DEFAULT 5
);

-- 3. Rides table
CREATE TABLE IF NOT EXISTS rides (
    id SERIAL PRIMARY KEY,
    driver_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    from_city VARCHAR(100) NOT NULL,
    to_city VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    price INT NOT NULL,
    seats INT NOT NULL,
    description TEXT,
    is_passenger_entry BOOLEAN DEFAULT FALSE,
    allows_delivery BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active',
    reserved_seats JSONB DEFAULT '[]'::jsonb,
    from_address TEXT,
    to_address TEXT,
    total_seats INT DEFAULT 5,
    row_prices JSONB DEFAULT '{}'::jsonb
);

-- 4. Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    ride_id INT NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
    passenger_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seat_number INT NOT NULL DEFAULT 2,
    status VARCHAR(20) DEFAULT 'confirmed',
    passenger_gender VARCHAR(10)
);

-- 5. Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    ride_id INT NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
    reviewer_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    driver_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INT NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Bus Tickets table
CREATE TABLE IF NOT EXISTS bus_tickets (
    id SERIAL PRIMARY KEY,
    operator_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transport_company VARCHAR(100) NOT NULL,
    from_city VARCHAR(100) NOT NULL,
    from_address TEXT NOT NULL,
    to_city VARCHAR(100) NOT NULL,
    to_address TEXT NOT NULL,
    departure_date DATE NOT NULL,
    departure_time TIME NOT NULL,
    arrival_date DATE NOT NULL,
    arrival_time TIME NOT NULL,
    duration_minutes INT NOT NULL,
    price INT NOT NULL,
    total_seats INT NOT NULL DEFAULT 44,
    reserved_seats JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(20) DEFAULT 'active',
    bus_type VARCHAR(50) DEFAULT 'single',
    passenger_comments TEXT,
    intermediate_stops JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Bus Ticket Bookings table
CREATE TABLE IF NOT EXISTS bus_ticket_bookings (
    id SERIAL PRIMARY KEY,
    bus_ticket_id INT NOT NULL REFERENCES bus_tickets(id) ON DELETE CASCADE,
    passenger_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seat_numbers VARCHAR(100) NOT NULL,
    passenger_count INT NOT NULL DEFAULT 1,
    passengers_data JSONB NOT NULL,
    phone VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'confirmed',
    total_price INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Cities table
CREATE TABLE IF NOT EXISTS cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    region VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial cities (optional, but good for parity)
INSERT INTO cities (name) VALUES 
('Душанбе'), ('Худжанд'), ('Бохтар'), ('Куляб'), ('Хорог'),
('Гиссар'), ('Турсунзаде'), ('Канибадам'), ('Исфара'), ('Пенджикент')
ON CONFLICT (name) DO NOTHING;
