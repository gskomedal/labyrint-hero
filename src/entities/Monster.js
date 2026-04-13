// ─── Labyrint Hero – Monster ──────────────────────────────────────────────────

class Monster {
    constructor(scene, gridX, gridY, type = 'goblin') {
        this.scene  = scene;
        this.gridX  = gridX;
        this.gridY  = gridY;
        this.type   = type;
        this.alive  = true;

        // Stats from lookup tables in constants.js
        const worldMul = scene.worldNum || 1;
        const hpScale  = 1 + (worldMul - 1) * 0.35 + Math.max(0, worldMul - 8) * 0.15;
        const atkScale = 1 + (worldMul - 1) * 0.20 + Math.max(0, worldMul - 8) * 0.08;

        this.maxHp    = Math.round((MONSTER_BASE_HP[type]  || 4) * hpScale);
        this.hp       = this.maxHp;
        this.attack   = Math.round((MONSTER_ATTACK[type]  || 1) * atkScale);
        this.color    = MONSTER_COLOR[type]   || COLORS.MONSTER;
        this.xpReward = MONSTER_XP[type]      || 10;

        // Bosses scale aggressively – always a significant threat
        if (type === 'boss') {
            this.maxHp  = 50 + worldMul * 35;
            this.hp     = this.maxHp;
            this.attack = 3 + worldMul * 2;
        }

        // Zone boss – tougher boss that guards zone transitions
        if (type === 'zone_boss') {
            this.maxHp  = 80 + worldMul * 50;
            this.hp     = this.maxHp;
            this.attack = 5 + worldMul * 3;
            this.color  = 0xff22ff;
            this.xpReward = 300 + worldMul * 50;
            this.defense = Math.floor(worldMul * 0.5);
        }

        // Boss phase tracking (1 = normal, 2 = enraged at ≤50% HP)
        this.phase   = 1;
        this.enraged = false;

        this.graphics = scene.add.graphics();
        this.hpBar    = scene.add.graphics();
        this.graphics.setDepth(3);
        this.hpBar.setDepth(6);

        this._draw();
    }

    // ── Drawing ────────────────────────────────────────────────────────────────

    /** Redraws sprite content at local (0,0). Does NOT touch graphics.x/y. */
    _drawSprite() {
        if (!this.alive) return;
        const g = this.graphics;
        const s = TILE_SIZE;
        g.clear();

        switch (this.type) {
            case 'zone_boss': this._drawZoneBoss(g, s); break;
            case 'boss':      this._drawBoss(g, s);     break;
            case 'orc':       this._drawOrc(g, s);      break;
            case 'troll':     this._drawTroll(g, s);    break;
            default:          this._drawGoblin(g, s);   break;
        }

        // Phase 2 boss: angry red aura border
        if ((this.type === 'boss' || this.type === 'zone_boss') && this.phase === 2) {
            g.lineStyle(2, 0xff0000, 0.9);
            g.strokeRect(1, 1, s - 2, s - 2);
            g.lineStyle(1, 0xff6600, 0.5);
            g.strokeRect(3, 3, s - 6, s - 6);
        }
    }

    /** Full redraw including position snap (initial placement / after combat). */
    _draw() {
        if (!this.alive) return;
        const g = this.graphics;
        const s = TILE_SIZE;
        g.x = this.gridX * s;
        g.y = this.gridY * s;
        this._drawSprite();

        // HP bar – stays with the graphics object
        this.hpBar.clear();
        this.hpBar.x = g.x;
        this.hpBar.y = g.y;
        const barW   = s - 6;
        const pct    = this.hp / this.maxHp;
        const filled = Math.max(0, Math.round(barW * pct));
        this.hpBar.fillStyle(0x220000);
        this.hpBar.fillRect(3, 0, barW, 4);
        // Phase 2 boss bar turns orange
        const barCol = (this.type === 'boss' || this.type === 'zone_boss')
            ? (this.phase === 2 ? 0xff6600 : (this.type === 'zone_boss' ? 0xff22ff : 0xff1166))
            : 0xff4444;
        this.hpBar.fillStyle(barCol);
        this.hpBar.fillRect(3, 0, filled, 4);
    }

