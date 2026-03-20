<script>
export default {
    name: 'BusSeatSelector',
    props: {
        modelValue: { type: Array, default: () => [] },
        bookedSeats: { type: Array, default: () => [] },
        totalSeats: { type: Number, default: 53 },
        floor1Seats: { type: Number, default: 20 },
        floor2Seats: { type: Number, default: 56 },
        maxSelectable: { type: Number, default: 1 },
        seatGenders: { type: Object, default: () => ({}) },
        busType: { type: String, default: 'single' },
        premiumSeats: { type: Array, default: () => [] },
        premiumPrice: { type: Number, default: 0 },
        regularPrice: { type: Number, default: 0 }
    },
    emits: ['update:modelValue'],
    data() {
        return {
            currentFloor: this.busType === 'double' ? 2 : 1
        };
    },
    computed: {
        selectedSeats: {
            get() { return this.modelValue; },
            set(val) { this.$emit('update:modelValue', val); }
        },

        // Premium seat numbers for double-decker (from image)
        doubleDeckPremiumSeats() {
            if (this.premiumSeats && this.premiumSeats.length > 0) return this.premiumSeats;
            // Default premium seats from image: floor1 around tables + floor2 back
            return [69, 70, 71, 72, 73, 74, 75, 76, 53, 54, 55, 56];
        },

        // Generate the single-floor bus layout from Image 2
        singleFloorLayout() {
            const maxSeats = this.totalSeats;
            const layout = [];

            // Top TV bar
            layout.push({ type: 'header', items: [
                { type: 'label', text: 'TV', colspan: 2 },
                { type: 'spacer' },
                { type: 'label', text: 'exit', variant: 'exit', colspan: 2 }
            ]});

            // Driver + guide seats row
            layout.push({ type: 'special-row', items: [
                { type: 'driver' },
                { type: 'empty' },
                { type: 'spacer' },
                { type: 'guide', text: '2 в' },
                { type: 'empty' }
            ]});

            // Guide seat 1в row 
            layout.push({ type: 'special-row', items: [
                { type: 'guide', text: '1 в' },
                { type: 'empty' },
                { type: 'spacer' },
                { type: 'empty' },
                { type: 'empty' }
            ]});

            // Standard seat rows (4 per row)
            // Seats 1-20: regular rows
            const seatRows = [
                [1, 2, 3, 4],
                [5, 6, 7, 8],
                [9, 10, 11, 12],
                [13, 14, 15, 16],
                [17, 18, 19, 20],
            ];

            seatRows.forEach(row => {
                const filtered = row.filter(s => s <= maxSeats);
                if (filtered.length > 0) {
                    layout.push({ type: 'seat-row', left: filtered.slice(0, 2), right: filtered.slice(2) });
                }
            });

            // TV + WC row (between seat 20 and 21)
            if (maxSeats > 20) {
                layout.push({ type: 'seat-row', 
                    left: [21, 22].filter(s => s <= maxSeats), 
                    right: [],
                    rightLabels: [
                        { type: 'label', text: 'TV', variant: 'tv' },
                        { type: 'label', text: 'WC', variant: 'wc' }
                    ]
                });
            }

            // Exit row
            if (maxSeats > 22) {
                layout.push({ type: 'seat-row', 
                    left: [23, 24].filter(s => s <= maxSeats), 
                    right: [],
                    rightLabels: [
                        { type: 'empty' },
                        { type: 'label', text: 'exit', variant: 'exit' }
                    ]
                });
            }

            // Remaining rows after exit
            const postExitRows = [
                [25, 26, 27, 28],
                [29, 30, 31, 32],
                [33, 34, 35, 36],
                [37, 38, 39, 40],
                [41, 42, 43, 44],
                [45, 46, 47, 48],
            ];

            postExitRows.forEach(row => {
                const filtered = row.filter(s => s <= maxSeats);
                if (filtered.length > 0) {
                    layout.push({ type: 'seat-row', left: filtered.slice(0, 2), right: filtered.slice(2) });
                }
            });

            // Last row (5 seats: 49, 50, 51, 52, 53)
            if (maxSeats >= 49) {
                const lastRow = [49, 50, 51, 52, 53].filter(s => s <= maxSeats);
                layout.push({ type: 'last-row', seats: lastRow });
            }

            return layout;
        },

        // Generate double-decker Floor 1 layout from Image 1
        doubleFloor1Layout() {
            const maxSeats = this.floor1Seats;
            const layout = [];
            
            // Floor 1 seats: numbered 57-78 (22 seats max)
            // But we need to map to actual available count
            // Full scheme from image (top to bottom):
            // [Лестница] [71][72] | [78][77]    [Вход]
            //     [Стол]  [Стол]  |
            // [69][70]            | [76][75]   <- PREMIUM
            //     [Стол]  [Стол]  |
            //                     | [74][73]   <- PREMIUM
            // [65][66]            | [68][67]
            // [61][62]            | [64][63]
            // [57][58]            | [60][59]
            //     [Выход]
            // [Туалет][Мини Кухня][Лестница]
            // [   Багажное отделение       ]

            // Entrance label
            layout.push({ type: 'header', items: [
                { type: 'label', text: 'Лестница', variant: 'stairs' },
                { type: 'empty' },
                { type: 'spacer' },
                { type: 'empty' },
                { type: 'label', text: 'Вход', variant: 'exit' }
            ]});

            // All floor 1 seats (numbering from image)
            const allFloor1Seats = [
                // Row 1: [71, 72] | [78, 77]
                { left: [71, 72], right: [78, 77] },
                // Table row
                { type: 'table-row' },
                // Row 2: [69, 70] | [76, 75] - PREMIUM
                { left: [69, 70], right: [76, 75] },
                // Table row
                { type: 'table-row' },
                // Row 3: [] | [74, 73] - PREMIUM
                { left: [], right: [74, 73] },
                // Row 4: [65, 66] | [68, 67]
                { left: [65, 66], right: [68, 67] },
                // Row 5: [61, 62] | [64, 63]
                { left: [61, 62], right: [64, 63] },
                // Row 6: [57, 58] | [60, 59]
                { left: [57, 58], right: [60, 59] },
            ];

            // Calculate which seats are within range
            // Floor 1 seat numbers: 57 to 56 + maxSeats
            const floor1Max = 56 + maxSeats;

            allFloor1Seats.forEach(row => {
                if (row.type === 'table-row') {
                    layout.push({ type: 'table-row' });
                    return;
                }
                const filteredLeft = row.left.filter(s => s <= floor1Max);
                const filteredRight = row.right.filter(s => s <= floor1Max);
                if (filteredLeft.length > 0 || filteredRight.length > 0) {
                    layout.push({ type: 'seat-row', left: filteredLeft, right: filteredRight });
                }
            });

            // Exit
            layout.push({ type: 'footer-label', text: 'Выход', variant: 'exit' });

            // Bottom facilities
            layout.push({ type: 'facilities', items: ['Туалет', 'Мини Кухня', 'Лестница'] });
            layout.push({ type: 'baggage', text: 'Багажное отделение' });

            return layout;
        },

        // Generate double-decker Floor 2 layout from Image 1
        doubleFloor2Layout() {
            const maxSeats = this.floor2Seats;
            const layout = [];

            // Floor 2 seats: 1-56 (from image)
            // Top: [1][2] | [Лестница]
            //             | [4][3]
            // [5][6]      |
            //             | [8][7]
            // Pattern: left pair, right pair alternating with offsets

            // Full layout from image (top to bottom):
            layout.push({ type: 'header', items: [
                { type: 'empty' },
                { type: 'empty' },
                { type: 'spacer' },
                { type: 'label', text: 'Лестница', variant: 'stairs' },
                { type: 'empty' }
            ]});

            const allFloor2Rows = [
                { left: [1, 2], right: [] },
                { left: [], right: [4, 3] },
                { left: [5, 6], right: [] },
                { left: [], right: [8, 7] },
                { left: [9, 10], right: [] },
                { left: [], right: [12, 11] },
                { left: [13, 14], right: [] },
                { left: [], right: [16, 15] },
                { left: [17, 18], right: [] },
                { left: [], right: [20, 19] },
                { left: [21, 22], right: [] },
                { left: [], right: [24, 23] },
                { left: [25, 26], right: [] },
                { left: [], right: [28, 27] },
                { left: [29, 30], right: [] },
                { left: [], right: [32, 31] },
                { left: [33, 34], right: [] },
                { left: [], right: [36, 35] },
                { left: [37, 38], right: [] },
                { left: [], right: [40, 39] },
                { left: [41, 42], right: [] },
                { left: [], right: [44, 43] },
                { left: [45, 46], right: [] },
                { left: [], right: [48, 47] },
                { left: [49, 50], right: [] },
                { left: [], right: [52, 51] },
                { left: [53, 54], right: [] },
                { left: [], right: [56, 55] },
            ];

            allFloor2Rows.forEach(row => {
                const filteredLeft = row.left.filter(s => s <= maxSeats);
                const filteredRight = row.right.filter(s => s <= maxSeats);
                if (filteredLeft.length > 0 || filteredRight.length > 0) {
                    layout.push({ type: 'seat-row', left: filteredLeft, right: filteredRight });
                }
            });

            // Bottom stairs
            layout.push({ type: 'footer-label', text: 'Лестница', variant: 'stairs' });

            return layout;
        },

        currentLayout() {
            if (this.busType === 'single') {
                return this.singleFloorLayout;
            }
            return this.currentFloor === 1 ? this.doubleFloor1Layout : this.doubleFloor2Layout;
        }
    },
    methods: {
        isSeatBooked(seatNum) {
            return this.bookedSeats.includes(seatNum);
        },
        isSeatSelected(seatNum) {
            return this.selectedSeats.includes(seatNum);
        },
        isSeatPremium(seatNum) {
            if (this.busType !== 'double') return false;
            return this.doubleDeckPremiumSeats.includes(seatNum);
        },
        toggleSeat(seatNum) {
            if (this.isSeatBooked(seatNum)) return;
            const idx = this.selectedSeats.indexOf(seatNum);
            if (idx > -1) {
                this.selectedSeats = this.selectedSeats.filter(s => s !== seatNum);
            } else {
                if (this.selectedSeats.length >= this.maxSelectable) {
                    if (this.maxSelectable === 1) {
                        this.selectedSeats = [seatNum];
                    } else {
                        this.selectedSeats = [...this.selectedSeats.slice(1), seatNum];
                    }
                } else {
                    this.selectedSeats = [...this.selectedSeats, seatNum];
                }
            }
        },
        getSeatClass(seatNum) {
            if (this.isSeatBooked(seatNum)) return 'seat-booked';
            if (this.isSeatSelected(seatNum)) return 'seat-selected';
            if (this.isSeatPremium(seatNum)) return 'seat-premium';
            return 'seat-free';
        },
        getSeatGender(seatNum) {
            return this.seatGenders[seatNum] || null;
        },
        getSeatPrice(seatNum) {
            if (this.isSeatPremium(seatNum) && this.premiumPrice > 0) {
                return this.premiumPrice;
            }
            return this.regularPrice;
        }
    },
    watch: {
        busType(newVal) {
            this.currentFloor = newVal === 'double' ? 2 : 1;
        }
    }
}
</script>

