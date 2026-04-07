// ─── Labyrint Hero – AudioManager (Web Audio API, no files needed) ───────────
//
//  Usage: Audio.init(); Audio.playAttack(); Audio.startMusic(worldNum);
//  Settings are persisted to localStorage.

const Audio = (function () {

    // ── State ────────────────────────────────────────────────────────────────
    let ctx         = null;
    let masterGain  = null;
    let musicGain   = null;
    let sfxGain     = null;
    let reverbNode  = null;

    let musicEnabled = true;
    let sfxEnabled   = true;
    let musicVol     = 0.35;
    let sfxVol       = 0.70;

    let _seqHandle   = null;  // setTimeout handle for sequencer
    let _seqStep     = 0;
    let _seqTheme    = -1;

    // ── Music themes (note sequences) ────────────────────────────────────────
    // Notes encoded as semitone offsets from root (root = 110 Hz / A2).
    // Each melody/counter is 64 notes (4 phrases of 16), bass is 32 notes,
    // chords have 8 progressions, perc has 16-step rhythm patterns.
    // -1 = rest/silence.
    const ROOT = 110;
    const _ = null; // shorthand for percussion rests
    const THEMES = [
        // 0 – Forest: Grieg's Morning Mood–inspired, ascending pentatonic
        //     Scale: A major pentatonic (0,2,4,7,9 + octaves)
        {
            name:   'Skog',
            bpm:    72,
            // Phrase A: gentle ascending arc | B: higher register exploration
            // A': return with varied ending | C: flowing development to resolve
            melody: [
                12, 14, 16, 19, 21, 19, 16, 14,  12, -1, 16, 19, 21, 24, 21, -1,     // A – original
                24, 26, 28, 26, 24, -1, 21, 19,  21, 24, 26, 28, 31, 28, 26, -1,     // B – high register
                12, 14, 16, 19, 21, 19, 16, 14,  16, 19, 21, 24, 26, 24, 21, -1,     // A' – varied ending
                19, 21, 24, 21, 19, 16, 14, -1,  16, 14, 12, -1, 14, 16, 14, -1,     // C – gentle descent
            ],
            bass: [
                0, -1, 0, 5,  7, -1, 5, 0,       // bars 1-2: tonic
                7, -1, 5, 4,  2, -1, 4, 5,       // bars 3-4: subdominant motion
                0, -1, 0, 5,  7, -1, 9, 7,       // bars 5-6: return with lift
                5, -1, 4, 2,  0, -1, 0, -1,      // bars 7-8: resolution
            ],
            counter: [
                24, -1, -1, -1, 28, -1, -1, -1,  26, -1, -1, -1, 24, -1, -1, -1,     // A – sparse high
                -1, -1, 31, -1, -1, -1, 28, -1,  -1, -1, 33, -1, -1, 31, -1, -1,     // B – answering
                24, -1, -1, -1, 28, -1, -1, -1,  26, -1, 28, -1, 26, 24, -1, -1,     // A' – more active
                -1, 28, -1, 26, -1, 24, -1, -1,  -1, -1, 21, -1, -1, -1, 24, -1,     // C – descending
            ],
            chord: [[0,4,7], [5,9,12], [7,11,14], [0,4,7], [2,7,9], [5,9,12], [4,7,12], [0,4,7]],
            perc: [
                {dur:0.06,vol:0.04,hp:100}, _, _, _,  {dur:0.03,vol:0.03,hp:3000}, _, _, _,
                _, _, {dur:0.03,vol:0.02,hp:3000}, _,  {dur:0.03,vol:0.03,hp:3000}, _, _, _,
            ],
            bassWave: 'triangle', melWave: 'triangle', counterWave: 'sine',
            melVol: 0.11, bassVol: 0.14, chordVol: 0.05, counterVol: 0.06,
        },
        // 1 – Cave: Mountain King–inspired, creeping Dorian
        //     Scale: A Dorian (0,2,3,5,7,9,10 + octaves)
        {
            name:   'Grotte',
            bpm:    62,
            melody: [
                12, -1, 14, 15, 17, -1, 15, 14,  12, -1, 10, 9, 10, 12, 14, -1,     // A – creeping ascent
                17, -1, 19, 20, 22, -1, 20, 19,  17, 15, 14, -1, 12, 14, 15, -1,     // B – higher, wider
                12, -1, 14, 15, 17, -1, 15, 14,  12, 10, 9, 7, 9, 10, 12, -1,       // A' – deeper descent
                14, 15, 17, 19, 17, 15, 14, 12,  10, -1, 9, 10, 12, -1, 14, -1,     // C – building run
            ],
            bass: [
                0, 0, 3, 0,  5, 3, 0, -2,        // bars 1-2: tonic Dorian
                5, 5, 7, 5,  3, 0, -2, 0,        // bars 3-4: rising to 5th
                0, 0, 3, 0,  5, 3, 0, -2,        // bars 5-6: return
                3, 5, 7, 5,  3, 2, 0, -1,        // bars 7-8: chromatic descent
            ],
            counter: [
                -1, 19, -1, -1, -1, 17, -1, -1,  -1, 15, -1, -1, -1, 14, -1, -1,     // A – ghostly echoes
                -1, -1, 22, -1, -1, -1, 20, -1,  -1, -1, 19, -1, -1, 17, -1, -1,     // B – higher echoes
                -1, 19, -1, -1, -1, 17, -1, -1,  -1, 15, -1, 14, -1, 12, -1, -1,     // A' – descending
                -1, -1, 22, -1, 24, -1, 22, -1,  -1, 19, -1, -1, -1, 17, -1, -1,     // C – building tension
            ],
            chord: [[0,3,7], [3,7,10], [5,8,12], [0,3,7], [0,3,6], [5,8,12], [3,7,10], [0,3,7]],
            perc: [
                _, _, _, {dur:0.04,vol:0.03,hp:1500},  _, _, _, _,
                _, _, {dur:0.04,vol:0.02,hp:1500}, _,  _, _, _, {dur:0.04,vol:0.03,hp:1500},
            ],
            bassWave: 'sawtooth', melWave: 'triangle', counterWave: 'sine',
            melVol: 0.09, bassVol: 0.16, chordVol: 0.04, counterVol: 0.05,
        },
        // 2 – Ice: Solveig's Song–inspired, sparse Aeolian
        //     Scale: A Aeolian (0,2,3,5,7,8,10 + octaves)
        {
            name:   'Is',
            bpm:    54,
            melody: [
                24, -1, 22, 19, 17, -1, 19, -1,  22, 24, 26, -1, 24, -1, 22, -1,     // A – sighing descent
                19, -1, -1, 17, 15, -1, -1, 17,  19, -1, 22, -1, -1, -1, 19, -1,     // B – sustained, low
                24, -1, 22, 19, 17, -1, 19, 22,  24, 26, 27, -1, 26, 24, 22, -1,     // A' – rising hope
                27, -1, 26, -1, 24, -1, 22, -1,  19, -1, 17, -1, 19, -1, -1, -1,     // C – slow descent
            ],
            bass: [
                0, -1, 7, -1,  5, -1, 3, -1,     // bars 1-2
                3, -1, 5, -1,  7, -1, 5, -1,     // bars 3-4: warmer
                0, -1, 7, -1,  5, -1, 3, -1,     // bars 5-6: return
                5, -1, 3, -1,  0, -1, -1, -1,    // bars 7-8: resolve
            ],
            counter: [
                -1, -1, -1, -1, 29, -1, -1, -1,  -1, -1, -1, -1, 31, -1, -1, -1,     // A – very sparse
                -1, -1, -1, -1, -1, -1, -1, -1,  -1, -1, -1, -1, 27, -1, -1, -1,     // B – almost silent
                -1, -1, -1, -1, 29, -1, -1, -1,  -1, -1, 31, -1, -1, -1, 29, -1,     // A' – slightly more
                -1, -1, 31, -1, -1, -1, 29, -1,  -1, -1, -1, -1, -1, -1, 27, -1,     // C – fading
            ],
            chord: [[0,3,7], [-1,-1,-1], [5,8,12], [3,7,10], [0,3,7], [-1,-1,-1], [7,10,14], [0,3,7]],
            perc: [
                _, _, _, _,  _, _, _, _,
                {dur:0.04,vol:0.015,hp:4000}, _, _, _,  _, _, _, _,
            ],
            bassWave: 'sine', melWave: 'triangle', counterWave: 'sine',
            melVol: 0.10, bassVol: 0.11, chordVol: 0.04, counterVol: 0.05,
        },
        // 3 – Volcanic: Phrygian storm, driving and intense
        //     Scale: A Phrygian-ish (0,1,3,5,7,8,10,11 + octaves)
        {
            name:   'Vulkan',
            bpm:    92,
            melody: [
                12, 11, 12, 15, 17, 15, 12, 11,  8, -1, 11, 12, 15, 17, 15, -1,     // A – relentless
                20, 19, 17, 15, 17, 19, 20, -1,  17, 15, 12, 11, 12, 15, 17, -1,     // B – high register
                12, 11, 12, 15, 17, 15, 12, 11,  8, 7, 5, 3, 5, 7, 8, -1,           // A' – deeper descent
                12, 15, 17, 20, 17, 15, 12, -1,  11, 12, 15, 12, 11, 8, 11, -1,     // C – angular leaps
            ],
            bass: [
                0, 0, -1, 0,  5, 3, 0, -1,       // bars 1-2: hammering tonic
                5, 5, -1, 5,  3, 1, 0, -1,       // bars 3-4: chromatic
                0, 0, -1, 0,  5, 3, 0, -1,       // bars 5-6: return
                3, 5, 7, 5,  3, 1, 0, -1,        // bars 7-8: building
            ],
            counter: [
                -1, -1, 24, -1, -1, -1, 23, -1,  -1, -1, 20, -1, -1, -1, 24, -1,     // A – stabs
                -1, -1, -1, 27, -1, -1, -1, 24,  -1, -1, -1, 23, -1, -1, -1, 20,     // B – syncopated
                -1, -1, 24, -1, -1, -1, 23, -1,  -1, -1, 20, -1, -1, 17, -1, -1,     // A' – lower stabs
                24, -1, -1, -1, 27, -1, -1, -1,  23, -1, 24, -1, 20, -1, 23, -1,     // C – active
            ],
            chord: [[0,3,7], [0,1,5], [-1,-1,-1], [5,8,12], [0,3,6], [1,5,8], [-1,-1,-1], [0,3,7]],
            perc: [
                {dur:0.07,vol:0.06,hp:80}, _, {dur:0.03,vol:0.04,hp:2500}, _,
                {dur:0.05,vol:0.05,hp:600}, _, {dur:0.03,vol:0.04,hp:2500}, _,
                {dur:0.07,vol:0.06,hp:80}, _, {dur:0.03,vol:0.04,hp:2500}, {dur:0.03,vol:0.03,hp:2500},
                {dur:0.05,vol:0.05,hp:600}, _, {dur:0.03,vol:0.04,hp:2500}, _,
            ],
            bassWave: 'sawtooth', melWave: 'square', counterWave: 'triangle',
            melVol: 0.07, bassVol: 0.19, chordVol: 0.05, counterVol: 0.04,
        },
        // 4 – Temple: Holberg Suite–inspired, stately Baroque
        //     Scale: A major / pentatonic (0,2,4,5,7,9,11 + octaves)
        {
            name:   'Tempel',
            bpm:    63,
            melody: [
                19, 17, 15, 12, 15, 17, 19, -1,  21, 19, 17, 15, 17, 19, 21, -1,     // A – descending scale
                24, 23, 21, 19, 21, 23, 24, -1,  26, 24, 23, 21, 23, 24, 26, -1,     // B – higher register
                19, 17, 15, 12, 15, 17, 19, -1,  21, 19, 17, 15, 14, 12, 14, -1,     // A' – deeper ending
                15, 17, 19, 21, 24, 21, 19, 17,  15, -1, 12, 14, 15, 17, 19, -1,     // C – sweeping run
            ],
            bass: [
                0, -1, 7, 5,  3, -1, 5, 0,       // bars 1-2: stately
                4, -1, 7, 5,  4, -1, 2, 0,       // bars 3-4: subdominant
                0, -1, 7, 5,  3, -1, 5, 0,       // bars 5-6: return
                5, -1, 4, 2,  0, -1, 7, 0,       // bars 7-8: resolution
            ],
            counter: [
                12, -1, -1, 7,  -1, -1, 12, -1,  14, -1, -1, 10, -1, -1, 14, -1,     // A – open fifths
                -1, -1, 16, -1, -1, -1, 19, -1,  -1, -1, 21, -1, -1, -1, 19, -1,     // B – ascending
                12, -1, -1, 7,  -1, -1, 12, -1,  14, -1, -1, 10, 9, 7, -1, -1,       // A' – closing
                -1, 12, -1, 14, -1, 16, -1, 14,  12, -1, -1, 9, -1, -1, 12, -1,     // C – scalar motion
            ],
            chord: [[0,4,7], [7,11,14], [5,9,12], [0,4,7], [4,7,11], [5,9,12], [2,5,9], [0,4,7]],
            perc: [
                {dur:0.05,vol:0.04,hp:120}, _, _, _,  {dur:0.04,vol:0.03,hp:2000}, _, _, _,
                {dur:0.05,vol:0.04,hp:120}, _, _, _,  {dur:0.04,vol:0.03,hp:2000}, _, _, _,
            ],
            bassWave: 'triangle', melWave: 'sine', counterWave: 'triangle',
            melVol: 0.10, bassVol: 0.13, chordVol: 0.045, counterVol: 0.06,
        },
        // 5 – Deep Magma: Hall of the Mountain King–inspired, dark and relentless
        //     Scale: A minor/diminished (0,2,3,5,6,7,8,10 + octaves)
        {
            name:   'Dyplag',
            bpm:    78,
            melody: [
                12, 14, 15, 17, 18, 17, 15, 14,  12, 10, 8, 7, 8, 10, 12, -1,       // A – chromatic creep
                15, 17, 18, 20, 22, 20, 18, 17,  15, 14, 12, 10, 12, 14, 15, -1,     // B – higher sequence
                12, 14, 15, 17, 18, 17, 15, 14,  12, 10, 8, 6, 5, 3, 5, -1,         // A' – deep descent
                8, 10, 12, 14, 15, 14, 12, -1,   10, 8, 7, 5, 7, 8, 10, -1,         // C – pedal tone motion
            ],
            bass: [
                0, 0, -1, 0,  -3, 0, -5, 0,      // bars 1-2: menacing pedal
                3, 3, -1, 3,  0, -3, -5, 0,      // bars 3-4: rising bass
                0, 0, -1, 0,  -3, 0, -5, 0,      // bars 5-6: return
                -5, -3, 0, 3,  5, 3, 0, -1,      // bars 7-8: ascending run
            ],
            counter: [
                -1, -1, -1, -1, 24, -1, -1, -1,  -1, -1, -1, -1, 20, -1, -1, -1,     // A – deep stabs
                -1, -1, 27, -1, -1, -1, -1, -1,  -1, -1, 24, -1, -1, -1, -1, -1,     // B – wider stabs
                -1, -1, -1, -1, 24, -1, -1, -1,  -1, -1, -1, -1, 18, -1, -1, -1,     // A' – tritone stab
                -1, 20, -1, -1, -1, 24, -1, -1,  -1, 18, -1, -1, -1, 22, -1, -1,     // C – call and answer
            ],
            chord: [[0,3,6], [0,3,7], [-1,-1,-1], [5,8,11], [0,3,6], [3,6,10], [-1,-1,-1], [0,3,7]],
            perc: [
                {dur:0.08,vol:0.06,hp:60}, _, {dur:0.04,vol:0.04,hp:2000}, _,
                {dur:0.06,vol:0.05,hp:400}, _, {dur:0.04,vol:0.04,hp:2000}, _,
                {dur:0.08,vol:0.06,hp:60}, _, {dur:0.04,vol:0.04,hp:2000}, _,
                {dur:0.06,vol:0.05,hp:400}, _, {dur:0.04,vol:0.04,hp:2000}, {dur:0.04,vol:0.03,hp:2000},
            ],
            bassWave: 'sawtooth', melWave: 'square', counterWave: 'sawtooth',
            melVol: 0.07, bassVol: 0.21, chordVol: 0.04, counterVol: 0.04,
        },
        // 6 – Underworld: Grieg's late Romantic, whole-tone with mournful melody
        //     Scale: Whole-tone (0,2,4,6,8,10 + octaves)
        {
            name:   'Underverden',
            bpm:    48,
            melody: [
                24, 22, -1, 20, 18, -1, 16, 18,  20, -1, 22, 24, -1, 26, 24, -1,     // A – drifting descent
                28, -1, 26, 24, 22, -1, 20, -1,  22, 24, 26, -1, 28, 30, 28, -1,     // B – high floating
                24, 22, -1, 20, 18, -1, 16, 14,  16, -1, 18, 20, -1, 22, 24, -1,     // A' – deeper then rise
                26, -1, 24, -1, 22, -1, 20, -1,  18, -1, 16, -1, 18, 20, 22, -1,     // C – stately descent
            ],
            bass: [
                0, -1, 2, -1,  4, -1, 6, -1,     // bars 1-2: whole-tone climb
                4, -1, 6, -1,  8, -1, 6, -1,     // bars 3-4: upper motion
                0, -1, 2, -1,  4, -1, 6, -1,     // bars 5-6: return
                6, -1, 4, -1,  2, -1, 0, -1,     // bars 7-8: descend home
            ],
            counter: [
                -1, -1, 12, -1, -1, -1, 10, -1,  -1, -1, 14, -1, -1, -1, 12, -1,     // A – eerie echoes
                -1, -1, -1, 16, -1, -1, -1, 14,  -1, -1, -1, 12, -1, -1, -1, 14,     // B – syncopated
                -1, -1, 12, -1, -1, -1, 10, -1,  -1, -1, 8, -1, -1, -1, 10, -1,     // A' – lower
                -1, 14, -1, -1, -1, 12, -1, -1,  -1, 10, -1, -1, -1, 12, -1, -1,     // C – answering
            ],
            chord: [[0,4,8], [-1,-1,-1], [2,6,10], [4,8,12], [6,10,14], [-1,-1,-1], [0,4,8], [2,6,10]],
            perc: [
                _, _, _, _,  _, _, {dur:0.05,vol:0.02,hp:3000}, _,
                _, _, _, _,  _, _, _, _,
            ],
            bassWave: 'sine', melWave: 'sine', counterWave: 'triangle',
            melVol: 0.09, bassVol: 0.14, chordVol: 0.055, counterVol: 0.05,
        },
        // 7 – Earth's Core: Triumphal March–inspired, Lydian fanfare
        //     Scale: A Lydian (0,2,4,6,7,9,11 + octaves)
        {
            name:   'Kjerne',
            bpm:    72,
            melody: [
                12, -1, 16, 18, 19, 21, 23, 24,  23, 21, 19, 18, 16, -1, 19, -1,     // A – fanfare ascent
                24, -1, 26, 28, 30, 31, 30, 28,  26, 24, 23, -1, 21, 24, 23, -1,     // B – heroic high
                12, -1, 16, 18, 19, 21, 23, 24,  26, 24, 23, 21, 19, -1, 16, -1,     // A' – extended descent
                19, 21, 23, 24, 26, 28, 26, 24,  23, 21, 19, 16, 18, 19, 21, -1,     // C – triumphant sweep
            ],
            bass: [
                0, 0, 7, 5,  4, 5, 7, 0,         // bars 1-2: march
                4, 4, 7, 5,  4, 2, 0, -1,        // bars 3-4: subdominant
                0, 0, 7, 5,  4, 5, 7, 0,         // bars 5-6: return
                7, 9, 7, 5,  4, 2, 0, -1,        // bars 7-8: heroic descent
            ],
            counter: [
                24, -1, -1, -1, 31, -1, 28, -1,  26, -1, -1, -1, 28, -1, -1, -1,     // A – fanfare answer
                -1, -1, 31, -1, -1, -1, 35, -1,  -1, -1, 33, -1, 31, -1, -1, -1,     // B – high flourish
                24, -1, -1, -1, 31, -1, 28, -1,  26, -1, 28, -1, 26, 24, -1, -1,     // A' – closing
                -1, 28, -1, 31, -1, 33, -1, 31,  28, -1, 26, -1, 24, -1, 28, -1,     // C – scalar answer
            ],
            chord: [[0,4,7], [0,4,7], [5,9,12], [7,11,14], [4,6,11], [0,4,7], [5,9,12], [7,11,14]],
            perc: [
                {dur:0.06,vol:0.05,hp:100}, _, {dur:0.04,vol:0.04,hp:1500}, _,
                {dur:0.05,vol:0.04,hp:800}, _, {dur:0.04,vol:0.04,hp:1500}, _,
                {dur:0.06,vol:0.05,hp:100}, _, {dur:0.04,vol:0.04,hp:1500}, _,
                {dur:0.05,vol:0.04,hp:800}, _, {dur:0.04,vol:0.04,hp:1500}, _,
            ],
            bassWave: 'sawtooth', melWave: 'triangle', counterWave: 'triangle',
            melVol: 0.11, bassVol: 0.17, chordVol: 0.06, counterVol: 0.06,
        },
    ];

    // ── Reverb impulse (simple convolver) ────────────────────────────────────
    function _buildReverb(decay = 1.8) {
        if (!ctx) return null;
        const rate    = ctx.sampleRate;
        const length  = Math.floor(rate * decay);
        const impulse = ctx.createBuffer(2, length, rate);
        for (let c = 0; c < 2; c++) {
            const ch = impulse.getChannelData(c);
            for (let i = 0; i < length; i++) {
                ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
            }
        }
        const conv = ctx.createConvolver();
        conv.buffer = impulse;
        return conv;
    }

    // ── Semitone to frequency ────────────────────────────────────────────────
    function _freq(semi) { return ROOT * Math.pow(2, semi / 12); }

    // ── Play a short note ────────────────────────────────────────────────────
    function _note(freq, dur, dest, type = 'sine', vol = 0.2, when = 0) {
        if (!ctx || freq <= 0) return;
        const now = ctx.currentTime + when;
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.type             = type;
        osc.frequency.value  = freq;
        env.gain.setValueAtTime(0,   now);
        env.gain.linearRampToValueAtTime(vol, now + 0.015);
        env.gain.setValueAtTime(vol, now + dur * 0.6);
        env.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        osc.connect(env);
        env.connect(dest);
        osc.start(now);
        osc.stop(now + dur + 0.05);
    }

    // ── Noise burst (for SFX) ────────────────────────────────────────────────
    function _noise(dur, dest, vol = 0.15, when = 0, hpFreq = 200) {
        if (!ctx) return;
        const now     = ctx.currentTime + when;
        const rate    = ctx.sampleRate;
        const buf     = ctx.createBuffer(1, Math.ceil(rate * dur), rate);
        const data    = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const hp  = ctx.createBiquadFilter();
        hp.type   = 'highpass';
        hp.frequency.value = hpFreq;
        const env = ctx.createGain();
        env.gain.setValueAtTime(vol, now);
        env.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        src.connect(hp);
        hp.connect(env);
        env.connect(dest);
        src.start(now);
        src.stop(now + dur + 0.05);
    }

    // ── Music sequencer ───────────────────────────────────────────────────────
    function _tick(theme, step) {
        if (!ctx || !musicEnabled) return;
        const now = ctx.currentTime;
        const beatMs = (60 / theme.bpm) * 250;  // 1/16 note in ms

        // Bass line (each beat = 4 steps, so 4 bass notes per bar)
        const bIdx    = Math.floor(step / 2) % theme.bass.length;
        const bassSem = theme.bass[bIdx];
        if (bassSem >= 0) {
            _note(_freq(bassSem - 12), 0.28, musicGain, theme.bassWave, theme.bassVol);
        }

        // Melody (runs at full 1/16 speed, with subtle velocity variation)
        const mIdx    = step % theme.melody.length;
        const melSem  = theme.melody[mIdx];
        if (melSem >= 0) {
            const dest = reverbNode ? reverbNode : musicGain;
            const vel  = theme.melVol * (0.85 + Math.random() * 0.30);
            _note(_freq(melSem), 0.22, dest, theme.melWave, vel);
        }

        // Counter-melody (runs at 1/16 speed, provides harmonic depth)
        if (theme.counter) {
            const ctrIdx = step % theme.counter.length;
            const ctrSem = theme.counter[ctrIdx];
            if (ctrSem >= 0) {
                const dest = reverbNode ? reverbNode : musicGain;
                const wave = theme.counterWave || 'sine';
                const vol  = (theme.counterVol || 0.05) * (0.85 + Math.random() * 0.30);
                _note(_freq(ctrSem), 0.30, dest, wave, vol);
            }
        }

        // Chord stabs on beat 1 & 3 of each bar
        if (step % 8 === 0 || step % 8 === 4) {
            const cIdx = Math.floor(step / 8) % theme.chord.length;
            for (const semi of theme.chord[cIdx]) {
                if (semi >= 0) {
                    _note(_freq(semi), 0.55, musicGain, 'sine', theme.chordVol);
                }
            }
        }

        // Percussion (noise-based rhythm, loops independently)
        if (theme.perc) {
            const pIdx = step % theme.perc.length;
            const p = theme.perc[pIdx];
            if (p) _noise(p.dur, musicGain, p.vol, 0, p.hp);
        }

        _seqStep    = (step + 1) % (theme.melody.length * 2);
        _seqHandle  = setTimeout(() => _tick(theme, _seqStep), beatMs);
    }

    // ── Public API ────────────────────────────────────────────────────────────
    return {

        /** Call once on first user gesture (browser AudioContext requirement) */
        init() {
            if (ctx) return;
            try {
                ctx = new (window.AudioContext || window.webkitAudioContext)();
                masterGain = ctx.createGain();
                masterGain.connect(ctx.destination);

                musicGain = ctx.createGain();
                musicGain.gain.value = musicVol;
                musicGain.connect(masterGain);

                sfxGain = ctx.createGain();
                sfxGain.gain.value = sfxVol;
                sfxGain.connect(masterGain);

                // Reverb (send into musicGain for wet mix)
                reverbNode = _buildReverb(2.0);
                if (reverbNode) {
                    const wetGain = ctx.createGain();
                    wetGain.gain.value = 0.28;
                    reverbNode.connect(wetGain);
                    wetGain.connect(musicGain);
                }

                this.loadSettings();
            } catch (e) {
                console.warn('[Audio] Web Audio not available:', e);
                ctx = null;
            }
        },

        /** Start themed background music for a given world number */
        startMusic(worldNum) {
            if (!ctx) return;
            // Map world number to music theme using same logic as visual themes
            let themeIdx;
            if (worldNum <= 7) {
                // Match visual theme mapping exactly
                themeIdx = Math.min(Math.floor((worldNum - 1) / 2), THEMES.length - 1);
            } else if (typeof getZone !== 'undefined') {
                const zone = getZone(worldNum);
                themeIdx = Math.min(zone.themeIdx, THEMES.length - 1);
            } else {
                themeIdx = THEMES.length - 1;
            }
            // Always restart music on new world (theme may be same but feels fresh)
            this.stopMusic();
            _seqTheme = themeIdx;
            _seqStep  = 0;
            if (musicEnabled) _tick(THEMES[themeIdx], 0);
        },

        /** Stop background music */
        stopMusic() {
            if (_seqHandle) { clearTimeout(_seqHandle); _seqHandle = null; }
            _seqTheme = -1;
        },

        /** Restart after settings change */
        _restartMusic() {
            const theme = _seqTheme;
            this.stopMusic();
            _seqTheme = theme;
            if (musicEnabled && ctx && theme >= 0) _tick(THEMES[theme], 0);
        },

        // ── SFX ─────────────────────────────────────────────────────────────

        /** Melee attack */
        playAttack() {
            if (!ctx || !sfxEnabled) return;
            _note(220, 0.06, sfxGain, 'sawtooth', 0.30);
            _note(165, 0.10, sfxGain, 'sawtooth', 0.18, 0.05);
        },

        /** Bow shot */
        playArrow() {
            if (!ctx || !sfxEnabled) return;
            _noise(0.12, sfxGain, 0.22, 0, 800);
            _note(880, 0.08, sfxGain, 'sine', 0.10);
        },

        /** Hero takes damage */
        playHurt() {
            if (!ctx || !sfxEnabled) return;
            _note(330, 0.12, sfxGain, 'square', 0.28);
            _note(220, 0.14, sfxGain, 'square', 0.22, 0.08);
        },

        /** Item pickup */
        playPickup() {
            if (!ctx || !sfxEnabled) return;
            _note(440, 0.08, sfxGain, 'sine', 0.20);
            _note(660, 0.08, sfxGain, 'sine', 0.18, 0.09);
        },

        /** Level up fanfare */
        playLevelUp() {
            if (!ctx || !sfxEnabled) return;
            const seq = [0, 4, 7, 12];
            seq.forEach((s, i) => _note(_freq(s + 12), 0.20, sfxGain, 'triangle', 0.28, i * 0.10));
        },

        /** Hero death */
        playDeath() {
            if (!ctx || !sfxEnabled) return;
            [12, 9, 7, 4, 0].forEach((s, i) =>
                _note(_freq(s), 0.25, sfxGain, 'sawtooth', 0.22, i * 0.14)
            );
        },

        /** Unlock/open door */
        playDoor() {
            if (!ctx || !sfxEnabled) return;
            _note(200, 0.18, sfxGain, 'triangle', 0.25);
            _note(260, 0.14, sfxGain, 'sine',     0.18, 0.12);
            _noise(0.08, sfxGain, 0.12, 0.06, 200);
        },

        /** Break cracked wall */
        playBreak() {
            if (!ctx || !sfxEnabled) return;
            _noise(0.22, sfxGain, 0.35, 0,    80);
            _noise(0.15, sfxGain, 0.20, 0.06, 30);
            _note(80, 0.18, sfxGain, 'sine', 0.25);
        },

        /** Step on exit portal */
        playExit() {
            if (!ctx || !sfxEnabled) return;
            [0, 7, 12, 19].forEach((s, i) =>
                _note(_freq(s + 12), 0.35, sfxGain, 'sine', 0.22, i * 0.07)
            );
        },

        /** Boss nearby sting */
        playBossStrike() {
            if (!ctx || !sfxEnabled) return;
            _note(55, 0.4, sfxGain, 'sawtooth', 0.35);
            _note(55 * 1.015, 0.4, sfxGain, 'sawtooth', 0.30); // slight detune
            _noise(0.12, sfxGain, 0.12, 0.1, 50);
        },

        // ── Settings ────────────────────────────────────────────────────────

        get musicEnabled() { return musicEnabled; },
        get sfxEnabled()   { return sfxEnabled; },
        get musicVol()     { return musicVol; },
        get sfxVol()       { return sfxVol; },

        setMusicEnabled(v) {
            musicEnabled = !!v;
            if (!musicEnabled) this.stopMusic();
            else if (_seqTheme >= 0) _tick(THEMES[_seqTheme], _seqStep);
            this.saveSettings();
        },

        setSfxEnabled(v) {
            sfxEnabled = !!v;
            this.saveSettings();
        },

        setMusicVol(v) {
            musicVol = Math.max(0, Math.min(1, v));
            if (musicGain) musicGain.gain.value = musicVol;
            this.saveSettings();
        },

        setSfxVol(v) {
            sfxVol = Math.max(0, Math.min(1, v));
            if (sfxGain) sfxGain.gain.value = sfxVol;
            this.saveSettings();
        },

        saveSettings() {
            try {
                localStorage.setItem('lh_audio', JSON.stringify(
                    { musicEnabled, sfxEnabled, musicVol, sfxVol }
                ));
            } catch (_) {}
        },

        loadSettings() {
            try {
                const s = JSON.parse(localStorage.getItem('lh_audio') || '{}');
                if (s.musicVol    !== undefined) this.setMusicVol(s.musicVol);
                if (s.sfxVol      !== undefined) this.setSfxVol(s.sfxVol);
                if (s.musicEnabled !== undefined) musicEnabled = s.musicEnabled;
                if (s.sfxEnabled   !== undefined) sfxEnabled   = s.sfxEnabled;
            } catch (_) {}
        },

        /** Resume AudioContext after browser suspend (e.g. tab switch) */
        resume() {
            if (ctx && ctx.state === 'suspended') ctx.resume();
        },
    };
})();
