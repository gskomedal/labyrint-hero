// ─── Labyrint Hero – CharacterSprite ─────────────────────────────────────────
// Draws a pixel-art humanoid character into a Phaser Graphics object.
// Call: drawCharacterSprite(g, originX, originY, tileSize, appearance, race)
//   g        – Phaser.GameObjects.Graphics (already cleared or ready to draw into)
//   ox, oy   – top-left pixel position in the graphics object's local space
//   size     – tile size in px (32 in-game, 128 for preview)
//   appearance – { skinColor, hairColor, clothColor, hairStyle, eyeColor, beardStyle }
//   race     – 'human' | 'dwarf' | 'elf' | 'hobbit'

// ── Palette presets ───────────────────────────────────────────────────────────

const SKIN_TONES   = [0xffd5a0, 0xe0aa68, 0xb07838, 0x7a4822];
const HAIR_COLORS  = [0x1a0800, 0x4a2008, 0xaa5518, 0xd4b840, 0xe8e8e8];
const CLOTH_COLORS = [0x1a3a88, 0x228832, 0x882222, 0x664488, 0x886622];
const HAIR_STYLES  = ['short', 'long', 'mohawk', 'bald', 'hood'];
const HAIR_STYLE_LABELS = { short: 'Kort', long: 'Langt', mohawk: 'Mohawk', bald: 'Skallet', hood: 'Kappe' };

// Eye colours
const EYE_COLORS       = [0x1a1028, 0x4488ff, 0x44aa44, 0x888899, 0xcc4422, 0x8844aa];
const EYE_COLOR_LABELS = ['Mørk', 'Blå', 'Grønn', 'Grå', 'Rødt', 'Lilla'];

// Beard styles (human / dwarf only – elf and hobbit are always 'none')
const BEARD_STYLES       = ['none', 'stubble', 'short', 'full'];
const BEARD_STYLE_LABELS = { none: 'Ingen', stubble: 'Stubb', short: 'Skjegg', full: 'Langt' };

// ── Color utility ─────────────────────────────────────────────────────────────

function darkenHex(hex, f = 0.65) {
    return (Math.floor(((hex >> 16) & 255) * f) << 16) |
           (Math.floor(((hex >> 8)  & 255) * f) << 8)  |
            Math.floor(( hex        & 255) * f);
}

function lightenHex(hex, f = 1.35) {
    return (Math.min(255, Math.floor(((hex >> 16) & 255) * f)) << 16) |
           (Math.min(255, Math.floor(((hex >> 8)  & 255) * f)) << 8)  |
            Math.min(255, Math.floor(( hex        & 255) * f));
}

// ── Main drawing function ─────────────────────────────────────────────────────

