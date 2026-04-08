// ─── Labyrint Hero – Detailed Character Sprite ──────────────────────────────
// High-fidelity character portrait for menu/overlay scenes.
// Uses a 64-unit grid (double resolution vs the in-game 32-unit grid).
// Reuses darkenHex / lightenHex / palette arrays from CharacterSprite.js.

function drawDetailedCharacterSprite(g, ox, oy, size, appearance, race, equipment) {
    const sc = size / 64;

    function b(x, y, w, h, color, alpha) {
        if (alpha !== undefined) g.fillStyle(color, alpha);
        else g.fillStyle(color);
        g.fillRect(
            Math.round(ox + x * sc), Math.round(oy + y * sc),
            Math.max(1, Math.round(w * sc)), Math.max(1, Math.round(h * sc))
        );
    }

    const gender  = appearance.gender    || 'male';
    const skin    = appearance.skinColor  || SKIN_TONES[0];
    const hair    = appearance.hairColor  || HAIR_COLORS[1];
    const cloth   = appearance.clothColor || CLOTH_COLORS[0];
    const eyeCol  = appearance.eyeColor   || EYE_COLORS[0];
    const cStyle  = appearance.clothStyle || 'tunic';
    const beard   = (race === 'elf' || race === 'hobbit') ? 'none' : (appearance.beardStyle || 'none');
    const isFemale = gender === 'female';
    const hs      = appearance.hairStyle || 'short';

    const pants   = darkenHex(cloth, 0.62);
    const shoe    = 0x221408;
    const skinDk  = darkenHex(skin, 0.78);
    const skinHi  = lightenHex(skin, 1.18);
    const clothHi = lightenHex(cloth, 1.22);
    const clothDk = darkenHex(cloth, 0.55);

    // ── Body dimensions ───────────────────────────────────────────────────
    const torsoW  = isFemale ? 22 : 26;
    const torsoX  = isFemale ? 21 : 19;
    const armX_L  = isFemale ? 12 : 10;
    const armX_R  = isFemale ? 46 : 48;
    const armW    = isFemale ? 7  : 8;
    const legW    = isFemale ? 8  : 10;
    const legX_L  = isFemale ? 21 : 19;
    const legX_R  = isFemale ? 35 : 35;

    // ── Shadow ────────────────────────────────────────────────────────────
    g.fillStyle(0x000000, 0.22);
    g.fillEllipse(
        Math.round(ox + 32 * sc), Math.round(oy + 62 * sc),
        Math.round(36 * sc), Math.round(8 * sc)
    );

    // ── Hair behind head ──────────────────────────────────────────────────
    if (hs === 'long') {
        b(18, 10, 4, 26, hair);
        b(42, 10, 4, 26, hair);
        b(20,  4, 24, 6, hair);
        b(22,  5, 6,  3, lightenHex(hair, 1.25), 0.5);
    }
    if (hs === 'ponytail') {
        b(28, 5, 12, 5, hair);
        b(40, 8, 5, 24, hair);
        b(42, 10, 4, 26, hair);
        b(40, 32, 5, 5, darkenHex(hair, 0.85));
        b(42, 12, 2, 10, lightenHex(hair, 1.2), 0.4);
    }
    if (hs === 'braids') {
        b(16, 10, 4, 30, hair);
        b(44, 10, 4, 30, hair);
        b(16, 38, 5, 4, darkenHex(hair, 0.8));
        b(43, 38, 5, 4, darkenHex(hair, 0.8));
        b(20,  4, 24, 6, hair);
        // Braid ties
        b(17, 30, 3, 2, 0xddaa44);
        b(44, 30, 3, 2, 0xddaa44);
    }
    if (hs === 'bun') {
        b(20, 4, 24, 6, hair);
        b(26, 0, 12, 5, hair);
        b(28, -2, 8, 4, hair);
        b(28, 0, 3, 2, lightenHex(hair, 1.3), 0.5);
    }
    if (hs === 'hood') {
        b(16, 2, 32, 8, 0x2a3a4a);
        b(14, 6, 6,  30, 0x2a3a4a);
        b(44, 6, 6,  30, 0x2a3a4a);
        b(16, 4, 4,  5, 0x3a5060, 0.7);
    }

    // ── Ears ──────────────────────────────────────────────────────────────
    if (race === 'elf') {
        // Pointed elf ears
        b(14, 14, 7, 10, skin);
        b(12, 9, 4, 5, skin);
        b(11, 7, 2, 3, skinHi, 0.6);
        b(43, 14, 7, 10, skin);
        b(48, 9, 4, 5, skin);
        b(51, 7, 2, 3, skinHi, 0.6);
        // Ear glow
        b(12, 14, 3, 3, 0x44ddaa);
        b(49, 14, 3, 3, 0x44ddaa);
        // Jewelry dots
        b(13, 18, 2, 2, 0xddaa44);
        b(49, 18, 2, 2, 0xddaa44);
    } else if (race === 'hobbit') {
        b(16, 15, 5, 8, skin);
        b(43, 15, 5, 8, skin);
        b(16, 15, 3, 3, skinHi, 0.5);
        b(43, 15, 3, 3, skinHi, 0.5);
        // Ear hair tufts
        b(15, 14, 2, 2, hair, 0.4);
        b(47, 14, 2, 2, hair, 0.4);
    } else {
        b(18, 15, 3, 7, skin);
        b(43, 15, 3, 7, skin);
        b(18, 15, 2, 3, skinHi, 0.5);
        b(43, 15, 2, 3, skinHi, 0.5);
    }

    // ── Head ──────────────────────────────────────────────────────────────
    b(20, 7, 24, 22, skin);
    b(22, 7, 10, 5, skinHi, 0.4);
    b(20, 26, 24, 3, skinDk, 0.35);

    // ── Hair on top ───────────────────────────────────────────────────────
    if (race === 'dwarf') {
        // Iron helmet
        b(18, 5, 28, 8, 0x7a8fa8);
        b(16, 9, 6, 12, 0x7a8fa8);
        b(42, 9, 6, 12, 0x7a8fa8);
        b(20, 3, 24, 4, 0xbcd0e8);
        b(18, 15, 28, 2, 0x5a6f84);
        b(20, 7, 4, 3, 0xacc2d8);
        b(40, 7, 4, 3, 0xacc2d8);
        b(30, 9, 4, 14, 0x6a7f96);
        // Rivets on helmet
        b(24, 10, 2, 2, 0xddeeff, 0.5);
        b(38, 10, 2, 2, 0xddeeff, 0.5);
        b(31, 6, 2, 2, 0xddeeff, 0.5);
    } else if (hs === 'short') {
        b(20, 5, 24, 6, hair);
        b(18, 7, 4, 10, hair);
        b(42, 7, 4, 10, hair);
        b(24, 5, 8, 3, lightenHex(hair, 1.3), 0.5);
        b(22, 6, 3, 2, lightenHex(hair, 1.4), 0.3);
    } else if (hs === 'mohawk') {
        b(28, -1, 8, 10, hair);
        b(26, 3, 12, 4, hair);
        b(28, -1, 4, 5, lightenHex(hair, 1.4), 0.6);
    } else if (hs === 'curly') {
        b(16, 3, 32, 8, hair);
        b(14, 5, 4, 10, hair);
        b(46, 5, 4, 10, hair);
        b(18, 4, 4, 2, lightenHex(hair, 1.4), 0.5);
        b(26, 3, 4, 2, lightenHex(hair, 1.4), 0.5);
        b(36, 4, 4, 2, lightenHex(hair, 1.4), 0.5);
        b(15, 7, 2, 4, lightenHex(hair, 1.3), 0.4);
        b(47, 6, 2, 4, lightenHex(hair, 1.3), 0.4);
    } else if (hs === 'ponytail') {
        b(20, 5, 24, 6, hair);
        b(18, 7, 4, 7, hair);
        b(24, 5, 8, 3, lightenHex(hair, 1.3), 0.5);
        b(40, 9, 4, 3, 0xcc2244);
    } else if (hs === 'braids') {
        b(20, 5, 24, 6, hair);
        b(18, 7, 4, 8, hair);
        b(42, 7, 4, 8, hair);
        b(24, 5, 6, 3, lightenHex(hair, 1.25), 0.5);
    } else if (hs === 'bun') {
        b(20, 5, 24, 6, hair);
        b(18, 7, 4, 8, hair);
        b(22, 5, 8, 3, lightenHex(hair, 1.3), 0.5);
    } else if (hs === 'side') {
        b(20, 5, 24, 6, hair);
        b(16, 7, 6, 12, hair);
        b(42, 7, 4, 6, hair);
        b(16, 5, 10, 3, hair);
        b(18, 6, 6, 3, lightenHex(hair, 1.3), 0.5);
    } else if (hs === 'bald') {
        g.fillStyle(lightenHex(skin, 1.15), 0.35);
        g.fillEllipse(
            Math.round(ox + 32 * sc), Math.round(oy + 10 * sc),
            Math.round(14 * sc), Math.round(6 * sc)
        );
    } else if (hs === 'hood') {
        b(20, 5, 24, 5, 0x2a3a4a);
    } else if (hs === 'long') {
        b(20, 5, 24, 6, hair);
        b(18, 7, 4, 10, hair);
        b(42, 7, 4, 10, hair);
        b(24, 5, 8, 3, lightenHex(hair, 1.3), 0.5);
    }

    // ── Face ──────────────────────────────────────────────────────────────

    // Eyes - detailed with iris, pupil, reflection
    // Left eye
    b(24, 15, 6, 4, 0xffffff);            // White
    b(25, 15, 4, 4, eyeCol);              // Iris
    b(26, 16, 3, 3, darkenHex(eyeCol, 0.6)); // Pupil
    b(27, 16, 1, 1, 0xffffff, 0.8);       // Reflection
    b(24, 14, 6, 1, 0x000000, 0.3);       // Upper eyelid shadow
    b(24, 19, 6, 1, skinDk, 0.2);         // Lower lid
    // Right eye
    b(34, 15, 6, 4, 0xffffff);
    b(35, 15, 4, 4, eyeCol);
    b(36, 16, 3, 3, darkenHex(eyeCol, 0.6));
    b(37, 16, 1, 1, 0xffffff, 0.8);
    b(34, 14, 6, 1, 0x000000, 0.3);
    b(34, 19, 6, 1, skinDk, 0.2);

    // Female eyelashes
    if (isFemale) {
        b(23, 14, 1, 1, darkenHex(hair, 0.5));
        b(26, 14, 1, 1, darkenHex(hair, 0.5));
        b(30, 14, 1, 1, darkenHex(hair, 0.5));
        b(33, 14, 1, 1, darkenHex(hair, 0.5));
        b(37, 14, 1, 1, darkenHex(hair, 0.5));
        b(40, 14, 1, 1, darkenHex(hair, 0.5));
    }

    // Eyebrows
    b(23, 12, 7, 2, darkenHex(hair, 0.7));
    b(34, 12, 7, 2, darkenHex(hair, 0.7));

    // Nose
    if (isFemale) {
        b(30, 20, 4, 3, skinDk, 0.7);
        b(30, 22, 4, 2, skinDk);
        // Nostrils
        b(30, 23, 1, 1, darkenHex(skin, 0.55));
        b(33, 23, 1, 1, darkenHex(skin, 0.55));
    } else {
        b(28, 20, 8, 5, skinDk, 0.8);
        b(30, 22, 4, 3, skinDk);
        // Nostrils
        b(29, 24, 2, 1, darkenHex(skin, 0.55));
        b(33, 24, 2, 1, darkenHex(skin, 0.55));
    }

    // Mouth / lips
    if (isFemale) {
        b(26, 26, 12, 3, darkenHex(skin, 0.55));
        b(28, 26, 8, 2, 0xcc6666, 0.35);
        b(28, 26, 8, 1, lightenHex(skin, 1.1), 0.3);
        // Upper lip line
        b(27, 25, 10, 1, darkenHex(skin, 0.5), 0.4);
    } else {
        b(24, 26, 16, 3, darkenHex(skin, 0.52));
        b(26, 26, 12, 2, darkenHex(skin, 0.42));
        b(24, 26, 4, 1, darkenHex(skin, 0.44));
        b(36, 26, 4, 1, darkenHex(skin, 0.44));
        b(28, 26, 8, 1, lightenHex(skin, 1.08), 0.3);
    }

    // Chin
    b(26, 28, 12, 2, skinDk, 0.25);

    // Hobbit rosy cheeks
    if (race === 'hobbit') {
        b(20, 20, 5, 4, 0xff8888, 0.35);
        b(39, 20, 5, 4, 0xff8888, 0.35);
    }
    // Female blush
    if (isFemale && race !== 'hobbit') {
        b(21, 22, 3, 2, 0xff8888, 0.18);
        b(40, 22, 3, 2, 0xff8888, 0.18);
    }

    // ── Beard ─────────────────────────────────────────────────────────────
    if (race === 'dwarf') {
        // Dwarf forced long braided beard
        b(20, 26, 24, 6, darkenHex(hair, 0.9));
        b(22, 31, 20, 6, darkenHex(hair, 0.8));
        b(24, 36, 16, 5, darkenHex(hair, 0.7));
        b(26, 40, 12, 4, darkenHex(hair, 0.6));
        b(24, 28, 6, 3, lightenHex(hair, 1.2), 0.4);
        // Braid lines
        b(28, 36, 2, 8, darkenHex(hair, 0.65));
        b(34, 36, 2, 8, darkenHex(hair, 0.65));
        // Metal beads
        b(28, 42, 2, 2, 0xddaa44);
        b(34, 42, 2, 2, 0xddaa44);
    } else if (beard === 'stubble') {
        b(22, 26, 20, 3, hair, 0.28);
        b(24, 28, 16, 2, hair, 0.18);
    } else if (beard === 'short') {
        b(20, 26, 24, 5, darkenHex(hair, 0.85));
        b(22, 30, 20, 4, darkenHex(hair, 0.78));
        b(24, 26, 8, 2, lightenHex(hair, 1.18), 0.35);
    } else if (beard === 'full') {
        b(18, 26, 28, 6, darkenHex(hair, 0.88));
        b(20, 31, 24, 7, darkenHex(hair, 0.78));
        b(22, 37, 20, 5, darkenHex(hair, 0.68));
        b(24, 41, 16, 4, darkenHex(hair, 0.58));
        b(26, 26, 8, 3, lightenHex(hair, 1.2), 0.4);
    }

    // ── Neck ──────────────────────────────────────────────────────────────
    const neckW = isFemale ? 8 : 10;
    const neckX = isFemale ? 28 : 27;
    b(neckX, 29, neckW, 6, skin);
    b(neckX, 29, 3, 2, skinHi, 0.3);

    // ── Torso (clothing styles) ───────────────────────────────────────────
    if (cStyle === 'robe') {
        b(torsoX, 35, torsoW, 14, cloth);
        b(neckX, 35, neckW, 3, clothHi, 0.5);
        b(torsoX + 2, 35, 5, 5, clothHi, 0.3);
        b(torsoX, 47, torsoW, 3, clothDk, 0.5);
        // Robe extends over legs
        b(torsoX - 2, 50, torsoW + 4, 12, cloth);
        b(torsoX, 60, torsoW, 2, clothDk, 0.4);
        // Center seam
        b(30, 39, 4, 20, clothDk, 0.3);
        // Trim at bottom
        b(torsoX - 2, 61, torsoW + 4, 2, lightenHex(cloth, 1.3));
        // Side shadows
        b(torsoX, 35, 2, 14, clothDk, 0.4);
        b(torsoX + torsoW - 2, 35, 2, 14, clothDk, 0.4);
        // Fold lines
        b(torsoX + 4, 45, 1, 10, clothDk, 0.2);
        b(torsoX + torsoW - 5, 45, 1, 10, clothDk, 0.2);
    } else if (cStyle === 'vest') {
        b(torsoX, 35, torsoW, 14, lightenHex(cloth, 1.3));
        b(torsoX, 35, 7, 14, cloth);
        b(torsoX + torsoW - 7, 35, 7, 14, cloth);
        b(torsoX + 2, 35, 4, 5, clothHi, 0.3);
        b(neckX - 1, 35, neckW + 2, 2, cloth);
        b(torsoX, 47, torsoW, 3, clothDk, 0.3);
        // Belt
        b(torsoX, 48, torsoW, 3, darkenHex(cloth, 0.4));
        b(torsoX, 48, torsoW, 1, lightenHex(darkenHex(cloth, 0.4), 1.3), 0.35);
        b(28, 48, 8, 3, 0xddaa44);
        b(28, 48, 2, 2, 0xffee88, 0.7);
        // Stitching
        b(torsoX + 7, 36, 1, 12, clothDk, 0.25);
        b(torsoX + torsoW - 8, 36, 1, 12, clothDk, 0.25);
    } else if (cStyle === 'cloak') {
        b(torsoX, 35, torsoW, 14, cloth);
        b(neckX, 35, neckW, 3, clothHi, 0.5);
        b(torsoX - 3, 33, torsoW + 6, 5, darkenHex(cloth, 0.75));
        b(torsoX - 3, 37, 5, 16, darkenHex(cloth, 0.75));
        b(torsoX + torsoW - 2, 37, 5, 16, darkenHex(cloth, 0.75));
        // Clasp
        b(30, 35, 4, 3, 0xddaa44);
        b(30, 35, 2, 2, 0xffee88, 0.7);
        b(torsoX, 47, torsoW, 3, clothDk, 0.5);
        // Belt
        b(torsoX, 49, torsoW, 3, darkenHex(cloth, 0.4));
        b(28, 49, 8, 3, 0xddaa44);
        // Fold lines on cloak
        b(torsoX - 2, 40, 1, 10, darkenHex(cloth, 0.6), 0.3);
        b(torsoX + torsoW + 1, 40, 1, 10, darkenHex(cloth, 0.6), 0.3);
    } else {
        // Default tunic
        b(torsoX, 35, torsoW, 14, cloth);
        b(neckX, 35, neckW, 4, clothHi, 0.5);
        b(neckX, 35, neckW, 5, cloth);
        b(torsoX + 2, 35, 5, 5, clothHi, 0.3);
        b(torsoX, 47, torsoW, 3, clothDk, 0.5);
        // Buttons
        b(30, 39, 4, 2, clothDk);
        b(30, 43, 4, 2, clothDk);
        // Side shadows
        b(torsoX, 35, 2, 14, clothDk, 0.4);
        b(torsoX + torsoW - 2, 35, 2, 14, clothDk, 0.4);
        // V-neck
        b(neckX, 35, 2, 3, darkenHex(skin, 0.9));
        b(neckX + neckW - 2, 35, 2, 3, darkenHex(skin, 0.9));
        // Belt
        b(torsoX, 49, torsoW, 3, darkenHex(cloth, 0.4));
        b(torsoX, 49, torsoW, 1, lightenHex(darkenHex(cloth, 0.4), 1.3), 0.35);
        b(28, 49, 8, 3, 0xddaa44);
        b(28, 49, 2, 2, 0xffee88, 0.7);
        // Fold lines
        b(torsoX + 5, 42, 1, 7, clothDk, 0.2);
        b(torsoX + torsoW - 6, 42, 1, 7, clothDk, 0.2);
    }

    // Female waist
    if (isFemale) {
        b(torsoX, 45, 2, 5, 0x000000, 0.0);
        b(torsoX + torsoW - 2, 45, 2, 5, 0x000000, 0.0);
    }

    // Hobbit suspender straps
    if (race === 'hobbit' && cStyle !== 'robe' && cStyle !== 'cloak') {
        b(24, 35, 2, 14, darkenHex(cloth, 0.5));
        b(38, 35, 2, 14, darkenHex(cloth, 0.5));
        b(24, 35, 3, 2, 0xddaa44, 0.5);
        b(38, 35, 3, 2, 0xddaa44, 0.5);
    }

    // ── Armor overlay ─────────────────────────────────────────────────────
    const armorDef = equipment && equipment.armor;
    if (armorDef) {
        const ac = armorDef.color || 0xaabbcc;
        const aid = armorDef.id || '';
        if (aid.indexOf('chain') >= 0) {
            // Chain mail: horizontal lines across torso
            for (let i = 0; i < 6; i++) {
                b(torsoX + 2, 36 + i * 2, torsoW - 4, 1, ac, 0.3);
            }
            b(torsoX, 35, torsoW, 2, lightenHex(ac, 1.2), 0.2);
        } else if (aid.indexOf('plate') >= 0 || aid.indexOf('dragon') >= 0) {
            // Plate/dragon armor: metallic rects
            b(torsoX + 2, 36, torsoW - 4, 4, ac, 0.25);
            b(torsoX + 3, 41, torsoW - 6, 3, ac, 0.2);
            b(torsoX + 2, 45, torsoW - 4, 3, ac, 0.22);
            b(torsoX + 4, 37, 4, 2, lightenHex(ac, 1.4), 0.3);
            // Shoulder plates
            b(armX_L, 34, armW, 4, ac, 0.25);
            b(armX_R, 34, armW, 4, ac, 0.25);
            if (aid.indexOf('dragon') >= 0) {
                // Scale pattern
                for (let r = 0; r < 4; r++) {
                    for (let c = 0; c < 3; c++) {
                        b(torsoX + 4 + c * 6, 37 + r * 3, 4, 2, lightenHex(ac, 1.1), 0.15);
                    }
                }
            }
        } else if (aid.indexOf('leather') >= 0 || aid.indexOf('padded') >= 0) {
            // Leather: darker shade overlay
            b(torsoX + 1, 35, torsoW - 2, 14, darkenHex(ac, 0.8), 0.15);
            b(torsoX + 3, 36, 3, 10, lightenHex(ac, 1.2), 0.1);
        } else if (aid.indexOf('magic') >= 0) {
            // Magic robe: glow particles
            b(torsoX + 4, 38, 2, 2, 0x88aaff, 0.2);
            b(torsoX + torsoW - 6, 42, 2, 2, 0x88aaff, 0.2);
            b(torsoX + 8, 45, 2, 2, 0xaa88ff, 0.15);
            b(30, 40, 4, 2, 0xffffff, 0.1);
        }
    }

    // ── Arms ──────────────────────────────────────────────────────────────
    if (cStyle === 'cloak') {
        b(armX_L, 35, armW, 14, darkenHex(cloth, 0.75));
        b(armX_R, 35, armW, 14, darkenHex(cloth, 0.75));
    } else {
        b(armX_L, 35, armW, 14, cloth);
        b(armX_R, 35, armW, 14, cloth);
    }
    b(armX_L, 35, 3, 5, clothHi, 0.3);
    b(armX_R, 35, 3, 5, clothHi, 0.3);

    // Forearms / hands with fingers
    b(armX_L, 48, armW, 6, skin);
    b(armX_R, 48, armW, 6, skin);
    b(armX_L, 48, 3, 2, skinHi, 0.4);
    b(armX_R, 48, 3, 2, skinHi, 0.4);
    // Left hand fingers
    b(armX_L,     54, 2, 3, skin);
    b(armX_L + 2, 54, 2, 4, skin);
    b(armX_L + 4, 54, 2, 3, skin);
    b(armX_L + 1, 56, 1, 1, skinDk, 0.3);
    // Right hand fingers
    b(armX_R,     54, 2, 3, skin);
    b(armX_R + 2, 54, 2, 4, skin);
    b(armX_R + 4, 54, 2, 3, skin);
    b(armX_R + 1, 56, 1, 1, skinDk, 0.3);

    // ── Legs ──────────────────────────────────────────────────────────────
    if (cStyle !== 'robe') {
        b(legX_L, 52, legW, 12, pants);
        b(legX_R, 52, legW, 12, pants);
        b(legX_L + 2, 52, 3, 8, lightenHex(pants, 1.2), 0.25);
        b(legX_R + 2, 52, 3, 8, lightenHex(pants, 1.2), 0.25);
        // Inner leg shadow
        b(legX_L + legW - 2, 52, 3, 12, darkenHex(pants, 0.7), 0.4);
        // Knee highlights
        b(legX_L + 2, 56, 4, 2, lightenHex(pants, 1.15), 0.2);
        b(legX_R + 2, 56, 4, 2, lightenHex(pants, 1.15), 0.2);
    }

    // ── Feet / shoes ──────────────────────────────────────────────────────
    if (race === 'hobbit') {
        // Bare feet with toes
        b(14, 58, 14, 5, lightenHex(skin, 0.92));
        b(34, 58, 14, 5, lightenHex(skin, 0.92));
        // Toe bumps
        b(15, 58, 2, 2, darkenHex(skin, 0.7));
        b(19, 58, 2, 2, darkenHex(skin, 0.7));
        b(23, 58, 2, 2, darkenHex(skin, 0.7));
        b(35, 58, 2, 2, darkenHex(skin, 0.7));
        b(39, 58, 2, 2, darkenHex(skin, 0.7));
        b(43, 58, 2, 2, darkenHex(skin, 0.7));
        // Foot hair tufts
        b(16, 57, 3, 2, hair, 0.3);
        b(36, 57, 3, 2, hair, 0.3);
    } else if (cStyle === 'robe') {
        b(legX_L, 62, legW + 2, 2, shoe);
        b(legX_R, 62, legW + 2, 2, shoe);
    } else {
        b(legX_L - 2, 60, legW + 4, 4, shoe);
        b(legX_R, 60, legW + 4, 4, shoe);
        b(legX_L - 2, 60, 3, 2, lightenHex(shoe, 1.8), 0.55);
        b(legX_R, 60, 3, 2, lightenHex(shoe, 1.8), 0.55);
        b(legX_L - 2, 63, legW + 4, 1, darkenHex(shoe, 0.5));
        b(legX_R, 63, legW + 4, 1, darkenHex(shoe, 0.5));
        // Boot lacing detail
        b(legX_L + 1, 60, 1, 3, lightenHex(shoe, 1.5), 0.3);
        b(legX_R + 1, 60, 1, 3, lightenHex(shoe, 1.5), 0.3);
    }

    // ── Weapon in right hand ──────────────────────────────────────────────
    const weaponDef = equipment && equipment.weapon;
    if (weaponDef) {
        const wc = weaponDef.color || 0xaaaacc;
        const wid = weaponDef.id || '';
        const wx = armX_R + armW + 1;  // Right of right hand
        const wy = 40;

        if (wid.indexOf('sword') >= 0 || wid === 'dagger') {
            // Sword/dagger: blade + guard + handle
            const bladeLen = wid === 'dagger' ? 14 : 22;
            g.fillStyle(wc, 0.9);
            g.fillRect(Math.round(ox + wx * sc), Math.round(ox + (wy - bladeLen) * sc),
                Math.max(1, Math.round(3 * sc)), Math.max(1, Math.round(bladeLen * sc)));
            // Highlight on blade
            g.fillStyle(lightenHex(wc, 1.4), 0.4);
            g.fillRect(Math.round(ox + wx * sc), Math.round(ox + (wy - bladeLen) * sc),
                Math.max(1, Math.round(1 * sc)), Math.max(1, Math.round(bladeLen * sc)));
            // Guard
            b(wx - 3, wy, 9, 2, 0x886644);
            // Handle
            b(wx, wy + 2, 3, 6, 0x664422);
        } else if (wid.indexOf('axe') >= 0) {
            // Axe: handle + head
            b(wx, wy - 16, 3, 24, 0x886644);
            g.fillStyle(wc, 0.9);
            g.fillTriangle(
                Math.round(ox + (wx - 6) * sc), Math.round(oy + (wy - 14) * sc),
                Math.round(ox + wx * sc), Math.round(oy + (wy - 14) * sc),
                Math.round(ox + (wx - 2) * sc), Math.round(oy + (wy - 4) * sc)
            );
        } else if (wid.indexOf('staff') >= 0) {
            // Staff: long shaft + orb
            b(wx, wy - 20, 3, 30, 0x886644);
            g.fillStyle(0x88aaff, 0.7);
            g.fillCircle(Math.round(ox + (wx + 1) * sc), Math.round(oy + (wy - 22) * sc),
                Math.round(4 * sc));
            g.fillStyle(0xffffff, 0.3);
            g.fillCircle(Math.round(ox + (wx) * sc), Math.round(oy + (wy - 23) * sc),
                Math.round(1.5 * sc));
        } else if (wid.indexOf('bow') >= 0) {
            // Bow: curved shape
            g.lineStyle(Math.max(1, Math.round(2 * sc)), wc, 0.8);
            g.lineBetween(
                Math.round(ox + wx * sc), Math.round(oy + (wy - 16) * sc),
                Math.round(ox + (wx + 4) * sc), Math.round(oy + wy * sc)
            );
            g.lineBetween(
                Math.round(ox + (wx + 4) * sc), Math.round(oy + wy * sc),
                Math.round(ox + wx * sc), Math.round(oy + (wy + 16) * sc)
            );
            // String
            g.lineStyle(Math.max(1, Math.round(1 * sc)), 0xccccaa, 0.5);
            g.lineBetween(
                Math.round(ox + wx * sc), Math.round(oy + (wy - 16) * sc),
                Math.round(ox + wx * sc), Math.round(oy + (wy + 16) * sc)
            );
        } else if (wid.indexOf('hammer') >= 0) {
            // Hammer: handle + head
            b(wx, wy - 14, 3, 22, 0x886644);
            g.fillStyle(wc, 0.9);
            g.fillRoundedRect(
                Math.round(ox + (wx - 5) * sc), Math.round(oy + (wy - 16) * sc),
                Math.round(13 * sc), Math.round(8 * sc), Math.round(2 * sc)
            );
        } else if (wid.indexOf('spear') >= 0) {
            // Spear: shaft + point
            b(wx, wy - 20, 3, 32, 0x886644);
            g.fillStyle(wc, 0.9);
            g.fillTriangle(
                Math.round(ox + (wx - 3) * sc), Math.round(oy + (wy - 18) * sc),
                Math.round(ox + (wx + 5) * sc), Math.round(oy + (wy - 18) * sc),
                Math.round(ox + (wx + 1) * sc), Math.round(oy + (wy - 28) * sc)
            );
        }
    }

    // ── Race-specific accessories ─────────────────────────────────────────
    if (race === 'elf') {
        // Leaf brooch on chest
        b(30, 35, 4, 3, 0x22aa55);
        b(32, 34, 2, 2, 0x44ee77);
    }
    if (race === 'dwarf') {
        // Tool on belt
        b(30, 50, 2, 3, 0xaa7733);
        b(32, 51, 2, 2, 0xaa7733);
    }
}
