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

    generate() {
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
