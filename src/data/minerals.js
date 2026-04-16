// ─── Labyrint Hero – Minerals & Crystals Dataset ─────────────────────────────
// Minerals are collectible items found in the labyrinth.
// Each mineral yields one or more elements when smelted (Phase 2).
// In Phase 1, picking up a mineral auto-discovers its constituent elements.

const MINERAL_DEFS = {
    // ── Tier 1 – Common ores ─────────────────────────────────────────────────
    quartz: {
        id: 'quartz', name: 'Kvarts', type: 'mineral', subtype: 'ore',
        formula: 'SiO\u2082', tier: 1, color: 0xeeeeff,
        yields: [{ symbol: 'Si', amount: 1, chance: 1.0 }, { symbol: 'O', amount: 2, chance: 0.5 }],
        energyCost: 1, smeltingTime: 2, stackSize: 10,
        desc: 'Vanlig mineral. Gir silisium og oksygen.'
    },
    hematite: {
        id: 'hematite', name: 'Hematitt', type: 'mineral', subtype: 'ore',
        formula: 'Fe\u2082O\u2083', tier: 1, color: 0x8b3a3a,
        yields: [{ symbol: 'Fe', amount: 5, chance: 1.0 }, { symbol: 'O', amount: 3, chance: 0.3 }],
        energyCost: 2, smeltingTime: 3, stackSize: 10,
        desc: 'R\u00f8dlig jernmalm. Rik jernkilde.'
    },
    magnetite: {
        id: 'magnetite', name: 'Magnetitt', type: 'mineral', subtype: 'ore',
        formula: 'Fe\u2083O\u2084', tier: 1, color: 0x333344,
        yields: [{ symbol: 'Fe', amount: 6, chance: 1.0 }],
        energyCost: 2, smeltingTime: 3, stackSize: 10,
        desc: 'Sort jernmalm. Magnetisk! Rikeste jernkilden.'
    },
    limestone: {
        id: 'limestone', name: 'Kalkstein', type: 'mineral', subtype: 'ore',
        formula: 'CaCO\u2083', tier: 1, color: 0xccccbb,
        yields: [{ symbol: 'Ca', amount: 2, chance: 1.0 }, { symbol: 'C', amount: 3, chance: 0.8 }],
        energyCost: 1, smeltingTime: 2, stackSize: 10,
        desc: 'Hvitlig stein. Gir kalsium og karbon.'
    },
    halite: {
        id: 'halite', name: 'Halit', type: 'mineral', subtype: 'ore',
        formula: 'NaCl', tier: 1, color: 0xeeeedd,
        yields: [{ symbol: 'Na', amount: 1, chance: 1.0 }, { symbol: 'Cl', amount: 1, chance: 0.7 }],
        energyCost: 1, smeltingTime: 1, stackSize: 10,
        desc: 'Steinsalt. Kubiske krystaller.'
    },
    bauxite: {
        id: 'bauxite', name: 'Bauxitt', type: 'mineral', subtype: 'ore',
        formula: 'Al\u2082O\u2083', tier: 1, color: 0x995533,
        yields: [{ symbol: 'Al', amount: 5, chance: 1.0 }],
        energyCost: 3, smeltingTime: 4, stackSize: 10,
        desc: 'R\u00f8dbrun jord. Rik aluminiumskilde.'
    },
    olivine: {
        id: 'olivine', name: 'Olivin', type: 'mineral', subtype: 'ore',
        formula: '(Mg,Fe)\u2082SiO\u2084', tier: 1, color: 0x88aa44,
        yields: [{ symbol: 'Mg', amount: 3, chance: 1.0 }, { symbol: 'Fe', amount: 2, chance: 0.5 }, { symbol: 'Si', amount: 2, chance: 0.3 }],
        energyCost: 2, smeltingTime: 3, stackSize: 10,
        desc: 'Gr\u00f8nt silikatmineral fra dypet.'
    },
    ice_crystal: {
        id: 'ice_crystal', name: 'Iskrystall', type: 'mineral', subtype: 'ore',
        formula: 'H\u2082O', tier: 1, color: 0xaaddff,
        yields: [{ symbol: 'H', amount: 5, chance: 1.0 }, { symbol: 'O', amount: 3, chance: 1.0 }],
        energyCost: 0, smeltingTime: 1, stackSize: 10,
        desc: 'Frosset vann. Rik kilde til hydrogen og oksygen.'
    },
    sylvite: {
        id: 'sylvite', name: 'Sylvitt', type: 'mineral', subtype: 'ore',
        formula: 'KCl', tier: 1, color: 0xddaa88,
        yields: [{ symbol: 'K', amount: 4, chance: 1.0 }, { symbol: 'Cl', amount: 3, chance: 0.8 }],
        energyCost: 1, smeltingTime: 2, stackSize: 10,
        desc: 'Kaliumklorid. Viktig for krutt og kjemi.'
    },
    niter: {
        id: 'niter', name: 'Salpeter', type: 'mineral', subtype: 'ore',
        formula: 'KNO\u2083', tier: 2, color: 0xccccbb,
        yields: [{ symbol: 'K', amount: 3, chance: 1.0 }, { symbol: 'N', amount: 3, chance: 1.0 }, { symbol: 'O', amount: 2, chance: 0.5 }],
        energyCost: 1, smeltingTime: 2, stackSize: 10,
        desc: 'Naturlig salpeter. Gir kalium og nitrogen.'
    },

    // ── Tier 2 – Uncommon ores ───────────────────────────────────────────────
    borax: {
        id: 'borax', name: 'Boraks', type: 'mineral', subtype: 'ore',
        formula: 'Na₂B₄O₇', tier: 2, color: 0xddddcc,
        yields: [{ symbol: 'B', amount: 4, chance: 1.0 }, { symbol: 'Na', amount: 2, chance: 0.5 }],
        energyCost: 1, smeltingTime: 2, stackSize: 10,
        desc: 'Hvitt bor-mineral. Viktig kilde til bor.'
    },
    thortveitite: {
        id: 'thortveitite', name: 'Thortveititt', type: 'mineral', subtype: 'ore',
        formula: 'Sc₂Si₂O₇', tier: 2, color: 0xaabb99,
        yields: [{ symbol: 'Sc', amount: 2, chance: 1.0 }, { symbol: 'Si', amount: 2, chance: 0.5 }],
        energyCost: 2, smeltingTime: 3, stackSize: 10,
        desc: 'Sjelden skandiumkilde. Oppkalt etter norsk mineralog.'
    },
    pyrite: {
        id: 'pyrite', name: 'Pyritt', type: 'mineral', subtype: 'ore',
        formula: 'FeS\u2082', tier: 2, color: 0xccbb44,
        yields: [{ symbol: 'Fe', amount: 3, chance: 1.0 }, { symbol: 'S', amount: 4, chance: 0.8 }],
        energyCost: 2, smeltingTime: 3, stackSize: 10,
        desc: 'Narregull! Gulaktig, men gir mye jern og svovel.'
    },
    ilmenite: {
        id: 'ilmenite', name: 'Ilmenitt', type: 'mineral', subtype: 'ore',
        formula: 'FeTiO\u2083', tier: 2, color: 0x222233,
        yields: [{ symbol: 'Fe', amount: 2, chance: 0.7 }, { symbol: 'Ti', amount: 3, chance: 1.0 }],
        energyCost: 3, smeltingTime: 4, stackSize: 10,
        desc: 'Sort mineral. Titankilde.'
    },
    apatite: {
        id: 'apatite', name: 'Apatitt', type: 'mineral', subtype: 'ore',
        formula: 'Ca\u2085(PO\u2084)\u2083(OH)', tier: 2, color: 0x44aa88,
        yields: [{ symbol: 'Ca', amount: 1, chance: 0.5 }, { symbol: 'P', amount: 1, chance: 1.0 }],
        energyCost: 2, smeltingTime: 3, stackSize: 10,
        desc: 'Gr\u00f8nn/bl\u00e5 mineral. Fosforkilde.'
    },

    // ── Tier 3 – Rare ores ──────────────────────────────────────────────────
    zircon: {
        id: 'zircon', name: 'Zirkon', type: 'mineral', subtype: 'ore',
        formula: 'ZrSiO₄', tier: 3, color: 0xccaa77,
        yields: [{ symbol: 'Zr', amount: 3, chance: 1.0 }, { symbol: 'Si', amount: 1, chance: 0.5 }],
        energyCost: 3, smeltingTime: 4, stackSize: 10,
        desc: 'Robust silikatmineral. Rik zirkoniumkilde.'
    },
    pentlandite: {
        id: 'pentlandite', name: 'Pentlanditt', type: 'mineral', subtype: 'ore',
        formula: '(Fe,Ni)₉S₈', tier: 3, color: 0x998844,
        yields: [{ symbol: 'Ni', amount: 3, chance: 1.0 }, { symbol: 'Fe', amount: 2, chance: 0.6 }, { symbol: 'S', amount: 2, chance: 0.4 }],
        energyCost: 3, smeltingTime: 4, stackSize: 10,
        desc: 'Viktigste nikkelmalm. Gyllen metallisk glans.'
    },
    spodumene: {
        id: 'spodumene', name: 'Spodumen', type: 'mineral', subtype: 'ore',
        formula: 'LiAlSi₂O₆', tier: 3, color: 0xddccee,
        yields: [{ symbol: 'Li', amount: 3, chance: 1.0 }, { symbol: 'Al', amount: 1, chance: 0.4 }],
        energyCost: 2, smeltingTime: 3, stackSize: 10,
        desc: 'Viktigste litiumkilde. Brukes i batteriproduksjon.'
    },
    cobaltite: {
        id: 'cobaltite', name: 'Kobaltitt', type: 'mineral', subtype: 'ore',
        formula: 'CoAsS', tier: 3, color: 0x5566aa,
        yields: [{ symbol: 'Co', amount: 3, chance: 1.0 }, { symbol: 'As', amount: 1, chance: 0.5 }],
        energyCost: 3, smeltingTime: 4, stackSize: 10,
        desc: 'Sølvgrå koboltmalm. Gir intens blåfarge.'
    },
    chalcopyrite: {
        id: 'chalcopyrite', name: 'Kalkopyritt', type: 'mineral', subtype: 'ore',
        formula: 'CuFeS\u2082', tier: 3, color: 0xbb9933,
        yields: [{ symbol: 'Cu', amount: 3, chance: 1.0 }, { symbol: 'Fe', amount: 2, chance: 0.5 }, { symbol: 'S', amount: 2, chance: 0.3 }],
        energyCost: 3, smeltingTime: 4, stackSize: 10,
        desc: 'Messinggul. Rik kobberkilde.'
    },
    malachite: {
        id: 'malachite', name: 'Malakit', type: 'mineral', subtype: 'ore',
        formula: 'Cu\u2082CO\u2083(OH)\u2082', tier: 3, color: 0x22bb66,
        yields: [{ symbol: 'Cu', amount: 5, chance: 1.0 }],
        energyCost: 2, smeltingTime: 3, stackSize: 10,
        desc: 'Vakker klargr\u00f8nn. Svært rik kobberkilde.'
    },
    sphalerite: {
        id: 'sphalerite', name: 'Sfaleritt', type: 'mineral', subtype: 'ore',
        formula: 'ZnS', tier: 3, color: 0x554433,
        yields: [{ symbol: 'Zn', amount: 3, chance: 1.0 }, { symbol: 'S', amount: 2, chance: 0.6 }],
        energyCost: 2, smeltingTime: 3, stackSize: 10,
        desc: 'Sort/brun. Viktigste sinkkilde.'
    },
    chromite: {
        id: 'chromite', name: 'Kromitt', type: 'mineral', subtype: 'ore',
        formula: 'FeCr\u2082O\u2084', tier: 3, color: 0x334433,
        yields: [{ symbol: 'Cr', amount: 4, chance: 1.0 }, { symbol: 'Fe', amount: 2, chance: 0.4 }],
        energyCost: 4, smeltingTime: 5, stackSize: 10,
        desc: 'M\u00f8rk malmstein. Eneste kromkilde.'
    },

    // ── Tier 4 – Epic ores ──────────────────────────────────────────────────
    columbite: {
        id: 'columbite', name: 'Kolumbitt', type: 'mineral', subtype: 'ore',
        formula: '(Fe,Mn)(Nb,Ta)₂O₆', tier: 4, color: 0x443322,
        yields: [{ symbol: 'Nb', amount: 2, chance: 1.0 }, { symbol: 'Ta', amount: 1, chance: 0.4 }, { symbol: 'Fe', amount: 1, chance: 0.3 }],
        energyCost: 4, smeltingTime: 5, stackSize: 10,
        desc: 'Sort niob-tantal-malm. Viktig for elektronikk.'
    },
    monazite: {
        id: 'monazite', name: 'Monazitt', type: 'mineral', subtype: 'ore',
        formula: '(Ce,La,Nd)PO₄', tier: 4, color: 0xcc8855,
        yields: [{ symbol: 'Ce', amount: 2, chance: 1.0 }, { symbol: 'La', amount: 1, chance: 0.6 }, { symbol: 'Nd', amount: 1, chance: 0.4 }],
        energyCost: 3, smeltingTime: 4, stackSize: 10,
        desc: 'Brun fosfatmalm. Hovedkilde til sjeldne jordarter.'
    },
    bastnaesite: {
        id: 'bastnaesite', name: 'Bastnäsitt', type: 'mineral', subtype: 'ore',
        formula: '(Ce,La)(CO₃)F', tier: 4, color: 0xddaa66,
        yields: [{ symbol: 'Ce', amount: 2, chance: 1.0 }, { symbol: 'La', amount: 1, chance: 0.5 }, { symbol: 'F', amount: 1, chance: 0.3 }],
        energyCost: 3, smeltingTime: 4, stackSize: 10,
        desc: 'Gulbrun lantanide-malm. Oppkalt etter Bastnäs i Sverige.'
    },
    greenockite: {
        id: 'greenockite', name: 'Greenockitt', type: 'mineral', subtype: 'ore',
        formula: 'CdS', tier: 4, color: 0xddcc22,
        yields: [{ symbol: 'Cd', amount: 2, chance: 1.0 }, { symbol: 'S', amount: 1, chance: 0.6 }],
        energyCost: 2, smeltingTime: 3, stackSize: 10,
        desc: 'Gul kadmiummalm. Giftig – håndter med forsiktighet!'
    },
    wolframite: {
        id: 'wolframite', name: 'Wolframitt', type: 'mineral', subtype: 'ore',
        formula: '(Fe,Mn)WO₄', tier: 4, color: 0x443344,
        yields: [{ symbol: 'W', amount: 2, chance: 1.0 }, { symbol: 'Fe', amount: 1, chance: 0.5 }, { symbol: 'Mn', amount: 1, chance: 0.3 }],
        energyCost: 5, smeltingTime: 6, stackSize: 10,
        desc: 'Mørk tungsteinmalm. Gir wolfram – hardeste metallet.'
    },
    galena: {
        id: 'galena', name: 'Galena', type: 'mineral', subtype: 'ore',
        formula: 'PbS', tier: 4, color: 0x667788,
        yields: [{ symbol: 'Pb', amount: 3, chance: 1.0 }, { symbol: 'S', amount: 2, chance: 0.5 }, { symbol: 'Ag', amount: 1, chance: 0.15 }],
        energyCost: 3, smeltingTime: 4, stackSize: 10,
        desc: 'Gr\u00e5 metallisk. Bly-kilde, noen ganger med s\u00f8lv.'
    },
    cassiterite: {
        id: 'cassiterite', name: 'Kassiteritt', type: 'mineral', subtype: 'ore',
        formula: 'SnO\u2082', tier: 4, color: 0x554422,
        yields: [{ symbol: 'Sn', amount: 3, chance: 1.0 }],
        energyCost: 3, smeltingTime: 4, stackSize: 10,
        desc: 'Brun/sort. Rik tinnkilde – n\u00f8dvendig for bronse.'
    },
    cinnabar: {
        id: 'cinnabar', name: 'Sinnobar', type: 'mineral', subtype: 'ore',
        formula: 'HgS', tier: 4, color: 0xcc2222,
        yields: [{ symbol: 'Hg', amount: 1, chance: 1.0 }, { symbol: 'S', amount: 1, chance: 0.7 }],
        energyCost: 2, smeltingTime: 3, stackSize: 10,
        desc: 'Knallr\u00f8d. Kvikks\u00f8lvkilde. Giftig!'
    },

    // ── Tier 5 – Legendary ──────────────────────────────────────────────────
    pgm_ore: {
        id: 'pgm_ore', name: 'PGM-malm', type: 'mineral', subtype: 'ore',
        formula: 'PGM', tier: 5, color: 0xccccaa,
        yields: [{ symbol: 'Ru', amount: 1, chance: 0.7 }, { symbol: 'Rh', amount: 1, chance: 0.5 }, { symbol: 'Pd', amount: 1, chance: 0.6 }, { symbol: 'Pt', amount: 1, chance: 0.4 }, { symbol: 'Ir', amount: 1, chance: 0.3 }, { symbol: 'Os', amount: 1, chance: 0.2 }],
        energyCost: 5, smeltingTime: 6, stackSize: 10,
        desc: 'Sjelden platinametall-malm. Inneholder alle seks platinametaller.'
    },
    argentite: {
        id: 'argentite', name: 'Argentitt', type: 'mineral', subtype: 'ore',
        formula: 'Ag\u2082S', tier: 5, color: 0xaaaacc,
        yields: [{ symbol: 'Ag', amount: 4, chance: 1.0 }],
        energyCost: 3, smeltingTime: 4, stackSize: 10,
        desc: 'S\u00f8lvgr\u00e5 malm. Rik s\u00f8lvkilde.'
    },
    native_gold: {
        id: 'native_gold', name: 'Nativt gull', type: 'mineral', subtype: 'ore',
        formula: 'Au', tier: 5, color: 0xffcc00,
        yields: [{ symbol: 'Au', amount: 3, chance: 1.0 }],
        energyCost: 1, smeltingTime: 2, stackSize: 10,
        desc: 'Rent gull! Store klumper i bergarten.'
    },
    native_silver: {
        id: 'native_silver', name: 'Nativt s\u00f8lv', type: 'mineral', subtype: 'ore',
        formula: 'Ag', tier: 5, color: 0xddddee,
        yields: [{ symbol: 'Ag', amount: 3, chance: 1.0 }],
        energyCost: 1, smeltingTime: 2, stackSize: 10,
        desc: 'Rent s\u00f8lv i tr\u00e5dform. Sjeldent funn.'
    },

    // ── Tier 6 – Mythic ─────────────────────────────────────────────────────
    uraninite: {
        id: 'uraninite', name: 'Uraninitt', type: 'mineral', subtype: 'ore',
        formula: 'UO\u2082', tier: 6, color: 0x224422,
        yields: [{ symbol: 'U', amount: 1, chance: 1.0 }],
        energyCost: 5, smeltingTime: 8, stackSize: 10,
        desc: 'Sort og tung. Radioaktivt! Urankilde.'
    },
    molybdenite: {
        id: 'molybdenite', name: 'Molybdenitt', type: 'mineral', subtype: 'ore',
        formula: 'MoS\u2082', tier: 4, color: 0x667788,
        yields: [{ symbol: 'Mo', amount: 2, chance: 1.0 }, { symbol: 'S', amount: 1, chance: 0.6 }],
        energyCost: 4, smeltingTime: 5, stackSize: 10,
        desc: 'Sølvgrå, flisete krystaller. Molybdenkilde.'
    },
    barite: {
        id: 'barite', name: 'Barytt', type: 'mineral', subtype: 'ore',
        formula: 'BaSO\u2084', tier: 3, color: 0xccbb99,
        yields: [{ symbol: 'Ba', amount: 2, chance: 1.0 }, { symbol: 'S', amount: 1, chance: 0.5 }],
        energyCost: 3, smeltingTime: 4, stackSize: 10,
        desc: 'Tungt hvitt mineral. Bariumkilde, brukes i fyrverkeri.'
    },

    // ── Phase 5 minerals: fills orphan element gaps ────────────────────────

    // Critical fixes: V source for titanium alloy
    vanadinite: {
        id: 'vanadinite', name: 'Vanadinitt', type: 'mineral', subtype: 'ore',
        formula: 'Pb\u2085(VO\u2084)\u2083Cl', tier: 3, color: 0xcc6633,
        yields: [{ symbol: 'V', amount: 2, chance: 1.0 }, { symbol: 'Pb', amount: 1, chance: 0.5 }],
        energyCost: 3, smeltingTime: 4, stackSize: 10,
        desc: 'Oransjrøde krystaller. Viktigste vanadiumkilde.'
    },

    // Halogens
    bromargyryte: {
        id: 'bromargyryte', name: 'Bromargyryt', type: 'mineral', subtype: 'ore',
        formula: 'AgBr', tier: 4, color: 0xccaa44,
        yields: [{ symbol: 'Br', amount: 2, chance: 1.0 }, { symbol: 'Ag', amount: 1, chance: 0.4 }],
        energyCost: 3, smeltingTime: 4, stackSize: 10,
        desc: 'Gulaktig sølvhalid. Sjelden bromkilde.'
    },
    iodyrite: {
        id: 'iodyrite', name: 'Jodyritt', type: 'mineral', subtype: 'ore',
        formula: 'AgI', tier: 4, color: 0x886644,
        yields: [{ symbol: 'I', amount: 2, chance: 1.0 }, { symbol: 'Ag', amount: 1, chance: 0.3 }],
        energyCost: 3, smeltingTime: 4, stackSize: 10,
        desc: 'Gult sølvjodid. Sjelden jodkilde.'
    },

    // Semiconductors
    germanite: {
        id: 'germanite', name: 'Germanitt', type: 'mineral', subtype: 'ore',
        formula: 'Cu\u2082\u2086Fe\u2084Ge\u2084S\u2083\u2082', tier: 4, color: 0x998877,
        yields: [{ symbol: 'Ge', amount: 2, chance: 1.0 }, { symbol: 'Cu', amount: 1, chance: 0.5 }, { symbol: 'S', amount: 1, chance: 0.3 }],
        energyCost: 4, smeltingTime: 5, stackSize: 10,
        desc: 'Sjelden kobber-germanium-sulfid. Halvlederkilde.'
    },
    stibnite: {
        id: 'stibnite', name: 'Stibnitt', type: 'mineral', subtype: 'ore',
        formula: 'Sb\u2082S\u2083', tier: 3, color: 0x555566,
        yields: [{ symbol: 'Sb', amount: 2, chance: 1.0 }, { symbol: 'S', amount: 1, chance: 0.6 }],
        energyCost: 3, smeltingTime: 4, stackSize: 10,
        desc: 'Stålgrå nåler. Antimonkilde.'
    },
    gallite: {
        id: 'gallite', name: 'Gallitt', type: 'mineral', subtype: 'ore',
        formula: 'CuGaS\u2082', tier: 4, color: 0xaabbdd,
        yields: [{ symbol: 'Ga', amount: 2, chance: 1.0 }, { symbol: 'Cu', amount: 1, chance: 0.4 }],
        energyCost: 3, smeltingTime: 4, stackSize: 10,
        desc: 'Sjelden galliumsulfid. Viktig for halvledere.'
    },

    // Rare earths & misc metals
    xenotime: {
        id: 'xenotime', name: 'Xenotim', type: 'mineral', subtype: 'ore',
        formula: 'YPO\u2084', tier: 4, color: 0xbbaa88,
        yields: [{ symbol: 'Y', amount: 2, chance: 1.0 }, { symbol: 'Dy', amount: 1, chance: 0.4 }, { symbol: 'Er', amount: 1, chance: 0.3 }, { symbol: 'Yb', amount: 1, chance: 0.2 }],
        energyCost: 4, smeltingTime: 5, stackSize: 10,
        desc: 'Brun fosfatmineral. Rik på tunge sjeldne jordartsmetaller.'
    },
    samarskite: {
        id: 'samarskite', name: 'Samarskitt', type: 'mineral', subtype: 'ore',
        formula: '(Y,Ce,U)(Nb,Ta)O\u2084', tier: 5, color: 0x332211,
        yields: [{ symbol: 'Sm', amount: 1, chance: 0.7 }, { symbol: 'Gd', amount: 1, chance: 0.5 }, { symbol: 'Pr', amount: 1, chance: 0.4 }, { symbol: 'Nb', amount: 1, chance: 0.3 }],
        energyCost: 5, smeltingTime: 6, stackSize: 10,
        desc: 'Sort, radioaktivt. Kilde til samarium og gadolinium.'
    },
    celestine: {
        id: 'celestine', name: 'Celestin', type: 'mineral', subtype: 'ore',
        formula: 'SrSO\u2084', tier: 3, color: 0xaaccee,
        yields: [{ symbol: 'Sr', amount: 2, chance: 1.0 }, { symbol: 'S', amount: 1, chance: 0.5 }],
        energyCost: 2, smeltingTime: 3, stackSize: 10,
        desc: 'Himmelblå krystaller. Strontiumkilde.'
    },
    pollucite: {
        id: 'pollucite', name: 'Pollucitt', type: 'mineral', subtype: 'ore',
        formula: 'CsAlSi\u2082O\u2086', tier: 5, color: 0xeeddcc,
        yields: [{ symbol: 'Cs', amount: 2, chance: 1.0 }, { symbol: 'Rb', amount: 1, chance: 0.4 }],
        energyCost: 4, smeltingTime: 5, stackSize: 10,
        desc: 'Sjeldent zeolitt-mineral. Eneste kommersielle cesiumkilde.'
    },
    calaverite: {
        id: 'calaverite', name: 'Calaveritt', type: 'mineral', subtype: 'ore',
        formula: 'AuTe\u2082', tier: 5, color: 0xddcc44,
        yields: [{ symbol: 'Te', amount: 2, chance: 1.0 }, { symbol: 'Au', amount: 1, chance: 0.5 }],
        energyCost: 4, smeltingTime: 5, stackSize: 10,
        desc: 'Gulltellurid. Sjelden kilde til tellur og gull.'
    },
    indite_ore: {
        id: 'indite_ore', name: 'Inditt', type: 'mineral', subtype: 'ore',
        formula: 'FeIn\u2082S\u2084', tier: 4, color: 0x7788aa,
        yields: [{ symbol: 'In', amount: 2, chance: 1.0 }, { symbol: 'Fe', amount: 1, chance: 0.5 }],
        energyCost: 3, smeltingTime: 4, stackSize: 10,
        desc: 'Sjelden indiumsulfid. Viktig for berøringsskjermer.'
    },

    // Actinides
    thorite: {
        id: 'thorite', name: 'Thoritt', type: 'mineral', subtype: 'ore',
        formula: 'ThSiO\u2084', tier: 6, color: 0x446644,
        yields: [{ symbol: 'Th', amount: 2, chance: 1.0 }, { symbol: 'Si', amount: 1, chance: 0.5 }],
        energyCost: 5, smeltingTime: 7, stackSize: 10,
        desc: 'Radioaktivt thoriummineral. Alternativ kjernebrensel.'
    },

    // ── Crystals / Gemstones (subtype: 'crystal') ───────────────────────────
    clear_quartz: {
        id: 'clear_quartz', name: 'Klar kvarts', type: 'mineral', subtype: 'crystal',
        formula: 'SiO\u2082', tier: 1, color: 0xffffff,
        yields: [{ symbol: 'Si', amount: 1, chance: 0.5 }],
        energyCost: 0, smeltingTime: 0, stackSize: 10,
        effect: { visionRadius: 1 },
        desc: 'Gjennomsiktig krystall. Svak magisk resonans.'
    },
    amethyst: {
        id: 'amethyst', name: 'Ametyst', type: 'mineral', subtype: 'crystal',
        formula: 'SiO\u2082 + Mn', tier: 2, color: 0xaa44cc,
        yields: [{ symbol: 'Si', amount: 1, chance: 0.3 }, { symbol: 'Mn', amount: 1, chance: 0.2 }],
        energyCost: 0, smeltingTime: 0, stackSize: 10,
        effect: { poisonResist: 0.15 },
        desc: 'Lilla kvarts. Beskytter mot gift.'
    },
    citrine: {
        id: 'citrine', name: 'Citrin', type: 'mineral', subtype: 'crystal',
        formula: 'SiO\u2082 + Fe', tier: 2, color: 0xddaa22,
        yields: [{ symbol: 'Si', amount: 1, chance: 0.3 }, { symbol: 'Fe', amount: 1, chance: 0.2 }],
        energyCost: 0, smeltingTime: 0, stackSize: 10,
        effect: { goldMultiplier: 0.2 },
        desc: 'Gul kvarts. Tiltrekker gull.'
    },
    emerald: {
        id: 'emerald', name: 'Smaragd', type: 'mineral', subtype: 'crystal',
        formula: 'Be\u2083Al\u2082Si\u2086O\u2081\u2088 + Cr', tier: 3, color: 0x22cc44,
        yields: [{ symbol: 'Cr', amount: 1, chance: 0.3 }, { symbol: 'Be', amount: 1, chance: 0.1 }],
        energyCost: 0, smeltingTime: 0, stackSize: 10,
        effect: { poisonResist: 0.3 },
        desc: 'Dyp gr\u00f8nn edelsten. Sterk giftresistans.'
    },
    aquamarine: {
        id: 'aquamarine', name: 'Akvamarin', type: 'mineral', subtype: 'crystal',
        formula: 'Be\u2083Al\u2082Si\u2086O\u2081\u2088', tier: 3, color: 0x44bbdd,
        yields: [{ symbol: 'Be', amount: 1, chance: 0.2 }],
        energyCost: 0, smeltingTime: 0, stackSize: 10,
        effect: { burnResist: 0.3 },
        desc: 'Lysbl\u00e5 beryll. Beskytter mot brann.'
    },
    ruby: {
        id: 'ruby', name: 'Rubin', type: 'mineral', subtype: 'crystal',
        formula: 'Al\u2082O\u2083 + Cr', tier: 4, color: 0xdd2244,
        yields: [{ symbol: 'Al', amount: 1, chance: 0.3 }, { symbol: 'Cr', amount: 1, chance: 0.2 }],
        energyCost: 0, smeltingTime: 0, stackSize: 10,
        effect: { attack: 1 },
        desc: 'Blodr\u00f8d edelsten. \u00d8ker angrepskraft.'
    },
    sapphire: {
        id: 'sapphire', name: 'Safir', type: 'mineral', subtype: 'crystal',
        formula: 'Al\u2082O\u2083 + Fe/Ti', tier: 4, color: 0x2244cc,
        yields: [{ symbol: 'Al', amount: 1, chance: 0.3 }, { symbol: 'Ti', amount: 1, chance: 0.1 }],
        energyCost: 0, smeltingTime: 0, stackSize: 10,
        effect: { defense: 1 },
        desc: 'Dyp bl\u00e5 edelsten. \u00d8ker forsvar.'
    },
    diamond: {
        id: 'diamond', name: 'Diamant', type: 'mineral', subtype: 'crystal',
        formula: 'C', tier: 5, color: 0xeeffff,
        yields: [{ symbol: 'C', amount: 1, chance: 1.0 }],
        energyCost: 0, smeltingTime: 0, stackSize: 10,
        effect: { attack: 1, defense: 1, maxHearts: 1 },
        desc: 'Det hardeste naturlige materialet. Ren karbon.'
    },
    red_beryl: {
        id: 'red_beryl', name: 'R\u00f8d beryll', type: 'mineral', subtype: 'crystal',
        formula: 'Be\u2083Al\u2082Si\u2086O\u2081\u2088 + Mn', tier: 6, color: 0xee4466,
        yields: [{ symbol: 'Be', amount: 1, chance: 0.3 }],
        energyCost: 0, smeltingTime: 0, stackSize: 10,
        effect: { critChance: 0.1, dodgeChance: 0.1 },
        desc: 'Ekstremt sjelden. Tidsforvrengning.'
    },
};

