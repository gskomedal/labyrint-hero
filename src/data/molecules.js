// ─── Labyrint Hero – Molecules & Chemistry Dataset ───────────────────────────
// Chemical products crafted from pure elements at Chemistry Labs.
// Categories: base compounds, acids, potions, medicines, explosives.
// Recipes are simplified for gameplay – not chemically exact.

const MOLECULE_DEFS = {
    // ── Base compounds (building blocks) ─────────────────────────────────────
    water: {
        id: 'water', name: 'Vann', type: 'molecule', subtype: 'base',
        formula: 'H₂O', tier: 1, color: 0x4488ff, stackSize: 20,
        recipe: [{ symbol: 'H', amount: 1 }, { symbol: 'O', amount: 1 }],
        energyCost: 0,
        effects: { onUse: 'heal', healHP: 1 },
        desc: 'Livgivende vann. Healer 1 HP.'
    },
    calcium_oxide: {
        id: 'calcium_oxide', name: 'Brent kalk', type: 'molecule', subtype: 'medicine',
        formula: 'CaO', tier: 1, color: 0xeeddcc, stackSize: 20,
        recipe: [{ symbol: 'Ca', amount: 1 }, { symbol: 'O', amount: 1 }],
        energyCost: 0,
        effects: { onUse: 'buff', stat: 'defense', amount: 2, durationMs: 45000 },
        desc: '+2 Forsvar i 45 sek. Herder kroppen som kalk herder betong.'
    },
    potassium_nitrate: {
        id: 'potassium_nitrate', name: 'Salpeter', type: 'molecule', subtype: 'explosive',
        formula: 'KNO₃', tier: 2, color: 0xcccccc, stackSize: 20,
        recipe: [{ symbol: 'K', amount: 1 }, { symbol: 'N', amount: 1 }],
        energyCost: 1,
        effects: { onUse: 'bomb', damage: 5, radius: 2 },
        desc: 'Svakt sprengstoff. 5 skade i radius 2.'
    },

    // ── Acids ────────────────────────────────────────────────────────────────
    sulfuric_acid: {
        id: 'sulfuric_acid', name: 'Svovelsyre', type: 'molecule', subtype: 'acid',
        formula: 'H₂SO₄', tier: 2, color: 0xdddd00, stackSize: 10,
        recipe: [{ symbol: 'S', amount: 1 }, { symbol: 'H', amount: 1 }],
        energyCost: 1,
        effects: { onUse: 'acid_bomb', damage: 4, radius: 2, statusEffect: 'acid_burn', duration: 3 },
        desc: 'Sterk syre. Kast for å etse monstre (4 skade).'
    },
    hydrochloric_acid: {
        id: 'hydrochloric_acid', name: 'Saltsyre', type: 'molecule', subtype: 'acid',
        formula: 'HCl', tier: 2, color: 0xaaff44, stackSize: 10,
        recipe: [{ symbol: 'H', amount: 1 }, { symbol: 'Cl', amount: 1 }],
        energyCost: 1,
        effects: { onUse: 'acid_bomb', damage: 3, radius: 2, statusEffect: 'acid_burn', duration: 2 },
        desc: 'Svakere syre. Billig å lage.'
    },

    // ── Potions ──────────────────────────────────────────────────────────────
    chem_health_pot: {
        id: 'chem_health_pot', name: 'Kjemisk livselixir', type: 'molecule', subtype: 'potion',
        formula: 'Fe + Ca', tier: 2, color: 0xff4466, stackSize: 10,
        recipe: [{ symbol: 'Fe', amount: 1 }, { symbol: 'Ca', amount: 1 }],
        energyCost: 1,
        effects: { onUse: 'heal', healHP: 4 },
        desc: 'Kraftig helbredelse. +4 HP.'
    },
    strength_elixir: {
        id: 'strength_elixir', name: 'Styrkeelixir', type: 'molecule', subtype: 'potion',
        formula: 'Fe + P', tier: 2, color: 0xff8800, stackSize: 10,
        recipe: [{ symbol: 'Fe', amount: 1 }, { symbol: 'P', amount: 1 }],
        energyCost: 1,
        effects: { onUse: 'buff', stat: 'attack', amount: 3, durationMs: 90000 },
        desc: '+3 Angrep i 90 sek.'
    },
    defense_elixir: {
        id: 'defense_elixir', name: 'Forsvarselixir', type: 'molecule', subtype: 'potion',
        formula: 'Ca + Mg', tier: 2, color: 0x4488ff, stackSize: 10,
        recipe: [{ symbol: 'Ca', amount: 1 }, { symbol: 'Mg', amount: 1 }],
        energyCost: 1,
        effects: { onUse: 'buff', stat: 'defense', amount: 2, durationMs: 90000 },
        desc: '+2 Forsvar i 90 sek.'
    },
    invisibility_potion: {
        id: 'invisibility_potion', name: 'Usynlighetsdrikk', type: 'molecule', subtype: 'potion',
        formula: 'Cr + Si', tier: 3, color: 0xaaccee, stackSize: 5,
        recipe: [{ symbol: 'Cr', amount: 1 }, { symbol: 'Si', amount: 1 }],
        energyCost: 2,
        effects: { onUse: 'invisibility', durationMs: 30000 },
        desc: 'Usynlig i 30 sek. Monstre ignorerer deg.'
    },

    // ── Medicines ────────────────────────────────────────────────────────────
    chem_antidote: {
        id: 'chem_antidote', name: 'Universell motgift', type: 'molecule', subtype: 'medicine',
        formula: 'Ca + Ag', tier: 2, color: 0x88ee44, stackSize: 10,
        recipe: [{ symbol: 'Ca', amount: 1 }, { symbol: 'Ag', amount: 1 }],
        energyCost: 1,
        effects: { onUse: 'cure_all', healHP: 2 },
        desc: 'Fjerner ALLE statuseffekter og healer 2 HP.'
    },
    painkiller: {
        id: 'painkiller', name: 'Smertestillende', type: 'molecule', subtype: 'medicine',
        formula: 'Ca + Mg', tier: 1, color: 0xddbbaa, stackSize: 10,
        recipe: [{ symbol: 'Ca', amount: 1 }, { symbol: 'Mg', amount: 1 }],
        energyCost: 0,
        effects: { onUse: 'buff', stat: 'defense', amount: 3, durationMs: 60000 },
        desc: '+3 Forsvar i 60 sek. Tåler mer skade.'
    },

    // ── Explosives ───────────────────────────────────────────────────────────
    black_powder: {
        id: 'black_powder', name: 'Krutt', type: 'molecule', subtype: 'explosive',
        formula: 'K + S + C', tier: 2, color: 0x333333, stackSize: 10,
        recipe: [{ symbol: 'K', amount: 1 }, { symbol: 'S', amount: 1 }, { symbol: 'C', amount: 1 }],
        energyCost: 1,
        effects: { onUse: 'bomb', damage: 8, radius: 3 },
        desc: 'Klassisk krutt. 8 skade i radius 3.'
    },
    smoke_bomb: {
        id: 'smoke_bomb', name: 'Røykbombe', type: 'molecule', subtype: 'explosive',
        formula: 'K + S', tier: 2, color: 0x888888, stackSize: 10,
        recipe: [{ symbol: 'K', amount: 1 }, { symbol: 'S', amount: 1 }],
        energyCost: 1,
        effects: { onUse: 'smoke', radius: 4, stunDuration: 2 },
        desc: 'Røykteppe: Stunner monstre i radius 4 i 2 runder.'
    },
    acid_bomb: {
        id: 'acid_bomb', name: 'Syrebombe', type: 'molecule', subtype: 'explosive',
        formula: 'S + Fe', tier: 3, color: 0xcccc00, stackSize: 5,
        recipe: [{ symbol: 'S', amount: 2 }, { symbol: 'Fe', amount: 1 }],
        energyCost: 2,
        effects: { onUse: 'acid_bomb', damage: 6, radius: 3, statusEffect: 'acid_burn', duration: 4 },
        desc: 'AoE syreskade: 6 skade + etsende i 4 runder.'
    },
    dynamite: {
        id: 'dynamite', name: 'Dynamitt', type: 'molecule', subtype: 'explosive',
        formula: 'C + N', tier: 4, color: 0xff4422, stackSize: 5,
        recipe: [{ symbol: 'C', amount: 2 }, { symbol: 'N', amount: 2 }],
        energyCost: 3,
        effects: { onUse: 'bomb', damage: 15, radius: 4 },
        desc: 'Massiv eksplosjon! 15 skade i radius 4.'
    },
};

// ── Tier colors for molecules ────────────────────────────────────────────────
const MOLECULE_TIER_COLORS = {
    1: 0x888888,
    2: 0x33dd88,
    3: 0x44aaff,
    4: 0xaa44ff,
};
