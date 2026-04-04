// ─── Labyrint Hero – Smeltery Scene (Camp Room) ──────────────────────────────
// Overlay scene for smelting minerals into elements and crafting alloys.
// Opens when hero enters a Camp Room tile or via V key while in Camp Room.
// Three tabs: Smelt (minerals→elements), Alloy (elements→alloy), Forge (alloy→equipment).

class SmelteryScene extends Phaser.Scene {
    constructor() { super({ key: 'SmelteryScene' }); }

    init(data) {
        this.heroRef = data.heroRef || null;
        this.gs = data.gameScene || null;
    }

    create() {
        const { width: W, height: H } = this.cameras.main;
        const cx = W / 2, cy = H / 2;
        this.smelter = new SmeltingSystem();
        this._dyn = [];
        this._tab = 'smelt'; // 'smelt' | 'alloy' | 'forge'

        // ── Dim overlay ───────────────────────────────────────────────────────
        this.add.rectangle(cx, cy, W, H, 0x000000, 0.82);

        // ── Panel ─────────────────────────────────────────────────────────────
        this.panelW = Math.min(W - 10, 700);
        this.panelH = Math.min(H - 10, 500);
        this.px = cx - this.panelW / 2;
        this.py = cy - this.panelH / 2;

        const panel = this.add.graphics();
        panel.fillStyle(0x0a0818, 0.97);
        panel.fillRoundedRect(this.px, this.py, this.panelW, this.panelH, 8);
        panel.lineStyle(2, 0xff7722);
        panel.strokeRoundedRect(this.px, this.py, this.panelW, this.panelH, 8);

        // Title
        this.add.text(cx, this.py + 18, 'SMELTEOVN  –  Leirplass', {
            fontSize: '14px', color: '#ff7722', fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Fuel indicator
        const fuel = this.smelter.calculateFuelEnergy(this.heroRef);
        this._fuelText = this.add.text(this.px + this.panelW - 20, this.py + 18, `Brensel: ${fuel} energi`, {
            fontSize: '10px', color: '#886633', fontFamily: 'monospace'
        }).setOrigin(1, 0.5);

        // Element counts summary
        const tracker = this.heroRef.elementTracker;
        const elemCount = Object.keys(tracker.collected).length;
        this._elemText = this.add.text(this.px + 20, this.py + 18, `Grunnstoffer: ${elemCount}`, {
            fontSize: '10px', color: '#887766', fontFamily: 'monospace'
        }).setOrigin(0, 0.5);

        this.add.rectangle(cx, this.py + 34, this.panelW - 20, 1, 0x332200);

        // ── Tab buttons ───────────────────────────────────────────────────────
        this._tabBtns = [];
        const tabs = [
            { id: 'smelt', label: 'Smelt mineral' },
            { id: 'alloy', label: 'Lag legering' },
            { id: 'forge', label: 'Smi utstyr' },
        ];
        const tabW = 140, tabY = this.py + 50;
        tabs.forEach((tab, i) => {
            const tx = this.px + 30 + i * (tabW + 10) + tabW / 2;
            const active = this._tab === tab.id;
            const btn = this.add.text(tx, tabY, tab.label, {
                fontSize: '11px', color: active ? '#ff7722' : '#554433',
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
        for (const o of this._dyn) { if (o && o.destroy) o.destroy(); }
        this._dyn = [];

        // Update tab button colors
        const tabs = ['smelt', 'alloy', 'forge'];
        this._tabBtns.forEach((btn, i) => {
            btn.setColor(this._tab === tabs[i] ? '#ff7722' : '#554433');
            btn.setFontStyle(this._tab === tabs[i] ? 'bold' : 'normal');
        });

        // Update fuel text
        const fuel = this.smelter.calculateFuelEnergy(this.heroRef);
        this._fuelText.setText(`Brensel: ${fuel} energi`);

        const elemCount = Object.keys(this.heroRef.elementTracker.collected).length;
        this._elemText.setText(`Grunnstoffer: ${elemCount}`);

        switch (this._tab) {
            case 'smelt': this._drawSmeltTab(); break;
            case 'alloy': this._drawAlloyTab(); break;
            case 'forge': this._drawForgeTab(); break;
        }
    }

    _d(obj) { this._dyn.push(obj); return obj; }

    // ── SMELT TAB: Minerals → Elements ──────────────────────────────────────

    _drawSmeltTab() {
        const hero = this.heroRef;
        const cx = this.px + this.panelW / 2;
        let y = this.contentY;

        this._d(this.add.text(cx, y, 'Velg et mineral fra ryggsekken å smelte:', {
            fontSize: '10px', color: '#887766', fontFamily: 'monospace'
        }).setOrigin(0.5));
        y += 18;

        // List minerals in backpack
        const minerals = [];
        for (let i = 0; i < hero.inventory.backpack.length; i++) {
            const entry = hero.inventory.backpack[i];
            if (!entry) continue;
            const def = hero.inventory._getItemDef(entry);
            if (def && def.type === 'mineral' && def.subtype === 'ore' && def.yields) {
                minerals.push({ slot: i, def, count: entry.count || 1 });
            }
        }

        if (minerals.length === 0) {
            this._d(this.add.text(cx, y + 30, 'Ingen mineraler i ryggsekken.', {
                fontSize: '11px', color: '#444433', fontFamily: 'monospace'
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

            // Mineral name + count
            this._d(this.add.text(startX + 8, my + 6, `${m.def.name} (×${m.count})`, {
                fontSize: '11px', color: hexCol, fontFamily: 'monospace', fontStyle: 'bold'
            }));

            // Yield preview
            const yieldStr = m.def.yields.map(y => `${y.symbol}×${y.amount}`).join(', ');
            this._d(this.add.text(startX + 8, my + 22, `→ ${yieldStr}  |  Energi: ${check.energyCost}`, {
                fontSize: '9px', color: '#776655', fontFamily: 'monospace'
            }));

            // Smelt button
            if (check.canSmelt) {
                const btn = this._d(this.add.text(startX + colW - 60, my + 12, '[ Smelt ]', {
                    fontSize: '11px', color: '#ff7722', fontFamily: 'monospace', fontStyle: 'bold'
                }).setInteractive({ useHandCursor: true }));
                btn.on('pointerover', () => btn.setColor('#ffaa44'));
                btn.on('pointerout', () => btn.setColor('#ff7722'));
                btn.on('pointerdown', () => this._doSmelt(m.slot, m.def));
            } else {
                this._d(this.add.text(startX + colW - 70, my + 12, 'Lite brensel', {
                    fontSize: '9px', color: '#443322', fontFamily: 'monospace'
                }));
            }
        });

        // Element inventory display
        const elemY = y + Math.min(minerals.length, 6) * 52 + 10;
        this._drawElementInventory(startX, elemY, colW);
    }

    _doSmelt(slotIndex, mineralDef) {
        const hero = this.heroRef;
        const result = this.smelter.smelt(mineralDef, hero);

        // Consume fuel
        this.smelter.consumeFuel(hero, result.energyCost);

        // Unlock metallurgist path on first smelt
        if (!hero.metallurgistUnlocked) {
            hero.metallurgistUnlocked = true;
            if (this.gs) {
                this.gs._floatingText(hero.gridX, hero.gridY - 1, 'Metallurg-stien er ulåst!', '#ff7722');
            }
        }

        // Remove one mineral from slot
        const entry = hero.inventory.backpack[slotIndex];
        if (entry) {
            entry.count--;
            if (entry.count <= 0) hero.inventory.backpack[slotIndex] = null;
        }

        // Show result
        const elemStr = result.elements.map(e => `${e.symbol}×${e.amount}`).join(', ');
        if (this.gs) {
            this.gs._floatingText(hero.gridX, hero.gridY, `Smeltet: ${elemStr}`, '#ff7722');
        }

        // Check completions
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
            fontSize: '10px', color: '#887766', fontFamily: 'monospace'
        }).setOrigin(0.5));
        y += 18;

        const fuel = this.smelter.calculateFuelEnergy(hero);
        const alloys = this.smelter.getAvailableAlloys(hero, fuel);
        const colW = Math.min(320, this.panelW - 40);
        const startX = cx - colW / 2;

        if (alloys.length === 0) {
            this._d(this.add.text(cx, y + 30, 'Ingen legeringer tilgjengelig.', {
                fontSize: '11px', color: '#444433', fontFamily: 'monospace'
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
                fontSize: '11px', color: hexCol, fontFamily: 'monospace', fontStyle: 'bold'
            }));

            // Recipe
            const recipeStr = a.recipe.map(r => {
                const have = hero.elementTracker.getCount(r.symbol);
                const ok = have >= r.amount;
                return `${r.symbol}: ${have}/${r.amount}${ok ? '' : '!'}`;
            }).join('  ');
            this._d(this.add.text(startX + 8, ay + 22, recipeStr, {
                fontSize: '9px', color: '#776655', fontFamily: 'monospace'
            }));

            // Stats preview
            const stats = a.statBonuses;
            const statStr = Object.entries(stats).map(([k, v]) => `+${v} ${k}`).join(', ');
            this._d(this.add.text(startX + 8, ay + 34, `Stats: ${statStr}  |  Energi: ${entry.energyCost}`, {
                fontSize: '8px', color: '#665544', fontFamily: 'monospace'
            }));

            if (entry.canCraft) {
                const btn = this._d(this.add.text(startX + colW - 50, ay + 14, '[ Lag ]', {
                    fontSize: '11px', color: '#ff7722', fontFamily: 'monospace', fontStyle: 'bold'
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

        if (this.gs) {
            this.gs._floatingText(hero.gridX, hero.gridY, `Laget: ${result.alloy.name}!`, '#ff7722');
        }

        Audio.playPickup();
        this._refresh();
    }

    // ── FORGE TAB: Alloy → Equipment ────────────────────────────────────────

    _drawForgeTab() {
        const hero = this.heroRef;
        const cx = this.px + this.panelW / 2;
        let y = this.contentY;

        this._d(this.add.text(cx, y, 'Smi utstyr fra legeringer:', {
            fontSize: '10px', color: '#887766', fontFamily: 'monospace'
        }).setOrigin(0.5));
        y += 18;

        // List available alloys the player has
        const alloyInv = hero.alloyInventory || {};
        const available = Object.entries(alloyInv).filter(([, count]) => count > 0);
        const colW = Math.min(320, this.panelW - 40);
        const startX = cx - colW / 2;

        if (available.length === 0) {
            this._d(this.add.text(cx, y + 30, 'Ingen legeringer å smi med.\nLag legeringer i "Lag legering"-fanen først.', {
                fontSize: '10px', color: '#444433', fontFamily: 'monospace', align: 'center'
            }).setOrigin(0.5));
            return;
        }

        let rowY = y;
        for (const [alloyId, count] of available) {
            const alloy = ALLOY_DEFS[alloyId];
            if (!alloy) continue;

            this._d(this.add.text(startX, rowY, `${alloy.name} (×${count}):`, {
                fontSize: '11px', color: '#ff7722', fontFamily: 'monospace', fontStyle: 'bold'
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
                    fontSize: '10px', color: hexCol, fontFamily: 'monospace'
                }));
                this._d(this.add.text(startX + 18, rowY + 20, equip.desc, {
                    fontSize: '8px', color: '#776655', fontFamily: 'monospace'
                }));

                const btn = this._d(this.add.text(startX + colW - 60, rowY + 10, '[ Smi ]', {
                    fontSize: '10px', color: '#ff7722', fontFamily: 'monospace', fontStyle: 'bold'
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
        if (!added && this.gs) {
            this.gs.itemSpawner.spawnItemAt(hero.gridX, hero.gridY, result.item);
        }

        if (this.gs) {
            this.gs._floatingText(hero.gridX, hero.gridY, `Smidd: ${result.item.name}!`, '#ffaa44');
        }

        Audio.playPickup();
        this._refresh();
    }

    // ── Element inventory display ────────────────────────────────────────────

    _drawElementInventory(startX, y, colW) {
        const collected = this.heroRef.elementTracker.collected;
        const entries = Object.entries(collected).filter(([, v]) => v > 0);
        if (entries.length === 0) return;

        this._d(this.add.text(startX, y, 'Lagrede grunnstoffer:', {
            fontSize: '9px', color: '#665544', fontFamily: 'monospace'
        }));
        y += 14;

        // Render as compact badges
        let bx = startX, by = y;
        for (const [symbol, count] of entries) {
            const elem = typeof ELEMENTS !== 'undefined' ? ELEMENTS[symbol] : null;
            const col = elem ? elem.color : 0xaaaaaa;
            const hexCol = '#' + col.toString(16).padStart(6, '0');

            const badge = this._d(this.add.text(bx, by, `${symbol}:${count}`, {
                fontSize: '9px', color: hexCol, fontFamily: 'monospace',
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
