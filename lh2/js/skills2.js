// ─── Labyrint Hero 2 – Skill tree ────────────────────────────────────────────
// LH1-style specialization paths. Skill points come from hero level-ups
// (XP from defeating monsters); each skill can stack a few times.
// Effects are applied centrally in Hero2.recompute().

const SKILLS2 = [
    {
        id: 'kriger', name: 'Kriger', color: '#ff5555',
        skills: [
            { id: 'power_strike', name: 'Kraftig slag', desc: '+1 Angrep per nivå', max: 3 },
            { id: 'battle_hardened', name: 'Kampherdet', desc: '+1 Maks hjerte per nivå', max: 2 },
        ],
    },
    {
        id: 'jeger', name: 'Villmarksjeger', color: '#88cc44',
        skills: [
            { id: 'keen_eye', name: 'Skarpsyn', desc: '+20% XP per nivå', max: 2 },
            { id: 'fleet_foot', name: 'Rappfot', desc: '+10% bevegelsesfart per nivå', max: 2 },
        ],
    },
    {
        id: 'geolog', name: 'Geolog', color: '#bb9966',
        skills: [
            { id: 'mineral_eye', name: 'Malmøye', desc: 'Malmforekomster vises på minimap', max: 1 },
            { id: 'efficient_mining', name: 'Effektiv utvinning', desc: '+25% sjanse for dobbel malm per nivå', max: 3 },
        ],
    },
    {
        id: 'metallurg', name: 'Metallurg', color: '#ff7722',
        skills: [
            { id: 'fast_smelting', name: 'Rask smelting', desc: '−15% smelteenergi per nivå', max: 3 },
            { id: 'alloy_mastery', name: 'Legeringsmester', desc: '+20% sjanse for dobbel legering per nivå', max: 2 },
        ],
    },
    {
        id: 'kjemiker', name: 'Kjemiker', color: '#33dd88',
        skills: [
            { id: 'potent_chem', name: 'Potent kjemi', desc: '+30% sjanse for dobbelt molekyl per nivå', max: 2 },
            { id: 'careful_smelt', name: 'Nøyaktig prosess', desc: '+20% sjanse for dobbel smelteutbytte per nivå', max: 2 },
        ],
    },
];

const SKILLS2_BY_ID = {};
for (const path of SKILLS2) {
    for (const skill of path.skills) {
        SKILLS2_BY_ID[skill.id] = { ...skill, pathId: path.id, pathName: path.name, color: path.color };
    }
}
