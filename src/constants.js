// ─── Labyrint Hero – Constants ───────────────────────────────────────────────

const TILE_SIZE = 32;

// Default maze cell dimensions (grows per world)
const BASE_CELL_W = 13;
const BASE_CELL_H = 10;

const TILE = {
    WALL:         0,
    FLOOR:        1,
    EXIT:         2,
    SECRET:       3,   // Looks like wall, passable (subtle crack marks)
    CRACKED_WALL: 4,   // Wall that can be broken with a pickaxe (SPACE/F)
    DOOR:         5,   // Locked door – needs a key to pass through
    TRAP:         6    // Hidden spike trap – triggers on first step, then becomes FLOOR
};

const FOG = {
    DARK: 0,   // Never seen
    DIM:  1,   // Seen but not currently lit
    LIT:  2    // Currently visible
};

const COLORS = {
    WALL:          0x1a1028,
    WALL_TOP:      0x2e1f44,
    CRACKED_WALL:  0x251435,   // Slightly lighter – visible crack hint
    CRACKED_LINE:  0x4a2a6a,   // Crack mark color
    SECRET_CRACK:  0x2e1f44,
    DOOR:          0x7a4422,   // Brown door
    DOOR_FRAME:    0xcc9933,   // Golden door frame/handle
    FLOOR_A:       0x3d3255,
    FLOOR_B:       0x352c4a,
    EXIT:          0x00e87a,
    EXIT_GLOW:     0x00ff88,
    HERO:          0xf5e642,
    HERO_EYE:      0x1a1028,
    MONSTER:       0x44cc44,
    MONSTER_ORC:   0x7a9944,
    MONSTER_TRL:   0x997755,
    BOSS:          0xff1166,
    BOSS_CROWN:    0xffcc00,
    HEART_FULL:    0xff2244,
    HEART_EMPTY:   0x442233,
    XP_BAR:        0x44aaff,
    XP_BG:         0x1a2a3a,
    HUD_BG:        0x0a0a14,
    ARROW:         0xffff88,
    WHITE:         0xffffff,
    GREY:          0x888888,
    POISON:        0x44ee66,   // Poison status colour (green)
    TRAP_SPIKE:    0x886644    // Spike trap floor colour
};

// Gameplay tuning
const VISION_RADIUS   = 5;    // tiles
const MONSTER_TICK_MS = 380;  // ms between monster AI ticks
const BOSS_TICK_MS   = 570;  // ms between boss attack ticks (slower than regular)
const MOVE_DELAY_MS   = 140;  // ms between steps when key held
const MOVE_ANIM_MS    = 90;   // ms for hero/monster slide tween

const HERO_BASE_ATTACK  = 2;
const HERO_BASE_HEARTS  = 5;
// v0.7 balance: monsters are significantly tougher
const MONSTER_BASE_HP   = { goblin: 10, orc: 18,  troll: 30,  boss: 35 };
const MONSTER_ATTACK    = { goblin: 2,  orc: 4,   troll: 6,   boss: 3  };
const MONSTER_COLOR     = { goblin: COLORS.MONSTER, orc: COLORS.MONSTER_ORC, troll: COLORS.MONSTER_TRL, boss: COLORS.BOSS, zone_boss: 0xff22ff };
const MONSTER_XP        = { goblin: 10, orc: 25,  troll: 50,  boss: 150, zone_boss: 300 };

// v0.7 balance: much slower XP curve → less frequent skill picks
const XP_BASE           = 100;   // XP needed for level 2
const XP_GROWTH         = 1.55;  // multiplier per level

// ── Zone system (Phase 4) ────────────────────────────────────────────────────
// Zones group worlds into geological regions. Zone boss at last world of each.
const ZONES = [
    { id: 'surface',    name: 'Overflatelag',   worlds: [1, 2, 3],      mineralTierBase: 1, themeIdx: 0 },
    { id: 'bedrock',    name: 'Grunnfjell',      worlds: [4, 5, 6, 7],   mineralTierBase: 2, themeIdx: 1 },
    { id: 'deep',       name: 'Dyplag',          worlds: [8, 9, 10, 11, 12], mineralTierBase: 3, themeIdx: 5 },
    { id: 'underworld', name: 'Underverden',     worlds: [13, 14, 15, 16, 17, 18], mineralTierBase: 4, themeIdx: 6 },
    { id: 'core',       name: 'Jordens kjerne',  worlds: [19, 20, 21, 22, 23, 24, 25], mineralTierBase: 5, themeIdx: 7 },
];

