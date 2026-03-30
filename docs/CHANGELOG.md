# Endringslogg – Labyrint Hero

---

## v0.13 – 2026-03-30

### Nye funksjoner
- **Gjenstandssjeldenhetsystem (#21):** Våpen og rustning har nå sjeldenhetsgrader: Vanlig (grå), Sjelden (blå), Episk (lilla), Legendarisk (oransje), Mytisk (rød). Høyere sjeldenheter gir bedre stats (opp til ×3). Verden-nummer øker sjansen for sjeldne gjenstander. Boss-drops er garantert sjelden eller bedre. Sjeldenhetsfarger vises på gjenstandsnavn, rammer og glow-effekter
- **Gull og handelsmann (#2):** Nytt økonomisystem med gullvaluta. Monstre dropper gull ved død (skalerer med type og verden). Skattekister inneholder gull. Handelsmann-NPC spawner i hver labyrint og selger forbruksvarer, utstyr og nøkler. Gull vises i HUD og inventory. Gull beholdes mellom dødsfall (myk permadeath)

### Tekniske endringer
- `items.js` – `RARITIES[]`, `RARITY_BY_ID{}`, `rollRarity()`, `makeRarityItem()` – fullstendig sjeldenhetsystem
- `randomItemForWorld()` / `randomItemByType()` – støtter nå `minRarityIdx`-parameter; genererer gjenstander med sjeldenhet
- `Inventory.serialize()` / `deserialize()` – lagrer og gjenoppretter sjeldenhetsinfo for utstyr
- `Hero.gold` – nytt felt; inkludert i `getStats()` / `applyStats()`
- `constants.js` – `GOLD_DROP`, `GOLD_CHEST_BASE`, `MERCHANT_MARKUP`
- `GameScene._onMonsterKilled()` – gulldrop med flytende tekst
- `GameScene._checkChestPickup()` – gull fra kister
- `GameScene._placeMerchant()` – plasserer handelsmann-NPC med prosedyresprite
- `GameScene._generateMerchantStock()` – genererer handelsvarer
- `GameScene._spawnItemAt()` – sjeldenhetsglow og ramme for utstyr
- Ny fil: `MerchantScene.js` – butikk-overlay med kjøpsfunksjon
- `UIScene` – gullvisning i HUD; handelsmann på minikart (blå prikk)
- `InventoryScene` – sjeldenhetsfarger på gjenstandsnavn og rammer; gull i stats-linje

---

## v0.12 – 2026-03-30

### Nye funksjoner
- **Kjønnsvalg (#15):** Velg mellom mann og kvinne i karakterskaperen. Kvinner har slankere kropp, smalere nese, fyldige lepper, vipper og lett blush. Skjegg skjules automatisk for kvinnelige karakterer
- **Flere klær (#16):** 4 klesstiler: Tunika (standard), Kappe (lang kjole), Vest (åpen front), Kåpe (over skuldrene). 3 nye drakt-farger (dyp blå, dyp rød, grå)
- **Slankere sprites (#17):** Karaktersprites har nå slankere proporsjoner med kjønnsbaserte kroppsforskjeller (skulderbredde, torso, armer, bein)
- **Flere frisyrer (#18):** 10 hårstyler (opp fra 5): Kort, Langt, Mohawk, Skallet, Kappe, Hestehale, Fletter, Krøller, Knute, Sidekam. 2 nye hårfarger (dyp rød, mørk lilla)

### Tekniske endringer
- `CharacterSprite.js` – `gender` felt i appearance; `clothStyle` felt; 10 hårstyler; kjønnsbaserte kroppsdimensjoner
- `GENDERS`, `GENDER_LABELS`, `CLOTH_STYLES`, `CLOTH_STYLE_LABELS` – nye konstantarrayer
- `HAIR_STYLES` utvidet fra 5→10; `HAIR_COLORS` fra 5→7; `CLOTH_COLORS` fra 5→8
- `defaultAppearance()` – inkluderer nå `gender` og `clothStyle`
- `CharacterCreatorScene.js` – kjønnsvelger-rad, klesstilvelger, 2-rads frisyreliste, skjult skjegg for kvinner
- Preview-boks utvidet fra 112→128px for bedre detaljvisning
- Bakoverkompatibelt: manglende `gender`/`clothStyle` fallbacker til 'male'/'tunic'

---

## v0.11 – 2026-03-29

### Nye funksjoner
- **Stabling av gjenstander (#14):** Consumables og verktøy stabler nå opp til 10 stykk per slot i ryggsekken. Antall vises som tall-badge i inventory
- **Hurtig-bruk-slot (#14):** Nytt utstyrsfelt «Hurtig (Q)» i inventory for å tildele en consumable til hurtigknappen. Klikk en consumable i ryggsekken for å sette den i hurtigsloten. Trykk Q / USE for å bruke den i spill
- **Forbedret inventory-layout:** Tre utstyrsfelt side om side (Våpen – Rustning – Hurtig)

### Tekniske endringer
- `Inventory.quickUse` – nytt felt `{ id, count }` for hurtigbruk-slot
- `Inventory.addItem()` – automatisk stabling for consumables/tools
- `Inventory._getItemDef()` / `_getCount()` – hjelpere for nytt entry-format
- `Inventory.serialize()` / `deserialize()` – støtter stabel-format `{ id, count }` + bakoverkompatibelt med gamle saves
- `InventoryScene._makeQuickUseSlot()` – ny UI-komponent
- `InventoryScene._makeBackpackSlot()` – viser stabelantall-badge
- `GameScene._handleUseItem()` – bruker `inventory.useQuickItem()` istedenfor direkte backpack-søk
- `GameScene._findItemInBackpack()` – kompatibel med nytt entry-format
- Nøkkel/hakke-forbruk bruker nå `dropSlot()` for korrekt stabel-dekrementering

---

## v0.10 – 2026-03-29

### Bugfikser
- **Gift tikker saktere (#10):** Gift tikker nå hvert ~900ms (før: ~380ms). Gir tid til å åpne inventory og bruke motgift
- **Motgift kurerer gift (#10):** Motgift fjerner nå gifteffekten (i tillegg til +1 hjerte)
- **Sprukne vegger fikset (#11):** Facing-retning oppdateres nå også når bevegelse blokkeres av vegger/dører, slik at man alltid kan bryte sprekket vegg ved å trykke mot den + SPACE/F
- **HUD overlapper ikke lenger (#12):** Kamera følger helten med offset nedover slik at HUD-baren ikke skjuler figuren i øverste rader
- **Redusert item-drop (#13):** Monster drop rate senket fra 45% til 25%; 70% sjanse for consumable fremfor utstyr; kiste-item nr 2 er nå alltid consumable
- **Bruksgjenstand-knapp (#14):** Ny Q-tast (+ USE touch-knapp) bruker første consumable i ryggsekken direkte i spill — bomber, blendgranater, drikker osv. fungerer nå i kamp

### Tekniske endringer
- `GameScene.poisonTickTimer` – egen timer for gift, uavhengig av monstertick
- `GameScene._handleUseItem()` – ny quick-use metode (Q / touch USE)
- `GameScene._tryMoveHero()` – setter `hero.facing` før bevegelsessjekk
- `GameScene.cameras.main.setFollowOffset(0, -30)` – kameraoffset for HUD
- `TouchControls` – ny USE-knapp i action button grid
- `antidote.use()` – nullstiller `poisonTurns` + refresher sprite

---

## v0.9 – 2026-03-29

### Nye funksjoner
- **Touch/mobil-støtte (#4):** Spillet er nå spillbart på mobil og nettbrett
  - D-pad (4 retningsknapper) nederst til venstre for bevegelse
  - Handlingsknapper nederst til høyre: Angrep, Bue, Inventar, Minikart
  - Touch-kontroller vises kun på touch-enheter; tastatur fungerer som før
  - Responsiv skalering: canvas tilpasser seg alle skjermstørrelser (Scale.FIT)
  - Støtte for 3 samtidige berøringspunkter (bevegelse + handling samtidig)
- **Langt trykk i inventory:** Hold 500ms for å slippe gjenstander (touch-erstatning for høyreklikk)

### Tekniske endringer
- Ny fil: `src/systems/TouchControls.js` – d-pad og handlingsknapper via Phaser Graphics
- `src/main.js` – Phaser Scale.FIT config, `activePointers: 3`, touch-deteksjon i registry
- `index.html` – `user-scalable=no` i viewport-meta; ny script-tag for TouchControls
- `GameScene._handleInput()` – leser `touch_dx`/`touch_dy` fra registry som fallback
- `GameScene._handleAttack()` / `_handleBow()` – leser `touch_attack`/`touch_bow` flagg
- `UIScene` – instansierer TouchControls, skjuler tastaturhint på touch-enheter
- `InventoryScene` – langt-trykk-logikk erstatter ren pointerdown for drop-funksjon

---

## v0.6 – 2026-03-27

### Nye funksjoner
- **Slipp gjenstander:** Høyreklikk i inventory slipper gjenstander fra ryggsekk eller utstyrslots; gjenstanden dukker opp på helltens nåværende rute
- **Sprukne vegger (TILE.CRACKED_WALL):** Blokkerer bevegelse; brytes med hakke ved å trykke SPACE/F mens man er vendt mot veggen
- **Låste dører (TILE.DOOR):** Blokkerer bevegelse og monsterbevegelse; åpnes automatisk ved å ha nøkkel i ryggsekk
- **Verktøy-gjenstander:** `nøkkel` og `hakke` plasseres automatisk i labyrinten basert på antall dører/sprukne vegger
- **Smartere gjenstandsplassering:** Garantert minst 1 våpen + 1 rustning per verden; duplikater unngås; totalt antall gjenstander redusert
- **Balanse-simulator** (`simulator.html`): Frittstående HTML-side som simulerer N komplette spill med konfigurerbar AI-strategi og viser vinnrate, dødsårsaker, nivåfordeling, gjenstandsbruk og verden-for-verden-statistikk

### Bugfikser
- **Inventory-refresh:** `_refresh()` bruker nå `_d()`-mønster for å registrere og rydde opp dynamiske objekter korrekt
- **Høyreklikk-meny:** `disableContextMenu()` hindrer nettleserkontekstmenyen i å vises i inventory

### Tekniske endringer
- `TILE.CRACKED_WALL = 4`, `TILE.DOOR = 5` – nye tile-typer i konstanter
- `COLORS.CRACKED_WALL`, `COLORS.CRACKED_LINE`, `COLORS.DOOR`, `COLORS.DOOR_FRAME` – nye farger
- `MazeGenerator._addExtraPassages()` – oppdatert fordeling: 35% åpne, 20% hemmelige, 20% sprukne, 25% dører
- `MazeGenerator.countTile(type)` – ny hjelpemetode for å telle tile-typer
- `GameScene._drawMap()` – tegner alle 6 tile-typer inkl. visuell hint for nøkkel/hakke
- `GameScene._placeTools()` – plasserer nøkler og hakker proporsjonalt med maze-innhold
- `GameScene._spawnItemAt()` – spesialtegning for nøkkel/hakke; hindrer stabeling
- `GameScene._findItemInBackpack(id)` – søk i ryggsekk etter bestemt gjenstand
- `GameScene._tryMoveHero()` – blokkerer på CRACKED_WALL; auto-bruker nøkkel på DOOR
- `GameScene._handleAttack()` – bryter CRACKED_WALL med hakke ved SPACE/F
- `GameScene._moveMonster()` – monstre kan ikke bryte/åpne vegger/dører
- `Inventory.dropSlot(index)` – fjerner gjenstand fra ryggsekk og returnerer den
- `Inventory.dropEquipped(slot, hero)` – avutstyrer og returnerer gjenstand fra utstyrslot
- `Inventory._apply()` / `_unapply()` – fikset støtte for `hearts`-stat (f.eks. Vattert vest)

---

## v0.5 – 2026-03-27

### Bugfikser
- **Boss-død krasj:** `_heroDied()` stopper nå SkillScene og InventoryScene eksplisitt (via `_stopOverlayScenes()`) før GameOverScene startes – forhindrer at overlay-scener henger igjen
- **Inventory lukkes automatisk:** Gjenstandsbruk og utstyring fører ikke lenger til at inventory lukkes. `_refresh()` metode oppdaterer slots direkte uten å lukke scenen
- **E-tast pålitelighet:** Byttet fra `keyboard.once()` til `keyboard.on()` med `_closed`-flagg – forhindrer at lytterens engangslogikk spises av andre hendelser

### Nye funksjoner
- **Knapp-basert kamp:** Bevegelse inn i monster-rute setter kun retning (facing); **SPACE** eller **F** angriper i sett retning – mer bevisst kamp
- **Pilfyring (bue):** Ny `subtype: 'bow'`-type. Trykk **R** for å skyte pil i facing-retningen. Animert prosjektil treffer første monster i kulelinjen
- **Zoom:** Muskjul og `+`/`-` taster justerer kamera-zoom (0.5× – 2.5×, standard 1.25×)
- **Hemmelige passasjer:** `TILE.SECRET` – ruter som ser ut som vegger (sprekkemerker) men er gjennomgangbare. Skaper overraskende snarveier
- **Mer forgrening:** ~18% av vegger mellom celler åpnes etter labyrinthgenerering – gir løkker og flere ruter
- **Forbedret monstersgrafikk:** Unike sprites per monstertype:
  - Goblin: Spisse ører, gule slisseøyne, brett smil med tenner
  - Orc: Bred kjeve, røde øyne, oppoverpekende tenner, tykke armer
  - Troll: Brede skuldre, lange armer nede til hender, bulbøs nese, kuppete panne
  - Boss: Gyllen krone med juvelene, glødende øyne, store tenner, mørk aura
- **Flere gjenstander:** Dolk, Spyd, Kortbue/Alvebue/Armbrøst, Vattert vest, Drageskjell, Forsvarsbrygg, Erfaringsrulle, Blendgranate, Motgift, Hjerte-krystall
- **Kontrollhjelp i HUD:** Oppdatert statuslinje viser alle kontroller

### Tekniske endringer
- `MazeGenerator._addExtraPassages(ratio)` – ny metode for ekstra ganger
- `Hero.facing = { dx, dy }` – facing-retning som nytt property
- `InventoryScene._refresh()` – dynamisk UI-gjenbygging uten scenerestart
- `GameScene._stopOverlayScenes()` – samlet metode for å stoppe alle overlays
- `GameScene._bumpEffect(monster)` – visuell flash når man bumper i monster
- `GameScene._shootArrow(dx, dy, dmg)` – pilprosjektil med tween-animasjon
- `GameScene._handleAttack()` / `_handleBow()` / `_handleZoom()` – egne input-metoder
- Konstanter: `TILE.SECRET`, `COLORS.ARROW`, `ZOOM_MIN/MAX/STEP/DEFAULT`

---

## v0.4 – 2026-03-27

### Lagt til
- Forbedret karaktergrafikk: prosedyretegnede helter med armer, bein, hår
- Karakterskaperskjerm: rase, navn, utseende (hud, hår, drakt, stil)
- Ekstra visuelt utstyr for alle raser (dverg: hjelm+skjegg, alv: spisse ører, hobbit: rosenrøde kinn)
- 4 hudfarger, 5 hårfarger, 5 drakt-farger, 5 hårstyler

### Bugfikser
- **Skjermlåsing ved nivå-opp:** `_tickMonsters(delta)` flyttes inn i `if (!blocked)` sjekken

---

## v0.3 – 2026-03-27

### Lagt til
- Karakterskaperskjerm (rase + navn)
- Evneskjerm (SkillScene) – velg én av tre evner ved nivå-opp
- Inventory-system: 2 utstyrsplasser + 10-spors ryggsekk
- 5 våpen, 4 rustninger, 5 forbruksgjenstander
- 12 passive evner (kan stables)
- Lagring til localStorage via SaveManager
- "Fortsett" funksjon i menyen

---

## v0.2 – 2026-03-27

### Lagt til
- MVP implementert med Phaser.js
- Prosedyrelabyrint (Recursive Backtracker)
- Tåke-of-war (FOG.DARK / DIM / LIT)
- Helt med bevegelse, HP, angrep
- Monstre (goblin, orc, troll, boss) med AI
- HUD (hjerter, XP, utstyrte gjenstander)
- GameOver / WorldComplete scener
- Avklart: nettleser, sanntids kamp, rute-for-rute bevegelse, myk permadeath

---

## v0.1 – 2026-03-27

### Lagt til
- Prosjektstruktur opprettet
- Første utkast til Game Design Document
