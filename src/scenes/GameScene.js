// ─── Labyrint Hero – GameScene ────────────────────────────────────────────────
// Orchestrator scene that delegates to focused modules:
//   MapRenderer, ItemSpawner, MonsterManager, CombatManager, InputHandler

class GameScene extends Phaser.Scene {
    constructor() { super({ key: 'GameScene' }); }

    init(data) {
        this.worldNum   = data.worldNum   || 1;
        this.heroStats  = data.heroStats  || null;
        this.raceId     = data.race       || 'human';
        this.heroName   = data.heroName   || 'Helt';
        this.appearance = data.appearance || null;
        this.difficulty = data.difficulty || 'normal';
        this.startBonus = data.startBonus || null;
    }

    /** Returns multipliers based on difficulty setting */
    _diffMods() {
        switch (this.difficulty) {
            case 'easy': return { hpMul: 0.65, atkMul: 0.75, trapCount: 0, xpMul: 1.20, trapDmgMul: 0.5 };
            case 'hard': return { hpMul: 1.40, atkMul: 1.25, trapCount: 3, xpMul: 0.80, trapDmgMul: 1.6 };
            default:     return { hpMul: 1.00, atkMul: 1.00, trapCount: 0, xpMul: 1.00, trapDmgMul: 1.0 };
        }
    }

    create() {
        this._dyingHandled = false;
        this._worldStartTime = Date.now();
        this._theme = getWorldTheme(this.worldNum);

        // ── Instantiate sub-systems ──────────────────────────────────────────
        this.mapRenderer = new MapRenderer(this);
        this.itemSpawner = new ItemSpawner(this);
        this.monsterMgr  = new MonsterManager(this);
        this.combat      = new CombatManager(this);
        this.inputHandler = new InputHandler(this);

        // ── Generate maze ────────────────────────────────────────────────────
        const extra = Math.min(this.worldNum - 1, 6);
        const cellW = BASE_CELL_W + extra * 2;
        const cellH = BASE_CELL_H + extra;
        this._gen   = new MazeGenerator(cellW, cellH);
        this.maze   = this._gen.generate();
        this.tileW  = this._gen.tileW;
        this.tileH  = this._gen.tileH;
        this.exitX  = this._gen.exitX;
        this.exitY  = this._gen.exitY;

        // ── Fog of war ────────────────────────────────────────────────────────
        this.fog = Array.from({ length: this.tileH }, () =>
            new Array(this.tileW).fill(FOG.DARK)
        );

        // ── Draw map ─────────────────────────────────────────────────────────
        this.mapGfx = null;
        this.mapRenderer.drawMap();

        // ── Hero ─────────────────────────────────────────────────────────────
        this.hero = new Hero(this, 1, 1);
        this._shownSynergies = [];
        if (this.heroStats) {
            this.hero.applyStats(this.heroStats, true);
            // Mark active synergies as already applied – saved stats already
            // include their bonuses, so we must NOT re-apply them.
            const active = getActiveSynergies(this.hero);
            this.hero._appliedSynergies = active.map(s => s.id);
            this._shownSynergies = active.map(s => s.id);
        } else {
            this.hero.applyRace(this.raceId);
            this.hero.heroName = this.heroName;
            if (this.appearance) this.hero.applyAppearance(this.appearance);
            if (this.startBonus === 'heart') {
                this.hero.maxHearts++;
                this.hero.hearts++;
            } else if (this.startBonus === 'attack') {
                this.hero.attack++;
            } else if (this.startBonus === 'vision') {
                this.hero.visionRadius += 2;
            }
            this.hero._draw();
        }

        // ── Pet companion ────────────────────────────────────────────────────
        this.pet = null;
        if (this.heroStats && this.heroStats.pet) {
            this.pet = Pet.deserialize(this.heroStats.pet, this, this.hero.gridX, this.hero.gridY);
            if (this.pet && this.pet.alive) {
                this.pet.revive(this.hero.gridX, this.hero.gridY);
            }
        }
        this.petTickTimer = 0;

        // ── World items (chests + tools only; loot comes from monster kills) ────
        this.itemObjects = [];
        this.chests      = [];
        this.itemSpawner.placeItems();

        // ── Merchant NPC ──────────────────────────────────────────────────────
        this.merchant = null;
        this.itemSpawner.placeMerchant();

        // ── Monsters ─────────────────────────────────────────────────────────
        this.monsters = [];
        this.boss     = null;
        this.monstersKilled = 0;
        this.monsterMgr.placeMonsters();

        // ── Fog overlay ───────────────────────────────────────────────────────
        this.fogGraphics = this.add.graphics();
        this.fogGraphics.setDepth(10);
        this.mapRenderer.updateFog();

        // ── Camera (offset viewport below the 54px HUD bar) ────────────────
        const HUD_H = 54;
        const cam = this.cameras.main;
        cam.setViewport(0, HUD_H, cam.width, cam.height - HUD_H);
        cam.setBounds(0, 0, this.tileW * TILE_SIZE, this.tileH * TILE_SIZE);
        cam.startFollow(this.hero.graphics, true, 0.08, 0.08);
        cam.setFollowOffset(0, 0);
        cam.setZoom(ZOOM_DEFAULT);

        // ── Input ─────────────────────────────────────────────────────────────
        this.inputHandler.setupKeys();

        // ── Monster tick ──────────────────────────────────────────────────────
        this.monsterTick = 0;
        this.poisonTickTimer = 0;

        // ── Exit portal pulse ─────────────────────────────────────────────────
        this.mapRenderer.spawnExitPortal();

        // ── Skill event listener ──────────────────────────────────────────────
        this.game.events.on('skillPicked', this._onSkillPicked, this);

        // ── HUD overlay ───────────────────────────────────────────────────────
        this.scene.launch('UIScene', { gameScene: this });

        // ── Background music ──────────────────────────────────────────────────
        Audio.init();
        Audio.startMusic(this.worldNum);

        // Resume audio on window focus
        this.sys.game.events.on('focus', () => Audio.resume());
    }

