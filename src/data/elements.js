// ─── Labyrint Hero – Elements Dataset ─────────────────────────────────────────
// ~50 elements from the periodic table relevant to the geology/metallurgy mod.
// Tier 1-6 reflects real-world geochemical abundance.
// Phase 1: discovery tracking only. Phase 2+ adds smelting and crafting.

const ELEMENTS = {
    // ── Tier 1 – Common (abundant in Earth's crust) ──────────────────────────
    H:  { symbol: 'H',  name: 'Hydrogen',   atomicNumber: 1,  category: 'nonmetal',    period: 1, group: 1,  tier: 1, color: 0xffffff, foundNative: false, stackSize: 99, description: 'Det letteste grunnstoffet. Finnes i vann og organisk materiale.' },
    O:  { symbol: 'O',  name: 'Oksygen',    atomicNumber: 8,  category: 'nonmetal',    period: 2, group: 16, tier: 1, color: 0xaaddff, foundNative: false, stackSize: 99, description: 'Livgivende gass. Finnes i de fleste oksid-mineraler.' },
    Si: { symbol: 'Si', name: 'Silisium',   atomicNumber: 14, category: 'metalloid',   period: 3, group: 14, tier: 1, color: 0x889988, foundNative: false, stackSize: 99, description: 'Nest vanligste i jordskorpen. Kvarts er rent SiO₂.' },
    Al: { symbol: 'Al', name: 'Aluminium',  atomicNumber: 13, category: 'metal',       period: 3, group: 13, tier: 1, color: 0xccccdd, foundNative: false, stackSize: 99, description: 'Lett metall. Utvinnes fra bauxitt.' },
    Fe: { symbol: 'Fe', name: 'Jern',       atomicNumber: 26, category: 'metal',       period: 4, group: 8,  tier: 1, color: 0x888888, foundNative: false, stackSize: 99, description: 'Det vanligste tungmetallet. Grunnlaget for stål.' },
    Ca: { symbol: 'Ca', name: 'Kalsium',    atomicNumber: 20, category: 'alkaline',    period: 4, group: 2,  tier: 1, color: 0xeeeecc, foundNative: false, stackSize: 99, description: 'Bygger bein og kalkstein. Finnes i CaCO₃.' },
    Na: { symbol: 'Na', name: 'Natrium',    atomicNumber: 11, category: 'alkali',      period: 3, group: 1,  tier: 1, color: 0xddcc88, foundNative: false, stackSize: 99, description: 'Reagerer voldsomt med vann. Finnes som steinsalt (NaCl).' },
    K:  { symbol: 'K',  name: 'Kalium',     atomicNumber: 19, category: 'alkali',      period: 4, group: 1,  tier: 1, color: 0xccbb77, foundNative: false, stackSize: 99, description: 'Viktig for planter og krutt. Finnes i sylvitt.' },
    Mg: { symbol: 'Mg', name: 'Magnesium',  atomicNumber: 12, category: 'alkaline',    period: 3, group: 2,  tier: 1, color: 0xaaddaa, foundNative: false, stackSize: 99, description: 'Lett metall. Brenner med intens hvit flamme.' },

    // ── Tier 2 – Uncommon ────────────────────────────────────────────────────
    C:  { symbol: 'C',  name: 'Karbon',     atomicNumber: 6,  category: 'nonmetal',    period: 2, group: 14, tier: 2, color: 0x444444, foundNative: true,  stackSize: 99, description: 'Kull, grafitt og diamant – alle er karbon.' },
    Ti: { symbol: 'Ti', name: 'Titan',      atomicNumber: 22, category: 'metal',       period: 4, group: 4,  tier: 2, color: 0x99aacc, foundNative: false, stackSize: 99, description: 'Sterkt og lett. Brukes i avanserte legeringer.' },
    Mn: { symbol: 'Mn', name: 'Mangan',     atomicNumber: 25, category: 'metal',       period: 4, group: 7,  tier: 2, color: 0x9988aa, foundNative: false, stackSize: 99, description: 'Viktig i stålproduksjon. Finnes i pyrolusitt.' },
    P:  { symbol: 'P',  name: 'Fosfor',     atomicNumber: 15, category: 'nonmetal',    period: 3, group: 15, tier: 2, color: 0xffaa44, foundNative: false, stackSize: 99, description: 'Lyser i mørket. Viktig i DNA og gjødsel.' },
    S:  { symbol: 'S',  name: 'Svovel',     atomicNumber: 16, category: 'nonmetal',    period: 3, group: 16, tier: 2, color: 0xdddd00, foundNative: true,  stackSize: 99, description: 'Gulaktig ikke-metall. Lukter vondt. Nøkkelstoff i kjemi.' },
    Cl: { symbol: 'Cl', name: 'Klor',       atomicNumber: 17, category: 'nonmetal',    period: 3, group: 17, tier: 2, color: 0x88ff88, foundNative: false, stackSize: 99, description: 'Giftig gass. Finnes i steinsalt (NaCl).' },
    N:  { symbol: 'N',  name: 'Nitrogen',   atomicNumber: 7,  category: 'nonmetal',    period: 2, group: 15, tier: 2, color: 0x4488ff, foundNative: false, stackSize: 99, description: '78% av lufta. Viktig for krutt og gjødsel.' },
    V:  { symbol: 'V',  name: 'Vanadium',   atomicNumber: 23, category: 'metal',       period: 4, group: 5,  tier: 2, color: 0x7799bb, foundNative: false, stackSize: 99, description: 'Sjeldent metall. Gjør stål ekstra hardt.' },

    // ── Tier 3 – Rare ───────────────────────────────────────────────────────
    Cu: { symbol: 'Cu', name: 'Kobber',     atomicNumber: 29, category: 'metal',       period: 4, group: 11, tier: 3, color: 0xcc7744, foundNative: true,  stackSize: 99, description: 'Rødlig metall. Et av de eldste metallene mennesket brukte.' },
    Zn: { symbol: 'Zn', name: 'Sink',       atomicNumber: 30, category: 'metal',       period: 4, group: 12, tier: 3, color: 0xaabbcc, foundNative: false, stackSize: 99, description: 'Brukes i messing og galvanisering.' },
    Ni: { symbol: 'Ni', name: 'Nikkel',     atomicNumber: 28, category: 'metal',       period: 4, group: 10, tier: 3, color: 0xbbbbaa, foundNative: true,  stackSize: 99, description: 'Sølvhvitt metall. Viktig i rustfritt stål.' },
    Cr: { symbol: 'Cr', name: 'Krom',       atomicNumber: 24, category: 'metal',       period: 4, group: 6,  tier: 3, color: 0xccddee, foundNative: false, stackSize: 99, description: 'Gir stål glans og korrosjonsbestandighet.' },
    Li: { symbol: 'Li', name: 'Litium',     atomicNumber: 3,  category: 'alkali',      period: 2, group: 1,  tier: 3, color: 0xddaacc, foundNative: false, stackSize: 99, description: 'Det letteste metallet. Flyter på vann.' },
    F:  { symbol: 'F',  name: 'Fluor',      atomicNumber: 9,  category: 'nonmetal',    period: 2, group: 17, tier: 3, color: 0xaaffaa, foundNative: false, stackSize: 99, description: 'Mest reaktive ikke-metall. Etser nesten alt.' },
    Co: { symbol: 'Co', name: 'Kobolt',     atomicNumber: 27, category: 'metal',       period: 4, group: 9,  tier: 3, color: 0x4466cc, foundNative: false, stackSize: 99, description: 'Gir intens blåfarge. Viktig i legeringer.' },

    // ── Tier 4 – Epic ───────────────────────────────────────────────────────
    Pb: { symbol: 'Pb', name: 'Bly',        atomicNumber: 82, category: 'metal',       period: 6, group: 14, tier: 4, color: 0x667788, foundNative: false, stackSize: 99, description: 'Tungt og mykt. Brukt siden oldtiden.' },
    Sn: { symbol: 'Sn', name: 'Tinn',       atomicNumber: 50, category: 'metal',       period: 5, group: 14, tier: 4, color: 0xbbccbb, foundNative: false, stackSize: 99, description: 'Mykt metall. Blandes med kobber til bronse.' },
    Hg: { symbol: 'Hg', name: 'Kvikksølv',  atomicNumber: 80, category: 'metal',       period: 6, group: 12, tier: 4, color: 0xccccdd, foundNative: true,  stackSize: 99, description: 'Flytende metall. Giftig men fascinerende.' },
    Mo: { symbol: 'Mo', name: 'Molybden',   atomicNumber: 42, category: 'metal',       period: 5, group: 6,  tier: 4, color: 0x8899aa, foundNative: false, stackSize: 99, description: 'Tåler ekstrem varme. Brukes i superlegeringer.' },
    As: { symbol: 'As', name: 'Arsen',      atomicNumber: 33, category: 'metalloid',   period: 4, group: 15, tier: 4, color: 0x778866, foundNative: true,  stackSize: 99, description: 'Beryktet gift. Finnes i mineraler med kobber og jern.' },
    Sb: { symbol: 'Sb', name: 'Antimon',    atomicNumber: 51, category: 'metalloid',   period: 5, group: 15, tier: 4, color: 0x99aabb, foundNative: true,  stackSize: 99, description: 'Halvmetall. Brukes i legeringer og flammehemmere.' },
    Bi: { symbol: 'Bi', name: 'Vismut',     atomicNumber: 83, category: 'metal',       period: 6, group: 15, tier: 4, color: 0xddaacc, foundNative: true,  stackSize: 99, description: 'Regnbuefargede krystaller. Minst giftige tungmetallet.' },
    Ge: { symbol: 'Ge', name: 'Germanium',  atomicNumber: 32, category: 'metalloid',   period: 4, group: 14, tier: 4, color: 0x99aa99, foundNative: false, stackSize: 99, description: 'Halvleder. Viktig i elektronikk.' },
    Se: { symbol: 'Se', name: 'Selen',      atomicNumber: 34, category: 'nonmetal',    period: 4, group: 16, tier: 4, color: 0xcc6644, foundNative: false, stackSize: 99, description: 'Halvleder. Brukes i solceller.' },

    // ── Tier 5 – Legendary (precious metals & rare) ─────────────────────────
    Au: { symbol: 'Au', name: 'Gull',       atomicNumber: 79, category: 'noble_metal', period: 6, group: 11, tier: 5, color: 0xffcc00, foundNative: true,  stackSize: 99, description: 'Kongen av metaller. Korroderer aldri.' },
    Ag: { symbol: 'Ag', name: 'Sølv',       atomicNumber: 47, category: 'noble_metal', period: 5, group: 11, tier: 5, color: 0xddddee, foundNative: true,  stackSize: 99, description: 'Best elektrisk leder. Brukt i smykker og mynt.' },
    Pt: { symbol: 'Pt', name: 'Platina',    atomicNumber: 78, category: 'noble_metal', period: 6, group: 10, tier: 5, color: 0xddddcc, foundNative: true,  stackSize: 99, description: 'Edlere enn gull. Tåler alt.' },
    Pd: { symbol: 'Pd', name: 'Palladium',  atomicNumber: 46, category: 'noble_metal', period: 5, group: 10, tier: 5, color: 0xccccbb, foundNative: true,  stackSize: 99, description: 'Absorberer hydrogen. Sjelden og verdifull.' },
    Os: { symbol: 'Os', name: 'Osmium',     atomicNumber: 76, category: 'noble_metal', period: 6, group: 8,  tier: 5, color: 0xaabbcc, foundNative: true,  stackSize: 99, description: 'Det tyngste grunnstoffet. Dobbelt så tungt som bly.' },
    Re: { symbol: 'Re', name: 'Rhenium',    atomicNumber: 75, category: 'metal',       period: 6, group: 7,  tier: 5, color: 0xbbbbcc, foundNative: false, stackSize: 99, description: 'Et av de sjeldneste metallene i jordskorpen.' },
    Te: { symbol: 'Te', name: 'Tellur',     atomicNumber: 52, category: 'metalloid',   period: 5, group: 16, tier: 5, color: 0xaabb99, foundNative: true,  stackSize: 99, description: 'Sjelden halvmetall. Brukes i solceller.' },

    // ── Tier 6 – Mythic ─────────────────────────────────────────────────────
    U:  { symbol: 'U',  name: 'Uran',       atomicNumber: 92, category: 'actinide',    period: 7, group: 3,  tier: 6, color: 0x44cc44, foundNative: false, stackSize: 99, description: 'Radioaktivt. Muliggjør fisjon.' },
    Th: { symbol: 'Th', name: 'Thorium',    atomicNumber: 90, category: 'actinide',    period: 7, group: 3,  tier: 6, color: 0x55bb55, foundNative: false, stackSize: 99, description: 'Alternativt fissilt materiale. Tryggere enn uran.' },
    Ra: { symbol: 'Ra', name: 'Radium',     atomicNumber: 88, category: 'actinide',    period: 7, group: 2,  tier: 6, color: 0x88ffaa, foundNative: false, stackSize: 99, description: 'Selvlysende. Ekstremt radioaktivt.' },
    He: { symbol: 'He', name: 'Helium',     atomicNumber: 2,  category: 'noble',       period: 1, group: 18, tier: 6, color: 0xffffcc, foundNative: false, stackSize: 99, description: 'Nest letteste grunnstoff. Muliggjør fusjon.' },
    Ir: { symbol: 'Ir', name: 'Iridium',    atomicNumber: 77, category: 'noble_metal', period: 6, group: 9,  tier: 6, color: 0xeeeedd, foundNative: true,  stackSize: 99, description: 'Hardeste naturlige metall. Ekstremt sjeldent.' },
    Ne: { symbol: 'Ne', name: 'Neon',       atomicNumber: 10, category: 'noble',       period: 2, group: 18, tier: 6, color: 0xff6644, foundNative: false, stackSize: 99, description: 'Rødlig lysgass. Brukes i neonskilt.' },
    Ar: { symbol: 'Ar', name: 'Argon',      atomicNumber: 18, category: 'noble',       period: 3, group: 18, tier: 5, color: 0xaaccff, foundNative: false, stackSize: 99, description: '1% av lufta. Brukes som inert beskyttende gass.' },
    Kr: { symbol: 'Kr', name: 'Krypton',    atomicNumber: 36, category: 'noble',       period: 4, group: 18, tier: 5, color: 0xccddff, foundNative: false, stackSize: 99, description: 'Sjelden edelgass. Ikke fra Supermans hjemplanet.' },
    Xe: { symbol: 'Xe', name: 'Xenon',      atomicNumber: 54, category: 'noble',       period: 5, group: 18, tier: 5, color: 0xddccff, foundNative: false, stackSize: 99, description: 'Tung edelgass. Brukes i kraftige lamper.' },
    Br: { symbol: 'Br', name: 'Brom',       atomicNumber: 35, category: 'nonmetal',    period: 4, group: 17, tier: 4, color: 0xcc4422, foundNative: false, stackSize: 99, description: 'Rødlig væske. En av to flytende grunnstoffer.' },
    I:  { symbol: 'I',  name: 'Jod',        atomicNumber: 53, category: 'nonmetal',    period: 5, group: 17, tier: 4, color: 0x6644aa, foundNative: false, stackSize: 99, description: 'Lilla damp. Viktig for skjoldbruskkjertelen.' },
    Be: { symbol: 'Be', name: 'Beryllium',  atomicNumber: 4,  category: 'alkaline',    period: 2, group: 2,  tier: 4, color: 0xbbddbb, foundNative: false, stackSize: 99, description: 'Lett og hardt. Smaragder inneholder beryllium.' },
    Sr: { symbol: 'Sr', name: 'Strontium',  atomicNumber: 38, category: 'alkaline',    period: 5, group: 2,  tier: 4, color: 0xddaa88, foundNative: false, stackSize: 99, description: 'Farger flammer rødt. Brukes i fyrverkeri.' },
    Ba: { symbol: 'Ba', name: 'Barium',     atomicNumber: 56, category: 'alkaline',    period: 6, group: 2,  tier: 4, color: 0xccbb99, foundNative: false, stackSize: 99, description: 'Tungt alkalijordmetall. Farger flammer grønt.' },
    Rb: { symbol: 'Rb', name: 'Rubidium',   atomicNumber: 37, category: 'alkali',      period: 5, group: 1,  tier: 5, color: 0xcc8899, foundNative: false, stackSize: 99, description: 'Reagerer eksplosivt med vann. Svært sjeldent.' },
    Cs: { symbol: 'Cs', name: 'Cesium',     atomicNumber: 55, category: 'alkali',      period: 6, group: 1,  tier: 5, color: 0xddaa77, foundNative: false, stackSize: 99, description: 'Mest elektropositive grunnstoff. Smelter i hendene.' },
    Ga: { symbol: 'Ga', name: 'Gallium',    atomicNumber: 31, category: 'metal',       period: 4, group: 13, tier: 4, color: 0xaabbdd, foundNative: false, stackSize: 99, description: 'Smelter i hendene. Viktig halvleder-materiale.' },
    W:  { symbol: 'W',  name: 'Wolfram',    atomicNumber: 74, category: 'metal',       period: 6, group: 6,  tier: 4, color: 0x667788, foundNative: false, stackSize: 99, description: 'Høyeste smeltepunkt av alle metaller. Brukes i glødelamper.' },
};

