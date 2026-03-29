// ─── Labyrint Hero – CharacterCreatorScene ────────────────────────────────────

const RACE_DEFS = {
    human:  { name: 'Menneske', hearts: 5, attack: 2, defense: 0, visionRadius: 5, xpMultiplier: 1.25, special: 'XP-bonus +25%',       desc: 'Allsidig og tilpasningsdyktig. Lærer raskere enn andre.' },
    dwarf:  { name: 'Dverg',    hearts: 6, attack: 3, defense: 1, visionRadius: 4, xpMultiplier: 1.0,  special: 'Rustning +1 forsvar',  desc: 'Seig og sterk. Starter med ekstra forsvar og hjerter.' },
    elf:    { name: 'Alv',      hearts: 4, attack: 2, defense: 0, visionRadius: 7, xpMultiplier: 1.0,  special: 'Skarpt syn +2',        desc: 'Yndig og årvåken. Ser mye lenger gjennom tåken.' },
    hobbit: { name: 'Hobbit',   hearts: 4, attack: 2, defense: 0, visionRadius: 5, xpMultiplier: 1.15, special: 'Felle-sans +XP ×1.15', desc: 'Liten og uredd. Snubber sjeldnere i feller.' }
};

// Starting bonus options
const START_BONUSES = [
    { id: 'heart',  label: '+1 Hjerte',  desc: 'Start med et ekstra hjerte',  col: 0xff2244 },
    { id: 'attack', label: '+1 Angrep',  desc: 'Start sterkere i kamp',       col: 0xff8822 },
    { id: 'vision', label: '+2 Syn',     desc: '+2 synsradius i starten',     col: 0xffee22 },
];

class CharacterCreatorScene extends Phaser.Scene {
    constructor() { super({ key: 'CharacterCreatorScene' }); }

    init(data) {
        // Inherit difficulty from MenuScene if provided
        this._initDifficulty = data?.difficulty || 'normal';
    }

    create() {
        const { width: W, height: H } = this.cameras.main;
        const cx = W / 2;

        this.selectedRace       = 'human';
        this.selectedDifficulty = this._initDifficulty;
        this.selectedBonus      = 'heart';
        this.heroName           = '';
        this.appearance         = defaultAppearance('human');
        this._customOverrides   = {};

        // ── Background ────────────────────────────────────────────────────────
        this.add.rectangle(cx, H / 2, W, H, 0x0a0814);

        // ── Title ─────────────────────────────────────────────────────────────
        this.add.text(cx, 18, 'VELG DIN HELT', {
            fontSize: '24px', color: '#f5e642', fontFamily: 'monospace',
            fontStyle: 'bold', stroke: '#7a6a00', strokeThickness: 3
        }).setOrigin(0.5, 0);

        // ── Difficulty display (inherited from menu, can still change) ─────────
        this._buildDifficultyRow(cx, W);

        // ── Race tabs ─────────────────────────────────────────────────────────
        this._buildRacePanel(W, H);

        // ── Appearance / Preview (right panel) ────────────────────────────────
        this._buildAppearancePanel(W, H);

        // ── Starting bonus (left panel, below stats) ──────────────────────────
        this._buildBonusPanel(W, H);

        // ── Name + start ──────────────────────────────────────────────────────
        this._buildNameAndStart(cx, W, H);

        this._selectRace('human');
        this.input.keyboard.on('keydown', this._onKey, this);
    }

    // ── Difficulty row (compact, top of screen) ───────────────────────────────

    _buildDifficultyRow(cx, W) {
        this.add.rectangle(cx, 45, W - 20, 1, 0x1a1535);
        this.add.text(18, 52, 'VANSKELIGHETSGRAD:', {
            fontSize: '10px', color: '#445566', fontFamily: 'monospace'
        });

        const DIFFS = [
            { id: 'easy',   label: 'LETT',     col: 0x44bb44 },
            { id: 'normal', label: 'NORMAL',   col: 0x4488ff },
            { id: 'hard',   label: 'VANSK.',   col: 0xff4444 },
        ];
        this._diffBtns = {};
        DIFFS.forEach(({ id, label, col }, i) => {
            const bx  = 170 + i * 100;
            const bg  = this.add.rectangle(bx, 57, 88, 18, 0x111122)
                .setStrokeStyle(1, 0x334466).setInteractive({ useHandCursor: true });
            const txt = this.add.text(bx, 57, label, {
                fontSize: '11px', color: '#889aaa', fontFamily: 'monospace'
            }).setOrigin(0.5);
            bg.on('pointerdown', () => this._selectDifficulty(id));
            this._diffBtns[id] = { bg, txt, col };
        });
        this._selectDifficulty(this.selectedDifficulty);
    }