    shutdown() {
        this.game.events.off('skillPicked', this._onSkillPicked, this);
    }

    // ── Game loop ─────────────────────────────────────────────────────────────

    update(time, delta) {
        if (!this.hero || !this.hero.alive) return;
        const blocked = this.scene.isActive('SkillScene') || this.scene.isActive('InventoryScene') || this.scene.isActive('MerchantScene');

        if (!blocked) {
            this.inputHandler.handleInput(delta);
            this.combat.handleAttack();
            this.combat.handleBow();
            this.combat.handleUseItem();
            this.inputHandler.handleZoom();

            const touchInv = this.game.registry.get('touch_inventory');
            if (touchInv) this.game.registry.set('touch_inventory', false);
            if (Phaser.Input.Keyboard.JustDown(this.eKey) || touchInv) {
                this.scene.launch('InventoryScene');
            }

            this.monsterMgr.tickMonsters(delta);
            this._tickPet(delta);
        }

        const ui = this.scene.get('UIScene');
        if (ui && ui.sys.isActive()) ui.refresh();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    _findItemInBackpack(id) {
        return this.hero.inventory.backpack.findIndex(entry => {
            if (!entry) return false;
            return entry.id === id;
        });
    }

    // ── Pet AI tick ──────────────────────────────────────────────────────

    _tickPet(delta) {
        if (!this.pet || !this.pet.alive) return;
        this.petTickTimer += delta;
        if (this.petTickTimer < MONSTER_TICK_MS) return;
        this.petTickTimer = 0;

        // Pet attacks adjacent monster first
        const hit = this.pet.tryAttack(this.monsters);
        if (hit) {
            const result = hit.monster.takeDamage(hit.damage);
            this._floatingText(hit.monster.gridX, hit.monster.gridY, `-${hit.damage}`, '#ffaadd');
            if (result === 'enraged') this.combat._onBossEnraged(hit.monster);
            else if (result === true)  this.combat._onMonsterKilled(hit.monster);
            return;
        }

        // Otherwise follow hero
        this.pet.followHero(this.hero, this.maze, this.tileW, this.tileH, this.monsters);
    }

    // ── Level up ──────────────────────────────────────────────────────────────

    _onLevelUp() {
        Audio.playLevelUp();
        const available = getAvailableSkills(this.hero);
        if (available.length === 0) return;
        this.scene.launch('SkillScene', { heroRef: this.hero });
    }

    _onSkillPicked(skill) {
        this._floatingText(this.hero.gridX, this.hero.gridY, `${skill.name}!`, '#f5e642');
        const newSynergies = applySynergies(this.hero);
        for (const syn of newSynergies) {
            if (!(this._shownSynergies || []).includes(syn.id)) {
                this._floatingText(this.hero.gridX, this.hero.gridY - 1, `✦ ${syn.name}!`, '#' + syn.color.toString(16).padStart(6, '0'));
            }
        }
        this._shownSynergies = newSynergies.map(s => s.id);
        const ui = this.scene.get('UIScene');
        if (ui && ui.sys.isActive()) ui.refresh();
    }

    /** Hero stats with pet data attached for save/load */
    _getFullStats() {
        const stats = this._getFullStats();
        if (this.pet) stats.pet = this.pet.serialize();
        return stats;
    }

    // ── World progression ─────────────────────────────────────────────────────

    _checkExit() {
        if (this.boss && this.boss.alive) {
            this._showMessage('Beseir bossen først!', '#ff4466');
            return;
        }
        Audio.playExit();
        this._stopOverlayScenes();
        SaveManager.save(this.worldNum + 1, this._getFullStats());
        const worldTime = Math.round((Date.now() - this._worldStartTime) / 1000);
        this.time.delayedCall(300, () => {
            this.scene.start('GameOverScene', {
                type: 'worldComplete', worldNum: this.worldNum,
                heroStats: this._getFullStats(), difficulty: this.difficulty,
                monstersKilled: this.monstersKilled,
                timeSeconds: worldTime
            });
        });
    }

    _heroDied() {
        if (this._dyingHandled) return;
        this._dyingHandled = true;
        this.hero.alive = false;
        Audio.playDeath();
        Audio.stopMusic();
        this._stopOverlayScenes();
        SaveManager.save(this.worldNum, this._getFullStats());
        const worldTime = Math.round((Date.now() - this._worldStartTime) / 1000);
        this.time.delayedCall(700, () => {
            this.scene.start('GameOverScene', {
                type: 'death', worldNum: this.worldNum,
                heroStats: this._getFullStats(), difficulty: this.difficulty,
                monstersKilled: this.monstersKilled,
                timeSeconds: worldTime
            });
        });
    }

    _stopOverlayScenes() {
        ['SkillScene', 'InventoryScene', 'MerchantScene', 'UIScene'].forEach(key => {
            if (this.scene.isActive(key) || this.scene.isVisible(key)) {
                this.scene.stop(key);
            }
        });
    }

    // ── Visual feedback ───────────────────────────────────────────────────────

    /** Floating damage/status text with scale-pop entry */
    _floatingText(gx, gy, msg, color, big = false) {
        const t = this.add.text(
            gx * TILE_SIZE + TILE_SIZE / 2,
            gy * TILE_SIZE - 2,
            msg, {
                fontSize: big ? '18px' : '13px',
                color, fontFamily: 'monospace',
                stroke: '#000000', strokeThickness: 3
            }
        ).setDepth(20).setOrigin(0.5, 1).setScale(0.4);

        this.tweens.add({
            targets: t, scaleX: big ? 1.3 : 1.1, scaleY: big ? 1.3 : 1.1,
            duration: 70, ease: 'Back.easeOut',
            onComplete: () => {
                this.tweens.add({
                    targets: t, y: t.y - 42, alpha: 0,
                    duration: 850, ease: 'Sine.easeIn',
                    onComplete: () => t.destroy()
                });
            }
        });
    }

    /** Burst of small colored sparks at a world-tile position */
    _hitSparks(gx, gy, color = 0xff4400) {
        const cx = gx * TILE_SIZE + TILE_SIZE / 2;
        const cy = gy * TILE_SIZE + TILE_SIZE / 2;
        const count = 6;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.8;
            const dist  = 8 + Math.random() * 12;
            const spark = this.add.graphics().setDepth(18);
            spark.fillStyle(color);
            spark.fillRect(-2, -2, 4, 4);
            spark.x = cx;
            spark.y = cy;
            this.tweens.add({
                targets: spark,
                x: cx + Math.cos(angle) * dist,
                y: cy + Math.sin(angle) * dist,
                alpha: 0, scaleX: 0.1, scaleY: 0.1,
                duration: 220 + Math.random() * 120,
                ease: 'Sine.easeOut',
                onComplete: () => { if (spark.scene) spark.destroy(); }
            });
        }
    }

    _showMessage(text, color = '#ffffff') {
        const t = this.add.text(
            this.hero.gridX * TILE_SIZE - 40, this.hero.gridY * TILE_SIZE - 36, text,
            { fontSize: '13px', color, fontFamily: 'monospace',
              stroke: '#000000', strokeThickness: 3 }
        ).setDepth(20);
        this.tweens.add({ targets: t, y: t.y - 24, alpha: 0, duration: 1800,
            onComplete: () => t.destroy() });
    }
}
