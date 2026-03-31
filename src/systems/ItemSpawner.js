// ─── Labyrint Hero – ItemSpawner ─────────────────────────────────────────────
// Handles chest placement, tool placement, item spawning/pickup, and merchant.

class ItemSpawner {
    constructor(scene) {
        this.scene = scene;
    }

    // ── Item placement: chests + tools only (loot comes from monster kills) ────

    placeItems() {
        const scene = this.scene;
        const gen      = scene._gen;
        const eligible = gen.getFloorTiles().filter(({ x, y }) =>
            Math.abs(x - 1) + Math.abs(y - 1) > 6 &&
            !(x === scene.exitX && y === scene.exitY)
        );
        MazeGenerator.shuffle(eligible);

        // 1. Treasure chests (2-3 per world, prefer dead-end spots)
        const chestCount = scene.worldNum <= 2 ? 2 : 3;
        this._placeChests(eligible, chestCount);

        // 2. Tools: keys for doors, pickaxes for cracked walls
        const toolStart  = chestCount;
        this._placeTools(eligible, Math.min(toolStart, eligible.length));

        // 3. Pet egg (one per world, only if hero has no pet)
        if (!scene.pet) {
            const eggChance = scene.worldNum === 1 ? 0.8 : 0.35;
            if (Math.random() < eggChance) {
                const idx = chestCount + 2;
                if (idx < eligible.length) {
                    this.spawnPetEgg(eligible[idx].x, eligible[idx].y);
                }
            }
        }

        // 4. Hidden spike traps
        const mods = scene._diffMods();
        const baseTrapCount = scene.difficulty === 'easy' && scene.worldNum <= 1
            ? 0
            : Math.min(3 + Math.floor(scene.worldNum * 0.8), 8);
        const trapCount = baseTrapCount + mods.trapCount;
        let trapPlaced  = 0;
        for (const t of eligible) {
            if (trapPlaced >= trapCount) break;
            if (scene.chests.some(c => c.gridX === t.x && c.gridY === t.y)) continue;
            if (scene.itemObjects.some(o => o.gridX === t.x && o.gridY === t.y)) continue;
            scene.maze[t.y][t.x] = TILE.TRAP;
            trapPlaced++;
        }
        if (trapPlaced) scene.mapRenderer.drawMap();
    }

    _placeChests(eligible, count) {
        const scene = this.scene;
        const scored = eligible.map(t => {
            let openNeighbours = 0;
            for (const [dx, dy] of [[0,-1],[0,1],[-1,0],[1,0]]) {
                const nx = t.x + dx, ny = t.y + dy;
                if (nx >= 0 && nx < scene.tileW && ny >= 0 && ny < scene.tileH) {
                    const tt = scene.maze[ny][nx];
                    if (tt === TILE.FLOOR || tt === TILE.SECRET || tt === TILE.EXIT) openNeighbours++;
                }
            }
            return { ...t, score: openNeighbours };
        }).sort((a, b) => a.score - b.score);

        for (let i = 0; i < Math.min(count, scored.length); i++) {
            this.spawnChest(scored[i].x, scored[i].y);
        }
    }

    spawnChest(gx, gy) {
        const scene = this.scene;
        if (scene.chests.some(c => c.gridX === gx && c.gridY === gy)) return;
        if (scene.itemObjects.some(o => o.gridX === gx && o.gridY === gy)) return;

        const g  = scene.add.graphics();
        g.setDepth(2);
        const px = gx * TILE_SIZE, py = gy * TILE_SIZE, s = TILE_SIZE;

        g.fillStyle(0x6a3a10, 1);
        g.fillRoundedRect(px + 4, py + 10, s - 8, s - 16, 2);
        g.fillStyle(0x8a4a18, 1);
        g.fillRoundedRect(px + 4, py + 8, s - 8, 10, 3);
        g.fillStyle(0xffcc22, 1);
        g.fillRect(px + s / 2 - 3, py + 15, 6, 5);
        g.fillCircle(px + s / 2, py + 17, 2);
        g.fillStyle(0xaa8822, 1);
        g.fillRect(px + 4, py + 17, s - 8, 2);
        g.fillStyle(0xffcc22, 1);
        g.fillCircle(px + 7,     py + 12, 2);
        g.fillCircle(px + s - 7, py + 12, 2);
        g.fillCircle(px + 7,     py + s - 10, 2);
        g.fillCircle(px + s - 7, py + s - 10, 2);
        g.fillStyle(0xffee88, 0.12);
        g.fillRoundedRect(px + 2, py + 6, s - 4, s - 8, 3);

        scene.chests.push({ gridX: gx, gridY: gy, graphic: g, opened: false });
    }

