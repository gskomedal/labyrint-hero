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
    WALL:          0x5c3a1e,   // warm brown
    WALL_TOP:      0x7a5233,   // lighter brown highlight
    CRACKED_WALL:  0x6b4428,   // visible crack hint
    CRACKED_LINE:  0x8b6b3a,   // crack mark color
    SECRET_CRACK:  0x6a4a2e,
    DOOR:          0x6b3a18,   // dark wood door
    DOOR_FRAME:    0xd4a843,   // warm gold frame/handle
    FLOOR_A:       0x8b7355,   // warm tan
    FLOOR_B:       0x7d6648,   // darker tan
    EXIT:          0x55cc55,   // softer green
    EXIT_GLOW:     0x66dd66,
    HERO:          0xf5e642,
    HERO_EYE:      0x2a1808,
    MONSTER:       0x44cc44,
    MONSTER_ORC:   0x7a9944,
    MONSTER_TRL:   0x997755,
    BOSS:          0xff1166,
    BOSS_CROWN:    0xffcc00,
    HEART_FULL:    0xe83838,   // warm red
    HEART_EMPTY:   0x5a3a2a,   // warm brown empty
    XP_BAR:        0x55bb55,   // green XP
    XP_BG:         0x3a3025,   // brown bg
    HUD_BG:        0x3a2818,   // dark wood
    ARROW:         0xffff88,
    WHITE:         0xffffff,
    GREY:          0x888888,
    POISON:        0x66cc44,   // poison status colour (green)
    TRAP_SPIKE:    0x886644    // spike trap floor colour
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
const ZOOM_MAX     = 3.0;
const ZOOM_STEP    = 0.25;
const ZOOM_DEFAULT = 1.6;

