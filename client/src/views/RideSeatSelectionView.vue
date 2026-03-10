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
            bookingLoading: false,
            selectedSeat: [],
            bookingGender: null,
            user: JSON.parse(localStorage.getItem('user') || 'null'),
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
        async bookSeat() {
            if (this.selectedSeat.length === 0) {
                this.showAlert('Внимание', 'Пожалуйста, выберите место', 'warning');
                return;
            }
            if (!this.bookingGender) {
                this.showAlert('Внимание', 'Пожалуйста, выберите пол', 'warning');
                return;
            }

            this.showConfirm(
                'Подтверждение',
                `Забронировать место №${this.selectedSeat[0]} за ${this.currentSeatPrice} с.?`,
                async () => {
                    this.modal.show = false;
                    this.bookingLoading = true;
                    try {
                        await api.post('/bookings', {
                            ride_id: this.ride.id,
                            passenger_id: this.user.id,
                            seat_number: this.selectedSeat[0],
                            passenger_gender: this.bookingGender
                        });
                        this.showAlert('Успешно', 'Место успешно забронировано!', 'success', () => {
                            this.modal.show = false;
                            this.$router.push(`/ride/${this.ride.id}`);
                        });
                    } catch (e) {
                        console.error(e);
                        this.showAlert('Ошибка', e.response?.data?.error || 'Ошибка при бронировании', 'error');
                    } finally {
                        this.bookingLoading = false;
                    }
                }
            );
        }
    },
    computed: {
        hasRowPrices() {
            return this.ride?.row_prices && Object.keys(this.ride.row_prices).length > 0;
        },
        currentSeatPrice() {
            if (!this.ride || this.selectedSeat.length === 0) return 0;
            if (!this.hasRowPrices) return this.ride.price;
            
            const seatId = this.selectedSeat[0];
            let row = 'row2';
            if (seatId <= 2) row = 'front';
            else if (seatId > 5) row = 'row3';
            
            return this.ride.row_prices[row] || this.ride.price;
        }
    },
    mounted() {
        if (!this.user) {
            this.$router.push('/auth');
            return;
        }
        this.fetchRide();
    }
}
</script>

<template>
    <div class="min-h-screen bg-slate-50 pb-32">
        <!-- Header -->
        <div class="bg-white p-6 pt-8 pb-6 shadow-sm sticky top-0 z-20 flex items-center">
            <button @click="$router.back()" class="mr-4 p-2 -ml-2 text-slate-400 active:scale-90 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div>
                <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Выберите место</h1>
                <p v-if="ride" class="text-sm text-gray-400 mt-0.5">{{ ride.from_city }} → {{ ride.to_city }}</p>
            </div>
        </div>

        <div v-if="loading" class="flex flex-col items-center justify-center h-[60vh] space-y-4">
            <div class="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-slate-400 font-medium">Загружаем схему…</p>
        </div>

        <div v-else-if="ride" class="p-6 max-w-lg mx-auto space-y-8 animate-fade-in">
            <!-- Seat Selector Component (Simplified) -->
            <SeatSelector 
                v-model="selectedSeat" 
                mode="select"
                :existing-bookings="ride.bookings"
                :reserved-seats="ride.reserved_seats || []"
                :total-seats="ride.total_seats || 5"
                :row-prices="ride.row_prices || {}"
            />

            <!-- Gender Selection -->
            <div v-if="selectedSeat.length > 0" class="space-y-4 animate-slide-up">
                <div class="flex flex-col space-y-1 ml-1">
                    <label class="text-xs font-black text-slate-400 uppercase tracking-widest">Ваш пол</label>
                    <p class="text-[10px] text-gray-400">Это поможет другим пассажирам при выборе мест</p>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <button 
                        @click="bookingGender = 'male'"
                        class="group p-5 rounded-2xl border-2 font-bold transition-all flex flex-col items-center justify-center space-y-3 relative overflow-hidden"
                        :class="bookingGender === 'male' ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-lg shadow-blue-500/10' : 'border-white bg-white text-slate-400 shadow-sm hover:border-gray-200'"
                    >
                        <div class="w-12 h-12 flex items-center justify-center rounded-full bg-slate-50 group-hover:bg-blue-50 transition-colors" :class="{'bg-blue-100/50': bookingGender === 'male'}">
                            <svg class="w-8 h-8 transition-all" :class="bookingGender === 'male' ? 'text-blue-600' : 'text-slate-300 group-hover:text-blue-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 2l4 4m0 0l-4 4m4-4h-6" :class="bookingGender === 'male' ? 'text-blue-800' : 'text-slate-400 opacity-40'" />
                            </svg>
                        </div>
                        <span class="text-xs uppercase tracking-widest font-black">Мужчина</span>
                    </button>
                    <button 
                        @click="bookingGender = 'female'"
                        class="group p-5 rounded-2xl border-2 font-bold transition-all flex flex-col items-center justify-center space-y-3 relative overflow-hidden"
                        :class="bookingGender === 'female' ? 'border-pink-500 bg-pink-50 text-pink-700 shadow-lg shadow-pink-500/10' : 'border-white bg-white text-slate-400 shadow-sm hover:border-gray-200'"
                    >
                        <div class="w-12 h-12 flex items-center justify-center rounded-full bg-slate-50 group-hover:bg-pink-50 transition-colors" :class="{'bg-pink-100/50': bookingGender === 'female'}">
                            <svg class="w-8 h-8 transition-all" :class="bookingGender === 'female' ? 'text-pink-600' : 'text-slate-300 group-hover:text-pink-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2v4m0 0H8m4 0h4" :class="bookingGender === 'female' ? 'text-pink-800' : 'text-slate-400 opacity-40'" />
                            </svg>
                        </div>
                        <span class="text-xs uppercase tracking-widest font-black">Женщина</span>
                    </button>
                </div>
            </div>

            <!-- Action Area (In Flow) -->
            <div class="pt-6 border-t border-slate-200/60">
                <div class="flex items-center space-x-6">
                    <div class="flex-1">
                        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Итого</p>
                        <p class="text-2xl font-black text-slate-800 mt-1">
                            {{ selectedSeat.length > 0 ? currentSeatPrice : 0 }}&nbsp;<span class="text-sm font-bold text-gray-400">с.</span>
                        </p>
                    </div>
                    <button 
                        @click="bookSeat" 
                        :disabled="selectedSeat.length === 0 || !bookingGender || bookingLoading"
                        class="flex-[2] py-4 rounded-2xl font-bold text-lg shadow-xl transition-all disabled:opacity-50 disabled:grayscale bg-slate-900 text-white shadow-slate-900/30 hover:shadow-2xl hover:-translate-y-0.5 active:scale-95 flex items-center justify-center space-x-2"
                    >
                        <span v-if="bookingLoading" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        <span v-else>{{ selectedSeat.length > 0 ? 'Забронировать' : 'Выберите место' }}</span>
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

<style scoped>
.shadow-soft {
  box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.05), 0 5px 15px -5px rgba(0, 0, 0, 0.02);
}

.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}

.animate-slide-up {
  animation: slideUp 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
