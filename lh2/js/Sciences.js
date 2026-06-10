// ─── Labyrint Hero 2 – Science progression ───────────────────────────────────
// Per-science XP and levels for geologi/metallurgi/kjemi/fysikk, using the
// same XP curve as LH1 (100 * 1.55^(level-1)).
//
// XP sources in the prototype:
//   geologi    – mining minerals (10 × tier per unit)
//   metallurgi – smelting (15 × mineral tier)
//   kjemi      – crafting molecules at the lab table (20 × tier)
//   fysikk     – first-time element discoveries (5 × element tier)
//
// Level effects:
//   geologi    – identifies minerals with tier <= level; level 3+ highlights
//                nearby deposits ("Malmøye" translated to 3D)
//   metallurgi – smelt energy cost ×max(0.5, 1 − 0.05×(level−1))
//   kjemi      – unlocks molecule recipes with tier <= level
//   fysikk     – tracked/displayed; reserved for accelerator content later

class Sciences {
    constructor() {
        this.data = {};
        for (const s of LH2.SCIENCES) {
            this.data[s.id] = { level: 1, xp: 0 };
        }
    }

    xpToNext(level) {
        return Math.round(LH2.XP_BASE * Math.pow(LH2.XP_GROWTH, level - 1));
    }

    getLevel(id) { return this.data[id].level; }
    getXP(id) { return this.data[id].xp; }

    addXP(id, amount) {
        const sci = this.data[id];
        if (!sci || amount <= 0) return;
        sci.xp += Math.round(amount);
        let leveled = false;
        while (sci.xp >= this.xpToNext(sci.level)) {
            sci.xp -= this.xpToNext(sci.level);
            sci.level++;
            leveled = true;
            EventBus.emit('lh2ScienceLevelUp', { science: id, level: sci.level });
        }
        EventBus.emit('lh2ScienceXP', { science: id });
        return leveled;
    }

    // ── Level effects ────────────────────────────────────────────────────────

    /** True if the hero's geology knowledge identifies this mineral tier. */
    canIdentifyTier(tier) {
        return this.getLevel('geologi') >= tier;
    }

    /** Deposit highlight unlocks at geologi 3 ("Malmøye"). */
    hasOreHighlight() {
        return this.getLevel('geologi') >= 3;
    }

    /** Smelting energy multiplier from metallurgy level. */
    smeltEfficiency() {
        return Math.max(0.5, 1 - 0.05 * (this.getLevel('metallurgi') - 1));
    }

    /** Molecule recipes with tier <= kjemi level are craftable. */
    maxMoleculeTier() {
        return this.getLevel('kjemi');
    }

    // ── Serialization ────────────────────────────────────────────────────────

    serialize() {
        const out = {};
        for (const id in this.data) out[id] = { ...this.data[id] };
        return out;
    }

    static deserialize(data) {
        const sci = new Sciences();
        if (!data) return sci;
        for (const id in sci.data) {
            if (data[id]) sci.data[id] = { level: data[id].level || 1, xp: data[id].xp || 0 };
        }
        return sci;
    }
}