// ── Periodic table layout (standard 18-column, rows 1–7 + lanthanides/actinides) ─
// row/col are 0-indexed. Lanthanides = row 8, actinides = row 9.

const PERIODIC_TABLE_LAYOUT = [
    // Period 1
    { symbol: 'H',  row: 0, col: 0 },
    { symbol: 'He', row: 0, col: 17 },
    // Period 2
    { symbol: 'Li', row: 1, col: 0 },
    { symbol: 'Be', row: 1, col: 1 },
    { symbol: 'C',  row: 1, col: 13 },
    { symbol: 'N',  row: 1, col: 14 },
    { symbol: 'O',  row: 1, col: 15 },
    { symbol: 'F',  row: 1, col: 16 },
    { symbol: 'Ne', row: 1, col: 17 },
    // Period 3
    { symbol: 'Na', row: 2, col: 0 },
    { symbol: 'Mg', row: 2, col: 1 },
    { symbol: 'Al', row: 2, col: 12 },
    { symbol: 'Si', row: 2, col: 13 },
    { symbol: 'P',  row: 2, col: 14 },
    { symbol: 'S',  row: 2, col: 15 },
    { symbol: 'Cl', row: 2, col: 16 },
    { symbol: 'Ar', row: 2, col: 17 },
    // Period 4
    { symbol: 'K',  row: 3, col: 0 },
    { symbol: 'Ca', row: 3, col: 1 },
    { symbol: 'Ti', row: 3, col: 3 },
    { symbol: 'V',  row: 3, col: 4 },
    { symbol: 'Cr', row: 3, col: 5 },
    { symbol: 'Mn', row: 3, col: 6 },
    { symbol: 'Fe', row: 3, col: 7 },
    { symbol: 'Co', row: 3, col: 8 },
    { symbol: 'Ni', row: 3, col: 9 },
    { symbol: 'Cu', row: 3, col: 10 },
    { symbol: 'Zn', row: 3, col: 11 },
    { symbol: 'Ga', row: 3, col: 12 },
    { symbol: 'Ge', row: 3, col: 13 },
    { symbol: 'As', row: 3, col: 14 },
    { symbol: 'Se', row: 3, col: 15 },
    { symbol: 'Br', row: 3, col: 16 },
    { symbol: 'Kr', row: 3, col: 17 },
    // Period 5
    { symbol: 'Rb', row: 4, col: 0 },
    { symbol: 'Sr', row: 4, col: 1 },
    { symbol: 'Mo', row: 4, col: 5 },
    { symbol: 'Pd', row: 4, col: 9 },
    { symbol: 'Ag', row: 4, col: 10 },
    { symbol: 'Sn', row: 4, col: 13 },
    { symbol: 'Sb', row: 4, col: 14 },
    { symbol: 'Te', row: 4, col: 15 },
    { symbol: 'I',  row: 4, col: 16 },
    { symbol: 'Xe', row: 4, col: 17 },
    // Period 6
    { symbol: 'Cs', row: 5, col: 0 },
    { symbol: 'Ba', row: 5, col: 1 },
    { symbol: 'W',  row: 5, col: 5 },
    { symbol: 'Re', row: 5, col: 6 },
    { symbol: 'Os', row: 5, col: 7 },
    { symbol: 'Ir', row: 5, col: 8 },
    { symbol: 'Pt', row: 5, col: 9 },
    { symbol: 'Au', row: 5, col: 10 },
    { symbol: 'Hg', row: 5, col: 11 },
    { symbol: 'Pb', row: 5, col: 13 },
    { symbol: 'Bi', row: 5, col: 14 },
    // Period 7 (actinides placed in main table)
    { symbol: 'Ra', row: 6, col: 1 },
    { symbol: 'Th', row: 8, col: 3 },
    { symbol: 'U',  row: 8, col: 5 },
];

