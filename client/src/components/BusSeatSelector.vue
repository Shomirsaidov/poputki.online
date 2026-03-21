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

        doubleDeckPremiumSeats() {
            if (this.premiumSeats && this.premiumSeats.length > 0) return this.premiumSeats;
            return [69, 70, 71, 72, 73, 74, 75, 76, 53, 54, 55, 56];
        },

        singleFloorLayout() {
            const maxSeats = this.totalSeats;
            const layout = [];

            // Header labels (TV/exit)
            layout.push({ type: 'header', items: [
                { type: 'label', text: 'TV', colspan: 2 },
                { type: 'spacer' },
                { type: 'label', text: 'exit', variant: 'exit', colspan: 2 }
            ]});

            // Driver row
            layout.push({ type: 'special-row', items: [
                { type: 'driver' },
                { type: 'guide', text: '1 в' },
                { type: 'spacer' },
                { type: 'guide', text: '2 в' },
                { type: 'empty' }
            ]});

            const seatRows = [
                [1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16], [17, 18, 19, 20]
            ];
            seatRows.forEach(row => {
                const filtered = row.filter(s => s <= maxSeats);
                if (filtered.length > 0) {
                    layout.push({ type: 'seat-row', left: filtered.slice(0, 2), right: filtered.slice(2) });
                }
            });

            if (maxSeats > 20) {
                layout.push({ type: 'seat-row', 
                    left: [21, 22].filter(s => s <= maxSeats), right: [],
                    rightLabels: [{ type: 'label', text: 'TV', variant: 'tv' }, { type: 'label', text: 'WC', variant: 'wc' }]
                });
            }

            if (maxSeats > 22) {
                layout.push({ type: 'seat-row', 
                    left: [23, 24].filter(s => s <= maxSeats), right: [],
                    rightLabels: [{ type: 'empty' }, { type: 'label', text: 'exit', variant: 'exit' }]
                });
            }

            const postExitRows = [
                [25, 26, 27, 28], [29, 30, 31, 32], [33, 34, 35, 36], [37, 38, 39, 40], [41, 42, 43, 44], [45, 46, 47, 48]
            ];
            postExitRows.forEach(row => {
                const filtered = row.filter(s => s <= maxSeats);
                if (filtered.length > 0) {
                    layout.push({ type: 'seat-row', left: filtered.slice(0, 2), right: filtered.slice(2) });
                }
            });

            if (maxSeats >= 49) {
                const lastRow = [49, 50, 51, 52, 53].filter(s => s <= maxSeats);
                layout.push({ type: 'last-row', seats: lastRow });
            }

            return layout;
        },

        doubleFloor1Layout() {
            const maxSeats = this.floor1Seats;
            const floor1Max = 56 + maxSeats;
            const layout = [];

            layout.push({ type: 'header', items: [
                { type: 'label', text: 'Лестница', variant: 'stairs' }, { type: 'empty' },
                { type: 'spacer' }, { type: 'empty' },
                { type: 'label', text: 'Вход', variant: 'exit' }
            ]});

            const allFloor1Seats = [
                // Row 1: Stairs | [78, 77]
                { left: 'stairs', right: [78, 77] },
                // Row 2: [71, 72] | [76, 75] (Premium)
                { left: [71, 72], right: [76, 75] },
                // Table Row
                { type: 'table-row', left: 'table', right: 'table' },
                // Row 3: [69, 70] | [74, 73] (Premium)
                { left: [69, 70], right: [74, 73] },
                // Row 4: [65, 66] | [68, 67]
                { left: [65, 66], right: [68, 67] },
                // Row 5: [61, 62] | [64, 63]
                { left: [61, 62], right: [64, 63] },
                // Row 6: [57, 58] | [60, 59]
                { left: [57, 58], right: [60, 59] },
            ];

            allFloor1Seats.forEach(row => {
                if (row.type === 'table-row') {
                    // Adapt tables only if adjacent seats exist according to floor1Max
                    // Actually, let's always show them if available seats > 12 (approx)
                    layout.push({ type: 'table-row', left: 'table', right: 'table' });
                    return;
                }
                const left = row.left === 'stairs' ? 'stairs' : (row.left || []).filter(s => s <= floor1Max);
                const right = (row.right || []).filter(s => s <= floor1Max);

                if (left === 'stairs' || left.length > 0 || right.length > 0) {
                    layout.push({ type: 'seat-row', left, right });
                }
            });

            layout.push({ type: 'footer-label', text: 'Выход', variant: 'exit' });
            layout.push({ type: 'facilities', items: ['Туалет', 'Мини Кухня', 'Лестница'] });
            layout.push({ type: 'baggage', text: 'Багажное отделение' });

            return layout;
        },

        doubleFloor2Layout() {
            const maxSeats = this.floor2Seats;
            const layout = [];

            layout.push({ type: 'header', items: [
                { type: 'empty' }, { type: 'empty' }, { type: 'spacer' },
                { type: 'label', text: 'Лестница', variant: 'stairs' }, { type: 'empty' }
            ]});

            const allFloor2Rows = [
                { left: [1, 2], right: [4, 3] }, { left: [5, 6], right: [8, 7] },
                { left: [9, 10], right: [12, 11] }, { left: [13, 14], right: [16, 15] },
                { left: [17, 18], right: [20, 19] }, { left: [21, 22], right: [24, 23] },
                { left: [25, 26], right: [28, 27] }, { left: [29, 30], right: [32, 31] },
                { left: [33, 34], right: [36, 35] }, { left: [37, 38], right: [40, 39] },
                { left: [41, 42], right: [44, 43] }, { left: [45, 46], right: [48, 47] },
                { left: [49, 50], right: [52, 51] }, 
                { left: [53, 54], right: [56, 55] }, // COMBINED (NO TABLE)
            ];

            allFloor2Rows.forEach(row => {
                const filteredLeft = (row.left || []).filter(s => s <= maxSeats);
                const filteredRight = (row.right || []).filter(s => s <= maxSeats);
                if (filteredLeft.length > 0 || filteredRight.length > 0) {
                    layout.push({ type: 'seat-row', left: filteredLeft, right: filteredRight });
                }
            });

            layout.push({ type: 'footer-label', text: 'Лестница', variant: 'stairs' });

            return layout;
        },

        currentLayout() {
            if (this.busType === 'single') return this.singleFloorLayout;
            return this.currentFloor === 1 ? this.doubleFloor1Layout : this.doubleFloor2Layout;
        }
    },
    methods: {
        isSeatBooked(seatNum) { return this.bookedSeats.includes(seatNum); },
        isSeatSelected(seatNum) { return this.selectedSeats.includes(seatNum); },
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
                    if (this.maxSelectable === 1) this.selectedSeats = [seatNum];
                    else this.selectedSeats = [...this.selectedSeats.slice(1), seatNum];
                } else this.selectedSeats = [...this.selectedSeats, seatNum];
            }
        },
        getSeatClass(seatNum) {
            if (this.isSeatBooked(seatNum)) return 'seat-booked';
            if (this.isSeatSelected(seatNum)) return 'seat-selected';
            if (this.isSeatPremium(seatNum)) return 'seat-premium';
            return 'seat-free';
        },
        getSeatGender(seatNum) { return this.seatGenders[seatNum] || null; }
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
        <div class="selector-hint">Схема может отличаться от реальности</div>
        <div class="bus-body">
            <div v-if="busType === 'double'" class="floor-switcher">
                <button @click="currentFloor = 1" :class="currentFloor === 1 ? 'active' : ''">1 Этаж</button>
                <button @click="currentFloor = 2" :class="currentFloor === 2 ? 'active' : ''">2 Этаж</button>
            </div>

            <div v-for="(row, rIdx) in currentLayout" :key="rIdx" class="layout-row">
                <!-- 5-column grid: [seat][seat] [aisle] [seat/label][seat/label] -->
                
                <template v-if="row.type === 'header'">
                    <template v-for="(item, iIdx) in row.items" :key="iIdx">
                        <div v-if="item.type === 'label'" class="label-tile" :class="'label-'+(item.variant||'default')" :style="item.colspan ? {gridColumn: 'span '+item.colspan} : {}">{{ item.text }}</div>
                        <div v-else-if="item.type === 'spacer'" class="aisle"></div>
                        <div v-else class="empty-cell"></div>
                    </template>
                </template>

                <template v-else-if="row.type === 'special-row'">
                    <template v-for="(item, iIdx) in row.items" :key="iIdx">
                        <div v-if="item.type === 'driver'" class="driver-cell">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="driver-icon"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>
                        </div>
                        <div v-else-if="item.type === 'guide'" class="guide-cell">{{ item.text }}</div>
                        <div v-else-if="item.type === 'spacer'" class="aisle"></div>
                        <div v-else class="empty-cell"></div>
                    </template>
                </template>

                <template v-else-if="row.type === 'table-row'">
                    <div v-if="row.left === 'table'" class="table-cell span-2">СТОЛ</div>
                    <div v-else-if="Array.isArray(row.left)" class="seat-pair">
                        <button v-for="s in row.left" :key="s" @click="toggleSeat(s)" :class="['seat-btn', getSeatClass(s), getSeatGender(s) ? 'booked-'+getSeatGender(s) : '']" :disabled="isSeatBooked(s)">
                            <template v-if="getSeatGender(s)">
                                <svg class="gender-icon" :class="getSeatGender(s)==='male'?'male':'female'" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a5 5 0 110 10A5 5 0 0112 2zm0 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z"/></svg>
                            </template>
                            <template v-else>
                                <span class="num">{{ s }}</span>
                                <span v-if="isSeatPremium(s) && !isSeatBooked(s) && !isSeatSelected(s)" class="star">★</span>
                            </template>
                        </button>
                        <div v-for="n in (2 - row.left.length)" :key="'el'+n" class="empty-cell"></div>
                    </div>
                    <div v-else class="empty-cell span-2"></div>

                    <div class="aisle"></div>

                    <div v-if="row.right === 'table'" class="table-cell span-2">СТОЛ</div>
                    <div v-else-if="Array.isArray(row.right)" class="seat-pair">
                        <button v-for="s in row.right" :key="s" @click="toggleSeat(s)" :class="['seat-btn', getSeatClass(s), getSeatGender(s) ? 'booked-'+getSeatGender(s) : '']" :disabled="isSeatBooked(s)">
                            <template v-if="getSeatGender(s)">
                                <svg class="gender-icon" :class="getSeatGender(s)==='male'?'male':'female'" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a5 5 0 110 10A5 5 0 0112 2zm0 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z"/></svg>
                            </template>
                            <template v-else>
                                <span class="num">{{ s }}</span>
                                <span v-if="isSeatPremium(s) && !isSeatBooked(s) && !isSeatSelected(s)" class="star">★</span>
                            </template>
                        </button>
                        <div v-for="n in (2 - row.right.length)" :key="'er'+n" class="empty-cell"></div>
                    </div>
                    <div v-else class="empty-cell span-2"></div>
                </template>

                <template v-else-if="row.type === 'seat-row'">
                    <!-- Left Pair -->
                    <div class="seat-pair">
                        <div v-if="row.left === 'stairs'" class="label-tile span-2 label-stairs">Лестница</div>
                        <template v-else>
                            <button v-for="s in row.left" :key="s" @click="toggleSeat(s)" :class="['seat-btn', getSeatClass(s), getSeatGender(s) ? 'booked-'+getSeatGender(s) : '']" :disabled="isSeatBooked(s)">
                                <template v-if="getSeatGender(s)">
                                    <svg class="gender-icon" :class="getSeatGender(s)==='male'?'male':'female'" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a5 5 0 110 10A5 5 0 0112 2zm0 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z"/></svg>
                                </template>
                                <template v-else>
                                    <span class="num">{{ s }}</span>
                                    <span v-if="isSeatPremium(s) && !isSeatBooked(s) && !isSeatSelected(s)" class="star">★</span>
                                </template>
                            </button>
                            <div v-for="n in (2 - row.left.length)" :key="'el'+n" class="empty-cell"></div>
                        </template>
                    </div>
                    
                    <div class="aisle"></div>

                    <!-- Right Pair -->
                    <div class="seat-pair">
                        <template v-if="row.rightLabels">
                            <div v-for="(l, li) in row.rightLabels" :key="li" :class="l.type==='label'?'label-tile small label-'+l.variant:'empty-cell'">{{ l.text }}</div>
                        </template>
                        <template v-else>
                            <button v-for="s in row.right" :key="s" @click="toggleSeat(s)" :class="['seat-btn', getSeatClass(s), getSeatGender(s) ? 'booked-'+getSeatGender(s) : '']" :disabled="isSeatBooked(s)">
                                <template v-if="getSeatGender(s)">
                                    <svg class="gender-icon" :class="getSeatGender(s)==='male'?'male':'female'" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a5 5 0 110 10A5 5 0 0112 2zm0 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z"/></svg>
                                </template>
                                <template v-else>
                                    <span class="num">{{ s }}</span>
                                    <span v-if="isSeatPremium(s) && !isSeatBooked(s) && !isSeatSelected(s)" class="star">★</span>
                                </template>
                            </button>
                            <div v-for="n in (2 - row.right.length)" :key="'er'+n" class="empty-cell"></div>
                        </template>
                    </div>
                </template>

                <template v-else-if="row.type === 'last-row'">
                    <div class="last-row-grid">
                        <button v-for="s in row.seats" :key="s" @click="toggleSeat(s)" :class="['seat-btn', getSeatClass(s)]" :disabled="isSeatBooked(s)">
                            <span class="num">{{ s }}</span>
                        </button>
                    </div>
                </template>

                <template v-else-if="row.type === 'footer-label'">
                    <div class="empty-cell"></div><div class="empty-cell"></div><div class="aisle"></div>
                    <div class="label-tile span-2" :class="'label-'+row.variant">{{ row.text }}</div>
                </template>

                <template v-else-if="row.type === 'facilities'">
                    <div v-for="f in row.items" :key="f" class="facility-cell">{{ f }}</div>
                </template>

                <template v-else-if="row.type === 'baggage'">
                    <div class="baggage-cell">БАГАЖНОЕ ОДТЕЛЕНИЕ</div>
                </template>
            </div>
        </div>

        <div class="legend">
            <div class="item"><div class="swatch selected">N</div><span>Выбрано</span></div>
            <div class="item"><div class="swatch male"><svg class="ico" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a5 5 0 110 10A5 5 0 0112 2zm0 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z"/></svg></div><span>Муж</span></div>
            <div class="item"><div class="swatch female"><svg class="ico" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a5 5 0 110 10A5 5 0 0112 2zm0 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z"/></svg></div><span>Жен</span></div>
            <div class="item"><div class="swatch free">N</div><span>Свободно</span></div>
            <div v-if="busType === 'double'" class="item"><div class="swatch premium">★</div><span>Премиум</span></div>
        </div>
    </div>
