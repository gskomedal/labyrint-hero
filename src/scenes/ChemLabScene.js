// ─── Labyrint Hero – Chemistry Lab Scene ──────────────────────────────────────
// Overlay scene for synthesizing chemical products from pure elements.
// Opens at Chem Lab rooms (world 3+) or via Camp Room if chemist skill unlocked.

class ChemLabScene extends Phaser.Scene {
    constructor() { super({ key: 'ChemLabScene' }); }

    init(data) {
        this.heroRef = data.heroRef || null;
        this.worldNum = data.worldNum || 1;
    }

    create() {
        const { width: W, height: H } = this.cameras.main;
        const cx = W / 2, cy = H / 2;
        this.chem = new ChemistrySystem();
        this.smelter = new SmeltingSystem();
        this._dyn = [];
        this._filter = 'all'; // 'all' | 'potion' | 'explosive' | 'medicine'

        // ── Dim overlay ───────────────────────────────────────────────────────
        this.add.rectangle(cx, cy, W, H, 0x000000, 0.82);

        // ── Panel ─────────────────────────────────────────────────────────────
        // Slightly larger than before to accommodate bumped fonts without
        // crowding the portrait. Leaves margin around the canvas.
        this.panelW = Math.min(W - 80, 760);
        this.panelH = Math.min(H - 80, 600);
        this.px = cx - this.panelW / 2;
        this.py = cy - this.panelH / 2;

        // ── Lab background art (behind everything) ──────────────────────────
        const panel = this.add.graphics();
        panel.fillStyle(0x080a10, 0.97);
        panel.fillRoundedRect(this.px, this.py, this.panelW, this.panelH, 8);
        if (SceneBackgrounds.addLabBackground) {
            SceneBackgrounds.addLabBackground(this, this.px, this.py, this.panelW, this.panelH);
        }

        // ── Character portrait (sits in the scene, lower-right of bg) ─────────
        const portraitSize = 130;
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
        uiGfx.fillStyle(0x080a10, 0.82);
        uiGfx.fillRoundedRect(contentLeft, contentTop, contentW, contentH, 6);

        // Panel border
        panel.lineStyle(2, 0x33dd88);
        panel.strokeRoundedRect(this.px, this.py, this.panelW, this.panelH, 8);

        // Title
        this.add.text(cx, this.py + 22, 'KJEMISK LABORATORIUM', {
            fontSize: '18px', color: '#33dd88', fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Fuel indicator
        const fuel = this.smelter.calculateFuelEnergy(this.heroRef);
        this._fuelText = this.add.text(this.px + this.panelW - 20, this.py + 22, `Energi: ${fuel}`, {
            fontSize: '14px', color: '#448844', fontFamily: 'monospace'
        }).setOrigin(1, 0.5);

        this.add.rectangle(cx, this.py + 42, this.panelW - 20, 1, 0x113322);

        // ── Filter buttons ────────────────────────────────────────────────────
        this._filterBtns = [];
        const filters = [
            { id: 'all', label: 'Alle' },
            { id: 'potion', label: 'Potions' },
            { id: 'explosive', label: 'Bomber' },
            { id: 'medicine', label: 'Medisin' },
            { id: 'acid', label: 'Syrer' },
        ];
        const filterY = this.py + 62;
        const filterStep = Math.min(120, (this.panelW - 80) / filters.length);
        filters.forEach((f, i) => {
            const fx = this.px + 30 + i * filterStep + filterStep / 2;
            const active = this._filter === f.id;
            const btn = this.add.text(fx, filterY, f.label, {
                fontSize: '16px', color: active ? '#33dd88' : '#335533',
                fontFamily: 'monospace', fontStyle: active ? 'bold' : 'normal'
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });
            btn.on('pointerdown', () => { this._filter = f.id; this._refresh(); });
            this._filterBtns.push(btn);
        });

        this.add.rectangle(cx, filterY + 16, this.panelW - 20, 1, 0x113322);

        // Close
        const closeBtn = this.add.text(this.px + this.panelW - 20, this.py + 10, '✕', {
            fontSize: '22px', color: '#448844', fontFamily: 'monospace'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        closeBtn.on('pointerdown', () => this.scene.stop());
        this.input.keyboard.on('keydown-ESC', () => this.scene.stop());
        this.input.keyboard.on('keydown-C', () => this.scene.stop());

        this.contentY = filterY + 28;
        this._scrollOffset = 0;
        this._maxScroll = 0;

        // Mouse wheel scrolling for recipe list
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
            this._scrollOffset = this._clampScroll(this._scrollOffset + deltaY * 0.5);
            this._refresh();
        });

        // Touch / mouse-drag scrolling with small movement threshold so that
        // short taps still trigger interactive [Lag] buttons.
        this._dragState = { active: false, startY: 0, startOffset: 0, engaged: false };
        this.input.on('pointerdown', (pointer) => {
            this._dragState.active = true;
            this._dragState.engaged = false;
            this._dragState.startY = pointer.y;
            this._dragState.startOffset = this._scrollOffset;
        });
        this.input.on('pointermove', (pointer) => {
            if (!this._dragState.active || !pointer.isDown) return;
            const dy = pointer.y - this._dragState.startY;
            if (!this._dragState.engaged && Math.abs(dy) < 8) return;
            this._dragState.engaged = true;
            this._scrollOffset = this._clampScroll(this._dragState.startOffset - dy);
            this._refresh();
        });
        this.input.on('pointerup', () => { this._dragState.active = false; });
        this.input.on('pointerupoutside', () => { this._dragState.active = false; });

        this._refresh();
    }

    _clampScroll(v) {
        return Math.max(0, Math.min(v, this._maxScroll || 0));
    }

    _viewportHeight() {
        return this.panelH - (this.contentY - this.py) - 30;
    }

    _refresh() {
        UIHelper.clearDynamic(this._dyn);

        // Dark backing behind content for readability
        const cbg = this._d(this.add.graphics());
        cbg.fillStyle(0x080a10, 0.78);
        cbg.fillRoundedRect(this.px + 6, this.contentY - 4, this.panelW - 160, this.panelH - (this.contentY - this.py) - 10, 4);

        UIHelper.updateTabButtons(this._filterBtns, ['all', 'potion', 'explosive', 'medicine', 'acid'], this._filter, '#33dd88', '#335533');

        const fuel = this.smelter.calculateFuelEnergy(this.heroRef);
        this._fuelText.setText(`Energi: ${fuel}`);

        if (this._hasKjemikerSkill()) {
            this._drawRecipes(fuel);
        } else {
            this._drawLockedMessage();
            this._contentEndY = this.contentY;
        }

        // Compute max scroll from last-drawn content, clamp and draw scrollbar.
        const viewportH = this._viewportHeight();
        const contentSpan = Math.max(0, (this._contentEndY || 0) - this.contentY);
        this._maxScroll = Math.max(0, contentSpan - viewportH);
        this._scrollOffset = this._clampScroll(this._scrollOffset);

        if (this._maxScroll > 0) {
            const trackX = this.px + this.panelW - 170;
            const trackY = this.contentY;
            const trackH = viewportH;
            const thumbH = Math.max(24, trackH * (trackH / (trackH + this._maxScroll)));
            const thumbY = trackY + (trackH - thumbH) * (this._scrollOffset / this._maxScroll);
            const bar = this._d(this.add.graphics());
            bar.fillStyle(0x113322, 0.6);
            bar.fillRoundedRect(trackX, trackY, 4, trackH, 2);
            bar.fillStyle(0x33dd88, 0.7);
            bar.fillRoundedRect(trackX, thumbY, 4, thumbH, 2);
        }
    }

    _hasKjemikerSkill() {
        return (this.heroRef.skills || []).some(s =>
            s === 'potent_potions' || s === 'acid_mastery' || s === 'explosive_genius'
        );
    }

    _drawLockedMessage() {
        const cx = this.px + this.panelW / 2;
        const cy = this.contentY + (this.panelH - (this.contentY - this.py)) / 2 - 40;
        this._d(this.add.text(cx, cy, '🔒', { fontSize: '36px' }).setOrigin(0.5));
        this._d(this.add.text(cx, cy + 34, 'Krever Kjemiker-skill!', {
            fontSize: '16px', color: '#33dd88', fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0.5));
        this._d(this.add.text(cx, cy + 58, 'Lær Potente potions i skilltreet\nfor å bruke laboratoriet.', {
            fontSize: '14px', color: '#445544', fontFamily: 'monospace', align: 'center'
        }).setOrigin(0.5));
    }

    _d(obj) { this._dyn.push(obj); return obj; }

    _drawRecipes(fuel) {
        const hero = this.heroRef;
        const cx = this.px + this.panelW / 2;
        let y = this.contentY;
        // Leave room on the right for element inventory column.
        const colW = Math.min(400, this.panelW - 180);
        const leftX = this.px + 20;
        const rightX = this.px + this.panelW - 160;
        const rowStep = 62;

        // Left column: recipes
        let allMols = this.chem.getAvailableMolecules(hero, fuel);

        // Apply filter
        if (this._filter !== 'all') {
            allMols = allMols.filter(e => e.mol.subtype === this._filter);
        }

        if (allMols.length === 0) {
            this._d(this.add.text(leftX + colW / 2, y + 40, 'Ingen oppskrifter tilgjengelig.', {
                fontSize: '14px', color: '#334433', fontFamily: 'monospace'
            }).setOrigin(0.5));
        }

        const visBot = this.py + this.panelH - 30;

        allMols.forEach((entry, idx) => {
            const baseY = y + idx * rowStep;
            const my = baseY - (this._scrollOffset || 0);
            if (my > visBot || my < y - rowStep) return;
            const m = entry.mol;
            const can = entry.canCraft;
            const col = can ? 0x33dd88 : 0x223322;
            const hexCol = '#' + col.toString(16).padStart(6, '0');

            const bg = this._d(this.add.graphics());
            bg.fillStyle(col, 0.08);
            bg.fillRoundedRect(leftX, my, colW, 56, 4);
            bg.lineStyle(1, col, 0.3);
            bg.strokeRoundedRect(leftX, my, colW, 56, 4);

            // Subtype icon
            const icons = { base: '⚗', acid: '🧪', potion: '🧪', medicine: '💊', explosive: '💣', salt: '⚗' };
            const icon = icons[m.subtype] || '⚗';
            this._d(this.add.text(leftX + 6, my + 4, icon, { fontSize: '14px' }));

            // Name + formula – truncate long names to fit slot
            const dispName = m.name.length > 26 ? m.name.slice(0, 25) + '…' : m.name;
            this._d(this.add.text(leftX + 28, my + 5, dispName, {
                fontSize: '15px', color: hexCol, fontFamily: 'monospace', fontStyle: 'bold'
            }));
            this._d(this.add.text(leftX + 28, my + 22, `${m.formula}  [T${m.tier}]`, {
                fontSize: '13px', color: '#556655', fontFamily: 'monospace'
            }));

            // Recipe elements
            const recipeStr = m.recipe.map(r => {
                const have = hero.elementTracker.getCount(r.symbol);
                const ok = have >= r.amount;
                return `${r.symbol}:${have}/${r.amount}${ok ? '' : '!'}`;
            }).join('  ');
            this._d(this.add.text(leftX + 6, my + 38, recipeStr, {
                fontSize: '13px', color: '#556655', fontFamily: 'monospace'
            }));

            // Effect preview
            this._d(this.add.text(leftX + colW - 8, my + 40, m.desc.length > 32 ? m.desc.slice(0, 30) + '…' : m.desc, {
                fontSize: '12px', color: '#445544', fontFamily: 'monospace'
            }).setOrigin(1, 0));

            if (can) {
                const btn = this._d(this.add.text(leftX + colW - 56, my + 10, '[ Lag ]', {
                    fontSize: '15px', color: '#33dd88', fontFamily: 'monospace', fontStyle: 'bold'
                }).setInteractive({ useHandCursor: true }));
                btn.on('pointerover', () => btn.setColor('#66ffaa'));
                btn.on('pointerout', () => btn.setColor('#33dd88'));
                btn.on('pointerdown', () => this._doSynthesize(m.id));
            }
        });

        // Right side: element inventory
        const elemY = this.contentY;
        this._drawElementCounts(rightX, elemY, 150);

        // End-of-content for scrollbar
        this._contentEndY = y + allMols.length * rowStep;
    }

    _doSynthesize(moleculeId) {
        const hero = this.heroRef;
        const result = this.chem.synthesize(moleculeId, hero, this.worldNum);
        if (!result.success) return;

        // Consume fuel if needed
        if (result.energyCost > 0) {
            this.smelter.consumeFuel(hero, result.energyCost);
        }

        // Add product to inventory
        const added = hero.inventory.addItem(result.item);
        if (!added) {
            EventBus.emit('spawnItem', { gx: hero.gridX, gy: hero.gridY, item: result.item });
        }

        EventBus.emit('floatingText', { gx: hero.gridX, gy: hero.gridY, msg: `Laget: ${result.item.name}!`, color: '#33dd88' });

        // Kjemiker T3 "Double Brew": drop an extra copy if the skill triggered.
        if (result.bonusItem) {
            const bonusAdded = hero.inventory.addItem(result.bonusItem);
            if (!bonusAdded) {
                EventBus.emit('spawnItem', { gx: hero.gridX, gy: hero.gridY, item: result.bonusItem });
            }
            EventBus.emit('floatingText', { gx: hero.gridX, gy: hero.gridY - 1, msg: 'Dobbel brygging!', color: '#ffcc44' });
        }

        Audio.playPickup();
        this._refresh();
    }

    _drawElementCounts(x, y, w) {
        this._d(this.add.text(x, y, 'GRUNNSTOFFER:', {
            fontSize: '14px', color: '#556655', fontFamily: 'monospace', fontStyle: 'bold'
        }));

        const hero = this.heroRef;
        const transmutable = !!hero.transmutationUnlocked;
        if (transmutable) {
            this._d(this.add.text(x, y + 18, 'Transmutasjon: klikk ↔ for 5 → 1 nabo', {
                fontSize: '11px', color: '#ff88cc', fontFamily: 'monospace'
            }));
        }

        const collected = hero.elementTracker.collected;
        const entries = Object.entries(collected).filter(([, v]) => v > 0);
        if (entries.length === 0) {
            this._d(this.add.text(x, y + (transmutable ? 34 : 18), 'Ingen lagret.', {
                fontSize: '14px', color: '#334433', fontFamily: 'monospace'
            }));
            return;
        }

        let bx = x, by = y + (transmutable ? 36 : 18);
        for (const [symbol, count] of entries) {
            const elem = typeof ELEMENTS !== 'undefined' ? ELEMENTS[symbol] : null;
            const col = elem ? elem.color : 0xaaaaaa;
            const hexCol = '#' + col.toString(16).padStart(6, '0');
            const badge = this._d(this.add.text(bx, by, `${symbol}:${count}`, {
                fontSize: '14px', color: hexCol, fontFamily: 'monospace',
                backgroundColor: '#081808', padding: { x: 3, y: 1 }
            }));
            let bwidth = badge.width;
            // Transmutation button (only clickable when count ≥ 5).
            if (transmutable) {
                const canTransmute = count >= 5;
                const tbtn = this._d(this.add.text(bx + bwidth + 2, by, '↔', {
                    fontSize: '14px',
                    color: canTransmute ? '#ff88cc' : '#553344',
                    fontFamily: 'monospace',
                    backgroundColor: '#180818',
                    padding: { x: 3, y: 1 }
                }));
                if (canTransmute) {
                    tbtn.setInteractive({ useHandCursor: true });
                    tbtn.on('pointerover', () => tbtn.setColor('#ffaadd'));
                    tbtn.on('pointerout', () => tbtn.setColor('#ff88cc'));
                    tbtn.on('pointerdown', () => this._doTransmute(symbol));
                }
                bwidth += tbtn.width + 4;
            }
            bx += bwidth + 6;
            if (bx > x + w - 30) { bx = x; by += 22; }
        }
    }

    _doTransmute(symbol) {
        const hero = this.heroRef;
        const produced = this.chem.transmute(hero, symbol);
        if (!produced) return;
        EventBus.emit('floatingText', { gx: hero.gridX, gy: hero.gridY, msg: `Transmuted: 5 ${symbol} → 1 ${produced}`, color: '#ff88cc' });
        Audio.playPickup();
        this._refresh();
    }
}
