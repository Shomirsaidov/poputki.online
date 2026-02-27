<script>
import api from '../api';
import SeatSelector from '../components/SeatSelector.vue';
import AppModal from '../components/AppModal.vue';

export default {
    components: {
        SeatSelector,
        AppModal
    },
    data() {
        return {
            step: 1, // 1: Role selection, 2: Form, 3: Seat selection (driver only)
            rideRole: 'driver', // 'driver' or 'passenger'
            fromCity: '',
            toCity: '',
            fromAddress: '',
            toAddress: '',
            date: '',
            time: '',
            price: '',
            seats: 4,
            reservedSeats: [1], // Always include driver seat (seat 1)
            allows_delivery: false,
            hasVehicle: false,
            vehicleTotalSeats: 5,
            loading: false,
            errorMessage: '',
            modal: {
                show: false,
                title: '',
                message: '',
                type: 'info',
                onConfirm: null
            },
            availableCities: []
        }
    },
    async mounted() {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            this.$router.push('/auth');
            return;
        }
        const user = JSON.parse(userStr);
        // Check if user has vehicle
        try {
            const res = await api.get(`/users/${user.id}/vehicle`);
            this.hasVehicle = !!res.data;
            if (res.data) {
                this.vehicleTotalSeats = res.data.total_seats || 5;
                // Default passenger seats to total - 1
                this.seats = this.vehicleTotalSeats - 1;
            }
        } catch (e) {
            console.error(e);
        }
        this.fetchCities();
    },
    computed: {
        priceRange() {
            if ((this.fromCity === 'Хучанд' && this.toCity === 'Ойбек') || 
                (this.fromCity === 'Ойбек' && this.toCity === 'Хучанд')) {
                return { min: 40, max: 60 };
            }
            if ((this.fromCity === 'Хучанд' && this.toCity === 'Душанбе') || 
                (this.fromCity === 'Душанбе' && this.toCity === 'Хучанд')) {
                return { min: 100, max: 150 };
            }
            return null;
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
        selectRole(role) {
            if (role === 'driver' && !this.hasVehicle) {
                this.showAlert(
                    'Нужен автомобиль', 
                    'Для создания поездки в качестве водителя необходимо добавить данные автомобиля в профиле. Перейти в профиль?',
                    'warning',
                    () => { this.modal.show = false; this.$router.push('/profile'); }
                );
                return;
            }
            this.rideRole = role;
            this.step = 2;
        },
        proceedToSeatSelection() {
            // Validation
            const missing = [];
            if (!this.fromCity) missing.push('Откуда');
            if (!this.toCity) missing.push('Куда');
            if (!this.date) missing.push('Дата');
            if (!this.time) missing.push('Время');
            if (this.price === '') missing.push('Цена');

            if (missing.length > 0) {
                this.showAlert('Заполните поля', `Пожалуйста, заполните: ${missing.join(', ')}`, 'warning');
                return;
            }
            
            // Price Limit Check
            if (this.priceRange && this.price > this.priceRange.max) {
                 this.showAlert('Превышена цена', `Для маршрута ${this.fromCity} - ${this.toCity} максимальная цена составляет ${this.priceRange.max} с.`, 'warning');
                 return;
            }

            // Seats Check against Vehicle
            if (this.rideRole === 'driver' && this.seats >= this.vehicleTotalSeats) {
                this.showAlert('Превышена вместимость', `В вашем автомобиле всего ${this.vehicleTotalSeats} мест(а). Вы не можете указать ${this.seats} свободных мест.`, 'warning');
                return;
            }

            if (this.rideRole === 'driver') {
                this.step = 3;
            } else {
                this.createRide();
            }
        },
        async createRide() {
          const missing = [];
          if (!this.fromCity) missing.push('Откуда');
          if (!this.toCity) missing.push('Куда');
          if (!this.date) missing.push('Дата');
          if (!this.time) missing.push('Время');
          if (this.price === '') missing.push('Цена');

          if (missing.length > 0) {
              this.showAlert('Заполните поля', `Пожалуйста, заполните: ${missing.join(', ')}`, 'warning');
              return;
          }

          // Price Limit Check (Double check)
          if (this.priceRange && this.price > this.priceRange.max) {
                this.showAlert('Превышена цена', `Для маршрута ${this.fromCity} - ${this.toCity} максимальная цена составляет ${this.priceRange.max} с.`, 'warning');
                return;
          }

          // Reserved Seats Logic Check for Driver
          if (this.rideRole === 'driver') {
              const maxPassengerSeats = this.vehicleTotalSeats - 1;
              const actualFreeSeats = maxPassengerSeats - (this.reservedSeats.filter(id => id !== 1).length);
              
              if (actualFreeSeats !== this.seats) {
                  this.showAlert(
                    'Места не совпадают', 
                    `Вы указали ${this.seats} свободных мест, но на схеме отмечено ${actualFreeSeats}. Пожалуйста, отметьте ${maxPassengerSeats - this.seats} занятых мест(а) на схеме.`,
                    'warning'
                  );
                  return;
              }
          }

          const user = JSON.parse(localStorage.getItem('user'));
          
          try {
            const payload = {
              driver_id: user.id,
              from_city: this.fromCity,
              to_city: this.toCity,
              from_address: this.rideRole === 'driver' ? this.fromAddress : null,
              to_address: this.rideRole === 'driver' ? this.toAddress : null,
              date: this.date,
              time: this.time,
              price: parseInt(this.price),
              seats: this.seats,
              description: '',
              is_passenger_entry: this.rideRole === 'passenger',
              reserved_seats: this.rideRole === 'driver' ? this.reservedSeats : [],
              allows_delivery: this.allows_delivery,
              total_seats: this.rideRole === 'driver' ? this.vehicleTotalSeats : 5
            };
            this.loading = true;
            this.errorMessage = '';
            
            await api.post('/rides', payload);
            
            // Show success and redirect
            this.$router.push({ path: '/', query: { success: 'true', message: this.rideRole === 'driver' ? 'Поездка создана!' : 'Заявка создана!' } });
          } catch (err) {
            console.error(err);
            this.errorMessage = err.response?.data?.error || 'Ошибка при создании';
            window.scrollTo({ top: 0, behavior: 'smooth' });
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
}
</script>

<template>
  <div class="bg-gray-50 min-h-screen pb-32">
    <!-- Header -->
    <div class="bg-white p-6 pt-8 pb-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] sticky top-0 z-20 flex items-center">
       <button v-if="step === 2 || step === 3" @click="step = step - 1" class="mr-4 p-2 -ml-2 text-gray-400">
           <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
       </button>
       <div>
         <h1 class="text-2xl font-bold text-slate-800 tracking-tight">
           {{ step === 1 ? 'Создать поездку' : step === 2 ? (rideRole === 'driver' ? 'Я водитель' : 'Я пассажир') : 'Выберите места' }}
         </h1>
         <p class="text-sm text-gray-400 mt-1">
           {{ step === 1 ? 'Выберите вашу роль' : step === 2 ? 'Заполните детали маршрута' : 'Отметьте занятые места' }}
         </p>
       </div>
    </div>
     
     <!-- Error Message -->
     <transition name="fade">
       <div v-if="errorMessage" class="mx-6 mt-4 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start space-x-3 text-red-600">
         <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
           <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
         </svg>
         <div class="flex-1">
           <p class="text-sm font-bold">Ошибка</p>
           <p class="text-xs opacity-90">{{ errorMessage }}</p>
         </div>
         <button @click="errorMessage = ''" class="text-red-400 hover:text-red-600 transition-colors">
           <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
             <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
           </svg>
         </button>
       </div>
     </transition>

    <!-- Step 1: Role Selection -->
    <div v-if="step === 1" class="p-8 space-y-6 flex-1 flex flex-col justify-center min-h-[60vh]">
        <div class="grid grid-cols-1 gap-6">
            <button @click="selectRole('driver')" class="group p-8 rounded-[32px] border-2 border-gray-100 bg-white hover:border-yellow-400 transition-all flex items-center space-x-6 text-left relative overflow-hidden">
                <div class="absolute inset-0 bg-yellow-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div class="w-16 h-16 rounded-2xl bg-yellow-100 text-yellow-600 flex items-center justify-center text-3xl z-10">🚗</div>
                <div class="z-10">
                    <h3 class="font-bold text-xl text-slate-800">Я Водитель</h3>
                    <p class="text-slate-500 text-sm mt-1">У меня есть машина и я ищу попутчиков</p>
                </div>
                <div v-if="!hasVehicle" class="absolute top-4 right-4 bg-orange-100 text-orange-600 text-[10px] font-bold px-2 py-1 rounded-lg">Нужно авто</div>
            </button>

             <button @click="selectRole('passenger')" class="group p-8 rounded-[32px] border-2 border-gray-100 bg-white hover:border-yellow-400 transition-all flex items-center space-x-6 text-left relative overflow-hidden">
                 <div class="absolute inset-0 bg-yellow-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div class="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-3xl z-10">👋</div>
                <div class="z-10">
                    <h3 class="font-bold text-xl text-slate-800">Я Пассажир</h3>
                    <p class="text-slate-500 text-sm mt-1">Ищу машину, чтобы доехать до места</p>
                </div>
            </button>
        </div>
    </div>

    <!-- Step 2: Form -->
    <div v-if="step === 2" class="p-6 space-y-6 max-w-lg mx-auto">
      
      <!-- Route Section -->
      <section class="space-y-4">
        <label class="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Маршрут</label>
        <div class="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group focus-within:ring-2 focus-within:ring-yellow-500/20 transition-all">
          <div class="absolute left-6 top-5 bottom-5 w-0.5 bg-gray-100"></div>
          
          <div class="relative flex items-center p-3 border-b border-gray-50">
             <div class="w-3 h-3 rounded-full border-[3px] border-yellow-500 bg-white ml-2 mr-4 z-10 shrink-0"></div>
             <select v-model="fromCity" class="w-full text-lg font-medium text-slate-700 outline-none bg-transparent appearance-none cursor-pointer pr-8">
               <option value="" disabled selected>Откуда</option>
               <option v-for="city in availableCities" :key="'from-'+city" :value="city">{{ city }}</option>
             </select>
             <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
               <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
               </svg>
             </div>
          </div>
          
          <div class="relative flex items-center p-3">
             <div class="w-3 h-3 rounded-full border-[3px] border-slate-300 bg-white ml-2 mr-4 z-10 shrink-0"></div>
             <select v-model="toCity" class="w-full text-lg font-medium text-slate-700 outline-none bg-transparent appearance-none cursor-pointer pr-8">
                <option value="" disabled selected>Куда</option>
                <option v-for="city in availableCities" :key="'to-'+city" :value="city">{{ city }}</option>
              </select>
             <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
               <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
               </svg>
             </div>
          </div>
          </div>

        
        <!-- Exact Address for Driver -->
        <div v-if="rideRole === 'driver'" class="space-y-4 pt-2">
            <div class="space-y-1">
                <label class="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Точный адрес отправления</label>
                <input v-model="fromAddress" placeholder="Улица, дом, ориентир" class="w-full bg-white p-4 rounded-2xl shadow-sm border border-gray-100 outline-none text-slate-700 font-medium text-sm focus:border-yellow-400 transition-all" />
            </div>
            <div class="space-y-1">
                <label class="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Точный адрес прибытия</label>
                <input v-model="toAddress" placeholder="Улица, дом, ориентир" class="w-full bg-white p-4 rounded-2xl shadow-sm border border-gray-100 outline-none text-slate-700 font-medium text-sm focus:border-yellow-400 transition-all" />
            </div>
        </div>
      </section>

      <!-- Date & Time -->
      <section class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
           <label class="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Дата</label>
           <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center transition-all focus-within:border-yellow-400">
             <input v-model="date" type="date" class="w-full bg-transparent outline-none text-slate-700 font-medium text-sm" />
           </div>
        </div>
        <div class="space-y-2">
           <label class="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Время</label>
           <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center transition-all focus-within:border-yellow-400">
             <input v-model="time" type="time" class="w-full bg-transparent outline-none text-slate-700 font-medium text-sm" />
           </div>
        </div>
      </section>

      <!-- Price & Seats -->
       <section class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-6">
         <div class="pb-4 border-b border-gray-50">
            <div class="flex justify-between items-center">
               <span class="text-slate-600 font-medium">Предлагаемая цена</span>
               <div class="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-xl">
                 <input v-model="price" type="number" placeholder="0" class="w-16 text-right bg-transparent outline-none font-bold text-slate-800 text-lg" />
                 <span class="text-gray-400 font-medium">с.</span>
               </div>
            </div>
            <div v-if="priceRange" class="mt-2 text-right">
                <p class="text-xs text-gray-500">
                    Рекомендуемая цена: <span class="font-bold text-slate-700">{{ priceRange.min }} - {{ priceRange.max }} с.</span>
                </p>
                <p v-if="price > priceRange.max" class="text-xs text-red-500 font-bold mt-1">
                    Цена не может превышать {{ priceRange.max }} с.
                </p>
            </div>
         </div>
        
        <div v-if="rideRole === 'driver'" class="flex justify-between items-center">
           <span class="text-slate-600 font-medium">Количество мест</span>
            <div class="flex items-center space-x-4 bg-gray-50 p-1.5 rounded-xl">
              <button @click="seats > 1 && seats--" class="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-600 hover:bg-gray-100 active:scale-90 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" /></svg>
              </button>
              <span class="font-bold w-6 text-center text-lg text-slate-800">{{ seats }}</span>
               <button @click="seats < (vehicleTotalSeats - 1) && seats++" class="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-600 hover:bg-gray-100 active:scale-90 transition-all">
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" /></svg>
               </button>
            </div>
        </div>

        <!-- Delivery Option -->
        <div class="flex justify-between items-center pt-4 border-t border-gray-50">
            <div class="flex flex-col">
              <span class="text-slate-600 font-medium">Принимаю посылки</span>
              <span class="text-xs text-gray-400">Могу взять документы или пакеты</span>
            </div>
            <button 
              @click="allows_delivery = !allows_delivery" 
              class="w-14 h-8 rounded-full transition-colors relative"
              :class="allows_delivery ? 'bg-yellow-400' : 'bg-gray-200'"
            >
              <div 
                class="absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm"
                :class="allows_delivery ? 'left-7' : 'left-1'"
              ></div>
            </button>
        </div>
      </section>

      <button 
        @click="proceedToSeatSelection" 
        class="w-full bg-gradient-to-r from-yellow-400 to-amber-500 text-white font-bold py-5 rounded-2xl shadow-lg shadow-amber-500/30 mt-6 active:scale-[0.98] transition-all hover:shadow-xl hover:-translate-y-1 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="loading"
      >
        <span v-if="loading" class="flex items-center space-x-2">
            <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Обработка...</span>
        </span>
        <span v-else>{{ rideRole === 'driver' ? 'Далее' : 'Подать заявку' }}</span>
        <svg v-if="!loading" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </button>
    </div>

    <!-- Step 3: Seat Selection (Driver only) -->
    <div v-if="step === 3" class="p-6 space-y-6 max-w-lg mx-auto">
      <SeatSelector 
        v-model="reservedSeats" 
        mode="reserve"
        :totalSeats="vehicleTotalSeats"
      />

      <button 
        @click="createRide" 
        class="w-full bg-gradient-to-r from-yellow-400 to-amber-500 text-white font-bold py-5 rounded-2xl shadow-lg shadow-amber-500/30 mt-6 active:scale-[0.98] transition-all hover:shadow-xl hover:-translate-y-1 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="loading"
      >
        <span v-if="loading" class="flex items-center space-x-2">
            <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Публикация...</span>
        </span>
        <span v-else>Опубликовать поездку</span>
        <svg v-if="!loading" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </button>
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
