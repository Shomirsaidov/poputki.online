<script>
import api from '../api';
import BusSeatSelector from '../components/BusSeatSelector.vue';
import AppModal from '../components/AppModal.vue';

const STATE_KEY = (id) => `bus_booking_${id}`;

export default {
    name: 'BusBookingView',
    components: { BusSeatSelector, AppModal },
    data() {
        return {
            ticket: null,
            loading: true,
            bookingLoading: false,
            user: JSON.parse(localStorage.getItem('user') || 'null'),

            // Persisted state
            passengerCount: 1,
            selectedSeats: [],
            passengersData: [],
            phone: '',
            countries: [
                "Таджикистан", "Россия", "Узбекистан", "Казахстан", "Кыргызстан", 
                "Туркменистан", "Беларусь", "Армения", "Азербайджан", "Грузия",
                "Турция", "ОАЭ", "США", "Китай", "Германия", "Другое"
            ],

            modal: {
                show: false, title: '', message: '', type: 'info',
                confirmText: 'ОК', showCancel: false,
                onConfirm: () => { this.modal.show = false; }
            }
        };
    },
    computed: {
        step() {
            return Number(this.$route.params.step) || 1;
        },
        ticketId() {
            return this.$route.params.id;
        },
        bookedSeats() {
            return this.ticket?.bookedSeats || [];
        },
        availableSeats() {
            if (!this.ticket) return 0;
            return this.ticket.total_seats - this.bookedSeats.length;
        },
        formattedDuration() {
            if (!this.ticket) return '';
            const h = Math.floor(this.ticket.duration_minutes / 60);
            const m = this.ticket.duration_minutes % 60;
            return `${h} ч.${m > 0 ? ' ' + m + ' м.' : ''}`;
        },
        totalPrice() {
            if (!this.ticket) return 0;
            return this.ticket.price * this.passengerCount;
        },
        canProceedStep1() {
            return this.selectedSeats.length === this.passengerCount;
        },
        canProceedStep2() {
            return this.passengersData.every(p =>
                p.gender && p.lastName && p.firstName && p.birthDate &&
                p.citizenship && (p.citizenship !== 'Другое' || p.customCitizenship?.trim()) &&
                p.docType && p.docNumber
            ) && this.phone;
        },
        stepTitle() {
            return ['', 'Выбор мест', 'Данные пассажиров', 'Подтверждение'][this.step] || '';
        }
    },
    methods: {
        showAlert(title, message, type = 'info', onConfirm = null) {
            this.modal.title = title; this.modal.message = message; this.modal.type = type;
            this.modal.confirmText = 'ОК'; this.modal.showCancel = false;
            this.modal.onConfirm = onConfirm || (() => { this.modal.show = false; });
            this.modal.show = true;
        },

        saveState() {
            sessionStorage.setItem(STATE_KEY(this.ticketId), JSON.stringify({
                passengerCount: this.passengerCount,
                selectedSeats: this.selectedSeats,
                passengersData: this.passengersData,
                phone: this.phone
            }));
        },

        loadState() {
            try {
                const raw = sessionStorage.getItem(STATE_KEY(this.ticketId));
                if (raw) {
                    const s = JSON.parse(raw);
                    this.passengerCount = s.passengerCount || 1;
                    this.selectedSeats = s.selectedSeats || [];
                    this.passengersData = s.passengersData || this.buildPassengersData(this.passengerCount);
                    this.phone = s.phone || '';
                } else {
                    this.passengersData = this.buildPassengersData(1);
                }
            } catch {
                this.passengersData = this.buildPassengersData(1);
            }
        },

        async fetchTicket() {
            this.loading = true;
            try {
                const res = await api.get(`/bus-tickets/${this.ticketId}`);
                this.ticket = res.data;
            } catch {
                this.showAlert('Ошибка', 'Ошибка загрузки билета', 'error', () => {
                    this.modal.show = false;
                    this.$router.push('/');
                });
            } finally {
                this.loading = false;
            }
        },

        buildPassengersData(count) {
            return Array.from({ length: count }, (_, i) => ({
                index: i + 1,
                gender: '',
                lastName: '',
                firstName: '',
                middleName: '',
                birthDate: '',
                citizenship: 'Таджикистан',
                customCitizenship: '',
                docType: 'Внутренний паспорт',
                docNumber: '',
            }));
        },

        onPassengerCountChange() {
            this.selectedSeats = [];
            this.passengersData = this.buildPassengersData(this.passengerCount);
            this.saveState();
        },

        goBack() {
            if (this.step === 1) {
                this.$router.push({ name: 'bus-ticket-details', params: { id: this.ticketId } });
            } else {
                this.saveState();
                this.$router.push({ name: 'bus-booking', params: { id: this.ticketId, step: this.step - 1 } });
            }
        },

        goToStep2() {
            if (!this.canProceedStep1) {
                this.showAlert('Внимание', `Выберите ${this.passengerCount} место(а) на схеме`, 'warning');
                return;
            }
            this.saveState();
            this.$router.push({ name: 'bus-booking', params: { id: this.ticketId, step: 2 } });
        },

        goToStep3() {
            if (!this.canProceedStep2) {
                this.showAlert('Внимание', 'Заполните все поля для каждого пассажира и укажите телефон', 'warning');
                return;
            }
            this.saveState();
            this.$router.push({ name: 'bus-booking', params: { id: this.ticketId, step: 3 } });
        },

        async confirmBooking() {
            this.bookingLoading = true;
            try {
                await api.post('/bus-ticket-bookings', {
                    bus_ticket_id: Number(this.ticketId),
                    passenger_id: this.user.id,
                    seat_numbers: this.selectedSeats,
                    passengers_data: this.passengersData,
                    phone: this.phone
                });
                sessionStorage.removeItem(STATE_KEY(this.ticketId));
                this.$router.replace({ name: 'my-bus-tickets', query: { booked: 'true' } });
            } catch (e) {
                this.showAlert('Ошибка', e.response?.data?.error || 'Ошибка при бронировании', 'error');
            } finally {
                this.bookingLoading = false;
            }
        },

        formatDate(dateStr) {
            if (!dateStr) return '';
            const d = new Date(dateStr);
            return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', weekday: 'short' });
        }
    },

    async mounted() {
        if (!this.user) {
            this.$router.replace('/auth');
            return;
        }
        await this.fetchTicket();
        this.loadState();
    },

    watch: {
        // When step changes via router, reload state
        '$route.params.step'() {
            this.loadState();
        }
    }
};
</script>

