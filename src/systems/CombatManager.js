// ─── Labyrint Hero – CombatManager ───────────────────────────────────────────
// Handles melee attack resolution, ranged combat (bow), damage, and kill rewards.

class CombatManager {
    constructor(scene) {
        this.scene = scene;
    }

    // ── Button-press Attack (SPACE / F) ───────────────────────────────────────

    handleAttack() {
        const scene = this.scene;
        if (scene.hero.stunTurns > 0) return;
        const spaceDown = Phaser.Input.Keyboard.JustDown(scene.attackKey);
        const fDown     = Phaser.Input.Keyboard.JustDown(scene.altAtkKey);
        const touchAtk  = scene.game.registry.get('touch_attack');
        if (touchAtk) scene.game.registry.set('touch_attack', false);
        if (!spaceDown && !fDown && !touchAtk) return;

        const { dx, dy } = scene.hero.facing;
        const fx = scene.hero.gridX + dx, fy = scene.hero.gridY + dy;

        // 1. Attack monster in facing direction first
        if (fx >= 0 && fx < scene.tileW && fy >= 0 && fy < scene.tileH) {
            const facingM = scene.monsterMgr.monsterAt(fx, fy);
            if (facingM) { this._heroAttack(facingM); return; }

            // 2. Break cracked wall with pickaxe
            if (scene.maze[fy][fx] === TILE.CRACKED_WALL) {
                const pickIdx = scene._findItemInBackpack('pickaxe');
                if (pickIdx !== -1) {
                    Audio.playBreak();
                    scene.hero.inventory.dropSlot(pickIdx);
                    scene.maze[fy][fx] = TILE.FLOOR;
                    scene.mapRenderer.drawMap();
                    scene.cameras.main.shake(100, 0.006);
                    scene._floatingText(fx, fy, '💥 Brøt!', '#cc9944');
                    scene.mapRenderer.updateFog();
                    return;
                }
                scene._showMessage('Trenger hakke for å bryte veggen!', '#cc9944');
                return;
            }
        }

        // 3. Attack any adjacent monster
        for (const [adx, ady] of [[0,-1],[0,1],[-1,0],[1,0]]) {
            const ax = scene.hero.gridX + adx, ay = scene.hero.gridY + ady;
            const m  = scene.monsterMgr.monsterAt(ax, ay);
            if (m) { this._heroAttack(m); return; }
        }

        // No target – swing animation
        scene.cameras.main.shake(30, 0.002);
    }

    // ── Bow / Ranged Attack (R) ────────────────────────────────────────────────

    handleBow() {
        const scene = this.scene;
        const touchBow = scene.game.registry.get('touch_bow');
        if (touchBow) scene.game.registry.set('touch_bow', false);
        if (!Phaser.Input.Keyboard.JustDown(scene.bowKey) && !touchBow) return;
        const weapon = scene.hero.inventory.equipped.weapon;
        if (!weapon || weapon.subtype !== 'bow') {
            scene._showMessage('Ingen bue utstyrt! (trykk E for inventar)', '#ff8844');
            return;
        }
        const { dx, dy } = scene.hero.facing;
        if (dx === 0 && dy === 0) return;
        this._shootArrow(dx, dy, weapon.atk || 3);
    }

    // ── Quick-Use Item (Q key / touch USE button) ──────────────────────────

    handleUseItem() {
        const scene = this.scene;
        const touchUse = scene.game.registry.get('touch_use');
        if (touchUse) scene.game.registry.set('touch_use', false);
        if (!Phaser.Input.Keyboard.JustDown(scene.useItemKey) && !touchUse) return;

        const used = scene.hero.inventory.useQuickItem(scene.hero, scene);
        if (used) {
            Audio.playPickup();
            scene._floatingText(scene.hero.gridX, scene.hero.gridY, `✦ ${used.name}`, '#44ccff');
        } else {
            scene._showMessage('Ingen hurtiggjenstand valgt! (åpne inventar med E)', '#ff8844');
        }
    }

    // ── Tech Gadgets ──────────────────────────────────────────────────────────

