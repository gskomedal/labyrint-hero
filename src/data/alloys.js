// ─── Labyrint Hero – Alloys & Energy Sources Dataset ──────────────────────────
// Alloys are crafted from pure elements at a smelting furnace in Camp Rooms.
// Energy sources are fuel items that power the smelting process.

// ── Energy sources (fuel items) ──────────────────────────────────────────────

const FUEL_DEFS = {
    wood: {
        id: 'wood', name: 'Tre', type: 'fuel',
        color: 0x886633, tier: 1, stackSize: 10,
        energyValue: 1,
        desc: 'Grunnleggende brensel. Gir 1 energi.'
    },
    charcoal: {
        id: 'charcoal', name: 'Trekull', type: 'fuel',
        color: 0x333333, tier: 1, stackSize: 10,
        energyValue: 2,
        desc: 'Laget av tre. Gir 2 energi.'
    },
    coal: {
        id: 'coal', name: 'Kull', type: 'fuel',
        color: 0x222222, tier: 1, stackSize: 10,
        energyValue: 3,
        desc: 'Finnes i gruver. Gir 3 energi.'
    },
    oil: {
        id: 'oil', name: 'Råolje', type: 'fuel',
        color: 0x111100, tier: 2, stackSize: 10,
        energyValue: 8,
        desc: 'Flytende brensel fra dypet. Gir 8 energi.'
    },
    natural_gas: {
        id: 'natural_gas', name: 'Naturgass', type: 'fuel',
        color: 0x88ccff, tier: 2, stackSize: 10,
        energyValue: 10,
        desc: 'Ren brennbar gass. Gir 10 energi.'
    },
};

// ── Alloy definitions ────────────────────────────────────────────────────────

