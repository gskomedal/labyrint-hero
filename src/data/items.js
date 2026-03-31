// ─── Labyrint Hero – Item Definitions ────────────────────────────────────────
// type: 'weapon' | 'armor' | 'consumable' | 'tool'
// Weapons/armor: { atk?, def? }  – applied on equip, removed on unequip
// Consumables:   use(hero, scene) → returns true if item is consumed
// subtype: 'bow' marks ranged weapons
// Tools: pickaxe, key – have special in-world interactions

// ─── Rarity System ───────────────────────────────────────────────────────────
const RARITIES = [
    { id: 'common',    label: 'Vanlig',      color: 0xaaaaaa, textColor: '#aaaaaa', statMul: 1.0  },
    { id: 'rare',      label: 'Sjelden',     color: 0x4488ff, textColor: '#4488ff', statMul: 1.25 },
    { id: 'epic',      label: 'Episk',       color: 0xaa44ff, textColor: '#aa44ff', statMul: 1.5  },
    { id: 'legendary', label: 'Legendarisk', color: 0xff8800, textColor: '#ff8800', statMul: 2.0  },
    { id: 'mythic',    label: 'Mytisk',      color: 0xff2244, textColor: '#ff2244', statMul: 3.0  },
];
const RARITY_BY_ID = {};
RARITIES.forEach(r => RARITY_BY_ID[r.id] = r);

/** Roll a rarity based on world number. Higher worlds = better odds.
 *  @param {number} worldNum Current world
 *  @param {number} minIdx   Minimum rarity index (0=common, 1=rare, etc.)
 */
function rollRarity(worldNum, minIdx = 0) {
    const baseWeights = [60, 25, 10, 4, 1];
    const shift = Math.min(worldNum - 1, 6) * 3;
    const weights = baseWeights.map((w, i) => {
        if (i === 0) return Math.max(15, w - shift * 2);
        return w + shift * (i * 0.5);
    });
    for (let i = 0; i < minIdx; i++) weights[i] = 0;
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
        roll -= weights[i];
        if (roll <= 0) return RARITIES[i];
    }
    return RARITIES[0];
}

/** Create a rarity-enhanced copy of a base item definition.
 *  Consumables and tools are returned as-is (no rarity). */
function makeRarityItem(baseDef, rarity) {
    if (!baseDef) return baseDef;
    if (baseDef.type === 'consumable' || baseDef.type === 'tool') return baseDef;

    const r = typeof rarity === 'string' ? RARITY_BY_ID[rarity] : rarity;
    if (!r) return { ...baseDef, rarity: 'common' };

    const item = { ...baseDef, rarity: r.id, rarityColor: r.color, rarityLabel: r.label };
    if (r.id === 'common') return item;

    if (item.atk)    item.atk    = Math.max(1, Math.round(baseDef.atk * r.statMul));
    if (item.def)    item.def    = Math.max(1, Math.round(baseDef.def * r.statMul));
    if (item.hearts) item.hearts = Math.max(1, Math.round(baseDef.hearts * r.statMul));
    item.name = `${r.label} ${baseDef.name}`;
    // Rebuild description with boosted stats
    const parts = [];
    if (item.atk) parts.push(`+${item.atk} Angrep`);
    if (item.def) parts.push(`+${item.def} Forsvar`);
    if (item.hearts) parts.push(`+${item.hearts} Hjerte`);
    if (item.subtype === 'bow' && item.atk) parts.push('(trykk R)');
    if (parts.length) item.desc = parts.join(', ');
    return item;
}

