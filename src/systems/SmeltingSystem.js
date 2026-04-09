// ─── Labyrint Hero – Smelting & Alloy Crafting System ─────────────────────────
// Handles smelting minerals into pure elements and crafting alloys from elements.
// All operations happen at Camp Room furnaces.

class SmeltingSystem {
    constructor() {}

    // ── Smelting: Mineral → Pure Elements ────────────────────────────────────

    /**
     * Check if a mineral can be smelted given available fuel.
     * @param {object} mineralDef - Mineral definition from MINERAL_DEFS
     * @param {number} fuelEnergy - Total energy available from fuel
     * @param {object} hero - Hero (for skill modifiers)
     * @returns {{ canSmelt: boolean, energyCost: number, time: number }}
     */
    canSmelt(mineralDef, fuelEnergy, hero) {
        const energyCost = this._adjustedEnergyCost(mineralDef.energyCost, hero);
        const time = this._adjustedTime(mineralDef.smeltingTime, hero);
        return {
            canSmelt: fuelEnergy >= energyCost && mineralDef.yields && mineralDef.yields.length > 0,
            energyCost,
            time
        };
    }

    /**
     * Smelt a mineral, producing pure elements.
     * @param {object} mineralDef - Mineral to smelt
     * @param {object} hero - Hero (for skill modifiers + element tracker)
     * @returns {{ elements: Array<{symbol, amount}>, energyCost: number }}
     */
    smelt(mineralDef, hero) {
        const energyCost = this._adjustedEnergyCost(mineralDef.energyCost, hero);
        const elements = [];

        for (const y of mineralDef.yields) {
            // Base chance + mining yield bonus from Geologist skill
            const bonusChance = Math.min(1.0, y.chance + (hero.miningYieldBonus || 0) * 0.2);
            if (Math.random() < bonusChance) {
                // Metallurgist ore_efficiency: extra element chance
                let amount = y.amount;
                const oreEfficiency = hero.oreEfficiencyChance || 0;
                if (oreEfficiency > 0 && Math.random() < oreEfficiency) {
                    amount += 1;
                }
                // Geologist smeltBonusElement: extra element per smelt
                amount += (hero.smeltBonusElement || 0);
                // Metallurgist smeltExtraYieldChance: chance for double yield
                if ((hero.smeltExtraYieldChance || 0) > 0 && Math.random() < hero.smeltExtraYieldChance) {
                    amount = Math.ceil(amount * 1.5);
                }
                elements.push({ symbol: y.symbol, amount });

                // Add to tracker
                hero.elementTracker.collect(y.symbol, amount);
                hero.elementTracker.discover(y.symbol);
            }
        }

        return { elements, energyCost };
    }

    // ── Alloy Crafting: Elements → Alloy ─────────────────────────────────────

