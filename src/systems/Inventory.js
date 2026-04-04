// ─── Labyrint Hero – Inventory System ────────────────────────────────────────
// Manages equipment slots (weapon, armor, quickUse) + 10-slot backpack.
// Consumables and tools stack up to 10 in a single backpack slot.

class Inventory {
    constructor() {
        this.equipped = { weapon: null, armor: null };
        this.quickUse = null;       // { id, count } – assigned consumable for Q/USE button
        this.backpack = new Array(10).fill(null); // null or { id, count } for stackable, or itemDef for equipment
    }

    // ── Queries ───────────────────────────────────────────────────────────────

    get isFull() {
        return !this.backpack.includes(null);
    }

    get itemCount() {
        return this.backpack.filter(Boolean).length;
    }

    // ── Stack helpers ─────────────────────────────────────────────────────────

    _isStackable(itemDef) {
        return itemDef.type === 'consumable' || itemDef.type === 'tool' || itemDef.type === 'mineral' || itemDef.type === 'fuel';
    }

    _getItemDef(entry) {
        if (!entry) return null;
        // Stacked entry: { id, count }
        if (entry.id && entry.count !== undefined) {
            return ITEM_DEFS[entry.id]
                || (typeof MINERAL_DEFS !== 'undefined' && MINERAL_DEFS[entry.id])
                || (typeof FUEL_DEFS !== 'undefined' && FUEL_DEFS[entry.id])
                || null;
        }
        // Plain item def (equipment)
        return entry;
    }

    _getCount(entry) {
        if (!entry) return 0;
        if (entry.count !== undefined) return entry.count;
        return 1;
    }

    // ── Pick up / add ─────────────────────────────────────────────────────────

    /** Returns true if item was successfully added to backpack */
    addItem(itemDef) {
        // Stackable: try to add to existing stack first
        if (this._isStackable(itemDef)) {
            for (let i = 0; i < this.backpack.length; i++) {
                const entry = this.backpack[i];
                if (entry && entry.id === itemDef.id && entry.count < 10) {
                    entry.count++;
                    return true;
                }
            }
            // No existing stack or all full – create new stack
            const slot = this.backpack.indexOf(null);
            if (slot === -1) return false;
            this.backpack[slot] = { id: itemDef.id, count: 1 };
            return true;
        }

        // Non-stackable (equipment)
        const slot = this.backpack.indexOf(null);
        if (slot === -1) return false;
        this.backpack[slot] = itemDef;
        return true;
    }

    // ── Use / equip ───────────────────────────────────────────────────────────

    /**
     * Activate a backpack slot.
     * - Equipment: equip it (swapping current if any, putting old back in slot)
     * - Consumable/tool: assign to quick-use slot (left-click) or use directly
     * @param {number} slotIndex  backpack index 0–9
     * @param {Hero}   hero
     * @param {GameScene} scene   needed for some consumables (e.g. bomb)
     */
    useSlot(slotIndex, hero, scene = null) {
        const entry = this.backpack[slotIndex];
        if (!entry) return;
        const itemDef = this._getItemDef(entry);
        if (!itemDef) return;

        if (itemDef.type === 'weapon' || itemDef.type === 'armor') {
            this._equip(slotIndex, hero);
        } else if (itemDef.type === 'consumable' || itemDef.type === 'tool') {
            // Assign to quick-use slot
            this._assignQuickUse(slotIndex);
        }
    }

    /** Assign a consumable/tool backpack slot to quick-use */
    _assignQuickUse(slotIndex) {
        const entry = this.backpack[slotIndex];
        if (!entry) return;
        const itemDef = this._getItemDef(entry);
        if (!itemDef || (itemDef.type !== 'consumable' && itemDef.type !== 'tool')) return;

        // If quick-use already has something, put it back in backpack
        if (this.quickUse) {
            // Try to stack back
            const oldDef = ITEM_DEFS[this.quickUse.id];
            if (oldDef) {
                for (let i = 0; i < this.quickUse.count; i++) {
                    this.addItem(oldDef);
                }
            }
        }

        // Move from backpack to quick-use
        this.quickUse = { id: entry.id, count: entry.count || 1 };
        this.backpack[slotIndex] = null;
    }

