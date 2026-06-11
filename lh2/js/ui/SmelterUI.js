// ─── Labyrint Hero 2 – Smelter & lab overlay ─────────────────────────────────
// HTML overlay with two tabs: Smelting (minerals + fuel → elements, reusing
// LH1's SmeltingSystem) and Kjemi (elements → molecules at the lab table).
// Unidentified minerals can't be smelted – geology gates metallurgy.

class SmelterUI {
    constructor(hero) {
        this.hero = hero;
        this.smelting = new SmeltingSystem();
        this.el = document.getElementById('overlay-smelter');
        this.open = false;
        this.tab = 'smelt';
        this.log = [];

        window.addEventListener('keydown', (e) => {
            if (e.code === 'Escape' && this.open) this.hide();
        });
    }

    show(tab) {
        this.open = true;
        this.tab = tab || 'smelt';
        LH2Main.uiOpen = true;
        if (LH2Main.cameraRig) LH2Main.cameraRig.unlock();
        this._render();
        this.el.classList.remove('hidden');
    }

    hide() {
        this.open = false;
        LH2Main.uiOpen = false;
        this.el.classList.add('hidden');
        EventBus.emit('lh2InventoryChanged');
    }

    // ── Fuel bookkeeping ─────────────────────────────────────────────────────

    /** Backpack fuel stacks as [{id, count, def}]. */
    _fuelStacks() {
        const stacks = [];
        for (const entry of this.hero.inventory.backpack) {
            if (!entry || entry.count === undefined) continue;
            const def = FUEL_DEFS[entry.id];
            if (def) stacks.push({ id: entry.id, count: entry.count, def });
        }
        return stacks;
    }

    _totalEnergy() {
        return this.hero.fuelReserve
            + this._fuelStacks().reduce((sum, s) => sum + s.count * s.def.energyValue, 0);
    }

    /**
     * Consume `cost` energy: reserve first, then whole fuel units (smallest
     * energy value first to minimize waste). Leftover goes to the reserve –
     * LH1's energy-carryover principle.
     */
    _consumeEnergy(cost) {
        let remaining = cost - this.hero.fuelReserve;
        if (remaining <= 0) {
            this.hero.fuelReserve -= cost;
            return;
        }
        this.hero.fuelReserve = 0;

        const stacks = this._fuelStacks().sort((a, b) => a.def.energyValue - b.def.energyValue);
        for (const stack of stacks) {
            while (stack.count > 0 && remaining > 0) {
                this._removeOneFromBackpack(stack.id);
                stack.count--;
                remaining -= stack.def.energyValue;
            }
            if (remaining <= 0) break;
        }
        if (remaining < 0) this.hero.fuelReserve = -remaining;
    }

    _removeOneFromBackpack(itemId) {
        const bp = this.hero.inventory.backpack;
        for (let i = 0; i < bp.length; i++) {
            const entry = bp[i];
            if (entry && entry.id === itemId && entry.count !== undefined) {
                entry.count--;
                if (entry.count <= 0) bp[i] = null;
                return true;
            }
        }
        return false;
    }

    // ── Actions ──────────────────────────────────────────────────────────────

    _doSmelt(mineralId) {
        const def = MINERAL_DEFS[mineralId];
        const check = this.smelting.canSmelt(def, this._totalEnergy(), this.hero);
        if (!check.canSmelt) return;

        this._consumeEnergy(check.energyCost);
        this._removeOneFromBackpack(mineralId);
        const result = this.smelting.smelt(def, this.hero);

        const parts = result.elements.map(e => `${e.amount} ${e.symbol}`).join(', ');
        this.log.unshift(`${def.name} → ${parts || 'ingenting'} (${check.energyCost} energi)`);
        this.log = this.log.slice(0, 12);

        this.hero.sciences.addXP('metallurgi', 15 * def.tier);
        this.hero.applyScienceEffects();
        this._render();
    }

