// ─── Labyrint Hero – LeaderboardScene ─────────────────────────────────────────
// Displays high scores with optional race/difficulty filters.

class LeaderboardScene extends Phaser.Scene {
    constructor() { super({ key: 'LeaderboardScene' }); }

    init(data) {
        this._filterRace = (data && data.filterRace) || null;
        this._filterDiff = (data && data.filterDiff) || null;
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

        // Filter buttons
        this._buildFilters(cx, 70);

        // Scroll area
        this._listY = 110;
        this._scrollOffset = 0;
        this._refreshList();

        // Mouse wheel scrolling
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
            const maxScroll = Math.max(0, (this._totalRows - 12) * 20);
            this._scrollOffset = Phaser.Math.Clamp(this._scrollOffset + deltaY * 0.5, 0, maxScroll);
            this._refreshList();
        });

        // Close button (top-right)
        const closeBtn = this.add.text(W - 30, 30, '✕', {
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

        const ts = { fontSize: '12px', color: '#556677', fontFamily: 'monospace' };
        this.add.text(cx - 200, y, 'Rase:', ts);

        let rx = cx - 165;
        for (const r of RACES) {
            const btn = this.add.text(rx, y, `[${r.label}]`, {
                fontSize: '12px', color: this._filterRace === r.id ? '#f5e642' : '#667788',
                fontFamily: 'monospace'
            }).setInteractive({ useHandCursor: true });
            btn.on('pointerdown', () => {
                this._filterRace = r.id;
                this.scene.restart({ filterRace: this._filterRace, filterDiff: this._filterDiff });
            });
            rx += btn.width + 8;
        }

        this.add.text(cx + 40, y, 'Diff:', ts);
        let dx = cx + 75;
        for (const d of DIFFS) {
            const btn = this.add.text(dx, y, `[${d.label}]`, {
                fontSize: '12px', color: this._filterDiff === d.id ? '#f5e642' : '#667788',
                fontFamily: 'monospace'
            }).setInteractive({ useHandCursor: true });
            btn.on('pointerdown', () => {
                this._filterDiff = d.id;
                this.scene.restart({ filterRace: this._filterRace, filterDiff: this._filterDiff });
            });
            dx += btn.width + 8;
        }
    }

    _refreshList() {
        for (const o of this._dyn) { if (o && o.destroy) o.destroy(); }
        this._dyn = [];

        const scores = Leaderboard.getFiltered(this._filterRace, this._filterDiff);
        const { width: W } = this.cameras.main;
        const cx = W / 2;
        const y0 = this._listY;

        if (scores.length === 0) {
            this._dyn.push(this.add.text(cx, y0 + 60, 'Ingen resultater enn\u00e5.\nSpill et eventyr for \u00e5 komme p\u00e5 tavlen!', {
                fontSize: '14px', color: '#445566', fontFamily: 'monospace', align: 'center'
            }).setOrigin(0.5));
            return;
        }

        // Header
        const hdrStyle = { fontSize: '12px', color: '#556677', fontFamily: 'monospace' };
        const cols = [cx - 215, cx - 150, cx - 85, cx - 30, cx + 15, cx + 60, cx + 110, cx + 160];
        ['#', 'Navn', 'Rase', 'Verden', 'Niv\u00e5', 'Drap', 'Gull', 'Tid'].forEach((h, i) => {
            this._dyn.push(this.add.text(cols[i], y0, h, hdrStyle));
        });
        this._dyn.push(this.add.rectangle(cx, y0 + 14, 480, 1, 0x223344));

        const RACE_NAMES = { human: 'Menneske', dwarf: 'Dverg', elf: 'Alv', hobbit: 'Hobbit' };
        const rowH = 20;
        this._totalRows = scores.length;
        const { height: H } = this.cameras.main;
        const visibleArea = H - y0 - 60;
        const maxVisible = Math.floor(visibleArea / rowH);

        for (let i = 0; i < scores.length; i++) {
            const s = scores[i];
            const ry = y0 + 20 + i * rowH - (this._scrollOffset || 0);
            if (ry < y0 + 10 || ry > H - 50) continue; // clip rows outside visible area
            const isTop3 = i < 3;
            const col = isTop3 ? ['#f5e642', '#cccccc', '#cc8844'][i] : '#667788';
            const style = { fontSize: '13px', color: col, fontFamily: 'monospace' };

            const medal = i === 0 ? '1.' : i === 1 ? '2.' : i === 2 ? '3.' : `${i + 1}.`;
            this._dyn.push(this.add.text(cols[0], ry, medal, style));
            this._dyn.push(this.add.text(cols[1], ry, s.heroName || 'Helt', style));
            this._dyn.push(this.add.text(cols[2], ry, RACE_NAMES[s.race] || s.race, { ...style, fontSize: '13px' }));
            this._dyn.push(this.add.text(cols[3], ry, `${s.worldsCleared}`, style));
            this._dyn.push(this.add.text(cols[4], ry, `${s.level}`, style));
            this._dyn.push(this.add.text(cols[5], ry, `${s.monstersKilled}`, style));
            this._dyn.push(this.add.text(cols[6], ry, `${s.goldEarned}g`, style));
            // Time column (mm:ss)
            const t = s.timeSeconds || 0;
            const tStr = `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
            this._dyn.push(this.add.text(cols[7], ry, tStr, style));

            // Result indicator
            const resCol = s.result === 'death' ? '#ff4444' : '#44ee66';
            const resIcon = s.result === 'death' ? '\u2620' : '\u2713';
            this._dyn.push(this.add.text(cols[7] + 45, ry, resIcon, { ...style, color: resCol }));
        }
    }
}
