# Labyrint Hero – Game Design Document
**Versjon:** 0.28
**Sist oppdatert:** 2026-04-06

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
  entities/Pet.js           – kjæledyr-følgesvenn (rev, katt, drage, ugle)
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

### Kjæledyr-følgesvenn
Helten kan finne et mystisk egg i labyrinten. Egget klekkes til et tilfeldig kjæledyr som følger helten.

| Type | Navn | Farge | Angrep | HP |
|------|------|-------|--------|----|
| fox | Rev | Oransje | 1 | 8 |
| cat | Katt | Gyllen | 1 | 6 |
| dragon | Drage | Rød | 2 | 10 |
| owl | Ugle | Blå | 1 | 6 |

- **Oppdagelse:** Egg spawner på gulvet (80% sjanse i verden 1, 35% deretter). Spawner også når kjæledyret har dødd i forrige level.
- **AI:** Følger helten (beveger seg ett steg mot helten per monster-tick). Angriper monster som er innen 1 rute.
- **Kamp:** Kjæledyret gjør automatisk skade mot nærliggende monstre. Monstre har 25% sjanse for å angripe kjæledyret i stedet for helten.
- **Død:** Kjæledyret kan dø. Nye egg kan spawne i neste level (35% sjanse).
- **Healing:** Med Villmarksjeger T2-evnen «Vitalt anslag» healer alle helende gjenstander (potions, salver, eliksirer) også kjæledyret.
- **Kjæledyr-ryggsekk:** Kjæledyret har 4 ryggsekk-plasser. Gjenstander overflyter automatisk til kjæledyrets ryggsekk ved full helte-ryggsekk. Gjenstander kan flyttes mellom helt og kjæledyr i inventory.
- **Persistens:** Lagres med hero-stats mellom verdener og sessions.

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
| T | Vis ferdighetstre (kun visning) |
| ESC | Lukk overlay |
| +/- eller muskjul | Zoom inn/ut |
| M / Minikartknapp (touch) | Vis/skjul minikart |
| ⚙ (HUD) | Åpne lydinnstillinger |
| Langt trykk (touch) | Slipp gjenstand i inventory (erstatter høyreklikk) |

### Kampberegning
- **Helteangrep:** `attack + rand(0–2)`, krit ×2 (krit fra evne)
- **Monsterangrep:** `attack + 30% sjanse: +1`
- **Forsvar:** trekkes fra innkommende skade, minimum 1

### Monstere (v0.19 balanse)
| Type | Base-HP | Base-ATK | XP | HP-skala | ATK-skala |
|------|---------|----------|-----|----------|-----------|
| Goblin | 10 | 2 | 10 | +50% per verden | +25% per verden |
| Orc | 18 | 4 | 25 | +50% per verden | +25% per verden |
| Troll | 30 | 6 | 50 | +50% per verden | +25% per verden |
| Boss | 50 + V×35 | 3 + V×2 | 150 | – (eget uttrykk) | – (570ms tick) |

Verdensnummer V brukes til å skalere både HP og skade – kamp bør alltid føles risikofylt.

### Bump-mekanikk
Bevegelse inn i monster-rute: helten setter facing uten å angripe (visuell flash). Trykk SPACE/F for å angripe i facing-retning.

### Statuseffekter (v0.14)
| Effekt | Ikon | Varighet | Skade | Kilde | Kur |
|--------|------|----------|-------|-------|-----|
| Gift | ☠ | 4 runder | 1/2.5s | Orc (20%), Troll (30%) | Motgift, Krystallresistans |
| Brann | 🔥 | 3 runder | 2/2.0s | Vulkandungeon-monstre (20%) | Brannsalve, Motgift, Krystallresistans |
| Frostbitt | ❄ | 4 runder | Ingen (halv fart) | Iskrystall-monstre (25%) | Frostsalve, Motgift |
| Lammet | ⚡ | 1 runde | Ingen (skip turn) | Boss fase 2 (15%) | Venter ut |

Motgift kurerer alle statuseffekter. Effektene stables ikke – ny påføring forlenger gjenværende varighet.

