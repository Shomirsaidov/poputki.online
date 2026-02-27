<script>
import api from '../api';

const CITIES = [];

export default {
    name: 'CreateBusTicketView',
    data() {
        return {
            user: JSON.parse(localStorage.getItem('user') || 'null'),
            loading: false,
            form: {
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
                total_seats: 44
            },
            errors: {},
            success: false,
            availableCities: []
        };
    },
    async mounted() {
        this.fetchCities();
    },
    computed: {
        cities() { return this.availableCities; }
    },
    methods: {
        validate() {
            const e = {};
            if (!this.form.transport_company.trim()) e.transport_company = 'Укажите компанию';
            if (!this.form.from_city) e.from_city = 'Укажите город отправления';
            if (!this.form.from_address.trim()) e.from_address = 'Укажите место отправления';
            if (!this.form.to_city) e.to_city = 'Укажите город прибытия';
            if (!this.form.to_address.trim()) e.to_address = 'Укажите место прибытия';
            if (!this.form.departure_date) e.departure_date = 'Укажите дату отправления';
            if (!this.form.departure_time) e.departure_time = 'Укажите время отправления';
            if (!this.form.arrival_date) e.arrival_date = 'Укажите дату прибытия';
            if (!this.form.arrival_time) e.arrival_time = 'Укажите время прибытия';
            if (!this.form.duration_minutes || this.form.duration_minutes <= 0) e.duration_minutes = 'Укажите длительность';
            if (!this.form.price || this.form.price <= 0) e.price = 'Укажите цену';
            if (!this.form.total_seats || this.form.total_seats < 1) e.total_seats = 'Укажите количество мест';
            this.errors = e;
            return Object.keys(e).length === 0;
        },
        async submit() {
            if (!this.validate()) return;
            this.loading = true;
            try {
                await api.post('/bus-tickets', {
                    ...this.form,
                    operator_id: this.user.id,
                    duration_minutes: Number(this.form.duration_minutes),
                    price: Number(this.form.price),
                    total_seats: Number(this.form.total_seats)
                });
                this.success = true;
                setTimeout(() => {
                    this.$router.push({ name: 'home', query: { tab: 'bus', success: 'true', message: 'Рейс создан!' } });
                }, 1500);
            } catch (e) {
                this.errors.submit = e.response?.data?.error || 'Ошибка при создании';
            } finally {
                this.loading = false;
            }
        },
        async fetchCities() {
            try {
                const res = await api.get('/cities');
                this.availableCities = res.data;
            } catch (err) {
                console.error('Failed to fetch cities:', err);
            }
        }
    }
};
</script>

