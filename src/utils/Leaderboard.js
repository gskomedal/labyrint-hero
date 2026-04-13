// ─── Labyrint Hero – Leaderboard ─────────────────────────────────────────────
// Persistent high-score tracking via localStorage.

const Leaderboard = {
    KEY: 'labyrint_hero_leaderboard',
    MAX_ENTRIES: 50,

    /** Record a completed run (death or world-complete). */
    record(entry) {
        const scores = this.getAll();
        scores.push({
            heroName:       entry.heroName || 'Helt',
            race:           entry.race || 'human',
            difficulty:     entry.difficulty || 'normal',
            worldsCleared:  entry.worldsCleared || 0,
            level:          entry.level || 1,
            monstersKilled: entry.monstersKilled || 0,
            goldEarned:         entry.goldEarned || 0,
            mineralsCollected:  entry.mineralsCollected || 0,
            elementsDiscovered: entry.elementsDiscovered || 0,
            timeSeconds:        entry.timeSeconds || 0,
            result:             entry.result || 'death',
            date:               new Date().toISOString().slice(0, 10)
        });
        // Sort by worlds cleared (desc), then level (desc), then monsters killed (desc)
        scores.sort((a, b) =>
            (b.worldsCleared - a.worldsCleared) ||
            (b.level - a.level) ||
            (b.monstersKilled - a.monstersKilled)
        );
        // Keep only top entries
        const trimmed = scores.slice(0, this.MAX_ENTRIES);
        try {
            localStorage.setItem(this.KEY, JSON.stringify(trimmed));
        } catch (e) {
            console.warn('Leaderboard: could not save', e);
        }
    },

    /** Get all scores (sorted). */
    getAll() {
        try {
            const raw = localStorage.getItem(this.KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    },

    /** Get filtered scores. */
    getFiltered(race = null, difficulty = null) {
        return this.getAll().filter(s =>
            (!race || s.race === race) &&
            (!difficulty || s.difficulty === difficulty)
        );
    },

    clear() {
        try { localStorage.removeItem(this.KEY); } catch (e) {}
    }
};
