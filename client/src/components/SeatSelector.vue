<script>
export default {
    props: {
        modelValue: {
            type: Array,
            default: () => []
        },
        mode: {
            type: String,
            default: 'select', // 'select' or 'reserve'
        },
        existingBookings: {
            type: Array,
            default: () => []
        },
        reservedSeats: {
            type: Array,
            default: () => []
        },
        totalSeats: {
            type: Number,
            default: 5
        },
        rowPrices: {
            type: Object,
            default: () => ({})
        }
    },
    computed: {
        seats() {
            const seats = [];
            // Seat 1: Driver
            seats.push({ id: 1, position: 'front-left', label: 'Водитель', row: 'front' });
            
            // Seat 2: Front passenger (if exists)
            if (this.totalSeats >= 2) {
                seats.push({ id: 2, position: 'front-right', label: 'Переднее', row: 'front' });
            }

            // Remainder
            let remaining = this.totalSeats - 2;
            let currentId = 3;

            // Row 2 (Middle or Back)
            const row2Count = Math.min(3, remaining);
            for (let i = 0; i < row2Count; i++) {
                const pos = i === 0 ? 'left' : i === 1 ? 'center' : 'right';
                seats.push({ id: currentId++, position: `row2-${pos}`, label: `Ряд 2 ${pos}`, row: 'row2' });
            }
            remaining -= row2Count;

            // Row 3 (Back)
            const row3Count = Math.min(3, remaining);
            for (let i = 0; i < row3Count; i++) {
                const pos = i === 0 ? 'left' : i === 1 ? 'center' : 'right';
                seats.push({ id: currentId++, position: `row3-${pos}`, label: `Ряд 3 ${pos}`, row: 'row3' });
            }
            
            return seats;
        },
        selectedSeats: {
            get() {
                return this.modelValue;
            },
            set(value) {
                this.$emit('update:modelValue', value);
            }
        }
    },
    methods: {
        toggleSeat(seatId) {
            // Driver seat (id 1) is always reserved
            if (seatId === 1) return;
            
            // Check if seat is already booked or reserved
            if (this.isSeatBooked(seatId) || this.isSeatReserved(seatId)) {
                return;
            }

            const index = this.selectedSeats.indexOf(seatId);
            if (index > -1) {
                this.selectedSeats = this.selectedSeats.filter(id => id !== seatId);
            } else {
                this.selectedSeats = [...this.selectedSeats, seatId];
            }
        },
        isSeatSelected(seatId) {
            return this.selectedSeats.includes(seatId);
        },
        isSeatBooked(seatId) {
            return this.existingBookings.some(booking => booking.seat_number === seatId);
        },
        isSeatReserved(seatId) {
            return this.reservedSeats.includes(seatId);
        },
        getBookingForSeat(seatId) {
            return this.existingBookings.find(booking => booking.seat_number === seatId);
        },
        getSeatClass(seat) {
            const booking = this.getBookingForSeat(seat.id);
            
            // Driver seat
            if (seat.id === 1) {
                return 'bg-gradient-to-br from-yellow-400 to-amber-500 border-yellow-500 cursor-not-allowed';
            }
            
            // Already booked by someone
            if (booking) {
                const gender = booking.passenger_gender || booking.sex; // support both
                if (gender === 'male') {
                    return 'bg-blue-100 border-blue-400 cursor-not-allowed';
                } else if (gender === 'female') {
                    return 'bg-pink-100 border-pink-400 cursor-not-allowed';
                } else {
                    return 'bg-purple-100 border-purple-400 cursor-not-allowed';
                }
            }
            
            // Reserved by driver
            if (this.isSeatReserved(seat.id)) {
                return 'bg-gray-200 border-gray-400 cursor-not-allowed opacity-50';
            }
            
            // Selected
            if (this.isSeatSelected(seat.id)) {
                return 'bg-slate-900 border-slate-900 scale-105 shadow-lg shadow-slate-900/20';
            }
            
            // Available
            return 'bg-white border-gray-300 hover:border-yellow-400 hover:bg-yellow-50 cursor-pointer';
        },
        getSeatStatus(seat) {
            const booking = this.getBookingForSeat(seat.id);
            if (seat.id === 1) return 'driver';
            if (booking) return booking.sex === 'female' || booking.passenger_gender === 'female' ? 'female' : 'male';
            if (this.isSeatReserved(seat.id)) return 'reserved';
            if (this.isSeatSelected(seat.id)) return 'selected';
            return 'available';
        }
    }
}
</script>

