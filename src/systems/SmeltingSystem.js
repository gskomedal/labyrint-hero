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
        let doubledSomething = false;

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
                // Geologist T2 "Effektiv utvinning": double-yield chance per stack
                if ((hero.doubleYieldChance || 0) > 0 && Math.random() < hero.doubleYieldChance) {
                    amount *= 2;
                    doubledSomething = true;
                }
                // Metallurgist smeltExtraYieldChance: chance for +50% yield
                if ((hero.smeltExtraYieldChance || 0) > 0 && Math.random() < hero.smeltExtraYieldChance) {
                    amount = Math.ceil(amount * 1.5);
                }
                elements.push({ symbol: y.symbol, amount });

                // Add to tracker
                hero.elementTracker.collect(y.symbol, amount);
                hero.elementTracker.discover(y.symbol);
            }
        }

        // Geolog T4 "Geode Splitter": every 10 smelts yields a free random gemstone.
        let geodeElement = null;
        if (hero.geodeSplitter) {
            hero.smeltCountForGeode = (hero.smeltCountForGeode || 0) + 1;
            if (hero.smeltCountForGeode >= 10) {
                hero.smeltCountForGeode = 0;
                // Grant 1 of a random already-discovered element (rarer preferred).
                const discovered = Object.keys(hero.elementTracker.discovered || {});
                if (discovered.length > 0) {
                    const pick = discovered[Math.floor(Math.random() * discovered.length)];
                    hero.elementTracker.collect(pick, 1);
                    geodeElement = { symbol: pick, amount: 1 };
                }
            }
        }

        return { elements, energyCost, doubled: doubledSomething, geodeElement };
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
        // Semiconductors are crafted via dedicated craftSemiconductor() path
        // in the Raffiner tab, not mixed with alloys.
        // Sort: craftable first, then by tier
        results.sort((a, b) => {
            if (a.canCraft !== b.canCraft) return a.canCraft ? -1 : 1;
            return a.alloy.tier - b.alloy.tier;
        });
        return results;
    }

    // ── Forging: Alloy → Equipment ───────────────────────────────────────────

    /**
     * Get equipment that can be forged from a given alloy (hero + pet items).
     * @param {string} alloyId
     * @returns {Array<object>} Array of ALLOY_EQUIPMENT + PET_EQUIPMENT items
     */
    getForgeableEquipment(alloyId) {
        const items = [];
        if (typeof ALLOY_EQUIPMENT !== 'undefined') {
            items.push(...Object.values(ALLOY_EQUIPMENT).filter(e => e.alloyId === alloyId));
        }
        if (typeof PET_EQUIPMENT !== 'undefined') {
            items.push(...Object.values(PET_EQUIPMENT).filter(e => e.alloyId === alloyId));
        }
        return items;
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
        let total = hero.fuelReserve || 0;
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
        // Fission bonus: each U/Th in the element tracker acts as virtual
        // fuel when the hero has mastered fission (Fysiker T3).
        if (hero.fissionMastered || hero.fissionUpgraded) {
            const fMul = hero.fissionEnergyMul || 1.0;
            const uCount = hero.elementTracker ? hero.elementTracker.getCount('U') : 0;
            const thCount = hero.elementTracker ? hero.elementTracker.getCount('Th') : 0;
            total += Math.round((uCount * 50 + thCount * 40) * fMul);
        }
        // Fusion bonus: D-T fusion consumes H (deuterium) + Li (tritium bred
        // from Li-6 + neutron). He is a byproduct, not fuel.
        if (hero.fusionMastered) {
            const fuMul = hero.fusionEnergyMul || 1.0;
            const hCount = hero.elementTracker ? hero.elementTracker.getCount('H') : 0;
            const liCount = hero.elementTracker ? hero.elementTracker.getCount('Li') : 0;
            total += Math.round((hCount * 80 + liCount * 150) * fuMul);
        }
        // Semiconductor energy techs
        if (hero.techSolarPanel) total += 30;
        if (hero.techThermoelectric) {
            const wn = hero.worldNum || 1;
            if (wn >= 8) total += 50; // vulkan/magma-soner
        }
        if (hero.techReactorControl) total = Math.round(total * 1.5);
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
        // Deduct from fuel reserve first
        if (hero.fuelReserve > 0) {
            const fromReserve = Math.min(hero.fuelReserve, remaining);
            hero.fuelReserve -= fromReserve;
            remaining -= fromReserve;
        }
        if (remaining <= 0) return true;
        // Consume from backpack
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
        // Store leftover energy in reserve for next operation
        if (remaining < 0) {
            hero.fuelReserve = (hero.fuelReserve || 0) + Math.abs(remaining);
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
        const superMul = hero.techSuperconductor ? 0.7 : 1.0;
        return Math.max(1, Math.round(baseCost * efficiency * superMul));
    }

    // ── Refining: Raw Element → Semiconductor-Grade ─────────────────────────

    canRefine(recipeId, hero, fuelEnergy) {
        if (typeof REFINING_RECIPES === 'undefined') return { canRefine: false };
        const recipe = REFINING_RECIPES.find(r => r.id === recipeId);
        if (!recipe) return { canRefine: false };
        const cost = this._adjustedEnergyCost(recipe.energyCost, hero);
        const missing = [];
        for (const ing of recipe.input) {
            const have = hero.elementTracker.getCount(ing.symbol);
            if (have < ing.amount) missing.push({ symbol: ing.symbol, need: ing.amount, have });
        }
        return { canRefine: missing.length === 0 && fuelEnergy >= cost, energyCost: cost, missing };
    }

    refine(recipeId, hero) {
        if (typeof REFINING_RECIPES === 'undefined') return { success: false };
        const recipe = REFINING_RECIPES.find(r => r.id === recipeId);
        if (!recipe) return { success: false };
        for (const ing of recipe.input) {
            hero.elementTracker.collected[ing.symbol] -= ing.amount;
            if (hero.elementTracker.collected[ing.symbol] <= 0) delete hero.elementTracker.collected[ing.symbol];
        }
        const cost = this._adjustedEnergyCost(recipe.energyCost, hero);
        if (!hero.refinedElements) hero.refinedElements = {};
        hero.refinedElements[recipe.id] = (hero.refinedElements[recipe.id] || 0) + 1;
        return { success: true, recipe, energyCost: cost };
    }

    // ── Semiconductor crafting (uses refined elements) ──────────────────────

    canCraftSemiconductor(semiId, hero, fuelEnergy) {
        if (typeof SEMICONDUCTOR_DEFS === 'undefined') return { canCraft: false };
        const semi = SEMICONDUCTOR_DEFS[semiId];
        if (!semi) return { canCraft: false };
        const cost = this._adjustedEnergyCost(semi.energyCost, hero);
        const missing = [];
        for (const ing of semi.recipe) {
            if (ing.refined) {
                const have = (hero.refinedElements || {})[ing.refined] || 0;
                if (have < ing.amount) missing.push({ symbol: ing.refined, need: ing.amount, have });
            } else {
                const have = hero.elementTracker.getCount(ing.symbol);
                if (have < ing.amount) missing.push({ symbol: ing.symbol, need: ing.amount, have });
            }
        }
        return { canCraft: missing.length === 0 && fuelEnergy >= cost, energyCost: cost, missing };
    }

    craftSemiconductor(semiId, hero) {
        if (typeof SEMICONDUCTOR_DEFS === 'undefined') return { success: false };
        const semi = SEMICONDUCTOR_DEFS[semiId];
        if (!semi) return { success: false };
        for (const ing of semi.recipe) {
            if (ing.refined) {
                hero.refinedElements[ing.refined] = (hero.refinedElements[ing.refined] || 0) - ing.amount;
                if (hero.refinedElements[ing.refined] <= 0) delete hero.refinedElements[ing.refined];
            } else {
                hero.elementTracker.collected[ing.symbol] -= ing.amount;
                if (hero.elementTracker.collected[ing.symbol] <= 0) delete hero.elementTracker.collected[ing.symbol];
            }
        }
        const cost = this._adjustedEnergyCost(semi.energyCost, hero);
        if (!hero.alloyInventory) hero.alloyInventory = {};
        hero.alloyInventory[semiId] = (hero.alloyInventory[semiId] || 0) + 1;
        return { success: true, semi, energyCost: cost };
    }

    // ── Technology installation (one-time, from semiconductor inventory) ────

    canInstallTech(techId, hero) {
        if (typeof TECH_UPGRADES === 'undefined') return false;
        const tech = TECH_UPGRADES[techId];
        if (!tech) return false;
        if (hero[tech.heroFlag]) return false; // already installed
        const have = (hero.alloyInventory || {})[tech.semiId] || 0;
        return have >= tech.amount;
    }

    installTech(techId, hero) {
        if (typeof TECH_UPGRADES === 'undefined') return false;
        const tech = TECH_UPGRADES[techId];
        if (!tech || hero[tech.heroFlag]) return false;
        const have = (hero.alloyInventory || {})[tech.semiId] || 0;
        if (have < tech.amount) return false;
        hero.alloyInventory[tech.semiId] -= tech.amount;
        if (hero.alloyInventory[tech.semiId] <= 0) delete hero.alloyInventory[tech.semiId];
        hero[tech.heroFlag] = true;
        if (tech.heroFlag === 'techForceField') hero.techForceFieldHP = 15;
        return true;
    }

    _adjustedTime(baseTime, hero) {
        const speedMul = hero.smeltingSpeedMul || 1.0;
        return Math.max(1, Math.round(baseTime * speedMul));
    }
}
