<script>
import api from '../api';
import ReviewModal from '../components/ReviewModal.vue';
import AppModal from '../components/AppModal.vue';

export default {
    components: {
        ReviewModal,
        AppModal
    },
    data() {
        return {
            user: null,
            activeTab: 'active', // 'active' or 'past'
            rides: [],
            loading: true,
            expandedRides: new Set(),
            showReviewModal: false,
            selectedRideForReview: null,
            modal: {
                show: false,
                title: '',
                message: '',
                type: 'info',
                confirmText: 'ОК',
                showCancel: false,
                onConfirm: () => { this.modal.show = false; }
            }
        }
    },
    computed: {
        activeRides() {
            return this.rides.filter(ride => ride.status !== 'completed');
        },
        pastRides() {
            return this.rides.filter(ride => ride.status === 'completed')
                .sort((a, b) => new Date(b.date) - new Date(a.date));
        },
        displayedRides() {
            return this.activeTab === 'active' ? this.activeRides : this.pastRides;
        }
    },
    async mounted() {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            this.$router.push('/auth');
            return;
        }
        this.user = JSON.parse(userStr);
        await this.fetchMyRides();
    },
    methods: {
        showAlert(title, message, type = 'info', onConfirm = null) {
            this.modal.title = title;
            this.modal.message = message;
            this.modal.type = type;
            this.modal.confirmText = 'ОК';
            this.modal.showCancel = false;
            this.modal.onConfirm = onConfirm || (() => { this.modal.show = false; });
            this.modal.show = true;
        },
        showConfirm(title, message, onConfirm) {
            this.modal.title = title;
            this.modal.message = message;
            this.modal.type = 'warning';
            this.modal.confirmText = 'Подтвердить';
            this.modal.showCancel = true;
            this.modal.onConfirm = onConfirm;
            this.modal.show = true;
        },
        async fetchMyRides() {
            this.loading = true;
            try {
                // Fetch all rides, including completed
                const response = await api.get('/rides', { params: { all_status: true } });
                const allRides = response.data;
                
                // Fetch detailed info for each ride (includes bookings)
                const detailedRidesPromises = allRides.map(ride => 
                    api.get(`/rides/${ride.id}`).catch(err => {
                        console.error(`Failed to fetch ride ${ride.id}:`, err);
                        return null;
                    })
                );
                
                const detailedRidesResponses = await Promise.all(detailedRidesPromises);
                const detailedRides = detailedRidesResponses
                    .filter(res => res !== null)
                    .map(res => res.data);

                // Now filter rides where user is driver OR passenger
                this.rides = detailedRides.filter(ride => {
                    // User is the driver
                    if (ride.driver_id === this.user.id) {
                        return true;
                    }
                    // User has a booking
                    if (ride.bookings && ride.bookings.some(b => b.passenger_id === this.user.id)) {
                        return true;
                    }
                    return false;
                });
            } catch (e) {
                console.error(e);
                this.showAlert('Ошибка', 'Ошибка при загрузке поездок', 'error');
            } finally {
                this.loading = false;
            }
        },
        toggleExpand(rideId) {
            if (this.expandedRides.has(rideId)) {
                this.expandedRides.delete(rideId);
            } else {
                this.expandedRides.add(rideId);
            }
            // Force reactivity
            this.expandedRides = new Set(this.expandedRides);
        },
        isExpanded(rideId) {
            return this.expandedRides.has(rideId);
        },
        isDriver(ride) {
            return ride.driver_id === this.user.id;
        },
        getUserBooking(ride) {
            if (!ride.bookings) return null;
            return ride.bookings.find(b => b.passenger_id === this.user.id);
        },
        formatDate(dateStr) {
            const date = new Date(dateStr);
            const options = { day: 'numeric', month: 'long' };
            return date.toLocaleDateString('ru-RU', options);
        },
        getRideStatusColor(ride) {
            if (ride.status === 'completed') {
                return 'bg-gray-100 text-gray-600';
            }
            if (ride.status === 'cancelled') {
                return 'bg-red-100 text-red-600';
            }
            return 'bg-green-100 text-green-600';
        },
        getRideStatusText(ride) {
            if (ride.status === 'completed') {
                return 'Завершено';
            }
            if (ride.status === 'cancelled') {
                return 'Отменено';
            }
            return 'Активно';
        },
        async completeRide(rideId) {
            this.showConfirm(
                'Подтверждение',
                'Вы уверены, что хотите завершить эту поездку?',
                async () => {
                    this.modal.show = false;
                    try {
                        await api.post(`/rides/${rideId}/complete`, { driver_id: this.user.id });
                        // Update local state
                        const ride = this.rides.find(r => r.id === rideId);
                        if (ride) ride.status = 'completed';
                        this.showAlert('Успешно', 'Поездка завершена!', 'success');
                    } catch (err) {
                        console.error(err);
                        this.showAlert('Ошибка', err.response?.data?.error || 'Ошибка при завершении поездки', 'error');
                    }
                }
            );
        },
        canCancel(ride) {
            if (ride.status === 'completed' || ride.status === 'cancelled') return false;
            const time = ride.time ? ride.time : '00:00:00';
            const rideDateTime = new Date(`${ride.date}T${time}`);
            return new Date() < rideDateTime;
        },
        async cancelRide(ride) {
            const passengerCount = ride.bookings?.length || 0;
            const message = passengerCount > 0 
                ? `Вы уверены, что хотите отменить поездку? У вас уже есть ${passengerCount} пассажиров.`
                : 'Вы уверены, что хотите отменить поездку?';

            this.showConfirm(
                'Отмена поездки',
                message,
                async () => {
                    this.modal.show = false;
                    try {
                        await api.post(`/rides/${ride.id}/cancel`, { driver_id: this.user.id });
                        // Update local state: remove or mark as cancelled
                        this.rides = this.rides.filter(r => r.id !== ride.id);
                        this.showAlert('Успешно', 'Поездка отменена', 'success');
                    } catch (err) {
                        console.error(err);
                        this.showAlert('Ошибка', err.response?.data?.error || 'Ошибка при отмене поездки', 'error');
                    }
                }
            );
        },
        async cancelBooking(ride) {
            const booking = this.getUserBooking(ride);
            if (!booking) return;

            this.showConfirm(
                'Отмена брони',
                'Вы уверены, что хотите отменить бронирование на эту поездку?',
                async () => {
                    this.modal.show = false;
                    try {
                        await api.post(`/bookings/${booking.id}/cancel`, { passenger_id: this.user.id });
                        // Update local state: remove booking from ride or remove ride if no longer driver/passenger
                        this.rides = this.rides.filter(r => r.id !== ride.id);
                        this.showAlert('Успешно', 'Бронирование отменено', 'success');
                    } catch (err) {
                        console.error(err);
                        this.showAlert('Ошибка', err.response?.data?.error || 'Ошибка при отмене бронирования', 'error');
                    }
                }
            );
        },
        openReviewModal(ride) {
            this.selectedRideForReview = ride;
            this.showReviewModal = true;
        },
        hasReviewed(ride) {
            // Check if user has already reviewed (frontend check only, backend also validates)
            // Implementation would depend on whether we fetch reviews here.
            // For now, simpler to let them try and backend will block if duplicate.
            return false;
        },
        repeatRide(ride) {
            this.$router.push({
                path: '/create',
                query: {
                    role: this.isDriver(ride) ? 'driver' : 'passenger',
                    from: ride.from_city || '',
                    to: ride.to_city || '',
                    time: ride.time || '',
                    price: ride.price || '',
                    seats: ride.seats || '',
                    fromAddress: ride.from_address || '',
                    toAddress: ride.to_address || '',
                    allows_delivery: ride.allows_delivery ? 'true' : 'false'
                }
            });
        }
    }
}
</script>