const ALLOY_DEFS = {
    bronze: {
        id: 'bronze', name: 'Bronse', type: 'alloy',
        formula: 'Cu + Sn', tier: 2,
        color: 0xcc8844,
        recipe: [
            { symbol: 'Cu', amount: 2 },
            { symbol: 'Sn', amount: 1 }
        ],
        energyCost: 3,
        smeltingTime: 3,
        statBonuses: { attack: 2, defense: 1 },
        stackSize: 10,
        desc: 'Kobber + tinn. Hardere enn rent kobber.'
    },
    brass: {
        id: 'brass', name: 'Messing', type: 'alloy',
        formula: 'Cu + Zn', tier: 2,
        color: 0xddaa44,
        recipe: [
            { symbol: 'Cu', amount: 2 },
            { symbol: 'Zn', amount: 1 }
        ],
        energyCost: 3,
        smeltingTime: 3,
        statBonuses: { defense: 2 },
        stackSize: 10,
        desc: 'Korrosjonsbestandig. Bra til amuletter.'
    },
    steel: {
        id: 'steel', name: 'Stål', type: 'alloy',
        formula: 'Fe + C', tier: 3,
        color: 0xaabbcc,
        recipe: [
            { symbol: 'Fe', amount: 3 },
            { symbol: 'C', amount: 1 }
        ],
        energyCost: 5,
        smeltingTime: 5,
        statBonuses: { attack: 3, defense: 2 },
        stackSize: 10,
        desc: 'Jern + karbon. Sterkere enn rent jern.'
    },
    stainless_steel: {
        id: 'stainless_steel', name: 'Rustfritt stål', type: 'alloy',
        formula: 'Fe + Cr + Ni', tier: 4,
        color: 0xccddee,
        recipe: [
            { symbol: 'Fe', amount: 3 },
            { symbol: 'Cr', amount: 1 },
            { symbol: 'Ni', amount: 1 }
        ],
        energyCost: 7,
        smeltingTime: 6,
        statBonuses: { attack: 2, defense: 4 },
        stackSize: 10,
        desc: 'Korroderer aldri. Overlegen rustning.'
    },
    electrum: {
        id: 'electrum', name: 'Elektrum', type: 'alloy',
        formula: 'Au + Ag', tier: 5,
        color: 0xeecc44,
        recipe: [
            { symbol: 'Au', amount: 1 },
            { symbol: 'Ag', amount: 1 }
        ],
        energyCost: 4,
        smeltingTime: 4,
        statBonuses: { attack: 3, defense: 3, hearts: 1 },
        stackSize: 10,
        desc: 'Gull + sølv. Magisk ledende.'
    },
    duraluminium: {
        id: 'duraluminium', name: 'Duraluminium', type: 'alloy',
        formula: 'Al + Cu + Mg', tier: 3,
        color: 0xbbccdd,
        recipe: [
            { symbol: 'Al', amount: 2 },
            { symbol: 'Cu', amount: 1 },
            { symbol: 'Mg', amount: 1 }
        ],
        energyCost: 5,
        smeltingTime: 5,
        statBonuses: { defense: 3, hearts: 1 },
        stackSize: 10,
        desc: 'Lett og sterkt. Utmerket lett rustning.'
    },
    titanium_alloy: {
        id: 'titanium_alloy', name: 'Titanleger.', type: 'alloy',
        formula: 'Ti + Al + V', tier: 5,
        color: 0x99aacc,
        recipe: [
            { symbol: 'Ti', amount: 2 },
            { symbol: 'Al', amount: 1 },
            { symbol: 'V', amount: 1 }
        ],
        energyCost: 8,
        smeltingTime: 7,
        statBonuses: { attack: 4, defense: 4, hearts: 1 },
        stackSize: 10,
        desc: 'Ekstremt sterkt og lett. Endgame-materiale.'
    },
    platinum_iridium: {
        id: 'platinum_iridium', name: 'Pt-Ir legering', type: 'alloy',
        formula: 'Pt + Ir', tier: 6,
        color: 0xeeeedd,
        recipe: [
            { symbol: 'Pt', amount: 1 },
            { symbol: 'Ir', amount: 1 }
        ],
        energyCost: 10,
        smeltingTime: 8,
        statBonuses: { attack: 5, defense: 5, hearts: 2 },
        stackSize: 10,
        desc: 'Hardeste legering. Legendarisk.'
    },
    // ── New alloys (v0.40): expanded element usage ────────────────────────────
    manganese_steel: {
        id: 'manganese_steel', name: 'Manganstål', type: 'alloy',
        formula: 'Fe + Mn + C', tier: 3,
        color: 0x9988aa,
        recipe: [
            { symbol: 'Fe', amount: 3 },
            { symbol: 'Mn', amount: 1 },
            { symbol: 'C', amount: 1 }
        ],
        energyCost: 5,
        smeltingTime: 5,
        statBonuses: { attack: 4, defense: 3 },
        stackSize: 10,
        desc: 'Manganherdet stål. Tåler slag og har +20% holdbarhet.'
    },
    moly_steel: {
        id: 'moly_steel', name: 'Molybdenstål', type: 'alloy',
        formula: 'Fe + Mo + C', tier: 4,
        color: 0x8899aa,
        recipe: [
            { symbol: 'Fe', amount: 2 },
            { symbol: 'Mo', amount: 1 },
            { symbol: 'C', amount: 1 }
        ],
        energyCost: 6,
        smeltingTime: 6,
        statBonuses: { attack: 4, defense: 2 },
        stackSize: 10,
        desc: 'Superlegering. Høy slagstyrke.'
    },
    tungsten_carbide: {
        id: 'tungsten_carbide', name: 'Wolframkarbid', type: 'alloy',
        formula: 'W + C', tier: 4,
        color: 0x556677,
        recipe: [
            { symbol: 'W', amount: 2 },
            { symbol: 'C', amount: 1 }
        ],
        energyCost: 7,
        smeltingTime: 7,
        statBonuses: { attack: 6 },
        stackSize: 10,
        desc: 'Ekstremt hardt. Perfekt til våpeneggene.'
    },
    tantalum_plate: {
        id: 'tantalum_plate', name: 'Tantalplate', type: 'alloy',
        formula: 'Ta + Fe', tier: 4,
        color: 0x889988,
        recipe: [
            { symbol: 'Ta', amount: 2 },
            { symbol: 'Fe', amount: 1 }
        ],
        energyCost: 6,
        smeltingTime: 6,
        statBonuses: { defense: 4, hearts: 1 },
        stackSize: 10,
        desc: 'Korrosjonsbestandig. Brukes i rustning med ekstra HP.'
    },
    phosphor_crystal: {
        id: 'phosphor_crystal', name: 'Fosforkrystall', type: 'alloy',
        formula: 'Ce + La + Nd', tier: 5,
        color: 0xddffcc,
        recipe: [
            { symbol: 'Ce', amount: 1 },
            { symbol: 'La', amount: 1 },
            { symbol: 'Nd', amount: 1 }
        ],
        energyCost: 7,
        smeltingTime: 6,
        statBonuses: { attack: 3, defense: 3, hearts: 1, vision: 1 },
        stackSize: 10,
        desc: 'Lantanide-krystall. Lyser. Gir bærer +1 synsfelt.'
    },
    scandium_alloy: {
        id: 'scandium_alloy', name: 'Skandiumlegering', type: 'alloy',
        formula: 'Sc + Al + Mg', tier: 4,
        color: 0xbbddcc,
        recipe: [
            { symbol: 'Sc', amount: 1 },
            { symbol: 'Al', amount: 2 },
            { symbol: 'Mg', amount: 1 }
        ],
        energyCost: 6,
        smeltingTime: 5,
        statBonuses: { attack: 3, defense: 3, hearts: 2 },
        stackSize: 10,
        desc: 'Romfartslegering. Ekstremt lett og stiv – +2 HP per del.'
    },
};

