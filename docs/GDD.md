# Labyrint Hero – Game Design Document
**Versjon:** 0.18
**Sist oppdatert:** 2026-03-31

---

## 1. Spillkonsept

Et top-down 2D labyrint-RPG i nettleser. Spilleren navigerer en prosedyre-generert labyrint, slåss mot monstre og en boss, samler utstyr og evner, og går videre til neste verden. Inspirert av roguelikes og klassiske dungeon crawlers.

**Kjernepilarer:**
- Rute-for-rute bevegelse (grid-based)
- Myk permadeath: død fører til restart av verden, men helten beholder nivå, stats og inventory
- Prosedyrelabyrint med variasjon og tematisk design per verden
- Enkel men uttrykksfull prosedyregrafikk

---

## 2. Teknisk arkitektur

- **Motor:** Phaser 3 (v3.60.0) via CDN
- **Labyrint:** Recursive Backtracker (DFS) + ekstra ganger fordelt på 4 tile-typer
- **Rendering:** Phaser Graphics API – prosedyretegnet, ingen bildefiler
- **Lyd:** Web Audio API – prosedyremusikk og SFX, ingen lydfiler
- **Lagring:** localStorage via SaveManager
- **Multi-scene pattern:** GameScene + UIScene parallelt; SkillScene, InventoryScene og SettingsScene som overlays

### Filstruktur
```
src/
  constants.js              – konstanter, WORLD_THEMES, getWorldTheme()
  maze.js                   – MazeGenerator (DFS + ekstra passasjer)
  utils/SaveManager.js      – localStorage persistens
  data/skills.js            – 12 passive evner
  data/items.js             – 27 gjenstander (våpen, rustning, forbruk, verktøy) + sjeldenhetsystem
  graphics/CharacterSprite.js – prosedyrekaraktertegning (4 raser, 2 kjønn, 10 frisyrer, 4 klesstiler)
  systems/Inventory.js      – 2 utstyrsplasser + 10-spors ryggsekk
  systems/AudioManager.js   – prosedyremusikk (5 temaer) + SFX-motoren
  systems/MapRenderer.js    – kartrendering, tåke, portal-animasjon
  systems/ItemSpawner.js    – kister, verktøy, gjenstander, kjøpmann
  systems/MonsterManager.js – monsterplassering, AI, statuseffekter
  systems/CombatManager.js  – nærkamp, bue, skadeberegning, drap
  systems/InputHandler.js   – tastatur/touch-inndata, bevegelse, zoom
  entities/Hero.js          – spillerkarakter
  entities/Monster.js       – fiender med unike sprites per type
  scenes/
    MenuScene.js
    CharacterCreatorScene.js
    GameScene.js             – orkestrator-scene (~230 linjer)
    UIScene.js               – HUD overlay + ⚙-knapp
    SkillScene.js            – nivå-opp evnevalg (velg 1 av 3)
    InventoryScene.js        – inventory overlay (refresh-in-place)
    SettingsScene.js         – lydinnstillinger (musikk/SFX volum + on/off)
    GameOverScene.js
simulator.html              – frittstående balansesimulator
docs/GDD.md
docs/CHANGELOG.md
```

---

## 3. Labyrint

### Generering
- **Algoritme:** Recursive Backtracker → én perfekt labyrint (garantert sti fra start til exit)
- **Ekstra passasjer:** ~18% av kandidatveggene åpnes; fordelt på 4 typer
- **Størrelse:** vokser per verden: `BASE_CELL_W + extra×2` × `BASE_CELL_H + extra`
- Exit plasseres alltid nederst til høyre

### Tile-typer
| Verdi | Navn | Andel | Beskrivelse |
|-------|------|-------|-------------|
| 0 | WALL | – | Ugjennomtrengelig vegg (DFS-hoved) |
| 1 | FLOOR | – | Normalt gulv (DFS-sti) |
| 2 | EXIT | 1 | Utgang til neste verden |
| 3 | SECRET | 20% | Ser ut som vegg, er gjennomgangbar – hemmelig snarvei |
| 4 | CRACKED_WALL | 20% | Blokkerer; brytes med hakke (SPACE/F) |
| 5 | DOOR | 25% | Låst dør; åpnes automatisk med nøkkel |

Kun ekstra passasje-vegger kan være SECRET/CRACKED/DOOR – DFS-stien er alltid ren FLOOR.