function drawCharacterSprite(g, ox, oy, size, appearance, race) {
    const sc = size / 32; // pixels per in-sprite pixel

    // Helper: fill a block at in-sprite coordinates
    function b(x, y, w, h, color, alpha) {
        if (alpha !== undefined) g.fillStyle(color, alpha);
        else                     g.fillStyle(color);
        g.fillRect(
            Math.round(ox + x * sc),
            Math.round(oy + y * sc),
            Math.max(1, Math.round(w * sc)),
            Math.max(1, Math.round(h * sc))
        );
    }

    const skin    = appearance.skinColor  || SKIN_TONES[0];
    const hair    = appearance.hairColor  || HAIR_COLORS[1];
    const cloth   = appearance.clothColor || CLOTH_COLORS[0];
    const eyeCol  = appearance.eyeColor   || EYE_COLORS[0];
    const beard   = (race === 'elf' || race === 'hobbit') ? 'none' : (appearance.beardStyle || 'none');
    const pants   = darkenHex(cloth, 0.62);
    const shoe    = 0x221408;
    const skinDk  = darkenHex(skin, 0.78);
    const skinHi  = lightenHex(skin, 1.18);
    const clothHi = lightenHex(cloth, 1.22);
    const clothDk = darkenHex(cloth, 0.55);
    const hs      = appearance.hairStyle || 'short';

    // ── Shadow ────────────────────────────────────────────────────────────────
    g.fillStyle(0x000000, 0.22);
    g.fillEllipse(
        Math.round(ox + 16 * sc),
        Math.round(oy + 31 * sc),
        Math.round(22 * sc), Math.round(5 * sc)
    );

    // ── Long hair / hood (drawn behind head) ──────────────────────────────────
    if (hs === 'long') {
        b(9,  6, 2, 14, hair);
        b(21, 6, 2, 14, hair);
        b(10, 2, 12, 4, hair);
        // long hair highlight
        b(11, 3, 3, 2, lightenHex(hair, 1.25), 0.5);
    }
    if (hs === 'hood') {
        b(8,  1, 16, 5, 0x2a3a4a);
        b(7,  4, 3, 17, 0x2a3a4a);
        b(22, 4, 3, 17, 0x2a3a4a);
        // hood highlight edge
        b(8, 2, 2, 3, 0x3a5060, 0.7);
    }

    // ── Ears ──────────────────────────────────────────────────────────────────
    if (race === 'elf') {
        b(7,  7, 4, 6, skin);
        b(6,  5, 2, 3, skin);   // pointed tip
        b(6,  4, 1, 2, skinHi, 0.6); // tip highlight
        b(21, 7, 4, 6, skin);
        b(24, 5, 2, 3, skin);
        b(25, 4, 1, 2, skinHi, 0.6);
        // Elf earring (small gem)
        b(6,  7, 2, 2, 0x44ddaa);
        b(24, 7, 2, 2, 0x44ddaa);
    } else if (race === 'hobbit') {
        b(8,  8, 3, 5, skin);
        b(21, 8, 3, 5, skin);
        // slight round highlight
        b(8,  8, 2, 2, skinHi, 0.5);
        b(21, 8, 2, 2, skinHi, 0.5);
    } else {
        b(9,  8, 2, 4, skin);
        b(21, 8, 2, 4, skin);
        b(9,  8, 1, 2, skinHi, 0.5);
        b(21, 8, 1, 2, skinHi, 0.5);
    }

    // ── Head ──────────────────────────────────────────────────────────────────
    b(10, 4, 12, 11, skin);
    // Head highlight (top-left light source)
    b(11, 4, 5, 3, skinHi, 0.4);
    // Head shadow underside
    b(10, 13, 12, 2, skinDk, 0.35);

    // ── Hair on top of head ───────────────────────────────────────────────────
    if (race === 'dwarf') {
        // Iron helmet
        b(9,  3, 14, 5, 0x7a8fa8);
        b(8,  5, 3,  7, 0x7a8fa8);   // cheek guard L
        b(21, 5, 3,  7, 0x7a8fa8);   // cheek guard R
        b(10, 2, 12, 2, 0xbcd0e8);   // highlight top
        b(9,  8, 14, 1, 0x5a6f84);   // chin strap line
        // Rivet details
        b(10, 4, 2, 2, 0xacc2d8);
        b(20, 4, 2, 2, 0xacc2d8);
        // Nasal guard strip
        b(15, 5, 2, 8, 0x6a7f96);
        // Dwarf beard
        b(10, 13, 12, 4, darkenHex(hair, 0.9));
        b(11, 16, 10, 3, darkenHex(hair, 0.8));
        b(12, 18, 8,  2, darkenHex(hair, 0.7));
        // Beard highlight
        b(12, 14, 3, 2, lightenHex(hair, 1.2), 0.4);
    } else if (hs === 'short') {
        b(10, 3, 12, 4, hair);
        b(9,  4, 2,  6, hair);   // sideburn L
        b(21, 4, 2,  6, hair);   // sideburn R
        // Hair highlight
        b(12, 3, 4, 2, lightenHex(hair, 1.3), 0.5);
    } else if (hs === 'mohawk') {
        b(14, 0, 4, 6, hair);
        b(13, 2, 6, 2, hair);
        // Mohawk highlight
        b(14, 0, 2, 3, lightenHex(hair, 1.4), 0.6);
    } else if (hs === 'bald') {
        g.fillStyle(lightenHex(skin, 1.15), 0.35);
        g.fillEllipse(
            Math.round(ox + 16 * sc),
            Math.round(oy + 6  * sc),
            Math.round(8 * sc), Math.round(4 * sc)
        );
    } else if (hs === 'hood') {
        b(10, 3, 12, 3, 0x2a3a4a);
    }
    // long hair top already drawn above

    // ── Face ─────────────────────────────────────────────────────────────────

    // Eyes: iris + pupil + highlight + shadow
    // Left eye
    b(12, 8, 3, 2, eyeCol);                                    // iris
    b(13, 8, 1, 1, lightenHex(eyeCol, 1.6), 0.6);             // iris highlight
    b(12, 9, 1, 1, 0x000000);                                  // pupil
    b(12, 8, 1, 1, 0xffffff);                                  // cornea shine
    // Right eye
    b(17, 8, 3, 2, eyeCol);
    b(18, 8, 1, 1, lightenHex(eyeCol, 1.6), 0.6);
    b(17, 9, 1, 1, 0x000000);
    b(17, 8, 1, 1, 0xffffff);
    // Upper eyelid shadow
    b(12, 8, 3, 1, 0x000000, 0.2);
    b(17, 8, 3, 1, 0x000000, 0.2);

    // Eyebrows (thicker, shaped)
    b(11, 6, 4, 1, darkenHex(hair, 0.7));
    b(17, 6, 4, 1, darkenHex(hair, 0.7));

    // Nose (wider, more sculpted)
    b(14, 10, 4, 3, skinDk, 0.8);
    b(15, 11, 2, 2, skinDk);
    // Nostril hints
    b(14, 12, 1, 1, darkenHex(skin, 0.6));
    b(17, 12, 1, 1, darkenHex(skin, 0.6));

    // Mouth / lips
    b(12, 13, 8, 2, darkenHex(skin, 0.52));
    // Upper lip line
    b(13, 13, 6, 1, darkenHex(skin, 0.42));
    // Smile corners
    b(12, 13, 2, 1, darkenHex(skin, 0.44));
    b(18, 13, 2, 1, darkenHex(skin, 0.44));
    // Lip highlight
    b(14, 13, 4, 1, lightenHex(skin, 1.08), 0.3);

    // Chin definition
    b(13, 14, 6, 1, skinDk, 0.25);

    // Hobbit rosy cheeks
    if (race === 'hobbit') {
        b(10, 10, 3, 2, 0xff8888, 0.32);
        b(19, 10, 3, 2, 0xff8888, 0.32);
    }

    // ── Beard ─────────────────────────────────────────────────────────────────
    if (beard === 'stubble') {
        // Faint chin coverage
        b(11, 13, 10, 2, hair, 0.28);
        b(12, 14, 8,  1, hair, 0.18);
    } else if (beard === 'short') {
        // Solid short beard
        b(10, 13, 12, 3, darkenHex(hair, 0.85));
        b(11, 15, 10, 2, darkenHex(hair, 0.78));
        // Highlight
        b(12, 13, 4, 1, lightenHex(hair, 1.18), 0.35);
    } else if (beard === 'full') {
        // Long full beard
        b(9,  13, 14, 4, darkenHex(hair, 0.88));
        b(10, 16, 12, 4, darkenHex(hair, 0.78));
        b(11, 19, 10, 3, darkenHex(hair, 0.68));
        b(12, 21, 8,  2, darkenHex(hair, 0.58));
        // Highlight stripe
        b(13, 13, 4, 2, lightenHex(hair, 1.2), 0.4);
    }

    // ── Neck ─────────────────────────────────────────────────────────────────
    b(13, 15, 6, 3, skin);
    b(13, 15, 2, 1, skinHi, 0.3);   // neck highlight

    // ── Torso ─────────────────────────────────────────────────────────────────
    b(8, 18, 16, 8, cloth);
    // Collar / neckline
    b(13, 18, 6, 2, clothHi, 0.5);
    b(14, 18, 4, 3, cloth);
    // Chest highlight (light source from upper-left)
    b(9, 18, 5, 3, clothHi, 0.3);
    // Shadow at bottom of torso
    b(8, 24, 16, 2, clothDk, 0.5);
    // Shirt seam / buttons
    b(15, 20, 2, 1, clothDk);
    b(15, 22, 2, 1, clothDk);
    // Side shadow lines
    b(8, 18, 1, 8, clothDk, 0.4);
    b(23, 18, 1, 8, clothDk, 0.4);
    // Collar V-neck detail
    b(14, 18, 1, 2, darkenHex(skin, 0.9));
    b(17, 18, 1, 2, darkenHex(skin, 0.9));

    // Belt
    b(8, 25, 16, 2, darkenHex(cloth, 0.4));
    // Belt highlight
    b(8, 25, 16, 1, lightenHex(darkenHex(cloth, 0.4), 1.3), 0.35);
    // Belt buckle
    b(14, 25, 4, 2, 0xddaa44);
    b(14, 25, 1, 1, 0xffee88, 0.7);   // buckle shine

    // ── Arms ─────────────────────────────────────────────────────────────────
    b(4,  18, 4, 8, cloth);
    b(24, 18, 4, 8, cloth);
    // Arm highlight
    b(4, 18, 2, 3, clothHi, 0.3);
    b(24, 18, 2, 3, clothHi, 0.3);
    // Arm shadow
    b(7, 22, 1, 4, clothDk, 0.4);
    b(24, 22, 1, 4, clothDk, 0.4);

    // Forearms / hands (skin)
    b(4,  25, 4, 4, skin);
    b(24, 25, 4, 4, skin);
    // Hand highlight
    b(4, 25, 2, 1, skinHi, 0.4);
    b(24, 25, 2, 1, skinHi, 0.4);
    // Knuckle lines
    b(5, 27, 1, 1, skinDk, 0.5);
    b(25, 27, 1, 1, skinDk, 0.5);

    // ── Legs ─────────────────────────────────────────────────────────────────
    b(9,  27, 5, 7, pants);
    b(18, 27, 5, 7, pants);
    // Pant crease / highlight
    b(10, 27, 2, 5, lightenHex(pants, 1.2), 0.25);
    b(19, 27, 2, 5, lightenHex(pants, 1.2), 0.25);
    // Inner leg shadow
    b(13, 27, 2, 7, darkenHex(pants, 0.7), 0.4);

    // ── Feet / shoes ──────────────────────────────────────────────────────────
    if (race === 'hobbit') {
        // Hobbit large furry feet - no shoes, big bare hairy feet
        b(7,  29, 8, 3, lightenHex(skin, 0.92));
        b(16, 29, 8, 3, lightenHex(skin, 0.92));
        // Foot hair texture (dark dots)
        b(8,  29, 1, 1, darkenHex(skin, 0.7));
        b(11, 29, 1, 1, darkenHex(skin, 0.7));
        b(17, 29, 1, 1, darkenHex(skin, 0.7));
        b(20, 29, 1, 1, darkenHex(skin, 0.7));
        // Toes
        b(7,  31, 2, 1, lightenHex(skin, 0.85));
        b(10, 31, 2, 1, lightenHex(skin, 0.85));
        b(16, 31, 2, 1, lightenHex(skin, 0.85));
        b(19, 31, 2, 1, lightenHex(skin, 0.85));
    } else {
        b(8,  30, 7, 2, shoe);
        b(17, 30, 7, 2, shoe);
        // Shoe highlight
        b(8,  30, 2, 1, lightenHex(shoe, 1.8), 0.55);
        b(17, 30, 2, 1, lightenHex(shoe, 1.8), 0.55);
        // Sole line
        b(8, 31, 7, 1, darkenHex(shoe, 0.5));
        b(17, 31, 7, 1, darkenHex(shoe, 0.5));
    }

    // ── Race-specific accessories ──────────────────────────────────────────────
    if (race === 'elf') {
        // Leaf-shaped brooch on collar (at chest center)
        b(15, 18, 2, 2, 0x22aa55);
        b(16, 17, 1, 1, 0x44ee77);   // brooch gem top
    }
    if (race === 'dwarf') {
        // Rune engraved on belt buckle
        b(15, 25, 1, 2, 0xaa7733);
        b(16, 26, 1, 1, 0xaa7733);
    }
}

// ── Default appearance ────────────────────────────────────────────────────────

function defaultAppearance(race) {
    const defaults = {
        human:  { skinColor: SKIN_TONES[0],  hairColor: HAIR_COLORS[1], clothColor: CLOTH_COLORS[0], hairStyle: 'short',  eyeColor: EYE_COLORS[0], beardStyle: 'none'   },
        dwarf:  { skinColor: SKIN_TONES[1],  hairColor: HAIR_COLORS[0], clothColor: CLOTH_COLORS[4], hairStyle: 'short',  eyeColor: EYE_COLORS[0], beardStyle: 'short'  },
        elf:    { skinColor: SKIN_TONES[0],  hairColor: HAIR_COLORS[3], clothColor: CLOTH_COLORS[1], hairStyle: 'long',   eyeColor: EYE_COLORS[1], beardStyle: 'none'   },
        hobbit: { skinColor: SKIN_TONES[1],  hairColor: HAIR_COLORS[1], clothColor: CLOTH_COLORS[4], hairStyle: 'short',  eyeColor: EYE_COLORS[0], beardStyle: 'none'   },
    };
    return defaults[race] || defaults.human;
}
