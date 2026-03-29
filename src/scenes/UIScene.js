// ─── Labyrint Hero – UIScene (HUD overlay) ────────────────────────────────────

class UIScene extends Phaser.Scene {
    constructor() { super({ key: 'UIScene' }); }

    init(data) { this.gameScene = data.gameScene; }

    create() {
        const W = this.cameras.main.width;
        const H = this.cameras.main.height;

        // Init audio on first user interaction (browser requirement)
        this.input.once('pointerdown', () => { Audio.init(); });
        this.input.keyboard.once('keydown', () => { Audio.init(); });

        const hud = this.add.graphics();
        hud.fillStyle(COLORS.HUD_BG, 0.85);
        hud.fillRect(0, 0, W, 54);
        hud.fillStyle(0x1a1535, 0.5);
        hud.fillRect(0, 54, W, 2);

        this.heartGfx  = this.add.graphics();
        this.xpBg      = this.add.graphics();
        this.xpFill    = this.add.graphics();
        this.eqGfx     = this.add.graphics();

        const ts = { fontSize: '11px', color: '#8899bb', fontFamily: 'monospace' };
        const DIFF_COL  = { easy: '#44bb44', normal: '#4488ff', hard: '#ff5555' };
        const DIFF_LBL  = { easy: 'LETT', normal: 'NORMAL', hard: 'VANSKELIG' };
        const diff      = this.gameScene.difficulty || 'normal';
        this.add.text(W - 14, 8, DIFF_LBL[diff] || 'NORMAL', {
            fontSize: '9px', color: DIFF_COL[diff] || '#4488ff', fontFamily: 'monospace'
        }).setOrigin(1, 0);

        this.worldText  = this.add.text(W - 50, 8,  '', { ...ts, color: '#aaaacc' }).setOrigin(1, 0);
        this.levelText  = this.add.text(W - 50, 22, '', ts).setOrigin(1, 0);
        this.atkText    = this.add.text(W - 50, 36, '', ts).setOrigin(1, 0);
        this.eqText     = this.add.text(10, 56, '', { fontSize: '10px', color: '#556677', fontFamily: 'monospace' });
        this.eHint      = this.add.text(W - 50, 56, '[SPACE/F] Angrep  [R] Pil  [E] Inventar  [+/-] Zoom', { fontSize: '10px', color: '#334455', fontFamily: 'monospace' }).setOrigin(1, 0);

        // Poison indicator (hidden until poisoned)
        this.poisonText = this.add.text(10, 70, '', {
            fontSize: '11px', color: '#44ee66', fontFamily: 'monospace', fontStyle: 'bold'
        });
        this.poisonText.setVisible(false);

        // Settings gear button
        const gearBtn = this.add.text(W - 14, 10, '⚙', { fontSize: '18px', color: '#445566', fontFamily: 'monospace' })
            .setOrigin(1, 0)
            .setInteractive({ useHandCursor: true });
        gearBtn.on('pointerover',  () => gearBtn.setColor('#88bbff'));
        gearBtn.on('pointerout',   () => gearBtn.setColor('#445566'));
        gearBtn.on('pointerdown',  () => {
            Audio.init();
            if (!this.scene.isActive('SettingsScene')) {
                this.scene.launch('SettingsScene');
            }
        });

        this.bossBar = this._makeBossBar(W);

        // ── Minimap ───────────────────────────────────────────────────────────
        this.minimapGfx    = this.add.graphics();
        this.minimapBorder = this.add.graphics();
        this._minimapScale = 2;   // px per tile
        this._minimapX     = W - 8;    // right-anchored
        this._minimapY     = H - 8;    // bottom-anchored
        this._minimapThrottle = 0;

        // Toggle minimap with M key
        this._minimapVisible = true;
        this.input.keyboard.on('keydown-M', () => {
            this._minimapVisible = !this._minimapVisible;
            this.minimapGfx.setVisible(this._minimapVisible);
            this.minimapBorder.setVisible(this._minimapVisible);
        });

        this.refresh();
    }

    _makeBossBar(W) {
        const c = this.add.container(W / 2, 68);
        c.setVisible(false);
        const label = this.add.text(0, 0, '', { fontSize: '11px', color: '#ff4488', fontFamily: 'monospace' }).setOrigin(0.5, 0);
        const bg    = this.add.graphics();
        bg.fillStyle(0x330011);
        bg.fillRect(-90, 14, 180, 10);
        const fill  = this.add.graphics();
        c.add([label, bg, fill]);
        c._fill  = fill;
        c._label = label;
        return c;
    }

    // ── Minimap drawing ───────────────────────────────────────────────────────