<template>
    <div class="bus-selector">
        <!-- Hint -->
        <div class="selector-hint">
            Схема может отличаться от реального расположения мест
        </div>

        <!-- Bus body -->
        <div class="bus-body">
            <!-- Floor Switcher (double-decker only) -->
            <div v-if="busType === 'double'" class="floor-switcher">
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

            <!-- Render layout rows -->
            <template v-for="(row, rowIdx) in currentLayout" :key="rowIdx">

                <!-- Header row (TV/exit/stairs labels) -->
                <div v-if="row.type === 'header'" class="header-row">
                    <template v-for="(item, iIdx) in row.items" :key="iIdx">
                        <div v-if="item.type === 'label'" 
                            class="label-tile"
                            :class="'label-' + (item.variant || 'default')"
                            :style="item.colspan ? {gridColumn: 'span ' + item.colspan} : {}"
                        >{{ item.text }}</div>
                        <div v-else-if="item.type === 'spacer'" class="aisle"></div>
                        <div v-else class="empty-cell"></div>
                    </template>
                </div>

                <!-- Special row (driver/guide) -->
                <div v-else-if="row.type === 'special-row'" class="seat-row">
                    <template v-for="(item, iIdx) in row.items" :key="iIdx">
                        <div v-if="item.type === 'driver'" class="driver-cell">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="driver-icon-svg">
                                <circle cx="12" cy="8" r="4"/>
                                <path d="M4 20c0-4 4-6 8-6s8 2 8 6"/>
                            </svg>
                        </div>
                        <div v-else-if="item.type === 'guide'" class="guide-cell">
                            {{ item.text }}
                        </div>
                        <div v-else-if="item.type === 'spacer'" class="aisle"></div>
                        <div v-else class="empty-cell"></div>
                    </template>
                </div>

                <!-- Regular seat row -->
                <div v-else-if="row.type === 'seat-row'" class="seat-row">
                    <!-- Left seats -->
                    <div class="seat-pair">
                        <button
                            v-for="seatNum in row.left"
                            :key="seatNum"
                            @click="toggleSeat(seatNum)"
                            :class="['seat-btn', getSeatClass(seatNum), getSeatGender(seatNum) ? 'seat-booked-' + getSeatGender(seatNum) : '']"
                            :disabled="isSeatBooked(seatNum)"
                        >
                            <template v-if="getSeatGender(seatNum) === 'male'">
                                <svg class="gender-icon text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a5 5 0 110 10A5 5 0 0112 2zm0 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z"/></svg>
                            </template>
                            <template v-else-if="getSeatGender(seatNum) === 'female'">
                                <svg class="gender-icon text-pink-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a5 5 0 110 10A5 5 0 0112 2zm0 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z"/></svg>
                            </template>
                            <template v-else>
                                <span class="seat-num">{{ seatNum }}</span>
                                <span v-if="isSeatPremium(seatNum) && !isSeatBooked(seatNum) && !isSeatSelected(seatNum)" class="premium-star">★</span>
                            </template>
                        </button>
                        <!-- Fill empty spots if less than 2 -->
                        <div v-for="n in Math.max(0, 2 - row.left.length)" :key="'el'+n" class="empty-cell"></div>
                    </div>

                    <!-- Aisle -->
                    <div class="aisle"></div>

                    <!-- Right seats -->
                    <div class="seat-pair">
                        <template v-if="row.rightLabels">
                            <template v-for="(item, liIdx) in row.rightLabels" :key="'rl'+liIdx">
                                <div v-if="item.type === 'label'" 
                                    class="label-tile small-label"
                                    :class="'label-' + (item.variant || 'default')"
                                >{{ item.text }}</div>
                                <div v-else class="empty-cell"></div>
                            </template>
                        </template>
                        <template v-else>
                            <button
                                v-for="seatNum in row.right"
                                :key="seatNum"
                                @click="toggleSeat(seatNum)"
                                :class="['seat-btn', getSeatClass(seatNum), getSeatGender(seatNum) ? 'seat-booked-' + getSeatGender(seatNum) : '']"
                                :disabled="isSeatBooked(seatNum)"
                            >
                                <template v-if="getSeatGender(seatNum) === 'male'">
                                    <svg class="gender-icon text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a5 5 0 110 10A5 5 0 0112 2zm0 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z"/></svg>
                                </template>
                                <template v-else-if="getSeatGender(seatNum) === 'female'">
                                    <svg class="gender-icon text-pink-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a5 5 0 110 10A5 5 0 0112 2zm0 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z"/></svg>
                                </template>
                                <template v-else>
                                    <span class="seat-num">{{ seatNum }}</span>
                                    <span v-if="isSeatPremium(seatNum) && !isSeatBooked(seatNum) && !isSeatSelected(seatNum)" class="premium-star">★</span>
                                </template>
                            </button>
                            <div v-for="n in Math.max(0, 2 - row.right.length)" :key="'er'+n" class="empty-cell"></div>
                        </template>
                    </div>
                </div>

                <!-- Last row (5 seats) for single-floor -->
                <div v-else-if="row.type === 'last-row'" class="last-seat-row">
                    <button
                        v-for="seatNum in row.seats"
                        :key="seatNum"
                        @click="toggleSeat(seatNum)"
                        :class="['seat-btn', getSeatClass(seatNum), getSeatGender(seatNum) ? 'seat-booked-' + getSeatGender(seatNum) : '']"
                        :disabled="isSeatBooked(seatNum)"
                    >
                        <template v-if="getSeatGender(seatNum) === 'male'">
                            <svg class="gender-icon text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a5 5 0 110 10A5 5 0 0112 2zm0 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z"/></svg>
                        </template>
                        <template v-else-if="getSeatGender(seatNum) === 'female'">
                            <svg class="gender-icon text-pink-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a5 5 0 110 10A5 5 0 0112 2zm0 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z"/></svg>
                        </template>
                        <template v-else>
                            <span class="seat-num">{{ seatNum }}</span>
                        </template>
                    </button>
                </div>

                <!-- Table row (double-decker floor 1) -->
                <div v-else-if="row.type === 'table-row'" class="table-row">
                    <div class="table-cell">Стол</div>
                    <div class="aisle"></div>
                    <div class="table-cell">Стол</div>
                </div>

                <!-- Footer label -->
                <div v-else-if="row.type === 'footer-label'" class="footer-label-row">
                    <div class="label-tile" :class="'label-' + (row.variant || 'default')">{{ row.text }}</div>
                </div>

                <!-- Facilities row (toilet, kitchen, stairs) -->
                <div v-else-if="row.type === 'facilities'" class="facilities-row">
                    <div v-for="(item, fIdx) in row.items" :key="fIdx" class="facility-cell">
                        {{ item }}
                    </div>
                </div>

                <!-- Baggage -->
                <div v-else-if="row.type === 'baggage'" class="baggage-row">
                    {{ row.text }}
                </div>
            </template>
        </div>

        <!-- Legend -->
        <div class="seat-legend">
            <div class="legend-item">
                <div class="legend-swatch seat-selected-swatch">N</div>
                <span>Выбранное</span>
            </div>
            <div class="legend-item">
                <div class="legend-swatch seat-booked-swatch">
                    <svg class="legend-gender-icon text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a5 5 0 110 10A5 5 0 0112 2zm0 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z"/></svg>
                </div>
                <span>Мужское</span>
            </div>
            <div class="legend-item">
                <div class="legend-swatch seat-booked-swatch">
                    <svg class="legend-gender-icon text-pink-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a5 5 0 110 10A5 5 0 0112 2zm0 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z"/></svg>
                </div>
                <span>Женское</span>
            </div>
            <div class="legend-item">
                <div class="legend-swatch seat-free-swatch">N</div>
                <span>Свободное</span>
            </div>
            <div v-if="busType === 'double'" class="legend-item">
                <div class="legend-swatch seat-premium-swatch">★</div>
                <span>Премиум</span>
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
    text-align: center;
    margin-bottom: 16px;
}