    /** Use the item in quick-use slot. Returns the itemDef if used, null otherwise. */
    useQuickItem(hero, scene) {
        if (!this.quickUse || this.quickUse.count <= 0) return null;
        const itemDef = ITEM_DEFS[this.quickUse.id];
        if (!itemDef) return null;

        if (itemDef.type === 'tool') return null; // Tools are auto-consumed elsewhere

        const consumed = itemDef.use(hero, scene);
        if (consumed) {
            this.quickUse.count--;
            if (this.quickUse.count <= 0) this.quickUse = null;
        }
        return consumed ? itemDef : null;
    }

    /** Unequip a slot ('weapon' or 'armor') back into backpack, if space */
    unequip(slot, hero) {
        const item = this.equipped[slot];
        if (!item) return false;
        if (this.isFull) return false;
        this._unapply(item, hero);
        this.equipped[slot] = null;
        this.addItem(item);
        return true;
    }

    /** Unequip quick-use back into backpack */
    unequipQuickUse() {
        if (!this.quickUse) return false;
        const itemDef = ITEM_DEFS[this.quickUse.id];
        if (!itemDef) { this.quickUse = null; return false; }
        for (let i = 0; i < this.quickUse.count; i++) {
            if (!this.addItem(itemDef)) return false; // backpack full
        }
        this.quickUse = null;
        return true;
    }

    /** Remove item from backpack slot and return itemDef (null if empty). Decrements stack. */
    dropSlot(index) {
        const entry = this.backpack[index];
        if (!entry) return null;
        const itemDef = this._getItemDef(entry);

        if (entry.count !== undefined) {
            entry.count--;
            if (entry.count <= 0) this.backpack[index] = null;
        } else {
            this.backpack[index] = null;
        }
        return itemDef;
    }

    /** Drop from quick-use slot (one item). Returns itemDef or null. */
    dropQuickUse() {
        if (!this.quickUse) return null;
        const itemDef = ITEM_DEFS[this.quickUse.id];
        this.quickUse.count--;
        if (this.quickUse.count <= 0) this.quickUse = null;
        return itemDef;
    }

    /** Unequip and drop equipped item (returns item or null). */
    dropEquipped(slot, hero) {
        const item = this.equipped[slot];
        if (!item) return null;
        this._unapply(item, hero);
        this.equipped[slot] = null;
        return item;
    }

    // ── Private ───────────────────────────────────────────────────────────────

    _equip(slotIndex, item_or_index, hero) {
        let item, h;
        if (item_or_index instanceof Hero) {
            item = this._getItemDef(this.backpack[slotIndex]);
            h    = item_or_index;
        } else {
            return;
        }
        if (!item) return;

        const equipSlot = item.type; // 'weapon' or 'armor'
        const current   = this.equipped[equipSlot];

        if (current) {
            this._unapply(current, h);
            this.backpack[slotIndex] = current;
        } else {
            this.backpack[slotIndex] = null;
        }

        this.equipped[equipSlot] = item;
        this._apply(item, h);
    }

    _apply(item, hero) {
        if (item.atk)    hero.attack    += item.atk;
        if (item.def)    hero.defense   += item.def;
        if (item.hearts) {
            hero.maxHearts += item.hearts;
        }
    }

    _unapply(item, hero) {
        if (item.atk)    hero.attack    -= item.atk;
        if (item.def)    hero.defense   -= item.def;
        if (item.hearts) {
            hero.maxHearts  -= item.hearts;
            hero.hearts      = Math.min(hero.hearts, hero.maxHearts);
        }
    }

    // ── Serialisation ─────────────────────────────────────────────────────────

