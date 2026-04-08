// ─── Labyrint Hero – Scene Backgrounds ───────────────────────────────────────
// Generates pixel art background textures via canvas, cached as Phaser textures.
// Camp and chemistry lab backgrounds rendered at pixel-art resolution then scaled.

const SceneBackgrounds = {

    /** Ensure textures are generated (idempotent). */
    generateTextures(scene) {
        if (scene.textures.exists('camp_bg')) return;
        this._generateCampTexture(scene);
        this._generateLabTexture(scene);
    },

    // ── CAMP BACKGROUND TEXTURE ──────────────────────────────────────────────

    _generateCampTexture(scene) {
        const w = 200, h = 150;
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        // Sky gradient
        const skyH = 90;
        for (let y = 0; y < skyH; y++) {
            const t = y / skyH;
            const r = Math.floor(8 + t * 4);
            const g = Math.floor(14 + t * 2);
            const b = Math.floor(32 - t * 16);
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(0, y, w, 1);
        }

        // Stars
        const stars = [[15,8],[42,15],[78,5],[110,22],[145,10],[170,30],[55,35],[130,8],[95,28],[180,18],[30,42],[160,6]];
        for (const [sx, sy] of stars) {
            const bright = (sx * 7 + sy * 13) % 3 === 0;
            ctx.fillStyle = bright ? '#ffffcc' : '#aaaaaa';
            ctx.fillRect(sx, sy, 1, 1);
            if (bright) { ctx.fillStyle = '#888866'; ctx.fillRect(sx+1, sy, 1, 1); ctx.fillRect(sx, sy+1, 1, 1); }
        }

        // Moon (upper right)
        ctx.fillStyle = '#ddeebb';
        for (let dy = -4; dy <= 4; dy++) {
            for (let dx = -4; dx <= 4; dx++) {
                if (dx*dx + dy*dy <= 16 && !(((dx+1)*(dx+1) + dy*dy) <= 9)) {
                    ctx.fillRect(170 + dx, 18 + dy, 1, 1);
                }
            }
        }

        // Mountains silhouette
        ctx.fillStyle = '#141828';
        const mts = [0,88, 20,78, 35,82, 50,72, 65,80, 80,68, 95,75, 110,70, 125,76, 140,66, 155,74, 170,78, 185,72, 200,82];
        ctx.beginPath(); ctx.moveTo(0, 90);
        for (let i = 0; i < mts.length; i += 2) ctx.lineTo(mts[i], mts[i+1]);
        ctx.lineTo(200, 90); ctx.fill();

        // Ground
        for (let y = 88; y < h; y++) {
            const t = (y - 88) / (h - 88);
            const r = Math.floor(26 + t * 8);
            const g = Math.floor(20 + t * 4);
            const b = Math.floor(8 + t * 4);
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(0, y, w, 1);
        }
        // Dirt path in center
        ctx.fillStyle = '#2a1e10';
        ctx.fillRect(70, 95, 60, 55);
        ctx.fillStyle = '#2e2214';
        ctx.fillRect(75, 98, 50, 48);

        // Pebbles
        const pebbles = [[45,105],[85,110],[120,108],[65,130],[140,115],[55,140],[155,125],[90,138]];
        for (const [px, py] of pebbles) { ctx.fillStyle = '#555550'; ctx.fillRect(px, py, 2, 1); }

        // Grass tufts along ground line
        ctx.fillStyle = '#2a5520';
        for (let x = 0; x < w; x += 7) {
            const gy = 88 + (x * 3) % 4;
            ctx.fillRect(x, gy - 3, 1, 3);
            ctx.fillRect(x + 2, gy - 4, 1, 4);
            ctx.fillRect(x + 3, gy - 2, 1, 2);
        }

        // Left pine tree
        ctx.fillStyle = '#3a2816'; ctx.fillRect(28, 60, 4, 35); // trunk
        ctx.fillStyle = '#1a3a15';
        this._pxTriangle(ctx, 30, 48, 16, 18);
        ctx.fillStyle = '#2a5520';
        this._pxTriangle(ctx, 30, 42, 14, 16);
        ctx.fillStyle = '#1a4418';
        this._pxTriangle(ctx, 30, 36, 10, 14);
        ctx.fillStyle = '#2a6625';
        this._pxTriangle(ctx, 30, 32, 8, 10);

        // Right pine tree
        ctx.fillStyle = '#3a2816'; ctx.fillRect(165, 58, 4, 37); // trunk
        ctx.fillStyle = '#1a3a15';
        this._pxTriangle(ctx, 167, 46, 18, 18);
        ctx.fillStyle = '#2a5520';
        this._pxTriangle(ctx, 167, 40, 14, 14);
        ctx.fillStyle = '#1a4418';
        this._pxTriangle(ctx, 167, 34, 10, 12);

        // Small tree far right
        ctx.fillStyle = '#2a1a0c'; ctx.fillRect(188, 68, 3, 25);
        ctx.fillStyle = '#183012';
        this._pxTriangle(ctx, 189, 58, 12, 16);
        ctx.fillStyle = '#204018';
        this._pxTriangle(ctx, 189, 52, 8, 12);

        // Tent (left of center)
        ctx.fillStyle = '#665544';
        this._pxTriangle(ctx, 58, 78, 30, 22);
        ctx.fillStyle = '#554433'; // shadow side
        ctx.beginPath(); ctx.moveTo(58, 78); ctx.lineTo(73, 100); ctx.lineTo(58, 100); ctx.fill();
        ctx.fillStyle = '#776655'; // opening
        this._pxTriangle(ctx, 58, 86, 10, 14);
        // Pole
        ctx.fillStyle = '#887766'; ctx.fillRect(57, 74, 2, 6);

        // Log seats
        ctx.fillStyle = '#4a3218'; ctx.fillRect(82, 108, 16, 4); ctx.fillRect(82, 109, 16, 2);
        ctx.fillStyle = '#4a3218'; ctx.fillRect(108, 112, 14, 4);
        // Log highlight
        ctx.fillStyle = '#5a4228'; ctx.fillRect(83, 108, 14, 1); ctx.fillRect(109, 112, 12, 1);

        // Stone ring for campfire
        ctx.fillStyle = '#556666';
        const stones = [[94,107],[98,105],[103,105],[107,107],[108,110],[106,113],[101,114],[96,114],[93,112],[92,109]];
        for (const [sx, sy] of stones) ctx.fillRect(sx, sy, 3, 2);

        // Logs in fire
        ctx.fillStyle = '#664422'; ctx.fillRect(95, 109, 12, 2);
        ctx.fillStyle = '#553318'; ctx.fillRect(98, 107, 2, 7);

        // Fire glow (warm area)
        ctx.fillStyle = 'rgba(255,100,0,0.08)';
        for (let r = 30; r > 0; r -= 5) {
            ctx.beginPath(); ctx.arc(100, 108, r, 0, Math.PI * 2); ctx.fill();
        }

        // Flames
        ctx.fillStyle = '#ff4400';
        this._pxTriangle(ctx, 100, 98, 10, 12);
        ctx.fillRect(97, 103, 8, 7);
        ctx.fillStyle = '#ff8822';
        this._pxTriangle(ctx, 100, 96, 8, 10);
        ctx.fillRect(98, 101, 6, 6);
        ctx.fillStyle = '#ffcc44';
        this._pxTriangle(ctx, 100, 95, 5, 8);
        ctx.fillRect(99, 100, 4, 4);
        ctx.fillStyle = '#ffee88';
        this._pxTriangle(ctx, 100, 94, 3, 5);
        ctx.fillRect(100, 99, 2, 3);

        // Embers
        ctx.fillStyle = '#ff6600';
        const embers = [[96,92],[104,90],[98,87],[102,85],[100,82],[95,88],[106,93]];
        for (const [ex, ey] of embers) ctx.fillRect(ex, ey, 1, 1);

        // Smoke
        ctx.fillStyle = 'rgba(120,120,120,0.15)';
        ctx.fillRect(99, 78, 3, 3); ctx.fillRect(100, 72, 4, 4);
        ctx.fillStyle = 'rgba(100,100,100,0.10)';
        ctx.fillRect(101, 64, 5, 5); ctx.fillRect(99, 55, 6, 6);

        // Ground texture (scattered dark spots)
        ctx.fillStyle = '#1a1408';
        for (let i = 0; i < 30; i++) {
            const gx = (i * 67 + 13) % w;
            const gy = 92 + (i * 41 + 7) % 55;
            ctx.fillRect(gx, gy, 1, 1);
        }

        scene.textures.addCanvas('camp_bg', c);
    },

    // ── CHEMISTRY LAB TEXTURE ────────────────────────────────────────────────

    _generateLabTexture(scene) {
        const w = 200, h = 150;
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        // Stone wall background
        ctx.fillStyle = '#1a1a22';
        ctx.fillRect(0, 0, w, h);

        // Brick/stone pattern
        const brickH = 8, brickW = 16;
        for (let row = 0; row < Math.ceil(h * 0.75 / brickH); row++) {
            const by = row * brickH;
            const offset = (row % 2) * (brickW / 2);
            ctx.fillStyle = '#111118';
            ctx.fillRect(0, by + brickH - 1, w, 1); // horizontal mortar
            for (let col = 0; col <= Math.ceil(w / brickW); col++) {
                const bx = col * brickW + offset;
                ctx.fillRect(bx, by, 1, brickH); // vertical mortar
            }
            // Random brick shade variation
            for (let col = 0; col <= Math.ceil(w / brickW); col++) {
                const bx = col * brickW + offset;
                if ((row * 7 + col * 13) % 5 === 0) {
                    ctx.fillStyle = '#1e1e28'; ctx.fillRect(bx + 2, by + 1, brickW - 4, brickH - 2);
                    ctx.fillStyle = '#1a1a22';
                }
            }
        }

        // Floor (dark tiles)
        ctx.fillStyle = '#0f0f18';
        ctx.fillRect(0, 110, w, 40);
        ctx.fillStyle = '#121220';
        for (let x = 0; x < w; x += 20) {
            ctx.fillRect(x, 110, 1, 40); // tile lines
        }
        ctx.fillStyle = '#0d0d16';
        ctx.fillRect(0, 110, w, 1);

        // Lab bench (main surface)
        ctx.fillStyle = '#332211'; ctx.fillRect(20, 100, 160, 14);
        ctx.fillStyle = '#443322'; ctx.fillRect(20, 100, 160, 2); // top edge
        ctx.fillStyle = '#2a1a0a'; ctx.fillRect(20, 112, 160, 2); // bottom edge
        // Bench legs
        ctx.fillStyle = '#2a1a0a';
        ctx.fillRect(25, 114, 4, 20); ctx.fillRect(60, 114, 4, 20);
        ctx.fillRect(135, 114, 4, 20); ctx.fillRect(170, 114, 4, 20);

        // Left shelf
        ctx.fillStyle = '#443322';
        ctx.fillRect(5, 30, 35, 2); ctx.fillRect(5, 55, 35, 2); ctx.fillRect(5, 78, 35, 2);
        // Shelf brackets
        ctx.fillStyle = '#332211';
        ctx.fillRect(8, 30, 2, 5); ctx.fillRect(35, 30, 2, 5);
        ctx.fillRect(8, 55, 2, 5); ctx.fillRect(35, 55, 2, 5);

        // Bottles on left shelves
        const bottleData = [
            [10, 24, 4, 6, '#33dd88'], [18, 22, 3, 8, '#4488ff'], [26, 25, 4, 5, '#ddaa44'],
            [12, 48, 3, 7, '#8844aa'], [20, 49, 4, 6, '#dd6644'], [30, 50, 3, 5, '#4488ff'],
            [10, 72, 4, 6, '#ddaa44'], [20, 71, 3, 7, '#33dd88'], [28, 73, 4, 5, '#8844aa'],
        ];
        for (const [bx, by, bw, bh, col] of bottleData) {
            ctx.fillStyle = col; ctx.fillRect(bx, by, bw, bh);
            ctx.fillStyle = col; ctx.fillRect(bx + 1, by - 2, bw - 2, 2); // neck
            ctx.fillStyle = '#ffffff22'; ctx.fillRect(bx, by, 1, bh); // glass highlight
        }

        // Right shelf
        ctx.fillStyle = '#443322';
        ctx.fillRect(160, 35, 35, 2); ctx.fillRect(160, 60, 35, 2);
        // Bottles on right shelf
        const rBottles = [
            [165, 29, 3, 6, '#33dd88'], [172, 27, 4, 8, '#dd6644'], [180, 30, 3, 5, '#4488ff'],
            [165, 54, 4, 6, '#ddaa44'], [174, 52, 3, 8, '#8844aa'],
        ];
        for (const [bx, by, bw, bh, col] of rBottles) {
            ctx.fillStyle = col; ctx.fillRect(bx, by, bw, bh);
            ctx.fillStyle = col; ctx.fillRect(bx + 1, by - 2, bw - 2, 2);
        }

        // Books on shelf
        ctx.fillStyle = '#663322'; ctx.fillRect(182, 55, 8, 5);
        ctx.fillStyle = '#224466'; ctx.fillRect(183, 56, 2, 4);
        ctx.fillStyle = '#884422'; ctx.fillRect(186, 56, 2, 4);

        // Erlenmeyer flask (left-center on bench)
        const eX = 55, eY = 100;
        ctx.fillStyle = '#334455';
        this._pxTriangle(ctx, eX, eY - 20, 18, 20); // body
        ctx.fillRect(eX - 2, eY - 28, 4, 10); // neck
        // Liquid inside
        ctx.fillStyle = '#33dd88';
        this._pxTriangle(ctx, eX, eY - 8, 14, 8); // partial fill
        // Glass highlight
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(eX - 6, eY - 16, 1, 10);

        // Bunsen burner under flask
        ctx.fillStyle = '#888888'; ctx.fillRect(eX - 2, eY, 4, 4);
        ctx.fillStyle = '#4488ff'; // blue flame
        this._pxTriangle(ctx, eX, eY - 2, 4, 3);

        // Round-bottom flask (center on bench)
        const rfX = 100, rfY = 90;
        ctx.fillStyle = '#334455';
        // Circle approximation
        for (let dy = -7; dy <= 7; dy++) {
            for (let dx = -7; dx <= 7; dx++) {
                if (dx*dx + dy*dy <= 49) ctx.fillRect(rfX + dx, rfY + dy, 1, 1);
            }
        }
        ctx.fillRect(rfX - 2, rfY - 14, 4, 8); // neck
        // Blue liquid lower half
        ctx.fillStyle = '#4488ff';
        for (let dy = 0; dy <= 7; dy++) {
            for (let dx = -7; dx <= 7; dx++) {
                if (dx*dx + dy*dy <= 45) ctx.fillRect(rfX + dx, rfY + dy, 1, 1);
            }
        }
        // Glass highlight
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(rfX - 5, rfY - 4, 1, 6);

        // Condenser / connecting tube
        ctx.strokeStyle = '#667777'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(eX + 2, eY - 26); ctx.lineTo(rfX - 2, rfY - 12); ctx.stroke();
        // Coil between
        ctx.strokeStyle = '#556666';
        for (let i = 0; i < 4; i++) {
            const cx = eX + 12 + i * 6;
            const cy = eY - 26 + i * 2;
            ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI, false); ctx.stroke();
        }

        // Test tube rack (right side of bench)
        ctx.fillStyle = '#443322'; ctx.fillRect(135, 95, 30, 3); // rack bar
        ctx.fillRect(137, 90, 2, 5); ctx.fillRect(162, 90, 2, 5); // supports
        const tubeColors = ['#33dd88', '#ddaa44', '#ff6688', '#4488ff', '#8844aa'];
        for (let i = 0; i < 5; i++) {
            const tx = 139 + i * 5;
            ctx.fillStyle = '#334455'; ctx.fillRect(tx, 78, 3, 17); // glass
            ctx.fillStyle = tubeColors[i]; ctx.fillRect(tx, 88 - i % 2 * 3, 3, 7 + i % 2 * 3); // liquid
            ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(tx, 78, 1, 17); // highlight
        }

        // Periodic table on wall (upper right)
        const ptX = 155, ptY = 12;
        ctx.fillStyle = '#222230'; ctx.fillRect(ptX - 1, ptY - 1, 38, 22); // background
        const ptColors = ['#ff6666','#66aaff','#66ff88','#ffdd44','#cc88ff','#ff9944','#88ddff'];
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 5; col++) {
                ctx.fillStyle = ptColors[(row * 5 + col) % ptColors.length];
                ctx.globalAlpha = 0.4;
                ctx.fillRect(ptX + col * 7, ptY + row * 7, 5, 5);
                ctx.globalAlpha = 1.0;
            }
        }

        // Bubbles above flasks
        ctx.fillStyle = '#88ffcc';
        const bubbles = [[eX-1,eY-32,2],[eX+2,eY-38,1],[rfX+1,rfY-18,2],[rfX-2,rfY-22,1],[eX,eY-44,1]];
        for (const [bx,by,br] of bubbles) {
            ctx.globalAlpha = 0.35;
            ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1.0;

        // Green ambient glow
        ctx.fillStyle = 'rgba(50,220,130,0.03)';
        ctx.fillRect(30, 70, 140, 40);

        // Dripping liquid
        ctx.fillStyle = '#33dd88';
        ctx.globalAlpha = 0.5;
        ctx.fillRect(45, 115, 1, 2); ctx.fillRect(130, 117, 1, 3);
        ctx.globalAlpha = 1.0;

        // Steam
        ctx.fillStyle = 'rgba(130,255,170,0.08)';
        ctx.fillRect(eX - 3, eY - 48, 6, 6);
        ctx.fillRect(rfX - 2, rfY - 24, 5, 5);

        scene.textures.addCanvas('chemlab_bg', c);
    },

    // ── Pixel art triangle helper ────────────────────────────────────────────
    _pxTriangle(ctx, cx, topY, baseW, h) {
        for (let row = 0; row < h; row++) {
            const t = row / h;
            const rowW = Math.max(1, Math.round(baseW * t));
            ctx.fillRect(Math.round(cx - rowW / 2), topY + row, rowW, 1);
        }
    },

    // ── Add background image to scene ────────────────────────────────────────

    addCampBackground(scene, px, py, panelW, panelH) {
        this.generateTextures(scene);
        const img = scene.add.image(px + panelW / 2, py + panelH / 2, 'camp_bg');
        img.setDisplaySize(panelW, panelH);
        img.setAlpha(0.45);
        return img;
    },

    addLabBackground(scene, px, py, panelW, panelH) {
        this.generateTextures(scene);
        const img = scene.add.image(px + panelW / 2, py + panelH / 2, 'chemlab_bg');
        img.setDisplaySize(panelW, panelH);
        img.setAlpha(0.45);
        return img;
    },

    // ── Legacy fallback methods ──────────────────────────────────────────────
    drawCampBackground(g, px, py, w, h) {
        // Fallback: simple dim overlay if textures not available
        g.fillStyle(0x120a04, 0.1);
        g.fillRect(px, py, w, h);
    },
    drawChemLabBackground(g, px, py, w, h) {
        g.fillStyle(0x081810, 0.1);
        g.fillRect(px, py, w, h);
    }
};
