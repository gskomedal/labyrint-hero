// ─── Labyrint Hero – MenuScene ────────────────────────────────────────────────

class MenuScene extends Phaser.Scene {
    constructor() { super({ key: 'MenuScene' }); }

    create() {
        const { width: W, height: H } = this.cameras.main;
        const cx = W / 2, cy = H / 2;

        this.selectedDifficulty = 'normal';

        // ── Background ────────────────────────────────────────────────────────
        this.add.rectangle(cx, cy, W, H, 0x0a0814);
        this.add.rectangle(cx, H * 0.22, W, H * 0.44, 0x110f22, 0.6);

        const g = this.add.graphics();
        g.fillStyle(0x2a1a4a, 0.5);
        [[0,0],[W-64,0],[0,H-64],[W-64,H-64]].forEach(([x,y]) => g.fillRect(x,y,64,64));

        // ── Corner runes (decorative) ─────────────────────────────────────────
        const runes = this.add.graphics();
        runes.lineStyle(1, 0x2a1a4a, 0.7);
        [[12,12],[W-12,12],[12,H-12],[W-12,H-12]].forEach(([rx,ry]) => {
            runes.strokeRect(rx-8, ry-8, 16, 16);
            runes.fillStyle(0x2a1a4a, 0.5);
            runes.fillRect(rx-2, ry-8, 4, 16);
            runes.fillRect(rx-8, ry-2, 16, 4);
        });

        // ── Title ─────────────────────────────────────────────────────────────
        this.add.text(cx, cy - 155, 'LABYRINT', {
            fontSize: '52px', color: '#f5e642', fontFamily: 'monospace',
            fontStyle: 'bold', stroke: '#7a6a00', strokeThickness: 5
        }).setOrigin(0.5);

        this.add.text(cx, cy - 97, 'H  E  R  O', {
            fontSize: '28px', color: '#cccccc', fontFamily: 'monospace',
            stroke: '#333333', strokeThickness: 2
        }).setOrigin(0.5);

        this.add.rectangle(cx, cy - 67, 320, 1, 0x333355);

        // ── Difficulty selector (main menu – prominent) ────────────────────────
        this._buildDifficultyPanel(cx, cy);

        // ── Action buttons ────────────────────────────────────────────────────
        const saved = SaveManager.load();

        if (saved) {
            const name = (saved.heroStats?.heroName) || 'Helten';
            const race = (saved.heroStats?.race)    || 'human';
            const lvl  = saved.heroStats?.level || 1;
            const victoryDone = saved.heroStats?.victoryAchieved;
            const ngPlus = saved.heroStats?.ngPlusLevel || 0;
            const badge = victoryDone
                ? (ngPlus > 0 ? `✦ Guds periodiske system NG+${ngPlus}  ·  ` : '✦ Guds periodiske system  ·  ')
                : '';
            this.add.text(cx, cy + 28, `${badge}${name}  ·  Verden ${saved.worldNum}  ·  Nivå ${lvl}`, {
                fontSize: '15px', color: victoryDone ? '#f5e642' : '#667788', fontFamily: 'monospace'
            }).setOrigin(0.5);

            const cont = this._btn(cx, cy + 58, '[ FORTSETT ]', '#00e87a', 22);
            cont.on('pointerdown', () =>
                this.scene.start('GameScene', {
                    worldNum:   saved.worldNum,
                    heroStats:  saved.heroStats,
                    difficulty: this.selectedDifficulty
                })
            );
            this.tweens.add({ targets: cont, alpha: 0.45, duration: 750, yoyo: true, repeat: -1 });

            const newG = this._btn(cx, cy + 98, '[ NYTT SPILL ]', '#ff8844', 16);
            newG.on('pointerdown', () => {
                SaveManager.clear();
                this.scene.start('CharacterCreatorScene', { difficulty: this.selectedDifficulty });
            });
        } else {
            const start = this._btn(cx, cy + 58, '[ START EVENTYR ]', '#00e87a', 24);
            start.on('pointerdown', () =>
                this.scene.start('CharacterCreatorScene', { difficulty: this.selectedDifficulty })
            );
            this.tweens.add({ targets: start, alpha: 0.45, duration: 750, yoyo: true, repeat: -1 });
        }

        // ── Leaderboard button ────────────────────────────────────────────────
        const lbBtn = this._btn(cx, cy + 175, '[ LEDERTAVLE ]', '#8899bb', 14);
        lbBtn.on('pointerdown', () => this.scene.start('LeaderboardScene'));

        // ── Footer tips ───────────────────────────────────────────────────────
        const ts = { fontSize: '13px', color: '#445566', fontFamily: 'monospace' };
        this.add.text(cx, H - 50, 'WASD/Piltaster: Beveg  ·  SPACE/F: Angrep  ·  R: Pil  ·  E: Inventar  ·  M: Kart', ts).setOrigin(0.5);
        this.add.text(cx, H - 30, 'Beseir bossen for å gå videre til neste verden', ts).setOrigin(0.5);

        // Version
        this.add.text(8, H - 16, 'v0.9', { fontSize: '12px', color: '#222244', fontFamily: 'monospace' });
    }