    _selectDifficulty(id) {
        this.selectedDifficulty = id;
        for (const [did, { bg, txt, col }] of Object.entries(this._diffBtns)) {
            const sel = did === id;
            bg.setFillStyle(sel ? 0x0e1a26 : 0x111122);
            bg.setStrokeStyle(sel ? 2 : 1, sel ? col : 0x334466);
            txt.setColor(sel ? `#${col.toString(16).padStart(6, '0')}` : '#667788');
        }
    }

    // ── Left panel: race selection + stats ────────────────────────────────────

    _buildRacePanel(W, H) {
        const panelX = 18;
        const races  = Object.keys(RACE_DEFS);
        const btnW   = 100, btnH = 32;

        this._raceBtns = {};
        this.add.rectangle(panelX + races.length * (btnW + 6) / 2, 75, W / 2, 1, 0x1a1535);
        races.forEach((id, i) => {
            const bx  = panelX + i * (btnW + 6) + btnW / 2;
            const btn = this._raceTab(bx, 88, btnW, btnH, RACE_DEFS[id].name, id);
            this._raceBtns[id] = btn;
        });

        this._statsY    = 116;
        this._statsObjs = [];
        this._rebuildStats();
    }

    _raceTab(x, y, w, h, label, raceId) {
        const bg  = this.add.rectangle(x, y, w, h, 0x1a1535).setStrokeStyle(1, 0x4444aa).setInteractive({ useHandCursor: true });
        const txt = this.add.text(x, y, label, { fontSize: '13px', color: '#cccccc', fontFamily: 'monospace' }).setOrigin(0.5);
        bg.on('pointerdown', () => this._selectRace(raceId));
        bg.on('pointerover', () => bg.setAlpha(0.8));
        bg.on('pointerout',  () => bg.setAlpha(1));
        return { bg, txt };
    }

    _selectRace(id) {
        this.selectedRace = id;
        this.appearance   = { ...defaultAppearance(id), ...this._customOverrides };
        for (const [rid, { bg, txt }] of Object.entries(this._raceBtns)) {
            const sel = rid === id;
            bg.setFillStyle(sel ? 0x2a2060 : 0x1a1535);
            bg.setStrokeStyle(sel ? 2 : 1, sel ? 0xf5e642 : 0x4444aa);
            txt.setColor(sel ? '#f5e642' : '#cccccc');
        }
        this._rebuildStats();
        this._rebuildPreview();
        this._rebuildAppearancePickers();
    }

    _rebuildStats() {
        this._statsObjs.forEach(o => o.destroy());
        this._statsObjs = [];

        const def = RACE_DEFS[this.selectedRace];
        const add = o => { this._statsObjs.push(o); return o; };
        const y0  = this._statsY;
        const lx  = 22;

        add(this.add.text(lx, y0, def.desc, { fontSize: '10px', color: '#8899bb', fontFamily: 'monospace', wordWrap: { width: 420 } }));
        add(this.add.text(lx, y0 + 14, `Spesial: ${def.special}`, { fontSize: '10px', color: '#f5e642', fontFamily: 'monospace' }));

        const stats = [
            { label: 'Hjerter',  val: def.hearts,       max: 8,  col: 0xff2244 },
            { label: 'Angrep',   val: def.attack,        max: 6,  col: 0xff8800 },
            { label: 'Forsvar',  val: def.defense,       max: 4,  col: 0x4488ff },
            { label: 'Syn',      val: def.visionRadius,  max: 8,  col: 0xffee00 },
            { label: 'XP-mult',  val: def.xpMultiplier,  max: 2,  col: 0xaa44ff }
        ];
        const barX = lx, bw = 190, bh = 8, gap = 17;
        stats.forEach(({ label, val, max, col }, i) => {
            const y = y0 + 30 + i * gap;
            add(this.add.text(barX, y, label, { fontSize: '10px', color: '#556677', fontFamily: 'monospace' }));
            const bg = add(this.add.graphics());
            bg.fillStyle(0x1a1535);
            bg.fillRect(barX + 62, y, bw, bh);
            const fill = add(this.add.graphics());
            fill.fillStyle(col);
            fill.fillRect(barX + 62, y, Math.floor(bw * (val / max)), bh);
            const valStr = label === 'XP-mult' ? `×${val.toFixed(2)}` : String(val);
            add(this.add.text(barX + 62 + bw + 5, y, valStr, { fontSize: '10px', color: '#aabbcc', fontFamily: 'monospace' }));
        });
    }

