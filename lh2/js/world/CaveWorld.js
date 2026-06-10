// ─── Labyrint Hero 2 – Cave areas ────────────────────────────────────────────
// The underground zones are real cave labyrinths: the whole area is a maze of
// wide tunnels (walls floor-to-ceiling, solid rock ceiling on top) so the
// layout can never be seen from above. A few open chambers hold glowing
// crystals, the up-portal sits in the spawn chamber and the down-portal is at
// the floor tile farthest from it (BFS), so descending means actually solving
// the labyrinth. Deeper zone = higher mineral tier.

class CaveArea {
    constructor(zone, seed) {
        this.id = zone.id;
        this.name = zone.name;
        this.tier = zone.tier;
        this.fogColor = zone.fogColor;
        this.lightColor = zone.lightColor;
        this.minWalkHeight = -99; // no ocean underground
        this.interactables = [];
        this.nodes = [];

        this.tile = LH2.CAVE_TUNNEL_WIDTH; // wide tunnels
        this.cellW = 9;
        this.cellH = 7;
        this.ceilingY = 7.5;

        this.noise = makeNoise2D(seed);
        this._rand = this._makeRand(seed);
        this.group = new THREE.Group();
        this.group.visible = false;

        this._buildMaze();
        this.group.add(this._buildFloor());
        this.group.add(this._buildWalls());
        this.group.add(this._buildCeiling());
        this._addLights();
    }

    _makeRand(seed) {
        const n = makeNoise2D(seed + 31337);
        let i = 0;
        return () => (n(i++ * 0.7919, i * 1.317) + 1) / 2;
    }

    // ── Maze layout ──────────────────────────────────────────────────────────

    _buildMaze() {
        this.grid = MazeStructure._generate(this.cellW, this.cellH, this._rand);
        this.tw = this.grid[0].length;
        this.th = this.grid.length;
        this.width = this.tw * this.tile;
        this.depth = this.th * this.tile;
        this.originX = -this.width / 2;
        this.originZ = -this.depth / 2;

        // Open chambers: spawn chamber top-left + two random ones
        this._carveRoom(0, 0);
        this.rooms = [this._roomCenterTile(0, 0)];
        for (let r = 0; r < 2; r++) {
            const ax = 1 + Math.floor(this._rand() * (this.cellW - 3));
            const ay = 1 + Math.floor(this._rand() * (this.cellH - 3));
            this._carveRoom(ax, ay);
            this.rooms.push(this._roomCenterTile(ax, ay));
        }

        // Spawn = centre of the first chamber
        const s = this.rooms[0];
        this.spawn = this._tileToWorld(s.tx, s.ty);

        // Down-portal location = farthest floor tile from spawn (BFS)
        const far = this._farthestTile(s.tx, s.ty);
        this.downTile = far;

        // Dead ends for reward deposits (away from spawn)
        this.deadEnds = MazeStructure._deadEnds(this.grid)
            .filter(e => Math.abs(e.tx - s.tx) + Math.abs(e.ty - s.ty) > 6);
    }

    /** Clear a 2×2-cell chamber starting at cell (ax, ay). */
    _carveRoom(ax, ay) {
        for (let y = ay * 2 + 1; y <= (ay + 1) * 2 + 1 && y < this.grid.length - 1; y++) {
            for (let x = ax * 2 + 1; x <= (ax + 1) * 2 + 1 && x < this.grid[0].length - 1; x++) {
                this.grid[y][x] = 0;
            }
        }
    }

    _roomCenterTile(ax, ay) {
        return { tx: ax * 2 + 2, ty: ay * 2 + 2 };
    }

    _tileToWorld(tx, ty) {
        const x = this.originX + (tx + 0.5) * this.tile;
        const z = this.originZ + (ty + 0.5) * this.tile;
        return { x, y: this._floorHeight(x, z), z };
    }

