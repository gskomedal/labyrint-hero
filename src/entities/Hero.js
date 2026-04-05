// ─── Labyrint Hero – Hero ─────────────────────────────────────────────────────

class Hero {
    constructor(scene, gridX, gridY) {
        this.scene   = scene;
        this.gridX   = gridX;
        this.gridY   = gridY;
        this.alive   = true;

        // Identity
        this.race       = 'human';
        this.heroName   = 'Helt';
        this.appearance = defaultAppearance('human');

        // Combat stats
        this.maxHearts    = HERO_BASE_HEARTS;
        this.hearts       = HERO_BASE_HEARTS;
        this.attack       = HERO_BASE_ATTACK;
        this.defense      = 0;
        this.visionRadius = VISION_RADIUS;

        // Special stats
        this.dodgeChance  = 0;
        this.critChance   = 0;
        this.xpMultiplier = 1.0;
        this.counterChance = 0;  // counter-attack on hit (synergy)
        this.thornsDamage  = 0;  // damage reflected to attackers (synergy)

        // Pet bonuses (from Dyrevokter skill path)
        this.petBonusAtk = 0;
        this.petBonusHp  = 0;
        this.petBonusDef = 0;
        this.petHealShare = false; // life potions also heal pet

        // Progression
        this.level    = 1;
        this.xp       = 0;
        this.xpToNext = XP_BASE;
        this.skills   = [];

        // Economy
        this.gold = 0;

        // Inventory
        this.inventory = new Inventory();

        // Facing direction for button-press combat
        this.facing = { dx: 0, dy: 1 };

        // Status effects
        this.poisonTurns = 0;   // turns of poison remaining
        this.burnTurns   = 0;   // burn DoT (fire damage)
        this.slowTurns   = 0;   // slowed movement
        this.stunTurns   = 0;   // skip turns

        // Elements mod
        this.elementTracker = new ElementTracker();
        this.geologistUnlocked = false;
        this.mineralVisionRadius = 0;
        this.miningYieldBonus = 0;
        this.guaranteedRareMineral = false;

        // Metallurgy mod (Phase 2)
        this.metallurgistUnlocked = false;
        this.smeltingSpeedMul = 1.0;
        this.smeltingEfficiency = 1.0;
        this.alloyMasteryBonus = 0;
        this.alloyStatBonus = 0;
        this.oreEfficiencyChance = 0;
        this.alloyInventory = {};  // { 'bronze': 2, 'steel': 1, ... }

        // Chemistry mod (Phase 3)
        this.chemistUnlocked = false;
        this.potionDurationBonus = 0;
        this.potionPotencyBonus = 0;
        this.chemBombBonus = 0;
        this.chemRadiusBonus = 0;
        this.toxicBladeChance = 0;

        // Zone progression (Phase 4)
        this.completedZones = []; // ['surface', 'bedrock', ...]

        // Camp stash – persistent storage for minerals, fuel, etc.
        // Array of { id, count } entries (like backpack slots but unlimited size)
        this.campStash = [];

        // Temporary buffs from brews [{stat, amount, msLeft}]
        this.tempBuffs = [];

        // Rendering
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(5);
        this._draw();
    }

    // ── Apply race ────────────────────────────────────────────────────────────

    applyRace(raceId) {
        const def = (typeof RACE_DEFS !== 'undefined') ? RACE_DEFS[raceId] : null;
        if (!def) return;
        this.race         = raceId;
        this.maxHearts    = def.hearts;
        this.hearts       = def.hearts;
        this.attack       = def.attack;
        this.defense      = def.defense;
        this.visionRadius = def.visionRadius;
        this.xpMultiplier = def.xpMultiplier;
        this.appearance   = defaultAppearance(raceId);
        this._draw();
    }

    applyAppearance(appearance) {
        this.appearance = { ...appearance };
        this._draw();
    }

    // ── Drawing ───────────────────────────────────────────────────────────────

    /** Redraws sprite content at local (0,0) – does NOT change graphics.x/y */
    _drawSprite() {
        const g = this.graphics;
        g.clear();
        drawCharacterSprite(g, 0, 0, TILE_SIZE, this.appearance, this.race);
        // Status effect tint overlays
        if (this.poisonTurns > 0) {
            g.fillStyle(COLORS.POISON, 0.20);
            g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        }
        if (this.burnTurns > 0) {
            g.fillStyle(0xff4400, 0.22);
            g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        }
        if (this.slowTurns > 0) {
            g.fillStyle(0x4488ff, 0.18);
            g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        }
        if (this.stunTurns > 0) {
            g.fillStyle(0xffee00, 0.25);
            g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        }
    }

    /** Full redraw including position snap (used on initial placement / stat changes) */
    _draw() {
        this.graphics.x = this.gridX * TILE_SIZE;
        this.graphics.y = this.gridY * TILE_SIZE;
        this._drawSprite();
    }

