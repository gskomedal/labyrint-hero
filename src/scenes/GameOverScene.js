// ─── Labyrint Hero – GameOverScene ───────────────────────────────────────────

class GameOverScene extends Phaser.Scene {
    constructor() { super({ key: 'GameOverScene' }); }

    init(data) {
        this.type       = data.type;
        this.worldNum   = data.worldNum;
        this.heroStats  = data.heroStats;
        this.difficulty = data.difficulty || 'normal';
    }

    create() {
        const { width: W, height: H } = this.cameras.main;
        const cx = W / 2, cy = H / 2;

        this.add.rectangle(cx, cy, W, H, 0x08060f);

        if (this.type === 'death') {
            this._deathScreen(cx, cy, W, H);
        } else {
            this._victoryScreen(cx, cy, W, H);
        }
    }

    // ── Death screen ──────────────────────────────────────────────────────────

    _deathScreen(cx, cy, W, H) {
        // Red vignette
        const g = this.add.graphics();
        g.fillStyle(0x330000, 0.4);
        g.fillRect(0, 0, W, H);

        this.add.text(cx, cy - 110, 'DU FALT', {
            fontSize: '56px', color: '#ff2244', fontFamily: 'monospace',
            fontStyle: 'bold', stroke: '#660011', strokeThickness: 5
        }).setOrigin(0.5);

        this.add.text(cx, cy - 48, `Verden ${this.worldNum}  ·  Nivå ${this.heroStats.level}`, {
            fontSize: '18px', color: '#ccaaaa', fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.add.text(cx, cy - 18, 'Du beholder nivå og stats. Verden genereres på nytt.', {
            fontSize: '12px', color: '#664444', fontFamily: 'monospace'
        }).setOrigin(0.5);

        this._statsPanel(cx, cy + 18);

        const retry = this._button(cx, cy + 90, '[ PRØV IGJEN ]', '#00e87a', 22);
        retry.on('pointerdown', () => {
            this.scene.start('GameScene', {
                worldNum:   this.worldNum,
                heroStats:  this.heroStats,
                difficulty: this.difficulty
            });
        });

        const menu = this._button(cx, cy + 140, '[ HOVED MENY ]', '#666688', 14);
        menu.on('pointerdown', () => this.scene.start('MenuScene'));

        this.tweens.add({ targets: retry, alpha: 0.5, duration: 650, yoyo: true, repeat: -1 });
    }

    // ── World complete screen ─────────────────────────────────────────────────

    _victoryScreen(cx, cy, W, H) {
        // Gold shimmer
        const g = this.add.graphics();
        g.fillStyle(0x221a00, 0.5);
        g.fillRect(0, 0, W, H);

        this.add.text(cx, cy - 110, '✦ VERDEN KLAR ✦', {
            fontSize: '40px', color: '#f5e642', fontFamily: 'monospace',
            fontStyle: 'bold', stroke: '#7a6a00', strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(cx, cy - 60, `Du fullførte Verden ${this.worldNum}!`, {
            fontSize: '20px', color: '#ffffff', fontFamily: 'monospace'
        }).setOrigin(0.5);

        this._statsPanel(cx, cy - 10);

        const nextW = this.worldNum + 1;
        const DIFF_LABEL = { easy: 'LETT', normal: 'NORMAL', hard: 'VANSKELIG' };
        const DIFF_COL   = { easy: '#44bb44', normal: '#4488ff', hard: '#ff4444' };
        this.add.text(cx, cy + 56, `Vanskelighetsgrad: ${DIFF_LABEL[this.difficulty] || 'NORMAL'}`, {
            fontSize: '12px', color: DIFF_COL[this.difficulty] || '#4488ff', fontFamily: 'monospace'
        }).setOrigin(0.5);

        const next  = this._button(cx, cy + 86, `[ VERDEN ${nextW} ]`, '#00e87a', 26);
        next.on('pointerdown', () => {
            this.scene.start('GameScene', {
                worldNum:   nextW,
                heroStats:  this.heroStats,
                difficulty: this.difficulty
            });
        });

        const menu = this._button(cx, cy + 136, '[ HOVED MENY ]', '#666688', 14);
        menu.on('pointerdown', () => this.scene.start('MenuScene'));

        this.tweens.add({ targets: next, alpha: 0.5, duration: 600, yoyo: true, repeat: -1 });
    }

    // ── Shared helpers ────────────────────────────────────────────────────────

    _statsPanel(cx, cy) {
        const s = this.heroStats;
        const lines = [
            `Hjerter: ${s.hearts}/${s.maxHearts}`,
            `Angrep: ${s.attack}  ·  Forsvar: ${s.defense}`,
            `XP: ${s.xp} / ${s.xpToNext}`
        ];
        lines.forEach((line, i) => {
            this.add.text(cx, cy + i * 18, line, {
                fontSize: '13px', color: '#8899bb', fontFamily: 'monospace'
            }).setOrigin(0.5);
        });
    }

    _button(x, y, label, color, size) {
        const btn = this.add.text(x, y, label, {
            fontSize: `${size}px`, color, fontFamily: 'monospace'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        btn.on('pointerover', () => btn.setAlpha(0.7));
        btn.on('pointerout',  () => btn.setAlpha(1));
        return btn;
    }
}
