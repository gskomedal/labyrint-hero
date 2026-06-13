// ─── Labyrint Hero 2 – Main ──────────────────────────────────────────────────
// Orchestrator: renderer, areas (surface island + caves), input, game loop,
// area transitions and autosave. Started by the inline module script in
// index.html after it has assigned window.THREE.

const LH2Main = {
    uiOpen: false,
    skipSaveOnUnload: false,

    start() {
        // ── Renderer & scene ─────────────────────────────────────────────────
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('game-container').appendChild(this.renderer.domElement);

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1100);

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // ── Hero (load save if present) ──────────────────────────────────────
        const saved = SaveManager2.load();
        this.hero = saved ? Hero2.deserialize(saved.hero) : new Hero2();
        this.hero.applyScienceEffects();

        // ── Build areas ──────────────────────────────────────────────────────
        this.areas = {};
        this._buildSurface();
        Object.assign(this.areas, CaveWorld.buildAll((id, from) => this.switchArea(id, from)));
        CaveWorld.addSurfaceEntrances(this.areas.surface, (id, from) => this.switchArea(id, from));
        for (const id in this.areas) this.scene.add(this.areas[id].group);

        // Restore node depletion
        if (saved && saved.depletedNodes) this._restoreNodes(saved.depletedNodes);

        // ── Player & camera ──────────────────────────────────────────────────
        this.player = new Player();
        this.scene.add(this.player.group);
        this.cameraRig = new CameraRig(this.camera, this.renderer.domElement);

        // ── Systems & UI ─────────────────────────────────────────────────────
        LH2Mining.init(this.hero, this.player);
        Creatures.init(this.hero, this.player);
        this.interactions = new Interactions(this.player, this.cameraRig);

        // Wildlife and monsters (transient, like LH1's per-world spawns)
        {
            const crand = (() => {
                const n = makeNoise2D(LH2.SEED + 777);
                let i = 0;
                return () => (n(i++ * 0.7919, i * 1.317) + 1) / 2;
            })();
            Creatures.populateSurface(this.areas.surface, crand);
            for (const zone of LH2.CAVE_ZONES) {
                Creatures.populateCave(this.areas[zone.id], crand);
            }
        }
        this.hud = new HUD(this.hero);
        this.minimap = new Minimap(this.hero, this.player, this.cameraRig);

        // Reused LH1 Phaser scenes: Tab = inventar, K = skilltre,
        // B = grunnstoffbok, V = mineralwiki (smelteri/kjemilab via stasjonene)
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Tab') e.preventDefault();
            if (LH2Main.uiOpen || LH2Mining.isActive()) return;
            if (e.code === 'KeyK') LH1UIHost.openSkillTree(this.hero);
            else if (e.code === 'KeyB') LH1UIHost.open('ElementBookScene', { heroRef: this.hero });
            else if (e.code === 'KeyV') LH1UIHost.open('MineralWikiScene', { heroRef: this.hero, fromMenu: false });
            else if (e.code === 'Tab') LH1UIHost.open('InventoryScene', {});
        });

        // Fysikk XP: identifying newly discovered elements
        EventBus.on('discovery', (d) => {
            if (d.type !== 'element') return;
            const elem = ELEMENTS[d.iconText];
            if (elem) this.hero.sciences.addXP('fysikk', 5 * elem.tier);
        });

        // ── Spawn ────────────────────────────────────────────────────────────
        const startArea = this.areas[this.hero.area] ? this.hero.area : 'surface';
        this._activateArea(startArea);
        if (saved && saved.hero && saved.hero.pos && saved.hero.pos.y !== undefined) {
            const p = saved.hero.pos;
            this.player.setPosition(p.x, Math.max(p.y, this.activeArea.getHeightAt(p.x, p.z)), p.z);
        } else {
            const s = this.activeArea.spawn;
            this.player.setPosition(s.x, this.activeArea.getHeightAt(s.x, s.z), s.z);
        }

        // ── Input ────────────────────────────────────────────────────────────
        this.input = { forward: false, back: false, left: false, right: false, sprint: false, jump: false };
        const keymap = {
            KeyW: 'forward', ArrowUp: 'forward',
            KeyS: 'back', ArrowDown: 'back',
            KeyA: 'left', ArrowLeft: 'left',
            KeyD: 'right', ArrowRight: 'right',
            ShiftLeft: 'sprint', ShiftRight: 'sprint',
            Space: 'jump',
        };
        window.addEventListener('keydown', (e) => {
            const k = keymap[e.code];
            if (k) { this.input[k] = true; if (e.code === 'Space') e.preventDefault(); }
        });
        window.addEventListener('keyup', (e) => {
            const k = keymap[e.code];
            if (k) this.input[k] = false;
        });

        // ── Autosave ─────────────────────────────────────────────────────────
        setInterval(() => this.save(), 30000);
        window.addEventListener('beforeunload', () => {
            if (!this.skipSaveOnUnload) this.save();
        });

        // The 3D figure mirrors the hero's appearance and race
        this.player.applyAppearance(this.hero);

        // Pet companion (LH1 PET_TYPES). New heroes get a random one.
        if (!this.hero.petTypeId) {
            this.hero.petTypeId = ['fox', 'cat', 'dragon', 'owl'][Math.floor(Math.random() * 4)];
        }
        this._spawnPet();
        if (this.pet) this.pet.enterArea(this.activeArea, this.player.pos);

        // Background music (Grieg, procedural) – follows the area's zone theme
        LH2Audio.init();
        LH2Audio.playForArea(this.hero.area);

        // SFX on key events (reuses LH1's procedural sounds)
        EventBus.on('lh2LevelUp', () => LH2Audio.sfx('playLevelUp'));
        EventBus.on('discovery', () => LH2Audio.sfx('playDiscovery'));

        // First start: LH1's character creator picks race, looks and bonus
        LH1UIHost.onCharacterCreated = (data) => {
            this.hero.applyCharacter(data);
            this.player.applyAppearance(this.hero);
            EventBus.emit('lh2Toast', { text: `Velkommen, ${this.hero.heroName}!`, cls: 'levelup' });
            EventBus.emit('lh2InventoryChanged');
            this.save();
        };
        if (!saved) {
            setTimeout(() => LH1UIHost.open('CharacterCreatorScene', { difficulty: 'normal' }), 400);
        }

        // Debug handle (hobby-project style)
        window.lh2 = this;

        // ── Loop ─────────────────────────────────────────────────────────────
        this.clock = new THREE.Clock();
        this.renderer.setAnimationLoop(() => this._tick());
    },

    _buildSurface() {
        const noise = makeNoise2D(LH2.SEED);
        const terrain = new Terrain(noise);
        this.terrain = terrain;

        const surface = {
            id: 'surface',
            name: 'Overflatelag',
            tier: 1,
            group: new THREE.Group(),
            interactables: [],
            nodes: [],
            minWalkHeight: LH2.MIN_WALK_HEIGHT,
            fogColor: 0xbfd8ee,
            getHeightAt: (x, z) => terrain.getHeightAt(x, z),
            getSlopeAt: (x, z) => terrain.getSlopeAt(x, z),
            findSpot: (rand, opts) => terrain.findSpot(rand, opts),
        };
        surface.group.add(terrain.group);
        surface.group.add(terrain.buildSkyDome());
        surface.group.visible = false;

        // Lights: sun + sky, with soft shadows across the island
        const sun = new THREE.DirectionalLight(0xfff2dd, 2.6);
        sun.position.set(120, 180, 80);
        sun.castShadow = true;
        sun.shadow.mapSize.set(2048, 2048);
        sun.shadow.camera.left = -220;
        sun.shadow.camera.right = 220;
        sun.shadow.camera.top = 220;
        sun.shadow.camera.bottom = -220;
        sun.shadow.camera.far = 500;
        sun.shadow.bias = -0.0006;
        const hemi = new THREE.HemisphereLight(0xbcd8ff, 0x55663f, 1.4);
        surface.group.add(sun, hemi);

        // Visible sun disc
        const sunDisc = new THREE.Mesh(
            new THREE.SphereGeometry(9, 12, 10),
            new THREE.MeshBasicMaterial({ color: 0xfff4cc, fog: false }),
        );
        sunDisc.position.set(190, 230, 130);
        sunDisc.userData.noShadow = true;
        surface.group.add(sunDisc);

        // Seeded placement PRNG
        const rand = (() => {
            const n = makeNoise2D(LH2.SEED + 99);
            let i = 0;
            return () => (n(i++ * 0.7919, i * 1.317) + 1) / 2;
        })();

        // Spawn: gentle grassland near the centre (not a mountain top)
        let spawn = { x: 0, z: 0 };
        let bestScore = Infinity;
        for (let t = 0; t < 40; t++) {
            const x = (rand() - 0.5) * 80, z = (rand() - 0.5) * 80;
            const h = surface.getHeightAt(x, z);
            if (h < 2.5) continue;
            const score = Math.abs(h - 7) + surface.getSlopeAt(x, z) * 8;
            if (score < bestScore) { bestScore = score; spawn = { x, z }; }
        }
        surface.spawn = spawn;

        // Camp: smelter + lab table near spawn
        const sy = surface.getHeightAt(spawn.x + 5, spawn.z);
        Decorations.addSmelter(surface, { x: spawn.x + 5, y: sy, z: spawn.z },
            () => LH1UIHost.open('SmelteryScene', { heroRef: this.hero }));
        const ly = surface.getHeightAt(spawn.x + 8, spawn.z + 3);
        Decorations.addLabTable(surface, { x: spawn.x + 8, y: ly, z: spawn.z + 3 },
            () => LH1UIHost.open('ChemLabScene', { heroRef: this.hero, worldNum: 1 }));

        // Ancient stone labyrinth ruin with better minerals in its dead ends
        let ruinSpot = surface.findSpot(rand, { minH: 3, maxH: 14, maxSlope: 0.25, minRadius: 55, maxRadius: 110 })
            || { x: -70, z: 60 };
        const maze = MazeStructure.add(surface, {
            cx: ruinSpot.x, cz: ruinSpot.z,
            cellW: 8, cellH: 6,
            rand,
            wallColor: 0x8a857c,
        });
        OreDeposits.populateAt(surface, [maze.centerPos, ...maze.rewardSpots], rand, 'surface:maze');

        // Merchant stall by the camp (buys/sells via LH1's MerchantScene)
        const my = surface.getHeightAt(spawn.x + 2, spawn.z + 7);
        Decorations.addMerchant(surface, { x: spawn.x + 2, y: my, z: spawn.z + 7 },
            () => this._openMerchant());

        // Nature & resources (LH1-like scarcity)
        Decorations.addTrees(surface, rand, 26, () => LH2Mining.chopTree());
        Decorations.addBoulders(surface, rand, 30);
        Decorations.addBushes(surface, rand, 45);
        Decorations.addFlowers(surface, rand, 35);
        Decorations.addGrass(surface, rand, 380);
        Decorations.addClouds(surface, rand, 9);
        OreDeposits.populate(surface, rand, LH2.SURFACE_ORE_NODES);
        OreDeposits.addElementNodes(surface, rand);

        // Everything on the surface throws/receives shadows except water,
        // the sky dome and the sun disc
        surface.group.traverse(obj => {
            if (!obj.isMesh || obj.userData.noShadow) return;
            obj.receiveShadow = true;
            if (obj.geometry && obj.geometry.type !== 'PlaneGeometry'
                && obj.geometry.type !== 'SphereGeometry') {
                obj.castShadow = true;
            }
        });

        this.areas.surface = surface;
    },

    // ── Merchant (LH1's MerchantScene with a slim GameScene stand-in) ────────

    _openMerchant() {
        if (!this._merchantStock || this._merchantStock.length === 0) {
            this._merchantStock = this._makeMerchantStock();
        }
        LH1UIHost.open('MerchantScene', {
            gameScene: {
                hero: this.hero,
                worldNum: 1,
                itemSpawner: {
                    // LH1's pricing formula (ItemSpawner._itemPrice), simplified
                    _itemPrice: (item, wn) => {
                        let base = 20;
                        if (item.type === 'consumable') base = 12;
                        if (item.type === 'tool') base = 8;
                        if (item.type === 'mineral') return Math.round((item.tier || 1) * 15 * (1 + wn * 0.08));
                        if (item.type === 'fuel') return 5 + (FUEL_DEFS[item.id]?.energyValue || 3) * 3;
                        const tierMul = (item.tier || 1) * 10;
                        return Math.round((base + tierMul) * (1 + wn * 0.10));
                    },
                },
            },
            stock: this._merchantStock,
        });
    },

    _makeMerchantStock() {
        const stock = [];
        const price = (item) => {
            if (item.type === 'mineral') return Math.round((item.tier || 1) * 15 * 1.08);
            if (item.type === 'fuel') return 5 + (FUEL_DEFS[item.id]?.energyValue || 3) * 3;
            const base = item.type === 'consumable' ? 12 : 20;
            return Math.round((base + (item.tier || 1) * 10) * 1.1);
        };
        const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

        const consumables = Object.values(ITEM_DEFS).filter(i => i.type === 'consumable' && (i.tier || 1) <= 2);
        for (let i = 0; i < 2 && consumables.length; i++) {
            const item = pick(consumables);
            stock.push({ item, price: price(item) });
        }
        const weapons = Object.values(ITEM_DEFS).filter(i => i.type === 'weapon' && (i.tier || 1) <= 2);
        if (weapons.length) { const w = pick(weapons); stock.push({ item: w, price: price(w) }); }
        const armors = Object.values(ITEM_DEFS).filter(i => i.type === 'armor' && (i.tier || 1) <= 2);
        if (armors.length) { const a = pick(armors); stock.push({ item: a, price: price(a) }); }

        const fuelDef = FUEL_DEFS[pick(['wood', 'charcoal', 'coal'])];
        stock.push({
            item: { id: fuelDef.id, name: fuelDef.name, type: 'fuel', tier: fuelDef.tier || 1, color: fuelDef.color, desc: fuelDef.desc, count: 3 },
            price: 5 + fuelDef.energyValue * 3,
        });
        const minerals = Object.values(MINERAL_DEFS).filter(m => m.tier <= 2);
        const mineral = pick(minerals);
        stock.push({ item: { ...mineral, count: 1 }, price: price(mineral) });

        return stock;
    },

    // ── Pet ──────────────────────────────────────────────────────────────────

    _spawnPet() {
        if (!this.hero.petTypeId) { this.pet = null; return; }
        this.pet = new Pet(this.hero.petTypeId, this.hero);
    },

    // ── Area switching ───────────────────────────────────────────────────────

    _activateArea(id) {
        if (this.activeArea) this.activeArea.group.visible = false;
        this.activeArea = this.areas[id];
        this.activeArea.group.visible = true;
        this.hero.area = id;
        this.interactions.setArea(this.activeArea);
        // The lantern lights the tunnels; daylight covers the surface
        this.player.lantern.intensity = id === 'surface' ? 0 : 55;
        // Pet follows the hero between areas
        if (this.pet) this.pet.enterArea(this.activeArea, this.player ? this.player.pos : this.activeArea.spawn);
        if (typeof LH2Audio !== 'undefined') LH2Audio.playForArea(id);

        if (id === 'surface') {
            this.scene.background = new THREE.Color(0x87b5e8);
            this.scene.fog = new THREE.Fog(0xbfd8ee, 120, 420);
        } else {
            this.scene.background = new THREE.Color(this.activeArea.fogColor).multiplyScalar(0.4);
            this.scene.fog = new THREE.Fog(this.activeArea.fogColor, 10, 62);
        }
    },

    /** Fade out, swap area, fade in. fromId: cave we're leaving (for surface re-entry position). */
    switchArea(targetId, fromId) {
        if (this._switching) return;
        this._switching = true;
        const fade = document.getElementById('fade-overlay');
        fade.style.opacity = 1;

        setTimeout(() => {
            this._activateArea(targetId);

            let pos;
            const zoneIdx = (id) => LH2.CAVE_ZONES.findIndex(z => z.id === id);
            if (targetId === 'surface' && fromId && this.areas.surface.entrancePos[fromId]) {
                // Coming up to the surface: appear by the mine entrance
                const e = this.areas.surface.entrancePos[fromId];
                pos = { x: e.x, z: e.z + 5 };
            } else if (fromId && zoneIdx(fromId) > zoneIdx(targetId) && this.activeArea.downPortalPos) {
                // Coming up from the zone below: appear by the down-portal
                const d = this.activeArea.downPortalPos;
                pos = { x: d.x, z: d.z + 3 };
            } else {
                pos = this.activeArea.spawn;
            }
            this.player.setPosition(pos.x, this.activeArea.getHeightAt(pos.x, pos.z), pos.z);

            EventBus.emit('lh2Toast', { text: this.activeArea.name, cls: 'levelup' });
            this.save();

            fade.style.opacity = 0;
            this._switching = false;
        }, 500);
    },

    // ── Damage & soft death (LH1-style: no progress lost) ───────────────────

    damageHero(amount, sourceName) {
        if (this._switching) return;
        this.hero.hearts = Math.max(0, this.hero.hearts - amount);
        EventBus.emit('lh2HeartsChanged');

        const flash = document.getElementById('damage-flash');
        flash.classList.add('active');
        setTimeout(() => flash.classList.remove('active'), 250);

        if (this.hero.hearts <= 0) {
            EventBus.emit('lh2Toast', { text: `Du besvimte (${sourceName})! Våkner ved leiren...`, cls: 'levelup' });
            this.hero.hearts = this.hero.maxHearts;
            const fade = document.getElementById('fade-overlay');
            this._switching = true;
            fade.style.opacity = 1;
            setTimeout(() => {
                this._activateArea('surface');
                const s = this.areas.surface.spawn;
                this.player.setPosition(s.x, this.areas.surface.getHeightAt(s.x, s.z), s.z);
                EventBus.emit('lh2HeartsChanged');
                this.save();
                fade.style.opacity = 0;
                this._switching = false;
            }, 600);
        }
    },

    // ── Save ─────────────────────────────────────────────────────────────────

    save() {
        this.hero.pos = {
            x: this.player.pos.x,
            y: this.player.pos.y,
            z: this.player.pos.z,
        };
        const depleted = [];
        for (const id in this.areas) {
            for (const node of this.areas[id].nodes) {
                if (node.charges < node.maxCharges) {
                    depleted.push({ id: node.id, charges: node.charges, respawnAt: node.respawnAt });
                }
            }
        }
        SaveManager2.save(this.hero, depleted);
    },

    _restoreNodes(depletedNodes) {
        const byId = {};
        for (const id in this.areas) {
            for (const node of this.areas[id].nodes) byId[node.id] = node;
        }
        for (const saved of depletedNodes) {
            const node = byId[saved.id];
            if (!node) continue;
            node.charges = saved.charges;
            node.respawnAt = saved.respawnAt || 0;
            if (node.charges <= 0) OreDeposits.setDepleted(node, true);
        }
    },

    // ── Loop ─────────────────────────────────────────────────────────────────

    _tick() {
        const dt = Math.min(0.05, this.clock.getDelta());
        const time = performance.now();

        if (!this.uiOpen && !this._switching) {
            this.player.update(dt, this.input, this.activeArea, this.cameraRig.yaw);
        }

        LH2Mining.update(dt, this.player.moving);
        this.interactions.update(this.player.pos);
        OreDeposits.update(this.activeArea, this.hero.sciences, this.player.pos, time);
        Decorations.update(this.activeArea, time, dt);
        FX.update(dt);
        if (this.activeArea.id === 'surface') this.terrain.animateWater(time);
        if (!this._switching) {
            Creatures.update(this.activeArea, dt, time);
            if (this.pet) this.pet.update(dt, this.activeArea, time, this.activeArea.creatures);
        }
        this.cameraRig.update(dt, this.player.pos, this.activeArea);
        this.minimap.update(this.activeArea, time);

        this.renderer.render(this.scene, this.camera);
    },
};
