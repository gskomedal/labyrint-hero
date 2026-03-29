// ─── Labyrint Hero – GameScene ────────────────────────────────────────────────

class GameScene extends Phaser.Scene {
    constructor() { super({ key: 'GameScene' }); }

    init(data) {
        this.worldNum   = data.worldNum   || 1;
        this.heroStats  = data.heroStats  || null;
        this.raceId     = data.race       || 'human';
        this.heroName   = data.heroName   || 'Helt';
        this.appearance = data.appearance || null;
        this.difficulty = data.difficulty || 'normal';
        this.startBonus = data.startBonus || null;
    }

    /** Returns multipliers based on difficulty setting */
    _diffMods() {
        switch (this.difficulty) {
            case 'easy': return { hpMul: 0.65, atkMul: 0.75, trapCount: 0, xpMul: 1.20, trapDmgMul: 0.5 };
            case 'hard': return { hpMul: 1.40, atkMul: 1.25, trapCount: 3, xpMul: 0.80, trapDmgMul: 1.6 };
            default:     return { hpMul: 1.00, atkMul: 1.00, trapCount: 0, xpMul: 1.00, trapDmgMul: 1.0 };
        }
    }

    create() {
        this._dyingHandled = false;
        this._theme = getWorldTheme(this.worldNum);

        // ── Generate maze ────────────────────────────────────────────────────
        const extra = Math.min(this.worldNum - 1, 6);
        const cellW = BASE_CELL_W + extra * 2;
        const cellH = BASE_CELL_H + extra;
        this._gen   = new MazeGenerator(cellW, cellH);
        this.maze   = this._gen.generate();
        this.tileW  = this._gen.tileW;
        this.tileH  = this._gen.tileH;
        this.exitX  = this._gen.exitX;
        this.exitY  = this._gen.exitY;

        // ── Fog of war ────────────────────────────────────────────────────────
        this.fog = Array.from({ length: this.tileH }, () =>
            new Array(this.tileW).fill(FOG.DARK)
        );

        // ── Draw map (stored reference so it can be redrawn on tile changes) ──
        this.mapGfx = null;
        this._drawMap();

        // ── Hero ─────────────────────────────────────────────────────────────
        this.hero = new Hero(this, 1, 1);
        if (this.heroStats) {
            this.hero.applyStats(this.heroStats, true);
        } else {
            this.hero.applyRace(this.raceId);
            this.hero.heroName = this.heroName;
            if (this.appearance) this.hero.applyAppearance(this.appearance);
            // Apply starting bonus (new game only)
            if (this.startBonus === 'heart') {
                this.hero.maxHearts++;
                this.hero.hearts++;
            } else if (this.startBonus === 'attack') {
                this.hero.attack++;
            } else if (this.startBonus === 'vision') {
                this.hero.visionRadius += 2;
            }
            this.hero._draw();
        }

        // ── World items (chests + tools only; loot comes from monster kills) ────
        this.itemObjects = [];
        this.chests      = [];
        this._placeItems();

        // ── Monsters ─────────────────────────────────────────────────────────
        this.monsters = [];
        this.boss     = null;
        this._placeMonsters();

        // ── Fog overlay ───────────────────────────────────────────────────────
        this.fogGraphics = this.add.graphics();
        this.fogGraphics.setDepth(10);
        this._updateFog();

        // ── Camera ───────────────────────────────────────────────────────────
        this.cameras.main.setBounds(0, 0, this.tileW * TILE_SIZE, this.tileH * TILE_SIZE);
        this.cameras.main.startFollow(this.hero.graphics, true, 0.08, 0.08);
        // Offset camera follow downward so HUD (54px) doesn't obscure the hero
        this.cameras.main.setFollowOffset(0, -30);
        this.cameras.main.setZoom(ZOOM_DEFAULT);

        // ── Input ─────────────────────────────────────────────────────────────
        this.cursors      = this.input.keyboard.createCursorKeys();
        this.wasd         = this.input.keyboard.addKeys('W,A,S,D');
        this.eKey         = this.input.keyboard.addKey('E');
        this.attackKey    = this.input.keyboard.addKey('SPACE');
        this.altAtkKey    = this.input.keyboard.addKey('F');
        this.bowKey       = this.input.keyboard.addKey('R');
        this.zoomInKey    = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.PLUS);
        this.zoomOutKey   = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.MINUS);
        this.zoomInAlt    = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_ADD);
        this.zoomOutAlt   = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_SUBTRACT);
        this.useItemKey   = this.input.keyboard.addKey('Q');
        this.moveTimer    = 0;

        // Mouse wheel zoom
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
            const z  = this.cameras.main.zoom;
            const nz = deltaY < 0
                ? Math.min(ZOOM_MAX, z + ZOOM_STEP)
                : Math.max(ZOOM_MIN, z - ZOOM_STEP);
            this.cameras.main.setZoom(nz);
        });

        // ── Monster tick ──────────────────────────────────────────────────────
        this.monsterTick = 0;
        this.poisonTickTimer = 0;

        // ── Exit portal pulse ─────────────────────────────────────────────────
        this._spawnExitPortal();

        // ── Skill event listener ──────────────────────────────────────────────
        this.game.events.on('skillPicked', this._onSkillPicked, this);

        // ── HUD overlay ───────────────────────────────────────────────────────
        this.scene.launch('UIScene', { gameScene: this });

        // ── Background music ──────────────────────────────────────────────────
        Audio.init();
        Audio.startMusic(this.worldNum);

        // Resume audio on window focus
        this.sys.game.events.on('focus', () => Audio.resume());
    }

    shutdown() {
        this.game.events.off('skillPicked', this._onSkillPicked, this);
    }

    // ── Map drawing (themed per world) ───────────────────────────────────────

    _drawMap() {
        if (!this.mapGfx) {
            this.mapGfx = this.add.graphics();
            this.mapGfx.setDepth(0);
        }
        const g  = this.mapGfx;
        const th = this._theme;
        g.clear();

        for (let y = 0; y < this.tileH; y++) {
            for (let x = 0; x < this.tileW; x++) {
                const t  = this.maze[y][x];
                const px = x * TILE_SIZE, py = y * TILE_SIZE;
                const S  = TILE_SIZE;

                // ── WALL ──────────────────────────────────────────────────
                if (t === TILE.WALL) {
                    g.fillStyle(th.WALL);
                    g.fillRect(px, py, S, S);
                    // Highlight top edge
                    g.fillStyle(th.WALL_TOP);
                    g.fillRect(px, py, S, 3);
                    // Subtle mid-tone bevel
                    g.fillStyle(th.WALL_MID, 0.5);
                    g.fillRect(px, py + 3, S, 2);
                    // Theme-specific wall decorations
                    this._drawWallDeco(g, th, px, py, S, x, y);

                // ── SECRET PASSAGE ────────────────────────────────────────
                } else if (t === TILE.SECRET) {
                    g.fillStyle(th.WALL);
                    g.fillRect(px, py, S, S);
                    g.fillStyle(th.WALL_TOP);
                    g.fillRect(px, py, S, 3);
                    g.fillStyle(th.WALL_MID, 0.5);
                    g.fillRect(px, py + 3, S, 2);
                    // Very faint hairline cracks (secret!)
                    g.lineStyle(1, th.SECRET_COLOR, 0.85);
                    g.lineBetween(px + 8,  py + 7,  px + 10, py + 20);
                    g.lineBetween(px + 20, py + 9,  px + 22, py + 24);
                    g.lineBetween(px + 14, py + 4,  px + 15, py + 16);

                // ── CRACKED WALL ──────────────────────────────────────────
                } else if (t === TILE.CRACKED_WALL) {
                    g.fillStyle(th.CRACKED_WALL);
                    g.fillRect(px, py, S, S);
                    g.fillStyle(th.WALL_TOP);
                    g.fillRect(px, py, S, 3);
                    // Bold crack lines
                    g.lineStyle(2, th.CRACKED_LINE, 1.0);
                    g.lineBetween(px + 5,  py + 5,  px + 9,  py + 22);
                    g.lineBetween(px + 9,  py + 14, px + 16, py + 19);
                    g.lineBetween(px + 19, py + 7,  px + 26, py + 27);
                    g.lineStyle(1, th.CRACKED_LINE, 0.55);
                    g.lineBetween(px + 13, py + 3,  px + 15, py + 13);
                    g.lineBetween(px + 22, py + 18, px + 28, py + 25);
                    // Pickaxe hint (tiny ×)
                    g.lineStyle(1, th.ACCENT, 0.4);
                    g.lineBetween(px + 24, py + 4, px + 28, py + 8);
                    g.lineBetween(px + 28, py + 4, px + 24, py + 8);

                // ── LOCKED DOOR ───────────────────────────────────────────
                } else if (t === TILE.DOOR) {
                    const floorCol = (x + y) % 2 === 0 ? th.FLOOR_A : th.FLOOR_B;
                    g.fillStyle(floorCol);
                    g.fillRect(px, py, S, S);
                    // Door frame (theme-coloured)
                    g.fillStyle(th.DOOR_FRAME, 0.9);
                    g.fillRect(px + 3, py + 2, S - 6, S - 4);
                    // Door body
                    g.fillStyle(th.DOOR, 0.95);
                    g.fillRect(px + 5, py + 4, S - 10, S - 8);
                    // Panels (darker overlay)
                    const dp = Phaser.Display.Color.IntegerToColor(th.DOOR);
                    g.fillStyle(th.WALL_MID, 0.45);
                    g.fillRect(px + 7,  py + 6,  8, 9);
                    g.fillRect(px + 17, py + 6,  8, 9);
                    g.fillRect(px + 7,  py + 17, 8, 9);
                    g.fillRect(px + 17, py + 17, 8, 9);
                    // Lock
                    g.fillStyle(th.DOOR_FRAME);
                    g.fillCircle(px + S / 2, py + S / 2, 3);
                    g.fillStyle(0x110800);
                    g.fillCircle(px + S / 2, py + S / 2, 1);
                    // Key icon hint (top-right corner)
                    g.fillStyle(th.DOOR_FRAME, 0.65);
                    g.fillRect(px + 25, py + 4, 5, 2);
                    g.fillCircle(px + 28, py + 5, 2);

                // ── HIDDEN TRAP (looks like floor – spikes revealed on trigger) ──
                } else if (t === TILE.TRAP) {
                    const col = (x + y) % 2 === 0 ? th.FLOOR_A : th.FLOOR_B;
                    g.fillStyle(col);
                    g.fillRect(px, py, S, S);
                    // Very faint danger hint visible only at close range
                    g.fillStyle(0x8a3300, 0.08);
                    g.fillRect(px + 4, py + 4, S - 8, S - 8);

                // ── FLOOR ─────────────────────────────────────────────────
                } else if (t === TILE.FLOOR) {
                    const col = (x + y) % 2 === 0 ? th.FLOOR_A : th.FLOOR_B;
                    g.fillStyle(col);
                    g.fillRect(px, py, S, S);
                    this._drawFloorDeco(g, th, px, py, S, x, y);

                // ── EXIT ──────────────────────────────────────────────────
                } else if (t === TILE.EXIT) {
                    g.fillStyle(th.FLOOR_A);
                    g.fillRect(px, py, S, S);
                    // Portal glow rings
                    g.fillStyle(COLORS.EXIT, 0.18);
                    g.fillCircle(px + S/2, py + S/2, S/2 - 1);
                    g.fillStyle(COLORS.EXIT, 0.55);
                    g.fillCircle(px + S/2, py + S/2, S/2 - 5);
                    g.fillStyle(COLORS.EXIT, 0.85);
                    g.fillCircle(px + S/2, py + S/2, S/2 - 9);
                    // Chevron / arrow symbol
                    g.fillStyle(0x003322);
                    g.fillTriangle(
                        px + S/2,     py + 8,
                        px + S - 8,   py + S - 7,
                        px + 8,       py + S - 7
                    );
                    // Inner glow
                    g.fillStyle(COLORS.EXIT_GLOW, 0.3);
                    g.fillTriangle(
                        px + S/2,     py + 12,
                        px + S - 13,  py + S - 10,
                        px + 13,      py + S - 10
                    );
                }
            }
        }
    }

    // Per-theme wall decorations (subtle texture)
    _drawWallDeco(g, th, px, py, S, gx, gy) {
        const seed = (gx * 31 + gy * 17) & 0xFF; // cheap deterministic noise
        switch (th.DECO) {
            case 'forest': {
                // Leafy dots + vine hint
                if (seed < 60) {
                    g.fillStyle(th.WALL_TOP, 0.6);
                    g.fillCircle(px + 6  + (seed & 7),  py + 8 + (seed >> 4 & 7), 2);
                    g.fillCircle(px + 18 + (seed & 5),  py + 14 + (seed >> 3 & 5), 1);
                }
                if (seed > 200) {
                    // Vine tendril
                    g.lineStyle(1, th.WALL_TOP, 0.4);
                    g.lineBetween(px + 4, py, px + 4, py + S);
                }
                break;
            }
            case 'cave': {
                // Stone block lines
                g.lineStyle(1, th.WALL_MID, 0.35);
                if (gy % 2 === 0) g.lineBetween(px, py + S/2, px + S, py + S/2);
                if (gx % 2 === 0) g.lineBetween(px + S/2, py, px + S/2, py + S);
                // Moisture drip
                if (seed > 220) {
                    g.fillStyle(0x3a4a6a, 0.5);
                    g.fillRect(px + (seed & 15) + 4, py + S - 5, 2, 4);
                }
                break;
            }
            case 'ice': {
                // Crystal facets
                g.lineStyle(1, th.ACCENT, 0.2);
                g.lineBetween(px, py + S/3, px + S, py + 2*S/3);
                if (seed < 80) {
                    // Ice shard on top
                    g.fillStyle(th.ACCENT, 0.45);
                    g.fillTriangle(px + (seed & 15) + 4, py, px + (seed & 15) + 8, py, px + (seed & 15) + 6, py - 5);
                }
                break;
            }
            case 'volcanic': {
                // Lava crack glow
                if (seed > 200) {
                    g.lineStyle(1, th.CRACKED_LINE, 0.6);
                    g.lineBetween(px + (seed & 7) + 4, py, px + (seed & 7) + 2, py + S);
                }
                // Ember dot
                if (seed > 230) {
                    g.fillStyle(th.ACCENT, 0.8);
                    g.fillCircle(px + (seed & 15) + 4, py + S - 4, 1);
                }
                break;
            }
            case 'temple': {
                // Column pillar on every other tile
                if (gx % 2 === 0) {
                    g.fillStyle(th.WALL_TOP, 0.3);
                    g.fillRect(px + 3, py + 4, 5, S - 8);
                    g.fillRect(px + S - 8, py + 4, 5, S - 8);
                }
                // Hieroglyph dot
                if (seed > 200) {
                    g.fillStyle(th.ACCENT, 0.25);
                    g.fillRect(px + (seed & 7) + 8, py + (seed >> 4 & 7) + 6, 4, 3);
                }
                break;
            }
        }
    }

    // Per-theme floor decorations
    _drawFloorDeco(g, th, px, py, S, gx, gy) {
        const seed = (gx * 37 + gy * 23) & 0xFF;
        switch (th.DECO) {
            case 'forest': {
                // Grass blades
                if (seed < 40) {
                    g.lineStyle(1, th.WALL_TOP, 0.45);
                    g.lineBetween(px + 6,  py + S - 2, px + 4,  py + S - 8);
                    g.lineBetween(px + 10, py + S - 2, px + 12, py + S - 7);
                }
                // Flower
                if (seed > 230) {
                    g.fillStyle(0xffff44, 0.6);
                    g.fillCircle(px + (seed & 15) + 4, py + (seed >> 4 & 9) + 6, 2);
                }
                // Pebble
                if (seed > 200 && seed <= 230) {
                    g.fillStyle(th.WALL_MID, 0.5);
                    g.fillCircle(px + (seed & 13) + 6, py + (seed >> 3 & 11) + 5, 2);
                }
                break;
            }
            case 'cave': {
                // Pebbles
                if (seed > 210) {
                    g.fillStyle(th.WALL_MID, 0.4);
                    g.fillCircle(px + (seed & 15) + 4, py + (seed >> 4 & 13) + 4, 2);
                    g.fillCircle(px + (seed & 9) + 14,  py + (seed >> 3 & 9) + 14,  1);
                }
                break;
            }
            case 'ice': {
                // Ice floor cracks
                if (seed < 50) {
                    g.lineStyle(1, th.ACCENT, 0.2);
                    g.lineBetween(px + 2, py + S/2, px + S - 2, py + S/2 + (seed & 5) - 2);
                }
                // Frost crystal
                if (seed > 230) {
                    g.fillStyle(th.ACCENT, 0.3);
                    g.fillTriangle(px + S/2 - 2, py + S/2, px + S/2, py + S/2 - 4, px + S/2 + 2, py + S/2);
                }
                break;
            }
            case 'volcanic': {
                // Ember glow spot
                if (seed > 220) {
                    g.fillStyle(th.ACCENT, 0.35);
                    g.fillCircle(px + (seed & 13) + 5, py + (seed >> 4 & 11) + 5, 2);
                }
                // Ash crack
                if (seed > 180 && seed <= 220) {
                    g.lineStyle(1, th.CRACKED_LINE, 0.2);
                    g.lineBetween(px + 4, py + S/2, px + S - 4, py + S/2 + (seed & 3) - 1);
                }
                break;
            }
            case 'temple': {
                // Tile grid
                g.lineStyle(1, th.WALL_MID, 0.25);
                g.lineBetween(px + S/2, py,       px + S/2, py + S);
                g.lineBetween(px,       py + S/2, px + S,   py + S/2);
                // Gold inlay dot at grid intersections
                if ((gx + gy) % 4 === 0) {
                    g.fillStyle(th.ACCENT, 0.4);
                    g.fillCircle(px + S/2, py + S/2, 2);
                }
                break;
            }
        }
    }

    // ── Exit portal pulsing overlay ───────────────────────────────────────────

    _spawnExitPortal() {
        const s  = TILE_SIZE;
        const px = this.exitX * s, py = this.exitY * s;

        // Outer pulse ring (slow breathe)
        const outer = this.add.graphics().setDepth(1);
        outer.fillStyle(COLORS.EXIT, 0.12);
        outer.fillCircle(px + s / 2, py + s / 2, s / 2 - 1);
        this.tweens.add({
            targets: outer, alpha: 0.3, scaleX: 1.15, scaleY: 1.15,
            duration: 1100, ease: 'Sine.easeInOut', yoyo: true, repeat: -1
        });

        // Inner glow (faster pulse, offset phase)
        const inner = this.add.graphics().setDepth(1);
        inner.fillStyle(COLORS.EXIT_GLOW, 0.5);
        inner.fillCircle(px + s / 2, py + s / 2, s / 2 - 7);
        this.tweens.add({
            targets: inner, alpha: 0.85, scaleX: 0.88, scaleY: 0.88,
            duration: 700, ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
            delay: 300
        });
    }

    // ── Item placement: chests + tools only (loot comes from monster kills) ────

    _placeItems() {
        const gen      = this._gen;
        const eligible = gen.getFloorTiles().filter(({ x, y }) =>
            Math.abs(x - 1) + Math.abs(y - 1) > 6 &&
            !(x === this.exitX && y === this.exitY)
        );
        MazeGenerator.shuffle(eligible);

        // 1. Treasure chests (2-3 per world, prefer dead-end spots)
        const chestCount = this.worldNum <= 2 ? 2 : 3;
        this._placeChests(eligible, chestCount);

        // 2. Tools: keys for doors, pickaxes for cracked walls
        const toolStart  = chestCount; // skip chest positions
        this._placeTools(eligible, Math.min(toolStart, eligible.length));

        // 3. Hidden spike traps (scale with world: 3–8 traps; easy = none in world 1, hard = extra)
        const mods = this._diffMods();
        const baseTrapCount = this.difficulty === 'easy' && this.worldNum <= 1
            ? 0
            : Math.min(3 + Math.floor(this.worldNum * 0.8), 8);
        const trapCount = baseTrapCount + mods.trapCount;
        let trapPlaced  = 0;
        for (const t of eligible) {
            if (trapPlaced >= trapCount) break;
            // Don't overlap chests or tools
            if (this.chests.some(c => c.gridX === t.x && c.gridY === t.y)) continue;
            if (this.itemObjects.some(o => o.gridX === t.x && o.gridY === t.y)) continue;
            this.maze[t.y][t.x] = TILE.TRAP;
            trapPlaced++;
        }
        if (trapPlaced) this._drawMap();  // redraw with trap tiles
    }

    _placeChests(eligible, count) {
        // Prefer tiles with few floor neighbours (dead-ends)
        const scored = eligible.map(t => {
            let openNeighbours = 0;
            for (const [dx, dy] of [[0,-1],[0,1],[-1,0],[1,0]]) {
                const nx = t.x + dx, ny = t.y + dy;
                if (nx >= 0 && nx < this.tileW && ny >= 0 && ny < this.tileH) {
                    const tt = this.maze[ny][nx];
                    if (tt === TILE.FLOOR || tt === TILE.SECRET || tt === TILE.EXIT) openNeighbours++;
                }
            }
            return { ...t, score: openNeighbours };
        }).sort((a, b) => a.score - b.score); // fewest open neighbours first = dead-ends

        for (let i = 0; i < Math.min(count, scored.length); i++) {
            this._spawnChest(scored[i].x, scored[i].y);
        }
    }

    _spawnChest(gx, gy) {
        if (this.chests.some(c => c.gridX === gx && c.gridY === gy)) return;
        if (this.itemObjects.some(o => o.gridX === gx && o.gridY === gy)) return;

        const g  = this.add.graphics();
        g.setDepth(2);
        const px = gx * TILE_SIZE, py = gy * TILE_SIZE, s = TILE_SIZE;

        // Chest body
        g.fillStyle(0x6a3a10, 1);
        g.fillRoundedRect(px + 4, py + 10, s - 8, s - 16, 2);
        // Lid (slightly lighter, curved)
        g.fillStyle(0x8a4a18, 1);
        g.fillRoundedRect(px + 4, py + 8, s - 8, 10, 3);
        // Gold latch
        g.fillStyle(0xffcc22, 1);
        g.fillRect(px + s / 2 - 3, py + 15, 6, 5);
        g.fillCircle(px + s / 2, py + 17, 2);
        // Gold rim along lid seam
        g.fillStyle(0xaa8822, 1);
        g.fillRect(px + 4, py + 17, s - 8, 2);
        // Corner studs
        g.fillStyle(0xffcc22, 1);
        g.fillCircle(px + 7,     py + 12, 2);
        g.fillCircle(px + s - 7, py + 12, 2);
        g.fillCircle(px + 7,     py + s - 10, 2);
        g.fillCircle(px + s - 7, py + s - 10, 2);
        // Glow hint
        g.fillStyle(0xffee88, 0.12);
        g.fillRoundedRect(px + 2, py + 6, s - 4, s - 8, 3);

        this.chests.push({ gridX: gx, gridY: gy, graphic: g, opened: false });
    }

    _checkChestPickup() {
        const hx = this.hero.gridX, hy = this.hero.gridY;
        for (const chest of this.chests) {
            if (chest.opened || chest.gridX !== hx || chest.gridY !== hy) continue;
            chest.opened = true;

            // Open animation: flash + fade
            this.tweens.add({
                targets: chest.graphic, alpha: 0, duration: 400,
                onComplete: () => chest.graphic.destroy()
            });

            // Contents: 2 items; first is equipment (weapon/armor), second is consumable
            const item1 = Math.random() < 0.5
                ? randomItemByType(this.worldNum, 'weapon', new Set())
                : randomItemByType(this.worldNum, 'armor',  new Set());
            const item2 = randomItemByType(this.worldNum, 'consumable', new Set())
                || randomItemForWorld(this.worldNum);

            let givenCount = 0;
            for (const item of [item1, item2]) {
                if (!item) continue;
                if (this.hero.inventory.addItem(item)) {
                    givenCount++;
                } else {
                    // Backpack full – drop at chest position
                    this._spawnItemAt(hx, hy, item);
                }
            }
            Audio.playPickup();
            this._floatingText(hx, hy, `📦 Kiste åpnet! (${givenCount} gjenstander)`, '#ffcc44');
        }
    }

    _placeTools(eligible, startIdx) {
        const doorCount    = this._gen.countTile(TILE.DOOR);
        const crackedCount = this._gen.countTile(TILE.CRACKED_WALL);

        const keyCount  = Math.min(doorCount, 2);
        const pickCount = crackedCount > 0 ? Math.min(Math.ceil(crackedCount / 3), 2) : 0;

        let idx = startIdx;
        for (let i = 0; i < keyCount && idx < eligible.length; i++, idx++) {
            this._spawnItemAt(eligible[idx].x, eligible[idx].y, ITEM_DEFS.key);
        }
        for (let i = 0; i < pickCount && idx < eligible.length; i++, idx++) {
            this._spawnItemAt(eligible[idx].x, eligible[idx].y, ITEM_DEFS.pickaxe);
        }
    }

    _spawnItemAt(gx, gy, itemDef) {
        if (!itemDef) return;
        // Don't stack items on same tile
        if (this.itemObjects.some(o => o.gridX === gx && o.gridY === gy)) return;

        const g  = this.add.graphics();
        g.setDepth(2);
        const px = gx * TILE_SIZE, py = gy * TILE_SIZE, s = TILE_SIZE;

        g.fillStyle(itemDef.color, 0.15);
        g.fillRect(px + 2, py + 2, s - 4, s - 4);
        g.fillStyle(itemDef.color, 0.9);

        if (itemDef.id === 'key') {
            // Key: circle + stick
            g.fillCircle(px + s / 2, py + s / 2 - 4, 5);
            g.fillRect(px + s / 2 - 1, py + s / 2 + 1, 3, 9);
            g.fillRect(px + s / 2 + 2, py + s / 2 + 5, 4, 2);
            g.fillRect(px + s / 2 + 2, py + s / 2 + 8, 3, 2);
        } else if (itemDef.id === 'pickaxe') {
            // Pickaxe: handle + head
            g.fillRect(px + s / 2 - 2, py + 8, 4, s - 16);
            g.fillRoundedRect(px + 6, py + 6, s - 12, 6, 2);
            g.fillTriangle(px + 8, py + 12, px + 4, py + 6, px + 14, py + 10);
        } else if (itemDef.subtype === 'bow') {
            g.lineStyle(3, itemDef.color, 0.9);
            g.strokeCircle(px + s / 2, py + s / 2, s / 4);
            g.fillStyle(itemDef.color, 0.7);
            g.fillRect(px + s / 2 - 1, py + 6, 3, s - 12);
        } else if (itemDef.type === 'weapon') {
            g.fillRect(px + s / 2 - 3, py + 6, 6, s - 12);
            g.fillRect(px + 8, py + s / 2 - 3, s - 16, 6);
        } else if (itemDef.type === 'armor') {
            g.fillRoundedRect(px + 8, py + 8, s - 16, s - 16, 3);
        } else if (itemDef.type === 'tool') {
            // Generic tool
            g.fillRoundedRect(px + 6, py + 6, s - 12, s - 12, 4);
        } else {
            // Consumable: potion/scroll circle
            g.fillCircle(px + s / 2, py + s / 2, s / 4.5);
            g.fillStyle(0xffffff, 0.3);
            g.fillCircle(px + s / 2 - 3, py + s / 2 - 3, s / 10);
        }

        this.itemObjects.push({ gridX: gx, gridY: gy, item: itemDef, graphic: g });
    }

    _checkItemPickup() {
        const hx = this.hero.gridX, hy = this.hero.gridY;
        for (let i = this.itemObjects.length - 1; i >= 0; i--) {
            const obj = this.itemObjects[i];
            if (obj.gridX === hx && obj.gridY === hy) {
                if (this.hero.inventory.addItem(obj.item)) {
                    Audio.playPickup();
                    obj.graphic.destroy();
                    this.itemObjects.splice(i, 1);
                    this._floatingText(hx, hy, `+ ${obj.item.name}`, '#ffee88');
                } else {
                    this._showMessage('Ryggsekken er full! (Høyreklikk for å droppe)', '#ff8844');
                }
            }
        }
    }

    // ── Monster placement ─────────────────────────────────────────────────────

    _placeMonsters() {
        const gen = this._gen;
        const allFloor = gen.getFloorTiles().filter(({ x, y }) =>
            Math.abs(x - 1) + Math.abs(y - 1) > 8
        );
        MazeGenerator.shuffle(allFloor);

        const byExit = allFloor.slice().sort((a, b) => {
            const da = Math.abs(a.x - this.exitX) + Math.abs(a.y - this.exitY);
            const db = Math.abs(b.x - this.exitX) + Math.abs(b.y - this.exitY);
            return da - db;
        });
        const bossTile = byExit[0];
        this.boss = this._spawnMonster(bossTile.x, bossTile.y, 'boss');
        this.monsters.push(this.boss);

        const regular = allFloor.filter(t => t !== bossTile);
        const count   = 5 + this.worldNum * 2;
        const types   = this._monsterPool();
        for (let i = 0; i < Math.min(count, regular.length); i++) {
            const { x, y } = regular[i];
            this.monsters.push(this._spawnMonster(x, y, types[Math.floor(Math.random() * types.length)]));
        }

        // Apply difficulty HP/ATK multipliers to all monsters
        const mods = this._diffMods();
        for (const m of this.monsters) {
            m.maxHp  = Math.max(1, Math.round(m.maxHp  * mods.hpMul));
            m.hp     = m.maxHp;
            m.attack = Math.max(1, Math.round(m.attack * mods.atkMul));
            m._draw();
        }
    }

    _spawnMonster(gx, gy, type) { return new Monster(this, gx, gy, type); }

    _monsterPool() {
        if (this.worldNum <= 1) return ['goblin'];
        if (this.worldNum <= 2) return ['goblin', 'goblin', 'orc'];
        if (this.worldNum <= 4) return ['goblin', 'orc', 'troll'];
        return ['orc', 'troll', 'troll'];
    }

    // ── Fog of war ────────────────────────────────────────────────────────────

    _updateFog() {
        const r  = this.hero.visionRadius;
        const hx = this.hero.gridX, hy = this.hero.gridY;
        for (let y = 0; y < this.tileH; y++)
            for (let x = 0; x < this.tileW; x++)
                if (this.fog[y][x] === FOG.LIT) this.fog[y][x] = FOG.DIM;
        for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
                if (dx * dx + dy * dy <= r * r) {
                    const nx = hx + dx, ny = hy + dy;
                    if (nx >= 0 && nx < this.tileW && ny >= 0 && ny < this.tileH)
                        this.fog[ny][nx] = FOG.LIT;
                }
            }
        }
        this._drawFog();
    }

    _drawFog() {
        const g = this.fogGraphics;
        g.clear();
        for (let y = 0; y < this.tileH; y++) {
            for (let x = 0; x < this.tileW; x++) {
                const f = this.fog[y][x];
                if (f === FOG.DARK) {
                    g.fillStyle(0x000000, 1);
                    g.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                } else if (f === FOG.DIM) {
                    g.fillStyle(0x000000, 0.52);
                    g.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                }
            }
        }
    }

    // ── Game loop ─────────────────────────────────────────────────────────────

    update(time, delta) {
        if (!this.hero || !this.hero.alive) return;
        const blocked = this.scene.isActive('SkillScene') || this.scene.isActive('InventoryScene');

        if (!blocked) {
            this._handleInput(delta);
            this._handleAttack();
            this._handleBow();
            this._handleUseItem();
            this._handleZoom();

            const touchInv = this.game.registry.get('touch_inventory');
            if (touchInv) this.game.registry.set('touch_inventory', false);
            if (Phaser.Input.Keyboard.JustDown(this.eKey) || touchInv) {
                this.scene.launch('InventoryScene');
            }

            this._tickMonsters(delta);
        }

        const ui = this.scene.get('UIScene');
        if (ui && ui.sys.isActive()) ui.refresh();
    }

    // ── Input / hero movement ─────────────────────────────────────────────────

    _handleInput(delta) {
        this.moveTimer -= delta;
        if (this.moveTimer > 0) return;
        let dx = 0, dy = 0;
        if      (this.cursors.left.isDown  || this.wasd.A.isDown) dx = -1;
        else if (this.cursors.right.isDown || this.wasd.D.isDown) dx =  1;
        else if (this.cursors.up.isDown    || this.wasd.W.isDown) dy = -1;
        else if (this.cursors.down.isDown  || this.wasd.S.isDown) dy =  1;

        // Touch d-pad fallback
        if (dx === 0 && dy === 0) {
            dx = this.game.registry.get('touch_dx') || 0;
            dy = this.game.registry.get('touch_dy') || 0;
        }

        if (dx !== 0 || dy !== 0) {
            this._tryMoveHero(dx, dy);
            this.moveTimer = MOVE_DELAY_MS;
        }
    }

    _tryMoveHero(dx, dy) {
        // Always update facing direction, even when movement is blocked
        this.hero.facing = { dx, dy };

        const nx = this.hero.gridX + dx, ny = this.hero.gridY + dy;
        if (nx < 0 || nx >= this.tileW || ny < 0 || ny >= this.tileH) return;

        const tile = this.maze[ny][nx];

        // Hard walls and cracked walls block movement
        if (tile === TILE.WALL || tile === TILE.CRACKED_WALL) return;

        // Spike trap – triggers once then becomes floor
        if (tile === TILE.TRAP) {
            this.maze[ny][nx] = TILE.FLOOR;
            this._drawMap();
            this.hero.moveTo(nx, ny);
            this._updateFog();
            this._checkItemPickup();
            this._checkChestPickup();
            const trapDmg = Math.round((2 + Math.floor(this.worldNum / 2)) * this._diffMods().trapDmgMul);
            const died = this.hero.takeDamage(trapDmg);
            Audio.playHurt();
            this.cameras.main.shake(80, 0.006);
            this._floatingText(nx, ny, `⚠ Felle! -${trapDmg}`, '#ff6600');
            if (died) this._heroDied();
            return;
        }

        // Locked door – auto-use key if available
        if (tile === TILE.DOOR) {
            const keyIdx = this._findItemInBackpack('key');
            if (keyIdx === -1) {
                this._showMessage('Låst dør! Du trenger en nøkkel 🔑', '#ffcc00');
                return;
            }
            Audio.playDoor();
            this.hero.inventory.backpack[keyIdx] = null;
            this.maze[ny][nx] = TILE.FLOOR;
            this._drawMap();
            this.cameras.main.shake(50, 0.003);
            this._floatingText(nx, ny, '🔑 Åpnet!', '#ffcc00');
        }

        // Update facing direction
        this.hero.facing = { dx, dy };

        // Monster blocking? Face it, show bump (use SPACE/F to attack)
        const target = this._monsterAt(nx, ny);
        if (target) {
            this._bumpEffect(target);
            return;
        }

        this.hero.moveTo(nx, ny);
        this._updateFog();
        this._checkItemPickup();
        this._checkChestPickup();
        if (this.maze[ny][nx] === TILE.EXIT) this._checkExit();
    }

    // ── Button-press Attack (SPACE / F) ───────────────────────────────────────

    _handleAttack() {
        const spaceDown = Phaser.Input.Keyboard.JustDown(this.attackKey);
        const fDown     = Phaser.Input.Keyboard.JustDown(this.altAtkKey);
        const touchAtk  = this.game.registry.get('touch_attack');
        if (touchAtk) this.game.registry.set('touch_attack', false);
        if (!spaceDown && !fDown && !touchAtk) return;

        const { dx, dy } = this.hero.facing;
        const fx = this.hero.gridX + dx, fy = this.hero.gridY + dy;

        // 1. Attack monster in facing direction first
        if (fx >= 0 && fx < this.tileW && fy >= 0 && fy < this.tileH) {
            const facingM = this._monsterAt(fx, fy);
            if (facingM) { this._heroAttack(facingM); return; }

            // 2. Break cracked wall with pickaxe
            if (this.maze[fy][fx] === TILE.CRACKED_WALL) {
                const pickIdx = this._findItemInBackpack('pickaxe');
                if (pickIdx !== -1) {
                    Audio.playBreak();
                    this.hero.inventory.backpack[pickIdx] = null;
                    this.maze[fy][fx] = TILE.FLOOR;
                    this._drawMap();
                    this.cameras.main.shake(100, 0.006);
                    this._floatingText(fx, fy, '💥 Brøt!', '#cc9944');
                    this._updateFog();
                    return;
                }
                this._showMessage('Trenger hakke for å bryte veggen!', '#cc9944');
                return;
            }
        }

        // 3. Attack any adjacent monster
        for (const [adx, ady] of [[0,-1],[0,1],[-1,0],[1,0]]) {
            const ax = this.hero.gridX + adx, ay = this.hero.gridY + ady;
            const m  = this._monsterAt(ax, ay);
            if (m) { this._heroAttack(m); return; }
        }

        // No target – swing animation
        this.cameras.main.shake(30, 0.002);
    }

    // ── Bow / Ranged Attack (R) ────────────────────────────────────────────────

    _handleBow() {
        const touchBow = this.game.registry.get('touch_bow');
        if (touchBow) this.game.registry.set('touch_bow', false);
        if (!Phaser.Input.Keyboard.JustDown(this.bowKey) && !touchBow) return;
        const weapon = this.hero.inventory.equipped.weapon;
        if (!weapon || weapon.subtype !== 'bow') {
            this._showMessage('Ingen bue utstyrt! (trykk E for inventar)', '#ff8844');
            return;
        }
        const { dx, dy } = this.hero.facing;
        if (dx === 0 && dy === 0) return;
        this._shootArrow(dx, dy, weapon.atk || 3);
    }

    // ── Quick-Use Item (Q key / touch USE button) ──────────────────────────

    _handleUseItem() {
        const touchUse = this.game.registry.get('touch_use');
        if (touchUse) this.game.registry.set('touch_use', false);
        if (!Phaser.Input.Keyboard.JustDown(this.useItemKey) && !touchUse) return;

        // Find first consumable in backpack
        const bp = this.hero.inventory.backpack;
        const idx = bp.findIndex(item => item && item.type === 'consumable');
        if (idx === -1) {
            this._showMessage('Ingen bruksgjenstander i ryggsekken!', '#ff8844');
            return;
        }
        const item = bp[idx];
        const consumed = item.use(this.hero, this);
        if (consumed) {
            bp[idx] = null;
            Audio.playPickup();
            this._floatingText(this.hero.gridX, this.hero.gridY, `✦ ${item.name}`, '#44ccff');
        }
    }

    _shootArrow(dx, dy, damage) {
        Audio.playArrow();
        let ax = this.hero.gridX + dx, ay = this.hero.gridY + dy;
        let hitMonster = null;
        let endX = this.hero.gridX, endY = this.hero.gridY;

        while (ax >= 0 && ax < this.tileW && ay >= 0 && ay < this.tileH) {
            const t = this.maze[ay][ax];
            if (t === TILE.WALL || t === TILE.CRACKED_WALL || t === TILE.DOOR) break;
            endX = ax; endY = ay;
            const m = this._monsterAt(ax, ay);
            if (m) { hitMonster = m; break; }
            ax += dx; ay += dy;
        }

        const arrowG = this.add.graphics();
        arrowG.fillStyle(COLORS.ARROW, 1);
        if (dx !== 0) {
            arrowG.fillRect(-5, -1, 10, 3);
            arrowG.fillStyle(0xff9900, 0.8);
            arrowG.fillTriangle(dx * 5, 0, dx * 2, -3, dx * 2, 3);
        } else {
            arrowG.fillRect(-1, -5, 3, 10);
            arrowG.fillStyle(0xff9900, 0.8);
            arrowG.fillTriangle(0, dy * 5, -3, dy * 2, 3, dy * 2);
        }
        arrowG.setDepth(15);
        arrowG.x = this.hero.gridX * TILE_SIZE + TILE_SIZE / 2;
        arrowG.y = this.hero.gridY * TILE_SIZE + TILE_SIZE / 2;

        const dist = Math.abs(endX - this.hero.gridX) + Math.abs(endY - this.hero.gridY);
        this.tweens.add({
            targets:  arrowG,
            x:        endX * TILE_SIZE + TILE_SIZE / 2,
            y:        endY * TILE_SIZE + TILE_SIZE / 2,
            duration: Math.max(80, dist * 50),
            ease:     'Linear',
            onComplete: () => {
                arrowG.destroy();
                if (hitMonster && hitMonster.alive) {
                    const arrowResult = hitMonster.takeDamage(damage);
                    this._floatingText(hitMonster.gridX, hitMonster.gridY, `↓${damage}`, '#ffee55');
                    this.cameras.main.shake(50, 0.003);
                    if (arrowResult === 'enraged') this._onBossEnraged(hitMonster);
                    else if (arrowResult === true)  this._onMonsterKilled(hitMonster);
                }
            }
        });
    }

    // ── Zoom ──────────────────────────────────────────────────────────────────

    _handleZoom() {
        const plus  = Phaser.Input.Keyboard.JustDown(this.zoomInKey)  ||
                      Phaser.Input.Keyboard.JustDown(this.zoomInAlt);
        const minus = Phaser.Input.Keyboard.JustDown(this.zoomOutKey) ||
                      Phaser.Input.Keyboard.JustDown(this.zoomOutAlt);
        const z = this.cameras.main.zoom;
        if (plus)  this.cameras.main.setZoom(Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)));
        if (minus) this.cameras.main.setZoom(Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)));
    }

    // ── Combat ────────────────────────────────────────────────────────────────

    _heroAttack(monster) {
        let dmg  = this.hero.attack + Math.floor(Math.random() * 3);
        const crit = this.hero.critChance > 0 && Math.random() < this.hero.critChance;
        if (crit) dmg *= 2;

        // Hero lunge toward monster then snap back
        const lx = this.hero.graphics.x + Math.sign(monster.gridX - this.hero.gridX) * 9;
        const ly = this.hero.graphics.y + Math.sign(monster.gridY - this.hero.gridY) * 9;
        this.tweens.killTweensOf(this.hero.graphics);
        this.tweens.add({
            targets: this.hero.graphics, x: lx, y: ly,
            duration: 55, ease: 'Sine.easeOut', yoyo: true
        });

        Audio.playAttack();
        const result = monster.takeDamage(dmg);
        this._floatingText(monster.gridX, monster.gridY,
            crit ? `KRIT! ${dmg}` : `-${dmg}`,
            crit ? '#ffee00' : '#ff4444', crit);
        this._hitSparks(monster.gridX, monster.gridY, crit ? 0xffee00 : 0xff4400);
        this.cameras.main.shake(crit ? 100 : 70, crit ? 0.006 : 0.004);

        // Boss phase 2 transition
        if (result === 'enraged') {
            this._onBossEnraged(monster);
        } else if (result === true) {
            this._onMonsterKilled(monster);
        }
    }

    _onBossEnraged(boss) {
        // Dramatic phase 2 transition
        Audio.playBossStrike();
        this.cameras.main.shake(200, 0.012);
        this.cameras.main.flash(300, 180, 20, 0, false);
        this._showMessage('⚡ BOSS RASENDE! Angrep +40%!', '#ff6600');
        // Pulse the boss sprite
        this.tweens.add({
            targets:  boss.graphics,
            scaleX:   1.15, scaleY: 1.15,
            duration: 180, yoyo: true, repeat: 2,
            ease:     'Sine.easeInOut'
        });
    }

    _onMonsterKilled(monster) {
        const xp      = Math.round(monster.xpReward * this._diffMods().xpMul);
        const leveled = this.hero.gainXP(xp);
        this.monsters = this.monsters.filter(m => m !== monster);
        if (monster.type === 'boss') {
            // Boss always drops a guaranteed item from a higher tier
            const bossItem = randomItemForWorld(Math.min(this.worldNum + 1, 7));
            if (bossItem) this._spawnItemAt(monster.gridX, monster.gridY, bossItem);
        } else if (Math.random() < 0.25) {
            // Favor consumables over equipment (70% consumable, 30% any)
            const item = Math.random() < 0.7
                ? randomItemByType(this.worldNum, 'consumable', new Set())
                  || randomItemForWorld(this.worldNum)
                : randomItemForWorld(this.worldNum);
            this._spawnItemAt(monster.gridX, monster.gridY, item);
        }
        if (leveled) this._onLevelUp();
    }

    _monsterAttack(monster) {
        const dmg = monster.attack + (Math.random() < 0.3 ? 1 : 0);
        const died = this.hero.takeDamage(dmg);

        Audio.playHurt();
        this._floatingText(this.hero.gridX, this.hero.gridY, `-${dmg}`, '#ffaa00');

        // Orc/Troll have a chance to inflict poison
        if (!died && (monster.type === 'orc' || monster.type === 'troll')) {
            const poisonChance = monster.type === 'troll' ? 0.30 : 0.20;
            if (Math.random() < poisonChance) {
                this.hero.applyPoison(4);
                this._floatingText(this.hero.gridX, this.hero.gridY, '☠ Forgiftet!', '#44ee66');
            }
        }

        if (died || !this.hero.alive) {
            this.cameras.main.shake(120, 0.008);
            this._heroDied();
        } else {
            this.cameras.main.shake(100, 0.006);
        }
    }

    // ── Bump effect ───────────────────────────────────────────────────────────

    _bumpEffect(monster) {
        this.tweens.add({
            targets:  monster.graphics,
            alpha:    0.3, duration: 60, yoyo: true, repeat: 1,
            onComplete: () => { if (monster.graphics) monster.graphics.setAlpha(1); }
        });
        this._floatingText(monster.gridX, monster.gridY, '!', '#ff8844');
    }

    // ── Monster AI ────────────────────────────────────────────────────────────

    _tickMonsters(delta) {
        this.monsterTick += delta;

        // Poison ticks on its own slower timer (every ~900ms instead of every monster tick)
        if (this.hero.poisonTurns > 0) {
            this.poisonTickTimer += delta;
            if (this.poisonTickTimer >= 900) {
                this.poisonTickTimer = 0;
                this.hero.poisonTurns--;
                const died = this.hero.takeDamage(1);
                this._floatingText(this.hero.gridX, this.hero.gridY, '☠ -1', '#44ee66');
                this.hero._drawSprite();
                if (died) { this._heroDied(); return; }
            }
        } else {
            this.poisonTickTimer = 0;
        }

        if (this.monsterTick < MONSTER_TICK_MS) return;
        this.monsterTick = 0;

        for (const m of [...this.monsters]) {
            if (!m.alive) continue;
            this._moveMonster(m);
        }
    }

    _moveMonster(m) {
        if (!this.hero.alive) return;
        const hx = this.hero.gridX, hy = this.hero.gridY;
        const dist = Math.abs(hx - m.gridX) + Math.abs(hy - m.gridY);
        if (dist > AGGRO_RADIUS || this.fog[m.gridY][m.gridX] === FOG.DARK) return;
        if (dist === 1) {
            this._monsterAttack(m);
            // Phase 2 boss attacks a second time each tick!
            if (m.type === 'boss' && m.phase === 2 && this.hero.alive) {
                this._monsterAttack(m);
            }
            return;
        }

        const ddx = hx - m.gridX, ddy = hy - m.gridY;
        const dirs = Math.abs(ddx) >= Math.abs(ddy)
            ? [[Math.sign(ddx), 0], [0, Math.sign(ddy)], [0, -Math.sign(ddy)], [-Math.sign(ddx), 0]]
            : [[0, Math.sign(ddy)], [Math.sign(ddx), 0], [-Math.sign(ddx), 0], [0, -Math.sign(ddy)]];

        for (const [dx, dy] of dirs) {
            const nx = m.gridX + dx, ny = m.gridY + dy;
            if (nx < 0 || nx >= this.tileW || ny < 0 || ny >= this.tileH) continue;
            const t = this.maze[ny][nx];
            // Monsters walk on FLOOR, EXIT, SECRET, TRAP – not WALL, CRACKED_WALL, DOOR
            if (t === TILE.WALL || t === TILE.CRACKED_WALL || t === TILE.DOOR) continue;
            if (nx === hx && ny === hy) continue;
            if (this._monsterAt(nx, ny)) continue;
            m.moveTo(nx, ny); break;
        }
    }

    _monsterAt(gx, gy) {
        return this.monsters.find(m => m.alive && m.gridX === gx && m.gridY === gy);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    _findItemInBackpack(id) {
        return this.hero.inventory.backpack.findIndex(item => item && item.id === id);
    }

    // ── Level up ──────────────────────────────────────────────────────────────

    _onLevelUp() {
        Audio.playLevelUp();
        // Check there's at least one pickable skill before opening the tree
        const available = getAvailableSkills(this.hero);
        if (available.length === 0) return;
        this.scene.launch('SkillScene', { heroRef: this.hero });
    }

    _onSkillPicked(skill) {
        this._floatingText(this.hero.gridX, this.hero.gridY, `${skill.name}!`, '#f5e642');
        const ui = this.scene.get('UIScene');
        if (ui && ui.sys.isActive()) ui.refresh();
    }

    // ── World progression ─────────────────────────────────────────────────────

    _checkExit() {
        if (this.boss && this.boss.alive) {
            this._showMessage('Beseir bossen først!', '#ff4466');
            return;
        }
        Audio.playExit();
        this._stopOverlayScenes();
        SaveManager.save(this.worldNum + 1, this.hero.getStats());
        this.time.delayedCall(300, () => {
            this.scene.start('GameOverScene', {
                type: 'worldComplete', worldNum: this.worldNum,
                heroStats: this.hero.getStats(), difficulty: this.difficulty
            });
        });
    }

    _heroDied() {
        if (this._dyingHandled) return;
        this._dyingHandled = true;
        this.hero.alive = false;
        Audio.playDeath();
        Audio.stopMusic();
        this._stopOverlayScenes();
        SaveManager.save(this.worldNum, this.hero.getStats());
        this.time.delayedCall(700, () => {
            this.scene.start('GameOverScene', {
                type: 'death', worldNum: this.worldNum,
                heroStats: this.hero.getStats(), difficulty: this.difficulty
            });
        });
    }

    _stopOverlayScenes() {
        ['SkillScene', 'InventoryScene', 'UIScene'].forEach(key => {
            if (this.scene.isActive(key) || this.scene.isVisible(key)) {
                this.scene.stop(key);
            }
        });
    }

    // ── Visual feedback ───────────────────────────────────────────────────────

    /** Floating damage/status text with scale-pop entry */
    _floatingText(gx, gy, msg, color, big = false) {
        const t = this.add.text(
            gx * TILE_SIZE + TILE_SIZE / 2,
            gy * TILE_SIZE - 2,
            msg, {
                fontSize: big ? '18px' : '13px',
                color, fontFamily: 'monospace',
                stroke: '#000000', strokeThickness: 3
            }
        ).setDepth(20).setOrigin(0.5, 1).setScale(0.4);

        // Pop in
        this.tweens.add({
            targets: t, scaleX: big ? 1.3 : 1.1, scaleY: big ? 1.3 : 1.1,
            duration: 70, ease: 'Back.easeOut',
            onComplete: () => {
                // Rise and fade
                this.tweens.add({
                    targets: t, y: t.y - 42, alpha: 0,
                    duration: 850, ease: 'Sine.easeIn',
                    onComplete: () => t.destroy()
                });
            }
        });
    }

    /** Burst of small colored sparks at a world-tile position */
    _hitSparks(gx, gy, color = 0xff4400) {
        const cx = gx * TILE_SIZE + TILE_SIZE / 2;
        const cy = gy * TILE_SIZE + TILE_SIZE / 2;
        const count = 6;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.8;
            const dist  = 8 + Math.random() * 12;
            const spark = this.add.graphics().setDepth(18);
            spark.fillStyle(color);
            spark.fillRect(-2, -2, 4, 4);
            spark.x = cx;
            spark.y = cy;
            this.tweens.add({
                targets: spark,
                x: cx + Math.cos(angle) * dist,
                y: cy + Math.sin(angle) * dist,
                alpha: 0, scaleX: 0.1, scaleY: 0.1,
                duration: 220 + Math.random() * 120,
                ease: 'Sine.easeOut',
                onComplete: () => { if (spark.scene) spark.destroy(); }
            });
        }
    }

    _showMessage(text, color = '#ffffff') {
        const t = this.add.text(
            this.hero.gridX * TILE_SIZE - 40, this.hero.gridY * TILE_SIZE - 36, text,
            { fontSize: '13px', color, fontFamily: 'monospace',
              stroke: '#000000', strokeThickness: 3 }
        ).setDepth(20);
        this.tweens.add({ targets: t, y: t.y - 24, alpha: 0, duration: 1800,
            onComplete: () => t.destroy() });
    }
}
