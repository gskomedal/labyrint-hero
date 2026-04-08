// ─── Labyrint Hero – Scene Backgrounds ───────────────────────────────────────
// Procedural atmospheric backgrounds for overlay menu scenes.
// Drawn once behind UI content at low opacity to avoid overpowering text/buttons.

const SceneBackgrounds = {

    /**
     * Draw a camp scene background inside the given panel area.
     * Features: night sky with stars, trees, tent, campfire, smoke, grass.
     */
    drawCampBackground(g, px, py, w, h) {
        const cx = px + w / 2;
        const cy = py + h / 2;

        // ── 1. Sky gradient (upper 40%) ──
        const skyH = h * 0.4;
        const skyBands = 6;
        const skyColors = [0x0a1828, 0x091520, 0x081218, 0x070f14, 0x060c10, 0x060810];
        for (let i = 0; i < skyBands; i++) {
            const bandAlpha = 0.3 - (i / skyBands) * 0.15;
            g.fillStyle(skyColors[i], bandAlpha);
            g.fillRect(px, py + (skyH / skyBands) * i, w, skyH / skyBands + 1);
        }

        // ── 2. Stars (upper 30%) ──
        const starCount = 10;
        for (let i = 0; i < starCount; i++) {
            const sx = px + (i * 137 + 51) % w;
            const sy = py + (i * 89 + 23) % (h * 0.3);
            const size = (i % 2 === 0) ? 1 : 2;
            const starAlpha = 0.15 + ((i * 47) % 16) / 100;
            g.fillStyle(0xffffff, starAlpha);
            g.fillRect(sx, sy, size, size);
        }

        // ── 3. Ground (lower 35%) ──
        const groundTop = py + h * 0.65;
        const groundH = h * 0.35;
        const groundBands = 5;
        const groundColors = [0x2a1a0a, 0x261808, 0x221609, 0x1e1208, 0x1a1008];
        for (let i = 0; i < groundBands; i++) {
            const bandAlpha = 0.2 + (i / groundBands) * 0.1;
            g.fillStyle(groundColors[i], bandAlpha);
            g.fillRect(px, groundTop + (groundH / groundBands) * i, w, groundH / groundBands + 1);
        }
        // Pebbles on the ground
        for (let i = 0; i < 12; i++) {
            const pebX = px + (i * 173 + 67) % w;
            const pebY = groundTop + 10 + (i * 59 + 31) % (groundH - 15);
            const pebSize = 2 + (i % 2);
            g.fillStyle(0x888888, 0.15);
            g.fillRect(pebX, pebY, pebSize, pebSize);
        }

        // ── 4. Trees (left and right edges) ──
        // Left tree
        const ltx = px + 15;
        const ltTop = py + h * 0.3;
        const ltBot = py + h * 0.7;
        g.fillStyle(0x553322, 0.15);
        g.fillRect(ltx - 3, ltTop, 6, ltBot - ltTop);
        // Crown: overlapping green triangles
        g.fillStyle(0x225522, 0.15);
        g.fillTriangle(ltx, ltTop - 40, ltx - 22, ltTop + 5, ltx + 22, ltTop + 5);
        g.fillStyle(0x2a6622, 0.14);
        g.fillTriangle(ltx, ltTop - 25, ltx - 18, ltTop + 15, ltx + 18, ltTop + 15);
        g.fillStyle(0x225522, 0.12);
        g.fillTriangle(ltx, ltTop - 10, ltx - 15, ltTop + 25, ltx + 15, ltTop + 25);

        // Right tree
        const rtx = px + w - 25;
        const rtTop = py + h * 0.32;
        const rtBot = py + h * 0.68;
        g.fillStyle(0x553322, 0.12);
        g.fillRect(rtx - 3, rtTop, 6, rtBot - rtTop);
        g.fillStyle(0x225522, 0.12);
        g.fillTriangle(rtx, rtTop - 35, rtx - 20, rtTop + 5, rtx + 20, rtTop + 5);
        g.fillStyle(0x2a6622, 0.11);
        g.fillTriangle(rtx, rtTop - 20, rtx - 16, rtTop + 15, rtx + 16, rtTop + 15);

        // ── 5. Tent (upper-left area) ──
        const tentX = px + 60;
        const tentY = py + h * 0.25;
        const tentW = 50;
        const tentH = 40;
        // Main tent triangle
        g.fillStyle(0x554433, 0.18);
        g.fillTriangle(
            tentX, tentY,
            tentX - tentW / 2, tentY + tentH,
            tentX + tentW / 2, tentY + tentH
        );
        // Shadow on right side
        g.fillStyle(0x332211, 0.12);
        g.fillTriangle(
            tentX, tentY,
            tentX + 4, tentY + tentH,
            tentX + tentW / 2, tentY + tentH
        );
        // Pole
        g.fillStyle(0x665544, 0.18);
        g.fillRect(tentX - 1, tentY - 6, 2, 8);
        // Opening (lighter cutout)
        g.fillStyle(0x776655, 0.08);
        g.fillTriangle(
            tentX, tentY + 12,
            tentX - 8, tentY + tentH,
            tentX + 8, tentY + tentH
        );

        // ── 6. Campfire (center-bottom) ──
        const fireX = cx;
        const fireY = py + h * 0.72;

        // Glow
        g.fillStyle(0xff6622, 0.04);
        g.fillCircle(fireX, fireY, 60);

        // Stone ring (6 stones in a rough oval)
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const sx = fireX + Math.cos(angle) * 18;
            const sy = fireY + Math.sin(angle) * 10;
            g.fillStyle(0x556666, 0.2);
            g.fillRect(sx - 2, sy - 2, 4, 3);
        }

        // Logs: two crossed brown rects
        g.fillStyle(0x664422, 0.2);
        g.fillRect(fireX - 14, fireY - 1, 28, 3);
        g.fillStyle(0x664422, 0.2);
        g.fillRect(fireX - 10, fireY - 5, 3, 12);

        // Flames: outer
        g.fillStyle(0xff4400, 0.12);
        g.fillTriangle(fireX - 10, fireY, fireX + 10, fireY, fireX, fireY - 22);
        g.fillRect(fireX - 6, fireY - 8, 12, 8);
        // Flames: mid
        g.fillStyle(0xff8822, 0.15);
        g.fillTriangle(fireX - 6, fireY - 2, fireX + 6, fireY - 2, fireX + 2, fireY - 18);
        g.fillRect(fireX - 4, fireY - 6, 8, 6);
        // Flames: inner
        g.fillStyle(0xffcc44, 0.18);
        g.fillTriangle(fireX - 3, fireY - 4, fireX + 3, fireY - 4, fireX, fireY - 14);
        g.fillRect(fireX - 2, fireY - 6, 4, 4);

        // Embers above flames
        for (let i = 0; i < 6; i++) {
            const ex = fireX - 8 + (i * 53 + 17) % 16;
            const ey = fireY - 24 - (i * 37 + 11) % 20;
            g.fillStyle(0xff4400, 0.15);
            g.fillRect(ex, ey, 1, 1);
        }

        // ── 7. Smoke wisps (above fire) ──
        const smokeX = fireX + 2;
        for (let i = 0; i < 4; i++) {
            const smokeY = fireY - 30 - i * 18;
            const smokeR = 6 + i * 4;
            const smokeAlpha = 0.06 - i * 0.005;
            g.fillStyle(0x888888, Math.max(smokeAlpha, 0.04));
            g.fillCircle(smokeX + (i % 2 === 0 ? -3 : 3), smokeY, smokeR);
        }

        // ── 8. Grass tufts (along ground line) ──
        for (let i = 0; i < 14; i++) {
            const grassX = px + (i * 97 + 29) % w;
            const grassY = groundTop;
            g.lineStyle(1, 0x336633, 0.12);
            g.lineBetween(grassX, grassY, grassX - 2, grassY - 6 - (i % 3) * 2);
            g.lineBetween(grassX + 3, grassY, grassX + 5, grassY - 5 - (i % 2) * 3);
        }
    },

    /**
     * Draw a chemistry laboratory background inside the given panel area.
     * Features: brick wall, lab bench, shelves, flasks, test tubes, bubbles.
     */
    drawChemLabBackground(g, px, py, w, h) {
        const cx = px + w / 2;
        const cy = py + h / 2;

        // ── 1. Brick wall hint (upper 60%) ──
        const wallH = h * 0.6;
        const brickH = 12;
        const brickW = 30;
        for (let row = 0; row < Math.ceil(wallH / brickH); row++) {
            const rowY = py + row * brickH;
            // Horizontal mortar line
            g.lineStyle(1, 0x332222, 0.06);
            g.lineBetween(px, rowY, px + w, rowY);
            // Vertical mortar lines offset by row
            const offset = (row % 2 === 0) ? 0 : brickW / 2;
            for (let col = 0; col < Math.ceil(w / brickW) + 1; col++) {
                const bx = px + col * brickW + offset;
                if (bx >= px && bx <= px + w) {
                    g.lineBetween(bx, rowY, bx, rowY + brickH);
                }
            }
        }

        // ── 2. Lab bench (lower 25%) ──
        const benchW = w * 0.8;
        const benchH = h * 0.25;
        const benchX = px + (w - benchW) / 2;
        const benchY = py + h * 0.75;
        // Main surface
        g.fillStyle(0x332211, 0.25);
        g.fillRect(benchX, benchY, benchW, benchH);
        // Lighter top edge
        g.fillStyle(0x443322, 0.2);
        g.fillRect(benchX, benchY, benchW, 4);

        // ── 3. Shelves (left and right edges) ──
        const shelfW = 55;
        const shelfPositions = [0.25, 0.4, 0.55];

        // Left shelves
        for (let i = 0; i < 3; i++) {
            const shelfY = py + h * shelfPositions[i];
            g.fillStyle(0x443322, 0.15);
            g.fillRect(px + 5, shelfY, shelfW, 3);

            // Bottles on shelf
            const bottleColors = [0x33dd88, 0x4488ff, 0xddaa44];
            for (let b = 0; b < 2; b++) {
                const bx = px + 12 + b * 18;
                const bh = 5 + (i + b) % 3 * 2;
                g.fillStyle(bottleColors[(i + b) % 3], 0.12);
                g.fillRect(bx, shelfY - bh, 6, bh);
                // Bottle neck
                g.fillRect(bx + 1, shelfY - bh - 3, 4, 3);
            }
        }

        // Right shelves
        for (let i = 0; i < 2; i++) {
            const shelfY = py + h * shelfPositions[i];
            g.fillStyle(0x443322, 0.15);
            g.fillRect(px + w - shelfW - 5, shelfY, shelfW, 3);

            // Bottles on shelf
            const bottleColors = [0x8844aa, 0xddaa44, 0x4488ff];
            for (let b = 0; b < 2; b++) {
                const bx = px + w - shelfW + 5 + b * 20;
                const bh = 6 + (i + b) % 2 * 2;
                g.fillStyle(bottleColors[(i + b) % 3], 0.12);
                g.fillRect(bx, shelfY - bh, 6, bh);
                g.fillRect(bx + 1, shelfY - bh - 3, 4, 3);
            }
        }

        // ── 4. Erlenmeyer flask (on bench, left-center) ──
        const erlX = cx - 50;
        const erlY = benchY;
        const erlW = 30;
        const erlH = 32;
        // Triangle body
        g.fillStyle(0x225533, 0.15);
        g.fillTriangle(
            erlX, erlY - erlH,
            erlX - erlW / 2, erlY,
            erlX + erlW / 2, erlY
        );
        // Neck
        g.fillStyle(0x225533, 0.12);
        g.fillRect(erlX - 3, erlY - erlH - 12, 6, 14);
        // Liquid fill (partial height)
        g.fillStyle(0x33dd88, 0.12);
        g.fillTriangle(
            erlX - 4, erlY - 10,
            erlX - erlW / 2 + 3, erlY,
            erlX + erlW / 2 - 3, erlY
        );

        // ── 5. Round flask (on bench, right-center) ──
        const rfX = cx + 45;
        const rfY = benchY - 14;
        const rfR = 14;
        // Flask body
        g.fillStyle(0x223344, 0.12);
        g.fillCircle(rfX, rfY, rfR);
        // Neck
        g.fillStyle(0x223344, 0.10);
        g.fillRect(rfX - 3, rfY - rfR - 10, 6, 12);
        // Liquid in lower half
        g.fillStyle(0x4488ff, 0.10);
        g.fillCircle(rfX, rfY + 3, rfR - 3);

        // ── 6. Test tubes (on bench, right side) ──
        const ttBaseX = cx + 90;
        const ttBaseY = benchY;
        const tubeColors = [0x33dd88, 0xddaa44, 0xff6688, 0x4488ff];
        // Rack
        g.fillStyle(0x443322, 0.15);
        g.fillRect(ttBaseX - 8, ttBaseY - 4, 40, 4);
        // Tubes
        for (let i = 0; i < 4; i++) {
            const tx = ttBaseX + i * 9;
            const tubeH = 22 + (i % 2) * 4;
            // Glass tube
            g.fillStyle(0x334455, 0.12);
            g.fillRect(tx, ttBaseY - tubeH, 5, tubeH);
            // Colored liquid bottom
            g.fillStyle(tubeColors[i], 0.15);
            g.fillRect(tx, ttBaseY - 8 - (i % 3) * 3, 5, 8 + (i % 3) * 3);
        }

        // ── 7. Connecting tubes between flasks ──
        g.lineStyle(1, 0x556666, 0.08);
        // From erlenmeyer neck to round flask neck
        g.lineBetween(erlX + 3, erlY - erlH - 10, rfX - 3, rfY - rfR - 8);
        // From round flask neck upward and across
        g.lineBetween(rfX + 3, rfY - rfR - 8, rfX + 20, rfY - rfR - 16);
        g.lineBetween(rfX + 20, rfY - rfR - 16, ttBaseX - 2, ttBaseY - 20);

        // ── 8. Bubbles above flasks ──
        const bubblePositions = [
            { x: erlX, y: erlY - erlH - 16, r: 2 },
            { x: erlX + 3, y: erlY - erlH - 24, r: 3 },
            { x: rfX - 2, y: rfY - rfR - 14, r: 2 },
            { x: rfX + 1, y: rfY - rfR - 22, r: 2.5 },
            { x: erlX - 2, y: erlY - erlH - 32, r: 1.5 },
        ];
        for (const bub of bubblePositions) {
            const bubAlpha = 0.06 + (bub.r / 10);
            g.fillStyle(0x88ffcc, bubAlpha);
            g.fillCircle(bub.x, bub.y, bub.r);
        }

        // ── 9. Periodic table hint (upper right area) ──
        const ptX = px + w - 65;
        const ptY = py + 20;
        const cellW = 8;
        const cellH = 6;
        const ptColors = [
            [0xff6666, 0x66aaff, 0x66ff88, 0xffdd44],
            [0xff6666, 0xffdd44, 0x66aaff, 0xcc88ff],
            [0x66ff88, 0xff6666, 0xffdd44, 0x66aaff],
        ];
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 4; col++) {
                const alpha = 0.06 + ((row + col) % 3) * 0.01;
                g.fillStyle(ptColors[row][col], alpha);
                g.fillRect(ptX + col * (cellW + 2), ptY + row * (cellH + 2), cellW, cellH);
            }
        }

        // ── 10. Steam/fumes above heated flask ──
        g.fillStyle(0x88ffaa, 0.04);
        g.fillCircle(erlX - 4, erlY - erlH - 40, 8);
        g.fillCircle(erlX + 5, erlY - erlH - 52, 10);
        g.fillCircle(rfX + 2, rfY - rfR - 30, 7);

        // ── 11. Dripping liquid below bench edge ──
        g.fillStyle(0x33dd88, 0.08);
        g.fillCircle(benchX + 30, benchY + benchH + 4, 2);
        g.fillCircle(benchX + benchW - 45, benchY + benchH + 6, 2.5);
    }
};