    handleEMP() {
        const scene = this.scene;
        const touchEmp = scene.game.registry.get('touch_emp');
        if (touchEmp) scene.game.registry.set('touch_emp', false);
        if (!Phaser.Input.Keyboard.JustDown(scene.empKey) && !touchEmp) return;
        if (!scene.hero.techEMP) return;
        if ((scene.hero.empCharges || 0) <= 0) {
            scene._showMessage('Ingen EMP-ladninger igjen!', '#778899');
            return;
        }
        scene.hero.empCharges--;
        Audio.playLevelUp();
        scene.cameras.main.flash(400, 120, 180, 255, false);
        scene.cameras.main.shake(200, 0.008);
        let stunned = 0;
        for (const m of scene.monsters) {
            if (!m.alive) continue;
            m.applyStun(50);
            stunned++;
        }
        scene._floatingText(scene.hero.gridX, scene.hero.gridY, `⚡ EMP! ${stunned} monstre lammet`, '#88ccff', true);
    }

    handlePlaceTurret() {
        const scene = this.scene;
        const touchTurret = scene.game.registry.get('touch_turret');
        if (touchTurret) scene.game.registry.set('touch_turret', false);
        if (!Phaser.Input.Keyboard.JustDown(scene.turretKey) && !touchTurret) return;
        if (!scene.hero.techLaserTurret) return;
        if ((scene.hero.laserTurretCharges || 0) <= 0) {
            scene._showMessage('Ingen turret-ladninger igjen!', '#6688aa');
            return;
        }
        const gx = scene.hero.gridX, gy = scene.hero.gridY;
        if (scene.laserTurrets && scene.laserTurrets.some(t => t.gx === gx && t.gy === gy)) {
            scene._showMessage('Allerede en turret her!', '#6688aa');
            return;
        }
        scene.hero.laserTurretCharges--;
        const turretGfx = scene.add.graphics();
        turretGfx.setDepth(4);
        const px = gx * TILE_SIZE, py = gy * TILE_SIZE, s = TILE_SIZE;
        turretGfx.fillStyle(0x4466aa, 1);
        turretGfx.fillRect(px + 6, py + 6, s - 12, s - 12);
        turretGfx.fillStyle(0x88bbff, 1);
        turretGfx.fillRect(px + 10, py + 10, s - 20, s - 20);
        turretGfx.fillStyle(0xff4444, 1);
        turretGfx.fillCircle(px + s / 2, py + s / 2, 3);
        scene.laserTurrets.push({ gx, gy, graphic: turretGfx });
        Audio.playPickup();
        scene._floatingText(gx, gy, '🔫 Turret plassert!', '#6688ff');
    }

    handleTeleporter() {
        const scene = this.scene;
        const touchTele = scene.game.registry.get('touch_teleporter');
        if (touchTele) scene.game.registry.set('touch_teleporter', false);
        if (!Phaser.Input.Keyboard.JustDown(scene.teleporterKey) && !touchTele) return;
        if (!scene.hero.techTeleporter) return;
        const gx = scene.hero.gridX, gy = scene.hero.gridY;
        const nodes = scene.teleporterNodes || [];
        const atNode = nodes.findIndex(n => n.gx === gx && n.gy === gy);
        if (atNode !== -1) {
            if (nodes.length < 2) {
                scene._showMessage('Plassér minst 2 noder for å teleportere!', '#aabbcc');
                return;
            }
            const next = nodes[(atNode + 1) % nodes.length];
            scene.hero.moveTo(next.gx, next.gy);
            scene.hero.gridX = next.gx;
            scene.hero.gridY = next.gy;
            scene.mapRenderer.updateFog();
            Audio.playExit();
            scene.cameras.main.flash(200, 100, 150, 220, false);
            scene._floatingText(next.gx, next.gy, '✦ Teleportert!', '#aabbff');
            return;
        }
        if (nodes.length >= 5) {
            scene._showMessage('Maks 5 teleporter-noder!', '#aabbcc');
            return;
        }
        const nodeGfx = scene.add.graphics();
        nodeGfx.setDepth(2);
        const px = gx * TILE_SIZE, py = gy * TILE_SIZE, s = TILE_SIZE;
        nodeGfx.fillStyle(0x5566aa, 0.5);
        nodeGfx.fillCircle(px + s / 2, py + s / 2, s / 3);
        nodeGfx.lineStyle(2, 0xaabbff, 0.8);
        nodeGfx.strokeCircle(px + s / 2, py + s / 2, s / 3);
        nodes.push({ gx, gy, graphic: nodeGfx });
        scene.teleporterNodes = nodes;
        Audio.playPickup();
        scene._floatingText(gx, gy, `📡 Node ${nodes.length} plassert`, '#aabbff');
    }

