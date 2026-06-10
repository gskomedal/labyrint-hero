// ─── Labyrint Hero 2 – Cave areas ────────────────────────────────────────────
// Four underground zones (Grunnfjell → Jordens kjerne) reached via portals on
// the surface. Each cave is an enclosed cavern: noisy floor whose rim rises
// into walls (so getHeightAt doubles as collision), inverted noisy ceiling,
// dark fog, glowing crystals. Deeper zone = higher mineral tier.

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

        this.size = LH2.CAVE_SIZE;
        this.noise = makeNoise2D(seed);
        this.group = new THREE.Group();
        this.group.visible = false;

        this._buildFloorGrid();
        this.spawn = { x: 0, z: this.size * 0.32 };
        this.group.add(this._buildFloorMesh());
        this.group.add(this._buildCeiling());
        this._addCrystalLights();
    }

    _floorHeight(x, z) {
        const f = 1 / 26;
        let h = fbm2(this.noise, x * f, z * f, 4, 2.0, 0.5) * 2.6;
        // Rim rises into an unclimbable wall over the outer 18%
        const d = Math.sqrt(x * x + z * z) / (this.size * 0.5);
        if (d > 0.82) {
            const t = (d - 0.82) / 0.18;
            h += t * t * (LH2.CAVE_CEILING + 6);
        }
        return h;
    }

    _buildFloorGrid() {
        const segs = LH2.CAVE_SEGMENTS;
        const n = segs + 1;
        this.segments = segs;
        this.grid = new Float32Array(n * n);
        for (let j = 0; j < n; j++) {
            for (let i = 0; i < n; i++) {
                const x = (i / segs - 0.5) * this.size;
                const z = (j / segs - 0.5) * this.size;
                this.grid[j * n + i] = this._floorHeight(x, z);
            }
        }
    }

    getHeightAt(x, z) {
        const n = this.segments + 1;
        const gx = (x / this.size + 0.5) * this.segments;
        const gz = (z / this.size + 0.5) * this.segments;
        if (gx < 0 || gz < 0 || gx >= this.segments || gz >= this.segments) {
            return LH2.CAVE_CEILING + 20; // outside = solid rock
        }
        const i0 = Math.floor(gx), j0 = Math.floor(gz);
        const fx = gx - i0, fz = gz - j0;
        const h00 = this.grid[j0 * n + i0];
        const h10 = this.grid[j0 * n + i0 + 1];
        const h01 = this.grid[(j0 + 1) * n + i0];
        const h11 = this.grid[(j0 + 1) * n + i0 + 1];
        return (h00 * (1 - fx) + h10 * fx) * (1 - fz)
             + (h01 * (1 - fx) + h11 * fx) * fz;
    }

    getSlopeAt(x, z) {
        const e = 1.0;
        const dx = this.getHeightAt(x + e, z) - this.getHeightAt(x - e, z);
        const dz = this.getHeightAt(x, z + e) - this.getHeightAt(x, z - e);
        return Math.sqrt(dx * dx + dz * dz) / (2 * e);
    }

    findSpot(rand, { maxSlope = 0.9 } = {}) {
        for (let t = 0; t < 60; t++) {
            const ang = rand() * Math.PI * 2;
            const r = rand() * this.size * 0.36;
            const x = Math.cos(ang) * r;
            const z = Math.sin(ang) * r;
            if (this.getSlopeAt(x, z) > maxSlope) continue;
            return { x, y: this.getHeightAt(x, z), z };
        }
        return null;
    }

    _buildFloorMesh() {
        const geo = new THREE.PlaneGeometry(this.size, this.size, this.segments, this.segments);
        geo.rotateX(-Math.PI / 2);
        const pos = geo.attributes.position;
        const colors = new Float32Array(pos.count * 3);
        const c = new THREE.Color(this.fogColor).multiplyScalar(2.2);

        for (let v = 0; v < pos.count; v++) {
            const x = pos.getX(v), z = pos.getZ(v);
            pos.setY(v, this.getHeightAt(x, z));
            const tint = 0.8 + 0.2 * this.noise(x * 0.4, z * 0.4);
            colors[v * 3] = Math.min(1, c.r * tint);
            colors[v * 3 + 1] = Math.min(1, c.g * tint);
            colors[v * 3 + 2] = Math.min(1, c.b * tint);
        }

        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geo.computeVertexNormals();
        return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
    }

    _buildCeiling() {
        const segs = 32;
        const geo = new THREE.PlaneGeometry(this.size, this.size, segs, segs);
        geo.rotateX(Math.PI / 2); // faces downward
        const pos = geo.attributes.position;
        const f = 1 / 20;
        for (let v = 0; v < pos.count; v++) {
            const x = pos.getX(v), z = pos.getZ(v);
            pos.setY(v, LH2.CAVE_CEILING + fbm2(this.noise, x * f + 50, z * f + 50, 3) * 2.5);
        }
        geo.computeVertexNormals();
        const c = new THREE.Color(this.fogColor).multiplyScalar(1.4);
        return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: c, flatShading: true }));
    }

    _addCrystalLights() {
        const rand = makeNoise2D(this.tier * 999);
        // 3 large glowing crystals with point lights
        for (let i = 0; i < 3; i++) {
            const ang = (i / 3) * Math.PI * 2 + 0.7;
            const r = this.size * 0.22;
            const x = Math.cos(ang) * r, z = Math.sin(ang) * r;
            const y = this.getHeightAt(x, z);

            const crystal = new THREE.Mesh(
                new THREE.ConeGeometry(0.8, 3.2, 6),
                new THREE.MeshStandardMaterial({
                    color: this.lightColor,
                    emissive: this.lightColor,
                    emissiveIntensity: 0.9,
                    flatShading: true,
                }),
            );
            crystal.position.set(x, y + 1.4, z);
            crystal.rotation.z = (rand(i, 0) - 0.5) * 0.4;
            this.group.add(crystal);

            const light = new THREE.PointLight(this.lightColor, 280, 80, 1.8);
            light.position.set(x, y + 4, z);
            this.group.add(light);
        }
        // Dim ambient so floors are never pitch black
        this.group.add(new THREE.AmbientLight(this.fogColor, 6));
        // Light by the spawn/exit portal
        const exitLight = new THREE.PointLight(0xffffff, 120, 50, 1.8);
        exitLight.position.set(this.spawn.x, this.getHeightAt(this.spawn.x, this.spawn.z) + 4, this.spawn.z);
        this.group.add(exitLight);
    }
}

