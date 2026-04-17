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

        const ts = { fontSize: '13px', color: '#8899bb', fontFamily: 'monospace' };
        const DIFF_COL  = { easy: '#44bb44', normal: '#4488ff', hard: '#ff5555' };
        const DIFF_LBL  = { easy: 'LETT', normal: 'NORMAL', hard: 'VANSKELIG' };
        const diff      = this.gameScene.difficulty || 'normal';
        this.add.text(W - 14, 8, DIFF_LBL[diff] || 'NORMAL', {
            fontSize: '11px', color: DIFF_COL[diff] || '#4488ff', fontFamily: 'monospace'
        }).setOrigin(1, 0);

        this.worldText  = this.add.text(W - 50, 8,  '', { ...ts, color: '#aaaacc' }).setOrigin(1, 0);
        this.levelText  = this.add.text(W - 50, 22, '', ts).setOrigin(1, 0);
        this.atkText    = this.add.text(W - 50, 36, '', ts).setOrigin(1, 0);
        this.goldText   = this.add.text(10, 30, '', { fontSize: '13px', color: '#ffcc00', fontFamily: 'monospace' });
        this.eqText     = this.add.text(10, 56, '', { fontSize: '12px', color: '#556677', fontFamily: 'monospace' });
        this.eHint      = this.add.text(W - 50, 56, '[SPACE/F] Angrep  [R] Pil  [Q] Bruk  [E] Inventar  [+/-] Zoom', { fontSize: '12px', color: '#334455', fontFamily: 'monospace' }).setOrigin(1, 0);

        // Status effect indicators
        this.statusText = this.add.text(10, 70, '', {
            fontSize: '13px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold'
        });
        this.statusText.setVisible(false);

        // Pet info
        this.petText = this.add.text(W / 2 - 60, 30, '', {
            fontSize: '12px', color: '#ffaadd', fontFamily: 'monospace'
        });
        this.petHpGfx = this.add.graphics();

        // HUD buttons – centered in the top bar
        const hudBtns = [
            { label: '📖', scene: 'ElementBookScene',
              launchData: () => ({ heroRef: this.gameScene.hero }) },
            { label: '⚔', scene: 'SkillScene',
              launchData: () => ({ heroRef: this.gameScene.hero, viewOnly: true }) },
            { label: '🎒', scene: 'InventoryScene',
              launchData: () => ({}) },
            { label: '⚙', scene: 'SettingsScene',
              launchData: () => ({}) },
        ];
        const btnSpacing = 28;
        const totalW = (hudBtns.length - 1) * btnSpacing;
        let btnX = W / 2 - totalW / 2;
        hudBtns.forEach(def => {
            const btn = this.add.text(btnX, 10, def.label, {
                fontSize: '16px', color: '#445566', fontFamily: 'monospace'
            }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
            btn.on('pointerover', () => btn.setColor('#88bbff'));
            btn.on('pointerout',  () => btn.setColor('#445566'));
            btn.on('pointerdown', () => {
                Audio.init();
                if (!this.scene.isActive(def.scene)) {
                    if (def.scene === 'SettingsScene') {
                        this.scene.launch(def.scene);
                    } else if (this.gameScene?.hero) {
                        this.scene.launch(def.scene, def.launchData());
                    }
                }
            });
            btnX += btnSpacing;
        });

        // Hide keyboard hints on touch devices
        if (this.game.registry.get('isTouchDevice')) {
            this.eHint.setVisible(false);
        }

        // Touch controls (d-pad + action buttons)
        this.touchControls = new TouchControls(this);
        this.touchControls.create();

        this.bossBar = this._makeBossBar(W);

        // ── Minimap ───────────────────────────────────────────────────────────
        this.minimapGfx    = this.add.graphics();
        this.minimapBorder = this.add.graphics();
        this._minimapScale = 2;   // px per tile
        this._minimapX     = W - 8;    // right-anchored
        this._minimapY     = H - 8;    // bottom-anchored
        this._minimapThrottle = 0;

        // Toggle minimap with M key or touch button
        this._minimapVisible = true;
        this.input.keyboard.on('keydown-M', () => {
            this._toggleMinimap();
        });

        this.refresh();
    }

    _makeBossBar(W) {
        const c = this.add.container(W / 2, 68);
        c.setVisible(false);
        const label = this.add.text(0, 0, '', { fontSize: '13px', color: '#ff4488', fontFamily: 'monospace' }).setOrigin(0.5, 0);
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

        // Merchant (blue dot)
        if (gs.merchant && gs.fog[gs.merchant.gridY][gs.merchant.gridX] !== FOG.DARK) {
            const mpx = mx + gs.merchant.gridX * sc;
            const mpy = my + gs.merchant.gridY * sc;
            g.fillStyle(0x4488ff);
            g.fillRect(mpx, mpy, sc, sc);
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

        // Minerals (tier-colored dots, requires Geologist skill or Element Scanner)
        const hasScanner = gs.hero.techElementScanner;
        if (((gs.hero.mineralVisionRadius || 0) > 0 || hasScanner) && gs.itemObjects) {
            for (const obj of gs.itemObjects) {
                if (!obj.isMineral) continue;
                if (!hasScanner && gs.fog[obj.gridY] && gs.fog[obj.gridY][obj.gridX] === FOG.DARK) continue;
                const px = mx + obj.gridX * sc;
                const py = my + obj.gridY * sc;
                const tierCol = (typeof MINERAL_TIER_COLORS !== 'undefined' && obj.item)
                    ? (MINERAL_TIER_COLORS[obj.item.tier] || 0x88ff88) : 0x88ff88;
                g.fillStyle(hasScanner ? 0x44ffaa : tierCol, 0.8);
                g.fillRect(px, py, sc, sc);
            }
        }

        // Pet (pink dot)
        if (gs.pet && gs.pet.alive) {
            const ppx = mx + gs.pet.gridX * sc;
            const ppy = my + gs.pet.gridY * sc;
            g.fillStyle(0xffaadd);
            g.fillRect(ppx, ppy, sc, sc);
        }

        // Route calculator (BFS path to exit/boss)
        if (gs.hero.techRouteCalc) {
            const path = this._bfsPath(gs, gs.hero.gridX, gs.hero.gridY, gs.exitX, gs.exitY);
            if (path) {
                g.fillStyle(0x00ff88, 0.45);
                for (const p of path) {
                    g.fillRect(mx + p.x * sc, my + p.y * sc, sc, sc);
                }
            }
        }

        // Teleporter nodes (cyan dots)
        if (gs.teleporterNodes) {
            for (const n of gs.teleporterNodes) {
                g.fillStyle(0x88ccff);
                g.fillRect(mx + n.gx * sc, my + n.gy * sc, sc, sc);
            }
        }

        // Laser turrets (blue dots)
        if (gs.laserTurrets) {
            for (const t of gs.laserTurrets) {
                g.fillStyle(0x4488ff);
                g.fillRect(mx + t.gx * sc, my + t.gy * sc, sc, sc);
            }
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

    _bfsPath(gs, sx, sy, tx, ty) {
        if (sx === tx && sy === ty) return [];
        const W = gs.tileW, H = gs.tileH, maze = gs.maze;
        const visited = Array.from({ length: H }, () => new Uint8Array(W));
        const prev = Array.from({ length: H }, () => new Array(W).fill(null));
        const queue = [{ x: sx, y: sy }];
        visited[sy][sx] = 1;
        const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
        while (queue.length > 0) {
            const { x, y } = queue.shift();
            for (const [dx, dy] of dirs) {
                const nx = x + dx, ny = y + dy;
                if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
                if (visited[ny][nx]) continue;
                const t = maze[ny][nx];
                if (t === TILE.WALL || t === TILE.CRACKED_WALL) continue;
                visited[ny][nx] = 1;
                prev[ny][nx] = { x, y };
                if (nx === tx && ny === ty) {
                    const path = [];
                    let cx = tx, cy = ty;
                    while (cx !== sx || cy !== sy) {
                        path.push({ x: cx, y: cy });
                        const p = prev[cy][cx];
                        cx = p.x; cy = p.y;
                    }
                    return path;
                }
                queue.push({ x: nx, y: ny });
            }
        }
        return null;
    }

    // ── Main refresh (called every frame from update) ─────────────────────────

    _toggleMinimap() {
        this._minimapVisible = !this._minimapVisible;
        this.minimapGfx.setVisible(this._minimapVisible);
        this.minimapBorder.setVisible(this._minimapVisible);
    }

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
        // Touch minimap toggle
        if (this.game.registry.get('touch_minimap')) {
            this.game.registry.set('touch_minimap', false);
            this._toggleMinimap();
        }
    }

    refresh() {
        if (!this.gameScene?.hero) return;
        const hero  = this.gameScene.hero;
        const W     = this.cameras.main.width;

        // ── Hearts ────────────────────────────────────────────────────────────
        const g = this.heartGfx;
        g.clear();
        const hs = 15, gap = 3, sx = 10, sy = 10;
        for (let i = 0; i < hero.maxHearts; i++) {
            const x = sx + i * (hs + gap);
            g.fillStyle(i < hero.hearts ? COLORS.HEART_FULL : COLORS.HEART_EMPTY);
            g.fillRect(x, sy + 4, hs, hs - 4);
            g.fillRect(x + 2, sy + 2, 5, 4);
            g.fillRect(x + hs - 7, sy + 2, 5, 4);
        }

        // ── XP bar ────────────────────────────────────────────────────────────
        const xpX = 10, xpY = 38, xpW = Math.min(220, hero.maxHearts * 22);
        const frac = hero.xpToNext > 0 ? hero.xp / hero.xpToNext : 0;
        this.xpBg.clear();
        this.xpBg.fillStyle(COLORS.XP_BG);
        this.xpBg.fillRect(xpX, xpY, xpW, 8);
        this.xpFill.clear();
        this.xpFill.fillStyle(COLORS.XP_BAR);
        this.xpFill.fillRect(xpX, xpY, Math.floor(xpW * frac), 8);

        // ── Labels ────────────────────────────────────────────────────────────
        const wn = this.gameScene.worldNum;
        if (typeof getZone !== 'undefined') {
            const zone = getZone(wn);
            const floor = getZoneFloor(wn);
            this.worldText.setText(`${zone.name} ${floor}/${zone.worlds.length}`);
        } else {
            this.worldText.setText(`Verden ${wn}`);
        }
        this.levelText.setText(`Nivå ${hero.level}  XP ${hero.xp}/${hero.xpToNext}`);
        this.atkText.setText(`ATK ${hero.attack}  DEF ${hero.defense}  Syn ${hero.visionRadius}`);
        this.goldText.setText(`💰 ${hero.gold}g`);

        // ── Equipped items ─────────────────────────────────────────────────────
        const inv = hero.inventory;
        const wpn = inv.equipped.weapon;
        const arm = inv.equipped.armor;
        const parts = [];
        const _trunc = (n, mx) => n.length > mx ? n.slice(0, mx - 1) + '…' : n;
        if (wpn) parts.push(`[${_trunc(wpn.name, 18)}]`);
        if (arm) parts.push(`[${_trunc(arm.name, 18)}]`);
        this.eqText.setText(parts.length ? parts.join('  ') : '');
        // Color equipped text by highest rarity
        const bestRarity = [wpn, arm].reduce((best, it) => {
            if (!it || !it.rarity) return best;
            const r = RARITY_BY_ID[it.rarity];
            return r && RARITIES.indexOf(r) > best ? RARITIES.indexOf(r) : best;
        }, -1);
        this.eqText.setColor(bestRarity > 0 ? RARITIES[bestRarity].textColor : '#556677');

        // ── Pet info ──────────────────────────────────────────────────────────
        const pet = this.gameScene.pet;
        this.petHpGfx.clear();
        if (pet) {
            const eHp = pet.effectiveMaxHp, eAtk = pet.effectiveAttack, eDef = pet.effectiveDef;
            const defStr = eDef > 0 ? ` DEF:${eDef}` : '';
            const pLabel = pet.alive ? `${pet.petName} HP:${pet.hp}/${eHp} ATK:${eAtk}${defStr}` : `${pet.petName} (falt)`;
            this.petText.setText(pLabel);
            this.petText.setVisible(true);
            if (pet.alive) {
                const phx = this.petText.x + this.petText.width + 6;
                const phy = this.petText.y + 3;
                const phw = 40;
                const pFrac = pet.hp / eHp;
                this.petHpGfx.fillStyle(0x442233);
                this.petHpGfx.fillRect(phx, phy, phw, 6);
                this.petHpGfx.fillStyle(0xff88aa);
                this.petHpGfx.fillRect(phx, phy, Math.floor(phw * pFrac), 6);
            }
        } else {
            this.petText.setVisible(false);
        }

        // ── Status effect indicators ──────────────────────────────────────────
        const effects = [];
        if (hero.poisonTurns > 0) effects.push(`☠ Gift (${hero.poisonTurns})`);
        if (hero.burnTurns > 0)   effects.push(`🔥 Brann (${hero.burnTurns})`);
        if (hero.slowTurns > 0)   effects.push(`❄ Frostbitt (${hero.slowTurns})`);
        if (hero.stunTurns > 0)   effects.push(`⚡ Lammet (${hero.stunTurns})`);
        for (const b of (hero.tempBuffs || [])) {
            const label = b.stat === 'attack' ? 'ATK' : b.stat === 'defense' ? 'DEF' : b.stat;
            const secs = Math.ceil((b.msLeft || 0) / 1000);
            effects.push(`+${b.amount} ${label} (${secs}s)`);
        }
        if (hero.techForceFieldHP > 0) effects.push(`🛡 Felt ${hero.techForceFieldHP}`);
        if (hero.techEMP && (hero.empCharges || 0) > 0) effects.push(`⚡ EMP ×${hero.empCharges} [G]`);
        if (hero.techLaserTurret && (hero.laserTurretCharges || 0) > 0) effects.push(`🔫 Turret ×${hero.laserTurretCharges} [H]`);
        if (hero.techTeleporter) effects.push(`📡 Tele [J]`);
        if (hero.techRouteCalc) effects.push(`🗺 Rute`);
        if (hero.techElementScanner) effects.push(`🔬 Skanner`);
        if (effects.length > 0) {
            this.statusText.setText(effects.join('  '));
            this.statusText.setVisible(true);
        } else {
            this.statusText.setVisible(false);
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

        // ── Touch button visibility (unlock-gated) ───────────────────────────
        if (this.touchControls) {
            this.touchControls.updateVisibility(hero);
        }
    }
}
