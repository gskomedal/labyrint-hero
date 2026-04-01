// ─── Labyrint Hero – Pet Companion ────────────────────────────────────────────
// A companion that follows the hero, assists in combat, and persists across worlds.

const PET_TYPES = {
    fox:    { name: 'Rev',      color: 0xff8833, attack: 1, maxHp: 8,  desc: 'Rask og lojal' },
    cat:    { name: 'Katt',     color: 0xccaa66, attack: 1, maxHp: 6,  desc: 'Stille og presis' },
    dragon: { name: 'Drage',    color: 0xff4466, attack: 2, maxHp: 10, desc: 'Liten men farlig' },
    owl:    { name: 'Ugle',     color: 0x88aacc, attack: 1, maxHp: 6,  desc: 'Klok og skarpsynt' },
};

class Pet {
    constructor(scene, gridX, gridY, typeId) {
        this.scene  = scene;
        this.gridX  = gridX;
        this.gridY  = gridY;
        this.typeId = typeId;
        this.alive  = true;

        const def     = PET_TYPES[typeId];
        this.petName  = def.name;
        this.color    = def.color;
        this.maxHp    = def.maxHp;
        this.hp       = def.maxHp;
        this.attack   = def.attack;

        // Pet backpack (4 slots for carrying items)
        this.backpack = new Array(4).fill(null);

        this.graphics = scene.add.graphics();
        this.graphics.setDepth(4);
        this._draw();
    }

    // ── Drawing ───────────────────────────────────────────────────────────────

    _drawSprite() {
        const g = this.graphics;
        const s = TILE_SIZE;
        g.clear();

        switch (this.typeId) {
            case 'fox':    this._drawFox(g, s);    break;
            case 'cat':    this._drawCat(g, s);    break;
            case 'dragon': this._drawDragon(g, s); break;
            case 'owl':    this._drawOwl(g, s);    break;
            default:       this._drawFox(g, s);    break;
        }
    }

    _draw() {
        this.graphics.x = this.gridX * TILE_SIZE;
        this.graphics.y = this.gridY * TILE_SIZE;
        this._drawSprite();
    }

    // ── Fox ───────────────────────────────────────────────────────────────────
    _drawFox(g, s) {
        const cx = s >> 1;
        // Shadow
        g.fillStyle(0x000000, 0.2);
        g.fillEllipse(cx, 28, 12, 4);
        // Body
        g.fillStyle(0xff8833);
        g.fillRoundedRect(cx - 6, 16, 12, 10, 3);
        // Tail
        g.fillStyle(0xff6622);
        g.fillEllipse(cx + 8, 20, 5, 3);
        g.fillStyle(0xffffff);
        g.fillEllipse(cx + 11, 20, 3, 2);
        // Legs
        g.fillStyle(0xcc6622);
        g.fillRect(cx - 5, 24, 3, 5);
        g.fillRect(cx + 2, 24, 3, 5);
        // Paws
        g.fillStyle(0x331100);
        g.fillRect(cx - 5, 27, 3, 2);
        g.fillRect(cx + 2, 27, 3, 2);
        // Head
        g.fillStyle(0xff9944);
        g.fillRoundedRect(cx - 6, 8, 12, 10, 3);
        // Ears (triangles)
        g.fillStyle(0xff7722);
        g.fillTriangle(cx - 6, 10, cx - 3, 10, cx - 5, 3);
        g.fillTriangle(cx + 6, 10, cx + 3, 10, cx + 5, 3);
        // Inner ears
        g.fillStyle(0xffaa55);
        g.fillTriangle(cx - 5, 10, cx - 3, 10, cx - 4, 5);
        g.fillTriangle(cx + 5, 10, cx + 3, 10, cx + 4, 5);
        // Snout
        g.fillStyle(0xffffff);
        g.fillRoundedRect(cx - 3, 13, 6, 4, 2);
        // Nose
        g.fillStyle(0x111111);
        g.fillCircle(cx, 14, 2);
        // Eyes
        g.fillStyle(0x221100);
        g.fillCircle(cx - 3, 11, 2);
        g.fillCircle(cx + 3, 11, 2);
        g.fillStyle(0xffffff);
        g.fillCircle(cx - 4, 10, 1);
        g.fillCircle(cx + 2, 10, 1);
    }

