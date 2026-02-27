<script>
import { RouterView } from 'vue-router'
import BottomNav from './components/BottomNav.vue'

export default {
  components: {
    BottomNav
  }
}
</script>

<template>
  <div :class="['app-container', { 'admin-mode': $route.meta.hideBottomNav }]">
    <main :class="{ 'pb-20': !$route.meta.hideBottomNav }" class="min-h-screen">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
    <BottomNav v-if="!$route.meta.hideBottomNav && $route.name !== 'auth'" />
  </div>
</template>

<style scoped>
.app-container {
  max-width: 480px;
  margin: 0 auto;
  background: white;
  min-height: 100vh;
  position: relative;
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.05);
}

.app-container.admin-mode {
  max-width: 100%;
  margin: 0;
  background: #0f172a;
  box-shadow: none;
}
</style>
