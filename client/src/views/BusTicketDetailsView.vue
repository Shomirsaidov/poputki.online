<script>
import api from '../api';
import AppModal from '../components/AppModal.vue';

export default {
    name: 'BusTicketDetailsView',
    components: { AppModal },
    data() {
        return {
            ticket: null,
            loading: true,
            user: JSON.parse(localStorage.getItem('user') || 'null'),
            modal: {
                show: false, title: '', message: '', type: 'info',
                confirmText: 'ОК', showCancel: false,
                onConfirm: () => { this.modal.show = false; }
            }
        };
    },
    computed: {
        bookedSeats() { return this.ticket?.bookedSeats || []; },
        availableSeats() {
            if (!this.ticket) return 0;
            return this.ticket.total_seats - this.bookedSeats.length;
        },
        formattedDuration() {
            if (!this.ticket) return '';
            const h = Math.floor(this.ticket.duration_minutes / 60);
            const m = this.ticket.duration_minutes % 60;
            return `${h} ч.${m > 0 ? ' ' + m + ' м.' : ''}`;
        }
    },
    methods: {
        showAlert(title, message, type = 'info', onConfirm = null) {
            this.modal.title = title; this.modal.message = message; this.modal.type = type;
            this.modal.confirmText = 'ОК'; this.modal.showCancel = false;
            this.modal.onConfirm = onConfirm || (() => { this.modal.show = false; });
            this.modal.show = true;
        },
        async fetchTicket() {
            this.loading = true;
            try {
                const res = await api.get(`/bus-tickets/${this.$route.params.id}`);
                this.ticket = res.data;
            } catch {
                this.showAlert('Ошибка', 'Ошибка загрузки', 'error', () => {
                    this.modal.show = false; this.$router.push('/');
                });
            } finally { this.loading = false; }
        },
        startBooking() {
            if (!this.user) { this.$router.push('/auth'); return; }
            this.$router.push({ name: 'bus-booking', params: { id: this.ticket.id, step: 1 } });
        },
        formatDate(dateStr) {
            if (!dateStr) return '';
            return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', weekday: 'short' });
        }
    },
    mounted() { this.fetchTicket(); }
};
</script>

