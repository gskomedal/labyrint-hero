// ─── Labyrint Hero – Particle Accelerator Scene ──────────────────────────────
// Overlay scene for synthesizing transuranic and synthetic elements.
// Opens at Accelerator rooms (world 13+) via P key.
// Uses TRANSURANIC_RECIPES: target + projectile (or neutron source) → product.

class AcceleratorScene extends Phaser.Scene {
    constructor() { super({ key: 'AcceleratorScene' }); }

    init(data) {
        this.heroRef = data.heroRef || null;
        this.worldNum = data.worldNum || 1;
    }

    create() {
        const { width: W, height: H } = this.cameras.main;
        const cx = W / 2, cy = H / 2;
        this.smelter = new SmeltingSystem();
        this._dyn = [];
        this._scrollOffset = 0;
        this._maxScroll = 0;

        this.add.rectangle(cx, cy, W, H, 0x000000, 0.85);

        this.panelW = Math.min(W - 80, 900);
        this.panelH = Math.min(H - 80, 640);
        this.px = cx - this.panelW / 2;
        this.py = cy - this.panelH / 2;

        const panel = this.add.graphics();
        panel.fillStyle(0x0a0818, 0.97);
        panel.fillRoundedRect(this.px, this.py, this.panelW, this.panelH, 8);
        panel.lineStyle(2, 0x8866ff);
        panel.strokeRoundedRect(this.px, this.py, this.panelW, this.panelH, 8);

        this.add.text(cx, this.py + 22, 'PARTIKKELAKSELERATOR', {
            fontSize: '18px', color: '#8866ff', fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0.5);

        const fuel = this.smelter.calculateFuelEnergy(this.heroRef);
        this._fuelText = this.add.text(this.px + this.panelW - 20, this.py + 22, `Energi: ${fuel}`, {
            fontSize: '14px', color: '#6644aa', fontFamily: 'monospace'
        }).setOrigin(1, 0.5);

        this.add.rectangle(cx, this.py + 42, this.panelW - 20, 1, 0x331166);

        this.add.text(this.px + 20, this.py + 50, 'Syntetiser nye grunnstoffer ved å bombardere et mål med et prosjektil.', {
            fontSize: '13px', color: '#665588', fontFamily: 'monospace',
            wordWrap: { width: this.panelW - 40 }
        });

        const closeBtn = this.add.text(this.px + this.panelW - 20, this.py + 10, '✕', {
            fontSize: '22px', color: '#6644aa', fontFamily: 'monospace'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        closeBtn.on('pointerdown', () => this.scene.stop());
        this.input.keyboard.on('keydown-ESC', () => this.scene.stop());
        this.input.keyboard.on('keydown-P', () => this.scene.stop());

        this.contentY = this.py + 72;

        this.input.on('wheel', (pointer, go, dx, dy) => {
            this._scrollOffset = this._clampScroll(this._scrollOffset + dy * 0.5);
            this._refresh();
        });

        this._dragState = { active: false, startY: 0, startOffset: 0, engaged: false };
        this.input.on('pointerdown', (p) => {
            this._dragState = { active: true, engaged: false, startY: p.y, startOffset: this._scrollOffset };
        });
        this.input.on('pointermove', (p) => {
            if (!this._dragState.active || !p.isDown) return;
            const dy = p.y - this._dragState.startY;
            if (!this._dragState.engaged && Math.abs(dy) < 8) return;
            this._dragState.engaged = true;
            this._scrollOffset = this._clampScroll(this._dragState.startOffset - dy);
            this._refresh();
        });
        this.input.on('pointerup', () => { this._dragState.active = false; });

        this._refresh();
    }

    _clampScroll(v) { return Math.max(0, Math.min(v, this._maxScroll || 0)); }

    _viewportHeight() { return this.panelH - (this.contentY - this.py) - 30; }

    _d(obj) { this._dyn.push(obj); return obj; }

    _refresh() {
        UIHelper.clearDynamic(this._dyn);

        const cbg = this._d(this.add.graphics());
        cbg.fillStyle(0x0a0818, 0.78);
        cbg.fillRoundedRect(this.px + 6, this.contentY - 4, this.panelW - 12, this.panelH - (this.contentY - this.py) - 10, 4);

        const hero = this.heroRef;
        const fuel = this.smelter.calculateFuelEnergy(hero);
        this._fuelText.setText(`Energi: ${fuel}`);
        const tracker = hero.elementTracker;
        const efficiency = hero.acceleratorEfficiency || 1.0;

        if (typeof TRANSURANIC_RECIPES === 'undefined') return;

        const recipes = TRANSURANIC_RECIPES;
        const startX = this.px + 20;
        const colW = Math.min(this.panelW - 40, 860);
        const visBot = this.py + this.panelH - 30;
        const rowStep = 48;
        let y = this.contentY;

        recipes.forEach((recipe, idx) => {
            const baseY = y + idx * rowStep;
            const ry = baseY - this._scrollOffset;
            if (ry > visBot || ry < this.contentY - rowStep) return;

            const productElem = ELEMENTS[recipe.product];
            if (!productElem) return;

            const adjustedCost = Math.max(1, Math.round(recipe.energyCost * efficiency));
            const hasTarget = tracker.getCount(recipe.target) >= 1;
            const hasProjectile = !recipe.projectile || tracker.getCount(recipe.projectile) >= 1;
            const hasNeutron = !recipe.neutronSource || hero.fissionMastered || hero.fissionUpgraded;
            const hasFuel = fuel >= adjustedCost;
            const alreadyHas = tracker.getCount(recipe.product) > 0;

            // Tier gating: tier 1-3 require fissionMastered, tier 4+ require fusionMastered
            const tierOk = recipe.tier <= 3
                ? (hero.fissionMastered || hero.fissionUpgraded)
                : hero.fusionMastered;

            const canCraft = hasTarget && hasProjectile && hasNeutron && hasFuel && tierOk;
            const col = canCraft ? 0x8866ff : (alreadyHas ? 0x336633 : 0x332244);
            const hexCol = '#' + col.toString(16).padStart(6, '0');

            const bg = this._d(this.add.graphics());
            bg.fillStyle(col, alreadyHas ? 0.12 : 0.08);
            bg.fillRoundedRect(startX, ry, colW, 42, 4);
            bg.lineStyle(1, col, 0.3);
            bg.strokeRoundedRect(startX, ry, colW, 42, 4);

            // Product name + atomic number
            const pCol = '#' + (productElem.color || 0xaaaaaa).toString(16).padStart(6, '0');
            const check = alreadyHas ? ' ✓' : '';
            this._d(this.add.text(startX + 8, ry + 4, `${recipe.product} (${productElem.name})${check}`, {
                fontSize: '15px', color: pCol, fontFamily: 'monospace', fontStyle: 'bold'
            }));

            // Recipe description
            const projLabel = recipe.neutronSource ? 'nøytroner' : recipe.projectile;
            const recipeText = `${recipe.target} + ${projLabel} → ${recipe.product}  |  ${adjustedCost} energi  [T${recipe.tier}]`;
            this._d(this.add.text(startX + 8, ry + 22, recipeText, {
                fontSize: '13px', color: '#665588', fontFamily: 'monospace'
            }));

            // Status / craft button
            if (canCraft) {
                const btn = this._d(this.add.text(startX + colW - 80, ry + 10, '[ Syntetiser ]', {
                    fontSize: '14px', color: '#8866ff', fontFamily: 'monospace', fontStyle: 'bold'
                }).setInteractive({ useHandCursor: true }));
                btn.on('pointerover', () => btn.setColor('#aa88ff'));
                btn.on('pointerout', () => btn.setColor('#8866ff'));
                btn.on('pointerdown', () => this._doSynthesize(recipe));
            } else if (!tierOk) {
                this._d(this.add.text(startX + colW - 120, ry + 14, recipe.tier <= 3 ? 'Krever Fisjon' : 'Krever Fusjon', {
                    fontSize: '12px', color: '#443355', fontFamily: 'monospace'
                }));
            } else if (!hasFuel) {
                this._d(this.add.text(startX + colW - 80, ry + 14, 'Lite energi', {
                    fontSize: '12px', color: '#443355', fontFamily: 'monospace'
                }));
            }
        });

        // Max scroll
        const viewportH = this._viewportHeight();
        const contentSpan = recipes.length * rowStep;
        this._maxScroll = Math.max(0, contentSpan - viewportH);
        this._scrollOffset = this._clampScroll(this._scrollOffset);

        if (this._maxScroll > 0) {
            const trackX = this.px + this.panelW - 10;
            const trackY = this.contentY;
            const trackH = viewportH;
            const thumbH = Math.max(24, trackH * (trackH / (trackH + this._maxScroll)));
            const thumbY = trackY + (trackH - thumbH) * (this._scrollOffset / this._maxScroll);
            const bar = this._d(this.add.graphics());
            bar.fillStyle(0x221133, 0.6);
            bar.fillRoundedRect(trackX, trackY, 4, trackH, 2);
            bar.fillStyle(0x8866ff, 0.7);
            bar.fillRoundedRect(trackX, thumbY, 4, thumbH, 2);
        }
    }

    _doSynthesize(recipe) {
        const hero = this.heroRef;
        const tracker = hero.elementTracker;
        const efficiency = hero.acceleratorEfficiency || 1.0;
        const cost = Math.max(1, Math.round(recipe.energyCost * efficiency));

        // Consume target element
        tracker.collected[recipe.target] = (tracker.collected[recipe.target] || 0) - 1;
        if (tracker.collected[recipe.target] <= 0) delete tracker.collected[recipe.target];

        // Consume projectile element (if not neutron-source)
        if (recipe.projectile) {
            tracker.collected[recipe.projectile] = (tracker.collected[recipe.projectile] || 0) - 1;
            if (tracker.collected[recipe.projectile] <= 0) delete tracker.collected[recipe.projectile];
        }

        // Consume fuel
        this.smelter.consumeFuel(hero, cost);

        // Produce the synthetic element
        tracker.collect(recipe.product, 1);
        tracker.discover(recipe.product);

        EventBus.emit('floatingText', { gx: hero.gridX, gy: hero.gridY, msg: `Syntetisert: ${recipe.product}!`, color: '#8866ff' });

        // Check for element bonus completions
        const newBonuses = tracker.checkCompletions();
        if (newBonuses.length > 0) {
            tracker.applyBonusRewards(hero);
            for (const bonus of newBonuses) {
                EventBus.emit('floatingText', { gx: hero.gridX, gy: hero.gridY, msg: `${bonus.name} fullført! ${bonus.desc}`, color: '#ffcc00' });
            }
        }

        Audio.playPickup();
        this._refresh();
    }
}