### Krystall-passive bonuser (v0.27)
Krystaller (edelstener) i ryggsekken gir passive bonuser uten å bruke dem:
| Krystall | Bonus |
|----------|-------|
| Klar kvarts | +1 Synsfelt |
| Ametyst | 15% Giftresistans |
| Citrin | +20% Gullfunn |
| Smaragd | 30% Giftresistans |
| Akvamarin | 30% Brannresistans |
| Rubin | +1 Angrep |
| Safir | +1 Forsvar |
| Diamant | +1 Angrep, +1 Forsvar, +1 Maks-hjerte |
| Rød beryll | +10% Kritisk, +10% Unnvikelse |

Bonuser stabler med antall krystaller i ryggsekken.

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
- Kjæledyr-ryggsekk (4 plasser, kun når kjæledyr er i live)
- **E** åpner/lukker; bruk holder inventory åpent (refresh-in-place)
- **Venstreklikk:** bruk/utstyr — **Høyreklikk/Hold:** flytt til kjæledyr (eller slipp på gulvet)

### Våpen (tier 1–4)
Melee: Dolk, Tresverd, Spyd, Jernsverd, Stridsøks, Krigshammer, Trollstav
Bue (R-angrep): Kortbue, Alvebue, Armbrøst

### Rustning (tier 1–4)
Lærpansring, Vattert vest (+1 hjerte), Ringbrynje, Platedrakt, Magikappe, Drageskjell

### Verktøy
- **Nøkkel:** auto-konsumeres ved DOOR
- **Hakke:** konsumeres ved SPACE/F mot CRACKED_WALL

### Forbruksgjenstander
Livspotte, Stor livspotte, Styrkebrygg (midlertidig +2 ATK i 60 sek), Forsvarsbrygg (midlertidig +1 DEF i 60 sek), Hjerte-krystall, Erfaringsrulle, Kart-rulle, Bombe, Blendgranate, Motgift

---

## 7. Evner (Skills)

5 spesialiseringsstier med 3 nivåer (tiers) hver. 2 kjernestier alltid tilgjengelige, 3 håndverksbaserte stier låses opp gjennom spilling. Velges ved nivå-opp.

### Kjernestier

**Kriger** (kamp, forsvar og utholdenhet):
| Tier | Evne | Effekt | Maks |
|------|------|--------|------|
| T1 | power_strike | +2 ATK, +1 DEF | ×3 |
| T2 | battle_hardened | +2 ATK, +1 DEF, +1 Hjerte, +2 ryggsekk | ×2 |
| T3 | giant_strength | +5 ATK, +2 maks hjerter | ×1 |

**Villmarksjeger** (syn, presisjon, unnvikelse og kjæledyr):
| Tier | Evne | Effekt | Maks |
|------|------|--------|------|
| T1 | keen_eye | +2 syn, +20% XP, +2 kjæl.-ATK | ×2 |
| T2 | vital_strike | +20% krit, +15% unnvikelse, +3 kjæl.-HP, +1 kjæl.-DEF, potion healer kjæledyr | ×2 |
| T3 | precision | +3 ATK, +3 kjæl.-ATK, +3 kjæl.-HP, +2 hjerter nå | ×1 |

### Håndverksstier (låses opp)
- **Geolog** (lås: finn mineral) – mineralsynsradius, utbytte, garantert sjeldent mineral
- **Metallurg** (lås: smelt mineral) – smeltetid, legeringsstats, mestersmie
- **Kjemiker** (lås: lag kjemikalie) – potion-varighet, bombeskade, eksplosjonsradius

### Synergier
Aktiveres automatisk når helten har evner fra begge stier i et par:
| Synergi | Stier | Effekt |
|---------|-------|--------|
| Motangrep | Kriger + Villmarksjeger | 20% motangrep |
| Tornehud | Kriger + Villmarksjeger | 1 tornskade, +1 syn |
| Jordens kraft | Geolog + Kriger | +1 DEF, +1 mineral-syn |
| Smiekunst | Metallurg + Kriger | +3 ATK, +20% malmeffekt |
| Malmkjenne | Metallurg + Geolog | +1 mineral-syn, -10% smeltetid |
| Giftklinger | Kjemiker + Kriger | +2 ATK, 15% gift |
| Alkymist | Kjemiker + Metallurg | +20% potens, -15% energi |
| Naturkjenner | Geolog + Villmarksjeger | +1 mineral-syn, +2 kjæl.-HP |
| Giftjeger | Kjemiker + Villmarksjeger | +20% kjemibombe, +10% krit |

