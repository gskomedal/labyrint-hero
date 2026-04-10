// ─── Labyrint Hero – Entry point ──────────────────────────────────────────────

const config = {
    type:            Phaser.AUTO,
    scale: {
        mode:       Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width:      1280,
        height:     800,
    },
    backgroundColor: '#08060f',
    roundPixels:     true,
    input: {
        activePointers: 3,
    },
    scene: [
        MenuScene,
        CharacterCreatorScene,
        GameScene,
        UIScene,
        SkillScene,
        InventoryScene,
        MerchantScene,
        LeaderboardScene,
        GameOverScene,
        SettingsScene,
        ElementBookScene,
        SmelteryScene,
        ChemLabScene
    ]
};

// Patch text factory to render at 2× resolution for sharper text
const _origText = Phaser.GameObjects.GameObjectFactory.prototype.text;
Phaser.GameObjects.GameObjectFactory.prototype.text = function (x, y, text, style) {
    const t = _origText.call(this, x, y, text, style);
    t.setResolution(2);
    return t;
};

const game = new Phaser.Game(config);
game.registry.set('isTouchDevice', ('ontouchstart' in window || navigator.maxTouchPoints > 0));
