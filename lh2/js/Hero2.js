// ─── Labyrint Hero 2 – Hero state ────────────────────────────────────────────
// Holds position/area, hero level + LH1's full skill system (skills.js with
// paths, tiers and synergies – picked via the original SkillScene), equipment,
// sciences, inventory, element tracker and the modifier fields LH1's
// SmeltingSystem reads. Skill effects are derived by REPLAY: stats reset to
// base, then every skill in hero.skills is re-applied – so saves only store
// the skill list, never derived stats.

class Hero2 extends Hero {
    constructor() {
        super();
        this.area = 'surface';
        this.pos = { x: 0, y: 0, z: 0 };

        // Identity (LH1 scenes show name/portrait; creator comes later)
        this.heroName = 'Helt';
        this.race = 'human';
        this.appearance = (typeof defaultAppearance === 'function') ? defaultAppearance('human') : {};
        this.gold = 0;

        // Hero level – LH1's curve. XP comes from defeating monsters.
        this.level = 1;
        this.xp = 0;
        this.skillPoints = 0;
        this.skills = []; // LH1 format: array of skill ids, stacking = duplicates

        // LH1 path unlock flags – the sciences are core to LH2, so the three
        // base paths are open from the start; the physicist path waits for
        // accelerator content.
        this.geologistUnlocked = true;
        this.metallurgistUnlocked = true;
        this.chemistUnlocked = true;
        this.acceleratorUnlocked = false;

        // Equipment lives in LH1's Inventory (inventory.equipped) so
        // InventoryScene's equip/unequip flows work unchanged.

        this.sciences = new Sciences();
        this.elementTracker = new ElementTracker();

        this.inventory = new Inventory();
        this.inventory.expandBackpack(10); // 20 slots total

        this.molecules = {};        // legacy stash (pre-ChemLabScene saves)
        this.alloyInventory = {};   // { alloyId: count }
        this.campStash = [];        // LH1 camp storage: [{ id, count }]
        this.discoveredMinerals = {}; // { mineralId: true } – for the wiki
        this.discoveredAlloys = {};
        this.discoveredMolecules = {};
        this.fuelReserve = 0;

        this._resetSkillFields();
        this.hearts = this.maxHearts;
    }

    /**
     * Base values for every field LH1 skills/synergies mutate. Replayed
     * skills build on top of these. Unknown-to-LH2 fields (pet, potions,
     * crit...) are kept so skills.js apply() functions run unchanged –
     * LH2 mechanics read the ones they understand.
     */
    _resetSkillFields() {
        this.attack = 2;
        this.defense = 0;
        this.maxHearts = LH2.MAX_HEARTS;
        this.visionRadius = 5;
        this.xpMultiplier = 1;
        this.critChance = 0;
        this.dodgeChance = 0;
        this.counterChance = 0;
        this.thornsDamage = 0;
        this.toxicBladeChance = 0;

        // Geologist
        this.mineralVisionRadius = 0;
        this.mineralIdentifyLevel = 0;
        this.mineralMinimap = false;
        this.mineralMagnetRadius = 0;
        this.doubleYieldChance = 0;
        this.smeltBonusElement = 0;
        this.guaranteedRareMineral = false;
        this.prospectorHighTier = false;
        this.geodeSplitter = false;
        this.lootTierBonus = 0;

        // Metallurgist
        this.smeltingEfficiency = 1.0;
        this.smeltingSpeedMul = 1.0;
        this.fastSmeltStacks = 0;
        this.batchSmeltSize = 0;
        this.smeltExtraYieldChance = 0;
        this.oreEfficiencyChance = 0;
        this.doubleAlloyChance = 0;
        this.alloyMasteryBonus = 0;
        this.alloyStatBonus = 0;
        this.reforgeUnlocked = false;
        this.miningYieldBonus = 0;

        // Chemist
        this.potionDurationBonus = 0;
        this.potionPotencyBonus = 0;
        this.potionMagnitudeBonus = 0;
        this.chemBombBonus = 0;
        this.chemRadiusBonus = 0;
        this.chemAcidDefShred = 0;
        this.chemBombChain = false;
        this.chemDoubleBrewChance = 0;
        this.transmutationUnlocked = false;

        // Physicist
        this.semiconductorUnlocked = false;
        this.radiationShield = false;
        this.fissionMastered = false;
        this.fusionMastered = false;
        this.fissionEnergyMul = 1;
        this.fusionEnergyMul = 1;
        this.acceleratorEfficiency = 0;

        // Pet (no pets in LH2 yet – fields kept so apply() runs)
        this.petBonusAtk = 0;
        this.petBonusHp = 0;
        this.petBonusDef = 0;
        this.petSpeedBonus = 0;
        this.petHealShare = false;

        this._appliedSynergies = [];
    }

