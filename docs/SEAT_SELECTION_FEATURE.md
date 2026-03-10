# Seat Selection Feature - Implementation Guide

## Overview
I've implemented a comprehensive seat selection system for your ride-sharing application. This allows drivers to mark reserved seats when creating rides, and passengers to visually select their preferred seat when booking.

## What's New

### 1. **Visual Seat Selector Component** (`SeatSelector.vue`)
- Interactive car seat layout with 2 rows:
  - **Front row**: 2 seats (driver + 1 passenger)
  - **Back row**: 3 seats
- Two modes:
  - **Reserve mode**: For drivers creating rides - mark already occupied seats
  - **Select mode**: For passengers booking - choose available seat
- Visual indicators:
  - 🚗 Driver seat (always reserved)
  - 💺 Available seats
  - ✓ Selected seat (green)
  - 👨/👩 Booked seats (blue for male, pink for female)
  - 🔒 Reserved/unavailable seats (gray)
- Shows age bubbles on booked seats

### 2. **Database Changes**
Updated schema to support seat positions:
- **`rides` table**: Added `reserved_seats` (JSON array) to store seats already taken before posting the ride
- **`bookings` table**: Added `seat_number` (INTEGER) to track which specific seat was booked

### 3. **Create Ride Flow** (Updated `CreateRideView.vue`)
Added a new step 3 for drivers:
1. Step 1: Choose role (Driver/Passenger)
2. Step 2: Fill in route details
3. **Step 3 (NEW)**: Select reserved seats using the visual selector
4. Submit ride

Passengers skip step 3 and submit directly after step 2.

### 4. **Booking Flow** (Updated `RideDetailsView.vue`)
- Changed "Book Seat" button to "Select Seat"
- Opens a beautiful modal with the seat selector
- Shows all currently booked seats with passenger gender and age
- Shows reserved seats (unavailable)
- Only allows booking available seats
- Prevents booking already taken seats

### 5. **API Updates** (`server/index.js`)
- **POST `/api/rides`**: Now accepts `reserved_seats` array
- **POST `/api/bookings`**: Now requires `seat_number` and validates seat availability
- **GET `/api/rides/:id`**: Returns `reserved_seats` array and passenger age/sex for bookings

## How to Use

### For Drivers Creating a Ride:
1. Navigate to "Create Ride"
2. Select "I'm a Driver"
3. Fill in route details (from, to, date, time, price)
4. Click "Next" (Далее)
5. **NEW**: Use the seat selector to mark any seats that are already taken
   - The driver seat (front-left) is always marked
   - Tap other seats to toggle their reserved status
6. Click "Publish Ride" (Опубликовать поездку)

### For Passengers Booking a Ride:
1. Browse available rides
2. Tap on a ride to see details
3. Click "Select Seat" (Выбрать место)
4. **NEW**: A modal opens showing the car seat layout
   - See which seats are already booked (with passenger's gender icon and age)
   - See which seats are reserved/unavailable
   - Tap an available seat to select it
5. Click "Book for XXX с." to confirm
6. Your seat is now booked!

## Visual Features

### Seat Color Coding:
- **Yellow gradient**: Driver seat
- **White with gray border**: Available seat
- **Green with glow**: Your selected seat
- **Blue**: Seat booked by a male passenger
- **Pink**: Seat booked by a female passenger  
- **Purple**: Seat booked by unspecified gender
- **Gray (dimmed)**: Reserved/unavailable seat

### Age Display:
When seats are booked, small age bubbles appear in the top-right corner of each seat showing the passenger's age.

## Technical Details

### Database Migrations
The system automatically runs migrations when the server starts:
- Adds `reserved_seats` column to `rides` table (defaults to empty array `[]`)
- Adds `seat_number` column to `bookings` table (defaults to 2 - front passenger seat)

### Seat Numbering:
```
Front Row:
1 (Driver - front left)    2 (Front passenger - front right)

Back Row:
3 (Back left)    4 (Back center)    5 (Back right)
```

## Testing the Feature

### Test Scenario 1: Driver Creates Ride with Reserved Seats
1. Login as a driver (must have vehicle registered)
2. Create a new ride
3. In step 3, mark seats 3 and 5 as reserved
4. Publish the ride
5. View the ride - you should NOT be able to book seats 3 and 5

### Test Scenario 2: Passenger Books Specific Seat
1. Login as a passenger (different user)
2. View an available ride
3. Click "Select Seat"
4. Choose seat 2 (front passenger)
5. Confirm booking
6. Login as another passenger
7. Try to book the same ride - seat 2 should now show as booked with the first passenger's info

### Test Scenario 3: Gender and Age Display
1. Ensure test users have `age` and `sex` fields set
2. Book seats as different users
3. View the ride - each booked seat should show the correct gender icon and age

## Files Modified

### Client:
- ✨ **NEW**: `/client/src/components/SeatSelector.vue` - Reusable seat selector component
- 📝 **UPDATED**: `/client/src/views/CreateRideView.vue` - Added step 3 for seat selection
- 📝 **UPDATED**: `/client/src/views/RideDetailsView.vue` - Added seat selection modal for booking

### Server:
- 📝 **UPDATED**: `/server/db.js` - Database schema and migrations
- 📝 **UPDATED**: `/server/index.js` - API endpoints for seat handling

## Future Enhancements (Ideas)

1. **Seat Preferences**: Allow users to save seat preferences in their profile
2. **Accessibility**: Mark seats for passengers with disabilities
3. **Children Seats**: Show which seats have child car seats
4. **Live Updates**: Real-time seat availability using WebSockets
5. **Seat Swap**: Allow passengers to request seat changes
6. **Car Types**: Different layouts for vans (7+ seats), sedans, etc.

## Notes

- The driver seat (position 1) is ALWAYS reserved and cannot be booked
- Seat selection is mandatory when booking (no default seat assignment)
- Reserved seats set by the driver cannot be booked by anyone
- Each ride can have different reserved seats patterns
- The component is fully responsive and works on mobile devices

---

**Status**: ✅ Fully implemented and tested
**Version**: 1.0.0
**Last Updated**: 2026-02-10
