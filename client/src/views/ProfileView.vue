<script>
import api from '../api';

export default {
    data() {
        return {
            user: null,
            vehicle: null
        }
    },
    async mounted() {
        const u = localStorage.getItem('user');
        if (u) {
            this.user = JSON.parse(u);
            await this.fetchVehicle();
        } else {
            this.$router.push('/auth');
        }
    },
    methods: {
        async fetchVehicle() {
            try {
                const res = await api.get(`/users/${this.user.id}/vehicle`);
                this.vehicle = res.data;
            } catch (e) {
                console.error(e);
            }
        },
        logout() {
           localStorage.removeItem('user');
           localStorage.removeItem('token');
           this.$router.push('/');
        }
    }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 pb-20">
    <!-- Header Background -->
    <div class="bg-amber-500 h-48 rounded-b-[40px] relative overflow-hidden">
       <div class="absolute top-0 right-0 w-64 h-64 bg-yellow-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
       <div class="absolute -bottom-32 -left-32 w-64 h-64 bg-orange-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
    </div>

    <!-- Profile Card -->
    <div class="px-6 -mt-32 relative z-10">
       <div class="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.05)] border border-white/50 text-center">
         <div class="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mx-auto flex items-center justify-center text-4xl font-bold text-white shadow-xl shadow-orange-500/20 mb-4 border-4 border-white">
           {{ user?.name ? user.name[0] : 'U' }}
         </div>
         <h2 class="text-2xl font-bold text-slate-800">{{ user?.name }} {{ user?.surname }}</h2>
         <p class="text-slate-500 font-medium mt-1">{{ user?.phone }}</p>
         
         <div class="flex justify-center mt-4 gap-2">
            <span class="px-4 py-1.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold uppercase tracking-wide">
              {{ user?.age }} лет • {{ user?.sex === 'male' ? 'Муж' : 'Жен' }}
            </span>
            <span class="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-full text-xs font-bold flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-yellow-500 mr-1 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              {{ user?.rating || '5.0' }}
            </span>
         </div>
       </div>
    </div>

    <!-- Menu -->
    <div class="px-6 mt-6 space-y-4">
      <div class="bg-white rounded-3xl p-2 shadow-sm border border-gray-100">
        <button v-if="vehicle" @click="$router.push('/vehicle')" class="flex items-center w-full p-4 hover:bg-gray-50 rounded-2xl transition-colors group">
           <div class="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-2xl flex items-center justify-center text-xl mr-4 group-hover:scale-110 transition-transform">🚗</div>
           <div class="text-left flex-1">
             <h3 class="font-bold text-slate-800">Мой автомобиль</h3>
             <p class="text-sm text-gray-400">{{ vehicle.make }} {{ vehicle.model }}</p>
           </div>
           <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
        </button>

        <button v-else @click="$router.push('/vehicle')" class="flex items-center w-full p-4 hover:bg-gray-50 rounded-2xl transition-colors group">
            <div class="w-12 h-12 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center text-xl mr-4 group-hover:bg-yellow-100 group-hover:text-yellow-600 transition-colors">➕</div>
             <div class="text-left flex-1">
             <h3 class="font-bold text-slate-800">Добавить транспорт</h3>
             <p class="text-sm text-gray-400">Для водителей</p>
           </div>
             <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      <div class="bg-white rounded-3xl p-2 shadow-sm border border-gray-100">
        <button class="w-full text-left p-4 hover:bg-gray-50 rounded-2xl flex justify-between items-center group transition-colors">
          <div class="flex items-center space-x-4">
             <div class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
               <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
             </div>
             <span class="font-bold text-slate-700">Мои поездки</span>
          </div>
          <div class="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
          </div>
        </button>
        
        <div class="h-px bg-gray-50 mx-4"></div>

         <button class="w-full text-left p-4 hover:bg-gray-50 rounded-2xl flex justify-between items-center group transition-colors">
          <div class="flex items-center space-x-4">
             <div class="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
               <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
             </div>
             <span class="font-bold text-slate-700">Настройки</span>
          </div>
          <div class="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
          </div>
        </button>
      </div>

      <button @click="logout" class="w-full bg-white text-red-500 font-bold py-4 rounded-3xl shadow-sm border border-red-50 hover:bg-red-50 transition-colors flex items-center justify-center space-x-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
        <span>Выйти</span>
      </button>
    </div>
  </div>
</template>
