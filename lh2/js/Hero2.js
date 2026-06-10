// ─── Labyrint Hero 2 – Hero state ────────────────────────────────────────────
// Holds position/area, sciences, inventory, element tracker and the modifier
// fields LH1's SmeltingSystem reads, so that system can be reused unchanged.

class Hero2 {
    constructor() {
        this.area = 'surface';
        this.pos = { x: 0, y: 0, z: 0 };

        this.maxHearts = LH2.MAX_HEARTS;
        this.hearts = this.maxHearts;

        this.sciences = new Sciences();
        this.elementTracker = new ElementTracker();

        this.inventory = new Inventory();
        this.inventory.expandBackpack(10); // 20 slots total

        // Crafted molecules live in a simple stash (no combat use in the
        // prototype, so they don't need to be usable backpack items).
        this.molecules = {}; // { moleculeId: count }

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
    }

    /** Re-derive science level effects onto SmeltingSystem modifier fields. */
    applyScienceEffects() {
        this.smeltingEfficiency = this.sciences.smeltEfficiency();
    }

    serialize() {
        return {
            area: this.area,
            pos: { ...this.pos },
            hearts: this.hearts,
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
        if (data.hearts !== undefined) hero.hearts = Math.max(1, data.hearts);
        hero.sciences = Sciences.deserialize(data.sciences);
        hero.elementTracker = ElementTracker.deserialize(data.elements);
        if (data.inventory) hero.inventory = Inventory.deserialize(data.inventory, hero);
        if (hero.inventory.backpack.length < 20) {
            hero.inventory.expandBackpack(20 - hero.inventory.backpack.length);
        }
        if (data.molecules) hero.molecules = { ...data.molecules };
        hero.fuelReserve = data.fuelReserve || 0;
        hero.applyScienceEffects();
        return hero;
    }
}
