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
    synthesize(moleculeId, hero) {
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
        const item = this._createUsableItem(mol, hero);

        return { success: true, item, energyCost };
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

    _createUsableItem(mol, hero) {
        const eff = mol.effects;
        const potencyMul = 1 + (hero.potionPotencyBonus || 0);
        const durationMul = 1 + (hero.potionDurationBonus || 0);
        const bombDmgMul = 1 + (hero.chemBombBonus || 0);
        const bombRadMul = 1 + (hero.chemRadiusBonus || 0);

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
            const hp = Math.round(eff.healHP * potencyMul);
            item.desc = `+${hp} HP`;
            item.use = (hero, scene) => {
                hero.hearts = Math.min(hero.hearts + hp, hero.maxHearts);
                if (hero.petHealShare && scene && scene.pet && scene.pet.alive) scene.pet.heal(hp);
                return true;
            };
        } else if (eff.onUse === 'buff') {
            const amt = Math.round(eff.amount * potencyMul);
            const dur = Math.round(eff.durationMs * durationMul);
            item.desc = `+${amt} ${eff.stat} (${Math.round(dur / 1000)}s)`;
            item.use = (hero) => {
                hero.addTempBuff(eff.stat, amt, dur);
                return true;
            };
        } else if (eff.onUse === 'cure_all') {
            const hp = Math.round((eff.healHP || 0) * potencyMul);
            item.use = (hero, scene) => {
                hero.clearAllEffects();
                if (hp > 0) hero.hearts = Math.min(hero.hearts + hp, hero.maxHearts);
                if (hp > 0 && hero.petHealShare && scene && scene.pet && scene.pet.alive) scene.pet.heal(hp);
                return true;
            };
        } else if (eff.onUse === 'bomb') {
            const dmg = Math.round(eff.damage * bombDmgMul);
            const rad = Math.round(eff.radius * bombRadMul);
            item.desc = `${dmg} skade, radius ${rad}`;
            item.use = (hero, scene) => {
                if (!scene) return false;
                for (const m of scene.monsters) {
                    if (!m.alive) continue;
                    const d = Math.abs(m.gridX - hero.gridX) + Math.abs(m.gridY - hero.gridY);
                    if (d <= rad) m.takeDamage(dmg);
                }
                scene.monsters = scene.monsters.filter(m => m.alive);
                return true;
            };
        } else if (eff.onUse === 'acid_bomb') {
            const dmg = Math.round(eff.damage * bombDmgMul);
            const rad = Math.round(eff.radius * bombRadMul);
            const dur = eff.duration || 3;
            item.desc = `${dmg} skade + etsende ${dur} runder, radius ${rad}`;
            item.use = (hero, scene) => {
                if (!scene) return false;
                for (const m of scene.monsters) {
                    if (!m.alive) continue;
                    const d = Math.abs(m.gridX - hero.gridX) + Math.abs(m.gridY - hero.gridY);
                    if (d <= rad) {
                        m.takeDamage(dmg);
                        // Acid burn: reduce defense temporarily
                        m.defense = Math.max(0, (m.defense || 0) - 2);
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
        }

        return item;
    }

    _adjustedEnergy(baseCost, hero) {
        return Math.max(0, Math.round(baseCost * (hero.smeltingEfficiency || 1.0)));
    }
}