    // ── Movement ──────────────────────────────────────────────────────────────

    /** Update grid position and smoothly slide the graphic to the new tile */
    moveTo(gx, gy) {
        this.gridX = gx;
        this.gridY = gy;
        const tx = gx * TILE_SIZE;
        const ty = gy * TILE_SIZE;
        this.scene.tweens.killTweensOf(this.graphics);
        this.scene.tweens.add({
            targets:  this.graphics,
            x: tx, y: ty,
            duration: MOVE_ANIM_MS,
            ease:     'Sine.easeOut'
        });
    }

    // ── Status effects ────────────────────────────────────────────────────────

    applyPoison(turns = 4) {
        this.poisonTurns = Math.max(this.poisonTurns, turns);
        this._drawSprite();
    }

    applyBurn(turns = 3) {
        this.burnTurns = Math.max(this.burnTurns, turns);
        this._drawSprite();
    }

    applySlow(turns = 4) {
        this.slowTurns = Math.max(this.slowTurns, turns);
        this._drawSprite();
    }

    applyStun(turns = 1) {
        this.stunTurns = Math.max(this.stunTurns, turns);
        this._drawSprite();
    }

    clearAllEffects() {
        this.poisonTurns = 0;
        this.burnTurns   = 0;
        this.slowTurns   = 0;
        this.stunTurns   = 0;
        this._drawSprite();
    }

    // ── Temporary buffs ──────────────────────────────────────────────────────

    addTempBuff(stat, amount, durationMs) {
        this[stat] += amount;
        this.tempBuffs.push({ stat, amount, msLeft: durationMs });
    }

    tickTempBuffs(deltaMs) {
        for (let i = this.tempBuffs.length - 1; i >= 0; i--) {
            this.tempBuffs[i].msLeft -= deltaMs;
            if (this.tempBuffs[i].msLeft <= 0) {
                const b = this.tempBuffs[i];
                this[b.stat] -= b.amount;
                this.tempBuffs.splice(i, 1);
            }
        }
    }

    // ── Stats / Progression ───────────────────────────────────────────────────

    gainXP(amount) {
        this.xp += Math.round(amount * this.xpMultiplier);
        if (this.xp >= this.xpToNext) {
            this._levelUp();
            return true;
        }
        return false;
    }

    _levelUp() {
        this.level++;
        this.xp      -= this.xpToNext;
        this.xpToNext = Math.floor(XP_BASE * Math.pow(XP_GROWTH, this.level - 1));
    }

    /** Returns true if hero died. Accounts for dodge. */
    takeDamage(amount) {
        if (this.dodgeChance > 0 && Math.random() < this.dodgeChance) {
            return false; // dodged – hero is fine
        }
        const dmg = Math.max(1, amount - this.defense);
        this.hearts -= dmg;
        if (this.hearts <= 0) {
            this.hearts = 0;
            this.alive  = false;
        }
        return !this.alive;
    }

    // ── Serialisation ─────────────────────────────────────────────────────────

    getStats() {
        // Subtract equipment bonuses so we save base stats only.
        // Equipment is serialised separately and re-applied on load.
        const eq = this.inventory.equipped;
        const eqAtk    = (eq.weapon && eq.weapon.atk    || 0) + (eq.armor && eq.armor.atk    || 0);
        const eqDef    = (eq.weapon && eq.weapon.def    || 0) + (eq.armor && eq.armor.def    || 0);
        const eqHearts = (eq.weapon && eq.weapon.hearts || 0) + (eq.armor && eq.armor.hearts || 0);

        const baseMaxHearts = this.maxHearts - eqHearts;
        return {
            race:         this.race,
            heroName:     this.heroName,
            appearance:   { ...this.appearance },
            level:        this.level,
            xp:           this.xp,
            xpToNext:     this.xpToNext,
            hearts:       Math.min(this.hearts, baseMaxHearts),
            maxHearts:    baseMaxHearts,
            attack:       this.attack  - eqAtk,
            defense:      this.defense - eqDef,
            visionRadius: this.visionRadius,
            dodgeChance:  this.dodgeChance,
            critChance:    this.critChance,
            xpMultiplier:  this.xpMultiplier,
            counterChance: this.counterChance,
            thornsDamage:  this.thornsDamage,
            petBonusAtk:   this.petBonusAtk,
            petBonusHp:    this.petBonusHp,
            petBonusDef:   this.petBonusDef,
            petHealShare:  this.petHealShare,
            gold:         this.gold,
            poisonTurns:  this.poisonTurns,
            burnTurns:    this.burnTurns,
            slowTurns:    this.slowTurns,
            stunTurns:    this.stunTurns,
            skills:       [...this.skills],
            tempBuffs:    this.tempBuffs.map(b => ({ ...b })),
            inventory:    this.inventory.serialize(),
            // Elements mod
            elementTracker:       this.elementTracker.serialize(),
            geologistUnlocked:    this.geologistUnlocked,
            mineralVisionRadius:  this.mineralVisionRadius,
            miningYieldBonus:     this.miningYieldBonus,
            guaranteedRareMineral: this.guaranteedRareMineral,
            // Metallurgy mod
            metallurgistUnlocked: this.metallurgistUnlocked,
            smeltingSpeedMul:     this.smeltingSpeedMul,
            smeltingEfficiency:   this.smeltingEfficiency,
            alloyMasteryBonus:    this.alloyMasteryBonus,
            alloyStatBonus:       this.alloyStatBonus,
            oreEfficiencyChance:  this.oreEfficiencyChance,
            alloyInventory:       { ...this.alloyInventory },
            campStash:            this.campStash.map(e => ({ ...e })),
            // Chemistry mod
            chemistUnlocked:      this.chemistUnlocked,
            potionDurationBonus:  this.potionDurationBonus,
            potionPotencyBonus:   this.potionPotencyBonus,
            chemBombBonus:        this.chemBombBonus,
            chemRadiusBonus:      this.chemRadiusBonus,
            toxicBladeChance:     this.toxicBladeChance,
            completedZones:       [...this.completedZones],
        };
    }