    checkChestPickup() {
        const scene = this.scene;
        const hx = scene.hero.gridX, hy = scene.hero.gridY;
        for (const chest of scene.chests) {
            if (chest.opened || chest.gridX !== hx || chest.gridY !== hy) continue;
            chest.opened = true;

            scene.tweens.add({
                targets: chest.graphic, alpha: 0, duration: 400,
                onComplete: () => chest.graphic.destroy()
            });

            const chestGold = GOLD_CHEST_BASE + Math.floor(Math.random() * 10) + scene.worldNum * 5;
            scene.hero.gold += chestGold;

            const item1 = Math.random() < 0.5
                ? randomItemByType(scene.worldNum, 'weapon', new Set())
                : randomItemByType(scene.worldNum, 'armor',  new Set());
            const item2 = randomItemByType(scene.worldNum, 'consumable', new Set())
                || randomItemForWorld(scene.worldNum);

            let givenCount = 0;
            for (const item of [item1, item2]) {
                if (!item) continue;
                if (scene.hero.inventory.addItem(item)) {
                    givenCount++;
                } else {
                    this.spawnItemAt(hx, hy, item);
                }
            }
            Audio.playPickup();
            const bestItem = [item1, item2].filter(Boolean).reduce((best, it) => {
                if (!best) return it;
                const bIdx = RARITIES.findIndex(r => r.id === (best.rarity || 'common'));
                const iIdx = RARITIES.findIndex(r => r.id === (it.rarity || 'common'));
                return iIdx > bIdx ? it : best;
            }, null);
            const chestColor = (bestItem && bestItem.rarity && bestItem.rarity !== 'common')
                ? RARITY_BY_ID[bestItem.rarity].textColor : '#ffcc44';
            scene._floatingText(hx, hy, `📦 +${chestGold}g, ${givenCount} gjenstander`, chestColor);
        }
    }

    _placeTools(eligible, startIdx) {
        const scene = this.scene;
        const doorCount    = scene._gen.countTile(TILE.DOOR);
        const crackedCount = scene._gen.countTile(TILE.CRACKED_WALL);

        const keyCount  = Math.min(doorCount, 2);
        const pickCount = crackedCount > 0 ? Math.min(Math.ceil(crackedCount / 3), 2) : 0;

        let idx = startIdx;
        for (let i = 0; i < keyCount && idx < eligible.length; i++, idx++) {
            this.spawnItemAt(eligible[idx].x, eligible[idx].y, ITEM_DEFS.key);
        }
        for (let i = 0; i < pickCount && idx < eligible.length; i++, idx++) {
            this.spawnItemAt(eligible[idx].x, eligible[idx].y, ITEM_DEFS.pickaxe);
        }
    }

    spawnItemAt(gx, gy, itemDef) {
        if (!itemDef) return;
        const scene = this.scene;
        if (scene.itemObjects.some(o => o.gridX === gx && o.gridY === gy)) return;

        const g  = scene.add.graphics();
        g.setDepth(2);
        const px = gx * TILE_SIZE, py = gy * TILE_SIZE, s = TILE_SIZE;

        const rarityDef = itemDef.rarity ? RARITY_BY_ID[itemDef.rarity] : null;
        if (rarityDef && itemDef.rarity !== 'common') {
            g.fillStyle(rarityDef.color, 0.25);
            g.fillRect(px, py, s, s);
            g.lineStyle(2, rarityDef.color, 0.7);
            g.strokeRect(px + 1, py + 1, s - 2, s - 2);
        }

        g.fillStyle(itemDef.color, 0.15);
        g.fillRect(px + 2, py + 2, s - 4, s - 4);
        g.fillStyle(itemDef.color, 0.9);

        this.drawItemGraphic(g, px, py, s, itemDef);

        scene.itemObjects.push({ gridX: gx, gridY: gy, item: itemDef, graphic: g });
    }

