// ─── Labyrint Hero 2 – Hero state ────────────────────────────────────────────
// Holds position/area, hero level + skill tree (LH1-style), equipment,
// sciences, inventory, element tracker and the modifier fields LH1's
// SmeltingSystem reads, so that system can be reused unchanged.

class Hero2 {
    constructor() {
        this.area = 'surface';
        this.pos = { x: 0, y: 0, z: 0 };

        // Hero level – LH1's curve. XP comes from defeating monsters.
        this.level = 1;
        this.xp = 0;
        this.skillPoints = 0;
        this.skills = {}; // { skillId: stacks }

        // Combat & derived stats (recomputed by recompute())
        this.maxHearts = LH2.MAX_HEARTS;
        this.hearts = this.maxHearts;
        this.attack = 2;
        this.defense = 0;
        this.xpMul = 1;
        this.moveSpeedMul = 1;
        this.miningDoubleChance = 0;
        this.moleculeDoubleChance = 0;
        this.oreMapSkill = false;

        // Equipment (plain item objects from ALLOY_EQUIPMENT forging)
        this.equipped = { weapon: null, armor: null };

        this.sciences = new Sciences();
        this.elementTracker = new ElementTracker();

        this.inventory = new Inventory();
        this.inventory.expandBackpack(10); // 20 slots total

        // Crafted molecules live in a simple stash (no combat use in the
        // prototype, so they don't need to be usable backpack items).
        this.molecules = {}; // { moleculeId: count }

        // Alloys (crafted at the smelter, consumed by forging)
        this.alloyInventory = {}; // { alloyId: count }

        // Fuel energy carried over between smelts (LH1's energy reserve idea)
        this.fuelReserve = 0;

        // Defaults read by the reused SmeltingSystem
        this.smeltingEfficiency = 1.0;
        this.smeltingSpeedMul = 1.0;
        this.miningYieldBonus = 0;
        this.doubleYieldChance = 0;
        this.smeltExtraYieldChance = 0;
        this.smeltBonusElement = 0;
        this.oreEfficiencyChance = 0;
        this.geodeSplitter = false;
        this.discoveredAlloys = {};
        this.doubleAlloyChance = 0;
        this.alloyStatBonus = 0;
        this.alloyMasteryBonus = 0;
        this._skillSmeltMul = 1;
    }

    // ── Hero level / XP ──────────────────────────────────────────────────────

    get xpToNext() {
        return Math.round(LH2.XP_BASE * Math.pow(LH2.XP_GROWTH, this.level - 1));
    }

    addXP(amount) {
        this.xp += Math.round(amount * this.xpMul);
        let leveled = false;
        while (this.xp >= this.xpToNext) {
            this.xp -= this.xpToNext;
            this.level++;
            this.skillPoints++;
            leveled = true;
            EventBus.emit('lh2LevelUp', { level: this.level });
        }
        EventBus.emit('lh2HeroXP');
        return leveled;
    }

    skillStacks(id) {
        return this.skills[id] || 0;
    }

    /** Spend a skill point on a skill (if available and below max stacks). */
    learnSkill(id) {
        const def = SKILLS2_BY_ID[id];
        if (!def || this.skillPoints <= 0) return false;
        if (this.skillStacks(id) >= def.max) return false;
        this.skills[id] = this.skillStacks(id) + 1;
        this.skillPoints--;
        this.recompute();
        EventBus.emit('lh2SkillsChanged');
        return true;
    }

    /** Recompute all derived stats from base + skills + equipment. */
    recompute() {
        const s = (id) => this.skillStacks(id);
        const w = this.equipped.weapon, a = this.equipped.armor;

        this.attack = 2 + s('power_strike') + (w ? w.atk || 0 : 0) + (a ? a.atk || 0 : 0);
        this.defense = (w ? w.def || 0 : 0) + (a ? a.def || 0 : 0);
        this.maxHearts = LH2.MAX_HEARTS + s('battle_hardened')
            + (w ? w.hearts || 0 : 0) + (a ? a.hearts || 0 : 0);
        this.hearts = Math.min(this.hearts, this.maxHearts);

        this.xpMul = 1 + 0.20 * s('keen_eye');
        this.moveSpeedMul = 1 + 0.10 * s('fleet_foot');
        this.oreMapSkill = s('mineral_eye') > 0;
        this.miningDoubleChance = 0.25 * s('efficient_mining');
        this._skillSmeltMul = 1 - 0.15 * s('fast_smelting');
        this.doubleAlloyChance = 0.20 * s('alloy_mastery');
        this.moleculeDoubleChance = 0.30 * s('potent_chem');
        this.doubleYieldChance = 0.20 * s('careful_smelt');

        this.applyScienceEffects();
        EventBus.emit('lh2HeartsChanged');
    }

