// ─── Labyrint Hero 2 – LH1 compatibility shims ───────────────────────────────
// Small bridges that let LH1's scenes and systems run unchanged on Hero2.
// Loaded after the LH1 systems but before Hero2.

// LH1's Inventory._equip type-checks `hero instanceof Hero`. LH2 doesn't load
// the full LH1 Hero entity – Hero2 extends this empty base instead.
class Hero {}

// Zone/theme data so LH1's AudioManager.startMusic(worldNum) picks the right
// Grieg piece per LH2 area (it calls the global getZone). LH2 maps each area
// to a representative worldNum: surface=1, cave_2=4, cave_3=8, cave_4=13,
// cave_5=19 – the same boundaries as LH1's zones.
const ZONES = [
    { id: 'surface',    name: 'Overflatelag',   worlds: [1, 2, 3],                    themeIdx: 0 },
    { id: 'bedrock',    name: 'Grunnfjell',     worlds: [4, 5, 6, 7],                 themeIdx: 1 },
    { id: 'deep',       name: 'Dyplag',         worlds: [8, 9, 10, 11, 12],           themeIdx: 5 },
    { id: 'underworld', name: 'Underverden',    worlds: [13, 14, 15, 16, 17, 18],     themeIdx: 6 },
    { id: 'core',       name: 'Jordens kjerne', worlds: [19, 20, 21, 22, 23, 24, 25], themeIdx: 7 },
];
function getZone(worldNum) {
    return ZONES.find(z => z.worlds.includes(worldNum)) || ZONES[0];
}

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