    _drawMinimap() {
        const gs = this.gameScene;
        if (!gs || !gs.maze || !gs.fog) return;

        const sc   = this._minimapScale;
        const tileW = gs.tileW, tileH = gs.tileH;
        const mW   = tileW * sc, mH = tileH * sc;
        const mx   = this._minimapX - mW;   // right edge
        const my   = this._minimapY - mH;   // bottom edge

        const g = this.minimapGfx;
        g.clear();

        // Background panel
        g.fillStyle(0x000000, 0.65);
        g.fillRect(mx - 2, my - 2, mW + 4, mH + 4);

        // Tiles
        for (let ty = 0; ty < tileH; ty++) {
            for (let tx = 0; tx < tileW; tx++) {
                const fog = gs.fog[ty][tx];
                if (fog === FOG.DARK) continue;   // never seen – don't draw

                const t   = gs.maze[ty][tx];
                const px  = mx + tx * sc;
                const py  = my + ty * sc;
                const dim = fog === FOG.DIM;

                let col;
                switch (t) {
                    case TILE.WALL:         col = dim ? 0x222233 : 0x3a3555; break;
                    case TILE.SECRET:       col = dim ? 0x222233 : 0x3a3555; break;
                    case TILE.CRACKED_WALL: col = dim ? 0x2a2240 : 0x554488; break;
                    case TILE.DOOR:         col = dim ? 0x332200 : 0x886622; break;
                    case TILE.EXIT:         col = dim ? 0x004422 : 0x00cc66; break;
                    case TILE.TRAP:         col = dim ? 0x221100 : 0x663300; break;
                    default:                col = dim ? 0x111122 : 0x1e1e3a; break;  // FLOOR
                }

                g.fillStyle(col);
                g.fillRect(px, py, sc, sc);
            }
        }

        // Monsters (red dots on lit tiles only)
        for (const m of gs.monsters) {
            if (!m.alive) continue;
            if (gs.fog[m.gridY][m.gridX] === FOG.DARK) continue;
            const px = mx + m.gridX * sc;
            const py = my + m.gridY * sc;
            const col = m.type === 'boss' ? 0xff1166 : 0xff4444;
            g.fillStyle(col);
            g.fillRect(px, py, sc, sc);
        }

        // Chests (gold dots)
        for (const c of gs.chests) {
            if (c.opened) continue;
            if (gs.fog[c.gridY][c.gridX] === FOG.DARK) continue;
            const px = mx + c.gridX * sc;
            const py = my + c.gridY * sc;
            g.fillStyle(0xffcc22);
            g.fillRect(px, py, sc, sc);
        }

        // Hero (bright white dot)
        const hpx = mx + gs.hero.gridX * sc;
        const hpy = my + gs.hero.gridY * sc;
        g.fillStyle(0xffffff);
        g.fillRect(hpx, hpy, sc, sc);

        // Border
        const b = this.minimapBorder;
        b.clear();
        b.lineStyle(1, 0x334466, 0.8);
        b.strokeRect(mx - 2, my - 2, mW + 4, mH + 4);
    }

    // ── Main refresh (called every frame from update) ─────────────────────────

    update() {
        // Throttle to avoid thrashing – refresh every ~80 ms
        const now = this.time.now;
        if (now - this._lastRefresh > 80) {
            this._lastRefresh = now;
            this.refresh();
        }
        // Minimap throttled separately at ~120ms
        if (this._minimapVisible && now - this._minimapThrottle > 120) {
            this._minimapThrottle = now;
            this._drawMinimap();
        }
    }

    refresh() {
        if (!this.gameScene?.hero) return;
        const hero  = this.gameScene.hero;
        const stats = hero.getStats();
        const W     = this.cameras.main.width;

        // ── Hearts ────────────────────────────────────────────────────────────
        const g = this.heartGfx;
        g.clear();
        const hs = 15, gap = 3, sx = 10, sy = 10;
        for (let i = 0; i < stats.maxHearts; i++) {
            const x = sx + i * (hs + gap);
            g.fillStyle(i < stats.hearts ? COLORS.HEART_FULL : COLORS.HEART_EMPTY);
            g.fillRect(x, sy + 4, hs, hs - 4);
            g.fillRect(x + 2, sy + 2, 5, 4);
            g.fillRect(x + hs - 7, sy + 2, 5, 4);
        }

        // ── XP bar ────────────────────────────────────────────────────────────
        const xpX = 10, xpY = 38, xpW = Math.min(220, stats.maxHearts * 22);
        const frac = stats.xpToNext > 0 ? stats.xp / stats.xpToNext : 0;
        this.xpBg.clear();
        this.xpBg.fillStyle(COLORS.XP_BG);
        this.xpBg.fillRect(xpX, xpY, xpW, 8);
        this.xpFill.clear();
        this.xpFill.fillStyle(COLORS.XP_BAR);
        this.xpFill.fillRect(xpX, xpY, Math.floor(xpW * frac), 8);

        // ── Labels ────────────────────────────────────────────────────────────
        this.worldText.setText(`Verden ${this.gameScene.worldNum}`);
        this.levelText.setText(`Nivå ${stats.level}  XP ${stats.xp}/${stats.xpToNext}`);
        this.atkText.setText(`ATK ${stats.attack}  DEF ${stats.defense}  Syn ${stats.visionRadius}`);

        // ── Equipped items ─────────────────────────────────────────────────────
        const inv = hero.inventory;
        const wpn = inv.equipped.weapon;
        const arm = inv.equipped.armor;
        const parts = [];
        if (wpn) parts.push(`[${wpn.name}]`);
        if (arm) parts.push(`[${arm.name}]`);
        this.eqText.setText(parts.length ? parts.join('  ') : '');

        // ── Poison indicator ──────────────────────────────────────────────────
        if (hero.poisonTurns > 0) {
            this.poisonText.setText(`☠ Forgiftet (${hero.poisonTurns} runder)`);
            this.poisonText.setVisible(true);
        } else {
            this.poisonText.setVisible(false);
        }

        // ── Boss HP bar ────────────────────────────────────────────────────────
        const boss = this.gameScene.boss;
        if (boss && boss.alive) {
            this.bossBar.setVisible(true);
            const fill   = this.bossBar._fill;
            const barCol = boss.phase === 2 ? 0xff6600 : 0xff1166;
            fill.clear();
            fill.fillStyle(barCol);
            fill.fillRect(-90, 14, Math.floor(180 * (boss.hp / boss.maxHp)), 10);
            const phaseTag = boss.phase === 2 ? '  ⚡ RASENDE' : '';
            this.bossBar._label.setText(`BOSS  ${boss.hp} / ${boss.maxHp}${phaseTag}`);
            this.bossBar._label.setColor(boss.phase === 2 ? '#ff8833' : '#ff4488');
        } else {
            this.bossBar.setVisible(false);
        }
    }
}