    // ── Right panel: sprite preview + appearance pickers ──────────────────────

    _buildAppearancePanel(W, H) {
        this._previewGfx  = this.add.graphics();
        this._appearObjs  = [];
        this._rebuildAppearancePickers();
    }

    _rebuildAppearancePickers() {
        this._appearObjs.forEach(o => o.destroy());
        this._appearObjs = [];

        const { width: W } = this.cameras.main;
        const px = W - 330, py = 112;
        const add = o => { this._appearObjs.push(o); return o; };

        add(this.add.text(px, py, 'UTSEENDE', { fontSize: '10px', color: '#445566', fontFamily: 'monospace' }));

        // Skin tone row
        let rowY = py + 18;
        add(this.add.text(px, rowY, 'Hud:', { fontSize: '10px', color: '#667788', fontFamily: 'monospace' }));
        SKIN_TONES.forEach((col, i) => {
            const btn = this._colorDot(px + 44 + i * 26, rowY + 5, col, this.appearance.skinColor === col);
            btn.on('pointerdown', () => { this._customOverrides.skinColor = col; this.appearance.skinColor = col; this._rebuildPreview(); this._rebuildAppearancePickers(); });
            add(btn);
        });

        // Hair color row
        rowY += 24;
        add(this.add.text(px, rowY, 'Hår:', { fontSize: '10px', color: '#667788', fontFamily: 'monospace' }));
        HAIR_COLORS.forEach((col, i) => {
            const btn = this._colorDot(px + 44 + i * 26, rowY + 5, col, this.appearance.hairColor === col);
            btn.on('pointerdown', () => { this._customOverrides.hairColor = col; this.appearance.hairColor = col; this._rebuildPreview(); this._rebuildAppearancePickers(); });
            add(btn);
        });

        // Eye color row (NEW)
        rowY += 24;
        add(this.add.text(px, rowY, 'Øyne:', { fontSize: '10px', color: '#667788', fontFamily: 'monospace' }));
        EYE_COLORS.forEach((col, i) => {
            const btn = this._colorDot(px + 52 + i * 26, rowY + 5, col, this.appearance.eyeColor === col);
            btn.on('pointerdown', () => { this._customOverrides.eyeColor = col; this.appearance.eyeColor = col; this._rebuildPreview(); this._rebuildAppearancePickers(); });
            add(btn);
        });

        // Cloth color row
        rowY += 24;
        add(this.add.text(px, rowY, 'Drakt:', { fontSize: '10px', color: '#667788', fontFamily: 'monospace' }));
        CLOTH_COLORS.forEach((col, i) => {
            const btn = this._colorDot(px + 52 + i * 26, rowY + 5, col, this.appearance.clothColor === col);
            btn.on('pointerdown', () => { this._customOverrides.clothColor = col; this.appearance.clothColor = col; this._rebuildPreview(); this._rebuildAppearancePickers(); });
            add(btn);
        });

        // Hair style row
        if (this.selectedRace !== 'dwarf') {
            rowY += 26;
            add(this.add.text(px, rowY, 'Stil:', { fontSize: '10px', color: '#667788', fontFamily: 'monospace' }));
            HAIR_STYLES.forEach((style, i) => {
                const bx  = px + 44 + i * 50;
                const sel = this.appearance.hairStyle === style;
                const bg  = this.add.rectangle(bx + 18, rowY + 7, 44, 18, sel ? 0x2a2060 : 0x111122).setStrokeStyle(1, sel ? 0xf5e642 : 0x334455).setInteractive({ useHandCursor: true });
                const txt = this.add.text(bx + 18, rowY + 7, HAIR_STYLE_LABELS[style], { fontSize: '9px', color: sel ? '#f5e642' : '#778899', fontFamily: 'monospace' }).setOrigin(0.5);
                bg.on('pointerdown', () => { this._customOverrides.hairStyle = style; this.appearance.hairStyle = style; this._rebuildPreview(); this._rebuildAppearancePickers(); });
                add(bg);
                add(txt);
            });
        }

        // Beard style row (human / dwarf only) (NEW)
        if (this.selectedRace === 'human' || this.selectedRace === 'dwarf') {
            rowY += 26;
            add(this.add.text(px, rowY, 'Skjegg:', { fontSize: '10px', color: '#667788', fontFamily: 'monospace' }));
            BEARD_STYLES.forEach((style, i) => {
                const bx  = px + 56 + i * 60;
                const sel = this.appearance.beardStyle === style;
                const bg  = this.add.rectangle(bx + 20, rowY + 7, 54, 18, sel ? 0x2a2060 : 0x111122).setStrokeStyle(1, sel ? 0xf5e642 : 0x334455).setInteractive({ useHandCursor: true });
                const txt = this.add.text(bx + 20, rowY + 7, BEARD_STYLE_LABELS[style], { fontSize: '9px', color: sel ? '#f5e642' : '#778899', fontFamily: 'monospace' }).setOrigin(0.5);
                bg.on('pointerdown', () => { this._customOverrides.beardStyle = style; this.appearance.beardStyle = style; this._rebuildPreview(); this._rebuildAppearancePickers(); });
                add(bg);
                add(txt);
            });
        }

        this._rebuildPreview();
    }

