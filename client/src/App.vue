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
  <div class="app-container">
    <main class="pb-20 min-h-screen">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
    <BottomNav v-if="$route.name !== 'auth'" />
  </div>
</template>

<style scoped>
.app-container {
  max-width: 480px;
  margin: 0 auto;
  background: white;
  min-height: 100vh;
  position: relative;
}
</style>