    // ── Cat ───────────────────────────────────────────────────────────────────
    _drawCat(g, s) {
        const cx = s >> 1;
        g.fillStyle(0x000000, 0.2);
        g.fillEllipse(cx, 28, 10, 3);
        // Body
        g.fillStyle(0xccaa66);
        g.fillRoundedRect(cx - 5, 16, 10, 10, 3);
        // Tail (curving up)
        g.fillStyle(0xbb9955);
        g.fillRect(cx + 4, 14, 3, 8);
        g.fillRect(cx + 6, 12, 3, 4);
        // Legs
        g.fillStyle(0xaa8844);
        g.fillRect(cx - 4, 24, 3, 5);
        g.fillRect(cx + 1, 24, 3, 5);
        g.fillStyle(0x664422);
        g.fillRect(cx - 4, 27, 3, 2);
        g.fillRect(cx + 1, 27, 3, 2);
        // Head
        g.fillStyle(0xddbb77);
        g.fillRoundedRect(cx - 6, 7, 12, 11, 3);
        // Ears
        g.fillStyle(0xccaa66);
        g.fillTriangle(cx - 6, 9, cx - 3, 9, cx - 5, 2);
        g.fillTriangle(cx + 6, 9, cx + 3, 9, cx + 5, 2);
        g.fillStyle(0xffccaa);
        g.fillTriangle(cx - 5, 9, cx - 3, 9, cx - 4, 4);
        g.fillTriangle(cx + 5, 9, cx + 3, 9, cx + 4, 4);
        // Eyes (green, slit pupil)
        g.fillStyle(0x44cc44);
        g.fillRect(cx - 4, 10, 3, 3);
        g.fillRect(cx + 1, 10, 3, 3);
        g.fillStyle(0x111111);
        g.fillRect(cx - 3, 10, 1, 3);
        g.fillRect(cx + 2, 10, 1, 3);
        // Nose + mouth
        g.fillStyle(0xff8899);
        g.fillCircle(cx, 14, 1);
        // Whiskers
        g.lineStyle(1, 0xcccccc, 0.5);
        g.lineBetween(cx - 2, 15, cx - 8, 14);
        g.lineBetween(cx - 2, 16, cx - 8, 16);
        g.lineBetween(cx + 2, 15, cx + 8, 14);
        g.lineBetween(cx + 2, 16, cx + 8, 16);
    }

