/**
 * Centralized Telegram Mini App SDK logic.
 * Follows the professional initialization flow.
 */

const tg = window.Telegram?.WebApp;

/**
 * Initializes the Telegram WebApp.
 * Informs the Telegram client that the app is ready and expands it to full height.
 */
export function initTelegram() {
    if (!tg) {
        console.warn('Telegram WebApp SDK not found. Make sure the script is included in index.html');
        return null;
    }

    tg.ready();
    tg.expand();

    return tg;
}

/**
 * Returns the Telegram WebApp object.
 */
export function getTelegramApp() {
    return tg;
}

/**
 * Returns the user data from initDataUnsafe.
 * This is great for UI display.
 */
export function getTelegramUser() {
    return tg?.initDataUnsafe?.user || null;
}

/**
 * Returns the raw initData string.
 * This is crucial for backend verification.
 */
export function getTelegramInitData() {
    return tg?.initData || '';
}

export default {
    init: initTelegram,
    getApp: getTelegramApp,
    getUser: getTelegramUser,
    getInitData: getTelegramInitData
};
