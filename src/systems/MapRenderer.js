// ─── Labyrint Hero – MapRenderer ─────────────────────────────────────────────
// Handles maze tile drawing, wall/floor decorations, fog of war, and exit portal.

class MapRenderer {
    constructor(scene) {
        this.scene = scene;
    }

    // ── Map drawing (themed per world) ───────────────────────────────────────

    /** True if tile type is wall-like (solid, opaque, raised) */
    _isWallLike(t) {
        return t === TILE.WALL || t === TILE.SECRET || t === TILE.CRACKED_WALL;
    }

    /** True if tile type is floor-like (walkable, lower than walls) */
    _isFloorLike(t) {
        return t === TILE.FLOOR || t === TILE.EXIT || t === TILE.DOOR || t === TILE.TRAP;
    }

    drawMap() {
        const scene = this.scene;
        if (!scene.mapGfx) {
            scene.mapGfx = scene.add.graphics();
            scene.mapGfx.setDepth(0);
        }
        const g  = scene.mapGfx;
        const th = scene._theme;
        const FH = typeof WALL_FACE_H !== 'undefined' ? WALL_FACE_H : 12;
        g.clear();

        // ── Pass 1: Draw all tiles (wall tops, floors, doors, etc.) ──────────
        for (let y = 0; y < scene.tileH; y++) {
            for (let x = 0; x < scene.tileW; x++) {
                const t  = scene.maze[y][x];
                const px = x * TILE_SIZE, py = y * TILE_SIZE;
                const S  = TILE_SIZE;

                // ── WALL (top-down view = the wall's top surface) ────────
                if (t === TILE.WALL) {
                    g.fillStyle(th.WALL);
                    g.fillRect(px, py, S, S);
                    // Brick pattern
                    g.lineStyle(1, th.WALL_MID, 0.3);
                    g.lineBetween(px, py + S / 3, px + S, py + S / 3);
                    g.lineBetween(px, py + 2 * S / 3, px + S, py + 2 * S / 3);
                    const vOff = (y % 2 === 0) ? S / 2 : 0;
                    g.lineBetween(px + (S / 4 + vOff) % S, py, px + (S / 4 + vOff) % S, py + S / 3);
                    g.lineBetween(px + (3 * S / 4 + vOff) % S, py + S / 3, px + (3 * S / 4 + vOff) % S, py + 2 * S / 3);
                    g.lineBetween(px + (S / 4 + vOff) % S, py + 2 * S / 3, px + (S / 4 + vOff) % S, py + S);
                    // Top highlight
                    g.fillStyle(th.WALL_TOP);
                    g.fillRect(px, py, S, 3);
                    g.fillStyle(th.WALL_MID, 0.5);
                    g.fillRect(px, py + 3, S, 2);
                    // Subtle texture variation
                    const wseed = (x * 31 + y * 17) & 0xFF;
                    if (wseed < 80) {
                        g.fillStyle(th.WALL_TOP, 0.12);
                        g.fillRect(px + 2, py + 2, S / 2 - 2, S / 3 - 2);
                    } else if (wseed > 200) {
                        g.fillStyle(th.WALL_MID, 0.18);
                        g.fillRect(px + S / 2, py + S / 3 + 1, S / 2 - 2, S / 3 - 2);
                    }
                    this._drawWallDeco(g, th, px, py, S, x, y);

                // ── SECRET PASSAGE ────────────────────────────────────────
                } else if (t === TILE.SECRET) {
                    g.fillStyle(th.WALL);
                    g.fillRect(px, py, S, S);
                    g.fillStyle(th.WALL_TOP);
                    g.fillRect(px, py, S, 3);
                    g.fillStyle(th.WALL_MID, 0.5);
                    g.fillRect(px, py + 3, S, 2);
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
                    g.lineStyle(2, th.CRACKED_LINE, 1.0);
                    g.lineBetween(px + 5,  py + 5,  px + 9,  py + 22);
                    g.lineBetween(px + 9,  py + 14, px + 16, py + 19);
                    g.lineBetween(px + 19, py + 7,  px + 26, py + 27);
                    g.lineStyle(1, th.CRACKED_LINE, 0.55);
                    g.lineBetween(px + 13, py + 3,  px + 15, py + 13);
                    g.lineBetween(px + 22, py + 18, px + 28, py + 25);
                    g.lineStyle(1, th.ACCENT, 0.4);
                    g.lineBetween(px + 24, py + 4, px + 28, py + 8);
                    g.lineBetween(px + 28, py + 4, px + 24, py + 8);

                // ── LOCKED DOOR ───────────────────────────────────────────
                } else if (t === TILE.DOOR) {
                    const floorCol = (x + y) % 2 === 0 ? th.FLOOR_A : th.FLOOR_B;
                    g.fillStyle(floorCol);
                    g.fillRect(px, py, S, S);
                    g.fillStyle(th.DOOR_FRAME, 0.9);
                    g.fillRect(px + 3, py + 2, S - 6, S - 4);
                    g.fillStyle(th.DOOR, 0.95);
                    g.fillRect(px + 5, py + 4, S - 10, S - 8);
                    const dp = Phaser.Display.Color.IntegerToColor(th.DOOR);
                    g.fillStyle(th.WALL_MID, 0.45);
                    g.fillRect(px + 7,  py + 6,  8, 9);
                    g.fillRect(px + 17, py + 6,  8, 9);
                    g.fillRect(px + 7,  py + 17, 8, 9);
                    g.fillRect(px + 17, py + 17, 8, 9);
                    g.fillStyle(th.DOOR_FRAME);
                    g.fillCircle(px + S / 2, py + S / 2, 3);
                    g.fillStyle(0x110800);
                    g.fillCircle(px + S / 2, py + S / 2, 1);
                    g.fillStyle(th.DOOR_FRAME, 0.65);
                    g.fillRect(px + 25, py + 4, 5, 2);
                    g.fillCircle(px + 28, py + 5, 2);

                // ── HIDDEN TRAP ───────────────────────────────────────────
                } else if (t === TILE.TRAP) {
                    const col = (x + y) % 2 === 0 ? th.FLOOR_A : th.FLOOR_B;
                    g.fillStyle(col);
                    g.fillRect(px, py, S, S);
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
                    g.fillStyle(COLORS.EXIT, 0.18);
                    g.fillCircle(px + S/2, py + S/2, S/2 - 1);
                    g.fillStyle(COLORS.EXIT, 0.55);
                    g.fillCircle(px + S/2, py + S/2, S/2 - 5);
                    g.fillStyle(COLORS.EXIT, 0.85);
                    g.fillCircle(px + S/2, py + S/2, S/2 - 9);
                    g.fillStyle(0x003322);
                    g.fillTriangle(
                        px + S/2,     py + 8,
                        px + S - 8,   py + S - 7,
                        px + 8,       py + S - 7
                    );
                    g.fillStyle(COLORS.EXIT_GLOW, 0.3);
                    g.fillTriangle(
                        px + S/2,     py + 12,
                        px + S - 13,  py + S - 10,
                        px + 13,      py + S - 10
                    );
                }
            }
        }

        // ── Pass 2: Draw 3D wall faces on floor tiles adjacent to walls ──────
        // When a wall is directly above a floor-like tile, draw the wall's
        // visible south face extending down into the floor tile. This creates
        // the illusion that walls are raised 3D blocks.
        const wallFace = th.WALL_FACE || th.WALL_MID;
        for (let y = 0; y < scene.tileH; y++) {
            for (let x = 0; x < scene.tileW; x++) {
                const t  = scene.maze[y][x];
                if (!this._isFloorLike(t)) continue;

                const px = x * TILE_SIZE, py = y * TILE_SIZE;
                const S  = TILE_SIZE;

                // ── South face: wall directly ABOVE this floor ────────────
                if (y > 0 && this._isWallLike(scene.maze[y - 1][x])) {
                    // Main wall face (dark front surface)
                    g.fillStyle(wallFace);
                    g.fillRect(px, py, S, FH);
                    // Horizontal mortar lines on face (brick texture)
                    g.lineStyle(1, th.WALL_MID, 0.35);
                    g.lineBetween(px, py + Math.floor(FH * 0.4), px + S, py + Math.floor(FH * 0.4));
                    g.lineBetween(px, py + Math.floor(FH * 0.8), px + S, py + Math.floor(FH * 0.8));
                    // Vertical mortar (offset per row)
                    const vOff2 = (y % 2 === 0) ? S / 2 : 0;
                    g.lineBetween(px + (S / 3 + vOff2) % S, py, px + (S / 3 + vOff2) % S, py + Math.floor(FH * 0.4));
                    g.lineBetween(px + (2 * S / 3 + vOff2) % S, py + Math.floor(FH * 0.4), px + (2 * S / 3 + vOff2) % S, py + Math.floor(FH * 0.8));
                    // Top edge highlight (where wall top meets face)
                    g.fillStyle(th.WALL_TOP, 0.7);
                    g.fillRect(px, py, S, 2);
                    // Bottom edge – soft shadow where face meets floor
                    g.fillStyle(0x000000, 0.25);
                    g.fillRect(px, py + FH, S, 3);
                    g.fillStyle(0x000000, 0.10);
                    g.fillRect(px, py + FH + 3, S, 2);
                    // Left edge lighter (light from top-left)
                    g.fillStyle(th.WALL_TOP, 0.20);
                    g.fillRect(px, py, 2, FH);
                    // Right edge darker
                    g.fillStyle(0x000000, 0.15);
                    g.fillRect(px + S - 2, py, 2, FH);
                }

                // ── East face: wall directly to the LEFT of this floor ────
                if (x > 0 && this._isWallLike(scene.maze[y][x - 1])) {
                    const faceW = Math.floor(FH * 0.5);  // narrower side face
                    g.fillStyle(wallFace, 0.7);
                    g.fillRect(px, py, faceW, S);
                    // Horizontal line texture
                    g.lineStyle(1, th.WALL_MID, 0.25);
                    g.lineBetween(px, py + S / 3, px + faceW, py + S / 3);
                    g.lineBetween(px, py + 2 * S / 3, px + faceW, py + 2 * S / 3);
                    // Right shadow edge
                    g.fillStyle(0x000000, 0.15);
                    g.fillRect(px + faceW, py, 2, S);
                }

                // ── Corner shadow: wall above AND to the left ─────────────
                if (y > 0 && x > 0 &&
                    this._isWallLike(scene.maze[y - 1][x]) &&
                    this._isWallLike(scene.maze[y][x - 1])) {
                    // Dark corner where two wall faces meet
                    g.fillStyle(0x000000, 0.20);
                    g.fillRect(px, py, Math.floor(FH * 0.5), FH);
                }
            }
        }
    }