    /** Smoothly slide monster to a new grid tile. */
    moveTo(gx, gy) {
        this.gridX = gx;
        this.gridY = gy;
        const s  = TILE_SIZE;
        const tx = gx * s, ty = gy * s;
        this.scene.tweens.killTweensOf(this.graphics);
        this.scene.tweens.killTweensOf(this.hpBar);
        this.scene.tweens.add({
            targets:  [this.graphics, this.hpBar],
            x: tx, y: ty,
            duration: Math.round(MOVE_ANIM_MS * 1.4),
            ease:     'Sine.easeOut'
        });
    }

    // ── Goblin ─────────────────────────────────────────────────────────────────
    // Small, green, pointy ears, yellow slit eyes, wide toothy grin

    _drawGoblin(g, s)  { MonsterGraphics.drawGoblin(g, s); }
    _drawOrc(g, s)     { MonsterGraphics.drawOrc(g, s); }
    _drawTroll(g, s)   { MonsterGraphics.drawTroll(g, s); }
    _drawBoss(g, s)    { MonsterGraphics.drawBoss(g, s, this.phase); }
    _drawZoneBoss(g, s) { MonsterGraphics.drawZoneBoss(g, s, this.phase); }

    // ── Combat ────────────────────────────────────────────────────────────────

    /** Returns true if monster died. Returns 'enraged' string on boss phase transition. */
    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp    = 0;
            this.alive = false;
            this._playDeathAnimation();
            return true;
        }

        // Flash red on hit
        this._flashHit();

        // Boss phase 2 transition
        let justEnraged = false;
        if ((this.type === 'boss' || this.type === 'zone_boss') && this.phase === 1 && this.hp <= this.maxHp * 0.5) {
            this.phase   = 2;
            this.enraged = true;
            this.attack  = Math.round(this.attack * 1.4);
            justEnraged  = true;
        }

        this._draw();
        return justEnraged ? 'enraged' : false;
    }

    /** Brief red flash overlay at the monster's current tile */
    _flashHit() {
        const s  = TILE_SIZE;
        const fg = this.scene.add.graphics().setDepth(9);
        fg.fillStyle(0xff2200, 0.5);
        fg.fillRect(this.graphics.x + 2, this.graphics.y + 2, s - 4, s - 4);
        this.scene.tweens.add({
            targets: fg, alpha: 0, duration: 150,
            onComplete: () => { if (fg.scene) fg.destroy(); }
        });
    }

    /** Spin, shrink and fade out before destroying graphics */
    _playDeathAnimation() {
        if (this.hpBar?.scene) this.hpBar.destroy();
        const g = this.graphics;
        if (!g || !g.scene) return;
        // Shift origin to center so rotation looks natural
        g.x += TILE_SIZE / 2;
        g.y += TILE_SIZE / 2;
        const isBoss = this.type === 'boss' || this.type === 'zone_boss';
        this.scene.tweens.add({
            targets:  g,
            angle:    isBoss ? 540 : 180,
            scaleX:   0,
            scaleY:   0,
            alpha:    0,
            duration: isBoss ? 550 : 300,
            ease:     'Back.easeIn',
            onComplete: () => { if (g.scene) g.destroy(); }
        });
    }

    // ── Status effects ─────────────────────────────────────────────────────────

    applyStun(turns) {
        this.stunTurns = Math.max(this.stunTurns || 0, turns);
    }

    applyAcidBurn(turns) {
        if (!this._acidBurnActive) {
            this._acidBurnActive = true;
            this._acidBurnTurns = turns;
            this._acidDefReduced = 0;
        } else {
            this._acidBurnTurns = Math.max(this._acidBurnTurns, turns);
        }
    }

    /** Call each turn to tick status effects. Returns true if monster died. */
    tickStatusEffects() {
        // Stun
        if (this.stunTurns > 0) this.stunTurns--;

        // Acid burn – reduce defense by 1 each turn
        if (this._acidBurnActive && this._acidBurnTurns > 0) {
            this._acidBurnTurns--;
            if ((this.defense || 0) > 0) {
                this.defense--;
                this._acidDefReduced++;
            }
            if (this._acidBurnTurns <= 0) {
                this._acidBurnActive = false;
                // Restore reduced defense
                this.defense = (this.defense || 0) + (this._acidDefReduced || 0);
                this._acidDefReduced = 0;
            }
        }
        return false;
    }

    destroy() {
        if (this.graphics && this.graphics.scene) this.graphics.destroy();
        if (this.hpBar    && this.hpBar.scene)    this.hpBar.destroy();
    }
}
