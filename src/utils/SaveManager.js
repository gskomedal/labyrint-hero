// ─── Labyrint Hero – SaveManager ─────────────────────────────────────────────
// Thin wrapper around localStorage for persisting run state between sessions.

const SaveManager = {
    KEY: 'labyrint_hero_v1',

    save(worldNum, heroStats) {
        try {
            localStorage.setItem(this.KEY, JSON.stringify({ worldNum, heroStats, ts: Date.now() }));
        } catch (e) {
            console.warn('SaveManager: could not save', e);
        }
    },

    load() {
        try {
            const raw = localStorage.getItem(this.KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    },

    clear() {
        try { localStorage.removeItem(this.KEY); } catch (e) {}
    }
};
