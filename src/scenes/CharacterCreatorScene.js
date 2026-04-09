// ─── Labyrint Hero – CharacterCreatorScene ────────────────────────────────────

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
        this.add.text(cx, 22, 'VELG DIN HELT', {
            fontSize: '28px', color: '#f5e642', fontFamily: 'monospace',
            fontStyle: 'bold', stroke: '#7a6a00', strokeThickness: 3
        }).setOrigin(0.5, 0);

        // ── Difficulty display ────────────────────────────────────────────────
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

    // ── Difficulty row ────────────────────────────────────────────────────────

    _buildDifficultyRow(cx, W) {
        this.add.rectangle(cx, 52, W - 40, 1, 0x1a1535);
        this.add.text(30, 64, 'VANSKELIGHETSGRAD:', {
            fontSize: '13px', color: '#445566', fontFamily: 'monospace'
        });

        const DIFFS = [
            { id: 'easy',   label: 'LETT',     col: 0x44bb44 },
            { id: 'normal', label: 'NORMAL',   col: 0x4488ff },
            { id: 'hard',   label: 'VANSK.',   col: 0xff4444 },
        ];
        this._diffBtns = {};
        DIFFS.forEach(({ id, label, col }, i) => {
            const bx  = 220 + i * 120;
            const bg  = this.add.rectangle(bx, 66, 105, 24, 0x111122)
                .setStrokeStyle(1, 0x334466).setInteractive({ useHandCursor: true });
            const txt = this.add.text(bx, 66, label, {
                fontSize: '14px', color: '#889aaa', fontFamily: 'monospace'
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
        const panelX = 30;
        const races  = Object.keys(RACE_DEFS);
        const btnW   = 120, btnH = 38;

        this._raceBtns = {};
        this.add.rectangle(panelX + races.length * (btnW + 8) / 2, 90, W / 2, 1, 0x1a1535);
        races.forEach((id, i) => {
            const bx  = panelX + i * (btnW + 8) + btnW / 2;
            const btn = this._raceTab(bx, 108, btnW, btnH, RACE_DEFS[id].name, id);
            this._raceBtns[id] = btn;
        });

        this._statsY    = 140;
        this._statsObjs = [];
        this._rebuildStats();
    }

    _raceTab(x, y, w, h, label, raceId) {
        const bg  = this.add.rectangle(x, y, w, h, 0x1a1535).setStrokeStyle(1, 0x4444aa).setInteractive({ useHandCursor: true });
        const txt = this.add.text(x, y, label, { fontSize: '15px', color: '#cccccc', fontFamily: 'monospace' }).setOrigin(0.5);
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
        const lx  = 34;

        add(this.add.text(lx, y0, def.desc, { fontSize: '13px', color: '#8899bb', fontFamily: 'monospace', wordWrap: { width: 480 } }));
        add(this.add.text(lx, y0 + 20, `Spesial: ${def.special}`, { fontSize: '13px', color: '#f5e642', fontFamily: 'monospace' }));

        const stats = [
            { label: 'Hjerter',  val: def.hearts,       max: 8,  col: 0xff2244 },
            { label: 'Angrep',   val: def.attack,        max: 6,  col: 0xff8800 },
            { label: 'Forsvar',  val: def.defense,       max: 4,  col: 0x4488ff },
            { label: 'Syn',      val: def.visionRadius,  max: 8,  col: 0xffee00 },
            { label: 'XP-mult',  val: def.xpMultiplier,  max: 2,  col: 0xaa44ff }
        ];
        const barX = lx, bw = 220, bh = 12, gap = 24;
        stats.forEach(({ label, val, max, col }, i) => {
            const y = y0 + 46 + i * gap;
            add(this.add.text(barX, y, label, { fontSize: '13px', color: '#556677', fontFamily: 'monospace' }));
            const bg = add(this.add.graphics());
            bg.fillStyle(0x1a1535);
            bg.fillRect(barX + 80, y + 2, bw, bh);
            const fill = add(this.add.graphics());
            fill.fillStyle(col);
            fill.fillRect(barX + 80, y + 2, Math.floor(bw * (val / max)), bh);
            const valStr = label === 'XP-mult' ? `×${val.toFixed(2)}` : String(val);
            add(this.add.text(barX + 80 + bw + 8, y, valStr, { fontSize: '13px', color: '#aabbcc', fontFamily: 'monospace' }));
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
        const px = W - 420, py = 140;
        const add = o => { this._appearObjs.push(o); return o; };

        add(this.add.text(px, py, 'UTSEENDE', { fontSize: '13px', color: '#445566', fontFamily: 'monospace' }));

        // ── Gender row ────────────────────────────────────────────────────────
        let rowY = py + 24;
        add(this.add.text(px, rowY, 'Kjønn:', { fontSize: '13px', color: '#667788', fontFamily: 'monospace' }));
        GENDERS.forEach((gid, i) => {
            const bx  = px + 70 + i * 80;
            const sel = this.appearance.gender === gid;
            const bg  = this.add.rectangle(bx + 28, rowY + 8, 70, 22, sel ? 0x2a2060 : 0x111122)
                .setStrokeStyle(1, sel ? 0xf5e642 : 0x334455).setInteractive({ useHandCursor: true });
            const txt = this.add.text(bx + 28, rowY + 8, GENDER_LABELS[gid], {
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
            add(bg);
            add(txt);
        });

        // ── Skin tone row ─────────────────────────────────────────────────────
        rowY += 32;
        add(this.add.text(px, rowY, 'Hud:', { fontSize: '13px', color: '#667788', fontFamily: 'monospace' }));
        SKIN_TONES.forEach((col, i) => {
            const btn = this._colorDot(px + 52 + i * 30, rowY + 7, col, this.appearance.skinColor === col);
            btn.on('pointerdown', () => { this._customOverrides.skinColor = col; this.appearance.skinColor = col; this._rebuildPreview(); this._rebuildAppearancePickers(); });
            add(btn);
        });

        // ── Hair color row ────────────────────────────────────────────────────
        rowY += 32;
        add(this.add.text(px, rowY, 'Hår:', { fontSize: '13px', color: '#667788', fontFamily: 'monospace' }));
        HAIR_COLORS.forEach((col, i) => {
            const btn = this._colorDot(px + 52 + i * 28, rowY + 7, col, this.appearance.hairColor === col);
            btn.on('pointerdown', () => { this._customOverrides.hairColor = col; this.appearance.hairColor = col; this._rebuildPreview(); this._rebuildAppearancePickers(); });
            add(btn);
        });

        // ── Eye color row ─────────────────────────────────────────────────────
        rowY += 32;
        add(this.add.text(px, rowY, 'Øyne:', { fontSize: '13px', color: '#667788', fontFamily: 'monospace' }));
        EYE_COLORS.forEach((col, i) => {
            const btn = this._colorDot(px + 60 + i * 30, rowY + 7, col, this.appearance.eyeColor === col);
            btn.on('pointerdown', () => { this._customOverrides.eyeColor = col; this.appearance.eyeColor = col; this._rebuildPreview(); this._rebuildAppearancePickers(); });
            add(btn);
        });

        // ── Cloth color row ───────────────────────────────────────────────────
        rowY += 32;
        add(this.add.text(px, rowY, 'Farge:', { fontSize: '13px', color: '#667788', fontFamily: 'monospace' }));
        CLOTH_COLORS.forEach((col, i) => {
            const btn = this._colorDot(px + 60 + i * 26, rowY + 7, col, this.appearance.clothColor === col);
            btn.on('pointerdown', () => { this._customOverrides.clothColor = col; this.appearance.clothColor = col; this._rebuildPreview(); this._rebuildAppearancePickers(); });
            add(btn);
        });

        // ── Clothing style row ────────────────────────────────────────────────
        rowY += 32;
        add(this.add.text(px, rowY, 'Drakt:', { fontSize: '13px', color: '#667788', fontFamily: 'monospace' }));
        CLOTH_STYLES.forEach((style, i) => {
            const bx  = px + 60 + i * 68;
            const sel = this.appearance.clothStyle === style;
            const bg  = this.add.rectangle(bx + 26, rowY + 8, 60, 22, sel ? 0x2a2060 : 0x111122)
                .setStrokeStyle(1, sel ? 0xf5e642 : 0x334455).setInteractive({ useHandCursor: true });
            const txt = this.add.text(bx + 26, rowY + 8, CLOTH_STYLE_LABELS[style], {
                fontSize: '11px', color: sel ? '#f5e642' : '#778899', fontFamily: 'monospace'
            }).setOrigin(0.5);
            bg.on('pointerdown', () => {
                this._customOverrides.clothStyle = style;
                this.appearance.clothStyle = style;
                this._rebuildPreview();
                this._rebuildAppearancePickers();
            });
            add(bg);
            add(txt);
        });

        // ── Hair style row (not for dwarf) ────────────────────────────────────
        if (this.selectedRace !== 'dwarf') {
            rowY += 32;
            add(this.add.text(px, rowY, 'Frisyre:', { fontSize: '13px', color: '#667788', fontFamily: 'monospace' }));
            const stylesPerRow = 5;
            HAIR_STYLES.forEach((style, i) => {
                const row = Math.floor(i / stylesPerRow);
                const col = i % stylesPerRow;
                const bx  = px + 70 + col * 62;
                const by  = rowY + 8 + row * 28;
                const sel = this.appearance.hairStyle === style;
                const bg  = this.add.rectangle(bx + 24, by, 56, 22, sel ? 0x2a2060 : 0x111122)
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
                add(bg);
                add(txt);
            });
            rowY += Math.ceil(HAIR_STYLES.length / stylesPerRow) * 28;
        }

        // ── Beard style row (male human / dwarf only) ─────────────────────────
        const showBeard = (this.selectedRace === 'human' || this.selectedRace === 'dwarf') &&
                          this.appearance.gender !== 'female';
        if (showBeard) {
            rowY += 6;
            add(this.add.text(px, rowY, 'Skjegg:', { fontSize: '13px', color: '#667788', fontFamily: 'monospace' }));
            BEARD_STYLES.forEach((style, i) => {
                const bx  = px + 70 + i * 70;
                const sel = this.appearance.beardStyle === style;
                const bg  = this.add.rectangle(bx + 24, rowY + 8, 62, 22, sel ? 0x2a2060 : 0x111122)
                    .setStrokeStyle(1, sel ? 0xf5e642 : 0x334455).setInteractive({ useHandCursor: true });
                const txt = this.add.text(bx + 24, rowY + 8, BEARD_STYLE_LABELS[style], {
                    fontSize: '11px', color: sel ? '#f5e642' : '#778899', fontFamily: 'monospace'
                }).setOrigin(0.5);
                bg.on('pointerdown', () => {
                    this._customOverrides.beardStyle = style;
                    this.appearance.beardStyle = style;
                    this._rebuildPreview();
                    this._rebuildAppearancePickers();
                });
                add(bg);
                add(txt);
            });
        }

        this._rebuildPreview();
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

    _rebuildPreview() {
        const { width: W, height: H } = this.cameras.main;
        const g = this._previewGfx;
        g.clear();

        const previewSize = 256;
        const px = W - 160;
        const py = H - 380;

        // Preview box background
        g.fillStyle(0x0d0b1e, 0.95);
        g.fillRoundedRect(px - previewSize / 2 - 8, py - 8, previewSize + 16, previewSize + 16, 6);
        g.lineStyle(2, 0x4444aa, 0.6);
        g.strokeRoundedRect(px - previewSize / 2 - 8, py - 8, previewSize + 16, previewSize + 16, 6);
        g.lineStyle(1, 0x2a2050, 0.4);
        g.strokeRoundedRect(px - previewSize / 2 - 4, py - 4, previewSize + 8, previewSize + 8, 4);

        // Floor tile hint
        g.fillStyle(0x1e1a30);
        g.fillRect(px - previewSize / 2 - 3, py + previewSize - 20, previewSize + 6, 23);

        // Draw the detailed character sprite
        if (typeof drawDetailedCharacterSprite === 'function') {
            drawDetailedCharacterSprite(g, px - previewSize / 2, py, previewSize, this.appearance, this.selectedRace);
        } else {
            drawCharacterSprite(g, px - previewSize / 2, py, previewSize, this.appearance, this.selectedRace);
        }
    }

    // ── Starting bonus panel ──────────────────────────────────────────────────

    _buildBonusPanel(W, H) {
        const lx = 34, by = this._statsY + 180;

        this.add.rectangle(W / 4, by - 8, W / 2 - 20, 1, 0x1a1535);
        this.add.text(lx, by, 'STARTBONUS  (velg én)', {
            fontSize: '13px', color: '#445566', fontFamily: 'monospace'
        });

        this._bonusBtns = {};
        START_BONUSES.forEach(({ id, label, desc, col }, i) => {
            const bx  = lx + i * 170 + 72;
            const bg  = this.add.rectangle(bx, by + 32, 155, 40, 0x111122)
                .setStrokeStyle(1, 0x334466).setInteractive({ useHandCursor: true });
            const lbl = this.add.text(bx, by + 25, label, {
                fontSize: '14px', color: '#aabbcc', fontFamily: 'monospace', fontStyle: 'bold'
            }).setOrigin(0.5);
            const dsc = this.add.text(bx, by + 40, desc, {
                fontSize: '11px', color: '#556677', fontFamily: 'monospace'
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
        const nameY = H - 100;
        this.add.rectangle(cx, nameY, W - 40, 1, 0x1a1535);
        this.add.text(34, nameY + 18, 'Navn:', { fontSize: '15px', color: '#667788', fontFamily: 'monospace' }).setOrigin(0, 0.5);

        this._nameBg  = this.add.rectangle(cx + 40, nameY + 18, 280, 34, 0x1a1830).setStrokeStyle(1, 0x4444aa);
        this._nameTxt = this.add.text(cx + 40, nameY + 18, '|', { fontSize: '18px', color: '#ffffff', fontFamily: 'monospace' }).setOrigin(0.5);

        this._nameBg.setInteractive({ useHandCursor: true });
        this._nameBg.on('pointerdown', () => this._openMobileNameInput());

        this._cursor = true;
        this.time.addEvent({ delay: 500, loop: true, callback: () => {
            this._cursor = !this._cursor;
            this._nameTxt.setText((this.heroName || '') + (this._cursor ? '|' : ' '));
        }});

        const startBtn = this.add.text(cx, H - 40, '[ START EVENTYR ]', {
            fontSize: '26px', color: '#00e87a', fontFamily: 'monospace'
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
