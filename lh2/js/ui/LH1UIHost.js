// ─── Labyrint Hero 2 – LH1 UI host ───────────────────────────────────────────
// Runs LH1's original Phaser UI scenes (skill tree, element book, mineral
// wiki) inside LH2: a second, transparent Phaser instance lives in an overlay
// div above the Three.js canvas and is booted lazily on first use. The scenes
// are reused UNCHANGED from src/scenes/ – they only need a hero object with
// the fields they read (Hero2 provides them).

const LH1UIHost = {
    game: null,
    _container: null,
    _activeKey: null,

    _boot() {
        if (this.game) return;

        this._container = document.getElementById('lh1-ui');

        // Same text-resolution patch as LH1's main.js (sharper text)
        if (!Phaser.GameObjects.GameObjectFactory.prototype._lh2TextPatched) {
            const origText = Phaser.GameObjects.GameObjectFactory.prototype.text;
            Phaser.GameObjects.GameObjectFactory.prototype.text = function (x, y, str, style) {
                const t = origText.call(this, x, y, str, style);
                t.setResolution(2);
                return t;
            };
            Phaser.GameObjects.GameObjectFactory.prototype._lh2TextPatched = true;
        }

        this.game = new Phaser.Game({
            type: Phaser.AUTO,
            parent: 'lh1-ui',
            transparent: true,
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH,
                width: 1280,
                height: 800,
            },
            roundPixels: true,
            input: { activePointers: 3 },
            // Scenes added manually below so none of them auto-starts
        });

        this._ready = false;
        this.game.events.once(Phaser.Core.Events.READY, () => { this._ready = true; });

        this.game.scene.add('SkillScene', SkillScene, false);
        this.game.scene.add('ElementBookScene', ElementBookScene, false);
        this.game.scene.add('MineralWikiScene', MineralWikiScene, false);
        this.game.scene.add('SmelteryScene', SmelteryScene, false);
        this.game.scene.add('ChemLabScene', ChemLabScene, false);
        this.game.scene.add('InventoryScene', InventoryScene, false);
        this.game.scene.add('MerchantScene', MerchantScene, false);
        this.game.scene.add('CharacterCreatorScene', CharacterCreatorScene, false);

        // InventoryScene looks up this.scene.get('GameScene') for hero + pet,
        // and CharacterCreatorScene exits via scene.start('GameScene', data).
        // A dummy scene with that key carries the refs and intercepts the
        // creator's result instead of running a Phaser game world.
        this.game.scene.add('GameScene', class extends Phaser.Scene {
            constructor() { super({ key: 'GameScene' }); }
            init(data) {
                if (data && data.race && LH1UIHost.onCharacterCreated) {
                    LH1UIHost.onCharacterCreated(data);
                }
            }
            create() { this.scene.stop(); }
        }, false);

        // Skill picks from LH1's SkillScene: spend a point, sync LH2 effects
        this.game.events.on('skillPicked', () => {
            const hero = LH2Main.hero;
            hero.skillPoints = Math.max(0, hero.skillPoints - 1);
            hero.replaySkills();
            EventBus.emit('lh2SkillsChanged');
            LH2Main.save();
        });
    },

    /** Open one of the hosted LH1 scenes. */
    open(key, data) {
        if (LH2Main.uiOpen) return;
        this._boot();

        LH2Main.uiOpen = true;
        if (LH2Main.cameraRig) LH2Main.cameraRig.unlock();
        this._container.classList.add('active');
        this._activeKey = key;

        let attempts = 0;
        const doStart = () => {
            // Keep the GameScene shim's hero/pet refs current
            const gsShim = this.game.scene.getScene('GameScene');
            if (gsShim) { gsShim.hero = LH2Main.hero; gsShim.pet = null; }

            try {
                this.game.scene.start(key, data);
            } catch (err) {
                // The scene manager can still be processing the previous
                // scene's shutdown queue – retry shortly
                if (++attempts < 10) { setTimeout(doStart, 80); return; }
                console.warn('LH1UIHost: could not start', key, err);
                this._onClosed();
                return;
            }
            this.game.scene.getScene(key).events.once('shutdown', () => this._onClosed());
        };
        if (this._ready) doStart();
        else this.game.events.once(Phaser.Core.Events.READY, doStart);
    },

    _onClosed() {
        // A hosted scene may have launched another (e.g. Elementbok from the
        // inventory) – stay open and track that one instead
        const HOSTED = ['SkillScene', 'ElementBookScene', 'MineralWikiScene',
            'SmelteryScene', 'ChemLabScene', 'InventoryScene',
            'MerchantScene', 'CharacterCreatorScene'];
        const stillActive = HOSTED.find(k => this.game.scene.isActive(k));
        if (stillActive) {
            this._activeKey = stillActive;
            this.game.scene.getScene(stillActive).events.once('shutdown', () => this._onClosed());
            return;
        }

        this._container.classList.remove('active');
        this._activeKey = null;
        LH2Main.uiOpen = false;
        EventBus.emit('lh2InventoryChanged'); // refresh HUD counters

        // More points to spend? Re-open the picker (LH1: one pick per point)
        const hero = LH2Main.hero;
        if (this._justPicked && hero.skillPoints > 0) {
            this._justPicked = false;
            setTimeout(() => this.open('SkillScene', { heroRef: hero, viewOnly: false }), 50);
        }
    },

    /** K key: pick mode when points are available, otherwise browse mode. */
    openSkillTree(hero) {
        const pick = hero.skillPoints > 0;
        this._justPicked = pick;
        this.open('SkillScene', { heroRef: hero, viewOnly: !pick });
    },
};
