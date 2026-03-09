<script>
import api from '../api';

export default {
    name: 'MyBusTicketsView',
    data() {
        return {
            user: JSON.parse(localStorage.getItem('user') || 'null'),
            bookings: [],
            loading: true,
            showSuccessBanner: false
        };
    },
    computed: {
        upcoming() {
            const now = new Date().toISOString().split('T')[0];
            return this.bookings.filter(b => b.departure_date >= now);
        },
        past() {
            const now = new Date().toISOString().split('T')[0];
            return this.bookings.filter(b => b.departure_date < now);
        }
    },
    methods: {
        async fetchBookings() {
            this.loading = true;
            try {
                const res = await api.get(`/users/${this.user.id}/bus-bookings`);
                this.bookings = res.data;
            } catch (e) {
                console.error(e);
            } finally {
                this.loading = false;
            }
        },
        formatDate(dateStr) {
            if (!dateStr) return '';
            const d = new Date(dateStr);
            return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'short' });
        },
        formatDuration(minutes) {
            if (!minutes) return '';
            const h = Math.floor(minutes / 60);
            const m = minutes % 60;
            return `${h} ч.${m > 0 ? ' ' + m + ' м.' : ''}`;
        }
    },
    async mounted() {
        if (!this.user) { this.$router.push('/auth'); return; }
        if (this.$route.query.booked === 'true') {
            this.showSuccessBanner = true;
            setTimeout(() => { this.showSuccessBanner = false; }, 5000);
            this.$router.replace({ name: 'my-bus-tickets' });
        }
        await this.fetchBookings();
    }
};
</script>

