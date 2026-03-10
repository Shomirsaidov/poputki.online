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
    },
    isActive(name) {
      return this.currentRoute === name;
    }
  }
}
</script>

<template>
  <div class="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
    <div class="bg-white/95 backdrop-blur-xl border-t border-gray-100/80 flex justify-around items-stretch h-[72px] pb-safe w-full max-w-[480px] shadow-[0_-8px_32px_rgba(0,0,0,0.06)] pointer-events-auto">

      <!-- Find -->
      <button @click="navigate('search')"
        class="group flex flex-col items-center justify-center flex-1 gap-1 relative transition-all duration-200 active:scale-95">
        <div class="absolute inset-x-0 top-0 h-[2.5px] rounded-b-full transition-all duration-300"
          :class="isActive('search') ? 'bg-amber-500' : 'bg-transparent'"></div>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 transition-colors duration-200"
          :class="isActive('search') ? 'text-amber-500' : 'text-gray-400'"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <span class="text-[10px] font-semibold transition-colors duration-200"
          :class="isActive('search') ? 'text-amber-500' : 'text-gray-400'">Найти</span>
      </button>

      <!-- My Rides -->
      <button @click="navigate('my-rides')"
        class="group flex flex-col items-center justify-center flex-1 gap-1 relative transition-all duration-200 active:scale-95">
        <div class="absolute inset-x-0 top-0 h-[2.5px] rounded-b-full transition-all duration-300"
          :class="isActive('my-rides') ? 'bg-amber-500' : 'bg-transparent'"></div>
        <svg class="h-6 w-6 transition-colors duration-200"
          :class="isActive('my-rides') ? 'text-amber-500' : 'text-gray-400'"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
          <circle cx="7" cy="17" r="2" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 17h6" />
          <circle cx="17" cy="17" r="2" />
        </svg>
        <span class="text-[10px] font-semibold transition-colors duration-200"
          :class="isActive('my-rides') ? 'text-amber-500' : 'text-gray-400'">Поездки</span>
      </button>

      <!-- Create Ride -->
      <button @click="navigate('create-ride')"
        class="group flex flex-col items-center justify-center flex-1 gap-1 relative transition-all duration-200 active:scale-95">
        <div class="absolute inset-x-0 top-0 h-[2.5px] rounded-b-full transition-all duration-300"
          :class="isActive('create-ride') ? 'bg-amber-500' : 'bg-transparent'"></div>
        <svg class="h-6 w-6 transition-colors duration-200"
          :class="isActive('create-ride') ? 'text-amber-500' : 'text-gray-400'"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
        </svg>
        <span class="text-[10px] font-semibold transition-colors duration-200"
          :class="isActive('create-ride') ? 'text-amber-500' : 'text-gray-400'">Создать</span>
      </button>

      <!-- Profile -->
      <button @click="navigate('profile')"
        class="group flex flex-col items-center justify-center flex-1 gap-1 relative transition-all duration-200 active:scale-95">
        <div class="absolute inset-x-0 top-0 h-[2.5px] rounded-b-full transition-all duration-300"
          :class="isActive('profile') ? 'bg-amber-500' : 'bg-transparent'"></div>
        <svg class="h-6 w-6 transition-colors duration-200"
          :class="isActive('profile') ? 'text-amber-500' : 'text-gray-400'"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
        </svg>
        <span class="text-[10px] font-semibold transition-colors duration-200"
          :class="isActive('profile') ? 'text-amber-500' : 'text-gray-400'">Профиль</span>
      </button>

    </div>
  </div>
</template>