    // Per-theme wall decorations (subtle texture)
    _drawWallDeco(g, th, px, py, S, gx, gy) {
        const seed = (gx * 31 + gy * 17) & 0xFF;
        const seed2 = (gx * 53 + gy * 41) & 0xFF;
        switch (th.DECO) {
            case 'forest': {
                if (seed < 60) {
                    g.fillStyle(th.WALL_TOP, 0.6);
                    g.fillCircle(px + 6  + (seed & 7),  py + 8 + (seed >> 4 & 7), 2);
                    g.fillCircle(px + 18 + (seed & 5),  py + 14 + (seed >> 3 & 5), 1);
                }
                if (seed > 200) {
                    g.lineStyle(1, th.WALL_TOP, 0.4);
                    const vx = px + 4 + (seed & 3);
                    g.lineBetween(vx, py, vx, py + S);
                    g.fillStyle(th.WALL_TOP, 0.5);
                    g.fillCircle(vx + 2, py + 8, 2);
                    g.fillCircle(vx - 1, py + 20, 1);
                }
                if (seed2 > 180) {
                    g.fillStyle(th.WALL_TOP, 0.25);
                    g.fillRect(px + (seed2 & 7), py + S - 6, 6 + (seed2 & 3), 4);
                }
                break;
            }
            case 'cave': {
                g.lineStyle(1, th.WALL_MID, 0.35);
                if (gy % 2 === 0) g.lineBetween(px, py + S/2, px + S, py + S/2);
                if (gx % 2 === 0) g.lineBetween(px + S/2, py, px + S/2, py + S);
                if (seed2 < 50) {
                    g.lineStyle(1, th.WALL_MID, 0.2);
                    g.lineBetween(px + 3, py + 5, px + S - 5, py + S - 3);
                }
                if (seed > 220) {
                    g.fillStyle(0x3a4a6a, 0.5);
                    g.fillRect(px + (seed & 15) + 4, py + S - 5, 2, 4);
                    g.fillStyle(0x3a4a6a, 0.15);
                    g.fillRect(px + (seed & 15) + 4, py + S/2, 2, S/2 - 5);
                }
                if (seed2 > 210) {
                    g.fillStyle(th.WALL_TOP, 0.4);
                    g.fillTriangle(
                        px + (seed2 & 15) + 4, py + 4,
                        px + (seed2 & 15) + 7, py + 4,
                        px + (seed2 & 15) + 5, py + 10
                    );
                }
                break;
            }
            case 'ice': {
                g.lineStyle(1, th.ACCENT, 0.2);
                g.lineBetween(px, py + S/3, px + S, py + 2*S/3);
                if (seed2 < 100) {
                    g.lineStyle(1, th.ACCENT, 0.12);
                    g.lineBetween(px + S, py + S/4, px, py + 3*S/4);
                }
                if (seed < 80) {
                    g.fillStyle(th.ACCENT, 0.45);
                    g.fillTriangle(px + (seed & 15) + 4, py, px + (seed & 15) + 8, py, px + (seed & 15) + 6, py - 5);
                }
                if (seed2 > 200) {
                    g.fillStyle(0xffffff, 0.3);
                    g.fillCircle(px + (seed2 & 15) + 6, py + (seed2 >> 4 & 15) + 6, 1);
                }
                if (seed > 190 && seed <= 200) {
                    g.fillStyle(th.ACCENT, 0.35);
                    g.fillTriangle(px + 14, py + S - 2, px + 17, py + S - 2, px + 15, py + S + 3);
                }
                break;
            }
            case 'volcanic': {
                if (seed > 200) {
                    g.lineStyle(1, th.CRACKED_LINE, 0.6);
                    g.lineBetween(px + (seed & 7) + 4, py, px + (seed & 7) + 2, py + S);
                }
                if (seed > 220) {
                    g.fillStyle(th.ACCENT, 0.8);
                    g.fillCircle(px + (seed & 15) + 4, py + S - 4, 1);
                }
                if (seed2 < 40) {
                    g.fillStyle(0x000000, 0.2);
                    g.fillRect(px + (seed2 & 7) + 4, py + (seed2 >> 3 & 7) + 8, 5, 3);
                }
                if (seed2 > 220) {
                    g.fillStyle(th.CRACKED_LINE, 0.15);
                    g.fillRect(px, py + S - 3, S, 3);
                }
                break;
            }
            case 'temple': {
                if (gx % 2 === 0) {
                    g.fillStyle(th.WALL_TOP, 0.3);
                    g.fillRect(px + 3, py + 4, 5, S - 8);
                    g.fillRect(px + S - 8, py + 4, 5, S - 8);
                    g.fillStyle(th.ACCENT, 0.2);
                    g.fillRect(px + 2, py + 3, 7, 2);
                    g.fillRect(px + S - 9, py + 3, 7, 2);
                }
                if (seed > 200) {
                    g.fillStyle(th.ACCENT, 0.25);
                    g.fillRect(px + (seed & 7) + 8, py + (seed >> 4 & 7) + 6, 4, 3);
                }
                if (seed2 < 60) {
                    g.lineStyle(1, th.ACCENT, 0.15);
                    g.lineBetween(px + 10, py + S/2, px + S - 10, py + S/2);
                    g.lineBetween(px + 12, py + S/2 + 3, px + S - 12, py + S/2 + 3);
                }
                break;
            }
        }
    }

