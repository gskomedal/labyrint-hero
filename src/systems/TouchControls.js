// ─── Labyrint Hero – Touch Controls (d-pad + action buttons) ─────────────────

class TouchControls {
    constructor(scene) {
        this.scene = scene;
        this.game  = scene.game;
        this.widgets = [];
        this._menuWidgets = []; // menu buttons tracked separately for visibility
        this._domDpad = null;   // DOM-based d-pad container (for off-canvas placement)
        this._dpadButtons = [];
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
        reg.set('touch_use', false);
        reg.set('touch_smeltery', false);
        reg.set('touch_chemlab', false);
        reg.set('touch_skilltree', false);
        reg.set('touch_elementbook', false);

        this._createDpad();
        this._createActionButtons();
        this._createMenuButtons();
    }

    // ── D-Pad ────────────────────────────────────────────────────────────────
    // DOM-based d-pad fixed to the bottom-left corner of the viewport.
    // CSS position:fixed handles rotation and resize automatically.

    _createDpad() {
        const reg = this.game.registry;

        // Remove any lingering d-pad from previous world
        const old = document.getElementById('touch-dpad');
        if (old) old.remove();

        // Container: fixed to bottom-left, no JS repositioning needed
        const container = document.createElement('div');
        container.id = 'touch-dpad';
        container.style.cssText =
            'position:fixed;bottom:12px;left:12px;' +
            'z-index:9999;pointer-events:none;';
        document.body.appendChild(container);
        this._domDpad = container;

        // Use vmin-based sizing so buttons scale with screen size
        // 8vmin ≈ 58px on a 720px screen, scales up/down naturally
        const btnSize = '8vmin';
        const btnGap  = '1vmin';
        const fontSize = '3.5vmin';

        // D-pad grid: 3×3 grid with buttons at cross positions
        const grid = document.createElement('div');
        grid.style.cssText =
            'display:grid;' +
            'grid-template-columns:' + btnSize + ' ' + btnSize + ' ' + btnSize + ';' +
            'grid-template-rows:' + btnSize + ' ' + btnSize + ' ' + btnSize + ';' +
            'gap:' + btnGap + ';';
        container.appendChild(grid);

        // Grid cells: 0=empty, {label,dx,dy} = button
        const cells = [
            null,                                   // 0,0
            { label: '\u25B2', dx:  0, dy: -1 },   // 1,0 (up)
            null,                                   // 2,0
            { label: '\u25C0', dx: -1, dy:  0 },   // 0,1 (left)
            null,                                   // 1,1 (center - empty)
            { label: '\u25B6', dx:  1, dy:  0 },   // 2,1 (right)
            null,                                   // 0,2
            { label: '\u25BC', dx:  0, dy:  1 },   // 1,2 (down)
            null,                                   // 2,2
        ];

        this._dpadButtons = [];
        for (const cell of cells) {
            if (!cell) {
                // Empty grid cell
                const spacer = document.createElement('div');
                grid.appendChild(spacer);
                continue;
            }

            const btn = document.createElement('div');
            btn.textContent = cell.label;
            btn.style.cssText =
                'border-radius:10px;' +
                'background:rgba(51,68,102,0.5);' +
                'border:2px solid rgba(51,68,102,0.7);' +
                'color:#aabbdd;' +
                'font-family:monospace;font-size:' + fontSize + ';' +
                'display:flex;align-items:center;justify-content:center;' +
                'pointer-events:auto;' +
                'user-select:none;-webkit-user-select:none;' +
                'touch-action:none;';

            const onPress = (e) => {
                e.preventDefault();
                reg.set('touch_dx', cell.dx);
                reg.set('touch_dy', cell.dy);
                btn.style.background = 'rgba(68,102,170,0.75)';
                btn.style.color = '#ffffff';
            };

            const onRelease = () => {
                reg.set('touch_dx', 0);
                reg.set('touch_dy', 0);
                btn.style.background = 'rgba(51,68,102,0.5)';
                btn.style.color = '#aabbdd';
            };

            btn.addEventListener('touchstart', onPress, { passive: false });
            btn.addEventListener('touchend', onRelease);
            btn.addEventListener('touchcancel', onRelease);
            btn.addEventListener('mousedown', onPress);
            btn.addEventListener('mouseup', onRelease);
            btn.addEventListener('mouseleave', onRelease);

            grid.appendChild(btn);
            this._dpadButtons.push(btn);
        }
    }

