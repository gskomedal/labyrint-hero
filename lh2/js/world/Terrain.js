// ─── Labyrint Hero 2 – Surface terrain ───────────────────────────────────────
// One fixed island: heightmap from fbm simplex noise with radial falloff so
// the edges sink below the ocean. Vertex-colored low-poly aesthetic.
// getHeightAt(x, z) is the single collision primitive for everything.

class Terrain {
    constructor(noise) {
        this.size = LH2.WORLD_SIZE;
        this.segments = LH2.TERRAIN_SEGMENTS;
        this.noise = noise;

        // Precompute the height grid once; mesh and queries both use it.
        const n = this.segments + 1;
        this.grid = new Float32Array(n * n);
        for (let j = 0; j < n; j++) {
            for (let i = 0; i < n; i++) {
                const x = (i / this.segments - 0.5) * this.size;
                const z = (j / this.segments - 0.5) * this.size;
                this.grid[j * n + i] = this._computeHeight(x, z);
            }
        }

        this.group = new THREE.Group();
        this.group.add(this._buildMesh());
        this.group.add(this._buildWater());
    }

    _computeHeight(x, z) {
        const f = 1 / 130; // base noise frequency
        let h = fbm2(this.noise, x * f, z * f, 5, 2.0, 0.5);
        h = (h + 1) / 2; // -> [0, 1]
        // Ridged noise adds sharp ridges/valleys so the island isn't flat
        const ridge = 1 - Math.abs(fbm2(this.noise, x * f * 1.7 + 37, z * f * 1.7 + 37, 4, 2.1, 0.55));
        h = h * 0.6 + ridge * ridge * 0.4;
        // Radial island falloff: high in the middle, below sea level at edges
        const d = Math.sqrt(x * x + z * z) / (this.size * 0.5);
        const falloff = Math.max(0, 1 - Math.pow(d, 2.4));
        return h * LH2.TERRAIN_HEIGHT * falloff - 3.5 * Math.pow(d, 3);
    }

    /** Bilinear interpolation over the precomputed grid. */
    getHeightAt(x, z) {
        const n = this.segments + 1;
        const gx = (x / this.size + 0.5) * this.segments;
        const gz = (z / this.size + 0.5) * this.segments;
        if (gx < 0 || gz < 0 || gx >= this.segments || gz >= this.segments) {
            return -5; // off the island -> ocean floor
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

    /** Approximate slope (height delta per unit) at a point. */
    getSlopeAt(x, z) {
        const e = 1.0;
        const dx = this.getHeightAt(x + e, z) - this.getHeightAt(x - e, z);
        const dz = this.getHeightAt(x, z + e) - this.getHeightAt(x, z - e);
        return Math.sqrt(dx * dx + dz * dz) / (2 * e);
    }

    _buildMesh() {
        const geo = new THREE.PlaneGeometry(this.size, this.size, this.segments, this.segments);
        geo.rotateX(-Math.PI / 2);

        const pos = geo.attributes.position;
        const colors = new Float32Array(pos.count * 3);

        // Height bands blended smoothly + slope-based rock
        const SAND = new THREE.Color(0xd4bd84);
        const GRASS = new THREE.Color(0x55994f);
        const GRASS_D = new THREE.Color(0x3c7a42);
        const ROCK = new THREE.Color(0x7d7669);
        const SNOW = new THREE.Color(0xeceff4);
        const lerp = (a, b, t) => a.clone().lerp(b, Math.min(1, Math.max(0, t)));

        for (let v = 0; v < pos.count; v++) {
            const x = pos.getX(v), z = pos.getZ(v);
            const h = this.getHeightAt(x, z);
            pos.setY(v, h);

            let c;
            if (h < 1.0)       c = SAND.clone();
            else if (h < 3)    c = lerp(SAND, GRASS, (h - 1.0) / 2);
            else if (h < 14)   c = lerp(GRASS, GRASS_D, (h - 3) / 11);
            else if (h < 23)   c = lerp(GRASS_D, ROCK, (h - 14) / 9);
            else if (h < 29)   c = lerp(ROCK, SNOW, (h - 23) / 6);
            else               c = SNOW.clone();

            // Properly steep faces turn rocky regardless of height
            const slope = this.getSlopeAt(x, z);
            if (slope > 1.15 && h > 3) c.lerp(ROCK, Math.min(0.8, (slope - 1.15) * 1.1));

            // Slight noise variation so the low-poly facets read better
            const tint = 0.93 + 0.07 * this.noise(x * 0.3, z * 0.3);
            colors[v * 3] = c.r * tint;
            colors[v * 3 + 1] = c.g * tint;
            colors[v * 3 + 2] = c.b * tint;
        }

        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geo.computeVertexNormals();

        const mat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.receiveShadow = true;
        return mesh;
    }

    _buildWater() {
        // Animated, slightly glossy ocean (vertices waved in main loop)
        const segs = 56;
        const geo = new THREE.PlaneGeometry(this.size * 2.4, this.size * 2.4, segs, segs);
        geo.rotateX(-Math.PI / 2);
        const mat = new THREE.MeshPhongMaterial({
            color: 0x2b6f9e, transparent: true, opacity: 0.82,
            shininess: 90, specular: 0x99ccee, flatShading: true,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = LH2.WATER_LEVEL;
        this.water = mesh;
        return mesh;
    }

    /** Gentle two-directional waves; called every frame on the surface. */
    animateWater(time) {
        if (!this.water) return;
        const pos = this.water.geometry.attributes.position;
        const t = time * 0.0011;
        for (let v = 0; v < pos.count; v++) {
            const x = pos.getX(v), z = pos.getZ(v);
            pos.setY(v, Math.sin(x * 0.05 + t) * 0.22 + Math.cos(z * 0.045 + t * 0.8) * 0.18);
        }
        pos.needsUpdate = true;
        this.water.geometry.computeVertexNormals();
    }

    /** Gradient sky dome: horizon haze up to a blue zenith. */
    buildSkyDome() {
        const geo = new THREE.SphereGeometry(820, 20, 14);
        const pos = geo.attributes.position;
        const colors = new Float32Array(pos.count * 3);
        const ZENITH = new THREE.Color(0x3f7fd1);
        const HORIZON = new THREE.Color(0xd6e6f2);
        for (let v = 0; v < pos.count; v++) {
            const y = pos.getY(v) / 820; // -1..1
            const c = HORIZON.clone().lerp(ZENITH, Math.min(1, Math.max(0, y * 1.4)));
            colors[v * 3] = c.r;
            colors[v * 3 + 1] = c.g;
            colors[v * 3 + 2] = c.b;
        }
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
            vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false,
        }));
    }

    /**
     * Find a random spot matching constraints; used for placing deposits,
     * trees and portals. Returns {x, y, z} or null after maxTries.
     */
    findSpot(rand, { minH = 1.5, maxH = 99, maxSlope = 0.8, minRadius = 0, maxRadius = this.size * 0.46 } = {}) {
        for (let t = 0; t < 60; t++) {
            const ang = rand() * Math.PI * 2;
            const r = minRadius + rand() * (maxRadius - minRadius);
            const x = Math.cos(ang) * r;
            const z = Math.sin(ang) * r;
            const y = this.getHeightAt(x, z);
            if (y < minH || y > maxH) continue;
            if (this.getSlopeAt(x, z) > maxSlope) continue;
            return { x, y, z };
        }
        return null;
    }
}