    // Per-theme floor decorations
    _drawFloorDeco(g, th, px, py, S, gx, gy) {
        const seed = (gx * 37 + gy * 23) & 0xFF;
        const seed2 = (gx * 59 + gy * 43) & 0xFF;
        switch (th.DECO) {
            case 'forest': {
                if (seed < 60) {
                    g.lineStyle(1, th.WALL_TOP, 0.45);
                    g.lineBetween(px + 6,  py + S - 2, px + 4,  py + S - 8);
                    g.lineBetween(px + 10, py + S - 2, px + 12, py + S - 7);
                    if (seed < 30) {
                        g.lineBetween(px + 22, py + S - 2, px + 20, py + S - 6);
                    }
                }
                if (seed > 230) {
                    const flowerCol = seed2 < 128 ? 0xffff44 : 0xff88cc;
                    g.fillStyle(flowerCol, 0.6);
                    g.fillCircle(px + (seed & 15) + 4, py + (seed >> 4 & 9) + 6, 2);
                    g.lineStyle(1, th.WALL_TOP, 0.3);
                    g.lineBetween(px + (seed & 15) + 4, py + (seed >> 4 & 9) + 8, px + (seed & 15) + 4, py + (seed >> 4 & 9) + 13);
                }
                if (seed > 200 && seed <= 230) {
                    g.fillStyle(th.WALL_MID, 0.5);
                    g.fillCircle(px + (seed & 13) + 6, py + (seed >> 3 & 11) + 5, 2);
                }
                if (seed2 > 230) {
                    g.fillStyle(th.WALL_MID, 0.15);
                    g.fillCircle(px + S/2, py + S/2, 4);
                }
                break;
            }
            case 'cave': {
                if (seed > 200) {
                    g.fillStyle(th.WALL_MID, 0.4);
                    g.fillCircle(px + (seed & 15) + 4, py + (seed >> 4 & 13) + 4, 2);
                    g.fillCircle(px + (seed & 9) + 14,  py + (seed >> 3 & 9) + 14,  1);
                }
                if (seed2 < 30) {
                    g.fillStyle(th.WALL_MID, 0.3);
                    g.fillCircle(px + 8, py + 12, 1);
                    g.fillCircle(px + 20, py + 8, 1);
                    g.fillCircle(px + 14, py + 22, 2);
                }
                if (seed > 150 && seed <= 170) {
                    g.lineStyle(1, th.WALL_MID, 0.2);
                    g.lineBetween(px + 2, py + (seed2 & 15) + 6, px + S - 4, py + (seed2 >> 4 & 15) + 6);
                }
                if (seed2 > 240) {
                    g.fillStyle(0x3a4a6a, 0.2);
                    g.fillCircle(px + S/2, py + S/2, 4);
                    g.fillStyle(0x5a6a8a, 0.12);
                    g.fillCircle(px + S/2 + 1, py + S/2 - 1, 2);
                }
                break;
            }
            case 'ice': {
                if (seed < 50) {
                    g.lineStyle(1, th.ACCENT, 0.2);
                    g.lineBetween(px + 2, py + S/2, px + S - 2, py + S/2 + (seed & 5) - 2);
                    if (seed < 25) {
                        g.lineBetween(px + S/2, py + S/2, px + S/2 + (seed & 3), py + 4);
                    }
                }
                if (seed > 230) {
                    g.fillStyle(th.ACCENT, 0.3);
                    g.fillTriangle(px + S/2 - 2, py + S/2, px + S/2, py + S/2 - 4, px + S/2 + 2, py + S/2);
                }
                if (seed2 > 200) {
                    g.fillStyle(0xffffff, 0.08);
                    g.fillRect(px, py, S, 2);
                    g.fillRect(px, py, 2, S);
                }
                if (seed2 < 40) {
                    g.fillStyle(0xffffff, 0.12);
                    g.fillCircle(px + (seed2 & 15) + 6, py + (seed2 >> 3 & 13) + 6, 3);
                }
                break;
            }
            case 'volcanic': {
                if (seed > 220) {
                    g.fillStyle(th.ACCENT, 0.35);
                    g.fillCircle(px + (seed & 13) + 5, py + (seed >> 4 & 11) + 5, 2);
                    g.fillStyle(th.ACCENT, 0.1);
                    g.fillCircle(px + (seed & 13) + 5, py + (seed >> 4 & 11) + 5, 5);
                }
                if (seed > 180 && seed <= 220) {
                    g.lineStyle(1, th.CRACKED_LINE, 0.2);
                    g.lineBetween(px + 4, py + S/2, px + S - 4, py + S/2 + (seed & 3) - 1);
                }
                if (seed2 < 35) {
                    g.fillStyle(0x000000, 0.15);
                    g.fillCircle(px + (seed2 & 15) + 6, py + (seed2 >> 3 & 15) + 6, 3);
                }
                if (seed2 > 245) {
                    g.fillStyle(th.CRACKED_LINE, 0.2);
                    g.fillCircle(px + S/2, py + S/2, 3);
                    g.fillStyle(th.ACCENT, 0.1);
                    g.fillCircle(px + S/2, py + S/2, 5);
                }
                break;
            }
            case 'temple': {
                g.lineStyle(1, th.WALL_MID, 0.25);
                g.lineBetween(px + S/2, py,       px + S/2, py + S);
                g.lineBetween(px,       py + S/2, px + S,   py + S/2);
                if ((gx + gy) % 4 === 0) {
                    g.fillStyle(th.ACCENT, 0.4);
                    g.fillCircle(px + S/2, py + S/2, 2);
                }
                if (seed2 < 40) {
                    g.fillStyle(th.WALL_MID, 0.15);
                    g.fillTriangle(px, py, px + 4, py, px, py + 4);
                }
                if (seed > 210 && seed <= 230) {
                    g.fillStyle(th.WALL_MID, 0.12);
                    g.fillCircle(px + (seed & 11) + 6, py + (seed >> 3 & 11) + 6, 2);
                }
                break;
            }
            case 'deep': {
                // Lava cracks and ember particles
                if (seed > 200) {
                    g.lineStyle(1, 0xff4400, 0.3);
                    g.lineBetween(px + 2, py + (seed & 15) + 4, px + S - 2, py + (seed2 & 15) + 4);
                }
                if (seed2 > 230) {
                    g.fillStyle(0xff6622, 0.4);
                    g.fillCircle(px + (seed & 11) + 6, py + (seed2 & 9) + 6, 2);
                    g.fillStyle(0xff6622, 0.1);
                    g.fillCircle(px + (seed & 11) + 6, py + (seed2 & 9) + 6, 5);
                }
                if (seed < 30) {
                    g.fillStyle(0x000000, 0.2);
                    g.fillCircle(px + S/2, py + S/2, 4);
                }
                break;
            }
            case 'underworld': {
                // Purple crystal shards and mist
                if (seed > 220) {
                    g.fillStyle(0x8844cc, 0.3);
                    g.fillTriangle(px + (seed & 7) + 6, py + 4, px + (seed & 7) + 3, py + 12, px + (seed & 7) + 9, py + 12);
                }
                if (seed2 < 40) {
                    g.fillStyle(0xaa66ff, 0.08);
                    g.fillCircle(px + S/2, py + S/2, 6);
                }
                if (seed > 150 && seed <= 170) {
                    g.fillStyle(0x6633aa, 0.15);
                    g.fillCircle(px + (seed2 & 11) + 6, py + (seed2 >> 3 & 11) + 6, 2);
                }
                break;
            }
            case 'core': {
                // Molten gold streams and heat shimmer
                if (seed > 200) {
                    g.lineStyle(1, 0xffaa00, 0.35);
                    g.lineBetween(px + (seed & 7) + 2, py + S/2, px + S - (seed2 & 7) - 2, py + S/2 + (seed & 3));
                }
                if ((gx + gy) % 3 === 0) {
                    g.fillStyle(0xffcc00, 0.15);
                    g.fillCircle(px + S/2, py + S/2, 3);
                }
                if (seed2 > 240) {
                    g.fillStyle(0xffdd44, 0.4);
                    g.fillCircle(px + (seed & 13) + 5, py + (seed2 & 11) + 5, 2);
                }
                break;
            }
        }

        // Special room decoration (Elements mod)
        const scene = this.scene;
        if (scene._gen && scene._gen.specialRooms) {
            for (const room of scene._gen.specialRooms) {
                if (!room.tiles.some(t => t.x === gx && t.y === gy)) continue;
                if (room.type === 'quarry') {
                    // Rocky debris: small brown/grey rectangles
                    g.fillStyle(0x887755, 0.35);
                    g.fillRect(px + (seed & 7) + 2, py + (seed2 & 7) + 8, 4, 3);
                    g.fillRect(px + (seed >> 2 & 7) + 14, py + (seed2 >> 2 & 7) + 4, 3, 4);
                    g.fillStyle(0x776644, 0.25);
                    g.fillCircle(px + (seed & 11) + 6, py + (seed2 & 11) + 12, 2);
                } else if (room.type === 'crystal_cave') {
                    // Sparkling crystals: small colored triangles
                    const crystCol = [0xeeeeff, 0xaa44cc, 0x44bbdd, 0x22cc44][seed & 3];
                    g.fillStyle(crystCol, 0.35);
                    g.fillTriangle(
                        px + (seed & 7) + 8, py + (seed2 & 7) + 4,
                        px + (seed & 7) + 5, py + (seed2 & 7) + 10,
                        px + (seed & 7) + 11, py + (seed2 & 7) + 10
                    );
                    g.fillStyle(0xffffff, 0.15);
                    g.fillCircle(px + (seed >> 3 & 11) + 6, py + (seed2 >> 3 & 11) + 6, 1);
                } else if (room.type === 'chem_lab') {
                    g.fillStyle(0x33dd88, 0.10);
                    g.fillCircle(px + S / 2, py + S / 2, S / 2.5);
                    g.fillStyle(0x33dd88, 0.25);
                    g.fillRoundedRect(px + (seed & 5) + 6, py + (seed2 & 5) + 8, 4, 8, 1);
                    g.fillRect(px + (seed & 5) + 5, py + (seed2 & 5) + 6, 6, 3);
                    g.fillStyle(0x66ffaa, 0.2);
                    g.fillCircle(px + (seed >> 2 & 7) + 14, py + (seed2 >> 2 & 5) + 6, 1);
                    g.fillCircle(px + (seed >> 3 & 5) + 10, py + (seed2 >> 3 & 5) + 4, 1);
                } else if (room.type === 'camp_room') {
                    // Warm campfire glow
                    g.fillStyle(0xff7722, 0.12);
                    g.fillCircle(px + S / 2, py + S / 2, S / 2.5);
                    // Anvil/furnace hint
                    g.fillStyle(0x886644, 0.3);
                    g.fillRect(px + (seed & 5) + 4, py + (seed2 & 5) + 10, 6, 4);
                    g.fillStyle(0xff4400, 0.2);
                    g.fillCircle(px + (seed & 7) + 12, py + (seed2 & 7) + 8, 2);
                } else if (room.type === 'ore_chamber') {
                    // Dense ore veins
                    g.fillStyle(0xbb9933, 0.3);
                    g.fillCircle(px + (seed & 9) + 4, py + (seed2 & 9) + 4, 3);
                    g.fillCircle(px + (seed >> 2 & 7) + 14, py + (seed2 >> 2 & 7) + 14, 2);
                    g.fillStyle(0x887733, 0.2);
                    g.fillRect(px + (seed & 5) + 6, py + (seed2 & 5) + 8, 5, 3);
                } else if (room.type === 'hydrothermal') {
                    // Steam vents and mineral deposits
                    g.fillStyle(0x44dddd, 0.15);
                    g.fillCircle(px + S / 2, py + S / 2, S / 2.5);
                    g.fillStyle(0x88ffff, 0.1);
                    g.fillCircle(px + (seed & 7) + 8, py + (seed2 & 5) + 6, 2);
                    g.fillStyle(0xffaa44, 0.2);
                    g.fillCircle(px + (seed >> 2 & 7) + 12, py + (seed2 >> 2 & 7) + 14, 2);
                } else if (room.type === 'gas_pocket') {
                    // Yellowish gas haze
                    g.fillStyle(0xdddd44, 0.12);
                    g.fillCircle(px + S / 2, py + S / 2, S / 2);
                    g.fillStyle(0xeeee66, 0.08);
                    g.fillCircle(px + (seed & 9) + 6, py + (seed2 & 9) + 6, 4);
                } else if (room.type === 'magma_chamber') {
                    // Glowing lava
                    g.fillStyle(0xff4400, 0.2);
                    g.fillCircle(px + S / 2, py + S / 2, S / 2.5);
                    g.fillStyle(0xff6600, 0.3);
                    g.fillCircle(px + (seed & 7) + 8, py + (seed2 & 5) + 8, 3);
                    g.fillStyle(0xffaa00, 0.15);
                    g.fillCircle(px + (seed >> 2 & 5) + 12, py + (seed2 >> 2 & 5) + 6, 2);
                }
                break;
            }
        }
    }