</template>

<style scoped>
.bus-selector { width: 100%; max-width: 320px; margin: 0 auto; }
.selector-hint { font-size: 11px; color: #94a3b8; text-align: center; margin-bottom: 12px; }
.bus-body { background: #fff; border: 2px solid #e2e8f0; border-radius: 20px; padding: 12px; display: flex; flex-direction: column; gap: 4px; }

/* Fixed 5-column grid: 42+42 (left) + 20 (aisle) + 42+42 (right) = 188px content width */
.layout-row {
    display: grid;
    grid-template-columns: 42px 42px 20px 42px 42px;
    align-items: center;
    gap: 2px; /* Small gap between columns */
    justify-content: center;
}

.seat-pair { display: contents; } /* Act as direct children of the grid */
.aisle { width: 20px; height: 100%; grid-column: 3; }

.empty-cell { width: 42px; height: 42px; }

.seat-btn {
    width: 42px; height: 42px; border-radius: 6px; border: 1.5px solid #e2e8f0;
    background: #fff; display: flex; align-items: center; justify-content: center;
    position: relative; cursor: pointer; transition: 0.1s; padding: 0;
}
.seat-free { border-color: #cbd5e1; }
.seat-selected { background: #2563eb; border-color: #1e40af; color: #fff; }
.seat-booked { background: #f1f5f9; border-color: #e2e8f0; cursor: not-allowed; }
.booked-male { background: #eff6ff; border-color: #bfdbfe; }
.booked-female { background: #fdf2f8; border-color: #fbcfe8; }
.seat-premium { background: #fffbeb; border-color: #fcd34d; color: #92400e; }

.num { font-size: 12px; font-weight: 700; }
.star { position: absolute; top: 1px; right: 1px; font-size: 8px; color: #f59e0b; }
.gender-icon { width: 16px; height: 16px; }
.gender-icon.male { color: #3b82f6; }
.gender-icon.female { color: #ec4899; }

.label-tile {
    height: 38px; display: flex; align-items: center; justify-content: center;
    font-size: 9px; font-weight: 800; text-transform: uppercase; border-radius: 6px; padding: 0 4px; border: 1px solid #cbd5e1;
}
.label-default { background: #f8fafc; color: #64748b; }
.label-exit { background: #fffbeb; color: #92400e; border-color: #fcd34d; }
.label-stairs { background: #f1f5f9; color: #94a3b8; }
.label-tv { background: #eff6ff; color: #1e40af; border-color: #bfdbfe; }
.label-wc { background: #f5f3ff; color: #5b21b6; border-color: #ddd6fe; }
.span-2 { grid-column: span 2; }

.table-cell {
    grid-column: span 2; height: 26px; background: #f1f5f9; border: 1px dashed #cbd5e1;
    border-radius: 13px; display: flex; align-items: center; justify-content: center;
    font-size: 9px; font-weight: 700; color: #94a3b8; margin: 4px 0;
}

.driver-cell { width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; background: #f8fafc; border-radius: 21px; }
.driver-icon { width: 20px; height: 20px; color: #cbd5e1; }
.guide-cell { width: 42px; height: 42px; border: 1.5px dashed #cbd5e1; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 10px; font-weight: 700; }

.floor-switcher { display: flex; gap: 4px; background: #f1f5f9; padding: 3px; border-radius: 10px; margin-bottom: 12px; }
.floor-switcher button { flex: 1; border: none; background: none; padding: 6px; font-size: 11px; font-weight: 700; color: #64748b; border-radius: 7px; cursor: pointer; }
.floor-switcher button.active { background: #fff; color: #2563eb; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }

.facilities-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; margin-top: 8px; }
.facility-cell { font-size: 8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; text-align: center; background: #f8fafc; padding: 6px; border-radius: 6px; }
.baggage-cell { grid-column: 1 / -1; font-size: 8px; font-weight: 800; color: #cbd5e1; text-align: center; padding: 8px; background: #f8fafc; border-radius: 6px; margin-top: 4px; }

.last-row-grid { grid-column: 1 / -1; display: flex; gap: 4px; justify-content: center; }

.legend { margin-top: 16px; display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
.legend .item { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #64748b; font-weight: 600; }
.legend .swatch { width: 20px; height: 20px; border-radius: 4px; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 9px; }
.legend .swatch.selected { background: #2563eb; color: #fff; border-color: #1e40af; }
.legend .swatch.male { background: #eff6ff; border-color: #bfdbfe; }
.legend .swatch.female { background: #fdf2f8; border-color: #fbcfe8; }
.legend .swatch.premium { background: #fffbeb; border-color: #fcd34d; color: #f59e0b; }
.ico { width: 10px; height: 10px; }
</style>
