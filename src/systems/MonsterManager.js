// ─── Labyrint Hero – MonsterManager ──────────────────────────────────────────
// Handles monster spawning, AI movement, pathfinding, and status effect ticking.

class MonsterManager {
    constructor(scene) {
        this.scene = scene;
    }

    // ── Monster placement ─────────────────────────────────────────────────────

    placeMonsters() {
        const scene = this.scene;
        const gen = scene._gen;
        const allFloor = gen.getFloorTiles().filter(({ x, y }) =>
            Math.abs(x - 1) + Math.abs(y - 1) > 8
        );
        MazeGenerator.shuffle(allFloor);

        const byExit = allFloor.slice().sort((a, b) => {
            const da = Math.abs(a.x - scene.exitX) + Math.abs(a.y - scene.exitY);
            const db = Math.abs(b.x - scene.exitX) + Math.abs(b.y - scene.exitY);
            return da - db;
        });
        const bossTile = byExit[0];
        // Zone boss on the last world of each zone, regular boss otherwise
        const bossType = (typeof isZoneBossWorld !== 'undefined' && isZoneBossWorld(scene.worldNum))
            ? 'zone_boss' : 'boss';
        scene.boss = new Monster(scene, bossTile.x, bossTile.y, bossType);
        scene.monsters.push(scene.boss);

        const regular = allFloor.filter(t => t !== bossTile);
        const count   = 5 + scene.worldNum * 2;
        const types   = this._monsterPool();
        for (let i = 0; i < Math.min(count, regular.length); i++) {
            const { x, y } = regular[i];
            scene.monsters.push(new Monster(scene, x, y, types[Math.floor(Math.random() * types.length)]));
        }

        // Apply difficulty HP/ATK multipliers
        const mods = scene._diffMods();
        for (const m of scene.monsters) {
            m.maxHp  = Math.max(1, Math.round(m.maxHp  * mods.hpMul));
            m.hp     = m.maxHp;
            m.attack = Math.max(1, Math.round(m.attack * mods.atkMul));
            m._draw();
        }
    }

    _monsterPool() {
        const wn = this.scene.worldNum;
        if (wn <= 1) return ['goblin'];
        if (wn <= 2) return ['goblin', 'orc', 'orc'];
        if (wn <= 3) return ['orc', 'orc', 'troll'];
        if (wn <= 4) return ['orc', 'skeleton', 'troll'];
        if (wn <= 6) return ['skeleton', 'troll', 'golem'];
        if (wn <= 8) return ['troll', 'golem', 'wraith'];
        if (wn <= 10) return ['golem', 'wraith', 'demon'];
        return ['wraith', 'demon', 'demon'];
    }

    // ── Monster AI tick ───────────────────────────────────────────────────────

