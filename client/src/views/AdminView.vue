<script>
import api from '../api';
import AppLogo from '../components/AppLogo.vue';
import { 
  Chart as ChartJS, 
  Title, 
  Tooltip, 
  Legend, 
  LineElement, 
  PointElement, 
  CategoryScale, 
  LinearScale,
  ArcElement
} from 'chart.js';
import { Line, Pie } from 'vue-chartjs';

ChartJS.register(
  Title, 
  Tooltip, 
  Legend, 
  LineElement, 
  PointElement, 
  CategoryScale, 
  LinearScale,
  ArcElement
);

export default {
    components: {
        LineChart: Line,
        PieChart: Pie,
        AppLogo
    },
    data() {
        return {
            isAuthenticated: false,
            passcode: '',
            activeTab: 'dashboard',
            stats: null,
            users: [],
            rides: [],
            busTickets: [],
            reviews: [],
            cities: [],
            newCityName: '',
            loading: false,
            isCreatingBus: false,
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
                total_seats: 44,
                bus_type: 'single',
                passenger_comments: '',
                intermediate_stops: []
            },
            busErrors: {},
            busDrivers: [],
            newBusDriver: {
                name: '',
                surname: '',
                phone: '',
                password: ''
            },
            user: JSON.parse(localStorage.getItem('user') || 'null'),
            error: '',
            mobileMenuOpen: false,
            editingUser: null,
            editingRide: null,
            showUserEditModal: false,
            showRideEditModal: false,
            navItems: [
                { id: 'dashboard', label: 'Дашборд' },
                { id: 'users', label: 'Пользователи' },
                { id: 'bus-drivers', label: 'Водители автобусов' },
                { id: 'rides', label: 'Поездки' },
                { id: 'bus-tickets', label: 'Автобусы' },
                { id: 'reviews', label: 'Отзывы' },
                { id: 'cities', label: 'Города' }
            ],
            chartOptions: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#94a3b8' }
                    }
                },
                scales: {
                    y: {
                        grid: { color: '#334155' },
                        ticks: { color: '#94a3b8' }
                    },
                    x: {
                        grid: { color: '#334155' },
                        ticks: { color: '#94a3b8' }
                    }
                }
            },
            pieOptions: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#94a3b8' }
                    }
                }
            }
        }
    },
    computed: {
        growthChartData() {
            if (!this.stats) return null;
            
            // Collect last 7 dates
            const labels = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                labels.push(date.toISOString().split('T')[0]);
            }

            const ridesMap = Object.fromEntries(this.stats.ridesLast7Days.map(r => [r.date, r.count]));
            const usersMap = Object.fromEntries(this.stats.usersLast7Days.map(u => [u.register_date, u.count]));

            return {
                labels,
                datasets: [
                    {
                        label: 'Поездки',
                        data: labels.map(l => ridesMap[l] || 0),
                        borderColor: '#f59e0b',
                        backgroundColor: '#f59e0b',
                        tension: 0.4
                    },
                    {
                        label: 'Регистрации',
                        data: labels.map(l => usersMap[l] || 0),
                        borderColor: '#3b82f6',
                        backgroundColor: '#3b82f6',
                        tension: 0.4
                    }
                ]
            };
        },
        vehicleChartData() {
            if (!this.stats) return null;
            return {
                labels: this.stats.vehicleDistribution.map(r => r.status === 'with_vehicle' ? 'С авто' : 'Без авто'),
                datasets: [{
                    data: this.stats.vehicleDistribution.map(r => r.count),
                    backgroundColor: ['#f59e0b', '#3b82f6'],
                    borderWidth: 0
                }]
            };
        }
    },
    methods: {
        checkPasscode() {
            if (this.passcode === '141206') {
                this.isAuthenticated = true;
                this.fetchDashboardData();
            } else {
                alert('Неверный код доступа');
            }
        },
        async fetchDashboardData() {
            this.loading = true;
            try {
                const res = await api.get('/admin/stats');
                this.stats = res.data;
            } catch (e) {
                console.error(e);
            } finally {
                this.loading = false;
            }
        },
        async fetchUsers() {
            this.loading = true;
            try {
                const res = await api.get('/admin/users');
                this.users = res.data;
            } catch (e) { console.error(e); } finally { this.loading = false; }
        },
        async deleteUser(id) {
            if (confirm('Удалить пользователя?')) {
                await api.delete(`/admin/users/${id}`);
                this.fetchUsers();
            }
        },
        openEditUserModal(user) {
            this.editingUser = { ...user };
            this.showUserEditModal = true;
        },
        async updateUser() {
            try {
                await api.put(`/admin/users/${this.editingUser.id}`, this.editingUser);
                alert('Пользователь обновлен');
                this.showUserEditModal = false;
                this.fetchUsers();
                this.fetchBusDrivers();
            } catch (e) {
                alert('Ошибка при обновлении');
            }
        },
        async fetchBusDrivers() {
             this.loading = true;
             try {
                 const res = await api.get('/admin/bus-drivers');
                 this.busDrivers = res.data;
             } catch (e) { console.error(e); } finally { this.loading = false; }
        },
        async createBusDriver() {
            if (!this.newBusDriver.phone || !this.newBusDriver.password) {
                alert('Номер телефона и пароль обязательны');
                return;
            }
            this.loading = true;
            try {
                await api.post('/admin/bus-drivers', this.newBusDriver);
                alert('Водитель автобуса успешно создан');
                this.newBusDriver = { name: '', surname: '', phone: '', password: '' };
                this.fetchBusDrivers();
            } catch (e) {
                alert(e.response?.data?.error || 'Ошибка при создании водителя');
            } finally {
                this.loading = false;
            }
        },
        async fetchRides() {
            this.loading = true;
            try {
                const res = await api.get('/admin/rides');
                this.rides = res.data;
            } catch (e) { console.error(e); } finally { this.loading = false; }
        },
        async deleteRide(id) {
            if (confirm('Удалить поездку?')) {
                await api.delete(`/admin/rides/${id}`);
                this.fetchRides();
            }
        },
        openEditRideModal(ride) {
            this.editingRide = { ...ride };
            this.showRideEditModal = true;
        },
        async updateRide() {
            try {
                const data = { ...this.editingRide };
                delete data.driver_name; // Computed field
                await api.put(`/admin/rides/${this.editingRide.id}`, data);
                alert('Поездка обновлена');
                this.showRideEditModal = false;
                this.fetchRides();
            } catch (e) {
                alert('Ошибка при обновлении');
            }
        },
        async fetchBusTickets() {
            this.loading = true;
            try {
                const res = await api.get('/admin/bus-tickets');
                this.busTickets = res.data;
            } catch (e) { console.error(e); } finally { this.loading = false; }
        },
        async deleteBusTicket(id) {
            if (confirm('Удалить этот рейс?')) {
                await api.delete(`/admin/bus-tickets/${id}`);
                this.fetchBusTickets();
            }
        },
        async fetchReviews() {
            this.loading = true;
            try {
                const res = await api.get('/admin/reviews');
                this.reviews = res.data;
            } catch (e) {
                console.error(e);
            } finally {
                this.loading = false;
            }
        },
        async deleteReview(id) {
            if (confirm('Удалить этот отзыв?')) {
                await api.delete(`/admin/reviews/${id}`);
                this.fetchReviews();
            }
        },
        async fetchCities() {
            this.loading = true;
            try {
                const res = await api.get('/admin/cities');
                this.cities = res.data;
            } catch (e) { console.error(e); } finally { this.loading = false; }
        },
        async addCity() {
            if (!this.newCityName) return;
            try {
                await api.post('/admin/cities', { name: this.newCityName });
                this.newCityName = '';
                this.fetchCities();
            } catch (e) { 
                alert(e.response?.data?.error || 'Ошибка при добавлении города'); 
            }
        },
        async deleteCity(id) {
            if (confirm('Удалить город?')) {
                await api.delete(`/admin/cities/${id}`);
                this.fetchCities();
            }
        },

        // Bus Ticket Creation Methods
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
            if (!this.busForm.total_seats || this.busForm.total_seats < 1) e.total_seats = 'Укажите количество мест';
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
                await api.post('/bus-tickets', {
                    ...this.busForm,
                    operator_id: this.user?.id || 1, // Fallback to admin if no user
                    duration_minutes: Number(this.busForm.duration_minutes),
                    price: Number(this.busForm.price),
                    total_seats: Number(this.busForm.total_seats)
                });
                alert('Рейс успешно создан!');
                this.isCreatingBus = false;
                this.fetchBusTickets();
                // Reset form
                this.busForm = {
                    transport_company: '', from_city: '', from_address: '',
                    to_city: '', to_address: '', departure_date: '',
                    departure_time: '', arrival_date: '', arrival_time: '',
                    duration_minutes: '', price: '', total_seats: 44,
                    bus_type: 'single', passenger_comments: '',
                    intermediate_stops: []
                };
            } catch (e) {
                alert(e.response?.data?.error || 'Ошибка при создании');
            } finally {
                this.loading = false;
            }
        }
    },
    watch: {
        activeTab(newTab) {
            this.isCreatingBus = false;
            if (newTab === 'dashboard') this.fetchDashboardData();
            if (newTab === 'users') this.fetchUsers();
            if (newTab === 'bus-drivers') this.fetchBusDrivers();
            if (newTab === 'rides') this.fetchRides();
            if (newTab === 'bus-tickets') {
                this.fetchBusTickets();
                this.fetchCities();
            }
            if (newTab === 'reviews') this.fetchReviews();
            if (newTab === 'cities') this.fetchCities();
        }
    }
}
</script>

