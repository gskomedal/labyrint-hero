// ─── Labyrint Hero – InputHandler ────────────────────────────────────────────
// Handles keyboard/touch input, hero movement, and zoom controls.

class InputHandler {
    constructor(scene) {
        this.scene = scene;
    }

    // ── Setup input keys ──────────────────────────────────────────────────────

    setupKeys() {
        const scene = this.scene;
        scene.cursors      = scene.input.keyboard.createCursorKeys();
        scene.wasd         = scene.input.keyboard.addKeys('W,A,S,D');
        scene.eKey         = scene.input.keyboard.addKey('E');
        scene.attackKey    = scene.input.keyboard.addKey('SPACE');
        scene.altAtkKey    = scene.input.keyboard.addKey('F');
        scene.bowKey       = scene.input.keyboard.addKey('R');
        scene.zoomInKey    = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.PLUS);
        scene.zoomOutKey   = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.MINUS);
        scene.zoomInAlt    = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_ADD);
        scene.zoomOutAlt   = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_SUBTRACT);
        scene.useItemKey   = scene.input.keyboard.addKey('Q');
        scene.elementBookKey = scene.input.keyboard.addKey('B');
        scene.smelteryKey    = scene.input.keyboard.addKey('V');
        scene.chemLabKey     = scene.input.keyboard.addKey('C');
        scene.moveTimer    = 0;

        // Mouse wheel zoom
        scene.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
            const z  = scene.cameras.main.zoom;
            const nz = deltaY < 0
                ? Math.min(ZOOM_MAX, z + ZOOM_STEP)
                : Math.max(ZOOM_MIN, z - ZOOM_STEP);
            scene.cameras.main.setZoom(nz);
        });
    }

    // ── Hero movement ─────────────────────────────────────────────────────────

    handleInput(delta) {
        const scene = this.scene;
        if (scene.hero.stunTurns > 0) return;
        scene.moveTimer -= delta;
        if (scene.moveTimer > 0) return;
        let dx = 0, dy = 0;
        if      (scene.cursors.left.isDown  || scene.wasd.A.isDown) dx = -1;
        else if (scene.cursors.right.isDown || scene.wasd.D.isDown) dx =  1;
        else if (scene.cursors.up.isDown    || scene.wasd.W.isDown) dy = -1;
        else if (scene.cursors.down.isDown  || scene.wasd.S.isDown) dy =  1;

        // Touch d-pad fallback
        if (dx === 0 && dy === 0) {
            dx = scene.game.registry.get('touch_dx') || 0;
            dy = scene.game.registry.get('touch_dy') || 0;
        }

        if (dx !== 0 || dy !== 0) {
            this._tryMoveHero(dx, dy);
            scene.moveTimer = scene.hero.slowTurns > 0 ? MOVE_DELAY_MS * 2 : MOVE_DELAY_MS;
        }
    }

    _tryMoveHero(dx, dy) {
        const scene = this.scene;
        // Always update facing direction, even when movement is blocked
        scene.hero.facing = { dx, dy };

        const nx = scene.hero.gridX + dx, ny = scene.hero.gridY + dy;
        if (nx < 0 || nx >= scene.tileW || ny < 0 || ny >= scene.tileH) return;

        const tile = scene.maze[ny][nx];

        // Hard walls and cracked walls block movement
        if (tile === TILE.WALL || tile === TILE.CRACKED_WALL) return;

        // Spike trap – triggers once then becomes floor
        if (tile === TILE.TRAP) {
            scene.maze[ny][nx] = TILE.FLOOR;
            scene.mapRenderer.drawMap();
            scene.hero.moveTo(nx, ny);
            scene.mapRenderer.updateFog();
            scene.itemSpawner.checkItemPickup();
            scene.itemSpawner.checkChestPickup();
            const trapDmg = Math.round((2 + Math.floor(scene.worldNum / 2)) * scene._diffMods().trapDmgMul);
            const died = scene.hero.takeDamage(trapDmg);
            Audio.playHurt();
            scene.cameras.main.shake(80, 0.006);
            scene._floatingText(nx, ny, `⚠ Felle! -${trapDmg}`, '#ff6600');
            if (died) scene._heroDied();
            return;
        }

        // Locked door – auto-use key if available
        if (tile === TILE.DOOR) {
            const keyIdx = scene._findItemInBackpack('key');
            if (keyIdx === -1) {
                scene._showMessage('Låst dør! Du trenger en nøkkel 🔑', '#ffcc00');
                return;
            }
            Audio.playDoor();
            scene.hero.inventory.dropSlot(keyIdx);
            scene.maze[ny][nx] = TILE.FLOOR;
            scene.mapRenderer.drawMap();
            scene.cameras.main.shake(50, 0.003);
            scene._floatingText(nx, ny, '🔑 Åpnet!', '#ffcc00');
        }

        // Update facing direction
        scene.hero.facing = { dx, dy };

        // Monster blocking? Face it, show bump
        const target = scene.monsterMgr.monsterAt(nx, ny);
        if (target) {
            scene.combat.bumpEffect(target);
            return;
        }

        scene.hero.moveTo(nx, ny);
        scene.mapRenderer.updateFog();
        scene.itemSpawner.checkPetEggPickup();
        scene.itemSpawner.checkItemPickup();
        scene.itemSpawner.checkChestPickup();
        scene.itemSpawner.checkMerchant();
        if (scene.maze[ny][nx] === TILE.EXIT) scene._checkExit();
    }

    // ── Zoom ──────────────────────────────────────────────────────────────────

    handleZoom() {
        const scene = this.scene;
        const plus  = Phaser.Input.Keyboard.JustDown(scene.zoomInKey)  ||
                      Phaser.Input.Keyboard.JustDown(scene.zoomInAlt);
        const minus = Phaser.Input.Keyboard.JustDown(scene.zoomOutKey) ||
                      Phaser.Input.Keyboard.JustDown(scene.zoomOutAlt);
        const z = scene.cameras.main.zoom;
        if (plus)  scene.cameras.main.setZoom(Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)));
        if (minus) scene.cameras.main.setZoom(Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)));
    }
}
