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
    // Notes encoded as semitone offsets from root (root = 110 Hz / A2)
    const ROOT = 110;
    const THEMES = [
        // 0 – Forest: bright Dorian scale, light arpeggios
        {
            name:   'Skog',
            bpm:    76,
            bass:   [0, 0, 5, 0,  7, 0, 3, 0],
            melody: [12, -1, 15, 12, 17, 15, 19, -1,  12, -1, 14, -1, 12, 10, 12, -1],
            chord:  [[0,7,12], [0,7,12], [5,9,14], [7,12,17]],
            bassWave: 'triangle', melWave: 'triangle',
            melVol: 0.10, bassVol: 0.16, chordVol: 0.05,
        },
        // 1 – Cave: dark Aeolian, slow pulse
        {
            name:   'Grotte',
            bpm:    58,
            bass:   [0, 0, -2, 0,  3, 0, -2, 0],
            melody: [12, -1, -1, 11, 12, -1, -1, 9,  7, -1, -1, 8, 7, -1, 5, -1],
            chord:  [[0,3,7], [0,3,7], [5,8,12], [2,5,9]],
            bassWave: 'sawtooth', melWave: 'sine',
            melVol: 0.08, bassVol: 0.18, chordVol: 0.04,
        },
        // 2 – Ice: sparse high register, crystalline
        {
            name:   'Is',
            bpm:    52,
            bass:   [0, -1, 0, -1,  5, -1, 0, -1],
            melody: [24, -1, -1, -1, 27, -1, 24, -1,  29, -1, -1, -1, 24, -1, -1, -1],
            chord:  [[0,7,12], [-1,-1,-1], [5,9,14], [-1,-1,-1]],
            bassWave: 'sine', melWave: 'triangle',
            melVol: 0.09, bassVol: 0.12, chordVol: 0.04,
        },
        // 3 – Volcanic: pounding Phrygian, intense rhythm
        {
            name:   'Vulkan',
            bpm:    95,
            bass:   [0, 0, -1, 0,  0, 0, -1, 2],
            melody: [12, 11, 12, -1, 11, 9, -1, 7,  8, 7, -1, 5, 7, -1, 5, 3],
            chord:  [[0,3,7], [0,3,7], [-1,-1,-1], [5,8,12]],
            bassWave: 'sawtooth', melWave: 'square',
            melVol: 0.07, bassVol: 0.20, chordVol: 0.05,
        },
        // 4 – Temple: pentatonic, mysterious, slow
        {
            name:   'Tempel',
            bpm:    60,
            bass:   [0, -1, 5, -1,  7, -1, 0, -1],
            melody: [-1, 12, -1, 17, -1, 15, -1, 12,  -1, 19, -1, 17, -1, 15, -1, -1],
            chord:  [[0,7,12], [-1,-1,-1], [5,9,14], [7,12,17]],
            bassWave: 'triangle', melWave: 'sine',
            melVol: 0.09, bassVol: 0.14, chordVol: 0.045,
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

        // Melody (runs at full 1/16 speed)
        const mIdx    = step % theme.melody.length;
        const melSem  = theme.melody[mIdx];
        if (melSem >= 0) {
            const dest = reverbNode ? reverbNode : musicGain;
            _note(_freq(melSem), 0.22, dest, theme.melWave, theme.melVol);
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
            const themeIdx = Math.min(Math.floor((worldNum - 1) / 2), THEMES.length - 1);
            if (themeIdx === _seqTheme) return; // already playing
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
