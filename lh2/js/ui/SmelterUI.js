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
        this.hero.molecules[moleculeId] = (this.hero.molecules[moleculeId] || 0) + 1;
        this.log.unshift(`Laget ${def.name} (${def.formula})`);
        this.log = this.log.slice(0, 12);

        this.hero.sciences.addXP('kjemi', 20 * def.tier);
        EventBus.emit('lh2Toast', { text: `+1 ${def.name}` });
        this._render();
    }

    // ── Rendering ────────────────────────────────────────────────────────────

    _render() {
        const body = this.tab === 'smelt' ? this._smeltTabHtml() : this._chemTabHtml();
        this.el.innerHTML = `
            <div class="overlay-panel">
                <button class="overlay-close">Lukk [Esc]</button>
                <div class="smelter-tabs">
                    <button class="smelter-tab ${this.tab === 'smelt' ? 'active' : ''}" data-tab="smelt">Smelteri</button>
                    <button class="smelter-tab ${this.tab === 'chem' ? 'active' : ''}" data-tab="chem">Kjemibord</button>
                </div>
                ${body}
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
