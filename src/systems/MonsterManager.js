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
        scene.boss = new Monster(scene, bossTile.x, bossTile.y, 'boss');
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
        if (wn <= 2) return ['goblin', 'goblin', 'orc'];
        if (wn <= 4) return ['goblin', 'orc', 'troll'];
        return ['orc', 'troll', 'troll'];
    }

    // ── Monster AI tick ───────────────────────────────────────────────────────

    tickMonsters(delta) {
        const scene = this.scene;

        // ── Status effect ticks ────────────────────────
        // Poison
        if (scene.hero.poisonTurns > 0) {
            scene.poisonTickTimer += delta;
            if (scene.poisonTickTimer >= 900) {
                scene.poisonTickTimer = 0;
                scene.hero.poisonTurns--;
                const died = scene.hero.takeDamage(1);
                scene._floatingText(scene.hero.gridX, scene.hero.gridY, '☠ -1', '#44ee66');
                scene.hero._drawSprite();
                if (died) { scene._heroDied(); return; }
            }
        } else {
            scene.poisonTickTimer = 0;
        }

        // Burn
        if (scene.hero.burnTurns > 0) {
            scene.burnTickTimer = (scene.burnTickTimer || 0) + delta;
            if (scene.burnTickTimer >= 800) {
                scene.burnTickTimer = 0;
                scene.hero.burnTurns--;
                const died = scene.hero.takeDamage(2);
                scene._floatingText(scene.hero.gridX, scene.hero.gridY, '🔥 -2', '#ff6600');
                scene.hero._drawSprite();
                if (died) { scene._heroDied(); return; }
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

        scene.monsterTick += delta;
        if (scene.monsterTick < MONSTER_TICK_MS) return;
        scene.monsterTick = 0;

        for (const m of [...scene.monsters]) {
            if (!m.alive) continue;
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
            // Phase 2 boss attacks a second time each tick!
            if (m.type === 'boss' && m.phase === 2 && scene.hero.alive) {
                scene.combat.monsterAttack(m);
            }
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
