import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { initTelegram } from './telegram'

// Initialize Telegram SDK
initTelegram();

createApp(App)
    .use(router)
    .mount('#app')
