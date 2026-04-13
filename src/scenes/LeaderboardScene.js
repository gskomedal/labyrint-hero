// ─── Labyrint Hero – LeaderboardScene ─────────────────────────────────────────
// Displays high scores with Local/Global tabs, race/difficulty filters,
// and columns for minerals collected and elements discovered (#64).

class LeaderboardScene extends Phaser.Scene {
    constructor() { super({ key: 'LeaderboardScene' }); }

    init(data) {
        this._filterRace = (data && data.filterRace) || null;
        this._filterDiff = (data && data.filterDiff) || null;
        this._tab = (data && data.tab) || 'local'; // 'local' | 'global'
        this._globalScores = null;  // null = not fetched, [] = fetched empty
        this._globalError = false;
    }

    create() {
        const { width: W, height: H } = this.cameras.main;
        const cx = W / 2, cy = H / 2;

        this._dyn = [];

        // Background
        this.add.rectangle(cx, cy, W, H, 0x08060f);

        // Title
        this.add.text(cx, 30, 'LEDERTAVLE', {
            fontSize: '28px', color: '#f5e642', fontFamily: 'monospace',
            fontStyle: 'bold', stroke: '#7a6a00', strokeThickness: 3
        }).setOrigin(0.5);

        this.add.rectangle(cx, 52, 400, 1, 0x333355);

        // Tab buttons (Local / Global)
        this._buildTabs(cx, 60);

        // Filter buttons
        this._buildFilters(cx, 80);

        // Scroll area
        this._listY = 100;
        this._scrollOffset = 0;
        this._refreshList();

        // Fetch global scores if on global tab
        if (this._tab === 'global') {
            this._fetchGlobal();
        }

        // Mouse wheel scrolling
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
            const maxScroll = Math.max(0, (this._totalRows - 12) * 20);
            this._scrollOffset = Phaser.Math.Clamp(this._scrollOffset + deltaY * 0.5, 0, maxScroll);
            this._refreshList();
        });

        // Close button (top-right)
        const closeBtn = this.add.text(W - 30, 30, '\u2715', {
            fontSize: '20px', color: '#667788', fontFamily: 'monospace'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        closeBtn.on('pointerover', () => closeBtn.setColor('#ff6666'));
        closeBtn.on('pointerout',  () => closeBtn.setColor('#667788'));
        closeBtn.on('pointerdown', () => this.scene.start('MenuScene'));

        // ESC keyboard shortcut
        this.input.keyboard.on('keydown-ESC', () => this.scene.start('MenuScene'));

        // Back button
        const back = this.add.text(cx, H - 30, '[ TILBAKE ]', {
            fontSize: '18px', color: '#666688', fontFamily: 'monospace'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        back.on('pointerover', () => back.setAlpha(0.7));
        back.on('pointerout',  () => back.setAlpha(1));
        back.on('pointerdown', () => this.scene.start('MenuScene'));
    }

    // ── Tab toggle ──────────────────────────────────────────────────────────

    _buildTabs(cx, y) {
        const tabs = [
            { id: 'local',  label: 'Lokal' },
            { id: 'global', label: 'Global' },
        ];
        let tx = cx - 60;
        for (const tab of tabs) {
            const isActive = this._tab === tab.id;
            const btn = this.add.text(tx, y, `[${tab.label}]`, {
                fontSize: '14px',
                color: isActive ? '#f5e642' : '#556677',
                fontFamily: 'monospace',
                fontStyle: isActive ? 'bold' : 'normal'
            }).setInteractive({ useHandCursor: true });
            btn.on('pointerdown', () => {
                if (this._tab !== tab.id) {
                    this.scene.restart({
                        filterRace: this._filterRace,
                        filterDiff: this._filterDiff,
                        tab: tab.id
                    });
                }
            });
            tx += btn.width + 16;
        }
    }

    // ── Filter buttons ──────────────────────────────────────────────────────

    _buildFilters(cx, y) {
        const RACES = [
            { id: null, label: 'Alle' },
            { id: 'human', label: 'Menneske' },
            { id: 'dwarf', label: 'Dverg' },
            { id: 'elf', label: 'Alv' },
            { id: 'hobbit', label: 'Hobbit' },
        ];
        const DIFFS = [
            { id: null, label: 'Alle' },
            { id: 'easy', label: 'Lett' },
            { id: 'normal', label: 'Normal' },
            { id: 'hard', label: 'Vanskelig' },
        ];

        const ts = { fontSize: '11px', color: '#556677', fontFamily: 'monospace' };
        this.add.text(cx - 220, y, 'Rase:', ts);

        let rx = cx - 185;
        for (const r of RACES) {
            const btn = this.add.text(rx, y, `[${r.label}]`, {
                fontSize: '11px', color: this._filterRace === r.id ? '#f5e642' : '#667788',
                fontFamily: 'monospace'
            }).setInteractive({ useHandCursor: true });
            btn.on('pointerdown', () => {
                this._filterRace = r.id;
                this.scene.restart({
                    filterRace: this._filterRace,
                    filterDiff: this._filterDiff,
                    tab: this._tab
                });
            });
            rx += btn.width + 6;
        }

        this.add.text(cx + 40, y, 'Diff:', ts);
        let dx = cx + 70;
        for (const d of DIFFS) {
            const btn = this.add.text(dx, y, `[${d.label}]`, {
                fontSize: '11px', color: this._filterDiff === d.id ? '#f5e642' : '#667788',
                fontFamily: 'monospace'
            }).setInteractive({ useHandCursor: true });
            btn.on('pointerdown', () => {
                this._filterDiff = d.id;
                this.scene.restart({
                    filterRace: this._filterRace,
                    filterDiff: this._filterDiff,
                    tab: this._tab
                });
            });
            dx += btn.width + 6;
        }
    }

    // ── Global score fetching ───────────────────────────────────────────────

    _fetchGlobal() {
        if (typeof GlobalLeaderboard === 'undefined') {
            this._globalError = true;
            this._refreshList();
            return;
        }
        GlobalLeaderboard.fetchScores({
            race: this._filterRace,
            difficulty: this._filterDiff
        }).then(scores => {
            this._globalScores = scores;
            this._globalError = false;
            this._scrollOffset = 0;
            this._refreshList();
        }).catch(() => {
            this._globalScores = [];
            this._globalError = true;
            this._refreshList();
        });
    }

    // ── Score table rendering ───────────────────────────────────────────────

    _refreshList() {
        for (const o of this._dyn) { if (o && o.destroy) o.destroy(); }
        this._dyn = [];

        if (this._tab === 'global') {
            this._renderGlobalList();
        } else {
            this._renderLocalList();
        }
    }

    _renderLocalList() {
        const scores = Leaderboard.getFiltered(this._filterRace, this._filterDiff);
        this._renderScoreTable(scores);
    }

    _renderGlobalList() {
        if (this._globalScores === null) {
            // Still loading
            const { width: W } = this.cameras.main;
            this._dyn.push(this.add.text(W / 2, this._listY + 60, 'Henter globale resultater...', {
                fontSize: '14px', color: '#556677', fontFamily: 'monospace', align: 'center'
            }).setOrigin(0.5));
            this._totalRows = 0;
            return;
        }

        if (this._globalError && this._globalScores.length === 0) {
            const { width: W } = this.cameras.main;
            this._dyn.push(this.add.text(W / 2, this._listY + 60,
                'Kunne ikke hente globale resultater.\nSjekk internettforbindelsen.', {
                fontSize: '14px', color: '#664444', fontFamily: 'monospace', align: 'center'
            }).setOrigin(0.5));
            this._totalRows = 0;
            return;
        }

        this._renderScoreTable(this._globalScores);
    }

    _renderScoreTable(scores) {
        const { width: W, height: H } = this.cameras.main;
        const cx = W / 2;
        const y0 = this._listY;

        if (scores.length === 0) {
            this._dyn.push(this.add.text(cx, y0 + 60, 'Ingen resultater enn\u00e5.\nSpill et eventyr for \u00e5 komme p\u00e5 tavlen!', {
                fontSize: '14px', color: '#445566', fontFamily: 'monospace', align: 'center'
            }).setOrigin(0.5));
            this._totalRows = 0;
            return;
        }

        // Header – 10 columns: #, Navn, Rase, Verden, Nivå, Drap, Gull, Min, Elem, Tid
        const hdrStyle = { fontSize: '11px', color: '#556677', fontFamily: 'monospace' };
        const cols = [
            cx - 235,  // #
            cx - 185,  // Navn
            cx - 115,  // Rase
            cx - 55,   // Verden
            cx - 15,   // Nivå
            cx + 25,   // Drap
            cx + 65,   // Gull
            cx + 105,  // Min (minerals)
            cx + 140,  // Elem (elements)
            cx + 180,  // Tid
        ];
        const headers = ['#', 'Navn', 'Rase', 'Vrdn', 'Niv\u00e5', 'Drap', 'Gull', 'Min', 'Elem', 'Tid'];
        headers.forEach((h, i) => {
            this._dyn.push(this.add.text(cols[i], y0, h, hdrStyle));
        });
        this._dyn.push(this.add.rectangle(cx, y0 + 14, W - 40, 1, 0x223344));

        const RACE_NAMES = { human: 'Mns', dwarf: 'Dvr', elf: 'Alv', hobbit: 'Hbt' };
        const rowH = 20;
        this._totalRows = scores.length;

        for (let i = 0; i < scores.length; i++) {
            const s = scores[i];
            const ry = y0 + 20 + i * rowH - (this._scrollOffset || 0);
            if (ry < y0 + 10 || ry > H - 50) continue; // clip rows outside visible area
            const isTop3 = i < 3;
            const col = isTop3 ? ['#f5e642', '#cccccc', '#cc8844'][i] : '#667788';
            const style = { fontSize: '12px', color: col, fontFamily: 'monospace' };

            const medal = i === 0 ? '1.' : i === 1 ? '2.' : i === 2 ? '3.' : `${i + 1}.`;
            this._dyn.push(this.add.text(cols[0], ry, medal, style));
            this._dyn.push(this.add.text(cols[1], ry, (s.heroName || 'Helt').slice(0, 8), style));
            this._dyn.push(this.add.text(cols[2], ry, RACE_NAMES[s.race] || s.race, style));
            this._dyn.push(this.add.text(cols[3], ry, `${s.worldsCleared}`, style));
            this._dyn.push(this.add.text(cols[4], ry, `${s.level}`, style));
            this._dyn.push(this.add.text(cols[5], ry, `${s.monstersKilled}`, style));
            this._dyn.push(this.add.text(cols[6], ry, `${s.goldEarned}`, style));
            this._dyn.push(this.add.text(cols[7], ry, `${s.mineralsCollected || 0}`, style));
            this._dyn.push(this.add.text(cols[8], ry, `${s.elementsDiscovered || 0}`, style));

            // Time column (mm:ss)
            const t = s.timeSeconds || 0;
            const tStr = `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
            this._dyn.push(this.add.text(cols[9], ry, tStr, style));

            // Result indicator
            const resCol = s.result === 'death' ? '#ff4444' : '#44ee66';
            const resIcon = s.result === 'death' ? '\u2620' : '\u2713';
            this._dyn.push(this.add.text(cols[9] + 40, ry, resIcon, { ...style, color: resCol }));
        }
    }
}
