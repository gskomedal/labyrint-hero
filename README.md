# Labyrint Hero

Et 2D topp-ned labyrint-RPG i nettleseren. Naviger prosedyregenererte labyrinter, slåss mot monstre og bosser, samle utstyr og evner, og gå videre til neste verden. Inspirert av roguelikes og klassiske dungeon crawlers.

## Funksjoner

### Kjerne
- Prosedyregenererte labyrinter med 25 etasjer fordelt på 5 geologiske soner (overflatelag → jordens kjerne)
- Rute-for-rute bevegelse med nærkamp og bueangrep
- 4 spillbare raser med unike bonuser
- Bosser med fase 2-mekanikk, sonebosser vokter inngangen til nye soner
- Kjøpmann-NPC, kister, feller, låste dører og hemmelige passasjer
- Kjæledyr-system med 4 dyretyper (rev, katt, drage, ugle) – utstyrsplasser, ryggsekk og kampstøtte
- Tre vanskelighetsgrader, lagring via localStorage, lokal + global ledertavle

### Elements-modifikasjon (det periodiske system)
- **118 grunnstoffer** – alle fra hydrogen til oganesson, basert på ekte kjemi og geokjemi
- **50+ mineraler** å finne, smelte og utvinne grunnstoffer fra
- **Legeringer og smiing** – 13+ legeringer (bronse → Pt-Ir, skandium, wolframkarbid, fosforkrystall) smidd til våpen og rustning
- **Kjemisk laboratorium** – 20+ oppskrifter: potions, bomber, medisiner, syrer. Thermittladning, plasmakjerne, neodym-magnetbombe m.m.
- **Partikkelakselerator** – 28 realistiske transuranske synteseoppskrifter basert på ekte kjernefysikk (nøytronbombardering, alfa-bombardering, tungione-kollisjoner, Ca-48 varmfusjon)
- **Fisjon/fusjon-energi** – uran og thorium driver fisjon, hydrogen + litium driver D-T-fusjon
- **Endgame** – samle alle 118 grunnstoffer for «Guds periodiske system»-belønning

### Ferdighetssystem
- **6 skill-stier** med 3–4 tiers hver + kryssvei-synergier:
  - Kriger (kamp/forsvar), Villmarksjeger (syn/presisjon/kjæledyr)
  - Geolog (mineralfunn), Metallurg (smelting/smiing), Kjemiker (potions/bomber)
  - Fysiker (halvledere/fisjon/fusjon – endgame)
- 12 kryssvei-synergier inkludert Transmutasjon (3-sti) og Atomsmedja (fysiker+metallurg)

### Grafikk og lyd
- Prosedyregrafikk og prosedyremusikk – ingen eksterne assets
- Touch-støtte med D-pad og handlingsknapper for mobil/nettbrett

## Hurtigstart

Åpne `index.html` i en nettleser – ingen bygging eller installasjon nødvendig.

For balansetesting, bruk `simulator.html`.

## CI

GitHub Actions kjører automatisk på push og PR:
- **JS syntax check** – `node --check` på alle kildefiler
- **Browser tests** – headless Chromium via Playwright kjører `tests/test-runner.html`

## Teknologi

- **Phaser 3** (v3.60.0) via CDN
- Vanilla JavaScript – ingen npm, ingen TypeScript, ingen byggverktøy
- Prosedyregrafikk via Phaser Graphics API
- Prosedyrelyd via Web Audio API

## Mappestruktur
```
src/
  constants.js                – konstanter, soner og verdens-temaer
  maze.js                     – labyrintgenerator (DFS + spesialrom)
  main.js                     – Phaser-oppstart
  utils/
    SaveManager.js            – localStorage-lagring
    Leaderboard.js            – lokal ledertavle
    GlobalLeaderboard.js      – global ledertavle (Cloudflare Worker)
    UIHelper.js               – felles UI-hjelpefunksjoner
    EventBus.js               – event-system
  data/
    skills.js                 – 6 skill-stier + synergier
    elements.js               – 118 grunnstoffer + transuranske oppskrifter
    minerals.js               – 50+ mineraler og krystaller
    alloys.js                 – legeringer, brensel, utstyr, kjæledyr-utstyr
    molecules.js              – kjemiske oppskrifter (potions, bomber, medisin)
    items.js                  – våpen, rustning, forbruk + sjeldenhetssystem
    musicPieces.js            – prosedyremusikk-definisjoner
  graphics/
    CharacterSprite.js        – prosedyre-karaktertegning
    DetailedCharacterSprite.js – detaljert portrett
    SceneBackgrounds.js       – tematiske bakgrunner for overlay-scener
    ItemGraphics.js           – gjenstandsgrafikk
    MonsterGraphics.js        – monstergrafikk
  systems/
    ElementTracker.js         – element-samling og gruppebonuser
    SmeltingSystem.js         – smelting, legeringer, smiing, fisjon/fusjon-energi
    ChemistrySystem.js        – kjemisk syntese + transmutasjon
    Inventory.js              – utstyr + ryggsekk
    AudioManager.js           – prosedyremusikk og SFX
    TouchControls.js          – mobilkontroller
    MapRenderer.js            – kartrendering, tåke, mineral-syn
    ItemSpawner.js            – kister, mineraler, kjøpmann, kjæledyr-egg
    MonsterManager.js         – monsterplassering, AI, statuseffekter
    CombatManager.js          – kamp, bue, skadeberegning
    InputHandler.js           – tastatur/touch, bevegelse, zoom
  entities/
    Hero.js                   – spillerkarakter
    HeroCrafting.js           – crafting-state (elementer, metallurgi, kjemi, fysikk)
    Monster.js                – fiender med unike sprites
    Pet.js                    – kjæledyr-følgesvenn med utstyr og ryggsekk
  scenes/
    MenuScene.js              – hovedmeny
    CharacterCreatorScene.js  – karakterskaper med 4 raser
    GameScene.js              – orkestrator-scene
    UIScene.js                – HUD-overlay med minikart
    SkillScene.js             – ferdighetstreet
    InventoryScene.js         – inventar + kjæledyr-utstyr
    MerchantScene.js          – kjøpmann-overlay
    SmelteryScene.js          – smelteovn / leirplass (4 faner)
    ChemLabScene.js           – kjemisk laboratorium
    AcceleratorScene.js       – partikkelakselerator (transuransk syntese)
    ElementBookScene.js       – periodisk system / elementbok
    SettingsScene.js          – lydinnstillinger
    LeaderboardScene.js       – lokal + global ledertavle
    GameOverScene.js          – død/seier-skjerm
backend/
  worker.js                   – Cloudflare Worker for global ledertavle
tests/
  test-runner.html            – nettleserbasert testsuiteCI
  ci-runner.js                – headless Playwright-runner for CI
  framework.js                – minimalt testrammeverk
  test-*.js                   – testsuiter
docs/
  GDD.md                      – Game Design Document
  CHANGELOG.md                – endringslogg
  Elements-mod.md             – Elements-modifikasjon designdokument
```

## Dokumentasjon

- [Game Design Document](docs/GDD.md) – Full spillbeskrivelse og regler
- [Endringslogg](docs/CHANGELOG.md) – Versjonshistorikk
- [Elements-modifikasjon](docs/Elements-mod.md) – Det periodiske system i spillet
