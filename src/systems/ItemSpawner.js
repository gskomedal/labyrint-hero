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

        // 3. Pet egg (one per world, if hero has no pet or pet is dead)
        if (!scene.pet || !scene.pet.alive) {
            // Clear dead pet so a new one can be hatched
            if (scene.pet && !scene.pet.alive) scene.pet = null;
            const eggChance = scene.worldNum === 1 ? 0.8 : 0.35;
            if (Math.random() < eggChance) {
                // Find a free floor tile not used by chests or items
                const eggTile = eligible.find(t =>
                    !scene.chests.some(c => c.gridX === t.x && c.gridY === t.y) &&
                    !scene.itemObjects.some(o => o.gridX === t.x && o.gridY === t.y)
                );
                if (eggTile) this.spawnPetEgg(eggTile.x, eggTile.y);
            }
        }

        // 4. Minerals (Elements mod)
        this.placeMinerals(eligible);

        // 5. Fuel items (Elements mod Phase 2)
        this.placeFuel(eligible);

        // 6. Hidden spike traps
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
        ItemGraphics.drawWorldIcon(g, px, py, s, item);
    }

    // ── Mineral spawning (Elements mod) ─────────────────────────────────────

    // ── Fuel spawning (Elements mod Phase 2) ────────────────────────────────

    placeFuel(eligible) {
        if (typeof FUEL_DEFS === 'undefined') return;
        const scene = this.scene;
        const wn = scene.worldNum;
        // 1-3 fuel per level, more in later worlds
        const fuelCount = 1 + Math.floor(Math.random() * 2) + (wn >= 3 ? 1 : 0);
        let placed = 0;

        for (const t of eligible) {
            if (placed >= fuelCount) break;
            if (scene.chests.some(c => c.gridX === t.x && c.gridY === t.y)) continue;
            if (scene.itemObjects.some(o => o.gridX === t.x && o.gridY === t.y)) continue;

            // Wood in all worlds, coal from world 3+
            const fuelId = (wn >= 3 && Math.random() < 0.5) ? 'coal' : 'wood';
            const fuelDef = FUEL_DEFS[fuelId];
            this._spawnFuelAt(t.x, t.y, fuelDef);
            placed++;
        }
    }

    _spawnFuelAt(gx, gy, fuelDef) {
        if (!fuelDef) return;
        const scene = this.scene;
        if (scene.itemObjects.some(o => o.gridX === gx && o.gridY === gy)) return;

        const g = scene.add.graphics();
        g.setDepth(2);
        const px = gx * TILE_SIZE, py = gy * TILE_SIZE, s = TILE_SIZE;
        const cx = px + s / 2, cy = py + s / 2;

        if (fuelDef.id === 'coal') {
            // Dark lump
            g.fillStyle(0x222222, 0.85);
            g.fillCircle(cx - 2, cy + 2, 5);
            g.fillCircle(cx + 3, cy - 1, 4);
            g.fillStyle(0x111111, 0.6);
            g.fillCircle(cx, cy, 3);
        } else {
            // Wood log
            g.fillStyle(0x886633, 0.85);
            g.fillRoundedRect(cx - 7, cy - 3, 14, 6, 2);
            g.fillStyle(0x664422, 0.7);
            g.fillCircle(cx - 7, cy, 3);
            g.fillCircle(cx + 7, cy, 3);
            g.fillStyle(0xaa8844, 0.3);
            g.fillRect(cx - 5, cy - 2, 10, 1);
        }

        scene.itemObjects.push({ gridX: gx, gridY: gy, item: fuelDef, graphic: g, isFuel: true });
    }

    // ── Mineral spawning (Elements mod) ─────────────────────────────────────

    placeMinerals(eligible) {
        if (typeof MINERAL_DEFS === 'undefined') return;
        const scene = this.scene;
        const wn = scene.worldNum;
        const mineralCount = 2 + Math.floor(wn * 0.5);

        // Special room concentrated minerals
        const gen = scene._gen;
        if (gen && gen.specialRooms) {
            for (const room of gen.specialRooms) {
                // Determine mineral count and type per room
                let roomMinerals = 0;
                let mineralFn = () => rollMineralForWorld(wn);
                if (room.type === 'quarry') {
                    roomMinerals = 3 + Math.floor(Math.random() * 3);
                    mineralFn = () => rollMineralForWorld(Math.max(1, wn));
                } else if (room.type === 'crystal_cave') {
                    roomMinerals = 2 + Math.floor(Math.random() * 3);
                    mineralFn = () => this._rollCrystalForWorld(wn);
                } else if (room.type === 'ore_chamber') {
                    roomMinerals = 4 + Math.floor(Math.random() * 3);
                    mineralFn = () => rollMineralForWorld(Math.max(3, wn));
                } else if (room.type === 'hydrothermal') {
                    roomMinerals = 3 + Math.floor(Math.random() * 2);
                    mineralFn = () => rollMineralForWorld(Math.max(5, wn)); // T4+ minerals
                } else if (room.type === 'magma_chamber') {
                    roomMinerals = 3 + Math.floor(Math.random() * 3);
                    mineralFn = () => rollBossMineral(wn); // T5-T6 minerals
                } else if (room.type === 'gas_pocket') {
                    // Gas pockets spawn extra fuel instead of minerals
                    roomMinerals = 0;
                    for (const tile of room.tiles) {
                        if (!scene.itemObjects.some(o => o.gridX === tile.x && o.gridY === tile.y)) {
                            this._spawnFuelAt(tile.x, tile.y, FUEL_DEFS.coal);
                        }
                    }
                } else {
                    continue; // camp_room and chem_lab don't spawn minerals
                }
                for (let i = 0; i < roomMinerals && room.tiles.length > 0; i++) {
                    const tIdx = Math.floor(Math.random() * room.tiles.length);
                    const tile = room.tiles[tIdx];
                    if (scene.itemObjects.some(o => o.gridX === tile.x && o.gridY === tile.y)) continue;
                    if (scene.chests.some(c => c.gridX === tile.x && c.gridY === tile.y)) continue;
                    this.spawnMineralAt(tile.x, tile.y, mineralFn());
                }
            }
        }

        // Scatter minerals on regular floor tiles
        let placed = 0;
        for (const t of eligible) {
            if (placed >= mineralCount) break;
            if (scene.chests.some(c => c.gridX === t.x && c.gridY === t.y)) continue;
            if (scene.itemObjects.some(o => o.gridX === t.x && o.gridY === t.y)) continue;
            const mineralDef = rollMineralForWorld(wn);
            this.spawnMineralAt(t.x, t.y, mineralDef);
            placed++;
        }

        // Guaranteed rare mineral if hero has master_prospector skill
        if (scene.hero && scene.hero.guaranteedRareMineral && placed > 0) {
            const rareTier = Math.max(4, Math.ceil(wn / 2) + 2);
            const pool = MINERAL_POOL[Math.min(rareTier, 6)] || MINERAL_POOL[4];
            const rareId = pool[Math.floor(Math.random() * pool.length)];
            const rareDef = MINERAL_DEFS[rareId];
            // Place on a random remaining eligible tile
            for (const t of eligible) {
                if (scene.itemObjects.some(o => o.gridX === t.x && o.gridY === t.y)) continue;
                if (scene.chests.some(c => c.gridX === t.x && c.gridY === t.y)) continue;
                this.spawnMineralAt(t.x, t.y, rareDef);
                break;
            }
        }
    }

    _rollCrystalForWorld(worldNum) {
        const tier = rollMineralTier(worldNum);
        for (let t = tier; t >= 1; t--) {
            if (CRYSTAL_POOL[t] && CRYSTAL_POOL[t].length > 0) {
                const id = CRYSTAL_POOL[t][Math.floor(Math.random() * CRYSTAL_POOL[t].length)];
                return MINERAL_DEFS[id];
            }
        }
        return MINERAL_DEFS.clear_quartz;
    }

    spawnMineralAt(gx, gy, mineralDef) {
        if (!mineralDef) return;
        const scene = this.scene;
        if (scene.itemObjects.some(o => o.gridX === gx && o.gridY === gy)) return;

        const g  = scene.add.graphics();
        g.setDepth(2);
        const px = gx * TILE_SIZE, py = gy * TILE_SIZE, s = TILE_SIZE;
        const cx = px + s / 2, cy = py + s / 2;

        // Tier glow background
        const tierColor = (typeof MINERAL_TIER_COLORS !== 'undefined')
            ? MINERAL_TIER_COLORS[mineralDef.tier] || 0x888888
            : 0x888888;
        if (mineralDef.tier >= 3) {
            g.fillStyle(tierColor, 0.15);
            g.fillCircle(cx, cy, s / 2.5);
        }

        if (mineralDef.subtype === 'crystal') {
            this._drawCrystalIcon(g, px, py, s, mineralDef);
        } else {
            this._drawOreIcon(g, px, py, s, mineralDef);
        }

        scene.itemObjects.push({ gridX: gx, gridY: gy, item: mineralDef, graphic: g, isMineral: true });
    }

    _drawOreIcon(g, px, py, s, mineral) {
        ItemGraphics.drawOreIcon(g, px, py, s, mineral);
    }

    _drawCrystalIcon(g, px, py, s, crystal) {
        ItemGraphics.drawCrystalIcon(g, px, py, s, crystal);
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
                // Try hero backpack first, then pet backpack as overflow
                let picked = scene.hero.inventory.addItem(obj.item);
                let toPet = false;
                if (!picked && scene.pet && scene.pet.alive) {
                    picked = scene.pet.addItem(obj.item);
                    toPet = true;
                }
                if (picked) {
                    Audio.playPickup();
                    obj.graphic.destroy();
                    scene.itemObjects.splice(i, 1);

                    // Element discovery for minerals
                    if (obj.isMineral && obj.item.yields && scene.hero.elementTracker) {
                        // Unlock geologist path on first mineral pickup
                        if (!scene.hero.geologistUnlocked) {
                            scene.hero.geologistUnlocked = true;
                            scene._floatingText(hx, hy - 1, 'Geolog-stien er ulåst!', '#997755');
                        }
                        // Only discover/identify elements if hero has Geologist skill
                        const canIdentify = (scene.hero.mineralIdentifyLevel || 0) > 0;
                        if (canIdentify) {
                            for (const y of obj.item.yields) {
                                const isNew = scene.hero.elementTracker.discover(y.symbol);
                                if (isNew && typeof ELEMENTS !== 'undefined') {
                                    const elem = ELEMENTS[y.symbol];
                                    if (elem) {
                                        const hexCol = '#' + elem.color.toString(16).padStart(6, '0');
                                        scene._floatingText(hx, hy, `${elem.symbol} (${elem.name}) oppdaget!`, hexCol);
                                    }
                                }
                            }
                        } else {
                            scene._floatingText(hx, hy, 'Ukjent mineral – lær Geolog!', '#776655');
                        }
                        // Check for completion bonuses
                        const newBonuses = scene.hero.elementTracker.checkCompletions();
                        for (const bonus of newBonuses) {
                            scene._floatingText(hx, hy, `${bonus.name} fullført! ${bonus.desc}`, '#ffcc00');
                        }
                    }

                    const rarDef = obj.item.rarity ? RARITY_BY_ID[obj.item.rarity] : null;
                    const tierColor = obj.isMineral && typeof MINERAL_TIER_COLORS !== 'undefined'
                        ? '#' + (MINERAL_TIER_COLORS[obj.item.tier] || 0xffee88).toString(16).padStart(6, '0')
                        : null;
                    const pickupColor = tierColor
                        || ((rarDef && obj.item.rarity !== 'common') ? rarDef.textColor : '#ffee88');
                    const suffix = toPet ? ` (${scene.pet.petName})` : '';
                    scene._floatingText(hx, hy, `+ ${obj.item.name}${suffix}`, pickupColor);
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