    // ── Laser turret AI (called from MonsterManager tick) ──────────────────────

    tickLaserTurrets() {
        const scene = this.scene;
        if (!scene.laserTurrets || scene.laserTurrets.length === 0) return;
        for (const turret of scene.laserTurrets) {
            let closest = null, bestDist = Infinity;
            for (const m of scene.monsters) {
                if (!m.alive) continue;
                const dist = Math.abs(m.gridX - turret.gx) + Math.abs(m.gridY - turret.gy);
                if (dist <= 5 && dist < bestDist) { bestDist = dist; closest = m; }
            }
            if (!closest) continue;
            const result = closest.takeDamage(4);
            scene._floatingText(closest.gridX, closest.gridY, '-4 ⚡', '#88bbff');
            this._drawLaserBeam(turret, closest);
            if (result === 'enraged') this._onBossEnraged(closest);
            else if (result === true) this._onMonsterKilled(closest);
        }
    }

    _drawLaserBeam(turret, target) {
        const scene = this.scene;
        const beam = scene.add.graphics();
        beam.setDepth(15);
        beam.lineStyle(2, 0x88bbff, 0.9);
        beam.lineBetween(
            turret.gx * TILE_SIZE + TILE_SIZE / 2, turret.gy * TILE_SIZE + TILE_SIZE / 2,
            target.gridX * TILE_SIZE + TILE_SIZE / 2, target.gridY * TILE_SIZE + TILE_SIZE / 2
        );
        scene.tweens.add({
            targets: beam, alpha: 0, duration: 300,
            onComplete: () => { if (beam.scene) beam.destroy(); }
        });
    }

    // ── Damage calculation (pure logic, testable) ──────────────────────────────

    /**
     * Calculate hero's melee damage output.
     * @param {number} heroAttack - Hero base attack stat
     * @param {object} crystalBonuses - { attack, critChance, ... } from getCrystalBonuses()
     * @param {number} heroCritChance - Hero base crit chance
     * @param {number} [roll] - Random roll 0-2 for variance (optional, for testing)
     * @param {number} [critRoll] - Random 0-1 for crit check (optional, for testing)
     * @returns {{ damage: number, isCrit: boolean }}
     */
    static calculateHeroDamage(heroAttack, crystalBonuses, heroCritChance, roll, critRoll) {
        if (roll === undefined) roll = Math.floor(Math.random() * 3);
        if (critRoll === undefined) critRoll = Math.random();
        let dmg = heroAttack + (crystalBonuses.attack || 0) + roll;
        const totalCrit = heroCritChance + (crystalBonuses.critChance || 0);
        const isCrit = totalCrit > 0 && critRoll < totalCrit;
        if (isCrit) dmg *= 2;
        return { damage: dmg, isCrit };
    }

    /**
     * Calculate monster's damage to hero.
     * @param {number} monsterAttack - Monster attack stat
     * @param {number} [bonusRoll] - Random 0-1 for +1 bonus chance (optional, for testing)
     * @returns {number} damage amount
     */
    static calculateMonsterDamage(monsterAttack, bonusRoll) {
        if (bonusRoll === undefined) bonusRoll = Math.random();
        return monsterAttack + (bonusRoll < 0.3 ? 1 : 0);
    }

    // ── Hero melee attack ─────────────────────────────────────────────────────