### Tåkesystem (Fog of War)
- **DARK** → svart (aldri sett)
- **DIM** → halvgjennomsiktig (sett, men ikke belyst)
- **LIT** → fullt synlig (innenfor synsradius)
- Standard synsradius: 5 ruter

### Visuelle temaer
| Tema | Verdener | Stil |
|------|----------|------|
| Skogslabyrint | 1–2 | Grønne hekker, gressgulv, blomster, mose, vinstokker med blad |
| Steingrotte | 3–4 | Grå stein, fuktighetsdrypp, grus, stalaktitter, vannpytter |
| Iskrystall | 5 | Blå iskrystaller, frostsprekker med forgreninger, snøstøv, istapper |
| Vulkandungeon | 6 | Basalt, glødende lavasprekker, aske, glødepytter, svimerker |
| Oldtidstempel | 7+ | Sandstein, gullinnlegg, søylerelieff med kapitel, utslitte hjørner |

---

## 4. Helten

### Raser
| Rase | Hjerter | Angrep | Forsvar | Syn | XP-mult |
|------|---------|--------|---------|-----|---------|
| Menneske | 5 | 2 | 0 | 5 | ×1.25 |
| Dverg | 6 | 3 | 1 | 4 | ×1.0 |
| Alv | 4 | 2 | 0 | 7 | ×1.0 |

### Stats og progresjon
- **Hjerter:** HP – helten dør ved 0
- **Angrep:** Baseskade per slag (bonus fra utstyr og evner)
- **Forsvar:** Reduserer innkommende skade
- **Synsfelt:** Tåkeradius (påvirkes av `keen_eye`-evnen)
- **XP-kurve:** `XP_BASE = 100`, vokser med `XP_GROWTH = 1.55` per nivå → merkbart slakere progresjon
- **Nivå opp:** Åpner SkillScene (velg én av tre tilfeldige evner). **Ingen automatisk stats-boost** – all styrke kommer fra evner og utstyr.
- **Facing-retning:** Siste bevegelsesretning brukes av SPACE/F og pilskyting

### Kamp – skalering
Heltens grunnstats gjør at verden 1 er farlig uten noe utstyr. Utstyr og evner er nødvendig for å overleve videre. Design-målet er at boss alltid skal kreve ca. halvparten av heltens hjerter selv med OK utstyr.

---

## 5. Kamp

### Kontrollskjema
| Tast / Touch | Handling |
|------|----------|
| WASD / Piltaster / D-pad (touch) | Beveg helt |
| SPACE / F / Angrepsknapp (touch) | Angrip i sett retning (eller nærmeste monster) |
| R / Bueknapp (touch) | Skyt pil (krever bue utstyrt) |
| Q / USE-knapp (touch) | Bruk første consumable i ryggsekken (bombe, drikk, etc.) |
| E / Inventarknapp (touch) | Åpne/lukk inventory |
| ESC | Lukk overlay |
| +/- eller muskjul | Zoom inn/ut |
| M / Minikartknapp (touch) | Vis/skjul minikart |
| ⚙ (HUD) | Åpne lydinnstillinger |
| Langt trykk (touch) | Slipp gjenstand i inventory (erstatter høyreklikk) |

### Kampberegning
- **Helteangrep:** `attack + rand(0–2)`, krit ×2 (krit fra evne)
- **Monsterangrep:** `attack + 30% sjanse: +1`
- **Forsvar:** trekkes fra innkommende skade, minimum 1

### Monstere (v0.7 balanse)
| Type | Base-HP | Angrep | XP | HP-skala per verden |
|------|---------|--------|-----|---------------------|
| Goblin | 10 | 2 | 10 | +30% per verden |
| Orc | 18 | 4 | 25 | +30% per verden |
| Troll | 30 | 6 | 50 | +30% per verden |
| Boss | 35 + V×18 | 3 + V | 150 | – (eget uttrykk) |

Verdensnummer V brukes til å skalere både HP og skade – kamp bør alltid føles risikofylt.

### Statuseffekter (v0.14)
| Effekt | Ikon | Varighet | Skade | Kilde | Kur |
|--------|------|----------|-------|-------|-----|
| Gift | ☠ | 4 runder | 1/runde | Orc (20%), Troll (30%) | Motgift |
| Brann | 🔥 | 3 runder | 2/runde | Vulkandungeon-monstre (20%) | Brannsalve, Motgift |
| Frostbitt | ❄ | 4 runder | Ingen (halv fart) | Iskrystall-monstre (25%) | Frostsalve, Motgift |
| Lammet | ⚡ | 1 runde | Ingen (skip turn) | Boss fase 2 (15%) | Venter ut |

