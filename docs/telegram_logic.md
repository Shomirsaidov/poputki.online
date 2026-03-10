# Telegram Integration Logic Documentation

This document explains how the application retrieves Telegram profile information and manages user IDs for sending notifications.

## 1. Retrieving Telegram Profile Information

The application is a Telegram Mini App (TMA). It uses the `window.Telegram.WebApp` SDK to access user data directly from the Telegram client environment.

### Profiles Data (Username, Name, Avatar, ID)
These details are retrieved automatically upon application initialization.

*   **Logic Location:** `chifir/src/App.vue` and `chifir/src/lib/telegram.js`
*   **Mechanism:** Accessing `window.Telegram.WebApp.initDataUnsafe.user`.
*   **Fields Captured:**
    *   `id`: The unique Telegram user ID.
    *   `first_name`: User's first name.
    *   `last_name`: User's last name (if available).
    *   `username`: User's @username (if available).
    *   `photo_url`: URL to the user's profile picture.

**Code Snippet (`App.vue`):**
```javascript
const tg = window.Telegram.WebApp;
const user = tg.initDataUnsafe?.user;

if (user) {
  // Data is then synced with Supabase
  await supabase.from('users').upsert({
    telegram_id: user.id,
    username: user.username,
    first_name: user.first_name,
    photo_url: user.photo_url,
    // ...
  });
}
```

### Phone Number
In the current implementation, the **phone number is not retrieved automatically** from Telegram's profile (as that would require a "Request Contact" permission popup).

*   **Mechanism:** Manual input in the Checkout form.
*   **Logic Location:** `chifir/src/views/CheckoutView.vue`
*   **Flow:** The user enters their phone number in a text field, which is then validated and stored in the `orders` table in Supabase during the checkout process.

---

## 2. Managing Telegram IDs for Messaging

To send messages to a user via the Telegram Bot, the application needs the user's `chat_id` (which for individual users is the same as their `telegram_id`).

### Getting ID from Incoming Messages (Bot Side)
When a user sends a message to the bot (e.g., `/start`), Telegram sends a webhook update to our server.

*   **Logic Location:** `bot/api/bot.js`
*   **Mechanism:** Extracting `id` from the update payload.
*   **Flow:**
    1.  User sends message to bot.
    2.  `api/bot.js` receives the POST request.
    3.  `const chatId = message.chat.id;` extracts the ID.
    4.  The bot uses this `chatId` to reply.

### Sending Notifications (Frontend Side)
When an order is placed, the frontend sends a notification request to the bot API.

*   **Logic Location:** `chifir/src/lib/telegram.js` -> `sendTelegramNotification`
*   **Mechanism:** Using the `id` stored in the `userStore` (originally from `initDataUnsafe`).
*   **Flow:**
    1.  The Order is submitted.
    2.  `sendTelegramNotification` is called with the user's `telegram_id`.
    3.  A request is sent to `${BOT_API_URL}/api/notify` with the `chat_id` and formatted message text.

### Admin Notifications
Notifications are also sent to a hardcoded Admin Telegram ID to alert staff of new orders.
*   **Admin ID:** `8598361161` (hardcoded in `chifir/src/lib/telegram.js`)

---

## Technical Summary for Future Projects
1.  **Direct Access:** Use `initDataUnsafe.user" for instant profile data without permissions.
2.  **Contact Retrieval:** If automatic phone number retrieval is needed in the future, use `window.Telegram.WebApp.requestContact()`.
3.  **Persistence:** Always store the `telegram_id` in your database as the primary key or unique identifier to link Telegram interactions with your app's data.
