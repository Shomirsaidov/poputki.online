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
            const premiumSeatNums = this.ticket.premiumSeats || [];
            const premiumPrice = this.ticket.premium_price || this.ticket.price;
            let total = 0;
            for (const seatNum of this.selectedSeats) {
                total += premiumSeatNums.includes(seatNum) ? premiumPrice : this.ticket.price;
            }
            // If no seats selected yet, show estimate for regular price
            if (this.selectedSeats.length === 0) {
                return this.ticket.price * this.passengerCount;
            }
            return total;
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

            <!-- ANIMATED STEPS CONTAINER -->
            <Transition name="fade-slide" mode="out-in">
                <div :key="step">
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
                                <div class="text-xs text-gray-400 font-medium">Сумма (1 пасс)</div>
                                <div class="font-bold text-blue-600 text-lg">{{ ticket.price }} с.</div>
                                <div v-if="ticket.premium_price && ticket.bus_type === 'double'" class="text-xs text-amber-500 font-bold">★ {{ ticket.premium_price }} с.</div>
                                <div class="text-xs text-gray-400">{{ availableSeats }} из {{ ticket.total_seats }} мест</div>
                            </div>
                        </div>

                        <!-- Passenger count selector -->
                        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 transition-all hover:border-blue-100">
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
                                :floor1Seats="ticket.floor1_seats || 20"
                                :floor2Seats="ticket.floor2_seats || 56"
                                :maxSelectable="passengerCount"
                                :busType="ticket.bus_type"
                                :premiumSeats="ticket.premiumSeats || []"
                                :premiumPrice="ticket.premium_price || 0"
                                :regularPrice="ticket.price || 0"
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
                    <div v-if="step === 3" class="px-5 pt-7 pb-10 space-y-6">
                        <!-- Ticket Preview (Minimalist Perforated Design) -->
                        <div class="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border border-gray-100 overflow-hidden relative">
                            <!-- Ticket Header / Top Part -->
                            <div class="px-7 py-6 border-b-2 border-dashed border-gray-100 relative">
                                <div class="flex items-center justify-between mb-6">
                                    <div class="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100/50">
                                        {{ ticket.transport_company }}
                                    </div>
                                    <div class="flex items-center gap-1.5">
                                        <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Проверка данных</span>
                                    </div>
                                </div>

                                <div class="flex items-center justify-between">
                                    <div class="flex-1">
                                        <div class="text-3xl font-black text-slate-800 tracking-tight leading-none mb-2">{{ ticket.departure_time }}</div>
                                        <div class="text-sm font-bold text-slate-600 truncate">{{ ticket.from_city }}</div>
                                        <div class="text-[10px] text-gray-400 mt-0.5 truncate max-w-[120px]">{{ ticket.from_address }}</div>
                                    </div>

                                    <div class="flex flex-col items-center gap-1.5 px-4 shrink-0 -mt-2">
                                        <div class="text-[9px] font-black text-slate-400 uppercase tracking-widest">{{ formattedDuration }}</div>
                                        <div class="flex items-center gap-1 w-16 relative">
                                            <div class="flex-1 border-t-2 border-gray-100"></div>
                                            <svg class="h-3 w-3 text-blue-500 absolute left-1/2 -translate-x-1/2 -top-1.5 bg-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 7l5 5-5 5M6 7l5 5-5 5"/>
                                            </svg>
                                        </div>
                                    </div>

                                    <div class="flex-1 text-right">
                                        <div class="text-3xl font-black text-slate-800 tracking-tight leading-none mb-2">{{ ticket.arrival_time }}</div>
                                        <div class="text-sm font-bold text-slate-600 truncate">{{ ticket.to_city }}</div>
                                        <div class="text-[10px] text-gray-400 mt-0.5 truncate max-w-[120px] ml-auto">{{ ticket.to_address }}</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Perforated Line -->
                            <div class="relative w-full h-1 flex items-center bg-white overflow-visible">
                                <div class="absolute -left-3 w-6 h-6 rounded-full bg-slate-50 border border-gray-100 z-10 shadow-inner"></div>
                                <div class="absolute -right-3 w-6 h-6 rounded-full bg-slate-50 border border-gray-100 z-10 shadow-inner"></div>
                            </div>

                            <!-- Ticket Bottom / Details -->
                            <div class="px-7 py-6 space-y-5 bg-white font-medium">
                                <div class="grid grid-cols-2 gap-x-8 gap-y-5">
                                    <div>
                                        <div class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">Пассажиры</div>
                                        <div class="font-bold text-slate-800 text-sm flex items-center gap-2">
                                            <svg class="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                                            {{ passengerCount }} человек(а)
                                        </div>
                                    </div>
                                    <div>
                                        <div class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5 text-right">Дата рейса</div>
                                        <div class="font-bold text-slate-800 text-sm text-right">{{ formatDate(ticket.departure_date) }}</div>
                                    </div>
                                    <div>
                                        <div class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">Места</div>
                                        <div class="flex gap-1 flex-wrap">
                                            <span v-for="seat in selectedSeats" :key="seat" class="px-2 py-0.5 text-[11px] font-black rounded-md border"
                                                :class="(ticket.premiumSeats || []).includes(seat) ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-blue-50 text-blue-600 border-blue-100'">
                                                №{{ seat }}<span v-if="(ticket.premiumSeats || []).includes(seat)" class="ml-0.5">★</span>
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <div class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5 text-right">К оплате</div>
                                        <div class="font-black text-slate-900 text-xl text-right leading-none">{{ totalPrice }} с.</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Ticket Code -->
                            <div class="px-7 pb-7 pt-2 flex items-center justify-between border-t border-gray-50 bg-slate-50/30">
                                <div>
                                    <div class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Предпросмотр</div>
                                    <div class="text-xs font-mono font-bold text-slate-400">
                                        TK-PREVIEW-{{ Math.floor(Math.random() * 900) + 100 }}
                                    </div>
                                </div>
                                <div class="flex items-center h-8 gap-[2px] opacity-20">
                                    <div v-for="n in [1.5,1,2,1,0.5,3,1,0.5,2,1,2]" :key="n" class="h-full bg-slate-800" :style="{ width: n + 'px' }"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Phone -->
                        <div class="bg-white rounded-2xl px-6 py-4 flex items-center justify-between border border-gray-100 shadow-sm">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                                   <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h2.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                                </div>
                                <span class="text-xs text-gray-500 font-bold">Телефон для связи</span>
                            </div>
                            <div class="font-bold text-slate-800 text-sm">{{ phone }}</div>
                        </div>

                        <!-- Passengers List -->
                        <div class="space-y-3">
                            <h3 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Список пассажиров</h3>
                            <div v-for="(p, i) in passengersData" :key="i"
                                class="bg-white rounded-2xl px-6 py-4 border border-gray-100 shadow-sm flex items-center gap-4">
                                <div class="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 shadow-inner"
                                    :class="p.gender === 'male' ? 'bg-blue-50 text-blue-500' : 'bg-pink-50 text-pink-500'">
                                    {{ p.firstName[0] }}
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="font-bold text-slate-800 text-sm truncate uppercase tracking-tight">{{ p.lastName }} {{ p.firstName }}</div>
                                    <div class="text-[10px] text-gray-400 mt-0.5 truncate">{{ p.docType }} · {{ p.docNumber }}</div>
                                </div>
                                <div class="text-right shrink-0">
                                    <div class="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1">Место</div>
                                    <div class="text-sm font-black text-slate-900">№ {{ [...selectedSeats].sort((a,b)=>a-b)[i] }}</div>
                                </div>
                            </div>
                        </div>

                        <!-- Footer disclaimer -->
                        <div class="pt-4 px-6 text-center">
                            <p class="text-[11px] text-gray-400 leading-relaxed max-w-[280px] mx-auto">
                                Проверьте правильность введенных данных. Ошибка в данных может быть причиной отказа в посадке.
                            </p>
                        </div>
                    </div>
                </div>
            </Transition>

            <!-- Sticky Footer CTA -->
            <div class="bg-white/95 backdrop-blur-xl border-t border-gray-100 px-5 py-4 z-40 mt-auto sticky bottom-0">
                <button v-if="step === 1"
                    @click="goToStep2"
                    :disabled="!canProceedStep1"
                    class="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-95 border-b-2"
                    :class="canProceedStep1
                        ? 'bg-slate-900 text-white border-slate-700 shadow-lg shadow-slate-200'
                        : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'">
                    Продолжить → Данные
                </button>

                <button v-if="step === 2"
                    @click="goToStep3"
                    :disabled="!canProceedStep2"
                    class="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-95 border-b-2"
                    :class="canProceedStep2
                        ? 'bg-slate-900 text-white border-slate-700 shadow-lg shadow-slate-200'
                        : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'">
                    Проверить заказ →
                </button>

                <button v-if="step === 3"
                    @click="confirmBooking"
                    :disabled="bookingLoading"
                    class="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-95 border-b-2 flex items-center justify-center gap-3"
                    :class="bookingLoading ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-blue-600 text-white border-blue-800 shadow-lg shadow-blue-200'">
                    <span v-if="bookingLoading" class="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></span>
                    <span class="tracking-tight">{{ bookingLoading ? 'Оформляем...' : 'Оплатить и получить билет' }}</span>
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
.fade-enter-active, .fade-leave-active { transition: all 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-4px); }

.fade-slide-enter-active, .fade-slide-leave-active {
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-slide-enter-from {
    opacity: 0;
    transform: translateX(10px);
}
.fade-slide-leave-to {
    opacity: 0;
    transform: translateX(-10px);
}
</style>
