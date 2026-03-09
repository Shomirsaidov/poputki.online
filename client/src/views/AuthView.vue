<script>
import api from '../api';
import AppModal from '../components/AppModal.vue';
import { getTelegramUser, getTelegramInitData } from '../telegram';

export default {
  components: {
    AppModal
  },
  data() {
    return {
      step: 1, // 1: Phone, 2: Profile
      phone: '',
      needsPhone: false,
      registration: {
        id: null,
        name: '',
        age: '',
        phone: ''
      },
      loading: false,
      modal: {
        show: false,
        title: '',
        message: '',
        type: 'info'
      }
    };
  },
  computed: {
    tgUser() {
      return getTelegramUser();
    },
    tgName() {
      return this.tgUser?.first_name || '';
    }
  },
  async mounted() {
    this.syncTelegram();
    
    if (this.$route.query.tg_complete === '1') {
        const userStr = localStorage.getItem('user');
        if (userStr) {
           const user = JSON.parse(userStr);
           this.registration.id = user.id;
           this.registration.name = user.name || '';
           this.needsPhone = !user.phone;
           this.step = 2;
        }
    }
  },
  methods: {
    async syncTelegram() {
      if (!this.tgUser) return;

      const user = JSON.parse(localStorage.getItem('user') || 'null');
      
      try {
        const res = await api.post('/auth/telegram-login', {
          id: this.tgUser.id,
          first_name: this.tgUser.first_name,
          last_name: this.tgUser.last_name,
          username: this.tgUser.username,
          photo_url: this.tgUser.photo_url,
          userId: user?.id, // Pass existing ID to link if available
          initData: getTelegramInitData() // Send raw string for backend verification
        });

        if (res.data.user) {
          localStorage.setItem('user', JSON.stringify(res.data.user));
          if (res.data.token) localStorage.setItem('token', res.data.token);
          
          // Re-update registration if we are in step 2
          if (this.step === 2) {
             this.registration.id = res.data.user.id;
             this.registration.name = res.data.user.name || this.registration.name;
          }
        }
      } catch (e) {
        console.error("Sync TG error:", e);
      }
    },
    showAlert(title, message, type = 'info') {
      this.modal.title = title;
      this.modal.message = message;
      this.modal.type = type;
      this.modal.show = true;
    },
    async handleLogin() {
      // Normalize phone: keep only + and digits
      const cleanPhone = this.phone.replace(/[^\d+]/g, '');
      if (!cleanPhone || cleanPhone.length < 5) {
        this.showAlert('Внимание', 'Пожалуйста, введите корректный номер телефона', 'warning');
        return;
      }
      
      this.loading = true;
      try {
        const res = await api.post('/auth/login', { 
           phone: cleanPhone 
        });
        
        if (res.data.user.isNew) {
            this.registration.id = res.data.user.id;
            this.step = 2;
        } else {
            this.completeAuth(res.data.user, res.data.token);
        }
      } catch (e) {
        console.error('Login error:', e);
        const errorMsg = e.response?.data?.error || 'Ошибка входа. Пожалуйста, попробуйте позже.';
        this.showAlert('Ошибка', errorMsg, 'error');
      } finally {
        this.loading = false;
      }
    },
    async handleRegister() {
        if (!this.registration.name || !this.registration.age || (this.needsPhone && !this.registration.phone)) {
            this.showAlert('Заполните поля', 'Пожалуйста, заполните все обязательные поля', 'warning');
            return;
        }
        
        let cleanedPhone = this.registration.phone;
        if (this.needsPhone) {
             cleanedPhone = cleanedPhone.replace(/[^\d+]/g, '');
             if (!cleanedPhone || cleanedPhone.length < 5) {
                 this.showAlert('Внимание', 'Пожалуйста, введите корректный номер телефона', 'warning');
                 return;
             }
        }

        this.loading = true;
        try {
            const payload = { ...this.registration, phone: cleanedPhone };
            const res = await api.post('/auth/register', payload);
            this.completeAuth(res.data.user, localStorage.getItem('token') || ('mock-token-' + res.data.user.id));
        } catch (e) {
            this.showAlert('Ошибка', 'Ошибка регистрации', 'error');
        } finally {
            this.loading = false;
        }
    },
    completeAuth(user, token) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // If it's a bus driver, go to bus-admin, else go home
        if (user.role === 'bus_driver') {
            this.$router.push({ name: 'bus-admin' });
        } else {
            this.$router.push({ name: 'search' });
        }
    }
  }
}
</script>

