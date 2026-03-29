// ─── Labyrint Hero – Inventory System ────────────────────────────────────────
// Manages two equipment slots (weapon, armor) + 10-slot backpack.

class Inventory {
    constructor() {
        this.equipped = { weapon: null, armor: null };
        this.backpack  = new Array(10).fill(null); // null = empty slot
    }

    // ── Queries ───────────────────────────────────────────────────────────────

    get isFull() {
        return !this.backpack.includes(null);
    }

    get itemCount() {
        return this.backpack.filter(Boolean).length;
    }

    // ── Pick up / add ─────────────────────────────────────────────────────────

    /** Returns true if item was successfully added to backpack */
    addItem(itemDef) {
        const slot = this.backpack.indexOf(null);
        if (slot === -1) return false;
        this.backpack[slot] = itemDef;
        return true;
    }

    // ── Use / equip ───────────────────────────────────────────────────────────

    /**
     * Activate a backpack slot.
     * - Equipment: equip it (swapping current if any, putting old back in slot)
     * - Consumable: use it (remove if consumed)
     * @param {number} slotIndex  backpack index 0–9
     * @param {Hero}   hero
     * @param {GameScene} scene   needed for some consumables (e.g. bomb)
     */
    useSlot(slotIndex, hero, scene = null) {
        const item = this.backpack[slotIndex];
        if (!item) return;

        if (item.type === 'weapon' || item.type === 'armor') {
            this._equip(slotIndex, hero);
        } else if (item.type === 'consumable') {
            const consumed = item.use(hero, scene);
            if (consumed) this.backpack[slotIndex] = null;
        }
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

    /** Remove item from backpack slot and return it (null if empty). */
    dropSlot(index) {
        const item = this.backpack[index];
        if (!item) return null;
        this.backpack[index] = null;
        return item;
    }

    /** Unequip and drop equipped item (returns item or null if nothing equipped / backpack full). */
    dropEquipped(slot, hero) {
        const item = this.equipped[slot];
        if (!item) return null;
        this._unapply(item, hero);
        this.equipped[slot] = null;
        return item;
    }

    // ── Private ───────────────────────────────────────────────────────────────

    _equip(slotIndex, item_or_index, hero) {
        // Allow calling as _equip(slotIndex, hero) with item already in backpack[slotIndex]
        let item, h;
        if (item_or_index instanceof Hero) {
            item = this.backpack[slotIndex];
            h    = item_or_index;
        } else {
            // legacy: shouldn't happen
            return;
        }
        if (!item) return;

        const equipSlot = item.type; // 'weapon' or 'armor'
        const current   = this.equipped[equipSlot];

        if (current) {
            // Swap: put old item into same backpack slot
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
            hero.hearts    += item.hearts;
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
        return {
            equipped: {
                weapon: this.equipped.weapon?.id || null,
                armor:  this.equipped.armor?.id  || null
            },
            backpack: this.backpack.map(i => i?.id || null)
        };
    }

    static deserialize(data, hero) {
        const inv = new Inventory();
        if (!data) return inv;

        const restoreItem = id => (id && ITEM_DEFS[id]) ? ITEM_DEFS[id] : null;

        ['weapon', 'armor'].forEach(slot => {
            const item = restoreItem(data.equipped[slot]);
            if (item) {
                inv.equipped[slot] = item;
                inv._apply(item, hero);
            }
        });

        data.backpack.forEach((id, i) => {
            inv.backpack[i] = restoreItem(id);
        });

        return inv;
    }
}
