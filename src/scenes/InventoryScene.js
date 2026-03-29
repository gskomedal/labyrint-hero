// ─── Labyrint Hero – InventoryScene ──────────────────────────────────────────
// Full-screen overlay showing equipment slots + 10-slot backpack.
// E or ESC closes. Items can be used/equipped without closing the overlay.

class InventoryScene extends Phaser.Scene {
    constructor() { super({ key: 'InventoryScene' }); }

    create() {
        const { width: W, height: H } = this.cameras.main;

        const gs  = this.scene.get('GameScene');
        this.hero = gs.hero;
        this.inv  = gs.hero.inventory;
        this.gs   = gs;

        this._dyn = [];  // dynamic objects – destroyed on _refresh()

        // ── Static background & title ──────────────────────────────────────────
        const cx = W / 2, cy = H / 2;
        this.add.rectangle(cx, cy, W, H, 0x000000, 0.78);

        const panelW = 520, panelH = 420;
        this.add.rectangle(cx, cy, panelW, panelH, 0x0d0b1e).setStrokeStyle(2, 0x334466);

        this.add.text(cx, cy - panelH / 2 + 18, 'INVENTAR', {
            fontSize: '20px', color: '#ccddff', fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.rectangle(cx, cy - panelH / 2 + 54, panelW - 40, 1, 0x223344);

        // Stats line – dynamic so it refreshes
        this._statsText = this.add.text(cx, cy - panelH / 2 + 40, '', {
            fontSize: '11px', color: '#667788', fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Section labels (static)
        this.add.text(cx - panelW / 2 + 20, cy - panelH / 2 + 62, 'UTSTYR', {
            fontSize: '11px', color: '#445566', fontFamily: 'monospace'
        });
        this.add.text(cx, cy - panelH / 2 + 168, 'EVNER', {
            fontSize: '11px', color: '#445566', fontFamily: 'monospace'
        }).setOrigin(0.5);
        this.add.text(cx - panelW / 2 + 20, cy - panelH / 2 + 220, 'RYGGSEKK', {
            fontSize: '11px', color: '#445566', fontFamily: 'monospace'
        });

        this.add.text(cx, cy + panelH / 2 - 14,
            '[Trykk] Bruk/utstyr  ·  [Hold] Slipp  ·  [E/ESC] Lukk', {
            fontSize: '11px', color: '#334455', fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Close button (touch-friendly)
        const closeBtn = this.add.text(cx + panelW / 2 - 20, cy - panelH / 2 + 18, '✕', {
            fontSize: '20px', color: '#667788', fontFamily: 'monospace'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        closeBtn.on('pointerover', () => closeBtn.setColor('#ff6666'));
        closeBtn.on('pointerout',  () => closeBtn.setColor('#667788'));
        closeBtn.on('pointerdown', () => this._tryClose());

        // ── Build dynamic slot UI ──────────────────────────────────────────────
        this._refresh();

        // Prevent browser right-click context menu in this scene
        this.input.mouse?.disableContextMenu();

        // ── Input – persistent listeners (not once) ────────────────────────────
        this._closed = false;
        this.input.keyboard.on('keydown-E',      this._tryClose, this);
        this.input.keyboard.on('keydown-ESC',    this._tryClose, this);
        this.input.keyboard.on('keydown-ESCAPE', this._tryClose, this);
    }

    // ── Refresh all dynamic slot UI ───────────────────────────────────────────

    _refresh() {
        // Destroy old dynamic objects
        for (const o of this._dyn) { if (o && o.destroy) o.destroy(); }
        this._dyn = [];

        const { width: W, height: H } = this.cameras.main;
        const cx = W / 2, cy = H / 2;
        const panelW = 520, panelH = 420;

        // Update stats line
        const h = this.hero;
        this._statsText.setText(
            `${h.heroName || 'Helten'}  ·  Nivå ${h.level}  ·  ATK ${h.attack}  ·  DEF ${h.defense}`
        );

        // Equipment slots
        const eqY = cy - panelH / 2 + 110;
        this._makeEquipSlot(cx - 120, eqY, 'weapon', 'Våpen');
        this._makeEquipSlot(cx,       eqY, 'armor',  'Rustning');
        this._makeQuickUseSlot(cx + 120, eqY);

        // Skills
        this._drawSkills(cx, cy - panelH / 2 + 185);

        // Backpack label with count
        this._d(this.add.text(cx + 80, cy - panelH / 2 + 220,
            `(${this.inv.itemCount}/10)`, {
            fontSize: '11px', color: '#334455', fontFamily: 'monospace'
        }));

        // Backpack slots
        const bpY     = cy - panelH / 2 + 245;
        const slotSize = 52, cols = 5, gap = 8;
        const bpTotalW = cols * slotSize + (cols - 1) * gap;
        const bpStartX = cx - bpTotalW / 2;

        for (let i = 0; i < 10; i++) {
            const col = i % cols, row = Math.floor(i / cols);
            const sx  = bpStartX + col * (slotSize + gap) + slotSize / 2;
            const sy  = bpY + row * (slotSize + gap) + slotSize / 2;
            this._makeBackpackSlot(sx, sy, slotSize, i);
        }
    }

    // ── Helper: register dynamic object ──────────────────────────────────────
    _d(obj) { this._dyn.push(obj); return obj; }

    // ── Equipment slot ────────────────────────────────────────────────────────

    _makeEquipSlot(x, y, slot, label) {
        const size = 64;
        const item = this.inv.equipped[slot];

        const bg = this._d(this.add.rectangle(x, y, size, size, 0x0a0918).setStrokeStyle(
            item ? 2 : 1,
            item ? (item.type === 'weapon' ? 0xff8800 : 0x4488ff) : 0x223344
        ));

        this._d(this.add.text(x, y + size / 2 + 10, label, {
            fontSize: '10px', color: '#445566', fontFamily: 'monospace'
        }).setOrigin(0.5));

        if (item) {
            this._drawItemIcon(x, y, item, size - 12);
            this._d(this.add.text(x, y - size / 2 - 10, item.name, {
                fontSize: '10px', color: '#ccddff', fontFamily: 'monospace'
            }).setOrigin(0.5));

            bg.setInteractive({ useHandCursor: true });
            bg.on('pointerdown', (pointer) => {
                if (pointer.rightButtonDown()) {
                    const dropped = this.inv.dropEquipped(slot, this.hero);
                    if (dropped) this.gs._spawnItemAt(this.hero.gridX, this.hero.gridY, dropped);
                    this._refresh();
                    return;
                }
                // Long-press (touch) = drop, short tap = unequip
                bg._lpTimer = this.time.delayedCall(500, () => {
                    bg._lpTimer = null;
                    const dropped = this.inv.dropEquipped(slot, this.hero);
                    if (dropped) this.gs._spawnItemAt(this.hero.gridX, this.hero.gridY, dropped);
                    this._refresh();
                });
            });
            bg.on('pointerup', () => {
                if (bg._lpTimer) {
                    bg._lpTimer.remove();
                    bg._lpTimer = null;
                    this.inv.unequip(slot, this.hero);
                    this._refresh();
                }
            });
            bg.on('pointerover', () => { bg.setFillStyle(0x1a1830); this._showTooltip(x, y - size/2 - 20, item); });
            bg.on('pointerout',  () => {
                bg.setFillStyle(0x0a0918); this._hideTooltip();
                if (bg._lpTimer) { bg._lpTimer.remove(); bg._lpTimer = null; }
            });
        } else {
            this._d(this.add.text(x, y, 'Tom', {
                fontSize: '11px', color: '#223344', fontFamily: 'monospace'
            }).setOrigin(0.5));
        }
    }

    // ── Quick-Use slot ─────────────────────────────────────────────────────────

    _makeQuickUseSlot(x, y) {
        const size = 64;
        const qu = this.inv.quickUse;
        const itemDef = qu ? ITEM_DEFS[qu.id] : null;

        const bg = this._d(this.add.rectangle(x, y, size, size, 0x0a0918).setStrokeStyle(
            itemDef ? 2 : 1,
            itemDef ? 0x33aa88 : 0x223344
        ));

        this._d(this.add.text(x, y + size / 2 + 10, 'Hurtig (Q)', {
            fontSize: '10px', color: '#33aa88', fontFamily: 'monospace'
        }).setOrigin(0.5));

        if (itemDef) {
            this._drawItemIcon(x, y, itemDef, size - 12);
            const label = qu.count > 1 ? `${itemDef.name} ×${qu.count}` : itemDef.name;
            this._d(this.add.text(x, y - size / 2 - 10, label, {
                fontSize: '10px', color: '#ccddff', fontFamily: 'monospace'
            }).setOrigin(0.5));

            bg.setInteractive({ useHandCursor: true });
            bg.on('pointerdown', (pointer) => {
                if (pointer.rightButtonDown()) {
                    const dropped = this.inv.dropQuickUse();
                    if (dropped) this.gs._spawnItemAt(this.hero.gridX, this.hero.gridY, dropped);
                    this._refresh();
                    return;
                }
                bg._lpTimer = this.time.delayedCall(500, () => {
                    bg._lpTimer = null;
                    const dropped = this.inv.dropQuickUse();
                    if (dropped) this.gs._spawnItemAt(this.hero.gridX, this.hero.gridY, dropped);
                    this._refresh();
                });
            });
            bg.on('pointerup', () => {
                if (bg._lpTimer) {
                    bg._lpTimer.remove();
                    bg._lpTimer = null;
                    // Tap: unequip back to backpack
                    this.inv.unequipQuickUse();
                    this._refresh();
                }
            });
            bg.on('pointerover', () => { bg.setFillStyle(0x1a1830); this._showTooltip(x, y - size/2 - 20, itemDef); });
            bg.on('pointerout',  () => {
                bg.setFillStyle(0x0a0918); this._hideTooltip();
                if (bg._lpTimer) { bg._lpTimer.remove(); bg._lpTimer = null; }
            });
        } else {
            this._d(this.add.text(x, y, 'Tom', {
                fontSize: '11px', color: '#223344', fontFamily: 'monospace'
            }).setOrigin(0.5));
        }
    }

    // ── Backpack slot ─────────────────────────────────────────────────────────

    _makeBackpackSlot(x, y, size, index) {
        const entry   = this.inv.backpack[index];
        const itemDef = this.inv._getItemDef(entry);
        const count   = this.inv._getCount(entry);
        const col     = itemDef
            ? (itemDef.type === 'weapon' ? 0xff8800 : itemDef.type === 'armor' ? 0x4488ff : 0xff2244)
            : 0x112233;

        const bg = this._d(this.add.rectangle(x, y, size, size, 0x0a0918).setStrokeStyle(1, col));

        if (itemDef) {
            this._drawItemIcon(x, y, itemDef, size - 10);
            this._d(this.add.text(x, y + size / 2 - 2, this._shortName(itemDef.name), {
                fontSize: '8px', color: '#aabbcc', fontFamily: 'monospace'
            }).setOrigin(0.5, 1));

            // Stack count badge
            if (count > 1) {
                this._d(this.add.text(x + size / 2 - 4, y - size / 2 + 2, `${count}`, {
                    fontSize: '10px', color: '#ffee88', fontFamily: 'monospace', fontStyle: 'bold'
                }).setOrigin(1, 0));
            }

            bg.setInteractive({ useHandCursor: true });
            bg.on('pointerover', () => {
                bg.setFillStyle(0x1a2030);
                const tip = count > 1 ? { ...itemDef, name: `${itemDef.name} ×${count}` } : itemDef;
                this._showTooltip(x, y - size / 2 - 4, tip);
            });
            bg.on('pointerout', () => {
                bg.setFillStyle(0x0a0918);
                this._hideTooltip();
            });
            bg.on('pointerdown', (pointer) => {
                this._hideTooltip();
                if (pointer.rightButtonDown()) {
                    const dropped = this.inv.dropSlot(index);
                    if (dropped) this.gs._spawnItemAt(this.hero.gridX, this.hero.gridY, dropped);
                    this._refresh();
                    return;
                }
                bg._lpTimer = this.time.delayedCall(500, () => {
                    bg._lpTimer = null;
                    const dropped = this.inv.dropSlot(index);
                    if (dropped) this.gs._spawnItemAt(this.hero.gridX, this.hero.gridY, dropped);
                    this._refresh();
                });
            });
            bg.on('pointerup', () => {
                if (bg._lpTimer) {
                    bg._lpTimer.remove();
                    bg._lpTimer = null;
                    this.inv.useSlot(index, this.hero, this.gs);
                    this._refresh();
                }
            });
        }
    }

    // ── Skills display ────────────────────────────────────────────────────────

    _drawSkills(cx, y) {
        const counts = {};
        for (const id of (this.hero.skills || [])) counts[id] = (counts[id] || 0) + 1;

        const entries = Object.entries(counts);
        if (entries.length === 0) {
            this._d(this.add.text(cx, y, 'Ingen evner ennå', {
                fontSize: '11px', color: '#334455', fontFamily: 'monospace'
            }).setOrigin(0.5));
            return;
        }

        const totalW = Math.min(entries.length, 5) * 88;
        entries.slice(0, 10).forEach(([id, cnt], i) => {
            const def = SKILL_DEFS.find(s => s.id === id);
            if (!def) return;
            const lbl = cnt > 1 ? `${def.name} ×${cnt}` : def.name;
            const col = Phaser.Display.Color.IntegerToColor(def.color).rgba;
            this._d(this.add.text(
                cx - totalW / 2 + 44 + (i % 5) * 90,
                y + Math.floor(i / 5) * 16,
                lbl,
                { fontSize: '10px', fontFamily: 'monospace', color: col }
            ));
        });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    _drawItemIcon(x, y, item, size) {
        const g = this._d(this.add.graphics());
        const col = item.type === 'weapon' ? 0xff8800
                  : item.type === 'armor'  ? 0x4488ff
                  : 0xff2244;
        g.fillStyle(col, 0.8);
        if (item.type === 'weapon') {
            if (item.subtype === 'bow') {
                // Bow shape: arc
                g.lineStyle(3, col, 0.9);
                g.strokeCircle(x, y, size / 3.5);
                g.fillRect(x - 1, y - size / 2.5, 3, size * 0.6); // string
            } else {
                g.fillRect(x - size / 6, y - size / 2.5, size / 3, size * 0.65);
                g.fillRect(x - size / 3, y - size / 10, size * 0.66, size / 5);
            }
        } else if (item.type === 'armor') {
            g.fillRoundedRect(x - size / 3, y - size / 3, size * 0.66, size * 0.66, 4);
        } else {
            g.fillCircle(x, y, size / 3.5);
            g.fillStyle(0xffffff, 0.35);
            g.fillCircle(x - size / 8, y - size / 8, size / 8);
        }
    }

    _showTooltip(x, y, item) {
        this._hideTooltip();
        const lines = [item.name, item.desc || ''];
        this._tooltip = this.add.text(x, y, lines.join('\n'), {
            fontSize: '10px', color: '#eeeeff', fontFamily: 'monospace',
            backgroundColor: '#0a0918', padding: { x: 6, y: 4 },
            stroke: '#334466', strokeThickness: 1
        }).setOrigin(0.5, 1).setDepth(30);
    }

    _hideTooltip() {
        if (this._tooltip) { this._tooltip.destroy(); this._tooltip = null; }
    }

    _shortName(name) {
        return name.length > 10 ? name.slice(0, 9) + '…' : name;
    }

    _tryClose() {
        if (this._closed) return;
        this._closed = true;
        this._hideTooltip();
        this.input.keyboard.off('keydown-E',      this._tryClose, this);
        this.input.keyboard.off('keydown-ESC',    this._tryClose, this);
        this.input.keyboard.off('keydown-ESCAPE', this._tryClose, this);
        this.scene.stop();
    }
}
