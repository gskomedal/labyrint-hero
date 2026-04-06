// ─── Labyrint Hero – Skill Tree ───────────────────────────────────────────────
// Consolidated specialization paths, each with 3 tiers.
// Tier 1 is always unlocked. Tier 2 requires T1 maxed from same path.
// Tier 3 requires T2 maxed from same path.
// Each skill can generally be stacked 2–3× (maxStack), T3 skills only 1×.

// ── Legacy skill migration ───────────────────────────────────────────────────
// Maps old skill IDs from before consolidation to their new equivalents.
const LEGACY_SKILL_MAP = {
    'thick_skin':      'power_strike',      // Vokter T1 → Kriger T1
    'bulwark':         'battle_hardened',    // Vokter T2 → Kriger T2
    'iron_health':     'giant_strength',     // Vokter T3 → Kriger T3
    'xp_boost':        'keen_eye',           // Skurk T1 → Villmarksjeger T1
    'dodge':           'vital_strike',       // Skurk T2 → Villmarksjeger T2
    'regen':           'precision',          // Skurk T3 → Villmarksjeger T3
    'beast_ferocity':  'keen_eye',           // Dyrevokter T1 → Villmarksjeger T1
    'beast_vitality':  'vital_strike',       // Dyrevokter T2 → Villmarksjeger T2
    'beast_bond':      'precision',          // Dyrevokter T3 → Villmarksjeger T3
};

/** Migrate a hero's skill list from legacy IDs to current ones. */
function migrateSkills(skills) {
    if (!skills) return skills;
    return skills.map(id => LEGACY_SKILL_MAP[id] || id);
}

