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
    pixelArt:        true,
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

// Patch text factory for sharper text:
// 1) Render at 2× resolution so the source canvas has more detail
// 2) Switch texture to LINEAR filtering (pixelArt:true forces NEAREST,
//    which is great for sprites but makes text look blocky/blurry)
const _origText = Phaser.GameObjects.GameObjectFactory.prototype.text;
Phaser.GameObjects.GameObjectFactory.prototype.text = function (x, y, text, style) {
    const t = _origText.call(this, x, y, text, style);
    t.setResolution(2);
    if (t.texture && t.texture.setFilter) {
        t.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
    }
    return t;
};

const game = new Phaser.Game(config);
game.registry.set('isTouchDevice', ('ontouchstart' in window || navigator.maxTouchPoints > 0));
