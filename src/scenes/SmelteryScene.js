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
        panel.fillStyle(0x0a0608, 0.97);
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
        uiGfx.fillStyle(0x0a0608, 0.82);
        uiGfx.fillRoundedRect(contentLeft, contentTop, contentW, contentH, 6);

        // Panel border
        panel.lineStyle(2, 0xff7722);
        panel.strokeRoundedRect(this.px, this.py, this.panelW, this.panelH, 8);

        // Title
        this.add.text(cx, this.py + 22, 'SMELTEOVN  –  Leirplass', {
            fontSize: '18px', color: '#ff7722', fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Fuel indicator
        const fuel = this.smelter.calculateFuelEnergy(this.heroRef);
        this._fuelText = this.add.text(this.px + this.panelW - 20, this.py + 22, `Brensel: ${fuel} energi`, {
            fontSize: '14px', color: '#886633', fontFamily: 'monospace'
        }).setOrigin(1, 0.5);

        // Element counts summary
        const tracker = this.heroRef.elementTracker;
        const elemCount = Object.keys(tracker.collected).length;
        this._elemText = this.add.text(this.px + 20, this.py + 22, `Grunnstoffer: ${elemCount}`, {
            fontSize: '14px', color: '#887766', fontFamily: 'monospace'
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
        const tabW = 130;
        const tabY = this.py + 62;
        tabs.forEach((tab, i) => {
            const tx = this.px + 30 + i * (tabW + 10) + tabW / 2;
            const active = this._tab === tab.id;
            const btn = this.add.text(tx, tabY, tab.label, {
                fontSize: '16px', color: active ? '#ff7722' : '#554433',
                fontFamily: 'monospace', fontStyle: active ? 'bold' : 'normal'
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });
            btn.on('pointerdown', () => { this._tab = tab.id; this._refresh(); });
            this._tabBtns.push(btn);
        });

        this.add.rectangle(cx, tabY + 18, this.panelW - 20, 1, 0x221100);

        // ── Close button ──────────────────────────────────────────────────────
        const closeBtn = this.add.text(this.px + this.panelW - 20, this.py + 10, '✕', {
            fontSize: '22px', color: '#886644', fontFamily: 'monospace'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        closeBtn.on('pointerdown', () => this.scene.stop());

        this.input.keyboard.on('keydown-ESC', () => this.scene.stop());
        this.input.keyboard.on('keydown-V', () => this.scene.stop());

        // ── Content area ──────────────────────────────────────────────────────
        this.contentY = tabY + 30;
        this._scrollOffsets = { stash: 0, smelt: 0, alloy: 0, forge: 0 };
        this._maxScrolls = { stash: 0, smelt: 0, alloy: 0, forge: 0 };
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

        // Dark backing behind content for readability
        const cbg = this._d(this.add.graphics());
        cbg.fillStyle(0x0a0608, 0.78);
        cbg.fillRoundedRect(this.px + 6, this.contentY - 4, this.panelW - 12, this.panelH - (this.contentY - this.py) - 10, 4);

        // Update tab button colors
        UIHelper.updateTabButtons(this._tabBtns, ['stash', 'smelt', 'alloy', 'forge'], this._tab, '#ff7722', '#554433');

        // Update fuel text
        const fuel = this.smelter.calculateFuelEnergy(this.heroRef);
        this._fuelText.setText(`Brensel: ${fuel} energi`);

        const stashCount = this.heroRef.campStash.reduce((s, e) => s + (e.count || 0), 0);
        const elemCount = Object.keys(this.heroRef.elementTracker.collected).length;
        this._elemText.setText(`Grunnstoffer: ${elemCount} | Lager: ${stashCount}`);

        switch (this._tab) {
            case 'stash': this._drawStashTab(); break;
            case 'smelt':
            case 'alloy':
            case 'forge':
                if (this._hasMetallurgSkill()) {
                    if (this._tab === 'smelt') this._drawSmeltTab();
                    else if (this._tab === 'alloy') this._drawAlloyTab();
                    else this._drawForgeTab();
                } else {
                    this._drawLockedTab();
                }
                break;
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
                fontSize: '12px', color: '#665544', fontFamily: 'monospace'
            }).setOrigin(0.5, 1));
        }
        if (maxScroll > 0 && scrollOff < maxScroll - 1) {
            this._d(this.add.text(this.px + this.panelW / 2, this.py + this.panelH - 14, '▼ mer ▼', {
                fontSize: '12px', color: '#665544', fontFamily: 'monospace'
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
            bar.fillStyle(0xff7722, 0.7);
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

    _drawLockedTab() {
        const cx = this.px + this.panelW / 2;
        const cy = this.contentY + (this.panelH - (this.contentY - this.py)) / 2 - 40;
        this._d(this.add.text(cx, cy, '🔒', { fontSize: '36px' }).setOrigin(0.5));
        this._d(this.add.text(cx, cy + 34, 'Krever Metallurg-skill!', {
            fontSize: '16px', color: '#ff7722', fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0.5));
        const hint = this._hasGeologSkill()
            ? 'Lær Rask smelting i skilltreet\nfor å bruke smelteovnen.'
            : 'Du trenger Geolog-skill først,\nderetter Metallurg-skill.';
        this._d(this.add.text(cx, cy + 58, hint, {
            fontSize: '14px', color: '#665544', fontFamily: 'monospace', align: 'center'
        }).setOrigin(0.5));
        this._contentEndY = this.contentY;
    }

    _d(obj) { this._dyn.push(obj); return obj; }

    // ── STASH TAB: Deposit/Withdraw items ──────────────────────────────────

    _drawStashTab() {
        const hero = this.heroRef;
        const cx = this.px + this.panelW / 2;
        let y = this.contentY;
        const colW = Math.min(460, this.panelW / 2 - 30);
        const leftX = this.px + 20;
        const rightX = cx + 10;
        const scrollOff = this._scrollOffsets.stash || 0;
        const visTop = this.contentY - 10;
        const visBot = this.py + this.panelH - 40;

        // ── Left side: Backpack (deposit from) ──────────────────────────────
        const hdrLeftY = y - scrollOff;
        if (hdrLeftY >= visTop && hdrLeftY <= visBot) {
            this._d(this.add.text(leftX, hdrLeftY, 'RYGGSEKK → Lager', {
                fontSize: '14px', color: '#887766', fontFamily: 'monospace', fontStyle: 'bold'
            }));
        }
        y += 20;

        let bpY = y;
        let hasDepositable = false;
        for (let i = 0; i < hero.inventory.backpack.length; i++) {
            const entry = hero.inventory.backpack[i];
            if (!entry) continue;
            const def = hero.inventory._getItemDef(entry);
            if (!def) continue;
            if (def.type !== 'mineral' && def.type !== 'fuel') continue;
            hasDepositable = true;

            const adjY = bpY - scrollOff;
            bpY += 22;
            if (adjY > visBot) { continue; }
            if (adjY < visTop) continue;

            const col = def.color || 0xaaaaaa;
            const hexCol = '#' + col.toString(16).padStart(6, '0');

            const stashDepName = (def.type === 'mineral' && typeof getMineralDisplayName !== 'undefined')
                ? getMineralDisplayName(def, hero) : def.name;
            this._d(this.add.text(leftX + 4, adjY, `${stashDepName} ×${entry.count}`, {
                fontSize: '14px', color: hexCol, fontFamily: 'monospace'
            }));

            const btn = this._d(this.add.text(leftX + colW - 10, adjY, '→', {
                fontSize: '16px', color: '#ff7722', fontFamily: 'monospace', fontStyle: 'bold'
            }).setOrigin(1, 0).setInteractive({ useHandCursor: true }));
            const slotIdx = i;
            btn.on('pointerover', () => btn.setColor('#ffaa44'));
            btn.on('pointerout', () => btn.setColor('#ff7722'));
            btn.on('pointerdown', () => this._depositItem(slotIdx));
        }
        if (!hasDepositable) {
            const adjY = y - scrollOff;
            if (adjY >= visTop && adjY <= visBot) {
                this._d(this.add.text(leftX + 4, adjY, 'Ingen mineraler/brensel', {
                    fontSize: '14px', color: '#444433', fontFamily: 'monospace'
                }));
            }
        }

        // ── Right side: Stash (withdraw from) ──────────────────────────────
        let sBaseY = this.contentY;
        const hdrRightY = sBaseY - scrollOff;
        if (hdrRightY >= visTop && hdrRightY <= visBot) {
            this._d(this.add.text(rightX, hdrRightY, 'LAGER → Ryggsekk', {
                fontSize: '14px', color: '#887766', fontFamily: 'monospace', fontStyle: 'bold'
            }));
        }
        sBaseY += 20;

        let sY = sBaseY;
        if (hero.campStash.length === 0) {
            const adjY = sBaseY - scrollOff;
            if (adjY >= visTop && adjY <= visBot) {
                this._d(this.add.text(rightX + 4, adjY, 'Lageret er tomt.', {
                    fontSize: '14px', color: '#444433', fontFamily: 'monospace'
                }));
            }
            sY = sBaseY + 22;
        } else {
            for (let si = 0; si < hero.campStash.length; si++) {
                const stashEntry = hero.campStash[si];
                if (!stashEntry || stashEntry.count <= 0) continue;

                const adjY = sY - scrollOff;
                sY += 22;
                if (adjY > visBot) { continue; }
                if (adjY < visTop) continue;

                const def = this._getStashItemDef(stashEntry.id);
                const rawStName = def ? def.name : stashEntry.id;
                const stName = (def && def.type === 'mineral' && typeof getMineralDisplayName !== 'undefined')
                    ? getMineralDisplayName(def, hero) : rawStName;
                const col = def ? def.color : 0xaaaaaa;
                const hexCol = '#' + col.toString(16).padStart(6, '0');

                this._d(this.add.text(rightX + 4, adjY, `${stName} ×${stashEntry.count}`, {
                    fontSize: '14px', color: hexCol, fontFamily: 'monospace'
                }));

                const btn = this._d(this.add.text(rightX + colW - 10, adjY, '←', {
                    fontSize: '16px', color: '#ff7722', fontFamily: 'monospace', fontStyle: 'bold'
                }).setOrigin(1, 0).setInteractive({ useHandCursor: true }));
                const idx = si;
                btn.on('pointerover', () => btn.setColor('#ffaa44'));
                btn.on('pointerout', () => btn.setColor('#ff7722'));
                btn.on('pointerdown', () => this._withdrawItem(idx));
            }
        }

        // Content end = bottom of the longer column
        this._contentEndY = Math.max(bpY, sY);

        // Stash capacity label
        const totalStashed = hero.campStash.reduce((s, e) => s + (e.count || 0), 0);
        this._d(this.add.text(cx, this.py + this.panelH - 24, `Lagret: ${totalStashed} gjenstander  |  Klikk → for å lagre, ← for å hente`, {
            fontSize: '14px', color: '#665544', fontFamily: 'monospace'
        }).setOrigin(0.5));
    }

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

    _drawSmeltTab() {
        const hero = this.heroRef;
        const cx = this.px + this.panelW / 2;
        let y = this.contentY;
        const scrollOff = this._scrollOffsets.smelt || 0;
        const visTop = this.contentY - 10;
        const visBot = this.py + this.panelH - 40;

        this._d(this.add.text(cx, y, 'Velg et mineral å smelte (ryggsekk + lager):', {
            fontSize: '14px', color: '#887766', fontFamily: 'monospace'
        }).setOrigin(0.5));
        y += 22;

        // Element filter indicator
        if (this._elementFilter) {
            const filterElem = typeof ELEMENTS !== 'undefined' ? ELEMENTS[this._elementFilter] : null;
            const fCol = filterElem ? '#' + filterElem.color.toString(16).padStart(6, '0') : '#ff7722';
            this._d(this.add.text(this.px + 20, y, `Filter: ${this._elementFilter}`, {
                fontSize: '14px', color: fCol, fontFamily: 'monospace', fontStyle: 'bold'
            }));
            const clearBtn = this._d(this.add.text(this.px + 110, y, '✕ Fjern filter', {
                fontSize: '14px', color: '#886644', fontFamily: 'monospace'
            }).setInteractive({ useHandCursor: true }));
            clearBtn.on('pointerover', () => clearBtn.setColor('#ffaa44'));
            clearBtn.on('pointerout', () => clearBtn.setColor('#886644'));
            clearBtn.on('pointerdown', () => { this._elementFilter = null; this._scrollOffsets.smelt = 0; this._refresh(); });
            y += 20;
        }

        // List minerals in backpack
        const minerals = [];
        for (let i = 0; i < hero.inventory.backpack.length; i++) {
            const entry = hero.inventory.backpack[i];
            if (!entry) continue;
            const def = hero.inventory._getItemDef(entry);
            if (def && def.type === 'mineral' && def.subtype === 'ore' && def.yields) {
                minerals.push({ source: 'backpack', slot: i, def, count: entry.count || 1 });
            }
        }

        // List minerals in camp stash
        for (let i = 0; i < hero.campStash.length; i++) {
            const stashEntry = hero.campStash[i];
            if (!stashEntry || stashEntry.count <= 0) continue;
            const def = this._getStashItemDef(stashEntry.id);
            if (def && def.type === 'mineral' && def.subtype === 'ore' && def.yields) {
                minerals.push({ source: 'stash', slot: i, def, count: stashEntry.count });
            }
        }

        // Apply element filter
        const filtered = this._elementFilter
            ? minerals.filter(m => m.def.yields.some(y => y.symbol === this._elementFilter))
            : minerals;

        if (filtered.length === 0) {
            const msg = this._elementFilter
                ? `Ingen mineraler gir ${this._elementFilter}.`
                : 'Ingen mineraler i ryggsekk eller lager.';
            this._d(this.add.text(cx, y + 30, msg, {
                fontSize: '14px', color: '#444433', fontFamily: 'monospace'
            }).setOrigin(0.5));
            // Still show element inventory
            this._drawElementInventory(this.px + 20, y + 60, Math.min(560, this.panelW - 40));
            this._contentEndY = y + 60 + 120;
            return;
        }

        const fuel = this.smelter.calculateFuelEnergy(hero);
        const colW = Math.min(560, this.panelW - 40);
        const startX = this.px + 20;
        const rowStep = 54;

        filtered.forEach((m, idx) => {
            const baseY = y + idx * rowStep;
            const my = baseY - scrollOff;
            if (my > visBot) { return; }
            if (my < visTop - 50) return;
            const check = this.smelter.canSmelt(m.def, fuel, hero);
            const col = check.canSmelt ? 0xff7722 : 0x443322;
            const hexCol = '#' + col.toString(16).padStart(6, '0');

            // Background
            const bg = this._d(this.add.graphics());
            bg.fillStyle(col, 0.08);
            bg.fillRoundedRect(startX, my, colW, 48, 4);
            bg.lineStyle(1, col, 0.3);
            bg.strokeRoundedRect(startX, my, colW, 48, 4);

            // Source label
            const srcLabel = m.source === 'stash' ? ' [lager]' : '';

            // Mineral name + count – show generic name if not identified
            const canId = (hero.mineralIdentifyLevel || 0) > 0;
            const rawName = (typeof getMineralDisplayName !== 'undefined')
                ? getMineralDisplayName(m.def, hero) : m.def.name;
            const mName = rawName.length > 28 ? rawName.slice(0, 27) + '…' : rawName;
            this._d(this.add.text(startX + 8, my + 6, `${mName} (×${m.count})${srcLabel}`, {
                fontSize: '15px', color: hexCol, fontFamily: 'monospace', fontStyle: 'bold'
            }));

            // Yield preview – hide element details if not identified
            // Highlight the filtered element
            if (canId) {
                let yieldX = startX + 8;
                this._d(this.add.text(yieldX, my + 26, '→ ', {
                    fontSize: '14px', color: '#776655', fontFamily: 'monospace'
                }));
                yieldX += 22;
                m.def.yields.forEach((yld, yi) => {
                    const isMatch = this._elementFilter && yld.symbol === this._elementFilter;
                    const yCol = isMatch ? '#ffcc44' : '#776655';
                    const txt = `${yld.symbol}×${yld.amount}${yi < m.def.yields.length - 1 ? ', ' : ''}`;
                    const t = this._d(this.add.text(yieldX, my + 26, txt, {
                        fontSize: '14px', color: yCol, fontFamily: 'monospace',
                        fontStyle: isMatch ? 'bold' : 'normal'
                    }));
                    yieldX += t.width;
                });
                this._d(this.add.text(yieldX + 4, my + 26, `|  Energi: ${check.energyCost}`, {
                    fontSize: '14px', color: '#776655', fontFamily: 'monospace'
                }));
            } else {
                this._d(this.add.text(startX + 8, my + 26, `→ ???  |  Energi: ${check.energyCost}`, {
                    fontSize: '14px', color: '#776655', fontFamily: 'monospace'
                }));
            }

            // Smelt button
            if (check.canSmelt) {
                const btn = this._d(this.add.text(startX + colW - 70, my + 14, '[ Smelt ]', {
                    fontSize: '15px', color: '#ff7722', fontFamily: 'monospace', fontStyle: 'bold'
                }).setInteractive({ useHandCursor: true }));
                btn.on('pointerover', () => btn.setColor('#ffaa44'));
                btn.on('pointerout', () => btn.setColor('#ff7722'));
                if (m.source === 'stash') {
                    btn.on('pointerdown', () => this._doSmeltFromStash(m.slot, m.def));
                } else {
                    btn.on('pointerdown', () => this._doSmelt(m.slot, m.def));
                }
            } else {
                this._d(this.add.text(startX + colW - 80, my + 14, 'Lite brensel', {
                    fontSize: '14px', color: '#443322', fontFamily: 'monospace'
                }));
            }
        });

        // Element inventory display
        const elemBaseY = y + filtered.length * rowStep + 10;
        const elemY = elemBaseY - scrollOff;
        if (elemY <= visBot) {
            this._drawElementInventory(startX, Math.max(elemY, visTop), colW);
        }
        this._contentEndY = elemBaseY + 120;
    }

    _doSmelt(slotIndex, mineralDef) {
        this._doSmeltFrom('backpack', slotIndex, mineralDef);
    }

    _doSmeltFromStash(stashIndex, mineralDef) {
        this._doSmeltFrom('stash', stashIndex, mineralDef);
    }

    /** Shared smelt logic for both backpack and stash sources. */
    _doSmeltFrom(source, index, mineralDef) {
        const hero = this.heroRef;
        const result = this.smelter.smelt(mineralDef, hero);

        this.smelter.consumeFuel(hero, result.energyCost);

        // Remove one mineral from source
        if (source === 'stash') {
            const stashEntry = hero.campStash[index];
            if (stashEntry) {
                stashEntry.count--;
                if (stashEntry.count <= 0) hero.campStash.splice(index, 1);
            }
        } else {
            const entry = hero.inventory.backpack[index];
            if (entry) {
                entry.count--;
                if (entry.count <= 0) hero.inventory.backpack[index] = null;
            }
        }

        const elemStr = result.elements.map(e => `${e.symbol}×${e.amount}`).join(', ');
        EventBus.emit('floatingText', { gx: hero.gridX, gy: hero.gridY, msg: `Smeltet: ${elemStr}`, color: '#ff7722' });

        const newBonuses = hero.elementTracker.checkCompletions();
        if (newBonuses.length > 0) {
            hero.elementTracker.applyBonusRewards(hero);
            for (const bonus of newBonuses) {
                EventBus.emit('floatingText', { gx: hero.gridX, gy: hero.gridY, msg: `${bonus.name} fullført! ${bonus.desc}`, color: '#ffcc00' });
            }
        }
        Audio.playPickup();
        this._refresh();
    }

    // ── ALLOY TAB: Elements → Alloy ─────────────────────────────────────────

    _drawAlloyTab() {
        const hero = this.heroRef;
        const cx = this.px + this.panelW / 2;
        let y = this.contentY;
        const scrollOff = this._scrollOffsets.alloy || 0;
        const visTop = this.contentY - 10;
        const visBot = this.py + this.panelH - 40;

        this._d(this.add.text(cx, y, 'Kombiner grunnstoffer til legeringer:', {
            fontSize: '14px', color: '#887766', fontFamily: 'monospace'
        }).setOrigin(0.5));
        y += 22;

        const fuel = this.smelter.calculateFuelEnergy(hero);
        const alloys = this.smelter.getAvailableAlloys(hero, fuel);
        const colW = Math.min(560, this.panelW - 40);
        const startX = this.px + 20;
        const rowStep = 60;

        if (alloys.length === 0) {
            this._d(this.add.text(cx, y + 30, 'Ingen legeringer tilgjengelig.', {
                fontSize: '14px', color: '#444433', fontFamily: 'monospace'
            }).setOrigin(0.5));
            this._drawElementInventory(startX, y + 60, colW);
            this._contentEndY = y + 60 + 120;
            return;
        }

        alloys.forEach((entry, idx) => {
            const baseY = y + idx * rowStep;
            const ay = baseY - scrollOff;
            if (ay > visBot) { return; }
            if (ay < visTop - 54) return;
            const a = entry.alloy;
            const col = entry.canCraft ? 0xff7722 : 0x443322;
            const hexCol = '#' + col.toString(16).padStart(6, '0');

            const bg = this._d(this.add.graphics());
            bg.fillStyle(col, 0.08);
            bg.fillRoundedRect(startX, ay, colW, 54, 4);
            bg.lineStyle(1, col, 0.3);
            bg.strokeRoundedRect(startX, ay, colW, 54, 4);

            // Alloy name + formula
            this._d(this.add.text(startX + 8, ay + 6, `${a.name} (${a.formula})`, {
                fontSize: '15px', color: hexCol, fontFamily: 'monospace', fontStyle: 'bold'
            }));

            // Recipe
            const recipeStr = a.recipe.map(r => {
                const have = hero.elementTracker.getCount(r.symbol);
                const ok = have >= r.amount;
                return `${r.symbol}: ${have}/${r.amount}${ok ? '' : '!'}`;
            }).join('  ');
            this._d(this.add.text(startX + 8, ay + 24, recipeStr, {
                fontSize: '14px', color: '#776655', fontFamily: 'monospace'
            }));

            // Stats preview
            const stats = a.statBonuses;
            const statStr = Object.entries(stats).map(([k, v]) => `+${v} ${k}`).join(', ');
            this._d(this.add.text(startX + 8, ay + 38, `Stats: ${statStr}  |  Energi: ${entry.energyCost}`, {
                fontSize: '13px', color: '#665544', fontFamily: 'monospace'
            }));

            if (entry.canCraft) {
                const btn = this._d(this.add.text(startX + colW - 60, ay + 16, '[ Lag ]', {
                    fontSize: '15px', color: '#ff7722', fontFamily: 'monospace', fontStyle: 'bold'
                }).setInteractive({ useHandCursor: true }));
                btn.on('pointerover', () => btn.setColor('#ffaa44'));
                btn.on('pointerout', () => btn.setColor('#ff7722'));
                btn.on('pointerdown', () => this._doCraftAlloy(a.id));
            }
        });

        // Element inventory
        const elemBaseY = y + alloys.length * rowStep + 10;
        const elemY = elemBaseY - scrollOff;
        if (elemY <= visBot) {
            this._drawElementInventory(startX, Math.max(elemY, visTop), colW);
        }
        this._contentEndY = elemBaseY + 120;
    }

    _doCraftAlloy(alloyId) {
        const hero = this.heroRef;
        const result = this.smelter.craftAlloy(alloyId, hero);
        if (!result.success) return;

        this.smelter.consumeFuel(hero, result.energyCost);

        // Store alloy in hero's alloy inventory
        if (!hero.alloyInventory) hero.alloyInventory = {};
        hero.alloyInventory[alloyId] = (hero.alloyInventory[alloyId] || 0) + 1;

        EventBus.emit('floatingText', { gx: hero.gridX, gy: hero.gridY, msg: `Laget: ${result.alloy.name}!`, color: '#ff7722' });

        Audio.playPickup();
        this._refresh();
    }

    // ── FORGE TAB: Alloy → Equipment ────────────────────────────────────────

    _drawForgeTab() {
        const hero = this.heroRef;
        const cx = this.px + this.panelW / 2;
        let y = this.contentY;
        const scrollOff = this._scrollOffsets.forge || 0;
        const visTop = this.contentY - 10;
        const visBot = this.py + this.panelH - 40;

        this._d(this.add.text(cx, y, 'Smi utstyr fra legeringer:', {
            fontSize: '14px', color: '#887766', fontFamily: 'monospace'
        }).setOrigin(0.5));
        y += 22;

        // List available alloys the player has
        const alloyInv = hero.alloyInventory || {};
        const available = Object.entries(alloyInv).filter(([, count]) => count > 0);
        const colW = Math.min(560, this.panelW - 40);
        const startX = this.px + 20;

        if (available.length === 0) {
            this._d(this.add.text(cx, y + 30, 'Ingen legeringer å smi med.\nLag legeringer i "Legering"-fanen først.', {
                fontSize: '14px', color: '#444433', fontFamily: 'monospace', align: 'center'
            }).setOrigin(0.5));
            this._contentEndY = y + 80;
            return;
        }

        let rowY = y;
        for (const [alloyId, count] of available) {
            const alloy = ALLOY_DEFS[alloyId];
            if (!alloy) continue;

            const adjHdr = rowY - scrollOff;
            if (adjHdr >= visTop && adjHdr <= visBot) {
                this._d(this.add.text(startX, adjHdr, `${alloy.name} (×${count}):`, {
                    fontSize: '15px', color: '#ff7722', fontFamily: 'monospace', fontStyle: 'bold'
                }));
            }
            rowY += 22;

            const equipment = this.smelter.getForgeableEquipment(alloyId);
            equipment.forEach(equip => {
                const adjY = rowY - scrollOff;
                rowY += 44;
                if (adjY > visBot) { return; }
                if (adjY < visTop - 40) return;

                const hexCol = '#' + (equip.color || 0xaabbcc).toString(16).padStart(6, '0');

                const bg = this._d(this.add.graphics());
                bg.fillStyle(equip.color || 0xaabbcc, 0.08);
                bg.fillRoundedRect(startX + 10, adjY, colW - 20, 40, 3);

                this._d(this.add.text(startX + 18, adjY + 6, `${equip.name} (${equip.type === 'weapon' ? 'Våpen' : 'Rustning'})`, {
                    fontSize: '14px', color: hexCol, fontFamily: 'monospace'
                }));
                this._d(this.add.text(startX + 18, adjY + 22, equip.desc, {
                    fontSize: '13px', color: '#776655', fontFamily: 'monospace',
                    wordWrap: { width: colW - 120 }
                }));

                const btn = this._d(this.add.text(startX + colW - 70, adjY + 12, '[ Smi ]', {
                    fontSize: '14px', color: '#ff7722', fontFamily: 'monospace', fontStyle: 'bold'
                }).setInteractive({ useHandCursor: true }));
                btn.on('pointerover', () => btn.setColor('#ffaa44'));
                btn.on('pointerout', () => btn.setColor('#ff7722'));
                btn.on('pointerdown', () => this._doForge(alloyId, equip.id));
            });
            rowY += 8;
        }
        this._contentEndY = rowY;
    }

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
            fontSize: '14px', color: '#665544', fontFamily: 'monospace'
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
                fontSize: '14px', color: isActive ? '#ffffff' : hexCol, fontFamily: 'monospace',
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
                        fontSize: '12px', color: '#998877', fontFamily: 'monospace',
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
