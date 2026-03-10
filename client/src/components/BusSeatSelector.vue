<script>
export default {
    name: 'BusSeatSelector',
    props: {
        modelValue: { type: Array, default: () => [] },
        bookedSeats: { type: Array, default: () => [] },
        totalSeats: { type: Number, default: 44 },
        maxSelectable: { type: Number, default: 1 },
        seatGenders: { type: Object, default: () => ({}) },
        busType: { type: String, default: 'single' }
    },
    emits: ['update:modelValue'],
    data() {
        return {
            currentFloor: 1
        };
    },
    computed: {
        selectedSeats: {
            get() { return this.modelValue; },
            set(val) { this.$emit('update:modelValue', val); }
        },
        seatRows() {
            const rows = [];
            let startSeat, endSeat;

            if (this.busType === 'double') {
                if (this.currentFloor === 1) {
                    startSeat = 1;
                    endSeat = Math.min(32, this.totalSeats);
                } else {
                    startSeat = 33;
                    endSeat = this.totalSeats;
                }
            } else {
                startSeat = 1;
                endSeat = this.totalSeats;
            }

            let seatNum = startSeat;
            const floorSeats = endSeat - startSeat + 1;
            const totalRows = Math.ceil(floorSeats / 4);

            for (let r = 0; r < totalRows && seatNum <= endSeat; r++) {
                const row = { rowIndex: r + 1, left: [], right: [] };
                for (let i = 0; i < 2 && seatNum <= endSeat; i++) {
                    row.left.push(seatNum++);
                }
                for (let i = 0; i < 2 && seatNum <= endSeat; i++) {
                    row.right.push(seatNum++);
                }
                rows.push(row);
            }
            return rows;
        }
    },
    methods: {
        isSeatBooked(seatNum) {
            return this.bookedSeats.includes(seatNum);
        },
        isSeatSelected(seatNum) {
            return this.selectedSeats.includes(seatNum);
        },
        toggleSeat(seatNum) {
            if (this.isSeatBooked(seatNum)) return;
            const idx = this.selectedSeats.indexOf(seatNum);
            if (idx > -1) {
                // Deselect
                this.selectedSeats = this.selectedSeats.filter(s => s !== seatNum);
            } else {
                // Select — respect maxSelectable
                if (this.selectedSeats.length >= this.maxSelectable) {
                    // Replace oldest if maxSelectable is 1, else ignore
                    if (this.maxSelectable === 1) {
                        this.selectedSeats = [seatNum];
                    } else {
                        // shift oldest
                        this.selectedSeats = [...this.selectedSeats.slice(1), seatNum];
                    }
                } else {
                    this.selectedSeats = [...this.selectedSeats, seatNum];
                }
            }
        },
        getSeatClass(seatNum) {
            if (this.isSeatBooked(seatNum)) {
                return 'seat-booked';
            }
            if (this.isSeatSelected(seatNum)) {
                return 'seat-selected';
            }
            return 'seat-free';
        },
        getSeatGender(seatNum) {
            return this.seatGenders[seatNum] || null;
        }
    }
}
</script>

