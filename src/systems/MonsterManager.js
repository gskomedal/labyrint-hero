// ─── Labyrint Hero – MonsterManager ──────────────────────────────────────────
// Handles monster spawning, AI movement, pathfinding, and status effect ticking.

/**
 * BFS pathfinding – returns the first step [dx, dy] toward the target,
 * or null if no path exists. Shared by monster AI and pet follow.
 */
function bfsNextStep(startX, startY, goalX, goalY, maze, tileW, tileH, blockedFn) {
    if (startX === goalX && startY === goalY) return null;
    const key = (x, y) => y * tileW + x;
    const visited = new Set();
    visited.add(key(startX, startY));
    // Each entry: { x, y, firstDx, firstDy } – track the first step direction
    const queue = [];
    for (const [dx, dy] of [[0,-1],[0,1],[-1,0],[1,0]]) {
        const nx = startX + dx, ny = startY + dy;
        if (nx < 0 || nx >= tileW || ny < 0 || ny >= tileH) continue;
        const t = maze[ny][nx];
        if (t === TILE.WALL || t === TILE.CRACKED_WALL || t === TILE.DOOR) continue;
        if (nx === goalX && ny === goalY) return [dx, dy];
        if (blockedFn && blockedFn(nx, ny)) continue;
        visited.add(key(nx, ny));
        queue.push({ x: nx, y: ny, firstDx: dx, firstDy: dy });
    }
    // BFS with max depth to avoid performance issues on large mazes
    const maxNodes = 200;
    let head = 0;
    while (head < queue.length && head < maxNodes) {
        const cur = queue[head++];
        for (const [dx, dy] of [[0,-1],[0,1],[-1,0],[1,0]]) {
            const nx = cur.x + dx, ny = cur.y + dy;
            if (nx < 0 || nx >= tileW || ny < 0 || ny >= tileH) continue;
            const k = key(nx, ny);
            if (visited.has(k)) continue;
            const t = maze[ny][nx];
            if (t === TILE.WALL || t === TILE.CRACKED_WALL || t === TILE.DOOR) continue;
            if (nx === goalX && ny === goalY) return [cur.firstDx, cur.firstDy];
            if (blockedFn && blockedFn(nx, ny)) continue;
            visited.add(k);
            queue.push({ x: nx, y: ny, firstDx: cur.firstDx, firstDy: cur.firstDy });
        }
    }
    return null; // No path found within limit
}

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
        if (wn <= 2) return ['goblin', 'orc', 'orc'];
        if (wn <= 3) return ['orc', 'orc', 'troll'];
        if (wn <= 5) return ['orc', 'troll', 'troll'];
        return ['troll', 'troll', 'troll'];
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

        // Tick temporary buffs (brews etc.)
        scene.hero.tickTempBuffs();

        for (const m of [...scene.monsters]) {
            if (!m.alive) continue;
            this._moveMonster(m);
        }
    }

    _moveMonster(m) {
        const scene = this.scene;
        if (!scene.hero.alive) return;

        // Tick down attack cooldown
        if (m.attackCooldown > 0) {
            m.attackCooldown -= MONSTER_TICK_MS;
        }

        const hx = scene.hero.gridX, hy = scene.hero.gridY;
        const dist = Math.abs(hx - m.gridX) + Math.abs(hy - m.gridY);
        if (dist > AGGRO_RADIUS || scene.fog[m.gridY][m.gridX] === FOG.DARK) return;
        if (dist === 1) {
            if (m.attackCooldown <= 0) {
                scene.combat.monsterAttack(m);
                m.attackCooldown = COMBAT_COOLDOWN_MS;
                // Phase 2 boss attacks a second time!
                if (m.type === 'boss' && m.phase === 2 && scene.hero.alive) {
                    scene.combat.monsterAttack(m);
                }
            }
            return;
        }

        // Attack pet if adjacent and can't reach hero
        if (scene.pet && scene.pet.alive) {
            const petDist = Math.abs(scene.pet.gridX - m.gridX) + Math.abs(scene.pet.gridY - m.gridY);
            if (petDist === 1) {
                if (m.attackCooldown <= 0) {
                    scene.combat.monsterAttack(m);
                    m.attackCooldown = COMBAT_COOLDOWN_MS;
                }
                return;
            }
        }

        const self = this;
        const step = bfsNextStep(m.gridX, m.gridY, hx, hy, scene.maze, scene.tileW, scene.tileH, (nx, ny) => {
            if (self.monsterAt(nx, ny)) return true;
            if (scene.merchant && nx === scene.merchant.gridX && ny === scene.merchant.gridY) return true;
            return false;
        });
        if (step) {
            m.moveTo(m.gridX + step[0], m.gridY + step[1]);
        }
    }

    monsterAt(gx, gy) {
        return this.scene.monsters.find(m => m.alive && m.gridX === gx && m.gridY === gy);
    }
}