    _heroAttack(monster) {
        const scene = this.scene;
        const cb = scene.hero.getCrystalBonuses();
        const { damage: dmg, isCrit: crit } = CombatManager.calculateHeroDamage(
            scene.hero.attack, cb, scene.hero.critChance
        );

        const lx = scene.hero.graphics.x + Math.sign(monster.gridX - scene.hero.gridX) * 9;
        const ly = scene.hero.graphics.y + Math.sign(monster.gridY - scene.hero.gridY) * 9;
        scene.tweens.killTweensOf(scene.hero.graphics);
        scene.tweens.add({
            targets: scene.hero.graphics, x: lx, y: ly,
            duration: 55, ease: 'Sine.easeOut', yoyo: true
        });

        Audio.playAttack();
        const result = monster.takeDamage(dmg);
        scene._floatingText(monster.gridX, monster.gridY,
            crit ? `KRIT! ${dmg}` : `-${dmg}`,
            crit ? '#ffee00' : '#ff4444', crit);
        scene._hitSparks(monster.gridX, monster.gridY, crit ? 0xffee00 : 0xff4400);
        scene.cameras.main.shake(crit ? 100 : 70, crit ? 0.006 : 0.004);

        if (result === 'enraged') {
            this._onBossEnraged(monster);
        } else if (result === true) {
            this._onMonsterKilled(monster);
        }
    }

    _onBossEnraged(boss) {
        const scene = this.scene;
        Audio.playBossStrike();
        scene.cameras.main.shake(200, 0.012);
        scene.cameras.main.flash(300, 180, 20, 0, false);
        scene._showMessage('⚡ BOSS RASENDE! Angrep +40%!', '#ff6600');
        scene.tweens.add({
            targets:  boss.graphics,
            scaleX:   1.15, scaleY: 1.15,
            duration: 180, yoyo: true, repeat: 2,
            ease:     'Sine.easeInOut'
        });
    }

    _onMonsterKilled(monster) {
        const scene = this.scene;
        const xp      = Math.round(monster.xpReward * scene._diffMods().xpMul);
        const leveled = scene.hero.gainXP(xp);
        scene.monsters = scene.monsters.filter(m => m !== monster);
        scene.monstersKilled++;

        const goldBase = GOLD_DROP[monster.type] || (monster.type === 'zone_boss' ? 200 : 5);
        const crystalGoldMul = 1 + (scene.hero.getCrystalBonuses().goldMultiplier || 0) + (scene.hero.elementGoldMul || 0);
        const gold = Math.round((goldBase + Math.floor(Math.random() * goldBase * 0.5) + scene.worldNum * 2) * crystalGoldMul);
        scene.hero.gold += gold;
        scene._floatingText(monster.gridX, monster.gridY, `+${gold}g`, '#ffcc00');

        if (monster.type === 'zone_boss') {
            // ── Zone boss killed – spectacular reward ────────────────────────
            const zoneName = typeof getZone !== 'undefined' ? getZone(scene.worldNum).name : 'Sone';

            // Drop guaranteed high-tier mineral + best item
            const bossItem = randomItemForWorld(Math.min(scene.worldNum + 2, 10), 1);
            if (bossItem) scene.itemSpawner.spawnItemAt(monster.gridX, monster.gridY, bossItem);
            if (typeof rollBossMineral !== 'undefined') {
                scene.itemSpawner.spawnMineralAt(monster.gridX, monster.gridY, rollBossMineral(scene.worldNum));
                scene.itemSpawner.spawnMineralAt(monster.gridX + 1, monster.gridY, rollBossMineral(scene.worldNum));
            }

            // Unlock Chem Lab in Camp Room on first zone boss kill
            if (!scene.hero.chemLabUnlocked) {
                scene.hero.chemLabUnlocked = true;
                scene._floatingText(monster.gridX, monster.gridY - 2, 'Kjemisk lab ulåst i leirplassen!', '#33dd88');
            }

            // Screen flash effect
            const flash = scene.add.rectangle(
                scene.cameras.main.width / 2, scene.cameras.main.height / 2,
                scene.cameras.main.width, scene.cameras.main.height,
                0xffcc00, 0.6
            ).setDepth(100).setScrollFactor(0);
            scene.tweens.add({
                targets: flash, alpha: 0, duration: 800,
                onComplete: () => flash.destroy()
            });

            // Victory text
            scene._floatingText(monster.gridX, monster.gridY - 1, `${zoneName} beseiret!`, '#ffcc00');

        } else if (monster.type === 'boss') {
            const bossItem = randomItemForWorld(Math.min(scene.worldNum + 1, 7), 1);
            if (bossItem) scene.itemSpawner.spawnItemAt(monster.gridX, monster.gridY, bossItem);
        } else {
            // Regular monster drop: increased rate at higher levels (#59)
            const dropChance = Math.min(0.5, 0.25 + scene.worldNum * 0.03);
            if (Math.random() < dropChance) {
                const item = Math.random() < 0.7
                    ? randomItemByType(scene.worldNum, 'consumable', new Set())
                      || randomItemForWorld(scene.worldNum)
                    : randomItemForWorld(scene.worldNum);
                scene.itemSpawner.spawnItemAt(monster.gridX, monster.gridY, item);
            }
            // Extra chance for healing items on higher levels (#59)
            if (scene.worldNum >= 3 && Math.random() < 0.15) {
                const healId = Math.random() < 0.6 ? 'health_pot' : (Math.random() < 0.5 ? 'antidote' : 'big_health_pot');
                const healDef = ITEM_DEFS[healId];
                if (healDef) scene.itemSpawner.spawnItemAt(monster.gridX, monster.gridY, healDef);
            }
        }

        // Mineral drops (Elements mod)
        if (typeof rollMineralForWorld !== 'undefined') {
            const mineralDropChance = (monster.type === 'boss' || monster.type === 'zone_boss') ? 1.0 : 0.15;
            if (Math.random() < mineralDropChance) {
                const mineralDef = (monster.type === 'boss' || monster.type === 'zone_boss')
                    ? rollBossMineral(scene.worldNum)
                    : rollMineralForWorld(scene.worldNum);
                scene.itemSpawner.spawnMineralAt(monster.gridX, monster.gridY, mineralDef);
            }
        }

        if (leveled) scene._onLevelUp();
    }

