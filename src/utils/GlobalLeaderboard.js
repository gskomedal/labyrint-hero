// ─── Labyrint Hero – Global Leaderboard API Client ───────────────────────────
// Thin wrapper for the global leaderboard REST API.
// Fails silently on network errors – local leaderboard is the fallback.
//
// ┌──────────────────────────────────────────────────────────────────────────┐
// │  HOW TO ACTIVATE THE GLOBAL LEADERBOARD                                 │
// │                                                                          │
// │  1. cd backend/                                                          │
// │  2. npm install -g wrangler                                              │
// │  3. wrangler login                                                       │
// │  4. wrangler kv namespace create LEADERBOARD                             │
// │  5. Copy the namespace ID into backend/wrangler.toml                     │
// │  6. wrangler deploy                                                      │
// │  7. Set the API_URL below to your deployed worker URL                    │
// │                                                                          │
// │  See backend/README.md for full details.                                 │
// └──────────────────────────────────────────────────────────────────────────┘

const GlobalLeaderboard = {
    // ⬇ CHANGE THIS to your deployed Cloudflare Worker URL ⬇
    API_URL: 'https://labyrint-hero-leaderboard.workers.dev',

    /**
     * Submit a score to the global leaderboard (fire-and-forget).
     * @param {Object} entry - Leaderboard entry (same shape as local entries)
     */
    submitScore(entry) {
        const payload = {
            heroName:           entry.heroName || 'Helt',
            race:               entry.race || 'human',
            difficulty:         entry.difficulty || 'normal',
            worldsCleared:      entry.worldsCleared || 0,
            level:              entry.level || 1,
            monstersKilled:     entry.monstersKilled || 0,
            goldEarned:         entry.goldEarned || 0,
            mineralsCollected:  entry.mineralsCollected || 0,
            elementsDiscovered: entry.elementsDiscovered || 0,
            timeSeconds:        entry.timeSeconds || 0,
            result:             entry.result || 'worldComplete',
            date:               new Date().toISOString().slice(0, 10)
        };

        fetch(`${this.API_URL}/scores`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(() => {
            // Silent failure – local leaderboard still works
        });
    },

    /**
     * Fetch global top scores.
     * @param {Object} filters - Optional { race, difficulty }
     * @returns {Promise<Array>} Top 100 scores, or empty array on failure
     */
    async fetchScores(filters = {}) {
        const params = new URLSearchParams();
        if (filters.race)       params.set('race', filters.race);
        if (filters.difficulty)  params.set('difficulty', filters.difficulty);

        const qs = params.toString();
        const url = `${this.API_URL}/scores${qs ? '?' + qs : ''}`;

        try {
            const res = await fetch(url);
            if (!res.ok) return [];
            const data = await res.json();
            return Array.isArray(data) ? data : (data.scores || []);
        } catch (e) {
            return [];
        }
    }
};