const CaveWorld = {
    /**
     * Build the chained underground zones, LH1-style descent:
     * surface → Grunnfjell → Dyplag → Underverden → Jordens kjerne.
     * Each cave has an up-portal at its spawn and a down-portal hidden at the
     * centre of a stone labyrinth (the labyrinth guards the way down).
     */
    buildAll(switchArea) {
        const areas = {};
        LH2.CAVE_ZONES.forEach((zone, idx) => {
            const cave = new CaveArea(zone, LH2.SEED + zone.tier * 7919);
            const rand = (() => {
                const noise = makeNoise2D(LH2.SEED + zone.tier * 131);
                let i = 0;
                return () => (noise(i++ * 0.7919, i * 1.317) + 1) / 2;
            })();

            // Labyrinth in the middle of the cavern; descent portal at its core
            const maze = MazeStructure.add(cave, {
                cx: 0, cz: -cave.size * 0.05,
                cellW: 7, cellH: 5,
                rand,
                wallColor: new THREE.Color(zone.fogColor).multiplyScalar(3.2).getHex(),
            });

            OreDeposits.populate(cave, rand, LH2.CAVE_ORE_NODES);
            OreDeposits.populateAt(cave, maze.rewardSpots, rand, `${zone.id}:maze`);
            OreDeposits.addElementNodes(cave, rand);

            // Up-portal at spawn: back to the area above
            const upTarget = idx === 0 ? 'surface' : LH2.CAVE_ZONES[idx - 1].id;
            const upLabel = idx === 0 ? 'Tilbake til overflaten'
                : `Opp til ${LH2.CAVE_ZONES[idx - 1].name}`;
            const upPos = { x: cave.spawn.x, y: cave.getHeightAt(cave.spawn.x, cave.spawn.z), z: cave.spawn.z + 4 };
            cave.group.add(Decorations.buildPortal(upPos, 0x88ddff));
            cave.interactables.push({
                type: 'portal',
                pos: upPos,
                getLabel: () => upLabel,
                isActive: () => true,
                onInteract: () => switchArea(upTarget, zone.id),
            });

            // Down-portal at the labyrinth core (none in the deepest zone)
            const below = LH2.CAVE_ZONES[idx + 1];
            if (below) {
                const dp = maze.centerPos;
                cave.downPortalPos = dp;
                cave.group.add(Decorations.buildPortal(dp, below.lightColor, below.name));
                const dLight = new THREE.PointLight(below.lightColor, 90, 40, 1.8);
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
