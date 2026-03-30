# Labyrint Hero

Et 2D topp-ned labyrint-RPG i nettleseren. Naviger prosedyregenererte labyrinter, slåss mot monstre og bosser, samle utstyr og evner, og gå videre til neste verden. Inspirert av roguelikes og klassiske dungeon crawlers.

## Funksjoner

- Prosedyregenererte labyrinter med 5 tematiske verdener (skog, grotte, is, vulkan, tempel)
- Rute-for-rute bevegelse med nærkamp og bueangrep
- 4 spillbare raser med unike bonuser
- 12 passive evner fordelt på 4 spesialiseringsveier + kryssvei-synergier
- 27 gjenstander: våpen, rustning, forbruksgjenstander og verktøy med sjeldenhetsystem
- Bosser med fase 2-mekanikk
- Kjøpmann-NPC, kister, feller, låste dører og hemmelige passasjer
- Prosedyregrafikk og prosedyremusikk – ingen eksterne assets
- Lagring via localStorage, ledertavle med tidssporing
- Tre vanskelighetsgrader: lett, normal, vanskelig

## Hurtigstart

Åpne `index.html` i en nettleser – ingen bygging eller installasjon nødvendig.

For balansetesting, bruk `simulator.html`.

## Teknologi

- **Phaser 3** (v3.60.0) via CDN
- Vanilla JavaScript – ingen npm, ingen TypeScript, ingen byggverktøy
- Prosedyregrafikk via Phaser Graphics API
- Prosedyrelyd via Web Audio API

## Mappestruktur
```
src/
  constants.js                – konstanter og verdens-temaer
  maze.js                     – labyrintgenerator (DFS + ekstra passasjer)
  main.js                     – Phaser-oppstart
  utils/
    SaveManager.js            – localStorage-lagring
    Leaderboard.js            – ledertavle
  data/
    skills.js                 – 12 evner + synergier
    items.js                  – 27 gjenstander + sjeldenhet
  graphics/
    CharacterSprite.js        – prosedyrekaraktertegning
  systems/
    Inventory.js              – utstyr + ryggsekk
    AudioManager.js           – prosedyremusikk og SFX
    TouchControls.js          – mobilkontroller
    MapRenderer.js            – kartrendering, tåke, portal
    ItemSpawner.js            – kister, verktøy, gjenstander, kjøpmann
    MonsterManager.js         – monsterplassering, AI, statuseffekter
    CombatManager.js          – kamp, bue, skadeberegning
    InputHandler.js           – tastatur/touch, bevegelse, zoom
  entities/
    Hero.js                   – spillerkarakter
    Monster.js                – fiender med unike sprites
  scenes/
    MenuScene.js              – hovedmeny
    CharacterCreatorScene.js  – karakterskaper
    GameScene.js              – orkestrator-scene
    UIScene.js                – HUD-overlay
    SkillScene.js             – evnevalg ved nivå-opp
    InventoryScene.js         – inventar-overlay
    MerchantScene.js          – kjøpmann-overlay
    SettingsScene.js          – lydinnstillinger
    LeaderboardScene.js       – ledertavle
    GameOverScene.js          – død/seier-skjerm
docs/
  GDD.md                      – Game Design Document
  CHANGELOG.md                – endringslogg
```

## Dokumentasjon

- [Game Design Document](docs/GDD.md) – Full spillbeskrivelse og regler
- [Endringslogg](docs/CHANGELOG.md) – Versjonshistorikk