    // ── Action Buttons (bottom-right, always visible) ────────────────────────

    _createActionButtons() {
        const sz   = 56;
        const gap  = 10;
        const W = this.scene.cameras.main.width;
        const H = this.scene.cameras.main.height;
        const baseX = W - 24 - sz / 2;
        const baseY = H - 24 - sz / 2;

        const buttons = [
            { label: 'ATK', key: 'touch_attack',    color: 0xaa3333, ox: 0,               oy: 0 },
            { label: 'BOW', key: 'touch_bow',       color: 0x997722, ox: -(sz + gap),      oy: 0 },
            { label: 'USE', key: 'touch_use',       color: 0x339988, ox: -(sz + gap) * 2,  oy: 0 },
        ];

        for (const btn of buttons) {
            const x = baseX + btn.ox;
            const y = baseY + btn.oy;
            this._makeActionButton(x, y, sz, btn.label, btn.key, btn.color);
        }

        // ── Zoom & fullscreen buttons (top-right corner) ─────────────────────
        this._createZoomButtons();
    }

    // ── Menu Buttons (above action row, conditional visibility) ──────────────

    _createMenuButtons() {
        const sz   = 48;
        const gap  = 8;
        const W = this.scene.cameras.main.width;
        const H = this.scene.cameras.main.height;
        const baseX = W - 24 - sz / 2;
        const baseY = H - 24 - 56 / 2 - 10 - 56 - 10 - sz / 2; // above action row

        const menuDefs = [
            { label: 'INV', key: 'touch_inventory',   color: 0x335588, unlockKey: null },
            { label: 'MAP', key: 'touch_minimap',      color: 0x338844, unlockKey: null },
            { label: 'SKL', key: 'touch_skilltree',    color: 0x8866cc, unlockKey: null },
            { label: 'BOK', key: 'touch_elementbook',  color: 0x997755, unlockKey: 'geologistUnlocked' },
            { label: 'SMI', key: 'touch_smeltery',     color: 0xff7722, unlockKey: 'metallurgistUnlocked' },
            { label: 'LAB', key: 'touch_chemlab',      color: 0x33dd88, unlockKey: 'chemLabUnlocked' },
        ];

        const cols = 3;
        for (let i = 0; i < menuDefs.length; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = baseX - col * (sz + gap);
            const y = baseY - row * (sz + gap);
            const def = menuDefs[i];
            const btnWidgets = this._makeMenuButton(x, y, sz, def.label, def.key, def.color);
            this._menuWidgets.push({ widgets: btnWidgets, unlockKey: def.unlockKey });
        }
    }

    // ── Zoom & fullscreen (top-right) ────────────────────────────────────────

    _createZoomButtons() {
        const scene = this.scene;
        const reg   = this.game.registry;
        const sz    = 44;
        const gap   = 8;
        const W     = scene.cameras.main.width;
        const startX = W - 20 - sz / 2;
        const startY = 64 + sz / 2;

        this._makeSimpleButton(startX, startY, sz, '+', 0x336699, () => {
            reg.set('touch_zoom_in', true);
        });
        this._makeSimpleButton(startX - (sz + gap), startY, sz, '−', 0x336699, () => {
            reg.set('touch_zoom_out', true);
        });
        this._makeSimpleButton(startX - (sz + gap) * 2, startY, sz, '⛶', 0x446688, () => {
            this._toggleFullscreen();
        });
    }