    // ── Difficulty panel ──────────────────────────────────────────────────────

    _buildDifficultyPanel(cx, cy) {
        // Label
        this.add.text(cx, cy - 54, 'VANSKELIGHETSGRAD', {
            fontSize: '13px', color: '#445566', fontFamily: 'monospace'
        }).setOrigin(0.5);

        const DIFFS = [
            { id: 'easy',   label: 'LETT',      hint: 'Svakere monstre · mer XP · ingen feller tidlig',   col: 0x44bb44 },
            { id: 'normal', label: 'NORMAL',     hint: 'Balansert utfordring – anbefalt for nye spillere',  col: 0x4488ff },
            { id: 'hard',   label: 'VANSKELIG',  hint: 'Sterkere monstre · mange feller · lite XP',        col: 0xff4444 },
        ];

        this._diffBtns  = {};
        this._diffHints = {};

        const btnW = 136, btnH = 34, gap = 8;
        const totalW = DIFFS.length * btnW + (DIFFS.length - 1) * gap;
        DIFFS.forEach(({ id, label, hint, col }, i) => {
            const bx = cx - totalW / 2 + i * (btnW + gap) + btnW / 2;
            const by = cy - 28;

            const bg = this.add.rectangle(bx, by, btnW, btnH, 0x111122)
                .setStrokeStyle(1, 0x334466)
                .setInteractive({ useHandCursor: true });
            const txt = this.add.text(bx, by, label, {
                fontSize: '15px', color: '#aaaacc', fontFamily: 'monospace', fontStyle: 'bold'
            }).setOrigin(0.5);
            bg.on('pointerdown', () => this._selectDifficulty(id));
            bg.on('pointerover',  () => { if (this.selectedDifficulty !== id) bg.setFillStyle(0x1a1a33); });
            bg.on('pointerout',   () => { if (this.selectedDifficulty !== id) bg.setFillStyle(0x111122); });
            this._diffBtns[id]  = { bg, txt, col };
            this._diffHints[id] = hint;
        });

        this._diffHintText = this.add.text(cx, cy - 5, '', {
            fontSize: '12px', color: '#556677', fontFamily: 'monospace'
        }).setOrigin(0.5);

        this._selectDifficulty('normal');
    }

    _selectDifficulty(id) {
        this.selectedDifficulty = id;
        for (const [did, { bg, txt, col }] of Object.entries(this._diffBtns)) {
            const sel = did === id;
            bg.setFillStyle(sel ? 0x0e1a26 : 0x111122);
            bg.setStrokeStyle(sel ? 2 : 1, sel ? col : 0x334466);
            txt.setColor(sel ? `#${col.toString(16).padStart(6, '0')}` : '#778899');
        }
        this._diffHintText?.setText(this._diffHints[id] || '');
    }

    _btn(x, y, label, color, size) {
        const btn = this.add.text(x, y, label, {
            fontSize: `${size}px`, color, fontFamily: 'monospace'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        btn.on('pointerover', () => btn.setAlpha(0.7));
        btn.on('pointerout',  () => btn.setAlpha(1));
        return btn;
    }
}
