// ─── Labyrint Hero – AudioManager (Web Audio API, no files needed) ───────────
//
//  Usage: Audio.init(); Audio.playAttack(); Audio.startMusic(worldNum);
//  Settings are persisted to localStorage.
//  Music data loaded from src/data/musicPieces.js (MUSIC_PIECES, MUSIC_NF).

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

    // Multi-voice sequencer state
    let _seqHandle   = null;   // scheduling pump timeout handle
    let _seqPieceIdx = -1;     // current piece index
    let _voiceStates = [];     // per-voice { noteIdx, nextTime }
    let _activeOscs  = [];     // tracked oscillators for clean stop

    const SCHEDULE_AHEAD = 0.25;  // seconds to look ahead
    const PUMP_INTERVAL  = 80;    // ms between scheduler pumps

    // ── SFX helpers ──────────────────────────────────────────────────────────
    const ROOT = 110;
    function _freq(semi) { return ROOT * Math.pow(2, semi / 12); }

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

    // ── Play a short note ────────────────────────────────────────────────────
    function _note(freq, dur, dest, type = 'sine', vol = 0.2, when = 0) {
        if (!ctx || freq <= 0) return null;
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
        return osc;
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

    // ── Multi-voice music sequencer (look-ahead scheduling) ──────────────────
    function _schedulePump() {
        if (!ctx || !musicEnabled || _seqPieceIdx < 0) return;

        const piece   = MUSIC_PIECES[_seqPieceIdx];
        if (!piece) return;
        const beatDur = 60 / piece.bpm;
        const now     = ctx.currentTime;
        const horizon = now + SCHEDULE_AHEAD;

        for (let v = 0; v < piece.voices.length; v++) {
            const voice = piece.voices[v];
            const state = _voiceStates[v];
            if (!state) continue;

            while (state.nextTime < horizon) {
                const noteObj = voice.notes[state.noteIdx];
                const noteDur = noteObj.d * beatDur;

                if (noteObj.n !== 'R') {
                    const freq = MUSIC_NF[noteObj.n];
                    if (freq) {
                        // First voice gets reverb, others go direct
                        const dest = (v === 0 && reverbNode) ? reverbNode : musicGain;
                        const when = Math.max(0, state.nextTime - now);
                        const vel  = voice.vol * 0.12 * (0.88 + Math.random() * 0.24);
                        const osc  = _note(freq, noteDur * 0.9, dest, voice.wave, vel, when);
                        if (osc) {
                            _activeOscs.push(osc);
                            osc.onended = function() {
                                const idx = _activeOscs.indexOf(osc);
                                if (idx >= 0) _activeOscs.splice(idx, 1);
                            };
                        }
                    }
                }

                state.nextTime += noteDur;
                state.noteIdx  = (state.noteIdx + 1) % voice.notes.length;
            }
        }

        _seqHandle = setTimeout(_schedulePump, PUMP_INTERVAL);
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
            // Map world number to music piece using same logic as visual themes
            let themeIdx;
            if (worldNum <= 7) {
                themeIdx = Math.min(Math.floor((worldNum - 1) / 2), MUSIC_PIECES.length - 1);
            } else if (typeof getZone !== 'undefined') {
                const zone = getZone(worldNum);
                themeIdx = Math.min(zone.themeIdx, MUSIC_PIECES.length - 1);
            } else {
                themeIdx = MUSIC_PIECES.length - 1;
            }
            // Always restart music on new world
            this.stopMusic();
            _seqPieceIdx = themeIdx;
            if (musicEnabled) {
                const startTime = ctx.currentTime + 0.05;
                const piece = MUSIC_PIECES[themeIdx];
                _voiceStates = piece.voices.map(() => ({
                    noteIdx: 0,
                    nextTime: startTime
                }));
                _schedulePump();
            }
        },

        /** Stop background music */
        stopMusic() {
            if (_seqHandle) { clearTimeout(_seqHandle); _seqHandle = null; }
            // Stop any currently playing music notes
            _activeOscs.forEach(osc => { try { osc.stop(); } catch(_) {} });
            _activeOscs = [];
            _voiceStates = [];
            _seqPieceIdx = -1;
        },

        /** Restart after settings change */
        _restartMusic() {
            const pieceIdx = _seqPieceIdx;
            this.stopMusic();
            _seqPieceIdx = pieceIdx;
            if (musicEnabled && ctx && pieceIdx >= 0) {
                const startTime = ctx.currentTime + 0.05;
                const piece = MUSIC_PIECES[pieceIdx];
                _voiceStates = piece.voices.map(() => ({
                    noteIdx: 0,
                    nextTime: startTime
                }));
                _schedulePump();
            }
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
            else if (_seqPieceIdx >= 0) {
                const startTime = ctx.currentTime + 0.05;
                const piece = MUSIC_PIECES[_seqPieceIdx];
                _voiceStates = piece.voices.map(() => ({
                    noteIdx: 0,
                    nextTime: startTime
                }));
                _schedulePump();
            }
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
