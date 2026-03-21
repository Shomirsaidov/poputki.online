<script>
import api from '../api';
import AppLogo from '../components/AppLogo.vue';

export default {
    components: {
        AppLogo
    },
    data() {
        return {
            isAuthenticated: false,
            phone: '',
            password: '',
            user: null,
            activeTab: 'tickets', // 'tickets', 'create', 'bookings'
            loading: false,
            tickets: [],
            bookings: [],
            cities: [],
            busForm: {
                transport_company: '',
                from_city: '',
                from_address: '',
                to_city: '',
                to_address: '',
                departure_date: '',
                departure_time: '',
                arrival_date: '',
                arrival_time: '',
                duration_minutes: '',
                price: '',
                premium_price: '',
                total_seats: 53,
                floor1_seats: 20,
                floor2_seats: 56,
                bus_type: 'single',
                passenger_comments: '',
                intermediate_stops: []
            },
            busErrors: {},
            mobileMenuOpen: false,
            navItems: [
                { id: 'tickets', label: 'Мои рейсы' },
                { id: 'create', label: 'Создать рейс' },
                { id: 'create-booking', label: 'Создать бронь' },
                { id: 'bookings', label: 'Бронирования' }
            ],
            bookingSearch: '',
            isEditingTicket: false,
            editingTicketId: null,
            bookingForm: {
                bus_ticket_id: '',
                passenger_name: '', // For manual entry
                phone: '',
                passenger_count: 1,
                seat_numbers: [],
                passengers_data: [
                    { lastName: '', firstName: '', middleName: '', gender: 'male', docType: 'Паспорт РТ', docNumber: '', birthDate: '', citizenship: 'Таджикистан' }
                ]
            }
        }
    },
    methods: {
        async handleLogin() {
            if (!this.phone || !this.password) {
                alert('Введите телефон и пароль');
                return;
            }
            this.loading = true;
            try {
                const res = await api.post('/auth/bus-login', { phone: this.phone, password: this.password });
                this.user = res.data.user;
                this.isAuthenticated = true;
                this.fetchData();
            } catch (e) {
                alert(e.response?.data?.error || 'Ошибка входа');
            } finally {
                this.loading = false;
            }
        },
        async fetchData() {
            if (!this.user) return;
            this.fetchCities();
            if (this.activeTab === 'tickets') {
                this.fetchTickets();
            } else if (this.activeTab === 'bookings') {
                this.fetchBookings();
            }
        },
        async fetchCities() {
            if (this.cities.length > 0) return;
            try {
                const res = await api.get('/general/cities', { params: { type: 'bus' } });
                this.cities = res.data;
            } catch (e) { console.error('Error fetching cities', e); }
        },
        async fetchTickets() {
            this.loading = true;
            try {
                const res = await api.get(`/bus-admin/tickets?operator_id=${this.user.id}`);
                this.tickets = res.data;
            } catch (e) { console.error(e); } finally { this.loading = false; }
        },
        async fetchBookings() {
            this.loading = true;
            try {
                const res = await api.get(`/bus-admin/bookings?operator_id=${this.user.id}`);
                this.bookings = res.data;
            } catch (e) { console.error(e); } finally { this.loading = false; }
        },
        logout() {
            this.isAuthenticated = false;
            this.user = null;
            this.phone = '';
            this.password = '';
            this.tickets = [];
            this.bookings = [];
        },
        // Bus Creation logic borrowed from AdminView.vue
        addStop() {
            this.busForm.intermediate_stops.push({ city: '', time: '', address: '' });
        },
        removeStop(index) {
            this.busForm.intermediate_stops.splice(index, 1);
        },
        validateBusForm() {
            const e = {};
            if (!this.busForm.transport_company.trim()) e.transport_company = 'Укажите компанию';
            if (!this.busForm.from_city) e.from_city = 'Укажите город отправления';
            if (!this.busForm.from_address.trim()) e.from_address = 'Укажите место отправления';
            if (!this.busForm.to_city) e.to_city = 'Укажите город прибытия';
            if (!this.busForm.to_address.trim()) e.to_address = 'Укажите место прибытия';
            if (!this.busForm.departure_date) e.departure_date = 'Укажите дату отправления';
            if (!this.busForm.departure_time) e.departure_time = 'Укажите время отправления';
            if (!this.busForm.arrival_date) e.arrival_date = 'Укажите дату прибытия';
            if (!this.busForm.arrival_time) e.arrival_time = 'Укажите время прибытия';
            if (!this.busForm.duration_minutes || this.busForm.duration_minutes <= 0) e.duration_minutes = 'Укажите длительность';
            if (!this.busForm.price || this.busForm.price <= 0) e.price = 'Укажите цену';
            if (this.busForm.bus_type === 'double') {
                if (!this.busForm.floor1_seats || this.busForm.floor1_seats < 1) e.floor1_seats = 'Укажите кол-во мест 1 этажа';
                if (!this.busForm.floor2_seats || this.busForm.floor2_seats < 1) e.floor2_seats = 'Укажите кол-во мест 2 этажа';
            } else {
                if (!this.busForm.total_seats || this.busForm.total_seats < 1) e.total_seats = 'Укажите количество мест';
            }
            this.busErrors = e;
            return Object.keys(e).length === 0;
        },
        async submitBusTicket() {
            if (!this.validateBusForm()) {
                alert('Пожалуйста, заполните все обязательные поля');
                return;
            }
            this.loading = true;
            try {
                const submitData = {
                    ...this.busForm,
                    operator_id: this.user.id,
                    duration_minutes: Number(this.busForm.duration_minutes),
                    price: Number(this.busForm.price),
                    premium_price: this.busForm.premium_price ? Number(this.busForm.premium_price) : null
                };
                if (this.busForm.bus_type === 'double') {
                    submitData.floor1_seats = Number(this.busForm.floor1_seats);
                    submitData.floor2_seats = Number(this.busForm.floor2_seats);
                    submitData.total_seats = submitData.floor1_seats + submitData.floor2_seats;
                } else {
                    submitData.total_seats = Number(this.busForm.total_seats);
                    submitData.floor1_seats = null;
                    submitData.floor2_seats = null;
                    submitData.premium_price = null;
                }
                await api.post('/bus-tickets', submitData);
                alert('Рейс успешно создан!');
                
                // Reset form
                this.busForm = {
                    transport_company: '', from_city: '', from_address: '',
                    to_city: '', to_address: '', departure_date: '',
                    departure_time: '', arrival_date: '', arrival_time: '',
                    duration_minutes: '', price: '', premium_price: '', total_seats: 53,
                    floor1_seats: 20, floor2_seats: 56,
                    bus_type: 'single', passenger_comments: '',
                    intermediate_stops: []
                };
                
                this.activeTab = 'tickets';
            } catch (e) {
                alert(e.response?.data?.error || 'Ошибка при создании');
            } finally {
                this.loading = false;
            }
        },
        async deleteTicket(id) {
            if (!confirm('Удалить этот рейс?')) return;
            try {
                await api.delete(`/bus-admin/tickets/${id}`);
                this.fetchTickets();
            } catch (e) { alert('Ошибка при удалении'); }
        },
        editTicket(ticket) {
            this.isEditingTicket = true;
            this.editingTicketId = ticket.id;
            this.busForm = { 
                ...ticket,
                intermediate_stops: ticket.intermediate_stops || []
            };
            this.activeTab = 'create';
        },
        async updateBusTicket() {
            if (!this.validateBusForm()) return;
            this.loading = true;
            try {
                const updateData = {
                    ...this.busForm,
                    duration_minutes: Number(this.busForm.duration_minutes),
                    price: Number(this.busForm.price),
                    premium_price: this.busForm.premium_price ? Number(this.busForm.premium_price) : null
                };
                if (this.busForm.bus_type === 'double') {
                    updateData.floor1_seats = Number(this.busForm.floor1_seats);
                    updateData.floor2_seats = Number(this.busForm.floor2_seats);
                    updateData.total_seats = updateData.floor1_seats + updateData.floor2_seats;
                } else {
                    updateData.total_seats = Number(this.busForm.total_seats);
                    updateData.floor1_seats = null;
                    updateData.floor2_seats = null;
                    updateData.premium_price = null;
                }
                await api.put(`/bus-admin/tickets/${this.editingTicketId}`, updateData);
                alert('Рейс успешно обновлен!');
                this.isEditingTicket = false;
                this.editingTicketId = null;
                this.activeTab = 'tickets';
            } catch (e) { alert('Ошибка при обновлении'); } finally { this.loading = false; }
        },
        initBooking(ticketId) {
            this.bookingForm.bus_ticket_id = ticketId;
            this.activeTab = 'create-booking';
        },
        addPassenger() {
            this.bookingForm.passengers_data.push({ lastName: '', firstName: '', middleName: '', gender: 'male', docType: 'Паспорт РТ', docNumber: '', birthDate: '', citizenship: 'Таджикистан' });
            this.bookingForm.passenger_count++;
        },
        removePassenger(index) {
            this.bookingForm.passengers_data.splice(index, 1);
            this.bookingForm.passenger_count--;
        },
        async submitManualBooking() {
            const f = this.bookingForm;
            if (!f.bus_ticket_id || !f.passenger_name || !f.phone) {
                alert('Заполните основные данные (Рейс, ФИО, Телефон)');
                return;
            }
            this.loading = true;
            try {
                // Determine seat numbers if not manually provided
                const ticket = this.tickets.find(t => t.id === f.bus_ticket_id);
                if (!ticket) throw new Error('Рейс не найден');
                
                const reserved = ticket.reserved_seats || [];
                const needed = f.passenger_count;
                const available = [];
                for (let i = 1; i <= ticket.total_seats; i++) {
                    if (!reserved.includes(i)) available.push(i);
                    if (available.length === needed) break;
                }
                
                if (available.length < needed) {
                    alert('Нет свободных мест');
                    return;
                }

                await api.post('/bus-admin/bookings/manual', {
                    bus_ticket_id: f.bus_ticket_id,
                    operator_id: this.user.id,
                    passenger_name: f.passenger_name,
                    seat_numbers: available,
                    passengers_data: f.passengers_data,
                    phone: f.phone
                });

                alert('Бронь успешно создана!');
                // Reset
                this.bookingForm = {
                    bus_ticket_id: '', passenger_name: '', phone: '',
                    passenger_count: 1, seat_numbers: [],
                    passengers_data: [{ lastName: '', firstName: '', middleName: '', docType: 'Паспорт РТ', docNumber: '', birthDate: '', citizenship: 'Таджикистан' }]
                };
                this.activeTab = 'bookings';
            } catch (e) {
                alert(e.response?.data?.error || 'Ошибка при бронировании');
            } finally { this.loading = false; }
        }
    },
    computed: {
        filteredBookings() {
            // Return bookings without flattening. We add some context properties for display.
            const enhanced = this.bookings.map(b => {
                return {
                    ...b,
                    ticket_context: b.ticket_context || '',
                };
            });

            if (!this.bookingSearch) return enhanced;
            const s = this.bookingSearch.toLowerCase();
            return enhanced.filter(b => {
                // Search by main contact name or phone
                if ((b.passenger_name || '').toLowerCase().includes(s)) return true;
                if ((b.passenger_phone || '').toLowerCase().includes(s)) return true;
                
                // Search by nested passenger data
                const pData = b.passengers_data || [];
                for (const p of pData) {
                    const fullName = `${p.lastName || ''} ${p.firstName || ''} ${p.middleName || ''}`.toLowerCase();
                    const docInfo = `${p.docType || ''} ${p.docNumber || ''}`.toLowerCase();
                    if (fullName.includes(s) || docInfo.includes(s)) return true;
                }
                
                return false;
            });
        }
    },
    watch: {
        activeTab() {
            this.fetchData();
        }
    }
}
</script>