    // ── Monster attack on hero ────────────────────────────────────────────────

    monsterAttack(monster) {
        const scene = this.scene;
        const heroDist = Math.abs(monster.gridX - scene.hero.gridX) + Math.abs(monster.gridY - scene.hero.gridY);

        // Monster targets pet when it can't reach the hero
        if (scene.pet && scene.pet.alive && heroDist > 1) {
            const petDist = Math.abs(monster.gridX - scene.pet.gridX) + Math.abs(monster.gridY - scene.pet.gridY);
            if (petDist === 1) {
                const petDmg = Math.max(1, monster.attack);
                const petDied = scene.pet.takeDamage(petDmg);
                Audio.playHurt();
                scene._floatingText(scene.pet.gridX, scene.pet.gridY, `-${petDmg}`, '#ffaadd');
                if (petDied) {
                    scene._floatingText(scene.pet.gridX, scene.pet.gridY, `${scene.pet.petName} falt!`, '#ff4466');
                }
                return;
            }
        }

        const dmg = CombatManager.calculateMonsterDamage(monster.attack);
        const died = scene.hero.takeDamage(dmg);

        Audio.playHurt();
        scene._floatingText(scene.hero.gridX, scene.hero.gridY, `-${dmg}`, '#ffaa00');

        // Orc/Troll poison chance
        if (!died && (monster.type === 'orc' || monster.type === 'troll')) {
            const poisonChance = monster.type === 'troll' ? 0.30 : 0.20;
            if (Math.random() < poisonChance) {
                scene.hero.applyPoison(4);
                scene._floatingText(scene.hero.gridX, scene.hero.gridY, '☠ Forgiftet!', '#44ee66');
            }
        }

        // Demon burn chance – fiery melee leaves a lingering burn DoT
        if (!died && monster.type === 'demon' && Math.random() < 0.30) {
            scene.hero.applyBurn(3);
            scene._floatingText(scene.hero.gridX, scene.hero.gridY, '🔥 Brent!', '#ff6600');
        }

        // Theme-based status effects
        if (!died) {
            const deco = scene._theme.DECO;
            if (deco === 'ice' && Math.random() < 0.25) {
                scene.hero.applySlow(4);
                scene._floatingText(scene.hero.gridX, scene.hero.gridY, '❄ Frostbitt!', '#88ddff');
            } else if (deco === 'volcanic' && Math.random() < 0.20) {
                scene.hero.applyBurn(3);
                scene._floatingText(scene.hero.gridX, scene.hero.gridY, '🔥 Brenner!', '#ff6600');
            }
            if (monster.type === 'boss' && monster.phase === 2 && Math.random() < 0.15) {
                scene.hero.applyStun(1);
                scene._floatingText(scene.hero.gridX, scene.hero.gridY, '⚡ Lammet!', '#ffee00');
            }
        }

        if (died || !scene.hero.alive) {
            scene.cameras.main.shake(120, 0.008);
            scene._heroDied();
        } else {
            scene.cameras.main.shake(100, 0.006);
            // Thorns synergy
            if (scene.hero.thornsDamage > 0 && monster.alive) {
                const thornsResult = monster.takeDamage(scene.hero.thornsDamage);
                scene._floatingText(monster.gridX, monster.gridY, `-${scene.hero.thornsDamage} torner`, '#44ddaa');
                if (thornsResult === 'enraged') this._onBossEnraged(monster);
                else if (thornsResult === true) this._onMonsterKilled(monster);
            }
            // Counter-attack synergy
            if (scene.hero.counterChance > 0 && monster.alive && Math.random() < scene.hero.counterChance) {
                const counterDmg = Math.max(1, Math.floor(scene.hero.attack * 0.5));
                const counterResult = monster.takeDamage(counterDmg);
                scene._floatingText(monster.gridX, monster.gridY, `⚔ Motangrep -${counterDmg}`, '#ff8844');
                if (counterResult === 'enraged') this._onBossEnraged(monster);
                else if (counterResult === true) this._onMonsterKilled(monster);
            }
        }
    }

