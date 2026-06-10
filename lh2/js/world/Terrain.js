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
        const c = new THREE.Color();

        for (let v = 0; v < pos.count; v++) {
            const x = pos.getX(v), z = pos.getZ(v);
            const h = this.getHeightAt(x, z);
            pos.setY(v, h);

            // Color by height band: sand -> grass -> rock -> snow
            if (h < 1.2)       c.setHex(0xc8b878);
            else if (h < 9)    c.setHex(0x4f8f4a);
            else if (h < 16)   c.setHex(0x3e7340);
            else if (h < 21)   c.setHex(0x77716a);
            else               c.setHex(0xe8e8ee);

            // Slight noise variation so the low-poly facets read better
            const tint = 0.92 + 0.08 * this.noise(x * 0.3, z * 0.3);
            colors[v * 3] = c.r * tint;
            colors[v * 3 + 1] = c.g * tint;
            colors[v * 3 + 2] = c.b * tint;
        }

        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geo.computeVertexNormals();

        const mat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.receiveShadow = false;
        return mesh;
    }

    _buildWater() {
        const geo = new THREE.PlaneGeometry(this.size * 2.4, this.size * 2.4);
        geo.rotateX(-Math.PI / 2);
        const mat = new THREE.MeshLambertMaterial({
            color: 0x2266aa, transparent: true, opacity: 0.85,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = LH2.WATER_LEVEL;
        return mesh;
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