// ── Refining recipes (Fysiker T1: purify raw elements → semiconductor-grade) ─
// Each converts N raw elements into 1 refined unit. High energy cost.
// Refined units stored in hero.refinedElements { id: count }.

const REFINING_RECIPES = [
    { id: 'pure_si',   name: 'Rent Si (99.999%)', input: [{ symbol: 'Si', amount: 5 }],                              energyCost: 10, color: 0x667788, desc: 'Ultrarent silisium for halvlederproduksjon.' },
    { id: 'pure_ge',   name: 'Rent Ge',           input: [{ symbol: 'Ge', amount: 3 }],                              energyCost: 15, color: 0x889988, desc: 'Infrarødkvalitet germanium.' },
    { id: 'pure_gaas', name: 'Rent GaAs',         input: [{ symbol: 'Ga', amount: 2 }, { symbol: 'As', amount: 2 }], energyCost: 20, color: 0x6688aa, desc: 'Galliumarsenid-krystall for optoelektronikk.' },
    { id: 'pure_ito',  name: 'Rent ITO',          input: [{ symbol: 'In', amount: 2 }, { symbol: 'Sn', amount: 2 }], energyCost: 15, color: 0xaabbcc, desc: 'Gjennomsiktig ledende oksid.' },
    { id: 'pure_sic',  name: 'Rent SiC',          input: [{ symbol: 'Si', amount: 3 }, { symbol: 'C', amount: 2 }],  energyCost: 12, color: 0x778899, desc: 'Silisiumkarbid-keramikk.' },
    { id: 'pure_cdte', name: 'Rent CdTe',         input: [{ symbol: 'Cd', amount: 2 }, { symbol: 'Te', amount: 2 }], energyCost: 20, color: 0x556655, desc: 'Solcellekvalitet kadmiumtellurid.' },
];

// ── Semiconductor materials (crafted from REFINED elements) ─────────────────
// Requires Fysiker T1 (semiconductorUnlocked). Recipes use { refined: id }
// entries that check hero.refinedElements instead of elementTracker.