    /** Equip a weapon/armor item from a backpack slot (swaps with current). */
    equipItem(slotIndex) {
        const entry = this.inventory.backpack[slotIndex];
        if (!entry || !entry.type || (entry.type !== 'weapon' && entry.type !== 'armor')) return false;
        const old = this.equipped[entry.type];
        this.equipped[entry.type] = entry;
        this.inventory.backpack[slotIndex] = old || null;
        this.recompute();
        return true;
    }

    /** Unequip back into the backpack, if space. */
    unequipItem(slot) {
        const item = this.equipped[slot];
        if (!item || this.inventory.isFull) return false;
        const idx = this.inventory.backpack.indexOf(null);
        this.inventory.backpack[idx] = item;
        this.equipped[slot] = null;
        this.recompute();
        return true;
    }

    /** Re-derive science level effects onto SmeltingSystem modifier fields. */
    applyScienceEffects() {
        this.smeltingEfficiency = Math.max(0.4, this.sciences.smeltEfficiency() * this._skillSmeltMul);
    }

    // ── Serialization ────────────────────────────────────────────────────────

    serialize() {
        return {
            area: this.area,
            pos: { ...this.pos },
            hearts: this.hearts,
            level: this.level,
            xp: this.xp,
            skillPoints: this.skillPoints,
            skills: { ...this.skills },
            equipped: {
                weapon: this.equipped.weapon ? { ...this.equipped.weapon } : null,
                armor: this.equipped.armor ? { ...this.equipped.armor } : null,
            },
            alloyInventory: { ...this.alloyInventory },
            discoveredAlloys: { ...this.discoveredAlloys },
            sciences: this.sciences.serialize(),
            elements: this.elementTracker.serialize(),
            inventory: this.inventory.serialize(),
            equipmentSlots: this._serializeEquipmentSlots(),
            molecules: { ...this.molecules },
            fuelReserve: this.fuelReserve,
        };
    }

    // Forged equipment in the backpack is stored as plain objects; LH1's
    // Inventory.serialize would try ITEM_DEFS lookups, so they are stored
    // separately by slot index.
    _serializeEquipmentSlots() {
        const out = {};
        this.inventory.backpack.forEach((entry, i) => {
            if (entry && entry.type && (entry.type === 'weapon' || entry.type === 'armor') && entry.alloyId) {
                out[i] = { ...entry };
            }
        });
        return out;
    }

    static deserialize(data) {
        const hero = new Hero2();
        if (!data) return hero;
        if (data.area) hero.area = data.area;
        if (data.pos) hero.pos = { ...data.pos };
        hero.level = data.level || 1;
        hero.xp = data.xp || 0;
        hero.skillPoints = data.skillPoints || 0;
        if (data.skills) hero.skills = { ...data.skills };
        if (data.equipped) {
            hero.equipped.weapon = data.equipped.weapon ? { ...data.equipped.weapon } : null;
            hero.equipped.armor = data.equipped.armor ? { ...data.equipped.armor } : null;
        }
        if (data.alloyInventory) hero.alloyInventory = { ...data.alloyInventory };
        if (data.discoveredAlloys) hero.discoveredAlloys = { ...data.discoveredAlloys };
        hero.sciences = Sciences.deserialize(data.sciences);
        hero.elementTracker = ElementTracker.deserialize(data.elements);
        if (data.inventory) hero.inventory = Inventory.deserialize(data.inventory, hero);
        if (hero.inventory.backpack.length < 20) {
            hero.inventory.expandBackpack(20 - hero.inventory.backpack.length);
        }
        if (data.equipmentSlots) {
            for (const i in data.equipmentSlots) {
                hero.inventory.backpack[+i] = { ...data.equipmentSlots[i] };
            }
        }
        if (data.molecules) hero.molecules = { ...data.molecules };
        hero.fuelReserve = data.fuelReserve || 0;
        hero.recompute();
        if (data.hearts !== undefined) hero.hearts = Math.max(1, Math.min(data.hearts, hero.maxHearts));
        return hero;
    }
}
