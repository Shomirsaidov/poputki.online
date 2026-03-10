<script>
import api from '../api';

export default {
    name: 'PreferencesView',
    data() {
        return {
            user: null,
            loading: true,
            saving: false,
            selectedPrefs: [],
            availablePreferences: [
                { id: 'no_smoke_me', label: 'Не курю' },
                { id: 'no_smoke_car', label: 'В машине не курить' },
                { id: 'talk_mood', label: 'Могу поболтать если есть настроение' },
                { id: 'smoke_ok', label: 'Я не против, если кто-то закурить' },
                { id: 'no_smoke_others', label: 'Не люблю, когда попутчики курят' },
                { id: 'love_talk', label: 'Люблю поболтать' },
                { id: 'loud_music', label: 'Музыку можно включать, и по громче' },
                { id: 'city_transfer', label: 'Трансфер по городу' },
                { id: 'prefer_silence', label: 'Предпочитаю тишину' },
                { id: 'big_trunk', label: 'Большой багажник' },
                { id: 'accept_parcels', label: 'Могу принимать посылки' }
            ]
        }
    },
    async mounted() {
        const u = JSON.parse(localStorage.getItem('user') || 'null');
        if (!u) {
            this.$router.push('/auth');
            return;
        }
        try {
            const res = await api.get(`/users/${u.id}/profile`);
            this.user = res.data;
            this.selectedPrefs = this.user.preferences || [];
        } catch (e) {
            console.error(e);
        } finally {
            this.loading = false;
        }
    },
    methods: {
        togglePref(label) {
            const idx = this.selectedPrefs.indexOf(label);
            if (idx > -1) {
                this.selectedPrefs.splice(idx, 1);
            } else {
                this.selectedPrefs.push(label);
            }
        },
        async save() {
            this.saving = true;
            try {
                await api.put(`/users/${this.user.id}`, {
                    ...this.user,
                    preferences: this.selectedPrefs
                });
                // Update local storage if needed, though we fetch from API usually
                this.$router.back();
            } catch (e) {
                console.error(e);
                alert('Ошибка при сохранении');
            } finally {
                this.saving = false;
            }
        }
    }
}
</script>

<template>
    <div class="min-h-screen bg-slate-50 pb-32">
        <!-- Header -->
        <div class="bg-white border-b border-slate-100 p-6 pt-12 sticky top-0 z-20">
            <div class="flex items-center space-x-4">
                <button @click="$router.back()" class="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-700 active:scale-90 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h1 class="text-xl font-bold text-slate-800">Предпочтения</h1>
            </div>
        </div>

        <div v-if="loading" class="flex items-center justify-center py-20">
            <div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>

        <div v-else class="p-6">
            <p class="text-slate-500 text-sm mb-6">Отметьте то, что важно для вас в поездке. Это увидят другие пользователи.</p>

            <div class="space-y-3">
                <button 
                    v-for="pref in availablePreferences" 
                    :key="pref.id"
                    @click="togglePref(pref.label)"
                    class="w-full bg-white p-5 rounded-3xl border-2 flex items-center justify-between transition-all active:scale-[0.98] shadow-sm"
                    :class="selectedPrefs.includes(pref.label) ? 'border-blue-500 bg-blue-50/50' : 'border-white'"
                >
                    <div class="flex items-center">
                        <span class="text-sm font-bold text-slate-700 text-left">{{ pref.label }}</span>
                    </div>
                    <div class="w-6 h-6 rounded-full flex items-center justify-center transition-colors px-1"
                         :class="selectedPrefs.includes(pref.label) ? 'bg-blue-600' : 'bg-slate-100'">
                        <svg v-if="selectedPrefs.includes(pref.label)" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                    </div>
                </button>
            </div>
        </div>

        <!-- Save Button (Flowing with content) -->
        <div class="px-6 mt-8">
            <button 
                @click="save" 
                :disabled="saving"
                class="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center space-x-2"
            >
                <span v-if="saving" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Сохранить изменения</span>
            </button>
        </div>
    </div>
</template>