    _farthestTile(sx, sy) {
        const dist = Array.from({ length: this.th }, () => new Array(this.tw).fill(-1));
        dist[sy][sx] = 0;
        const queue = [{ x: sx, y: sy }];
        let far = { tx: sx, ty: sy, d: 0 };
        while (queue.length) {
            const { x, y } = queue.shift();
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const nx = x + dx, ny = y + dy;
                if (nx < 0 || ny < 0 || nx >= this.tw || ny >= this.th) continue;
                if (this.grid[ny][nx] === 1 || dist[ny][nx] !== -1) continue;
                dist[ny][nx] = dist[y][x] + 1;
                if (dist[ny][nx] > far.d) far = { tx: nx, ty: ny, d: dist[ny][nx] };
                queue.push({ x: nx, y: ny });
            }
        }
        return far;
    }

    // ── Heights & collision ──────────────────────────────────────────────────

    _floorHeight(x, z) {
        const f = 1 / 18;
        return fbm2(this.noise, x * f, z * f, 3, 2.0, 0.5) * 1.1;
    }

    _tileAt(x, z) {
        const tx = Math.floor((x - this.originX) / this.tile);
        const ty = Math.floor((z - this.originZ) / this.tile);
        if (tx < 0 || ty < 0 || tx >= this.tw || ty >= this.th) return 1; // solid rock
        return this.grid[ty][tx];
    }

    getHeightAt(x, z) {
        if (this._tileAt(x, z) === 1) return this.ceilingY + 6; // wall/rock
        return this._floorHeight(x, z);
    }

    getSlopeAt(x, z) {
        const e = 1.0;
        const dx = this.getHeightAt(x + e, z) - this.getHeightAt(x - e, z);
        const dz = this.getHeightAt(x, z + e) - this.getHeightAt(x, z - e);
        return Math.sqrt(dx * dx + dz * dz) / (2 * e);
    }

    /** Random spot on a floor tile, jittered, away from spawn. */
    findSpot(rand, opts = {}) {
        for (let t = 0; t < 80; t++) {
            const tx = Math.floor(rand() * this.tw);
            const ty = Math.floor(rand() * this.th);
            if (this.grid[ty] === undefined || this.grid[ty][tx] !== 0) continue;
            const x = this.originX + (tx + 0.5 + (rand() - 0.5) * 0.5) * this.tile;
            const z = this.originZ + (ty + 0.5 + (rand() - 0.5) * 0.5) * this.tile;
            if (Math.hypot(x - this.spawn.x, z - this.spawn.z) < 10) continue;
            return { x, y: this._floorHeight(x, z), z };
        }
        return null;
    }

    // ── Meshes ───────────────────────────────────────────────────────────────

    _buildFloor() {
        const segs = 96;
        const geo = new THREE.PlaneGeometry(this.width, this.depth, segs, segs);
        geo.rotateX(-Math.PI / 2);
        const pos = geo.attributes.position;
        const colors = new Float32Array(pos.count * 3);
        const c = new THREE.Color(this.fogColor).multiplyScalar(2.4);

        for (let v = 0; v < pos.count; v++) {
            const x = pos.getX(v), z = pos.getZ(v);
            pos.setY(v, this._floorHeight(x, z));
            const tint = 0.8 + 0.2 * this.noise(x * 0.4, z * 0.4);
            colors[v * 3] = Math.min(1, c.r * tint);
            colors[v * 3 + 1] = Math.min(1, c.g * tint);
            colors[v * 3 + 2] = Math.min(1, c.b * tint);
        }

        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geo.computeVertexNormals();
        return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
    }

    _buildWalls() {
        let count = 0;
        for (let y = 0; y < this.th; y++) for (let x = 0; x < this.tw; x++) if (this.grid[y][x] === 1) count++;

        const wallH = this.ceilingY + 1.5;
        const geo = new THREE.BoxGeometry(this.tile, wallH, this.tile);
        const c = new THREE.Color(this.fogColor).multiplyScalar(3.0);
        const mat = new THREE.MeshLambertMaterial({ color: c, flatShading: true });
        const walls = new THREE.InstancedMesh(geo, mat, count);
        const m4 = new THREE.Matrix4();
        let idx = 0;
        for (let y = 0; y < this.th; y++) {
            for (let x = 0; x < this.tw; x++) {
                if (this.grid[y][x] !== 1) continue;
                const wx = this.originX + (x + 0.5) * this.tile;
                const wz = this.originZ + (y + 0.5) * this.tile;
                m4.makeTranslation(wx, wallH / 2 - 1, wz);
                walls.setMatrixAt(idx++, m4);
            }
        }
        return walls;
    }

    _buildCeiling() {
        const segs = 48;
        const geo = new THREE.PlaneGeometry(this.width, this.depth, segs, segs);
        geo.rotateX(Math.PI / 2); // faces downward
        const pos = geo.attributes.position;
        const f = 1 / 14;
        for (let v = 0; v < pos.count; v++) {
            const x = pos.getX(v), z = pos.getZ(v);
            pos.setY(v, this.ceilingY + fbm2(this.noise, x * f + 50, z * f + 50, 3) * 0.8);
        }
        geo.computeVertexNormals();
        const c = new THREE.Color(this.fogColor).multiplyScalar(1.6);
        return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: c, flatShading: true }));
    }

    _addLights() {
        // One glowing crystal cluster + light per chamber
        for (const room of this.rooms) {
            const p = this._tileToWorld(room.tx, room.ty);
            const crystal = new THREE.Mesh(
                new THREE.ConeGeometry(0.7, 2.6, 6),
                new THREE.MeshStandardMaterial({
                    color: this.lightColor, emissive: this.lightColor,
                    emissiveIntensity: 0.9, flatShading: true,
                }),
            );
            crystal.position.set(p.x + 2, p.y + 1.1, p.z + 2);
            crystal.rotation.z = 0.2;
            this.group.add(crystal);

            const light = new THREE.PointLight(this.lightColor, 260, 55, 1.8);
            light.position.set(p.x, p.y + 4.5, p.z);
            this.group.add(light);
        }

        // Small unlit emissive crystals scattered through the tunnels
        const mat = new THREE.MeshStandardMaterial({
            color: this.lightColor, emissive: this.lightColor,
            emissiveIntensity: 0.8, flatShading: true,
        });
        for (let i = 0; i < 14; i++) {
            const spot = this.findSpot(this._rand);
            if (!spot) continue;
            const shard = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.9 + this._rand() * 0.6, 5), mat);
            shard.position.set(spot.x + (this._rand() - 0.5) * 2, spot.y + 0.4, spot.z + (this._rand() - 0.5) * 2);
            shard.rotation.set((this._rand() - 0.5) * 0.6, this._rand() * 3, (this._rand() - 0.5) * 0.6);
            this.group.add(shard);
        }

        // Ambient so tunnels are dim but readable
        this.group.add(new THREE.AmbientLight(this.fogColor, 7));
    }
}