// ── Mineral pools grouped by tier ────────────────────────────────────────────

const MINERAL_POOL = {
    1: ['quartz', 'hematite', 'magnetite', 'limestone', 'halite', 'bauxite', 'olivine', 'ice_crystal', 'sylvite'],
    2: ['pyrite', 'ilmenite', 'apatite', 'niter', 'borax', 'thortveitite'],
    3: ['chalcopyrite', 'malachite', 'sphalerite', 'chromite', 'zircon', 'pentlandite', 'spodumene', 'cobaltite', 'vanadinite', 'stibnite', 'celestine', 'barite'],
    4: ['galena', 'cassiterite', 'cinnabar', 'columbite', 'monazite', 'bastnaesite', 'greenockite', 'wolframite', 'molybdenite', 'bromargyryte', 'iodyrite', 'germanite', 'gallite', 'xenotime', 'indite_ore'],
    5: ['argentite', 'native_gold', 'native_silver', 'pgm_ore', 'samarskite', 'pollucite', 'calaverite'],
    6: ['uraninite', 'thorite'],
};

const CRYSTAL_POOL = {
    1: ['clear_quartz'],
    2: ['amethyst', 'citrine'],
    3: ['emerald', 'aquamarine'],
    4: ['ruby', 'sapphire'],
    5: ['diamond'],
    6: ['red_beryl'],
};

