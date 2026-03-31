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
        const hpScale  = 1 + (worldMul - 1) * 0.5;
        const atkScale = 1 + (worldMul - 1) * 0.25;

        this.maxHp    = Math.round((MONSTER_BASE_HP[type]  || 4) * hpScale);
        this.hp       = this.maxHp;
        this.attack   = Math.round((MONSTER_ATTACK[type]  || 1) * atkScale);
        this.color    = MONSTER_COLOR[type]   || COLORS.MONSTER;
        this.xpReward = MONSTER_XP[type]      || 10;

        // Bosses scale aggressively – always a significant threat
        if (type === 'boss') {
            this.maxHp  = 35 + worldMul * 25;
            this.hp     = this.maxHp;
            this.attack = 3 + worldMul * 2;
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
            case 'boss':  this._drawBoss(g, s);   break;
            case 'orc':   this._drawOrc(g, s);    break;
            case 'troll': this._drawTroll(g, s);  break;
            default:      this._drawGoblin(g, s); break;
        }

        // Phase 2 boss: angry red aura border
        if (this.type === 'boss' && this.phase === 2) {
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
        const barCol = this.type === 'boss'
            ? (this.phase === 2 ? 0xff6600 : 0xff1166)
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

    _drawGoblin(g, s) {
        const cx = s >> 1;

        // Shadow
        g.fillStyle(0x000000, 0.25);
        g.fillEllipse(cx, 31, 18, 5);

        // Legs
        g.fillStyle(0x2a6615);
        g.fillRect(cx - 6, 22, 4, 8);
        g.fillRect(cx + 2, 22, 4, 8);
        // Feet
        g.fillStyle(0x1a4a0a);
        g.fillRect(cx - 8, 27, 6, 4);
        g.fillRect(cx + 2, 27, 6, 4);

        // Body
        g.fillStyle(0x44aa33);
        g.fillRoundedRect(cx - 7, 15, 14, 10, 2);
        // Belt
        g.fillStyle(0x553300);
        g.fillRect(cx - 7, 21, 14, 2);
        g.fillStyle(0xcc9922);
        g.fillRect(cx - 2, 21, 4, 3);  // buckle

        // Arms
        g.fillStyle(0x3a9928);
        g.fillRoundedRect(cx - 13, 15, 7, 8, 2);
        g.fillRoundedRect(cx + 6,  15, 7, 8, 2);
        // Claws
        g.fillStyle(0x99bb55);
        g.fillTriangle(cx - 13, 22, cx - 15, 26, cx - 10, 22);
        g.fillTriangle(cx + 13, 22, cx + 15, 26, cx + 10, 22);

        // Head
        g.fillStyle(0x55cc44);
        g.fillRoundedRect(cx - 8, 5, 16, 13, 3);
        // Forehead ridge (darker)
        g.fillStyle(0x3a9928);
        g.fillRect(cx - 8, 5, 16, 3);

        // Pointy ears
        g.fillStyle(0x33991e);
        g.fillTriangle(cx - 8, 9, cx - 14, 3, cx - 3, 14);
        g.fillTriangle(cx + 8, 9, cx + 14, 3, cx + 3, 14);

        // Eyes (yellow with vertical slit)
        g.fillStyle(0xffee22);
        g.fillRect(cx - 7, 9, 5, 4);
        g.fillRect(cx + 2, 9, 5, 4);
        g.fillStyle(0x000000);
        g.fillRect(cx - 5, 9, 1, 4);
        g.fillRect(cx + 4, 9, 1, 4);

        // Nose (nostrils)
        g.fillStyle(0x2d7a10);
        g.fillRect(cx - 2, 13, 2, 2);
        g.fillRect(cx + 1, 13, 2, 2);

        // Wide grin with jagged teeth
        g.fillStyle(0x110800);
        g.fillRect(cx - 5, 15, 10, 3);
        g.fillStyle(0xddddaa);
        g.fillRect(cx - 5, 14, 2, 2);
        g.fillRect(cx - 2, 14, 2, 2);
        g.fillRect(cx + 1, 14, 2, 2);
        g.fillRect(cx + 3, 14, 2, 2);
        // Lower fang
        g.fillRect(cx - 1, 18, 2, 2);
    }

    // ── Orc ────────────────────────────────────────────────────────────────────
    // Stocky, olive-green, heavy brow, upward tusks, red eyes

    _drawOrc(g, s) {
        const cx = s >> 1;

        // Shadow
        g.fillStyle(0x000000, 0.35);
        g.fillEllipse(cx, 31, 22, 6);

        // Thick legs
        g.fillStyle(0x556633);
        g.fillRect(cx - 8, 20, 7, 10);
        g.fillRect(cx + 1, 20, 7, 10);
        // Boots
        g.fillStyle(0x332211);
        g.fillRect(cx - 9, 26, 9, 5);
        g.fillRect(cx, 26, 9, 5);

        // Body (wide, armored)
        g.fillStyle(0x7a9944);
        g.fillRoundedRect(cx - 11, 12, 22, 11, 2);
        // Armor plate
        g.fillStyle(0x6a8833);
        g.fillRect(cx - 8, 12, 16, 3);
        g.fillStyle(0x8aaa55);
        g.fillRect(cx - 7, 13, 14, 2);
        // Center buckle
        g.fillStyle(0xcc9922);
        g.fillRect(cx - 2, 18, 4, 3);

        // Thick arms
        g.fillStyle(0x7a9944);
        g.fillRoundedRect(cx - 17, 12, 8, 11, 2);
        g.fillRoundedRect(cx + 9,  12, 8, 11, 2);
        // Fists
        g.fillStyle(0x6a8833);
        g.fillCircle(cx - 13, 24, 4);
        g.fillCircle(cx + 13, 24, 4);
        // Knuckles
        g.fillStyle(0x8aaa55);
        g.fillRect(cx - 16, 22, 2, 2);
        g.fillRect(cx + 14, 22, 2, 2);

        // Head (wide, flat-top)
        g.fillStyle(0x889955);
        g.fillRoundedRect(cx - 9, 4, 18, 11, 2);
        // Heavy brow ridge
        g.fillStyle(0x445522);
        g.fillRect(cx - 9, 4, 18, 3);
        // Brow highlight
        g.fillStyle(0x556633);
        g.fillRect(cx - 7, 5, 14, 1);

        // Angry eyes (red)
        g.fillStyle(0xff4411);
        g.fillRect(cx - 7, 7, 5, 4);
        g.fillRect(cx + 2, 7, 5, 4);
        g.fillStyle(0x220000);
        g.fillRect(cx - 6, 8, 3, 2);
        g.fillRect(cx + 3, 8, 3, 2);
        // Angry brow marks (angled down toward center)
        g.fillStyle(0x1a3310);
        g.fillRect(cx - 7, 6, 4, 1);
        g.fillRect(cx + 4, 6, 4, 1);

        // Broad flat nose
        g.fillStyle(0x5a7733);
        g.fillRect(cx - 3, 11, 6, 3);
        g.fillStyle(0x3a5520);
        g.fillRect(cx - 2, 13, 2, 1);
        g.fillRect(cx + 1, 13, 2, 1);

        // Mouth with upward tusks
        g.fillStyle(0x223311);
        g.fillRect(cx - 5, 14, 10, 2);
        g.fillStyle(0xeeeebb);
        // Tusks pointing up-out from lower jaw
        g.fillTriangle(cx - 4, 14, cx - 6, 20, cx - 2, 14);
        g.fillTriangle(cx + 4, 14, cx + 6, 20, cx + 2, 14);
    }

    // ── Troll ──────────────────────────────────────────────────────────────────
    // Very wide, brown, long arms, bulbous nose, dim eyes, hunched

    _drawTroll(g, s) {
        const cx = s >> 1;

        // Shadow (large)
        g.fillStyle(0x000000, 0.40);
        g.fillEllipse(cx, 31, 26, 7);

        // Short stubby legs
        g.fillStyle(0x665544);
        g.fillRect(cx - 7, 24, 6, 7);
        g.fillRect(cx + 1, 24, 6, 7);

        // Massive body
        g.fillStyle(0x997755);
        g.fillRoundedRect(cx - 12, 10, 24, 15, 3);
        // Body highlight
        g.fillStyle(0xaa8866);
        g.fillRect(cx - 8, 10, 16, 4);
        // Belly line
        g.fillStyle(0x775533);
        g.fillRect(cx - 5, 21, 10, 1);

        // Long arms reaching low
        g.fillStyle(0x886644);
        g.fillRoundedRect(cx - 18, 10, 8, 16, 2);
        g.fillRoundedRect(cx + 10, 10, 8, 16, 2);
        // Big knuckled hands
        g.fillStyle(0x775533);
        g.fillRoundedRect(cx - 19, 25, 9, 6, 2);
        g.fillRoundedRect(cx + 10, 25, 9, 6, 2);
        // Fingers
        g.fillStyle(0x664422);
        g.fillRect(cx - 19, 24, 2, 3);
        g.fillRect(cx - 16, 24, 2, 3);
        g.fillRect(cx + 17, 24, 2, 3);
        g.fillRect(cx + 14, 24, 2, 3);

        // Wide squat head
        g.fillStyle(0xaa8866);
        g.fillRoundedRect(cx - 11, 3, 22, 11, 3);
        // Bumpy top (warts/lumps)
        g.fillStyle(0x997755);
        g.fillCircle(cx - 5, 5, 3);
        g.fillCircle(cx,     4, 3);
        g.fillCircle(cx + 5, 5, 3);

        // Sunken beady eyes
        g.fillStyle(0x553300);
        g.fillRect(cx - 8, 8, 5, 4);
        g.fillRect(cx + 3, 8, 5, 4);
        g.fillStyle(0xcc8833);
        g.fillRect(cx - 7, 9, 3, 2);
        g.fillRect(cx + 4, 9, 3, 2);
        g.fillStyle(0x111100);
        g.fillRect(cx - 6, 10, 1, 1);
        g.fillRect(cx + 5, 10, 1, 1);

        // Big bulbous nose
        g.fillStyle(0x886644);
        g.fillRoundedRect(cx - 3, 11, 7, 5, 2);
        // Nostrils
        g.fillStyle(0x443322);
        g.fillCircle(cx - 1, 14, 1);
        g.fillCircle(cx + 3, 14, 1);

        // Wide grim mouth
        g.fillStyle(0x221100);
        g.fillRect(cx - 7, 13, 14, 2);
        // Uneven teeth
        g.fillStyle(0xccccaa);
        g.fillRect(cx - 6, 12, 3, 2);
        g.fillRect(cx - 2, 12, 4, 2);
        g.fillRect(cx + 3, 12, 3, 2);
    }

    // ── Boss ───────────────────────────────────────────────────────────────────
    // Large, crimson, golden crown, glowing eyes, huge fangs

    _drawBoss(g, s) {
        const cx   = s >> 1;
        const p2   = this.phase === 2;
        // Phase 2: shift palette to dark orange/red rage
        const bodyCol  = p2 ? 0xff4400 : 0xff1166;
        const bodyDark = p2 ? 0xcc2200 : 0xcc0044;
        const seamCol  = p2 ? 0xff8822 : 0xff4499;
        const headCol  = p2 ? 0xff5500 : 0xff2277;
        const eyeOuter = p2 ? 0xffffff : 0xffffff;
        const eyeInner = p2 ? 0xff6600 : 0xff2200;

        // Dark menacing aura
        g.fillStyle(p2 ? 0x330800 : 0x330011, 0.6);
        g.fillRoundedRect(1, 1, s - 2, s - 2, 5);

        // Shadow
        g.fillStyle(0x000000, 0.5);
        g.fillEllipse(cx, 31, 28, 7);

        // Legs
        g.fillStyle(p2 ? 0x882200 : 0x990033);
        g.fillRect(cx - 8, 22, 7, 9);
        g.fillRect(cx + 1, 22, 7, 9);

        // Massive body
        g.fillStyle(bodyCol);
        g.fillRoundedRect(cx - 12, 11, 24, 14, 3);
        // Chest armor / rune glow
        g.fillStyle(bodyDark);
        g.fillRect(cx - 9, 11, 18, 4);
        g.fillStyle(seamCol);
        g.fillRect(cx - 1, 12, 3, 12);  // glowing center seam
        g.fillStyle(bodyCol);
        g.fillRect(cx - 1, 13, 3, 11);  // slightly dim the center

        // Arms
        g.fillStyle(0xdd0044);
        g.fillRoundedRect(cx - 17, 11, 7, 13, 2);
        g.fillRoundedRect(cx + 10, 11, 7, 13, 2);
        // Clawed hands
        g.fillStyle(0xaa0033);
        g.fillTriangle(cx - 17, 23, cx - 20, 28, cx - 13, 24);
        g.fillTriangle(cx - 14, 23, cx - 12, 28, cx - 11, 24);
        g.fillTriangle(cx + 17, 23, cx + 20, 28, cx + 13, 24);
        g.fillTriangle(cx + 14, 23, cx + 12, 28, cx + 11, 24);

        // Head
        g.fillStyle(headCol);
        g.fillRoundedRect(cx - 11, 4, 22, 11, 3);

        // Golden crown (phase 2: darker / cracked look)
        g.fillStyle(p2 ? 0xcc8800 : 0xffcc00);
        g.fillRect(cx - 9, 4, 18, 3);   // crown band
        g.fillRect(cx - 7, 1, 3, 5);    // left spike
        g.fillRect(cx - 1, 0, 3, 6);    // tallest center spike
        g.fillRect(cx + 5, 1, 3, 5);    // right spike
        // Crown gems
        g.fillStyle(0xff2200);
        g.fillRect(cx - 6, 2, 2, 2);
        g.fillRect(cx,     1, 2, 2);
        g.fillRect(cx + 6, 2, 2, 2);
        // Gem shine
        g.fillStyle(0xff8855);
        g.fillRect(cx - 6, 2, 1, 1);
        g.fillRect(cx,     1, 1, 1);
        g.fillRect(cx + 6, 2, 1, 1);

        // Glowing eyes (phase 2: blazing orange-white)
        g.fillStyle(eyeOuter);
        g.fillRect(cx - 9, 7, 7, 5);
        g.fillRect(cx + 2, 7, 7, 5);
        g.fillStyle(eyeInner);
        g.fillRect(cx - 8, 8, 5, 3);
        g.fillRect(cx + 3, 8, 5, 3);
        g.fillStyle(p2 ? 0x331100 : 0x000000);
        g.fillRect(cx - 6, 9, 2, 2);
        g.fillRect(cx + 4, 9, 2, 2);
        // Eye glow
        g.fillStyle(p2 ? 0xff8800 : 0xff6644, p2 ? 0.9 : 0.5);
        g.fillRect(cx - 9, 7, 7, 1);
        g.fillRect(cx + 2, 7, 7, 1);

        // Huge fangs
        g.fillStyle(0xffffff);
        g.fillTriangle(cx - 5, 13, cx - 7, 19, cx - 3, 13);
        g.fillTriangle(cx + 5, 13, cx + 7, 19, cx + 3, 13);
        g.fillTriangle(cx,     13, cx - 1, 16, cx + 1, 13);
        // Fang shading
        g.fillStyle(0xccccaa);
        g.fillTriangle(cx - 4, 13, cx - 5, 17, cx - 3, 13);
        g.fillTriangle(cx + 4, 13, cx + 5, 17, cx + 3, 13);

        // Scowl
        g.fillStyle(0x550011);
        g.fillRect(cx - 6, 13, 12, 2);
        g.fillRect(cx - 6, 12, 2, 2);
        g.fillRect(cx + 4, 12, 2, 2);
    }

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
        if (this.type === 'boss' && this.phase === 1 && this.hp <= this.maxHp * 0.5) {
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
        this.scene.tweens.add({
            targets:  g,
            angle:    this.type === 'boss' ? 540 : 180,
            scaleX:   0,
            scaleY:   0,
            alpha:    0,
            duration: this.type === 'boss' ? 550 : 300,
            ease:     'Back.easeIn',
            onComplete: () => { if (g.scene) g.destroy(); }
        });
    }

    destroy() {
        if (this.graphics && this.graphics.scene) this.graphics.destroy();
        if (this.hpBar    && this.hpBar.scene)    this.hpBar.destroy();
    }
}
