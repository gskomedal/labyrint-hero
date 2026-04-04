// ─── Labyrint Hero – Element Tracker ──────────────────────────────────────────
// Tracks which elements the player has discovered and collected.
// Lives on hero as hero.elementTracker.

class ElementTracker {
    constructor() {
        this.discovered = {};  // { 'Fe': true, 'O': true, ... }
        this.collected  = {};  // { 'Fe': 5, 'Si': 12, ... } – pure element counts (Phase 2)
        this.completedBonuses = {}; // { 'iron_metals': true, ... }
    }

    // ── Discovery ────────────────────────────────────────────────────────────

    /** Mark an element as discovered. Returns true if it's a new discovery. */
    discover(symbol) {
        if (!ELEMENTS[symbol]) return false;
        if (this.discovered[symbol]) return false;
        this.discovered[symbol] = true;
        return true;
    }

    isDiscovered(symbol) {
        return !!this.discovered[symbol];
    }

    get discoveredCount() {
        return Object.keys(this.discovered).length;
    }

    // ── Collection (Phase 2: pure elements from smelting) ────────────────────

    collect(symbol, amount) {
        if (!ELEMENTS[symbol]) return;
        this.collected[symbol] = (this.collected[symbol] || 0) + amount;
    }

    getCount(symbol) {
        return this.collected[symbol] || 0;
    }

    // ── Bonus completions ────────────────────────────────────────────────────

    /**
     * Check for newly completed element bonuses.
     * Returns array of bonus objects that were just completed.
     */
    checkCompletions() {
        if (typeof ELEMENT_BONUSES === 'undefined') return [];
        const newlyCompleted = [];
        for (const bonus of ELEMENT_BONUSES) {
            if (this.completedBonuses[bonus.id]) continue;
            const allDiscovered = bonus.symbols.every(s => this.discovered[s]);
            if (allDiscovered) {
                this.completedBonuses[bonus.id] = true;
                newlyCompleted.push(bonus);
            }
        }
        return newlyCompleted;
    }

    isBonusCompleted(bonusId) {
        return !!this.completedBonuses[bonusId];
    }

    get completedBonusCount() {
        return Object.keys(this.completedBonuses).length;
    }

    // ── Serialization ────────────────────────────────────────────────────────

    serialize() {
        return {
            discovered: { ...this.discovered },
            collected:  { ...this.collected },
            completedBonuses: { ...this.completedBonuses },
        };
    }

    static deserialize(data) {
        const tracker = new ElementTracker();
        if (!data) return tracker;
        if (data.discovered) tracker.discovered = { ...data.discovered };
        if (data.collected)  tracker.collected  = { ...data.collected };
        if (data.completedBonuses) tracker.completedBonuses = { ...data.completedBonuses };
        return tracker;
    }
}
