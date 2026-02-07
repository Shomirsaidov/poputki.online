<script>
import api from '../api';

export default {
  data() {
    return {
      rides: [],
      fromCity: '',
      toCity: '',
      date: '',
      isLoading: true
    };
  },
  methods: {
    async searchRides() {
      this.isLoading = true;
      try {
        const params = {};
        if (this.fromCity) params.from = this.fromCity;
        if (this.toCity) params.to = this.toCity;
        if (this.date) params.date = this.date;
        
        // Simulate network delay for animation demo
        await new Promise(r => setTimeout(r, 600));
        
        const response = await api.get('/rides', { params });
        this.rides = response.data;
      } catch (err) {
        console.error(err);
      } finally {
        this.isLoading = false;
      }
    }
  },
  mounted() {
    this.searchRides();
  }
};
</script>

<template>
  <div class="bg-slate-50 min-h-screen">
    <!-- Modern Header -->
    <div class="bg-gradient-to-br from-yellow-400 to-amber-500 p-6 pt-12 rounded-b-[40px] shadow-xl shadow-amber-500/20 relative z-10 overflow-hidden">
      <!-- Decorational Circles -->
      <div class="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/20 rounded-full blur-2xl"></div>
      <div class="absolute bottom-0 left-0 -ml-10 -mb-5 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
      
      <h1 class="text-white text-3xl font-bold mb-6 relative z-10 tracking-tight">Поиск поездки</h1>
      
      <div class="bg-white/95 backdrop-blur-md rounded-3xl p-5 shadow-lg shadow-black/5 space-y-4 relative z-10 ring-1 ring-black/5">
        <div class="relative group">
           <div class="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-[3px] border-yellow-500 bg-transparent group-focus-within:bg-yellow-500 transition-colors"></div>
           <input v-model="fromCity" placeholder="Откуда" class="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl outline-none text-gray-800 font-medium placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-yellow-500/50 transition-all border border-transparent focus:border-yellow-200" />
        </div>
        
        <div class="relative group">
           <div class="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-[3px] border-gray-300 bg-transparent group-focus-within:bg-gray-400 transition-colors"></div>
           <input v-model="toCity" placeholder="Куда" class="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl outline-none text-gray-800 font-medium placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-yellow-500/50 transition-all border border-transparent focus:border-yellow-200" />
        </div>
        
        <div class="relative">
            <input type="date" v-model="date" class="w-full pl-4 pr-4 py-3 bg-gray-50 rounded-xl text-gray-600 font-medium outline-none focus:bg-white focus:ring-2 focus:ring-yellow-500/50 transition-all border border-transparent focus:border-yellow-200 appearance-none" />
        </div>
        
        <button @click="searchRides" class="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-lg shadow-slate-900/30 active:scale-[0.98] transition-all hover:shadow-xl hover:-translate-y-0.5 mt-2 flex items-center justify-center space-x-2">
          <span>Найти поездку</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Results -->
    <div class="p-6 space-y-5 pb-32">
      <div v-if="isLoading" class="space-y-4">
         <!-- Skeleton Loading -->
         <div v-for="i in 3" :key="i" class="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 animate-pulse h-40"></div>
      </div>

      <TransitionGroup name="list" tag="div" class="space-y-5">
        <div v-for="(ride, index) in rides" :key="ride.id" 
             @click="$router.push({ name: 'ride-details', params: { id: ride.id } })"
             class="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/50 hover:shadow-xl hover:shadow-yellow-500/10 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group"
             :style="{ transitionDelay: `${index * 100}ms` }">
          
          <div class="flex justify-between items-start mb-4">
             <div>
               <div class="text-2xl font-bold text-slate-800">{{ ride.time }}</div>
               <div class="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-1">Сегодня</div>
             </div>
             <div class="bg-green-50 px-3 py-1.5 rounded-xl border border-green-100">
                <div class="text-lg font-bold text-green-600">{{ ride.price }} c.</div>
             </div>
          </div>
          
          <div class="relative pl-8 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-yellow-400 before:to-gray-200 before:rounded-full">
            <div class="relative">
               <div class="absolute -left-[29px] top-1.5 w-3.5 h-3.5 rounded-full border-[3px] border-yellow-500 bg-white ring-4 ring-white"></div>
               <div class="font-bold text-lg text-slate-700 leading-none">{{ ride.from_city }}</div>
            </div>
            <div class="relative">
               <div class="absolute -left-[29px] top-1.5 w-3.5 h-3.5 rounded-full border-[3px] border-gray-300 bg-white ring-4 ring-white"></div>
               <div class="font-bold text-lg text-slate-700 leading-none">{{ ride.to_city }}</div>
            </div>
          </div>
          
          <div class="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
            <div class="flex items-center space-x-3">
               <div class="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-sm font-bold text-slate-600 shadow-inner">
                 {{ ride.driver_name ? ride.driver_name[0] : 'D' }}
               </div>
                <div>
                   <div class="text-sm font-bold text-slate-700">
                     {{ ride.is_passenger_entry ? 'Ищет машину' : (ride.driver_name || 'Водитель') }}
                   </div>
                   <div class="flex items-center mt-0.5">
                     <span v-if="ride.is_passenger_entry" class="text-[10px] font-bold text-blue-500 uppercase tracking-tighter bg-blue-50 px-2 py-0.5 rounded-md">Пассажир</span>
                     <template v-else>
                        <svg class="w-3 h-3 text-yellow-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                        <span class="text-xs ml-1 text-slate-500 font-medium">{{ ride.driver_rating }}</span>
                     </template>
                   </div>
                </div>
            </div>
            
             <button class="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
             </button>
          </div>
        </div>
      </TransitionGroup>
      
      <div v-if="!isLoading && rides.length === 0" class="text-center mt-20">
        <div class="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
           <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
           </svg>
        </div>
        <p class="text-gray-500 font-medium">Поездок пока нет</p>
        <p class="text-gray-400 text-sm mt-1">Попробуйте изменить дату или параметры</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(30px);
}
</style>