const SKILL_TREE_PATHS = [
    // ── KRIGER (Warrior + Guardian merged) ────────────────────────────────────
    {
        id:    'kriger',
        name:  'Kriger',
        desc:  'Kamp, forsvar og utholdenhet',
        color: 0xff4422,
        icon:  'K',
        tiers: [
            {
                id:       'power_strike',
                name:     'Kraftig slag',
                desc:     '+2 Angrep\n+1 Forsvar',
                category: 'ATK',
                maxStack: 3,
                apply(hero) { hero.attack += 2; hero.defense += 1; }
            },
            {
                id:       'battle_hardened',
                name:     'Kampherdet',
                desc:     '+2 Angrep\n+1 Forsvar\n+1 Hjerte\n+2 ryggsekk',
                category: 'ATK',
                maxStack: 2,
                apply(hero) { hero.attack += 2; hero.defense += 1; hero.maxHearts++; hero.inventory.expandBackpack(2); }
            },
            {
                id:       'giant_strength',
                name:     'Jotunstyrke',
                desc:     '+5 Angrep\n+2 maks hjerter\n(krever T2)',
                category: 'ATK',
                maxStack: 1,
                apply(hero) { hero.attack += 5; hero.maxHearts += 2; }
            },
        ]
    },

    // ── VILLMARKSJEGER (Hunter + Rogue + Beast Keeper merged) ─────────────────
    {
        id:    'villmarksjeger',
        name:  'Villmarksjeger',
        desc:  'Syn, presisjon, unnvikelse og dyr',
        color: 0x44dd88,
        icon:  'J',
        tiers: [
            {
                id:       'keen_eye',
                name:     'Skarpsyn',
                desc:     '+2 synsradius\n+20% XP\n+2 kjæledyr-ATK',
                category: 'VIS',
                maxStack: 2,
                apply(hero) {
                    hero.visionRadius += 2;
                    hero.xpMultiplier += 0.20;
                    hero.petBonusAtk = (hero.petBonusAtk || 0) + 2;
                }
            },
            {
                id:       'vital_strike',
                name:     'Vitalt anslag',
                desc:     '+20% kritisk\n+15% unnvikelse\n+3 kjæl.-HP, +1 kjæl.-DEF\nPotion healer kjæledyr',
                category: 'ATK',
                maxStack: 2,
                apply(hero) {
                    hero.critChance = Math.min(0.75, hero.critChance + 0.20);
                    hero.dodgeChance = Math.min(0.6, hero.dodgeChance + 0.15);
                    hero.petBonusHp = (hero.petBonusHp || 0) + 3;
                    hero.petBonusDef = (hero.petBonusDef || 0) + 1;
                    hero.petHealShare = true;
                }
            },
            {
                id:       'precision',
                name:     'Presisjon',
                desc:     '+3 Angrep\n+3 kjæl.-ATK\n+3 kjæl.-HP\n+2 hjerter nå',
                category: 'ATK',
                maxStack: 1,
                apply(hero) {
                    hero.attack += 3;
                    hero.petBonusAtk = (hero.petBonusAtk || 0) + 3;
                    hero.petBonusHp = (hero.petBonusHp || 0) + 3;
                    hero.hearts = Math.min(hero.hearts + 2, hero.maxHearts);
                }
            },
        ]
    },

    // ── GEOLOG (Geologist – Elements mod) ───────────────────────────────────────
    {
        id:    'geolog',
        name:  'Geolog',
        desc:  'Mineralfunn og utvinning',
        color: 0x997755,
        icon:  'G',
        unlockCondition: 'mineral_pickup',
        tiers: [
            {
                id:       'mineral_eye',
                name:     'Malmøye',
                desc:     '+1 mineral-\nsynsradius',
                category: 'GEO',
                maxStack: 3,
                apply(hero) { hero.mineralVisionRadius = (hero.mineralVisionRadius || 0) + 1; }
            },
            {
                id:       'efficient_mining',
                name:     'Effektiv utvinning',
                desc:     '+25% mineral-\nutbytte',
                category: 'GEO',
                maxStack: 3,
                apply(hero) { hero.miningYieldBonus = (hero.miningYieldBonus || 0) + 0.25; }
            },
            {
                id:       'master_prospector',
                name:     'Mesterprospektør',
                desc:     'Garantert T4+\nmineral per etasje',
                category: 'GEO',
                maxStack: 1,
                apply(hero) { hero.guaranteedRareMineral = true; }
            },
        ]
    },
    // ── METALLURG (Metallurgist – Elements mod Phase 2) ────────────────────────
    {
        id:    'metallurg',
        name:  'Metallurg',
        desc:  'Smelting og legeringer',
        color: 0xff7722,
        icon:  'M',
        unlockCondition: 'first_smelt',
        tiers: [
            {
                id:       'fast_smelting',
                name:     'Rask smelting',
                desc:     '-25% smeltetid\nog energikost',
                category: 'UTIL',
                maxStack: 3,
                apply(hero) {
                    hero.smeltingSpeedMul = (hero.smeltingSpeedMul || 1.0) * 0.75;
                    hero.smeltingEfficiency = (hero.smeltingEfficiency || 1.0) * 0.75;
                }
            },
            {
                id:       'alloy_mastery',
                name:     'Legeringsmester',
                desc:     '+15% legering-\nstats per stack',
                category: 'UTIL',
                maxStack: 2,
                apply(hero) { hero.alloyMasteryBonus = (hero.alloyMasteryBonus || 0) + 0.15; }
            },
            {
                id:       'master_smith',
                name:     'Mestersmie',
                desc:     '+25% stats på\nsmidd utstyr',
                category: 'ATK',
                maxStack: 1,
                apply(hero) { hero.alloyStatBonus = (hero.alloyStatBonus || 0) + 0.25; }
            },
        ]
    },
    // ── KJEMIKER (Chemist – Elements mod Phase 3) ──────────────────────────────
    {
        id:    'kjemiker',
        name:  'Kjemiker',
        desc:  'Potions, bomber og medisin',
        color: 0x33dd88,
        icon:  'C',
        unlockCondition: 'first_synthesis',
        tiers: [
            {
                id:       'potent_potions',
                name:     'Potente potions',
                desc:     '+50% varighet\npå potions',
                category: 'UTIL',
                maxStack: 3,
                apply(hero) { hero.potionDurationBonus = (hero.potionDurationBonus || 0) + 0.50; }
            },
            {
                id:       'acid_mastery',
                name:     'Syremestring',
                desc:     '+30% kjemisk\nbombe-skade',
                category: 'ATK',
                maxStack: 2,
                apply(hero) { hero.chemBombBonus = (hero.chemBombBonus || 0) + 0.30; }
            },
            {
                id:       'explosive_genius',
                name:     'Eksplosjonsgenial',
                desc:     '+50% skade\n+1 radius på bomber',
                category: 'ATK',
                maxStack: 1,
                apply(hero) {
                    hero.chemBombBonus = (hero.chemBombBonus || 0) + 0.50;
                    hero.chemRadiusBonus = (hero.chemRadiusBonus || 0) + 0.30;
                }
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
 *   tier 1 (T2) – need T1 maxed from same path
 *   tier 2 (T3) – need T2 maxed from same path
 */
function isSkillUnlocked(hero, pathIndex, tierIndex) {
    const path  = SKILL_TREE_PATHS[pathIndex];
    const skill = path.tiers[tierIndex];

    // Check path-level unlock condition
    if (path.unlockCondition === 'mineral_pickup' && !hero.geologistUnlocked) return false;
    if (path.unlockCondition === 'first_smelt' && !hero.metallurgistUnlocked) return false;
    if (path.unlockCondition === 'first_synthesis' && !hero.chemistUnlocked) return false;

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
        paths: ['kriger', 'villmarksjeger'],
        color: 0xff8844,
        apply(hero) { hero.counterChance = Math.min(0.4, (hero.counterChance || 0) + 0.20); },
        unapply(hero) { hero.counterChance = Math.max(0, (hero.counterChance || 0) - 0.20); },
    },
    {
        id:    'thorns',
        name:  'Tornehud',
        desc:  'Angripere tar 1 skade, +1 synsfelt',
        paths: ['kriger', 'villmarksjeger'],
        color: 0x44ddaa,
        apply(hero) { hero.thornsDamage = (hero.thornsDamage || 0) + 1; hero.visionRadius += 1; },
        unapply(hero) { hero.thornsDamage = Math.max(0, (hero.thornsDamage || 0) - 1); hero.visionRadius -= 1; },
    },
    {
        id:    'earthen_might',
        name:  'Jordens kraft',
        desc:  '+1 Forsvar, +1 mineralsynsradius',
        paths: ['geolog', 'kriger'],
        color: 0x886644,
        apply(hero) { hero.defense += 1; hero.mineralVisionRadius = (hero.mineralVisionRadius || 0) + 1; },
        unapply(hero) { hero.defense -= 1; hero.mineralVisionRadius = Math.max(0, (hero.mineralVisionRadius || 0) - 1); },
    },
    {
        id:    'forge_master',
        name:  'Smiekunst',
        desc:  '+3 Angrep, +20% malmeffekt',
        paths: ['metallurg', 'kriger'],
        color: 0xff6622,
        apply(hero) { hero.attack += 3; hero.oreEfficiencyChance = (hero.oreEfficiencyChance || 0) + 0.20; },
        unapply(hero) { hero.attack -= 3; hero.oreEfficiencyChance = Math.max(0, (hero.oreEfficiencyChance || 0) - 0.20); },
    },
    {
        id:    'geologist_metallurg',
        name:  'Malmkjenne',
        desc:  '+1 mineral-syn, -10% smeltetid',
        paths: ['metallurg', 'geolog'],
        color: 0xbb7733,
        apply(hero) { hero.mineralVisionRadius = (hero.mineralVisionRadius || 0) + 1; hero.smeltingSpeedMul = (hero.smeltingSpeedMul || 1.0) * 0.9; },
        unapply(hero) { hero.mineralVisionRadius = Math.max(0, (hero.mineralVisionRadius || 0) - 1); hero.smeltingSpeedMul = (hero.smeltingSpeedMul || 1.0) / 0.9; },
    },
    {
        id:    'toxic_blades',
        name:  'Giftklinger',
        desc:  '+2 ATK, 15% gift ved angrep',
        paths: ['kjemiker', 'kriger'],
        color: 0x44cc44,
        apply(hero) { hero.attack += 2; hero.toxicBladeChance = (hero.toxicBladeChance || 0) + 0.15; },
        unapply(hero) { hero.attack -= 2; hero.toxicBladeChance = Math.max(0, (hero.toxicBladeChance || 0) - 0.15); },
    },
    {
        id:    'alchemist',
        name:  'Alkymist',
        desc:  '+20% potens, -15% energi',
        paths: ['kjemiker', 'metallurg'],
        color: 0x88aa44,
        apply(hero) { hero.potionPotencyBonus = (hero.potionPotencyBonus || 0) + 0.20; hero.smeltingEfficiency = (hero.smeltingEfficiency || 1.0) * 0.85; },
        unapply(hero) { hero.potionPotencyBonus = Math.max(0, (hero.potionPotencyBonus || 0) - 0.20); hero.smeltingEfficiency = (hero.smeltingEfficiency || 1.0) / 0.85; },
    },
    {
        id:    'wild_geologist',
        name:  'Naturkjenner',
        desc:  '+1 mineral-syn, +2 kjæledyr-HP',
        paths: ['geolog', 'villmarksjeger'],
        color: 0x77aa55,
        apply(hero) { hero.mineralVisionRadius = (hero.mineralVisionRadius || 0) + 1; hero.petBonusHp = (hero.petBonusHp || 0) + 2; },
        unapply(hero) { hero.mineralVisionRadius = Math.max(0, (hero.mineralVisionRadius || 0) - 1); hero.petBonusHp = Math.max(0, (hero.petBonusHp || 0) - 2); },
    },
    {
        id:    'chem_hunter',
        name:  'Giftjeger',
        desc:  '+20% kjemibombe, +10% crit',
        paths: ['kjemiker', 'villmarksjeger'],
        color: 0x66cc88,
        apply(hero) { hero.chemBombBonus = (hero.chemBombBonus || 0) + 0.20; hero.critChance = Math.min(0.75, hero.critChance + 0.10); },
        unapply(hero) { hero.chemBombBonus = Math.max(0, (hero.chemBombBonus || 0) - 0.20); hero.critChance = Math.max(0, hero.critChance - 0.10); },
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
