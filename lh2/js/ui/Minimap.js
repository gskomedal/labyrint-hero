// ─── Labyrint Hero 2 – Minimap ───────────────────────────────────────────────
// Canvas minimap (bottom left, M toggles). On the surface it shows the whole
// island (open world – you can see far anyway) with camp/entrance markers.
// In the caves it shows only explored tiles (fog of war), so the labyrinth
// is mapped as you walk it. Ore markers require the Malmøye skill or
// Geologi level 3 – same gate as the 3D deposit glow.

class Minimap {
    constructor(hero, player, cameraRig) {
        this.hero = hero;
        this.player = player;
        this.cameraRig = cameraRig;
        this.canvas = document.getElementById('minimap');
        this.ctx = this.canvas.getContext('2d');
        this.size = this.canvas.width;
        this._surfaceCache = null;
        this._lastDraw = 0;
        this.visible = true;

        window.addEventListener('keydown', (e) => {
            if (e.code === 'KeyM' && !LH2Main.uiOpen) {
                this.visible = !this.visible;
                this.canvas.classList.toggle('hidden', !this.visible);
            }
        });
    }

    update(area, time) {
        if (area.grid) this._explore(area);
        if (!this.visible || time - this._lastDraw < 120) return;
        this._lastDraw = time;
        if (area.grid) this._drawCave(area);
        else this._drawSurface(area);
    }

    // ── Cave fog of war ──────────────────────────────────────────────────────

    _explore(area) {
        if (!area.explored) area.explored = new Set();
        const tx = Math.floor((this.player.pos.x - area.originX) / area.tile);
        const ty = Math.floor((this.player.pos.z - area.originZ) / area.tile);
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const x = tx + dx, y = ty + dy;
                if (x < 0 || y < 0 || x >= area.tw || y >= area.th) continue;
                area.explored.add(y * area.tw + x);
            }
        }
    }

    _drawCave(area) {
        const ctx = this.ctx, S = this.size;
        ctx.fillStyle = 'rgba(8, 9, 14, 0.92)';
        ctx.fillRect(0, 0, S, S);

        const px = S / Math.max(area.tw, area.th);
        const ox = (S - area.tw * px) / 2;
        const oy = (S - area.th * px) / 2;
        const zone = new THREE.Color(area.lightColor);
        const floorCol = `rgb(${Math.round(zone.r * 120)},${Math.round(zone.g * 120)},${Math.round(zone.b * 120)})`;
        const wallCol = `rgb(${Math.round(zone.r * 50)},${Math.round(zone.g * 50)},${Math.round(zone.b * 50)})`;

        if (area.explored) {
            for (const idx of area.explored) {
                const tx = idx % area.tw, ty = Math.floor(idx / area.tw);
                ctx.fillStyle = area.grid[ty][tx] === 1 ? wallCol : floorCol;
                ctx.fillRect(ox + tx * px, oy + ty * px, px + 0.5, px + 0.5);
            }
        }

        const worldToMap = (x, z) => ({
            x: ox + ((x - area.originX) / area.tile) * px,
            y: oy + ((z - area.originZ) / area.tile) * px,
        });
        const tileExplored = (x, z) => {
            const tx = Math.floor((x - area.originX) / area.tile);
            const ty = Math.floor((z - area.originZ) / area.tile);
            return area.explored && area.explored.has(ty * area.tw + tx);
        };

        // Portals (when explored)
        for (const it of area.interactables) {
            if (it.type !== 'portal' || !tileExplored(it.pos.x, it.pos.z)) continue;
            const p = worldToMap(it.pos.x, it.pos.z);
            ctx.fillStyle = it.pos === area.downPortalPos ? '#ff8844' : '#66ddff';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Ore markers: Malmøye skill or Geologi 3+
        if (this.hero.oreMapSkill || this.hero.sciences.hasOreHighlight()) {
            for (const node of area.nodes) {
                if (node.charges <= 0 || !tileExplored(node.pos.x, node.pos.z)) continue;
                const def = node.isElement ? ELEMENTS[node.itemId]
                    : (MINERAL_DEFS[node.itemId] || FUEL_DEFS[node.itemId]);
                const p = worldToMap(node.pos.x, node.pos.z);
                ctx.fillStyle = '#' + (def.color || 0xffffff).toString(16).padStart(6, '0');
                ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
            }
        }

        this._drawPlayer(worldToMap(this.player.pos.x, this.player.pos.z));
    }

    // ── Surface ──────────────────────────────────────────────────────────────

    _drawSurface(area) {
        const ctx = this.ctx, S = this.size;
        if (!this._surfaceCache) this._surfaceCache = this._renderSurfaceCache(area);
        ctx.drawImage(this._surfaceCache, 0, 0);

        const half = LH2.WORLD_SIZE / 2;
        const worldToMap = (x, z) => ({
            x: ((x + half) / LH2.WORLD_SIZE) * S,
            y: ((z + half) / LH2.WORLD_SIZE) * S,
        });

        // Camp (smelter) + mine entrance markers
        for (const it of area.interactables) {
            let color = null;
            if (it.type === 'smelter') color = '#ffaa33';
            if (it.type === 'portal') color = '#cc9966';
            if (!color) continue;
            const p = worldToMap(it.pos.x, it.pos.z);
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3.2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Ore markers with Malmøye/Geologi 3+
        if (this.hero.oreMapSkill || this.hero.sciences.hasOreHighlight()) {
            for (const node of area.nodes) {
                if (node.charges <= 0) continue;
                const def = node.isElement ? ELEMENTS[node.itemId]
                    : (MINERAL_DEFS[node.itemId] || FUEL_DEFS[node.itemId]);
                const p = worldToMap(node.pos.x, node.pos.z);
                ctx.fillStyle = '#' + (def.color || 0xffffff).toString(16).padStart(6, '0');
                ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
            }
        }

        this._drawPlayer(worldToMap(this.player.pos.x, this.player.pos.z));
    }

    /** Render the island heightmap once to an offscreen canvas. */
    _renderSurfaceCache(area) {
        const S = this.size;
        const off = document.createElement('canvas');
        off.width = S; off.height = S;
        const ctx = off.getContext('2d');
        const img = ctx.createImageData(S, S);
        const half = LH2.WORLD_SIZE / 2;

        for (let py = 0; py < S; py++) {
            for (let pxl = 0; pxl < S; pxl++) {
                const x = (pxl / S) * LH2.WORLD_SIZE - half;
                const z = (py / S) * LH2.WORLD_SIZE - half;
                const h = area.getHeightAt(x, z);
                let r, g, b;
                if (h < LH2.MIN_WALK_HEIGHT) { r = 30; g = 60; b = 110; }
                else if (h < 1.2) { r = 160; g = 145; b = 95; }
                else if (h < 10) { r = 60; g = 110; b = 58; }
                else if (h < 19) { r = 48; g = 88; b = 50; }
                else if (h < 26) { r = 100; g = 95; b = 88; }
                else { r = 215; g = 215; b = 222; }
                const i = (py * S + pxl) * 4;
                img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = 235;
            }
        }
        ctx.putImageData(img, 0, 0);
        return off;
    }

    /** Player arrow rotated to the camera heading. */
    _drawPlayer(p) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(-this.cameraRig.yaw + Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(0, -5);
        ctx.lineTo(3.5, 4);
        ctx.lineTo(-3.5, 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}