    tickMonsters(delta) {
        const scene = this.scene;

        // ── Status effect ticks ────────────────────────
        // Poison (tick every 2500ms – was 900ms, #56)
        if (scene.hero.poisonTurns > 0) {
            scene.poisonTickTimer += delta;
            if (scene.poisonTickTimer >= 2500) {
                scene.poisonTickTimer = 0;
                scene.hero.poisonTurns--;
                const cb = scene.hero.getCrystalBonuses();
                const totalPoisonResist = (cb.poisonResist || 0) + (scene.hero.elementPoisonResist || 0);
                if (totalPoisonResist > 0 && Math.random() < totalPoisonResist) {
                    scene._floatingText(scene.hero.gridX, scene.hero.gridY, '☠ Motstått!', '#88ff88');
                } else {
                    const died = scene.hero.takeDamage(1);
                    scene._floatingText(scene.hero.gridX, scene.hero.gridY, '☠ -1', '#44ee66');
                    scene.hero._drawSprite();
                    if (died) { scene._heroDied(); return; }
                }
            }
        } else {
            scene.poisonTickTimer = 0;
        }

        // Burn (tick every 2000ms – was 800ms, #56)
        if (scene.hero.burnTurns > 0) {
            scene.burnTickTimer = (scene.burnTickTimer || 0) + delta;
            if (scene.burnTickTimer >= 2000) {
                scene.burnTickTimer = 0;
                scene.hero.burnTurns--;
                const cb = scene.hero.getCrystalBonuses();
                if (cb.burnResist > 0 && Math.random() < cb.burnResist) {
                    scene._floatingText(scene.hero.gridX, scene.hero.gridY, '🔥 Motstått!', '#ffaa66');
                } else {
                    const died = scene.hero.takeDamage(2);
                    scene._floatingText(scene.hero.gridX, scene.hero.gridY, '🔥 -2', '#ff6600');
                    scene.hero._drawSprite();
                    if (died) { scene._heroDied(); return; }
                }
            }
        } else {
            scene.burnTickTimer = 0;
        }

        // Slow
        if (scene.hero.slowTurns > 0) {
            scene.slowTickTimer = (scene.slowTickTimer || 0) + delta;
            if (scene.slowTickTimer >= 1000) {
                scene.slowTickTimer = 0;
                scene.hero.slowTurns--;
                scene.hero._drawSprite();
            }
        } else {
            scene.slowTickTimer = 0;
        }

        // Stun
        if (scene.hero.stunTurns > 0) {
            scene.stunTickTimer = (scene.stunTickTimer || 0) + delta;
            if (scene.stunTickTimer >= 600) {
                scene.stunTickTimer = 0;
                scene.hero.stunTurns--;
                scene.hero._drawSprite();
                if (scene.hero.stunTurns <= 0) {
                    scene._floatingText(scene.hero.gridX, scene.hero.gridY, 'Ustunnet!', '#ffee00');
                }
            }
        } else {
            scene.stunTickTimer = 0;
        }

        // Tick temporary buffs every frame (time-based, not turn-based)
        scene.hero.tickTempBuffs(delta);

        scene.monsterTick += delta;
        scene.bossTickTimer = (scene.bossTickTimer || 0) + delta;

        // Regular monsters tick
        const regularReady = scene.monsterTick >= MONSTER_TICK_MS;
        if (regularReady) scene.monsterTick = 0;

        // Boss uses slower tick for attacks, giving player time to use potions
        const bossReady = scene.bossTickTimer >= BOSS_TICK_MS;
        if (bossReady) scene.bossTickTimer = 0;

        if (!regularReady && !bossReady) return;

        if (regularReady) scene.combat.tickLaserTurrets();

        for (const m of [...scene.monsters]) {
            if (!m.alive) continue;
            const isBoss = m.type === 'boss';
            if (isBoss && !bossReady) continue;
            if (!isBoss && !regularReady) continue;
            // Tick monster status effects (acid burn, stun)
            if (m.tickStatusEffects) m.tickStatusEffects();
            if (m.stunTurns > 0) continue; // stunned – skip turn
            this._moveMonster(m);
        }
    }

    _moveMonster(m) {
        const scene = this.scene;
        if (!scene.hero.alive) return;
        const hx = scene.hero.gridX, hy = scene.hero.gridY;
        const dist = Math.abs(hx - m.gridX) + Math.abs(hy - m.gridY);
        if (dist > AGGRO_RADIUS || scene.fog[m.gridY][m.gridX] === FOG.DARK) return;
        if (dist === 1) {
            scene.combat.monsterAttack(m);
            return;
        }

        // Attack pet if adjacent and can't reach hero
        if (scene.pet && scene.pet.alive) {
            const petDist = Math.abs(scene.pet.gridX - m.gridX) + Math.abs(scene.pet.gridY - m.gridY);
            if (petDist === 1) {
                scene.combat.monsterAttack(m);
                return;
            }
        }

        const ddx = hx - m.gridX, ddy = hy - m.gridY;
        const dirs = Math.abs(ddx) >= Math.abs(ddy)
            ? [[Math.sign(ddx), 0], [0, Math.sign(ddy)], [0, -Math.sign(ddy)], [-Math.sign(ddx), 0]]
            : [[0, Math.sign(ddy)], [Math.sign(ddx), 0], [-Math.sign(ddx), 0], [0, -Math.sign(ddy)]];

        for (const [dx, dy] of dirs) {
            const nx = m.gridX + dx, ny = m.gridY + dy;
            if (nx < 0 || nx >= scene.tileW || ny < 0 || ny >= scene.tileH) continue;
            const t = scene.maze[ny][nx];
            if (t === TILE.WALL || t === TILE.CRACKED_WALL || t === TILE.DOOR) continue;
            if (nx === hx && ny === hy) continue;
            if (this.monsterAt(nx, ny)) continue;
            if (scene.merchant && nx === scene.merchant.gridX && ny === scene.merchant.gridY) continue;
            m.moveTo(nx, ny); break;
        }
    }

    monsterAt(gx, gy) {
        return this.scene.monsters.find(m => m.alive && m.gridX === gx && m.gridY === gy);
    }
}
