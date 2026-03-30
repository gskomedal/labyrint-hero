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
        // Poison tint overlay
        if (this.poisonTurns > 0) {
            g.fillStyle(COLORS.POISON, 0.20);
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
        this._drawSprite();  // show tint immediately
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
        return {
            race:         this.race,
            heroName:     this.heroName,
            appearance:   { ...this.appearance },
            level:        this.level,
            xp:           this.xp,
            xpToNext:     this.xpToNext,
            hearts:       this.hearts,
            maxHearts:    this.maxHearts,
            attack:       this.attack,
            defense:      this.defense,
            visionRadius: this.visionRadius,
            dodgeChance:  this.dodgeChance,
            critChance:   this.critChance,
            xpMultiplier: this.xpMultiplier,
            gold:         this.gold,
            skills:       [...this.skills],
            inventory:    this.inventory.serialize()
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
        this.hearts       = fullHeal ? stats.maxHearts : Math.max(1, stats.hearts);
        this.attack       = stats.attack;
        this.defense      = stats.defense      || 0;
        this.visionRadius = stats.visionRadius || VISION_RADIUS;
        this.dodgeChance  = stats.dodgeChance  || 0;
        this.critChance   = stats.critChance   || 0;
        this.xpMultiplier = stats.xpMultiplier || 1;
        this.gold         = stats.gold         || 0;
        this.skills       = stats.skills       ? [...stats.skills] : [];
        this.inventory    = Inventory.deserialize(stats.inventory || null, this);
        this._draw();
    }

    destroy() {
        this.graphics.destroy();
    }
}
