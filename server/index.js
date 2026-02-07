const express = require('express');
const cors = require('cors');
const db = require('./db');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Swagger Configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Poputki.online API',
            version: '1.0.0',
            description: 'API for the Poputki ride-sharing platform',
        },
        servers: [
            {
                url: `http://localhost:${PORT}`,
            },
        ],
    },
    apis: ['./index.js'], // Files containing annotations
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login or Register user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [passenger, driver]
 *                 description: Required for new registration
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                 token:
 *                   type: string
 *       400:
 *         description: Phone missing
 */
// Mock Auth
app.post('/api/auth/login', (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone required' });

    let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    if (!user) {
        // Create skeleton user
        const info = db.prepare('INSERT INTO users (phone) VALUES (?)').run(phone);
        user = { id: info.lastInsertRowid, phone, isNew: true };
    } else {
        user.isNew = !user.name; // user is new if they haven't completed profile
    }
    res.json({ user, token: 'mock-token-' + user.id });
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Complete user profile registration
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - name
 *               - surname
 *               - age
 *               - sex
 *             properties:
 *               id:
 *                 type: integer
 *               name:
 *                 type: string
 *               surname:
 *                 type: string
 *               age:
 *                 type: integer
 *               sex:
 *                 type: string
 */
app.post('/api/auth/register', (req, res) => {
    const { id, name, surname, age, sex } = req.body;
    try {
        db.prepare('UPDATE users SET name = ?, surname = ?, age = ?, sex = ? WHERE id = ?')
            .run(name, surname, age, sex, id);
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
        res.json({ user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/rides:
 *   post:
 *     summary: Create a new ride
 *     tags: [Rides]
 */
// Create Ride
app.post('/api/rides', (req, res) => {
    const { driver_id, from_city, to_city, date, time, price, seats, description, is_passenger_entry } = req.body;
    try {
        const info = db.prepare(`
      INSERT INTO rides (driver_id, from_city, to_city, date, time, price, seats, description, is_passenger_entry)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(driver_id, from_city, to_city, date, time, price, seats, description, is_passenger_entry ? 1 : 0);
        res.json({ id: info.lastInsertRowid, ...req.body });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/users/{id}/vehicle:
 *   get:
 *     summary: Get user's vehicle
 *     tags: [Users]
 */
app.get('/api/users/:id/vehicle', (req, res) => {
    const vehicle = db.prepare('SELECT * FROM vehicles WHERE user_id = ?').get(req.params.id);
    res.json(vehicle || null);
});

/**
 * @swagger
 * /api/users/vehicle:
 *   post:
 *     summary: Update or add vehicle
 *     tags: [Users]
 */
app.post('/api/users/vehicle', (req, res) => {
    const { user_id, make, model, plate_number } = req.body;
    try {
        const existing = db.prepare('SELECT id FROM vehicles WHERE user_id = ?').get(user_id);
        if (existing) {
            db.prepare('UPDATE vehicles SET make = ?, model = ?, plate_number = ? WHERE user_id = ?')
                .run(make, model, plate_number, user_id);
        } else {
            db.prepare('INSERT INTO vehicles (user_id, make, model, plate_number) VALUES (?, ?, ?, ?)')
                .run(user_id, make, model, plate_number);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Search Rides to show if it's a passenger entry
app.get('/api/rides', (req, res) => {
    const { from, to, date } = req.query;
    let query = 'SELECT rides.*, users.name as driver_name, users.rating as driver_rating FROM rides JOIN users ON rides.driver_id = users.id WHERE 1=1';
    const params = [];

    if (from) {
        query += ' AND from_city LIKE ?';
        params.push(`%${from}%`);
    }
    if (to) {
        query += ' AND to_city LIKE ?';
        params.push(`%${to}%`);
    }
    if (date) {
        query += ' AND date = ?';
        params.push(date);
    }

    const rides = db.prepare(query).all(...params);
    res.json(rides);
});

// Get Ride Details Update
app.get('/api/rides/:id', (req, res) => {
    const ride = db.prepare('SELECT rides.*, users.name as driver_name, users.rating as driver_rating FROM rides JOIN users ON rides.driver_id = users.id WHERE rides.id = ?').get(req.params.id);
    if (!ride) return res.status(404).json({ error: 'Ride not found' });

    // If it's a driver entry, join vehicle
    let vehicle = null;
    if (ride.is_passenger_entry === 0) {
        vehicle = db.prepare('SELECT make, model, plate_number FROM vehicles WHERE user_id = ?').get(ride.driver_id);
    }

    const bookings = db.prepare('SELECT bookings.*, users.name as passenger_name FROM bookings JOIN users ON bookings.passenger_id = users.id WHERE ride_id = ?').all(req.params.id);
    res.json({ ...ride, vehicle, bookings });
});

// Book Seat
app.post('/api/bookings', (req, res) => {
    const { ride_id, passenger_id } = req.body;
    try {
        const info = db.prepare('INSERT INTO bookings (ride_id, passenger_id) VALUES (?, ?)').run(ride_id, passenger_id);
        res.json({ id: info.lastInsertRowid, status: 'confirmed' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});

