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
                desc:     '+1 mineral-syn\nID-er mineraler\nMerker på minikart',
                category: 'GEO',
                maxStack: 3,
                apply(hero) {
                    hero.mineralVisionRadius = (hero.mineralVisionRadius || 0) + 1;
                    hero.mineralIdentifyLevel = (hero.mineralIdentifyLevel || 0) + 1;
                    hero.mineralMinimap = true;
                }
            },
            {
                id:       'efficient_mining',
                name:     'Effektiv utvinning',
                desc:     '25% sjanse for\ndobbelt utbytte\n(stabler til 75%)',
                category: 'GEO',
                maxStack: 3,
                apply(hero) {
                    // Replaces flat miningYieldBonus with a clear double-yield chance per stack.
                    hero.doubleYieldChance = (hero.doubleYieldChance || 0) + 0.25;
                    hero.smeltBonusElement = (hero.smeltBonusElement || 0) + 1;
                }
            },
            {
                id:       'master_prospector',
                name:     'Mesterprospektør',
                desc:     'Garantert T4+\nmineral per etasje\n(T5+ fra verden 5)',
                category: 'GEO',
                maxStack: 1,
                apply(hero) {
                    hero.guaranteedRareMineral = true;
                    hero.prospectorHighTier = true;
                }
            },
            {
                id:       'geode_splitter',
                name:     'Geode-splitter',
                desc:     'Hvert 10. smeltede\nmineral gir en gratis\ntilfeldig gemstein',
                category: 'GEO',
                maxStack: 1,
                apply(hero) { hero.geodeSplitter = true; }
            },
        ]
    },
    // ── METALLURG (Metallurgist – Elements mod Phase 2) ────────────────────────
    {
        id:    'metallurg',
        name:  'Metallurg',
        desc:  'Smelting og legeringer',
        prerequisitePath: 'geolog',  // must have at least 1 geolog skill
        color: 0xff7722,
        icon:  'M',
        unlockCondition: 'camp_room_found',
        tiers: [
            {
                id:       'fast_smelting',
                name:     'Rask smelting',
                desc:     '-25% smeltetid/energi\n+15% sjanse for\nekstra utbytte\n(maks stack: batch 5)',
                category: 'UTIL',
                maxStack: 3,
                apply(hero) {
                    hero.smeltingSpeedMul = (hero.smeltingSpeedMul || 1.0) * 0.75;
                    hero.smeltingEfficiency = (hero.smeltingEfficiency || 1.0) * 0.75;
                    hero.smeltExtraYieldChance = (hero.smeltExtraYieldChance || 0) + 0.15;
                    // Track stack count so UI can unlock batch-smelt at max stack.
                    hero.fastSmeltStacks = (hero.fastSmeltStacks || 0) + 1;
                    if (hero.fastSmeltStacks >= 3) hero.batchSmeltSize = 5;
                }
            },
            {
                id:       'alloy_mastery',
                name:     'Legeringsmester',
                desc:     '+25% legering-stats\n20% sjanse for\ndobbel legering',
                category: 'UTIL',
                maxStack: 2,
                apply(hero) {
                    hero.alloyMasteryBonus = (hero.alloyMasteryBonus || 0) + 0.25;
                    hero.doubleAlloyChance = (hero.doubleAlloyChance || 0) + 0.20;
                }
            },
            {
                id:       'master_smith',
                name:     'Mestersmie',
                desc:     '+50% stats på smidd\nutstyr, spesial-\negenskaper garantert',
                category: 'ATK',
                maxStack: 1,
                apply(hero) { hero.alloyStatBonus = (hero.alloyStatBonus || 0) + 0.50; }
            },
            {
                id:       'reforge',
                name:     'Reforge',
                desc:     'Reforge eksisterende\nutstyr for å rulle\nstats på nytt (5 energi)',
                category: 'UTIL',
                maxStack: 1,
                apply(hero) { hero.reforgeUnlocked = true; }
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
        unlockCondition: 'chem_lab_found',
        tiers: [
            {
                id:       'potent_potions',
                name:     'Potente potions',
                desc:     '+50% varighet\n+25% styrke\npå potions',
                category: 'UTIL',
                maxStack: 3,
                apply(hero) {
                    hero.potionDurationBonus = (hero.potionDurationBonus || 0) + 0.50;
                    hero.potionMagnitudeBonus = (hero.potionMagnitudeBonus || 0) + 0.25;
                }
            },
            {
                id:       'acid_mastery',
                name:     'Syremestring',
                desc:     '+40% kjemisk\nbombe-skade\n-2 Def på syreofre',
                category: 'ATK',
                maxStack: 2,
                apply(hero) {
                    hero.chemBombBonus = (hero.chemBombBonus || 0) + 0.40;
                    hero.chemAcidDefShred = (hero.chemAcidDefShred || 0) + 2;
                }
            },
            {
                id:       'explosive_genius',
                name:     'Eksplosjonsgenial',
                desc:     '+50% skade, +1 radius\n60% "Dobbel brygging"\npå bomber',
                category: 'ATK',
                maxStack: 1,
                apply(hero) {
                    hero.chemBombBonus = (hero.chemBombBonus || 0) + 0.50;
                    hero.chemRadiusBonus = (hero.chemRadiusBonus || 0) + 0.30;
                    hero.chemDoubleBrewChance = (hero.chemDoubleBrewChance || 0) + 0.60;
                }
            },
            {
                id:       'volatile_mastery',
                name:     'Volatil mestring',
                desc:     'Bomber kjeder til\n1 nærliggende fiende\nved 50% skade',
                category: 'ATK',
                maxStack: 1,
                apply(hero) { hero.chemBombChain = true; }
            },
        ]
    },
    // ── FYSIKER (Physicist – Phase 5: semiconductors, fission, fusion) ─────────
    {
        id:    'fysiker',
        name:  'Fysiker',
        desc:  'Halvledere, fisjon, fusjon',
        prerequisitePath: 'kjemiker',
        color: 0x8866ff,
        icon:  'F',
        unlockCondition: 'accelerator_found',
        tiers: [
            {
                id:       'semiconductor_basics',
                name:     'Halvledergrunnlag',
                desc:     'Halvleder-crafting\nMineraler tiltrekkes\ni nærliggende rom',
                category: 'UTIL',
                maxStack: 3,
                apply(hero) {
                    hero.semiconductorUnlocked = true;
                    hero.mineralMagnetRadius = (hero.mineralMagnetRadius || 0) + 1;
                }
            },
            {
                id:       'radiation_shield',
                name:     'Strålingsshield',
                desc:     'Radioaktivt gir\nikke HP-tap\n+1 min-tier loot',
                category: 'UTIL',
                maxStack: 2,
                apply(hero) {
                    hero.radiationShield = true;
                    hero.lootTierBonus = (hero.lootTierBonus || 0) + 1;
                }
            },
            {
                id:       'fission_mastery',
                name:     'Fisjonsbeherskelse',
                desc:     'Reaktor gir 2×\nenergi fra U/Th\nLåser tier 1-3 syntetiske',
                category: 'UTIL',
                maxStack: 1,
                apply(hero) {
                    hero.fissionMastered = true;
                    hero.fissionEnergyMul = 2.0;
                }
            },
            {
                id:       'fusion_pioneer',
                name:     'Fusjonspioner',
                desc:     'Fusjon-energi fra\nHe + H. Låser alle\nsyntetiske grunnstoff',
                category: 'UTIL',
                maxStack: 1,
                apply(hero) {
                    hero.fusionMastered = true;
                    hero.fusionEnergyMul = 5.0;
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
    if (path.unlockCondition === 'camp_room_found' && !hero.metallurgistUnlocked) return false;
    if (path.unlockCondition === 'chem_lab_found' && !hero.chemistUnlocked) return false;
    if (path.unlockCondition === 'accelerator_found' && !hero.acceleratorUnlocked) return false;

    // Check prerequisite path (e.g. metallurg requires at least 1 geolog skill)
    if (path.prerequisitePath) {
        const prereqPath = SKILL_TREE_PATHS.find(p => p.id === path.prerequisitePath);
        if (prereqPath) {
            const hasPrereq = prereqPath.tiers.some(t => _countSkill(hero, t.id) > 0);
            if (!hasPrereq) return false;
        }
    }

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
    {
        id:    'transmutation',
        name:  'Transmutasjon',
        desc:  '5 av grunnstoff X → 1 av nabo (kjemilab)',
        paths: ['geolog', 'metallurg', 'kjemiker'],
        color: 0xff88cc,
        apply(hero) { hero.transmutationUnlocked = true; },
        unapply(hero) { hero.transmutationUnlocked = false; },
    },
    {
        id:    'nuclear_forge',
        name:  'Atomsmedja',
        desc:  '+3 ATK, −25% akselerator-energi',
        paths: ['fysiker', 'metallurg'],
        color: 0xaa66ff,
        apply(hero) { hero.attack += 3; hero.acceleratorEfficiency = (hero.acceleratorEfficiency || 1.0) * 0.75; },
        unapply(hero) { hero.attack -= 3; hero.acceleratorEfficiency = (hero.acceleratorEfficiency || 1.0) / 0.75; },
    },
    {
        id:    'quantum_chemistry',
        name:  'Kvantekjemi',
        desc:  '+30% potion-styrke, +20% bombe-radius',
        paths: ['fysiker', 'kjemiker'],
        color: 0x8888ff,
        apply(hero) { hero.potionMagnitudeBonus = (hero.potionMagnitudeBonus || 0) + 0.30; hero.chemRadiusBonus = (hero.chemRadiusBonus || 0) + 0.20; },
        unapply(hero) { hero.potionMagnitudeBonus = Math.max(0, (hero.potionMagnitudeBonus || 0) - 0.30); hero.chemRadiusBonus = Math.max(0, (hero.chemRadiusBonus || 0) - 0.20); },
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