    // ── Bump effect ───────────────────────────────────────────────────────────

    bumpEffect(monster) {
        const scene = this.scene;
        scene.tweens.add({
            targets:  monster.graphics,
            alpha:    0.3, duration: 60, yoyo: true, repeat: 1,
            onComplete: () => { if (monster.graphics) monster.graphics.setAlpha(1); }
        });
        scene._floatingText(monster.gridX, monster.gridY, '!', '#ff8844');
    }

    // ── Arrow projectile ──────────────────────────────────────────────────────

    _shootArrow(dx, dy, damage) {
        const scene = this.scene;
        Audio.playArrow();
        let ax = scene.hero.gridX + dx, ay = scene.hero.gridY + dy;
        let hitMonster = null;
        let endX = scene.hero.gridX, endY = scene.hero.gridY;

        while (ax >= 0 && ax < scene.tileW && ay >= 0 && ay < scene.tileH) {
            const t = scene.maze[ay][ax];
            if (t === TILE.WALL || t === TILE.CRACKED_WALL || t === TILE.DOOR) break;
            endX = ax; endY = ay;
            const m = scene.monsterMgr.monsterAt(ax, ay);
            if (m) { hitMonster = m; break; }
            ax += dx; ay += dy;
        }

        const arrowG = scene.add.graphics();
        arrowG.fillStyle(COLORS.ARROW, 1);
        if (dx !== 0) {
            arrowG.fillRect(-5, -1, 10, 3);
            arrowG.fillStyle(0xff9900, 0.8);
            arrowG.fillTriangle(dx * 5, 0, dx * 2, -3, dx * 2, 3);
        } else {
            arrowG.fillRect(-1, -5, 3, 10);
            arrowG.fillStyle(0xff9900, 0.8);
            arrowG.fillTriangle(0, dy * 5, -3, dy * 2, 3, dy * 2);
        }
        arrowG.setDepth(15);
        arrowG.x = scene.hero.gridX * TILE_SIZE + TILE_SIZE / 2;
        arrowG.y = scene.hero.gridY * TILE_SIZE + TILE_SIZE / 2;

        const dist = Math.abs(endX - scene.hero.gridX) + Math.abs(endY - scene.hero.gridY);
        scene.tweens.add({
            targets:  arrowG,
            x:        endX * TILE_SIZE + TILE_SIZE / 2,
            y:        endY * TILE_SIZE + TILE_SIZE / 2,
            duration: Math.max(80, dist * 50),
            ease:     'Linear',
            onComplete: () => {
                arrowG.destroy();
                if (hitMonster && hitMonster.alive) {
                    const arrowResult = hitMonster.takeDamage(damage);
                    scene._floatingText(hitMonster.gridX, hitMonster.gridY, `↓${damage}`, '#ffee55');
                    scene.cameras.main.shake(50, 0.003);
                    if (arrowResult === 'enraged') this._onBossEnraged(hitMonster);
                    else if (arrowResult === true)  this._onMonsterKilled(hitMonster);
                }
            }
        });
    }
}
