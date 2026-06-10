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

            const light = new THREE.PointLight(this.lightColor, 220, 70, 1.8);
            light.position.set(x, y + 4, z);
            this.group.add(light);
        }
        // Dim ambient so floors are never pitch black
        this.group.add(new THREE.AmbientLight(this.fogColor, 3.5));
        // Light by the spawn/exit portal
        const exitLight = new THREE.PointLight(0xffffff, 120, 50, 1.8);
        exitLight.position.set(this.spawn.x, this.getHeightAt(this.spawn.x, this.spawn.z) + 4, this.spawn.z);
        this.group.add(exitLight);
    }
}

const CaveWorld = {
    /** Build all cave areas, their deposits, and exit portals. */
    buildAll(switchArea) {
        const areas = {};
        for (const zone of LH2.CAVE_ZONES) {
            const cave = new CaveArea(zone, LH2.SEED + zone.tier * 7919);
            const rand = (() => {
                const noise = makeNoise2D(LH2.SEED + zone.tier * 131);
                let i = 0;
                return () => (noise(i++ * 0.7919, i * 1.317) + 1) / 2;
            })();

            OreDeposits.populate(cave, rand, 20);

            // Exit portal back to the surface
            const exitPos = { x: cave.spawn.x, y: cave.getHeightAt(cave.spawn.x, cave.spawn.z), z: cave.spawn.z + 4 };
            cave.group.add(Decorations.buildPortal(exitPos, 0x88ddff));
            cave.interactables.push({
                type: 'portal',
                pos: exitPos,
                getLabel: () => 'Trykk [E] – Tilbake til overflaten',
                isActive: () => true,
                onInteract: () => switchArea('surface', zone.id),
            });

            areas[zone.id] = cave;
        }
        return areas;
    },

    /** Place cave entrance portals on the surface terrain. */
    addSurfaceEntrances(surface, switchArea) {
        const rand = (() => {
            const noise = makeNoise2D(LH2.SEED + 4242);
            let i = 0;
            return () => (noise(i++ * 0.7919, i * 1.317) + 1) / 2;
        })();

        surface.entrancePos = {};
        LH2.CAVE_ZONES.forEach((zone, idx) => {
            // One entrance per quadrant, on rocky elevated ground
            const baseAng = (idx / LH2.CAVE_ZONES.length) * Math.PI * 2 + Math.PI / 4;
            let spot = null;
            for (let t = 0; t < 40 && !spot; t++) {
                const ang = baseAng + (rand() - 0.5) * 0.9;
                const r = 60 + rand() * 90;
                const x = Math.cos(ang) * r, z = Math.sin(ang) * r;
                const y = surface.getHeightAt(x, z);
                if (y > 4 && surface.getSlopeAt(x, z) < 0.8) spot = { x, y, z };
            }
            if (!spot) spot = { x: Math.cos(baseAng) * 50, y: surface.getHeightAt(Math.cos(baseAng) * 50, Math.sin(baseAng) * 50), z: Math.sin(baseAng) * 50 };

            surface.entrancePos[zone.id] = spot;
            surface.group.add(Decorations.buildPortal(spot, zone.lightColor, zone.name));
            surface.interactables.push({
                type: 'portal',
                pos: spot,
                getLabel: () => `Trykk [E] – Gå ned i ${zone.name} (Tier ${zone.tier})`,
                isActive: () => true,
                onInteract: () => switchArea(zone.id, null),
            });
        });
    },
};
