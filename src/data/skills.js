// ─── Labyrint Hero – Skill Tree ───────────────────────────────────────────────
// Four specialization paths, each with 3 tiers.
// Tier 1 is always unlocked. Tier 2 requires ≥1 skill from that path's T1.
// Tier 3 requires ≥1 skill from that path's T2.
// Each skill can generally be stacked 2× (maxStack), T3 skills only 1×.

const SKILL_TREE_PATHS = [
    // ── KRIGAR (Warrior) ───────────────────────────────────────────────────────
    {
        id:    'krigar',
        name:  'Krigar',
        desc:  'Kamp og råstyrke',
        color: 0xff4422,
        icon:  'K',
        tiers: [
            {
                id:       'power_strike',
                name:     'Kraftig slag',
                desc:     '+2 Angrep',
                category: 'ATK',
                maxStack: 3,
                apply(hero) { hero.attack += 2; }
            },
            {
                id:       'battle_hardened',
                name:     'Kampherdet',
                desc:     '+2 ATK, +1 DEF\nRaskere angrep',
                category: 'ATK',
                maxStack: 2,
                apply(hero) { hero.attack += 2; hero.defense += 1; hero.attackSpeedBonus = (hero.attackSpeedBonus || 0) + 100; }
            },
            {
                id:       'giant_strength',
                name:     'Jotunstyrke',
                desc:     '+5 Angrep\n(krever T2)',
                category: 'ATK',
                maxStack: 1,
                apply(hero) { hero.attack += 5; }
            },
        ]
    },

    // ── VOKTER (Guardian) ──────────────────────────────────────────────────────
    {
        id:    'vokter',
        name:  'Vokter',
        desc:  'Forsvar og utholdenhet',
        color: 0x2266cc,
        icon:  'V',
        tiers: [
            {
                id:       'thick_skin',
                name:     'Tykk hud',
                desc:     '+1 Forsvar',
                category: 'DEF',
                maxStack: 3,
                apply(hero) { hero.defense += 1; }
            },
            {
                id:       'bulwark',
                name:     'Festning',
                desc:     '+1 Forsvar\n+1 Hjerte',
                category: 'DEF',
                maxStack: 2,
                apply(hero) { hero.defense += 1; hero.maxHearts++; }
            },
            {
                id:       'iron_health',
                name:     'Jernhelse',
                desc:     '+2 maks hjerter\n(krever T2)',
                category: 'HP',
                maxStack: 1,
                apply(hero) { hero.maxHearts += 2; }
            },
        ]
    },

    // ── JEGER (Hunter) ─────────────────────────────────────────────────────────
    {
        id:    'jeger',
        name:  'Jeger',
        desc:  'Syn, presisjon og kritiske treff',
        color: 0x44dd88,
        icon:  'J',
        tiers: [
            {
                id:       'keen_eye',
                name:     'Skarpsyn',
                desc:     '+2 synsradius',
                category: 'VIS',
                maxStack: 2,
                apply(hero) { hero.visionRadius += 2; }
            },
            {
                id:       'vital_strike',
                name:     'Vitalt anslag',
                desc:     '+25% kritisk-\nsjanse (×2 skade)',
                category: 'ATK',
                maxStack: 2,
                apply(hero) { hero.critChance = Math.min(0.75, hero.critChance + 0.25); }
            },
            {
                id:       'precision',
                name:     'Presisjon',
                desc:     '+3 Angrep\n(krever T2)',
                category: 'ATK',
                maxStack: 1,
                apply(hero) { hero.attack += 3; }
            },
        ]
    },

    // ── SKURK (Rogue) ──────────────────────────────────────────────────────────
    {
        id:    'skurk',
        name:  'Skurk',
        desc:  'Unnvikelse og erfaring',
        color: 0xaa44ff,
        icon:  'S',
        tiers: [
            {
                id:       'xp_boost',
                name:     'Kunnskap',
                desc:     '+30% XP fra alt',
                category: 'UTIL',
                maxStack: 2,
                apply(hero) { hero.xpMultiplier += 0.30; }
            },
            {
                id:       'dodge',
                name:     'Unnvikelse',
                desc:     '+20% sjanse\nfor å unngå',
                category: 'UTIL',
                maxStack: 2,
                apply(hero) { hero.dodgeChance = Math.min(0.6, hero.dodgeChance + 0.20); }
            },
            {
                id:       'regen',
                name:     'Blomstersaft',
                desc:     'Gjenoppretter\n2 hjerter nå',
                category: 'HP',
                maxStack: 99,
                apply(hero) { hero.hearts = Math.min(hero.hearts + 2, hero.maxHearts); }
            },
        ]
    },

    // ── DYREVOKTER (Beast Keeper) ─────────────────────────────────────────────
    {
        id:    'dyrevokter',
        name:  'Dyrevokter',
        desc:  'Styrk ditt kjæledyr',
        color: 0xffaa44,
        icon:  'D',
        tiers: [
            {
                id:       'beast_ferocity',
                name:     'Villskap',
                desc:     '+2 kjæledyr-\nangrep',
                category: 'PET',
                maxStack: 3,
                apply(hero) { hero.petBonusAtk = (hero.petBonusAtk || 0) + 2; }
            },
            {
                id:       'beast_vitality',
                name:     'Dyrisk livskraft',
                desc:     '+3 kjæledyr-HP\n+1 kjæledyr-forsvar',
                category: 'PET',
                maxStack: 2,
                apply(hero) { hero.petBonusHp = (hero.petBonusHp || 0) + 3; hero.petBonusDef = (hero.petBonusDef || 0) + 1; }
            },
            {
                id:       'beast_bond',
                name:     'Sjelsbånd',
                desc:     '+3 kjæledyr-angrep\n+3 kjæledyr-HP\n(krever T2)',
                category: 'PET',
                maxStack: 1,
                apply(hero) { hero.petBonusAtk = (hero.petBonusAtk || 0) + 3; hero.petBonusHp = (hero.petBonusHp || 0) + 3; }
            },
        ]
    },
];

