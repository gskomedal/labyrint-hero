// ─── Labyrint Hero 2 – Maze structures ───────────────────────────────────────
// Stone labyrinths placed on the surface (ancient ruin) and in every cave
// (guarding the descent portal). Seeded recursive-backtracker maze; walls are
// instanced boxes sitting on the terrain. Collision works by registering the
// maze with the area: getHeightAt returns wall-top height on wall tiles, and
// the player's MAX_STEP_HEIGHT rejects the climb – no separate physics needed.

const MazeStructure = {
    /** Seeded perfect maze + a few extra openings. Returns 2D grid (1 = wall). */
    _generate(cellW, cellH, rand) {
        const tw = cellW * 2 + 1, th = cellH * 2 + 1;
        const grid = Array.from({ length: th }, () => new Array(tw).fill(1));
        const visited = Array.from({ length: cellH }, () => new Array(cellW).fill(false));

        const carve = (cx, cy) => {
            visited[cy][cx] = true;
            grid[cy * 2 + 1][cx * 2 + 1] = 0;
            const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
            for (let i = dirs.length - 1; i > 0; i--) {
                const j = Math.floor(rand() * (i + 1));
                [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
            }
            for (const [dx, dy] of dirs) {
                const nx = cx + dx, ny = cy + dy;
                if (nx < 0 || ny < 0 || nx >= cellW || ny >= cellH || visited[ny][nx]) continue;
                grid[cy * 2 + 1 + dy][cx * 2 + 1 + dx] = 0;
                carve(nx, ny);
            }
        };
        carve(0, 0);

        // Extra openings (~12%) so it loops a bit, like LH1's extra passages
        for (let y = 1; y < th - 1; y++) {
            for (let x = 1; x < tw - 1; x++) {
                if (grid[y][x] !== 1) continue;
                const horiz = grid[y][x - 1] === 0 && grid[y][x + 1] === 0;
                const vert = grid[y - 1][x] === 0 && grid[y + 1][x] === 0;
                if ((horiz || vert) && rand() < 0.12) grid[y][x] = 0;
            }
        }
        return grid;
    },

    /** Dead-end floor tiles (3 wall neighbours) – reward spots. */
    _deadEnds(grid) {
        const out = [];
        for (let y = 1; y < grid.length - 1; y++) {
            for (let x = 1; x < grid[0].length - 1; x++) {
                if (grid[y][x] !== 0) continue;
                const walls = (grid[y - 1][x] ? 1 : 0) + (grid[y + 1][x] ? 1 : 0)
                            + (grid[y][x - 1] ? 1 : 0) + (grid[y][x + 1] ? 1 : 0);
                if (walls === 3) out.push({ tx: x, ty: y });
            }
        }
        return out;
    },

    /**
     * Build a maze structure in an area and hook its walls into collision.
     * @returns {{ centerPos, rewardSpots: [{x,y,z}] }} world-space POIs
     */
    add(area, { cx, cz, cellW, cellH, rand, wallColor }) {
        const tile = LH2.MAZE_TILE;
        const grid = this._generate(cellW, cellH, rand);
        const tw = grid[0].length, th = grid.length;
        const originX = cx - (tw * tile) / 2;
        const originZ = cz - (th * tile) / 2;

        // Entrance: open a gap mid-south plus mid-north so it's traversable
        const midX = (Math.floor(tw / 4) * 2) + 1;
        grid[th - 1][midX] = 0;
        grid[0][tw - midX - 1] = 0;

        // Register for collision BEFORE reading heights through area.getHeightAt
        const baseHeightAt = area.getHeightAt.bind(area);
        const maze = { grid, originX, originZ, tile, tw, th, baseHeightAt };
        if (!area.mazes) {
            area.mazes = [];
            const orig = area.getHeightAt.bind(area);
            // Wrap once: wall tiles report wall-top height
            area.getHeightAt = (x, z) => {
                for (const m of area.mazes) {
                    const tx = Math.floor((x - m.originX) / m.tile);
                    const ty = Math.floor((z - m.originZ) / m.tile);
                    if (tx >= 0 && ty >= 0 && tx < m.tw && ty < m.th && m.grid[ty][tx] === 1) {
                        const wx = m.originX + (tx + 0.5) * m.tile;
                        const wz = m.originZ + (ty + 0.5) * m.tile;
                        return m.baseHeightAt(wx, wz) + LH2.MAZE_WALL_HEIGHT;
                    }
                }
                return orig(x, z);
            };
        }
        area.mazes.push(maze);

        // Keep random placement (deposits, trees...) out of the maze footprint
        const bounds = {
            minX: originX - 2, maxX: originX + tw * tile + 2,
            minZ: originZ - 2, maxZ: originZ + th * tile + 2,
        };
        const origFind = area.findSpot.bind(area);
        area.findSpot = (rand, opts) => {
            for (let t = 0; t < 30; t++) {
                const s = origFind(rand, opts);
                if (!s) return null;
                if (s.x < bounds.minX || s.x > bounds.maxX || s.z < bounds.minZ || s.z > bounds.maxZ) return s;
            }
            return null;
        };

        // Wall meshes: one instanced box per wall tile, seated on the terrain
        let wallCount = 0;
        for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) if (grid[y][x] === 1) wallCount++;

        const geo = new THREE.BoxGeometry(tile, LH2.MAZE_WALL_HEIGHT + 1.2, tile);
        const mat = new THREE.MeshLambertMaterial({ color: wallColor || 0x8a857c, flatShading: true });
        const walls = new THREE.InstancedMesh(geo, mat, wallCount);
        const m4 = new THREE.Matrix4();
        let idx = 0;
        for (let y = 0; y < th; y++) {
            for (let x = 0; x < tw; x++) {
                if (grid[y][x] !== 1) continue;
                const wx = originX + (x + 0.5) * tile;
                const wz = originZ + (y + 0.5) * tile;
                const wy = baseHeightAt(wx, wz);
                // Sunk 1.2 below ground so uneven terrain shows no gaps
                m4.makeTranslation(wx, wy + (LH2.MAZE_WALL_HEIGHT + 1.2) / 2 - 1.2, wz);
                walls.setMatrixAt(idx++, m4);
            }
        }
        area.group.add(walls);

        // POIs in world space (heights read AFTER wrapping = floor tiles only)
        const toWorld = (tx, ty) => {
            const x = originX + (tx + 0.5) * tile;
            const z = originZ + (ty + 0.5) * tile;
            return { x, y: baseHeightAt(x, z), z };
        };

        const center = toWorld(midX, Math.floor(th / 2) % 2 === 0 ? Math.floor(th / 2) + 1 : Math.floor(th / 2));
        const ends = this._deadEnds(grid);
        for (let i = ends.length - 1; i > 0; i--) {
            const j = Math.floor(rand() * (i + 1));
            [ends[i], ends[j]] = [ends[j], ends[i]];
        }
        const rewardSpots = ends.slice(0, LH2.MAZE_REWARD_NODES).map(e => toWorld(e.tx, e.ty));

        return { centerPos: center, rewardSpots };
    },
};