    _doCraft(moleculeId) {
        const def = MOLECULE_DEFS[moleculeId];
        const tracker = this.hero.elementTracker;
        if (def.tier > this.hero.sciences.maxMoleculeTier()) return;
        for (const r of def.recipe) {
            if (tracker.getCount(r.symbol) < r.amount) return;
        }
        for (const r of def.recipe) {
            tracker.collected[r.symbol] -= r.amount;
        }
        // "Potent kjemi" skill: chance of a second molecule
        const doubled = (this.hero.moleculeDoubleChance || 0) > 0
            && Math.random() < this.hero.moleculeDoubleChance;
        const amount = doubled ? 2 : 1;
        this.hero.molecules[moleculeId] = (this.hero.molecules[moleculeId] || 0) + amount;
        this.log.unshift(`Laget ${amount} ${def.name} (${def.formula})${doubled ? ' – dobbel!' : ''}`);
        this.log = this.log.slice(0, 12);

        this.hero.sciences.addXP('kjemi', 20 * def.tier);
        EventBus.emit('lh2Toast', { text: `+${amount} ${def.name}` });
        this._render();
    }

    _doAlloy(alloyId) {
        const check = this.smelting.canCraftAlloy(alloyId, this.hero, this._totalEnergy());
        if (!check.canCraft) return;

        this._consumeEnergy(check.energyCost);
        const result = this.smelting.craftAlloy(alloyId, this.hero);
        if (!result.success) return;

        const amount = result.doubled ? 2 : 1;
        this.hero.alloyInventory[alloyId] = (this.hero.alloyInventory[alloyId] || 0) + amount;
        this.log.unshift(`Støpte ${amount} ${result.alloy.name}${result.doubled ? ' – dobbel!' : ''} (${check.energyCost} energi)`);
        this.log = this.log.slice(0, 12);

        this.hero.sciences.addXP('metallurgi', 20 * result.alloy.tier);
        this.hero.applyScienceEffects();
        this._render();
    }

    _doForge(equipId) {
        const template = ALLOY_EQUIPMENT[equipId];
        if (!template) return;
        const FORGE_ENERGY = 5;
        if ((this.hero.alloyInventory[template.alloyId] || 0) < 1) return;
        if (this._totalEnergy() < FORGE_ENERGY) return;

        this._consumeEnergy(FORGE_ENERGY);
        this.hero.alloyInventory[template.alloyId]--;
        const result = this.smelting.forgeEquipment(equipId, this.hero);
        if (!result.success) return;

        if (!this.hero.inventory.addItem(result.item)) {
            EventBus.emit('lh2Toast', { text: 'Sekken er full!' });
            // Refund the alloy if the item didn't fit
            this.hero.alloyInventory[template.alloyId]++;
            return;
        }

        this.log.unshift(`Smidde ${result.item.name}!`);
        this.log = this.log.slice(0, 12);
        this.hero.sciences.addXP('metallurgi', 25 * (ALLOY_DEFS[template.alloyId].tier || 1));
        EventBus.emit('lh2Toast', { text: `Smidde ${result.item.name}! Utrust i sekken (Tab)`, cls: 'levelup' });
        EventBus.emit('lh2InventoryChanged');
        this._render();
    }

    // ── Rendering ────────────────────────────────────────────────────────────

    _render() {
        const bodies = {
            smelt: () => this._smeltTabHtml(),
            alloy: () => this._alloyTabHtml(),
            forge: () => this._forgeTabHtml(),
            chem: () => this._chemTabHtml(),
        };
        const tabNames = { smelt: 'Smelteri', alloy: 'Legering', forge: 'Smi', chem: 'Kjemibord' };
        const tabsHtml = Object.keys(tabNames).map(t =>
            `<button class="smelter-tab ${this.tab === t ? 'active' : ''}" data-tab="${t}">${tabNames[t]}</button>`
        ).join('');

        this.el.innerHTML = `
            <div class="overlay-panel">
                <button class="overlay-close">Lukk [Esc]</button>
                <div class="smelter-tabs">${tabsHtml}</div>
                ${(bodies[this.tab] || bodies.smelt)()}
            </div>`;

        this.el.querySelector('.overlay-close').addEventListener('click', () => this.hide());
        this.el.querySelectorAll('.smelter-tab').forEach(btn => {
            btn.addEventListener('click', () => { this.tab = btn.dataset.tab; this._render(); });
        });
        this.el.querySelectorAll('[data-smelt]').forEach(btn => {
            btn.addEventListener('click', () => this._doSmelt(btn.dataset.smelt));
        });
        this.el.querySelectorAll('[data-craft]').forEach(btn => {
            btn.addEventListener('click', () => this._doCraft(btn.dataset.craft));
        });
        this.el.querySelectorAll('[data-alloy]').forEach(btn => {
            btn.addEventListener('click', () => this._doAlloy(btn.dataset.alloy));
        });
        this.el.querySelectorAll('[data-forge]').forEach(btn => {
            btn.addEventListener('click', () => this._doForge(btn.dataset.forge));
        });
    }

