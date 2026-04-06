// ─── Labyrint Hero – Hero Crafting State ─────────────────────────────────────
// Extracted from Hero.js – manages all Elements, Metallurgy, Chemistry, and
// Camp Stash state. Properties are set directly on the hero object.

const HeroCrafting = {

    /** Initialize all crafting-related properties on a hero instance. */
    init(hero) {
        // Elements mod
        hero.elementTracker = new ElementTracker();
        hero.geologistUnlocked = false;
        hero.mineralVisionRadius = 0;
        hero.miningYieldBonus = 0;
        hero.guaranteedRareMineral = false;

        // Metallurgy mod (Phase 2)
        hero.metallurgistUnlocked = false;
        hero.smeltingSpeedMul = 1.0;
        hero.smeltingEfficiency = 1.0;
        hero.alloyMasteryBonus = 0;
        hero.alloyStatBonus = 0;
        hero.oreEfficiencyChance = 0;
        hero.alloyInventory = {};

        // Chemistry mod (Phase 3)
        hero.chemistUnlocked = false;
        hero.chemLabUnlocked = false;
        hero.potionDurationBonus = 0;
        hero.potionPotencyBonus = 0;
        hero.chemBombBonus = 0;
        hero.chemRadiusBonus = 0;
        hero.toxicBladeChance = 0;

        // Zone progression (Phase 4)
        hero.completedZones = [];

        // Camp stash – persistent storage for minerals, fuel, etc.
        hero.campStash = [];
    },

    /** Return serializable crafting state from a hero instance. */
    serialize(hero) {
        return {
            elementTracker:       hero.elementTracker.serialize(),
            geologistUnlocked:    hero.geologistUnlocked,
            mineralVisionRadius:  hero.mineralVisionRadius,
            miningYieldBonus:     hero.miningYieldBonus,
            guaranteedRareMineral: hero.guaranteedRareMineral,
            metallurgistUnlocked: hero.metallurgistUnlocked,
            smeltingSpeedMul:     hero.smeltingSpeedMul,
            smeltingEfficiency:   hero.smeltingEfficiency,
            alloyMasteryBonus:    hero.alloyMasteryBonus,
            alloyStatBonus:       hero.alloyStatBonus,
            oreEfficiencyChance:  hero.oreEfficiencyChance,
            alloyInventory:       { ...hero.alloyInventory },
            campStash:            hero.campStash.map(e => ({ ...e })),
            chemistUnlocked:      hero.chemistUnlocked,
            chemLabUnlocked:      hero.chemLabUnlocked,
            potionDurationBonus:  hero.potionDurationBonus,
            potionPotencyBonus:   hero.potionPotencyBonus,
            chemBombBonus:        hero.chemBombBonus,
            chemRadiusBonus:      hero.chemRadiusBonus,
            toxicBladeChance:     hero.toxicBladeChance,
            completedZones:       [...hero.completedZones],
        };
    },

    /** Restore crafting state onto a hero from saved stats. */
    applyStats(hero, stats) {
        hero.elementTracker       = ElementTracker.deserialize(stats.elementTracker || null);
        hero.geologistUnlocked    = stats.geologistUnlocked    || false;
        hero.mineralVisionRadius  = stats.mineralVisionRadius  || 0;
        hero.miningYieldBonus     = stats.miningYieldBonus     || 0;
        hero.guaranteedRareMineral = stats.guaranteedRareMineral || false;
        hero.metallurgistUnlocked = stats.metallurgistUnlocked || false;
        hero.smeltingSpeedMul     = stats.smeltingSpeedMul     || 1.0;
        hero.smeltingEfficiency   = stats.smeltingEfficiency   || 1.0;
        hero.alloyMasteryBonus    = stats.alloyMasteryBonus    || 0;
        hero.alloyStatBonus       = stats.alloyStatBonus       || 0;
        hero.oreEfficiencyChance  = stats.oreEfficiencyChance  || 0;
        hero.alloyInventory       = stats.alloyInventory       ? { ...stats.alloyInventory } : {};
        hero.campStash            = (stats.campStash || []).map(e => ({ ...e }));
        hero.chemistUnlocked      = stats.chemistUnlocked      || false;
        hero.chemLabUnlocked      = stats.chemLabUnlocked      || false;
        hero.potionDurationBonus  = stats.potionDurationBonus  || 0;
        hero.potionPotencyBonus   = stats.potionPotencyBonus   || 0;
        hero.chemBombBonus        = stats.chemBombBonus        || 0;
        hero.chemRadiusBonus      = stats.chemRadiusBonus      || 0;
        hero.toxicBladeChance     = stats.toxicBladeChance     || 0;
        hero.completedZones       = stats.completedZones       ? [...stats.completedZones] : [];
    }
};
