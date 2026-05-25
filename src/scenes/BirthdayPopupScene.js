// ─── Labyrint Hero – BirthdayPopupScene ──────────────────────────────────────
// Modal congratulations overlay shown to the birthday hero at the start of a
// new game (see GameScene._celebrateBirthday). Dismissed via the OK button,
// clicking outside the panel, ESC, SPACE or ENTER.

class BirthdayPopupScene extends Phaser.Scene {
    constructor() { super({ key: 'BirthdayPopupScene' }); }

    create() {
        const { width: W, height: H } = this.cameras.main;
        const cx = W / 2, cy = H / 2;

        // ── Dim backdrop (click-outside dismisses) ────────────────────────────
        this.add.rectangle(cx, cy, W, H, 0x000000, 0.82)
            .setInteractive()
            .on('pointerdown', () => this._close());

        // ── Panel ─────────────────────────────────────────────────────────────
        const panelW = Math.min(W - 80, 620);
        const panelH = 320;
        const px = cx - panelW / 2;
        const py = cy - panelH / 2;

        // Block click-through inside the panel
        this.add.rectangle(cx, cy, panelW, panelH, 0x000000, 0.001)
            .setInteractive()
            .on('pointerdown', (p, _x, _y, ev) => ev.stopPropagation());

        const panel = this.add.graphics();
        panel.fillStyle(0x140a22, 0.98);
        panel.fillRoundedRect(px, py, panelW, panelH, 12);
        panel.lineStyle(3, 0xffcc33);
        panel.strokeRoundedRect(px, py, panelW, panelH, 12);
        panel.lineStyle(1, 0xff66cc, 0.6);
        panel.strokeRoundedRect(px + 8, py + 8, panelW - 16, panelH - 16, 10);

        // ── Title ─────────────────────────────────────────────────────────────
        this.add.text(cx, py + 48, '🎂 GRATULERER MED DAGEN HENRIK! 🎉', {
            fontSize: '21px', color: '#ffdd33', fontFamily: 'monospace',
            fontStyle: 'bold', stroke: '#5a3a00', strokeThickness: 3
        }).setOrigin(0.5);

        // ── Body ──────────────────────────────────────────────────────────────
        this.add.text(cx, py + 140,
            'Gratulerer så mye med dagen! Her har du litt ekstra ' +
            'utstyr og liv for å hjelpe deg på veien med jakten på ' +
            'nye mineraler og grunnstoff :)',
            {
                fontSize: '16px', color: '#ece2ff', fontFamily: 'monospace',
                align: 'center', wordWrap: { width: panelW - 80 }, lineSpacing: 8
            }
        ).setOrigin(0.5);

        // ── OK button ─────────────────────────────────────────────────────────
        const btnY = py + panelH - 46;
        const btnBg = this.add.rectangle(cx, btnY, 200, 46, 0xff66cc)
            .setStrokeStyle(2, 0xffcc33)
            .setInteractive({ useHandCursor: true });
        const btnTxt = this.add.text(cx, btnY, 'PÅ EVENTYR!', {
            fontSize: '18px', color: '#1a0a14', fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0.5);
        btnBg.on('pointerover', () => btnBg.setFillStyle(0xff88dd));
        btnBg.on('pointerout',  () => btnBg.setFillStyle(0xff66cc));
        btnBg.on('pointerdown', (p, _x, _y, ev) => { ev.stopPropagation(); this._close(); });
        btnTxt.setInteractive({ useHandCursor: true })
            .on('pointerdown', (p, _x, _y, ev) => { ev.stopPropagation(); this._close(); });

        // ── Keyboard dismissal ────────────────────────────────────────────────
        this.input.keyboard.on('keydown-ESC',   () => this._close());
        this.input.keyboard.on('keydown-SPACE', () => this._close());
        this.input.keyboard.on('keydown-ENTER', () => this._close());

        // ── Gentle pop-in animation ───────────────────────────────────────────
        this.cameras.main.fadeIn(180, 0, 0, 0);
    }

    _close() {
        this.scene.stop();
    }
}
