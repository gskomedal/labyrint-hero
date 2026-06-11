// ─── Labyrint Hero 2 – LH1 compatibility shims ───────────────────────────────
// Small bridges that let LH1's scenes and systems run unchanged on Hero2.
// Loaded after the LH1 systems but before Hero2.

// LH1's Inventory._equip type-checks `hero instanceof Hero`. LH2 doesn't load
// the full LH1 Hero entity – Hero2 extends this empty base instead.
class Hero {}

// LH2 science XP: LH1's crafting systems don't know about the sciences, so
// the entry points are wrapped to grant XP – same rates as before:
// smelting 15 × tier, alloys 20 × tier, molecules 20 × tier.
(() => {
    const smelt = SmeltingSystem.prototype.smelt;
    SmeltingSystem.prototype.smelt = function (mineralDef, hero) {
        const result = smelt.call(this, mineralDef, hero);
        if (hero && hero.sciences) hero.sciences.addXP('metallurgi', 15 * (mineralDef.tier || 1));
        return result;
    };

    const craftAlloy = SmeltingSystem.prototype.craftAlloy;
    SmeltingSystem.prototype.craftAlloy = function (alloyId, hero) {
        const result = craftAlloy.call(this, alloyId, hero);
        if (result.success && hero && hero.sciences) {
            hero.sciences.addXP('metallurgi', 20 * (result.alloy.tier || 1));
        }
        return result;
    };

    const synthesize = ChemistrySystem.prototype.synthesize;
    ChemistrySystem.prototype.synthesize = function (moleculeId, hero, worldNum) {
        const result = synthesize.call(this, moleculeId, hero, worldNum);
        if (result && result.success && hero && hero.sciences) {
            const def = MOLECULE_DEFS[moleculeId];
            hero.sciences.addXP('kjemi', 20 * ((def && def.tier) || 1));
        }
        return result;
    };
})();