const ITEM_DEFS = {
    // ── Melee Weapons ─────────────────────────────────────────────────────────
    dagger: {
        id: 'dagger', name: 'Dolk', type: 'weapon',
        color: 0x88aacc, desc: '+1 Angrep', atk: 1, tier: 1
    },
    wood_sword: {
        id: 'wood_sword', name: 'Tresverd', type: 'weapon',
        color: 0xaa7733, desc: '+2 Angrep', atk: 2, tier: 1
    },
    spear: {
        id: 'spear', name: 'Spyd', type: 'weapon',
        color: 0xccbb77, desc: '+3 Angrep', atk: 3, tier: 2
    },
    iron_sword: {
        id: 'iron_sword', name: 'Jernsverd', type: 'weapon',
        color: 0xaaaacc, desc: '+3 Angrep', atk: 3, tier: 2
    },
    battle_axe: {
        id: 'battle_axe', name: 'Stridsøks', type: 'weapon',
        color: 0xcc6622, desc: '+4 Angrep', atk: 4, tier: 3
    },
    war_hammer: {
        id: 'war_hammer', name: 'Krigshammer', type: 'weapon',
        color: 0x886644, desc: '+5 Angrep', atk: 5, tier: 4
    },
    magic_staff: {
        id: 'magic_staff', name: 'Trollstav', type: 'weapon',
        color: 0xaa44ff, desc: '+3 Angrep, +2 Forsvar', atk: 3, def: 2, tier: 3
    },

    // ── Ranged Weapons (subtype: 'bow') ───────────────────────────────────────
    shortbow: {
        id: 'shortbow', name: 'Kortbue', type: 'weapon', subtype: 'bow',
        color: 0x996633, desc: '+3 Angrep på avstand (trykk R)', atk: 3, tier: 2
    },
    elven_bow: {
        id: 'elven_bow', name: 'Alvebue', type: 'weapon', subtype: 'bow',
        color: 0x55cc88, desc: '+4 Angrep på avstand (trykk R)', atk: 4, tier: 3
    },
    crossbow: {
        id: 'crossbow', name: 'Armbrøst', type: 'weapon', subtype: 'bow',
        color: 0x886644, desc: '+5 Angrep på avstand (trykk R)', atk: 5, tier: 4
    },

    // ── Armor ─────────────────────────────────────────────────────────────────
    leather_armor: {
        id: 'leather_armor', name: 'Lærpansring', type: 'armor',
        color: 0x886633, desc: '+1 Forsvar', def: 1, tier: 1
    },
    padded_vest: {
        id: 'padded_vest', name: 'Vattert vest', type: 'armor',
        color: 0x998866, desc: '+1 Forsvar, +1 hjerte', def: 1, hearts: 1, tier: 1
    },
    chain_mail: {
        id: 'chain_mail', name: 'Ringbrynje', type: 'armor',
        color: 0x8899aa, desc: '+2 Forsvar', def: 2, tier: 2
    },
    plate_armor: {
        id: 'plate_armor', name: 'Platedrakt', type: 'armor',
        color: 0xccccdd, desc: '+3 Forsvar', def: 3, tier: 3
    },
    robe_magic: {
        id: 'robe_magic', name: 'Magikappe', type: 'armor',
        color: 0x6633aa, desc: '+2 Forsvar, +1 Angrep', def: 2, atk: 1, tier: 3
    },
    dragon_scale: {
        id: 'dragon_scale', name: 'Drageskjell', type: 'armor',
        color: 0xff6622, desc: '+4 Forsvar', def: 4, tier: 4
    },

    // ── Consumables ───────────────────────────────────────────────────────────
    health_pot: {
        id: 'health_pot', name: 'Livspotte', type: 'consumable',
        color: 0xff2244, desc: 'Gjenoppretter 2 hjerter', tier: 1,
        use(hero) { hero.hearts = Math.min(hero.hearts + 2, hero.maxHearts); return true; }
    },
    big_health_pot: {
        id: 'big_health_pot', name: 'Stor livspotte', type: 'consumable',
        color: 0xff0000, desc: 'Gjenoppretter alle hjerter', tier: 2,
        use(hero) { hero.hearts = hero.maxHearts; return true; }
    },
    strength_brew: {
        id: 'strength_brew', name: 'Styrkebrygg', type: 'consumable',
        color: 0xff8800, desc: '+2 Angrep (60 sek)', tier: 2,
        use(hero) { hero.addTempBuff('attack', 2, 60000); return true; }
    },
    defense_brew: {
        id: 'defense_brew', name: 'Forsvarsbrygg', type: 'consumable',
        color: 0x4488ff, desc: '+1 Forsvar (60 sek)', tier: 2,
        use(hero) { hero.addTempBuff('defense', 1, 60000); return true; }
    },
    xp_scroll: {
        id: 'xp_scroll', name: 'Erfaringsrulle', type: 'consumable',
        color: 0xaabbff, desc: 'Gir 80 XP', tier: 2,
        use(hero) { hero.gainXP(80); return true; }
    },
    antidote: {
        id: 'antidote', name: 'Motgift', type: 'consumable',
        color: 0x88ee44, desc: 'Kurerer alle statuseffekter og gjenoppretter 1 hjerte', tier: 1,
        use(hero) {
            hero.clearAllEffects();
            hero.hearts = Math.min(hero.hearts + 1, hero.maxHearts);
            return true;
        }
    },
    frost_salve: {
        id: 'frost_salve', name: 'Frostsalve', type: 'consumable',
        color: 0x88ddff, desc: 'Kurerer frostbitt og gir motstand mot kulde', tier: 2,
        use(hero) {
            hero.slowTurns = 0;
            hero.hearts = Math.min(hero.hearts + 1, hero.maxHearts);
            hero._drawSprite();
            return true;
        }
    },
    burn_salve: {
        id: 'burn_salve', name: 'Brannsalve', type: 'consumable',
        color: 0xff8844, desc: 'Kurerer brannsår og gjenoppretter 2 hjerter', tier: 2,
        use(hero) {
            hero.burnTurns = 0;
            hero.hearts = Math.min(hero.hearts + 2, hero.maxHearts);
            hero._drawSprite();
            return true;
        }
    },
    bomb: {
        id: 'bomb', name: 'Bombe', type: 'consumable',
        color: 0x333333, desc: 'Skader alle monstre innen 3 ruter (6 skade)', tier: 2,
        use(hero, scene) {
            if (!scene) return false;
            for (const m of scene.monsters) {
                if (!m.alive) continue;
                const d = Math.abs(m.gridX - hero.gridX) + Math.abs(m.gridY - hero.gridY);
                if (d <= 3) m.takeDamage(6);
            }
            scene.monsters = scene.monsters.filter(m => m.alive);
            return true;
        }
    },
    flashbang: {
        id: 'flashbang', name: 'Blendgranate', type: 'consumable',
        color: 0xffffcc, desc: 'Halvér angrepet til monstre innen 4 ruter', tier: 2,
        use(hero, scene) {
            if (!scene) return false;
            for (const m of scene.monsters) {
                if (!m.alive) continue;
                const d = Math.abs(m.gridX - hero.gridX) + Math.abs(m.gridY - hero.gridY);
                if (d <= 4) m.attack = Math.max(1, Math.floor(m.attack / 2));
            }
            return true;
        }
    },
    map_scroll: {
        id: 'map_scroll', name: 'Kart-rulle', type: 'consumable',
        color: 0xeecc88, desc: 'Avslører hele labyrinten', tier: 2,
        use(hero, scene) {
            if (!scene) return false;
            for (let y = 0; y < scene.tileH; y++)
                for (let x = 0; x < scene.tileW; x++)
                    if (scene.fog[y][x] === FOG.DARK) scene.fog[y][x] = FOG.DIM;
            scene.mapRenderer.updateFog();
            return true;
        }
    },
    heart_crystal: {
        id: 'heart_crystal', name: 'Hjerte-krystall', type: 'consumable',
        color: 0xff44aa, desc: '+1 Maks-hjerte (permanent)', tier: 3,
        use(hero) {
            hero.maxHearts += 1;
            hero.hearts = Math.min(hero.hearts + 1, hero.maxHearts);
            return true;
        }
    },

    // ── Pet eggs ──────────────────────────────────────────────────────────────
    pet_egg: {
        id: 'pet_egg', name: 'Kjæledyr-egg', type: 'consumable',
        color: 0xffaadd, desc: 'Et mystisk egg. Brukes automatisk.', tier: 2,
        isPetEgg: true,
        use() { return false; }  // Handled by ItemSpawner on pickup
    },

    // ── Tools (in-world use, not manual use from inventory) ───────────────────
    key: {
        id: 'key', name: 'Nøkkel', type: 'tool',
        color: 0xffcc00, desc: 'Bær den – åpner låste dører automatisk',
        tier: 1,
        use() { return false; }   // Auto-consumed by door logic in GameScene
    },
    pickaxe: {
        id: 'pickaxe', name: 'Hakke', type: 'tool',
        color: 0xaa7744, desc: 'Bruk SPACE/F mot sprekket vegg for å bryte igjennom',
        tier: 1,
        use() { return false; }   // Consumed by cracked-wall logic in GameScene
    }
};

