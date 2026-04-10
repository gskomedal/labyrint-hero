// ─── Labyrint Hero – SkillScene (Skill Tree) ──────────────────────────────────
// Shows a 5-column × 3-tier skill tree on level-up.
// Available skills glow; locked skills are greyed with a lock indicator.
// Player picks exactly one skill per level-up.

class SkillScene extends Phaser.Scene {
    constructor() { super({ key: 'SkillScene' }); }

    init(data) {
        this.heroRef  = data.heroRef || null;
        this.viewOnly = data.viewOnly || false;
    }

    create() {
        const { width: W, height: H } = this.cameras.main;
        const cx = W / 2, cy = H / 2;

        // ── Dim overlay ───────────────────────────────────────────────────────
        this.add.rectangle(cx, cy, W, H, 0x000000, 0.78);

        // ── Panel ─────────────────────────────────────────────────────────────
        const panelW = W - 20;
        const panelH = H - 20;
        const px = cx - panelW / 2;
        const py = cy - panelH / 2;

        const panel = this.add.graphics();
        panel.fillStyle(0x080618, 0.97);
        panel.fillRoundedRect(px, py, panelW, panelH, 8);
        panel.lineStyle(2, 0x4444aa);
        panel.strokeRoundedRect(px, py, panelW, panelH, 8);

        // Title
        const titleText = this.viewOnly
            ? 'FERDIGHETSTREET  –  Trykk T eller ESC for å lukke'
            : 'NIVÅ OPP  –  Velg én evne fra spesialiseringsgrenen';
        const titleColor = this.viewOnly ? '#88aacc' : '#f5e642';
        const titleStroke = this.viewOnly ? '#334466' : '#7a6a00';
        this.add.text(cx, py + 18, titleText, {
            fontSize: '17px', color: titleColor, fontFamily: 'monospace',
            fontStyle: 'bold', stroke: titleStroke, strokeThickness: 2
        }).setOrigin(0.5);

        // Close on T or ESC in view-only mode
        if (this.viewOnly) {
            this.input.keyboard.on('keydown-T', () => this.scene.stop());
            this.input.keyboard.on('keydown-ESC', () => this.scene.stop());
        }

        this.add.rectangle(cx, py + 38, panelW - 30, 1, 0x2a2060);

        // ── Draw the 5-path tree ───────────────────────────────────────────────
        const colW = panelW / SKILL_TREE_PATHS.length;
        this._colW = colW;
        SKILL_TREE_PATHS.forEach((path, pi) => {
            const colCX = px + pi * colW + colW / 2;
            this._drawPath(path, pi, colCX, py + 50, panelH - 80);
        });

        // ── Synergies display (right below skill cards) ───────────────────────
        // 3 tiers × (cardH + 10) + header offset = cards end
        const cardsEndY = py + 50 + 28 + 3 * (140 + 10) - 10;
        this._drawSynergies(cx, cardsEndY + 12, panelW);

        // ── Footer ────────────────────────────────────────────────────────────
        this.add.rectangle(cx, py + panelH - 24, panelW - 30, 1, 0x1a1840);
        const footerText = this.viewOnly
            ? 'Grønne rammer = tilgjengelig ved neste nivå opp · Grå = låst'
            : 'Grønne rammer = tilgjengelig · Grå = låst · Klikk for å velge';
        this.add.text(cx, py + panelH - 14, footerText, {
            fontSize: '12px', color: '#33335a', fontFamily: 'monospace'
        }).setOrigin(0.5);
    }