<template>
     <div class="h-screen bg-slate-50 text-slate-800 flex overflow-hidden font-sans">
        
        <!-- Auth Overlay -->
        <div v-if="!isAuthenticated" class="fixed inset-0 z-[100] bg-slate-50 flex items-center justify-center p-4 sm:p-6">
            <div class="max-w-md w-full bg-white p-6 sm:p-8 rounded-[32px] border border-slate-100 shadow-2xl text-center">
                <AppLogo 
                    :showText="false" 
                    containerClass="mx-auto mb-6"
                    iconSizeClass="w-20 h-20"
                    iconClass="h-10 w-10"
                    iconBgClass="bg-amber-100 text-amber-500"
                />
                <h1 class="text-3xl font-bold mb-2 text-slate-900">Кабинет Перевозчика</h1>
                <p class="text-slate-500 mb-8">Введите телефон и пароль для входа</p>
                <input 
                    v-model="phone" 
                    type="tel" 
                    placeholder="Номер телефона"
                    class="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-center text-lg focus:border-amber-500 text-slate-900 outline-none transition-all mb-4"
                />
                <input 
                    v-model="password" 
                    type="password" 
                    placeholder="Пароль"
                    class="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-center text-lg focus:border-amber-500 text-slate-900 outline-none transition-all mb-6"
                    @keyup.enter="handleLogin"
                />
                <button 
                    @click="handleLogin"
                    :disabled="loading"
                    class="w-full flex justify-center items-center bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                    <span v-if="loading" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                    Войти
                </button>
            </div>
        </div>

        <template v-else>
            <!-- Mobile Header -->
            <div class="lg:hidden fixed top-0 inset-x-0 z-40 bg-white border-b border-slate-100 p-4 flex justify-between items-center shadow-sm">
                <div class="flex items-center space-x-3">
                <AppLogo 
                    :showText="false" 
                    iconSizeClass="w-8 h-8"
                    iconClass="h-5 w-5"
                    iconBgClass="bg-amber-500 text-white"
                />
                    <span class="text-lg font-bold tracking-tight text-slate-900">Перевозчик</span>
                </div>
                <button @click="mobileMenuOpen = !mobileMenuOpen" class="text-slate-400 p-2">
                    <svg v-if="!mobileMenuOpen" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <!-- Sidebar -->
            <aside 
                class="lg:w-72 bg-white border-r border-slate-100 flex flex-col pt-8 fixed lg:relative inset-y-0 left-0 z-30 transition-transform transform lg:translate-x-0 w-64 shadow-sm"
                :class="mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'"
            >
                <div class="px-8 mb-12">
                    <div class="flex items-center space-x-3">
                    <AppLogo 
                        :showText="false" 
                        iconSizeClass="w-10 h-10"
                        iconClass="h-6 w-6"
                        iconBgClass="bg-amber-500 text-white"
                    />
                        <div>
                            <span class="text-xl font-bold tracking-tight block text-slate-900">{{ user?.name }}</span>
                            <span class="text-xs text-slate-400">Перевозчик</span>
                        </div>
                    </div>
                </div>
