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
        for (const entry of inv.backpack) {
            if (!entry) {
                bpHtml += `<div class="bp-slot"></div>`;
                continue;
            }
            const def = inv._getItemDef(entry);
            if (!def) {
                bpHtml += `<div class="bp-slot"></div>`;
                continue;
            }
            const hex = '#' + (def.color || 0x888888).toString(16).padStart(6, '0');
            const name = LH2Mining.itemName(def);
            const count = entry.count !== undefined ? entry.count : 1;
            bpHtml += `
                <div class="bp-slot">
                    <div class="bp-chip" style="background:${hex}"></div>
                    <div>${name}</div>
                    <div class="bp-count">×${count}</div>
                </div>`;
        }

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
                <h2>Ryggsekk</h2>
                <div class="backpack-grid">${bpHtml}</div>
                ${molHtml ? `<h2>Molekyler</h2><div class="backpack-grid">${molHtml}</div>` : ''}
                <h2>Periodesystemet</h2>
                ${this._periodicTableHtml()}
            </div>`;

        this.el.querySelector('.overlay-close').addEventListener('click', () => this.hide());
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