    _alloyTabHtml() {
        const energy = this._totalEnergy();
        let rows = '';
        for (const entry of this.smelting.getAvailableAlloys(this.hero, energy)) {
            const a = entry.alloy;
            const recipeHtml = a.recipe.map(r => {
                const have = this.hero.elementTracker.getCount(r.symbol);
                const ok = have >= r.amount;
                return `<span style="color:${ok ? '#9d9' : '#d77'}">${r.amount} ${r.symbol} (${have})</span>`;
            }).join(' + ');
            const owned = this.hero.alloyInventory[a.id] || 0;
            rows += `
                <div class="smelt-row">
                    ${this._chip(a.color)}
                    <span class="smelt-name">${a.name} (${a.formula})${owned ? ` ×${owned}` : ''}<br>
                        <span class="smelt-meta">${recipeHtml}</span></span>
                    <span class="smelt-meta">${entry.energyCost} energi</span>
                    <button data-alloy="${a.id}" ${entry.canCraft ? '' : 'disabled'}>Støp</button>
                </div>`;
        }
        return `
            <h2>Legering</h2>
            <div class="energy-info">Tilgjengelig energi: ${energy} &middot; Rene grunnstoffer → legeringer</div>
            <div class="smelt-columns">
                <div class="smelt-col" style="min-width:430px"><h3>Oppskrifter</h3>${rows}</div>
                <div class="smelt-col"><h3>Logg</h3><div class="smelt-log">${this.log.map(l => `<div>${l}</div>`).join('')}</div></div>
            </div>`;
    }

    _forgeTabHtml() {
        const energy = this._totalEnergy();
        let rows = '';
        for (const alloyId in this.hero.alloyInventory) {
            const count = this.hero.alloyInventory[alloyId];
            if (count <= 0) continue;
            const alloy = ALLOY_DEFS[alloyId];
            for (const eq of this.smelting.getForgeableEquipment(alloyId)) {
                if (eq.type !== 'weapon' && eq.type !== 'armor') continue;
                const can = count >= 1 && energy >= 5;
                rows += `
                    <div class="smelt-row">
                        ${this._chip(eq.color)}
                        <span class="smelt-name">${eq.name}<br><span class="smelt-meta">${eq.desc} &middot; 1× ${alloy.name} (${count})</span></span>
                        <span class="smelt-meta">5 energi</span>
                        <button data-forge="${Object.keys(ALLOY_EQUIPMENT).find(k => ALLOY_EQUIPMENT[k] === eq) || eq.id}" ${can ? '' : 'disabled'}>Smi</button>
                    </div>`;
            }
        }
        if (!rows) rows = '<div class="smelt-meta">Ingen legeringer på lager. Støp legeringer først (Legering-fanen).</div>';
        return `
            <h2>Smi utstyr</h2>
            <div class="energy-info">Tilgjengelig energi: ${energy} &middot; Legeringer → våpen og rustning. Utrust fra sekken (Tab)</div>
            <div class="smelt-columns">
                <div class="smelt-col" style="min-width:430px"><h3>Utstyr</h3>${rows}</div>
                <div class="smelt-col"><h3>Logg</h3><div class="smelt-log">${this.log.map(l => `<div>${l}</div>`).join('')}</div></div>
            </div>`;
    }

    _chip(color) {
        return `<div class="bp-chip" style="background:#${(color || 0x888888).toString(16).padStart(6, '0')}"></div>`;
    }

