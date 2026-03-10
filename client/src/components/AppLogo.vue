<template>
  <div :class="['flex items-center', containerClass]">
    <div :class="['flex items-center justify-center rounded-xl shadow-lg', iconBgClass, iconSizeClass]">
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        stroke-width="2"
        stroke-linecap="round" 
        stroke-linejoin="round"
        :class="['text-white', iconClass]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <!-- Car Silhouette from BottomNav -->
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
        <circle cx="7" cy="17" r="2" />
        <path d="M9 17h6" />
        <circle cx="17" cy="17" r="2" />
      </svg>
    </div>
    <span v-if="showText" :class="['font-black tracking-tight text-slate-900 ml-3', textClass]">
      Poputki
    </span>
  </div>
</template>

<script>
export default {
  name: 'AppLogo',
  props: {
    showText: {
      type: Boolean,
      default: true
    },
    containerClass: String,
    iconBgClass: {
      type: String,
      default: 'bg-gradient-to-br from-amber-400 to-orange-500'
    },
    iconSizeClass: {
      type: String,
      default: 'w-10 h-10'
    },
    iconClass: {
      type: String,
      default: 'h-6 w-6'
    },
    textClass: {
      type: String,
      default: 'text-2xl'
    }
  }
}
</script>
