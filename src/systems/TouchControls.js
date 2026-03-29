// ─── Labyrint Hero – Touch Controls (d-pad + action buttons) ─────────────────

class TouchControls {
    constructor(scene) {
        this.scene = scene;
        this.game  = scene.game;
        this.widgets = [];
    }

    create() {
        if (!this.game.registry.get('isTouchDevice')) return;

        const reg = this.game.registry;
        reg.set('touch_dx', 0);
        reg.set('touch_dy', 0);
        reg.set('touch_attack', false);
        reg.set('touch_bow', false);
        reg.set('touch_inventory', false);
        reg.set('touch_minimap', false);

        this._createDpad();
        this._createActionButtons();
    }

    // ── D-Pad (bottom-left) ──────────────────────────────────────────────────

    _createDpad() {
        const sz   = 52;
        const gap  = 4;
        const baseX = 20 + sz + gap;
        const baseY = 640 - 20 - sz - gap;
        const alpha = 0.3;
        const pressAlpha = 0.65;

        const directions = [
            { label: '\u25B2', dx:  0, dy: -1, ox: 0,           oy: -(sz + gap) },
            { label: '\u25BC', dx:  0, dy:  1, ox: 0,           oy:  (sz + gap) },
            { label: '\u25C0', dx: -1, dy:  0, ox: -(sz + gap), oy: 0           },
            { label: '\u25B6', dx:  1, dy:  0, ox:  (sz + gap), oy: 0           },
        ];

        for (const dir of directions) {
            const x = baseX + dir.ox;
            const y = baseY + dir.oy;
            this._makeDpadButton(x, y, sz, dir.label, dir.dx, dir.dy, alpha, pressAlpha);
        }
    }

    _makeDpadButton(x, y, sz, label, dx, dy, alpha, pressAlpha) {
        const scene = this.scene;
        const reg   = this.game.registry;

        const bg = scene.add.graphics();
        bg.fillStyle(0x334466, alpha);
        bg.fillRoundedRect(x - sz / 2, y - sz / 2, sz, sz, 8);
        bg.lineStyle(1, 0x5577aa, alpha);
        bg.strokeRoundedRect(x - sz / 2, y - sz / 2, sz, sz, 8);
        bg.setDepth(100);

        const txt = scene.add.text(x, y, label, {
            fontSize: '22px', color: '#aabbdd', fontFamily: 'monospace'
        }).setOrigin(0.5).setDepth(101).setAlpha(alpha + 0.2);

        const zone = scene.add.zone(x, y, sz, sz).setInteractive().setDepth(102);

        zone.on('pointerdown', () => {
            reg.set('touch_dx', dx);
            reg.set('touch_dy', dy);
            bg.clear();
            bg.fillStyle(0x4466aa, pressAlpha);
            bg.fillRoundedRect(x - sz / 2, y - sz / 2, sz, sz, 8);
            bg.lineStyle(1, 0x6699cc, pressAlpha);
            bg.strokeRoundedRect(x - sz / 2, y - sz / 2, sz, sz, 8);
            txt.setAlpha(0.9);
        });

        const release = () => {
            reg.set('touch_dx', 0);
            reg.set('touch_dy', 0);
            bg.clear();
            bg.fillStyle(0x334466, alpha);
            bg.fillRoundedRect(x - sz / 2, y - sz / 2, sz, sz, 8);
            bg.lineStyle(1, 0x5577aa, alpha);
            bg.strokeRoundedRect(x - sz / 2, y - sz / 2, sz, sz, 8);
            txt.setAlpha(alpha + 0.2);
        };

        zone.on('pointerup', release);
        zone.on('pointerout', release);

        this.widgets.push(bg, txt, zone);
    }

    // ── Action Buttons (bottom-right) ────────────────────────────────────────

    _createActionButtons() {
        const sz   = 48;
        const gap  = 8;
        const baseX = 960 - 20 - sz;
        const baseY = 640 - 20 - sz;

        const buttons = [
            { label: '\u2694', key: 'touch_attack',    color: 0x883333, ox: 0,           oy: 0           },
            { label: '\u279B', key: 'touch_bow',       color: 0x886633, ox: -(sz + gap), oy: 0           },
            { label: '\u25A1', key: 'touch_inventory', color: 0x335588, ox: 0,           oy: -(sz + gap) },
            { label: 'M',     key: 'touch_minimap',   color: 0x338844, ox: -(sz + gap), oy: -(sz + gap) },
        ];

        for (const btn of buttons) {
            const x = baseX + btn.ox;
            const y = baseY + btn.oy;
            this._makeActionButton(x, y, sz, btn.label, btn.key, btn.color);
        }
    }

    _makeActionButton(x, y, sz, label, regKey, color) {
        const scene = this.scene;
        const reg   = this.game.registry;
        const alpha = 0.3;
        const pressAlpha = 0.65;

        const bg = scene.add.graphics();
        bg.fillStyle(color, alpha);
        bg.fillRoundedRect(x - sz / 2, y - sz / 2, sz, sz, 10);
        bg.lineStyle(1, color, alpha + 0.2);
        bg.strokeRoundedRect(x - sz / 2, y - sz / 2, sz, sz, 10);
        bg.setDepth(100);

        const txt = scene.add.text(x, y, label, {
            fontSize: '20px', color: '#ccccdd', fontFamily: 'monospace'
        }).setOrigin(0.5).setDepth(101).setAlpha(alpha + 0.2);

        const zone = scene.add.zone(x, y, sz, sz).setInteractive().setDepth(102);

        zone.on('pointerdown', () => {
            reg.set(regKey, true);
            bg.clear();
            bg.fillStyle(color, pressAlpha);
            bg.fillRoundedRect(x - sz / 2, y - sz / 2, sz, sz, 10);
            bg.lineStyle(1, color, pressAlpha + 0.2);
            bg.strokeRoundedRect(x - sz / 2, y - sz / 2, sz, sz, 10);
            txt.setAlpha(0.9);
        });

        const release = () => {
            bg.clear();
            bg.fillStyle(color, alpha);
            bg.fillRoundedRect(x - sz / 2, y - sz / 2, sz, sz, 10);
            bg.lineStyle(1, color, alpha + 0.2);
            bg.strokeRoundedRect(x - sz / 2, y - sz / 2, sz, sz, 10);
            txt.setAlpha(alpha + 0.2);
        };

        zone.on('pointerup', release);
        zone.on('pointerout', release);

        this.widgets.push(bg, txt, zone);
    }

    update() {
        // Reserved for future per-frame logic (e.g. held-button repeat)
    }

    destroy() {
        for (const w of this.widgets) w.destroy();
        this.widgets = [];
    }
}
