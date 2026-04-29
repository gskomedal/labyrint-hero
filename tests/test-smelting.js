// ─── Smelting System Tests ───────────────────────────────────────────────────

describe('SmeltingSystem – canSmelt', () => {
    it('returns true with enough fuel', () => {
        const smelter = new SmeltingSystem();
        const mineral = MINERAL_DEFS.chalcopyrite;
        const hero = { smeltingEfficiency: 0, miningYieldBonus: 0, oreEfficiencyChance: 0, elementTracker: new ElementTracker() };
        const result = smelter.canSmelt(mineral, 100, hero);
        expect(result.canSmelt).toBeTrue();
        expect(result.energyCost).toBeGreaterThan(0);
    });

    it('returns false with zero fuel', () => {
        const smelter = new SmeltingSystem();
        const mineral = MINERAL_DEFS.chalcopyrite;
        const hero = { smeltingEfficiency: 0, miningYieldBonus: 0, oreEfficiencyChance: 0, elementTracker: new ElementTracker() };
        const result = smelter.canSmelt(mineral, 0, hero);
        expect(result.canSmelt).toBeFalse();
    });
});

describe('SmeltingSystem – smelt', () => {
    it('produces elements from a mineral', () => {
        const smelter = new SmeltingSystem();
        const mineral = MINERAL_DEFS.chalcopyrite;
        const hero = {
            smeltingEfficiency: 0,
            miningYieldBonus: 0,
            oreEfficiencyChance: 0,
            elementTracker: new ElementTracker()
        };

        // Run multiple times to account for chance-based yields
        let gotElements = false;
        for (let i = 0; i < 20; i++) {
            const result = smelter.smelt(mineral, hero);
            if (result.elements.length > 0) {
                gotElements = true;
                break;
            }
        }
        expect(gotElements).toBeTrue();
    });

    it('returns correct energy cost', () => {
        const smelter = new SmeltingSystem();
        const mineral = MINERAL_DEFS.chalcopyrite;
        const hero = { smeltingEfficiency: 0, miningYieldBonus: 0, oreEfficiencyChance: 0, elementTracker: new ElementTracker() };
        const result = smelter.smelt(mineral, hero);
        expect(result.energyCost).toBe(mineral.energyCost);
    });

    it('collects elements in hero tracker', () => {
        const smelter = new SmeltingSystem();
        const mineral = MINERAL_DEFS.chalcopyrite;
        const tracker = new ElementTracker();
        const hero = {
            smeltingEfficiency: 0,
            miningYieldBonus: 10, // high bonus to guarantee yields
            oreEfficiencyChance: 0,
            elementTracker: tracker
        };

        for (let i = 0; i < 20; i++) smelter.smelt(mineral, hero);

        // Copper ore yields Cu – should have some collected
        const cuCount = tracker.getCount('Cu');
        expect(cuCount).toBeGreaterThan(0);
    });
});

describe('SmeltingSystem – fuel calculation', () => {
    it('calculates fuel from backpack items', () => {
        const smelter = new SmeltingSystem();
        const hero = {
            inventory: new Inventory(),
            campStash: [],
            smeltingEfficiency: 0
        };

        // Add wood fuel to backpack
        if (typeof FUEL_DEFS !== 'undefined' && FUEL_DEFS.wood) {
            hero.inventory.addItem(FUEL_DEFS.wood);
            hero.inventory.addItem(FUEL_DEFS.wood);
            const fuel = smelter.calculateFuelEnergy(hero);
            expect(fuel).toBeGreaterThan(0);
        }
    });
});

