// ─── Labyrint Hero – Discovery Popup Scene ────────────────────────────────────
// Persistent overlay that shows an animated card whenever the player discovers
// something for the first time: a mineral, element, element-group bonus,
// molecule, or alloy.
//
// Communication: listens to EventBus 'discovery' events.
// registerListeners() must be called by GameScene after each EventBus.off() so
// the subscription survives world transitions.

class DiscoveryPopupScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DiscoveryPopupScene' });
    }

    create() {
        this._queue      = [];
        this._isShowing  = false;
        this._container  = null;
        this._autoTimer  = null;
        this.registerListeners();
    }

    /** Re-subscribe to EventBus (called by GameScene after EventBus.off()). */
    registerListeners() {
        EventBus.on('discovery', (data) => {
            this._enqueue(data);
            if (!this._isShowing) this._showNext();
        });
    }

    /**
     * Priority-aware enqueue. Element / mineral / molecule / alloy discoveries
     * must show BEFORE element-group-bonus popups, so the player doesn't miss
     * the new element behind the group reward.
     * Lower priority number = shown earlier.
     */
    _enqueue(data) {
        const priority = this._priority(data.type);
        // Insert at the first position where the next item has higher priority,
        // i.e. keep stable order within the same priority bucket.
        let insertAt = this._queue.length;
        for (let i = 0; i < this._queue.length; i++) {
            if (this._priority(this._queue[i].type) > priority) {
                insertAt = i;
                break;
            }
        }
        this._queue.splice(insertAt, 0, data);
    }

    _priority(type) {
        switch (type) {
            case 'mineral':
            case 'element':
            case 'molecule':
            case 'alloy':       return 1;
            case 'elementBonus': return 2;
            default:             return 1;
        }
    }

    // ── Queue management ──────────────────────────────────────────────────────

    _showNext() {
        if (!this._queue.length) {
            this._isShowing = false;
            return;
        }
        this._isShowing = true;
        this._renderCard(this._queue.shift());
    }

    // ── Card rendering ────────────────────────────────────────────────────────

    _renderCard(data) {
        const W  = this.scale.width;
        const H  = this.scale.height;
        const CW = 320;
        const CH = 172;
        const cx = W / 2;
        const cy = Math.round(H * 0.40);

        const borderCol  = data.iconColor  || 0x886644;
        const badgeCol   = this._badgeColor(data.type);
        const badgeLabel = this._badgeLabel(data.type);
        const iconText   = data.iconText   || (data.name ? data.name[0] : '?');

        const container = this.add.container(cx, cy);
        container.setDepth(200);

        // ── Background ──────────────────────────────────────────────────────
        const bg = this.add.graphics();
        bg.fillStyle(0x100c1e, 0.96);
        bg.fillRoundedRect(-CW / 2, -CH / 2, CW, CH, 10);
        bg.lineStyle(2, borderCol, 1);
        bg.strokeRoundedRect(-CW / 2, -CH / 2, CW, CH, 10);
        // Thin accent line at top
        bg.fillStyle(borderCol, 0.8);
        bg.fillRect(-CW / 2 + 10, -CH / 2, CW - 20, 3);
        container.add(bg);

        // ── Badge ───────────────────────────────────────────────────────────
        const badgeHex = '#' + badgeCol.toString(16).padStart(6, '0');
        const badgeTxt = this.add.text(
            -CW / 2 + 14, -CH / 2 + 10,
            badgeLabel,
            { fontSize: '11px', color: badgeHex, fontFamily: 'monospace', fontStyle: 'bold' }
        );
        container.add(badgeTxt);

        // ── Icon square ─────────────────────────────────────────────────────
        const iconSize = 44;
        const iconX    = -CW / 2 + 18;
        const iconY    = -CH / 2 + 36;
        const iconGfx  = this.add.graphics();
        iconGfx.fillStyle(borderCol, 0.25);
        iconGfx.fillRoundedRect(iconX, iconY, iconSize, iconSize, 6);
        iconGfx.lineStyle(1, borderCol, 0.7);
        iconGfx.strokeRoundedRect(iconX, iconY, iconSize, iconSize, 6);
        container.add(iconGfx);

        const iconLabel = this.add.text(
            iconX + iconSize / 2, iconY + iconSize / 2,
            iconText.length > 2 ? iconText.slice(0, 2) : iconText,
            {
                fontSize: iconText.length === 1 ? '22px' : '14px',
                color: '#' + borderCol.toString(16).padStart(6, '0'),
                fontFamily: 'monospace',
                fontStyle: 'bold',
            }
        ).setOrigin(0.5, 0.5);
        container.add(iconLabel);

        // ── Name ────────────────────────────────────────────────────────────
        const nameX = iconX + iconSize + 12;
        const nameTxt = this.add.text(
            nameX, -CH / 2 + 40,
            data.name || '',
            { fontSize: '17px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
              wordWrap: { width: CW - nameX - CW / 2 - 12 } }
        );
        container.add(nameTxt);

        // ── Subtitle ─────────────────────────────────────────────────────────
        if (data.subtitle) {
            const subTxt = this.add.text(
                nameX, -CH / 2 + 62,
                data.subtitle,
                { fontSize: '12px', color: '#aaaacc', fontFamily: 'monospace' }
            );
            container.add(subTxt);
        }

        // ── Description ──────────────────────────────────────────────────────
        if (data.desc) {
            const descTxt = this.add.text(
                -CW / 2 + 14, -CH / 2 + 100,
                data.desc,
                {
                    fontSize: '12px', color: '#887799', fontFamily: 'monospace',
                    wordWrap: { width: CW - 28 }
                }
            );
            container.add(descTxt);
        }

        // ── OK button ────────────────────────────────────────────────────────
        const okTxt = this.add.text(
            CW / 2 - 14, CH / 2 - 14,
            'OK →',
            { fontSize: '12px', color: badgeHex, fontFamily: 'monospace', fontStyle: 'bold' }
        ).setOrigin(1, 1).setInteractive({ useHandCursor: true });

        okTxt.on('pointerover', () => okTxt.setColor('#ffffff'));
        okTxt.on('pointerout',  () => okTxt.setColor(badgeHex));
        okTxt.on('pointerdown', () => this._dismiss());
        container.add(okTxt);

        // ── Animate in ───────────────────────────────────────────────────────
        container.setScale(0);
        this.tweens.add({
            targets:  container,
            scale:    1,
            duration: 250,
            ease:     'Back.easeOut',
        });

        if (data.type === 'elementBonus') {
            Audio.playGroupBonus();
        } else {
            Audio.playDiscovery();
        }

        this._container = container;
        this._autoTimer = this.time.delayedCall(3500, () => this._dismiss());
    }

    // ── Dismiss ───────────────────────────────────────────────────────────────

    _dismiss() {
        if (!this._container) return;
        if (this._autoTimer) { this._autoTimer.remove(false); this._autoTimer = null; }

        const c = this._container;
        this._container = null;

        this.tweens.add({
            targets:  c,
            scale:    0,
            duration: 180,
            ease:     'Back.easeIn',
            onComplete: () => {
                c.destroy();
                this._showNext();
            },
        });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    _badgeLabel(type) {
        switch (type) {
            case 'mineral':      return '◆ NYTT MINERAL';
            case 'element':      return '⬡ NYTT GRUNNSTOFF';
            case 'elementBonus': return '★ GRUPPE FULLFØRT';
            case 'molecule':     return '⚗ NY FORBINDELSE';
            case 'alloy':        return '⚒ NY LEGERING';
            default:             return '✦ NY OPPDAGELSE';
        }
    }

    _badgeColor(type) {
        switch (type) {
            case 'mineral':      return 0xffdd88;
            case 'element':      return 0x88ddff;
            case 'elementBonus': return 0xffcc00;
            case 'molecule':     return 0x88ffcc;
            case 'alloy':        return 0xccaaff;
            default:             return 0xffffff;
        }
    }
}
