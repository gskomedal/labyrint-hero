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
        this.panelW = Math.min(W - 10, 700);
        this.panelH = Math.min(H - 10, 500);
        this.px = cx - this.panelW / 2;
        this.py = cy - this.panelH / 2;

        // ── Camp background art (behind everything) ──────────────────────────
        const panel = this.add.graphics();
        panel.fillStyle(0x0a0608, 0.97);
        panel.fillRoundedRect(this.px, this.py, this.panelW, this.panelH, 8);
        if (SceneBackgrounds.addCampBackground) {
            SceneBackgrounds.addCampBackground(this, this.px, this.py, this.panelW, this.panelH);
        }

        // ── Character portrait (sits in the scene, lower-right of bg) ─────────
        const portraitSize = 120;
        const portraitX = this.px + this.panelW - portraitSize - 6;
        const portraitY = this.py + this.panelH - portraitSize - 6;
        const portraitGfx = this.add.graphics();
        if (this.heroRef) {
            const eq = this.heroRef.inventory ? this.heroRef.inventory.equipped : {};
            if (typeof drawDetailedCharacterSprite === 'function') {
                drawDetailedCharacterSprite(portraitGfx, portraitX, portraitY, portraitSize, this.heroRef.appearance, this.heroRef.race, eq);
            } else {
                drawCharacterSprite(portraitGfx, portraitX, portraitY, portraitSize, this.heroRef.appearance, this.heroRef.race);
            }
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
        this.add.text(cx, this.py + 18, 'SMELTEOVN  –  Leirplass', {
            fontSize: '14px', color: '#ff7722', fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Fuel indicator
        const fuel = this.smelter.calculateFuelEnergy(this.heroRef);
        this._fuelText = this.add.text(this.px + this.panelW - 20, this.py + 18, `Brensel: ${fuel} energi`, {
            fontSize: '12px', color: '#886633', fontFamily: 'monospace'
        }).setOrigin(1, 0.5);

        // Element counts summary
        const tracker = this.heroRef.elementTracker;
        const elemCount = Object.keys(tracker.collected).length;
        this._elemText = this.add.text(this.px + 20, this.py + 18, `Grunnstoffer: ${elemCount}`, {
            fontSize: '12px', color: '#887766', fontFamily: 'monospace'
        }).setOrigin(0, 0.5);

        this.add.rectangle(cx, this.py + 34, this.panelW - 20, 1, 0x332200);

        // ── Tab buttons ───────────────────────────────────────────────────────
        this._tabBtns = [];
        const tabs = [
            { id: 'stash', label: 'Lager' },
            { id: 'smelt', label: 'Smelt' },
            { id: 'alloy', label: 'Legering' },
            { id: 'forge', label: 'Smi' },
        ];
        const tabW = 110;
        const tabY = this.py + 50;
        tabs.forEach((tab, i) => {
            const tx = this.px + 30 + i * (tabW + 10) + tabW / 2;
            const active = this._tab === tab.id;
            const btn = this.add.text(tx, tabY, tab.label, {
                fontSize: '13px', color: active ? '#ff7722' : '#554433',
                fontFamily: 'monospace', fontStyle: active ? 'bold' : 'normal'
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });
            btn.on('pointerdown', () => { this._tab = tab.id; this._refresh(); });
            this._tabBtns.push(btn);
        });

        this.add.rectangle(cx, tabY + 14, this.panelW - 20, 1, 0x221100);

        // ── Close button ──────────────────────────────────────────────────────
        const closeBtn = this.add.text(this.px + this.panelW - 20, this.py + 8, '✕', {
            fontSize: '18px', color: '#886644', fontFamily: 'monospace'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        closeBtn.on('pointerdown', () => this.scene.stop());

        this.input.keyboard.on('keydown-ESC', () => this.scene.stop());
        this.input.keyboard.on('keydown-V', () => this.scene.stop());

        // ── Content area ──────────────────────────────────────────────────────
        this.contentY = tabY + 24;
        this._refresh();
    }

    _refresh() {
        UIHelper.clearDynamic(this._dyn);

        // Dark backing behind content for readability
        const cbg = this._d(this.add.graphics());
        cbg.fillStyle(0x0a0608, 0.78);
        cbg.fillRoundedRect(this.px + 6, this.contentY - 4, this.panelW - 150, this.panelH - (this.contentY - this.py) - 10, 4);

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
            case 'smelt': this._drawSmeltTab(); break;
            case 'alloy': this._drawAlloyTab(); break;
            case 'forge': this._drawForgeTab(); break;
        }
    }

    _d(obj) { this._dyn.push(obj); return obj; }

    // ── STASH TAB: Deposit/Withdraw items ──────────────────────────────────

    _drawStashTab() {
        const hero = this.heroRef;
        const cx = this.px + this.panelW / 2;
        let y = this.contentY;
        const colW = Math.min(320, this.panelW / 2 - 30);
        const leftX = this.px + 20;
        const rightX = cx + 10;

        // ── Left side: Backpack (deposit from) ──────────────────────────────
        this._d(this.add.text(leftX, y, 'RYGGSEKK → Lager', {
            fontSize: '12px', color: '#887766', fontFamily: 'monospace', fontStyle: 'bold'
        }));
        y += 16;

        let bpY = y;
        let hasDepositable = false;
        for (let i = 0; i < hero.inventory.backpack.length; i++) {
            const entry = hero.inventory.backpack[i];
            if (!entry) continue;
            const def = hero.inventory._getItemDef(entry);
            if (!def) continue;
            // Only allow depositing minerals, fuel, and alloy-type items
            if (def.type !== 'mineral' && def.type !== 'fuel') continue;
            if (bpY > this.py + this.panelH - 60) break;
            hasDepositable = true;

            const col = def.color || 0xaaaaaa;
            const hexCol = '#' + col.toString(16).padStart(6, '0');

            this._d(this.add.text(leftX + 4, bpY, `${def.name} ×${entry.count}`, {
                fontSize: '12px', color: hexCol, fontFamily: 'monospace'
            }));

            const btn = this._d(this.add.text(leftX + colW - 10, bpY, '→', {
                fontSize: '12px', color: '#ff7722', fontFamily: 'monospace', fontStyle: 'bold'
            }).setOrigin(1, 0).setInteractive({ useHandCursor: true }));
            const slotIdx = i;
            btn.on('pointerover', () => btn.setColor('#ffaa44'));
            btn.on('pointerout', () => btn.setColor('#ff7722'));
            btn.on('pointerdown', () => this._depositItem(slotIdx));
            bpY += 20;
        }
        if (!hasDepositable) {
            this._d(this.add.text(leftX + 4, bpY, 'Ingen mineraler/brensel', {
                fontSize: '13px', color: '#444433', fontFamily: 'monospace'
            }));
        }

        // ── Right side: Stash (withdraw from) ──────────────────────────────
        let sY = this.contentY;
        this._d(this.add.text(rightX, sY, 'LAGER → Ryggsekk', {
            fontSize: '12px', color: '#887766', fontFamily: 'monospace', fontStyle: 'bold'
        }));
        sY += 16;

        if (hero.campStash.length === 0) {
            this._d(this.add.text(rightX + 4, sY, 'Lageret er tomt.', {
                fontSize: '13px', color: '#444433', fontFamily: 'monospace'
            }));
        } else {
            for (let si = 0; si < hero.campStash.length; si++) {
                const stashEntry = hero.campStash[si];
                if (!stashEntry || stashEntry.count <= 0) continue;
                if (sY > this.py + this.panelH - 60) break;

                const def = this._getStashItemDef(stashEntry.id);
                const name = def ? def.name : stashEntry.id;
                const col = def ? def.color : 0xaaaaaa;
                const hexCol = '#' + col.toString(16).padStart(6, '0');

                this._d(this.add.text(rightX + 4, sY, `${name} ×${stashEntry.count}`, {
                    fontSize: '12px', color: hexCol, fontFamily: 'monospace'
                }));

                const btn = this._d(this.add.text(rightX + colW - 10, sY, '←', {
                    fontSize: '12px', color: '#ff7722', fontFamily: 'monospace', fontStyle: 'bold'
                }).setOrigin(1, 0).setInteractive({ useHandCursor: true }));
                const idx = si;
                btn.on('pointerover', () => btn.setColor('#ffaa44'));
                btn.on('pointerout', () => btn.setColor('#ff7722'));
                btn.on('pointerdown', () => this._withdrawItem(idx));
                sY += 20;
            }
        }

        // Stash capacity label
        const totalStashed = hero.campStash.reduce((s, e) => s + (e.count || 0), 0);
        this._d(this.add.text(cx, this.py + this.panelH - 30, `Lagret: ${totalStashed} gjenstander  |  Klikk → for å lagre, ← for å hente`, {
            fontSize: '13px', color: '#665544', fontFamily: 'monospace'
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

        this._d(this.add.text(cx, y, 'Velg et mineral å smelte (ryggsekk + lager):', {
            fontSize: '12px', color: '#887766', fontFamily: 'monospace'
        }).setOrigin(0.5));
        y += 18;

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

        if (minerals.length === 0) {
            this._d(this.add.text(cx, y + 30, 'Ingen mineraler i ryggsekk eller lager.', {
                fontSize: '13px', color: '#444433', fontFamily: 'monospace'
            }).setOrigin(0.5));
            return;
        }

        const fuel = this.smelter.calculateFuelEnergy(hero);
        const colW = Math.min(320, this.panelW - 40);
        const startX = cx - colW / 2;

        minerals.forEach((m, idx) => {
            const my = y + idx * 52;
            if (my > this.py + this.panelH - 60) return; // overflow guard
            const check = this.smelter.canSmelt(m.def, fuel, hero);
            const col = check.canSmelt ? 0xff7722 : 0x443322;
            const hexCol = '#' + col.toString(16).padStart(6, '0');

            // Background
            const bg = this._d(this.add.graphics());
            bg.fillStyle(col, 0.08);
            bg.fillRoundedRect(startX, my, colW, 46, 4);
            bg.lineStyle(1, col, 0.3);
            bg.strokeRoundedRect(startX, my, colW, 46, 4);

            // Source label
            const srcLabel = m.source === 'stash' ? ' [lager]' : '';

            // Mineral name + count – truncate to fit slot
            const mName = m.def.name.length > 22 ? m.def.name.slice(0, 21) + '…' : m.def.name;
            this._d(this.add.text(startX + 8, my + 6, `${mName} (×${m.count})${srcLabel}`, {
                fontSize: '13px', color: hexCol, fontFamily: 'monospace', fontStyle: 'bold'
            }));

            // Yield preview
            const yieldStr = m.def.yields.map(y => `${y.symbol}×${y.amount}`).join(', ');
            this._d(this.add.text(startX + 8, my + 22, `→ ${yieldStr}  |  Energi: ${check.energyCost}`, {
                fontSize: '13px', color: '#776655', fontFamily: 'monospace'
            }));

            // Smelt button
            if (check.canSmelt) {
                const btn = this._d(this.add.text(startX + colW - 60, my + 12, '[ Smelt ]', {
                    fontSize: '13px', color: '#ff7722', fontFamily: 'monospace', fontStyle: 'bold'
                }).setInteractive({ useHandCursor: true }));
                btn.on('pointerover', () => btn.setColor('#ffaa44'));
                btn.on('pointerout', () => btn.setColor('#ff7722'));
                if (m.source === 'stash') {
                    btn.on('pointerdown', () => this._doSmeltFromStash(m.slot, m.def));
                } else {
                    btn.on('pointerdown', () => this._doSmelt(m.slot, m.def));
                }
            } else {
                this._d(this.add.text(startX + colW - 70, my + 12, 'Lite brensel', {
                    fontSize: '13px', color: '#443322', fontFamily: 'monospace'
                }));
            }
        });

        // Element inventory display
        const elemY = y + Math.min(minerals.length, 6) * 52 + 10;
        this._drawElementInventory(startX, elemY, colW);
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

        if (!hero.metallurgistUnlocked) {
            hero.metallurgistUnlocked = true;
            EventBus.emit('floatingText', { gx: hero.gridX, gy: hero.gridY - 1, msg: 'Metallurg-stien er ulåst!', color: '#ff7722' });
        }

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

        hero.elementTracker.checkCompletions();
        Audio.playPickup();
        this._refresh();
    }

    // ── ALLOY TAB: Elements → Alloy ─────────────────────────────────────────

    _drawAlloyTab() {
        const hero = this.heroRef;
        const cx = this.px + this.panelW / 2;
        let y = this.contentY;

        this._d(this.add.text(cx, y, 'Kombiner grunnstoffer til legeringer:', {
            fontSize: '12px', color: '#887766', fontFamily: 'monospace'
        }).setOrigin(0.5));
        y += 18;

        const fuel = this.smelter.calculateFuelEnergy(hero);
        const alloys = this.smelter.getAvailableAlloys(hero, fuel);
        const colW = Math.min(320, this.panelW - 40);
        const startX = cx - colW / 2;

        if (alloys.length === 0) {
            this._d(this.add.text(cx, y + 30, 'Ingen legeringer tilgjengelig.', {
                fontSize: '13px', color: '#444433', fontFamily: 'monospace'
            }).setOrigin(0.5));
            return;
        }

        alloys.forEach((entry, idx) => {
            const ay = y + idx * 56;
            if (ay > this.py + this.panelH - 80) return;
            const a = entry.alloy;
            const col = entry.canCraft ? 0xff7722 : 0x443322;
            const hexCol = '#' + col.toString(16).padStart(6, '0');

            const bg = this._d(this.add.graphics());
            bg.fillStyle(col, 0.08);
            bg.fillRoundedRect(startX, ay, colW, 50, 4);
            bg.lineStyle(1, col, 0.3);
            bg.strokeRoundedRect(startX, ay, colW, 50, 4);

            // Alloy name + formula
            this._d(this.add.text(startX + 8, ay + 6, `${a.name} (${a.formula})`, {
                fontSize: '13px', color: hexCol, fontFamily: 'monospace', fontStyle: 'bold'
            }));

            // Recipe
            const recipeStr = a.recipe.map(r => {
                const have = hero.elementTracker.getCount(r.symbol);
                const ok = have >= r.amount;
                return `${r.symbol}: ${have}/${r.amount}${ok ? '' : '!'}`;
            }).join('  ');
            this._d(this.add.text(startX + 8, ay + 22, recipeStr, {
                fontSize: '13px', color: '#776655', fontFamily: 'monospace'
            }));

            // Stats preview
            const stats = a.statBonuses;
            const statStr = Object.entries(stats).map(([k, v]) => `+${v} ${k}`).join(', ');
            this._d(this.add.text(startX + 8, ay + 34, `Stats: ${statStr}  |  Energi: ${entry.energyCost}`, {
                fontSize: '12px', color: '#665544', fontFamily: 'monospace'
            }));

            if (entry.canCraft) {
                const btn = this._d(this.add.text(startX + colW - 50, ay + 14, '[ Lag ]', {
                    fontSize: '13px', color: '#ff7722', fontFamily: 'monospace', fontStyle: 'bold'
                }).setInteractive({ useHandCursor: true }));
                btn.on('pointerover', () => btn.setColor('#ffaa44'));
                btn.on('pointerout', () => btn.setColor('#ff7722'));
                btn.on('pointerdown', () => this._doCraftAlloy(a.id));
            }
        });

        // Element inventory
        const elemY = y + Math.min(alloys.length, 6) * 56 + 10;
        this._drawElementInventory(startX, elemY, colW);
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

        this._d(this.add.text(cx, y, 'Smi utstyr fra legeringer:', {
            fontSize: '12px', color: '#887766', fontFamily: 'monospace'
        }).setOrigin(0.5));
        y += 18;

        // List available alloys the player has
        const alloyInv = hero.alloyInventory || {};
        const available = Object.entries(alloyInv).filter(([, count]) => count > 0);
        const colW = Math.min(320, this.panelW - 40);
        const startX = cx - colW / 2;

        if (available.length === 0) {
            this._d(this.add.text(cx, y + 30, 'Ingen legeringer å smi med.\nLag legeringer i "Lag legering"-fanen først.', {
                fontSize: '12px', color: '#444433', fontFamily: 'monospace', align: 'center'
            }).setOrigin(0.5));
            return;
        }

        let rowY = y;
        for (const [alloyId, count] of available) {
            const alloy = ALLOY_DEFS[alloyId];
            if (!alloy) continue;

            this._d(this.add.text(startX, rowY, `${alloy.name} (×${count}):`, {
                fontSize: '13px', color: '#ff7722', fontFamily: 'monospace', fontStyle: 'bold'
            }));
            rowY += 18;

            const equipment = this.smelter.getForgeableEquipment(alloyId);
            equipment.forEach(equip => {
                if (rowY > this.py + this.panelH - 50) return;
                const hexCol = '#' + (equip.color || 0xaabbcc).toString(16).padStart(6, '0');

                const bg = this._d(this.add.graphics());
                bg.fillStyle(equip.color || 0xaabbcc, 0.08);
                bg.fillRoundedRect(startX + 10, rowY, colW - 20, 36, 3);

                this._d(this.add.text(startX + 18, rowY + 6, `${equip.name} (${equip.type === 'weapon' ? 'Våpen' : 'Rustning'})`, {
                    fontSize: '12px', color: hexCol, fontFamily: 'monospace'
                }));
                this._d(this.add.text(startX + 18, rowY + 20, equip.desc, {
                    fontSize: '11px', color: '#776655', fontFamily: 'monospace',
                    wordWrap: { width: colW - 100 }
                }));

                const btn = this._d(this.add.text(startX + colW - 60, rowY + 10, '[ Smi ]', {
                    fontSize: '12px', color: '#ff7722', fontFamily: 'monospace', fontStyle: 'bold'
                }).setInteractive({ useHandCursor: true }));
                btn.on('pointerover', () => btn.setColor('#ffaa44'));
                btn.on('pointerout', () => btn.setColor('#ff7722'));
                btn.on('pointerdown', () => this._doForge(alloyId, equip.id));

                rowY += 40;
            });
            rowY += 6;
        }
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

    _drawElementInventory(startX, y, colW) {
        const collected = this.heroRef.elementTracker.collected;
        const entries = Object.entries(collected).filter(([, v]) => v > 0);
        if (entries.length === 0) return;

        this._d(this.add.text(startX, y, 'Lagrede grunnstoffer:', {
            fontSize: '13px', color: '#665544', fontFamily: 'monospace'
        }));
        y += 14;

        // Render as compact badges
        let bx = startX, by = y;
        for (const [symbol, count] of entries) {
            const elem = typeof ELEMENTS !== 'undefined' ? ELEMENTS[symbol] : null;
            const col = elem ? elem.color : 0xaaaaaa;
            const hexCol = '#' + col.toString(16).padStart(6, '0');

            const badge = this._d(this.add.text(bx, by, `${symbol}:${count}`, {
                fontSize: '13px', color: hexCol, fontFamily: 'monospace',
                backgroundColor: '#0a0818', padding: { x: 3, y: 1 }
            }));
            bx += badge.width + 6;
            if (bx > startX + colW - 40) {
                bx = startX;
                by += 16;
            }
        }
    }
}
