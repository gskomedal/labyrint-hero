// ─── Labyrint Hero – Chemistry System ─────────────────────────────────────────
// Handles synthesis of chemical products from pure elements.
// Products are usable consumables (potions, bombs, medicines).

class ChemistrySystem {
    constructor() {}

    // ── Synthesis: Elements → Chemical Product ──────────────────────────────

    /**
     * Check if a molecule can be synthesized.
     * @param {string} moleculeId
     * @param {object} hero
     * @param {number} fuelEnergy - Available fuel (some recipes need energy)
     * @returns {{ canCraft: boolean, energyCost: number, missing: Array }}
     */
    canSynthesize(moleculeId, hero, fuelEnergy) {
        const mol = MOLECULE_DEFS[moleculeId];
        if (!mol) return { canCraft: false, energyCost: 0, missing: [] };

        const energyCost = this._adjustedEnergy(mol.energyCost, hero);
        const missing = [];

        for (const ingredient of mol.recipe) {
            const have = hero.elementTracker.getCount(ingredient.symbol);
            if (have < ingredient.amount) {
                missing.push({ symbol: ingredient.symbol, need: ingredient.amount, have });
            }
        }

        return {
            canCraft: missing.length === 0 && fuelEnergy >= energyCost,
            energyCost,
            missing
        };
    }

    /**
     * Synthesize a molecule, consuming elements.
     * Returns a usable item object that can go in the inventory.
     * @param {string} moleculeId
     * @param {object} hero
     * @returns {{ success: boolean, item: object, energyCost: number }}
     */
    synthesize(moleculeId, hero, worldNum) {
        const mol = MOLECULE_DEFS[moleculeId];
        if (!mol) return { success: false };

        // Consume elements
        for (const ingredient of mol.recipe) {
            hero.elementTracker.collected[ingredient.symbol] -= ingredient.amount;
            if (hero.elementTracker.collected[ingredient.symbol] <= 0) {
                delete hero.elementTracker.collected[ingredient.symbol];
            }
        }

        const energyCost = this._adjustedEnergy(mol.energyCost, hero);

        // Create usable item from molecule definition
        const item = this._createUsableItem(mol, hero, worldNum);

        // Kjemiker T3 "Double Brew": chance to produce an extra bomb per craft.
        let bonusItem = null;
        if (mol.subtype === 'explosive' && (hero.chemDoubleBrewChance || 0) > 0) {
            if (Math.random() < hero.chemDoubleBrewChance) {
                bonusItem = this._createUsableItem(mol, hero, worldNum);
            }
        }

        return { success: true, item, bonusItem, energyCost };
    }

    /**
     * Get all molecules the player can currently synthesize.
     * @param {object} hero
     * @param {number} fuelEnergy
     * @returns {Array<{ mol: object, canCraft: boolean, missing: Array }>}
     */
    getAvailableMolecules(hero, fuelEnergy) {
        if (typeof MOLECULE_DEFS === 'undefined') return [];
        const results = [];
        for (const id of Object.keys(MOLECULE_DEFS)) {
            const check = this.canSynthesize(id, hero, fuelEnergy);
            results.push({ mol: MOLECULE_DEFS[id], ...check });
        }
        results.sort((a, b) => {
            if (a.canCraft !== b.canCraft) return a.canCraft ? -1 : 1;
            return a.mol.tier - b.mol.tier;
        });
        return results;
    }

    // ── Create usable inventory item from molecule ──────────────────────────