    // ── Dragon ────────────────────────────────────────────────────────────────
    _drawDragon(g, s) {
        const cx = s >> 1;
        g.fillStyle(0x000000, 0.25);
        g.fillEllipse(cx, 29, 14, 4);
        // Body
        g.fillStyle(0xff4466);
        g.fillRoundedRect(cx - 6, 14, 12, 12, 3);
        // Belly
        g.fillStyle(0xffaa66);
        g.fillRoundedRect(cx - 4, 17, 8, 7, 2);
        // Wings
        g.fillStyle(0xcc2244);
        g.fillTriangle(cx - 6, 16, cx - 14, 8, cx - 4, 12);
        g.fillTriangle(cx + 6, 16, cx + 14, 8, cx + 4, 12);
        // Legs
        g.fillStyle(0xcc3355);
        g.fillRect(cx - 5, 24, 3, 5);
        g.fillRect(cx + 2, 24, 3, 5);
        g.fillStyle(0x992233);
        g.fillRect(cx - 6, 27, 4, 2);
        g.fillRect(cx + 2, 27, 4, 2);
        // Tail
        g.fillStyle(0xee3355);
        g.fillRect(cx + 5, 20, 6, 3);
        g.fillTriangle(cx + 11, 18, cx + 11, 25, cx + 14, 21);
        // Head
        g.fillStyle(0xff5577);
        g.fillRoundedRect(cx - 5, 6, 10, 10, 3);
        // Horns
        g.fillStyle(0xffcc44);
        g.fillTriangle(cx - 4, 8, cx - 2, 8, cx - 4, 2);
        g.fillTriangle(cx + 4, 8, cx + 2, 8, cx + 4, 2);
        // Eyes
        g.fillStyle(0xffee00);
        g.fillRect(cx - 4, 9, 3, 3);
        g.fillRect(cx + 1, 9, 3, 3);
        g.fillStyle(0x220000);
        g.fillRect(cx - 3, 10, 1, 2);
        g.fillRect(cx + 2, 10, 1, 2);
        // Nostrils with tiny flame
        g.fillStyle(0xff8800);
        g.fillCircle(cx - 1, 14, 1);
        g.fillCircle(cx + 1, 14, 1);
    }

    // ── Owl ───────────────────────────────────────────────────────────────────
    _drawOwl(g, s) {
        const cx = s >> 1;
        g.fillStyle(0x000000, 0.2);
        g.fillEllipse(cx, 28, 10, 3);
        // Body
        g.fillStyle(0x88aacc);
        g.fillRoundedRect(cx - 6, 14, 12, 12, 4);
        // Chest
        g.fillStyle(0xccddee);
        g.fillRoundedRect(cx - 4, 17, 8, 7, 2);
        // Wings (folded)
        g.fillStyle(0x6688aa);
        g.fillRoundedRect(cx - 9, 15, 5, 10, 2);
        g.fillRoundedRect(cx + 4, 15, 5, 10, 2);
        // Feet
        g.fillStyle(0x886633);
        g.fillRect(cx - 4, 25, 3, 3);
        g.fillRect(cx + 1, 25, 3, 3);
        // Head (round)
        g.fillStyle(0x99bbdd);
        g.fillCircle(cx, 10, 7);
        // Ear tufts
        g.fillStyle(0x7799bb);
        g.fillTriangle(cx - 6, 6, cx - 3, 8, cx - 7, 1);
        g.fillTriangle(cx + 6, 6, cx + 3, 8, cx + 7, 1);
        // Face disc
        g.fillStyle(0xccddee);
        g.fillCircle(cx, 11, 5);
        // Big round eyes
        g.fillStyle(0xffcc00);
        g.fillCircle(cx - 3, 10, 3);
        g.fillCircle(cx + 3, 10, 3);
        g.fillStyle(0x111111);
        g.fillCircle(cx - 3, 10, 2);
        g.fillCircle(cx + 3, 10, 2);
        g.fillStyle(0xffffff);
        g.fillCircle(cx - 4, 9, 1);
        g.fillCircle(cx + 2, 9, 1);
        // Beak
        g.fillStyle(0xcc8822);
        g.fillTriangle(cx - 1, 13, cx + 1, 13, cx, 16);
    }

    // ── Movement ──────────────────────────────────────────────────────────────

    moveTo(gx, gy) {
        this.gridX = gx;
        this.gridY = gy;
        const tx = gx * TILE_SIZE;
        const ty = gy * TILE_SIZE;
        this.scene.tweens.killTweensOf(this.graphics);
        this.scene.tweens.add({
            targets:  this.graphics,
            x: tx, y: ty,
            duration: MOVE_ANIM_MS,
            ease:     'Sine.easeOut'
        });
    }

    // ── Follow AI ─────────────────────────────────────────────────────────────

