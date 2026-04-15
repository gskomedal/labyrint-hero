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