Motgift kurerer alle statuseffekter. Effektene stables ikke – ny påføring forlenger gjenværende varighet.

### Bump-mekanikk
Bevegelse inn i monster-rute: helten setter facing uten å angripe (visuell flash). Trykk SPACE/F for å angripe i facing-retning.

### Pilskyting
Trykk R med bue utstyrt – pilen flyr i facing-retning til første hinder. Animert prosjektil med tween.

---

## 6. Gjenstander og økonomi

### Designprinsipp (v0.7)
Gjenstander er sjeldne og verdifulle. Spilleren må kjempe seg til utstyr, ikke bare plukke opp alt de ser. Labyrinten er ikke et supermarked.

### Sjeldenhetsgrader (v0.13)
Våpen og rustning har sjeldenhetsgrader som påvirker stats:

| Sjeldenhet | Farge | Droprate | Stat-bonus |
|-----------|-------|----------|------------|
| Vanlig | Grå | ~60% | Basisstats |
| Sjelden | Blå | ~25% | +25% stats |
| Episk | Lilla | ~10% | +50% stats |
| Legendarisk | Oransje | ~4% | ×2 stats |
| Mytisk | Rød | ~1% | ×3 stats |

- Høyere verdener øker sjansen for bedre sjeldenhet
- Boss-drops er garantert sjelden eller bedre
- Sjeldenhetsfarge vises på gjenstandsnavn, rammer og glow i labyrinten

### Gull og handelsmann (v0.13)
- Monstre dropper gull ved død (goblin: ~5g, orc: ~12g, troll: ~25g, boss: ~100g + verdensbonus)
- Skattekister gir gull (~15g base + verdensbonus)
- Handelsmann-NPC spawner i hver labyrint (blå figur med pengesekk)
- Gå over handelsmannen for å åpne butikken
- Butikken selger 2 forbruksvarer, 1 våpen, 1 rustning og 1 nøkkel
- Priser skalerer med tier, sjeldenhet og verdensnummer
- Gull beholdes ved død (myk permadeath)

### Kilder til gjenstander
| Kilde | Frekvens | Innhold |
|-------|----------|---------|
| Skattekiste | 2–3 per verden (faste) | Gull + 2 tilfeldige gjenstander |
| Monster-drop | ~25% sjanse per drap | 1 tilfeldig gjenstand + gull |
| Boss-drop | Garantert | 1 gjenstand (sjelden+) + mye gull |
| Handelsmann | 1 per verden | 5 varer til salgs for gull |
| Nøkler/hakker | Automatisk plassert | Proporsjonalt med dører/sprukne vegger |

### Inventory
- 2 utstyrsplasser (Våpen + Rustning)
- 10-spors ryggsekk
- **E** åpner/lukker; bruk holder inventory åpent (refresh-in-place)
- **Venstreklikk:** bruk/utstyr — **Høyreklikk:** slipp gjenstand på gulvet

### Våpen (tier 1–4)
Melee: Dolk, Tresverd, Spyd, Jernsverd, Stridsøks, Krigshammer, Trollstav
Bue (R-angrep): Kortbue, Alvebue, Armbrøst

### Rustning (tier 1–4)
Lærpansring, Vattert vest (+1 hjerte), Ringbrynje, Platedrakt, Magikappe, Drageskjell

### Verktøy
- **Nøkkel:** auto-konsumeres ved DOOR
- **Hakke:** konsumeres ved SPACE/F mot CRACKED_WALL

### Forbruksgjenstander
Livspotte, Stor livspotte, Styrkebrygg, Forsvarsbrygg, Hjerte-krystall, Erfaringsrulle, Kart-rulle, Bombe, Blendgranate, Motgift

---

## 7. Evner (Skills)

12 evner, kan stables 3× per evne; velges ved nivå-opp (1 av 3 tilfeldige):

| Evne | Effekt |
|------|--------|
| power_strike | +1 ATK |
| thick_skin | +1 DEF |
| iron_health | +1 max hjerte |
| keen_eye | +1 synsradius |
| precision | +8% kritsjanse |
| bulwark | +2 DEF |
| dodge | +12% unnvikelse |
| xp_boost | +25% XP |
| vital_strike | +2 ATK |
| regen | Regenerer 1 hjerte hvert 20. trekk |
| battle_hardened | +1 ATK, +1 DEF |
| giant_strength | +3 ATK |

