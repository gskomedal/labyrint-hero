// ─── Labyrint Hero – SaveManager ─────────────────────────────────────────────
// Thin wrapper around localStorage for persisting run state between sessions.

const SaveManager = {
    KEY: 'labyrint_hero_v1',
    INTRO_KEY: 'labyrint_hero_intro_seen',

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
    },

    hasSeenIntro() {
        try { return localStorage.getItem(this.INTRO_KEY) === '1'; } catch (e) { return false; }
    },

    markIntroSeen() {
        try { localStorage.setItem(this.INTRO_KEY, '1'); } catch (e) {}
    }
};
