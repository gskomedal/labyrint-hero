// ─── Labyrint Hero – MerchantScene (Shop overlay) ────────────────────────────
// Full-screen overlay with Buy and Sell tabs. Buy items with gold; sell items
// from backpack for ~30% of buy price.

const MERCHANT_SELL_FRACTION = 0.30;

class MerchantScene extends Phaser.Scene {
    constructor() { super({ key: 'MerchantScene' }); }

    init(data) {
        this.gs    = data.gameScene;
        this.stock = data.stock || [];
        this._tab  = 'buy';   // 'buy' | 'sell'
    }

    create() {
        const { width: W, height: H } = this.cameras.main;
        this.hero = this.gs.hero;
        this._dyn = [];

        const cx = W / 2, cy = H / 2;
        const panelW = 580, panelH = 460;
        this._panelW = panelW;
        this._panelH = panelH;
        this._cx = cx; this._cy = cy;

        // Background
        this.add.rectangle(cx, cy, W, H, 0x000000, 0.78);
        this.add.rectangle(cx, cy, panelW, panelH, 0x0d0b1e).setStrokeStyle(2, 0x2244aa);

        // Title
        this.add.text(cx, cy - panelH / 2 + 18, 'HANDELSMANN', {
            fontSize: '20px', color: '#4488ff', fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.rectangle(cx, cy - panelH / 2 + 38, panelW - 40, 1, 0x223344);

        // Gold display
        this._goldText = this.add.text(cx, cy - panelH / 2 + 50, '', {
            fontSize: '15px', color: '#ffcc00', fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Tab buttons (Buy / Sell)
        this._buyTab = this.add.text(cx - 50, cy - panelH / 2 + 72, '[ Kjøp ]', {
            fontSize: '14px', color: '#4488ff', fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        this._sellTab = this.add.text(cx + 50, cy - panelH / 2 + 72, '[ Selg ]', {
            fontSize: '14px', color: '#667788', fontFamily: 'monospace'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        this._buyTab.on('pointerdown', () => this._setTab('buy'));
        this._sellTab.on('pointerdown', () => this._setTab('sell'));

        // Message area
        this._msgText = this.add.text(cx, cy + panelH / 2 - 40, '', {
            fontSize: '13px', color: '#88bbff', fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Close hint
        this.add.text(cx, cy + panelH / 2 - 14, '[ESC/E] Lukk', {
            fontSize: '13px', color: '#334455', fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Close button (touch-friendly)
        UIHelper.makeCloseButton(this, cx + panelW / 2 - 22, cy - panelH / 2 + 22, () => this._close());

        this._refresh();
        this._updateGold();

        this._closed = false;
        this.input.keyboard.on('keydown-ESC',    this._close, this);
        this.input.keyboard.on('keydown-ESCAPE', this._close, this);
        this.input.keyboard.on('keydown-E',      this._close, this);
    }

    _setTab(tab) {
        if (this._tab === tab) return;
        this._tab = tab;
        this._buyTab.setColor(tab === 'buy' ? '#4488ff' : '#667788')
            .setFontStyle(tab === 'buy' ? 'bold' : 'normal');
        this._sellTab.setColor(tab === 'sell' ? '#4488ff' : '#667788')
            .setFontStyle(tab === 'sell' ? 'bold' : 'normal');
        this._refresh();
    }

    _refresh() {
        for (const o of this._dyn) { if (o && o.destroy) o.destroy(); }
        this._dyn = [];
        if (this._tab === 'buy') this._buildShop();
        else                     this._buildSell();
    }

    _buildShop() {
        const { _cx: cx, _cy: cy, _panelW: panelW, _panelH: panelH } = this;
        const startY = cy - panelH / 2 + 95;
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

    _buildSell() {
        const { _cx: cx, _cy: cy, _panelW: panelW, _panelH: panelH } = this;
        const startY = cy - panelH / 2 + 95;
        const slotH  = 48;
        const bp = this.hero.inventory.backpack;

        // Build sellable list — skip empty slots, keys (player needs them), tools
        const sellable = [];
        for (let i = 0; i < bp.length; i++) {
            const entry = bp[i];
            if (!entry) continue;
            const def = this.hero.inventory._getItemDef(entry);
            if (!def) continue;
            if (def.id === 'key' || def.id === 'pickaxe') continue;   // tools too important
            const price = this._sellPrice(def);
            const count = this.hero.inventory._getCount(entry);
            sellable.push({ slot: i, def, count, price });
        }

        if (sellable.length === 0) {
            this._d(this.add.text(cx, startY + 40, 'Ingen ting i ryggsekken å selge.', {
                fontSize: '13px', color: '#445566', fontFamily: 'monospace'
            }).setOrigin(0.5));
            return;
        }

        sellable.forEach((entry, i) => {
            const y = startY + i * slotH;
            this._makeSellSlot(cx, y, panelW - 60, entry);
        });
    }

    _sellPrice(item) {
        // Mirror the buy-price logic so sell price is a fraction of what it would cost.
        if (!this.gs || !this.gs.itemSpawner) return 1;
        const buyPrice = this.gs.itemSpawner._itemPrice(item, this.gs.worldNum || 1);
        return Math.max(1, Math.round(buyPrice * MERCHANT_SELL_FRACTION));
    }

    _makeShopSlot(cx, y, w, entry, idx) {
        const { item, price } = entry;
        const h = 44;

        const bg = this._d(this.add.rectangle(cx, y + h / 2, w, h, 0x0a0918)
            .setStrokeStyle(1, 0x223344));

        this._drawItemIcon(item, cx - w / 2 + 24, y + h / 2);

        // Item name (with rarity color) – truncate to fit slot
        const rarDef = item.rarity ? RARITY_BY_ID[item.rarity] : null;
        const nameCol = (rarDef && item.rarity !== 'common') ? rarDef.textColor : '#ccddff';
        const dispName = item.name.length > 30 ? item.name.slice(0, 29) + '…' : item.name;
        this._d(this.add.text(cx - w / 2 + 50, y + 6, dispName, {
            fontSize: '12px', color: nameCol, fontFamily: 'monospace'
        }));

        this._d(this.add.text(cx - w / 2 + 50, y + 22, item.desc || '', {
            fontSize: '11px', color: '#667788', fontFamily: 'monospace',
            wordWrap: { width: w - 100 }
        }));

        const canAfford = this.hero.gold >= price;
        const priceCol = canAfford ? '#ffcc00' : '#ff4444';
        this._d(this.add.text(cx + w / 2 - 20, y + h / 2, `${price}g`, {
            fontSize: '13px', color: priceCol, fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(1, 0.5));

        if (canAfford) {
            bg.setInteractive({ useHandCursor: true });
            bg.on('pointerover', () => bg.setFillStyle(0x1a2030));
            bg.on('pointerout',  () => bg.setFillStyle(0x0a0918));
            bg.on('pointerdown', () => this._buyItem(idx));
        }
    }

    _makeSellSlot(cx, y, w, entry) {
        const { def, count, price, slot } = entry;
        const h = 42;
        const bg = this._d(this.add.rectangle(cx, y + h / 2, w, h, 0x0a1218)
            .setStrokeStyle(1, 0x224433));

        this._drawItemIcon(def, cx - w / 2 + 24, y + h / 2);

        const rarDef = def.rarity ? RARITY_BY_ID[def.rarity] : null;
        const nameCol = (rarDef && def.rarity !== 'common') ? rarDef.textColor : '#ccddff';
        const countSuffix = count > 1 ? ` ×${count}` : '';
        const dispName = (def.name || '???') + countSuffix;
        this._d(this.add.text(cx - w / 2 + 50, y + 6, dispName.length > 36 ? dispName.slice(0,35)+'…' : dispName, {
            fontSize: '12px', color: nameCol, fontFamily: 'monospace'
        }));
        this._d(this.add.text(cx - w / 2 + 50, y + 22, def.desc || '', {
            fontSize: '10px', color: '#557766', fontFamily: 'monospace',
            wordWrap: { width: w - 100 }
        }));

        this._d(this.add.text(cx + w / 2 - 20, y + h / 2, `+${price}g`, {
            fontSize: '13px', color: '#88ee88', fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(1, 0.5));

        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerover', () => bg.setFillStyle(0x1a2820));
        bg.on('pointerout',  () => bg.setFillStyle(0x0a1218));
        bg.on('pointerdown', () => this._sellItem(slot, def, price));
    }

    _drawItemIcon(item, ix, iy) {
        const iconG = this._d(this.add.graphics());
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
        this._refresh();
    }

    _sellItem(slotIndex, def, price) {
        const dropped = this.hero.inventory.dropSlot(slotIndex);
        if (!dropped) return;
        this.hero.gold += price;
        Audio.playPickup();
        this._showMsg(`Solgte ${def.name} for ${price}g`);
        this._updateGold();
        this._refresh();
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