<br>                <nav class="flex-1 px-4 space-y-2 overflow-y-auto">
                    <button 
                        v-for="item in navItems" 
                        :key="item.id"
                        @click="activeTab = item.id; mobileMenuOpen = false; if(item.id !== 'create') { isEditingTicket = false; editingTicketId = null; }"
                        class="w-full px-4 py-3 rounded-xl flex items-center space-x-3 transition-all group"
                        :class="activeTab === item.id ? 'bg-amber-50 text-amber-600 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'"
                    >
                        <span class="capitalize font-medium">{{ item.label }}</span>
                    </button>
                </nav>

                <div class="p-6 border-t border-slate-100">
                    <button @click="logout" class="text-sm font-bold text-slate-400 hover:text-red-500 transition-colors w-full text-left flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        <span>Выйти из аккаунта</span>
                    </button>
                </div>
            </aside>

            <!-- Main Content -->
            <main class="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-10 pt-20 lg:pt-10 w-full overflow-x-hidden">
                
                <!-- Tickets List -->
                <section v-if="activeTab === 'tickets'" class="space-y-6 lg:space-y-8">
                    <h2 class="text-2xl lg:text-3xl font-bold text-slate-900">Мои рейсы</h2>
                    <div v-if="loading" class="text-slate-400">Загрузка...</div>
                    <div v-else-if="tickets.length === 0" class="bg-white p-8 rounded-[32px] border border-slate-100 text-center text-slate-400 shadow-sm">
                        У вас пока нет созданных рейсов.
                    </div>
                    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div v-for="ticket in tickets" :key="ticket.id" class="bg-white rounded-3xl border border-slate-100 p-6 lg:p-8 flex flex-col justify-between shadow-sm overflow-hidden relative group transition-all hover:shadow-md">
                            <div class="absolute right-0 top-0 w-32 h-32 bg-amber-50 rounded-bl-[100px] -z-0 opacity-50"></div>
                            

                            <div class="relative z-10">
                                <div class="flex justify-between items-start mb-6">
                                    <div class="flex space-x-3 items-center">
                                        <div class="bg-amber-100 p-3 rounded-2xl">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        </div>
                                        <div>
                                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Отправление</p>
                                            <p class="font-bold text-lg leading-tight text-slate-800">{{ ticket.departure_date }} в {{ ticket.departure_time }}</p>
                                        </div>
                                    </div>
                                    <div class="bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100">
                                        <span class="text-emerald-600 font-bold text-sm">{{ ticket.price }} с.</span>
                                    </div>
                                </div>
    
                                <div class="flex items-center justify-between mb-8 relative">
                                    <div class="absolute top-[40%] left-10 right-10 h-0.5 bg-slate-100 -translate-y-1/2 rounded-full hidden sm:block"></div>
                                    <div class="z-10 bg-white pr-4">
                                        <h3 class="text-xl md:text-2xl font-black text-slate-900">{{ ticket.from_city }}</h3>
                                        <p class="text-xs text-slate-400 truncate max-w-[120px] md:max-w-xs mt-1">{{ ticket.from_address }}</p>
                                    </div>
                                    <div class="z-10 bg-white px-2 hidden sm:flex items-center justify-center text-amber-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                                    </div>
                                    <div class="z-10 bg-white pl-4 text-right">
                                        <h3 class="text-xl md:text-2xl font-black text-slate-900">{{ ticket.to_city }}</h3>
                                        <p class="text-xs text-slate-400 truncate max-w-[120px] md:max-w-xs mt-1">{{ ticket.to_address }}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="flex justify-between items-center pt-6 border-t border-slate-50 mt-auto">
                                <div class="flex items-center space-x-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                    <span class="text-sm font-bold text-slate-400">
                                        <span class="text-slate-900">{{ ticket.total_seats - ticket.reserved_seats.length }}</span> 
                                        / {{ ticket.total_seats }} свободно
                                    </span>
                                </div>
                                <div class="flex items-center space-x-3">
                                     <span class="hidden sm:inline-block text-[10px] font-bold px-3 py-1 bg-slate-50 rounded-lg text-slate-400 border border-slate-100 uppercase tracking-widest">{{ ticket.transport_company }}</span>
                                    <button @click="initBooking(ticket.id)" class="px-6 py-2.5 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 text-sm">
                                        Забронировать
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Bookings section -->
                <section v-if="activeTab === 'bookings'" class="space-y-6 lg:space-y-8">
                     <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                         <h2 class="text-2xl lg:text-3xl font-bold text-slate-900">Бронирования</h2>
                         <div class="relative w-full sm:w-64">
                             <input v-model="bookingSearch" placeholder="Поиск по имени..." class="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-amber-500 text-slate-900 shadow-sm" />
                             <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                         </div>
                     </div>

                     <div v-if="loading" class="text-slate-400">Загрузка...</div>
                     <div v-else-if="filteredBookings.length === 0" class="bg-white p-8 rounded-[32px] border border-slate-100 text-center text-slate-400 shadow-sm">
                        Бронирований не найдено.
                    </div>
                    <div v-else class="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
                        <div class="overflow-x-auto">
                            <table class="w-full text-left border-collapse">
                                <thead>
                                    <tr class="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-100">
                                        <th class="px-6 py-4">Рейс / Контакт</th>
                                        <th class="px-6 py-4">ДЕТАЛИ ПАССАЖИРОВ</th>
                                        <th class="px-6 py-4">Оплата</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-50">
                                    <tr v-for="b in filteredBookings" :key="b.id" class="hover:bg-slate-50/50 transition-colors">
                                        <td class="px-6 py-4 align-top w-1/4">
                                            <div class="font-bold text-slate-900 text-sm mb-1">{{ b.passenger_name || 'Неизвестный' }}</div>
                                            <div class="text-[10px] font-medium text-slate-400 mb-1 leading-snug break-words">{{ b.ticket_context }}</div>
                                            <div class="text-[10px] font-mono text-amber-600">{{ b.passenger_phone }}</div>
                                        </td>
                                        <td class="px-6 py-4">
                                            <div class="space-y-3">
                                                <div v-for="(p, idx) in b.passengers_data || []" :key="idx" class="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col gap-2 relative shadow-sm">
                                                    <div class="absolute top-3 right-3 text-[10px] font-bold text-amber-600 px-2.5 py-1 bg-amber-50 rounded-lg border border-amber-100/50">
                                                        Место: {{ (b.seat_numbers && b.seat_numbers[idx]) ? b.seat_numbers[idx] : '—' }}
                                                    </div>
                                                    <div class="font-bold text-slate-900 text-sm pr-16 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                                        <span class="text-slate-400 font-medium text-xs mr-2">{{ idx + 1 }}.</span>
                                                        {{ p.lastName }} {{ p.firstName }} {{ p.middleName }}
                                                    </div>
                                                    <div class="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] text-slate-500 mt-1 px-1">
                                                        <div class="flex items-center gap-1.5">
                                                            <div class="w-4 text-slate-400 text-center">👁️</div>
                                                            Пол: <span class="text-slate-700 font-medium">{{ p.gender === 'male' ? 'Мужской' : (p.gender === 'female' ? 'Женский' : '—') }}</span>
                                                        </div>
                                                        <div class="flex items-center gap-1.5">
                                                            <div class="w-4 text-slate-400 text-center">📅</div>
                                                            ДР: <span class="text-slate-700 font-medium">{{ p.birthDate || '—' }}</span>
                                                        </div>
                                                        <div class="col-span-2 flex flex-wrap items-center gap-1.5">
                                                            <div class="w-4 text-slate-400 text-center">📄</div>
                                                            Документ: <span class="text-slate-700 font-medium">{{ p.docType || '—' }} {{ p.docNumber || '—' }}</span>
                                                            <span class="ml-auto text-slate-400 text-[9px] uppercase tracking-wider font-bold">{{ p.citizenship || '—' }}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <!-- Fallback if no detailed passenger data is present -->
                                                <div v-if="!b.passengers_data || b.passengers_data.length === 0" class="text-xs text-slate-500 italic p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                                    Детальные данные отсутствуют. Места: <span class="text-amber-600 font-bold">{{ (b.seat_numbers || []).join(', ') }}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 align-top w-[120px]">
                                            <span class="text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg border"
                                                :class="b.total_price === 0 ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'">
                                                {{ b.total_price === 0 ? 'Ручная' : 'Оплачено' }}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
                <!-- Create Booking Section -->
                <section v-if="activeTab === 'create-booking'" class="space-y-6 lg:space-y-8">
                    <h2 class="text-2xl lg:text-3xl font-bold text-slate-900">Создать бронирование вручную</h2>

                    <div class="bg-white rounded-[32px] border border-slate-100 p-6 lg:p-8 shadow-sm space-y-6">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="space-y-2">
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Выберите рейс</label>
                                <select v-model="bookingForm.bus_ticket_id" class="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 outline-none focus:border-amber-500 appearance-none cursor-pointer">
                                    <option value="" disabled>Рейс не выбран</option>
                                    <option v-for="t in tickets" :key="'book-t-'+t.id" :value="t.id">
                                        {{ t.from_city }} -> {{ t.to_city }} ({{ t.departure_date }} {{ t.departure_time }})
                                    </option>
                                </select>
                            </div>
                            <div class="space-y-2">
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Имя основного контакта</label>
                                <input v-model="bookingForm.passenger_name" placeholder="Имя Фамилия" class="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 outline-none focus:border-amber-500 shadow-inner" />
                            </div>
                            <div class="space-y-2">
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Телефон</label>
                                <input v-model="bookingForm.phone" placeholder="+992..." class="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 outline-none focus:border-amber-500 shadow-inner" />
                            </div>
                        </div>

                        <div class="space-y-4 pt-6 border-t border-slate-50">
                            <div class="flex justify-between items-center">
                                <h3 class="text-sm font-bold text-slate-700">Данные пассажиров ({{ bookingForm.passenger_count }})</h3>
                                <button @click="addPassenger" class="text-xs font-bold text-amber-500 hover:text-amber-600 px-4 py-2 bg-amber-50 rounded-xl transition-all border border-amber-100">+ Добавить</button>
                            </div>
                            <div v-for="(p, idx) in bookingForm.passengers_data" :key="idx" class="bg-slate-50 p-6 rounded-[24px] border border-slate-100 relative shadow-inner">
                                <button v-if="idx > 0" @click="removePassenger(idx)" class="absolute top-4 right-4 text-red-400 hover:text-red-500 p-2 bg-white rounded-xl shadow-sm border border-slate-100 transition-all">
                                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                                </button>
                                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div class="space-y-1">
                                        <label class="text-[9px] text-slate-400 font-bold uppercase ml-1">Фамилия</label>
                                        <input v-model="p.lastName" placeholder="Иванов" class="w-full bg-white border border-slate-100 rounded-xl p-3 text-sm text-slate-900 outline-none focus:border-amber-500 shadow-sm" />
                                    </div>
                                    <div class="space-y-1">
                                        <label class="text-[9px] text-slate-400 font-bold uppercase ml-1">Имя</label>
                                        <input v-model="p.firstName" placeholder="Иван" class="w-full bg-white border border-slate-100 rounded-xl p-3 text-sm text-slate-900 outline-none focus:border-amber-500 shadow-sm" />
                                    </div>
                                    <div class="space-y-1">
                                        <label class="text-[9px] text-slate-400 font-bold uppercase ml-1">Отчество</label>
                                        <input v-model="p.middleName" placeholder="Иванович" class="w-full bg-white border border-slate-100 rounded-xl p-3 text-sm text-slate-900 outline-none focus:border-amber-500 shadow-sm" />
                                    </div>
                                    <div class="space-y-1">
                                        <label class="text-[9px] text-slate-400 font-bold uppercase ml-1">Пол</label>
                                        <select v-model="p.gender" class="w-full bg-white border border-slate-100 rounded-xl p-3 text-sm text-slate-900 outline-none appearance-none cursor-pointer shadow-sm">
                                            <option value="" disabled>Выберите пол</option>
                                            <option value="male">Мужской</option>
                                            <option value="female">Женский</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                                    <div class="space-y-1">
                                        <label class="text-[9px] text-slate-400 font-bold uppercase ml-1">Тип документа</label>
                                        <select v-model="p.docType" class="w-full bg-white border border-slate-100 rounded-xl p-3 text-sm text-slate-900 outline-none shadow-sm">
                                            <option>Паспорт РТ</option>
                                            <option>Загранпаспорт</option>
                                            <option>Свид. о рождении</option>
                                        </select>
                                    </div>
                                    <div class="space-y-1">
                                        <label class="text-[9px] text-slate-400 font-bold uppercase ml-1">Номер документа</label>
                                        <input v-model="p.docNumber" placeholder="A0000000" class="w-full bg-white border border-slate-100 rounded-xl p-3 text-sm text-slate-900 outline-none focus:border-amber-500 shadow-sm" />
                                    </div>
                                    <div class="space-y-1">
                                        <label class="text-[9px] text-slate-400 font-bold uppercase ml-1">Дата рождения</label>
                                        <input v-model="p.birthDate" type="date" class="w-full bg-white border border-slate-100 rounded-xl p-3 text-sm text-slate-900 outline-none shadow-sm" />
                                    </div>
                                    <div class="space-y-1">
                                        <label class="text-[9px] text-slate-400 font-bold uppercase ml-1">Гражданство</label>
                                        <input v-model="p.citizenship" placeholder="Таджикистан" class="w-full bg-white border border-slate-100 rounded-xl p-3 text-sm text-slate-900 outline-none focus:border-amber-500 shadow-sm" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="flex justify-end pt-4">
                            <button @click="submitManualBooking" :disabled="loading" class="px-8 py-3.5 bg-amber-500 text-white font-black rounded-2xl shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all flex items-center gap-2">
                                <span v-if="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                Создать бронирование
                            </button>
                        </div>
                    </div>
                </section>

                <!-- Create Bus Section (Copied from Admin View) -->
                <section v-if="activeTab === 'create'" class="space-y-6 lg:space-y-8 text-slate-900">
                    <h2 class="text-2xl lg:text-3xl font-bold text-slate-900">{{ isEditingTicket ? 'Редактировать рейс' : 'Опубликовать новый рейс' }}</h2>
                    
                    <div class="bg-white rounded-[32px] border border-slate-100 p-6 lg:p-8 shadow-sm space-y-8">
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <!-- Company -->
                            <div class="space-y-2">
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Компания</label>
                                <input v-model="busForm.transport_company" placeholder="Название перевозчика" 
                                    class="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 outline-none focus:border-amber-500 transition-all shadow-inner"
                                    :class="{'border-red-500': busErrors.transport_company}" />
                            </div>

                            <!-- From City -->
                            <div class="space-y-2">
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Откуда</label>
                                <select v-model="busForm.from_city" class="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 outline-none focus:border-amber-500 transition-all shadow-inner appearance-none cursor-pointer" :class="{'border-red-500': busErrors.from_city}">
                                    <option value="" disabled>Выберите город</option>
                                    <option v-for="c in cities" :key="'bus-from-'+c" :value="c">{{ c }}</option>
                                </select>
                                <p v-if="busErrors.from_city" class="text-[9px] text-red-500 ml-1">{{ busErrors.from_city }}</p>
                            </div>

                            <!-- From Address -->
                            <div class="space-y-2">
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Адрес отправления</label>
                                <input v-model="busForm.from_address" placeholder="Точный адрес автовокзала" 
                                    class="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 outline-none focus:border-amber-500 transition-all shadow-inner" />
                            </div>

                            <!-- To City -->
                            <div class="space-y-2">
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Куда</label>
                                <select v-model="busForm.to_city" class="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 outline-none focus:border-amber-500 transition-all shadow-inner appearance-none cursor-pointer" :class="{'border-red-500': busErrors.to_city}">
                                    <option value="" disabled>Выберите город</option>
                                    <option v-for="c in cities" :key="'bus-to-'+c" :value="c">{{ c }}</option>
                                </select>
                                <p v-if="busErrors.to_city" class="text-[9px] text-red-500 ml-1">{{ busErrors.to_city }}</p>
                            </div>

                            <!-- To Address -->
                            <div class="space-y-2">
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Адрес прибытия</label>
                                <input v-model="busForm.to_address" placeholder="Точный адрес прибытия" 
                                    class="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 outline-none focus:border-amber-500 transition-all shadow-inner" />
                            </div>

                            <!-- Dates (Departure) -->
                            <div class="grid grid-cols-2 gap-4">
                                <div class="space-y-2">
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Дата отпр.</label>
                                    <input v-model="busForm.departure_date" type="date" class="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 outline-none focus:border-amber-400 text-xs" :class="{'border-red-500': busErrors.departure_date}" />
                                    <p v-if="busErrors.departure_date" class="text-[9px] text-red-400 ml-1">{{ busErrors.departure_date }}</p>
                                </div>
                                <div class="space-y-2">
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Время отпр.</label>
                                    <input v-model="busForm.departure_time" type="time" class="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 outline-none focus:border-amber-400 text-xs" :class="{'border-red-500': busErrors.departure_time}" />
                                    <p v-if="busErrors.departure_time" class="text-[9px] text-red-400 ml-1">{{ busErrors.departure_time }}</p>
                                </div>
                            </div>

                            <!-- Dates (Arrival) -->
                            <div class="grid grid-cols-2 gap-4">
                                <div class="space-y-2">
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Дата приб.</label>
                                    <input v-model="busForm.arrival_date" type="date" class="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 outline-none focus:border-amber-400 text-xs" :class="{'border-red-500': busErrors.arrival_date}" />
                                    <p v-if="busErrors.arrival_date" class="text-[9px] text-red-400 ml-1">{{ busErrors.arrival_date }}</p>
                                </div>
                                <div class="space-y-2">
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Время приб.</label>
                                    <input v-model="busForm.arrival_time" type="time" class="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 outline-none focus:border-amber-400 text-xs" :class="{'border-red-500': busErrors.arrival_time}" />
                                    <p v-if="busErrors.arrival_time" class="text-[9px] text-red-400 ml-1">{{ busErrors.arrival_time }}</p>
                                </div>
                            </div>

                            <!-- Price -->
                            <div class="space-y-2">
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Цена (с.)</label>
                                <input v-model="busForm.price" type="number" placeholder="000.00" 
                                    class="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-amber-600 font-bold text-xl outline-none focus:border-amber-500 transition-all shadow-inner" />
                            </div>

                             <!-- Bus Type Selection -->
                             <div class="space-y-2 flex flex-col">
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 text-slate-400">Конфигурация автобуса</label>
                                <div class="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                                    <button @click="busForm.bus_type = 'single'; busForm.total_seats = 53"
                                        :class="busForm.bus_type === 'single' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400'"
                                        class="flex-1 py-3 rounded-xl font-bold text-xs transition-all tracking-tighter uppercase whitespace-nowrap px-2"
                                    >
                                        Обычный (53)
                                    </button>
                                    <button @click="busForm.bus_type = 'double'; busForm.floor1_seats = 20; busForm.floor2_seats = 56; busForm.total_seats = 76"
                                        :class="busForm.bus_type === 'double' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400'"
                                        class="flex-1 py-3 rounded-xl font-bold text-xs transition-all tracking-tighter uppercase whitespace-nowrap px-2"
                                    >
                                        Двухэтажный (76)
                                    </button>
                                </div>
                            </div>

                            <!-- Total Seats & Duration (single-floor) -->
                             <div v-if="busForm.bus_type === 'single'" class="grid grid-cols-2 gap-4">
                                <div class="space-y-2">
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Мест всего</label>
                                    <input v-model="busForm.total_seats" type="number" class="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 outline-none" />
                                </div>
                                <div class="space-y-2">
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Длит (мин)</label>
                                    <input v-model="busForm.duration_minutes" type="number" class="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 outline-none" />
                                </div>
                             </div>

                             <!-- Per-floor Seats & Duration (double-decker) -->
                             <div v-if="busForm.bus_type === 'double'" class="space-y-4">
                                <div class="grid grid-cols-3 gap-4">
                                    <div class="space-y-2">
                                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">1 Этаж (мест)</label>
                                        <input v-model="busForm.floor1_seats" type="number" class="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 outline-none" :class="{'border-red-500': busErrors.floor1_seats}" />
                                    </div>
                                    <div class="space-y-2">
                                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">2 Этаж (мест)</label>
                                        <input v-model="busForm.floor2_seats" type="number" class="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 outline-none" :class="{'border-red-500': busErrors.floor2_seats}" />
                                    </div>
                                    <div class="space-y-2">
                                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Длит (мин)</label>
                                        <input v-model="busForm.duration_minutes" type="number" class="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 outline-none" />
                                    </div>
                                </div>
                                <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-inner">
                                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Всего мест: </span>
                                    <span class="text-slate-900 font-bold ml-1">{{ Number(busForm.floor1_seats) + Number(busForm.floor2_seats) }}</span>
                                </div>
                             </div>

                             <!-- Premium Price -->
                             <div v-if="busForm.bus_type === 'double'" class="space-y-2">
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">★ Цена за Премиум-место (с.)</label>
                                <input v-model="busForm.premium_price" type="number" placeholder="0 = нет премиума" 
                                    class="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 font-bold text-xl outline-none focus:border-amber-500 transition-all shadow-inner" />
                             </div>
                        </div>

                        <!-- Intermediate Stops -->
                        <div class="space-y-4 pt-4 border-t border-slate-50">
                            <div class="flex justify-between items-center">
                                <h3 class="text-sm font-bold text-slate-700">Промежуточные остановки</h3>
                                <button @click="addStop" class="text-xs font-bold text-amber-500 hover:text-amber-600 px-4 py-2 bg-amber-50 rounded-xl transition-all border border-amber-100">+ Добавить</button>
                            </div>
                            <div v-for="(stop, idx) in busForm.intermediate_stops" :key="idx" class="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100 relative shadow-inner">
                                <button @click="removeStop(idx)" class="absolute top-4 right-4 text-red-500 hover:text-red-600 p-2 bg-white rounded-xl shadow-sm border border-slate-100 transition-all">
                                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                                </button>
                                <div class="space-y-2">
                                    <label class="text-[9px] text-slate-400 font-bold uppercase ml-1">Город</label>
                                    <select v-model="stop.city" class="w-full bg-white border border-slate-100 rounded-xl p-3 text-sm text-slate-900 shadow-sm">
                                        <option v-for="c in cities" :key="c" :value="c">{{ c }}</option>
                                    </select>
                                </div>
                                <div class="space-y-2">
                                    <label class="text-[9px] text-slate-400 font-bold uppercase ml-1">Время прибытия</label>
                                    <input v-model="stop.time" type="time" class="w-full bg-white border border-slate-100 rounded-xl p-3 text-sm text-slate-900 shadow-sm" />
                                </div>
                                <div class="md:col-span-2 space-y-2 pr-10">
                                    <label class="text-[9px] text-slate-400 font-bold uppercase ml-1">Адрес / Место</label>
                                    <input v-model="stop.address" placeholder="Напр. Центр города" class="w-full bg-white border border-slate-100 rounded-xl p-3 text-sm text-slate-900 shadow-sm outline-none focus:border-amber-500" />
                                </div>
                            </div>
                        </div>

                        <!-- Submit Button -->
                         <div class="flex justify-end pt-4">
                             <button 
                                @click="isEditingTicket ? updateBusTicket() : submitBusTicket()" 
                                :disabled="loading"
                                class="px-12 py-4 rounded-2xl bg-amber-500 text-slate-900 font-bold text-lg shadow-xl shadow-amber-500/20 hover:shadow-amber-500/40 hover:-translate-y-1 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
                            >
                                <span v-if="loading" class="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></span>
                                {{ loading ? (isEditingTicket ? 'Обновление...' : 'Создание...') : (isEditingTicket ? 'Обновить рейс' : 'Опубликовать рейс') }}
                            </button>
                        </div>
                    </div>
                </section>
            </main>
        </template>
    </div>
</template>
