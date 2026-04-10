// ─── Labyrint Hero – CharacterCreatorScene ────────────────────────────────────
// Full-page three-column layout: Race+Stats | Preview+Name | Appearance

const RACE_DEFS = {
    human:  { name: 'Menneske', hearts: 5, attack: 2, defense: 0, visionRadius: 5, xpMultiplier: 1.25, special: 'XP-bonus +25%',       desc: 'Allsidig og tilpasningsdyktig. Lærer raskere enn andre.' },
    dwarf:  { name: 'Dverg',    hearts: 6, attack: 3, defense: 1, visionRadius: 4, xpMultiplier: 1.0,  special: 'Rustning +1 forsvar',  desc: 'Seig og sterk. Starter med ekstra forsvar og hjerter.' },
    elf:    { name: 'Alv',      hearts: 4, attack: 2, defense: 0, visionRadius: 7, xpMultiplier: 1.0,  special: 'Skarpt syn +2',        desc: 'Yndig og årvåken. Ser mye lenger gjennom tåken.' },
    hobbit: { name: 'Hobbit',   hearts: 4, attack: 2, defense: 0, visionRadius: 5, xpMultiplier: 1.15, special: 'Felle-sans +XP ×1.15', desc: 'Liten og uredd. Snubbler sjeldnere i feller.' }
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
        this._initDifficulty = data?.difficulty || 'normal';
    }

    create() {
        const { width: W, height: H } = this.cameras.main;

        this.selectedRace       = 'human';
        this.selectedDifficulty = this._initDifficulty;
        this.selectedBonus      = 'heart';
        this.heroName           = '';
        this.appearance         = defaultAppearance('human');
        this._customOverrides   = {};

        // ── Full background ──────────────────────────────────────────────────
        this.add.rectangle(W / 2, H / 2, W, H, 0x080612);

        // ── Layout constants ─────────────────────────────────────────────────
        const pad = 15;
        const mainY = 58, mainBot = H - 145;
        const mainH = mainBot - mainY;

        const leftX = pad, leftW = 370;
        const centerX = leftX + leftW + pad, centerW = 400;
        const rightX = centerX + centerW + pad, rightW = W - rightX - pad;

        this._leftPanel   = { x: leftX, y: mainY, w: leftW, h: mainH };
        this._centerPanel = { x: centerX, y: mainY, w: centerW, h: mainH };
        this._rightPanel  = { x: rightX, y: mainY, w: rightW, h: mainH };

        // ── Top bar ──────────────────────────────────────────────────────────
        this._buildTopBar(W);

        // ── Section panels (backgrounds) ─────────────────────────────────────
        this._drawSectionPanel(leftX, mainY, leftW, mainH);
        this._drawSectionPanel(centerX, mainY, centerW, mainH);
        this._drawSectionPanel(rightX, mainY, rightW, mainH);

        // ── Left panel: Race grid + Stats ────────────────────────────────────
        this._statsObjs = [];
        this._buildRaceGrid();

        // ── Center panel: Preview + Name ─────────────────────────────────────
        this._previewGfx = this.add.graphics();
        this._descObjs   = [];
        this._buildNameInput();

        // ── Right panel: Appearance ──────────────────────────────────────────
        this._appearObjs = [];

        // ── Bottom bar: Bonus + Start ────────────────────────────────────────
        this._buildBottomBar(W, H, mainBot + pad);

        // ── Apply defaults ───────────────────────────────────────────────────
        this._selectRace('human');
        this._selectDifficulty(this.selectedDifficulty);
        this._selectBonus('heart');
        this.input.keyboard.on('keydown', this._onKey, this);
    }

    _drawSectionPanel(x, y, w, h) {
        const g = this.add.graphics();
        g.fillStyle(0x0c0a1a, 0.85);
        g.fillRoundedRect(x, y, w, h, 6);
        g.lineStyle(1, 0x2a2060, 0.5);
        g.strokeRoundedRect(x, y, w, h, 6);
    }

    // ── Top bar: Title + Difficulty ──────────────────────────────────────────

    _buildTopBar(W) {
        const cx = W / 2;
        this.add.text(cx, 8, 'VELG DIN HELT', {
            fontSize: '26px', color: '#f5e642', fontFamily: 'monospace',
            fontStyle: 'bold', stroke: '#7a6a00', strokeThickness: 3
        }).setOrigin(0.5, 0);

        this.add.text(W - 390, 18, 'VANSKELIGHETSGRAD:', {
            fontSize: '12px', color: '#445566', fontFamily: 'monospace'
        });

        const DIFFS = [
            { id: 'easy',   label: 'LETT',   col: 0x44bb44 },
            { id: 'normal', label: 'NORMAL', col: 0x4488ff },
            { id: 'hard',   label: 'VANSK.', col: 0xff4444 },
        ];
        this._diffBtns = {};
        DIFFS.forEach(({ id, label, col }, i) => {
            const bx = W - 230 + i * 80;
            const bg = this.add.rectangle(bx, 17, 70, 22, 0x111122)
                .setStrokeStyle(1, 0x334466).setInteractive({ useHandCursor: true });
            const txt = this.add.text(bx, 17, label, {
                fontSize: '12px', color: '#889aaa', fontFamily: 'monospace'
            }).setOrigin(0.5);
            bg.on('pointerdown', () => this._selectDifficulty(id));
            this._diffBtns[id] = { bg, txt, col };
        });

        this.add.rectangle(cx, 46, W - 24, 1, 0x1a1535);
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

    // ── Left panel: Race grid (2x2) + Stats ──────────────────────────────────

    _buildRaceGrid() {
        const { x: px, y: py, w: pw } = this._leftPanel;
        const innerPad = 15;

        this.add.text(px + pw / 2, py + 10, 'RASE', {
            fontSize: '13px', color: '#556677', fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0.5, 0);

        const races = Object.keys(RACE_DEFS);
        const cardW = (pw - innerPad * 2 - 10) / 2;
        const cardH = 80;
        const gap = 8;
        const gridX = px + innerPad;
        const gridY = py + 30;

        this._raceBtns = {};
        races.forEach((id, i) => {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const cx = gridX + col * (cardW + gap) + cardW / 2;
            const cy = gridY + row * (cardH + gap) + cardH / 2;

            const def = RACE_DEFS[id];
            const bg = this.add.graphics();
            bg.fillStyle(0x111128, 0.9);
            bg.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 5);
            bg.lineStyle(1, 0x334466);
            bg.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 5);

            const hitZone = this.add.rectangle(cx, cy, cardW, cardH)
                .setInteractive({ useHandCursor: true }).setAlpha(0.001);

            const name = this.add.text(cx, cy - 20, def.name, {
                fontSize: '15px', color: '#cccccc', fontFamily: 'monospace', fontStyle: 'bold'
            }).setOrigin(0.5);
            const spec = this.add.text(cx, cy + 2, def.special, {
                fontSize: '11px', color: '#667788', fontFamily: 'monospace'
            }).setOrigin(0.5);
            const statLine = `\u2665${def.hearts} \u2694${def.attack} \u25C6${def.defense} \u25CE${def.visionRadius}`;
            const stats = this.add.text(cx, cy + 20, statLine, {
                fontSize: '10px', color: '#556677', fontFamily: 'monospace'
            }).setOrigin(0.5);

            hitZone.on('pointerdown', () => this._selectRace(id));
            hitZone.on('pointerover', () => { if (this.selectedRace !== id) bg.setAlpha(0.8); });
            hitZone.on('pointerout',  () => bg.setAlpha(1));

            this._raceBtns[id] = { bg, name, spec, stats, hitZone, cardW, cardH, cx, cy };
        });

        // Stats area starts below the grid
        this._statsAreaY = gridY + 2 * (cardH + gap) + 12;
    }

    _selectRace(id) {
        this.selectedRace = id;
        this.appearance = { ...defaultAppearance(id), ...this._customOverrides };

        for (const [rid, btn] of Object.entries(this._raceBtns)) {
            const sel = rid === id;
            btn.bg.clear();
            btn.bg.fillStyle(sel ? 0x1a1540 : 0x111128, 0.9);
            btn.bg.fillRoundedRect(btn.cx - btn.cardW / 2, btn.cy - btn.cardH / 2, btn.cardW, btn.cardH, 5);
            btn.bg.lineStyle(sel ? 2 : 1, sel ? 0xf5e642 : 0x334466);
            btn.bg.strokeRoundedRect(btn.cx - btn.cardW / 2, btn.cy - btn.cardH / 2, btn.cardW, btn.cardH, 5);
            btn.name.setColor(sel ? '#f5e642' : '#cccccc');
            btn.spec.setColor(sel ? '#aabb88' : '#667788');
        }

        this._rebuildStats();
        this._rebuildPreview();
        this._rebuildAppearancePickers();
    }

    _rebuildStats() {
        this._statsObjs.forEach(o => o.destroy());
        this._statsObjs = [];

        const { x: px, w: pw } = this._leftPanel;
        const innerPad = 15;
        const lx = px + innerPad;
        const sy = this._statsAreaY;
        const def = RACE_DEFS[this.selectedRace];
        const add = o => { this._statsObjs.push(o); return o; };

        // Race description
        add(this.add.text(lx, sy, def.desc, {
            fontSize: '12px', color: '#8899bb', fontFamily: 'monospace',
            wordWrap: { width: pw - innerPad * 2 }
        }));
        add(this.add.text(lx, sy + 28, `\u2605 ${def.special}`, {
            fontSize: '12px', color: '#f5e642', fontFamily: 'monospace'
        }));

        // Separator
        const sepG = add(this.add.graphics());
        sepG.lineStyle(1, 0x1a1535);
        sepG.lineBetween(px + 10, sy + 50, px + pw - 10, sy + 50);

        // Section header
        add(this.add.text(px + pw / 2, sy + 58, 'EGENSKAPER', {
            fontSize: '12px', color: '#556677', fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0.5, 0));

        const stats = [
            { label: 'Hjerter', val: def.hearts,      max: 8, col: 0xff2244 },
            { label: 'Angrep',  val: def.attack,       max: 6, col: 0xff8800 },
            { label: 'Forsvar', val: def.defense,      max: 4, col: 0x4488ff },
            { label: 'Syn',     val: def.visionRadius, max: 8, col: 0xffee00 },
            { label: 'XP-mult', val: def.xpMultiplier, max: 2, col: 0xaa44ff }
        ];

        const bw = pw - innerPad * 2 - 100;
        const bh = 12;
        const gap = 26;

        stats.forEach(({ label, val, max, col }, i) => {
            const y = sy + 80 + i * gap;
            add(this.add.text(lx, y, label, {
                fontSize: '12px', color: '#556677', fontFamily: 'monospace'
            }));
            const bgBar = add(this.add.graphics());
            bgBar.fillStyle(0x1a1535);
            bgBar.fillRect(lx + 72, y + 2, bw, bh);
            const fill = add(this.add.graphics());
            fill.fillStyle(col);
            fill.fillRect(lx + 72, y + 2, Math.floor(bw * (val / max)), bh);
            const valStr = label === 'XP-mult' ? `\u00d7${val.toFixed(2)}` : String(val);
            add(this.add.text(lx + 72 + bw + 6, y, valStr, {
                fontSize: '12px', color: '#aabbcc', fontFamily: 'monospace'
            }));
        });
    }

    // ── Center panel: Preview + Description + Name ───────────────────────────

    _rebuildPreview() {
        this._descObjs.forEach(o => o.destroy());
        this._descObjs = [];

        const { x: px, y: py, w: pw, h: ph } = this._centerPanel;
        const g = this._previewGfx;
        g.clear();

        const previewSize = Math.min(280, pw - 40);
        const prevCX = px + pw / 2;
        const prevY = py + 20;

        // Preview box background
        g.fillStyle(0x0d0b1e, 0.95);
        g.fillRoundedRect(prevCX - previewSize / 2 - 8, prevY, previewSize + 16, previewSize + 16, 6);
        g.lineStyle(2, 0x3a3070, 0.6);
        g.strokeRoundedRect(prevCX - previewSize / 2 - 8, prevY, previewSize + 16, previewSize + 16, 6);

        // Floor hint
        g.fillStyle(0x1e1a30);
        g.fillRect(prevCX - previewSize / 2 - 3, prevY + previewSize - 12, previewSize + 6, 23);

        // Character sprite
        if (typeof drawDetailedCharacterSprite === 'function') {
            drawDetailedCharacterSprite(g, prevCX - previewSize / 2, prevY + 8, previewSize, this.appearance, this.selectedRace);
        } else {
            drawCharacterSprite(g, prevCX - previewSize / 2, prevY + 8, previewSize, this.appearance, this.selectedRace);
        }

        // Race name below preview
        const add = o => { this._descObjs.push(o); return o; };
        const def = RACE_DEFS[this.selectedRace];
        add(this.add.text(prevCX, prevY + previewSize + 28, def.name.toUpperCase(), {
            fontSize: '18px', color: '#f5e642', fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0.5, 0));
    }

    _buildNameInput() {
        const { x: px, y: py, w: pw, h: ph } = this._centerPanel;
        const cx = px + pw / 2;
        const y = py + ph - 55;

        this.add.text(cx - 110, y, 'Heltenavn:', {
            fontSize: '13px', color: '#667788', fontFamily: 'monospace'
        }).setOrigin(0, 0.5);

        this._nameBg  = this.add.rectangle(cx + 30, y, 200, 28, 0x1a1830)
            .setStrokeStyle(1, 0x4444aa);
        this._nameTxt = this.add.text(cx + 30, y, '|', {
            fontSize: '16px', color: '#ffffff', fontFamily: 'monospace'
        }).setOrigin(0.5);

        this._nameBg.setInteractive({ useHandCursor: true });
        this._nameBg.on('pointerdown', () => this._openMobileNameInput());

        this._cursor = true;
        this.time.addEvent({ delay: 500, loop: true, callback: () => {
            this._cursor = !this._cursor;
            this._nameTxt.setText((this.heroName || '') + (this._cursor ? '|' : ' '));
        }});
    }

    // ── Right panel: Appearance ──────────────────────────────────────────────

    _rebuildAppearancePickers() {
        this._appearObjs.forEach(o => o.destroy());
        this._appearObjs = [];

        const { x: px, y: py, w: pw } = this._rightPanel;
        const innerPad = 15;
        const lx = px + innerPad;
        const add = o => { this._appearObjs.push(o); return o; };

        add(this.add.text(px + pw / 2, py + 10, 'UTSEENDE', {
            fontSize: '13px', color: '#556677', fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0.5, 0));

        let rowY = py + 36;
        const rowGap = 36;

        // ── Gender ───────────────────────────────────────────────────────────
        add(this.add.text(lx, rowY, 'Kj\u00f8nn:', { fontSize: '12px', color: '#667788', fontFamily: 'monospace' }));
        GENDERS.forEach((gid, i) => {
            const bx = lx + 70 + i * 80;
            const sel = this.appearance.gender === gid;
            const bg = this.add.rectangle(bx + 28, rowY + 6, 68, 22, sel ? 0x2a2060 : 0x111122)
                .setStrokeStyle(1, sel ? 0xf5e642 : 0x334455).setInteractive({ useHandCursor: true });
            const txt = this.add.text(bx + 28, rowY + 6, GENDER_LABELS[gid], {
                fontSize: '12px', color: sel ? '#f5e642' : '#778899', fontFamily: 'monospace'
            }).setOrigin(0.5);
            bg.on('pointerdown', () => {
                this._customOverrides.gender = gid;
                this.appearance.gender = gid;
                if (gid === 'female' && this.appearance.beardStyle !== 'none') {
                    this._customOverrides.beardStyle = 'none';
                    this.appearance.beardStyle = 'none';
                }
                this._rebuildPreview();
                this._rebuildAppearancePickers();
            });
            add(bg); add(txt);
        });

        // ── Skin tone ────────────────────────────────────────────────────────
        rowY += rowGap;
        add(this.add.text(lx, rowY, 'Hud:', { fontSize: '12px', color: '#667788', fontFamily: 'monospace' }));
        SKIN_TONES.forEach((col, i) => {
            const btn = this._colorDot(lx + 52 + i * 30, rowY + 7, col, this.appearance.skinColor === col);
            btn.on('pointerdown', () => { this._customOverrides.skinColor = col; this.appearance.skinColor = col; this._rebuildPreview(); this._rebuildAppearancePickers(); });
            add(btn);
        });

        // ── Hair color ───────────────────────────────────────────────────────
        rowY += rowGap;
        add(this.add.text(lx, rowY, 'H\u00e5r:', { fontSize: '12px', color: '#667788', fontFamily: 'monospace' }));
        HAIR_COLORS.forEach((col, i) => {
            const btn = this._colorDot(lx + 52 + i * 28, rowY + 7, col, this.appearance.hairColor === col);
            btn.on('pointerdown', () => { this._customOverrides.hairColor = col; this.appearance.hairColor = col; this._rebuildPreview(); this._rebuildAppearancePickers(); });
            add(btn);
        });

        // ── Eye color ────────────────────────────────────────────────────────
        rowY += rowGap;
        add(this.add.text(lx, rowY, '\u00d8yne:', { fontSize: '12px', color: '#667788', fontFamily: 'monospace' }));
        EYE_COLORS.forEach((col, i) => {
            const btn = this._colorDot(lx + 60 + i * 30, rowY + 7, col, this.appearance.eyeColor === col);
            btn.on('pointerdown', () => { this._customOverrides.eyeColor = col; this.appearance.eyeColor = col; this._rebuildPreview(); this._rebuildAppearancePickers(); });
            add(btn);
        });

        // ── Cloth color ──────────────────────────────────────────────────────
        rowY += rowGap;
        add(this.add.text(lx, rowY, 'Farge:', { fontSize: '12px', color: '#667788', fontFamily: 'monospace' }));
        CLOTH_COLORS.forEach((col, i) => {
            const btn = this._colorDot(lx + 60 + i * 26, rowY + 7, col, this.appearance.clothColor === col);
            btn.on('pointerdown', () => { this._customOverrides.clothColor = col; this.appearance.clothColor = col; this._rebuildPreview(); this._rebuildAppearancePickers(); });
            add(btn);
        });

        // ── Clothing style ───────────────────────────────────────────────────
        rowY += rowGap;
        add(this.add.text(lx, rowY, 'Drakt:', { fontSize: '12px', color: '#667788', fontFamily: 'monospace' }));
        CLOTH_STYLES.forEach((style, i) => {
            const bx = lx + 60 + i * 68;
            const sel = this.appearance.clothStyle === style;
            const bg = this.add.rectangle(bx + 26, rowY + 6, 60, 22, sel ? 0x2a2060 : 0x111122)
                .setStrokeStyle(1, sel ? 0xf5e642 : 0x334455).setInteractive({ useHandCursor: true });
            const txt = this.add.text(bx + 26, rowY + 6, CLOTH_STYLE_LABELS[style], {
                fontSize: '11px', color: sel ? '#f5e642' : '#778899', fontFamily: 'monospace'
            }).setOrigin(0.5);
            bg.on('pointerdown', () => {
                this._customOverrides.clothStyle = style;
                this.appearance.clothStyle = style;
                this._rebuildPreview();
                this._rebuildAppearancePickers();
            });
            add(bg); add(txt);
        });

        // ── Hair style (not for dwarf) ───────────────────────────────────────
        if (this.selectedRace !== 'dwarf') {
            rowY += rowGap;
            add(this.add.text(lx, rowY, 'Frisyre:', { fontSize: '12px', color: '#667788', fontFamily: 'monospace' }));
            const stylesPerRow = 5;
            HAIR_STYLES.forEach((style, i) => {
                const row = Math.floor(i / stylesPerRow);
                const col = i % stylesPerRow;
                const bx = lx + 70 + col * 62;
                const by = rowY + 6 + row * 28;
                const sel = this.appearance.hairStyle === style;
                const bg = this.add.rectangle(bx + 24, by, 56, 22, sel ? 0x2a2060 : 0x111122)
                    .setStrokeStyle(1, sel ? 0xf5e642 : 0x334455).setInteractive({ useHandCursor: true });
                const txt = this.add.text(bx + 24, by, HAIR_STYLE_LABELS[style], {
                    fontSize: '11px', color: sel ? '#f5e642' : '#778899', fontFamily: 'monospace'
                }).setOrigin(0.5);
                bg.on('pointerdown', () => {
                    this._customOverrides.hairStyle = style;
                    this.appearance.hairStyle = style;
                    this._rebuildPreview();
                    this._rebuildAppearancePickers();
                });
                add(bg); add(txt);
            });
            rowY += Math.ceil(HAIR_STYLES.length / stylesPerRow) * 28;
        }

        // ── Beard style (male human / dwarf only) ────────────────────────────
        const showBeard = (this.selectedRace === 'human' || this.selectedRace === 'dwarf') &&
                          this.appearance.gender !== 'female';
        if (showBeard) {
            rowY += 6;
            add(this.add.text(lx, rowY, 'Skjegg:', { fontSize: '12px', color: '#667788', fontFamily: 'monospace' }));
            BEARD_STYLES.forEach((style, i) => {
                const bx = lx + 70 + i * 70;
                const sel = this.appearance.beardStyle === style;
                const bg = this.add.rectangle(bx + 24, rowY + 6, 62, 22, sel ? 0x2a2060 : 0x111122)
                    .setStrokeStyle(1, sel ? 0xf5e642 : 0x334455).setInteractive({ useHandCursor: true });
                const txt = this.add.text(bx + 24, rowY + 6, BEARD_STYLE_LABELS[style], {
                    fontSize: '11px', color: sel ? '#f5e642' : '#778899', fontFamily: 'monospace'
                }).setOrigin(0.5);
                bg.on('pointerdown', () => {
                    this._customOverrides.beardStyle = style;
                    this.appearance.beardStyle = style;
                    this._rebuildPreview();
                    this._rebuildAppearancePickers();
                });
                add(bg); add(txt);
            });
        }
    }

    _colorDot(x, y, color, selected) {
        const r = 10;
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

    // ── Bottom bar: Bonus + Start ────────────────────────────────────────────

    _buildBottomBar(W, H, botY) {
        const barH = H - botY - 8;
        const barG = this.add.graphics();
        barG.fillStyle(0x0c0a1a, 0.9);
        barG.fillRoundedRect(15, botY, W - 30, barH, 6);
        barG.lineStyle(1, 0x2a2060, 0.5);
        barG.strokeRoundedRect(15, botY, W - 30, barH, 6);

        // Starting bonus label
        this.add.text(35, botY + 14, 'STARTBONUS', {
            fontSize: '13px', color: '#556677', fontFamily: 'monospace', fontStyle: 'bold'
        });

        this._bonusBtns = {};
        START_BONUSES.forEach(({ id, label, desc, col }, i) => {
            const bx = 130 + i * 185;
            const by = botY + 48;
            const bg = this.add.rectangle(bx, by, 168, 42, 0x111122)
                .setStrokeStyle(1, 0x334466).setInteractive({ useHandCursor: true });
            const lbl = this.add.text(bx, by - 8, label, {
                fontSize: '14px', color: '#aabbcc', fontFamily: 'monospace', fontStyle: 'bold'
            }).setOrigin(0.5);
            const dsc = this.add.text(bx, by + 10, desc, {
                fontSize: '11px', color: '#556677', fontFamily: 'monospace'
            }).setOrigin(0.5);
            bg.on('pointerdown', () => this._selectBonus(id));
            bg.on('pointerover', () => { if (this.selectedBonus !== id) bg.setFillStyle(0x1a1a33); });
            bg.on('pointerout',  () => { if (this.selectedBonus !== id) bg.setFillStyle(0x111122); });
            this._bonusBtns[id] = { bg, lbl, dsc, col };
        });

        // Start button
        const startBtn = this.add.text(W - 210, botY + barH / 2, '[ START EVENTYR ]', {
            fontSize: '24px', color: '#00e87a', fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        startBtn.on('pointerover', () => startBtn.setAlpha(0.7));
        startBtn.on('pointerout',  () => startBtn.setAlpha(1));
        startBtn.on('pointerdown', () => this._startGame());
        this.tweens.add({ targets: startBtn, alpha: 0.5, duration: 700, yoyo: true, repeat: -1 });
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

    // ── Keyboard + Mobile name input ─────────────────────────────────────────

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

    _openMobileNameInput() {
        let inp = document.getElementById('_heroNameInput');
        if (!inp) {
            inp = document.createElement('input');
            inp.id = '_heroNameInput';
            inp.type = 'text';
            inp.maxLength = 14;
            inp.autocomplete = 'off';
            inp.style.cssText = 'position:fixed;top:40%;left:50%;transform:translate(-50%,-50%);' +
                'font-size:20px;font-family:monospace;padding:10px 16px;width:280px;' +
                'background:#1a1830;color:#ffffff;border:2px solid #4444aa;border-radius:6px;' +
                'text-align:center;z-index:9999;outline:none;';
            document.body.appendChild(inp);
            inp.addEventListener('input', () => {
                this.heroName = inp.value.slice(0, 14);
                this._nameTxt.setText(this.heroName + '|');
            });
            inp.addEventListener('blur', () => {
                this.heroName = inp.value.slice(0, 14);
                this._nameTxt.setText(this.heroName + (this._cursor ? '|' : ' '));
                inp.remove();
            });
            inp.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { inp.blur(); }
            });
        }
        inp.value = this.heroName;
        inp.focus();
    }

    // ── Start game ───────────────────────────────────────────────────────────

    _startGame() {
        const inp = document.getElementById('_heroNameInput');
        if (inp) inp.remove();
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
