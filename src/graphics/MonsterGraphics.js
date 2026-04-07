// ─── Labyrint Hero – Monster Graphics ────────────────────────────────────────
// Extracted from Monster.js – procedural sprite drawing for each monster type.

const MonsterGraphics = {

    // ── Goblin ─────────────────────────────────────────────────────────────────
    drawGoblin(g, s) {
        const cx = s >> 1;

        g.fillStyle(0x000000, 0.32);
        g.fillEllipse(cx + 1, 31, 20, 6);

        g.fillStyle(0x2a6615);
        g.fillRect(cx - 6, 22, 4, 8);
        g.fillRect(cx + 2, 22, 4, 8);
        g.fillStyle(0x1a4a0a);
        g.fillRect(cx - 8, 27, 6, 4);
        g.fillRect(cx + 2, 27, 6, 4);

        g.fillStyle(0x44aa33);
        g.fillRoundedRect(cx - 7, 15, 14, 10, 2);
        g.fillStyle(0x553300);
        g.fillRect(cx - 7, 21, 14, 2);
        g.fillStyle(0xcc9922);
        g.fillRect(cx - 2, 21, 4, 3);

        g.fillStyle(0x3a9928);
        g.fillRoundedRect(cx - 13, 15, 7, 8, 2);
        g.fillRoundedRect(cx + 6,  15, 7, 8, 2);
        g.fillStyle(0x99bb55);
        g.fillTriangle(cx - 13, 22, cx - 15, 26, cx - 10, 22);
        g.fillTriangle(cx + 13, 22, cx + 15, 26, cx + 10, 22);

        g.fillStyle(0x55cc44);
        g.fillRoundedRect(cx - 8, 5, 16, 13, 3);
        g.fillStyle(0x3a9928);
        g.fillRect(cx - 8, 5, 16, 3);

        g.fillStyle(0x33991e);
        g.fillTriangle(cx - 8, 9, cx - 14, 3, cx - 3, 14);
        g.fillTriangle(cx + 8, 9, cx + 14, 3, cx + 3, 14);

        g.fillStyle(0xffee22);
        g.fillRect(cx - 7, 9, 5, 4);
        g.fillRect(cx + 2, 9, 5, 4);
        g.fillStyle(0x000000);
        g.fillRect(cx - 5, 9, 1, 4);
        g.fillRect(cx + 4, 9, 1, 4);

        g.fillStyle(0x2d7a10);
        g.fillRect(cx - 2, 13, 2, 2);
        g.fillRect(cx + 1, 13, 2, 2);

        g.fillStyle(0x110800);
        g.fillRect(cx - 5, 15, 10, 3);
        g.fillStyle(0xddddaa);
        g.fillRect(cx - 5, 14, 2, 2);
        g.fillRect(cx - 2, 14, 2, 2);
        g.fillRect(cx + 1, 14, 2, 2);
        g.fillRect(cx + 3, 14, 2, 2);
        g.fillRect(cx - 1, 18, 2, 2);
    },

    // ── Orc ────────────────────────────────────────────────────────────────────
    drawOrc(g, s) {
        const cx = s >> 1;

        g.fillStyle(0x000000, 0.38);
        g.fillEllipse(cx + 1, 31, 24, 7);

        g.fillStyle(0x556633);
        g.fillRect(cx - 8, 20, 7, 10);
        g.fillRect(cx + 1, 20, 7, 10);
        g.fillStyle(0x332211);
        g.fillRect(cx - 9, 26, 9, 5);
        g.fillRect(cx, 26, 9, 5);

        g.fillStyle(0x7a9944);
        g.fillRoundedRect(cx - 11, 12, 22, 11, 2);
        g.fillStyle(0x6a8833);
        g.fillRect(cx - 8, 12, 16, 3);
        g.fillStyle(0x8aaa55);
        g.fillRect(cx - 7, 13, 14, 2);
        g.fillStyle(0xcc9922);
        g.fillRect(cx - 2, 18, 4, 3);

        g.fillStyle(0x7a9944);
        g.fillRoundedRect(cx - 17, 12, 8, 11, 2);
        g.fillRoundedRect(cx + 9,  12, 8, 11, 2);
        g.fillStyle(0x6a8833);
        g.fillCircle(cx - 13, 24, 4);
        g.fillCircle(cx + 13, 24, 4);
        g.fillStyle(0x8aaa55);
        g.fillRect(cx - 16, 22, 2, 2);
        g.fillRect(cx + 14, 22, 2, 2);

        g.fillStyle(0x889955);
        g.fillRoundedRect(cx - 9, 4, 18, 11, 2);
        g.fillStyle(0x445522);
        g.fillRect(cx - 9, 4, 18, 3);
        g.fillStyle(0x556633);
        g.fillRect(cx - 7, 5, 14, 1);

        g.fillStyle(0xff4411);
        g.fillRect(cx - 7, 7, 5, 4);
        g.fillRect(cx + 2, 7, 5, 4);
        g.fillStyle(0x220000);
        g.fillRect(cx - 6, 8, 3, 2);
        g.fillRect(cx + 3, 8, 3, 2);
        g.fillStyle(0x1a3310);
        g.fillRect(cx - 7, 6, 4, 1);
        g.fillRect(cx + 4, 6, 4, 1);

        g.fillStyle(0x5a7733);
        g.fillRect(cx - 3, 11, 6, 3);
        g.fillStyle(0x3a5520);
        g.fillRect(cx - 2, 13, 2, 1);
        g.fillRect(cx + 1, 13, 2, 1);

        g.fillStyle(0x223311);
        g.fillRect(cx - 5, 14, 10, 2);
        g.fillStyle(0xeeeebb);
        g.fillTriangle(cx - 4, 14, cx - 6, 20, cx - 2, 14);
        g.fillTriangle(cx + 4, 14, cx + 6, 20, cx + 2, 14);
    },

    // ── Troll ──────────────────────────────────────────────────────────────────
    drawTroll(g, s) {
        const cx = s >> 1;

        g.fillStyle(0x000000, 0.42);
        g.fillEllipse(cx + 1, 31, 28, 8);

        g.fillStyle(0x665544);
        g.fillRect(cx - 7, 24, 6, 7);
        g.fillRect(cx + 1, 24, 6, 7);

        g.fillStyle(0x997755);
        g.fillRoundedRect(cx - 12, 10, 24, 15, 3);
        g.fillStyle(0xaa8866);
        g.fillRect(cx - 8, 10, 16, 4);
        g.fillStyle(0x775533);
        g.fillRect(cx - 5, 21, 10, 1);

        g.fillStyle(0x886644);
        g.fillRoundedRect(cx - 18, 10, 8, 16, 2);
        g.fillRoundedRect(cx + 10, 10, 8, 16, 2);
        g.fillStyle(0x775533);
        g.fillRoundedRect(cx - 19, 25, 9, 6, 2);
        g.fillRoundedRect(cx + 10, 25, 9, 6, 2);
        g.fillStyle(0x664422);
        g.fillRect(cx - 19, 24, 2, 3);
        g.fillRect(cx - 16, 24, 2, 3);
        g.fillRect(cx + 17, 24, 2, 3);
        g.fillRect(cx + 14, 24, 2, 3);

        g.fillStyle(0xaa8866);
        g.fillRoundedRect(cx - 11, 3, 22, 11, 3);
        g.fillStyle(0x997755);
        g.fillCircle(cx - 5, 5, 3);
        g.fillCircle(cx,     4, 3);
        g.fillCircle(cx + 5, 5, 3);

        g.fillStyle(0x553300);
        g.fillRect(cx - 8, 8, 5, 4);
        g.fillRect(cx + 3, 8, 5, 4);
        g.fillStyle(0xcc8833);
        g.fillRect(cx - 7, 9, 3, 2);
        g.fillRect(cx + 4, 9, 3, 2);
        g.fillStyle(0x111100);
        g.fillRect(cx - 6, 10, 1, 1);
        g.fillRect(cx + 5, 10, 1, 1);

        g.fillStyle(0x886644);
        g.fillRoundedRect(cx - 3, 11, 7, 5, 2);
        g.fillStyle(0x443322);
        g.fillCircle(cx - 1, 14, 1);
        g.fillCircle(cx + 3, 14, 1);

        g.fillStyle(0x221100);
        g.fillRect(cx - 7, 13, 14, 2);
        g.fillStyle(0xccccaa);
        g.fillRect(cx - 6, 12, 3, 2);
        g.fillRect(cx - 2, 12, 4, 2);
        g.fillRect(cx + 3, 12, 3, 2);
    },

    // ── Boss ───────────────────────────────────────────────────────────────────
    drawBoss(g, s, phase) {
        const cx   = s >> 1;
        const p2   = phase === 2;
        const bodyCol  = p2 ? 0xff4400 : 0xff1166;
        const bodyDark = p2 ? 0xcc2200 : 0xcc0044;
        const seamCol  = p2 ? 0xff8822 : 0xff4499;
        const headCol  = p2 ? 0xff5500 : 0xff2277;
        const eyeOuter = 0xffffff;
        const eyeInner = p2 ? 0xff6600 : 0xff2200;

        g.fillStyle(p2 ? 0x330800 : 0x330011, 0.6);
        g.fillRoundedRect(1, 1, s - 2, s - 2, 5);

        g.fillStyle(0x000000, 0.50);
        g.fillEllipse(cx + 1, 31, 30, 8);

        g.fillStyle(p2 ? 0x882200 : 0x990033);
        g.fillRect(cx - 8, 22, 7, 9);
        g.fillRect(cx + 1, 22, 7, 9);

        g.fillStyle(bodyCol);
        g.fillRoundedRect(cx - 12, 11, 24, 14, 3);
        g.fillStyle(bodyDark);
        g.fillRect(cx - 9, 11, 18, 4);
        g.fillStyle(seamCol);
        g.fillRect(cx - 1, 12, 3, 12);
        g.fillStyle(bodyCol);
        g.fillRect(cx - 1, 13, 3, 11);

        g.fillStyle(0xdd0044);
        g.fillRoundedRect(cx - 17, 11, 7, 13, 2);
        g.fillRoundedRect(cx + 10, 11, 7, 13, 2);
        g.fillStyle(0xaa0033);
        g.fillTriangle(cx - 17, 23, cx - 20, 28, cx - 13, 24);
        g.fillTriangle(cx - 14, 23, cx - 12, 28, cx - 11, 24);
        g.fillTriangle(cx + 17, 23, cx + 20, 28, cx + 13, 24);
        g.fillTriangle(cx + 14, 23, cx + 12, 28, cx + 11, 24);

        g.fillStyle(headCol);
        g.fillRoundedRect(cx - 11, 4, 22, 11, 3);

        g.fillStyle(p2 ? 0xcc8800 : 0xffcc00);
        g.fillRect(cx - 9, 4, 18, 3);
        g.fillRect(cx - 7, 1, 3, 5);
        g.fillRect(cx - 1, 0, 3, 6);
        g.fillRect(cx + 5, 1, 3, 5);
        g.fillStyle(0xff2200);
        g.fillRect(cx - 6, 2, 2, 2);
        g.fillRect(cx,     1, 2, 2);
        g.fillRect(cx + 6, 2, 2, 2);
        g.fillStyle(0xff8855);
        g.fillRect(cx - 6, 2, 1, 1);
        g.fillRect(cx,     1, 1, 1);
        g.fillRect(cx + 6, 2, 1, 1);

        g.fillStyle(eyeOuter);
        g.fillRect(cx - 9, 7, 7, 5);
        g.fillRect(cx + 2, 7, 7, 5);
        g.fillStyle(eyeInner);
        g.fillRect(cx - 8, 8, 5, 3);
        g.fillRect(cx + 3, 8, 5, 3);
        g.fillStyle(p2 ? 0x331100 : 0x000000);
        g.fillRect(cx - 6, 9, 2, 2);
        g.fillRect(cx + 4, 9, 2, 2);
        g.fillStyle(p2 ? 0xff8800 : 0xff6644, p2 ? 0.9 : 0.5);
        g.fillRect(cx - 9, 7, 7, 1);
        g.fillRect(cx + 2, 7, 7, 1);

        g.fillStyle(0xffffff);
        g.fillTriangle(cx - 5, 13, cx - 7, 19, cx - 3, 13);
        g.fillTriangle(cx + 5, 13, cx + 7, 19, cx + 3, 13);
        g.fillTriangle(cx,     13, cx - 1, 16, cx + 1, 13);
        g.fillStyle(0xccccaa);
        g.fillTriangle(cx - 4, 13, cx - 5, 17, cx - 3, 13);
        g.fillTriangle(cx + 4, 13, cx + 5, 17, cx + 3, 13);

        g.fillStyle(0x550011);
        g.fillRect(cx - 6, 13, 12, 2);
        g.fillRect(cx - 6, 12, 2, 2);
        g.fillRect(cx + 4, 12, 2, 2);
    },

    // ── Zone Boss ──────────────────────────────────────────────────────────────
    drawZoneBoss(g, s, phase) {
        const cx  = s >> 1;
        const p2  = phase === 2;

        g.fillStyle(p2 ? 0x440022 : 0x220033, 0.7);
        g.fillRoundedRect(0, 0, s, s, 6);
        g.fillStyle(p2 ? 0xff2200 : 0xaa22ff, p2 ? 0.25 : 0.15);
        g.fillRoundedRect(2, 2, s - 4, s - 4, 5);

        g.fillStyle(0x000000, 0.60);
        g.fillEllipse(cx + 1, 30, s - 2, 9);

        const wingCol = p2 ? 0x880022 : 0x6622aa;
        g.fillStyle(wingCol, 0.6);
        g.fillTriangle(cx - 4, 12, -4, 2, cx - 10, 24);
        g.fillTriangle(cx + 4, 12, s + 4, 2, cx + 10, 24);
        g.fillStyle(p2 ? 0xff4444 : 0x9944dd, 0.3);
        g.fillTriangle(cx - 6, 14, 0, 6, cx - 8, 22);
        g.fillTriangle(cx + 6, 14, s, 6, cx + 8, 22);

        g.fillStyle(p2 ? 0x660011 : 0x441166);
        g.fillRect(cx - 9, 22, 8, 9);
        g.fillRect(cx + 1, 22, 8, 9);
        g.fillStyle(p2 ? 0xff4422 : 0x8833cc);
        g.fillTriangle(cx - 11, 28, cx - 13, 31, cx - 7, 31);
        g.fillTriangle(cx - 5, 28, cx - 3, 31, cx - 9, 31);
        g.fillTriangle(cx + 11, 28, cx + 13, 31, cx + 7, 31);
        g.fillTriangle(cx + 5, 28, cx + 3, 31, cx + 9, 31);

        g.fillStyle(p2 ? 0xbb0022 : 0x6622bb);
        g.fillRoundedRect(cx - 13, 10, 26, 15, 3);
        g.fillStyle(p2 ? 0xff6600 : 0xcc44ff, 0.7);
        g.fillRect(cx - 2, 12, 4, 12);
        g.fillRect(cx - 8, 16, 6, 2);
        g.fillRect(cx + 2, 16, 6, 2);
        g.fillStyle(p2 ? 0x880011 : 0x441188);
        g.fillRect(cx - 11, 10, 22, 3);

        g.fillStyle(p2 ? 0x990022 : 0x5511aa);
        g.fillRoundedRect(cx - 18, 10, 7, 14, 2);
        g.fillRoundedRect(cx + 11, 10, 7, 14, 2);
        g.fillStyle(p2 ? 0xff4422 : 0x8833cc);
        g.fillTriangle(cx - 18, 23, cx - 21, 29, cx - 15, 25);
        g.fillTriangle(cx - 15, 23, cx - 13, 29, cx - 12, 25);
        g.fillTriangle(cx + 18, 23, cx + 21, 29, cx + 15, 25);
        g.fillTriangle(cx + 15, 23, cx + 13, 29, cx + 12, 25);

        g.fillStyle(p2 ? 0xcc0033 : 0x7722cc);
        g.fillRoundedRect(cx - 11, 2, 22, 12, 3);

        g.fillStyle(p2 ? 0xcc6600 : 0xaa8844);
        g.fillTriangle(cx - 10, 5, cx - 18, -4, cx - 6, 3);
        g.fillTriangle(cx - 18, -4, cx - 20, -2, cx - 14, 2);
        g.fillTriangle(cx + 10, 5, cx + 18, -4, cx + 6, 3);
        g.fillTriangle(cx + 18, -4, cx + 20, -2, cx + 14, 2);
        g.fillStyle(p2 ? 0xff8800 : 0xffcc44);
        g.fillCircle(cx - 19, -3, 2);
        g.fillCircle(cx + 19, -3, 2);

        const eyeCol = p2 ? 0xff4400 : 0xff22ff;
        const pupilCol = p2 ? 0xffcc00 : 0xffffff;
        g.fillStyle(eyeCol);
        g.fillRect(cx - 9, 5, 6, 5);
        g.fillRect(cx + 3, 5, 6, 5);
        g.fillStyle(pupilCol);
        g.fillRect(cx - 7, 6, 3, 3);
        g.fillRect(cx + 4, 6, 3, 3);
        g.fillStyle(0x000000);
        g.fillRect(cx - 6, 7, 1, 2);
        g.fillRect(cx + 5, 7, 1, 2);
        g.fillStyle(eyeCol, 0.7);
        g.fillRect(cx - 7, 3, 4, 2);
        g.fillRect(cx + 3, 3, 4, 2);
        g.fillStyle(p2 ? 0xff8800 : 0xff44ff);
        g.fillCircle(cx, 4, 2);
        g.fillStyle(0x000000);
        g.fillCircle(cx, 4, 1);

        g.fillStyle(0x110000);
        g.fillRect(cx - 8, 11, 16, 3);
        g.fillStyle(0xffffff);
        g.fillTriangle(cx - 7, 11, cx - 8, 16, cx - 5, 11);
        g.fillTriangle(cx - 3, 11, cx - 4, 15, cx - 1, 11);
        g.fillTriangle(cx + 1, 11, cx + 2, 15, cx + 3, 11);
        g.fillTriangle(cx + 5, 11, cx + 6, 16, cx + 7, 11);
        g.fillTriangle(cx - 5, 14, cx - 6, 10, cx - 3, 14);
        g.fillTriangle(cx + 3, 14, cx + 4, 10, cx + 5, 14);
    }
};
