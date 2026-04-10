// ─── Labyrint Hero – Chemistry Lab Scene ──────────────────────────────────────
// Overlay scene for synthesizing chemical products from pure elements.
// Opens at Chem Lab rooms (world 3+) or via Camp Room if chemist skill unlocked.

class ChemLabScene extends Phaser.Scene {
    constructor() { super({ key: 'ChemLabScene' }); }

    init(data) {
        this.heroRef = data.heroRef || null;
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
        this.panelW = Math.min(W - 10, 700);
        this.panelH = Math.min(H - 10, 520);
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
        uiGfx.fillStyle(0x080a10, 0.82);
        uiGfx.fillRoundedRect(contentLeft, contentTop, contentW, contentH, 6);

        // Panel border
        panel.lineStyle(2, 0x33dd88);
        panel.strokeRoundedRect(this.px, this.py, this.panelW, this.panelH, 8);

        // Title
        this.add.text(cx, this.py + 18, 'KJEMISK LABORATORIUM', {
            fontSize: '14px', color: '#33dd88', fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Fuel indicator
        const fuel = this.smelter.calculateFuelEnergy(this.heroRef);
        this._fuelText = this.add.text(this.px + this.panelW - 20, this.py + 18, `Energi: ${fuel}`, {
            fontSize: '12px', color: '#448844', fontFamily: 'monospace'
        }).setOrigin(1, 0.5);

        this.add.rectangle(cx, this.py + 34, this.panelW - 20, 1, 0x113322);

        // ── Filter buttons ────────────────────────────────────────────────────
        this._filterBtns = [];
        const filters = [
            { id: 'all', label: 'Alle' },
            { id: 'potion', label: 'Potions' },
            { id: 'explosive', label: 'Bomber' },
            { id: 'medicine', label: 'Medisin' },
            { id: 'acid', label: 'Syrer' },
        ];
        const filterY = this.py + 50;
        filters.forEach((f, i) => {
            const fx = this.px + 30 + i * 100 + 45;
            const active = this._filter === f.id;
            const btn = this.add.text(fx, filterY, f.label, {
                fontSize: '12px', color: active ? '#33dd88' : '#335533',
                fontFamily: 'monospace', fontStyle: active ? 'bold' : 'normal'
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });
            btn.on('pointerdown', () => { this._filter = f.id; this._refresh(); });
            this._filterBtns.push(btn);
        });

        this.add.rectangle(cx, filterY + 12, this.panelW - 20, 1, 0x113322);

        // Close
        const closeBtn = this.add.text(this.px + this.panelW - 20, this.py + 8, '✕', {
            fontSize: '18px', color: '#448844', fontFamily: 'monospace'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        closeBtn.on('pointerdown', () => this.scene.stop());
        this.input.keyboard.on('keydown-ESC', () => this.scene.stop());
        this.input.keyboard.on('keydown-C', () => this.scene.stop());

        this.contentY = filterY + 22;
        this._scrollOffset = 0;

        // Mouse wheel scrolling for recipe list
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
            this._scrollOffset = Math.max(0, this._scrollOffset + deltaY * 0.5);
            this._refresh();
        });

        this._refresh();
    }

    _refresh() {
        UIHelper.clearDynamic(this._dyn);

        // Dark backing behind content for readability
        const cbg = this._d(this.add.graphics());
        cbg.fillStyle(0x080a10, 0.78);
        cbg.fillRoundedRect(this.px + 6, this.contentY - 4, this.panelW - 150, this.panelH - (this.contentY - this.py) - 10, 4);

        UIHelper.updateTabButtons(this._filterBtns, ['all', 'potion', 'explosive', 'medicine', 'acid'], this._filter, '#33dd88', '#335533');

        const fuel = this.smelter.calculateFuelEnergy(this.heroRef);
        this._fuelText.setText(`Energi: ${fuel}`);

        if (this._hasKjemikerSkill()) {
            this._drawRecipes(fuel);
        } else {
            this._drawLockedMessage();
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
        this._d(this.add.text(cx, cy, '🔒', { fontSize: '32px' }).setOrigin(0.5));
        this._d(this.add.text(cx, cy + 30, 'Krever Kjemiker-skill!', {
            fontSize: '14px', color: '#33dd88', fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0.5));
        this._d(this.add.text(cx, cy + 50, 'Lær Potente potions i skilltreet\nfor å bruke laboratoriet.', {
            fontSize: '12px', color: '#445544', fontFamily: 'monospace', align: 'center'
        }).setOrigin(0.5));
    }

    _d(obj) { this._dyn.push(obj); return obj; }

    _drawRecipes(fuel) {
        const hero = this.heroRef;
        const cx = this.px + this.panelW / 2;
        let y = this.contentY;
        const colW = Math.min(340, this.panelW - 40);
        const leftX = this.px + 20;
        const rightX = cx + 10;

        // Left column: recipes
        let allMols = this.chem.getAvailableMolecules(hero, fuel);

        // Apply filter
        if (this._filter !== 'all') {
            allMols = allMols.filter(e => e.mol.subtype === this._filter);
        }

        if (allMols.length === 0) {
            this._d(this.add.text(cx, y + 40, 'Ingen oppskrifter tilgjengelig.', {
                fontSize: '13px', color: '#334433', fontFamily: 'monospace'
            }).setOrigin(0.5));
        }

        allMols.forEach((entry, idx) => {
            const my = y + idx * 58 - (this._scrollOffset || 0);
            if (my > this.py + this.panelH - 80 || my < y - 20) return;
            const m = entry.mol;
            const can = entry.canCraft;
            const col = can ? 0x33dd88 : 0x223322;
            const hexCol = '#' + col.toString(16).padStart(6, '0');

            const bg = this._d(this.add.graphics());
            bg.fillStyle(col, 0.08);
            bg.fillRoundedRect(leftX, my, colW, 52, 4);
            bg.lineStyle(1, col, 0.3);
            bg.strokeRoundedRect(leftX, my, colW, 52, 4);

            // Subtype icon
            const icons = { base: '⚗', acid: '🧪', potion: '🧪', medicine: '💊', explosive: '💣', salt: '⚗' };
            const icon = icons[m.subtype] || '⚗';
            this._d(this.add.text(leftX + 6, my + 4, icon, { fontSize: '12px' }));

            // Name + formula
            this._d(this.add.text(leftX + 24, my + 5, `${m.name}`, {
                fontSize: '13px', color: hexCol, fontFamily: 'monospace', fontStyle: 'bold'
            }));
            this._d(this.add.text(leftX + 24, my + 19, `${m.formula}  [T${m.tier}]`, {
                fontSize: '12px', color: '#556655', fontFamily: 'monospace'
            }));

            // Recipe elements
            const recipeStr = m.recipe.map(r => {
                const have = hero.elementTracker.getCount(r.symbol);
                const ok = have >= r.amount;
                return `${r.symbol}:${have}/${r.amount}${ok ? '' : '!'}`;
            }).join('  ');
            this._d(this.add.text(leftX + 6, my + 33, recipeStr, {
                fontSize: '12px', color: '#556655', fontFamily: 'monospace'
            }));

            // Effect preview
            this._d(this.add.text(leftX + colW - 8, my + 36, m.desc.length > 35 ? m.desc.slice(0, 33) + '…' : m.desc, {
                fontSize: '12px', color: '#445544', fontFamily: 'monospace'
            }).setOrigin(1, 0));

            if (can) {
                const btn = this._d(this.add.text(leftX + colW - 50, my + 10, '[ Lag ]', {
                    fontSize: '13px', color: '#33dd88', fontFamily: 'monospace', fontStyle: 'bold'
                }).setInteractive({ useHandCursor: true }));
                btn.on('pointerover', () => btn.setColor('#66ffaa'));
                btn.on('pointerout', () => btn.setColor('#33dd88'));
                btn.on('pointerdown', () => this._doSynthesize(m.id));
            }
        });

        // Right side: element inventory
        const elemY = this.contentY;
        this._drawElementCounts(rightX, elemY, colW - 20);
    }

    _doSynthesize(moleculeId) {
        const hero = this.heroRef;
        const result = this.chem.synthesize(moleculeId, hero);
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

        Audio.playPickup();
        this._refresh();
    }

    _drawElementCounts(x, y, w) {
        this._d(this.add.text(x, y, 'GRUNNSTOFFER:', {
            fontSize: '13px', color: '#556655', fontFamily: 'monospace', fontStyle: 'bold'
        }));

        const collected = this.heroRef.elementTracker.collected;
        const entries = Object.entries(collected).filter(([, v]) => v > 0);
        if (entries.length === 0) {
            this._d(this.add.text(x, y + 14, 'Ingen lagret.', {
                fontSize: '13px', color: '#334433', fontFamily: 'monospace'
            }));
            return;
        }

        let bx = x, by = y + 14;
        for (const [symbol, count] of entries) {
            const elem = typeof ELEMENTS !== 'undefined' ? ELEMENTS[symbol] : null;
            const col = elem ? elem.color : 0xaaaaaa;
            const hexCol = '#' + col.toString(16).padStart(6, '0');
            const badge = this._d(this.add.text(bx, by, `${symbol}:${count}`, {
                fontSize: '13px', color: hexCol, fontFamily: 'monospace',
                backgroundColor: '#081808', padding: { x: 3, y: 1 }
            }));
            bx += badge.width + 6;
            if (bx > x + w - 30) { bx = x; by += 16; }
        }
    }
}