    /** Draw a unique procedural icon for an item at pixel position (px, py) */
    drawItemGraphic(g, px, py, s, item) {
        const cx = px + s / 2, cy = py + s / 2;
        const col = item.color;
        g.fillStyle(col, 0.9);

        if (item.id === 'key') {
            g.fillCircle(cx, cy - 4, 5);
            g.fillRect(cx - 1, cy + 1, 3, 9);
            g.fillRect(cx + 2, cy + 5, 4, 2);
            g.fillRect(cx + 2, cy + 8, 3, 2);
        } else if (item.id === 'pickaxe') {
            g.fillRect(cx - 1, py + 10, 3, s - 18);
            g.fillStyle(0x888888, 0.9);
            g.fillTriangle(cx - 8, py + 10, cx + 8, py + 10, cx, py + 6);
            g.fillStyle(col, 0.7);
            g.fillRect(cx - 1, py + 8, 3, 4);
        } else if (item.id === 'dagger') {
            g.fillRect(cx - 1, py + 6, 3, 14);
            g.fillStyle(0x665544, 0.9);
            g.fillRect(cx - 4, py + 18, 9, 3);
            g.fillStyle(0x886644, 0.9);
            g.fillRect(cx - 2, py + 21, 5, 6);
        } else if (item.id === 'wood_sword') {
            g.fillRect(cx - 2, py + 5, 4, 16);
            g.fillStyle(0x664422, 0.9);
            g.fillRect(cx - 5, py + 19, 10, 3);
            g.fillRect(cx - 2, py + 22, 4, 5);
        } else if (item.id === 'spear') {
            g.fillRect(cx - 1, py + 4, 3, 24);
            g.fillStyle(0xaaaacc, 0.9);
            g.fillTriangle(cx - 4, py + 8, cx + 4, py + 8, cx, py + 2);
        } else if (item.id === 'iron_sword') {
            g.fillStyle(0xaaaacc, 0.9);
            g.fillRect(cx - 2, py + 4, 4, 16);
            g.fillStyle(0x886644, 0.9);
            g.fillRect(cx - 5, py + 18, 11, 3);
            g.fillStyle(0x664422, 0.9);
            g.fillRect(cx - 2, py + 21, 5, 6);
        } else if (item.id === 'battle_axe') {
            g.fillStyle(0x886644, 0.9);
            g.fillRect(cx - 1, py + 4, 3, 22);
            g.fillStyle(col, 0.9);
            g.fillTriangle(cx - 8, py + 6, cx - 1, py + 6, cx - 1, py + 16);
            g.fillTriangle(cx + 8, py + 6, cx + 1, py + 6, cx + 1, py + 16);
        } else if (item.id === 'war_hammer') {
            g.fillStyle(0x886644, 0.9);
            g.fillRect(cx - 1, py + 10, 3, 18);
            g.fillStyle(col, 0.9);
            g.fillRoundedRect(cx - 7, py + 4, 14, 10, 2);
        } else if (item.id === 'magic_staff') {
            g.fillStyle(0x664422, 0.9);
            g.fillRect(cx - 1, py + 8, 3, 20);
            g.fillStyle(0xaa44ff, 0.8);
            g.fillCircle(cx, py + 8, 5);
            g.fillStyle(0xffffff, 0.4);
            g.fillCircle(cx - 1, py + 7, 2);
        } else if (item.subtype === 'bow') {
            g.lineStyle(3, col, 0.9);
            g.beginPath();
            g.arc(cx + 3, cy, 10, -1.8, 1.8, false);
            g.strokePath();
            g.lineStyle(1, 0xccaa66, 0.7);
            g.lineBetween(cx + 3, cy - 10, cx + 3, cy + 10);
        } else if (item.id === 'leather_armor') {
            g.fillStyle(0x886633, 0.9);
            g.fillRoundedRect(cx - 8, py + 6, 16, 18, 2);
            g.fillStyle(0x775522, 0.8);
            g.fillRect(cx - 6, py + 12, 12, 2);
        } else if (item.id === 'padded_vest') {
            g.fillStyle(0x998866, 0.9);
            g.fillRoundedRect(cx - 8, py + 6, 16, 18, 2);
            g.fillStyle(0x887755, 0.8);
            g.fillRect(cx - 6, py + 10, 12, 2);
            g.fillRect(cx - 6, py + 14, 12, 2);
            g.fillRect(cx - 6, py + 18, 12, 2);
        } else if (item.id === 'chain_mail') {
            g.fillStyle(0x8899aa, 0.9);
            g.fillRoundedRect(cx - 8, py + 6, 16, 18, 2);
            for (let r = 0; r < 4; r++) {
                for (let c = 0; c < 3; c++) {
                    g.fillStyle(0x667788, 0.6);
                    g.fillCircle(cx - 5 + c * 5, py + 10 + r * 4, 2);
                }
            }
        } else if (item.id === 'plate_armor') {
            g.fillStyle(0xccccdd, 0.9);
            g.fillRoundedRect(cx - 9, py + 5, 18, 20, 3);
            g.fillStyle(0xaaaacc, 0.7);
            g.fillRect(cx - 1, py + 6, 2, 18);
            g.fillRect(cx - 7, py + 13, 14, 2);
        } else if (item.id === 'robe_magic') {
            g.fillStyle(0x6633aa, 0.9);
            g.fillRoundedRect(cx - 9, py + 5, 18, 22, 3);
            g.fillStyle(0xaa66ff, 0.5);
            g.fillCircle(cx, py + 14, 4);
            g.fillStyle(0xffffff, 0.3);
            g.fillCircle(cx - 1, py + 13, 1);
        } else if (item.id === 'dragon_scale') {
            g.fillStyle(0xff6622, 0.9);
            g.fillRoundedRect(cx - 9, py + 5, 18, 20, 3);
            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 3; c++) {
                    g.fillStyle(0xcc4411, 0.7);
                    g.fillTriangle(cx - 6 + c * 5, py + 8 + r * 6, cx - 4 + c * 5, py + 12 + r * 6, cx - 8 + c * 5, py + 12 + r * 6);
                }
            }
        } else if (item.type === 'armor') {
            g.fillRoundedRect(cx - 8, py + 6, 16, 18, 3);
        } else if (item.id === 'health_pot' || item.id === 'big_health_pot') {
            g.fillStyle(col, 0.9);
            g.fillRoundedRect(cx - 5, py + 10, 10, 14, 3);
            g.fillRect(cx - 3, py + 7, 6, 5);
            g.fillStyle(0xffffff, 0.3);
            g.fillCircle(cx - 2, py + 14, 2);
        } else if (item.id === 'strength_brew' || item.id === 'defense_brew') {
            g.fillStyle(col, 0.9);
            g.fillRoundedRect(cx - 4, py + 12, 8, 12, 2);
            g.fillRect(cx - 3, py + 8, 6, 5);
            g.fillStyle(0xffffff, 0.25);
            g.fillRect(cx - 1, py + 14, 2, 6);
        } else if (item.id === 'antidote' || item.id === 'frost_salve' || item.id === 'burn_salve') {
            g.fillStyle(col, 0.9);
            g.fillRoundedRect(cx - 5, py + 10, 10, 14, 3);
            g.fillRect(cx - 3, py + 7, 6, 5);
            g.fillStyle(0xffffff, 0.2);
            g.fillRect(cx - 3, py + 12, 1, 8);
        } else if (item.id === 'bomb') {
            g.fillStyle(0x333333, 0.9);
            g.fillCircle(cx, cy + 2, 8);
            g.fillStyle(0x111111, 0.9);
            g.fillCircle(cx, cy + 2, 5);
            g.fillStyle(0xff6600, 0.8);
            g.fillRect(cx - 1, py + 6, 2, 6);
            g.fillCircle(cx, py + 5, 3);
        } else if (item.id === 'flashbang') {
            g.fillStyle(col, 0.9);
            g.fillCircle(cx, cy, 7);
            g.fillStyle(0xffffff, 0.6);
            g.fillCircle(cx, cy, 4);
            g.fillStyle(0xffffff, 0.9);
            g.fillCircle(cx - 1, cy - 1, 2);
        } else if (item.id === 'xp_scroll' || item.id === 'map_scroll') {
            g.fillStyle(col, 0.9);
            g.fillRoundedRect(cx - 6, py + 8, 12, 18, 2);
            g.fillStyle(col, 1);
            g.fillCircle(cx - 6, py + 8, 3);
            g.fillCircle(cx + 6, py + 8, 3);
            g.fillCircle(cx - 6, py + 26, 3);
            g.fillCircle(cx + 6, py + 26, 3);
            g.fillStyle(0x000000, 0.3);
            g.fillRect(cx - 3, py + 13, 6, 1);
            g.fillRect(cx - 3, py + 16, 6, 1);
            g.fillRect(cx - 3, py + 19, 4, 1);
        } else if (item.id === 'heart_crystal') {
            g.fillStyle(col, 0.9);
            g.fillTriangle(cx, py + 26, cx - 9, py + 14, cx + 9, py + 14);
            g.fillCircle(cx - 5, py + 12, 5);
            g.fillCircle(cx + 5, py + 12, 5);
            g.fillStyle(0xffffff, 0.3);
            g.fillCircle(cx - 3, py + 11, 2);
        } else if (item.type === 'consumable') {
            g.fillCircle(cx, cy, s / 4.5);
            g.fillStyle(0xffffff, 0.3);
            g.fillCircle(cx - 3, cy - 3, s / 10);
        } else {
            g.fillRoundedRect(px + 6, py + 6, s - 12, s - 12, 4);
        }
    }

    // ── Pet egg spawning ────────────────────────────────────────────────────

    spawnPetEgg(gx, gy) {
        const scene = this.scene;
        if (scene.itemObjects.some(o => o.gridX === gx && o.gridY === gy)) return;

        const g  = scene.add.graphics();
        g.setDepth(2);
        const px = gx * TILE_SIZE, py = gy * TILE_SIZE, s = TILE_SIZE;

        // Glowing background
        g.fillStyle(0xffaadd, 0.2);
        g.fillCircle(px + s / 2, py + s / 2, s / 2);

        // Egg shape
        const cx = px + s / 2, cy = py + s / 2 + 2;
        g.fillStyle(0xffddee);
        g.fillEllipse(cx, cy, 8, 10);
        // Spots
        g.fillStyle(0xffaacc);
        g.fillCircle(cx - 3, cy - 3, 2);
        g.fillCircle(cx + 2, cy + 1, 2);
        g.fillCircle(cx - 1, cy + 4, 1);
        // Shine
        g.fillStyle(0xffffff, 0.5);
        g.fillCircle(cx - 2, cy - 5, 2);

        scene.itemObjects.push({ gridX: gx, gridY: gy, item: ITEM_DEFS.pet_egg, graphic: g, isPetEgg: true });
    }

    checkPetEggPickup() {
        const scene = this.scene;
        if (scene.pet) return;
        const hx = scene.hero.gridX, hy = scene.hero.gridY;
        for (let i = scene.itemObjects.length - 1; i >= 0; i--) {
            const obj = scene.itemObjects[i];
            if (!obj.isPetEgg || obj.gridX !== hx || obj.gridY !== hy) continue;

            Audio.playPickup();
            obj.graphic.destroy();
            scene.itemObjects.splice(i, 1);

            // Hatch a random pet
            const types = Object.keys(PET_TYPES);
            const typeId = types[Math.floor(Math.random() * types.length)];
            scene.pet = new Pet(scene, hx, hy, typeId);
            scene._floatingText(hx, hy, `🥚 ${scene.pet.petName} ble med deg!`, '#ffaadd');
            return;
        }
    }

    checkItemPickup() {
        const scene = this.scene;
        const hx = scene.hero.gridX, hy = scene.hero.gridY;
        for (let i = scene.itemObjects.length - 1; i >= 0; i--) {
            const obj = scene.itemObjects[i];
            if (obj.gridX === hx && obj.gridY === hy) {
                if (scene.hero.inventory.addItem(obj.item)) {
                    Audio.playPickup();
                    obj.graphic.destroy();
                    scene.itemObjects.splice(i, 1);
                    const rarDef = obj.item.rarity ? RARITY_BY_ID[obj.item.rarity] : null;
                    const pickupColor = (rarDef && obj.item.rarity !== 'common') ? rarDef.textColor : '#ffee88';
                    scene._floatingText(hx, hy, `+ ${obj.item.name}`, pickupColor);
                } else {
                    scene._showMessage('Ryggsekken er full! (Høyreklikk for å droppe)', '#ff8844');
                }
            }
        }
    }

    // ── Merchant NPC ─────────────────────────────────────────────────────────

    placeMerchant() {
        const scene = this.scene;
        const gen = scene._gen;
        const eligible = gen.getFloorTiles().filter(({ x, y }) => {
            if (Math.abs(x - 1) + Math.abs(y - 1) < 8) return false;
            if (x === scene.exitX && y === scene.exitY) return false;
            if (scene.chests.some(c => c.gridX === x && c.gridY === y)) return false;
            if (scene.itemObjects.some(o => o.gridX === x && o.gridY === y)) return false;
            return true;
        });
        if (eligible.length === 0) return;

        const midX = scene.tileW / 2, midY = scene.tileH / 2;
        eligible.sort((a, b) => {
            const da = Math.abs(a.x - midX) + Math.abs(a.y - midY);
            const db = Math.abs(b.x - midX) + Math.abs(b.y - midY);
            return da - db;
        });
        const pos = eligible[Math.floor(Math.random() * Math.min(5, eligible.length))];

        const g = scene.add.graphics();
        g.setDepth(4);
        const px = pos.x * TILE_SIZE, py = pos.y * TILE_SIZE, s = TILE_SIZE;

        g.fillStyle(0x2244aa, 1);
        g.fillRoundedRect(px + 6, py + 4, s - 12, s - 8, 3);
        g.fillStyle(0x1a338a, 1);
        g.fillRoundedRect(px + 8, py + 2, s - 16, 10, 4);
        g.fillStyle(0xffddbb, 1);
        g.fillCircle(px + s / 2, py + 8, 4);
        g.fillStyle(0x1a1028, 1);
        g.fillCircle(px + s / 2 - 2, py + 7, 1);
        g.fillCircle(px + s / 2 + 2, py + 7, 1);
        g.fillStyle(0xaa7722, 1);
        g.fillCircle(px + s / 2 + 6, py + s - 10, 5);
        g.fillStyle(0xffcc00, 1);
        g.fillCircle(px + s / 2 + 6, py + s - 10, 3);
        g.fillStyle(0xaa7700, 1);
        g.fillRect(px + s / 2 + 5, py + s - 14, 3, 3);
        g.fillStyle(0xffcc00, 0.08);
        g.fillCircle(px + s / 2, py + s / 2, s / 2);

        scene.merchant = { gridX: pos.x, gridY: pos.y, graphic: g };
        scene.merchant.stock = this._generateMerchantStock();
    }

    _generateMerchantStock() {
        const scene = this.scene;
        const stock = [];
        const wn = scene.worldNum;
        for (let i = 0; i < 2; i++) {
            const item = randomItemByType(wn, 'consumable', new Set());
            if (item) stock.push({ item, price: this._itemPrice(item, wn) });
        }
        const wpn = randomItemByType(wn, 'weapon', new Set());
        if (wpn) stock.push({ item: wpn, price: this._itemPrice(wpn, wn) });
        const arm = randomItemByType(wn, 'armor', new Set());
        if (arm) stock.push({ item: arm, price: this._itemPrice(arm, wn) });
        stock.push({ item: ITEM_DEFS.key, price: 10 + wn * 3 });
        return stock;
    }

    _itemPrice(item, worldNum) {
        let base = 20;
        if (item.type === 'consumable') base = 12;
        if (item.type === 'tool') base = 8;
        const tierMul = (item.tier || 1) * 10;
        const rarityMul = item.rarity ? (RARITIES.findIndex(r => r.id === item.rarity) + 1) : 1;
        return Math.round((base + tierMul) * rarityMul * MERCHANT_MARKUP + worldNum * 2);
    }

    checkMerchant() {
        const scene = this.scene;
        if (!scene.merchant) return;
        if (scene.hero.gridX !== scene.merchant.gridX || scene.hero.gridY !== scene.merchant.gridY) return;
        if (scene.scene.isActive('MerchantScene')) return;
        scene.scene.launch('MerchantScene', { gameScene: scene, stock: scene.merchant.stock });
    }
}