// ── Roll functions ───────────────────────────────────────────────────────────

/**
 * Roll a mineral tier based on world number.
 * Zone as floor-tier with random upward spread.
 * World 1-2 → mostly T1, World 3-4 → T1-T2, World 5 → T2-T3, etc.
 */
function rollMineralTier(worldNum) {
    // Base tier: 1 for worlds 1-2, 2 for worlds 3-4, 3 for worlds 5-6, etc.
    const baseTier = Math.max(1, Math.ceil(worldNum / 2));
    let tier = baseTier;

    // 12% chance to roll one tier higher, 3% for two tiers higher
    const roll = Math.random();
    if (roll < 0.03)      tier += 2;
    else if (roll < 0.15) tier += 1;

    return Math.min(tier, 6);
}

/**
 * Pick a random mineral for a given world.
 * 15% chance of crystal instead of ore.
 */
function rollMineralForWorld(worldNum) {
    const tier = rollMineralTier(worldNum);
    const isCrystal = Math.random() < 0.15;
    const pool = isCrystal ? CRYSTAL_POOL : MINERAL_POOL;

    // Find the best available tier (fall back to lower tiers if pool is empty)
    for (let t = tier; t >= 1; t--) {
        if (pool[t] && pool[t].length > 0) {
            const id = pool[t][Math.floor(Math.random() * pool[t].length)];
            return MINERAL_DEFS[id];
        }
    }
    // Fallback: quartz
    return MINERAL_DEFS.quartz;
}