const CaveWorld = {
    /**
     * Build the chained underground zones, LH1-style descent:
     * surface → Grunnfjell → Dyplag → Underverden → Jordens kjerne.
     * Up-portal in the spawn chamber; down-portal at the labyrinth's farthest
     * tile, so you must solve the tunnels to descend.
     */
    buildAll(switchArea) {
        const areas = {};
        LH2.CAVE_ZONES.forEach((zone, idx) => {
            const cave = new CaveArea(zone, LH2.SEED + zone.tier * 7919);
            const rand = cave._makeRand(LH2.SEED + zone.tier * 131);

            OreDeposits.populate(cave, rand, LH2.CAVE_ORE_NODES);
            // Reward deposits (tier+1) in distant dead ends
            const rewardSpots = cave.deadEnds
                .slice(0, LH2.MAZE_REWARD_NODES)
                .map(e => cave._tileToWorld(e.tx, e.ty));
            OreDeposits.populateAt(cave, rewardSpots, rand, `${zone.id}:maze`);
            OreDeposits.addElementNodes(cave, rand);

            // Up-portal in the spawn chamber: back to the area above
            const upTarget = idx === 0 ? 'surface' : LH2.CAVE_ZONES[idx - 1].id;
            const upLabel = idx === 0 ? 'Tilbake til overflaten'
                : `Opp til ${LH2.CAVE_ZONES[idx - 1].name}`;
            const upPos = { x: cave.spawn.x, y: cave.spawn.y, z: cave.spawn.z + 4 };
            cave.group.add(Decorations.buildPortal(upPos, 0x88ddff));
            cave.interactables.push({
                type: 'portal',
                pos: upPos,
                getLabel: () => upLabel,
                isActive: () => true,
                onInteract: () => switchArea(upTarget, zone.id),
            });

            // Down-portal at the farthest tile (none in the deepest zone)
            const below = LH2.CAVE_ZONES[idx + 1];
            if (below) {
                const dp = cave._tileToWorld(cave.downTile.tx, cave.downTile.ty);
                cave.downPortalPos = dp;
                cave.group.add(Decorations.buildPortal(dp, below.lightColor, below.name));
                const dLight = new THREE.PointLight(below.lightColor, 90, 35, 1.8);
                dLight.position.set(dp.x, dp.y + 4, dp.z);
                cave.group.add(dLight);
                cave.interactables.push({
                    type: 'portal',
                    pos: dp,
                    getLabel: () => `Ned til ${below.name} (Tier ${below.tier})`,
                    isActive: () => true,
                    onInteract: () => switchArea(below.id, zone.id),
                });
            }

            areas[zone.id] = cave;
        });
        return areas;
    },

    /** One mine entrance on the surface, leading down to the first zone. */
    addSurfaceEntrances(surface, switchArea) {
        const rand = (() => {
            const noise = makeNoise2D(LH2.SEED + 4242);
            let i = 0;
            return () => (noise(i++ * 0.7919, i * 1.317) + 1) / 2;
        })();

        const first = LH2.CAVE_ZONES[0];
        let spot = null;
        for (let t = 0; t < 60 && !spot; t++) {
            const ang = rand() * Math.PI * 2;
            const r = 40 + rand() * 60;
            const x = Math.cos(ang) * r, z = Math.sin(ang) * r;
            const y = surface.getHeightAt(x, z);
            if (y > 4 && surface.getSlopeAt(x, z) < 0.8) spot = { x, y, z };
        }
        if (!spot) spot = { x: 45, y: surface.getHeightAt(45, 0), z: 0 };

        surface.entrancePos = { [first.id]: spot };
        surface.group.add(Decorations.buildPortal(spot, first.lightColor, first.name));
        surface.interactables.push({
            type: 'portal',
            pos: spot,
            getLabel: () => `Gruvesjakt ned til ${first.name} (Tier ${first.tier})`,
            isActive: () => true,
            onInteract: () => switchArea(first.id, null),
        });
    },
};