    /** Move one step toward the hero if more than 1 tile away */
    followHero(hero, maze, tileW, tileH, monsters) {
        const dist = Math.abs(hero.gridX - this.gridX) + Math.abs(hero.gridY - this.gridY);
        if (dist <= 1) return;

        const ddx = hero.gridX - this.gridX;
        const ddy = hero.gridY - this.gridY;
        const dirs = Math.abs(ddx) >= Math.abs(ddy)
            ? [[Math.sign(ddx), 0], [0, Math.sign(ddy)]]
            : [[0, Math.sign(ddy)], [Math.sign(ddx), 0]];

        for (const [dx, dy] of dirs) {
            const nx = this.gridX + dx, ny = this.gridY + dy;
            if (nx < 0 || nx >= tileW || ny < 0 || ny >= tileH) continue;
            const t = maze[ny][nx];
            if (t === TILE.WALL || t === TILE.CRACKED_WALL || t === TILE.DOOR) continue;
            if (nx === hero.gridX && ny === hero.gridY) continue;
            if (monsters.some(m => m.alive && m.gridX === nx && m.gridY === ny)) continue;
            this.moveTo(nx, ny);
            return;
        }
    }

    // ── Effective stats (base + hero's pet bonuses) ─────────────────────────

    /** Get hero's pet skill bonuses */
    _heroBonuses() {
        const hero = this.scene.hero;
        if (!hero) return { atk: 0, hp: 0, def: 0 };
        return {
            atk: hero.petBonusAtk || 0,
            hp:  hero.petBonusHp  || 0,
            def: hero.petBonusDef || 0,
        };
    }

    get effectiveAttack() { return this.attack + this._heroBonuses().atk; }
    get effectiveMaxHp()  { return this.maxHp  + this._heroBonuses().hp; }
    get effectiveDef()    { return this._heroBonuses().def; }

    // ── Combat ────────────────────────────────────────────────────────────────

    /** Pet attacks an adjacent monster. Returns damage dealt or 0 */
    tryAttack(monsters) {
        for (const m of monsters) {
            if (!m.alive) continue;
            const d = Math.abs(m.gridX - this.gridX) + Math.abs(m.gridY - this.gridY);
            if (d === 1) {
                const dmg = Math.max(1, this.effectiveAttack + Math.floor(Math.random() * 2));
                return { monster: m, damage: dmg };
            }
        }
        return null;
    }

    takeDamage(amount) {
        const dmg = Math.max(1, amount - this.effectiveDef);
        this.hp -= dmg;
        if (this.hp <= 0) {
            this.hp    = 0;
            this.alive = false;
            this._playDeathAnimation();
            return true;
        }
        this._flashHit();
        return false;
    }

