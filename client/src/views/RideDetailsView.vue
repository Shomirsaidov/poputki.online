<script>
import api from '../api';
import SeatSelector from '../components/SeatSelector.vue';
import AppModal from '../components/AppModal.vue';

export default {
    components: {
        SeatSelector,
        AppModal
    },
    data() {
        return {
            ride: null,
            loading: true,
            user: JSON.parse(localStorage.getItem('user') || 'null'),
            matchingDriverRides: [],
            modal: {
                show: false,
                title: '',
                message: '',
                type: 'info',
                confirmText: 'ОК',
                showCancel: false,
                onConfirm: () => { this.modal.show = false; }
            }
        };
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
        async fetchRide() {
            this.loading = true;
            try {
                const res = await api.get(`/rides/${this.$route.params.id}`);
                this.ride = res.data;
                this.checkMatchingRides();
            } catch (e) {
                console.error(e);
                this.showAlert('Ошибка', 'Ошибка при загрузке поездки', 'error', () => {
                    this.modal.show = false;
                    this.$router.push('/');
                });
            } finally {
                this.loading = false;
            }
        },
        async checkMatchingRides() {
            if (!this.user || !this.ride || !this.ride.is_passenger_entry) return;
            try {
               const res = await api.get('/rides', { 
                   params: { from: this.ride.from_city, to: this.ride.to_city } 
               }); 
               this.matchingDriverRides = res.data.filter(r => 
                  r.driver_id === this.user.id && 
                  !r.is_passenger_entry && 
                  r.status === 'active'
               );
            } catch(e) {
                console.error(e);
            }
        },
        async shareRide(driverRideId) {
            this.showConfirm(
                'Предложить поездку',
                'Отправить пассажиру встречное предложение вашей поездки?',
                async () => {
                    this.modal.show = false;
                    try {
                        await api.post(`/rides/${this.ride.id}/share`, { driver_ride_id: driverRideId });
                        this.showAlert('Успешно', 'Мы уведомили пассажира о вашей поездке. Ожидайте бронирования!', 'success');
                    } catch (e) {
                        console.error(e);
                        this.showAlert('Ошибка', e.response?.data?.error || 'Не удалось предложить поездку', 'error');
                    }
                }
            );
        },
        openSeatSelection() {
            if (!this.user) {
                this.$router.push('/auth');
                return;
            }
            if (!this.user.phone) {
                this.showAlert(
                     'Требуется номер телефона', 
                     'Для бронирования места необходимо добавить номер телефона в профиле. Перейти в профиль?',
                     'warning',
                     () => { this.modal.show = false; this.$router.push('/profile'); }
                 );
                 return;
            }
            this.$router.push(`/ride/${this.ride.id}/select-seat`);
        },
        formatRideDateTime(dateStr, timeStr) {
            if (!dateStr) return '';
            const d = new Date(dateStr);
            if (isNaN(d)) return `${dateStr} в ${timeStr || ''}`;
            const formattedDate = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
            return `${formattedDate} в ${timeStr || ''}`;
        },
        repeatRide() {
            this.$router.push({
                path: '/create',
                query: {
                    role: this.isDriver ? 'driver' : 'passenger',
                    from: this.ride?.from_city || '',
                    to: this.ride?.to_city || '',
                    time: this.ride?.time || '',
                    price: this.ride?.price || '',
                    seats: this.ride?.seats || '',
                    fromAddress: this.ride?.from_address || '',
                    toAddress: this.ride?.to_address || '',
                    allows_delivery: this.ride?.allows_delivery ? 'true' : 'false'
                }
            });
        }
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
        },
        hasRowPrices() {
            return this.ride?.row_prices && Object.keys(this.ride.row_prices).length > 0;
        },
        minPrice() {
            if (!this.ride) return 0;
            if (!this.hasRowPrices) return this.ride.price;
            const prices = Object.values(this.ride.row_prices).filter(p => p > 0);
            return Math.min(...prices, this.ride.price);
        },
        isPastRide() {
            if (!this.ride) return false;
            // A ride is past if it's explicitly completed or cancelled, 
            // or if its date+time is strictly in the past by local time.
            if (this.ride.status === 'completed' || this.ride.status === 'cancelled') return true;
            
            const time = this.ride.time || '00:00:00';
            const rideDate = new Date(`${this.ride.date}T${time}`);
            return new Date() > rideDate;
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
             <div class="pb-8 pt-24 bg-slate-100 relative overflow-hidden group rounded-b-[40px] shadow-sm">
                <div class="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/68.7797,38.5598,6,0/600x400?access_token=YOUR_TOKEN')] bg-cover bg-center opacity-40"></div>
                <div class="absolute inset-0 bg-gradient-to-b from-slate-100/50 via-slate-100/80 to-slate-50"></div>
                 
                 <button @click="$router.back()" class="absolute top-6 left-6 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-700 z-10 active:scale-90 transition-transform">
                     <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
                 </button>

                 <div class="relative z-10 px-6 mt-4">
                    <!-- Date and Time Badge -->
                    <div class="inline-flex items-center space-x-3 bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white shadow-sm mb-6">
                        <div class="w-8 h-8 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <span class="text-[15px] font-bold text-slate-800">{{ formatRideDateTime(ride.date, ride.time) }}</span>
                    </div>

                    <!-- Enhanced Route Component -->
                    <div class="bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-white shadow-sm relative overflow-hidden">
                        <!-- Connecting Line -->
                        <div class="absolute left-[39px] top-[48px] bottom-[48px] w-[3px] bg-gradient-to-b from-blue-500 via-gray-200 to-green-500 rounded-full"></div>
                        
                        <!-- Start Point -->
                        <div class="relative flex items-start gap-4 mb-8">
                            <div class="relative mt-1">
                                <div class="w-[18px] h-[18px] rounded-full border-[5px] border-blue-500 bg-white ring-4 ring-blue-50/80 shadow-sm z-10 relative"></div>
                            </div>
                            <div class="flex-1">
                                <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Точка отправления</p>
                                <h2 class="text-2xl font-black text-slate-800 leading-none">{{ ride.from_city }}</h2>
                                <p v-if="ride.from_address" class="text-sm font-medium text-slate-500 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-start gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    <span>{{ ride.from_address }}</span>
                                </p>
                            </div>
                        </div>

                        <!-- End Point -->
                        <div class="relative flex items-start gap-4">
                            <div class="relative mt-1">
                                <div class="w-[18px] h-[18px] rounded-full border-[5px] border-green-500 bg-white ring-4 ring-green-50/80 shadow-sm z-10 relative"></div>
                            </div>
                            <div class="flex-1">
                                <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Пункт назначения</p>
                                <h2 class="text-2xl font-black text-slate-800 leading-none">{{ ride.to_city }}</h2>
                                <p v-if="ride.to_address" class="text-sm font-medium text-slate-500 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-start gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    <span>{{ ride.to_address }}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                 </div>
             </div>

             <!-- Content -->
             <div class="px-6 py-6 space-y-8">
                 
                 <!-- Price Card (Driver Only) -->
                 <div v-if="!ride.is_passenger_entry" class="bg-slate-50 p-6 rounded-3xl flex items-center justify-between border border-slate-100 shadow-soft">
                     <div>
                         <p class="text-sm font-bold text-gray-400 uppercase tracking-wider">Цена за место</p>
                         <p class="text-3xl font-bold text-slate-800 mt-1">
                           <span class="text-lg font-medium text-gray-400 mr-1">от</span>
                           {{ minPrice }}&nbsp;<span class="text-lg text-gray-500 font-medium ml-1">с.</span>
                         </p>
                     </div>
                     <div class="h-12 w-12 rounded-full bg-green-100/80 flex items-center justify-center text-green-600 shadow-inner">
                         <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                     </div>
                 </div>

                  <!-- Premium Info Alert for Passenger Proposals -->
                  <div v-if="ride.is_passenger_entry" class="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50/50 p-6 rounded-[32px] border border-blue-100/60 flex items-start space-x-5 backdrop-blur-sm shadow-sm ring-1 ring-blue-900/5">
                      <div class="absolute -right-6 -top-6 w-24 h-24 bg-blue-400 opacity-[0.05] rounded-full blur-2xl animate-pulse"></div>
                      <div class="w-12 h-12 rounded-2xl bg-white shadow-soft flex items-center justify-center text-2xl shrink-0 border border-blue-100/50 transform hover:scale-110 transition-transform">
                        <span class="animate-bounce-subtle">🤝</span>
                      </div>
                      <div class="flex-1 space-y-1.5 pt-0.5">
                          <p class="text-sm font-black text-blue-900 tracking-tight uppercase">Ищу машину</p>
                          <p class="text-[13px] font-medium text-blue-800/80 leading-relaxed">
                             Это предложение от пассажира. Водителю необходимо создать аналогичную поездку на это же время, чтобы забрать этого пассажира в путь.
                          </p>
                      </div>
                  </div>

                 <!-- Driver / Requester Info -->
                <div>
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-4">
                            <div class="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-orange-500/20">
                                {{ ride.driver_name ? ride.driver_name[0] : 'U' }}
                            </div>
                            <div class="flex-1">
                                <router-link :to="`/user/${ride.driver_id}`" class="text-lg font-bold text-slate-800 hover:text-blue-600 transition-colors">{{ ride.driver_name }}</router-link>
                                <div class="flex items-center space-x-1 translate-y-[-2px]">
                                    <span v-if="ride.is_passenger_entry" class="text-blue-500 text-xs font-bold uppercase tracking-tight">Ищет попутку</span>
                                    <template v-else>
                                        <svg class="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                                        <span class="font-bold text-slate-600">{{ ride.driver_rating }}</span>
                                    </template>
                                </div>
                            </div>
                        </div>

                        <!-- Call Button -->
                        <a v-if="hasBooked" :href="`tel:${ride.driver_phone}`" class="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg shadow-green-500/30 active:scale-90 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        </a>
                    </div>

                    <div v-if="!ride.is_passenger_entry" class="mt-4 flex items-center space-x-2">
                        <div class="px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-2" :class="ride.allows_delivery ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'">
                           <span>Посылка:</span>
                           <span>{{ ride.allows_delivery ? 'Да' : 'Нет' }}</span>
                        </div>
                    </div>

                    <!-- Vehicle Info (for Drivers) -->
                    <div v-if="!ride.is_passenger_entry && ride.vehicle" class="mt-6 p-4 bg-white rounded-2xl shadow-soft border border-gray-100/50 flex items-center space-x-4">
                        <div class="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-xl shadow-inner">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
          <circle cx="7" cy="17" r="2" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 17h6" />
          <circle cx="17" cy="17" r="2" />
                            </svg>
                        </div>
                        <div>
                            <p class="text-sm font-bold text-slate-700 tracking-tight">{{ ride.vehicle.make }} {{ ride.vehicle.model }}</p>
                            <p class="text-[10px] font-mono font-bold text-gray-400 border border-gray-100 px-1.5 py-0.5 rounded-md inline-block mt-0.5">{{ ride.vehicle.plate_number }}</p>
                        </div>
                    </div>

                    <!-- Driver Preferences (Premium List) -->
                    <div v-if="!ride.is_passenger_entry && ride.driver_preferences?.length > 0" class="mt-8 border-t border-slate-50 pt-6">
                        <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Предпочтения водителя</h3>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div v-for="pref in ride.driver_preferences" :key="pref" class="flex items-center space-x-3 p-3 bg-slate-50/50 rounded-2xl border border-slate-100/50 transition-all hover:bg-slate-50">
                                <div class="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                                <span class="text-xs font-bold text-slate-700 tracking-tight">{{ pref }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                 <!-- Passengers / Seats (Driver Offer Only) -->
                  <div v-if="!ride.is_passenger_entry">
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
                           <div v-for="booking in ride.bookings" :key="booking.id" class="flex items-center space-x-4 p-3 rounded-2xl" :class="booking.passenger_gender === 'female' ? 'bg-pink-50 border border-pink-100' : 'bg-blue-50 border border-blue-100'">
                               <router-link :to="`/user/${booking.passenger_id}`" class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" :class="booking.passenger_gender === 'female' ? 'bg-pink-200 text-pink-700' : 'bg-blue-200 text-blue-700'">
                                    {{ booking.passenger_gender === 'female' ? '👩' : (booking.passenger_gender === 'male' ? '👨' : (booking.passenger_name ? booking.passenger_name[0] : 'P')) }}
                               </router-link>
                               <router-link :to="`/user/${booking.passenger_id}`" class="text-slate-700 font-bold hover:text-blue-600 transition-colors">{{ booking.passenger_name || 'Попутчик' }}</router-link>
                           </div>
                     </div>
                  </div>

                  <!-- Action Button -->
                  <div class="mt-8 mb-6">
                      <template v-if="isPastRide">
                          <button 
                             @click="repeatRide"
                             class="w-full py-4 rounded-2xl font-bold text-lg shadow-xl bg-slate-100 text-slate-800 shadow-slate-100/30 hover:bg-slate-200 transition-all flex items-center justify-center space-x-2"
                          >
                             <span>Повторить поездку</span>
                             <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                          </button>
                      </template>
                      <template v-else-if="ride.is_passenger_entry">
                          <button 
                             v-if="matchingDriverRides.length > 0"
                             @click="shareRide(matchingDriverRides[0].id)"
                             class="w-full py-4 rounded-2xl font-bold text-lg shadow-xl bg-blue-500 text-white shadow-blue-500/30 hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center space-x-2 mb-4"
                          >
                             <span>Предложить свою поездку</span>
                             <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                          </button>
                          
                          <router-link 
                            :to="{ 
                                path: '/create', 
                                query: { 
                                    from: ride.from_city, 
                                    to: ride.to_city, 
                                    date: ride.date, 
                                    time: ride.time,
                                    role: 'driver'
                                } 
                            }"
                            class="w-full py-4 rounded-2xl font-bold text-lg shadow-xl bg-slate-900 text-white shadow-slate-900/30 hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center space-x-2"
                          >
                             <span>{{ matchingDriverRides.length > 0 ? 'Создать другую поездку' : 'Создать похожую поездку' }}</span>
                             <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                          </router-link>
                      </template>
                      <button 
                         v-else
                         @click="openSeatSelection" 
                         :disabled="isFull || isDriver || hasBooked"
                         class="w-full py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center space-x-2"
                         :class="hasBooked ? 'bg-green-500 text-white shadow-green-500/30' : 'bg-slate-900 text-white shadow-slate-900/30'"
                      >
                         <span v-if="isDriver">Вы водитель</span>
                         <span v-else-if="hasBooked">Вы записаны</span>
                         <span v-else-if="isFull">Мест нет</span>
                         <span v-else>Выбрать место</span>
                      </button>
                  </div>
             </div>
        </div>

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