<template>
    <div class="min-h-screen bg-slate-50 pb-28">
        <!-- Header -->
        <div class="bg-gradient-to-br from-blue-600 to-indigo-700 px-6 pt-14 pb-8 rounded-b-[36px] shadow-lg shadow-indigo-500/20 relative overflow-hidden">
            <div class="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <button @click="$router.back()" class="absolute top-6 left-6 w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white z-10 active:scale-90 transition-transform">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <h1 class="text-2xl font-bold text-white relative z-10">Создать рейс автобуса</h1>
            <p class="text-white/70 text-sm mt-1 relative z-10">Заполните информацию о маршруте</p>
        </div>

        <!-- Success overlay -->
        <Transition name="fade">
            <div v-if="success" class="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm">
                <div class="text-center">
                    <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg class="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    <h2 class="text-2xl font-bold text-slate-800">Рейс создан!</h2>
                    <p class="text-gray-500 mt-2">Перенаправление...</p>
                </div>
            </div>
        </Transition>

        <div class="px-5 py-6 space-y-5">
            <!-- Company -->
            <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Транспортная компания</label>
                <input v-model="form.transport_company" type="text" placeholder='ТК "ВолгаЛайн"'
                    class="w-full px-4 py-3 bg-slate-50 rounded-xl border text-slate-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all font-medium"
                    :class="errors.transport_company ? 'border-red-300' : 'border-gray-200'"/>
                <p v-if="errors.transport_company" class="text-red-500 text-xs mt-1.5">{{ errors.transport_company }}</p>
            </div>

            <!-- From -->
            <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
                <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider">Отправление</label>
                <select v-model="form.from_city" class="w-full px-4 py-3 bg-slate-50 rounded-xl border text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all font-medium appearance-none cursor-pointer" :class="errors.from_city ? 'border-red-300' : 'border-gray-200'">
                    <option value="" disabled>Город отправления</option>
                    <option v-for="c in cities" :key="c" :value="c">{{ c }}</option>
                </select>
                <p v-if="errors.from_city" class="text-red-500 text-xs">{{ errors.from_city }}</p>
                <input v-model="form.from_address" type="text" placeholder="Автовокзал, точный адрес"
                    class="w-full px-4 py-3 bg-slate-50 rounded-xl border text-slate-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all font-medium"
                    :class="errors.from_address ? 'border-red-300' : 'border-gray-200'"/>
                <p v-if="errors.from_address" class="text-red-500 text-xs">{{ errors.from_address }}</p>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <input v-model="form.departure_date" type="date" class="w-full px-3 py-3 bg-slate-50 rounded-xl border border-gray-200 text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all text-sm" :class="errors.departure_date ? 'border-red-300' : ''"/>
                        <p v-if="errors.departure_date" class="text-red-500 text-xs mt-1">{{ errors.departure_date }}</p>
                    </div>
                    <div>
                        <input v-model="form.departure_time" type="time" class="w-full px-3 py-3 bg-slate-50 rounded-xl border border-gray-200 text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all text-sm" :class="errors.departure_time ? 'border-red-300' : ''"/>
                        <p v-if="errors.departure_time" class="text-red-500 text-xs mt-1">{{ errors.departure_time }}</p>
                    </div>
                </div>
            </div>

            <!-- To -->
            <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
                <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider">Прибытие</label>
                <select v-model="form.to_city" class="w-full px-4 py-3 bg-slate-50 rounded-xl border text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all font-medium appearance-none cursor-pointer" :class="errors.to_city ? 'border-red-300' : 'border-gray-200'">
                    <option value="" disabled>Город прибытия</option>
                    <option v-for="c in cities" :key="c" :value="c">{{ c }}</option>
                </select>
                <p v-if="errors.to_city" class="text-red-500 text-xs">{{ errors.to_city }}</p>
                <input v-model="form.to_address" type="text" placeholder="Автовокзал, точный адрес"
                    class="w-full px-4 py-3 bg-slate-50 rounded-xl border text-slate-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all font-medium"
                    :class="errors.to_address ? 'border-red-300' : 'border-gray-200'"/>
                <p v-if="errors.to_address" class="text-red-500 text-xs">{{ errors.to_address }}</p>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <input v-model="form.arrival_date" type="date" class="w-full px-3 py-3 bg-slate-50 rounded-xl border border-gray-200 text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all text-sm" :class="errors.arrival_date ? 'border-red-300' : ''"/>
                        <p v-if="errors.arrival_date" class="text-red-500 text-xs mt-1">{{ errors.arrival_date }}</p>
                    </div>
                    <div>
                        <input v-model="form.arrival_time" type="time" class="w-full px-3 py-3 bg-slate-50 rounded-xl border border-gray-200 text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all text-sm" :class="errors.arrival_time ? 'border-red-300' : ''"/>
                        <p v-if="errors.arrival_time" class="text-red-500 text-xs mt-1">{{ errors.arrival_time }}</p>
                    </div>
                </div>
            </div>

            <!-- Duration, Price, Seats -->
            <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
                <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider">Параметры рейса</label>
                <div>
                    <label class="text-sm text-gray-600 font-medium mb-1 block">Длительность (минуты)</label>
                    <input v-model="form.duration_minutes" type="number" min="1" placeholder="540 (9 часов)"
                        class="w-full px-4 py-3 bg-slate-50 rounded-xl border text-slate-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all font-medium"
                        :class="errors.duration_minutes ? 'border-red-300' : 'border-gray-200'"/>
                    <p v-if="errors.duration_minutes" class="text-red-500 text-xs mt-1">{{ errors.duration_minutes }}</p>
                </div>
                <div>
                    <label class="text-sm text-gray-600 font-medium mb-1 block">Цена за пассажира (с.)</label>
                    <input v-model="form.price" type="number" min="1" placeholder="1500"
                        class="w-full px-4 py-3 bg-slate-50 rounded-xl border text-slate-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all font-medium"
                        :class="errors.price ? 'border-red-300' : 'border-gray-200'"/>
                    <p v-if="errors.price" class="text-red-500 text-xs mt-1">{{ errors.price }}</p>
                </div>
                <div>
                    <label class="text-sm text-gray-600 font-medium mb-1 block">Количество мест</label>
                    <input v-model="form.total_seats" type="number" min="1" max="100" placeholder="44"
                        class="w-full px-4 py-3 bg-slate-50 rounded-xl border text-slate-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all font-medium"
                        :class="errors.total_seats ? 'border-red-300' : 'border-gray-200'"/>
                    <p v-if="errors.total_seats" class="text-red-500 text-xs mt-1">{{ errors.total_seats }}</p>
                </div>
            </div>

            <!-- Error -->
            <div v-if="errors.submit" class="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm font-medium">
                {{ errors.submit }}
            </div>

            <!-- Submit -->
            <button
                @click="submit"
                :disabled="loading"
                class="w-full py-4 rounded-2xl font-bold text-lg transition-all bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
            >
                <span v-if="loading" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>{{ loading ? 'Создаём...' : 'Создать рейс' }}</span>
            </button>
        </div>
    </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
