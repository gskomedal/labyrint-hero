// ─── Labyrint Hero – CharacterSprite ─────────────────────────────────────────
// Draws a pixel-art humanoid character into a Phaser Graphics object.
// Call: drawCharacterSprite(g, originX, originY, tileSize, appearance, race)
//   g        – Phaser.GameObjects.Graphics (already cleared or ready to draw into)
//   ox, oy   – top-left pixel position in the graphics object's local space
//   size     – tile size in px (32 in-game, 128 for preview)
//   appearance – { gender, skinColor, hairColor, clothColor, clothStyle, hairStyle, eyeColor, beardStyle }
//   race     – 'human' | 'dwarf' | 'elf' | 'hobbit'

// ── Palette presets ───────────────────────────────────────────────────────────

const SKIN_TONES   = [0xffd5a0, 0xe0aa68, 0xb07838, 0x7a4822];
const HAIR_COLORS  = [0x1a0800, 0x4a2008, 0xaa5518, 0xd4b840, 0xe8e8e8, 0x882222, 0x553388];
const CLOTH_COLORS = [0x1a3a88, 0x228832, 0x882222, 0x664488, 0x886622, 0x224466, 0x663344, 0x888888];
const HAIR_STYLES  = ['short', 'long', 'mohawk', 'bald', 'hood', 'ponytail', 'braids', 'curly', 'bun', 'side'];
const HAIR_STYLE_LABELS = {
    short: 'Kort', long: 'Langt', mohawk: 'Mohawk', bald: 'Skallet', hood: 'Kappe',
    ponytail: 'Hestehale', braids: 'Fletter', curly: 'Krøller', bun: 'Knute', side: 'Sidekam'
};

const CLOTH_STYLES = ['tunic', 'robe', 'vest', 'cloak'];
const CLOTH_STYLE_LABELS = { tunic: 'Tunika', robe: 'Kappe', vest: 'Vest', cloak: 'Kåpe' };

