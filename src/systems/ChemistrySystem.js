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

        // First-synthesis discovery popup
        if (hero.discoveredMolecules && !hero.discoveredMolecules[moleculeId]) {
            hero.discoveredMolecules[moleculeId] = true;
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('discovery', {
                    type:      'molecule',
                    name:      mol.name,
                    iconColor: mol.color || 0x44cc88,
                    iconText:  '⚗',
                    subtitle:  mol.formula || '',
                    desc:      mol.desc || '',
                });
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
        const potionScale = 1 + (wn - 1) * 0.15;
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
            const hp = (wn >= 4 && mol.tier >= 3)
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
            // Probability of cracking a regular wall scales with bomb damage —
            // stronger bombs (thermite, neodym, plasma) can punch holes in
            // walls. Cracked walls always collapse if wallBreak is set.
            const regularWallChance = eff.wallBreak ? Math.min(0.5, dmg / 60) : 0;
            const descParts = [`${dmg} skade, radius ${rad}`];
            if (defPierce) descParts.push(`ignorer ${defPierce} Def`);
            if (eff.wallBreak) descParts.push('sprenger sprukne vegger');
            if (regularWallChance > 0) descParts.push(`${Math.round(regularWallChance*100)}% rist vanlige vegger`);
            item.desc = descParts.join(', ');
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
                // Wall breaking
                if (eff.wallBreak && scene.maze) {
                    let wallsBroken = 0;
                    for (let wy = 0; wy < scene.tileH; wy++) {
                        for (let wx = 0; wx < scene.tileW; wx++) {
                            const t = scene.maze[wy][wx];
                            const d = Math.abs(wx - hero.gridX) + Math.abs(wy - hero.gridY);
                            if (d > rad) continue;
                            if (t === TILE.CRACKED_WALL) {
                                scene.maze[wy][wx] = TILE.FLOOR;
                                wallsBroken++;
                            } else if (t === TILE.WALL && regularWallChance > 0 && Math.random() < regularWallChance) {
                                scene.maze[wy][wx] = TILE.FLOOR;
                                wallsBroken++;
                            }
                        }
                    }
                    if (wallsBroken > 0) {
                        scene.mapRenderer.drawMap();
                        scene.mapRenderer.updateFog();
                    }
                }
                // Visual effects: expanding ring, flash, particles, shake
                ChemistrySystem._spawnExplosionVFX(scene, hero.gridX, hero.gridY, rad, item.color || 0xff6622);
                if (typeof Audio !== 'undefined' && Audio.playArrow) Audio.playArrow();
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
        hero.elementTracker.discoverWithPopup(targetSym);
        return targetSym;
    }

    /**
     * Visual explosion: a flash, an expanding ring, sparks, and screen shake.
     * Pure procedural — no asset files. Auto-cleans after the tween.
     */
    static _spawnExplosionVFX(scene, gx, gy, radius, color) {
        if (!scene || !scene.add) return;
        const cx = gx * TILE_SIZE + TILE_SIZE / 2;
        const cy = gy * TILE_SIZE + TILE_SIZE / 2;
        const maxR = radius * TILE_SIZE;

        // 1) Bright central flash
        const flash = scene.add.graphics();
        flash.setDepth(40);
        flash.fillStyle(0xffffee, 0.9);
        flash.fillCircle(cx, cy, TILE_SIZE * 0.7);
        scene.tweens.add({
            targets: flash, alpha: 0, scale: 1.6,
            duration: 220, ease: 'Quad.easeOut',
            onComplete: () => flash.destroy(),
        });

        // 2) Expanding shock ring
        const ring = scene.add.graphics();
        ring.setDepth(39);
        ring.x = cx; ring.y = cy;
        const drawRing = (rad, alpha) => {
            ring.clear();
            ring.lineStyle(3, color, alpha);
            ring.strokeCircle(0, 0, rad);
            ring.lineStyle(6, color, alpha * 0.4);
            ring.strokeCircle(0, 0, rad);
        };
        drawRing(TILE_SIZE * 0.3, 1);
        scene.tweens.addCounter({
            from: 0, to: 1,
            duration: 320, ease: 'Quad.easeOut',
            onUpdate: (t) => {
                const v = t.getValue();
                drawRing(TILE_SIZE * 0.3 + maxR * v, 1 - v);
            },
            onComplete: () => ring.destroy(),
        });

        // 3) Spark particles
        const sparkCount = 16;
        for (let i = 0; i < sparkCount; i++) {
            const ang = (Math.PI * 2 * i) / sparkCount + Math.random() * 0.3;
            const dist = maxR * (0.4 + Math.random() * 0.7);
            const spark = scene.add.graphics();
            spark.setDepth(41);
            spark.fillStyle(0xffaa44, 1);
            spark.fillRect(-2, -2, 4, 4);
            spark.x = cx; spark.y = cy;
            scene.tweens.add({
                targets: spark,
                x: cx + Math.cos(ang) * dist,
                y: cy + Math.sin(ang) * dist,
                alpha: 0,
                duration: 260 + Math.random() * 120,
                ease: 'Quad.easeOut',
                onComplete: () => spark.destroy(),
            });
        }

        // 4) Screen shake proportional to radius
        if (scene.cameras && scene.cameras.main) {
            const intensity = Math.min(0.012, 0.005 + radius * 0.0015);
            scene.cameras.main.shake(180, intensity);
        }
    }
}