.bus-body {
    background: #f8faff;
    border: 2px solid #dde3f0;
    border-radius: 24px;
    padding: 16px 12px 24px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-width: 300px;
    margin: 0 auto;
}

/* Floor switcher */
.floor-switcher {
    display: flex;
    gap: 8px;
    padding: 4px;
    background: #f1f5f9;
    border-radius: 14px;
    margin-bottom: 16px;
}
.floor-btn {
    flex: 1;
    padding: 10px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 700;
    transition: all 0.2s;
    cursor: pointer;
    border: none;
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

/* Header row */
.header-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    margin-bottom: 4px;
}

/* Seat row */
.seat-row {
    display: flex;
    align-items: center;
    gap: 0;
}

.seat-pair {
    display: flex;
    gap: 4px;
    flex: 1;
    justify-content: center;
}

.aisle {
    width: 20px;
    flex-shrink: 0;
}

.empty-cell {
    width: 42px;
    height: 42px;
    flex-shrink: 0;
}

/* Seat button */
.seat-btn {
    width: 42px;
    height: 42px;
    border-radius: 8px;
    border: 2px solid #d1d5db;
    background: #fff;
    font-size: 12px;
    font-weight: 700;
    color: #374151;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    position: relative;
    padding: 0;
    flex-shrink: 0;
}
.seat-btn:hover:not(:disabled).seat-free,
.seat-btn:hover:not(:disabled).seat-premium {
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

/* Premium seat */
.seat-premium {
    border-color: #f59e0b;
    background: #fffbeb;
    color: #92400e;
}
.seat-premium:hover:not(:disabled) {
    border-color: #d97706;
    background: #fef3c7;
}

.premium-star {
    position: absolute;
    top: -2px;
    right: -2px;
    font-size: 9px;
    color: #f59e0b;
    line-height: 1;
}

.seat-num {
    font-size: 12px;
    font-weight: 700;
}

.gender-icon {
    width: 18px;
    height: 18px;
}

/* Label tiles (TV, WC, exit, stairs) */
.label-tile {
    height: 42px;
    min-width: 42px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    flex-shrink: 0;
    padding: 0 8px;
}
.small-label {
    width: 42px;
    padding: 0;
}
.label-default {
    background: #e2e8f0;
    color: #475569;
    border: 1px solid #cbd5e1;
}
.label-tv {
    background: #dbeafe;
    color: #1d4ed8;
    border: 1px solid #93c5fd;
}
.label-wc {
    background: #e0e7ff;
    color: #4338ca;
    border: 1px solid #a5b4fc;
}
.label-exit {
    background: #fef3c7;
    color: #92400e;
    border: 1px solid #fcd34d;
}
.label-stairs {
    background: #f1f5f9;
    color: #64748b;
    border: 1px solid #cbd5e1;
    font-size: 9px;
}

/* Driver cell */
.driver-cell {
    width: 42px;
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f1f5f9;
    border-radius: 50%;
    flex-shrink: 0;
}
.driver-icon-svg {
    width: 24px;
    height: 24px;
    color: #94a3b8;
}

/* Guide cell */
.guide-cell {
    width: 42px;
    height: 42px;
    border-radius: 8px;
    border: 2px dashed #cbd5e1;
    background: #f8fafc;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 700;
    color: #94a3b8;
    flex-shrink: 0;
}

/* Table row */
.table-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0;
    margin: 2px 0;
}
.table-cell {
    flex: 1;
    height: 24px;
    background: #fef3c7;
    border: 1px solid #fcd34d;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
    font-weight: 800;
    color: #92400e;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

/* Last row (5 seats) */
.last-seat-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
}

/* Footer label */
.footer-label-row {
    display: flex;
    justify-content: center;
    margin-top: 4px;
}

/* Facilities row */
.facilities-row {
    display: flex;
    gap: 4px;
    margin-top: 6px;
}
.facility-cell {
    flex: 1;
    height: 36px;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
}

/* Baggage row */
.baggage-row {
    background: #e2e8f0;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 800;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-top: 4px;
}

/* Legend */
.seat-legend {
    display: flex;
    justify-content: center;
    gap: 16px;
    margin-top: 20px;
    flex-wrap: wrap;
}
.legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: #6b7280;
    font-weight: 500;
}
.legend-swatch {
    width: 26px;
    height: 26px;
    border-radius: 6px;
    border: 2px solid;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 700;
}
.legend-gender-icon {
    width: 12px;
    height: 12px;
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
.seat-premium-swatch {
    border-color: #f59e0b;
    background: #fffbeb;
    color: #f59e0b;
}
</style>
