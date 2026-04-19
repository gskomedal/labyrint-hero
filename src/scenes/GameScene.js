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
            case 'easy': return { hpMul: 0.50, atkMul: 0.60, trapCount: 0, xpMul: 1.30, trapDmgMul: 0.3 };
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
        this.maze   = this._gen.generate(this.worldNum);
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
        this.hero.worldNum = this.worldNum;
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

        // ── Technology effects on floor start ─────────────────────────────
        if (this.hero.techForceField) this.hero.techForceFieldHP = 15;
        if (this.hero.techEMP) this.hero.empCharges = Math.max(this.hero.empCharges || 0, 1);
        if (this.hero.techLaserTurret) this.hero.laserTurretCharges = Math.max(this.hero.laserTurretCharges || 0, 2);
        this.laserTurrets = [];
        this.teleporterNodes = [];

        // ── Pet companion ────────────────────────────────────────────────────
        this.pet = null;
        if (this.heroStats && this.heroStats.pet) {
            if (this.heroStats.pet.alive !== false) {
                this.pet = Pet.deserialize(this.heroStats.pet, this, this.hero.gridX, this.hero.gridY);
                if (this.pet && this.pet.alive) {
                    this.pet.revive(this.hero.gridX, this.hero.gridY);
                }
            }
            // Dead pet: leave this.pet null so a new egg can spawn
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

        // ── EventBus listeners (decoupled scene communication) ───────────────
        EventBus.off(); // clear previous world listeners
        EventBus.on('floatingText', (d) => this._floatingText(d.gx, d.gy, d.msg, d.color, d.big));
        EventBus.on('showMessage', (d) => this._showMessage(d.text, d.color));
        EventBus.on('spawnItem', (d) => this.itemSpawner.spawnItemAt(d.gx, d.gy, d.item));

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
        const blocked = this.scene.isActive('SkillScene') || this.scene.isActive('InventoryScene') || this.scene.isActive('MerchantScene') || this.scene.isActive('ElementBookScene') || this.scene.isActive('SmelteryScene') || this.scene.isActive('ChemLabScene') || this.scene.isActive('AcceleratorScene');

        if (!blocked) {
            this.inputHandler.handleInput(delta);
            this.combat.handleAttack();
            this.combat.handleBow();
            this.combat.handleUseItem();
            this.combat.handleEMP();
            this.combat.handlePlaceTurret();
            this.combat.handleTeleporter();
            this.inputHandler.handleZoom();

            const touchInv = this.game.registry.get('touch_inventory');
            if (touchInv) this.game.registry.set('touch_inventory', false);
            if (Phaser.Input.Keyboard.JustDown(this.eKey) || touchInv) {
                this.scene.launch('InventoryScene');
            }
            const touchBook = this.game.registry.get('touch_elementbook');
            if (touchBook) this.game.registry.set('touch_elementbook', false);
            if ((Phaser.Input.Keyboard.JustDown(this.elementBookKey) || touchBook) && !this.scene.isActive('ElementBookScene')) {
                this.scene.launch('ElementBookScene', { heroRef: this.hero });
            }
            const touchSmelt = this.game.registry.get('touch_smeltery');
            if (touchSmelt) this.game.registry.set('touch_smeltery', false);
            if ((Phaser.Input.Keyboard.JustDown(this.smelteryKey) || touchSmelt) && !this.scene.isActive('SmelteryScene') && this._isInCampRoom()) {
                this.scene.launch('SmelteryScene', { heroRef: this.hero });
            }

            const touchChem = this.game.registry.get('touch_chemlab');
            if (touchChem) this.game.registry.set('touch_chemlab', false);
            if ((Phaser.Input.Keyboard.JustDown(this.chemLabKey) || touchChem) && !this.scene.isActive('ChemLabScene') && this._isInChemLab()) {
                if (this.hero.chemLabUnlocked) {
                    this.scene.launch('ChemLabScene', { heroRef: this.hero, worldNum: this.worldNum });
                } else {
                    this._showMessage('Beseir en soneboss for å låse opp laboratoriet!', '#33dd88');
                }
            }

            // Particle accelerator (P key)
            const touchAccel = this.game.registry.get('touch_accelerator');
            if (touchAccel) this.game.registry.set('touch_accelerator', false);
            if ((Phaser.Input.Keyboard.JustDown(this.acceleratorKey) || touchAccel) && !this.scene.isActive('AcceleratorScene') && this._isInAccelerator()) {
                this.scene.launch('AcceleratorScene', { heroRef: this.hero, worldNum: this.worldNum });
            }

            const touchSkill = this.game.registry.get('touch_skilltree');
            if (touchSkill) this.game.registry.set('touch_skilltree', false);
            if ((Phaser.Input.Keyboard.JustDown(this.skillTreeKey) || touchSkill) && !this.scene.isActive('SkillScene')) {
                this.scene.launch('SkillScene', { heroRef: this.hero, viewOnly: true });
            }

            // Auto-open prompts for special rooms
            this._checkCampRoom();
            this._checkChemLab();
            this._checkAccelerator();

            this.monsterMgr.tickMonsters(delta);
            this._tickPet(delta);
        }

        const ui = this.scene.get('UIScene');
        if (ui && ui.sys.isActive()) ui.refresh();
    }

    // ── Camp Room helpers ────────────────────────────────────────────────────

    _isInCampRoom() {
        if (!this._gen || !this._gen.specialRooms) return false;
        const hx = this.hero.gridX, hy = this.hero.gridY;
        return this._gen.specialRooms.some(room =>
            room.type === 'camp_room' && room.tiles.some(t => t.x === hx && t.y === hy)
        );
    }

    _checkCampRoom() {
        if (!this._campRoomShown && this._isInCampRoom()) {
            this._campRoomShown = true;
            this._showMessage('Leirplass! Trykk V for å smelte og smi.', '#ff7722');
            // Unlock metallurg skill path on first camp room visit
            if (!this.hero.metallurgistUnlocked) {
                this.hero.metallurgistUnlocked = true;
                this._floatingText(this.hero.gridX, this.hero.gridY - 1, 'Metallurg-stien er ulåst!', '#ff7722');
            }
        } else if (!this._isInCampRoom()) {
            this._campRoomShown = false;
        }
    }

    _isInChemLab() {
        if (!this._gen || !this._gen.specialRooms) return false;
        const hx = this.hero.gridX, hy = this.hero.gridY;
        return this._gen.specialRooms.some(room =>
            room.type === 'chem_lab' && room.tiles.some(t => t.x === hx && t.y === hy)
        );
    }

    _checkChemLab() {
        if (!this._chemLabShown && this._isInChemLab()) {
            this._chemLabShown = true;
            // Unlock kjemiker skill path on first chem lab visit
            if (!this.hero.chemistUnlocked) {
                this.hero.chemistUnlocked = true;
                this._floatingText(this.hero.gridX, this.hero.gridY - 1, 'Kjemiker-stien er ulåst!', '#33dd88');
            }
            if (this.hero.chemLabUnlocked) {
                this._showMessage('Kjemisk lab! Trykk C for å lage kjemikalier.', '#33dd88');
            } else {
                this._showMessage('Kjemisk lab funnet! Beseir en soneboss for å aktivere.', '#556644');
            }
        } else if (!this._isInChemLab()) {
            this._chemLabShown = false;
        }
    }

    // ── Particle Accelerator ─────────────────────────────────────────────────

    _isInAccelerator() {
        if (!this._gen || !this._gen.specialRooms) return false;
        const hx = this.hero.gridX, hy = this.hero.gridY;
        return this._gen.specialRooms.some(room =>
            room.type === 'accelerator' && room.tiles.some(t => t.x === hx && t.y === hy)
        );
    }

    _checkAccelerator() {
        if (!this._acceleratorShown && this._isInAccelerator()) {
            this._acceleratorShown = true;
            if (!this.hero.acceleratorUnlocked) {
                this.hero.acceleratorUnlocked = true;
                this._floatingText(this.hero.gridX, this.hero.gridY - 1, 'Fysiker-stien er ulåst!', '#8866ff');
            }
            this._showMessage('Partikkelakselerator! Trykk P for å syntetisere grunnstoffer.', '#8866ff');
        } else if (!this._isInAccelerator()) {
            this._acceleratorShown = false;
        }
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
        const stats = this.hero.getStats();
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

        // Mark zone as completed if this was the last world of the zone
        if (typeof isZoneBossWorld !== 'undefined' && isZoneBossWorld(this.worldNum)) {
            const zone = getZone(this.worldNum);
            if (zone && !this.hero.completedZones.includes(zone.id)) {
                this.hero.completedZones.push(zone.id);
                this._floatingText(this.hero.gridX, this.hero.gridY, `Sone fullført: ${zone.name}!`, '#ffcc00');
            }
        }

        const worldTime = Math.round((Date.now() - this._worldStartTime) / 1000);
        this.hero.totalPlayTime = (this.hero.totalPlayTime || 0) + worldTime;
        SaveManager.save(this.worldNum + 1, this._getFullStats());
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
        const worldTime = Math.round((Date.now() - this._worldStartTime) / 1000);
        this.hero.totalPlayTime = (this.hero.totalPlayTime || 0) + worldTime;
        SaveManager.save(this.worldNum, this._getFullStats());
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
