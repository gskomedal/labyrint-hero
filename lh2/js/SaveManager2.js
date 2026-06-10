// ─── Labyrint Hero 2 – Save manager ──────────────────────────────────────────
// localStorage persistence under its own key (separate from LH1's
// labyrint_hero_v1). The world is deterministic (fixed seed), so only hero
// state and node depletion need saving.

const SaveManager2 = {
    save(hero, depletedNodes) {
        try {
            const payload = {
                version: 1,
                ts: Date.now(),
                hero: hero.serialize(),
                depletedNodes: depletedNodes || [],
            };
            localStorage.setItem(LH2.SAVE_KEY, JSON.stringify(payload));
            return true;
        } catch (e) {
            console.warn('LH2 save failed:', e);
            return false;
        }
    },

    load() {
        try {
            const raw = localStorage.getItem(LH2.SAVE_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) {
            console.warn('LH2 load failed:', e);
            return null;
        }
    },

    hasSave() {
        return !!localStorage.getItem(LH2.SAVE_KEY);
    },

    clear() {
        localStorage.removeItem(LH2.SAVE_KEY);
    },
};
