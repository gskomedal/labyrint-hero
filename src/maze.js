// ─── Labyrint Hero – Maze Generator ─────────────────────────────────────────
// Recursive Backtracker (DFS) creates a perfect maze, then adds:
//   - Extra open passages (loops)
//   - Secret passages (TILE.SECRET – looks like wall, passable)
//   - Cracked walls (TILE.CRACKED_WALL – breakable with pickaxe)
//   - Locked doors (TILE.DOOR – needs key, creates interesting shortcuts)

class MazeGenerator {
    constructor(cellW, cellH) {
        this.cellW  = cellW;
        this.cellH  = cellH;
        this.tileW  = cellW * 2 + 1;
        this.tileH  = cellH * 2 + 1;
        this.grid   = [];
        this.exitX  = 0;
        this.exitY  = 0;
    }

    generate(worldNum) {
        // Initialise all as walls
        for (let y = 0; y < this.tileH; y++) {
            this.grid[y] = new Array(this.tileW).fill(TILE.WALL);
        }

        const visited = Array.from({ length: this.cellH }, () =>
            new Array(this.cellW).fill(false)
        );

        // Carve perfect maze from top-left cell
        this._carve(0, 0, visited);

        // Add extra passages for variety (~18% of candidate walls)
        this._addExtraPassages(0.18);

        // Place exit at bottom-right cell
        this.exitX = this.tileW - 2;
        this.exitY = this.tileH - 2;
        this.grid[this.exitY][this.exitX] = TILE.EXIT;

        // Identify special rooms (Elements mod)
        this.specialRooms = [];
        this._placeSpecialRooms(worldNum || 1);

        return this.grid;
    }