    /**
     * Check if an alloy can be crafted from collected elements.
     * @param {string} alloyId - Alloy ID from ALLOY_DEFS
     * @param {object} hero - Hero (element tracker has collected counts)
     * @param {number} fuelEnergy - Available fuel energy
     * @returns {{ canCraft: boolean, energyCost: number, missing: Array }}
     */
    canCraftAlloy(alloyId, hero, fuelEnergy) {
        const alloy = ALLOY_DEFS[alloyId];
        if (!alloy) return { canCraft: false, energyCost: 0, missing: [] };

        const energyCost = this._adjustedEnergyCost(alloy.energyCost, hero);
        const missing = [];

        for (const ingredient of alloy.recipe) {
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
     * Craft an alloy, consuming elements and fuel.
     * @param {string} alloyId
     * @param {object} hero
     * @returns {{ success: boolean, alloy: object, energyCost: number }}
     */
    craftAlloy(alloyId, hero) {
        const alloy = ALLOY_DEFS[alloyId];
        if (!alloy) return { success: false };

        // Consume elements
        for (const ingredient of alloy.recipe) {
            hero.elementTracker.collected[ingredient.symbol] -= ingredient.amount;
            if (hero.elementTracker.collected[ingredient.symbol] <= 0) {
                delete hero.elementTracker.collected[ingredient.symbol];
            }
        }

        const energyCost = this._adjustedEnergyCost(alloy.energyCost, hero);
        // Double alloy chance from Metallurgist Legeringsmester
        const doubleChance = hero.doubleAlloyChance || 0;
        const doubled = doubleChance > 0 && Math.random() < doubleChance;
        return { success: true, alloy, energyCost, doubled };
    }

    /**
     * Get all alloys the player can currently craft.
     * @param {object} hero
     * @param {number} fuelEnergy
     * @returns {Array<{ alloy: object, canCraft: boolean, missing: Array }>}
     */
    getAvailableAlloys(hero, fuelEnergy) {
        if (typeof ALLOY_DEFS === 'undefined') return [];
        const results = [];
        for (const id of Object.keys(ALLOY_DEFS)) {
            const check = this.canCraftAlloy(id, hero, fuelEnergy);
            results.push({ alloy: ALLOY_DEFS[id], ...check });
        }
        // Sort: craftable first, then by tier
        results.sort((a, b) => {
            if (a.canCraft !== b.canCraft) return a.canCraft ? -1 : 1;
            return a.alloy.tier - b.alloy.tier;
        });
        return results;
    }

    // ── Forging: Alloy → Equipment ───────────────────────────────────────────

    /**
     * Get equipment that can be forged from a given alloy.
     * @param {string} alloyId
     * @returns {Array<object>} Array of ALLOY_EQUIPMENT items
     */
    getForgeableEquipment(alloyId) {
        if (typeof ALLOY_EQUIPMENT === 'undefined') return [];
        return Object.values(ALLOY_EQUIPMENT).filter(e => e.alloyId === alloyId);
    }

    /**
     * Forge a piece of equipment from an alloy.
     * Requires 1 alloy unit (already crafted) in hero's alloy inventory.
     * @param {string} equipmentId
     * @param {object} hero
     * @returns {{ success: boolean, item: object }}
     */
    forgeEquipment(equipmentId, hero) {
        const template = ALLOY_EQUIPMENT[equipmentId];
        if (!template) return { success: false };

        // Apply Metallurgist master_smith bonus
        const item = { ...template };
        const bonus = hero.alloyStatBonus || 0;
        if (bonus > 0) {
            if (item.atk) item.atk = Math.round(item.atk * (1 + bonus));
            if (item.def) item.def = Math.round(item.def * (1 + bonus));
            if (item.hearts) item.hearts = Math.round(item.hearts * (1 + bonus));
            // Master Smith special properties
            if (item.type === 'weapon') {
                item.critBonus = 0.10;
                item.desc = item.desc + ' [Mestersmie: +10% krit]';
            } else if (item.type === 'armor') {
                item.thornsDmg = 1;
                item.desc = item.desc + ' [Mestersmie: +1 torneskade]';
            }
        }

        // Alloy mastery bonus from skills
        const alloyMastery = hero.alloyMasteryBonus || 0;
        if (alloyMastery > 0) {
            if (item.atk) item.atk += Math.round(item.atk * alloyMastery);
            if (item.def) item.def += Math.round(item.def * alloyMastery);
        }

        return { success: true, item };
    }

    // ── Fuel management ──────────────────────────────────────────────────────

    /**
     * Calculate total energy from fuel items in hero's inventory.
     * @param {object} hero
     * @returns {number} Total energy available
     */
    calculateFuelEnergy(hero) {
        let total = 0;
        for (const entry of hero.inventory.backpack) {
            if (!entry) continue;
            const def = this._getFuelDef(entry);
            if (def) {
                total += def.energyValue * (entry.count || 1);
            }
        }
        // Also count fuel in camp stash
        if (hero.campStash) {
            for (const entry of hero.campStash) {
                if (!entry) continue;
                const def = this._getFuelDef(entry);
                if (def) {
                    total += def.energyValue * (entry.count || 1);
                }
            }
        }
        return total;
    }

    /**
     * Consume fuel from inventory to meet energy cost.
     * @param {object} hero
     * @param {number} energyNeeded
     * @returns {boolean} true if enough fuel was consumed
     */
    consumeFuel(hero, energyNeeded) {
        let remaining = energyNeeded;
        // Consume from backpack first
        for (let i = 0; i < hero.inventory.backpack.length && remaining > 0; i++) {
            const entry = hero.inventory.backpack[i];
            if (!entry) continue;
            const def = this._getFuelDef(entry);
            if (!def) continue;

            while (entry.count > 0 && remaining > 0) {
                entry.count--;
                remaining -= def.energyValue;
            }
            if (entry.count <= 0) hero.inventory.backpack[i] = null;
        }
        // Then consume from camp stash
        if (remaining > 0 && hero.campStash) {
            for (let i = hero.campStash.length - 1; i >= 0 && remaining > 0; i--) {
                const entry = hero.campStash[i];
                if (!entry) continue;
                const def = this._getFuelDef(entry);
                if (!def) continue;

                while (entry.count > 0 && remaining > 0) {
                    entry.count--;
                    remaining -= def.energyValue;
                }
                if (entry.count <= 0) hero.campStash.splice(i, 1);
            }
        }
        return remaining <= 0;
    }

    _getFuelDef(entry) {
        if (!entry || !entry.id) return null;
        if (typeof FUEL_DEFS !== 'undefined' && FUEL_DEFS[entry.id]) return FUEL_DEFS[entry.id];
        return null;
    }

    // ── Skill adjustments ────────────────────────────────────────────────────

    _adjustedEnergyCost(baseCost, hero) {
        const efficiency = hero.smeltingEfficiency || 1.0;
        return Math.max(1, Math.round(baseCost * efficiency));
    }

    _adjustedTime(baseTime, hero) {
        const speedMul = hero.smeltingSpeedMul || 1.0;
        return Math.max(1, Math.round(baseTime * speedMul));
    }
}