    _smeltTabHtml() {
        const energy = this._totalEnergy();
        const sci = this.hero.sciences;

        // Mineral stacks in backpack
        let mineralRows = '';
        const seen = {};
        for (const entry of this.hero.inventory.backpack) {
            if (!entry || entry.count === undefined || seen[entry.id]) continue;
            const def = MINERAL_DEFS[entry.id];
            if (!def) continue;
            seen[entry.id] = true;
            const count = this.hero.inventory.backpack
                .filter(e => e && e.id === entry.id)
                .reduce((s, e) => s + e.count, 0);

            const identified = sci.canIdentifyTier(def.tier);
            if (!identified) {
                mineralRows += `
                    <div class="smelt-row">
                        ${this._chip(0x555555)}
                        <span class="smelt-name">Ukjent mineral (T${def.tier}) ×${count}</span>
                        <span class="smelt-meta">Krever Geologi nv ${def.tier}</span>
                    </div>`;
                continue;
            }
            const check = this.smelting.canSmelt(def, energy, this.hero);
            mineralRows += `
                <div class="smelt-row">
                    ${this._chip(def.color)}
                    <span class="smelt-name">${def.name} (${def.formula}) ×${count}</span>
                    <span class="smelt-meta">${check.energyCost} energi</span>
                    <button data-smelt="${def.id}" ${check.canSmelt ? '' : 'disabled'}>Smelt</button>
                </div>`;
        }
        if (!mineralRows) mineralRows = '<div class="smelt-meta">Ingen mineraler i sekken. Gå ut og grav!</div>';

        let fuelRows = '';
        for (const stack of this._fuelStacks()) {
            fuelRows += `
                <div class="smelt-row">
                    ${this._chip(stack.def.color)}
                    <span class="smelt-name">${stack.def.name} ×${stack.count}</span>
                    <span class="smelt-meta">${stack.def.energyValue} energi/stk</span>
                </div>`;
        }
        if (!fuelRows) fuelRows = '<div class="smelt-meta">Ingen brensel. Hogg trær eller finn kull i grottene.</div>';

        return `
            <h2>Smelteri</h2>
            <div class="energy-info">Tilgjengelig energi: ${energy}
                ${this.hero.fuelReserve > 0 ? `(reserve: ${this.hero.fuelReserve})` : ''}
                &middot; Energikostnad ×${this.hero.smeltingEfficiency.toFixed(2)} (Metallurgi nv ${sci.getLevel('metallurgi')})</div>
            <div class="smelt-columns">
                <div class="smelt-col"><h3>Mineraler</h3>${mineralRows}</div>
                <div class="smelt-col"><h3>Brensel</h3>${fuelRows}</div>
                <div class="smelt-col"><h3>Logg</h3><div class="smelt-log">${this.log.map(l => `<div>${l}</div>`).join('')}</div></div>
            </div>`;
    }

    _chemTabHtml() {
        const tracker = this.hero.elementTracker;
        const maxTier = this.hero.sciences.maxMoleculeTier();

        let rows = '';
        for (const id in MOLECULE_DEFS) {
            const def = MOLECULE_DEFS[id];
            const unlocked = def.tier <= maxTier;
            const recipeHtml = def.recipe.map(r => {
                const have = tracker.getCount(r.symbol);
                const ok = have >= r.amount;
                return `<span style="color:${ok ? '#9d9' : '#d77'}">${r.amount} ${r.symbol}</span>`;
            }).join(' + ');
            const craftable = unlocked && def.recipe.every(r => tracker.getCount(r.symbol) >= r.amount);

            rows += `
                <div class="smelt-row" ${unlocked ? '' : 'style="opacity:0.45"'}>
                    ${this._chip(def.color)}
                    <span class="smelt-name">${def.name} (${def.formula})<br><span class="smelt-meta">${recipeHtml}</span></span>
                    <span class="smelt-meta">${unlocked ? `T${def.tier}` : `Krever Kjemi nv ${def.tier}`}</span>
                    <button data-craft="${def.id}" ${craftable ? '' : 'disabled'}>Lag</button>
                </div>`;
        }

        return `
            <h2>Kjemibord</h2>
            <div class="energy-info">Kjemi nivå ${this.hero.sciences.getLevel('kjemi')} – oppskrifter opp til tier ${maxTier}</div>
            <div class="smelt-columns">
                <div class="smelt-col" style="min-width:420px"><h3>Oppskrifter</h3>${rows}</div>
                <div class="smelt-col"><h3>Logg</h3><div class="smelt-log">${this.log.map(l => `<div>${l}</div>`).join('')}</div></div>
            </div>`;
    }
}
