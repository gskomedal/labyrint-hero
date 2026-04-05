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
        this.pet  = gs.pet;

        this._dyn = [];  // dynamic objects – destroyed on _refresh()

        // ── Static background & title ──────────────────────────────────────────
        const cx = W / 2, cy = H / 2;
        this.add.rectangle(cx, cy, W, H, 0x000000, 0.78);

        const panelW = 520;
        const hasPet = this.pet && this.pet.alive;
        const bpCount = this.inv.backpack.length;
        const bpRows = Math.ceil(bpCount / 5);
        const extraBpSpace = Math.max(0, (bpRows - 2) * 60);
        const panelH = (hasPet ? 500 : 420) + extraBpSpace;
        const panelY = cy;
        this.add.rectangle(cx, panelY, panelW, panelH, 0x0d0b1e).setStrokeStyle(2, 0x334466);

        this.add.text(cx, panelY - panelH / 2 + 18, 'INVENTAR', {
            fontSize: '20px', color: '#ccddff', fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.rectangle(cx, panelY - panelH / 2 + 54, panelW - 40, 1, 0x223344);

        // Stats line – dynamic so it refreshes
        this._statsText = this.add.text(cx, panelY - panelH / 2 + 40, '', {
            fontSize: '11px', color: '#667788', fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Section labels (static)
        this.add.text(cx - panelW / 2 + 20, panelY - panelH / 2 + 62, 'UTSTYR', {
            fontSize: '11px', color: '#445566', fontFamily: 'monospace'
        });
        this.add.text(cx, panelY - panelH / 2 + 168, 'EVNER', {
            fontSize: '11px', color: '#445566', fontFamily: 'monospace'
        }).setOrigin(0.5);
        // RYGGSEKK label is drawn dynamically in _refresh() to show slot count

        const helpText = hasPet
            ? '[Trykk] Bruk/utstyr  ·  [Hold] → Kjæledyr/Slipp  ·  [E/ESC] Lukk'
            : '[Trykk] Bruk/utstyr  ·  [Hold] Slipp  ·  [E/ESC] Lukk';
        this.add.text(cx, panelY + panelH / 2 - 14, helpText, {
            fontSize: '11px', color: '#334455', fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Element Book button
        const ebBtn = this.add.text(cx - panelW / 2 + 20, cy - panelH / 2 + 18, 'Elementbok [B]', {
            fontSize: '10px', color: '#997755', fontFamily: 'monospace'
        }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
        ebBtn.on('pointerover', () => ebBtn.setColor('#ccaa77'));
        ebBtn.on('pointerout',  () => ebBtn.setColor('#997755'));
        ebBtn.on('pointerdown', () => {
            const gs = this.scene.get('GameScene');
            if (gs && gs.hero) {
                this.scene.launch('ElementBookScene', { heroRef: gs.hero });
            }
        });

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
        const hasPet = this.pet && this.pet.alive;
        const panelW = 520;
        const bpCount = this.inv.backpack.length;
        const bpRows = Math.ceil(bpCount / 5);
        const extraBpSpace = Math.max(0, (bpRows - 2) * 60);
        const panelH = (hasPet ? 500 : 420) + extraBpSpace;
        const panelY = cy;

        // Update stats line
        const h = this.hero;
        this._statsText.setText(
            `${h.heroName || 'Helten'}  ·  Nivå ${h.level}  ·  ATK ${h.attack}  ·  DEF ${h.defense}  ·  💰 ${h.gold}g`
        );

        // Equipment slots
        const eqY = panelY - panelH / 2 + 110;
        this._makeEquipSlot(cx - 120, eqY, 'weapon', 'Våpen');
        this._makeEquipSlot(cx,       eqY, 'armor',  'Rustning');
        this._makeQuickUseSlot(cx + 120, eqY);

        // Skills
        this._drawSkills(cx, panelY - panelH / 2 + 185);

        // Backpack label with count
        this._d(this.add.text(cx + 80, panelY - panelH / 2 + 220,
            `(${this.inv.itemCount}/10)`, {
            fontSize: '11px', color: '#334455', fontFamily: 'monospace'
        }));

        // Backpack slots (dynamic size – base 10 + skill expansions)
        const bpY     = panelY - panelH / 2 + 245;
        const cols = 5, gap = 8;
        const slotSize = bpCount > 15 ? 44 : 52;
        const bpTotalW = cols * slotSize + (cols - 1) * gap;
        const bpStartX = cx - bpTotalW / 2;

        const bpLabel = `RYGGSEKK (${this.inv.itemCount}/${bpCount})`;
        this._d(this.add.text(cx - panelW / 2 + 20, bpY - 22, bpLabel, {
            fontSize: '11px', color: '#445566', fontFamily: 'monospace'
        }));

        for (let i = 0; i < bpCount; i++) {
            const col = i % cols, row = Math.floor(i / cols);
            const sx  = bpStartX + col * (slotSize + gap) + slotSize / 2;
            const sy  = bpY + row * (slotSize + gap) + slotSize / 2;
            this._makeBackpackSlot(sx, sy, slotSize, i);
        }

        // Pet inventory section – position dynamically below backpack rows
        if (hasPet) {
            const bpRows = Math.ceil(bpCount / cols);
            const bpBottom = bpY + bpRows * (slotSize + gap);
            this._drawPetInventory(cx, panelY - panelH / 2, panelW, bpBottom);
        }
    }

    // ── Helper: register dynamic object ──────────────────────────────────────
    _d(obj) { this._dyn.push(obj); return obj; }

    // ── Equipment slot ────────────────────────────────────────────────────────

    _rarityBorderColor(item) {
        if (!item) return 0x223344;
        const r = item.rarity ? RARITY_BY_ID[item.rarity] : null;
        if (r && item.rarity !== 'common') return r.color;
        return item.type === 'weapon' ? 0xff8800 : item.type === 'armor' ? 0x4488ff : 0x223344;
    }

    _rarityTextColor(item) {
        if (!item) return '#ccddff';
        const r = item.rarity ? RARITY_BY_ID[item.rarity] : null;
        if (r && item.rarity !== 'common') return r.textColor;
        return '#ccddff';
    }

    _makeEquipSlot(x, y, slot, label) {
        const size = 64;
        const item = this.inv.equipped[slot];
        const borderCol = this._rarityBorderColor(item);

        const bg = this._d(this.add.rectangle(x, y, size, size, 0x0a0918).setStrokeStyle(
            item ? 2 : 1, borderCol
        ));

        this._d(this.add.text(x, y + size / 2 + 10, label, {
            fontSize: '10px', color: '#445566', fontFamily: 'monospace'
        }).setOrigin(0.5));

        if (item) {
            this._drawItemIcon(x, y, item, size - 12);
            this._d(this.add.text(x, y - size / 2 - 10, item.name, {
                fontSize: '10px', color: this._rarityTextColor(item), fontFamily: 'monospace'
            }).setOrigin(0.5));

            bg.setInteractive({ useHandCursor: true });
            bg.on('pointerdown', (pointer) => {
                if (pointer.rightButtonDown()) {
                    const dropped = this.inv.dropEquipped(slot, this.hero);
                    if (dropped) this.gs.itemSpawner.spawnItemAt(this.hero.gridX, this.hero.gridY, dropped);
                    this._refresh();
                    return;
                }
                // Long-press (touch) = drop, short tap = unequip
                bg._lpTimer = this.time.delayedCall(500, () => {
                    bg._lpTimer = null;
                    const dropped = this.inv.dropEquipped(slot, this.hero);
                    if (dropped) this.gs.itemSpawner.spawnItemAt(this.hero.gridX, this.hero.gridY, dropped);
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
                    if (dropped) this.gs.itemSpawner.spawnItemAt(this.hero.gridX, this.hero.gridY, dropped);
                    this._refresh();
                    return;
                }
                bg._lpTimer = this.time.delayedCall(500, () => {
                    bg._lpTimer = null;
                    const dropped = this.inv.dropQuickUse();
                    if (dropped) this.gs.itemSpawner.spawnItemAt(this.hero.gridX, this.hero.gridY, dropped);
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
        // Use rarity color for equipment border, fallback to type color
        let col = 0x112233;
        if (itemDef) {
            const r = itemDef.rarity ? RARITY_BY_ID[itemDef.rarity] : null;
            if (r && itemDef.rarity !== 'common') {
                col = r.color;
            } else if (itemDef.type === 'mineral' && typeof MINERAL_TIER_COLORS !== 'undefined') {
                col = MINERAL_TIER_COLORS[itemDef.tier] || 0x997755;
            } else {
                col = itemDef.type === 'weapon' ? 0xff8800 : itemDef.type === 'armor' ? 0x4488ff : 0xff2244;
            }
        }

        const bg = this._d(this.add.rectangle(x, y, size, size, 0x0a0918).setStrokeStyle(1, col));

        if (itemDef) {
            this._drawItemIcon(x, y, itemDef, size - 10);
            const nameCol = itemDef.type === 'mineral' && typeof MINERAL_TIER_COLORS !== 'undefined'
                ? '#' + (MINERAL_TIER_COLORS[itemDef.tier] || 0x997755).toString(16).padStart(6, '0')
                : this._rarityTextColor(itemDef);
            this._d(this.add.text(x, y + size / 2 - 2, this._shortName(itemDef.name), {
                fontSize: '8px', color: nameCol, fontFamily: 'monospace'
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
                    // Right-click: move to pet if possible, otherwise drop
                    const item = this.inv._getItemDef(this.inv.backpack[index]);
                    if (item && this.pet && this.pet.alive && this.pet.addItem(item)) {
                        this.inv.dropSlot(index);
                    } else {
                        const dropped = this.inv.dropSlot(index);
                        if (dropped) this.gs.itemSpawner.spawnItemAt(this.hero.gridX, this.hero.gridY, dropped);
                    }
                    this._refresh();
                    return;
                }
                bg._lpTimer = this.time.delayedCall(500, () => {
                    bg._lpTimer = null;
                    // Long press: move to pet if possible, otherwise drop
                    const item = this.inv._getItemDef(this.inv.backpack[index]);
                    if (item && this.pet && this.pet.alive && this.pet.addItem(item)) {
                        this.inv.dropSlot(index);
                    } else {
                        const dropped = this.inv.dropSlot(index);
                        if (dropped) this.gs.itemSpawner.spawnItemAt(this.hero.gridX, this.hero.gridY, dropped);
                    }
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

    // ── Pet inventory ──────────────────────────────────────────────────────────

    _drawPetInventory(cx, panelTop, panelW, bpBottom) {
        const pet = this.pet;
        const baseY = Math.max(panelTop + 370, bpBottom + 10);

        // Separator
        this._d(this.add.rectangle(cx, baseY - 8, panelW - 40, 1, 0x223344));

        // Pet label with name and HP
        const hpText = `${pet.petName}  HP: ${pet.hp}/${pet.effectiveMaxHp}  ATK: ${pet.effectiveAttack}`;
        this._d(this.add.text(cx - panelW / 2 + 20, baseY, `KJÆLEDYR  ·  ${hpText}`, {
            fontSize: '11px', color: '#ffaadd', fontFamily: 'monospace'
        }));
        this._d(this.add.text(cx + panelW / 2 - 20, baseY,
            `(${pet.backpackCount}/4)`, {
            fontSize: '11px', color: '#334455', fontFamily: 'monospace'
        }).setOrigin(1, 0));

        // Pet backpack slots (4 slots in a row)
        const slotSize = 52, gap = 8;
        const totalW = 4 * slotSize + 3 * gap;
        const startX = cx - totalW / 2;
        const slotsY = baseY + 20;

        for (let i = 0; i < 4; i++) {
            const sx = startX + i * (slotSize + gap) + slotSize / 2;
            const sy = slotsY + slotSize / 2;
            this._makePetBackpackSlot(sx, sy, slotSize, i);
        }
    }

    _makePetBackpackSlot(x, y, size, index) {
        const pet = this.pet;
        const entry   = pet.backpack[index];
        const itemDef = pet.getItemDef(entry);
        const count   = pet.getCount(entry);

        let col = 0x112233;
        if (itemDef) {
            const r = itemDef.rarity ? RARITY_BY_ID[itemDef.rarity] : null;
            if (r && itemDef.rarity !== 'common') {
                col = r.color;
            } else {
                col = itemDef.type === 'weapon' ? 0xff8800 : itemDef.type === 'armor' ? 0x4488ff : 0xff2244;
            }
        }

        // Pink tint to distinguish pet slots
        const bg = this._d(this.add.rectangle(x, y, size, size, 0x120a18).setStrokeStyle(1, col));

        if (itemDef) {
            this._drawItemIcon(x, y, itemDef, size - 10);
            const nameCol = this._rarityTextColor(itemDef);
            this._d(this.add.text(x, y + size / 2 - 2, this._shortName(itemDef.name), {
                fontSize: '8px', color: nameCol, fontFamily: 'monospace'
            }).setOrigin(0.5, 1));

            if (count > 1) {
                this._d(this.add.text(x + size / 2 - 4, y - size / 2 + 2, `${count}`, {
                    fontSize: '10px', color: '#ffee88', fontFamily: 'monospace', fontStyle: 'bold'
                }).setOrigin(1, 0));
            }

            bg.setInteractive({ useHandCursor: true });
            bg.on('pointerover', () => {
                bg.setFillStyle(0x1a1830);
                const tip = count > 1 ? { ...itemDef, name: `${itemDef.name} ×${count}` } : itemDef;
                this._showTooltip(x, y - size / 2 - 4, tip);
            });
            bg.on('pointerout', () => {
                bg.setFillStyle(0x120a18);
                this._hideTooltip();
            });
            bg.on('pointerdown', (pointer) => {
                this._hideTooltip();
                if (pointer.rightButtonDown()) {
                    // Drop from pet backpack to ground
                    const dropped = pet.dropSlot(index);
                    if (dropped) this.gs.itemSpawner.spawnItemAt(this.hero.gridX, this.hero.gridY, dropped);
                    this._refresh();
                    return;
                }
                bg._lpTimer = this.time.delayedCall(500, () => {
                    bg._lpTimer = null;
                    const dropped = pet.dropSlot(index);
                    if (dropped) this.gs.itemSpawner.spawnItemAt(this.hero.gridX, this.hero.gridY, dropped);
                    this._refresh();
                });
            });
            bg.on('pointerup', () => {
                if (bg._lpTimer) {
                    bg._lpTimer.remove();
                    bg._lpTimer = null;
                    // Tap: move item from pet to hero backpack
                    const item = pet.getItemDef(pet.backpack[index]);
                    if (item && this.inv.addItem(item)) {
                        pet.dropSlot(index);
                    }
                    this._refresh();
                }
            });
        } else {
            // Empty slot: allow moving from hero to pet by checking if hero inventory is the source
            bg.setInteractive({ useHandCursor: true });
            bg.on('pointerover', () => bg.setFillStyle(0x1a1830));
            bg.on('pointerout',  () => bg.setFillStyle(0x120a18));
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
        const s  = size;
        const hs = s / 2;
        const col = item.rarityColor || item.color || (
            item.type === 'weapon' ? 0xff8800
          : item.type === 'armor'  ? 0x4488ff
          : 0xff2244);
        g.fillStyle(col, 0.8);

        // Unique icons per item ID
        if (item.id === 'dagger') {
            g.fillRect(x - 1, y - hs + 2, 3, s * 0.5);
            g.fillStyle(0x886644, 0.9);
            g.fillRect(x - 4, y + 2, 8, 3);
            g.fillRect(x - 2, y + 5, 4, 4);
        } else if (item.id === 'wood_sword' || item.id === 'iron_sword') {
            g.fillRect(x - 2, y - hs + 2, 4, s * 0.55);
            g.fillStyle(0x886644, 0.9);
            g.fillRect(x - 5, y + 4, 10, 3);
            g.fillRect(x - 2, y + 7, 4, 4);
        } else if (item.id === 'spear') {
            g.fillRect(x - 1, y - hs + 1, 3, s * 0.75);
            g.fillStyle(0xaaaacc, 0.9);
            g.fillTriangle(x - 4, y - hs + 8, x + 4, y - hs + 8, x, y - hs + 1);
        } else if (item.id === 'battle_axe') {
            g.fillStyle(0x886644, 0.9);
            g.fillRect(x - 1, y - hs + 4, 3, s * 0.65);
            g.fillStyle(col, 0.9);
            g.fillTriangle(x - 8, y - hs + 5, x - 1, y - hs + 5, x - 1, y + 2);
            g.fillTriangle(x + 8, y - hs + 5, x + 1, y - hs + 5, x + 1, y + 2);
        } else if (item.id === 'war_hammer') {
            g.fillStyle(0x886644, 0.9);
            g.fillRect(x - 1, y - 2, 3, s * 0.45);
            g.fillStyle(col, 0.9);
            g.fillRoundedRect(x - 7, y - hs + 2, 14, 10, 2);
        } else if (item.id === 'magic_staff') {
            g.fillStyle(0x664422, 0.9);
            g.fillRect(x - 1, y - 2, 3, s * 0.5);
            g.fillStyle(0xaa44ff, 0.8);
            g.fillCircle(x, y - hs + 6, 5);
            g.fillStyle(0xffffff, 0.4);
            g.fillCircle(x - 1, y - hs + 5, 2);
        } else if (item.subtype === 'bow') {
            g.lineStyle(3, col, 0.9);
            g.beginPath();
            g.arc(x + 3, y, s / 3, -1.8, 1.8, false);
            g.strokePath();
            g.lineStyle(1, 0xccaa66, 0.7);
            g.lineBetween(x + 3, y - s / 3, x + 3, y + s / 3);
        } else if (item.id === 'chain_mail') {
            g.fillStyle(0x8899aa, 0.9);
            g.fillRoundedRect(x - hs / 2, y - hs / 2, hs, hs * 1.1, 3);
            for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
                g.fillStyle(0x667788, 0.5);
                g.fillCircle(x - hs / 3 + c * (hs / 3), y - hs / 3 + r * (hs / 3), 2);
            }
        } else if (item.id === 'plate_armor') {
            g.fillStyle(0xccccdd, 0.9);
            g.fillRoundedRect(x - hs / 2, y - hs / 2, hs, hs * 1.1, 3);
            g.fillStyle(0xaaaacc, 0.5);
            g.fillRect(x - 1, y - hs / 2 + 2, 2, hs);
        } else if (item.id === 'dragon_scale') {
            g.fillStyle(0xff6622, 0.9);
            g.fillRoundedRect(x - hs / 2, y - hs / 2, hs, hs * 1.1, 3);
            g.fillStyle(0xcc4411, 0.6);
            for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
                g.fillTriangle(x - 6 + c * 5, y - 4 + r * 7, x - 4 + c * 5, y + r * 7, x - 8 + c * 5, y + r * 7);
            }
        } else if (item.type === 'armor') {
            g.fillRoundedRect(x - hs / 2, y - hs / 2, hs, hs * 1.1, 4);
        } else if (item.id === 'health_pot' || item.id === 'big_health_pot') {
            g.fillRoundedRect(x - 5, y - 2, 10, 12, 3);
            g.fillRect(x - 3, y - 5, 6, 4);
            g.fillStyle(0xffffff, 0.3);
            g.fillCircle(x - 2, y + 2, 2);
        } else if (item.id === 'bomb') {
            g.fillStyle(0x333333, 0.9);
            g.fillCircle(x, y + 2, 8);
            g.fillStyle(0xff6600, 0.8);
            g.fillRect(x - 1, y - 8, 2, 5);
            g.fillCircle(x, y - 8, 3);
        } else if (item.id === 'heart_crystal') {
            g.fillTriangle(x, y + 8, x - 9, y - 2, x + 9, y - 2);
            g.fillCircle(x - 5, y - 4, 5);
            g.fillCircle(x + 5, y - 4, 5);
        } else if (item.id === 'xp_scroll' || item.id === 'map_scroll') {
            g.fillRoundedRect(x - 6, y - 6, 12, 16, 2);
            g.fillCircle(x - 6, y - 6, 3);
            g.fillCircle(x + 6, y - 6, 3);
            g.fillCircle(x - 6, y + 10, 3);
            g.fillCircle(x + 6, y + 10, 3);
        } else if (item.type === 'consumable') {
            g.fillRoundedRect(x - 5, y - 2, 10, 12, 3);
            g.fillRect(x - 3, y - 5, 6, 4);
            g.fillStyle(0xffffff, 0.3);
            g.fillCircle(x - 2, y + 2, 2);
        } else if (item.type === 'weapon') {
            g.fillRect(x - 2, y - hs + 2, 4, s * 0.55);
            g.fillRect(x - hs / 2, y, hs, s / 5);
        } else if (item.type === 'mineral' && item.subtype === 'crystal') {
            // Crystal gem shape
            g.fillTriangle(x, y - 8, x - 6, y, x + 6, y);
            g.fillTriangle(x - 6, y, x + 6, y, x, y + 8);
            g.fillStyle(0xffffff, 0.4);
            g.fillTriangle(x, y - 8, x - 3, y - 1, x + 2, y - 1);
            g.fillStyle(0xffffff, 0.6);
            g.fillCircle(x - 1, y - 3, 1);
        } else if (item.type === 'mineral') {
            // Rocky ore chunk
            g.fillTriangle(x - 7, y + 5, x + 8, y + 6, x + 2, y - 7);
            g.fillTriangle(x - 8, y + 5, x + 3, y + 6, x - 4, y - 5);
            g.fillStyle(0xffffff, 0.2);
            g.fillTriangle(x - 2, y - 6, x + 4, y - 2, x - 4, y);
        } else if (item.type === 'fuel' && item.id === 'coal') {
            g.fillStyle(0x222222, 0.85);
            g.fillCircle(x - 2, y + 2, 5);
            g.fillCircle(x + 3, y - 1, 4);
        } else if (item.type === 'fuel') {
            // Wood log
            g.fillRoundedRect(x - 7, y - 3, 14, 6, 2);
            g.fillStyle(0x664422, 0.7);
            g.fillCircle(x - 7, y, 3);
            g.fillCircle(x + 7, y, 3);
        } else {
            g.fillCircle(x, y, s / 3.5);
            g.fillStyle(0xffffff, 0.35);
            g.fillCircle(x - s / 8, y - s / 8, s / 8);
        }
    }

    _showTooltip(x, y, item) {
        this._hideTooltip();
        const rarDef = item.rarity ? RARITY_BY_ID[item.rarity] : null;
        const rarTag = (rarDef && item.rarity !== 'common') ? `[${rarDef.label}]  ` : '';
        const lines = [rarTag + item.name, item.desc || ''];
        const txtCol = this._rarityTextColor(item);
        this._tooltip = this.add.text(x, y, lines.join('\n'), {
            fontSize: '10px', color: txtCol, fontFamily: 'monospace',
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