describe('SmeltingSystem – fusion energy', () => {
    function makeHero() {
        return {
            inventory: new Inventory(),
            campStash: [],
            smeltingEfficiency: 0,
            fusionMastered: true,
            fusionEnergyMul: 5.0,
            elementTracker: new ElementTracker()
        };
    }

    it('requires both H and Li (min, not sum)', () => {
        const smelter = new SmeltingSystem();
        const hero = makeHero();
        // Only Li — fusion should yield zero energy from virtual fuel.
        hero.elementTracker.collect('Li', 10);
        expect(smelter.calculateFuelEnergy(hero)).toBe(0);

        // Add H — energy now bounded by min(H, Li) pairs.
        hero.elementTracker.collect('H', 3);
        const energy = smelter.calculateFuelEnergy(hero);
        // 3 pairs × 230 base × 5.0 mul = 3450
        expect(energy).toBe(3 * 230 * 5);
    });

    it('consumes 1 H + 1 Li per pair and produces He as byproduct', () => {
        const smelter = new SmeltingSystem();
        const hero = makeHero();
        hero.elementTracker.collect('H', 4);
        hero.elementTracker.collect('Li', 4);

        // Each pair = 230 * 5 = 1150 energy. Drain ~2 pairs.
        const ok = smelter.consumeFuel(hero, 2300);
        expect(ok).toBeTrue();
        expect(hero.elementTracker.getCount('H')).toBe(2);
        expect(hero.elementTracker.getCount('Li')).toBe(2);
        expect(hero.elementTracker.getCount('He')).toBeGreaterThan(0);
    });

    it('grants fusion energy via fusionUnlocked at base multiplier', () => {
        const smelter = new SmeltingSystem();
        const hero = makeHero();
        hero.fusionMastered = false;
        hero.fusionEnergyMul = 1.0;
        hero.fusionUnlocked = true;
        hero.elementTracker.collect('H', 2);
        hero.elementTracker.collect('Li', 2);
        // 2 pairs × 230 × 1.0 = 460
        expect(smelter.calculateFuelEnergy(hero)).toBe(460);
    });
});

describe('SmeltingSystem – fission virtual fuel', () => {
    it('consumes Th before U when both are available', () => {
        const smelter = new SmeltingSystem();
        const hero = {
            inventory: new Inventory(),
            campStash: [],
            smeltingEfficiency: 0,
            fissionMastered: true,
            fissionEnergyMul: 2.0,
            elementTracker: new ElementTracker()
        };
        hero.elementTracker.collect('U', 2);
        hero.elementTracker.collect('Th', 2);

        // Drain enough to consume both Th but keep U intact (Th yields 80 each).
        smelter.consumeFuel(hero, 160);
        expect(hero.elementTracker.getCount('Th')).toBe(0);
        expect(hero.elementTracker.getCount('U')).toBe(2);
    });
});

describe('SmeltingSystem – semiconductor crafting', () => {
    it('crafts a silicon wafer from refined Si + raw B + raw P', () => {
        const smelter = new SmeltingSystem();
        const tracker = new ElementTracker();
        const hero = {
            smeltingEfficiency: 0,
            elementTracker: tracker,
            refinedElements: { pure_si: 1 },
            alloyInventory: {}
        };
        tracker.collect('B', 1);
        tracker.collect('P', 1);

        const check = smelter.canCraftSemiconductor('silicon_wafer', hero, 999);
        expect(check.canCraft).toBeTrue();

        const result = smelter.craftSemiconductor('silicon_wafer', hero);
        expect(result.success).toBeTrue();
        expect(hero.alloyInventory.silicon_wafer).toBe(1);
        expect(hero.refinedElements.pure_si || 0).toBe(0);
        expect(tracker.getCount('B')).toBe(0);
        expect(tracker.getCount('P')).toBe(0);
    });

    it('blocks germanium crystal craft without pure_si', () => {
        const smelter = new SmeltingSystem();
        const hero = {
            smeltingEfficiency: 0,
            elementTracker: new ElementTracker(),
            refinedElements: { pure_ge: 5 },
            alloyInventory: {}
        };
        const check = smelter.canCraftSemiconductor('germanium_crystal', hero, 999);
        expect(check.canCraft).toBeFalse();
        expect(check.missing.length).toBeGreaterThan(0);
    });
});
