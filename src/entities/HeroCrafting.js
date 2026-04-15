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
        hero.mineralIdentifyLevel = 0;
        hero.miningYieldBonus = 0;
        hero.doubleYieldChance = 0;       // Geolog T2: double-yield chance per stack
        hero.smeltBonusElement = 0;
        hero.guaranteedRareMineral = false;
        hero.prospectorHighTier = false;  // Geolog T3 world 5+ upgrade
        hero.mineralMinimap = false;      // Geolog T1: mineral dots on minimap
        hero.geodeSplitter = false;       // Geolog T4: gemstone every 10 smelts
        hero.smeltCountForGeode = 0;
        hero.mineralsCollected = 0;
        hero.totalPlayTime = 0; // cumulative seconds across all worlds

        // Metallurgy mod (Phase 2)
        hero.metallurgistUnlocked = false;
        hero.smeltingSpeedMul = 1.0;
        hero.smeltingEfficiency = 1.0;
        hero.smeltExtraYieldChance = 0;
        hero.alloyMasteryBonus = 0;
        hero.alloyStatBonus = 0;
        hero.oreEfficiencyChance = 0;
        hero.doubleAlloyChance = 0;
        hero.fastSmeltStacks = 0;      // Metallurg T1 stack count
        hero.batchSmeltSize = 1;       // Metallurg T1 max-stack: batch-smelt amount
        hero.reforgeUnlocked = false;  // Metallurg T4: reforge action
        hero.alloyInventory = {};

        // Chemistry mod (Phase 3)
        hero.chemistUnlocked = false;
        hero.chemLabUnlocked = false;
        hero.potionDurationBonus = 0;
        hero.potionPotencyBonus = 0;
        hero.potionMagnitudeBonus = 0;     // Kjemiker T1: potion stat-size buff
        hero.chemBombBonus = 0;
        hero.chemRadiusBonus = 0;
        hero.chemAcidDefShred = 0;         // Kjemiker T2: acid bomb -Def on hit
        hero.chemDoubleBrewChance = 0;     // Kjemiker T3: 2-for-1 bomb craft chance
        hero.chemBombChain = false;        // Kjemiker T4: bomb chain to 1 extra
        hero.transmutationUnlocked = false; // Transmutasjon synergy (3-path)
        hero.toxicBladeChance = 0;

        // Zone progression (Phase 4)
        hero.completedZones = [];

        // Element bonus rewards
        hero.appliedElementBonuses = {};
        hero.elementGoldMul = 0;
        hero.elementPoisonResist = 0;
        hero.elementArmorBonus = 0;
        hero.cosmicPower = false;
        hero.fusionUnlocked = false;
        hero.fissionUpgraded = false;
        hero.merchantMineralsUnlocked = false;
        hero.magicAoeUnlocked = false;
        hero.elementTitle = null;
        hero.legendaryItemEarned = false;

        // Camp stash – persistent storage for minerals, fuel, etc.
        hero.campStash = [];
    },

    /** Return serializable crafting state from a hero instance. */
    serialize(hero) {
        return {
            elementTracker:       hero.elementTracker.serialize(),
            geologistUnlocked:    hero.geologistUnlocked,
            mineralVisionRadius:  hero.mineralVisionRadius,
            mineralIdentifyLevel: hero.mineralIdentifyLevel,
            miningYieldBonus:     hero.miningYieldBonus,
            doubleYieldChance:    hero.doubleYieldChance,
            smeltBonusElement:    hero.smeltBonusElement,
            guaranteedRareMineral: hero.guaranteedRareMineral,
            prospectorHighTier:   hero.prospectorHighTier,
            mineralMinimap:       hero.mineralMinimap,
            geodeSplitter:        hero.geodeSplitter,
            smeltCountForGeode:   hero.smeltCountForGeode,
            mineralsCollected:    hero.mineralsCollected,
            totalPlayTime:        hero.totalPlayTime,
            metallurgistUnlocked: hero.metallurgistUnlocked,
            smeltingSpeedMul:     hero.smeltingSpeedMul,
            smeltingEfficiency:   hero.smeltingEfficiency,
            smeltExtraYieldChance: hero.smeltExtraYieldChance,
            alloyMasteryBonus:    hero.alloyMasteryBonus,
            alloyStatBonus:       hero.alloyStatBonus,
            oreEfficiencyChance:  hero.oreEfficiencyChance,
            doubleAlloyChance:    hero.doubleAlloyChance,
            fastSmeltStacks:      hero.fastSmeltStacks,
            batchSmeltSize:       hero.batchSmeltSize,
            reforgeUnlocked:      hero.reforgeUnlocked,
            alloyInventory:       { ...hero.alloyInventory },
            campStash:            hero.campStash.map(e => ({ ...e })),
            chemistUnlocked:      hero.chemistUnlocked,
            chemLabUnlocked:      hero.chemLabUnlocked,
            potionDurationBonus:  hero.potionDurationBonus,
            potionPotencyBonus:   hero.potionPotencyBonus,
            potionMagnitudeBonus: hero.potionMagnitudeBonus,
            chemBombBonus:        hero.chemBombBonus,
            chemRadiusBonus:      hero.chemRadiusBonus,
            chemAcidDefShred:     hero.chemAcidDefShred,
            chemDoubleBrewChance: hero.chemDoubleBrewChance,
            chemBombChain:        hero.chemBombChain,
            transmutationUnlocked: hero.transmutationUnlocked,
            toxicBladeChance:     hero.toxicBladeChance,
            completedZones:       [...hero.completedZones],
            appliedElementBonuses: { ...hero.appliedElementBonuses },
            elementGoldMul:       hero.elementGoldMul,
            elementPoisonResist:  hero.elementPoisonResist,
            elementArmorBonus:    hero.elementArmorBonus,
            cosmicPower:          hero.cosmicPower,
            fusionUnlocked:       hero.fusionUnlocked,
            fissionUpgraded:      hero.fissionUpgraded,
            merchantMineralsUnlocked: hero.merchantMineralsUnlocked,
            magicAoeUnlocked:     hero.magicAoeUnlocked,
            elementTitle:         hero.elementTitle,
            legendaryItemEarned:  hero.legendaryItemEarned,
        };
    },

    /** Restore crafting state onto a hero from saved stats. */
    applyStats(hero, stats) {
        hero.elementTracker       = ElementTracker.deserialize(stats.elementTracker || null);
        hero.geologistUnlocked    = stats.geologistUnlocked    || false;
        hero.mineralVisionRadius  = stats.mineralVisionRadius  || 0;
        hero.mineralIdentifyLevel = stats.mineralIdentifyLevel || 0;
        hero.miningYieldBonus     = stats.miningYieldBonus     || 0;
        hero.doubleYieldChance    = stats.doubleYieldChance    || 0;
        hero.smeltBonusElement    = stats.smeltBonusElement    || 0;
        hero.guaranteedRareMineral = stats.guaranteedRareMineral || false;
        hero.prospectorHighTier   = stats.prospectorHighTier   || false;
        hero.mineralMinimap       = stats.mineralMinimap       || false;
        hero.geodeSplitter        = stats.geodeSplitter        || false;
        hero.smeltCountForGeode   = stats.smeltCountForGeode   || 0;
        hero.mineralsCollected    = stats.mineralsCollected    || 0;
        hero.totalPlayTime        = stats.totalPlayTime        || 0;
        hero.metallurgistUnlocked = stats.metallurgistUnlocked || false;
        hero.smeltingSpeedMul     = stats.smeltingSpeedMul     || 1.0;
        hero.smeltingEfficiency   = stats.smeltingEfficiency   || 1.0;
        hero.smeltExtraYieldChance = stats.smeltExtraYieldChance || 0;
        hero.alloyMasteryBonus    = stats.alloyMasteryBonus    || 0;
        hero.alloyStatBonus       = stats.alloyStatBonus       || 0;
        hero.oreEfficiencyChance  = stats.oreEfficiencyChance  || 0;
        hero.doubleAlloyChance    = stats.doubleAlloyChance    || 0;
        hero.fastSmeltStacks      = stats.fastSmeltStacks      || 0;
        hero.batchSmeltSize       = stats.batchSmeltSize       || 1;
        hero.reforgeUnlocked      = stats.reforgeUnlocked      || false;
        hero.alloyInventory       = stats.alloyInventory       ? { ...stats.alloyInventory } : {};
        hero.campStash            = (stats.campStash || []).map(e => ({ ...e }));
        hero.chemistUnlocked      = stats.chemistUnlocked      || false;
        hero.chemLabUnlocked      = stats.chemLabUnlocked      || false;
        hero.potionDurationBonus  = stats.potionDurationBonus  || 0;
        hero.potionPotencyBonus   = stats.potionPotencyBonus   || 0;
        hero.potionMagnitudeBonus = stats.potionMagnitudeBonus || 0;
        hero.chemBombBonus        = stats.chemBombBonus        || 0;
        hero.chemRadiusBonus      = stats.chemRadiusBonus      || 0;
        hero.chemAcidDefShred     = stats.chemAcidDefShred     || 0;
        hero.chemDoubleBrewChance = stats.chemDoubleBrewChance || 0;
        hero.chemBombChain        = stats.chemBombChain        || false;
        hero.transmutationUnlocked = stats.transmutationUnlocked || false;
        hero.toxicBladeChance     = stats.toxicBladeChance     || 0;
        hero.completedZones       = stats.completedZones       ? [...stats.completedZones] : [];
        hero.appliedElementBonuses = stats.appliedElementBonuses ? { ...stats.appliedElementBonuses } : {};
        hero.elementGoldMul       = stats.elementGoldMul       || 0;
        hero.elementPoisonResist  = stats.elementPoisonResist  || 0;
        hero.elementArmorBonus    = stats.elementArmorBonus    || 0;
        hero.cosmicPower          = stats.cosmicPower          || false;
        hero.fusionUnlocked       = stats.fusionUnlocked       || false;
        hero.fissionUpgraded      = stats.fissionUpgraded      || false;
        hero.merchantMineralsUnlocked = stats.merchantMineralsUnlocked || false;
        hero.magicAoeUnlocked     = stats.magicAoeUnlocked     || false;
        hero.elementTitle         = stats.elementTitle         || null;
        hero.legendaryItemEarned  = stats.legendaryItemEarned  || false;
    }
};
