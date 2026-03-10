-- 01_create_tables.sql
-- Run this script to create the initial database structure for MySQL.

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(50),
    surname VARCHAR(50),
    age INT,
    sex ENUM('male', 'female', 'other'),
    role VARCHAR(20) DEFAULT 'passenger',
    rating FLOAT DEFAULT 5.0,
    preferences JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    plate_number VARCHAR(20) NOT NULL,
    total_seats INT DEFAULT 5,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Rides table
CREATE TABLE IF NOT EXISTS rides (
    id INT AUTO_INCREMENT PRIMARY KEY,
    driver_id INT NOT NULL,
    from_city VARCHAR(100) NOT NULL,
    to_city VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    price INT NOT NULL,
    seats INT NOT NULL,
    description TEXT,
    is_passenger_entry TINYINT(1) DEFAULT 0,
    allows_delivery TINYINT(1) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    reserved_seats JSON,
    from_address TEXT,
    to_address TEXT,
    total_seats INT DEFAULT 5,
    row_prices JSON,
    FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ride_id INT NOT NULL,
    passenger_id INT NOT NULL,
    seat_number INT NOT NULL DEFAULT 2,
    status VARCHAR(20) DEFAULT 'confirmed',
    passenger_gender VARCHAR(10),
    FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE,
    FOREIGN KEY (passenger_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ride_id INT NOT NULL,
    reviewer_id INT NOT NULL,
    driver_id INT NOT NULL,
    rating INT NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Bus Tickets table
CREATE TABLE IF NOT EXISTS bus_tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    operator_id INT NOT NULL,
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
    reserved_seats JSON,
    status VARCHAR(20) DEFAULT 'active',
    bus_type VARCHAR(50) DEFAULT 'single',
    passenger_comments TEXT,
    intermediate_stops JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Bus Ticket Bookings table
CREATE TABLE IF NOT EXISTS bus_ticket_bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bus_ticket_id INT NOT NULL,
    passenger_id INT NOT NULL,
    seat_numbers VARCHAR(100) NOT NULL,
    passenger_count INT NOT NULL DEFAULT 1,
    passengers_data JSON NOT NULL,
    phone VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'confirmed',
    total_price INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bus_ticket_id) REFERENCES bus_tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (passenger_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Cities table
CREATE TABLE IF NOT EXISTS cities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    region VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