---

## 8. Lyd

- **Bakgrunnsmusikk:** 5 prosedyre-temaer (Web Audio API), skifter med verden
- **SFX:** angrep, pilskudd, skade, plukk opp, nivå-opp, død, døroppning, veggskjøting, exit-portal
- **Innstillinger:** ⚙-knapp i HUD åpner SettingsScene med volum-slidere og on/off-toggle

---

## 9. Kamera

- Smooth camera follow (0.08 lerp)
- Zoom: muskjul eller +/− taster (0.5× – 2.5×, standard 1.25×)

---

## 10. Balanse-simulator

`simulator.html` – frittstående HTML, ingen server nødvendig.

**Konfigurasjon:** antall spill (10–2000), start-verden, maks verdener, AI-strategi (balansert/aggressiv/feig/samler), rase.

**AI-strategi:** Bump-combat navigasjon – helten pathing mot exit, kjemper seg gjennom blokkerende monstre. Ingen timeout-problemer.

**Statistikk:** seiersrate, nivå-fordeling, dødsårsaker, gjenstandsbruk, monster-drap per type, verden-for-verden tabell, verktøy-bruksrate.

---

## 11. Permadeath og lagring

**Myk permadeath:** verden regenereres, helten beholder nivå/stats/inventory. Hjerter gjenopprettes fullt.
**Lagring:** `localStorage` → nøkkel `labyrint_hero_v1`

---

## 12. Implementert – statusoversikt (v0.8)

| System | Status | Kommentar |
|--------|--------|-----------|
| Labyrintgenerering (DFS) | ✅ Ferdig | |
| Tile-typer (6 typer inkl. TRAP) | ✅ Ferdig | SECRET, CRACKED_WALL, DOOR, TRAP |
| Fog of War | ✅ Ferdig | 3 nivåer |
| Visuelle verdenstemaer | ✅ Ferdig | 5 temaer med detaljerte per-tile dekorasjoner, murverk, vegg-skygger |
| Karakterskaper (4 raser) | ✅ Ferdig | Alv, Dverg, Menneske, Hobbit; kjønnsvalg |
| Prosedyrekaraktergrafikk | ✅ Ferdig | 2 kjønn, 10 frisyrer, 4 klesstiler, øynefarge, skjegg, tilbehør per rase |
| Vanskelighetsgrad (MenuScene) | ✅ Ferdig | LETT/NORMAL/VANSKELIG – prominent i startmenyen |
| Startbonus-valg | ✅ Ferdig | +Hjerte / +Angrep / +Syn |
| Knapp-basert kamp | ✅ Ferdig | SPACE/F, facing-retning |
| Kampanimasjoner | ✅ Ferdig | Lungestøt, hitflash, dødsspin, gnister |
| Bue + pilprosjektil | ✅ Ferdig | R-tast |
| 4 monstertyper + sprites | ✅ Ferdig | Goblin, Orc, Troll, Boss |
| Boss-faser (2 faser) | ✅ Ferdig | Fase 2 ved ≤50% HP: rasende, økt ATK |
| Inventory + drop | ✅ Ferdig | 10-spors, høyreklikk-drop |
| 27 gjenstander | ✅ Ferdig | Alle tier 1–4 |
| Skattekiste-system | ✅ Ferdig | 2–3 per verden |
| Monster-drop system | ✅ Ferdig | 45% per drap, boss-garantert |
| Nøkkel/hakke-mekanikk | ✅ Ferdig | |
| Skilltre (4 veier + synergier) | ✅ Ferdig | Krigar / Vokter / Jeger / Skurk + 4 kryss-vei-synergier |
| Unike gjenstandsikoner | ✅ Ferdig | 20+ distinkte prosedyregrafikker |
| Bevegelsesanimasjon (glide) | ✅ Ferdig | 90ms hero, 126ms monster |
| Zoom (kamera) | ✅ Ferdig | Muskjul og +/− |
| HUD + UIScene | ✅ Ferdig | |
| Minimap (M-tast) | ✅ Ferdig | Fog-bevisst, hjørne-kart |
| Statuseffekter (4 typer) | ✅ Ferdig | Gift, Brann, Frostbitt, Lammet |
| Feller/traps | ✅ Ferdig | Usynlige spikefeller, 1-gangs-trigger |
| Bakgrunnsmusikk (5 temaer) | ✅ Ferdig | Web Audio API |
| SFX (9 typer) | ✅ Ferdig | |
| Lydinnstillinger | ✅ Ferdig | SettingsScene |
| SaveManager (localStorage) | ✅ Ferdig | |
| Balanse-simulator | ✅ Ferdig | simulator.html |
| Butikk / handelsmann | ✅ Ferdig | Handelsmann-NPC i hver labyrint |
| Gull + økonomi | ✅ Ferdig | Gullvaluta fra monstre/kister; handelsmann |
| Gjenstandssjeldenhet | ✅ Ferdig | 5 sjeldenhetsgrader med stat-boost |
| Touch/mobil-støtte | ✅ Ferdig | D-pad, handlingsknapper, responsiv skalering, langt-trykk drop |
| Leaderboard | ✅ Ferdig | Ledertavle med filtrering og tidssporing per verden |

