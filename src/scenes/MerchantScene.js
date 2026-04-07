// ─── Labyrint Hero – MerchantScene (Shop overlay) ────────────────────────────
// Full-screen overlay showing merchant stock. Buy items with gold.

class MerchantScene extends Phaser.Scene {
    constructor() { super({ key: 'MerchantScene' }); }

    init(data) {
        this.gs    = data.gameScene;
        this.stock = data.stock || [];
    }

    create() {
        const { width: W, height: H } = this.cameras.main;
        this.hero = this.gs.hero;
        this._dyn = [];

        const cx = W / 2, cy = H / 2;
        const panelW = 440, panelH = 380;

        // Background
        this.add.rectangle(cx, cy, W, H, 0x1a1008, 0.78);
        this.add.rectangle(cx, cy, panelW, panelH, 0x2a1e14).setStrokeStyle(2, 0x7a6030);

        // Title
        this.add.text(cx, cy - panelH / 2 + 18, 'HANDELSMANN', {
            fontSize: '20px', color: '#d4a843', fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.rectangle(cx, cy - panelH / 2 + 38, panelW - 40, 1, 0x5a4a30);

        // Gold display
        this._goldText = this.add.text(cx, cy - panelH / 2 + 50, '', {
            fontSize: '13px', color: '#ffcc00', fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Message area
        this._msgText = this.add.text(cx, cy + panelH / 2 - 40, '', {
            fontSize: '11px', color: '#c0a880', fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Close hint
        this.add.text(cx, cy + panelH / 2 - 14, '[ESC/E] Lukk', {
            fontSize: '11px', color: '#6a5a40', fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Close button
        const closeBtn = this.add.text(cx + panelW / 2 - 20, cy - panelH / 2 + 18, '✕', {
            fontSize: '20px', color: '#8a7a5a', fontFamily: 'monospace'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        closeBtn.on('pointerover', () => closeBtn.setColor('#ff6666'));
        closeBtn.on('pointerout',  () => closeBtn.setColor('#8a7a5a'));
        closeBtn.on('pointerdown', () => this._close());

        this._buildShop(cx, cy, panelW, panelH);
        this._updateGold();

        this._closed = false;
        this.input.keyboard.on('keydown-ESC',    this._close, this);
        this.input.keyboard.on('keydown-ESCAPE', this._close, this);
        this.input.keyboard.on('keydown-E',      this._close, this);
    }

    _buildShop(cx, cy, panelW, panelH) {
        for (const o of this._dyn) { if (o && o.destroy) o.destroy(); }
        this._dyn = [];

        const startY = cy - panelH / 2 + 75;
        const slotH  = 52;

        if (this.stock.length === 0) {
            this._d(this.add.text(cx, startY + 40, 'Ingen varer igjen!', {
                fontSize: '13px', color: '#445566', fontFamily: 'monospace'
            }).setOrigin(0.5));
            return;
        }

        this.stock.forEach((entry, i) => {
            const y = startY + i * slotH;
            this._makeShopSlot(cx, y, panelW - 60, entry, i);
        });
    }

    _makeShopSlot(cx, y, w, entry, idx) {
        const { item, price } = entry;
        const h = 44;

        const bg = this._d(this.add.rectangle(cx, y + h / 2, w, h, 0x0a0918)
            .setStrokeStyle(1, 0x223344));

        // Item icon
        const iconG = this._d(this.add.graphics());
        const ix = cx - w / 2 + 24;
        const iy = y + h / 2;
        const col = (item.rarityColor) || item.color || 0xffffff;
        iconG.fillStyle(col, 0.8);
        if (item.type === 'weapon') {
            if (item.subtype === 'bow') {
                iconG.lineStyle(2, col, 0.9);
                iconG.strokeCircle(ix, iy, 10);
            } else {
                iconG.fillRect(ix - 3, iy - 12, 6, 24);
                iconG.fillRect(ix - 8, iy - 2, 16, 4);
            }
        } else if (item.type === 'armor') {
            iconG.fillRoundedRect(ix - 10, iy - 10, 20, 20, 3);
        } else {
            iconG.fillCircle(ix, iy, 8);
            iconG.fillStyle(0xffffff, 0.3);
            iconG.fillCircle(ix - 3, iy - 3, 3);
        }

        // Item name (with rarity color)
        const rarDef = item.rarity ? RARITY_BY_ID[item.rarity] : null;
        const nameCol = (rarDef && item.rarity !== 'common') ? rarDef.textColor : '#ccddff';
        this._d(this.add.text(cx - w / 2 + 50, y + 6, item.name, {
            fontSize: '12px', color: nameCol, fontFamily: 'monospace'
        }));

        // Description
        this._d(this.add.text(cx - w / 2 + 50, y + 22, item.desc || '', {
            fontSize: '9px', color: '#667788', fontFamily: 'monospace'
        }));

        // Price
        const canAfford = this.hero.gold >= price;
        const priceCol = canAfford ? '#ffcc00' : '#ff4444';
        this._d(this.add.text(cx + w / 2 - 20, y + h / 2, `${price}g`, {
            fontSize: '13px', color: priceCol, fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(1, 0.5));

        // Buy button
        if (canAfford) {
            bg.setInteractive({ useHandCursor: true });
            bg.on('pointerover', () => bg.setFillStyle(0x1a2030));
            bg.on('pointerout',  () => bg.setFillStyle(0x0a0918));
            bg.on('pointerdown', () => this._buyItem(idx));
        }
    }

    _buyItem(idx) {
        const entry = this.stock[idx];
        if (!entry) return;
        const { item, price } = entry;

        if (this.hero.gold < price) {
            this._showMsg('Ikke nok gull!');
            return;
        }

        if (!this.hero.inventory.addItem(item)) {
            this._showMsg('Ryggsekken er full!');
            return;
        }

        this.hero.gold -= price;
        this.stock.splice(idx, 1);
        Audio.playPickup();
        this._showMsg(`Kjøpte ${item.name}!`);
        this._updateGold();

        const { width: W, height: H } = this.cameras.main;
        this._buildShop(W / 2, H / 2, 440, 380);
    }

    _showMsg(text) {
        this._msgText.setText(text);
        this.time.delayedCall(2000, () => {
            if (this._msgText) this._msgText.setText('');
        });
    }

    _updateGold() {
        this._goldText.setText(`Ditt gull: ${this.hero.gold}g`);
    }

    _d(obj) { this._dyn.push(obj); return obj; }

    _close() {
        if (this._closed) return;
        this._closed = true;
        this.input.keyboard.off('keydown-ESC',    this._close, this);
        this.input.keyboard.off('keydown-ESCAPE', this._close, this);
        this.input.keyboard.off('keydown-E',      this._close, this);
        this.scene.stop();
    }
}