<template>
    <div class="bus-selector">
        <!-- Passenger count legend -->
        <div class="selector-hint text-sm text-slate-500 text-center mb-4">
            Схема может отличаться от реального расположения мест
        </div>

        <!-- Bus body -->
        <div class="bus-body">
            <!-- Floor Switcher -->
            <div v-if="busType === 'double'" class="floor-switcher mb-4">
                <button 
                    @click="currentFloor = 1" 
                    :class="currentFloor === 1 ? 'floor-btn-active' : 'floor-btn-inactive'"
                    class="floor-btn"
                >
                    1 Этаж
                </button>
                <button 
                    @click="currentFloor = 2" 
                    :class="currentFloor === 2 ? 'floor-btn-active' : 'floor-btn-inactive'"
                    class="floor-btn"
                >
                    2 Этаж
                </button>
            </div>

            <!-- Driver area (visible only on 1st floor for double deck or always for single) -->
            <div v-if="currentFloor === 1 || busType === 'single'" class="driver-row">
                <div class="driver-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-7 h-7 text-slate-400">
                        <circle cx="12" cy="12" r="9"/>
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M3 12h2M19 12h2M12 3v2M12 19v2"/>
                    </svg>
                </div>
            </div>

            <!-- Seat rows -->
            <div
                v-for="row in seatRows"
                :key="row.rowIndex"
                class="seat-row"
            >
                <!-- Left pair -->
                <div class="seat-pair">
                    <button
                        v-for="seatNum in row.left"
                        :key="seatNum"
                        @click="toggleSeat(seatNum)"
                        :class="['seat-btn', getSeatClass(seatNum), getSeatGender(seatNum) ? 'seat-booked-' + getSeatGender(seatNum) : '']"
                        :disabled="isSeatBooked(seatNum)"
                    >
                        <template v-if="getSeatGender(seatNum) === 'male'">
                            <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a5 5 0 110 10A5 5 0 0112 2zm0 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z"/></svg>
                        </template>
                        <template v-else-if="getSeatGender(seatNum) === 'female'">
                            <svg class="w-5 h-5 text-pink-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a5 5 0 110 10A5 5 0 0112 2zm0 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z"/></svg>
                        </template>
                        <template v-else>
                            {{ seatNum }}
                        </template>
                    </button>
                </div>

                <!-- Aisle -->
                <div class="aisle"></div>

                <!-- Right pair -->
                <div class="seat-pair">
                    <button
                        v-for="seatNum in row.right"
                        :key="seatNum"
                        @click="toggleSeat(seatNum)"
                        :class="['seat-btn', getSeatClass(seatNum), getSeatGender(seatNum) ? 'seat-booked-' + getSeatGender(seatNum) : '']"
                        :disabled="isSeatBooked(seatNum)"
                    >
                        <template v-if="getSeatGender(seatNum) === 'male'">
                            <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a5 5 0 110 10A5 5 0 0112 2zm0 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z"/></svg>
                        </template>
                        <template v-else-if="getSeatGender(seatNum) === 'female'">
                            <svg class="w-5 h-5 text-pink-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a5 5 0 110 10A5 5 0 0112 2zm0 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z"/></svg>
                        </template>
                        <template v-else>
                            {{ seatNum }}
                        </template>
                    </button>
                </div>
            </div>
        </div>

        <!-- Legend -->
        <div class="seat-legend">
            <div class="legend-item">
                <div class="legend-swatch seat-selected-swatch">{{ selectedSeats[0] || 'N' }}</div>
                <span>Выбранное</span>
            </div>
            <div class="legend-item">
                <div class="legend-swatch seat-booked-swatch">
                    <svg class="w-2.5 h-2.5 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a5 5 0 110 10A5 5 0 0112 2zm0 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z"/></svg>
                </div>
                <span>Мужское</span>
            </div>
            <div class="legend-item">
                <div class="legend-swatch seat-booked-swatch">
                    <svg class="w-2.5 h-2.5 text-pink-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a5 5 0 110 10A5 5 0 0112 2zm0 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z"/></svg>
                </div>
                <span>Женское</span>
            </div>
            <div class="legend-item">
                <div class="legend-swatch seat-free-swatch">N</div>
                <span>Свободное</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.bus-selector {
    user-select: none;
}

.selector-hint {
    color: #64748b;
    font-size: 13px;
}

.bus-body {
    background: #f8faff;
    border: 2px solid #dde3f0;
    border-radius: 24px;
    padding: 16px 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-width: 280px;
    margin: 0 auto;
}

.floor-switcher {
    display: flex;
    gap: 8px;
    padding: 4px;
    background: #f1f5f9;
    border-radius: 14px;
    margin-bottom: 20px !important;
}

.floor-btn {
    flex: 1;
    padding: 10px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 700;
    transition: all 0.2s;
    cursor: pointer;
}

.floor-btn-active {
    background: #fff;
    color: #2563eb;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.floor-btn-inactive {
    color: #64748b;
    background: transparent;
}

.driver-row {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 4px 0 12px;
    border-bottom: 1px dashed #dde3f0;
    margin-bottom: 6px;
}

.driver-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f1f5f9;
    border-radius: 50%;
}

.seat-row {
    display: flex;
    align-items: center;
    gap: 0;
}

.seat-pair {
    display: flex;
    gap: 5px;
    flex: 1;
    justify-content: center;
}

.aisle {
    width: 24px;
    flex-shrink: 0;
}

.seat-btn {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    border: 2px solid #d1d5db;
    background: #fff;
    font-size: 13px;
    font-weight: 600;
    color: #374151;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
}

.seat-btn:hover:not(:disabled).seat-free {
    border-color: #3b82f6;
    background: #eff6ff;
    color: #2563eb;
}

.seat-free {
    border-color: #d1d5db;
    background: #fff;
    color: #374151;
}

.seat-selected {
    border-color: #2563eb;
    background: #2563eb;
    color: #fff;
    box-shadow: 0 2px 8px rgba(37,99,235,0.3);
}

.seat-booked {
    border-color: #e5e7eb;
    background: #f3f4f6;
    color: #9ca3af;
    cursor: not-allowed;
}

.seat-booked-male {
    background: #eff6ff;
    border-color: #bfdbfe;
}

.seat-booked-female {
    background: #fdf2f8;
    border-color: #fbcfe8;
}

.seat-legend {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-top: 20px;
    flex-wrap: wrap;
}

.legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #6b7280;
    font-weight: 500;
}

.legend-swatch {
    width: 28px;
    height: 28px;
    border-radius: 7px;
    border: 2px solid;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
}

.seat-selected-swatch {
    border-color: #2563eb;
    background: #2563eb;
    color: #fff;
}

.seat-free-swatch {
    border-color: #d1d5db;
    background: #fff;
    color: #374151;
}

.seat-booked-swatch {
    border-color: #e5e7eb;
    background: #f3f4f6;
    color: #9ca3af;
}
</style>