/** Pool of item IDs by tier (tools excluded – placed separately) */
const ITEM_POOL = {
    1: ['dagger', 'wood_sword', 'leather_armor', 'padded_vest', 'health_pot', 'antidote'],
    2: ['spear', 'iron_sword', 'shortbow', 'chain_mail',
        'health_pot', 'big_health_pot', 'strength_brew', 'defense_brew',
        'xp_scroll', 'bomb', 'map_scroll', 'frost_salve', 'burn_salve'],
    3: ['battle_axe', 'war_hammer', 'elven_bow', 'plate_armor', 'robe_magic',
        'big_health_pot', 'strength_brew', 'defense_brew', 'bomb',
        'flashbang', 'heart_crystal', 'map_scroll', 'frost_salve', 'burn_salve'],
    4: ['war_hammer', 'crossbow', 'magic_staff', 'robe_magic', 'plate_armor',
        'dragon_scale', 'big_health_pot', 'strength_brew', 'bomb',
        'heart_crystal', 'flashbang', 'frost_salve', 'burn_salve']
};

/** Return a random item def appropriate for the given world number.
 *  Equipment gets a random rarity; consumables/tools are unaffected.
 *  @param {number} minRarityIdx  Minimum rarity (0=common, 1=rare, etc.)
 */
function randomItemForWorld(worldNum, minRarityIdx = 0) {
    const tier = Math.min(4, Math.ceil(worldNum / 2));
    const pool = ITEM_POOL[tier];
    const baseDef = ITEM_DEFS[pool[Math.floor(Math.random() * pool.length)]];
    const rarity = rollRarity(worldNum, minRarityIdx);
    return makeRarityItem(baseDef, rarity);
}

/** Return a random item of a specific type for the given tier, excluding ids in the exclude Set */
function randomItemByType(worldNum, type, exclude = new Set(), minRarityIdx = 0) {
    const tier = Math.min(4, Math.ceil(worldNum / 2));
    const pool = ITEM_POOL[tier].filter(id => ITEM_DEFS[id].type === type && !exclude.has(id));
    if (pool.length === 0) return null;
    const baseDef = ITEM_DEFS[pool[Math.floor(Math.random() * pool.length)]];
    const rarity = rollRarity(worldNum, minRarityIdx);
    return makeRarityItem(baseDef, rarity);
}
