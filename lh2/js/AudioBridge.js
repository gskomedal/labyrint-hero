// ─── Labyrint Hero 2 – Audio bridge ──────────────────────────────────────────
// Drives LH1's procedural AudioManager (Grieg-inspired music + SFX) from LH2.
// Browsers block audio until a user gesture, so the context is initialised on
// the first click/keypress, then music follows the active area's zone theme.

const LH2Audio = {
    _started: false,
    _currentArea: null,

    // LH2 area → representative worldNum (drives Audio.startMusic → getZone)
    AREA_WORLD: { surface: 1, cave_2: 4, cave_3: 8, cave_4: 13, cave_5: 19 },

    init() {
        if (typeof Audio === 'undefined' || !Audio.init) return;
        // Resume/create the audio context on the first gesture
        const kick = () => {
            Audio.init();
            this._started = true;
            if (this._currentArea) this.playForArea(this._currentArea);
            window.removeEventListener('pointerdown', kick);
            window.removeEventListener('keydown', kick);
        };
        window.addEventListener('pointerdown', kick);
        window.addEventListener('keydown', kick);

        // Toggle music with P (LH1's AudioManager persists the setting)
        window.addEventListener('keydown', (e) => {
            if (e.code !== 'KeyP' || LH2Main.uiOpen) return;
            const on = !Audio.musicEnabled;
            Audio.setMusicEnabled(on);
            if (on && this._currentArea) this.playForArea(this._currentArea);
            EventBus.emit('lh2Toast', { text: on ? '♪ Musikk på' : '♪ Musikk av' });
        });
    },

    /** Switch the background theme to match a LH2 area. */
    playForArea(areaId) {
        this._currentArea = areaId;
        if (!this._started || typeof Audio === 'undefined') return;
        const worldNum = this.AREA_WORLD[areaId] || 1;
        Audio.startMusic(worldNum);
    },

    /** Short SFX helpers (no-ops if the method is missing). */
    sfx(name) {
        if (typeof Audio === 'undefined' || !Audio[name]) return;
        try { Audio[name](); } catch (_) {}
    },
};