<template>
    <div class="space-y-6">
        <!-- Optional Info Header -->
        <div class="text-center px-4">
            <h3 class="font-black text-slate-800 text-lg tracking-tight">
                {{ mode === 'select' ? 'Схема салона' : 'Выбор зарезервированных мест' }}
            </h3>
            <p class="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                {{ mode === 'select' ? 'Нажмите на свободное место для выбора' : 'Отметьте занятые места' }}
            </p>
            
            <div v-if="Object.keys(rowPrices).length > 0" class="mt-4 inline-flex items-center px-3 py-1 bg-blue-50/50 rounded-full border border-blue-100/50">
                <span class="text-[9px] font-black text-blue-600 uppercase tracking-tighter italic">Цена зависит от ряда</span>
            </div>
        </div>

        <!-- Car visualization -->
        <div class="car-container">
            <!-- Seat Rows -->
            <div v-for="rowName in ['front', 'row2', 'row3']" :key="rowName" class="car-row-container">
                <div v-if="seats.filter(s => s.row === rowName).length > 0" 
                     :class="['grid gap-4 mb-4', rowName === 'front' ? 'grid-cols-2 px-8' : 'grid-cols-3']"
                >
                    <template v-for="seat in seats.filter(s => s.row === rowName)" :key="seat.id">
                        <!-- Driver Seat Styling -->
                        <div v-if="seat.id === 1" class="seat-btn seat-booked opacity-60 flex flex-col items-center justify-center border-slate-100 border-2">
                             <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                                <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M3 12h2M19 12h2M12 3v2M12 19v2"/>
                            </svg>
                            <span class="text-[8px] font-black text-slate-400 uppercase tracking-tighter mt-1">Водитель</span>
                        </div>

                        <!-- Passenger Seat -->
                        <button
                            v-else
                            @click="toggleSeat(seat.id)"
                            :class="[getSeatClass(seat), 'seat-btn relative']"
                            :disabled="isSeatBooked(seat.id) || (mode === 'select' && isSeatReserved(seat.id))"
                        >
                            <!-- Selection active state background -->
                            <div v-if="isSeatSelected(seat.id)" class="absolute inset-0 bg-blue-600 rounded-[18px] animate-pulse-slow"></div>

                            <div class="relative z-10 flex flex-col items-center">
                                <!-- Status Icons -->
                                <template v-if="getSeatStatus(seat) === 'male'">
                                    <svg class="w-7 h-7 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2a5 5 0 110 10A5 5 0 0112 2zm0 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z"/>
                                    </svg>
                                </template>
                                <template v-else-if="getSeatStatus(seat) === 'female'">
                                    <svg class="w-7 h-7 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2a5 5 0 110 10A5 5 0 0112 2zm0 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z"/>
                                    </svg>
                                </template>
                                <template v-else-if="getSeatStatus(seat) === 'selected'">
                                    <svg class="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </template>
                                <template v-else-if="getSeatStatus(seat) === 'reserved'">
                                    <svg class="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </template>
                                <template v-else>
                                    <!-- Better Car Seat Icon -->
                                    <svg class="w-7 h-7 text-slate-200 transition-colors group-hover:text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                      <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/>
                                      <path d="M3 11v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2Z"/>
                                      <path d="M5 18v2"/>
                                      <path d="M19 18v2"/>
                                    </svg>
                                </template>

                                <span class="text-[9px] font-black mt-1 uppercase tracking-tighter" :class="isSeatSelected(seat.id) ? 'text-white/80' : 'text-slate-400'">
                                    №{{ seat.id }}
                                </span>
                            </div>

                            <!-- Price tag -->
                            <div v-if="rowPrices[seat.row] && seat.id !== 1 && !isSeatBooked(seat.id) && !isSeatReserved(seat.id)" 
                                 class="absolute -bottom-2 bg-white px-2 py-0.5 rounded-full border border-slate-100 shadow-md flex items-center space-x-0.5 z-20">
                                <span class="text-[9px] font-black text-slate-800 tracking-tighter">{{ rowPrices[seat.row] }}</span>
                                <span class="text-[7px] font-bold text-slate-400">с.</span>
                            </div>
                        </button>
                    </template>
                </div>
            </div>
        </div>

        <!-- Legend (Neutral Professional Grid) -->
        <div class="grid grid-cols-2 gap-3 mt-8 px-2">
            <!-- Available -->
            <div class="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div class="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                    <svg class="w-5 h-5 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/>
                      <path d="M3 11v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2Z"/>
                      <path d="M5 18v2"/>
                      <path d="M19 18v2"/>
                    </svg>
                </div>
                <div class="flex flex-col">
                    <span class="text-[10px] font-black text-slate-800 uppercase tracking-widest leading-none">Свободно</span>
                    <span class="text-[9px] text-gray-400 mt-1">Доступно</span>
                </div>
            </div>
            <!-- Selected (Neutralized) -->
            <div class="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-900 shadow-sm">
                <div class="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                    <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <div class="flex flex-col">
                    <span class="text-[10px] font-black text-slate-800 uppercase tracking-widest leading-none">Выбрано</span>
                    <span class="text-[9px] text-slate-400 mt-1">Ваше место</span>
                </div>
            </div>
            <!-- Male (Neutralized) -->
            <div class="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    <svg class="w-5 h-5 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2a5 5 0 110 10A5 5 0 0112 2zm0 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z"/>
                    </svg>
                </div>
                <div class="flex flex-col">
                    <span class="text-[10px] font-black text-slate-800 uppercase tracking-widest leading-none">Занято</span>
                    <span class="text-[9px] text-slate-400 font-bold mt-1">Пассажир-М</span>
                </div>
            </div>
            <!-- Female (Neutralized) -->
            <div class="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    <svg class="w-5 h-5 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2a5 5 0 110 10A5 5 0 0112 2zm0 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z"/>
                    </svg>
                </div>
                <div class="flex flex-col">
                    <span class="text-[10px] font-black text-slate-800 uppercase tracking-widest leading-none">Занято</span>
                    <span class="text-[9px] text-slate-400 font-bold mt-1">Пассажир-Ж</span>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.car-container {
    background: #f8faff;
    border: 2px solid #eef2ff;
    border-radius: 40px;
    padding: 32px 24px;
    max-width: 320px;
    margin: 0 auto;
    box-shadow: inset 0 2px 10px rgba(0,0,0,0.02);
}

.car-header {
    display: flex;
    justify-content: center;
    padding-bottom: 24px;
    border-bottom: 2px dashed #e2e8f0;
}

.driver-spot {
    display: flex;
    flex-direction: column;
    align-items: center;
    opacity: 0.6;
}

.seat-btn {
    width: 100%;
    aspect-ratio: 1 / 1 !important;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 20px;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
    border: 2px solid transparent;
    padding: 0;
    overflow: visible;
}

.seat-free {
    background: white;
    border-color: #f1f5f9;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.03);
}

.seat-free:hover {
    border-color: #3b82f6;
    transform: translateY(-2px);
}

.seat-selected {
    background: #0f172a; /* Neutral Dark slate instead of bright blue */
    box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.2);
}

.seat-booked {
    background: #f1f5f9;
    cursor: not-allowed;
}

.animate-pulse-slow {
    animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
}
</style>
