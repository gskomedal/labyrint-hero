// ─── Labyrint Hero – Entry point ──────────────────────────────────────────────

const config = {
    type:            Phaser.AUTO,
    width:           960,
    height:          640,
    backgroundColor: '#08060f',
    pixelArt:        true,
    roundPixels:     true,
    scene: [
        MenuScene,
        CharacterCreatorScene,
        GameScene,
        UIScene,
        SkillScene,
        InventoryScene,
        GameOverScene,
        SettingsScene
    ]
};

const game = new Phaser.Game(config);
