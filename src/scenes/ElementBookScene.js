// ─── Labyrint Hero – Element Book (Periodic Table UI) ─────────────────────────
// Overlay scene showing the periodic table with discovered/undiscovered elements.
// Opens via B key in GameScene or "Elementbok" button in InventoryScene.

class ElementBookScene extends Phaser.Scene {
    constructor() { super({ key: 'ElementBookScene' }); }

    init(data) {
        this.heroRef = data.heroRef || null;
    }

    create() {
        const { width: W, height: H } = this.cameras.main;
        const cx = W / 2, cy = H / 2;
        const tracker = this.heroRef ? this.heroRef.elementTracker : null;

        // ── Dim overlay ───────────────────────────────────────────────────────
        const dimBg = this.add.rectangle(cx, cy, W, H, 0x000000, 0.82)
            .setInteractive();

        // ── Panel ─────────────────────────────────────────────────────────────
        const panelW = Math.min(W - 10, 920);
        const panelH = Math.min(H - 10, 580);
        const px = cx - panelW / 2;
        const py = cy - panelH / 2;

        const panel = this.add.graphics();
        panel.fillStyle(0x080618, 0.97);
        panel.fillRoundedRect(px, py, panelW, panelH, 8);
        panel.lineStyle(2, 0x997755);
        panel.strokeRoundedRect(px, py, panelW, panelH, 8);

        // Title
        const discovered = tracker ? tracker.discoveredCount : 0;
        const total = typeof TOTAL_NATURAL_ELEMENTS !== 'undefined' ? TOTAL_NATURAL_ELEMENTS : '?';
        this.add.text(cx, py + 18, `ELEMENTBOK  –  Det periodiske system`, {
            fontSize: '14px', color: '#997755', fontFamily: 'monospace', fontStyle: 'bold',
            stroke: '#4a3a22', strokeThickness: 1
        }).setOrigin(0.5);

        this.add.text(cx, py + 36, `Oppdaget: ${discovered}/${total} grunnstoffer`, {
            fontSize: '11px', color: '#887766', fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.add.rectangle(cx, py + 48, panelW - 30, 1, 0x2a2060);

        // ── Draw periodic table grid ──────────────────────────────────────────
        const cellW = 46, cellH = 28;
        const cols = 18, rows = 10; // 7 main rows + gap + 2 lanthanide/actinide rows
        const tableW = cols * cellW;
        const tableH = rows * cellH;
        const tableX = cx - tableW / 2;
        const tableY = py + 56;

        // Tooltip text (shown on hover)
        this.tooltipText = this.add.text(cx, py + panelH - 40, '', {
            fontSize: '11px', color: '#bbaa99', fontFamily: 'monospace',
            align: 'center', wordWrap: { width: panelW - 40 }
        }).setOrigin(0.5);

        if (typeof PERIODIC_TABLE_LAYOUT === 'undefined') return;

        // Category colors for discovered elements
        const catColors = {
            metal:       0xccaa88,
            nonmetal:    0x66ccaa,
            metalloid:   0x88aacc,
            alkali:      0xffbb44,
            alkaline:    0xddcc66,
            noble_metal: 0xffcc00,
            noble:       0x88ccff,
            actinide:    0x66dd88,
        };

        for (const entry of PERIODIC_TABLE_LAYOUT) {
            const elem = typeof ELEMENTS !== 'undefined' ? ELEMENTS[entry.symbol] : null;
            if (!elem) continue;

            const isDiscovered = tracker && tracker.isDiscovered(entry.symbol);

            // Map rows: 0-6 = periods 1-7, 8 = lanthanides/actinides row 1, etc.
            // Add a small gap before rows 8+ (lanthanides/actinides)
            let yOffset = entry.row;
            if (entry.row >= 8) yOffset = entry.row + 0.5; // half-row gap

            const cellX = tableX + entry.col * cellW;
            const cellY = tableY + yOffset * cellH;

            const g = this.add.graphics();

            if (isDiscovered) {
                const catCol = catColors[elem.category] || elem.color;
                g.fillStyle(catCol, 0.15);
                g.fillRoundedRect(cellX, cellY, cellW - 2, cellH - 2, 2);
                g.lineStyle(1, catCol, 0.5);
                g.strokeRoundedRect(cellX, cellY, cellW - 2, cellH - 2, 2);

                // Atomic number
                const numHex = '#' + (catCol).toString(16).padStart(6, '0');
                this.add.text(cellX + 3, cellY + 2, `${elem.atomicNumber}`, {
                    fontSize: '7px', color: numHex, fontFamily: 'monospace'
                });

                // Symbol
                this.add.text(cellX + cellW / 2 - 1, cellY + cellH / 2, elem.symbol, {
                    fontSize: '12px', color: '#e8e8ff', fontFamily: 'monospace', fontStyle: 'bold'
                }).setOrigin(0.5);

                // Tier dot
                if (typeof MINERAL_TIER_COLORS !== 'undefined') {
                    const tierCol = MINERAL_TIER_COLORS[elem.tier] || 0x888888;
                    g.fillStyle(tierCol, 0.7);
                    g.fillCircle(cellX + cellW - 6, cellY + 5, 2);
                }

                // Interactive hover
                const hitZone = this.add.rectangle(cellX + cellW / 2 - 1, cellY + cellH / 2, cellW - 2, cellH - 2)
                    .setInteractive({ useHandCursor: true })
                    .setAlpha(0.01);
                hitZone.on('pointerover', () => {
                    g.lineStyle(2, 0xffffff, 0.8);
                    g.strokeRoundedRect(cellX, cellY, cellW - 2, cellH - 2, 2);
                    this.tooltipText.setText(`${elem.symbol} – ${elem.name} (${elem.atomicNumber})\n${elem.description}`);
                });
                hitZone.on('pointerout', () => {
                    g.clear();
                    g.fillStyle(catCol, 0.15);
                    g.fillRoundedRect(cellX, cellY, cellW - 2, cellH - 2, 2);
                    g.lineStyle(1, catCol, 0.5);
                    g.strokeRoundedRect(cellX, cellY, cellW - 2, cellH - 2, 2);
                    g.fillStyle(MINERAL_TIER_COLORS[elem.tier] || 0x888888, 0.7);
                    g.fillCircle(cellX + cellW - 6, cellY + 5, 2);
                    this.tooltipText.setText('');
                });
            } else {
                // Undiscovered: dark grey
                g.fillStyle(0x111118, 0.6);
                g.fillRoundedRect(cellX, cellY, cellW - 2, cellH - 2, 2);
                g.lineStyle(1, 0x222233, 0.3);
                g.strokeRoundedRect(cellX, cellY, cellW - 2, cellH - 2, 2);

                this.add.text(cellX + cellW / 2 - 1, cellY + cellH / 2, '?', {
                    fontSize: '12px', color: '#222233', fontFamily: 'monospace'
                }).setOrigin(0.5);
            }
        }

        // ── Completion bonuses ────────────────────────────────────────────────
        if (typeof ELEMENT_BONUSES !== 'undefined') {
            const bonusY = tableY + 10.5 * cellH + 10;
            const bonusW = Math.min(panelW - 20, ELEMENT_BONUSES.length * 130);
            const startBX = cx - bonusW / 2 + 60;

            this.add.text(cx, bonusY - 4, 'GRUPPEPRESTASJONER', {
                fontSize: '9px', color: '#555544', fontFamily: 'monospace'
            }).setOrigin(0.5);

            ELEMENT_BONUSES.forEach((bonus, i) => {
                const bx = startBX + i * 125;
                const completed = tracker && tracker.isBonusCompleted(bonus.id);
                const col = completed ? '#ffcc44' : '#333344';
                const icon = completed ? '★' : '○';
                this.add.text(bx, bonusY + 10, `${icon} ${bonus.name}`, {
                    fontSize: '8px', color: col, fontFamily: 'monospace'
                }).setOrigin(0.5);
                this.add.text(bx, bonusY + 22, bonus.desc, {
                    fontSize: '7px', color: completed ? '#887766' : '#222233', fontFamily: 'monospace'
                }).setOrigin(0.5);
            });
        }

        // ── Close button ──────────────────────────────────────────────────────
        const closeBtn = this.add.text(px + panelW - 30, py + 8, '✕', {
            fontSize: '18px', color: '#887766', fontFamily: 'monospace'
        }).setInteractive({ useHandCursor: true });
        closeBtn.on('pointerdown', () => this.scene.stop());

        // ESC or B to close
        this.input.keyboard.on('keydown-ESC', () => this.scene.stop());
        this.input.keyboard.on('keydown-B', () => this.scene.stop());
    }
}