<template>
  <div class="min-h-screen bg-white flex flex-col relative overflow-hidden">
    <!-- Background Decor -->
    <div class="absolute top-0 right-0 w-64 h-64 bg-yellow-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
    <div class="absolute -bottom-32 -left-32 w-64 h-64 bg-orange-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

    <div class="flex-1 flex flex-col justify-center p-8 relative z-10">
      <div v-if="step === 1">
        <div class="mb-8">
           <div class="w-16 h-16 bg-yellow-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-yellow-500/30 transform -rotate-6">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
           </div>
           <h1 class="text-4xl font-bold text-slate-900 mb-3 tracking-tight">
             Салом{{ tgName ? ', ' + tgName : '' }}!
           </h1>
           <p class="text-slate-500 text-lg">Введите ваш номер телефона</p>
        </div>

        <div class="space-y-6">
          <label class="block space-y-2 group">
             <span class="text-sm font-bold text-slate-400 uppercase tracking-wider ml-1 group-focus-within:text-yellow-500 transition-colors">Номер телефона</span>
             <div class="relative">
               <input v-model="phone" type="tel" placeholder="+ (Код) Номер телефона" class="w-full bg-gray-50 border-2 border-transparent focus:border-yellow-400/50 focus:bg-white rounded-2xl p-4 text-xl font-bold outline-none transition-all placeholder-gray-300 text-slate-800" />
               <div class="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" v-if="phone.length > 8">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
               </div>
             </div>
          </label>
          
          <button @click="handleLogin" :disabled="loading" class="w-full bg-slate-900 text-white font-bold py-5 rounded-2xl shadow-xl shadow-slate-900/20 active:scale-[0.98] transition-all hover:-translate-y-1 hover:shadow-2xl disabled:opacity-70 disabled:transform-none mt-4 flex items-center justify-center space-x-2">
            <span v-if="!loading">Войти</span>
            <span v-else class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            <svg v-if="!loading" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </button>
        </div>
      </div>

      <div v-else-if="step === 2" class="space-y-6">
        <div class="mb-4">
           <h2 class="text-3xl font-bold text-slate-900 mb-2">О себе</h2>
           <p class="text-slate-500">Заполните данные для профиля</p>
        </div>

        <div class="space-y-4">
            <input v-model="registration.name" placeholder="Имя (ФИО)" class="w-full bg-gray-50 border-2 border-transparent focus:border-yellow-400 rounded-2xl p-4 text-lg font-bold outline-none transition-all" />
            <input v-model="registration.age" type="number" placeholder="Возраст" class="w-full bg-gray-50 border-2 border-transparent focus:border-yellow-400 rounded-2xl p-4 text-lg font-bold outline-none transition-all" />
            <input v-if="needsPhone" v-model="registration.phone" type="tel" placeholder="+ (Код) Номер телефона" class="w-full bg-gray-50 border-2 border-transparent focus:border-yellow-400 rounded-2xl p-4 text-lg font-bold outline-none transition-all" />
        </div>

        <button @click="handleRegister" :disabled="loading" class="w-full bg-yellow-500 text-white font-bold py-5 rounded-2xl shadow-xl shadow-yellow-500/20 active:scale-[0.98] transition-all hover:-translate-y-1 mt-4">
            <span v-if="!loading">Завершить регистрацию</span>
            <span v-else class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block"></span>
        </button>
      </div>

      <p class="text-center text-gray-400 text-sm mt-8">
          Продолжая, вы соглашаетесь с <a href="#" class="text-slate-800 font-bold hover:text-yellow-500 transition-colors">правилами сервиса</a>
      </p>
    </div>

    <!-- Custom Modal -->
    <AppModal 
        :show="modal.show" 
        :title="modal.title" 
        :message="modal.message" 
        :type="modal.type"
        @confirm="modal.show = false"
        @close="modal.show = false"
    />
  </div>
</template>