<template>
    <div class="min-h-screen bg-slate-50 pb-10">
        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center h-screen">
            <div class="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>

        <template v-else-if="ticket">
            <!-- Header -->
            <div class="bg-gradient-to-br from-blue-600 to-indigo-700 px-5 pt-14 pb-6 relative overflow-hidden">
                <div class="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>

                <!-- Back + Title row -->
                <div class="flex items-center gap-4 relative z-10 mb-5">
                    <button @click="goBack"
                        class="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white active:scale-90 transition-transform shrink-0">
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                        </svg>
                    </button>
                    <div class="flex-1">
                        <p class="text-white/60 text-xs font-medium">{{ ticket.from_city }} → {{ ticket.to_city }}</p>
                        <h1 class="text-white text-xl font-bold">{{ stepTitle }}</h1>
                    </div>
                    <!-- Step badge -->
                    <div class="bg-white/20 backdrop-blur px-3 py-1 rounded-full shrink-0">
                        <span class="text-white text-xs font-bold">{{ step }} / 3</span>
                    </div>
                </div>

                <!-- Progress bar -->
                <div class="flex gap-2 relative z-10">
                    <div v-for="s in [1,2,3]" :key="s"
                        class="flex-1 h-1 rounded-full transition-all duration-500"
                        :class="step >= s ? 'bg-white' : 'bg-white/25'">
                    </div>
                </div>
            </div>

            <!-- ============================================================ -->
            <!-- STEP 1: SEAT SELECTION -->
            <!-- ============================================================ -->
            <div v-if="step === 1" class="px-5 pt-6 pb-6">
                <!-- Ticket mini-card -->
                <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6 flex items-center justify-between">
                    <div>
                        <div class="text-xs text-gray-400 font-medium">Отправление</div>
                        <div class="font-bold text-slate-800 text-lg">{{ ticket.departure_time }} · {{ ticket.departure_date }}</div>
                        <div class="text-sm text-gray-500">{{ ticket.from_address }}</div>
                    </div>
                    <div class="text-right">
                        <div class="text-xs text-gray-400 font-medium">1 пасс.</div>
                        <div class="font-bold text-blue-600 text-lg">{{ ticket.price }} с.</div>
                        <div class="text-xs text-gray-400">{{ availableSeats }} из {{ ticket.total_seats }} мест</div>
                    </div>
                </div>

                <!-- Passenger count selector -->
                <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <div class="font-bold text-slate-800">Количество пассажиров</div>
                            <div class="text-sm text-gray-400 mt-0.5">Итого: {{ totalPrice }} с.</div>
                        </div>
                        <div class="flex items-center gap-4">
                            <button
                                @click="if(passengerCount > 1){ passengerCount--; onPassengerCountChange(); }"
                                class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xl transition-colors active:bg-slate-200">
                                −
                            </button>
                            <span class="text-2xl font-bold text-slate-800 w-8 text-center">{{ passengerCount }}</span>
                            <button
                                @click="if(passengerCount < Math.min(6, availableSeats)){ passengerCount++; onPassengerCountChange(); }"
                                class="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-blue-500/30 transition-colors active:bg-blue-700">
                                +
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Seat map -->
                <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
                    <h3 class="font-bold text-slate-700 mb-4">Схема салона</h3>
                    <BusSeatSelector
                        v-model="selectedSeats"
                        :bookedSeats="bookedSeats"
                        :seatGenders="ticket.seatGenders"
                        :totalSeats="ticket.total_seats"
                        :maxSelectable="passengerCount"
                    />
                </div>

                <!-- Selected summary chip -->
                <Transition name="fade">
                    <div v-if="selectedSeats.length > 0"
                        class="mb-4 px-4 py-3 bg-blue-50 border border-blue-100 rounded-2xl text-sm text-blue-700 font-semibold text-center">
                        ✓ Выбраны места: {{ [...selectedSeats].sort((a,b) => a-b).join(', ') }}
                        <span class="text-blue-400 font-medium">({{ selectedSeats.length }} из {{ passengerCount }})</span>
                    </div>
                </Transition>
            </div>

            <!-- ============================================================ -->
            <!-- STEP 2: PASSENGER DATA -->
            <!-- ============================================================ -->
            <div v-if="step === 2" class="px-5 pt-6 pb-6 space-y-4">
                <div v-for="(p, i) in passengersData" :key="i"
                    class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <!-- Card header -->
                    <div class="px-5 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100 flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm">{{ i + 1 }}</div>
                            <div>
                                <div class="font-bold text-slate-800 text-sm">Пассажир {{ i + 1 }}</div>
                                <div class="text-xs text-gray-400">Место {{ [...selectedSeats].sort((a,b)=>a-b)[i] }}</div>
                            </div>
                        </div>
                        <div v-if="p.gender" class="text-xs font-bold px-3 py-1.5 rounded-full"
                            :class="p.gender === 'male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'">
                            {{ p.gender === 'male' ? '♂ Мужчина' : '♀ Женщина' }}
                        </div>
                    </div>

                    <div class="p-5 space-y-3">
                        <!-- Gender -->
                        <div class="grid grid-cols-2 gap-2">
                            <button @click="p.gender = 'male'; saveState()"
                                :class="p.gender === 'male' ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20' : 'border-gray-200 text-gray-500 bg-white'"
                                class="py-3 rounded-xl border-2 font-bold text-sm transition-all flex items-center justify-center gap-2 active:scale-95">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a5 5 0 110 10A5 5 0 0112 2zm0 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z"/></svg>
                                Мужчина
                            </button>
                            <button @click="p.gender = 'female'; saveState()"
                                :class="p.gender === 'female' ? 'bg-pink-500 text-white border-pink-500 shadow-lg shadow-pink-500/20' : 'border-gray-200 text-gray-500 bg-white'"
                                class="py-3 rounded-xl border-2 font-bold text-sm transition-all flex items-center justify-center gap-2 active:scale-95">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a5 5 0 110 10A5 5 0 0112 2zm0 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z"/></svg>
                                Женщина
                            </button>
                        </div>

                        <!-- Surname -->
                        <div class="relative">
                            <label class="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1 px-1">Фамилия *</label>
                            <input v-model="p.lastName" @input="saveState" type="text" placeholder="Иванов"
                                class="w-full px-4 py-3.5 bg-slate-50 border border-gray-200 rounded-xl text-slate-800 placeholder-gray-300 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all font-medium"/>
                        </div>

                        <!-- Name + Patronymic -->
                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <label class="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1 px-1">Имя *</label>
                                <input v-model="p.firstName" @input="saveState" type="text" placeholder="Иван"
                                    class="w-full px-4 py-3.5 bg-slate-50 border border-gray-200 rounded-xl text-slate-800 placeholder-gray-300 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all font-medium"/>
                            </div>
                            <div>
                                <label class="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1 px-1">Отчество</label>
                                <input v-model="p.middleName" @input="saveState" type="text" placeholder="Иванович"
                                    class="w-full px-4 py-3.5 bg-slate-50 border border-gray-200 rounded-xl text-slate-800 placeholder-gray-300 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all font-medium"/>
                            </div>
                        </div>

                        <!-- Birth date -->
                        <div>
                            <label class="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1 px-1">Дата рождения *</label>
                            <input v-model="p.birthDate" @change="saveState" type="date"
                                class="w-full px-4 py-3.5 bg-slate-50 border border-gray-200 rounded-xl text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all font-medium"/>
                        </div>

                        <!-- Citizenship -->
                        <div>
                            <label class="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1 px-1">Гражданство *</label>
                            <div class="relative">
                                <select v-model="p.citizenship" @change="saveState"
                                    class="w-full px-4 py-3.5 bg-slate-50 border border-gray-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all font-medium appearance-none cursor-pointer pr-10">
                                    <option v-for="c in countries" :key="c" :value="c">{{ c }}</option>
                                </select>
                                <svg class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                            </div>
                            <!-- Custom citizenship input if "Другое" is selected -->
                            <input v-if="p.citizenship === 'Другое'" v-model="p.customCitizenship" @input="saveState" type="text" placeholder="Введите название страны"
                                class="w-full mt-2 px-4 py-3.5 bg-slate-50 border border-gray-200 rounded-xl text-slate-800 placeholder-gray-300 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all font-medium"/>
                        </div>

                        <!-- Doc type -->
                        <div>
                            <label class="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1 px-1">Тип документа *</label>
                            <div class="relative">
                                <select v-model="p.docType" @change="saveState"
                                    class="w-full px-4 py-3.5 bg-slate-50 border border-gray-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all font-medium appearance-none cursor-pointer pr-10">
                                    <option>Внутренний паспорт</option>
                                    <option>Загран паспорт</option>
                                    <option>Свидетельство о рождении</option>
                                </select>
                                <svg class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                            </div>
                        </div>

                        <!-- Doc number -->
                        <div>
                            <label class="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1 px-1">Серия / Номер документа *</label>
                            <input v-model="p.docNumber" @input="saveState" type="text" placeholder="АА 1234567"
                                class="w-full px-4 py-3.5 bg-slate-50 border border-gray-200 rounded-xl text-slate-800 placeholder-gray-300 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all font-medium tracking-widest"/>
                        </div>
                    </div>
                </div>

                <!-- Contact phone (shared) -->
                <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                    <label class="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1 px-1">Контактный телефон *</label>
                    <div class="relative">
                        <div class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm pointer-events-none">📞</div>
                        <input v-model="phone" @input="saveState" type="tel" placeholder="+ (Код) Номер телефона"
                            class="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-gray-200 rounded-xl text-slate-800 placeholder-gray-300 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all font-medium"/>
                    </div>
                </div>
            </div>

            <!-- ============================================================ -->
            <!-- STEP 3: REVIEW & CONFIRM -->
            <!-- ============================================================ -->
            <div v-if="step === 3" class="px-5 pt-6 pb-6 space-y-4">
                <!-- Ticket summary card -->
                <div class="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-5 text-white shadow-xl shadow-blue-600/25 relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    <div class="text-xs font-bold opacity-60 uppercase tracking-widest mb-3">{{ ticket.transport_company }}</div>
                    <div class="flex items-center justify-between mb-4">
                        <div>
                            <div class="text-3xl font-bold">{{ ticket.departure_time }}</div>
                            <div class="font-semibold opacity-80 mt-0.5">{{ ticket.from_city }}</div>
                            <div class="text-xs opacity-55 mt-0.5">{{ ticket.from_address }}</div>
                        </div>
                        <div class="flex flex-col items-center gap-1 px-2 opacity-60">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                            <div class="text-xs">{{ formattedDuration }}</div>
                        </div>
                        <div class="text-right">
                            <div class="text-3xl font-bold">{{ ticket.arrival_time }}</div>
                            <div class="font-semibold opacity-80 mt-0.5">{{ ticket.to_city }}</div>
                            <div class="text-xs opacity-55 mt-0.5">{{ ticket.to_address }}</div>
                        </div>
                    </div>
                    <div class="border-t border-white/20 pt-3 flex justify-between items-center">
                        <div>
                            <div class="text-xs opacity-60">{{ ticket.departure_date }} · {{ ticket.departure_time }}</div>
                            <div class="text-sm font-bold opacity-90 mt-0.5">Места: {{ [...selectedSeats].sort((a,b)=>a-b).join(', ') }}</div>
                        </div>
                        <div class="text-right">
                            <div class="text-xs opacity-60">ИТОГО</div>
                            <div class="text-2xl font-bold">{{ totalPrice }} <span class="text-base opacity-70">с.</span></div>
                        </div>
                    </div>
                </div>

                <!-- Passengers -->
                <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div class="px-5 py-3 border-b border-gray-50">
                        <h3 class="font-bold text-slate-700 text-sm uppercase tracking-wider">Пассажиры</h3>
                    </div>
                    <div class="divide-y divide-gray-50">
                        <div v-for="(p, i) in passengersData" :key="i" class="px-5 py-4">
                            <div class="flex items-start justify-between gap-3">
                                <div class="flex items-center gap-3">
                                    <div class="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                                        :class="p.gender === 'male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-600'">
                                        {{ p.gender === 'male' ? '♂' : '♀' }}
                                    </div>
                                    <div>
                                        <div class="font-bold text-slate-800 text-sm">{{ p.lastName }} {{ p.firstName }} {{ p.middleName }}</div>
                                        <div class="text-xs text-gray-400 mt-0.5">{{ p.docType }} · {{ p.docNumber }}</div>
                                        <div class="text-xs text-gray-400">Гражданство: {{ p.citizenship === 'Другое' ? p.customCitizenship : p.citizenship }}</div>
                                        <div class="text-xs text-gray-400">Дата рожд.: {{ p.birthDate }}</div>
                                    </div>
                                </div>
                                <span class="text-xs bg-blue-100 text-blue-700 font-bold px-2.5 py-1.5 rounded-xl shrink-0">
                                    № {{ [...selectedSeats].sort((a,b)=>a-b)[i] }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Phone -->
                <div class="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-4 flex items-center justify-between">
                    <div class="text-sm text-gray-500 font-medium">📞 Контактный телефон</div>
                    <div class="font-bold text-slate-800">{{ phone }}</div>
                </div>

                <!-- Disclaimer -->
                <p class="text-center text-xs text-gray-400 px-4">
                    Нажимая «Подтвердить и оплатить», вы соглашаетесь с правилами перевозки и политикой возврата.
                </p>
            </div>

            <!-- ============================================================ -->
            <!-- STICKY FOOTER CTA -->
            <!-- ============================================================ -->
            <div class="bg-white/95 backdrop-blur-xl border-t border-gray-100 px-5 py-4 z-40 mt-auto">
                <!-- Step 1 button -->
                <button v-if="step === 1"
                    @click="goToStep2"
                    :disabled="!canProceedStep1"
                    class="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-95"
                    :class="canProceedStep1
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'">
                    Продолжить → Данные пассажиров
                </button>

                <!-- Step 2 button -->
                <button v-if="step === 2"
                    @click="goToStep3"
                    :disabled="!canProceedStep2"
                    class="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-95"
                    :class="canProceedStep2
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'">
                    Продолжить → Проверить заказ
                </button>

                <!-- Step 3 button -->
                <button v-if="step === 3"
                    @click="confirmBooking"
                    :disabled="bookingLoading"
                    class="w-full py-4 rounded-2xl font-bold text-base bg-green-600 text-white shadow-lg shadow-green-600/30 transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-3">
                    <span v-if="bookingLoading" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>{{ bookingLoading ? 'Оформляем...' : '✓ Подтвердить и оплатить' }}</span>
                </button>
            </div>
        </template>

        <AppModal
            :show="modal.show" :title="modal.title" :message="modal.message"
            :type="modal.type" :confirmText="modal.confirmText" :showCancel="modal.showCancel"
            @confirm="modal.onConfirm" @cancel="modal.show = false" @close="modal.show = false"
        />
    </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: all 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