<template>
    <div class="admin-panel h-screen bg-slate-900 text-slate-100 flex overflow-hidden font-sans">
        <!-- Mobile Header (Visible only on mobile) -->
        <div class="lg:hidden fixed top-0 inset-x-0 z-40 bg-slate-800 border-b border-slate-700 p-4 flex justify-between items-center">
            <div class="flex items-center space-x-3">
                <AppLogo 
                    :showText="false" 
                    iconSizeClass="w-8 h-8"
                    iconClass="h-5 w-5"
                    iconBgClass="bg-amber-500 text-slate-900"
                />
                <span class="text-lg font-bold tracking-tight">Admin</span>
            </div>
            <button @click="mobileMenuOpen = !mobileMenuOpen" class="text-slate-300 p-2">
                <svg v-if="!mobileMenuOpen" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
        
        <!-- Auth Overlay -->
        <div v-if="!isAuthenticated" class="fixed inset-0 z-[100] bg-slate-900 flex items-center justify-center p-4 sm:p-6">
            <div class="max-w-md w-full bg-slate-800 p-6 sm:p-8 rounded-[32px] border border-slate-700 shadow-2xl text-center">
                <div class="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <h1 class="text-3xl font-bold mb-2">Admin Panel</h1>
                <p class="text-slate-400 mb-8">Введите код доступа для работы с системой</p>
                <input 
                    v-model="passcode" 
                    type="password" 
                    placeholder="••••••"
                    class="w-full bg-slate-700 border-2 border-slate-600 rounded-2xl p-4 text-center text-2xl tracking-[1em] focus:border-amber-500 outline-none transition-all mb-6"
                    @keyup.enter="checkPasscode"
                />
                <button 
                    @click="checkPasscode"
                    class="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-4 rounded-2xl transition-all shadow-lg shadow-amber-500/20"
                >
                    Войти
                </button>
            </div>
        </div>

        <!-- Sidebar -->
        <aside 
            class="lg:w-72 bg-slate-800 border-r border-slate-700 flex flex-col pt-8 fixed lg:relative inset-y-0 left-0 z-30 transition-transform transform lg:translate-x-0 w-64"
            :class="mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'"
        >
            <div class="px-8 mb-12">
                <div class="flex items-center space-x-3">
                    <AppLogo 
                        :showText="false" 
                        iconSizeClass="w-10 h-10"
                        iconClass="h-6 w-6"
                        iconBgClass="bg-amber-500 text-slate-900"
                    />
                    <span class="text-xl font-bold tracking-tight">Poputki Admin</span>
                </div>
            </div>

            <nav class="flex-1 px-4 space-y-2 overflow-y-auto">
                <button 
                    v-for="item in navItems" 
                    :key="item.id"
                    @click="activeTab = item.id; mobileMenuOpen = false"
                    class="w-full px-4 py-3 rounded-xl flex items-center space-x-3 transition-all group"
                    :class="activeTab === item.id ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-100'"
                >
                    <span class="capitalize">{{ item.label }}</span>
                </button>
            </nav>

            <div class="p-6 border-t border-slate-700">
                <button @click="isAuthenticated = false" class="text-xs text-slate-500 hover:text-red-400 transition-colors">Выйти из сессии</button>
            </div>
        </aside>

        <!-- Main Content -->
        <main class="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-6 lg:p-10 pt-20 lg:pt-10 w-full overflow-x-hidden">
            
            <!-- Dashboard Section -->
            <section v-if="activeTab === 'dashboard'" class="space-y-6 lg:space-y-10">
                <div class="flex justify-between items-end">
                    <div>
                        <h2 class="text-4xl font-bold">Дашборд</h2>
                        <p class="text-slate-500 mt-2">Обзор ключевых показателей платформы</p>
                    </div>
                </div>

                <div v-if="stats" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-6">
                    <div class="bg-slate-800 p-6 lg:p-8 rounded-2xl lg:rounded-[32px] border border-slate-700">
                        <p class="text-slate-400 text-xs lg:text-sm font-medium uppercase tracking-wider mb-2">Пользователи</p>
                        <h3 class="text-3xl lg:text-4xl font-black">{{ stats.totalUsers }}</h3>
                    </div>
                    <div class="bg-slate-800 p-6 lg:p-8 rounded-2xl lg:rounded-[32px] border border-slate-700">
                        <p class="text-slate-400 text-xs lg:text-sm font-medium uppercase tracking-wider mb-2">Активные поездки</p>
                        <h3 class="text-3xl lg:text-4xl font-black text-amber-500">{{ stats.activeRides }}</h3>
                    </div>
                </div>

                <div v-if="stats" class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
                    <!-- Growth Chart -->
                    <div class="lg:col-span-2 bg-slate-800/50 p-6 lg:p-8 rounded-2xl lg:rounded-[32px] border border-slate-700">
                        <h4 class="text-lg lg:text-xl font-bold mb-6 flex justify-between items-center">
                            <span>Динамика роста</span>
                            <span class="text-xs text-slate-500 font-normal">Последние 7 дней</span>
                        </h4>
                        <div class="h-[300px]">
                            <LineChart :data="growthChartData" :options="chartOptions" />
                        </div>
                    </div>

                    <!-- Vehicle Distribution -->
                    <div class="bg-slate-800/50 p-6 lg:p-8 rounded-2xl lg:rounded-[32px] border border-slate-700">
                        <h4 class="text-lg lg:text-xl font-bold mb-6">Наличие авто</h4>
                        <div class="h-[300px]">
                            <PieChart :data="vehicleChartData" :options="pieOptions" />
                        </div>
                    </div>
                </div>

                <div v-if="stats" class="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
                    <div class="bg-slate-800/50 p-6 lg:p-8 rounded-2xl lg:rounded-[32px] border border-slate-700">
                        <h4 class="text-lg lg:text-xl font-bold mb-4 lg:mb-6">Новые пользователи</h4>
                        <div class="space-y-4">
                            <div v-for="u in stats.recentUsers" :key="u.id" class="flex justify-between items-center border-b border-slate-700 pb-3 last:border-0">
                                <span class="font-medium text-sm lg:text-base">{{ u.name }}</span>
                                <span class="text-xs text-slate-500">{{ new Date(u.created_at).toLocaleDateString() }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="bg-slate-800/50 p-6 lg:p-8 rounded-2xl lg:rounded-[32px] border border-slate-700">
                        <h4 class="text-lg lg:text-xl font-bold mb-4 lg:mb-6">Популярные города</h4>
                        <div class="space-y-4">
                            <div v-for="d in stats.popularDestinations" :key="d.to_city" class="flex justify-between items-center border-b border-slate-700 pb-3 last:border-0">
                                <span class="font-medium text-sm lg:text-base">{{ d.to_city }}</span>
                                <span class="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-xs font-bold">{{ d.count }} поездок</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Users Section -->
            <section v-if="activeTab === 'users'" class="space-y-6 lg:space-y-8">
                <h2 class="text-2xl lg:text-3xl font-bold">Пользователи</h2>
                <div class="bg-slate-800 rounded-2xl lg:rounded-[32px] border border-slate-700 overflow-x-auto shadow-2xl">
                    <table class="w-full text-left min-w-[700px]">
                        <thead class="bg-slate-900/50 border-b border-slate-700">
                            <tr>
                                <th class="px-6 py-4 text-slate-400 font-medium">ID</th>
                                <th class="px-6 py-4 text-slate-400 font-medium">Имя</th>
                                <th class="px-6 py-4 text-slate-400 font-medium">Телефон</th>
                                <th class="px-6 py-4 text-slate-400 font-medium">Рейтинг</th>
                                <th class="px-6 py-4 text-slate-400 font-medium">Действия</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-700">
                            <tr v-for="user in users" :key="user.id" class="hover:bg-slate-700/30 transition-colors">
                                <td class="px-6 py-4 font-mono text-slate-500">#{{ user.id }}</td>
                                <td class="px-6 py-4 font-bold">{{ user.name }} {{ user.surname }}</td>
                                <td class="px-6 py-4 font-mono">{{ user.phone }}</td>
                                <td class="px-6 py-4">
                                    <span class="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-sm font-bold">★ {{ user.rating }}</span>
                                </td>
                                 <td class="px-6 py-4 text-right space-x-3">
                                     <button @click="openEditUserModal(user)" class="text-amber-400 hover:text-amber-500 font-bold text-sm">Изменить</button>
                                     <button @click="deleteUser(user.id)" class="text-red-400 hover:text-red-500 font-bold text-sm">Удалить</button>
                                 </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <!-- Bus Drivers Section -->
            <section v-if="activeTab === 'bus-drivers'" class="space-y-6 lg:space-y-8">
                <h2 class="text-2xl lg:text-3xl font-bold">Водители автобусов</h2>
                
                <div class="bg-slate-800 rounded-2xl lg:rounded-[32px] border border-slate-700 p-6 lg:p-8 shadow-2xl space-y-6">
                    <h3 class="text-xl font-bold text-amber-500">Добавить водителя</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <input v-model="newBusDriver.name" placeholder="Имя" class="bg-slate-700 border border-slate-600 rounded-xl p-3 text-slate-100 outline-none focus:border-amber-500" />
                        <input v-model="newBusDriver.surname" placeholder="Фамилия" class="bg-slate-700 border border-slate-600 rounded-xl p-3 text-slate-100 outline-none focus:border-amber-500" />
                        <input v-model="newBusDriver.phone" placeholder="Телефон" type="tel" class="bg-slate-700 border border-slate-600 rounded-xl p-3 text-slate-100 outline-none focus:border-amber-500" />
                        <input v-model="newBusDriver.password" placeholder="Пароль" type="text" class="bg-slate-700 border border-slate-600 rounded-xl p-3 text-slate-100 outline-none focus:border-amber-500" />
                    </div>
                    <div class="flex justify-end">
                        <button @click="createBusDriver" :disabled="loading" class="bg-amber-500 text-slate-900 font-bold px-6 py-3 rounded-xl shadow-lg hover:-translate-y-1 transition-all disabled:opacity-50">Создать водителя</button>
                    </div>
                </div>

                <div class="bg-slate-800 rounded-2xl lg:rounded-[32px] border border-slate-700 overflow-x-auto shadow-2xl mt-8">
                    <table class="w-full text-left min-w-[700px]">
                        <thead class="bg-slate-900/50 border-b border-slate-700">
                            <tr>
                                <th class="px-6 py-4 text-slate-400 font-medium">ID</th>
                                <th class="px-6 py-4 text-slate-400 font-medium">Имя</th>
                                <th class="px-6 py-4 text-slate-400 font-medium">Телефон</th>
                                <th class="px-6 py-4 text-slate-400 font-medium">Дата создания</th>
                                <th class="px-6 py-4 text-slate-400 font-medium">Действия</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-700">
                            <tr v-for="driver in busDrivers" :key="driver.id" class="hover:bg-slate-700/30 transition-colors">
                                <td class="px-6 py-4 font-mono text-slate-500">#{{ driver.id }}</td>
                                <td class="px-6 py-4 font-bold">{{ driver.name }} {{ driver.surname }}</td>
                                <td class="px-6 py-4 font-mono">{{ driver.phone }}</td>
                                <td class="px-6 py-4 text-slate-400 text-sm">{{ new Date(driver.created_at).toLocaleDateString() }}</td>
                                <td class="px-6 py-4 space-x-3">
                                     <button @click="openEditUserModal(driver)" class="text-amber-400 hover:text-amber-500 font-bold text-sm">Изменить</button>
                                     <button @click="deleteUser(driver.id)" class="text-red-400 hover:text-red-500 font-bold text-sm">Удалить</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

             <!-- Rides Section -->
             <section v-if="activeTab === 'rides'" class="space-y-6 lg:space-y-8">
                <h2 class="text-2xl lg:text-3xl font-bold">Все поездки</h2>
                <div class="bg-slate-800 rounded-2xl lg:rounded-[32px] border border-slate-700 overflow-x-auto shadow-2xl">
                    <table class="w-full text-left min-w-[800px]">
                        <thead class="bg-slate-900/50 border-b border-slate-700">
                            <tr>
                                <th class="px-6 py-4 text-slate-400 font-medium">ID</th>
                                <th class="px-6 py-4 text-slate-400 font-medium">Маршрут</th>
                                <th class="px-6 py-4 text-slate-400 font-medium">Водитель</th>
                                <th class="px-6 py-4 text-slate-400 font-medium">Дата/Время</th>
                                <th class="px-6 py-4 text-slate-400 font-medium">Статус</th>
                                <th class="px-6 py-4 text-slate-400 font-medium text-right">Управление</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-700">
                            <tr v-for="ride in rides" :key="ride.id" class="hover:bg-slate-700/30 transition-colors">
                                <td class="px-6 py-4 font-mono text-slate-500">#{{ ride.id }}</td>
                                <td class="px-6 py-4">
                                    <div class="flex items-center space-x-2">
                                        <span class="font-bold">{{ ride.from_city }}</span>
                                        <span class="text-slate-500">→</span>
                                        <span class="font-bold">{{ ride.to_city }}</span>
                                    </div>
                                </td>
                                <td class="px-6 py-4">{{ ride.driver_name }}</td>
                                <td class="px-6 py-4 font-mono text-sm">{{ ride.date }} {{ ride.time }}</td>
                                <td class="px-6 py-4">
                                    <span :class="ride.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'" class="px-3 py-1 rounded-full text-xs font-bold uppercase">{{ ride.status || 'active' }}</span>
                                </td>
                                <td class="px-6 py-4 text-right space-x-3">
                                    <button @click="openEditRideModal(ride)" class="text-amber-400 hover:text-amber-500 font-bold text-sm">Изменить</button>
                                    <button @click="deleteRide(ride.id)" class="text-red-400 hover:text-red-500 font-bold text-sm">Удалить</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <!-- Cities Section -->
            <section v-if="activeTab === 'cities'" class="space-y-6 lg:space-y-8">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                    <h2 class="text-2xl lg:text-3xl font-bold">Города и направления</h2>
                    <div class="flex space-x-2 sm:space-x-4 w-full sm:w-auto">
                        <input v-model="newCityName" type="text" placeholder="Название города" class="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 outline-none focus:border-amber-500 w-full sm:w-auto">
                        <button @click="addCity" class="bg-emerald-500 text-slate-900 px-4 sm:px-6 py-2 rounded-xl font-bold shadow-lg shadow-emerald-500/20 whitespace-nowrap">Добавить</button>
                    </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    <div v-for="city in cities" :key="city.id" class="bg-slate-800 p-4 lg:p-6 rounded-xl lg:rounded-2xl border border-slate-700 flex justify-between items-center group transition-all hover:border-amber-500/50 shadow-lg">
                        <span class="font-bold text-lg">{{ city.name }}</span>
                        <button @click="deleteCity(city.id)" class="text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2 hover:bg-red-500/10 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
            </section>

            <!-- Bus Tickets Section -->
            <section v-if="activeTab === 'bus-tickets'" class="space-y-6 lg:space-y-8">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                    <h2 class="text-2xl lg:text-3xl font-bold">Управление автобусами</h2>
                    <button 
                        class="bg-amber-500 text-slate-900 px-6 py-2 rounded-xl font-bold shadow-lg shadow-amber-500/20 w-full sm:w-auto" 
                        @click="isCreatingBus = !isCreatingBus"
                    >
                        {{ isCreatingBus ? 'Отмена' : 'Добавить рейс' }}
                    </button>
                </div>

                <!-- ADD BUS TICKET INTERFACE (Embedded) -->
                <div v-if="isCreatingBus" class="bg-slate-800 rounded-[32px] border border-slate-700 p-8 shadow-2xl space-y-8 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div class="flex justify-between items-center">
                        <h3 class="text-2xl font-bold text-amber-500">Новый автобусный рейс</h3>
                        <div class="flex items-center space-x-2">
                             <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                             <span class="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Создание записи</span>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <!-- Company -->
                        <div class="space-y-2">
                            <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Компания</label>
                            <input v-model="busForm.transport_company" placeholder="Название перевозчика" 
                                class="w-full bg-slate-700/50 border border-slate-600 rounded-2xl p-4 text-slate-100 outline-none focus:border-amber-500 transition-all shadow-inner"
                                :class="{'border-red-500': busErrors.transport_company}" />
                        </div>

                        <!-- From City -->
                        <div class="space-y-2">
                            <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Откуда</label>
                            <select v-model="busForm.from_city" class="w-full bg-slate-700/50 border border-slate-600 rounded-2xl p-4 text-slate-100 outline-none focus:border-amber-500 transition-all shadow-inner appearance-none cursor-pointer" :class="{'border-red-500': busErrors.from_city}">
                                <option value="" disabled>Выберите город</option>
                                <option v-for="c in cities" :key="'bus-from-'+c.id" :value="c.name">{{ c.name }}</option>
                            </select>
                            <p v-if="busErrors.from_city" class="text-[9px] text-red-500 ml-1">{{ busErrors.from_city }}</p>
                        </div>

                        <!-- From Address -->
                        <div class="space-y-2">
                            <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Адрес отправления</label>
                            <input v-model="busForm.from_address" placeholder="Точный адрес автовокзала" 
                                class="w-full bg-slate-700/50 border border-slate-600 rounded-2xl p-4 text-slate-100 outline-none focus:border-amber-500 transition-all shadow-inner" />
                        </div>

                        <!-- To City -->
                        <div class="space-y-2">
                            <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Куда</label>
                            <select v-model="busForm.to_city" class="w-full bg-slate-700/50 border border-slate-600 rounded-2xl p-4 text-slate-100 outline-none focus:border-amber-500 transition-all shadow-inner appearance-none cursor-pointer" :class="{'border-red-500': busErrors.to_city}">
                                <option value="" disabled>Выберите город</option>
                                <option v-for="c in cities" :key="'bus-to-'+c.id" :value="c.name">{{ c.name }}</option>
                            </select>
                            <p v-if="busErrors.to_city" class="text-[9px] text-red-500 ml-1">{{ busErrors.to_city }}</p>
                        </div>

                        <!-- To Address -->
                        <div class="space-y-2">
                            <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Адрес прибытия</label>
                            <input v-model="busForm.to_address" placeholder="Точный адрес прибытия" 
                                class="w-full bg-slate-700/50 border border-slate-600 rounded-2xl p-4 text-slate-100 outline-none focus:border-amber-500 transition-all shadow-inner" />
                        </div>

                        <!-- Dates (Departure) -->
                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Дата отпр.</label>
                                <input v-model="busForm.departure_date" type="date" class="w-full bg-slate-700/50 border border-slate-600 rounded-2xl p-4 text-slate-100 outline-none focus:border-amber-400 text-xs" :class="{'border-red-500': busErrors.departure_date}" />
                                <p v-if="busErrors.departure_date" class="text-[9px] text-red-400 ml-1">{{ busErrors.departure_date }}</p>
                            </div>
                            <div class="space-y-2">
                                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Время отпр.</label>
                                <input v-model="busForm.departure_time" type="time" class="w-full bg-slate-700/50 border border-slate-600 rounded-2xl p-4 text-slate-100 outline-none focus:border-amber-400 text-xs" :class="{'border-red-500': busErrors.departure_time}" />
                                <p v-if="busErrors.departure_time" class="text-[9px] text-red-400 ml-1">{{ busErrors.departure_time }}</p>
                            </div>
                        </div>

                        <!-- Dates (Arrival) -->
                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Дата приб.</label>
                                <input v-model="busForm.arrival_date" type="date" class="w-full bg-slate-700/50 border border-slate-600 rounded-2xl p-4 text-slate-100 outline-none focus:border-amber-400 text-xs" :class="{'border-red-500': busErrors.arrival_date}" />
                                <p v-if="busErrors.arrival_date" class="text-[9px] text-red-400 ml-1">{{ busErrors.arrival_date }}</p>
                            </div>
                            <div class="space-y-2">
                                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Время приб.</label>
                                <input v-model="busForm.arrival_time" type="time" class="w-full bg-slate-700/50 border border-slate-600 rounded-2xl p-4 text-slate-100 outline-none focus:border-amber-400 text-xs" :class="{'border-red-500': busErrors.arrival_time}" />
                                <p v-if="busErrors.arrival_time" class="text-[9px] text-red-400 ml-1">{{ busErrors.arrival_time }}</p>
                            </div>
                        </div>

                        <!-- Price -->
                        <div class="space-y-2">
                            <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Цена (TJS)</label>
                            <input v-model="busForm.price" type="number" placeholder="000.00" 
                                class="w-full bg-slate-700/50 border border-slate-600 rounded-2xl p-4 text-amber-500 font-bold text-xl outline-none focus:border-amber-500 transition-all shadow-inner" />
                        </div>

                         <!-- Bus Type Selection (Premium Toggles) -->
                         <div class="space-y-2 flex flex-col">
                            <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2">Конфигурация автобуса</label>
                            <div class="flex bg-slate-700/30 p-1.5 rounded-2xl border border-slate-600/50">
                                <button @click="busForm.bus_type = 'single'; busForm.total_seats = 44"
                                    :class="busForm.bus_type === 'single' ? 'bg-amber-500 text-slate-900 shadow-lg' : 'text-slate-400'"
                                    class="flex-1 py-3 rounded-xl font-bold text-xs transition-all tracking-tighter uppercase whitespace-nowrap px-2"
                                >
                                    Обычный (44)
                                </button>
                                <button @click="busForm.bus_type = 'double'; busForm.total_seats = 72"
                                    :class="busForm.bus_type === 'double' ? 'bg-amber-500 text-slate-900 shadow-lg' : 'text-slate-400'"
                                    class="flex-1 py-3 rounded-xl font-bold text-xs transition-all tracking-tighter uppercase whitespace-nowrap px-2"
                                >
                                    Двухэтажный (72)
                                </button>
                            </div>
                        </div>

                        <!-- Total Seats & Duration -->
                         <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Мест всего</label>
                                <input v-model="busForm.total_seats" type="number" class="w-full bg-slate-700/50 border border-slate-600 rounded-2xl p-4 text-slate-100 outline-none" />
                            </div>
                            <div class="space-y-2">
                                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Длит (мин)</label>
                                <input v-model="busForm.duration_minutes" type="number" class="w-full bg-slate-700/50 border border-slate-600 rounded-2xl p-4 text-slate-100 outline-none" />
                            </div>
                         </div>
                    </div>

                    <!-- Intermediate Stops (Premium Rows) -->
                    <div class="space-y-4 pt-4 border-t border-slate-700/50">
                        <div class="flex items-center justify-between">
                            <h4 class="text-xs font-black text-slate-400 uppercase tracking-widest">Промежуточные остановки</h4>
                            <button @click="addStop" class="text-xs font-bold text-amber-500 bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-500/20 hover:bg-amber-500 hover:text-slate-900 transition-all">
                                + Добавить остановку
                            </button>
                        </div>
                        
                        <div v-if="busForm.intermediate_stops.length === 0" class="text-center py-8 rounded-[32px] border-2 border-dashed border-slate-700 text-slate-500 italic text-sm">
                            Рейс без остановок
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div v-for="(stop, index) in busForm.intermediate_stops" :key="'admin-stop-'+index" class="bg-slate-700/20 p-5 rounded-3xl border border-slate-700 flex flex-col space-y-3 relative group overflow-hidden">
                                <div class="absolute inset-y-0 left-0 w-1 bg-amber-500"></div>
                                <button @click="removeStop(index)" class="absolute top-4 right-4 text-red-400 hover:scale-110 transition-transform">
                                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                                </button>
                                <div class="grid grid-cols-2 gap-3">
                                    <select v-model="stop.city" class="bg-slate-800 border border-slate-600 rounded-xl p-2 text-sm text-slate-100 outline-none">
                                        <option value="" disabled>Город</option>
                                        <option v-for="c in cities" :key="'stop-city-'+c.id" :value="c.name">{{ c.name }}</option>
                                    </select>
                                    <input v-model="stop.time" type="time" class="bg-slate-800 border border-slate-600 rounded-xl p-2 text-sm text-slate-100 outline-none" />
                                </div>
                                <input v-model="stop.address" placeholder="Адрес / Терминал" class="bg-slate-800 border border-slate-600 rounded-xl p-2 text-xs text-slate-400 outline-none w-full" />
                            </div>
                        </div>
                    </div>

                    <!-- Passenger Comments -->
                    <div class="space-y-2">
                        <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Комментарии для пассажиров</label>
                        <textarea v-model="busForm.passenger_comments" rows="2" placeholder="Удобства, правила багажа и т.д."
                            class="w-full bg-slate-700/50 border border-slate-600 rounded-3xl p-6 text-slate-300 outline-none focus:border-amber-500 transition-all resize-none shadow-inner"></textarea>
                    </div>

                    <!-- Submit Button -->
                    <div class="flex justify-end pt-4">
                         <button 
                            @click="submitBusTicket" 
                            :disabled="loading"
                            class="px-12 py-4 rounded-2xl bg-amber-500 text-slate-900 font-bold text-lg shadow-xl shadow-amber-500/20 hover:shadow-amber-500/40 hover:-translate-y-1 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
                        >
                            <span v-if="loading" class="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></span>
                            {{ loading ? 'Создание...' : 'Опубликовать рейс' }}
                        </button>
                    </div>
                </div>

                <div class="bg-slate-800 rounded-2xl lg:rounded-[32px] border border-slate-700 overflow-x-auto shadow-2xl">
                    <table class="w-full text-left min-w-[900px]">
                        <thead class="bg-slate-900/50 border-b border-slate-700">
                            <tr>
                                <th class="px-6 py-4 text-slate-400 font-medium">Маршрут</th>
                                <th class="px-6 py-4 text-slate-400 font-medium">Компания</th>
                                <th class="px-6 py-4 text-slate-400 font-medium">Дата/Время</th>
                                <th class="px-6 py-4 text-slate-400 font-medium">Свободно</th>
                                <th class="px-6 py-4 text-slate-400 font-medium">Цена</th>
                                <th class="px-6 py-4 text-slate-400 font-medium">Действия</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-700">
                            <tr v-for="ticket in busTickets" :key="ticket.id" class="hover:bg-slate-700/30 transition-colors">
                                <td class="px-6 py-4">
                                    <div class="flex flex-col">
                                        <span class="font-bold">{{ ticket.from_city }} → {{ ticket.to_city }}</span>
                                        <span class="text-xs text-slate-500">{{ ticket.from_address }}</span>
                                    </div>
                                </td>
                                <td class="px-6 py-4 text-sm">{{ ticket.transport_company }}</td>
                                <td class="px-6 py-4 font-mono text-sm">{{ ticket.departure_date }} {{ ticket.departure_time }}</td>
                                <td class="px-6 py-4">
                                     <span class="text-amber-500 font-bold">{{ ticket.total_seats }}</span>
                                </td>
                                <td class="px-6 py-4 font-bold text-emerald-400">{{ ticket.price }} с.</td>
                                <td class="px-6 py-4">
                                    <button @click="deleteBusTicket(ticket.id)" class="text-red-400 hover:text-red-500 transition-colors text-sm font-bold">Удалить</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

             <!-- Reviews Section -->
             <section v-if="activeTab === 'reviews'" class="space-y-6 lg:space-y-8">
                <h2 class="text-2xl lg:text-3xl font-bold">Управление отзывами</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                    <div v-for="review in reviews" :key="review.id" class="bg-slate-800 p-5 lg:p-6 rounded-2xl lg:rounded-[32px] border border-slate-700 relative group">
                        <button @click="deleteReview(review.id)" class="absolute top-4 right-4 lg:top-6 lg:right-6 p-2 rounded-xl bg-red-500/10 text-red-500 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                            </svg>
                        </button>
                        <div class="flex items-center space-x-4 mb-4">
                            <div class="w-12 h-12 bg-slate-700 rounded-2xl flex items-center justify-center font-bold text-xl text-amber-500">
                                {{ review.reviewer_name?.[0] }}
                            </div>
                            <div>
                                <h4 class="font-bold">{{ review.reviewer_name }}</h4>
                                <p class="text-sm text-slate-500">Для водителя <span class="text-slate-300">{{ review.driver_name }}</span></p>
                            </div>
                        </div>
                        <div class="flex items-center space-x-1 text-amber-500 mb-3">
                            <span v-for="i in 5" :key="i" :class="i <= review.rating ? 'opacity-100' : 'opacity-20'">★</span>
                        </div>
                        <p class="text-slate-300 italic">"{{ review.comment }}"</p>
                    </div>
                </div>
            </section>

            <!-- User Edit Modal -->
            <div v-if="showUserEditModal" class="fixed inset-0 z-[110] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div class="max-w-md w-full bg-slate-800 p-8 rounded-[32px] border border-slate-700 shadow-2xl">
                    <h3 class="text-2xl font-bold mb-6">Редактировать пользователя</h3>
                    <div class="space-y-4">
                        <input v-model="editingUser.name" placeholder="Имя" class="w-full bg-slate-700 border border-slate-600 rounded-xl p-4 outline-none focus:border-amber-500" />
                        <input v-model="editingUser.surname" placeholder="Фамилия" class="w-full bg-slate-700 border border-slate-600 rounded-xl p-4 outline-none focus:border-amber-500" />
                        <input v-model="editingUser.phone" placeholder="Телефон" class="w-full bg-slate-700 border border-slate-600 rounded-xl p-4 outline-none focus:border-amber-500" />
                    </div>
                    <div class="flex space-x-4 mt-8">
                        <button @click="showUserEditModal = false" class="flex-1 py-4 text-slate-400 font-bold">Отмена</button>
                        <button @click="updateUser" class="flex-1 bg-amber-500 text-slate-900 py-4 rounded-xl font-bold shadow-lg">Сохранить</button>
                    </div>
                </div>
            </div>

            <!-- Ride Edit Modal -->
            <div v-if="showRideEditModal" class="fixed inset-0 z-[110] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div class="max-w-md w-full bg-slate-800 p-8 rounded-[32px] border border-slate-700 shadow-2xl">
                    <h3 class="text-2xl font-bold mb-6">Редактировать поездку</h3>
                    <div class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <input v-model="editingRide.from_city" placeholder="Откуда" class="w-full bg-slate-700 border border-slate-600 rounded-xl p-4 outline-none focus:border-amber-500" />
                            <input v-model="editingRide.to_city" placeholder="Куда" class="w-full bg-slate-700 border border-slate-600 rounded-xl p-4 outline-none focus:border-amber-500" />
                        </div>
                        <input v-model="editingRide.date" type="date" class="w-full bg-slate-700 border border-slate-600 rounded-xl p-4 outline-none focus:border-amber-500" />
                        <input v-model="editingRide.time" type="time" class="w-full bg-slate-700 border border-slate-600 rounded-xl p-4 outline-none focus:border-amber-500" />
                        <input v-model="editingRide.price" type="number" placeholder="Цена" class="w-full bg-slate-700 border border-slate-600 rounded-xl p-4 outline-none focus:border-amber-500" />
                    </div>
                    <div class="flex space-x-4 mt-8">
                        <button @click="showRideEditModal = false" class="flex-1 py-4 text-slate-400 font-bold">Отмена</button>
                        <button @click="updateRide" class="flex-1 bg-amber-500 text-slate-900 py-4 rounded-xl font-bold shadow-lg">Сохранить</button>
                    </div>
                </div>
            </div>

        </main>
    </div>
</template>

<style scoped>
.admin-panel {
    background-color: #0f172a;
}
/* Hide scrollbar for Chrome, Safari and Opera */
main::-webkit-scrollbar {
    display: none;
}
/* Hide scrollbar for IE, Edge and Firefox */
main {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>
