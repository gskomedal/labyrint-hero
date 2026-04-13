// ─── Labyrint Hero – Global Leaderboard Worker ──────────────────────────────
// Cloudflare Worker + KV store for the global leaderboard.
//
// Setup:
//   1. Create a KV namespace called LEADERBOARD in your Cloudflare dashboard.
//   2. Bind it to this worker as the variable LEADERBOARD.
//   3. Deploy: wrangler deploy
//
// Endpoints:
//   POST /scores        – Submit a new score
//   GET  /scores        – Fetch top 100 (optional ?race=&difficulty= filters)
//   GET  /scores/count  – Total score count
//
// Anti-cheat: rejects obviously impossible scores.
// ─────────────────────────────────────────────────────────────────────────────

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

const MAX_SCORES = 500;       // total stored in KV
const MAX_RETURNED = 100;     // max returned per request
const KV_KEY = 'scores_v1';   // single KV key for the leaderboard

// ── Anti-cheat validation ────────────────────────────────────────────────────

function validateScore(entry) {
    if (!entry || typeof entry !== 'object') return 'Invalid payload';

    const { worldsCleared, level, monstersKilled, goldEarned, timeSeconds,
            mineralsCollected, elementsDiscovered } = entry;

    if (typeof worldsCleared !== 'number' || worldsCleared < 0 || worldsCleared > 100)
        return 'Invalid worldsCleared';
    if (typeof level !== 'number' || level < 1 || level > 200)
        return 'Invalid level';
    if (typeof monstersKilled !== 'number' || monstersKilled < 0 || monstersKilled > 10000)
        return 'Invalid monstersKilled';
    if (typeof goldEarned !== 'number' || goldEarned < 0 || goldEarned > 999999)
        return 'Invalid goldEarned';
    if (typeof timeSeconds !== 'number' || timeSeconds < 0 || timeSeconds > 360000)
        return 'Invalid timeSeconds';

    // Impossible: cleared many worlds at level 1
    if (worldsCleared >= 3 && level <= 1)
        return 'Impossible: high worlds at level 1';

    // Impossible: cleared worlds in zero time
    if (worldsCleared >= 1 && timeSeconds < 10)
        return 'Impossible: too fast';

    // Validate optional numeric fields
    if (mineralsCollected !== undefined && (typeof mineralsCollected !== 'number' || mineralsCollected < 0 || mineralsCollected > 50000))
        return 'Invalid mineralsCollected';
    if (elementsDiscovered !== undefined && (typeof elementsDiscovered !== 'number' || elementsDiscovered < 0 || elementsDiscovered > 120))
        return 'Invalid elementsDiscovered';

    // Validate string fields
    const validRaces = ['human', 'dwarf', 'elf', 'hobbit'];
    const validDiffs = ['easy', 'normal', 'hard'];
    if (entry.race && !validRaces.includes(entry.race)) return 'Invalid race';
    if (entry.difficulty && !validDiffs.includes(entry.difficulty)) return 'Invalid difficulty';

    // Hero name length check
    if (entry.heroName && (typeof entry.heroName !== 'string' || entry.heroName.length > 30))
        return 'Invalid heroName';

    // Only accept world completions, not deaths
    if (entry.result === 'death')
        return 'Deaths are not recorded on the global leaderboard';

    // Must have cleared at least 1 world
    if (worldsCleared < 1)
        return 'Must have cleared at least 1 world';

    return null; // valid
}

// ── Sanitize entry for storage ───────────────────────────────────────────────

function sanitizeEntry(entry) {
    return {
        heroName:           String(entry.heroName || 'Helt').slice(0, 30),
        race:               entry.race || 'human',
        difficulty:         entry.difficulty || 'normal',
        worldsCleared:      Math.floor(entry.worldsCleared || 0),
        level:              Math.floor(entry.level || 1),
        monstersKilled:     Math.floor(entry.monstersKilled || 0),
        goldEarned:         Math.floor(entry.goldEarned || 0),
        mineralsCollected:  Math.floor(entry.mineralsCollected || 0),
        elementsDiscovered: Math.floor(entry.elementsDiscovered || 0),
        timeSeconds:        Math.floor(entry.timeSeconds || 0),
        result:             'worldComplete',
        date:               entry.date || new Date().toISOString().slice(0, 10),
    };
}

// ── Sort: worldsCleared desc → level desc → monstersKilled desc ─────────────

function sortScores(scores) {
    scores.sort((a, b) =>
        (b.worldsCleared - a.worldsCleared) ||
        (b.level - a.level) ||
        (b.monstersKilled - a.monstersKilled)
    );
}

// ── Request handler ──────────────────────────────────────────────────────────

export default {
    async fetch(request, env) {
        // CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: CORS_HEADERS });
        }

        const url = new URL(request.url);
        const path = url.pathname;

        // POST /scores – submit a score
        if (request.method === 'POST' && path === '/scores') {
            let body;
            try {
                body = await request.json();
            } catch {
                return jsonResponse({ error: 'Invalid JSON' }, 400);
            }

            const err = validateScore(body);
            if (err) return jsonResponse({ error: err }, 422);

            const entry = sanitizeEntry(body);

            // Read current scores from KV
            let scores = [];
            try {
                const raw = await env.LEADERBOARD.get(KV_KEY);
                if (raw) scores = JSON.parse(raw);
            } catch { /* start fresh */ }

            scores.push(entry);
            sortScores(scores);
            scores = scores.slice(0, MAX_SCORES);

            await env.LEADERBOARD.put(KV_KEY, JSON.stringify(scores));

            return jsonResponse({ ok: true, rank: scores.indexOf(entry) + 1 }, 201);
        }

        // GET /scores – fetch top scores
        if (request.method === 'GET' && path === '/scores') {
            let scores = [];
            try {
                const raw = await env.LEADERBOARD.get(KV_KEY);
                if (raw) scores = JSON.parse(raw);
            } catch { /* empty */ }

            // Optional filters
            const raceFilter = url.searchParams.get('race');
            const diffFilter = url.searchParams.get('difficulty');

            if (raceFilter)  scores = scores.filter(s => s.race === raceFilter);
            if (diffFilter)  scores = scores.filter(s => s.difficulty === diffFilter);

            return jsonResponse(scores.slice(0, MAX_RETURNED));
        }

        // GET /scores/count
        if (request.method === 'GET' && path === '/scores/count') {
            let scores = [];
            try {
                const raw = await env.LEADERBOARD.get(KV_KEY);
                if (raw) scores = JSON.parse(raw);
            } catch { /* empty */ }
            return jsonResponse({ count: scores.length });
        }

        return jsonResponse({ error: 'Not found' }, 404);
    }
};

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
}