// ── Collection bonuses (group/period/category completions) ──────────────────

const ELEMENT_BONUSES = [
    { id: 'iron_metals',    name: 'Jernmetaller',    desc: '+2 maks HP',          symbols: ['Fe', 'Co', 'Ni'],               reward: { maxHearts: 2 } },
    { id: 'coin_metals',    name: 'Myntmetaller',    desc: '+50% gullfunn',       symbols: ['Cu', 'Ag', 'Au'],               reward: { goldMultiplier: 0.5 } },
    { id: 'halogens',       name: 'Halogener',       desc: '-50% giftskade',      symbols: ['F', 'Cl', 'Br', 'I'],           reward: { poisonResist: 0.5 } },
    { id: 'noble_gases',    name: 'Edelgasser',      desc: 'Fusjonsteknologi',    symbols: ['He', 'Ne', 'Ar', 'Kr', 'Xe'],   reward: { fusionUnlock: true } },
    { id: 'alkali',         name: 'Alkalimetaller',  desc: '+20% kjemi',          symbols: ['Li', 'Na', 'K', 'Rb', 'Cs'],    reward: { chemEfficiency: 0.2 } },
    { id: 'period_1',       name: 'Periode 1',       desc: 'Big Bang',            symbols: ['H', 'He'],                      reward: { cosmicPower: true } },
    { id: 'period_2',       name: 'Periode 2',       desc: '+10% XP permanent',   symbols: ['Li', 'Be', 'C', 'N', 'O', 'F', 'Ne'], reward: { xpMultiplier: 0.1 } },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function getElementsByTier(tier) {
    return Object.values(ELEMENTS).filter(e => e.tier === tier);
}

// Total natural elements we track
const TOTAL_NATURAL_ELEMENTS = Object.keys(ELEMENTS).length;
