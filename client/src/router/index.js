import { createRouter, createWebHistory } from 'vue-router'
import LandingView from '../views/LandingView.vue'
import RideSeatSelectionView from '../views/RideSeatSelectionView.vue';
import BusAdminView from '../views/BusAdminView.vue';
import { getTelegramUser, getTelegramInitData } from '../telegram';

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'landing',
            component: LandingView
        },
        {
            path: '/search',
            name: 'search',
            component: () => import('../views/SearchResultsView.vue')
        },
        {
            path: '/create',
            name: 'create-ride',
            component: () => import('../views/CreateRideView.vue')
        },
        {
            path: '/preferences',
            name: 'preferences-edit',
            component: () => import('../views/PreferencesView.vue')
        },
        {
            path: '/bookings',
            name: 'bookings',
            component: () => import('../views/BookingsView.vue')
        },
        {
            path: '/ride/:id',
            name: 'ride-details',
            component: () => import('../views/RideDetailsView.vue')
        },
        {
            path: '/ride/:id/select-seat',
            name: 'ride-seats',
            component: RideSeatSelectionView
        },
        {
            path: '/bus-admin',
            name: 'bus-admin',
            component: BusAdminView,
            meta: { hideBottomNav: true }
        },

        {
            path: '/profile',
            name: 'profile',
            component: () => import('../views/ProfileView.vue')
        },
        {
            path: '/auth',
            name: 'auth',
            component: () => import('../views/AuthView.vue')
        },
        {
            path: '/my-rides',
            name: 'my-rides',
            component: () => import('../views/MyRidesView.vue')
        },
        {
            path: '/vehicle',
            name: 'vehicle',
            component: () => import('../views/VehicleView.vue')
        },
        {
            path: '/driver/:id/reviews',
            name: 'driver-reviews',
            component: () => import('../views/UserProfileView.vue')
        },
        {
            path: '/user/:id',
            name: 'user-profile',
            component: () => import('../views/UserProfileView.vue')
        },
        {
            path: '/bus-ticket/:id',
            name: 'bus-ticket-details',
            component: () => import('../views/BusTicketDetailsView.vue')
        },

        {
            path: '/bus-booking/:id/step/:step',
            name: 'bus-booking',
            component: () => import('../views/BusBookingView.vue')
        },
        {
            path: '/my-bus-tickets',
            name: 'my-bus-tickets',
            component: () => import('../views/MyBusTicketsView.vue')
        },
        {
            path: '/admin',
            name: 'admin',
            component: () => import('../views/AdminView.vue'),
            meta: { hideBottomNav: true }
        }
    ],
    scrollBehavior(to, from, savedPosition) {
        // always scroll to top
        return { top: 0 }
    }
})

router.beforeEach(async (to, from, next) => {
    const tgUser = getTelegramUser();
    const user = JSON.parse(localStorage.getItem('user'));

    // 2. Background Sync via Telegram if data is available
    if (tgUser) {
        const syncAction = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/telegram-login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id: tgUser.id,
                        first_name: tgUser.first_name,
                        last_name: tgUser.last_name,
                        username: tgUser.username,
                        photo_url: tgUser.photo_url,
                        userId: user?.id,
                        initData: getTelegramInitData()
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));

                    // Only force redirect if missing phone AND not already on auth
                    if ((data.user.isNew || !data.user.phone) && to.name !== 'auth') {
                        router.push({ name: 'auth', query: { tg_complete: 1 } });
                    }
                }
            } catch (error) {
                console.error("Background Telegram Sync Failure:", error);
            }
        };

        // Non-blocking for authenticated users, blocking for newcomers
        const isAuthenticated = !!localStorage.getItem('token');
        if (isAuthenticated) {
            syncAction(); // Fire and forget
        } else {
            await syncAction(); // Block for first-time login
        }
    }

    // 3. Standard Navigation Guard
    const isAuthenticated = !!localStorage.getItem('token');
    const publicRoutes = ['auth', 'admin', 'bus-admin', 'ride-details', 'landing', 'search'];

    if (!publicRoutes.includes(to.name) && !isAuthenticated) {
        next({ name: 'auth' });
    } else {
        next();
    }
});

export default router
