<script>
export default {
    props: {
        show: {
            type: Boolean,
            required: true
        },
        title: {
            type: String,
            default: ''
        },
        message: {
            type: String,
            default: ''
        },
        type: {
            type: String,
            default: 'info' // 'info', 'success', 'error', 'warning'
        },
        confirmText: {
            type: String,
            default: 'ОК'
        },
        showCancel: {
            type: Boolean,
            default: false
        },
        cancelText: {
            type: String,
            default: 'Отмена'
        }
    },
    emits: ['confirm', 'cancel', 'close'],
    computed: {
        icon() {
            switch (this.type) {
                case 'success': return '✅';
                case 'error': return '❌';
                case 'warning': return '⚠️';
                default: return 'ℹ️';
            }
        },
        typeClass() {
            switch (this.type) {
                case 'success': return 'text-green-500 bg-green-50';
                case 'error': return 'text-red-500 bg-red-50';
                case 'warning': return 'text-orange-500 bg-orange-50';
                default: return 'text-blue-500 bg-blue-50';
            }
        }
    }
}
</script>

<template>
    <Teleport to="body">
        <Transition name="modal">
            <div v-if="show" class="fixed inset-0 z-[100] flex items-center justify-center p-6">
                <!-- Backdrop -->
                <div @click="$emit('close')" class="absolute inset-0 bg-slate-900/60 backdrop-blur-md"></div>
                
                <!-- Modal Content -->
                <div class="relative bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl shadow-black/20 transform transition-all p-8 text-center">
                    <div :class="['w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-4xl mb-6 shadow-sm', typeClass]">
                        {{ icon }}
                    </div>
                    
                    <h3 v-if="title" class="text-2xl font-bold text-slate-800 mb-2">{{ title }}</h3>
                    <p v-if="message" class="text-slate-500 leading-relaxed mb-8">{{ message }}</p>
                    
                    <div class="space-y-3">
                        <button 
                            @click="$emit('confirm')" 
                            class="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl active:scale-[0.98] transition-all hover:bg-slate-800 shadow-lg shadow-slate-900/10"
                        >
                            {{ confirmText }}
                        </button>
                        
                        <button 
                            v-if="showCancel" 
                            @click="$emit('cancel')" 
                            class="w-full bg-gray-100 text-slate-600 font-bold py-4 rounded-2xl active:scale-[0.98] transition-all hover:bg-gray-200"
                        >
                            {{ cancelText }}
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
    transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-enter-from .relative {
    transform: scale(0.9) translateY(20px);
}

.modal-leave-to .relative {
    transform: scale(0.95) translateY(10px);
}
</style>