// ── Flat list for backward compat (save/load, apply) ──────────────────────────
const SKILL_DEFS = SKILL_TREE_PATHS.flatMap(path => path.tiers);

/**
 * Count how many times a skill has been taken from hero.skills[].
 */
function _countSkill(hero, id) {
    return (hero.skills || []).filter(s => s === id).length;
}

/**
 * Check whether a skill slot in the tree is available to pick.
 *   tier 0 (T1) – always available (if not maxed)
 *   tier 1 (T2) – need ≥1 T1 skill from same path
 *   tier 2 (T3) – need ≥1 T2 skill from same path
 */
function isSkillUnlocked(hero, pathIndex, tierIndex) {
    const path  = SKILL_TREE_PATHS[pathIndex];
    const skill = path.tiers[tierIndex];

    // Already at max stack → not available
    if (_countSkill(hero, skill.id) >= skill.maxStack) return false;

    if (tierIndex === 0) return true;   // T1 always unlocked

    // Needs previous tier to be fully maxed before advancing
    const prevSkill = path.tiers[tierIndex - 1];
    return _countSkill(hero, prevSkill.id) >= prevSkill.maxStack;
}

/**
 * Return all currently pickable skills as { pathIndex, tierIndex, skill } objects.
 */
function getAvailableSkills(hero) {
    const available = [];
    SKILL_TREE_PATHS.forEach((path, pi) => {
        path.tiers.forEach((skill, ti) => {
            if (isSkillUnlocked(hero, pi, ti)) {
                available.push({ pathIndex: pi, tierIndex: ti, skill });
            }
        });
    });
    return available;
}

// ── Cross-path synergies ──────────────────────────────────────────────────────
// Auto-activate when hero has ≥1 skill from each path in the pair.