const SEMICONDUCTOR_DEFS = {
    silicon_wafer: {
        id: 'silicon_wafer', name: 'Silisiumskive', type: 'semiconductor',
        formula: 'Rent Si + B + P', tier: 3, color: 0x667788,
        recipe: [{ refined: 'pure_si', amount: 1 }, { symbol: 'B', amount: 1 }, { symbol: 'P', amount: 1 }],
        energyCost: 8, smeltingTime: 4, stackSize: 10,
        desc: 'Bor/fosfor-dopet Si-wafer. Grunnlag for all elektronikk.'
    },
    silicon_carbide: {
        id: 'silicon_carbide', name: 'Silisiumkarbid', type: 'semiconductor',
        formula: 'Rent SiC ×2', tier: 3, color: 0x778899,
        recipe: [{ refined: 'pure_sic', amount: 2 }],
        energyCost: 10, smeltingTime: 5, stackSize: 10,
        desc: 'Hardere enn stål. Brukes til EMP-pulsdrivere.'
    },
    germanium_crystal: {
        id: 'germanium_crystal', name: 'Germaniumkrystall', type: 'semiconductor',
        formula: 'Rent Ge + Rent Si', tier: 4, color: 0x889988,
        recipe: [{ refined: 'pure_ge', amount: 1 }, { refined: 'pure_si', amount: 1 }],
        energyCost: 12, smeltingTime: 5, stackSize: 10,
        desc: 'Infrarødt-gjennomtrengelig. For sensorer og detektorer.'
    },
    gallium_arsenide: {
        id: 'gallium_arsenide', name: 'Galliumarsenid', type: 'semiconductor',
        formula: 'Rent GaAs ×2', tier: 4, color: 0x6688aa,
        recipe: [{ refined: 'pure_gaas', amount: 2 }],
        energyCost: 15, smeltingTime: 6, stackSize: 10,
        desc: 'Raskere enn Si. Brukes i lasere og kraftelektronikk.'
    },
    indium_tin_oxide: {
        id: 'indium_tin_oxide', name: 'Indiumtinnoksid', type: 'semiconductor',
        formula: 'Rent ITO ×2', tier: 4, color: 0xaabbcc,
        recipe: [{ refined: 'pure_ito', amount: 2 }],
        energyCost: 12, smeltingTime: 5, stackSize: 10,
        desc: 'Gjennomsiktig leder. For teleportfelt-teknologi.'
    },
    cadmium_telluride: {
        id: 'cadmium_telluride', name: 'Kadmiumtellurid', type: 'semiconductor',
        formula: 'Rent CdTe ×2', tier: 5, color: 0x556655,
        recipe: [{ refined: 'pure_cdte', amount: 2 }],
        energyCost: 18, smeltingTime: 6, stackSize: 10,
        desc: 'Solcellemateriale. Konverterer lys til energi.'
    },
};

// ── Technology upgrades (permanent, one-time craft from semiconductors) ──────
// Each tech sets a hero flag. Not equipment — once installed, always active.
// Unlocks entirely new gameplay mechanics or energy production.

const TECH_UPGRADES = {
    // Gameplay technologies
    tech_route_calc:      { id: 'tech_route_calc',      name: 'Ruteberegner',              semiId: 'silicon_wafer',      amount: 1, color: 0x667788, heroFlag: 'techRouteCalc',      desc: 'Viser optimal rute til exit/boss/chest på minikartet.' },
    tech_element_scanner: { id: 'tech_element_scanner', name: 'Elementskanner',            semiId: 'germanium_crystal',  amount: 1, color: 0x889988, heroFlag: 'techElementScanner', desc: 'Avslører alle elementer på etasjen: type og posisjon.' },
    tech_laser_turret:    { id: 'tech_laser_turret',    name: 'Laserturret',               semiId: 'gallium_arsenide',   amount: 1, color: 0x6688aa, heroFlag: 'techLaserTurret',    desc: 'Plasserbar turret: 4 skade/runde automatisk mot monstre.' },
    tech_teleporter:      { id: 'tech_teleporter',      name: 'Teleporter-noder',          semiId: 'indium_tin_oxide',   amount: 1, color: 0xaabbcc, heroFlag: 'techTeleporter',     desc: 'Plassér noder i rom. Teleportér fritt mellom dem.' },
    tech_emp:             { id: 'tech_emp',             name: 'EMP-pulsgenerator',         semiId: 'silicon_carbide',    amount: 1, color: 0x778899, heroFlag: 'techEMP',            desc: 'Craftbar EMP: slår ut alle monstre i 50 runder.' },
    tech_force_field:     { id: 'tech_force_field',     name: 'Kraftfelt',                 semiId: 'cadmium_telluride',  amount: 1, color: 0x556655, heroFlag: 'techForceField',     desc: 'Barriere: absorberer 15 skade. Regenererer mellom etasjer.' },
    // Energy technologies
    tech_solar_panel:     { id: 'tech_solar_panel',     name: 'Solcellepanel',             semiId: 'cadmium_telluride',  amount: 1, color: 0x44aa44, heroFlag: 'techSolarPanel',     desc: '+30 gratis energi per verden (CdTe-solcelle).' },
    tech_thermoelectric:  { id: 'tech_thermoelectric',  name: 'Termoelektrisk generator',  semiId: 'germanium_crystal',  amount: 1, color: 0xcc6633, heroFlag: 'techThermoelectric', desc: '+50 energi i vulkan/magma-soner (Ge-termoelement).' },
    tech_reactor_control: { id: 'tech_reactor_control', name: 'Reaktorkontroll',           semiId: 'silicon_wafer',      amount: 1, color: 0x44cc44, heroFlag: 'techReactorControl', desc: '+50% fisjon/fusjon-energi (Si-kontrollsystem).' },
    tech_superconductor:  { id: 'tech_superconductor',  name: 'Superleder-kabling',        semiId: 'gallium_arsenide',   amount: 1, color: 0x4488ff, heroFlag: 'techSuperconductor', desc: '-30% energikostnad all smelting/crafting.' },
};

