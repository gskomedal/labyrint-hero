// ─── Labyrint Hero – SettingsScene (audio settings overlay) ─────────────────

class SettingsScene extends Phaser.Scene {
    constructor() { super({ key: 'SettingsScene' }); }

    create() {
        const W = this.cameras.main.width;
        const H = this.cameras.main.height;
        this._closed = false;

        // ── Dim background ───────────────────────────────────────────────────
        const dim = this.add.graphics();
        dim.fillStyle(0x000000, 0.72);
        dim.fillRect(0, 0, W, H);

        // ── Panel ────────────────────────────────────────────────────────────
        const PW = 320, PH = 260;
        const PX = (W - PW) / 2, PY = (H - PH) / 2;

        const panel = this.add.graphics();
        panel.fillStyle(0x0d0b1e, 0.97);
        panel.fillRoundedRect(PX, PY, PW, PH, 8);
        panel.lineStyle(2, 0x334466, 1);
        panel.strokeRoundedRect(PX, PY, PW, PH, 8);

        const ts = (sz, col = '#aabbdd') => ({ fontSize: sz + 'px', color: col, fontFamily: 'monospace' });

        this.add.text(PX + PW / 2, PY + 18, '⚙  Innstillinger', ts(15, '#88bbff')).setOrigin(0.5, 0);

        // ── Rows ─────────────────────────────────────────────────────────────
        const rowY = [PY + 52, PY + 104, PY + 148, PY + 192];

        // Row 0 – Music on/off
        this.add.text(PX + 20, rowY[0], 'Musikk', ts(12)).setOrigin(0, 0.5).setY(rowY[0] + 8);
        this._btnMusic = this._makeToggle(PX + 210, rowY[0] + 8, Audio.musicEnabled, (v) => {
            Audio.setMusicEnabled(v);
        });

        // Row 1 – Music volume slider
        this.add.text(PX + 20, rowY[1], 'Musikk-volum', ts(11, '#778899')).setOrigin(0, 0).setY(rowY[1]);
        this._sliderMusic = this._makeSlider(PX + 20, rowY[1] + 20, PW - 40, Audio.musicVol, (v) => {
            Audio.setMusicVol(v);
        });

        // Row 2 – SFX on/off
        this.add.text(PX + 20, rowY[2], 'Lydeffekter', ts(12)).setOrigin(0, 0.5).setY(rowY[2] + 8);
        this._btnSfx = this._makeToggle(PX + 210, rowY[2] + 8, Audio.sfxEnabled, (v) => {
            Audio.setSfxEnabled(v);
        });

        // Row 3 – SFX volume slider
        this.add.text(PX + 20, rowY[3], 'SFX-volum', ts(11, '#778899')).setOrigin(0, 0).setY(rowY[3]);
        this._sliderSfx = this._makeSlider(PX + 20, rowY[3] + 20, PW - 40, Audio.sfxVol, (v) => {
            Audio.setSfxVol(v);
            Audio.playPickup(); // preview
        });

        // ── Close button ─────────────────────────────────────────────────────
        const closeBtn = this.add.text(PX + PW / 2, PY + PH - 22, '✕  Lukk', ts(12, '#88aacc'))
            .setOrigin(0.5, 1)
            .setInteractive({ useHandCursor: true });
        closeBtn.on('pointerover', () => closeBtn.setColor('#ffffff'));
        closeBtn.on('pointerout',  () => closeBtn.setColor('#88aacc'));
        closeBtn.on('pointerdown', () => this._close());

        // ── Keyboard close ───────────────────────────────────────────────────
        this.input.keyboard.on('keydown-ESC',      () => this._close());
        this.input.keyboard.on('keydown-BACKSPACE', () => this._close());
    }

    // ── Toggle button (on/off) ────────────────────────────────────────────────
    _makeToggle(x, y, initial, onChange) {
        let state = initial;

        const btn = this.add.graphics();
        const label = this.add.text(x + 44, y, '', { fontSize: '11px', color: '#aabbdd', fontFamily: 'monospace' })
            .setOrigin(0, 0.5);

        const draw = () => {
            btn.clear();
            btn.fillStyle(state ? 0x226622 : 0x441122, 1);
            btn.fillRoundedRect(x, y - 10, 40, 20, 10);
            btn.fillStyle(0xffffff, 0.9);
            btn.fillCircle(state ? x + 30 : x + 10, y, 8);
            label.setText(state ? 'PÅ' : 'AV');
            label.setColor(state ? '#44ee88' : '#ff5566');
        };
        draw();

        const zone = this.add.zone(x + 20, y, 70, 28).setInteractive({ useHandCursor: true });
        zone.on('pointerdown', () => {
            state = !state;
            draw();
            onChange(state);
        });

        return { get: () => state, set: (v) => { state = v; draw(); } };
    }

    // ── Volume slider ─────────────────────────────────────────────────────────
    _makeSlider(x, y, width, initial, onChange) {
        let value = initial;

        const track = this.add.graphics();
        const knob  = this.add.graphics();
        const vText = this.add.text(x + width + 8, y + 6, '', { fontSize: '10px', color: '#667799', fontFamily: 'monospace' })
            .setOrigin(0, 0.5);

        const draw = () => {
            track.clear();
            track.fillStyle(0x1a1a2e);
            track.fillRoundedRect(x, y, width, 12, 6);
            track.fillStyle(0x2255aa, 0.9);
            track.fillRoundedRect(x, y, Math.round(width * value), 12, 6);
            knob.clear();
            knob.fillStyle(0xaabbff);
            knob.fillCircle(x + Math.round(width * value), y + 6, 8);
            vText.setText(Math.round(value * 100) + '%');
        };
        draw();

        // Drag
        const zone = this.add.zone(x + width / 2, y + 6, width + 16, 24).setInteractive({ useHandCursor: true, draggable: true });
        this.input.setDraggable(zone);

        zone.on('pointerdown', (ptr) => {
            value = Math.max(0, Math.min(1, (ptr.x - x) / width));
            draw();
            onChange(value);
        });
        zone.on('drag', (ptr) => {
            value = Math.max(0, Math.min(1, (ptr.x - x) / width));
            draw();
            onChange(value);
        });

        return { get: () => value };
    }

    _close() {
        if (this._closed) return;
        this._closed = true;
        this.scene.stop('SettingsScene');
    }
}
