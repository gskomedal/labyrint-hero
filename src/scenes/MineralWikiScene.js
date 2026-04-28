// ─── Labyrint Hero – Mineral Wiki ────────────────────────────────────────────
// Browseable codex of all minerals + crystals with yields and spawn locations.
// Opens from MenuScene (fromMenu: true → scene.start) or from InventoryScene
// (scene.launch overlay, with optional heroRef for the MANGLENDE tab).

class MineralWikiScene extends Phaser.Scene {
    constructor() { super({ key: 'MineralWikiScene' }); }

    init(data) {
        this.heroRef  = data?.heroRef || null;
        this.fromMenu = !!data?.fromMenu;
    }

    create() {
        const { width: W, height: H } = this.cameras.main;
        const cx = W / 2, cy = H / 2;

        // ── Dim overlay ───────────────────────────────────────────────────────
        this.add.rectangle(cx, cy, W, H, 0x000000, this.fromMenu ? 0.95 : 0.82)
            .setInteractive();

        // ── Panel ─────────────────────────────────────────────────────────────
        const panelW = Math.min(W - 10, 940);
        const panelH = Math.min(H - 10, 720);
        const px = cx - panelW / 2;
        const py = cy - panelH / 2;

        const panel = this.add.graphics();
        panel.fillStyle(0x080618, 0.97);
        panel.fillRoundedRect(px, py, panelW, panelH, 8);
        panel.lineStyle(2, 0x997755);
        panel.strokeRoundedRect(px, py, panelW, panelH, 8);

        // Title
        this.add.text(cx, py + 18, 'MINERAL-WIKI  –  Geologens lommebok', {
            fontSize: '14px', color: '#997755', fontFamily: 'monospace', fontStyle: 'bold',
            stroke: '#4a3a22', strokeThickness: 1
        }).setOrigin(0.5);

        const totalMinerals = (typeof MINERAL_DEFS !== 'undefined') ? Object.keys(MINERAL_DEFS).length : 0;
        const totalElements = (typeof TOTAL_ALL_ELEMENTS !== 'undefined') ? TOTAL_ALL_ELEMENTS
                             : (typeof ELEMENTS !== 'undefined' ? Object.keys(ELEMENTS).length : 0);
        const tracker = this.heroRef?.elementTracker || null;
        const subStr = tracker
            ? `${totalMinerals} mineraler  ·  Oppdaget ${tracker.discoveredCount}/${totalElements} grunnstoffer`
            : `${totalMinerals} mineraler  ·  ${totalElements} grunnstoffer å samle`;
        this.add.text(cx, py + 36, subStr, {
            fontSize: '12px', color: '#887766', fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.add.rectangle(cx, py + 50, panelW - 30, 1, 0x3a2a18);

        // Close button (X)
        const closeBtn = this.add.text(px + panelW - 22, py + 14, '✕', {
            fontSize: '18px', color: '#887766', fontFamily: 'monospace'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        closeBtn.on('pointerover', () => closeBtn.setColor('#ff8866'));
        closeBtn.on('pointerout',  () => closeBtn.setColor('#887766'));
        closeBtn.on('pointerdown', () => this._close());

        // ── Tabs ──────────────────────────────────────────────────────────────
        const TABS = [
            { id: 'all', label: 'ALLE' },
            { id: 't1',  label: 'T1' },
            { id: 't2',  label: 'T2' },
            { id: 't3',  label: 'T3' },
            { id: 't4',  label: 'T4' },
            { id: 't5',  label: 'T5' },
            { id: 't6',  label: 'T6' },
            { id: 'crystals', label: 'KRYSTALLER' },
            { id: 'missing',  label: 'MANGLENDE' },
        ];

        const tabH = 24;
        const tabY = py + 70;
        let tabX = px + 18;
        this._tabs = {};
        TABS.forEach(({ id, label }) => {
            const w = label.length * 8 + 14;
            const bg = this.add.rectangle(tabX + w / 2, tabY, w, tabH, 0x111122)
                .setStrokeStyle(1, 0x334466)
                .setInteractive({ useHandCursor: true });
            const txt = this.add.text(tabX + w / 2, tabY, label, {
                fontSize: '11px', color: '#aaaacc', fontFamily: 'monospace', fontStyle: 'bold'
            }).setOrigin(0.5);
            bg.on('pointerdown', () => this._selectTab(id));
            bg.on('pointerover', () => { if (this._activeTab !== id) bg.setFillStyle(0x1a1a33); });
            bg.on('pointerout',  () => { if (this._activeTab !== id) bg.setFillStyle(0x111122); });
            this._tabs[id] = { bg, txt };
            tabX += w + 4;
        });

        // ── Scrollable list area ──────────────────────────────────────────────
        this._listArea = {
            x: px + 18,
            y: py + 92,
            w: panelW - 36,
            h: panelH - 92 - 50, // leave room for back button row
        };
        this._listContainer = this.add.container(this._listArea.x, this._listArea.y);

        // Mask so list content doesn't bleed past panel
        const maskShape = this.make.graphics({ x: 0, y: 0, add: false });
        maskShape.fillStyle(0xffffff);
        maskShape.fillRect(this._listArea.x, this._listArea.y, this._listArea.w, this._listArea.h);
        this._listContainer.setMask(maskShape.createGeometryMask());

        // Drag-scroll on list area
        this._scrollY = 0;
        this._contentH = 0;
        const scrollHit = this.add.rectangle(
            this._listArea.x + this._listArea.w / 2,
            this._listArea.y + this._listArea.h / 2,
            this._listArea.w, this._listArea.h, 0x000000, 0.001
        ).setInteractive({ useHandCursor: false });
        let dragging = false, dragStartY = 0, dragStartScroll = 0;
        scrollHit.on('pointerdown', (p) => {
            dragging = true;
            dragStartY = p.y;
            dragStartScroll = this._scrollY;
        });
        scrollHit.on('pointermove', (p) => {
            if (!dragging) return;
            this._setScroll(dragStartScroll + (p.y - dragStartY));
        });
        scrollHit.on('pointerup',   () => { dragging = false; });
        scrollHit.on('pointerout',  () => { dragging = false; });

        // Mouse wheel
        this.input.on('wheel', (_pointer, _objs, _dx, dy) => {
            this._setScroll(this._scrollY - dy);
        });

        // ── Footer: back button + hint ────────────────────────────────────────
        const backBtn = this.add.text(px + 24, py + panelH - 24,
            this.fromMenu ? '[ TILBAKE ]' : '[ LUKK ]', {
            fontSize: '14px', color: '#ccaa77', fontFamily: 'monospace'
        }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
        backBtn.on('pointerover', () => backBtn.setColor('#eecc99'));
        backBtn.on('pointerout',  () => backBtn.setColor('#ccaa77'));
        backBtn.on('pointerdown', () => this._close());

        this.add.text(px + panelW - 24, py + panelH - 24, 'ESC: lukk  ·  Hjul/dra: scroll', {
            fontSize: '11px', color: '#556677', fontFamily: 'monospace'
        }).setOrigin(1, 0.5);

        // ESC handler
        this.input.keyboard.on('keydown-ESC', () => this._close());

        // ── Initial tab ───────────────────────────────────────────────────────
        this._selectTab('all');
    }

    // ── Scrolling ─────────────────────────────────────────────────────────────

    _setScroll(value) {
        const minY = Math.min(0, this._listArea.h - this._contentH);
        this._scrollY = Phaser.Math.Clamp(value, minY, 0);
        this._listContainer.y = this._listArea.y + this._scrollY;
    }

    // ── Tab handling ──────────────────────────────────────────────────────────

    _selectTab(id) {
        this._activeTab = id;
        for (const [tid, { bg, txt }] of Object.entries(this._tabs)) {
            const sel = tid === id;
            bg.setFillStyle(sel ? 0x2a1a4a : 0x111122);
            bg.setStrokeStyle(sel ? 2 : 1, sel ? 0xccaa77 : 0x334466);
            txt.setColor(sel ? '#ccaa77' : '#778899');
        }
        this._rebuildList(id);
    }

    _rebuildList(tabId) {
        this._listContainer.removeAll(true);
        this._scrollY = 0;
        this._listContainer.y = this._listArea.y;

        if (tabId === 'missing') {
            this._buildMissingList();
        } else {
            this._buildMineralList(tabId);
        }
    }

    // ── Mineral list (ALLE / T1-T6 / KRYSTALLER) ──────────────────────────────

    _buildMineralList(tabId) {
        if (typeof MINERAL_DEFS === 'undefined') return;

        // Collect mineral defs to display
        let defs = Object.values(MINERAL_DEFS);
        if (tabId === 'crystals')          defs = defs.filter(d => d.subtype === 'crystal');
        else if (tabId.startsWith('t'))    defs = defs.filter(d => d.tier === parseInt(tabId.slice(1), 10));
        // 'all' shows everything

        // Sort: tier asc, then subtype (ore before crystal), then name
        defs.sort((a, b) => (a.tier - b.tier) || a.name.localeCompare(b.name, 'no'));

        if (defs.length === 0) {
            const empty = this.add.text(0, 0, 'Ingen mineraler i denne kategorien.', {
                fontSize: '13px', color: '#556677', fontFamily: 'monospace'
            });
            this._listContainer.add(empty);
            this._contentH = 30;
            return;
        }

        const rowH = 78;
        defs.forEach((def, idx) => {
            const rowY = idx * rowH;
            this._buildMineralRow(def, rowY);
        });
        this._contentH = defs.length * rowH;
    }

    _buildMineralRow(def, rowY) {
        const w = this._listArea.w;
        const cont = this._listContainer;

        // Row separator
        if (rowY > 0) {
            const sep = this.add.rectangle(w / 2, rowY - 2, w - 8, 1, 0x2a2018);
            cont.add(sep);
        }

        // Color swatch (filled circle)
        const swatch = this.add.graphics();
        swatch.fillStyle(def.color, 1);
        swatch.fillCircle(14, rowY + 16, 8);
        swatch.lineStyle(1, 0x000000, 0.5);
        swatch.strokeCircle(14, rowY + 16, 8);
        cont.add(swatch);

        // Name + formula
        const nameTxt = this.add.text(32, rowY + 8, def.name, {
            fontSize: '14px', color: '#ddccaa', fontFamily: 'monospace', fontStyle: 'bold'
        });
        cont.add(nameTxt);
        const formula = def.formula || '';
        if (formula) {
            const formulaTxt = this.add.text(32 + nameTxt.width + 10, rowY + 10, formula, {
                fontSize: '12px', color: '#887766', fontFamily: 'monospace'
            });
            cont.add(formulaTxt);
        }

        // Tier badge (right side)
        const tierColors = (typeof MINERAL_TIER_COLORS !== 'undefined') ? MINERAL_TIER_COLORS : {};
        const tierCol = tierColors[def.tier] || 0x888888;
        const tierHex = '#' + tierCol.toString(16).padStart(6, '0');
        const tierLabel = def.subtype === 'crystal' ? `KRYSTALL T${def.tier}` : `T${def.tier}`;
        const tierBadge = this.add.text(w - 8, rowY + 10, tierLabel, {
            fontSize: '11px', color: tierHex, fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(1, 0);
        cont.add(tierBadge);

        // Yields line
        const yieldsLine = this._formatYields(def);
        const yields = this.add.text(32, rowY + 28, '→ Gir: ', {
            fontSize: '12px', color: '#778877', fontFamily: 'monospace'
        });
        cont.add(yields);
        const yieldsTxt = this.add.text(32 + yields.width, rowY + 28, yieldsLine, {
            fontSize: '12px', color: '#aabbaa', fontFamily: 'monospace'
        });
        cont.add(yieldsTxt);

        // Found-in line
        const foundIn = this._getMineralLocations(def);
        const foundTxt = this.add.text(32, rowY + 44, `Funnet i: ${foundIn}`, {
            fontSize: '11px', color: '#7a8899', fontFamily: 'monospace',
            wordWrap: { width: w - 40 }
        });
        cont.add(foundTxt);

        // Description
        const descTxt = this.add.text(32, rowY + 60, `"${def.desc || ''}"`, {
            fontSize: '11px', color: '#665544', fontFamily: 'monospace',
            wordWrap: { width: w - 40 }
        });
        cont.add(descTxt);
    }

    _formatYields(def) {
        if (!def.yields || def.yields.length === 0) return 'ingen';
        const elements = (typeof ELEMENTS !== 'undefined') ? ELEMENTS : {};
        return def.yields.map(y => {
            const e = elements[y.symbol];
            const symStr = e ? e.symbol : y.symbol;
            let suffix = '';
            if (y.chance < 0.3)      suffix = ' (svært sjelden)';
            else if (y.chance < 0.6) suffix = ' (sjelden)';
            else if (y.chance < 1.0) suffix = ' (variabel)';
            return `${symStr}×${y.amount}${suffix}`;
        }).join(', ');
    }

    // ── Where is the mineral found? ──────────────────────────────────────────
    // Derived from spawn rules in src/systems/ItemSpawner.js:
    //   quarry        – any tier, world matches
    //   crystal_cave  – crystals only
    //   ore_chamber   – minerals tier 3+
    //   hydrothermal  – minerals tier 4+
    //   magma_chamber – minerals tier 5-6 (boss-grade)
    //   gas_pocket    – noble gases (He/Ne/Ar/Kr/Xe) directly, world 10+
    // Plus regular floor scatter and boss drops (tier 4+).
    _getMineralLocations(def) {
        const t = def.tier;
        const isCrystal = def.subtype === 'crystal';
        const minWorld = ({ 1: 1, 2: 1, 3: 2, 4: 4, 5: 6, 6: 8 })[t] || 1;
        const rooms = [];

        if (isCrystal) {
            rooms.push('Krystallhule');
        } else {
            rooms.push('Steinbrudd');
            if (t >= 3) rooms.push('Malmkammer');
            if (t >= 4) rooms.push('Hydrotermisk åre');
            if (t >= 5) rooms.push('Magmakammer');
        }
        rooms.push('spredt i tunneler');
        if (!isCrystal && t >= 4) rooms.push('boss-drop');

        return `${rooms.join(', ')} (Verden ${minWorld}+)`;
    }

    // ── Missing elements tab ──────────────────────────────────────────────────

    _buildMissingList() {
        const cont = this._listContainer;
        const tracker = this.heroRef?.elementTracker || null;

        if (!tracker) {
            const hint = this.add.text(0, 0,
                'Start et eventyr for å se hvilke grunnstoffer du mangler.\n\n' +
                'Wiki-en bruker din nåværende helts oppdagelses-status til å vise ' +
                'hvilke mineraler du bør lete etter.',
                {
                    fontSize: '13px', color: '#887766', fontFamily: 'monospace',
                    wordWrap: { width: this._listArea.w - 16 }
                }
            );
            cont.add(hint);
            this._contentH = 80;
            return;
        }

        if (typeof ELEMENTS === 'undefined') return;

        // For each undiscovered element, list minerals that yield it
        const missing = Object.values(ELEMENTS).filter(e => !tracker.isDiscovered(e.symbol));

        if (missing.length === 0) {
            const done = this.add.text(0, 0,
                '★ Du har oppdaget alle grunnstoffene! ★\n\nGuds periodiske system venter…',
                {
                    fontSize: '14px', color: '#ffcc44', fontFamily: 'monospace', fontStyle: 'bold',
                    align: 'center'
                }
            );
            cont.add(done);
            this._contentH = 60;
            return;
        }

        // Sort missing by atomic number for predictable order
        missing.sort((a, b) => a.atomicNumber - b.atomicNumber);

        // Pre-build mineral index: symbol -> [mineralDef, ...]
        const mineralsBySymbol = {};
        if (typeof MINERAL_DEFS !== 'undefined') {
            for (const def of Object.values(MINERAL_DEFS)) {
                for (const y of (def.yields || [])) {
                    (mineralsBySymbol[y.symbol] = mineralsBySymbol[y.symbol] || []).push(def);
                }
            }
        }

        const w = this._listArea.w;
        const rowH = 56;
        const NOBLE_GASES = new Set(['He', 'Ne', 'Ar', 'Kr', 'Xe']);
        // Synthetic elements (Tc, Pm, Np-Og) — symbols whose atomic number is 43, 61, or >= 93
        const isSynthetic = (e) => e.atomicNumber === 43 || e.atomicNumber === 61 || e.atomicNumber >= 93;

        missing.forEach((elem, idx) => {
            const rowY = idx * rowH;

            if (rowY > 0) {
                const sep = this.add.rectangle(w / 2, rowY - 2, w - 8, 1, 0x2a2018);
                cont.add(sep);
            }

            // Element header: "Wolfram (W) – atomic 74"
            const header = this.add.text(8, rowY + 6,
                `${elem.name} (${elem.symbol})  ·  atomnr ${elem.atomicNumber}`, {
                fontSize: '13px', color: '#ddccaa', fontFamily: 'monospace', fontStyle: 'bold'
            });
            cont.add(header);

            // Source line
            let sourceLine;
            if (isSynthetic(elem)) {
                sourceLine = 'Syntetisk – lages i Akselerator-rommet (kjernefysikk).';
            } else if (NOBLE_GASES.has(elem.symbol)) {
                sourceLine = 'Direkte fra gasslomme (Verden 10+).';
            } else {
                const ms = mineralsBySymbol[elem.symbol] || [];
                if (ms.length === 0) {
                    sourceLine = 'Ingen kjent kilde – sjekk smelter/kjemilab.';
                } else {
                    // Pick lowest-tier mineral as primary, mention up to 3
                    ms.sort((a, b) => a.tier - b.tier);
                    const primary = ms.slice(0, 3)
                        .map(d => `${d.name} (T${d.tier})`)
                        .join(', ');
                    const minTier = ms[0].tier;
                    const minWorld = ({ 1: 1, 2: 1, 3: 2, 4: 4, 5: 6, 6: 8 })[minTier] || 1;
                    sourceLine = `Finnes i: ${primary} – fra Verden ${minWorld}+`;
                }
            }
            const src = this.add.text(8, rowY + 26, sourceLine, {
                fontSize: '11px', color: '#7a8899', fontFamily: 'monospace',
                wordWrap: { width: w - 20 }
            });
            cont.add(src);
        });

        this._contentH = missing.length * rowH;
    }

    // ── Close handling ────────────────────────────────────────────────────────

    _close() {
        if (this.fromMenu) {
            this.scene.start('MenuScene');
        } else {
            this.scene.stop();
        }
    }
}
