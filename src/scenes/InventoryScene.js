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
        this.pet  = gs.pet;

        this._dyn = [];  // dynamic objects – destroyed on _refresh()

        // ── Static background & title ──────────────────────────────────────────
        const cx = W / 2, cy = H / 2;
        this.add.rectangle(cx, cy, W, H, 0x000000, 0.78);

        const panelW = 740;
        const hasPet = this.pet && this.pet.alive;
        const bpCount = this.inv.backpack.length;
        const bpRows = Math.ceil(bpCount / 5);
        const extraBpSpace = Math.max(0, (bpRows - 2) * 60);
        const panelH = (hasPet ? 500 : 420) + extraBpSpace;
        const panelY = cy;
        this.add.rectangle(cx, panelY, panelW, panelH, 0x0d0b1e).setStrokeStyle(2, 0x334466);

        // Title shifted right to make room for portrait
        const contentCX = cx + 100;
        this.add.text(contentCX, panelY - panelH / 2 + 18, 'INVENTAR', {
            fontSize: '22px', color: '#ccddff', fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.rectangle(contentCX, panelY - panelH / 2 + 54, panelW - 250, 1, 0x223344);

        // Stats line – dynamic so it refreshes
        this._statsText = this.add.text(contentCX, panelY - panelH / 2 + 40, '', {
            fontSize: '13px', color: '#667788', fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Section labels (static) - shifted right
        this.add.text(contentCX - 220, panelY - panelH / 2 + 62, 'UTSTYR', {
            fontSize: '13px', color: '#445566', fontFamily: 'monospace'
        });
        this.add.text(contentCX, panelY - panelH / 2 + 168, 'EVNER', {
            fontSize: '13px', color: '#445566', fontFamily: 'monospace'
        }).setOrigin(0.5);
        // RYGGSEKK label is drawn dynamically in _refresh() to show slot count

        const helpText = hasPet
            ? '[Trykk] Bruk/utstyr  ·  [Hold] → Kjæledyr/Slipp  ·  [E/ESC] Lukk'
            : '[Trykk] Bruk/utstyr  ·  [Hold] Slipp  ·  [E/ESC] Lukk';
        this.add.text(cx, panelY + panelH / 2 - 14, helpText, {
            fontSize: '13px', color: '#334455', fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Element Book button
        const ebBtn = this.add.text(cx - panelW / 2 + 20, cy - panelH / 2 + 18, 'Elementbok [B]', {
            fontSize: '12px', color: '#997755', fontFamily: 'monospace'
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
        UIHelper.clearDynamic(this._dyn);

        const { width: W, height: H } = this.cameras.main;
        const cx = W / 2, cy = H / 2;
        const hasPet = this.pet && this.pet.alive;
        const panelW = 740;
        const contentCX = cx + 100;
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

        // ── Character portrait (left of equipment) ────────────────────────────
        const portraitSize = 192;
        const portraitX = cx - panelW / 2 + 16;
        const portraitY = panelY - panelH / 2 + 60;
        const pGfx = this._d(this.add.graphics());
        pGfx.fillStyle(0x0a0918, 0.9);
        pGfx.fillRoundedRect(portraitX - 4, portraitY - 4, portraitSize + 8, portraitSize + 8, 6);
        pGfx.lineStyle(2, 0x334466, 0.6);
        pGfx.strokeRoundedRect(portraitX - 4, portraitY - 4, portraitSize + 8, portraitSize + 8, 6);
        // Floor hint in portrait
        pGfx.fillStyle(0x1e1a30);
        pGfx.fillRect(portraitX - 3, portraitY + portraitSize - 16, portraitSize + 6, 19);
        const eq = this.inv.equipped || {};
        if (typeof drawDetailedCharacterSprite === 'function') {
            drawDetailedCharacterSprite(pGfx, portraitX, portraitY, portraitSize, h.appearance, h.race, eq);
        } else {
            drawCharacterSprite(pGfx, portraitX, portraitY, portraitSize, h.appearance, h.race);
        }
        // Pet portrait is drawn inline with pet inventory section (see _drawPetInventory)
        // Hero name under portrait
        this._d(this.add.text(portraitX + portraitSize / 2, portraitY + portraitSize + 10, h.heroName || 'Helten', {
            fontSize: '13px', color: '#8899bb', fontFamily: 'monospace'
        }).setOrigin(0.5));

        // Equipment slots (shifted right to leave room for portrait)
        const eqY = panelY - panelH / 2 + 110;
        this._makeEquipSlot(contentCX - 120, eqY, 'weapon', 'Våpen');
        this._makeEquipSlot(contentCX,       eqY, 'armor',  'Rustning');
        this._makeQuickUseSlot(contentCX + 120, eqY);

        // Skills
        this._drawSkills(contentCX, panelY - panelH / 2 + 185);

        // Backpack label with count
        this._d(this.add.text(contentCX + 80, panelY - panelH / 2 + 220,
            `(${this.inv.itemCount}/10)`, {
            fontSize: '13px', color: '#334455', fontFamily: 'monospace'
        }));

        // Backpack slots (dynamic size – base 10 + skill expansions)
        const bpY     = panelY - panelH / 2 + 245;
        const cols = 5, gap = 8;
        const slotSize = bpCount > 15 ? 44 : 52;
        const bpTotalW = cols * slotSize + (cols - 1) * gap;
        const bpStartX = contentCX - bpTotalW / 2;

        const bpLabel = `RYGGSEKK (${this.inv.itemCount}/${bpCount})`;
        this._d(this.add.text(contentCX - 220, bpY - 22, bpLabel, {
            fontSize: '13px', color: '#445566', fontFamily: 'monospace'
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
            this._drawPetInventory(contentCX, panelY - panelH / 2, panelW - 220, bpBottom);
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
            fontSize: '12px', color: '#445566', fontFamily: 'monospace'
        }).setOrigin(0.5));

        if (item) {
            this._drawItemIcon(x, y, item, size - 12);
            const eqDispName = (item.type === 'mineral' && typeof getMineralDisplayName !== 'undefined')
                ? getMineralDisplayName(item, this.hero) : item.name;
            this._d(this.add.text(x, y - size / 2 - 10, this._shortName(eqDispName), {
                fontSize: '11px', color: this._rarityTextColor(item), fontFamily: 'monospace'
            }).setOrigin(0.5));

            bg.setInteractive({ useHandCursor: true });
            bg.on('pointerdown', (pointer) => {
                if (pointer.rightButtonDown()) {
                    const dropped = this.inv.dropEquipped(slot, this.hero);
                    if (dropped) EventBus.emit('spawnItem', { gx: this.hero.gridX, gy: this.hero.gridY, item: dropped });
                    this._refresh();
                    return;
                }
                // Long-press (touch) = drop, short tap = unequip
                bg._lpTimer = this.time.delayedCall(500, () => {
                    bg._lpTimer = null;
                    const dropped = this.inv.dropEquipped(slot, this.hero);
                    if (dropped) EventBus.emit('spawnItem', { gx: this.hero.gridX, gy: this.hero.gridY, item: dropped });
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
                fontSize: '13px', color: '#223344', fontFamily: 'monospace'
            }).setOrigin(0.5));
        }
    }

    // ── Quick-Use slot ─────────────────────────────────────────────────────────

    _makeQuickUseSlot(x, y) {
        const size = 64;
        const qu = this.inv.quickUse;
        const itemDef = qu
            ? (qu._chemItem || ITEM_DEFS[qu.id]
               || (typeof MOLECULE_DEFS !== 'undefined' && MOLECULE_DEFS[qu.id])
               || null)
            : null;

        const bg = this._d(this.add.rectangle(x, y, size, size, 0x0a0918).setStrokeStyle(
            itemDef ? 2 : 1,
            itemDef ? 0x33aa88 : 0x223344
        ));

        this._d(this.add.text(x, y + size / 2 + 10, 'Hurtig (Q)', {
            fontSize: '12px', color: '#33aa88', fontFamily: 'monospace'
        }).setOrigin(0.5));

        if (itemDef) {
            this._drawItemIcon(x, y, itemDef, size - 12);
            const quDispName = (itemDef.type === 'mineral' && typeof getMineralDisplayName !== 'undefined')
                ? getMineralDisplayName(itemDef, this.hero) : itemDef.name;
            const sn = this._shortName(quDispName);
            const label = qu.count > 1 ? `${sn} ×${qu.count}` : sn;
            this._d(this.add.text(x, y - size / 2 - 10, label, {
                fontSize: '11px', color: '#ccddff', fontFamily: 'monospace'
            }).setOrigin(0.5));

            bg.setInteractive({ useHandCursor: true });
            bg.on('pointerdown', (pointer) => {
                if (pointer.rightButtonDown()) {
                    const dropped = this.inv.dropQuickUse();
                    if (dropped) EventBus.emit('spawnItem', { gx: this.hero.gridX, gy: this.hero.gridY, item: dropped });
                    this._refresh();
                    return;
                }
                bg._lpTimer = this.time.delayedCall(500, () => {
                    bg._lpTimer = null;
                    const dropped = this.inv.dropQuickUse();
                    if (dropped) EventBus.emit('spawnItem', { gx: this.hero.gridX, gy: this.hero.gridY, item: dropped });
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
                fontSize: '13px', color: '#223344', fontFamily: 'monospace'
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
            const bpDispName = (itemDef.type === 'mineral' && typeof getMineralDisplayName !== 'undefined')
                ? getMineralDisplayName(itemDef, this.hero) : itemDef.name;
            this._d(this.add.text(x, y + size / 2 - 2, this._shortName(bpDispName), {
                fontSize: '11px', color: nameCol, fontFamily: 'monospace'
            }).setOrigin(0.5, 1));

            // Stack count badge
            if (count > 1) {
                this._d(this.add.text(x + size / 2 - 4, y - size / 2 + 2, `${count}`, {
                    fontSize: '12px', color: '#ffee88', fontFamily: 'monospace', fontStyle: 'bold'
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
                        if (dropped) EventBus.emit('spawnItem', { gx: this.hero.gridX, gy: this.hero.gridY, item: dropped });
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
                        if (dropped) EventBus.emit('spawnItem', { gx: this.hero.gridX, gy: this.hero.gridY, item: dropped });
                    }
                    this._refresh();
                });
            });
            bg.on('pointerup', () => {
                if (bg._lpTimer) {
                    bg._lpTimer.remove();
                    bg._lpTimer = null;
                    this.inv.useSlot(index, this.hero);
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

        // Pet portrait (left side, aligned with slots)
        const petPortSize = 64;
        const petPortX = cx - panelW / 2 + 14;
        const petPortY = baseY + 6;
        const petGfx = this._d(this.add.graphics());
        petGfx.fillStyle(0x120a18, 0.8);
        petGfx.fillRoundedRect(petPortX - 3, petPortY - 3, petPortSize + 6, petPortSize + 6, 4);
        petGfx.lineStyle(1, 0x442244, 0.4);
        petGfx.strokeRoundedRect(petPortX - 3, petPortY - 3, petPortSize + 6, petPortSize + 6, 4);
        this._drawPetPortrait(petGfx, petPortX, petPortY, petPortSize, pet);

        // Pet label with name and HP (to the right of portrait)
        const labelX = petPortX + petPortSize + 12;
        const hpText = `${pet.petName}  HP: ${pet.hp}/${pet.effectiveMaxHp}  ATK: ${pet.effectiveAttack}`;
        this._d(this.add.text(labelX, baseY, `KJÆLEDYR  ·  ${hpText}`, {
            fontSize: '13px', color: '#ffaadd', fontFamily: 'monospace'
        }));
        this._d(this.add.text(cx + panelW / 2 - 20, baseY,
            `(${pet.backpackCount}/4)`, {
            fontSize: '13px', color: '#334455', fontFamily: 'monospace'
        }).setOrigin(1, 0));

        // Pet backpack slots (4 slots in a row, to the right of portrait)
        const slotSize = 52, gap = 8;
        const totalW = 4 * slotSize + 3 * gap;
        const startX = labelX;
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
            const petDispName = (itemDef.type === 'mineral' && typeof getMineralDisplayName !== 'undefined')
                ? getMineralDisplayName(itemDef, this.hero) : itemDef.name;
            this._d(this.add.text(x, y + size / 2 - 2, this._shortName(petDispName), {
                fontSize: '11px', color: nameCol, fontFamily: 'monospace'
            }).setOrigin(0.5, 1));

            if (count > 1) {
                this._d(this.add.text(x + size / 2 - 4, y - size / 2 + 2, `${count}`, {
                    fontSize: '12px', color: '#ffee88', fontFamily: 'monospace', fontStyle: 'bold'
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
                    if (dropped) EventBus.emit('spawnItem', { gx: this.hero.gridX, gy: this.hero.gridY, item: dropped });
                    this._refresh();
                    return;
                }
                bg._lpTimer = this.time.delayedCall(500, () => {
                    bg._lpTimer = null;
                    const dropped = pet.dropSlot(index);
                    if (dropped) EventBus.emit('spawnItem', { gx: this.hero.gridX, gy: this.hero.gridY, item: dropped });
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
                fontSize: '13px', color: '#334455', fontFamily: 'monospace'
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
                { fontSize: '12px', fontFamily: 'monospace', color: col }
            ));
        });
    }

    // ── Pet portrait in character frame ──────────────────────────────────────

    _drawPetPortrait(g, px, py, size, pet) {
        const sc = size / 32;
        const cx = px + size / 2;
        const cy = py + size / 2;

        const b = (x, y, w, h, color, alpha) => {
            if (alpha !== undefined) g.fillStyle(color, alpha);
            else g.fillStyle(color);
            g.fillRect(
                Math.round(px + x * sc), Math.round(py + y * sc),
                Math.max(1, Math.round(w * sc)), Math.max(1, Math.round(h * sc))
            );
        };

        // Shadow
        g.fillStyle(0x000000, 0.2);
        g.fillEllipse(cx, py + 28 * sc, 12 * sc, 4 * sc);

        const typeId = pet.typeId || 'fox';
        const col = pet.color || 0xff8833;
        const colDk = darkenHex(col, 0.75);
        const colHi = lightenHex(col, 1.2);

        if (typeId === 'fox') {
            // Body
            b(10, 16, 12, 10, col);
            // Tail
            g.fillStyle(darkenHex(col, 0.85));
            g.fillEllipse(px + 24 * sc, py + 20 * sc, 5 * sc, 3 * sc);
            g.fillStyle(0xffffff);
            g.fillEllipse(px + 27 * sc, py + 20 * sc, 3 * sc, 2 * sc);
            // Legs
            b(11, 24, 3, 5, colDk); b(18, 24, 3, 5, colDk);
            b(11, 27, 3, 2, 0x331100); b(18, 27, 3, 2, 0x331100);
            // Head
            b(10, 8, 12, 10, colHi);
            // Ears
            g.fillStyle(darkenHex(col, 0.9));
            g.fillTriangle(px + 10 * sc, py + 10 * sc, px + 13 * sc, py + 10 * sc, px + 11 * sc, py + 3 * sc);
            g.fillTriangle(px + 22 * sc, py + 10 * sc, px + 19 * sc, py + 10 * sc, px + 21 * sc, py + 3 * sc);
            // Snout
            b(13, 13, 6, 4, 0xffffff);
            g.fillStyle(0x111111); g.fillCircle(cx, py + 14 * sc, 2 * sc);
            // Eyes
            g.fillStyle(0x221100); g.fillCircle(px + 13 * sc, py + 11 * sc, 2 * sc); g.fillCircle(px + 19 * sc, py + 11 * sc, 2 * sc);
            g.fillStyle(0xffffff); g.fillCircle(px + 12 * sc, py + 10 * sc, 1 * sc); g.fillCircle(px + 18 * sc, py + 10 * sc, 1 * sc);
        } else if (typeId === 'cat') {
            b(11, 16, 10, 10, col);
            // Tail curving up
            b(20, 14, 3, 8, colDk); b(22, 12, 3, 4, colDk);
            b(12, 24, 3, 5, colDk); b(17, 24, 3, 5, colDk);
            b(12, 27, 3, 2, 0x664422); b(17, 27, 3, 2, 0x664422);
            b(10, 7, 12, 11, colHi);
            // Ears
            g.fillStyle(col);
            g.fillTriangle(px + 10 * sc, py + 9 * sc, px + 13 * sc, py + 9 * sc, px + 11 * sc, py + 2 * sc);
            g.fillTriangle(px + 22 * sc, py + 9 * sc, px + 19 * sc, py + 9 * sc, px + 21 * sc, py + 2 * sc);
            // Eyes (green slit)
            b(12, 10, 3, 3, 0x44cc44); b(17, 10, 3, 3, 0x44cc44);
            b(13, 10, 1, 3, 0x111111); b(18, 10, 1, 3, 0x111111);
            // Nose
            g.fillStyle(0xff8899); g.fillCircle(cx, py + 14 * sc, 1 * sc);
        } else if (typeId === 'dragon') {
            b(10, 14, 12, 12, col);
            b(12, 17, 8, 7, 0xffaa66); // belly
            // Wings
            g.fillStyle(colDk);
            g.fillTriangle(px + 10 * sc, py + 16 * sc, px + 2 * sc, py + 8 * sc, px + 12 * sc, py + 12 * sc);
            g.fillTriangle(px + 22 * sc, py + 16 * sc, px + 30 * sc, py + 8 * sc, px + 20 * sc, py + 12 * sc);
            b(11, 24, 3, 5, colDk); b(18, 24, 3, 5, colDk);
            b(10, 27, 4, 2, darkenHex(col, 0.6)); b(18, 27, 4, 2, darkenHex(col, 0.6));
            // Head
            b(10, 5, 12, 10, colHi);
            // Horns
            b(10, 4, 2, 4, 0xddaa44); b(20, 4, 2, 4, 0xddaa44);
            // Eyes
            g.fillStyle(0xffee00); g.fillCircle(px + 13 * sc, py + 9 * sc, 2 * sc); g.fillCircle(px + 19 * sc, py + 9 * sc, 2 * sc);
            g.fillStyle(0x111111); g.fillCircle(px + 13 * sc, py + 9 * sc, 1 * sc); g.fillCircle(px + 19 * sc, py + 9 * sc, 1 * sc);
            // Snout
            b(14, 12, 4, 3, colHi);
            g.fillStyle(0x111111); g.fillCircle(px + 14 * sc, py + 13 * sc, 0.5 * sc); g.fillCircle(px + 18 * sc, py + 13 * sc, 0.5 * sc);
        } else if (typeId === 'owl') {
            b(10, 14, 12, 10, col);
            b(11, 24, 3, 4, colDk); b(18, 24, 3, 4, colDk);
            // Wings folded
            b(8, 16, 3, 8, colDk); b(21, 16, 3, 8, colDk);
            // Head (large round)
            b(9, 5, 14, 12, colHi);
            // Ear tufts
            b(9, 4, 3, 4, col); b(20, 4, 3, 4, col);
            // Face disc
            b(11, 7, 10, 8, lightenHex(col, 1.15));
            // Eyes (large)
            g.fillStyle(0xffee44); g.fillCircle(px + 14 * sc, py + 10 * sc, 3 * sc); g.fillCircle(px + 18 * sc, py + 10 * sc, 3 * sc);
            g.fillStyle(0x111111); g.fillCircle(px + 14 * sc, py + 10 * sc, 1.5 * sc); g.fillCircle(px + 18 * sc, py + 10 * sc, 1.5 * sc);
            // Beak
            g.fillStyle(0xddaa44);
            g.fillTriangle(px + 15 * sc, py + 13 * sc, px + 17 * sc, py + 13 * sc, px + 16 * sc, py + 16 * sc);
        }

        // Pet name label
        const nameStr = pet.petName || '';
        if (nameStr) {
            g.fillStyle(0x000000, 0.5);
            g.fillRoundedRect(px, py + 30 * sc, size, Math.round(10 * sc), 2);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    _drawItemIcon(x, y, item, size) {
        const g = this._d(this.add.graphics());
        ItemGraphics.drawInventoryIcon(g, x, y, item, size);
    }

    _showTooltip(x, y, item) {
        this._hideTooltip();
        const { width: W, height: H } = this.cameras.main;
        const rarDef = item.rarity ? RARITY_BY_ID[item.rarity] : null;
        const rarTag = (rarDef && item.rarity !== 'common') ? `[${rarDef.label}]  ` : '';
        const dispName = (item.type === 'mineral' && typeof getMineralDisplayName !== 'undefined')
            ? getMineralDisplayName(item, this.hero) : item.name;
        const dispDesc = (item.type === 'mineral' && (this.hero.mineralIdentifyLevel || 0) <= 0)
            ? '' : (item.desc || '');
        const lines = [rarTag + dispName, dispDesc];
        const txtCol = this._rarityTextColor(item);
        this._tooltip = this.add.text(x, y, lines.join('\n'), {
            fontSize: '12px', color: txtCol, fontFamily: 'monospace',
            backgroundColor: '#0a0918', padding: { x: 6, y: 4 },
            stroke: '#334466', strokeThickness: 1,
            wordWrap: { width: 300 }
        }).setOrigin(0.5, 1).setDepth(30);

        // Clamp tooltip within viewport
        const b = this._tooltip.getBounds();
        if (b.left < 4) this._tooltip.setX(x + (4 - b.left));
        if (b.right > W - 4) this._tooltip.setX(x - (b.right - W + 4));
        if (b.top < 4) this._tooltip.setOrigin(0.5, 0).setY(y + 8);
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