---

## 8. Lyd

- **Bakgrunnsmusikk:** 8 prosedyre-temaer (Web Audio API) inspirert av Edvard Grieg, med melodi, bass, akkorder og kontramellodi. Skifter med verden/sone
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
| Skilltre (5 stier + synergier) | ✅ Ferdig | Kriger / Villmarksjeger + Geolog / Metallurg / Kjemiker + 9 synergier. T-tast for visning |
| Unike gjenstandsikoner | ✅ Ferdig | 20+ distinkte prosedyregrafikker |
| Bevegelsesanimasjon (glide) | ✅ Ferdig | 90ms hero, 126ms monster |
| Zoom (kamera) | ✅ Ferdig | Muskjul og +/− |
| HUD + UIScene | ✅ Ferdig | |
| Minimap (M-tast) | ✅ Ferdig | Fog-bevisst, hjørne-kart |
| Statuseffekter (4 typer) | ✅ Ferdig | Gift, Brann, Frostbitt, Lammet |
| Feller/traps | ✅ Ferdig | Usynlige spikefeller, 1-gangs-trigger |
| Bakgrunnsmusikk (8 temaer) | ✅ Ferdig | Web Audio API, Grieg-inspirert med kontramellodi |
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

Fem spesialiseringsveier med 3 tiers. T1 alltid tilgjengelig; T2 krever at T1 er fullt oppgradert (maks stack); T3 krever at T2 er fullt oppgradert.

| Vei | Fokus | T1 | T2 | T3 |
|-----|-------|----|----|-----|
| **Krigar** | Kamp | Kraftig slag (+2 ATK) | Kampherdet (+2 ATK +1 DEF) | Jotunstyrke (+5 ATK) |
| **Vokter** | Forsvar | Tykk hud (+1 DEF) | Festning (+1 DEF +1 HP) | Jernhelse (+2 HP) |
| **Jeger** | Syn/Krit | Skarpsyn (+2 syn) | Vitalt anslag (+25% krit) | Presisjon (+3 ATK) |
| **Skurk** | Nytte | Kunnskap (+30% XP) | Unnvikelse (+20% dodge) | Blomstersaft (hel 2 HP) |
| **Dyrevokter** | Kjæledyr | Villskap (+2 pet ATK) | Dyrisk livskraft (+3 pet HP, +1 pet DEF, potion healer pet) | Sjelsbånd (+3 pet ATK, +3 pet HP) |

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

## 13b. Elements-mod – Fase 1: Geologi (v0.23)

Elements-modifikasjonen fletter det periodiske system, geologi, metallurgi og kjemi inn i spillet. Fase 1 legger geologi-grunnlaget.

### Nye datafiler
- `src/data/elements.js` – ~50 grunnstoffer med symbol, atomnummer, kategori, tier (1-6), farge
- `src/data/minerals.js` – ~20 malmer og ~10 krystaller med utbyttetabell (yields), energikostnad, smeltetid
- `src/systems/ElementTracker.js` – Sporer oppdagelser og gruppeprestasjoner

### Mineraler i labyrinten
- 2-5 mineraler spawner per etasje, skalert etter verden (tier-gulv med tilfeldig oppover-spredning)
- Monstre har 15% sjanse for mineral-drop (boss = 100%, høyere tier)
- Mineraler stabler til 10 per ryggsekk-plass

### Spesialrom
- **Steinbrott** (verden 1+, 30% sjanse): 3-5 malmer, T1-T2
- **Krystallhule** (verden 3+, 20% sjanse): 2-4 edelstener

### Elementbok (B-tast)
Periodisk system-overlay med 18×9 rutenett. Oppdagede grunnstoffer vises med symbol og kategori-farge. Gruppeprestasjoner (f.eks. Jernmetaller → +2 HP) vises nederst.

### Geolog-skillsti (#6)
Låses opp ved første mineral-funn. 3 tiers:
| Tier | Skill | Effekt |
|------|-------|--------|
| T1 | Malmøye | +1 mineral-synsradius per stack (maks 3) |
| T2 | Effektiv utvinning | +25% mineralutbytte per stack (maks 3) |
| T3 | Mesterprospektør | Garantert T4+ mineral per etasje (maks 1) |

