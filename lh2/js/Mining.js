// ─── Labyrint Hero 2 – Mining & timed actions ────────────────────────────────
// Handles the mine/chop loop: timed action with progress bar and pickaxe
// animation, then yields items into the inventory and grants geologi XP.
// Mineral identification is gated by geology level vs mineral tier.

const LH2Mining = {
    hero: null,
    player: null,

    _action: null, // { duration, elapsed, onComplete }

    init(hero, player) {
        this.hero = hero;
        this.player = player;
        this.progressEl = document.getElementById('action-progress');
        this.progressFill = document.getElementById('action-progress-fill');
    },

    isActive() {
        return !!this._action;
    },

    /** Display name for an ore node, honoring the identification gate. */
    nodeLabel(node) {
        if (node.isElement) {
            const elem = ELEMENTS[node.itemId];
            return node.isGas
                ? `Tapp gasslomme (${elem.name})`
                : `Utvinn gedigent ${elem.name}`;
        }
        if (node.isFuel) {
            const def = FUEL_DEFS[node.itemId];
            return `Utvinn ${def.name}`;
        }
        const def = MINERAL_DEFS[node.itemId];
        const name = this.hero.sciences.canIdentifyTier(def.tier)
            ? def.name
            : `ukjent mineral (Tier ${def.tier})`;
        return `Utvinn ${name}`;
    },

    /** Item display name honoring identification (used by toasts/UI too). */
    itemName(def) {
        if (def.type === 'mineral' && !this.hero.sciences.canIdentifyTier(def.tier)) {
            return `Ukjent mineral (T${def.tier})`;
        }
        return def.name;
    },

    mineNode(node) {
        if (this._action || node.charges <= 0) return;
        this._startAction(LH2.MINE_TIME_MS, () => this._finishMine(node));
    },

    chopTree() {
        if (this._action) return;
        this._startAction(LH2.CHOP_TIME_MS, () => {
            const wood = FUEL_DEFS.wood;
            let added = 0;
            for (let i = 0; i < 2; i++) {
                if (this.hero.inventory.addItem(wood)) added++;
            }
            if (added === 0) {
                EventBus.emit('lh2Toast', { text: 'Sekken er full!' });
                return;
            }
            EventBus.emit('lh2Toast', { text: `+${added} Tre` });
            EventBus.emit('lh2InventoryChanged');
        });
    },

    _finishMine(node) {
        // Direct element sources (gas pockets, native elements) bypass the
        // backpack and land straight in the element collection, like LH1's
        // gas pocket rooms.
        if (node.isElement) {
            const elem = ELEMENTS[node.itemId];
            this.hero.elementTracker.collect(node.itemId, 1);
            this.hero.elementTracker.discoverWithPopup(node.itemId);
            this._depleteCharge(node);
            this.hero.sciences.addXP('geologi', 8 * (elem.tier || 1));
            EventBus.emit('lh2Toast', { text: `+1 ${elem.name} (${elem.symbol})` });
            EventBus.emit('lh2InventoryChanged');
            return;
        }

        const def = node.isFuel ? FUEL_DEFS[node.itemId] : MINERAL_DEFS[node.itemId];

        if (!this.hero.inventory.addItem(def)) {
            EventBus.emit('lh2Toast', { text: 'Sekken er full!' });
            return;
        }

        // Track first finds for the mineral wiki (LH1 convention)
        if (!node.isFuel) this.hero.discoveredMinerals[def.id] = true;

        // "Effektiv utvinning" skill: chance of a second unit
        let amount = 1;
        if ((this.hero.miningDoubleChance || 0) > 0 && Math.random() < this.hero.miningDoubleChance) {
            if (this.hero.inventory.addItem(def)) amount = 2;
        }

        this._depleteCharge(node);

        // Geologi XP: 10 × tier per mined unit (fuel counts as tier 1)
        const tier = def.tier || 1;
        this.hero.sciences.addXP('geologi', 10 * tier * amount);

        EventBus.emit('lh2Toast', { text: `+${amount} ${this.itemName(def)}` });
        EventBus.emit('lh2InventoryChanged');
    },

    _depleteCharge(node) {
        const def = node.isElement ? ELEMENTS[node.itemId]
            : (MINERAL_DEFS[node.itemId] || FUEL_DEFS[node.itemId]);
        FX.burst(LH2Main.activeArea.group, node.pos, def.color || 0xffffff, 14, 4);
        node.charges--;
        if (node.charges <= 0) {
            node.respawnAt = Date.now() + LH2.NODE_RESPAWN_MS;
            OreDeposits.setDepleted(node, true);
        }
    },

    _startAction(duration, onComplete) {
        this._action = { duration, elapsed: 0, onComplete };
        this.player.mining = true;
        this.progressEl.classList.remove('hidden');
    },

    cancel() {
        if (!this._action) return;
        this._action = null;
        this.player.mining = false;
        this.progressEl.classList.add('hidden');
    },

    update(dt, playerMoving) {
        if (!this._action) return;

        // Walking away cancels the action
        if (playerMoving) {
            this.cancel();
            return;
        }

        this._action.elapsed += dt * 1000;
        const pct = Math.min(100, (this._action.elapsed / this._action.duration) * 100);
        this.progressFill.style.width = pct + '%';

        if (this._action.elapsed >= this._action.duration) {
            const done = this._action.onComplete;
            this.cancel();
            done();
        }
    },
};