---

## 4b. Helten – detaljert utseende (v0.12)

Spilleren kan tilpasse heltens utseende i karakterskaperen:

| Alternativ | Valg |
|-----------|------|
| Kjønn | Mann, Kvinne (påvirker kroppsproportioner, ansiktstrekk) |
| Hudfarge | 4 toner |
| Hårfarge | 7 farger (inkl. dyp rød, mørk lilla) |
| Frisyre | 10 styler: Kort, Langt, Mohawk, Skallet, Kappe, Hestehale, Fletter, Krøller, Knute, Sidekam |
| Øynefarge | Mørk, Blå, Grønn, Grå, Rødt, Lilla |
| Drakt-farge | 8 farger |
| Klesstil | Tunika, Kappe (lang), Vest (åpen front), Kåpe (med skulderkappe) |
| Skjeggstil (Menneske/Dverg, kun mann) | Ingen, Stubb, Skjegg, Langt |

Kvinner har slankere kroppsproportioner, smalere nese, vipper og subtil blush. Skjegg er utilgjengelig for kvinner.

Hobbiter har karakteristiske store, lodne føtter (ingen sko). Alver har spisse ører med øredobber og bladbrosje.

## 7b. Skilltre (v0.8)

Fire spesialiseringsveier med 3 tiers. T1 alltid tilgjengelig; T2 krever ≥1 T1 fra samme vei; T3 krever ≥1 T2.

| Vei | Fokus | T1 | T2 | T3 |
|-----|-------|----|----|-----|
| **Krigar** | Kamp | Kraftig slag (+2 ATK) | Kampherdet (+2 ATK +1 DEF) | Jotunstyrke (+5 ATK) |
| **Vokter** | Forsvar | Tykk hud (+1 DEF) | Festning (+1 DEF +1 HP) | Jernhelse (+2 HP) |
| **Jeger** | Syn/Krit | Skarpsyn (+2 syn) | Vitalt anslag (+25% krit) | Presisjon (+3 ATK) |
| **Skurk** | Nytte | Kunnskap (+30% XP) | Unnvikelse (+20% dodge) | Blomstersaft (hel 2 HP) |

Spilleren kan spre poeng på tvers av veier (generalist) eller gå dypt i én (spesialist).

### Kryss-vei-synergier (v0.15)
Automatiske bonuser som aktiveres når helten har evner fra to forskjellige veier:

| Synergi | Veier | Effekt |
|---------|-------|--------|
| Motangrep | Krigar + Jeger | 20% sjanse for automatisk motangrep |
| Tornehud | Vokter + Skurk | Angripere tar 1 skade |
| Uovervinnelig | Krigar + Vokter | +2 ATK, +1 DEF, +1 hjerte |
| Skyggejeger | Jeger + Skurk | +15% unnvikelse, +1 synsfelt |

Synergier gir insentiv til å investere bredt istedenfor å spesialisere seg.

---

## 13. Neste steg (prioritert)

1. ~~**Gull + handelsmann**~~ – ✅ Implementert i v0.13.
2. **Skilltre-utvidelse** – Legg til 2–3 ekstra ferdigheter per vei; kryss-vei-synergier.
3. ~~**Touch/mobil-støtte**~~ – ✅ Implementert i v0.9.
4. ~~**Leaderboard**~~ – ✅ Implementert i v0.14.
5. ~~**Frostbrent statuseffekt**~~ – ✅ Implementert i v0.14 (+ brann og stun).
6. **Refaktorering** – Splitte GameScene.js i mindre moduler (CombatManager, MapRenderer, etc.).