// ── Alloy-forged equipment templates ─────────────────────────────────────────
// These are created when a player forges equipment from an alloy at the Camp Room.

const ALLOY_EQUIPMENT = {
    // Weapons
    bronze_sword:   { id: 'bronze_sword',   name: 'Bronsesverd',       type: 'weapon', alloyId: 'bronze',           color: 0xcc8844, atk: 4, desc: '+4 Angrep (bronse)' },
    steel_sword:    { id: 'steel_sword',    name: 'Stålsverd',         type: 'weapon', alloyId: 'steel',            color: 0xaabbcc, atk: 6, desc: '+6 Angrep (stål)' },
    stainless_axe:  { id: 'stainless_axe',  name: 'Rustfri stridsøks', type: 'weapon', alloyId: 'stainless_steel', color: 0xccddee, atk: 7, desc: '+7 Angrep (rustfritt)' },
    electrum_staff: { id: 'electrum_staff', name: 'Elektrumstav',      type: 'weapon', alloyId: 'electrum',         color: 0xeecc44, atk: 6, def: 3, desc: '+6 ATK, +3 DEF (elektrum)' },
    titanium_blade: { id: 'titanium_blade', name: 'Titanklinge',       type: 'weapon', alloyId: 'titanium_alloy',   color: 0x99aacc, atk: 8, hearts: 1, desc: '+8 ATK, +1 HP (titan)' },
    pt_ir_sword:    { id: 'pt_ir_sword',    name: 'Pt-Ir sverd',       type: 'weapon', alloyId: 'platinum_iridium', color: 0xeeeedd, atk: 10, def: 2, desc: '+10 ATK, +2 DEF (Pt-Ir)' },
    // Armor
    bronze_armor:      { id: 'bronze_armor',      name: 'Bronserustning',    type: 'armor', alloyId: 'bronze',           color: 0xcc8844, def: 3, desc: '+3 Forsvar (bronse)' },
    steel_plate:       { id: 'steel_plate',       name: 'Stålplate',         type: 'armor', alloyId: 'steel',            color: 0xaabbcc, def: 5, hearts: 1, desc: '+5 DEF, +1 HP (stål)' },
    stainless_mail:    { id: 'stainless_mail',    name: 'Rustfri ringbrynj', type: 'armor', alloyId: 'stainless_steel', color: 0xccddee, def: 7, desc: '+7 Forsvar (rustfritt)' },
    dural_vest:        { id: 'dural_vest',        name: 'Duralvest',         type: 'armor', alloyId: 'duraluminium',     color: 0xbbccdd, def: 4, hearts: 2, desc: '+4 DEF, +2 HP (lett)' },
    titanium_plate:    { id: 'titanium_plate',    name: 'Titanrustning',     type: 'armor', alloyId: 'titanium_alloy',   color: 0x99aacc, def: 7, hearts: 2, desc: '+7 DEF, +2 HP (titan)' },
    pt_ir_armor:       { id: 'pt_ir_armor',       name: 'Pt-Ir rustning',    type: 'armor', alloyId: 'platinum_iridium', color: 0xeeeedd, def: 8, hearts: 3, desc: '+8 DEF, +3 HP (Pt-Ir)' },
    // ── New alloy equipment (v0.40) ─────────────────────────────────────────
    manganese_sword:  { id: 'manganese_sword',  name: 'Manganstål-sverd',   type: 'weapon', alloyId: 'manganese_steel',  color: 0x9988aa, atk: 5, def: 1, desc: '+5 ATK, +1 DEF (manganstål)' },
    tungsten_axe:     { id: 'tungsten_axe',     name: 'Wolframøks',          type: 'weapon', alloyId: 'tungsten_carbide', color: 0x556677, atk: 8, desc: '+8 ATK (wolframkarbid)' },
    moly_pike:        { id: 'moly_pike',        name: 'Molybden-lanse',      type: 'weapon', alloyId: 'moly_steel',       color: 0x8899aa, atk: 7, desc: '+7 ATK (molybden)' },
    tantalum_cuirass: { id: 'tantalum_cuirass', name: 'Tantalpansring',      type: 'armor',  alloyId: 'tantalum_plate',   color: 0x889988, def: 6, hearts: 2, desc: '+6 DEF, +2 HP (tantal)' },
    phosphor_blade:   { id: 'phosphor_blade',   name: 'Fosfor-klinge',       type: 'weapon', alloyId: 'phosphor_crystal', color: 0xddffcc, atk: 6, def: 2, visionBonus: 1, desc: '+6 ATK, +2 DEF, +1 syn (fosfor)' },
    phosphor_shield:  { id: 'phosphor_shield',  name: 'Fosfor-skjold',       type: 'armor',  alloyId: 'phosphor_crystal', color: 0xddffcc, def: 5, hearts: 2, visionBonus: 1, desc: '+5 DEF, +2 HP, +1 syn (fosfor)' },
    scandium_rapier:  { id: 'scandium_rapier',  name: 'Skandium-rapir',      type: 'weapon', alloyId: 'scandium_alloy',   color: 0xbbddcc, atk: 6, hearts: 1, desc: '+6 ATK, +1 HP (skandium)' },
    scandium_harness: { id: 'scandium_harness', name: 'Skandium-harnisk',    type: 'armor',  alloyId: 'scandium_alloy',   color: 0xbbddcc, def: 5, hearts: 3, desc: '+5 DEF, +3 HP (lettrustning)' },
};