const SKILL_SYNERGIES = [
    {
        id:    'counter_attack',
        name:  'Motangrep',
        desc:  '20% sjanse for motangrep ved treff',
        paths: ['krigar', 'jeger'],
        color: 0xff8844,
        apply(hero) { hero.counterChance = Math.min(0.4, (hero.counterChance || 0) + 0.20); },
        unapply(hero) { hero.counterChance = Math.max(0, (hero.counterChance || 0) - 0.20); },
    },
    {
        id:    'thorns',
        name:  'Tornehud',
        desc:  'Angripere tar 1 skade',
        paths: ['vokter', 'skurk'],
        color: 0x44ddaa,
        apply(hero) { hero.thornsDamage = (hero.thornsDamage || 0) + 1; },
        unapply(hero) { hero.thornsDamage = Math.max(0, (hero.thornsDamage || 0) - 1); },
    },
    {
        id:    'unbreakable',
        name:  'Uovervinnelig',
        desc:  '+2 Angrep, +1 Forsvar, +1 Hjerte',
        paths: ['krigar', 'vokter'],
        color: 0xff6644,
        apply(hero) { hero.attack += 2; hero.defense += 1; hero.maxHearts += 1; },
        unapply(hero) { hero.attack -= 2; hero.defense -= 1; hero.maxHearts -= 1; hero.hearts = Math.min(hero.hearts, hero.maxHearts); },
    },
    {
        id:    'shadow_hunter',
        name:  'Skyggejeger',
        desc:  '+15% unnvikelse, +1 synsfelt',
        paths: ['jeger', 'skurk'],
        color: 0x9966ff,
        apply(hero) { hero.dodgeChance = Math.min(0.6, hero.dodgeChance + 0.15); hero.visionRadius += 1; },
        unapply(hero) { hero.dodgeChance = Math.max(0, hero.dodgeChance - 0.15); hero.visionRadius -= 1; },
    },
    {
        id:    'pack_leader',
        name:  'Flokkleder',
        desc:  '+2 Angrep, +2 kjæledyr-angrep',
        paths: ['krigar', 'dyrevokter'],
        color: 0xff7733,
        apply(hero) { hero.attack += 2; hero.petBonusAtk = (hero.petBonusAtk || 0) + 2; },
        unapply(hero) { hero.attack -= 2; hero.petBonusAtk = Math.max(0, (hero.petBonusAtk || 0) - 2); },
    },
    {
        id:    'natures_ward',
        name:  'Naturens vern',
        desc:  '+2 kjæledyr-HP, +1 Forsvar',
        paths: ['vokter', 'dyrevokter'],
        color: 0x44aa88,
        apply(hero) { hero.defense += 1; hero.petBonusHp = (hero.petBonusHp || 0) + 2; },
        unapply(hero) { hero.defense -= 1; hero.petBonusHp = Math.max(0, (hero.petBonusHp || 0) - 2); },
    },
];

/** Check which synergies are active for a hero and return their IDs. */
function getActiveSynergies(hero) {
    const pathCounts = {};
    for (const skillId of (hero.skills || [])) {
        for (const path of SKILL_TREE_PATHS) {
            if (path.tiers.some(t => t.id === skillId)) {
                pathCounts[path.id] = (pathCounts[path.id] || 0) + 1;
            }
        }
    }
    return SKILL_SYNERGIES.filter(syn =>
        syn.paths.every(p => (pathCounts[p] || 0) >= 1)
    );
}

/** Apply all earned synergies that aren't already active. Call after picking a skill. */
function applySynergies(hero) {
    const active  = getActiveSynergies(hero);
    const applied = hero._appliedSynergies || [];

    // Remove synergies no longer active
    for (const id of applied) {
        if (!active.some(s => s.id === id)) {
            const syn = SKILL_SYNERGIES.find(s => s.id === id);
            if (syn) syn.unapply(hero);
        }
    }

    // Apply newly active synergies
    const newApplied = [];
    for (const syn of active) {
        if (!applied.includes(syn.id)) {
            syn.apply(hero);
        }
        newApplied.push(syn.id);
    }

    hero._appliedSynergies = newApplied;
    return active;
}