<template>
    <div class="min-h-screen bg-slate-50 pb-24">
        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center h-screen">
            <div class="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
        </div>

        <div v-else-if="ticket">
            <!-- Header -->
            <div class="bg-gradient-to-br from-blue-600 to-indigo-700 px-6 pt-14 pb-8 rounded-b-[36px] shadow-lg shadow-indigo-500/20 relative overflow-hidden">
                <div class="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div class="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -ml-10"></div>

                <button @click="$router.back()" class="absolute top-6 left-6 w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white z-10 active:scale-90 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                </button>

                <div class="flex items-center gap-2 mb-3 relative z-10">
                    <div class="bg-white/20 backdrop-blur px-3 py-1 rounded-full">
                        <span class="text-white text-xs font-semibold">{{ ticket.bus_type === 'double' ? 'Двухэтажный' : 'Одноэтажный' }}</span>
                    </div>
                    <div class="bg-white/20 backdrop-blur px-3 py-1 rounded-full">
                        <span class="text-white text-xs font-semibold">{{ ticket.transport_company }}</span>
                    </div>
                </div>

                <!-- Route -->
                <div class="flex items-center gap-4 relative z-10 mt-4">
                    <div class="flex-1">
                        <div class="text-white/70 text-xs font-medium mb-1">{{ formatDate(ticket.departure_date) }}</div>
                        <div class="text-4xl font-bold text-white tracking-tight">{{ ticket.departure_time }}</div>
                        <div class="text-white/90 text-sm font-medium mt-1">{{ ticket.from_city }}</div>
                        <div class="text-white/60 text-xs mt-0.5">{{ ticket.from_address }}</div>
                    </div>

                    <div class="flex flex-col items-center gap-1 px-2">
                        <div class="text-white/40 text-xs">{{ formattedDuration }}</div>
                        <div class="flex items-center gap-1">
                            <div class="w-2 h-2 rounded-full border-2 border-white/60"></div>
                            <div class="w-16 h-[2px] bg-white/30 relative">
                                <div class="absolute inset-0 bg-white/60" style="width:50%; animation: progress 2s infinite"></div>
                            </div>
                            <svg class="w-4 h-4 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                        </div>
                    </div>

                    <div class="flex-1 text-right">
                        <div class="text-white/70 text-xs font-medium mb-1">{{ formatDate(ticket.arrival_date) }}</div>
                        <div class="text-4xl font-bold text-white tracking-tight">{{ ticket.arrival_time }}</div>
                        <div class="text-white/90 text-sm font-medium mt-1">{{ ticket.to_city }}</div>
                        <div class="text-white/60 text-xs mt-0.5">{{ ticket.to_address }}</div>
                    </div>
                </div>
            </div>

            <!-- Content -->
            <div class="px-5 py-6 space-y-4">
                <!-- Price & Availability -->
                <div class="bg-white rounded-3xl p-5 flex items-center justify-between shadow-sm border border-gray-100">
                    <div>
                        <div class="text-xs font-bold text-gray-400 uppercase tracking-wider">Цена за 1 пассажира</div>
                        <div class="text-3xl font-bold text-slate-800 mt-1">{{ ticket.price }} <span class="text-lg text-gray-400 font-medium">с.</span></div>
                    </div>
                    <div class="text-right">
                        <div class="text-xs text-gray-400 font-medium">Мест</div>
                        <div class="text-2xl font-bold" :class="availableSeats > 5 ? 'text-green-600' : availableSeats > 0 ? 'text-amber-500' : 'text-red-500'">
                            {{ availableSeats }}
                        </div>
                        <div class="text-xs text-gray-400">из {{ ticket.total_seats }}</div>
                    </div>
                </div>

                <!-- Route Timeline -->
                <div class="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    <h3 class="font-bold text-slate-700 text-sm mb-6 uppercase tracking-wider">Детали маршрута</h3>
                    
                    <div class="relative pl-6 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-blue-600 before:via-blue-300 before:to-indigo-600 before:rounded-full">
                        
                        <!-- Start -->
                        <div class="relative">
                            <div class="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-blue-600 border-4 border-blue-100 ring-4 ring-white shadow-sm"></div>
                            <div class="flex items-center justify-between mb-1">
                                <span class="font-black text-slate-800 text-lg">{{ ticket.departure_time }}</span>
                                <span class="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">Отправление</span>
                            </div>
                            <div class="font-bold text-slate-700">{{ ticket.from_city }}</div>
                            <div class="text-xs text-gray-500 mt-0.5">{{ ticket.from_address }}</div>
                        </div>

                        <!-- Intermediate Stops -->
                        <div v-for="(stop, idx) in (ticket.intermediate_stops || [])" :key="idx" class="relative">
                            <div class="absolute -left-[20px] top-1.5 w-2.5 h-2.5 rounded-full bg-white border-2 border-blue-400 shadow-sm"></div>
                            <div class="flex items-center justify-between mb-1">
                                <span class="font-bold text-slate-800">{{ stop.time }}</span>
                                <span class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Остановка</span>
                            </div>
                            <div class="font-semibold text-slate-700 text-sm">{{ stop.city }}</div>
                            <div v-if="stop.address" class="text-[11px] text-gray-400 mt-0.5">{{ stop.address }}</div>
                        </div>

                        <!-- End -->
                        <div class="relative pt-2">
                            <div class="absolute -left-[21px] top-3.5 w-3 h-3 rounded-full bg-indigo-600 border-4 border-indigo-100 ring-4 ring-white shadow-sm"></div>
                            <div class="flex items-center justify-between mb-1">
                                <span class="font-black text-slate-800 text-lg">{{ ticket.arrival_time }}</span>
                                <span class="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">Прибытие</span>
                            </div>
                            <div class="font-bold text-slate-700">{{ ticket.to_city }}</div>
                            <div class="text-xs text-gray-500 mt-0.5">{{ ticket.to_address }}</div>
                        </div>
                    </div>
                </div>

                <!-- Passenger Comments -->
                <div v-if="ticket.passenger_comments" class="bg-indigo-50/50 rounded-3xl p-5 border border-indigo-100/50">
                    <div class="flex items-center gap-2 mb-3">
                        <svg class="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        <span class="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Комментарий к рейсу</span>
                    </div>
                    <p class="text-sm text-slate-700 leading-relaxed italic">
                        "{{ ticket.passenger_comments }}"
                    </p>
                </div>

                <!-- Book button -->
                <div>
                    <button
                        @click="startBooking"
                        :disabled="availableSeats === 0"
                        class="w-full py-4 rounded-2xl font-bold text-lg shadow-xl transition-all active:scale-95 disabled:opacity-40"
                        :class="availableSeats > 0 ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/30 hover:shadow-2xl hover:-translate-y-0.5' : 'bg-gray-200 text-gray-400'"
                    >
                        {{ availableSeats > 0 ? 'Купить билет' : 'Мест нет' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- App Modal -->
        <AppModal
            :show="modal.show" :title="modal.title" :message="modal.message"
            :type="modal.type" :confirmText="modal.confirmText" :showCancel="modal.showCancel"
            @confirm="modal.onConfirm" @cancel="modal.show = false" @close="modal.show = false"
        />
    </div>
</template>