    _createUsableItem(mol, hero, worldNum) {
        const eff = mol.effects;
        const wn = worldNum || hero.worldNum || 1;
        // Separate scaling curves: bombs scale faster than potions so they
        // keep pace with world monster HP; potions keep the older curve so
        // buffs don't become overpowered.
        const potionScale = 1 + (wn - 1) * 0.4;
        const bombScale = 1 + (wn - 1) * 0.6;
        const bombFloor = wn * 2; // flat damage bonus per world
        // Radius auto-upgrade kicks in at world 5 and 8 so high-world bombs
        // feel noticeably more effective.
        const bombRadiusBonus = (wn >= 8 ? 2 : (wn >= 5 ? 1 : 0));
        const potencyMul = 1 + (hero.potionPotencyBonus || 0);
        const potionMagnitudeMul = 1 + (hero.potionMagnitudeBonus || 0);
        const durationMul = 1 + (hero.potionDurationBonus || 0);
        const bombDmgMul = 1 + (hero.chemBombBonus || 0);
        const bombRadMul = 1 + (hero.chemRadiusBonus || 0);
        const acidDefShred = hero.chemAcidDefShred || 0;
        const bombChainBonus = hero.chemBombChain ? 1 : 0;

        const item = {
            id: mol.id,
            name: mol.name,
            type: 'consumable',
            color: mol.color,
            desc: mol.desc,
            tier: mol.tier,
            _chemType: mol.subtype,
        };

        if (!eff) {
            // Base compound with no direct use
            item.use = () => false;
            return item;
        }

        // Build the use() function based on effect type
        if (eff.onUse === 'heal') {
            // From world 4+ healing potions scale with % max HP so they stay
            // meaningful against higher HP pools.
            const flatHP = Math.round(eff.healHP * potencyMul * potionMagnitudeMul * potionScale);
            const hp = wn >= 4
                ? Math.max(flatHP, Math.round((hero.maxHearts || flatHP) * 0.25 * potencyMul))
                : flatHP;
            item.desc = `+${hp} HP`;
            item.use = (hero, scene) => {
                hero.hearts = Math.min(hero.hearts + hp, hero.maxHearts);
                if (hero.petHealShare && scene && scene.pet && scene.pet.alive) scene.pet.heal(hp);
                return true;
            };
        } else if (eff.onUse === 'buff') {
            const amt = Math.round(eff.amount * potencyMul * potionMagnitudeMul * potionScale);
            const dur = Math.round(eff.durationMs * durationMul);
            item.desc = `+${amt} ${eff.stat} (${Math.round(dur / 1000)}s)`;
            item.use = (hero) => {
                hero.addTempBuff(eff.stat, amt, dur);
                return true;
            };
        } else if (eff.onUse === 'cure_all') {
            const hp = Math.round((eff.healHP || 0) * potencyMul * potionMagnitudeMul * potionScale);
            item.use = (hero, scene) => {
                hero.clearAllEffects();
                if (hp > 0) hero.hearts = Math.min(hero.hearts + hp, hero.maxHearts);
                if (hp > 0 && hero.petHealShare && scene && scene.pet && scene.pet.alive) scene.pet.heal(hp);
                return true;
            };
        } else if (eff.onUse === 'bomb') {
            const dmg = Math.round(eff.damage * bombDmgMul * bombScale + bombFloor);
            const rad = Math.round(eff.radius * bombRadMul) + bombRadiusBonus;
            const defPierce = eff.defPierce || 0;
            const chainCount = (eff.chain || 0) + bombChainBonus;
            item.desc = `${dmg} skade, radius ${rad}` + (defPierce ? `, ignorer ${defPierce} Def` : '');
            item.use = (hero, scene) => {
                if (!scene) return false;
                const hitIds = new Set();
                const applyHit = (m, mul = 1) => {
                    if (!m || !m.alive || hitIds.has(m)) return;
                    hitIds.add(m);
                    let dealt = Math.max(1, Math.round(dmg * mul));
                    if (defPierce > 0 && typeof m.defense === 'number') {
                        dealt += Math.min(defPierce, m.defense);
                    }
                    m.takeDamage(dealt);
                };
                // Primary AoE
                for (const m of scene.monsters) {
                    if (!m.alive) continue;
                    const d = Math.abs(m.gridX - hero.gridX) + Math.abs(m.gridY - hero.gridY);
                    if (d <= rad) applyHit(m);
                }
                // Chain lightning to nearest survivors outside the radius at 50% dmg
                for (let i = 0; i < chainCount; i++) {
                    let best = null, bestD = Infinity;
                    for (const m of scene.monsters) {
                        if (!m.alive || hitIds.has(m)) continue;
                        const d = Math.abs(m.gridX - hero.gridX) + Math.abs(m.gridY - hero.gridY);
                        if (d < bestD) { best = m; bestD = d; }
                    }
                    if (best) applyHit(best, 0.5);
                    else break;
                }
                scene.monsters = scene.monsters.filter(m => m.alive);
                return true;
            };
        } else if (eff.onUse === 'acid_bomb') {
            const dmg = Math.round(eff.damage * bombDmgMul * bombScale + bombFloor);
            const rad = Math.round(eff.radius * bombRadMul) + bombRadiusBonus;
            // Burn duration scales with world: +1 round per 4 worlds.
            const dur = (eff.duration || 3) + Math.floor(wn / 4);
            const defShred = acidDefShred; // extra Def reduced by Kjemiker T2 buff
            item.desc = `${dmg} skade + etsende ${dur} runder, radius ${rad}`;
            item.use = (hero, scene) => {
                if (!scene) return false;
                for (const m of scene.monsters) {
                    if (!m.alive) continue;
                    const d = Math.abs(m.gridX - hero.gridX) + Math.abs(m.gridY - hero.gridY);
                    if (d <= rad) {
                        m.takeDamage(dmg);
                        // Acid burn: reduce defense over time
                        if (m.applyAcidBurn) m.applyAcidBurn(dur);
                        if (defShred > 0 && typeof m.defense === 'number') {
                            m.defense = Math.max(0, m.defense - defShred);
                        }
                    }
                }
                scene.monsters = scene.monsters.filter(m => m.alive);
                return true;
            };
        } else if (eff.onUse === 'smoke') {
            const rad = Math.round(eff.radius * bombRadMul);
            const stunDur = eff.stunDuration || 2;
            item.desc = `Stun alle monstre i radius ${rad} i ${stunDur} runder`;
            item.use = (hero, scene) => {
                if (!scene) return false;
                for (const m of scene.monsters) {
                    if (!m.alive) continue;
                    const d = Math.abs(m.gridX - hero.gridX) + Math.abs(m.gridY - hero.gridY);
                    if (d <= rad && m.applyStun) {
                        m.applyStun(stunDur);
                    }
                }
                return true;
            };
        } else if (eff.onUse === 'invisibility') {
            const dur = Math.round(eff.durationMs * durationMul);
            item.desc = `Usynlig i ${Math.round(dur / 1000)}s`;
            item.use = (hero) => {
                hero.addTempBuff('invisible', 1, dur);
                return true;
            };
        } else if (eff.onUse === 'pet_permanent_hp') {
            const amt = eff.amount || 2;
            item.desc = `Kjæledyr +${amt} permanent maks HP`;
            item.use = (hero, scene) => {
                if (!scene || !scene.pet || !scene.pet.alive) return false;
                scene.pet.maxHp += amt;
                scene.pet.hp = Math.min(scene.pet.hp + amt, scene.pet.effectiveMaxHp);
                return true;
            };
        } else if (eff.onUse === 'pet_permanent_atk') {
            const amt = eff.amount || 1;
            item.desc = `Kjæledyr +${amt} permanent angrep`;
            item.use = (hero, scene) => {
                if (!scene || !scene.pet || !scene.pet.alive) return false;
                scene.pet.attack += amt;
                return true;
            };
        }

        return item;
    }