/**
 * Roll a mineral for boss drops – one tier higher than normal, minimum tier 3.
 */
function rollBossMineral(worldNum) {
    const baseTier = Math.max(3, Math.ceil(worldNum / 2) + 1);
    const tier = Math.min(baseTier + (Math.random() < 0.2 ? 1 : 0), 6);
    const isCrystal = Math.random() < 0.3; // bosses more likely to drop crystals
    const pool = isCrystal ? CRYSTAL_POOL : MINERAL_POOL;

    for (let t = tier; t >= 1; t--) {
        if (pool[t] && pool[t].length > 0) {
            const id = pool[t][Math.floor(Math.random() * pool[t].length)];
            return MINERAL_DEFS[id];
        }
    }
    return MINERAL_DEFS.malachite;
}

/**
 * Return a display name for a mineral based on hero's identification ability.
 * Without Geolog skill: generic description based on appearance (color/subtype).
 * With Geolog skill: actual mineral name.
 */
function getMineralDisplayName(mineralDef, hero) {
    if (!mineralDef || mineralDef.type !== 'mineral') return mineralDef ? mineralDef.name : '???';
    if ((hero.mineralIdentifyLevel || 0) > 0) return mineralDef.name;

    // Generic descriptions based on color and subtype
    if (mineralDef.subtype === 'crystal') {
        const col = mineralDef.color || 0xffffff;
        const r = (col >> 16) & 0xff, g = (col >> 8) & 0xff, b = col & 0xff;
        if (r > 180 && g < 100 && b < 100) return 'Rødlig krystall';
        if (r < 100 && g > 150 && b < 100) return 'Grønnlig krystall';
        if (r < 100 && g < 100 && b > 150) return 'Blålig krystall';
        if (r > 180 && g > 150 && b < 100) return 'Gyllen krystall';
        if (r > 150 && g < 100 && b > 150) return 'Fiolett krystall';
        return 'Ukjent krystall';
    }
    const col = mineralDef.color || 0x888888;
    const r = (col >> 16) & 0xff, g = (col >> 8) & 0xff, b = col & 0xff;
    if (r > 150 && g < 100 && b < 100) return 'Rødlig malm';
    if (r > 150 && g > 120 && b < 80) return 'Gulbrun malm';
    if (r < 100 && g > 130) return 'Grønnlig malm';
    if (r < 100 && g < 100 && b > 130) return 'Blålig malm';
    if (r > 180 && g > 180 && b > 180) return 'Lys malm';
    if (r < 80 && g < 80 && b < 80) return 'Mørk malm';
    return 'Ukjent malm';
}

// Rarity color mapping for mineral tiers (matches existing rarity system visuals)
const MINERAL_TIER_COLORS = {
    1: 0x888888, // grey – common
    2: 0x44bb44, // green – uncommon
    3: 0x4488ff, // blue – rare
    4: 0xaa44ff, // purple – epic
    5: 0xffcc00, // gold – legendary
    6: 0xff44ff, // rainbow/pink – mythic
};