function getZone(worldNum) {
    for (const zone of ZONES) {
        if (zone.worlds.includes(worldNum)) return zone;
    }
    return ZONES[ZONES.length - 1]; // fallback to core for worlds > 25
}

function getZoneFloor(worldNum) {
    const zone = getZone(worldNum);
    return zone.worlds.indexOf(worldNum) + 1;
}

function isZoneBossWorld(worldNum) {
    const zone = getZone(worldNum);
    return worldNum === zone.worlds[zone.worlds.length - 1];
}

const AGGRO_RADIUS      = 12;    // tiles; monster won't chase beyond this

// Gold economy
const GOLD_DROP         = { goblin: 5, orc: 12, troll: 25, boss: 100, zone_boss: 200 };
const GOLD_CHEST_BASE   = 15;   // base gold per chest (+ worldNum scaling)
const MERCHANT_MARKUP    = 1.0;  // price multiplier for merchant items

// Camera zoom limits
const ZOOM_MIN     = 0.5;
const ZOOM_MAX     = 2.5;
const ZOOM_STEP    = 0.25;
const ZOOM_DEFAULT = 1.6;

// Wall face height in pixels (3D south-face of walls visible from top-down view)
const WALL_FACE_H = 12;

// ─── World visual themes ──────────────────────────────────────────────────────
// One theme per two worlds (index = Math.floor((worldNum-1)/2))
const WORLD_THEMES = [
    {   // 0 – Worlds 1-2: Forest Garden
        name:         'Skogslabyrint',
        WALL:         0x0d3a0d,   // dark green hedge
        WALL_TOP:     0x1a6622,   // bright green top
        WALL_MID:     0x0a2a0a,
        WALL_FACE:    0x082808,   // darker south face
        FLOOR_A:      0x1c3d10,   // grass dark
        FLOOR_B:      0x17330d,   // grass light
        CRACKED_WALL: 0x2a1a08,
        CRACKED_LINE: 0x664422,
        DOOR:         0x5a3412,
        DOOR_FRAME:   0xaa7722,
        SECRET_COLOR: 0x0e3210,
        FOG_TINT:     0x001100,
        ACCENT:       0x44ee66,
        DECO:         'forest',
    },
    {   // 1 – Worlds 3-4: Stone Cave
        name:         'Steingrotte',
        WALL:         0x1c1c24,
        WALL_TOP:     0x2e2e3c,
        WALL_MID:     0x141418,
        WALL_FACE:    0x101016,
        FLOOR_A:      0x16161e,
        FLOOR_B:      0x121218,
        CRACKED_WALL: 0x24243a,
        CRACKED_LINE: 0x4a5080,
        DOOR:         0x4a3a18,
        DOOR_FRAME:   0x887733,
        SECRET_COLOR: 0x1a1a28,
        FOG_TINT:     0x000008,
        ACCENT:       0x6688ff,
        DECO:         'cave',
    },
    {   // 2 – World 5: Ice Crystal
        name:         'Iskrystall',
        WALL:         0x142240,
        WALL_TOP:     0x1e3860,
        WALL_MID:     0x0e1830,
        WALL_FACE:    0x0a162e,
        FLOOR_A:      0x101c30,
        FLOOR_B:      0x0c1828,
        CRACKED_WALL: 0x1c2e50,
        CRACKED_LINE: 0x7ab0ee,
        DOOR:         0x1c3858,
        DOOR_FRAME:   0x66ccff,
        SECRET_COLOR: 0x101e38,
        FOG_TINT:     0x000410,
        ACCENT:       0x88ddff,
        DECO:         'ice',
    },
    {   // 3 – World 6: Volcanic Abyss
        name:         'Vulkandungeon',
        WALL:         0x1a0600,
        WALL_TOP:     0x2a0c02,
        WALL_MID:     0x120400,
        WALL_FACE:    0x100400,
        FLOOR_A:      0x0e0400,
        FLOOR_B:      0x0a0200,
        CRACKED_WALL: 0x221004,
        CRACKED_LINE: 0xff4400,
        DOOR:         0x3a1408,
        DOOR_FRAME:   0xff6600,
        SECRET_COLOR: 0x180500,
        FOG_TINT:     0x0a0000,
        ACCENT:       0xff5500,
        DECO:         'volcanic',
    },
    {   // 4 – Worlds 7: Ancient Temple
        name:         'Oldtidstempel',
        WALL:         0x281e0e,
        WALL_TOP:     0x3a2c14,
        WALL_MID:     0x1e1608,
        WALL_FACE:    0x181208,
        FLOOR_A:      0x1c1808,
        FLOOR_B:      0x181406,
        CRACKED_WALL: 0x24200e,
        CRACKED_LINE: 0xcc9922,
        DOOR:         0x4a3810,
        DOOR_FRAME:   0xffcc22,
        SECRET_COLOR: 0x201a08,
        FOG_TINT:     0x080500,
        ACCENT:       0xffcc44,
        DECO:         'temple',
    },
    {   // 5 – Worlds 8-12: Deep Magma (Dyplag)
        name:         'Dyplag',
        WALL:         0x1a0800,
        WALL_TOP:     0x2a1204,
        WALL_MID:     0x140600,
        WALL_FACE:    0x100500,
        FLOOR_A:      0x120500,
        FLOOR_B:      0x0e0300,
        CRACKED_WALL: 0x2a0e04,
        CRACKED_LINE: 0xff6622,
        DOOR:         0x3a1a08,
        DOOR_FRAME:   0xff8844,
        SECRET_COLOR: 0x1a0800,
        FOG_TINT:     0x0a0200,
        ACCENT:       0xff6622,
        DECO:         'deep',
    },
    {   // 6 – Worlds 13-18: Underworld (Underverden)
        name:         'Underverden',
        WALL:         0x0a0418,
        WALL_TOP:     0x140828,
        WALL_MID:     0x080310,
        WALL_FACE:    0x060210,
        FLOOR_A:      0x0a0414,
        FLOOR_B:      0x080310,
        CRACKED_WALL: 0x120620,
        CRACKED_LINE: 0x8844cc,
        DOOR:         0x201040,
        DOOR_FRAME:   0xaa66ff,
        SECRET_COLOR: 0x0a0418,
        FOG_TINT:     0x020008,
        ACCENT:       0xaa66ff,
        DECO:         'underworld',
    },
    {   // 7 – Worlds 19-25: Earth's Core (Jordens kjerne)
        name:         'Jordens kjerne',
        WALL:         0x1a1400,
        WALL_TOP:     0x2a2200,
        WALL_MID:     0x141000,
        WALL_FACE:    0x100c00,
        FLOOR_A:      0x161200,
        FLOOR_B:      0x120e00,
        CRACKED_WALL: 0x221a00,
        CRACKED_LINE: 0xffaa00,
        DOOR:         0x3a2a00,
        DOOR_FRAME:   0xffdd44,
        SECRET_COLOR: 0x1a1400,
        FOG_TINT:     0x080600,
        ACCENT:       0xffcc00,
        DECO:         'core',
    },
];

function getWorldTheme(worldNum) {
    // Surface and Bedrock zones use the original per-world theme rotation
    // Deeper zones use their dedicated new themes
    if (worldNum <= 7) {
        const idx = Math.floor((worldNum - 1) / 2);
        return WORLD_THEMES[Math.min(idx, 4)]; // 0-4: forest, cave, ice, volcanic, temple
    }
    const zone = typeof getZone !== 'undefined' ? getZone(worldNum) : null;
    if (zone) return WORLD_THEMES[Math.min(zone.themeIdx, WORLD_THEMES.length - 1)];
    return WORLD_THEMES[WORLD_THEMES.length - 1];
}