    _colorDot(x, y, color, selected) {
        const r = 9;
        const g = this.add.graphics();
        g.fillStyle(color);
        g.fillCircle(x, y, r);
        if (selected) {
            g.lineStyle(2, 0xffffff, 0.9);
            g.strokeCircle(x, y, r + 2);
        }
        g.setInteractive(new Phaser.Geom.Circle(x, y, r + 4), Phaser.Geom.Circle.Contains);
        return g;
    }

    _rebuildPreview() {
        const { width: W, height: H } = this.cameras.main;
        const g = this._previewGfx;
        g.clear();

        const previewSize = 112;
        const px = W - 170;
        const py = H - 230;

        // Preview box with glow effect
        g.lineStyle(1, 0x2a2050);
        g.strokeRect(px - previewSize / 2 - 6, py - 6, previewSize + 12, previewSize + 12);
        g.lineStyle(1, 0x334466, 0.5);
        g.strokeRect(px - previewSize / 2 - 4, py - 4, previewSize + 8, previewSize + 8);
        g.fillStyle(0x0d0b1e);
        g.fillRect(px - previewSize / 2 - 3, py - 3, previewSize + 6, previewSize + 6);

        // Floor tile hint
        g.fillStyle(0x1e1a30);
        g.fillRect(px - previewSize / 2 - 3, py + previewSize - 10, previewSize + 6, 13);

        drawCharacterSprite(g, px - previewSize / 2, py, previewSize, this.appearance, this.selectedRace);

        // Race name label
        g.fillStyle(0x0d0b1e, 0.7);
        g.fillRect(px - previewSize / 2 - 3, py + previewSize + 10, previewSize + 6, 14);
    }

    // ── Starting bonus panel (left side, below stats) ─────────────────────────

