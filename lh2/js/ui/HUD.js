// ─── Labyrint Hero 2 – HUD ───────────────────────────────────────────────────
// Science bars, counters, toasts and discovery popups. Plain DOM, Norwegian
// text like the main game. Listens on the shared EventBus.

class HUD {
    constructor(hero) {
        this.hero = hero;
        this.panel = document.getElementById('science-panel');
        this.elementCounter = document.getElementById('element-counter');
        this.bagCounter = document.getElementById('bag-counter');
        this.toastStack = document.getElementById('toast-stack');
        this.discoveryPopup = document.getElementById('discovery-popup');

        // Hero level row above the sciences
        this.levelRow = document.createElement('div');
        this.levelRow.className = 'science-row';
        this.levelRow.innerHTML = `
            <span class="science-name" style="color:#ffe9a0">Helt</span>
            <span class="science-level"></span>
            <div class="science-bar"><div class="science-bar-fill" style="background:#ffe9a0"></div></div>`;
        this.panel.appendChild(this.levelRow);

        this.skillPointsEl = document.createElement('div');
        this.skillPointsEl.id = 'skill-points-row';
        this.skillPointsEl.addEventListener('click', () => {
            if (!LH2Main.uiOpen) LH1UIHost.openSkillTree(this.hero);
        });
        this.panel.appendChild(this.skillPointsEl);

        this._buildSciencePanel();
        this.heartsEl = document.createElement('div');
        this.heartsEl.id = 'hearts-row';
        this.panel.appendChild(this.heartsEl);
        this.refresh();

        EventBus.on('lh2HeartsChanged', () => this.refresh());
        EventBus.on('lh2HeroXP', () => this.refresh());
        EventBus.on('lh2SkillsChanged', () => this.refresh());
        EventBus.on('lh2LevelUp', (d) => {
            this.toast(`Nivå ${d.level}! +1 ferdighetspoeng (trykk K)`, 'levelup');
        });

        EventBus.on('lh2ScienceXP', () => this.refresh());
        EventBus.on('lh2InventoryChanged', () => this.refresh());
        EventBus.on('lh2Toast', (d) => this.toast(d.text, d.cls));
        EventBus.on('lh2ScienceLevelUp', (d) => {
            const def = LH2.SCIENCES.find(s => s.id === d.science);
            this.toast(`${def.name} nivå ${d.level}!`, 'levelup');
        });
        // Same discovery event the main game emits from ElementTracker
        EventBus.on('discovery', (d) => this.showDiscovery(d));

        document.getElementById('new-game-btn').addEventListener('click', () => {
            if (confirm('Slette lagringen og starte på nytt?')) {
                SaveManager2.clear();
                LH2Main.skipSaveOnUnload = true;
                location.reload();
            }
        });
    }

    _buildSciencePanel() {
        this.rows = {};
        for (const s of LH2.SCIENCES) {
            const row = document.createElement('div');
            row.className = 'science-row';
            row.innerHTML = `
                <span class="science-name" style="color:${s.color}">${s.name}</span>
                <span class="science-level"></span>
                <div class="science-bar"><div class="science-bar-fill" style="background:${s.color}"></div></div>`;
            this.panel.appendChild(row);
            this.rows[s.id] = {
                level: row.querySelector('.science-level'),
                fill: row.querySelector('.science-bar-fill'),
            };
        }
    }

    refresh() {
        this.levelRow.querySelector('.science-level').textContent = `Nv ${this.hero.level}`;
        this.levelRow.querySelector('.science-bar-fill').style.width =
            Math.min(100, (this.hero.xp / this.hero.xpToNext) * 100) + '%';
        this.skillPointsEl.textContent = this.hero.skillPoints > 0
            ? `★ ${this.hero.skillPoints} ferdighetspoeng – trykk K`
            : '';

        const sci = this.hero.sciences;
        for (const s of LH2.SCIENCES) {
            const lvl = sci.getLevel(s.id);
            const xp = sci.getXP(s.id);
            const next = sci.xpToNext(lvl);
            this.rows[s.id].level.textContent = `Nv ${lvl}`;
            this.rows[s.id].fill.style.width = Math.min(100, (xp / next) * 100) + '%';
        }

        this.heartsEl.textContent =
            '♥'.repeat(this.hero.hearts) + '♡'.repeat(Math.max(0, this.hero.maxHearts - this.hero.hearts));

        const total = (typeof TOTAL_ALL_ELEMENTS !== 'undefined') ? TOTAL_ALL_ELEMENTS : 118;
        this.elementCounter.textContent = `Grunnstoffer: ${this.hero.elementTracker.discoveredCount}/${total}`;
        this.bagCounter.textContent = `Sekk: ${this.hero.inventory.itemCount}/${this.hero.inventory.backpack.length}`;
    }

    toast(text, cls) {
        const el = document.createElement('div');
        el.className = 'toast' + (cls ? ' ' + cls : '');
        el.textContent = text;
        this.toastStack.appendChild(el);
        setTimeout(() => el.remove(), 3200);
        while (this.toastStack.children.length > 5) {
            this.toastStack.firstChild.remove();
        }
    }

    /** Element discovery popup – payload from ElementTracker.discoverWithPopup. */
    showDiscovery(d) {
        const hex = '#' + (d.iconColor || 0x88ddff).toString(16).padStart(6, '0');
        this.discoveryPopup.innerHTML = `
            <div class="disc-icon" style="background:${hex}">${d.iconText || '?'}</div>
            <div class="disc-title">Oppdaget: ${d.name}</div>
            <div class="disc-sub">${d.subtitle || ''} &middot; ${d.desc || ''}</div>`;
        this.discoveryPopup.classList.remove('hidden');
        clearTimeout(this._discTimer);
        this._discTimer = setTimeout(() => this.discoveryPopup.classList.add('hidden'), 2600);
        this.refresh();
    }
}
