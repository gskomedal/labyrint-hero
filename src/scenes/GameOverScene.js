// ─── Labyrint Hero – GameOverScene ───────────────────────────────────────────

class GameOverScene extends Phaser.Scene {
    constructor() { super({ key: 'GameOverScene' }); }

    init(data) {
        this.type           = data.type;
        this.worldNum       = data.worldNum;
        this.heroStats      = data.heroStats;
        this.difficulty     = data.difficulty || 'normal';
        this.monstersKilled = data.monstersKilled || 0;
        this.timeSeconds    = data.timeSeconds || 0;
    }

    create() {
        const { width: W, height: H } = this.cameras.main;
        const cx = W / 2, cy = H / 2;

        this.add.rectangle(cx, cy, W, H, 0x08060f);

        // Record to leaderboard only on world completion, not death (#58)
        if (this.type !== 'death') {
            const et = this.heroStats.elementTracker || {};
            const elementsDiscovered = et.discovered
                ? Object.keys(et.discovered).length : 0;
            const entry = {
                heroName:           this.heroStats.heroName || 'Helt',
                race:               this.heroStats.race || 'human',
                difficulty:         this.difficulty,
                worldsCleared:      this.worldNum,
                level:              this.heroStats.level || 1,
                monstersKilled:     this.monstersKilled,
                goldEarned:         this.heroStats.gold || 0,
                mineralsCollected:  this.heroStats.mineralsCollected || 0,
                elementsDiscovered: elementsDiscovered,
                result:             'worldComplete',
                timeSeconds:        this.heroStats.totalPlayTime || this.timeSeconds
            };
            Leaderboard.record(entry);

            // Submit to global leaderboard (fire-and-forget) (#64)
            if (typeof GlobalLeaderboard !== 'undefined') {
                GlobalLeaderboard.submitScore(entry);
            }
        }

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

        // Fast travel (if player has completed multiple zones)
        const completedZones = this.heroStats.completedZones || [];
        if (completedZones.length > 0 && typeof ZONES !== 'undefined') {
            const travelBtn = this._button(cx, cy + 126, '[ HURTIGREISE ]', '#44aadd', 14);
            travelBtn.on('pointerdown', () => this._showFastTravel(cx, cy));
        }

        const menuY = completedZones.length > 0 ? cy + 160 : cy + 136;
        const menu = this._button(cx, menuY, '[ HOVED MENY ]', '#666688', 14);
        menu.on('pointerdown', () => this.scene.start('MenuScene'));

        this.tweens.add({ targets: next, alpha: 0.5, duration: 600, yoyo: true, repeat: -1 });
    }

    _showFastTravel(cx, cy) {
        // Overlay panel
        if (this._ftPanel) return;
        const W = this.cameras.main.width;
        const H = this.cameras.main.height;
        const panel = this.add.graphics();
        panel.fillStyle(0x000000, 0.85);
        panel.fillRect(cx - 200, cy - 100, 400, 200);
        panel.lineStyle(2, 0x44aadd, 1);
        panel.strokeRect(cx - 200, cy - 100, 400, 200);
        this._ftPanel = panel;

        this.add.text(cx, cy - 80, 'Velg sone:', {
            fontSize: '16px', color: '#44aadd', fontFamily: 'monospace'
        }).setOrigin(0.5);

        const completedZones = this.heroStats.completedZones || [];
        let yOff = cy - 50;
        for (const zone of ZONES) {
            const completed = completedZones.includes(zone.id);
            const col = completed ? '#44ff88' : '#555566';
            const label = completed ? `▸ ${zone.name} (Verden ${zone.worlds[0]})` : `  ${zone.name} (låst)`;
            const btn = this.add.text(cx, yOff, label, {
                fontSize: '13px', color: col, fontFamily: 'monospace'
            }).setOrigin(0.5);
            if (completed) {
                btn.setInteractive({ useHandCursor: true });
                btn.on('pointerover', () => btn.setAlpha(0.7));
                btn.on('pointerout',  () => btn.setAlpha(1));
                btn.on('pointerdown', () => {
                    const startWorld = typeof getZoneStartWorld !== 'undefined' ? getZoneStartWorld(zone.id) : zone.worlds[0];
                    this.scene.start('GameScene', {
                        worldNum: startWorld,
                        heroStats: this.heroStats,
                        difficulty: this.difficulty
                    });
                });
            }
            yOff += 24;
        }
    }

    // ── Shared helpers ────────────────────────────────────────────────────────

    _formatTime(sec) {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${String(s).padStart(2, '0')}`;
    }

    _statsPanel(cx, cy) {
        const s = this.heroStats;
        const lines = [
            `Hjerter: ${s.hearts}/${s.maxHearts}`,
            `Angrep: ${s.attack}  ·  Forsvar: ${s.defense}`,
            `XP: ${s.xp} / ${s.xpToNext}`,
            `Tid: ${this._formatTime(this.timeSeconds)}`
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