Synergi: **Jordens kraft** (Geolog + Vokter) → +1 forsvar, +1 mineralsynsradius.

### Fase 2: Metallurgi (v0.24)

Smelting, legeringer og smiing av utstyr.

**Leirplass (Camp Room):** Garantert fra verden 2+, 50% sjanse i verden 1. Trygg sone med smelteovn og **persistent lager (stash)** der spilleren kan lagre mineraler, brensel og andre ressurser mellom besøk. Frigjør ryggsekken for kamp. Åpnes med V-tast.

**Smelting:** Mineraler + brensel → rene grunnstoffer. Brensel (tre=1, kull=3 energi) spawner i labyrinten.

**Legeringer:** 8 legeringer fra Bronse (T2) til Pt-Ir (T6). Krever rene grunnstoffer + energi.

**Smiing:** 12 nye våpen/rustninger fra legeringer. Stats overgår vanlig utstyr.

**Metallurg-skillsti (#8):**
| Tier | Skill | Effekt |
|------|-------|--------|
| T1 | Rask smelting | -25% energi og smeltetid per stack (maks 3) |
| T2 | Legeringsmester | +15% legering-stats per stack (maks 2) |
| T3 | Mestersmie | +25% stats på smidd utstyr (maks 1) |

### Fase 3: Kjemi (v0.25)

Kjemisk syntese av potions, bomber, medisiner og syrer fra rene grunnstoffer.

**Kjemisk laboratorium:** Spesialrom fra verden 3+ med grønn glød. Åpnes med C-tast. Filterbare oppskrifter etter kategori.

**Produkter:** 15 kjemiske produkter i 5 kategorier. Kraftigere enn vanlige consumables – kjemisk livselixir healer 4 HP (vs 2), krutt gjør 8 skade i radius 3 (vs 6 for vanlig bombe), dynamitt 15 skade.

**Kjemiker-skillsti (#9):**
| Tier | Skill | Effekt |
|------|-------|--------|
| T1 | Potente potions | +50% potion-varighet per stack (maks 3) |
| T2 | Syremestring | +30% kjemisk bombe-skade per stack (maks 2) |
| T3 | Eksplosjonsgenial | +50% skade, +1 radius på bomber (maks 1) |

### Fase 4: Verdensekspansjon (v0.26)

Spillet utvides fra 7 verdener til 25 etasjer fordelt på 5 geologiske soner.

**Soner:**
| Sone | Etasjer | Tema | Mineral-tier |
|------|---------|------|-------------|
| Overflatelag | 1-3 | Skog/Grotte | T1 |
| Grunnfjell | 4-7 | Is/Vulkan/Tempel | T2 |
| Dyplag | 8-12 | Magma (nytt) | T3 |
| Underverden | 13-18 | Lilla krystaller (nytt) | T4 |
| Jordens kjerne | 19-25 | Smeltet gull (nytt) | T5 |

**Soneboss:** Ekstra tøff boss (80+50×verden HP, 5+3×verden ATK) på siste etasje i hver sone.

**Nye spesialrom:** Malmkammer (5+), Hydrotermalkilde (8+), Gasslomme (10+), Magmakammer (18+).

### Fremtidige faser (ikke implementert)
- Fase 5: Fysikk og endgame (halvledere, fisjon, fusjon)

Se `docs/Elements-mod.md` for fullstendig designdokument.

---

## 13. Neste steg (prioritert)

1. ~~**Gull + handelsmann**~~ – ✅ Implementert i v0.13.
2. **Skilltre-utvidelse** – Legg til 2–3 ekstra ferdigheter per vei; kryss-vei-synergier.
3. ~~**Touch/mobil-støtte**~~ – ✅ Implementert i v0.9.
4. ~~**Leaderboard**~~ – ✅ Implementert i v0.14.
5. ~~**Frostbrent statuseffekt**~~ – ✅ Implementert i v0.14 (+ brann og stun).
6. **Refaktorering** – Splitte GameScene.js i mindre moduler (CombatManager, MapRenderer, etc.).
