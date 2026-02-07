import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView
        },
        {
            path: '/create',
            name: 'create-ride',
            component: () => import('../views/CreateRideView.vue')
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
            path: '/vehicle',
            name: 'vehicle',
            component: () => import('../views/VehicleView.vue')
        }
    ]
})

export default router