    _drawPath(path, pathIndex, colCX, areaTop, areaH) {
        const hero    = this.heroRef;
        const colColor = path.color;
        const hexCol  = '#' + colColor.toString(16).padStart(6, '0');
        const hdrW = Math.min(220, this._colW - 12);

        // Check if entire path is locked
        const pathLocked = (path.unlockCondition === 'mineral_pickup' && !hero.geologistUnlocked)
            || (path.unlockCondition === 'first_smelt' && !hero.metallurgistUnlocked)
            || (path.unlockCondition === 'first_synthesis' && !hero.chemistUnlocked);

        // Path header
        const hdrBg = this.add.graphics();
        hdrBg.fillStyle(pathLocked ? 0x111118 : colColor, pathLocked ? 0.15 : 0.12);
        hdrBg.fillRoundedRect(colCX - hdrW / 2, areaTop, hdrW, 26, 4);
        hdrBg.lineStyle(1, pathLocked ? 0x222233 : colColor, pathLocked ? 0.3 : 0.5);
        hdrBg.strokeRoundedRect(colCX - hdrW / 2, areaTop, hdrW, 26, 4);

        this.add.text(colCX, areaTop + 6, `── ${path.name.toUpperCase()} ──`, {
            fontSize: '13px', color: pathLocked ? '#333344' : hexCol, fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0.5);
        const lockHint = path.unlockCondition === 'first_smelt' ? 'Smelt et mineral!'
            : path.unlockCondition === 'first_synthesis' ? 'Lag en kjemikalie!'
            : 'Finn et mineral!';
        this.add.text(colCX, areaTop + 18, pathLocked ? lockHint : path.desc, {
            fontSize: '10px', color: pathLocked ? '#333344' : '#445566', fontFamily: 'monospace'
        }).setOrigin(0.5);

        // If entire path is locked, show a lock overlay and skip drawing skill cards
        if (pathLocked) {
            this.add.text(colCX, areaTop + 80, '🔒', { fontSize: '24px' }).setOrigin(0.5);
            const lockMsg = path.unlockCondition === 'first_smelt'
                ? 'Smelt et mineral\ni leirplassen\nfor å låse opp'
                : path.unlockCondition === 'first_synthesis'
                ? 'Lag en kjemikalie\ni laboratoriet\nfor å låse opp'
                : 'Plukk opp et\nmineral for å\nlåse opp';
            this.add.text(colCX, areaTop + 110, lockMsg, {
                fontSize: '11px', color: '#333344', fontFamily: 'monospace', align: 'center'
            }).setOrigin(0.5);
            return;
        }

        const tierH    = 140;
        const cardW    = Math.min(220, this._colW - 16), cardH = 108;
        const tierGapY = areaTop + 28;

        path.tiers.forEach((skill, tierIndex) => {
            const cardY  = tierGapY + tierIndex * (tierH + 10);
            const locked = !isSkillUnlocked(hero, pathIndex, tierIndex);
            const taken  = (hero?.skills || []).filter(s => s === skill.id).length;
            const maxed  = taken >= skill.maxStack;

            this._drawSkillCard(colCX, cardY, cardW, cardH, skill, path, locked, taken, maxed, pathIndex, tierIndex);

            // Connector arrow between tiers
            if (tierIndex < path.tiers.length - 1) {
                const arrowG = this.add.graphics();
                const ay = cardY + cardH + 1;
                const unlNext = !isSkillUnlocked(hero, pathIndex, tierIndex + 1);
                arrowG.fillStyle(unlNext ? 0x1a1535 : colColor, unlNext ? 0.4 : 0.6);
                arrowG.fillTriangle(colCX - 4, ay, colCX + 4, ay, colCX, ay + 6);
            }
        });
    }

    _drawSkillCard(cx, y, w, h, skill, path, locked, taken, maxed, pathIndex, tierIndex) {
        const colColor = path.color;
        const hexCol   = '#' + colColor.toString(16).padStart(6, '0');
        const available = !locked && !maxed;

        // Card background
        const bg = this.add.graphics();
        if (maxed) {
            bg.fillStyle(0x0a0818, 0.9);
        } else if (locked) {
            bg.fillStyle(0x0c0c18, 0.8);
        } else {
            bg.fillStyle(colColor, 0.08);
        }
        bg.fillRoundedRect(cx - w / 2, y, w, h, 5);

        // Border
        if (available) {
            bg.lineStyle(2, colColor, 0.9);
            // Pulse glow via tween
            this.tweens.add({
                targets: bg, alpha: 0.7, duration: 900,
                yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
            });
        } else if (maxed) {
            bg.lineStyle(1, colColor, 0.3);
        } else {
            bg.lineStyle(1, 0x222233, 0.6);
        }
        bg.strokeRoundedRect(cx - w / 2, y, w, h, 5);

        // Tier badge (T1/T2/T3)
        const tierLabel = ['T1','T2','T3'][tierIndex] || '';
        const tierG = this.add.graphics();
        tierG.fillStyle(locked ? 0x1a1535 : colColor, locked ? 0.3 : 0.25);
        tierG.fillRoundedRect(cx + w / 2 - 24, y + 2, 22, 14, 3);
        this.add.text(cx + w / 2 - 13, y + 9, tierLabel, {
            fontSize: '10px', color: locked ? '#333355' : hexCol, fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Lock icon or stack indicator
        if (locked) {
            this.add.text(cx - w / 2 + 6, y + 2, '🔒', { fontSize: '10px' });
        } else if (taken > 0 && skill.maxStack > 1) {
            const stackStr = `${taken}/${skill.maxStack}`;
            this.add.text(cx - w / 2 + 6, y + 9, stackStr, {
                fontSize: '10px', color: hexCol, fontFamily: 'monospace'
            }).setOrigin(0, 0.5);
        }

        // Skill name
        this.add.text(cx, y + 20, skill.name, {
            fontSize: '14px',
            color: maxed ? '#445566' : (locked ? '#333355' : '#e8e8ff'),
            fontFamily: 'monospace', fontStyle: 'bold',
            align: 'center', wordWrap: { width: w - 12 }
        }).setOrigin(0.5, 0);

        // Category badge + description combined
        const catHex = locked ? '#222233' : '#' + colColor.toString(16).padStart(6, '0');
        const descLine = skill.desc.replace(/\n/g, ', ');
        this.add.text(cx, y + 42, `[${skill.category}] ${descLine}`, {
            fontSize: '12px',
            color: locked ? '#1e1e30' : (maxed ? '#334455' : '#8899bb'),
            fontFamily: 'monospace', align: 'center',
            wordWrap: { width: w - 10 }
        }).setOrigin(0.5, 0);

        // Maxed label
        if (maxed) {
            this.add.text(cx, y + h / 2, 'MAKS', {
                fontSize: '14px', color: '#2a2a44', fontFamily: 'monospace', fontStyle: 'bold'
            }).setOrigin(0.5);
        }

        // Clickable hit area
        if (available && !this.viewOnly) {
            const hitZone = this.add.rectangle(cx, y + h / 2, w, h)
                .setInteractive({ useHandCursor: true });
            hitZone.on('pointerover', () => {
                bg.clear();
                bg.fillStyle(colColor, 0.22);
                bg.fillRoundedRect(cx - w / 2, y, w, h, 5);
                bg.lineStyle(2, colColor, 1.0);
                bg.strokeRoundedRect(cx - w / 2, y, w, h, 5);
            });
            hitZone.on('pointerout', () => {
                bg.clear();
                bg.fillStyle(colColor, 0.08);
                bg.fillRoundedRect(cx - w / 2, y, w, h, 5);
                bg.lineStyle(2, colColor, 0.9);
                bg.strokeRoundedRect(cx - w / 2, y, w, h, 5);
            });
            hitZone.on('pointerdown', () => this._pickSkill(skill));
        }
    }

    _drawSynergies(cx, y, panelW) {
        const active = getActiveSynergies(this.heroRef);
        if (SKILL_SYNERGIES.length === 0) return;

        this.add.text(cx, y, 'SYNERGIER', {
            fontSize: '11px', color: '#445566', fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Multi-row grid: max 5 per row, centered
        const perRow = 5;
        const slotW = Math.min(Math.floor((panelW - 40) / perRow), 240);
        const rowH = 26;
        const rows = Math.ceil(SKILL_SYNERGIES.length / perRow);
        let sy = y + 14;

        SKILL_SYNERGIES.forEach((syn, i) => {
            const row = Math.floor(i / perRow);
            const col = i % perRow;
            const rowCount = Math.min(perRow, SKILL_SYNERGIES.length - row * perRow);
            const rowW = rowCount * slotW;
            const sx = cx - rowW / 2 + col * slotW + slotW / 2;

            const isActive = active.some(a => a.id === syn.id);
            const hexCol = '#' + syn.color.toString(16).padStart(6, '0');
            const nameCol = isActive ? hexCol : '#333355';
            const descCol = isActive ? '#8899bb' : '#222233';

            const initials = syn.paths.map(p => {
                const path = SKILL_TREE_PATHS.find(pt => pt.id === p);
                return path ? path.name[0] : '?';
            }).join('+');
            const icon = isActive ? '✦' : '○';

            this.add.text(sx, sy + row * rowH, `${icon} ${initials} ${syn.name}`, {
                fontSize: '10px', color: nameCol, fontFamily: 'monospace'
            }).setOrigin(0.5);
            this.add.text(sx, sy + row * rowH + 12, syn.desc, {
                fontSize: '10px', color: descCol, fontFamily: 'monospace'
            }).setOrigin(0.5);
        });
    }

    _pickSkill(skill) {
        if (this.heroRef) {
            this.heroRef.skills.push(skill.id);
            skill.apply(this.heroRef);
        }
        this.game.events.emit('skillPicked', skill);
        this.scene.stop();
    }
}
