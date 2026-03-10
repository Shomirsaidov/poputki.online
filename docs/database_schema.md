# Database Schema Documentation

This document describes the database schema of the Poputki.online application. The current implementation uses **SQLite**, and we are preparing for a migration to **MySQL**.

## Overview
The database consists of 8 main tables handling users, rides, bookings, and bus tickets.

---

## 1. `users`
Information about passengers and drivers.

| Column | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PK AI | Primary Key, Auto-increment |
| `phone` | TEXT | UNIQUE | Phone number (used for login) |
| `name` | TEXT | NULL | First name |
| `surname` | TEXT | NULL | Last name |
| `age` | INTEGER | NULL | User's age |
| `sex` | TEXT | NULL | 'male' or 'female' |
| `role` | TEXT | 'passenger' | 'passenger' or 'driver' |
| `rating` | REAL | 5.0 | User's average rating |
| `preferences`| TEXT | '[]' | JSON array for user preferences |
| `created_at` | DATETIME | CURRENT_TIMESTAMP | Account creation date |

---

## 2. `vehicles`
Car details for drivers.

| Column | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PK AI | Primary Key, Auto-increment |
| `user_id` | INTEGER | FK | Reference to `users.id` |
| `make` | TEXT | NOT NULL | Car manufacturer (e.g., Toyota) |
| `model` | TEXT | NOT NULL | Car model (e.g., Camry) |
| `plate_number`| TEXT | NOT NULL | License plate number |

---

## 3. `rides`
List of available rides (carpooling).

| Column | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PK AI | Primary Key, Auto-increment |
| `driver_id` | INTEGER | FK | Reference to `users.id` |
| `from_city` | TEXT | NOT NULL | Start city |
| `to_city` | TEXT | NOT NULL | Destination city |
| `date` | TEXT | NOT NULL | Ride date (YYYY-MM-DD) |
| `time` | TEXT | NOT NULL | Ride time (HH:MM) |
| `price` | INTEGER | NOT NULL | Ticket price |
| `seats` | INTEGER | NOT NULL | Total available seats |
| `description` | TEXT | NULL | Ride comments |
| `is_passenger_entry` | INTEGER | 0 | 1 if created as a request by passenger |
| `allows_delivery`| INTEGER | 0 | 1 if driver accepts parcels |
| `status` | TEXT | 'active' | 'active', 'completed', or 'cancelled' |
| `reserved_seats` | TEXT | '[]' | JSON array of reserved seat indices |
| `from_address` | TEXT | NULL | Specific pickup address |
| `to_address` | TEXT | NULL | Specific drop-off address |
| `total_seats` | INTEGER | 5 | Total seating capacity |
| `row_prices` | TEXT | '{}' | JSON object for specific row pricing |

---

## 4. `bookings`
Links users to specific car rides.

| Column | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PK AI | Primary Key, Auto-increment |
| `ride_id` | INTEGER | FK | Reference to `rides.id` |
| `passenger_id` | INTEGER | FK | Reference to `users.id` |
| `seat_number` | INTEGER | 2 | Selected seat index |
| `status` | TEXT | 'confirmed' | 'confirmed' or 'cancelled' |
| `passenger_gender`| TEXT | NULL | Specified gender for seat |

---

## 5. `reviews`
User ratings and feedback.

| Column | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PK AI | Primary Key, Auto-increment |
| `ride_id` | INTEGER | FK | Reference to `rides.id` |
| `reviewer_id` | INTEGER | FK | Reference to `users.id` |
| `driver_id` | INTEGER | FK | Reference to `users.id` |
| `rating` | INTEGER | NOT NULL | Star rating (1-5) |
| `comment` | TEXT | NULL | Textual feedback |
| `created_at` | DATETIME | CURRENT_TIMESTAMP | Review timestamp |

---

## 6. `bus_tickets`
Bus schedules for intercity transport.

| Column | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PK AI | Primary Key, Auto-increment |
| `operator_id` | INTEGER | FK | Reference to `users.id` (Admin/Op) |
| `transport_company`| TEXT | NOT NULL | Company name |
| `from_city` | TEXT | NOT NULL | Pickup city |
| `from_address` | TEXT | NOT NULL | Pickup station |
| `to_city` | TEXT | NOT NULL | Destination city |
| `to_address` | TEXT | NOT NULL | Destination station |
| `departure_date`| TEXT | NOT NULL | Date of departure |
| `departure_time`| TEXT | NOT NULL | Time of departure |
| `arrival_date` | TEXT | NOT NULL | Estimated arrival date |
| `arrival_time` | TEXT | NOT NULL | Estimated arrival time |
| `duration_minutes`| INTEGER| NOT NULL | Total travel time |
| `price` | INTEGER | NOT NULL | Cost per ticket |
| `total_seats` | INTEGER | 44 | Bus capacity |
| `reserved_seats` | TEXT | '[]' | JSON array of booked seats |
| `status` | TEXT | 'active' | Scheduled status |
| `bus_type` | TEXT | 'single' | Bus model/type |
| `passenger_comments`| TEXT | NULL | Additional info |
| `intermediate_stops`| TEXT | '[]' | JSON list of stops |
| `created_at` | DATETIME | CURRENT_TIMESTAMP | Record creation |

---

## 7. `bus_ticket_bookings`
Purchased bus tickets records.

| Column | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PK AI | Primary Key, Auto-increment |
| `bus_ticket_id` | INTEGER | FK | Reference to `bus_tickets.id` |
| `passenger_id` | INTEGER | FK | Reference to `users.id` |
| `seat_numbers` | TEXT | NOT NULL | Comma-separated list of seats |
| `passenger_count`| INTEGER| 1 | Number of passengers in booking |
| `passengers_data`| TEXT | NOT NULL | JSON string with names and info |
| `phone` | TEXT | NOT NULL | Contact phone |
| `status` | TEXT | 'confirmed' | Payment/Booking status |
| `total_price` | INTEGER | NOT NULL | Calculated sum |
| `created_at` | DATETIME | CURRENT_TIMESTAMP | Booking timestamp |

---

## 8. `cities`
Master list of destinations.

| Column | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PK AI | Primary Key, Auto-increment |
| `name` | TEXT | UNIQUE | City name |
| `region` | TEXT | NULL | Region/Province |
| `created_at` | DATETIME | CURRENT_TIMESTAMP | Data creation |

---

# MySQL Transition Notes
When migrating to MySQL:
- All `TEXT` fields representing JSON should ideally use the `JSON` data type (if using MySQL 5.7+).
- All `INTEGER PRIMARY KEY AUTOINCREMENT` in SQLite map to `INT AUTO_INCREMENT PRIMARY KEY` in MySQL.
- Boolean-like fields (0/1) should use `TINYINT(1)`.
- Foreign key checks should be enabled in the migration script.
