-- 01_initial_data.sql
-- Seed the database with initial cities and sample data.

-- Initial Cities
INSERT IGNORE INTO cities (name) VALUES 
('Душанбе'), ('Худжанд'), ('Бохтар'), ('Куляб'), ('Хорог'),
('Гиссар'), ('Турсунзаде'), ('Канибадам'), ('Исфара'), ('Пенджикент');

-- Sample Users (Passwords are managed via Firebase/Social-login, so we only need metadata)
INSERT IGNORE INTO users (phone, name, surname, age, sex, role, rating) VALUES 
('+992900000001', 'Admin', 'User', 30, 'male', 'admin', 5.0),
('+992900000002', 'Ivan', 'Ivanov', 25, 'male', 'driver', 4.8),
('+992900000003', 'Anna', 'Smirnova', 22, 'female', 'passenger', 4.9);

-- Sample Vehicle for Ivan
INSERT IGNORE INTO vehicles (user_id, make, model, plate_number) VALUES 
(2, 'Toyota', 'Camry', '0001TJ02');

-- Sample Ride
INSERT IGNORE INTO rides (driver_id, from_city, to_city, date, time, price, seats, status, total_seats) VALUES 
(2, 'Худжанд', 'Душанбе', '2026-03-10', '08:00:00', 150, 4, 'active', 5);

-- Sample Review
INSERT IGNORE INTO reviews (ride_id, reviewer_id, driver_id, rating, comment) VALUES 
(1, 3, 2, 5, 'Great driver!');

-- Sample Bus Ticket
INSERT IGNORE INTO bus_tickets (operator_id, transport_company, from_city, from_address, to_city, to_address, departure_date, departure_time, arrival_date, arrival_time, duration_minutes, price, total_seats) VALUES 
(1, 'Asian Express', 'Душанбе', 'Vokzal', 'Худжанд', 'Avtovokzal', '2026-03-15', '10:00:00', '2026-03-15', '14:00:00', 240, 100, 44);