// ─── World visual themes ──────────────────────────────────────────────────────
// One theme per two worlds (index = Math.floor((worldNum-1)/2))
const WORLD_THEMES = [
    {   // 0 – Worlds 1-2: Forest Garden (lush Stardew spring)
        name:         'Skogslabyrint',
        WALL:         0x2a5a1a,   // rich green hedge
        WALL_TOP:     0x3a7a2a,   // bright green top
        WALL_MID:     0x1e4a14,
        FLOOR_A:      0x5a8a3a,   // lush grass
        FLOOR_B:      0x4d7a30,   // darker grass
        CRACKED_WALL: 0x4a3a18,
        CRACKED_LINE: 0x7a6a30,
        DOOR:         0x6a4020,
        DOOR_FRAME:   0xbb8833,
        SECRET_COLOR: 0x2a5820,
        FOG_TINT:     0x0a1a04,
        ACCENT:       0x66ff66,
        DECO:         'forest',
    },
    {   // 1 – Worlds 3-4: Stone Cave (warm grey-brown)
        name:         'Steingrotte',
        WALL:         0x3a3530,   // warm grey stone
        WALL_TOP:     0x504a42,   // lighter stone top
        WALL_MID:     0x2e2a25,
        FLOOR_A:      0x504840,   // warm stone floor
        FLOOR_B:      0x443c35,
        CRACKED_WALL: 0x484038,
        CRACKED_LINE: 0x6a7090,
        DOOR:         0x5a4a28,
        DOOR_FRAME:   0x998844,
        SECRET_COLOR: 0x383228,
        FOG_TINT:     0x080604,
        ACCENT:       0x8899cc,
        DECO:         'cave',
    },
    {   // 2 – World 5: Ice Crystal (brighter blue-white)
        name:         'Iskrystall',
        WALL:         0x2a4a6a,   // slate blue
        WALL_TOP:     0x3a6080,   // lighter blue top
        WALL_MID:     0x1e3a55,
        FLOOR_A:      0x3a5a7a,   // steel blue floor
        FLOOR_B:      0x304e6a,
        CRACKED_WALL: 0x3a5070,
        CRACKED_LINE: 0x8ac0ee,
        DOOR:         0x2a4868,
        DOOR_FRAME:   0x77ddff,
        SECRET_COLOR: 0x283e58,
        FOG_TINT:     0x040810,
        ACCENT:       0x99eeff,
        DECO:         'ice',
    },
    {   // 3 – World 6: Volcanic Abyss (deep red earth)
        name:         'Vulkandungeon',
        WALL:         0x3a1810,   // dark red-brown
        WALL_TOP:     0x502818,   // brighter red top
        WALL_MID:     0x2a1008,
        FLOOR_A:      0x2a1a12,   // dark warm earth
        FLOOR_B:      0x22140e,
        CRACKED_WALL: 0x3a2010,
        CRACKED_LINE: 0xff5500,
        DOOR:         0x4a2210,
        DOOR_FRAME:   0xff7722,
        SECRET_COLOR: 0x301810,
        FOG_TINT:     0x0a0400,
        ACCENT:       0xff6622,
        DECO:         'volcanic',
    },
    {   // 4 – World 7: Ancient Temple (warm sandstone)
        name:         'Oldtidstempel',
        WALL:         0x5a4a28,   // sandstone
        WALL_TOP:     0x706030,   // lighter sandstone top
        WALL_MID:     0x443a1e,
        FLOOR_A:      0x4a3c20,   // warm sand floor
        FLOOR_B:      0x3e321a,
        CRACKED_WALL: 0x504420,
        CRACKED_LINE: 0xddaa33,
        DOOR:         0x5a4418,
        DOOR_FRAME:   0xffdd33,
        SECRET_COLOR: 0x4a3c1e,
        FOG_TINT:     0x0a0804,
        ACCENT:       0xffdd55,
        DECO:         'temple',
    },
    {   // 5 – Worlds 8-12: Deep Magma (earth with ember)
        name:         'Dyplag',
        WALL:         0x3a1a08,   // deep earth brown
        WALL_TOP:     0x502a10,   // brighter earth top
        WALL_MID:     0x2a1204,
        FLOOR_A:      0x2a1208,   // dark earth
        FLOOR_B:      0x220e06,
        CRACKED_WALL: 0x3a1808,
        CRACKED_LINE: 0xff7733,
        DOOR:         0x4a2410,
        DOOR_FRAME:   0xff9955,
        SECRET_COLOR: 0x301408,
        FOG_TINT:     0x0a0400,
        ACCENT:       0xff7733,
        DECO:         'deep',
    },
    {   // 6 – Worlds 13-18: Underworld (warmer purple)
        name:         'Underverden',
        WALL:         0x2a1840,   // warm purple
        WALL_TOP:     0x3a2855,   // lighter purple top
        WALL_MID:     0x1e1030,
        FLOOR_A:      0x1e1230,   // muted purple floor
        FLOOR_B:      0x180e28,
        CRACKED_WALL: 0x281440,
        CRACKED_LINE: 0x9955dd,
        DOOR:         0x2a1848,
        DOOR_FRAME:   0xbb77ff,
        SECRET_COLOR: 0x201438,
        FOG_TINT:     0x060210,
        ACCENT:       0xbb77ff,
        DECO:         'underworld',
    },
    {   // 7 – Worlds 19-25: Earth's Core (golden amber)
        name:         'Jordens kjerne',
        WALL:         0x4a3a08,   // dark gold
        WALL_TOP:     0x605010,   // amber top
        WALL_MID:     0x382c04,
        FLOOR_A:      0x3a2c06,   // amber floor
        FLOOR_B:      0x302404,
        CRACKED_WALL: 0x443208,
        CRACKED_LINE: 0xffbb22,
        DOOR:         0x4a3608,
        DOOR_FRAME:   0xffee55,
        SECRET_COLOR: 0x382c08,
        FOG_TINT:     0x0a0804,
        ACCENT:       0xffdd22,
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
