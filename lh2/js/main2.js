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
        document.getElementById('game-container').appendChild(this.renderer.domElement);

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 600);

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
        this.inventoryUI = new InventoryUI(this.hero);
        this.smelterUI = new SmelterUI(this.hero);
        this.minimap = new Minimap(this.hero, this.player, this.cameraRig);

        // Reused LH1 Phaser scenes: K = skilltre, B = grunnstoffbok, V = wiki
        window.addEventListener('keydown', (e) => {
            if (LH2Main.uiOpen || LH2Mining.isActive()) return;
            if (e.code === 'KeyK') LH1UIHost.openSkillTree(this.hero);
            else if (e.code === 'KeyB') LH1UIHost.open('ElementBookScene', { heroRef: this.hero });
            else if (e.code === 'KeyV') LH1UIHost.open('MineralWikiScene', { heroRef: this.hero, fromMenu: false });
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

        // Debug handle (hobby-project style)
        window.lh2 = this;

        // ── Loop ─────────────────────────────────────────────────────────────
        this.clock = new THREE.Clock();
        this.renderer.setAnimationLoop(() => this._tick());
    },

    _buildSurface() {
        const noise = makeNoise2D(LH2.SEED);
        const terrain = new Terrain(noise);

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
        surface.group.visible = false;

        // Lights: sun + sky
        const sun = new THREE.DirectionalLight(0xfff2dd, 2.6);
        sun.position.set(120, 180, 80);
        const hemi = new THREE.HemisphereLight(0xbcd8ff, 0x55663f, 1.4);
        surface.group.add(sun, hemi);

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
        Decorations.addSmelter(surface, { x: spawn.x + 5, y: sy, z: spawn.z }, () => this.smelterUI.show('smelt'));
        const ly = surface.getHeightAt(spawn.x + 8, spawn.z + 3);
        Decorations.addLabTable(surface, { x: spawn.x + 8, y: ly, z: spawn.z + 3 }, () => this.smelterUI.show('chem'));

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

        // Nature & resources (LH1-like scarcity)
        Decorations.addTrees(surface, rand, 22, () => LH2Mining.chopTree());
        Decorations.addBoulders(surface, rand, 30);
        Decorations.addBushes(surface, rand, 45);
        Decorations.addFlowers(surface, rand, 35);
        OreDeposits.populate(surface, rand, LH2.SURFACE_ORE_NODES);
        OreDeposits.addElementNodes(surface, rand);

        this.areas.surface = surface;
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
        Decorations.update(this.activeArea, time);
        if (!this._switching) Creatures.update(this.activeArea, dt, time);
        this.cameraRig.update(dt, this.player.pos, this.activeArea);
        this.minimap.update(this.activeArea, time);

        this.renderer.render(this.scene, this.camera);
    },
};
