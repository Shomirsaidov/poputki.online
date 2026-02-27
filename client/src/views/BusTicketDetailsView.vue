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
                        <span class="text-white text-xs font-semibold">Автобус</span>
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

                <!-- Route Details -->
                <div class="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                    <h3 class="font-bold text-slate-700 text-sm mb-4 uppercase tracking-wider">Детали маршрута</h3>
                    <div class="space-y-4">
                        <div class="flex items-start gap-3">
                            <div class="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center mt-0.5 shrink-0">
                                <svg class="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="3"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2v3m0 14v3M2 12h3m14 0h3"/></svg>
                            </div>
                            <div>
                                <div class="text-xs text-gray-400 font-medium">Отправление</div>
                                <div class="font-bold text-slate-800">{{ ticket.from_city }}</div>
                                <div class="text-sm text-gray-500">{{ ticket.from_address }}</div>
                                <div class="text-sm font-semibold text-blue-600 mt-0.5">{{ ticket.departure_date }} · {{ ticket.departure_time }}</div>
                            </div>
                        </div>
                        <div class="ml-4 h-6 w-[2px] bg-gradient-to-b from-blue-300 to-indigo-300 ml-[15px]"></div>
                        <div class="flex items-start gap-3">
                            <div class="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center mt-0.5 shrink-0">
                                <svg class="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                            </div>
                            <div>
                                <div class="text-xs text-gray-400 font-medium">Прибытие</div>
                                <div class="font-bold text-slate-800">{{ ticket.to_city }}</div>
                                <div class="text-sm text-gray-500">{{ ticket.to_address }}</div>
                                <div class="text-sm font-semibold text-indigo-600 mt-0.5">{{ ticket.arrival_date }} · {{ ticket.arrival_time }}</div>
                            </div>
                        </div>
                    </div>
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
