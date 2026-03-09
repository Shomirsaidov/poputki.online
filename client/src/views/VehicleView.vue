<script>
import api from '../api';
import AppModal from '../components/AppModal.vue';

export default {
    components: {
        AppModal
    },
    data() {
        return {
            form: {
                make: '',
                model: '',
                plate_number: '',
                total_seats: 5
            },
            modal: {
                show: false,
                title: '',
                message: '',
                type: 'info',
                onConfirm: () => { this.modal.show = false; }
            },
            loading: false,
            initialLoading: true
        };
    },
    async mounted() {
        // Check if editing existing vehicle
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            this.$router.push('/auth');
            return;
        }
        
        try {
            const res = await api.get(`/users/${user.id}/vehicle`);
            if (res.data) {
                this.form = {
                    ...res.data,
                    total_seats: res.data.total_seats || 5
                };
            }
        } catch (e) {
            console.error(e);
        } finally {
            this.initialLoading = false;
        }
    },
    methods: {
        showAlert(title, message, type = 'info', onConfirm = null) {
            this.modal.title = title;
            this.modal.message = message;
            this.modal.type = type;
            this.modal.onConfirm = onConfirm || (() => { this.modal.show = false; });
            this.modal.show = true;
        },
        async save() {
            if (!this.form.make || !this.form.model || !this.form.plate_number) {
                this.showAlert('Внимание', 'Пожалуйста, заполните все поля', 'warning');
                return;
            }
            
            const user = JSON.parse(localStorage.getItem('user'));
            this.loading = true;
            try {
                await api.post('/users/vehicle', {
                    user_id: user.id,
                    ...this.form
                });
                this.showAlert('Успешно', 'Транспорт успешно сохранен!', 'success', () => {
                    this.modal.show = false;
                    this.$router.back();
                });
            } catch (e) {
                console.error('Vehicle save error:', e);
                const errorMsg = e.response?.data?.error || 'Ошибка при сохранении';
                this.showAlert('Ошибка', errorMsg, 'error');
            } finally {
                this.loading = false;
            }
        }
    }
}
</script>

<template>
    <div class="bg-gray-50 min-h-screen pb-10">
        <!-- Header -->
        <div class="bg-white p-6 pt-8 pb-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] sticky top-0 z-20 flex items-center">
            <button @click="$router.back()" class="mr-4 p-2 -ml-2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div>
                <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Мой транспорт</h1>
                <p class="text-sm text-gray-400 mt-1">Добавьте или измените данные</p>
            </div>
        </div>

        <div class="p-6 max-w-lg mx-auto space-y-6">
            <div v-if="initialLoading" class="animate-pulse space-y-4">
                <div class="h-12 bg-gray-200 rounded-2xl"></div>
                <div class="h-12 bg-gray-200 rounded-2xl"></div>
                <div class="h-12 bg-gray-200 rounded-2xl"></div>
            </div>

            <div v-else class="space-y-6">
                 <div class="space-y-2">
                    <label class="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Марка автомобиля</label>
                    <input v-model="form.make" placeholder="Toyota" class="w-full bg-white border border-gray-100 focus:border-yellow-400 rounded-2xl p-4 text-lg font-bold outline-none transition-all shadow-sm text-slate-800 placeholder-gray-300" />
                </div>

                <div class="space-y-2">
                     <label class="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Модель</label>
                    <input v-model="form.model" placeholder="Camry" class="w-full bg-white border border-gray-100 focus:border-yellow-400 rounded-2xl p-4 text-lg font-bold outline-none transition-all shadow-sm text-slate-800 placeholder-gray-300" />
                </div>

                <div class="space-y-2">
                     <label class="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Гос. номер</label>
                     <div class="relative">
                        <input v-model="form.plate_number" placeholder="0000 AA 00" class="w-full bg-white border border-gray-100 focus:border-yellow-400 rounded-2xl p-4 pl-12 text-lg font-bold outline-none transition-all shadow-sm text-slate-800 placeholder-gray-300 uppercase" maxlength="10" />
                         <div class="absolute left-4 top-1/2 -translate-y-1/2 bg-gray-100 text-gray-500 font-bold text-xs px-1.5 py-0.5 rounded">TJ</div>
                     </div>
                     <p class="text-xs text-gray-400 ml-1">Введите номер в формате 0000 AA 00</p>
                </div>

                <div class="space-y-2">
                     <label class="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Количество мест (включая водителя)</label>
                     <div class="flex items-center space-x-4 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                         <button @click="form.total_seats > 2 && form.total_seats--" class="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-slate-600 hover:bg-gray-100 active:scale-90 transition-all">
                             <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" /></svg>
                         </button>
                         <div class="flex-1 text-center">
                             <span class="text-2xl font-bold text-slate-800">{{ form.total_seats }}</span>
                             <span class="text-gray-400 ml-1">мест</span>
                         </div>
                         <button @click="form.total_seats < 10 && form.total_seats++" class="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-slate-600 hover:bg-gray-100 active:scale-90 transition-all">
                             <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                         </button>
                     </div>
                </div>

                <button @click="save" :disabled="loading" class="w-full bg-slate-900 text-white font-bold py-5 rounded-2xl shadow-xl shadow-slate-900/20 active:scale-[0.98] transition-all hover:-translate-y-1 mt-8">
                    <span v-if="!loading">Сохранить автомобиль</span>
                     <span v-else class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block"></span>
                </button>
            </div>
        </div>

        <!-- Custom Modal -->
        <AppModal 
            :show="modal.show" 
            :title="modal.title" 
            :message="modal.message" 
            :type="modal.type"
            @confirm="modal.onConfirm"
            @close="modal.show = false"
        />
    </div>
</template>