const GENDERS = ['male', 'female'];
const GENDER_LABELS = { male: 'Mann', female: 'Kvinne' };

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
    const sc = size / 32;

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

    const gender  = appearance.gender    || 'male';
    const skin    = appearance.skinColor  || SKIN_TONES[0];
    const hair    = appearance.hairColor  || HAIR_COLORS[1];
    const cloth   = appearance.clothColor || CLOTH_COLORS[0];
    const eyeCol  = appearance.eyeColor   || EYE_COLORS[0];
    const cStyle  = appearance.clothStyle || 'tunic';
    const beard   = (race === 'elf' || race === 'hobbit') ? 'none' : (appearance.beardStyle || 'none');
    const isFemale = gender === 'female';

    const pants   = darkenHex(cloth, 0.62);
    const shoe    = 0x221408;
    const skinDk  = darkenHex(skin, 0.78);
    const skinHi  = lightenHex(skin, 1.18);
    const clothHi = lightenHex(cloth, 1.22);
    const clothDk = darkenHex(cloth, 0.55);
    const hs      = appearance.hairStyle || 'short';

    // ── Body dimensions (slimmer proportions) ─────────────────────────────────
    // Female: narrower torso, slightly narrower shoulders
    const torsoW  = isFemale ? 12 : 14;
    const torsoX  = isFemale ? 10 : 9;
    const armX_L  = isFemale ? 6  : 5;
    const armX_R  = isFemale ? 24 : 24;
    const armW    = isFemale ? 3  : 4;
    const legW    = isFemale ? 4  : 5;
    const legX_L  = isFemale ? 10 : 9;
    const legX_R  = isFemale ? 18 : 18;

    // ── Shadow (directional — offset for 3D depth) ─────────────────────────
    g.fillStyle(0x000000, 0.30);
    g.fillEllipse(
        Math.round(ox + 17 * sc),
        Math.round(oy + 31 * sc),
        Math.round(22 * sc), Math.round(6 * sc)
    );

    // ── Long hair / hood (drawn behind head) ──────────────────────────────────
    if (hs === 'long') {
        b(9,  6, 2, 14, hair);
        b(21, 6, 2, 14, hair);
        b(10, 2, 12, 4, hair);
        b(11, 3, 3, 2, lightenHex(hair, 1.25), 0.5);
    }
    if (hs === 'ponytail') {
        // Hair behind head flowing down
        b(14, 3, 6, 3, hair);
        b(20, 5, 3, 12, hair);
        b(21, 6, 2, 14, hair);
        b(20, 17, 3, 3, darkenHex(hair, 0.85));
        b(21, 7, 1, 6, lightenHex(hair, 1.2), 0.4);
    }
    if (hs === 'braids') {
        // Two braids behind ears
        b(8,  6, 2, 16, hair);
        b(22, 6, 2, 16, hair);
        b(8, 20, 3, 2, darkenHex(hair, 0.8));
        b(21, 20, 3, 2, darkenHex(hair, 0.8));
        b(10, 2, 12, 4, hair);
    }
    if (hs === 'bun') {
        // Hair bun behind top of head
        b(10, 2, 12, 4, hair);
        b(13, 0, 6, 3, hair);
        b(14, -1, 4, 2, hair);
        b(14, 0, 2, 1, lightenHex(hair, 1.3), 0.5);
    }
    if (hs === 'hood') {
        b(8,  1, 16, 5, 0x2a3a4a);
        b(7,  4, 3, 17, 0x2a3a4a);
        b(22, 4, 3, 17, 0x2a3a4a);
        b(8, 2, 2, 3, 0x3a5060, 0.7);
    }

    // ── Ears ──────────────────────────────────────────────────────────────────
    if (race === 'elf') {
        b(7,  7, 4, 6, skin);
        b(6,  5, 2, 3, skin);
        b(6,  4, 1, 2, skinHi, 0.6);
        b(21, 7, 4, 6, skin);
        b(24, 5, 2, 3, skin);
        b(25, 4, 1, 2, skinHi, 0.6);
        b(6,  7, 2, 2, 0x44ddaa);
        b(24, 7, 2, 2, 0x44ddaa);
    } else if (race === 'hobbit') {
        b(8,  8, 3, 5, skin);
        b(21, 8, 3, 5, skin);
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
    b(11, 4, 5, 3, skinHi, 0.4);
    b(10, 13, 12, 2, skinDk, 0.35);

    // ── Hair on top of head ───────────────────────────────────────────────────
    if (race === 'dwarf') {
        // Iron helmet
        b(9,  3, 14, 5, 0x7a8fa8);
        b(8,  5, 3,  7, 0x7a8fa8);
        b(21, 5, 3,  7, 0x7a8fa8);
        b(10, 2, 12, 2, 0xbcd0e8);
        b(9,  8, 14, 1, 0x5a6f84);
        b(10, 4, 2, 2, 0xacc2d8);
        b(20, 4, 2, 2, 0xacc2d8);
        b(15, 5, 2, 8, 0x6a7f96);
        // Dwarf beard (forced)
        b(10, 13, 12, 4, darkenHex(hair, 0.9));
        b(11, 16, 10, 3, darkenHex(hair, 0.8));
        b(12, 18, 8,  2, darkenHex(hair, 0.7));
        b(12, 14, 3, 2, lightenHex(hair, 1.2), 0.4);
    } else if (hs === 'short') {
        b(10, 3, 12, 4, hair);
        b(9,  4, 2,  6, hair);
        b(21, 4, 2,  6, hair);
        b(12, 3, 4, 2, lightenHex(hair, 1.3), 0.5);
    } else if (hs === 'mohawk') {
        b(14, 0, 4, 6, hair);
        b(13, 2, 6, 2, hair);
        b(14, 0, 2, 3, lightenHex(hair, 1.4), 0.6);
    } else if (hs === 'curly') {
        // Voluminous curly hair
        b(8,  2, 16, 5, hair);
        b(7,  3, 2, 6, hair);
        b(23, 3, 2, 6, hair);
        // Curl texture dots
        b(9,  3, 2, 1, lightenHex(hair, 1.4), 0.5);
        b(13, 2, 2, 1, lightenHex(hair, 1.4), 0.5);
        b(18, 3, 2, 1, lightenHex(hair, 1.4), 0.5);
        b(8,  5, 1, 2, lightenHex(hair, 1.3), 0.4);
        b(23, 4, 1, 2, lightenHex(hair, 1.3), 0.4);
    } else if (hs === 'ponytail') {
        // Top hair + band
        b(10, 3, 12, 4, hair);
        b(9,  4, 2, 4, hair);
        b(12, 3, 4, 2, lightenHex(hair, 1.3), 0.5);
        // Hair band
        b(20, 5, 2, 2, 0xcc2244);
    } else if (hs === 'braids') {
        b(10, 3, 12, 4, hair);
        b(9,  4, 2, 5, hair);
        b(21, 4, 2, 5, hair);
        b(12, 3, 3, 2, lightenHex(hair, 1.25), 0.5);
    } else if (hs === 'bun') {
        b(10, 3, 12, 4, hair);
        b(9,  4, 2, 5, hair);
        b(11, 3, 4, 2, lightenHex(hair, 1.3), 0.5);
    } else if (hs === 'side') {
        // Side-swept hair
        b(10, 3, 12, 4, hair);
        b(8,  4, 3, 7, hair);
        b(21, 4, 2, 4, hair);
        b(8,  3, 5, 2, hair);
        b(9,  4, 3, 2, lightenHex(hair, 1.3), 0.5);
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

    // ── Face ─────────────────────────────────────────────────────────────────

    // Eyes
    b(12, 8, 3, 2, eyeCol);
    b(13, 8, 1, 1, lightenHex(eyeCol, 1.6), 0.6);
    b(12, 9, 1, 1, 0x000000);
    b(12, 8, 1, 1, 0xffffff);
    b(17, 8, 3, 2, eyeCol);
    b(18, 8, 1, 1, lightenHex(eyeCol, 1.6), 0.6);
    b(17, 9, 1, 1, 0x000000);
    b(17, 8, 1, 1, 0xffffff);
    b(12, 8, 3, 1, 0x000000, 0.2);
    b(17, 8, 3, 1, 0x000000, 0.2);

    // Female: longer eyelashes
    if (isFemale) {
        b(11, 7, 1, 1, darkenHex(hair, 0.5));
        b(14, 7, 1, 1, darkenHex(hair, 0.5));
        b(16, 7, 1, 1, darkenHex(hair, 0.5));
        b(20, 7, 1, 1, darkenHex(hair, 0.5));
    }

    // Eyebrows
    b(11, 6, 4, 1, darkenHex(hair, 0.7));
    b(17, 6, 4, 1, darkenHex(hair, 0.7));

    // Nose (slightly smaller for female)
    if (isFemale) {
        b(15, 10, 2, 2, skinDk, 0.7);
        b(15, 11, 2, 1, skinDk);
    } else {
        b(14, 10, 4, 3, skinDk, 0.8);
        b(15, 11, 2, 2, skinDk);
        b(14, 12, 1, 1, darkenHex(skin, 0.6));
        b(17, 12, 1, 1, darkenHex(skin, 0.6));
    }

    // Mouth / lips
    if (isFemale) {
        // Softer, slightly fuller lips
        b(13, 13, 6, 2, darkenHex(skin, 0.55));
        b(14, 13, 4, 1, 0xcc6666, 0.35);
        b(14, 13, 4, 1, lightenHex(skin, 1.1), 0.3);
    } else {
        b(12, 13, 8, 2, darkenHex(skin, 0.52));
        b(13, 13, 6, 1, darkenHex(skin, 0.42));
        b(12, 13, 2, 1, darkenHex(skin, 0.44));
        b(18, 13, 2, 1, darkenHex(skin, 0.44));
        b(14, 13, 4, 1, lightenHex(skin, 1.08), 0.3);
    }

    // Chin
    b(13, 14, 6, 1, skinDk, 0.25);

    // Hobbit rosy cheeks
    if (race === 'hobbit') {
        b(10, 10, 3, 2, 0xff8888, 0.32);
        b(19, 10, 3, 2, 0xff8888, 0.32);
    }

    // Female blush
    if (isFemale && race !== 'hobbit') {
        b(10, 11, 2, 1, 0xff8888, 0.18);
        b(20, 11, 2, 1, 0xff8888, 0.18);
    }

    // ── Beard ─────────────────────────────────────────────────────────────────
    if (beard === 'stubble') {
        b(11, 13, 10, 2, hair, 0.28);
        b(12, 14, 8,  1, hair, 0.18);
    } else if (beard === 'short') {
        b(10, 13, 12, 3, darkenHex(hair, 0.85));
        b(11, 15, 10, 2, darkenHex(hair, 0.78));
        b(12, 13, 4, 1, lightenHex(hair, 1.18), 0.35);
    } else if (beard === 'full') {
        b(9,  13, 14, 4, darkenHex(hair, 0.88));
        b(10, 16, 12, 4, darkenHex(hair, 0.78));
        b(11, 19, 10, 3, darkenHex(hair, 0.68));
        b(12, 21, 8,  2, darkenHex(hair, 0.58));
        b(13, 13, 4, 2, lightenHex(hair, 1.2), 0.4);
    }

    // ── Neck ─────────────────────────────────────────────────────────────────
    const neckW = isFemale ? 4 : 6;
    const neckX = isFemale ? 14 : 13;
    b(neckX, 15, neckW, 3, skin);
    b(neckX, 15, 2, 1, skinHi, 0.3);

    // ── Torso (clothing style variations) ─────────────────────────────────────
    if (cStyle === 'robe') {
        // Long robe - extends over legs
        b(torsoX, 18, torsoW, 8, cloth);
        b(neckX, 18, neckW, 2, clothHi, 0.5);
        b(torsoX + 1, 18, 3, 3, clothHi, 0.3);
        b(torsoX, 24, torsoW, 2, clothDk, 0.5);
        // Robe extends over legs
        b(torsoX - 1, 26, torsoW + 2, 6, cloth);
        b(torsoX, 30, torsoW, 2, clothDk, 0.4);
        // Center seam
        b(15, 20, 2, 10, clothDk, 0.3);
        // Robe trim at bottom
        b(torsoX - 1, 31, torsoW + 2, 1, lightenHex(cloth, 1.3));
        // Side shadow
        b(torsoX, 18, 1, 8, clothDk, 0.4);
        b(torsoX + torsoW - 1, 18, 1, 8, clothDk, 0.4);
    } else if (cStyle === 'vest') {
        // Inner shirt (lighter)
        b(torsoX, 18, torsoW, 8, lightenHex(cloth, 1.3));
        // Vest panels (darker, open front)
        b(torsoX, 18, 4, 8, cloth);
        b(torsoX + torsoW - 4, 18, 4, 8, cloth);
        // Vest highlight
        b(torsoX + 1, 18, 2, 3, clothHi, 0.3);
        // Collar
        b(neckX - 1, 18, neckW + 2, 1, cloth);
        // Shadow
        b(torsoX, 24, torsoW, 2, clothDk, 0.3);
        // Belt
        b(torsoX, 25, torsoW, 2, darkenHex(cloth, 0.4));
        b(torsoX, 25, torsoW, 1, lightenHex(darkenHex(cloth, 0.4), 1.3), 0.35);
        b(14, 25, 4, 2, 0xddaa44);
        b(14, 25, 1, 1, 0xffee88, 0.7);
    } else if (cStyle === 'cloak') {
        // Base tunic
        b(torsoX, 18, torsoW, 8, cloth);
        b(neckX, 18, neckW, 2, clothHi, 0.5);
        // Cloak over shoulders (wider, draped)
        b(torsoX - 2, 17, torsoW + 4, 3, darkenHex(cloth, 0.75));
        b(torsoX - 2, 19, 3, 9, darkenHex(cloth, 0.75));
        b(torsoX + torsoW - 1, 19, 3, 9, darkenHex(cloth, 0.75));
        // Cloak clasp
        b(15, 18, 2, 2, 0xddaa44);
        b(15, 18, 1, 1, 0xffee88, 0.7);
        // Shadow
        b(torsoX, 24, torsoW, 2, clothDk, 0.5);
        // Belt
        b(torsoX, 25, torsoW, 2, darkenHex(cloth, 0.4));
        b(14, 25, 4, 2, 0xddaa44);
    } else {
        // Default tunic
        b(torsoX, 18, torsoW, 8, cloth);
        b(neckX, 18, neckW, 2, clothHi, 0.5);
        b(neckX, 18, neckW, 3, cloth);
        b(torsoX + 1, 18, 3, 3, clothHi, 0.3);
        b(torsoX, 24, torsoW, 2, clothDk, 0.5);
        // Shirt seam / buttons
        b(15, 20, 2, 1, clothDk);
        b(15, 22, 2, 1, clothDk);
        // Side shadow
        b(torsoX, 18, 1, 8, clothDk, 0.4);
        b(torsoX + torsoW - 1, 18, 1, 8, clothDk, 0.4);
        // V-neck
        b(neckX, 18, 1, 2, darkenHex(skin, 0.9));
        b(neckX + neckW - 1, 18, 1, 2, darkenHex(skin, 0.9));
        // Belt
        b(torsoX, 25, torsoW, 2, darkenHex(cloth, 0.4));
        b(torsoX, 25, torsoW, 1, lightenHex(darkenHex(cloth, 0.4), 1.3), 0.35);
        b(14, 25, 4, 2, 0xddaa44);
        b(14, 25, 1, 1, 0xffee88, 0.7);
    }

    // ── Female body shape detail ──────────────────────────────────────────────
    if (isFemale) {
        // Slight waist narrowing
        b(torsoX, 23, 1, 3, 0x000000, 0.0);
        b(torsoX + torsoW - 1, 23, 1, 3, 0x000000, 0.0);
    }

    // ── Arms ─────────────────────────────────────────────────────────────────
    if (cStyle === 'cloak') {
        b(armX_L, 18, armW, 8, darkenHex(cloth, 0.75));
        b(armX_R, 18, armW, 8, darkenHex(cloth, 0.75));
    } else {
        b(armX_L, 18, armW, 8, cloth);
        b(armX_R, 18, armW, 8, cloth);
    }
    b(armX_L, 18, 2, 3, clothHi, 0.3);
    b(armX_R, 18, 2, 3, clothHi, 0.3);

    // Forearms / hands
    b(armX_L, 25, armW, 4, skin);
    b(armX_R, 25, armW, 4, skin);
    b(armX_L, 25, 2, 1, skinHi, 0.4);
    b(armX_R, 25, 2, 1, skinHi, 0.4);

    // ── Legs ─────────────────────────────────────────────────────────────────
    if (cStyle !== 'robe') {
        b(legX_L, 27, legW, 7, pants);
        b(legX_R, 27, legW, 7, pants);
        b(legX_L + 1, 27, 2, 5, lightenHex(pants, 1.2), 0.25);
        b(legX_R + 1, 27, 2, 5, lightenHex(pants, 1.2), 0.25);
        // Inner leg shadow
        b(legX_L + legW - 1, 27, 2, 7, darkenHex(pants, 0.7), 0.4);
    }

    // ── Feet / shoes ──────────────────────────────────────────────────────────
    if (race === 'hobbit') {
        b(7,  29, 8, 3, lightenHex(skin, 0.92));
        b(16, 29, 8, 3, lightenHex(skin, 0.92));
        b(8,  29, 1, 1, darkenHex(skin, 0.7));
        b(11, 29, 1, 1, darkenHex(skin, 0.7));
        b(17, 29, 1, 1, darkenHex(skin, 0.7));
        b(20, 29, 1, 1, darkenHex(skin, 0.7));
        b(7,  31, 2, 1, lightenHex(skin, 0.85));
        b(10, 31, 2, 1, lightenHex(skin, 0.85));
        b(16, 31, 2, 1, lightenHex(skin, 0.85));
        b(19, 31, 2, 1, lightenHex(skin, 0.85));
    } else if (cStyle === 'robe') {
        // Robe covers feet - just shoe tips visible
        b(legX_L, 31, legW + 1, 1, shoe);
        b(legX_R, 31, legW + 1, 1, shoe);
    } else {
        b(legX_L - 1, 30, legW + 2, 2, shoe);
        b(legX_R, 30, legW + 2, 2, shoe);
        b(legX_L - 1, 30, 2, 1, lightenHex(shoe, 1.8), 0.55);
        b(legX_R, 30, 2, 1, lightenHex(shoe, 1.8), 0.55);
        b(legX_L - 1, 31, legW + 2, 1, darkenHex(shoe, 0.5));
        b(legX_R, 31, legW + 2, 1, darkenHex(shoe, 0.5));
    }

    // ── Race-specific accessories ──────────────────────────────────────────────
    if (race === 'elf') {
        b(15, 18, 2, 2, 0x22aa55);
        b(16, 17, 1, 1, 0x44ee77);
    }
    if (race === 'dwarf') {
        b(15, 25, 1, 2, 0xaa7733);
        b(16, 26, 1, 1, 0xaa7733);
    }
}

// ── Default appearance ────────────────────────────────────────────────────────

function defaultAppearance(race) {
    const defaults = {
        human:  { gender: 'male', skinColor: SKIN_TONES[0],  hairColor: HAIR_COLORS[1], clothColor: CLOTH_COLORS[0], clothStyle: 'tunic', hairStyle: 'short',  eyeColor: EYE_COLORS[0], beardStyle: 'none'   },
        dwarf:  { gender: 'male', skinColor: SKIN_TONES[1],  hairColor: HAIR_COLORS[0], clothColor: CLOTH_COLORS[4], clothStyle: 'vest',  hairStyle: 'short',  eyeColor: EYE_COLORS[0], beardStyle: 'short'  },
        elf:    { gender: 'male', skinColor: SKIN_TONES[0],  hairColor: HAIR_COLORS[3], clothColor: CLOTH_COLORS[1], clothStyle: 'cloak', hairStyle: 'long',   eyeColor: EYE_COLORS[1], beardStyle: 'none'   },
        hobbit: { gender: 'male', skinColor: SKIN_TONES[1],  hairColor: HAIR_COLORS[1], clothColor: CLOTH_COLORS[4], clothStyle: 'tunic', hairStyle: 'short',  eyeColor: EYE_COLORS[0], beardStyle: 'none'   },
    };
    return defaults[race] || defaults.human;
}