<template>
    <div class="min-h-screen bg-slate-50 pb-10">
        <!-- Header -->
        <div class="bg-gradient-to-br from-blue-600 to-indigo-700 px-5 pt-12 pb-7 rounded-b-[32px] shadow-lg shadow-indigo-500/20 relative overflow-hidden">
            <div class="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <div class="flex items-center gap-4 relative z-10">
                <button @click="$router.back()"
                    class="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white active:scale-90 transition-transform shrink-0">
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                    </svg>
                </button>
                <div>
                    <h1 class="text-xl font-bold text-white">Мои билеты</h1>
                    <p class="text-white/60 text-xs mt-0.5">Автобусные бронирования</p>
                </div>
            </div>
        </div>

        <!-- Success Banner -->
        <Transition name="slide-down">
            <div v-if="showSuccessBanner" class="mx-5 mt-4 bg-green-500 text-white px-5 py-4 rounded-2xl shadow-lg shadow-green-500/25 flex items-center gap-3">
                <div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                    </svg>
                </div>
                <div>
                    <div class="font-bold text-sm">Билет оформлен!</div>
                    <div class="text-xs opacity-80 mt-0.5">Ваши места зарезервированы</div>
                </div>
            </div>
        </Transition>

        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center py-24">
            <div class="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>

        <!-- Empty State -->
        <div v-else-if="bookings.length === 0" class="flex flex-col items-center justify-center py-24 px-8 text-center">
            <div class="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center mb-5">
                <svg class="w-12 h-12 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="5" width="18" height="14" rx="2"/>
                    <path stroke-linecap="round" d="M3 11h18M7 19v2M17 19v2M3 8h18"/>
                </svg>
            </div>
            <h3 class="text-xl font-bold text-slate-700 mb-2">Нет билетов</h3>
            <p class="text-gray-400 text-sm mb-6">У вас ещё нет купленных автобусных билетов</p>
            <button @click="$router.push({ name: 'search', query: { tab: 'bus' } })"
                class="bg-blue-600 text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-blue-500/30 active:scale-95 transition-all">
                Найти рейс
            </button>
        </div>

        <!-- Bookings list -->
        <div v-else class="px-5 py-5 space-y-6">

            <!-- Upcoming -->
            <div v-if="upcoming.length > 0">
                <h2 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Предстоящие ({{ upcoming.length }})</h2>
                <div class="space-y-4">
                    <div v-for="b in upcoming" :key="b.id"
                        class="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden relative">

                        <!-- Ticket Content -->
                        <div class="bg-gradient-to-br from-blue-700 to-indigo-800 px-6 py-5 relative">
                            <!-- Subtle background pattern -->
                            <div class="absolute inset-0 opacity-10" style="background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, #fff 10px, #fff 11px);"></div>
                            
                            <div class="flex items-center justify-between mb-4 relative z-10">
                                <div class="text-blue-200 text-xs font-bold uppercase tracking-widest shrink-0">{{ b.transport_company }}</div>
                                <div class="bg-white/20 backdrop-blur text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-white/20">
                                    Подтверждено
                                </div>
                            </div>
                            
                            <div class="flex items-center justify-between relative z-10">
                                <div>
                                    <div class="text-3xl font-black text-white tracking-tight">{{ b.departure_time }}</div>
                                    <div class="text-blue-100 text-sm font-semibold mt-1">{{ b.from_city }}</div>
                                </div>
                                <div class="flex flex-col items-center gap-1.5 px-4 shrink-0">
                                    <div class="text-blue-200 text-[10px] font-bold uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded-full">
                                        {{ formatDuration(b.duration_minutes) }}
                                    </div>
                                    <div class="flex items-center gap-1 w-full mt-1 line-container relative">
                                        <div class="flex-1 border-t-2 border-dashed border-blue-300"></div>
                                        <svg class="w-5 h-5 text-blue-300 absolute left-1/2 -translate-x-1/2 -top-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 5l7 7-7 7M5 5l7 7-7 7"/></svg>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <div class="text-3xl font-black text-white tracking-tight">{{ b.arrival_time }}</div>
                                    <div class="text-blue-100 text-sm font-semibold mt-1">{{ b.to_city }}</div>
                                </div>
                            </div>
                        </div>

                        <!-- Ticket specifics -->
                        <div class="px-6 py-5 bg-white relative">
                            <div class="flex items-start justify-between">
                                <div class="space-y-4">
                                    <div>
                                        <div class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Пассажиры</div>
                                        <div class="font-bold text-slate-800 text-sm">{{ b.passenger_count }} {{ b.passenger_count === 1 ? 'пассажир' : 'пассажира' }}</div>
                                    </div>
                                    <div>
                                        <div class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Дата и время</div>
                                        <div class="font-bold text-slate-800 text-sm">{{ formatDate(b.departure_date) }}</div>
                                    </div>
                                </div>
                                
                                <div class="text-right space-y-4">
                                     <div>
                                        <div class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Места</div>
                                        <div class="flex gap-1 justify-end flex-wrap max-w-[100px]">
                                            <span v-for="seat in b.seat_numbers" :key="seat" class="px-2 py-0.5 bg-gray-100 text-slate-700 text-xs font-bold rounded">
                                                №{{ seat }}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <div class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Сумма</div>
                                        <div class="font-black text-slate-800 text-lg">{{ b.total_price }} с.</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Perforated Cutout Line -->
                        <div class="relative w-full h-8 flex items-center bg-white">
                            <div class="absolute -left-4 w-8 h-8 rounded-full bg-slate-50 border border-gray-100 z-10 shadow-inner"></div>
                            <div class="w-full border-t-[2px] border-dashed border-gray-200"></div>
                            <div class="absolute -right-4 w-8 h-8 rounded-full bg-slate-50 border border-gray-100 z-10 shadow-inner"></div>
                        </div>

                        <!-- Ticket Footer (QR Code & ID) -->
                        <div class="px-6 pb-6 pt-2 bg-white flex items-center justify-between">
                            <div>
                                <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Номер билета</div>
                                <div class="text-sm font-mono font-bold text-slate-800">
                                    TK-{{ String(b.id || Math.floor(Math.random() * 1000)).padStart(6, '0') }}-{{ new Date(b.departure_date).getMonth() + 1 }}
                                </div>
                            </div>
                            
                            <!-- Fake Barcode Element to look like a ticket -->
                            <div class="flex items-center h-10 gap-[2px] opacity-80 mix-blend-multiply">
                                <div class="w-1 h-full bg-slate-800"></div>
                                <div class="w-0.5 h-full bg-slate-800"></div>
                                <div class="w-1.5 h-full bg-slate-800"></div>
                                <div class="w-1 h-full bg-slate-800"></div>
                                <div class="w-0.5 h-full bg-slate-800"></div>
                                <div class="w-2 h-full bg-slate-800"></div>
                                <div class="w-1 h-full bg-slate-800"></div>
                                <div class="w-[3px] h-full bg-slate-800"></div>
                                <div class="w-0.5 h-full bg-slate-800"></div>
                                <div class="w-1.5 h-full bg-slate-800"></div>
                                <div class="w-1 h-full bg-slate-800"></div>
                                <div class="w-[3px] h-full bg-slate-800"></div>
                                <div class="w-1 h-full bg-slate-800"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Past -->
            <div v-if="past.length > 0">
                <h2 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Прошедшие ({{ past.length }})</h2>
                <div class="space-y-4">
                    <div v-for="b in past" :key="b.id"
                        class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden opacity-70">
                        <div class="bg-gradient-to-r from-slate-400 to-slate-500 px-5 py-4">
                            <div class="flex items-center justify-between mb-3">
                                <div class="text-white/60 text-xs font-bold uppercase tracking-wider">{{ b.transport_company }}</div>
                                <div class="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">Завершено</div>
                            </div>
                            <div class="flex items-center justify-between">
                                <div>
                                    <div class="text-2xl font-bold text-white">{{ b.departure_time }}</div>
                                    <div class="text-white/80 text-sm font-medium">{{ b.from_city }}</div>
                                </div>
                                <div class="text-white/40 text-xs px-3">→</div>
                                <div class="text-right">
                                    <div class="text-2xl font-bold text-white">{{ b.arrival_time }}</div>
                                    <div class="text-white/80 text-sm font-medium">{{ b.to_city }}</div>
                                </div>
                            </div>
                        </div>
                        <div class="px-5 py-3 flex items-center justify-between text-sm">
                            <div class="text-gray-400">{{ formatDate(b.departure_date) }}</div>
                            <div class="font-bold text-gray-500">{{ b.total_price }} с.</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.slide-down-enter-active, .slide-down-leave-active { transition: all 0.3s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-12px); }
</style>