    _buildBonusPanel(W, H) {
        const lx = 22, by = this._statsY + 120;

        this.add.rectangle(W / 4, by - 6, W / 2 - 10, 1, 0x1a1535);
        this.add.text(lx, by, 'STARTBONUS  (velg én)', {
            fontSize: '10px', color: '#445566', fontFamily: 'monospace'
        });

        this._bonusBtns = {};
        START_BONUSES.forEach(({ id, label, desc, col }, i) => {
            const bx  = lx + i * 150 + 60;
            const bg  = this.add.rectangle(bx, by + 26, 138, 32, 0x111122)
                .setStrokeStyle(1, 0x334466).setInteractive({ useHandCursor: true });
            const lbl = this.add.text(bx, by + 20, label, {
                fontSize: '12px', color: '#aabbcc', fontFamily: 'monospace', fontStyle: 'bold'
            }).setOrigin(0.5);
            const dsc = this.add.text(bx, by + 32, desc, {
                fontSize: '9px', color: '#556677', fontFamily: 'monospace'
            }).setOrigin(0.5);
            bg.on('pointerdown', () => this._selectBonus(id));
            bg.on('pointerover',  () => { if (this.selectedBonus !== id) bg.setFillStyle(0x1a1a33); });
            bg.on('pointerout',   () => { if (this.selectedBonus !== id) bg.setFillStyle(0x111122); });
            this._bonusBtns[id] = { bg, lbl, dsc, col };
        });

        this._selectBonus('heart');
    }

    _selectBonus(id) {
        this.selectedBonus = id;
        for (const [bid, { bg, lbl, col }] of Object.entries(this._bonusBtns)) {
            const sel = bid === id;
            bg.setFillStyle(sel ? 0x0e1a26 : 0x111122);
            bg.setStrokeStyle(sel ? 2 : 1, sel ? col : 0x334466);
            lbl.setColor(sel ? `#${col.toString(16).padStart(6, '0')}` : '#aabbcc');
        }
    }

    // ── Name input ────────────────────────────────────────────────────────────

    _buildNameAndStart(cx, W, H) {
        const nameY = H - 80;
        this.add.rectangle(cx, nameY, W - 20, 1, 0x1a1535);
        this.add.text(22, nameY + 12, 'Navn:', { fontSize: '12px', color: '#667788', fontFamily: 'monospace' }).setOrigin(0, 0.5);

        this._nameBg  = this.add.rectangle(cx + 40, nameY + 12, 240, 28, 0x1a1830).setStrokeStyle(1, 0x4444aa);
        this._nameTxt = this.add.text(cx + 40, nameY + 12, '|', { fontSize: '15px', color: '#ffffff', fontFamily: 'monospace' }).setOrigin(0.5);

        this._cursor = true;
        this.time.addEvent({ delay: 500, loop: true, callback: () => {
            this._cursor = !this._cursor;
            this._nameTxt.setText((this.heroName || '') + (this._cursor ? '|' : ' '));
        }});

        const startBtn = this.add.text(cx, H - 36, '[ START EVENTYR ]', {
            fontSize: '22px', color: '#00e87a', fontFamily: 'monospace'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        startBtn.on('pointerover', () => startBtn.setAlpha(0.7));
        startBtn.on('pointerout',  () => startBtn.setAlpha(1));
        startBtn.on('pointerdown', () => this._startGame());
        this.tweens.add({ targets: startBtn, alpha: 0.5, duration: 700, yoyo: true, repeat: -1 });
    }

    _onKey(event) {
        if (event.key === 'Backspace') {
            this.heroName = this.heroName.slice(0, -1);
        } else if (event.key === 'Enter') {
            this._startGame();
        } else if (event.key.length === 1 && this.heroName.length < 14) {
            this.heroName += event.key;
        }
        this._nameTxt.setText(this.heroName + '|');
    }

    _startGame() {
        const name = this.heroName.trim() || RACE_DEFS[this.selectedRace].name;
        this.input.keyboard.off('keydown', this._onKey, this);
        this.scene.start('GameScene', {
            worldNum:   1,
            heroStats:  null,
            race:       this.selectedRace,
            heroName:   name,
            appearance: { ...this.appearance },
            difficulty: this.selectedDifficulty,
            startBonus: this.selectedBonus
        });
    }
}