<template>
    <div class="min-h-screen bg-gray-50 pb-24">
        <!-- Header -->
        <div class="bg-white p-6 pt-8 pb-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] sticky top-0 z-20">
            <div class="flex items-center">
                <button @click="$router.back()" class="mr-4 p-2 -ml-2 text-gray-400 hover:text-slate-700 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div>
                    <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Мои поездки</h1>
                    <p class="text-sm text-gray-400 mt-1">История и активные поездки</p>
                </div>
            </div>

            <!-- Tabs -->
            <div class="flex gap-2 mt-6 bg-gray-100 p-1 rounded-2xl">
                <button 
                    @click="activeTab = 'active'"
                    :class="activeTab === 'active' ? 'bg-white shadow-sm text-slate-800' : 'text-gray-500'"
                    class="flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all"
                >
                    Активные ({{ activeRides.length }})
                </button>
                <button 
                    @click="activeTab = 'past'"
                    :class="activeTab === 'past' ? 'bg-white shadow-sm text-slate-800' : 'text-gray-500'"
                    class="flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all"
                >
                    Прошедшие ({{ pastRides.length }})
                </button>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-20">
            <div class="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
        </div>

        <!-- Empty State -->
        <div v-else-if="displayedRides.length === 0" class="text-center py=20 px-6">
            <div class="w-24 h-24 bg-gray-100 rounded-full mx-auto flex items-center justify-center text-4xl mb-4">
                📭
            </div>
            <h3 class="text-xl font-bold text-slate-700 mb-2">
                {{ activeTab === 'active' ? 'Нет активных поездок' : 'Нет прошедших поездок' }}
            </h3>
            <p class="text-gray-500 mb-6">
                {{ activeTab === 'active' ? 'Создайте новую поездку или найдите попутчика' : 'Здесь будут отображаться завершенные поездки' }}
            </p>
            <button 
                v-if="activeTab === 'active'"
                @click="$router.push('/create')" 
                class="bg-gradient-to-r from-yellow-400 to-amber-500 text-white font-bold py-3 px-6 rounded-2xl shadow-lg shadow-amber-500/30 hover:shadow-xl hover:-translate-y-1 transition-all"
            >
                Создать поездку
            </button>
        </div>

        <!-- Rides List -->
        <div v-else class="px-6 py-6 space-y-4">
            <div 
                v-for="ride in displayedRides" 
                :key="ride.id"
                class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md"
            >
                <!-- Card Header (Always Visible) -->
                <div 
                    @click="toggleExpand(ride.id)"
                    class="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                    <!-- Route & Date -->
                    <div class="flex items-start justify-between mb-3">
                        <div class="flex-1">
                            <div class="flex items-center space-x-2 mb-2">
                                <h3 class="text-lg font-bold text-slate-800">
                                    {{ ride.from_city }} → {{ ride.to_city }}
                                </h3>
                                <span 
                                    :class="getRideStatusColor(ride)"
                                    class="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                                >
                                    {{ getRideStatusText(ride) }}
                                </span>
                            </div>
                            <div class="flex items-center space-x-4 text-sm text-gray-500">
                                <span class="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    {{ formatDate(ride.date) }}
                                </span>
                                <span class="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {{ ride.time }}
                                </span>
                            </div>
                        </div>
                        
                        <!-- Expand Arrow -->
                        <div 
                            class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center ml-3 transition-transform"
                            :class="isExpanded(ride.id) ? 'rotate-180' : ''"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>

                    <!-- Quick Info -->
                    <div class="flex items-center justify-between">
                        <!-- Role Badge -->
                        <span 
                            v-if="isDriver(ride)"
                            class="flex items-center space-x-1 bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1.5 rounded-full"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>Водитель</span>
                        </span>
                        <span 
                            v-else
                            class="flex items-center space-x-1 bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>Пассажир</span>
                        </span>

                        <!-- Price -->
                        <div class="flex items-center space-x-4">
                            <div class="text-right">
                                <p class="text-xs text-gray-400 uppercase tracking-wide font-bold">Цена</p>
                                <p class="text-lg font-bold text-slate-800">{{ ride.price }} с.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Expanded Details -->
                <div 
                    v-if="isExpanded(ride.id)"
                    class="border-t border-gray-100 bg-gray-50"
                >
                    <div class="p-5 space-y-4">
                        <!-- Driver Info -->
                        <div>
                            <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
                                {{ isDriver(ride) ? 'Вы - водитель' : 'Водитель' }}
                            </h4>
                            <div class="flex items-center justify-between bg-white p-3 rounded-2xl">
                                <div class="flex items-center space-x-3 flex-1 cursor-pointer" @click="$router.push(`/driver/${ride.driver_id}/reviews`)">
                                    <div class="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-orange-500/20">
                                        {{ ride.driver_name ? ride.driver_name[0] : 'D' }}
                                    </div>
                                    <div>
                                        <p class="font-bold text-slate-800 hover:text-yellow-600 transition-colors">{{ ride.driver_name }}</p>
                                        <div class="flex items-center space-x-1 mt-0.5">
                                            <svg class="w-3 h-3 text-yellow-500 fill-current" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                            </svg>
                                            <span class="text-sm font-bold text-gray-600">{{ ride.driver_rating || '5.0' }}</span>
                                        </div>
                                    </div>
                                </div>
                                <a :href="`tel:${ride.driver_phone}`" class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 hover:bg-green-200 transition-colors" v-if="!isDriver(ride)">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                </a>
                            </div>

                            <!-- Vehicle Info (if driver) -->
                            <div v-if="ride.vehicle && !ride.is_passenger_entry" class="mt-3 bg-white p-3 rounded-2xl flex items-center space-x-3">
                                <div class="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
          <circle cx="7" cy="17" r="2" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 17h6" />
          <circle cx="17" cy="17" r="2" />
                                    </svg>
                                </div>
                                <div>
                                    <p class="text-sm font-bold text-slate-700">{{ ride.vehicle.make }} {{ ride.vehicle.model }}</p>
                                    <p class="text-xs font-mono text-gray-400">{{ ride.vehicle.plate_number }}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Passengers Info -->
                        <div v-if="isDriver(ride)">
                            <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
                                Пассажиры ({{ ride.bookings?.length || 0 }} / {{ ride.seats }})
                            </h4>
                            <div class="space-y-2">
                                <div 
                                    v-for="booking in ride.bookings" 
                                    :key="booking.id"
                                    class="bg-white p-3 rounded-2xl flex items-center space-x-3"
                                >
                                    <div class="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                                        {{ booking.passenger_name ? booking.passenger_name[0] : 'P' }}
                                    </div>
                                    <div class="flex-1">
                                        <p class="font-bold text-slate-700">{{ booking.passenger_name }}</p>
                                        <p class="text-xs text-gray-400">Место {{ booking.seat_number }}</p>
                                    </div>
                                    <div class="text-xs font-bold text-gray-500">
                                        {{ booking.age }} {{ booking.passenger_gender === 'male' ? '👨' : '👩' }}
                                    </div>
                                </div>
                                <div 
                                    v-for="i in (ride.seats - (ride.bookings?.length || 0))" 
                                    :key="'empty-' + i"
                                    class="bg-white p-3 rounded-2xl flex items-center space-x-3 border border-dashed border-gray-200"
                                >
                                    <div class="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <p class="text-gray-400 font-medium">Свободное место</p>
                                </div>
                            </div>
                        </div>

                        <!-- My Booking Info (if passenger) -->
                        <div v-else-if="getUserBooking(ride)">
                            <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Моя бронь</h4>
                            <div class="bg-white p-3 rounded-2xl">
                                <div class="flex items-center justify-between">
                                    <span class="text-sm font-medium text-gray-500">Место в автомобиле</span>
                                    <span class="text-lg font-bold text-slate-800">№{{ getUserBooking(ride).seat_number }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        <div class="space-y-3">
                            <button 
                                @click="$router.push(`/ride/${ride.id}`)"
                                class="w-full bg-slate-900 text-white font-bold py-3 rounded-2xl hover:bg-slate-800 transition-colors flex items-center justify-center space-x-2"
                            >
                                <span>Подробнее</span>
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>

                            <!-- Complete Ride (Driver) -->
                            <button 
                                v-if="isDriver(ride) && ride.status === 'active'"
                                @click="completeRide(ride.id)"
                                class="w-full bg-green-500 text-white font-bold py-3 rounded-2xl hover:bg-green-600 transition-colors shadow-sm"
                            >
                                Завершить поездку
                            </button>

                            <!-- Cancel Ride (Driver) -->
                            <button 
                                v-if="isDriver(ride) && canCancel(ride)"
                                @click="cancelRide(ride)"
                                class="w-full bg-white text-red-500 border-2 border-red-50 font-bold py-3 rounded-2xl hover:bg-red-50 transition-colors"
                            >
                                Отменить поездку
                            </button>

                            <!-- Cancel Booking (Passenger) -->
                            <button 
                                v-if="!isDriver(ride) && getUserBooking(ride) && canCancel(ride)"
                                @click="cancelBooking(ride)"
                                class="w-full bg-white text-red-500 border-2 border-red-50 font-bold py-3 rounded-2xl hover:bg-red-50 transition-colors"
                            >
                                Отменить бронь
                            </button>

                            <!-- Review (Passenger) -->
                            <button 
                                v-if="!isDriver(ride) && ride.status === 'completed'"
                                @click="openReviewModal(ride)"
                                class="w-full bg-yellow-400 text-white font-bold py-3 rounded-2xl hover:bg-yellow-500 transition-colors shadow-lg shadow-yellow-500/20"
                            >
                                Оставить отзыв
                            </button>

                            <!-- Repeat Ride (Both) -->
                            <button 
                                v-if="ride.status === 'completed' || ride.status === 'cancelled'"
                                @click="repeatRide(ride)"
                                class="w-full bg-slate-100 text-slate-800 font-bold py-3 rounded-2xl hover:bg-slate-200 transition-colors shadow-sm mt-2"
                            >
                                Повторить поездку
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <ReviewModal
            v-if="showReviewModal"
            :show="showReviewModal"
            :ride-id="selectedRideForReview?.id"
            :driver-id="selectedRideForReview?.driver_id"
            @close="showReviewModal = false"
            @success="showReviewModal = false"
        />

        <!-- Custom Modal -->
        <AppModal 
            :show="modal.show" 
            :title="modal.title" 
            :message="modal.message" 
            :type="modal.type"
            :confirmText="modal.confirmText"
            :showCancel="modal.showCancel"
            @confirm="modal.onConfirm"
            @cancel="modal.show = false"
            @close="modal.show = false"
        />
    </div>
</template>

<style scoped>
@keyframes blob {
    0%, 100% {
        transform: translate(0px, 0px) scale(1);
    }
    33% {
        transform: translate(30px, -50px) scale(1.1);
    }
    66% {
        transform: translate(-20px, 20px) scale(0.9);
    }
}

.animate-blob {
    animation: blob 7s infinite;
}

.animation-delay-2000 {
    animation-delay: 2s;
}
</style>
