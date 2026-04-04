// ─── Labyrint Hero – Entry point ──────────────────────────────────────────────

const config = {
    type:            Phaser.AUTO,
    scale: {
        mode:       Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width:      960,
        height:     640,
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
        ElementBookScene
    ]
};

const game = new Phaser.Game(config);
game.registry.set('isTouchDevice', ('ontouchstart' in window || navigator.maxTouchPoints > 0));