    // ── Exit portal pulsing overlay ───────────────────────────────────────────

    spawnExitPortal() {
        const scene = this.scene;
        const s  = TILE_SIZE;
        const px = scene.exitX * s, py = scene.exitY * s;

        const outer = scene.add.graphics().setDepth(1);
        outer.fillStyle(COLORS.EXIT, 0.12);
        outer.fillCircle(px + s / 2, py + s / 2, s / 2 - 1);
        scene.tweens.add({
            targets: outer, alpha: 0.3, scaleX: 1.15, scaleY: 1.15,
            duration: 1100, ease: 'Sine.easeInOut', yoyo: true, repeat: -1
        });

        const inner = scene.add.graphics().setDepth(1);
        inner.fillStyle(COLORS.EXIT_GLOW, 0.5);
        inner.fillCircle(px + s / 2, py + s / 2, s / 2 - 7);
        scene.tweens.add({
            targets: inner, alpha: 0.85, scaleX: 0.88, scaleY: 0.88,
            duration: 700, ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
            delay: 300
        });
    }

    // ── Fog of war ────────────────────────────────────────────────────────────

    updateFog() {
        const scene = this.scene;
        const crystalVision = scene.hero.getCrystalBonuses ? scene.hero.getCrystalBonuses().visionRadius : 0;
        const r  = scene.hero.visionRadius + crystalVision;
        const hx = scene.hero.gridX, hy = scene.hero.gridY;
        for (let y = 0; y < scene.tileH; y++)
            for (let x = 0; x < scene.tileW; x++)
                if (scene.fog[y][x] === FOG.LIT) scene.fog[y][x] = FOG.DIM;
        for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
                if (dx * dx + dy * dy <= r * r) {
                    const nx = hx + dx, ny = hy + dy;
                    if (nx >= 0 && nx < scene.tileW && ny >= 0 && ny < scene.tileH)
                        scene.fog[ny][nx] = FOG.LIT;
                }
            }
        }

        // Mineral vision: reveal mineral tiles through fog if hero has mineral_eye skill
        const mr = scene.hero.mineralVisionRadius || 0;
        if (mr > 0 && scene.itemObjects) {
            for (const obj of scene.itemObjects) {
                if (!obj.isMineral) continue;
                const dist = Math.abs(obj.gridX - hx) + Math.abs(obj.gridY - hy);
                if (dist <= mr + r) {
                    const fx = obj.gridX, fy = obj.gridY;
                    if (fx >= 0 && fx < scene.tileW && fy >= 0 && fy < scene.tileH) {
                        if (scene.fog[fy][fx] === FOG.DARK) {
                            scene.fog[fy][fx] = FOG.DIM;
                        }
                    }
                }
            }
        }

        this._drawFog();
    }

    _drawFog() {
        const scene = this.scene;
        const g = scene.fogGraphics;
        g.clear();
        for (let y = 0; y < scene.tileH; y++) {
            for (let x = 0; x < scene.tileW; x++) {
                const f = scene.fog[y][x];
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
}