    _makeSimpleButton(x, y, sz, label, color, callback) {
        const scene = this.scene;
        const alpha = 0.4;
        const pressAlpha = 0.75;

        const bg = scene.add.graphics();
        this._drawRoundedBtn(bg, x, y, sz, color, alpha);
        bg.setDepth(100);

        const txt = scene.add.text(x, y, label, {
            fontSize: '22px', color: '#eeeeff', fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(101).setAlpha(0.7);

        const zone = scene.add.zone(x, y, sz, sz).setInteractive().setDepth(102);

        zone.on('pointerdown', () => {
            callback();
            this._drawRoundedBtn(bg, x, y, sz, color, pressAlpha);
            txt.setAlpha(1);
        });

        const release = () => {
            this._drawRoundedBtn(bg, x, y, sz, color, alpha);
            txt.setAlpha(0.7);
        };

        zone.on('pointerup', release);
        zone.on('pointerout', release);

        this.widgets.push(bg, txt, zone);
    }

    _toggleFullscreen() {
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
        } else {
            const el = this.game.canvas.parentElement || this.game.canvas;
            if (el.requestFullscreen) {
                el.requestFullscreen().catch(() => {});
            } else if (el.webkitRequestFullscreen) {
                el.webkitRequestFullscreen();
            }
        }
    }

    _makeActionButton(x, y, sz, label, regKey, color) {
        const scene = this.scene;
        const reg   = this.game.registry;
        const alpha = 0.4;
        const pressAlpha = 0.75;

        const bg = scene.add.graphics();
        this._drawRoundedBtn(bg, x, y, sz, color, alpha);
        bg.setDepth(100);

        const txt = scene.add.text(x, y, label, {
            fontSize: '14px', color: '#eeeeff', fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(101).setAlpha(0.7);

        const zone = scene.add.zone(x, y, sz, sz).setInteractive().setDepth(102);

        zone.on('pointerdown', () => {
            reg.set(regKey, true);
            this._drawRoundedBtn(bg, x, y, sz, color, pressAlpha);
            txt.setAlpha(1);
        });

        const release = () => {
            this._drawRoundedBtn(bg, x, y, sz, color, alpha);
            txt.setAlpha(0.7);
        };

        zone.on('pointerup', release);
        zone.on('pointerout', release);

        this.widgets.push(bg, txt, zone);
    }

    _makeMenuButton(x, y, sz, label, regKey, color) {
        const scene = this.scene;
        const reg   = this.game.registry;
        const alpha = 0.35;
        const pressAlpha = 0.7;

        const bg = scene.add.graphics();
        this._drawRoundedBtn(bg, x, y, sz, color, alpha);
        bg.setDepth(100);

        const txt = scene.add.text(x, y, label, {
            fontSize: '12px', color: '#eeeeff', fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(101).setAlpha(0.6);

        const zone = scene.add.zone(x, y, sz, sz).setInteractive().setDepth(102);

        zone.on('pointerdown', () => {
            reg.set(regKey, true);
            this._drawRoundedBtn(bg, x, y, sz, color, pressAlpha);
            txt.setAlpha(1);
        });

        const release = () => {
            this._drawRoundedBtn(bg, x, y, sz, color, alpha);
            txt.setAlpha(0.6);
        };

        zone.on('pointerup', release);
        zone.on('pointerout', release);

        this.widgets.push(bg, txt, zone);
        return [bg, txt, zone];
    }

    /** Update menu button visibility based on hero unlock flags */
    updateVisibility(hero) {
        if (!hero) return;
        for (const entry of this._menuWidgets) {
            if (!entry.unlockKey) continue;
            const visible = !!hero[entry.unlockKey];
            for (const w of entry.widgets) {
                w.setVisible(visible);
            }
        }
    }

    // ── Shared draw helper ───────────────────────────────────────────────────

    _drawRoundedBtn(gfx, cx, cy, sz, color, alpha) {
        gfx.clear();
        gfx.fillStyle(color, alpha);
        gfx.fillRoundedRect(cx - sz / 2, cy - sz / 2, sz, sz, 10);
        gfx.lineStyle(2, color, Math.min(1, alpha + 0.3));
        gfx.strokeRoundedRect(cx - sz / 2, cy - sz / 2, sz, sz, 10);
    }

    update() {
        // Reserved for future per-frame logic
    }

    destroy() {
        for (const w of this.widgets) w.destroy();
        this.widgets = [];
        this._menuWidgets = [];
        // Clean up DOM d-pad
        if (this._domDpad) {
            this._domDpad.remove();
            this._domDpad = null;
        }
        this._dpadButtons = [];
    }
}