    _adjustedEnergy(baseCost, hero) {
        return Math.max(0, Math.round(baseCost * (hero.smeltingEfficiency || 1.0)));
    }

    // ── Transmutation (3-path synergy) ──────────────────────────────────────
    /**
     * Transmutasjon-synergi: convert 5 of `symbol` into 1 of a neighbouring
     * element (atomic number ±1). Returns the produced symbol or null if
     * the hero lacks the skill / enough of the source / no valid neighbour.
     * Neighbour preference: next atomic number (rollover to previous if top).
     */
    transmute(hero, symbol) {
        if (!hero || !hero.transmutationUnlocked) return null;
        const have = hero.elementTracker.getCount(symbol);
        if (have < 5) return null;
        if (typeof ELEMENTS === 'undefined' || !ELEMENTS[symbol]) return null;
        const srcZ = ELEMENTS[symbol].atomicNumber;

        // Build atomic-number → symbol map once.
        const byZ = {};
        for (const [sym, def] of Object.entries(ELEMENTS)) {
            byZ[def.atomicNumber] = sym;
        }
        // Prefer Z+1, fall back to Z-1.
        const targetSym = byZ[srcZ + 1] || byZ[srcZ - 1];
        if (!targetSym || targetSym === symbol) return null;

        hero.elementTracker.collected[symbol] = have - 5;
        if (hero.elementTracker.collected[symbol] <= 0) {
            delete hero.elementTracker.collected[symbol];
        }
        hero.elementTracker.collect(targetSym, 1);
        hero.elementTracker.discover(targetSym);
        return targetSym;
    }
}
