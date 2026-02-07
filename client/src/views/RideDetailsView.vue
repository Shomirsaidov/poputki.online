<script>
import api from '../api';

export default {
    data() {
        return {
            ride: null,
            loading: true,
            bookingLoading: false,
            user: JSON.parse(localStorage.getItem('user') || 'null')
        };
    },
    computed: {
        bookedSeats() {
            return this.ride?.bookings?.length || 0;
        },
        isFull() {
            if (!this.ride) return false;
            return this.bookedSeats >= this.ride.seats;
        },
        isDriver() {
            return this.user && this.ride && this.user.id === this.ride.driver_id;
        },
        hasBooked() {
            if (!this.user || !this.ride || !this.ride.bookings) return false;
            return this.ride.bookings.some(b => b.passenger_id === this.user.id);
        }
    },
    methods: {
        async fetchRide() {
            this.loading = true;
            try {
                const res = await api.get(`/rides/${this.$route.params.id}`);
                this.ride = res.data;
            } catch (e) {
                console.error(e);
                alert('Ошибка при загрузке поездки');
                this.$router.push('/');
            } finally {
                this.loading = false;
            }
        },
        async bookSeat() {
            if (!this.user) {
                this.$router.push('/auth');
                return;
            }
            
            if (confirm(`Забронировать место за ${this.ride.price} с.?`)) {
                this.bookingLoading = true;
                try {
                    await api.post('/bookings', {
                        ride_id: this.ride.id,
                        passenger_id: this.user.id
                    });
                    alert('Место успешно забронировано!');
                    await this.fetchRide(); // Refresh data
                } catch (e) {
                    console.error(e);
                    alert('Ошибка при бронировании');
                } finally {
                    this.bookingLoading = false;
                }
            }
        }
    },
    mounted() {
        this.fetchRide();
    }
}
</script>

<template>
    <div class="min-h-screen bg-white pb-24 relative">
        <div v-if="loading" class="flex items-center justify-center h-screen">
            <div class="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
        </div>

        <div v-else-if="ride">
             <!-- Header / Map Placeholder -->
             <div class="h-64 bg-slate-100 relative overflow-hidden group">
                <div class="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/68.7797,38.5598,6,0/600x400?access_token=YOUR_TOKEN')] bg-cover bg-center opacity-60"></div>
                <div class="absolute inset-0 bg-gradient-to-b from-transparent to-white/90"></div>
                 
                 <button @click="$router.back()" class="absolute top-6 left-6 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-700 z-10 active:scale-90 transition-transform">
                     <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
                 </button>

                 <div class="absolute bottom-6 left-6 right-6">
                     <h1 class="text-3xl font-bold text-slate-800 tracking-tight">{{ ride.from_city }} <span class="text-gray-400 font-light">→</span> {{ ride.to_city }}</h1>
                     <p class="text-slate-500 font-medium mt-1">{{ ride.date }} в {{ ride.time }}</p>
                 </div>
             </div>

             <!-- Content -->
             <div class="px-6 py-6 space-y-8">
                 
                 <!-- Price Card -->
                 <div class="bg-slate-50 p-6 rounded-3xl flex items-center justify-between border border-slate-100">
                     <div>
                         <p class="text-sm font-bold text-gray-400 uppercase tracking-wider">Цена за место</p>
                         <p class="text-3xl font-bold text-slate-800 mt-1">{{ ride.price }} <span class="text-lg text-gray-500 font-medium">с.</span></p>
                     </div>
                     <div class="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                         <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                     </div>
                 </div>

                 <!-- Driver / Requester Info -->
                <div>
                    <h3 class="font-bold text-xl text-slate-800 mb-4">{{ ride.is_passenger_entry ? 'Кто ищет' : 'Водитель' }}</h3>
                    <div class="flex items-center space-x-4">
                        <div class="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-orange-500/20">
                            {{ ride.driver_name ? ride.driver_name[0] : 'U' }}
                        </div>
                        <div class="flex-1">
                            <p class="text-lg font-bold text-slate-800">{{ ride.driver_name }}</p>
                            <div class="flex items-center space-x-1 translate-y-[-2px]">
                                <span v-if="ride.is_passenger_entry" class="text-blue-500 text-xs font-bold uppercase tracking-tight">Ищет попутку</span>
                                <template v-else>
                                    <svg class="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                                    <span class="font-bold text-slate-600">{{ ride.driver_rating }}</span>
                                </template>
                            </div>
                        </div>
                    </div>

                    <!-- Vehicle Info (for Drivers) -->
                    <div v-if="!ride.is_passenger_entry && ride.vehicle" class="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center space-x-4">
                        <div class="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-xl">🚗</div>
                        <div>
                            <p class="text-sm font-bold text-slate-700">{{ ride.vehicle.make }} {{ ride.vehicle.model }}</p>
                            <p class="text-xs font-mono text-gray-400">{{ ride.vehicle.plate_number }}</p>
                        </div>
                    </div>
                </div>

                 <!-- Passengers / Seats -->
                  <div>
                     <h3 class="font-bold text-xl text-slate-800 mb-4 flex justify-between items-center">
                         <span>Пассажиры</span>
                         <span class="text-sm font-medium bg-gray-100 px-3 py-1 rounded-full text-gray-500">{{ bookedSeats }} / {{ ride.seats }}</span>
                     </h3>
                     
                     <div class="space-y-3">
                         <!-- Empty Seats -->
                         <div v-for="i in (ride.seats - bookedSeats)" :key="'empty-'+i" class="flex items-center space-x-4 p-3 rounded-2xl border border-dashed border-gray-200">
                             <div class="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                                 <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                             </div>
                             <p class="text-gray-400 font-medium">Свободное место</p>
                         </div>

                         <!-- Booked Seats -->
                         <div v-for="booking in ride.bookings" :key="booking.id" class="flex items-center space-x-4 p-3 rounded-2xl bg-yellow-50 border border-yellow-100">
                             <div class="w-10 h-10 rounded-full bg-yellow-200 flex items-center justify-center text-yellow-700 font-bold text-sm">
                                 {{ booking.passenger_name ? booking.passenger_name[0] : 'P' }}
                             </div>
                             <p class="text-slate-700 font-bold">{{ booking.passenger_name || 'Попутчик' }}</p>
                         </div>
                     </div>
                 </div>
             </div>

             <!-- Action Button -->
             <div class="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100 z-20 max-w-[480px] mx-auto">
                 <button 
                    @click="bookSeat" 
                    :disabled="isFull || isDriver || hasBooked || bookingLoading"
                    class="w-full py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center space-x-2"
                    :class="hasBooked ? 'bg-green-500 text-white shadow-green-500/30' : 'bg-slate-900 text-white shadow-slate-900/30'"
                 >
                    <span v-if="bookingLoading" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span v-else-if="isDriver">Вы водитель</span>
                    <span v-else-if="hasBooked">Вы записаны</span>
                    <span v-else-if="isFull">Мест нет</span>
                    <span v-else>Забронировать место</span>
                 </button>
             </div>
        </div>
    </div>
</template>