// ── Pet equipment (forged from alloys at the Smeltery) ──────────────────────
// petSlot: 'weapon' or 'armor'. petAtk/petDef/petHp are additive bonuses.

const PET_EQUIPMENT = {
    // Pet weapons (claws / fangs)
    bronze_claws:    { id: 'bronze_claws',    name: 'Bronsekløer',       petSlot: 'weapon', alloyId: 'bronze',           color: 0xcc8844, petAtk: 2,              desc: '+2 ATK (kjæledyr)' },
    steel_fangs:     { id: 'steel_fangs',     name: 'Ståltenner',        petSlot: 'weapon', alloyId: 'steel',            color: 0xaabbcc, petAtk: 3,              desc: '+3 ATK (kjæledyr)' },
    tungsten_claws:  { id: 'tungsten_claws',  name: 'Wolframkløer',      petSlot: 'weapon', alloyId: 'tungsten_carbide', color: 0x556677, petAtk: 5,              desc: '+5 ATK (kjæledyr)' },
    phosphor_fangs:  { id: 'phosphor_fangs',  name: 'Fosfortenner',      petSlot: 'weapon', alloyId: 'phosphor_crystal', color: 0xddffcc, petAtk: 4, petHp: 2,    desc: '+4 ATK, +2 HP (kjæledyr)' },
    // Pet armor (collars / harnesses)
    bronze_collar:   { id: 'bronze_collar',   name: 'Bronsehalsbånd',    petSlot: 'armor',  alloyId: 'bronze',           color: 0xcc8844, petDef: 1, petHp: 3,    desc: '+1 DEF, +3 HP (kjæledyr)' },
    steel_harness:   { id: 'steel_harness',   name: 'Stålsele',          petSlot: 'armor',  alloyId: 'steel',            color: 0xaabbcc, petDef: 2, petHp: 4,    desc: '+2 DEF, +4 HP (kjæledyr)' },
    scandium_vest:   { id: 'scandium_vest',   name: 'Skandiumvest',      petSlot: 'armor',  alloyId: 'scandium_alloy',   color: 0xbbddcc, petDef: 3, petHp: 6,    desc: '+3 DEF, +6 HP (kjæledyr)' },
    titanium_harness:{ id: 'titanium_harness', name: 'Titansele',        petSlot: 'armor',  alloyId: 'titanium_alloy',   color: 0x99aacc, petDef: 4, petHp: 8,    desc: '+4 DEF, +8 HP (kjæledyr)' },
};

// ── Alloy tier colors (for UI) ──────────────────────────────────────────────

const ALLOY_TIER_COLORS = {
    2: 0xcc8844, // bronze
    3: 0xaabbcc, // steel
    4: 0xccddee, // stainless
    5: 0xeecc44, // electrum/titanium
    6: 0xeeeedd, // platinum-iridium
};
