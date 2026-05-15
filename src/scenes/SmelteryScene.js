// ─── Labyrint Hero – Smeltery Scene (Camp Room) ──────────────────────────────
// Overlay scene for smelting minerals into elements and crafting alloys.
// Opens when hero enters a Camp Room tile or via V key while in Camp Room.
// Three tabs: Smelt (minerals→elements), Alloy (elements→alloy), Forge (alloy→equipment).

class SmelteryScene extends Phaser.Scene {
    constructor() { super({ key: 'SmelteryScene' }); }

    init(data) {
        this.heroRef = data.heroRef || null;
    }

    create() {
        const { width: W, height: H } = this.cameras.main;
        const cx = W / 2, cy = H / 2;
        this.smelter = new SmeltingSystem();
        this._dyn = [];
        this.tooltips = new TooltipManager(this);
        this._tab = 'stash'; // 'stash' | 'smelt' | 'alloy' | 'forge'

        // ── Dim overlay ───────────────────────────────────────────────────────
        this.add.rectangle(cx, cy, W, H, 0x000000, 0.82);

        // ── Panel ─────────────────────────────────────────────────────────────
        // Shrink from full-canvas so the scene feels lighter and leaves margin.
        this.panelW = Math.min(W - 80, 1080);
        this.panelH = Math.min(H - 80, 680);
        this.px = cx - this.panelW / 2;
        this.py = cy - this.panelH / 2;

        // ── Camp background art (behind everything) ──────────────────────────
        const panel = this.add.graphics();
        panel.fillStyle(UI_COLORS.panelBgDark, 0.97);
        panel.fillRoundedRect(this.px, this.py, this.panelW, this.panelH, 8);
        if (SceneBackgrounds.addCampBackground) {
            SceneBackgrounds.addCampBackground(this, this.px, this.py, this.panelW, this.panelH);
        }

        // ── Dark content area (high contrast zone for UI) ─────────────────────
        const contentLeft = this.px + 6;
        const contentTop = this.py + 6;
        const contentW = this.panelW - 12;
        const contentH = 60;
        const uiGfx = this.add.graphics();
        uiGfx.fillStyle(UI_COLORS.panelBgDark, 0.82);
        uiGfx.fillRoundedRect(contentLeft, contentTop, contentW, contentH, 6);

        // Panel border
        panel.lineStyle(2, UI_COLORS.accentOrange);
        panel.strokeRoundedRect(this.px, this.py, this.panelW, this.panelH, 8);

        // Title
        this.add.text(cx, this.py + 22, 'SMELTEOVN  –  Leirplass', {
            fontSize: UI_FONTS.heading, color: UI_TEXT.primary, fontFamily: UI_FONTS.family, fontStyle: 'bold'
        }).setOrigin(0.5);

        // Fuel indicator
        const fuel = this.smelter.calculateFuelEnergy(this.heroRef);
        this._fuelText = this.add.text(this.px + this.panelW - 20, this.py + 22, `Brensel: ${fuel} energi`, {
            fontSize: UI_FONTS.label, color: '#886633', fontFamily: UI_FONTS.family
        }).setOrigin(1, 0.5);

        // Element counts summary
        const tracker = this.heroRef.elementTracker;
        const elemCount = Object.keys(tracker.collected).length;
        this._elemText = this.add.text(this.px + 20, this.py + 22, `Grunnstoffer: ${elemCount}`, {
            fontSize: UI_FONTS.label, color: '#887766', fontFamily: UI_FONTS.family
        }).setOrigin(0, 0.5);

        this.add.rectangle(cx, this.py + 42, this.panelW - 20, 1, 0x332200);

        // ── Tab buttons ───────────────────────────────────────────────────────
        this._tabBtns = [];
        const tabs = [
            { id: 'stash', label: 'Lager' },
            { id: 'smelt', label: 'Smelt' },
            { id: 'alloy', label: 'Legering' },
            { id: 'forge', label: 'Smi' },
        ];
        if (this.heroRef.semiconductorUnlocked) {
            tabs.push({ id: 'refine', label: 'Raffiner' });
            tabs.push({ id: 'semi',   label: 'Halvleder' });
            tabs.push({ id: 'tech',   label: 'Teknologi' });
        }
        const tabW = tabs.length > 4 ? 92 : 130;
        const tabY = this.py + 62;
        tabs.forEach((tab, i) => {
            const tx = this.px + 30 + i * (tabW + 10) + tabW / 2;
            const active = this._tab === tab.id;
            const btn = this.add.text(tx, tabY, tab.label, {
                fontSize: '16px', color: active ? UI_TEXT.primary : '#554433',
                fontFamily: UI_FONTS.family, fontStyle: active ? 'bold' : 'normal'
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });
            btn.on('pointerdown', () => { this._tab = tab.id; this._refresh(); });
            this._tabBtns.push(btn);
        });

        this.add.rectangle(cx, tabY + 18, this.panelW - 20, 1, 0x221100);

        // ── Close button (touch-friendly) ─────────────────────────────────────
        UIHelper.makeCloseButton(this, this.px + this.panelW - 24, this.py + 22, () => this.scene.stop(), { color: '#886644' });

        this.input.keyboard.on('keydown-ESC', () => this.scene.stop());
        this.input.keyboard.on('keydown-V', () => this.scene.stop());

        // ── Content area ──────────────────────────────────────────────────────
        this._baseContentY = tabY + 30;
        this.contentY = this._baseContentY;
        this._scrollOffsets = { stash: 0, smelt: 0, alloy: 0, forge: 0, refine: 0, semi: 0, tech: 0 };
        this._maxScrolls = { stash: 0, smelt: 0, alloy: 0, forge: 0, refine: 0, semi: 0, tech: 0 };
        this._elementFilter = null; // null = show all, or element symbol string

        // Mouse wheel scrolling (per-tab offset)
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
            this._scrollOffsets[this._tab] = this._clampScroll(this._scrollOffsets[this._tab] + deltaY * 0.5);
            this._refresh();
        });

        // Touch / mouse-drag scrolling. Only engages after a small movement
        // threshold so that short clicks still trigger interactive buttons.
        this._dragState = { active: false, startY: 0, startOffset: 0, engaged: false };
        this.input.on('pointerdown', (pointer) => {
            this._dragState.active = true;
            this._dragState.engaged = false;
            this._dragState.startY = pointer.y;
            this._dragState.startOffset = this._scrollOffsets[this._tab] || 0;
        });
        this.input.on('pointermove', (pointer) => {
            if (!this._dragState.active || !pointer.isDown) return;
            const dy = pointer.y - this._dragState.startY;
            if (!this._dragState.engaged && Math.abs(dy) < 8) return;
            this._dragState.engaged = true;
            this._scrollOffsets[this._tab] = this._clampScroll(this._dragState.startOffset - dy);
            this._refresh();
        });
        this.input.on('pointerup', () => { this._dragState.active = false; });
        this.input.on('pointerupoutside', () => { this._dragState.active = false; });

        this._refresh();
    }

    /** Clamp a scroll offset against the current tab's known max. */
    _clampScroll(v) {
        const max = this._maxScrolls[this._tab] || 0;
        return Math.max(0, Math.min(v, max));
    }

    /** Viewport height available for scrolling content in a tab. */
    _viewportHeight() {
        return this.panelH - (this.contentY - this.py) - 30;
    }

    _refresh() {
        UIHelper.clearDynamic(this._dyn);
        this.contentY = this._baseContentY;

        // Dark backing behind content for readability
        const cbg = this._d(this.add.graphics());
        cbg.fillStyle(UI_COLORS.panelBgDark, 0.78);
        cbg.fillRoundedRect(this.px + 6, this.contentY - 4, this.panelW - 12, this.panelH - (this.contentY - this.py) - 10, 4);

        // Update tab button colors
        const tabIds = ['stash', 'smelt', 'alloy', 'forge'];
        if (this.heroRef.semiconductorUnlocked) { tabIds.push('refine', 'semi', 'tech'); }
        UIHelper.updateTabButtons(this._tabBtns, tabIds, this._tab, UI_TEXT.primary, '#554433');

        // Update fuel text
        const fuel = this.smelter.calculateFuelEnergy(this.heroRef);
        this._fuelText.setText(`Brensel: ${fuel} energi`);

        const stashCount = this.heroRef.campStash.reduce((s, e) => s + (e.count || 0), 0);
        const elemCount = Object.keys(this.heroRef.elementTracker.collected).length;
        this._elemText.setText(`Grunnstoffer: ${elemCount} | Lager: ${stashCount}`);

        switch (this._tab) {
            case 'stash': StashTabRenderer.draw(this); break;
            case 'smelt':
            case 'alloy':
            case 'forge':
                if (this._hasMetallurgSkill()) {
                    this._drawElementFilterRow();
                    if (this._tab === 'smelt')      SmeltTabRenderer.draw(this);
                    else if (this._tab === 'alloy') AlloyTabRenderer.draw(this);
                    else                            ForgeTabRenderer.draw(this);
                } else {
                    this._drawLockedTab();
                }
                break;
            case 'refine': RefineTabRenderer.draw(this); break;
            case 'semi':   SemiTabRenderer.draw(this);   break;
            case 'tech':   TechTabRenderer.draw(this);   break;
        }

        // Compute max scroll for this tab from the captured end-of-content Y.
        const viewportH = this._viewportHeight();
        const contentSpan = Math.max(0, (this._contentEndY || 0) - this.contentY);
        this._maxScrolls[this._tab] = Math.max(0, contentSpan - viewportH);
        // Re-clamp in case content shrank (e.g. item used up).
        this._scrollOffsets[this._tab] = this._clampScroll(this._scrollOffsets[this._tab] || 0);

        // Scroll indicators + thumb
        const scrollOff = this._scrollOffsets[this._tab] || 0;
        const maxScroll = this._maxScrolls[this._tab] || 0;
        if (scrollOff > 0) {
            this._d(this.add.text(this.px + this.panelW / 2, this.contentY - 2, '▲ mer ▲', {
                fontSize: UI_FONTS.small, color: '#665544', fontFamily: UI_FONTS.family
            }).setOrigin(0.5, 1));
        }
        if (maxScroll > 0 && scrollOff < maxScroll - 1) {
            this._d(this.add.text(this.px + this.panelW / 2, this.py + this.panelH - 14, '▼ mer ▼', {
                fontSize: UI_FONTS.small, color: '#665544', fontFamily: UI_FONTS.family
            }).setOrigin(0.5));
        }
        // Scrollbar thumb on right edge
        if (maxScroll > 0) {
            const trackX = this.px + this.panelW - 10;
            const trackY = this.contentY;
            const trackH = viewportH;
            const thumbH = Math.max(24, trackH * (trackH / (trackH + maxScroll)));
            const thumbY = trackY + (trackH - thumbH) * (scrollOff / maxScroll);
            const bar = this._d(this.add.graphics());
            bar.fillStyle(0x332200, 0.6);
            bar.fillRoundedRect(trackX, trackY, 4, trackH, 2);
            bar.fillStyle(UI_COLORS.accentOrange, 0.7);
            bar.fillRoundedRect(trackX, thumbY, 4, thumbH, 2);
        }
    }

    _hasMetallurgSkill() {
        return (this.heroRef.skills || []).some(s =>
            s === 'fast_smelting' || s === 'alloy_mastery' || s === 'master_smith'
        );
    }

    _hasGeologSkill() {
        return (this.heroRef.skills || []).some(s =>
            s === 'mineral_eye' || s === 'efficient_mining' || s === 'master_prospector'
        );
    }

    _drawElementFilterRow() {
        const hero = this.heroRef;
        const collected = hero.elementTracker.collected;
        const leftX = this.px + 10;
        const maxW = this.panelW - 40;
        const filterStartY = this.contentY;
        let y = filterStartY;
        let bx = leftX;

        // "Alle" reset button
        const allBtn = this._d(this.add.text(bx, y, 'Alle', {
            fontSize: UI_FONTS.small,
            color: this._elementFilter === null ? UI_TEXT.primary : '#554433',
            fontFamily: UI_FONTS.family, fontStyle: this._elementFilter === null ? 'bold' : 'normal',
            backgroundColor: '#0a0608', padding: { x: 3, y: 1 }
        }).setInteractive({ useHandCursor: true }));
        allBtn.on('pointerdown', () => { this._elementFilter = null; this._scrollOffsets[this._tab] = 0; this._refresh(); });
        bx += allBtn.width + 4;

        // Collect all elements used in recipes for this tab context
        const recipeElements = new Set();
        if (typeof ALLOY_DEFS !== 'undefined') {
            for (const alloy of Object.values(ALLOY_DEFS)) {
                for (const r of alloy.recipe) recipeElements.add(r.symbol);
            }
        }
        for (const [symbol] of Object.entries(collected)) {
            recipeElements.add(symbol);
        }

        // Sort by atomic number so the filter row follows periodic-table order
        const sortedSymbols = Array.from(recipeElements).sort((a, b) => {
            const an = (typeof ELEMENTS !== 'undefined' && ELEMENTS[a]) ? ELEMENTS[a].atomicNumber : 999;
            const bn = (typeof ELEMENTS !== 'undefined' && ELEMENTS[b]) ? ELEMENTS[b].atomicNumber : 999;
            return an - bn;
        });

        const badges = [];
        for (const symbol of sortedSymbols) {
            const count = collected[symbol] || 0;
            const elem = typeof ELEMENTS !== 'undefined' ? ELEMENTS[symbol] : null;
            const col = elem ? elem.color : 0xaaaaaa;
            const hexCol = '#' + col.toString(16).padStart(6, '0');
            const isActive = this._elementFilter === symbol;
            const dimmed = count === 0;

            const badge = this._d(this.add.text(bx, y, symbol, {
                fontSize: UI_FONTS.small,
                color: isActive ? UI_TEXT.primary : (dimmed ? '#222222' : hexCol),
                fontFamily: UI_FONTS.family,
                fontStyle: isActive ? 'bold' : 'normal',
                backgroundColor: isActive ? '#331100' : '#0a0608',
                padding: { x: 3, y: 1 }
            }).setInteractive({ useHandCursor: true }));
            badge.on('pointerdown', () => {
                this._elementFilter = isActive ? null : symbol;
                this._scrollOffsets[this._tab] = 0;
                this._refresh();
            });
            badges.push(badge);
            bx += badge.width + 3;
            if (bx > leftX + maxW) { bx = leftX; y += 18; }
        }

        this.contentY = y + 22;

        // Draw an opaque cover behind the filter row so scrolled content cannot
        // bleed through it. The cover is drawn AFTER tab content in z-order
        // because _drawElementFilterRow() is called last in _refresh() for
        // smelt/alloy/forge tabs — keeping the filter always on top.
        const coverH = this.contentY - filterStartY;
        const cover = this._d(this.add.graphics());
        cover.fillStyle(UI_COLORS.panelBgDark, 1.0);
        cover.fillRect(this.px + 6, filterStartY, this.panelW - 12, coverH);
        cover.lineStyle(1, 0x221100, 1.0);
        cover.lineBetween(this.px + 6, filterStartY + coverH - 2, this.px + this.panelW - 6, filterStartY + coverH - 2);

        // Raise all filter objects above the cover and above scrolled content
        allBtn.setDepth(10);
        for (const b of badges) b.setDepth(10);
        cover.setDepth(9);
    }

    _drawLockedTab() {
        const cx = this.px + this.panelW / 2;
        const cy = this.contentY + (this.panelH - (this.contentY - this.py)) / 2 - 40;
        this._d(this.add.text(cx, cy, '🔒', { fontSize: '36px' }).setOrigin(0.5));
        this._d(this.add.text(cx, cy + 34, 'Krever Metallurg-skill!', {
            fontSize: '16px', color: UI_TEXT.primary, fontFamily: UI_FONTS.family, fontStyle: 'bold'
        }).setOrigin(0.5));
        const hint = this._hasGeologSkill()
            ? 'Lær Rask smelting i skilltreet\nfor å bruke smelteovnen.'
            : 'Du trenger Geolog-skill først,\nderetter Metallurg-skill.';
        this._d(this.add.text(cx, cy + 58, hint, {
            fontSize: UI_FONTS.label, color: '#665544', fontFamily: UI_FONTS.family, align: 'center'
        }).setOrigin(0.5));
        this._contentEndY = this.contentY;
    }

    _d(obj) { this._dyn.push(obj); return obj; }

    // ── STASH TAB: Deposit/Withdraw items ──────────────────────────────────


    _depositItem(backpackSlot) {
        const hero = this.heroRef;
        const entry = hero.inventory.backpack[backpackSlot];
        if (!entry) return;

        // Move one item to stash
        const existing = hero.campStash.find(s => s.id === entry.id);
        if (existing) {
            existing.count++;
        } else {
            hero.campStash.push({ id: entry.id, count: 1 });
        }

        entry.count--;
        if (entry.count <= 0) hero.inventory.backpack[backpackSlot] = null;

        Audio.playPickup();
        this._refresh();
    }

    _withdrawItem(stashIndex) {
        const hero = this.heroRef;
        const stashEntry = hero.campStash[stashIndex];
        if (!stashEntry || stashEntry.count <= 0) return;

        // Check if backpack has space
        const def = this._getStashItemDef(stashEntry.id);
        if (!def) return;

        if (!hero.inventory.addItem(def)) {
            // No space
            return;
        }

        stashEntry.count--;
        if (stashEntry.count <= 0) {
            hero.campStash.splice(stashIndex, 1);
        }

        Audio.playPickup();
        this._refresh();
    }

    _getStashItemDef(id) {
        if (typeof MINERAL_DEFS !== 'undefined' && MINERAL_DEFS[id]) return MINERAL_DEFS[id];
        if (typeof FUEL_DEFS !== 'undefined' && FUEL_DEFS[id]) return FUEL_DEFS[id];
        if (typeof ITEM_DEFS !== 'undefined' && ITEM_DEFS[id]) return ITEM_DEFS[id];
        return null;
    }

    // ── SMELT TAB: Minerals → Elements ──────────────────────────────────────


    _doPyrolysis(pyroFuel) {
        const hero = this.heroRef;
        const result = this.smelter.pyrolyseFuel(pyroFuel.def.id, hero);
        if (!result) return;

        // Remove one fuel unit from source
        if (pyroFuel.source === 'stash') {
            const entry = hero.campStash[pyroFuel.slot];
            if (entry) { entry.count--; if (entry.count <= 0) hero.campStash.splice(pyroFuel.slot, 1); }
        } else {
            const entry = hero.inventory.backpack[pyroFuel.slot];
            if (entry) hero.inventory.dropSlot(pyroFuel.slot);
        }

        const msgParts = result.elements.map(e => `+${e.amount} ${e.symbol}`).join(', ');
        if (typeof EventBus !== 'undefined') {
            EventBus.emit('floatingText', { gx: hero.gridX, gy: hero.gridY, msg: msgParts || 'Ingen utbytte', color: '#44aacc' });
        }
        Audio.playPickup();
        this._refresh();
    }

    _doSmelt(slotIndex, mineralDef) {
        this._doSmeltFrom('backpack', slotIndex, mineralDef);
    }

    _doSmeltFromStash(stashIndex, mineralDef) {
        this._doSmeltFrom('stash', stashIndex, mineralDef);
    }

    /** Shared smelt logic for both backpack and stash sources.
     *  Resolves the source slot by mineral id at call time to avoid stale
     *  indices after a previous campStash splice or backpack mutation. */
    _doSmeltFrom(source, hintIndex, mineralDef) {
        const hero = this.heroRef;

        // Re-resolve the slot from the mineral id so we operate on the
        // correct entry even if the captured index has shifted.
        const findSlot = (container, id) => {
            // Prefer the hinted index if it still matches.
            if (container[hintIndex] && container[hintIndex].id === id && (container[hintIndex].count || 0) > 0) {
                return hintIndex;
            }
            for (let i = 0; i < container.length; i++) {
                const e = container[i];
                if (e && e.id === id && (e.count || 0) > 0) return i;
            }
            return -1;
        };

        const container = source === 'stash' ? hero.campStash : hero.inventory.backpack;
        const actualIndex = findSlot(container, mineralDef.id);
        if (actualIndex === -1) return;  // mineral is gone — bail out silently

        const result = this.smelter.smelt(mineralDef, hero);

        this.smelter.consumeFuel(hero, result.energyCost);

        // Remove one mineral from source using the freshly resolved index
        if (source === 'stash') {
            const stashEntry = hero.campStash[actualIndex];
            if (stashEntry) {
                stashEntry.count--;
                if (stashEntry.count <= 0) hero.campStash.splice(actualIndex, 1);
            }
        } else {
            const entry = hero.inventory.backpack[actualIndex];
            if (entry) {
                entry.count--;
                if (entry.count <= 0) hero.inventory.backpack[actualIndex] = null;
            }
        }

        const elemStr = result.elements.map(e => `${e.symbol}×${e.amount}`).join(', ');
        EventBus.emit('floatingText', { gx: hero.gridX, gy: hero.gridY, msg: `Smeltet: ${elemStr}`, color: UI_TEXT.primary });

        // Geolog T2 visible feedback when double-yield triggered.
        if (result.doubled) {
            EventBus.emit('floatingText', { gx: hero.gridX, gy: hero.gridY - 1, msg: 'Dobbelt utbytte!', color: '#ffcc44' });
        }
        // Geolog T4 geode drop feedback.
        if (result.geodeElement) {
            const g = result.geodeElement;
            EventBus.emit('floatingText', { gx: hero.gridX, gy: hero.gridY - 2, msg: `Geode! +${g.amount} ${g.symbol}`, color: '#88ccff' });
        }

        const newBonuses = hero.elementTracker.checkCompletions();
        if (newBonuses.length > 0) {
            hero.elementTracker.applyBonusRewards(hero);
            for (const bonus of newBonuses) {
                EventBus.emit('floatingText', { gx: hero.gridX, gy: hero.gridY, msg: `★ ${bonus.name} fullført! ${bonus.desc}`, color: '#ffcc00', big: true });
                EventBus.emit('discovery', {
                    type:      'elementBonus',
                    name:      bonus.name,
                    iconColor: 0xffcc00,
                    iconText:  '★',
                    subtitle:  bonus.desc,
                    desc:      'Belønning aktivert!',
                });
            }
        }
        Audio.playPickup();
        this._refresh();
    }

    // ── ALLOY TAB: Elements → Alloy ─────────────────────────────────────────


    _doCraftAlloy(alloyId) {
        const hero = this.heroRef;
        const result = this.smelter.craftAlloy(alloyId, hero);
        if (!result.success) return;

        this.smelter.consumeFuel(hero, result.energyCost);

        if (!hero.alloyInventory) hero.alloyInventory = {};
        hero.alloyInventory[alloyId] = (hero.alloyInventory[alloyId] || 0) + 1;

        EventBus.emit('floatingText', { gx: hero.gridX, gy: hero.gridY, msg: `Laget: ${result.alloy.name}!`, color: UI_TEXT.primary });

        Audio.playPickup();
        this._refresh();
    }

    // ── FORGE TAB: Alloy → Equipment ────────────────────────────────────────


    _doForge(alloyId, equipmentId) {
        const hero = this.heroRef;
        const result = this.smelter.forgeEquipment(equipmentId, hero);
        if (!result.success) return;

        // Consume one alloy unit
        hero.alloyInventory[alloyId]--;
        if (hero.alloyInventory[alloyId] <= 0) delete hero.alloyInventory[alloyId];

        // Add forged item to inventory
        const added = hero.inventory.addItem(result.item);
        if (!added) {
            EventBus.emit('spawnItem', { gx: hero.gridX, gy: hero.gridY, item: result.item });
        }

        EventBus.emit('floatingText', { gx: hero.gridX, gy: hero.gridY, msg: `Smidd: ${result.item.name}!`, color: '#ffaa44' });

        Audio.playPickup();
        this._refresh();
    }

    /** Forge a pet equipment piece (claws / collar / harness). */
    _doPetForge(alloyId, petEquipDef) {
        const hero = this.heroRef;
        if (!hero.alloyInventory || (hero.alloyInventory[alloyId] || 0) < 1) return;

        hero.alloyInventory[alloyId]--;
        if (hero.alloyInventory[alloyId] <= 0) delete hero.alloyInventory[alloyId];

        // Try to equip directly on the pet (auto-swap with old item to hero backpack).
        const gs = this.scene.get('GameScene');
        const pet = gs && gs.pet && gs.pet.alive ? gs.pet : null;
        if (pet) {
            const old = pet.equipItem(petEquipDef);
            if (old) {
                // Unequipped previous item → put in hero backpack or drop.
                if (!hero.inventory.addItem(old)) {
                    EventBus.emit('spawnItem', { gx: hero.gridX, gy: hero.gridY, item: old });
                }
            }
            EventBus.emit('floatingText', { gx: hero.gridX, gy: hero.gridY, msg: `${pet.petName}: ${petEquipDef.name}!`, color: '#ffaadd' });
        } else {
            // No living pet: put the item in hero's backpack for later.
            if (!hero.inventory.addItem(petEquipDef)) {
                EventBus.emit('spawnItem', { gx: hero.gridX, gy: hero.gridY, item: petEquipDef });
            }
            EventBus.emit('floatingText', { gx: hero.gridX, gy: hero.gridY, msg: `Smidd: ${petEquipDef.name}`, color: '#ffaadd' });
        }

        Audio.playPickup();
        this._refresh();
    }

    /**
     * Metallurg T4 "Reforge": reroll an equipped weapon's/armor's rarity
     * for 5 energy. Keeps the item type and base def, reassigns rarity stats.
     */
    _doReforge(slot) {
        const hero = this.heroRef;
        if (!hero.reforgeUnlocked) return;
        const eq = hero.inventory && hero.inventory.equipped ? hero.inventory.equipped[slot] : null;
        if (!eq) return;
        const fuel = this.smelter.calculateFuelEnergy(hero);
        if (fuel < 5) return;

        // Find the base item (without rarity multiplier) — rerolling from
        // the ITEM_DEFS entry keeps the reroll honest.
        const baseDef = (typeof ITEM_DEFS !== 'undefined' && ITEM_DEFS[eq.id])
            || (typeof ALLOY_EQUIPMENT !== 'undefined' && ALLOY_EQUIPMENT[eq.id]);
        if (!baseDef) return;

        this.smelter.consumeFuel(hero, 5);

        // Unequip first so _unapply removes old stats cleanly.
        hero.inventory._unapply(eq, hero);
        const worldNum = hero.worldNum || 1;
        const rolled = (typeof rollRarity === 'function' && typeof makeRarityItem === 'function')
            ? makeRarityItem(baseDef, rollRarity(worldNum))
            : { ...baseDef };
        hero.inventory.equipped[slot] = rolled;
        hero.inventory._apply(rolled, hero);

        EventBus.emit('floatingText', { gx: hero.gridX, gy: hero.gridY, msg: `Reforged: ${rolled.name}!`, color: '#ffcc44' });
        Audio.playPickup();
        this._refresh();
    }

    // ── REFINE TAB: Raw elements → Refined semiconductor-grade ────────────────


    // ── SEMI TAB: Refined elements + raw → Semiconductor materials ──────────
    // Bridges the refining step (REFINING_RECIPES) and the technology step
    // (TECH_UPGRADES). Without this, hero.alloyInventory[semiId] never grows
    // and tech installs are unreachable.


    // ── TECH TAB: Install permanent technology upgrades ─────────────────────


    // ── Element inventory display ────────────────────────────────────────────

    /** Build reverse lookup: element symbol → list of mineral names that yield it. */
    _getElementMineralSources() {
        if (this._elemSrcCache) return this._elemSrcCache;
        const map = {};
        if (typeof MINERAL_DEFS === 'undefined') return map;
        for (const [, mDef] of Object.entries(MINERAL_DEFS)) {
            if (!mDef.yields) continue;
            for (const y of mDef.yields) {
                if (!map[y.symbol]) map[y.symbol] = [];
                const name = (typeof getMineralDisplayName !== 'undefined')
                    ? getMineralDisplayName(mDef, this.heroRef) : mDef.name;
                if (!map[y.symbol].includes(name)) map[y.symbol].push(name);
            }
        }
        this._elemSrcCache = map;
        return map;
    }

    _drawElementInventory(startX, y, colW) {
        const collected = this.heroRef.elementTracker.collected;
        const entries = Object.entries(collected).filter(([, v]) => v > 0);
        if (entries.length === 0) return;

        this._d(this.add.text(startX, y, 'Lagrede grunnstoffer (klikk for å filtrere):', {
            fontSize: UI_FONTS.label, color: '#665544', fontFamily: UI_FONTS.family
        }));
        y += 20;

        const sources = this._getElementMineralSources();

        // Render as compact clickable badges
        let bx = startX, by = y;
        for (const [symbol, count] of entries) {
            const elem = typeof ELEMENTS !== 'undefined' ? ELEMENTS[symbol] : null;
            const col = elem ? elem.color : 0xaaaaaa;
            const hexCol = '#' + col.toString(16).padStart(6, '0');
            const isActive = this._elementFilter === symbol;

            const badge = this._d(this.add.text(bx, by, `${symbol}:${count}`, {
                fontSize: UI_FONTS.label, color: isActive ? '#ffffff' : hexCol, fontFamily: UI_FONTS.family,
                backgroundColor: isActive ? '#442200' : '#0a0818',
                padding: { x: 4, y: 2 }
            }).setInteractive({ useHandCursor: true }));

            const sym = symbol;
            badge.on('pointerover', () => {
                badge.setBackgroundColor('#221100');
                // Show mineral sources as tooltip-style text
                const srcList = sources[sym];
                if (srcList && srcList.length > 0) {
                    this._tooltipText = this._d(this.add.text(startX, by + 24, `${sym} ← ${srcList.join(', ')}`, {
                        fontSize: UI_FONTS.small, color: '#998877', fontFamily: UI_FONTS.family,
                        backgroundColor: '#0a0608', padding: { x: 4, y: 2 }
                    }));
                }
            });
            badge.on('pointerout', () => {
                badge.setBackgroundColor(isActive ? '#442200' : '#0a0818');
                if (this._tooltipText) {
                    this._tooltipText.destroy();
                    this._tooltipText = null;
                }
            });
            badge.on('pointerdown', () => {
                this._elementFilter = this._elementFilter === sym ? null : sym;
                this._scrollOffsets.smelt = 0;
                this._elemSrcCache = null;
                if (this._tab !== 'smelt') this._tab = 'smelt';
                this._refresh();
            });

            bx += badge.width + 6;
            if (bx > startX + colW - 50) {
                bx = startX;
                by += 24;
            }
        }
    }
}
