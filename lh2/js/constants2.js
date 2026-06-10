// ─── Labyrint Hero 2 – Constants ─────────────────────────────────────────────
// LH2 namespace. XP curve constants are copied verbatim from the main game
// (src/constants.js) so both games share the same progression feel.

const LH2 = {
    // Deterministic world: fixed seed means the island is identical every
    // session, so saves only need to store depletion state and positions.
    SEED: 20260610,

    // Surface island
    WORLD_SIZE: 400,        // world units, square
    TERRAIN_SEGMENTS: 160,  // heightmap resolution per side
    TERRAIN_HEIGHT: 34,     // max terrain elevation
    WATER_LEVEL: 0.0,       // y of the ocean plane
    MIN_WALK_HEIGHT: 0.5,   // can't walk below this (into the ocean)

    // Caves (chained labyrinth zones, each reached from the one above)
    CAVE_TUNNEL_WIDTH: 6,   // world units per maze tile (tunnel width)

    // Maze structures (stone labyrinths on the surface and in every cave)
    MAZE_TILE: 3,           // world units per maze tile
    MAZE_WALL_HEIGHT: 3.2,  // above MAX_STEP_HEIGHT, so walls block movement

    // XP curve – same as Labyrint Hero 1
    XP_BASE: 100,
    XP_GROWTH: 1.55,

    // Player
    WALK_SPEED: 8,
    SPRINT_SPEED: 14,
    JUMP_SPEED: 9,
    GRAVITY: 24,
    MAX_STEP_HEIGHT: 2.5,   // reject horizontal moves up steeper ledges
    INTERACT_RADIUS: 3.5,

    // Mining
    MINE_TIME_MS: 1200,
    CHOP_TIME_MS: 1500,
    NODE_RESPAWN_MS: 90000,

    // Resource density (LH1-like scarcity: few but meaningful finds)
    SURFACE_ORE_NODES: 10,
    CAVE_ORE_NODES: 9,
    MAZE_REWARD_NODES: 3,

    // Direct element sources are RARE, like LH1: a few noble-gas pockets in
    // the deep zones, and native gold/silver/platinum finds at the bottom.
    // Everything else must be smelted from minerals.
    GAS_BY_TIER:    { 3: ['Ar'], 4: ['He', 'Ne', 'Kr'], 5: ['Xe', 'Rn'] },
    NATIVE_BY_TIER: { 4: ['Au', 'Ag'], 5: ['Au', 'Pt', 'Ir'] },

    // Creatures
    SURFACE_RABBITS: 6,
    SURFACE_BIRDS: 4,
    CAVE_MONSTERS: 4,
    MONSTER_AGGRO_RADIUS: 11,
    MONSTER_ATTACK_COOLDOWN_MS: 1400,
    MONSTER_RESPAWN_MS: 60000,
    HIT_RANGE: 2.6,
    MAX_HEARTS: 5,

    SAVE_KEY: 'labyrint_hero_2_v1',

    // Underground zones – names and tier progression from LH1's ZONES
    CAVE_ZONES: [
        { id: 'cave_2', name: 'Grunnfjell',     tier: 2, fogColor: 0x2a2520, lightColor: 0xcc9966 },
        { id: 'cave_3', name: 'Dyplag',         tier: 3, fogColor: 0x1a2030, lightColor: 0x6699cc },
        { id: 'cave_4', name: 'Underverden',    tier: 4, fogColor: 0x261a2e, lightColor: 0xaa66cc },
        { id: 'cave_5', name: 'Jordens kjerne', tier: 5, fogColor: 0x301512, lightColor: 0xff6633 },
    ],

    // Science paths – colors match LH1's skill path palette
    SCIENCES: [
        { id: 'geologi',    name: 'Geologi',    color: '#bb9966' },
        { id: 'metallurgi', name: 'Metallurgi', color: '#ff7722' },
        { id: 'kjemi',      name: 'Kjemi',      color: '#33dd88' },
        { id: 'fysikk',     name: 'Fysikk',     color: '#5599ff' },
    ],
};