    // ── Hero level / XP ──────────────────────────────────────────────────────

    get xpToNext() {
        return Math.round(LH2.XP_BASE * Math.pow(LH2.XP_GROWTH, this.level - 1));
    }

    addXP(amount) {
        this.xp += Math.round(amount * (this.xpMultiplier || 1));
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

    /**
     * Re-derive ALL skill effects: reset to base, re-apply every skill in
     * order (LH1 skills.js apply functions), re-apply synergies, equipment
     * and science effects. Idempotent – called after picks, equips, science
     * level-ups and on load.
     */
    replaySkills() {
        const heartsBefore = this.hearts;
        this._resetSkillFields();

        // Reset backpack to base size (trailing empty slots only) so
        // battle_hardened's expandBackpack doesn't compound on every replay
        const bp = this.inventory.backpack;
        while (bp.length > 20 && bp[bp.length - 1] === null) bp.pop();

        for (const id of this.skills) {
            const def = typeof SKILL_DEFS !== 'undefined' && SKILL_DEFS.find(s => s.id === id);
            if (def && def.apply) def.apply(this);
        }
        if (typeof applySynergies === 'function') applySynergies(this);

        // Equipment on top of skills (LH1 model: inventory.equipped)
        for (const slot of ['weapon', 'armor']) {
            const item = this.inventory.equipped[slot];
            if (!item) continue;
            this.attack += item.atk || 0;
            this.defense += item.def || 0;
            this.maxHearts += item.hearts || 0;
            if (item.visionBonus) this.visionRadius += item.visionBonus;
            if (item.critBonus) this.critChance = Math.min(0.75, this.critChance + item.critBonus);
            if (item.dodgeBonus) this.dodgeChance = Math.min(0.6, this.dodgeChance + item.dodgeBonus);
        }

        // Science effects multiply on top (metallurgy cheapens smelting)
        this.smeltingEfficiency = Math.max(0.3, this.smeltingEfficiency * this.sciences.smeltEfficiency());

        // Bridge LH1 skill fields onto LH2 mechanics. Geology is a core
        // science in LH2, so the wiki always identifies discovered minerals.
        this.mineralIdentifyLevel = Math.max(this.mineralIdentifyLevel, 1);
        this.oreMapSkill = this.mineralMinimap || this.mineralVisionRadius > 0;
        this.miningDoubleChance = this.doubleYieldChance;
        this.moleculeDoubleChance = this.chemDoubleBrewChance;
        this.moveSpeedMul = 1;

        this.hearts = Math.min(heartsBefore, this.maxHearts);
        EventBus.emit('lh2HeartsChanged');
    }

    /** Kept as the common entry point (science level-ups call this). */
    applyScienceEffects() {
        this.replaySkills();
    }

    // ── Equipment ────────────────────────────────────────────────────────────
    // Equip/unequip happens through LH1's InventoryScene (inventory.useSlot /
    // unequip). Their incremental stat changes are consistent with the next
    // replaySkills() pass, which re-derives from inventory.equipped.

    // ── Serialization ────────────────────────────────────────────────────────

    serialize() {
        return {
            area: this.area,
            pos: { ...this.pos },
            hearts: this.hearts,
            level: this.level,
            xp: this.xp,
            gold: this.gold,
            heroName: this.heroName,
            race: this.race,
            appearance: { ...this.appearance },
            skillPoints: this.skillPoints,
            skills: [...this.skills],
            alloyInventory: { ...this.alloyInventory },
            campStash: this.campStash.map(e => ({ ...e })),
            discoveredAlloys: { ...this.discoveredAlloys },
            discoveredMinerals: { ...this.discoveredMinerals },
            discoveredMolecules: { ...this.discoveredMolecules },
            sciences: this.sciences.serialize(),
            elements: this.elementTracker.serialize(),
            inventory: this.inventory.serialize(),
            molecules: { ...this.molecules },
            fuelReserve: this.fuelReserve,
        };
    }

    static deserialize(data) {
        const hero = new Hero2();
        if (!data) return hero;
        if (data.area) hero.area = data.area;
        if (data.pos) hero.pos = { ...data.pos };
        hero.level = data.level || 1;
        hero.xp = data.xp || 0;
        hero.skillPoints = data.skillPoints || 0;

        // Skills: LH1 array format. Migrate the short-lived { id: stacks }
        // object format from the first LH2 skill tree, dropping ids that
        // don't exist in LH1's tree (points are refunded).
        if (Array.isArray(data.skills)) {
            hero.skills = [...data.skills];
        } else if (data.skills && typeof data.skills === 'object') {
            for (const [id, stacks] of Object.entries(data.skills)) {
                const exists = typeof SKILL_DEFS !== 'undefined' && SKILL_DEFS.some(s => s.id === id);
                for (let i = 0; i < stacks; i++) {
                    if (exists) hero.skills.push(id);
                    else hero.skillPoints++;
                }
            }
        }

        hero.gold = data.gold || 0;
        if (data.heroName) hero.heroName = data.heroName;
        if (data.race) hero.race = data.race;
        if (data.appearance) hero.appearance = { ...data.appearance };
        if (data.alloyInventory) hero.alloyInventory = { ...data.alloyInventory };
        if (data.campStash) hero.campStash = data.campStash.map(e => ({ ...e }));
        if (data.discoveredAlloys) hero.discoveredAlloys = { ...data.discoveredAlloys };
        if (data.discoveredMinerals) hero.discoveredMinerals = { ...data.discoveredMinerals };
        if (data.discoveredMolecules) hero.discoveredMolecules = { ...data.discoveredMolecules };
        hero.sciences = Sciences.deserialize(data.sciences);
        hero.elementTracker = ElementTracker.deserialize(data.elements);
        if (data.inventory) hero.inventory = Inventory.deserialize(data.inventory, hero);
        if (hero.inventory.backpack.length < 20) {
            hero.inventory.expandBackpack(20 - hero.inventory.backpack.length);
        }
        // Migration from older LH2 saves: hero-level equipped + exact-stat
        // equipment slots move into LH1's inventory.equipped/backpack model
        if (data.equipped) {
            for (const slot of ['weapon', 'armor']) {
                if (data.equipped[slot]) hero.inventory.equipped[slot] = { ...data.equipped[slot] };
            }
        }
        if (data.equipmentSlots) {
            for (const i in data.equipmentSlots) {
                hero.inventory.backpack[+i] = { ...data.equipmentSlots[i] };
            }
        }
        if (data.molecules) hero.molecules = { ...data.molecules };
        hero.fuelReserve = data.fuelReserve || 0;

        hero.hearts = 99; // replay clamps to maxHearts; restore saved below
        hero.replaySkills();
        if (data.hearts !== undefined) hero.hearts = Math.max(1, Math.min(data.hearts, hero.maxHearts));
        return hero;
    }
}
