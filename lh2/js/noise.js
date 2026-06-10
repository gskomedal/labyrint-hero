// ─── Labyrint Hero 2 – Seeded 2D simplex noise ───────────────────────────────
// Self-contained implementation (Gustavson-style), no dependencies.
// makeNoise2D(seed) -> noise(x, y) in [-1, 1].

function makeNoise2D(seed) {
    // Mulberry32 PRNG for a seeded permutation table
    let s = seed >>> 0;
    const rand = () => {
        s |= 0; s = (s + 0x6D2B79F5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    const perm = new Uint8Array(512);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [p[i], p[j]] = [p[j], p[i]];
    }
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];

    const grad2 = [
        [1, 1], [-1, 1], [1, -1], [-1, -1],
        [1, 0], [-1, 0], [0, 1], [0, -1],
    ];

    const F2 = 0.5 * (Math.sqrt(3) - 1);
    const G2 = (3 - Math.sqrt(3)) / 6;

    return function noise2D(xin, yin) {
        const sFac = (xin + yin) * F2;
        const i = Math.floor(xin + sFac);
        const j = Math.floor(yin + sFac);
        const t = (i + j) * G2;
        const x0 = xin - (i - t);
        const y0 = yin - (j - t);

        const i1 = x0 > y0 ? 1 : 0;
        const j1 = x0 > y0 ? 0 : 1;

        const x1 = x0 - i1 + G2;
        const y1 = y0 - j1 + G2;
        const x2 = x0 - 1 + 2 * G2;
        const y2 = y0 - 1 + 2 * G2;

        const ii = i & 255;
        const jj = j & 255;

        let n = 0;

        let t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 > 0) {
            const g = grad2[perm[ii + perm[jj]] % 8];
            t0 *= t0;
            n += t0 * t0 * (g[0] * x0 + g[1] * y0);
        }
        let t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 > 0) {
            const g = grad2[perm[ii + i1 + perm[jj + j1]] % 8];
            t1 *= t1;
            n += t1 * t1 * (g[0] * x1 + g[1] * y1);
        }
        let t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 > 0) {
            const g = grad2[perm[ii + 1 + perm[jj + 1]] % 8];
            t2 *= t2;
            n += t2 * t2 * (g[0] * x2 + g[1] * y2);
        }

        return 70 * n; // scale to roughly [-1, 1]
    };
}

/** Fractal Brownian motion over a noise function. Returns roughly [-1, 1]. */
function fbm2(noise, x, y, octaves = 4, lacunarity = 2.0, gain = 0.5) {
    let amp = 1, freq = 1, sum = 0, norm = 0;
    for (let o = 0; o < octaves; o++) {
        sum += amp * noise(x * freq, y * freq);
        norm += amp;
        amp *= gain;
        freq *= lacunarity;
    }
    return sum / norm;
}