    _flashHit() {
        const fg = this.scene.add.graphics().setDepth(9);
        fg.fillStyle(0xff2200, 0.5);
        fg.fillRect(this.graphics.x + 2, this.graphics.y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        this.scene.tweens.add({
            targets: fg, alpha: 0, duration: 150,
            onComplete: () => { if (fg.scene) fg.destroy(); }
        });
    }

    _playDeathAnimation() {
        const g = this.graphics;
        if (!g || !g.scene) return;
        g.x += TILE_SIZE / 2;
        g.y += TILE_SIZE / 2;
        this.scene.tweens.add({
            targets: g, angle: 180, scaleX: 0, scaleY: 0, alpha: 0,
            duration: 400, ease: 'Back.easeIn',
            onComplete: () => { if (g.scene) g.destroy(); }
        });
    }

    /** Heal pet by amount, capped at effectiveMaxHp */
    heal(amount) {
        if (!this.alive) return;
        this.hp = Math.min(this.hp + amount, this.effectiveMaxHp);
    }

    /** Revive pet at full HP (e.g. on new world) */
    revive(gridX, gridY) {
        this.alive = true;
        this.hp    = this.effectiveMaxHp;
        this.gridX = gridX;
        this.gridY = gridY;
        if (!this.graphics || !this.graphics.scene) {
            this.graphics = this.scene.add.graphics();
            this.graphics.setDepth(4);
        }
        this._draw();
    }

    // ── Pet Inventory ─────────────────────────────────────────────────────────

    get backpackFull() { return !this.backpack.includes(null); }
    get backpackCount() { return this.backpack.filter(Boolean).length; }

    /** Add item to pet backpack. Returns true on success. */
    addItem(itemDef) {
        const isStackable = itemDef.type === 'consumable' || itemDef.type === 'tool';
        if (isStackable) {
            for (let i = 0; i < this.backpack.length; i++) {
                const entry = this.backpack[i];
                if (entry && entry.id === itemDef.id && entry.count < 10) {
                    entry.count++;
                    return true;
                }
            }
            const slot = this.backpack.indexOf(null);
            if (slot === -1) return false;
            this.backpack[slot] = { id: itemDef.id, count: 1 };
            return true;
        }
        const slot = this.backpack.indexOf(null);
        if (slot === -1) return false;
        this.backpack[slot] = itemDef;
        return true;
    }

    /** Remove item from pet backpack slot. Returns itemDef or null. */
    dropSlot(index) {
        const entry = this.backpack[index];
        if (!entry) return null;
        let itemDef;
        if (entry.id && entry.count !== undefined) {
            itemDef = ITEM_DEFS[entry.id];
            entry.count--;
            if (entry.count <= 0) this.backpack[index] = null;
        } else {
            itemDef = entry;
            this.backpack[index] = null;
        }
        return itemDef;
    }

    /** Get item def for a backpack entry */
    getItemDef(entry) {
        if (!entry) return null;
        if (entry.id && entry.count !== undefined) return ITEM_DEFS[entry.id];
        return entry;
    }

    getCount(entry) {
        if (!entry) return 0;
        if (entry.count !== undefined) return entry.count;
        return 1;
    }

    // ── Serialisation ─────────────────────────────────────────────────────────

    serialize() {
        return {
            typeId:   this.typeId,
            hp:       this.hp,
            maxHp:    this.maxHp,
            attack:   this.attack,
            alive:    this.alive,
            backpack: this.backpack.map(entry => {
                if (!entry) return null;
                if (entry.count !== undefined) return { id: entry.id, count: entry.count };
                if (entry.rarity && entry.rarity !== 'common') return { id: entry.id, rarity: entry.rarity };
                return entry.id || null;
            }),
        };
    }

    static deserialize(data, scene, gridX, gridY) {
        if (!data || !PET_TYPES[data.typeId]) return null;
        const pet  = new Pet(scene, gridX, gridY, data.typeId);
        pet.maxHp  = data.maxHp  || PET_TYPES[data.typeId].maxHp;
        pet.hp     = data.alive !== false ? Math.min(data.hp || pet.maxHp, pet.maxHp) : 0;
        pet.attack = data.attack || PET_TYPES[data.typeId].attack;
        pet.alive  = data.alive !== false;
        if (!pet.alive) {
            pet.graphics.setVisible(false);
        }
        // Restore pet backpack
        if (data.backpack) {
            data.backpack.forEach((entry, i) => {
                if (i >= 4 || !entry) return;
                if (typeof entry === 'string') {
                    const def = ITEM_DEFS[entry];
                    if (!def) return;
                    pet.backpack[i] = (def.type === 'consumable' || def.type === 'tool')
                        ? { id: entry, count: 1 } : makeRarityItem(def, 'common');
                } else if (entry.id && ITEM_DEFS[entry.id]) {
                    if (entry.count !== undefined) {
                        pet.backpack[i] = { id: entry.id, count: entry.count || 1 };
                    } else {
                        pet.backpack[i] = makeRarityItem(ITEM_DEFS[entry.id], entry.rarity || 'common');
                    }
                }
            });
        }
        return pet;
    }

    destroy() {
        if (this.graphics && this.graphics.scene) this.graphics.destroy();
    }
}