    serialize() {
        const serializeEquip = (item) => {
            if (!item) return null;
            return item.rarity && item.rarity !== 'common'
                ? { id: item.id, rarity: item.rarity }
                : item.id;
        };
        return {
            equipped: {
                weapon: serializeEquip(this.equipped.weapon),
                armor:  serializeEquip(this.equipped.armor)
            },
            quickUse: this.quickUse ? { id: this.quickUse.id, count: this.quickUse.count } : null,
            backpack: this.backpack.map(entry => {
                if (!entry) return null;
                if (entry.count !== undefined) {
                    // Mark mineral/fuel entries so deserialization looks in correct DEF
                    const def = ITEM_DEFS[entry.id]
                        || (typeof MINERAL_DEFS !== 'undefined' && MINERAL_DEFS[entry.id])
                        || (typeof FUEL_DEFS !== 'undefined' && FUEL_DEFS[entry.id]);
                    const isMineral = def && def.type === 'mineral';
                    const isFuel = def && def.type === 'fuel';
                    if (isMineral) return { id: entry.id, count: entry.count, isMineral: true };
                    if (isFuel) return { id: entry.id, count: entry.count, isFuel: true };
                    return { id: entry.id, count: entry.count };
                }
                // Equipment: store rarity if non-common
                if (entry.rarity && entry.rarity !== 'common') {
                    return { id: entry.id, rarity: entry.rarity };
                }
                return entry.id || null;
            })
        };
    }

    static deserialize(data, hero) {
        const inv = new Inventory();
        if (!data) return inv;

        /** Restore an equipment entry (string id or {id, rarity}) */
        const restoreEquip = (raw) => {
            if (!raw) return null;
            if (typeof raw === 'string') {
                return ITEM_DEFS[raw] ? makeRarityItem(ITEM_DEFS[raw], 'common') : null;
            }
            if (raw.id && ITEM_DEFS[raw.id]) {
                return makeRarityItem(ITEM_DEFS[raw.id], raw.rarity || 'common');
            }
            return null;
        };

        ['weapon', 'armor'].forEach(slot => {
            const item = restoreEquip(data.equipped[slot]);
            if (item) {
                inv.equipped[slot] = item;
                inv._apply(item, hero);
            }
        });

        // Restore quick-use slot
        if (data.quickUse && data.quickUse.id && ITEM_DEFS[data.quickUse.id]) {
            inv.quickUse = { id: data.quickUse.id, count: data.quickUse.count || 1 };
        }

        // Restore backpack (supports old format [id], new [{id, count}], and rarity [{id, rarity}])
        if (data.backpack) {
            data.backpack.forEach((entry, i) => {
                if (!entry) { inv.backpack[i] = null; return; }
                if (typeof entry === 'string') {
                    const def = ITEM_DEFS[entry];
                    if (!def) return;
                    if (def.type === 'consumable' || def.type === 'tool') {
                        inv.backpack[i] = { id: entry, count: 1 };
                    } else {
                        inv.backpack[i] = makeRarityItem(def, 'common');
                    }
                } else if (entry.id) {
                    // Check if it's a mineral entry
                    if (entry.isMineral && typeof MINERAL_DEFS !== 'undefined' && MINERAL_DEFS[entry.id]) {
                        inv.backpack[i] = { id: entry.id, count: entry.count || 1 };
                    } else if (entry.isFuel && typeof FUEL_DEFS !== 'undefined' && FUEL_DEFS[entry.id]) {
                        inv.backpack[i] = { id: entry.id, count: entry.count || 1 };
                    } else if (ITEM_DEFS[entry.id]) {
                        if (entry.count !== undefined) {
                            // Stacked consumable/tool
                            inv.backpack[i] = { id: entry.id, count: entry.count || 1 };
                        } else {
                            // Equipment with optional rarity
                            inv.backpack[i] = makeRarityItem(ITEM_DEFS[entry.id], entry.rarity || 'common');
                        }
                    }
                }
            });
        }

        return inv;
    }
}
