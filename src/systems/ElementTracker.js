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
                if (typeof EventBus !== 'undefined') {
                    EventBus.emit('elementBonusComplete', bonus);
                }
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

    /**
     * Apply all completed bonus rewards to a hero.
     * Safe to call multiple times – idempotent via hero.appliedElementBonuses tracker.
     */
    applyBonusRewards(hero) {
        if (typeof ELEMENT_BONUSES === 'undefined') return;
        if (!hero.appliedElementBonuses) hero.appliedElementBonuses = {};
        for (const bonus of ELEMENT_BONUSES) {
            if (!this.completedBonuses[bonus.id]) continue;
            if (hero.appliedElementBonuses[bonus.id]) continue;
            hero.appliedElementBonuses[bonus.id] = true;
            const r = bonus.reward;
            if (r.maxHearts)        hero.maxHearts += r.maxHearts;
            if (r.goldMultiplier)   hero.elementGoldMul = (hero.elementGoldMul || 0) + r.goldMultiplier;
            if (r.poisonResist)     hero.elementPoisonResist = (hero.elementPoisonResist || 0) + r.poisonResist;
            if (r.chemEfficiency)   hero.smeltingEfficiency += r.chemEfficiency;
            if (r.xpMultiplier)     hero.xpMultiplier += r.xpMultiplier;
            if (r.armorStatBonus)   hero.elementArmorBonus = (hero.elementArmorBonus || 0) + r.armorStatBonus;
            if (r.alloyQualityBonus) hero.alloyMasteryBonus += r.alloyQualityBonus;
            if (r.potionStrengthMul) hero.potionPotencyBonus += (r.potionStrengthMul - 1.0);
            if (r.cosmicPower)      hero.cosmicPower = true;
            if (r.fusionUnlock)     hero.fusionUnlocked = true;
            if (r.fissionUpgrade)   hero.fissionUpgraded = true;
            if (r.merchantMinerals) hero.merchantMineralsUnlocked = true;
            if (r.magicAoe)         hero.magicAoeUnlocked = true;
            if (r.title)            hero.elementTitle = r.title;
            if (r.legendaryItem)    hero.legendaryItemEarned = true;
            if (r.godMode) {
                hero.godModeUnlocked = true;
                hero.attack += 10;
                hero.defense += 10;
                hero.maxHearts += 5;
                hero.hearts = Math.min(hero.hearts + 5, hero.maxHearts);
                hero.visionRadius += 3;
            }
        }
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
