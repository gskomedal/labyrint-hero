// ─── Maze Generator Tests ────────────────────────────────────────────────────

describe('MazeGenerator – basic generation', () => {
    it('creates a grid of correct dimensions', () => {
        const gen = new MazeGenerator(5, 5);
        gen.generate(1);
        expect(gen.grid.length).toBe(11); // cellH*2+1
        expect(gen.grid[0].length).toBe(11); // cellW*2+1
    });

    it('places exit at bottom-right', () => {
        const gen = new MazeGenerator(5, 5);
        gen.generate(1);
        expect(gen.grid[gen.exitY][gen.exitX]).toBe(TILE.EXIT);
    });

    it('has start tile (1,1) as floor', () => {
        const gen = new MazeGenerator(5, 5);
        gen.generate(1);
        expect(gen.grid[1][1]).toBe(TILE.FLOOR);
    });

    it('has walls on the outer border', () => {
        const gen = new MazeGenerator(5, 5);
        gen.generate(1);
        // Top row should be all walls
        for (let x = 0; x < gen.tileW; x++) {
            expect(gen.grid[0][x]).toBe(TILE.WALL);
        }
        // Left column should be all walls
        for (let y = 0; y < gen.tileH; y++) {
            expect(gen.grid[y][0]).toBe(TILE.WALL);
        }
    });

    it('generates floor tiles', () => {
        const gen = new MazeGenerator(5, 5);
        gen.generate(1);
        const floors = gen.getFloorTiles();
        expect(floors.length).toBeGreaterThan(0);
    });
});

describe('MazeGenerator – reachability', () => {
    it('all floor tiles are reachable from start (1,1)', () => {
        const gen = new MazeGenerator(6, 6);
        gen.generate(3);

        // BFS from (1,1) to verify all passable tiles are reachable
        const passable = new Set([TILE.FLOOR, TILE.SECRET, TILE.EXIT, TILE.DOOR, TILE.CRACKED_WALL, TILE.TRAP]);
        const visited = Array.from({ length: gen.tileH }, () => new Array(gen.tileW).fill(false));
        const queue = [{ x: 1, y: 1 }];
        visited[1][1] = true;

        while (queue.length > 0) {
            const { x, y } = queue.shift();
            for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
                const nx = x + dx, ny = y + dy;
                if (nx >= 0 && nx < gen.tileW && ny >= 0 && ny < gen.tileH
                    && !visited[ny][nx] && passable.has(gen.grid[ny][nx])) {
                    visited[ny][nx] = true;
                    queue.push({ x: nx, y: ny });
                }
            }
        }

        // Check that exit is reachable
        expect(visited[gen.exitY][gen.exitX]).toBeTrue();

        // Check that all floor tiles are reachable
        for (let y = 0; y < gen.tileH; y++) {
            for (let x = 0; x < gen.tileW; x++) {
                if (gen.grid[y][x] === TILE.FLOOR || gen.grid[y][x] === TILE.EXIT) {
                    expect(visited[y][x]).toBeTrue();
                }
            }
        }
    });

    it('exit is reachable across multiple world numbers', () => {
        for (let world = 1; world <= 10; world++) {
            const gen = new MazeGenerator(5, 5);
            gen.generate(world);

            const passable = new Set([TILE.FLOOR, TILE.SECRET, TILE.EXIT, TILE.DOOR, TILE.CRACKED_WALL, TILE.TRAP]);
            const visited = Array.from({ length: gen.tileH }, () => new Array(gen.tileW).fill(false));
            const queue = [{ x: 1, y: 1 }];
            visited[1][1] = true;

            while (queue.length > 0) {
                const { x, y } = queue.shift();
                for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
                    const nx = x + dx, ny = y + dy;
                    if (nx >= 0 && nx < gen.tileW && ny >= 0 && ny < gen.tileH
                        && !visited[ny][nx] && passable.has(gen.grid[ny][nx])) {
                        visited[ny][nx] = true;
                        queue.push({ x: nx, y: ny });
                    }
                }
            }

            expect(visited[gen.exitY][gen.exitX]).toBeTrue();
        }
    });
});

describe('MazeGenerator – shuffle utility', () => {
    it('returns an array of same length', () => {
        const arr = [1, 2, 3, 4, 5];
        MazeGenerator.shuffle(arr);
        expect(arr.length).toBe(5);
    });

    it('contains same elements after shuffle', () => {
        const arr = [10, 20, 30];
        MazeGenerator.shuffle(arr);
        expect(arr.length).toBe(3);
        // All original values should still be present
        const sorted = [...arr].sort((a, b) => a - b);
        expect(sorted[0]).toBe(10);
        expect(sorted[1]).toBe(20);
        expect(sorted[2]).toBe(30);
    });
});
