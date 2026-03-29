# Endringslogg – Labyrint Hero

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