    applyStats(stats, fullHeal = true) {
        this.race         = stats.race         || 'human';
        this.heroName     = stats.heroName     || 'Helt';
        this.appearance   = stats.appearance   || defaultAppearance(this.race);
        this.level        = stats.level;
        this.xp           = stats.xp;
        this.xpToNext     = stats.xpToNext;
        this.maxHearts    = stats.maxHearts;
        this.attack       = stats.attack;
        this.defense      = stats.defense      || 0;
        this.visionRadius = stats.visionRadius || VISION_RADIUS;
        this.dodgeChance  = stats.dodgeChance  || 0;
        this.critChance    = stats.critChance    || 0;
        this.xpMultiplier  = stats.xpMultiplier || 1;
        this.counterChance = stats.counterChance || 0;
        this.thornsDamage  = stats.thornsDamage  || 0;
        this.petBonusAtk  = stats.petBonusAtk  || 0;
        this.petBonusHp   = stats.petBonusHp   || 0;
        this.petBonusDef  = stats.petBonusDef  || 0;
        this.petHealShare = stats.petHealShare  || false;
        this.gold         = stats.gold         || 0;
        this.poisonTurns  = stats.poisonTurns  || 0;
        this.burnTurns    = stats.burnTurns    || 0;
        this.slowTurns    = stats.slowTurns    || 0;
        this.stunTurns    = stats.stunTurns    || 0;
        this.skills       = stats.skills       ? [...stats.skills] : [];
        this.tempBuffs    = (stats.tempBuffs || []).map(b => ({ ...b }));
        // Elements mod
        this.elementTracker       = ElementTracker.deserialize(stats.elementTracker || null);
        this.geologistUnlocked    = stats.geologistUnlocked    || false;
        this.mineralVisionRadius  = stats.mineralVisionRadius  || 0;
        this.miningYieldBonus     = stats.miningYieldBonus     || 0;
        this.guaranteedRareMineral = stats.guaranteedRareMineral || false;
        // Metallurgy mod
        this.metallurgistUnlocked = stats.metallurgistUnlocked || false;
        this.smeltingSpeedMul     = stats.smeltingSpeedMul     || 1.0;
        this.smeltingEfficiency   = stats.smeltingEfficiency   || 1.0;
        this.alloyMasteryBonus    = stats.alloyMasteryBonus    || 0;
        this.alloyStatBonus       = stats.alloyStatBonus       || 0;
        this.oreEfficiencyChance  = stats.oreEfficiencyChance  || 0;
        this.alloyInventory       = stats.alloyInventory       ? { ...stats.alloyInventory } : {};
        this.campStash            = (stats.campStash || []).map(e => ({ ...e }));
        // Chemistry mod
        this.chemistUnlocked      = stats.chemistUnlocked      || false;
        this.potionDurationBonus  = stats.potionDurationBonus  || 0;
        this.potionPotencyBonus   = stats.potionPotencyBonus   || 0;
        this.chemBombBonus        = stats.chemBombBonus        || 0;
        this.chemRadiusBonus      = stats.chemRadiusBonus      || 0;
        this.toxicBladeChance     = stats.toxicBladeChance     || 0;
        this.completedZones       = stats.completedZones       ? [...stats.completedZones] : [];
        // Deserialize inventory – _apply() re-adds equipment bonuses on top of base stats
        this.inventory    = Inventory.deserialize(stats.inventory || null, this);
        // Set hearts after equipment is applied so maxHearts includes equipment bonus
        this.hearts       = fullHeal ? this.maxHearts : Math.min(Math.max(1, stats.hearts), this.maxHearts);
        this._draw();
    }

    destroy() {
        this.graphics.destroy();
    }
}
