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

    // ── Hero melee attack ─────────────────────────────────────────────────────

    _heroAttack(monster) {
        const scene = this.scene;
        let dmg  = scene.hero.attack + Math.floor(Math.random() * 3);
        const crit = scene.hero.critChance > 0 && Math.random() < scene.hero.critChance;
        if (crit) dmg *= 2;

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

        const goldBase = GOLD_DROP[monster.type] || 5;
        const gold = goldBase + Math.floor(Math.random() * goldBase * 0.5) + scene.worldNum * 2;
        scene.hero.gold += gold;
        scene._floatingText(monster.gridX, monster.gridY, `+${gold}g`, '#ffcc00');
        if (monster.type === 'boss') {
            const bossItem = randomItemForWorld(Math.min(scene.worldNum + 1, 7), 1);
            if (bossItem) scene.itemSpawner.spawnItemAt(monster.gridX, monster.gridY, bossItem);
        } else if (Math.random() < 0.25) {
            const item = Math.random() < 0.7
                ? randomItemByType(scene.worldNum, 'consumable', new Set())
                  || randomItemForWorld(scene.worldNum)
                : randomItemForWorld(scene.worldNum);
            scene.itemSpawner.spawnItemAt(monster.gridX, monster.gridY, item);
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

        const dmg = monster.attack + (Math.random() < 0.3 ? 1 : 0);
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
