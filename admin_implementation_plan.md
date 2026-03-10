# Implementation Plan: Poputki.online Admin Panel

This plan outlines the development of a professional, desktop-first administration panel.

## 1. Core Objectives
- **Desktop-First Design**: Optimized for large screens with a sidebar navigation layout.
- **Passcode Protection**: Secured via passcode `141206`.
- **Comprehensive Management**: Centralized control over users, rides, bus tickets, bookings, and reviews.
- **Data Insights**: Dashboard with key performance indicators (KPIs).

## 2. Architecture & Tech Stack
- **Frontend**: Vue 3 (existing) + Tailwind CSS for a premium desktop layout.
- **Backend**: New modular router `server/routes/admin.js` for administrative actions.
- **Storage**: SQLite (existing) using `better-sqlite3`.

## 3. Planned Features

### 3.1 Authentication
- Simple passcode entry screen.
- Persistent admin session (localStorage based for simplicity, or session).
- Restricted `/admin` route.

### 3.2 Dashboard (Overview)
- Total Count Cards: Users, Active Rides, Bus Bookings, Reviews.
- Recent Activity Feed.
- Growth metrics (if data allows).

### 3.3 User Management
- Searchable user table.
- View user details (profile, vehicle, history).
- Ability to delete or moderate users.

### 3.4 Ride & Booking Management
- List of all active/completed rides.
- Details of passengers/bookings per ride.
- Cancellation capability.

### 3.5 Bus Ticket Management (CRUD)
- Create new bus schedules/tickets.
- Edit existing routes/prices.
- View passenger lists for specific bus trips.

### 3.6 Review Moderation
- Table of all user reviews.
- Delete inappropriate reviews.

## 4. Implementation Steps

### Phase 1: Backend Setup
1. Create `server/routes/admin.js`.
2. Implement endpoints:
   - `GET /api/admin/stats`: Aggregate data for dashboard.
   - `GET /api/admin/users`: List users with pagination/search.
   - `GET /api/admin/rides`: List rides.
   - `GET /api/admin/bus-tickets`: Manage bus schedules.
   - `GET /api/admin/reviews`: List and delete reviews.
3. Register the router in `server/index.js`.

### Phase 2: Frontend Foundation
1. Create `client/src/views/AdminView.vue`.
2. Add route `/admin` in `router/index.js`.
3. Implement Passcode Gate component.

### Phase 3: UI Implementation
1. **Sidebar Navigation**: Desktop sidebar for quick access to modules.
2. **Dashboard View**: Grid of stat cards and recent activity.
3. **Data Tables**: Reusable deskopt-optimized tables for Users, Rides, etc.
4. **Modals/Forms**: For editing data or confirming deletions.

### Phase 4: Polish & Refinement
1. Premium aesthetics (Gradients, shadows, typography).
2. Mobile "Not Supported" or "Limited" warning for admin panel strictly being desktop-first.
3. Error handling and loading states.
