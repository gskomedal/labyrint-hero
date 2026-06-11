// ─── Labyrint Hero 2 – Inventory & periodic table overlay ────────────────────
// Tab toggles a DOM overlay: backpack grid on top, periodic table progress
// below (a DOM translation of LH1's ElementBookScene, reusing
// PERIODIC_TABLE_LAYOUT and ELEMENTS).

const CATEGORY_COLORS = {
    nonmetal: '#7ec8e3', noble: '#c8a2c8', alkali: '#e6b35a', alkaline: '#d9d97a',
    metalloid: '#9fbf8f', metal: '#a9b7c6', halogen: '#8fdf8f', lanthanide: '#e8a0bf',
    actinide: '#e88a8a', noble_metal: '#ffd700', synthetic: '#cc99ff',
};

class InventoryUI {
    constructor(hero) {
        this.hero = hero;
        this.el = document.getElementById('overlay-inventory');
        this.open = false;

        window.addEventListener('keydown', (e) => {
            if (e.code === 'Tab') {
                e.preventDefault();
                if (this.open) this.hide();
                else if (!LH2Main.uiOpen) this.show();
            } else if (e.code === 'Escape' && this.open) {
                this.hide();
            }
        });
    }

    show() {
        this.open = true;
        LH2Main.uiOpen = true;
        if (LH2Main.cameraRig) LH2Main.cameraRig.unlock();
        this._render();
        this.el.classList.remove('hidden');
    }

    hide() {
        this.open = false;
        LH2Main.uiOpen = false;
        this.el.classList.add('hidden');
    }

    _render() {
        const inv = this.hero.inventory;

        let bpHtml = '';
        inv.backpack.forEach((entry, i) => {
            if (!entry) {
                bpHtml += `<div class="bp-slot"></div>`;
                return;
            }
            const def = inv._getItemDef(entry);
            if (!def) {
                bpHtml += `<div class="bp-slot"></div>`;
                return;
            }
            const hex = '#' + (def.color || 0x888888).toString(16).padStart(6, '0');
            const isEquip = def.type === 'weapon' || def.type === 'armor';
            const name = LH2Mining.itemName(def);
            const count = entry.count !== undefined ? entry.count : 1;
            bpHtml += `
                <div class="bp-slot ${isEquip ? 'bp-equip' : ''}" ${isEquip ? `data-equip-slot="${i}" title="Klikk for å utruste"` : ''}>
                    <div class="bp-chip" style="background:${hex}"></div>
                    <div>${name}</div>
                    <div class="bp-count">${isEquip ? (def.atk ? `+${def.atk} ATK` : `+${def.def} DEF`) : '×' + count}</div>
                </div>`;
        });

        // Equipped gear
        const equipCell = (slot, label) => {
            const item = this.hero.equipped[slot];
            if (!item) return `<div class="bp-slot"><div class="bp-count">${label}: tom</div></div>`;
            const hex = '#' + (item.color || 0x888888).toString(16).padStart(6, '0');
            const stats = [item.atk ? `+${item.atk} ATK` : '', item.def ? `+${item.def} DEF` : '', item.hearts ? `+${item.hearts} ♥` : '']
                .filter(Boolean).join(' ');
            return `
                <div class="bp-slot bp-equip" data-unequip="${slot}" title="Klikk for å ta av">
                    <div class="bp-chip" style="background:${hex}"></div>
                    <div>${item.name}</div>
                    <div class="bp-count">${stats}</div>
                </div>`;
        };
        const equippedHtml = equipCell('weapon', 'Våpen') + equipCell('armor', 'Rustning');

        // Molecule stash (crafted at the lab table)
        let molHtml = '';
        for (const id in this.hero.molecules) {
            const def = MOLECULE_DEFS[id];
            if (!def || this.hero.molecules[id] <= 0) continue;
            const hex = '#' + (def.color || 0x888888).toString(16).padStart(6, '0');
            molHtml += `
                <div class="bp-slot">
                    <div class="bp-chip" style="background:${hex}"></div>
                    <div>${def.name}</div>
                    <div class="bp-count">×${this.hero.molecules[id]}</div>
                </div>`;
        }

        this.el.innerHTML = `
            <div class="overlay-panel">
                <button class="overlay-close">Lukk [Tab]</button>
                <h2>Utstyr <span class="smelt-meta">ATK ${this.hero.attack} &middot; DEF ${this.hero.defense}</span></h2>
                <div class="backpack-grid">${equippedHtml}</div>
                <h2>Ryggsekk</h2>
                <div class="backpack-grid">${bpHtml}</div>
                ${molHtml ? `<h2>Molekyler</h2><div class="backpack-grid">${molHtml}</div>` : ''}
                <h2>Periodesystemet</h2>
                ${this._periodicTableHtml()}
            </div>`;

        this.el.querySelector('.overlay-close').addEventListener('click', () => this.hide());
        this.el.querySelectorAll('[data-equip-slot]').forEach(el => {
            el.addEventListener('click', () => {
                if (this.hero.equipItem(+el.dataset.equipSlot)) {
                    EventBus.emit('lh2Toast', { text: 'Utrustet!' });
                    this._render();
                }
            });
        });
        this.el.querySelectorAll('[data-unequip]').forEach(el => {
            el.addEventListener('click', () => {
                if (this.hero.unequipItem(el.dataset.unequip)) this._render();
            });
        });
    }

    _periodicTableHtml() {
        const tracker = this.hero.elementTracker;
        let cells = '';
        for (const slot of PERIODIC_TABLE_LAYOUT) {
            const elem = ELEMENTS[slot.symbol];
            if (!elem) continue;
            const discovered = tracker.isDiscovered(slot.symbol);
            const color = discovered ? (CATEGORY_COLORS[elem.category] || '#aab') : '';
            const count = tracker.getCount(slot.symbol);
            cells += `
                <div class="pt-cell ${discovered ? 'discovered' : ''}"
                     style="grid-row:${slot.row + 1};grid-column:${slot.col + 1};${discovered ? `background:${color};` : ''}"
                     title="${discovered ? elem.name : '???'}">
                    ${discovered ? elem.symbol : ''}
                    ${count > 0 ? `<span class="pt-count">${count}</span>` : ''}
                </div>`;
        }
        return `<div class="periodic-grid">${cells}</div>`;
    }
}
