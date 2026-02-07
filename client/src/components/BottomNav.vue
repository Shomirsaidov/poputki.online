<script>
export default {
  computed: {
    currentRoute() {
      return this.$route.name;
    }
  },
  methods: {
    navigate(name) {
      this.$router.push({ name });
    }
  }
}
</script>

<template>
  <div class="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
    <div class="bg-white/90 backdrop-blur-lg border-t border-gray-100 flex justify-around items-center h-[80px] pb-safe w-full max-w-[480px] shadow-[0_-5px_20px_rgba(0,0,0,0.03)] pointer-events-auto rounded-t-3xl">
      
      <button @click="navigate('home')" class="group flex flex-col items-center justify-center w-full h-full relative overflow-hidden">
        <div :class="['absolute inset-0 bg-yellow-50 opacity-0 transition-opacity duration-300', currentRoute === 'home' ? 'opacity-100' : 'group-hover:opacity-50']"></div>
        <div :class="['relative transition-transform duration-300 transform', currentRoute === 'home' ? '-translate-y-1' : 'group-hover:-translate-y-1']">
          <svg xmlns="http://www.w3.org/2000/svg" :class="['h-7 w-7 transition-colors duration-300', currentRoute === 'home' ? 'text-yellow-500 fill-yellow-500/10' : 'text-gray-400']" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <span :class="['text-[10px] font-medium mt-1 transition-colors duration-300 relative', currentRoute === 'home' ? 'text-yellow-600' : 'text-gray-400']">Найти</span>
      </button>
      
      <button @click="navigate('create-ride')" class="group flex flex-col items-center justify-center w-full h-full relative">
         <div class="absolute -top-6 bg-yellow-500 p-4 rounded-2xl shadow-lg shadow-yellow-500/30 transition-transform duration-300 group-hover:scale-105 group-active:scale-95 border-[4px] border-white">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
            </svg>
         </div>
         <span class="text-[10px] font-medium mt-8 text-gray-500 transition-colors group-hover:text-yellow-600">Создать</span>
      </button>

      <button @click="navigate('profile')" class="group flex flex-col items-center justify-center w-full h-full relative overflow-hidden">
        <div :class="['absolute inset-0 bg-yellow-50 opacity-0 transition-opacity duration-300', currentRoute === 'profile' ? 'opacity-100' : 'group-hover:opacity-50']"></div>
        <div :class="['relative transition-transform duration-300 transform', currentRoute === 'profile' ? '-translate-y-1' : 'group-hover:-translate-y-1']">
          <svg xmlns="http://www.w3.org/2000/svg" :class="['h-7 w-7 transition-colors duration-300', currentRoute === 'profile' ? 'text-yellow-500 fill-yellow-500/10' : 'text-gray-400']" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <span :class="['text-[10px] font-medium mt-1 transition-colors duration-300 relative', currentRoute === 'profile' ? 'text-yellow-600' : 'text-gray-400']">Профиль</span>
      </button>

    </div>
  </div>
</template>