    _carve(cx, cy, visited) {
        visited[cy][cx] = true;
        const tx = cx * 2 + 1;
        const ty = cy * 2 + 1;
        this.grid[ty][tx] = TILE.FLOOR;

        // Randomise direction order
        const dirs = [[0,-1],[0,1],[-1,0],[1,0]];
        for (let i = dirs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
        }

        for (const [dx, dy] of dirs) {
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx >= 0 && nx < this.cellW &&
                ny >= 0 && ny < this.cellH &&
                !visited[ny][nx]) {
                this.grid[ty + dy][tx + dx] = TILE.FLOOR;
                this._carve(nx, ny, visited);
            }
        }
    }

    /** Add varied extra passages: loops, secret doors, cracked walls, locked doors */
    _addExtraPassages(ratio) {
        const candidates = [];

        for (let cy = 0; cy < this.cellH; cy++) {
            for (let cx = 0; cx < this.cellW; cx++) {
                // Horizontal wall between (cx,cy) and (cx+1,cy)
                if (cx + 1 < this.cellW) {
                    const wx = cx * 2 + 2, wy = cy * 2 + 1;
                    if (this.grid[wy][wx] === TILE.WALL) candidates.push({ wx, wy });
                }
                // Vertical wall between (cx,cy) and (cx,cy+1)
                if (cy + 1 < this.cellH) {
                    const wx = cx * 2 + 1, wy = cy * 2 + 2;
                    if (this.grid[wy][wx] === TILE.WALL) candidates.push({ wx, wy });
                }
            }
        }

        MazeGenerator.shuffle(candidates);
        const count = Math.floor(candidates.length * ratio);

        for (let i = 0; i < count; i++) {
            const { wx, wy } = candidates[i];
            const r = Math.random();
            if      (r < 0.35) this.grid[wy][wx] = TILE.FLOOR;          // Open passage (loop)
            else if (r < 0.55) this.grid[wy][wx] = TILE.SECRET;         // Secret passage
            else if (r < 0.75) this.grid[wy][wx] = TILE.CRACKED_WALL;   // Breakable
            else               this.grid[wy][wx] = TILE.DOOR;           // Locked door
        }
    }

    /**
     * Identify dead-end cells and designate some as special rooms (Elements mod).
     * Special rooms are clusters of floor tiles with a type tag.
     */
    _placeSpecialRooms(worldNum) {
        // Find dead-end cells (floor tiles with only 1 open neighbour)
        const deadEnds = [];
        for (let y = 1; y < this.tileH - 1; y++) {
            for (let x = 1; x < this.tileW - 1; x++) {
                if (this.grid[y][x] !== TILE.FLOOR) continue;
                // Skip tiles near start (1,1) or exit
                if (Math.abs(x - 1) + Math.abs(y - 1) < 4) continue;
                if (x === this.exitX && y === this.exitY) continue;
                let openNeighbours = 0;
                for (const [dx, dy] of [[0,-1],[0,1],[-1,0],[1,0]]) {
                    const t = this.grid[y + dy]?.[x + dx];
                    if (t === TILE.FLOOR || t === TILE.EXIT || t === TILE.SECRET || t === TILE.DOOR) {
                        openNeighbours++;
                    }
                }
                if (openNeighbours === 1) deadEnds.push({ x, y });
            }
        }
        MazeGenerator.shuffle(deadEnds);

        // Quarry: world 1+, 30% chance, max 1
        if (worldNum >= 1 && deadEnds.length > 0 && Math.random() < 0.30) {
            const de = deadEnds.shift();
            const tiles = this._gatherRoomTiles(de.x, de.y, 3 + Math.floor(Math.random() * 3));
            if (tiles.length >= 2) {
                this.specialRooms.push({ type: 'quarry', tiles });
            }
        }

        // Crystal Cave: world 3+, 20% chance, max 1
        if (worldNum >= 3 && deadEnds.length > 0 && Math.random() < 0.20) {
            const de = deadEnds.shift();
            const tiles = this._gatherRoomTiles(de.x, de.y, 2 + Math.floor(Math.random() * 3));
            if (tiles.length >= 2) {
                this.specialRooms.push({ type: 'crystal_cave', tiles });
            }
        }

        // Camp Room (Smeltery + Storage): guaranteed world 2+, 50% in world 1
        const campChance = worldNum >= 2 ? 1.0 : 0.50;
        if (deadEnds.length > 0 && Math.random() < campChance) {
            const de = deadEnds.shift();
            const tiles = this._gatherRoomTiles(de.x, de.y, 2 + Math.floor(Math.random() * 2));
            if (tiles.length >= 1) {
                this.specialRooms.push({ type: 'camp_room', tiles });
            }
        }

        // Chem Lab: world 4+, 35% chance – gated by zone boss at interaction time
        if (worldNum >= 4 && deadEnds.length > 0 && Math.random() < 0.35) {
            const de = deadEnds.shift();
            const tiles = this._gatherRoomTiles(de.x, de.y, 2 + Math.floor(Math.random() * 2));
            if (tiles.length >= 1) {
                this.specialRooms.push({ type: 'chem_lab', tiles });
            }
        }

        // Ore Chamber: world 5+, 25% chance – concentrated T2-T3 ores
        if (worldNum >= 5 && deadEnds.length > 0 && Math.random() < 0.25) {
            const de = deadEnds.shift();
            const tiles = this._gatherRoomTiles(de.x, de.y, 3 + Math.floor(Math.random() * 3));
            if (tiles.length >= 2) {
                this.specialRooms.push({ type: 'ore_chamber', tiles });
            }
        }

        // Hydrothermal Vent: world 8+, 30% chance – T4 minerals + poison gas
        if (worldNum >= 8 && deadEnds.length > 0 && Math.random() < 0.30) {
            const de = deadEnds.shift();
            const tiles = this._gatherRoomTiles(de.x, de.y, 2 + Math.floor(Math.random() * 2));
            if (tiles.length >= 1) {
                this.specialRooms.push({ type: 'hydrothermal', tiles });
            }
        }

        // Gas Pocket: world 10+, 20% chance – fuel source
        if (worldNum >= 10 && deadEnds.length > 0 && Math.random() < 0.20) {
            const de = deadEnds.shift();
            const tiles = this._gatherRoomTiles(de.x, de.y, 2);
            if (tiles.length >= 1) {
                this.specialRooms.push({ type: 'gas_pocket', tiles });
            }
        }

        // Magma Chamber: world 18+, 25% chance – T5-T6 minerals + fire damage
        if (worldNum >= 18 && deadEnds.length > 0 && Math.random() < 0.25) {
            const de = deadEnds.shift();
            const tiles = this._gatherRoomTiles(de.x, de.y, 2 + Math.floor(Math.random() * 2));
            if (tiles.length >= 1) {
                this.specialRooms.push({ type: 'magma_chamber', tiles });
            }
        }
    }

    /** Gather up to maxSize floor tiles around a starting point (BFS). */
    _gatherRoomTiles(sx, sy, maxSize) {
        const tiles = [{ x: sx, y: sy }];
        const visited = new Set([`${sx},${sy}`]);
        const queue = [{ x: sx, y: sy }];

        while (queue.length > 0 && tiles.length < maxSize) {
            const { x, y } = queue.shift();
            for (const [dx, dy] of [[0,-1],[0,1],[-1,0],[1,0]]) {
                const nx = x + dx, ny = y + dy;
                const key = `${nx},${ny}`;
                if (visited.has(key)) continue;
                visited.add(key);
                if (this.grid[ny]?.[nx] === TILE.FLOOR) {
                    // Skip near start/exit
                    if (Math.abs(nx - 1) + Math.abs(ny - 1) < 4) continue;
                    if (nx === this.exitX && ny === this.exitY) continue;
                    tiles.push({ x: nx, y: ny });
                    queue.push({ x: nx, y: ny });
                    if (tiles.length >= maxSize) break;
                }
            }
        }
        return tiles;
    }

    /**
     * Returns all floor-equivalent tile positions as [{x, y}].
     * Includes FLOOR and EXIT, but NOT DOOR, SECRET, CRACKED_WALL
     * (those are used for placement of monsters/items only on walkable ground).
     */
    getFloorTiles() {
        const tiles = [];
        for (let y = 0; y < this.tileH; y++) {
            for (let x = 0; x < this.tileW; x++) {
                const t = this.grid[y][x];
                if (t === TILE.FLOOR || t === TILE.EXIT) {
                    tiles.push({ x, y });
                }
            }
        }
        return tiles;
    }

    /** Returns floor tiles sorted by Manhattan distance FROM a point */
    getFloorTilesSortedFrom(fromX, fromY) {
        return this.getFloorTiles().sort((a, b) => {
            const da = Math.abs(a.x - fromX) + Math.abs(a.y - fromY);
            const db = Math.abs(b.x - fromX) + Math.abs(b.y - fromY);
            return da - db;
        });
    }

    /** Count tiles of a given type */
    countTile(type) {
        let n = 0;
        for (let y = 0; y < this.tileH; y++)
            for (let x = 0; x < this.tileW; x++)
                if (this.grid[y][x] === type) n++;
        return n;
    }

    static shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
}
