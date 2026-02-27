<script>
import api from '../api';

export default {
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
            error: '',
            mobileMenuOpen: false
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
            if (confirm('Удалить пользователя навсегда?')) {
                await api.delete(`/admin/users/${id}`);
                this.fetchUsers();
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
            } catch (e) { alert('Ошибка при довалении города'); }
        },
        async deleteCity(id) {
            if (confirm('Удалить город?')) {
                await api.delete(`/admin/cities/${id}`);
                this.fetchCities();
            }
        }
    },
    watch: {
        activeTab(newTab) {
            if (newTab === 'dashboard') this.fetchDashboardData();
            if (newTab === 'users') this.fetchUsers();
            if (newTab === 'rides') this.fetchRides();
            if (newTab === 'bus-tickets') this.fetchBusTickets();
            if (newTab === 'reviews') this.fetchReviews();
            if (newTab === 'cities') this.fetchCities();
        }
    }
}
</script>

<template>
    <div class="admin-panel h-screen bg-slate-900 text-slate-100 flex overflow-hidden font-sans">
        <!-- Mobile Header (Visible only on mobile) -->
        <div class="xl:hidden fixed top-0 inset-x-0 z-40 bg-slate-800 border-b border-slate-700 p-4 flex justify-between items-center">
            <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-slate-900 font-black text-lg">P</div>
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
            class="xl:w-72 bg-slate-800 border-r border-slate-700 flex flex-col pt-8 fixed xl:relative inset-y-0 left-0 z-30 transition-transform transform xl:translate-x-0 w-64"
            :class="mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'"
        >
            <div class="px-8 mb-12">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-slate-900 font-black text-xl">P</div>
                    <span class="text-xl font-bold tracking-tight">Poputki Admin</span>
                </div>
            </div>

            <nav class="flex-1 px-4 space-y-2 overflow-y-auto">
                <button 
                    v-for="item in ['dashboard', 'users', 'rides', 'bus-tickets', 'reviews', 'cities']" 
                    :key="item"
                    @click="activeTab = item; mobileMenuOpen = false"
                    class="w-full px-4 py-3 rounded-xl flex items-center space-x-3 transition-all group"
                    :class="activeTab === item ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-100'"
                >
                    <span class="capitalize">{{ item.replace('-', ' ') }}</span>
                </button>
            </nav>

            <div class="p-6 border-t border-slate-700">
                <button @click="isAuthenticated = false" class="text-xs text-slate-500 hover:text-red-400 transition-colors">Выйти из сессии</button>
            </div>
        </aside>

        <!-- Main Content -->
        <main class="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-6 lg:p-10 pt-20 xl:pt-10 w-full overflow-x-hidden">
            
            <!-- Dashboard Section -->
            <section v-if="activeTab === 'dashboard'" class="space-y-6 lg:space-y-10">
                <div class="flex justify-between items-end">
                    <div>
                        <h2 class="text-4xl font-bold">Дашборд</h2>
                        <p class="text-slate-500 mt-2">Обзор ключевых показателей платформы</p>
                    </div>
                </div>

                <div v-if="stats" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    <div class="bg-slate-800 p-6 lg:p-8 rounded-2xl lg:rounded-[32px] border border-slate-700">
                        <p class="text-slate-400 text-xs lg:text-sm font-medium uppercase tracking-wider mb-2">Пользователи</p>
                        <h3 class="text-3xl lg:text-4xl font-black">{{ stats.totalUsers }}</h3>
                    </div>
                    <div class="bg-slate-800 p-6 lg:p-8 rounded-2xl lg:rounded-[32px] border border-slate-700">
                        <p class="text-slate-400 text-xs lg:text-sm font-medium uppercase tracking-wider mb-2">Активные поездки</p>
                        <h3 class="text-3xl lg:text-4xl font-black text-amber-500">{{ stats.activeRides }}</h3>
                    </div>
                    <div class="bg-slate-800 p-6 lg:p-8 rounded-2xl lg:rounded-[32px] border border-slate-700">
                        <p class="text-slate-400 text-xs lg:text-sm font-medium uppercase tracking-wider mb-2">Бронирование шин</p>
                        <h3 class="text-3xl lg:text-4xl font-black">{{ stats.totalBusBookings }}</h3>
                    </div>
                    <div class="bg-slate-800 p-6 lg:p-8 rounded-2xl lg:rounded-[32px] border border-slate-700">
                        <p class="text-slate-400 text-xs lg:text-sm font-medium uppercase tracking-wider mb-2">Выручка (автобусы)</p>
                        <h3 class="text-3xl lg:text-4xl font-black text-emerald-500">{{ stats.revenue }} с.</h3>
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
                        <h4 class="text-lg lg:text-xl font-bold mb-4 lg:mb-6">Популярные направления</h4>
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
                                <th class="px-6 py-4 text-slate-400 font-medium">Роль</th>
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
                                <td class="px-6 py-4">
                                    <span :class="user.role === 'driver' ? 'text-blue-400' : 'text-purple-400'" class="font-medium capitalize">{{ user.role }}</span>
                                </td>
                                <td class="px-6 py-4 text-right">
                                    <button @click="deleteUser(user.id)" class="text-red-400 hover:text-red-500 font-bold text-sm">Удалить</button>
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
                                <td class="px-6 py-4 text-right">
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
                    <button class="bg-amber-500 text-slate-900 px-6 py-2 rounded-xl font-bold shadow-lg shadow-amber-500/20 w-full sm:w-auto" @click="$router.push('/create-bus-ticket')">Добавить рейс</button>
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
