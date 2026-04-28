# Endringslogg – Labyrint Hero

---

## v0.49 – 2026-04-28

### Nye funksjoner
- **Velkomst-popup ved første besøk:** Ny `WelcomeScene` åpnes automatisk første gang en spiller besøker hovedmenyen, og kan gjenåpnes med `[ INTRO ]`-knappen. Popup-en har fire stemnings­ladde sider — `LABYRINT HERO` (premiss og atmosfære), `HELTEN` (raser, startbonuser og ferdighetstre), `LABYRINTEN` (verdens­struktur, spesialrom og smelter/lab/akselerator) og `SLIK SPILLER DU` (detaljerte kontroller og spilltips). Lukkes med `[ START EVENTYRET ]`, `[×]`, ESC, eller ved klikk utenfor panelet — og «sett»-tilstanden lagres i `localStorage` slik at popup-en ikke dukker opp igjen automatisk
- **Mineral-wiki:** Ny scene `MineralWikiScene` som lister alle 60+ mineraler og krystaller med formel, tier, hvilke grunnstoffer de gir og hvor de spawner. Faner for `ALLE` / `T1`–`T6` / `KRYSTALLER` og en `MANGLENDE`-fane som viser hvilke grunnstoffer helten ennå ikke har oppdaget – og hvilke mineraler som er kjente kilder. Tilgjengelig fra ny `[ MINERAL-WIKI ]`-knapp i hovedmenyen og som overlay-knapp i inventaret

### Tekniske endringer
- WelcomeScene.js: Ny scene med `_pages`-array og `_renderPage()`-løkke. Naviger med Pil/SPACE/Klikk; ESC eller klikk utenfor lukker. Skip-hint vises kun ved første-gangs auto-åpning
- SaveManager.js: Nye metoder `hasSeenIntro()` og `markIntroSeen()` (separat `INTRO_KEY` slik at intro-flagget overlever `clear()`)
- MenuScene.js: Fjernet det gamle innebygde info-panelet. Auto-launcher `WelcomeScene` når `!SaveManager.hasSeenIntro()`. Bunnknapp-raden utvidet til tre: `[ INTRO ]` / `[ LEDERTAVLE ]` / `[ MINERAL-WIKI ]`
- MineralWikiScene.js: Ny scene som leser `MINERAL_DEFS`, `MINERAL_TIER_COLORS` og `ELEMENTS` direkte. Spawn-lokasjoner avledes ved å transkribere reglene fra `ItemSpawner.js` i en lokal `_getMineralLocations()` – ingen endringer i mineraldata kreves
- InventoryScene.js: Ny `Mineral-wiki`-knapp ved siden av `Elementbok [B]`
- main.js + index.html: Registrerer `WelcomeScene` og `MineralWikiScene`

---

## v0.48 – 2026-04-25

### Nye funksjoner
- **Mer variasjon mellom monstertyper (#128):** Hver monstertype har nå et eget oppførselsmønster i tillegg til ulike statistikker:
  - **Goblin (erratisk):** Nøler tilfeldig (~18%) før den angriper – uforutsigbar bevegelse
  - **Skjelett (bueskytter):** Skyter pil for halv skade når helten er på samme rad/kolonne (avstand 2–4) med fri sikt – angriper uten å bevege seg
  - **Troll og Golem (treg):** Beveger seg kun annenhver tick – tunge motstandere som spilleren kan kite
  - **Wraith (fasende):** Beveger seg gjennom vegger – kan ikke sperres inne i labyrintkorridorer
  - **Demon (brennende):** 30% sjanse for å påføre 3-turns brann ved nærkampangrep
  - Orker beholder sin gift-sjanse, bosser sine fase-2-mekanikker

### Balanseendringer
- **Bedre XP-skalering for høyere verdener (#128):** Monster-XP skaleres nå med `1 + 0.30·(verden−1) + 0.20·max(0, verden−8)`. Et monster i verden 25 gir ~11.6× XP sammenlignet med verden 1, slik at ferdighetsopplåsning følger den eksponentielle XP-kurven (`XP_GROWTH = 1.55`)
- **Bosser skalerer nå XP med verden:** Vanlige bosser fikk tidligere flat 150 XP uavhengig av verden. Både `boss` og `zone_boss` ganges nå også med xpScale

### Feilrettinger
- **Elementbok: lantanoider plassert for langt fra aktinoider (#127):** Lantanoid-raden satt rett under hovedtabellen mens aktinoid-raden lå betydelig lenger ned. Begge radene er nå gruppert sammen med en liten luft til hovedtabellen, slik en standard periodisk tabell skal være. «Ln»/«An»-etiketter justert tilsvarende

### Tekniske endringer
- Monster.js: Nye oppførselsflagg `moveCadence`, `canPhase`, `isArcher`, `isErratic`, `burnsOnHit` og `tickCount`. Ny `xpScale`-formel anvendt på alle monstertyper inkludert bosser
- MonsterManager.js: Tick-loopen respekterer `moveCadence` for trege monstre. `_moveMonster()` har egne grener for goblin-nøling, skjelett-bueskyting og wraith-faseflytting. Nye hjelpere `_hasClearShot()` og `_fireArrow()`
- CombatManager.js: `monsterAttack()` påfører `applyBurn(3)` ved demonangrep
- ElementBookScene.js: Lantanoid-/aktinoid-radoffset endret fra `row >= 8` til `row >= 7`, slik at lantanoidene (rad 7) også flyttes ned til 8.5 og aktinoidene (rad 8) til 9.5. «Ln»-etiketten flyttet fra y=9.5 til y=8.5

---

## v0.47 – 2026-04-25

### Nye funksjoner
- **Victory-scene ved 118 grunnstoffer:** Når spilleren samler alle 118 grunnstoffer trigges en episk victory-scene med fanfare, gullpartikler, mini periodisk tabell, og tittelen «Guds periodiske system». Victory kan trigges umiddelbart (i spill-scenen) eller ved verdensavslutning
- **New Game+ (NG+):** Etter victory kan spilleren starte en ny reise med beholdte levels/skills/gull, men nullstilt elementsamling. Monstre skaleres +40% HP og +25% angrep per NG+-syklus
- **Victory-badge i meny:** Spillere som har fullført spillet ser gull-badge «✦ Guds periodiske system» med NG+-nivå i hovedmenyen
- **NG+-indikator i HUD:** Sonenavn viser NG+-syklus (f.eks. «Overflatelag 1/3 NG+1»)
- **Victory-fanfare:** Ny prosedyregenerert lyd med stigende arpeggio og vedvarende akkord

### Feilrettinger
- **Transmutasjon trigget ikke elementbonuser (#bug):** ChemLabScene._doTransmute() manglet checkCompletions() etter transmutasjon — grunnstoffer oppdaget via transmutasjon kunne ikke trigge bonuser som «Guds periodiske system»
- **Elementbok viste feil mål:** Endret fra «X/90» (kun naturlige) til «X/118» (alle grunnstoffer) for å reflektere spillets faktiske mål

### Tekniske endringer
- constants.js: Ny `FINAL_WORLD = 25` konstant
- HeroCrafting: Nye felt `ngPlusLevel` og `victoryAchieved` med serialisering/deserialisering
- ElementTracker: Emitter `elementBonusComplete` via EventBus ved bonus-fullføring
- GameScene: Lytter på `elementBonusComplete` for umiddelbar victory-trigger; `_checkExit()` sjekker alle 118 samlet
- GameOverScene: Ny `_gameCompleteScreen()` med sparkle-partikler, mini periodisk tabell, NG+-start
- MonsterManager: NG+-skalering stacker med vanskelighetsgrad-multiplikatorer
- AudioManager: Ny `playVictory()` metode

---

## v0.46 – 2026-04-19

### Forbedringer
- **Færre touch-knapper, kontekstsensitiv ÅPNE-knapp:** Menyknapper redusert fra 6 til 3 (INV, SKL, ÅPNE). ÅPNE-knappen endrer farge og label dynamisk basert på heltens plassering: BOK (elementbok) → SMI (leirplass) → LAB (kjemilab) → ACE (akselerator). Løser også manglende akselerator-knapp for mobil (#108)
- **Minikart-toggle via trykk:** På touch-enheter kan minikartet nå toggles ved å trykke direkte på det, i stedet for en egen MAP-knapp

### Tekniske endringer
- TouchControls: Ny `_createContextButton()` og `updateContextButton(gameScene)` for dynamisk knapp. Fjernet `updateVisibility()` og individuelle menyknapper
- GameScene: Ny `_handleTouchOpenContext()` erstatter individuelle touch-scene-handlinger. Tastaturkontroller (V, C, P, B) uendret
- UIScene: Interaktiv sone over minikartet for touch-toggle. Kaller `updateContextButton()` i refresh

---

## v0.45 – 2026-04-18

### Feilrettinger
- **Scroll i menyer påvirket kamerazoom (#123):** Musehjul-scroll i overlay-scener (Smelteovn, Kjemilab, Inventar, Elementbok, Skilltre, Akselerator, Innstillinger) blokkerer nå zoom-endring i GameScene. Også lagt til AcceleratorScene i input-blokkeringen
- **Skilltre-synergier overlappet med T4-skills (#115):** Synergy-seksjonen beregner nå posisjon dynamisk basert på faktisk antall tiers i stedet for hardkodet 3. T4-badge vises nå korrekt
- **Potions fra kjemilab healte fullt (#121):** Redusert potionScale fra 0.4 til 0.15 per verden for mykere skalering. 25% maxHP-gulv gjelder nå kun T3+ potions. Fikset serialisering: molekyl-items i ryggsekk og quick-use gjenskaper nå `use()`-funksjonen korrekt ved innlasting

### Nye funksjoner
- **Grunnstoff-filtrering i Kjemilab (#109):** Klikkbare grunnstoff-ikoner øverst filtrerer oppskrifter etter ingrediens. Grunnstoffer man ikke har vises dimmet
- **Egen Transmutasjon-tab i Kjemilab (#111):** Ny fane «Transmutasjon» med dedikert visning av alle tilgjengelige transmutasjoner, input → output og knapper. Kun synlig når transmutasjon er låst opp
- **Større kjemilab-vindu (#117):** Kjemilab-panelet utvidet fra 760×600 til 960×720 for bedre oversikt

### Balanseendringer
- **Skilltre-synergier krever høyere tier (#116):** 6 av 12 synergier krever nå T2-skills fra begge stier i stedet for bare T1. Påvirkede synergier: Smiekunst, Alkymist, Giftjeger, Transmutasjon, Atomsmedja og Kvantekjemi. Tier-krav vises i synergi-oversikten

### Tekniske endringer
- InputHandler: Wheel-handler sjekker `scene.isActive()` for alle overlay-scener før zoom
- GameScene: `blocked`-variabel inkluderer nå AcceleratorScene
- SkillScene: `cardsEndY` beregnes fra `maxTiers` dynamisk, tier-badge bruker `'T' + (tierIndex + 1)`
- skills.js: `getActiveSynergies()` sjekker `pathMaxTier` mot `syn.minTier` (default 1). 6 synergier har fått `minTier: 2`
- ChemistrySystem: `potionScale` redusert (0.15/verden). 25% maxHP-gulv kun for `mol.tier >= 3`
- Inventory: Deserialisering gjenskaper `_chemItem` via `ChemistrySystem._createUsableItem()` for molekyler i quickUse og backpack
- ChemLabScene: Tab-system (Oppskrifter/Transmutasjon), grunnstoff-filterrad, større panel
- **Partikkelakselerator spawner nå fra verden 13+ (#108):** Akselerator-rom plasseres nå før valgfrie rom (malmkammer, hydrotermisk, gasslomme, magmakammer) i prioritering, slik at dead-ends er tilgjengelige
- **Lettere å finne basis-grunnstoffer i høyere verdener (#119):** 20% sjanse for å rulle tier 1-2 mineral uansett verdensnummer, sikrer tilgang til Al, Fe, Cu og andre viktige elementer
- **Elementbok: lantanoider/aktinoider flyttet ned (#113):** Økt avstand (1.5 rader) mellom hovedtabellen og lantanoider/aktinoider. Lagt til «Ln»/«An»-etiketter. Gruppebonuser vises nå i flere rader
- **Elementbok: viser raffinerte grunnstoffer (#120):** Tooltip viser nå antall rene/raffinerte former ved siden av rå-antallet (f.eks. «Lagret: 12 (3 ren)»)

### Nye funksjoner (Sprint 4)
- **Delvis bruk av energikilder (#112):** Ubrukt energi fra brensel lagres nå i en reserve (`fuelReserve`) som brukes ved neste crafting-operasjon. Kull (3 energi) brukt på 1-energi-oppskrift bevarer 2 energi til neste gang
- **Smi nøkler og hakker (#122):** Nye smi-oppskrifter: Smidd nøkkel (bronse), Smidd hakke (stål). Viktige verktøy kan nå produseres i stedet for å finnes tilfeldig
- **Forstørrelsesbelte – øk ryggsekk (#118):** Nytt smi-objekt fra skandium som gir +3 ryggsekk-plasser. Kan oppgraderes maks 2 ganger (totalt +6 plasser)
- **Tooltip over mineraler i Lager (#110):** Hover over mineral i Lager-fanen viser tier og hvilke grunnstoffer det gir
- **Tydelige meldinger ved gruppeprestasjoner (#114):** Element-gruppeprestasjoner og synergier vises nå med stor, tydelig tekst (★-merket) på spillskjermen. Gjelder for smelting, akselerator og mineral-oppsamling

### Forbedringer (oppfølging)
- **Partikkelakselerator synlig på kart og minikart:** Akselerator-rom har nå distinkt lilla sci-fi-dekorasjon med ringstruktur, energikjerne og partikkelspor. Spesialrom (leirplass, kjemilab, akselerator) vises nå med fargekodede markører på minikartet
- **Jevnere mineralfordeling i høyere verdener:** Ny vektet fordeling: 15% 3 tier under, 20% 2 under, 20% 1 under, 35% aktuell tier, 10% tier over. Sikrer T1-T3 mineraler selv i verden 13+
- **Grunnstoff-filtrering i Smelteovn:** Klikkbare grunnstoff-ikoner øverst i Smelt-, Legering- og Smi-faner filtrerer oppskrifter etter ingrediens-element. Samme layout som Kjemilaben

### Tekniske endringer
- MapRenderer: Ny `accelerator` case med lilla ringstruktur og metallvegger
- UIScene: Minimap viser camp_room (oransje), chem_lab (grønn), accelerator (lilla) markører
- minerals.js: `rollMineralTier()` redesignet med 5-trinn vektet fordeling i stedet for hard base-tier
- SmelteryScene: Ny `_drawElementFilterRow()` med klikkbare grunnstoff-badges, element-filter på legerings-tab
- maze.js: Akselerator-plassering flyttet opp i `_placeSpecialRooms()` prioritet
- minerals.js: `rollMineralTier()` har 20% sjanse for basis-tier (1-2) fra verden 5+
- ElementBookScene: `yOffset` for rows >= 8 økt til `+1.5`, lantanoid/aktinoid-labels, multi-rad bonuser, raffinert-telling i tooltip
- SmeltingSystem: `fuelReserve` deduceres først i `consumeFuel()`, overskudd lagres tilbake. `calculateFuelEnergy()` inkluderer reserve
- HeroCrafting: Nye felter `fuelReserve`, `_backpackUpgrades` med serialisering
- alloys.js: Nye smi-oppskrifter `forged_key` (bronse), `forged_pickaxe` (stål), `backpack_upgrade` (skandium)
- SmelteryScene: Mineral-tooltips med tier og yields i Lager-fanen
- ItemSpawner/SmelteryScene/AcceleratorScene: Bonus-meldinger bruker `big: true` for tydeligere visning

### Nye funksjoner (Sprint 5)
- **Varierte gjenstandssprites (#124):** Potions (flaskeform), dynamitt (røde pinner med lunte), bomber (rund med lunte), syrer (boblende flaske). Både verdenskart og inventar-ikoner er oppdatert
- **4 nye monstertyper (#125):** Skjelett (verden 4+, høy ATK), Golem (verden 6+, høy HP/lav ATK), Skygge (verden 8+, lilla, unnvikende), Demon (verden 10+, rød, brann). Hver type har unike prosedyregenererte sprites og tilpassede stats

### Tekniske endringer (Sprint 5)
- ItemGraphics: Nye `drawWorldIcon`/`drawInventoryIcon`-case for `_chemType` (potion, explosive, acid, medicine)
- constants.js: 4 nye monster-entries i HP/ATK/COLOR/XP-tabellene
- MonsterManager: `_monsterPool()` utvides til 11 verdener med gradvis innføring av nye monstre
- MonsterGraphics: Nye `drawSkeleton`, `drawGolem`, `drawWraith`, `drawDemon` prosedyre-sprites
- Monster.js: Switch-case og delegat-metoder for de 4 nye typene

---

## v0.44 – 2026-04-17

### Nye funksjoner
- **Alle 6 gameplay-teknologier er nå fullt implementert:**
  - **Kraftfelt:** Absorberer opptil 15 skade per etasje. Regenererer automatisk ved ny etasje. Visuell indikator i HUD
  - **EMP-pulsgenerator:** 1 ladning per etasje. Trykk G for å lamme alle monstre i 50 runder. Blå flash-effekt
  - **Laserturret:** 2 ladninger per etasje. Trykk H for å plassere. Automatisk 4 skade/runde mot monstre innen 5 ruter. Laserstrål-animasjon
  - **Teleporter-noder:** Trykk J for å plassere noder (maks 5). Stå på en node og trykk J for å teleportere til neste. Sirkulær navigering
  - **Elementskanner:** Alle mineraler vises automatisk på minikartet (grønne prikker) uavhengig av tåke
  - **Ruteberegner:** BFS-pathfinding viser optimal rute til exit som grønn sti på minikartet

### Tekniske endringer
- Hero.takeDamage: Kraftfelt-absorpsjon før HP-tap med flytende tekst
- CombatManager: Nye `handleEMP`, `handlePlaceTurret`, `handleTeleporter`, `tickLaserTurrets` med laser-beam-animasjon
- UIScene minimap: BFS pathfinding (`_bfsPath`), elementskanner-overlay, turret/teleporter-noder-visning
- UIScene HUD: Tech-status-indikatorer (kraftfelt HP, EMP/turret-ladninger, teleporter, rute, skanner)
- InputHandler: G/H/J hurtigtaster for EMP/turret/teleporter
- GameScene: Teknologi-effekter initialiseres per etasje (kraftfelt regen, EMP/turret-ladninger)
- HeroCrafting: `empCharges`, `laserTurretCharges` i init/serialize/applyStats
- MonsterManager: Laserturret-tick integrert i monster-syklusen

---

## v0.43 – 2026-04-17

### Nye funksjoner
- **Halvleder-system med raffinering og teknologi:** Trestegs prosess: (1) Raffiner rå elementer til halvlederkvalitet (6 oppskrifter), (2) Kombiner raffinerte materialer til halvledere (6 typer, Si-wafer bruker Si+B+P-doping), (3) Installer permanente teknologier som låser opp nye mekanikker
- **Ny «Raffiner»-fane i Smelteovn:** Konverterer rå elementer til ultra-rene varianter (f.eks. 5 Si → 1 Rent Si). Høy energikostnad. Viser raffinert lagerbeholdning
- **10 permanente teknologi-oppgraderinger** via ny «Teknologi»-fane:
  - Ruteberegner (Si): optimal rute til exit/boss/chest på minikartet
  - Elementskanner (Ge): avslører alle elementer på etasjen
  - Laserturret (GaAs): plasserbar automatisk turret (4 skade/runde)
  - Teleporter-noder (ITO): plassér og teleportér fritt mellom rom
  - EMP-puls (SiC): slår ut alle monstre i 50 runder
  - Kraftfelt (CdTe): 15-skade energibarriere, regenererer mellom etasjer
  - Solcellepanel (CdTe): +30 gratis energi per verden
  - Termoelektrisk gen. (Ge): +50 energi i vulkan/magma-soner
  - Reaktorkontroll (Si): +50% fisjon/fusjon-energieffektivitet
  - Superleder-kabling (GaAs): -30% energikostnad på all smelting/crafting

### Tekniske endringer
- alloys.js: REFINING_RECIPES (6), redesignet SEMICONDUCTOR_DEFS (raffinerte inputs, Si+B+P), TECH_UPGRADES (10 stk). SEMICONDUCTOR_EQUIPMENT fjernet
- SmeltingSystem: `canRefine/refine`, `canCraftSemiconductor/craftSemiconductor`, `canInstallTech/installTech`. Energiteknologier i `calculateFuelEnergy` og `_adjustedEnergyCost`
- SmelteryScene: Nye «Raffiner» og «Teknologi»-faner. Halvleder-kode fjernet fra legering/smi
- HeroCrafting: `refinedElements`, 10 tech-flagg, `teleporterNodes`, `techForceFieldHP`
- Inventory: critBonus, dodgeBonus, regenBonus i `_apply`/`_unapply`

---

## v0.42 – 2026-04-16

### Nye funksjoner
- **Fase 5: Fysikk og transurane grunnstoffer** – Alle 118 grunnstoffer er nå i spillet. 28 syntetiske elementer (Tc, Pm, Np-Og) må produseres i partikkelakseleratoren
- **Partikkelakselerator-rom:** Dukker opp fra verden 13 (20% sjanse), garantert fra verden 15. Åpnes med P-tast. Komplett UI med scrollbar, energikostnad og tier-gating
- **Realistisk transuran syntese:** Hver oppskrift gjenspeiler ekte kjernefysikk – nøytronbombardering for Np/Pu, alfa-bombardering for Cm, tungione-bombardering for transaktinider, Ca-48 varmfusjon for supertunge (Fl-Og). Krever tilhørende input-grunnstoffer som forbrukes
- **Fysiker-skillsti (6. sti):** T1 Halvledergrunnlag (halvledercrafting + mineraltiltrekning), T2 Strålingsshield (immunitet mot stråling + loot-bonus), T3 Fisjonsbeherskelse (2× energi fra U/Th, låser tier 1-3 syntetiske), T4 Fusjonspioner (5× energi fra He, låser alle syntetiske)
- **Fisjon/fusjon-energi:** U gir 50 virtuell energi (×2 med Fisjon T3), Th gir 40. Fusjon bruker D-T-reaksjonen: H (deuterium, 80 energi) + Li (tritiumkilde via Li-6+nøytron, 150 energi), ×5 med Fusjon T4. He er biprodukt, ikke brensel. Gjør endgame-syntese gjennomførbar
- **15 nye mineraler:** Vanadinitt (V – fikser uraftbar titanleger.), bromargyryt (Br), jodyritt (I), germanitt (Ge), stibnitt (Sb), gallitt (Ga), xenotim (Y+Dy+Er+Yb), samarskitt (Sm+Gd+Pr), celestin (Sr), pollucitt (Cs+Rb), calaveritt (Te+Au), inditt (In), thoritt (Th). PGM-malm gir nå også Pt, Ir og Os
- **Edelgass-samling:** Gasslommer (verden 10+) gir nå 1-2 tilfeldige edelgasser (Ar/Kr/Xe/Ne/He) direkte i elementtrakeren
- **Endgame: Guds periodiske system:** Samle alle 118 grunnstoffer gir +10 ATK, +10 DEF, +5 hjerter, +3 syn og tittelen «Guds periodiske system»
- **Nye synergier:** Atomsmedja (Fysiker+Metallurg: +3 ATK, −25% akselerator-energi) og Kvantekjemi (Fysiker+Kjemiker: +30% potion, +20% bomberadius)

### Feilrettinger
- **Handelsmann NaN-pris:** Brenselprisen brukte `fuel.energy` (undefined) i stedet for `fuel.energyValue`. Naturgass viste «NaNg»

### Tekniske endringer
- elements.js: 118 elementer (90 naturlige + 28 syntetiske med `synthetic: true`). TRANSURANIC_RECIPES med 28 oppskrifter. Ny TOTAL_ALL_ELEMENTS-konstant. `all_92_natural`-bonus filtrerer nå ut syntetiske
- minerals.js: 15 nye mineraler i MINERAL_DEFS og MINERAL_POOL
- skills.js: Ny `fysiker`-sti med 4 tiers + `accelerator_found` unlockCondition + 2 nye synergier
- AcceleratorScene.js: Komplett overlay-scene med scrolling, tier-gating, element-forbruk og energikostnad
- SmeltingSystem: `calculateFuelEnergy()` legger nå til virtuell energi fra U/Th (fisjon) og He (fusjon)
- ElementTracker: `applyBonusRewards()` støtter nå `godMode`-belønning
- GameScene: Ny `_checkAccelerator()` + P-tast for å åpne akseleratoren
- maze.js: Ny `accelerator`-romtype fra verden 13+
- HeroCrafting: 10 nye hero-egenskaper for fysikerstate
- ItemSpawner: Edelgass-samling fra gasslommer, fikset `fuel.energyValue`

---

## v0.41 – 2026-04-16

### Nye funksjoner
- **Forbedrede kjæledyr (#41):** Kjæledyrene har fått 60-80% mer basis-HP (Rev 8→14, Katt/Ugle 6→12, Drage 10→18) slik at de overlever lengre i kamp. Når kjæledyret dør øker eggsjansen på neste nivå fra 35% til 50% for å gjøre det lettere å få en ny kompanjong
- **Kjæledyr-utstyr (#41):** Kjæledyrene har nå to utstyrsplasser (klo/våpen + rustning/halsbånd). 8 nye smidde gjenstander fra eksisterende legeringer: bronsekløer, ståltenner, wolframkløer, fosfortenner, bronsehalsbånd, stålsele, skandiumvest og titansele. Forges i Smi-fanen og utstyres automatisk på kjæledyret. Utstyr vises og håndteres i inventoret
- **Kjæledyr-kjemi (#41):** 2 nye kjemiske oppskrifter for permanente kjæledyr-oppgraderinger: Kjæledyr-vitalitet (Ca+Fe+Mg) gir +3 permanent maks HP, og Vekst-elixir (La+Ca+P) gir +1 permanent angrep. Krever elements-mod-materialer
- **Kjæledyr-utstyrspanel:** InventoryScene viser nå kjæledyrets utstyrsplasser med klo- og rustningsikon, samt utvidet stat-visning (inkludert DEF fra utstyr). Klikk for å fjerne utstyr tilbake til ryggsekken

### Tekniske endringer
- Pet.js: Ny `equipped` objekt med `weapon`/`armor` plasser; `effectiveAttack`/`effectiveMaxHp`/`effectiveDef` inkluderer utstyrsbonuser (`petAtk`/`petDef`/`petHp`). Nye `equipItem()`/`unequipItem()`-metoder. Serialisering/deserialisering inkluderer utstyr via PET_EQUIPMENT oppslag
- alloys.js: Ny `PET_EQUIPMENT` konstant med 8 kjæledyr-gjenstander knyttes til eksisterende legeringer (bronse, stål, wolfram, fosfor, skandium, titan)
- molecules.js: 2 nye kjæledyr-medisinoppskrifter (`pet_vitality`, `pet_growth`) med nye `onUse`-typer
- ChemistrySystem: Nye `pet_permanent_hp` og `pet_permanent_atk` effekthandlere i `_createUsableItem()`
- SmeltingSystem.getForgeableEquipment(): Returnerer nå PET_EQUIPMENT i tillegg til ALLOY_EQUIPMENT
- SmelteryScene: Ny `_doPetForge()` – smir kjæledyr-utstyr og utstyrer det automatisk. Smi-fanen viser 🐾-merke på kjæledyr-gjenstander
- InventoryScene: Ny `_makePetEquipSlot()` for utstyrsplasser; panelhøyde utvidet; stat-visning inkluderer DEF
- ItemSpawner: Eggsjanse ved kjæledyr-død økt fra 35% til 50%

---

## v0.40 – 2026-04-15

### Nye funksjoner
- **Utvidet element-bruk (#99):** 2 nye mineraler (molybdenitt, barytt), **6 nye legeringer** (manganstål, molybdenstål, wolframkarbid, tantalplate, fosforkrystall, **skandiumlegering**) og 8 nye smidde utstyrsstykker (inkludert skandium-rapir og skandium-harnisk – romfartsinspirert lett rustning). 8 nye kjemikalier: sinkklorid-antiseptikum, bor-signalbombe, barium-fyrverkeri, thermittladning (25 skade, ignorer 4 Def), neodym-magnetbombe (22 skade, radius 5), wolfram-styrkedrikk, lantan-livselixir (+10 HP), plasmakjerne (30 skade med plasmakjede). Tidligere ubrukte grunnstoffer som Mn, W, Ta, Mo, Ba, Ce, La, Nd, Nd, B og Zn har nå praktisk nytte
- **Bombeskade skalerer bedre i høyere verdener (#100):** Bombers verdensskala er økt fra +40% per verden til +60% per verden, pluss et flatt +2 skade per verden. Bomberadius får +1 fra verden 5 og +2 fra verden 8. Helbredelsespotions skalerer nå som 25% av maks HP fra verden 4+ så de forblir relevante. Syrebrenning varer +1 runde per 4 verdener
- **Ny bombemekanikk: Def-penetrering og plasmakjede (#100):** Thermittladning ignorerer 4 Forsvar ved treff. Plasmakjerne kjeder til 2 nærmeste fiender utenfor radius for 50% skade. Motoren støtter disse via `defPierce`- og `chain`-felter i molekyldefinisjoner
- **Skill-omarbeiding: Geolog, Metallurg, Kjemiker (#101):** Alle tre sti-er har fått økte tall og synlige effekter:
  - **Geolog T2 Effektiv utvinning:** 25%/50%/75% sjanse per stack for **dobbelt** utbytte (tidligere +25% flat). Popup-tekst ved utløsning
  - **Geolog T3 Mesterprospektør:** Garantert mineral oppgraderes til T5+ fra verden 5
  - **NY Geolog T4 Geode-splitter:** Hvert 10. mineral smeltet gir en gratis ekstra grunnstoff-enhet
  - **Metallurg T1 Rask smelting (maks stack):** Låser opp batch-smelting (×5) på minerallister
  - **Metallurg T2 Legeringsmester:** +25% legerings-stats per stack (opp fra +15%)
  - **Metallurg T3 Mestersmie:** +50% stats på smidd utstyr (opp fra +30%)
  - **NY Metallurg T4 Reforge:** Ruller stats på utstyrt våpen/rustning på nytt for 5 energi i smie-fanen
  - **Kjemiker T1 Potente potions:** +50% varighet *og* +25% styrke per stack (tidligere bare varighet)
  - **Kjemiker T2 Syremestring:** +40% skade (opp fra +30%) og syrebomber reduserer fiendes Forsvar med 2
  - **Kjemiker T3 Eksplosjonsgenial:** +50% skade, +1 radius *og* 60% «Dobbel brygging» på bombekrafting
  - **NY Kjemiker T4 Volatil mestring:** Bomber kjeder til 1 ekstra fiende ved 50% skade
- **Ny synergi: Transmutasjon (#101):** 3-sti-synergi (Geolog + Metallurg + Kjemiker). Låser opp konvertering av 5 av et grunnstoff → 1 av nabo (atomnummer ±1) i kjemilab via ↔-knapp på grunnstoff-merker. Hjelper med å bruke orphaned rare earths

### Tekniske endringer
- **CI-oppsett:** Ny `.github/workflows/ci.yml` kjører JS-syntaks-sjekk på alle filer samt nettleser-testsuiten (via headless Chromium + Playwright uten å legge til faste npm-avhengigheter). Ny `tests/ci-runner.js` fyrer opp en lokal statisk server, laster `test-runner.html`, og feiler jobben hvis noen tester feiler eller det er ukjente sidefeil. Noen allerede-ødelagte tester (`MINERAL_DEFS.copper_ore` → `chalcopyrite`, feil `chemistUnlocked`-forventning) er fikset som drive-by
- ChemistrySystem: Separat `bombScale` vs `potionScale` med flat bombgulv (`+world*2`); ny `transmute()`-funksjon; støtte for `defPierce` og `chain` på bombedefinisjoner; syrebomber kan nå redusere fiendes Forsvar via `chemAcidDefShred`
- SmeltingSystem.smelt() returnerer nå `doubled` og `geodeElement` for Geolog-effekter
- Inventory._apply/_unapply støtter `visionBonus` på utstyr (brukt av nye fosforkrystall-våpen/-skjold)
- skills.js: 3 nye T4-ferdigheter (Geode-splitter, Reforge, Volatil mestring); ny 3-sti synergy «Transmutasjon»
- HeroCrafting: 13 nye hero-egenskaper for nye ferdigheter (doubleYieldChance, geodeSplitter, batchSmeltSize, reforgeUnlocked, potionMagnitudeBonus, chemAcidDefShred, chemDoubleBrewChance, chemBombChain, transmutationUnlocked, m.fl.) – alle med serialize/applyStats-støtte
- SmelteryScene: Nytt `[ ×N ]`-batchknapp på smelt-fanen når maks-stack Rask smelting er nådd; ny Reforge-sekkjon øverst på Smi-fanen når Reforge er låst opp; Geolog-dobbelt-utbytte og Geode-drops vises som floating text
- ChemLabScene: Transmutasjon-hint + ↔-knapp per grunnstoff-merke når synergien er aktiv; «Dobbel brygging» gir automatisk ekstra bombe i inventoryen

---

## v0.39 – 2026-04-15

### Nye funksjoner
- **Mindre og mer lesbare leir-/kjemi-paneler (#98):** SmelteryScene krymper fra nesten hele lerretet (W-20 × H-20) til et sentrert panel på maks 1080×680, og ChemLabScene utvider litt til 760×600 for å romme større fonter. Tittel, faner, knapper og listetekst har fått økt skriftstørrelse (12–14px → 14–18px) for bedre lesbarhet
- **Drag-scrolling med mus og berøring (#98):** Begge scener støtter nå å scrolle ved å dra med musen eller med fingeren i tillegg til musehjulet. En 8px-terskel sørger for at korte klikk fortsatt utløser knapper
- **Scrollbar-indikator (#98):** Tynn vertikal scrollbar på høyre side av innholdsområdet viser nåværende posisjon og scroll-rekkevidde. Scroll-offset klampes automatisk til innholdets høyde slik at over-scrolling er umulig

### Tekniske endringer
- SmelteryScene: Ny `_clampScroll()`, `_viewportHeight()` og `_maxScrolls` per fane. Hver `_draw*Tab()` setter `_contentEndY` som brukes i `_refresh()` til å beregne maks scroll og tegne scrollbar-tommel
- ChemLabScene: Samme mønster for en enkelt `_scrollOffset`/`_maxScroll`. Panelet har også fått litt større karakter-portrett (120 → 130px)
- Felles input-mønster: `pointerdown`/`pointermove`/`pointerup` på scene-input med drag-threshold, eksisterer side om side med eksisterende `wheel`-handler

---

## v0.38 – 2026-04-13

### Nye funksjoner
- **Global ledertavle (#64):** Spillere kan nå sammenligne resultater med andre spillere over hele verden via en global ledertavle. Lokal og global fane med «Lokal»/«Global»-veksler. Globale resultater hentes fra en Cloudflare Worker + KV-backend
- **Nye ledertavle-kategorier (#64):** To nye kolonner i ledertavlen: «Min» (mineraler samlet) og «Elem» (grunnstoffer oppdaget). Begge spores gjennom hele spillet og lagres i ledertavlen
- **Global innsending ved verdensklarering:** Poengsummen sendes automatisk til den globale ledertavlen ved verdensklarering (brann-og-glem, blokkerer ikke seierskjermen). Feiler stille ved nettverksproblemer
- **Grunnleggende anti-juks:** Serveren avviser umulige poengsummer (f.eks. verden 25 på nivå 1, verdensklarering på under 10 sekunder)

### Tekniske endringer
- Ny fil `src/utils/GlobalLeaderboard.js`: API-klient med `submitScore()` og `fetchScores()` for global ledertavle
- Ny backend `backend/worker.js`: Cloudflare Worker med KV-lagring, REST API (`POST /scores`, `GET /scores`), CORS-støtte og anti-juks-validering
- HeroCrafting: Ny `mineralsCollected`-egenskap som økes ved mineralopptak i ItemSpawner
- Leaderboard: Nye felter `mineralsCollected` og `elementsDiscovered` i innleggsobjektet
- LeaderboardScene: Fullstendig omskrevet med fane-veksler (Lokal/Global), lasting/feiltilstander og 10 kolonner
- GameOverScene: Sender inn poengsum til global ledertavle ved verdensklarering

---

## v0.37 – 2026-04-13

### Nye funksjoner
- **Komplett periodisk system:** Alle 90 naturlige grunnstoffer (H–U, unntatt syntetiske Tc og Pm) er nå i spillet. Elementboken viser et komplett periodisk system med lantanider og aktinider
- **12 nye mineraler:** Boraks, thortveititt, zirkon, pentlanditt, spodumen, kobaltitt, kolumbitt, monazitt, bastnäsitt, greenockitt, wolframitt og PGM-malm gir spillere tilgang til nye grunnstoffer
- **8 nye elementbonuser:** Alkaliske jordmetaller (+15% rustning), platinametaller (+30% legeringskvalitet), aktinider (fisjon), periode 3 (mineraler hos handelsmann), periode 4 («Industrialist»-tittel), alle ikke-metaller (2× potionsstyrke), alle lantanider (magisk AoE), alle 92 naturlige («Elementmester»)
- **Elementbonuser gir nå reelle belønninger:** Fullførte elementgrupper gir faktiske gameplay-bonuser (HP, gullfunn, giftresistans, XP, rustning, legeringskvalitet, potionsstyrke) i stedet for bare en melding
- **Handelsmann selger mineraler og brensel:** Handelsmannen tilbyr nå ett mineral (verden 1+) og brensel (verden 5+) i tillegg til vanlige varer
- **Olje og naturgass:** Nye brenseltyper med 8 og 10 energi. Finnes i gasslommer fra verden 10+
- **Mineraler på minikartet:** Geologer med Malmøye-skill ser nå mineralplasseringer som fargede prikker på minikartet
- **Hurtigreise mellom soner:** Etter å ha fullført en sone vises en «HURTIGREISE»-knapp på seiersskjermen. Velg en fullført sone for å starte der
- **Syrebrenning på monstre:** Syrebomber gir nå etsende skade over tid (reduserer forsvar med 1 per runde) i stedet for et engangskutt. Forsvar gjenopprettes når effekten utløper
- **Stun-system for monstre:** Monstre med stun-effekt hopper over sin tur

### Tekniske endringer
- ElementTracker: Ny `applyBonusRewards(hero)`-metode som anvender fullførte bonuser på helten (idempotent)
- HeroCrafting: 11 nye hero-egenskaper for elementbonuser (elementGoldMul, elementPoisonResist, elementArmorBonus, etc.)
- Monster: Nye `applyStun()`, `applyAcidBurn()` og `tickStatusEffects()`-metoder
- MonsterManager ticker monsterstatus-effekter før bevegelse
- ItemSpawner: `_generateMerchantStock()` utvidet med mineraler og brensel. Ny `_mineralPrice()`-metode
- CombatManager: Elementgullbonus inkludert i gulldrop-beregning
- constants.js: Ny `getZoneStartWorld()`-hjelpefunksjon

---

## v0.36 – 2026-04-12

### Nye funksjoner
- **Smelteovn UI-forbedring (#85):** Panelet bruker nå nesten hele skjermen (W-20 × H-20) i stedet for 700×500px. Karakter-portrettet fjernet for å gi mer plass. Alle fire faner (Lager, Smelt, Legering, Smi) støtter nå scrolling med musehjulet. Scroll-indikatorer (▲/▼) vises når innholdet flyter over. Grunnstoff-merker er klikkbare for å filtrere minerallisten etter hvilke mineraler som gir et bestemt grunnstoff. Hover over et grunnstoff viser hvilke mineraler som er kilde til det

---

## v0.35 – 2026-04-11

### Nye funksjoner
- **Lukkeknapp på alle menyer (#92):** SkillScene (ferdighetstreet) har nå en ✕-knapp for å lukke i visnings-modus. LeaderboardScene har fått lukkeknapp og ESC-snarvei
- **Touch-kontroller omstrukturert (#88):** Handlingsknapper (ATK, BOW, USE) er nå separert fra menyknapper (INV, MAP, SKL, BOK, SMI, LAB). Menyknapper vises kun når funksjonen er opplåst. D-pad er nå DOM-basert og plasseres i letterbox-området ved siden av spillvinduet på brede skjermer. Nye touch-knapper for Skilltre (SKL) og Elementbok (BOK)
- **Tier 5-utstyr (#89):** Runesverd (+6 ATK), Mithriløks (+7 ATK), Dragebue (+7 ATK bue), Mithrilrustning (+5 DEF, +1 hjerte) tilgjengelig fra verden 9+

### Balansering
- **Enklere lett modus (#89):** Monster-HP multiplier redusert fra 0.65→0.50, angrep fra 0.75→0.60, XP-bonus økt til 1.30
- **Mykere monsterskalering (#89):** HP-vekst per verden redusert fra 0.5→0.35 (med ekstra 0.15 etter verden 8). Angrepsvekst redusert fra 0.25→0.20
- **Økt base-angrep (#89):** Helten starter med 3 angrep i stedet for 2
- **Bomber og potions skalerer med verden (#90):** Alle bomber, elixirer, helbredelse og buffs fra kjemisystemet skalerer nå +40% per verden. Base-skade på kjemibomber økt kraftig (salpeter 5→8, krutt 8→12, syrebombe 6→10, dynamitt 15→20). Vanlige bomber (8 base), styrkebrygg og forsvarsbrygg skalerer også
- **Sterkere blendgranater (#90):** Blendgranater reduserer nå monsterangrep med et fast tall som skalerer med verden, i stedet for å halvere

### Tekniske endringer
- TouchControls omskrevet: D-pad er nå DOM-basert (HTML-elementer) for plassering utenfor canvas. Reposisjoneres automatisk ved resize. Action/meny separert med dynamisk synlighet via updateVisibility()
- ChemistrySystem.synthesize() og _createUsableItem() mottar nå worldNum for skalering
- ChemLabScene sender worldNum ved oppstart
- Hero-objektet får worldNum satt i GameScene.create()
- GameScene håndterer nye touch-registreringsnøkler (touch_skilltree, touch_elementbook)
- UIScene kaller touchControls.updateVisibility() i refresh()

---

## v0.34 – 2026-04-10

### Nye funksjoner
- **Mineraler krever Geolog-skill:** Mineraler er nå usynlige på kartet uten Malmøye-skillen (Geolog T1). Helten kan fortsatt plukke opp mineraler blindt ved å gå over dem
- **Smelting krever Metallurg-skill:** Smelt-, Legering- og Smi-fanene i smelteovnen er låst bak Metallurg-skill. Lager-fanen er alltid tilgjengelig
- **Kjemi krever Kjemiker-skill:** Syntese i kjemisk lab er låst bak Kjemiker-skill
- **HUD-knapper:** Elementbok (📖), Skilltre (⚔) og Inventar (🎒) tilgjengelig som knapper øverst til høyre i HUD-baren
- **Nye opplåsingsbetingelser:** Metallurg-stien låses opp ved besøk i leirplass (ikke lenger ved første smelting). Kjemiker-stien låses opp ved besøk i kjemisk lab (ikke lenger ved første syntese)

### Tekniske endringer
- MapRenderer toggler mineral-grafikk synlighet basert på Geolog-skill i updateFog()
- SmelteryScene og ChemLabScene sjekker hero.skills[] for aktive skill-krav
- UIScene utvidet med 3 interaktive snarveiknapper
- Skill unlock conditions endret: metallurg='camp_room_found', kjemiker='chem_lab_found'
- Fjernet auto-unlock av metallurgist/chemist fra SmelteryScene og ChemistrySystem
### Forbedringer
- **Skarpere tekst:** `pixelArt:true` fjernet fra Phaser-config (tvang NEAREST-filtrering på tekst). All tekst rendres i 2× oppløsning. CSS `image-rendering: pixelated` fjernet fra canvas
- **Tekst-overflow fikset:** Varenavn i handelsmann, tooltips i inventar, mineralnavn i smelteverket, molekylnavn i kjemilabben og utstyrsnavn i HUD forkortes/brytes nå slik at de holder seg innenfor panelgrensene
- **Inventar-tekst:** Utstyrsnavn, hurtigbruk og ryggsekk-etiketter krympet til 11px med trunkering for å holde seg innenfor rammene
- **Elementbok:** Tabellen er høyere (cellehøyde 28→36px, panel 580→700px). Symboler vist i 14px med atomnummer i 10px for bedre lesbarhet
- **Ferdighetstreet:** Karakter-portrettet fjernet for å unngå overlapp. Synergier flyttet opp rett under skill-kortene med flerradslayout (5 per rad)

---

## v0.33 – 2026-04-10

### Nye funksjoner
- **Flerstemt musikksystem:** Helt nytt musikksystem med flerstemt polyfoni (3-5 stemmer per stykke) i stedet for den gamle enkeltstemme-sekvenseren
- **8 Grieg-inspirerte komposisjoner:** Morgenstemning, Dovregubbens hall, Solveigs vuggevise, Trollenes marsj, Holberg Suite, Peer Gynts hjemkomst, Åses død og Triumfmarsj
- **Variable notelengder:** Hver stemme har nå individuelle notelengder i stedet for fast 1/16-takt
- **Velocity-humanisering:** Subtil tilfeldig volumvariasjon per note for mer levende lyd
- **Ren stopp av musikk:** Aktive oscillatorer stoppes umiddelbart ved sceneskifte eller musikk-av

### Tekniske endringer
- Ny `musicPieces.js` datafil med 8 stykker, notefrekvenstabell og hjelpe-funksjoner
- AudioManager omskrevet med look-ahead scheduling (Web Audio API-tidsstyrt) for presis flerstemt synkronisering
- Musikkdata separert fra logikk (følger eksisterende mønster med separate datafiler)

---

## v0.9 – 2026-04-09

### Nye funksjoner
- **Større og lesbar tekst (#79):** Alle fontstørrelser i spillet økt med 2-3px. Minimumsstørrelse er nå 10px (fra 7px). Bedre lesbarhet i alle scener og menyer
- **Forbedret karakterskaper (#80):** CharacterCreatorScene bruker nå hele 1280×800-lerret. Større rasetabs (120px), bredere stat-barer (220px), større bonusknapper, større navnefelt. Alle fonter økt til 13-15px
- **Touch-zoom og fullskjerm (#78):** Nye knapper for zoom inn (+), zoom ut (−) og fullskjerm (⛶) øverst til høyre for berøringsskjermer. Fullskjerm bruker Fullscreen API med webkit-fallback
- **Geolog-skillz styrket (#81):** Malmøye gir nå også mineral-identifisering – uten Geolog-skill vises mineraler som «Ukjent mineral» og elementer oppdages ikke automatisk. Effektiv utvinning gir nå +1 ekstra element per smelting
- **Metallurg-skillz styrket (#81):** Rask smelting gir nå også +15% sjanse for ekstra utbytte. Legeringsmester gir 20% sjanse for dobbel legering-output. Mestersmie økt til +30% stats og gir spesialegenskaper (våpen: +10% krit, rustning: +1 torneskade)

### Forbedringer
- **SkillScene utvidet (#79):** Panelet fyller nå hele skjermen (1260×780 i stedet for 940×520). Skill-kort økt til 220×108px med mer plass til tekst og beskrivelser
- **CharacterCreatorScene fullstendig redesignet (#80):** Ny tre-kolonne layout som fyller hele 1280×800-lerret. Venstre: 2×2 rase-rutenett + egenskaper. Senter: Stort forhåndsvisningsfelt (280px) + heltenavn. Høyre: Utseende-tilpasning. Bunnfelt: Startbonus + startknapp. Visuelt sammenhengende med seksjonspaneler

### Tekniske endringer
- Fontstørrelser justert i alle 11 scene-filer
- SkillScene: panelW/panelH bruker nå W-20/H-20, cardW opptil 220px, cardH 108px, tierH 140px
- CharacterCreatorScene: Fullstendig omskrevet med tre-kolonne panelstruktur og seksjonspaneler
- TouchControls utvidet med zoom/fullskjerm-knapper og Fullscreen API-integrasjon
- InputHandler støtter nå touch_zoom_in/touch_zoom_out registry-flagg
- Nye hero-egenskaper: mineralIdentifyLevel, smeltBonusElement, smeltExtraYieldChance, doubleAlloyChance
- SmeltingSystem.smelt() støtter bonuselement og ekstra utbytte-mekanikk
- SmeltingSystem.forgeEquipment() legger til spesialegenskaper ved Mestersmie

---

## v0.32 – 2026-04-08

### Nye funksjoner
- **Detaljert karakterportrett:** Ny høyoppløselig karaktertegning (64-grid) med iris/pupill i øynene, nesebor, detaljerte lepper, synlige fingre, hår-highlights, klærfolder og sømmer. Viser også utstyrt våpen og rustning på figuren
- **Karakterportrett i menyer:** Detaljert karakterportrett vises nå i Inventar, Ferdighetstreet, Leirplass og Kjemisk laboratorium
- **Leirplass visuelt tema:** Smelteovn-skjermen har nå tematisk bakgrunn med bål, telt, trær, stjernehimmel, røyk og stein – ser ut som en ekte leirplass
- **Kjemilab visuelt tema:** Laboratorium-skjermen har nå tematisk bakgrunn med labbenk, hyller med fargerike flasker, erlenmeyerkolber, reagensrør, periodisk tabell-hint, bobler og damp

### Tekniske endringer
- Ny `DetailedCharacterSprite.js` med `drawDetailedCharacterSprite()` funksjon (64-enhets grid, dobbel oppløsning)
- Ny `SceneBackgrounds.js` med `drawCampBackground()` og `drawChemLabBackground()` funksjoner
- SmelteryScene, ChemLabScene, SkillScene og InventoryScene oppdatert med karakterportretter
- SmelteryScene og ChemLabScene bruker semi-transparente paneler for å vise tematiske bakgrunner

---

## v0.31 – 2026-04-07

### Nye funksjoner
- **Forbedret musikk-kvalitet:** Alle 8 musikktemaer utvidet fra 16 til 64 noter per melodi (4 fraser: A–B–A'–C), basslinjer fra 8 til 32 noter, kontramelodier fra 16 til 64 noter, og akkordprogresjoner fra 4 til 8. Full loop er nå ~27 sekunder i stedet for ~7 sekunder
- **Perkusjon:** Nytt rytme-lag med noise-basert perkusjon tilpasset hvert tema (sparsomt for Is, drivende for Vulkan, marsj-aktig for Kjerne)
- **Velocity-variasjon:** Subtil tilfeldig volumvariasjon (±15%) på melodi og kontramellodi for mer levende, humanisert lyd

---

## v0.29 – 2026-04-06

### Tekniske endringer
- **Kodestruktur refaktorert:** Grafikk-kode ekstrahert fra ItemSpawner.js (→ ItemGraphics.js) og Monster.js (→ MonsterGraphics.js), reduserer filstørrelser med ~500 linjer. Ny UIHelper.js samler felles UI-mønster
- **EventBus:** Ny lettevekts pub/sub-system for løs kobling mellom scener. SmelteryScene, ChemLabScene og InventoryScene bruker nå EventBus (`floatingText`, `showMessage`, `spawnItem`) i stedet for direkte GameScene-referanser. `gameScene`-parameteren fjernet fra alle tre scener
- **HeroCrafting:** Elements/Metallurgy/Chemistry-tilstand ekstrahert fra Hero.js til HeroCrafting.js (init, serialize, applyStats) – reduserer Hero.js med ~80 linjer
- **CombatManager:** Skadeberegning ekstrahert til statiske `calculateHeroDamage()` og `calculateMonsterDamage()` metoder – testbare uten Phaser
- **SmelteryScene deduplisert:** `_doSmelt` og `_doSmeltFromStash` slått sammen til felles `_doSmeltFrom()`
- **Testinfrastruktur:** 9 test-suiter (~70 tester): Inventory, MazeGenerator, SmeltingSystem, UIHelper, Hero, EventBus, ChemistrySystem, Monster og CombatManager
- **Balansesimulator:** Automatiske assertions lagt til i simulator.html – sjekker seiersrate, nivå, verden nådd, HP, bosskill-rate og turer. Viser grønt/rødt resultat etter simulering

---

## v0.28 – 2026-04-06

### Nye funksjoner
- **Ferdighetstreet konsolidert (#62):** Krigar + Vokter slått sammen til «Kriger» (kamp, forsvar og utholdenhet). Jeger + Skurk + Dyrevokter slått sammen til «Villmarksjeger» (syn, presisjon, unnvikelse og kjæledyr). Redusert fra 8 til 5 stier med tydeligere identitet. Bakoverkompatibel med gamle lagringsfiler via automatisk ferdighetsmigrasjon
- **Ferdighetstre-hurtigtast (#61):** Trykk T for å åpne ferdighetstreet når som helst (kun visning). Panelet er nå større (520px høyde) med bedre lesbarhet. Lukkes med T eller ESC
- **Smelting fra lager (#60):** Smelt-fanen viser nå mineraler fra både ryggsekk og leirplasslager. Brensel i lageret telles også med i tilgjengelig energi
- **Kjæledyr-healing utvidet (#65):** Alle helende gjenstander (motgift, frostsalve, brannsalve, kjemiske eliksirer) healer nå også kjæledyret når Villmarksjeger T2 er aktiv – ikke bare livspotion
- **Soneboss nytt utseende (#67):** Sonebossen har nå et unikt, skremmende design med horn, spektralvinger, multiple øyne, glødende runer og en helt annen silhuett enn vanlige bosser. Støtter nå også fase 2 raseri-overgang
- **Grieg-inspirert musikk (#66):** Alle 8 musikktemaer omskrevet med rikere melodier inspirert av Edvard Grieg (Morgenstemning, I Dovregubbens hall, Solveigs sang, Holbergsuite). Ny kontramellodi-linje gir harmonisk dybde
- **Økt oppløsning (#63):** Spillvindu økt fra 960×640 til 1280×800 for mer skjermplass. Responsiv nedskalering bevart via Phaser FIT-modus

### Tekniske endringer
- Ny `migrateSkills()` funksjon for bakoverkompatibel overgang fra gamle ferdighets-IDer til nye
- Synergier oppdatert til nye sti-IDer med to nye synergier: «Naturkjenner» og «Giftjeger»
- TouchControls bruker nå dynamiske dimensjoner fra kamera i stedet for hardkodede verdier
- Musikksekvenser støtter nå valgfri `counter`-array og `counterWave`/`counterVol`-parametre
- SmeltingSystem.calculateFuelEnergy() og consumeFuel() søker nå også i campStash

---

## v0.27 – 2026-04-05

### Feilrettinger
- **Inventar-overlapp (#51):** Nye ryggsekkplasser overlapper ikke lenger med kjæledyrets inventar – panelstørrelsen og kjæledyr-posisjonen beregnes dynamisk
- **Stabling i kjæledyr (#52):** Mineraler, krystaller, brensel og molekyler stabler nå riktig i kjæledyrets ryggsekk
- **Craftede gjenstander forsvinner (#53):** Kjemisk labb-produkter (inkl. salpeter) vises nå korrekt i inventar og kan brukes via hurtigbruk (Q). Base-forbindelser (brent kalk, salpeter) har nå reelle effekter: forsvarsbuff og sprengstoff. Smidd legeringsutstyr overlever nå lagring/lasting
- **Krystalleffekter (#54):** Krystaller i ryggsekken gir nå passive bonuser: angrep, forsvar, synsfelt, giftresistans, brannresistans, gullmultiplikator, kritisk sjanse og unnvikelse
- **Bomber og blendgranater (#55):** Bomber og blendgranater fungerer nå via Q-knappen med synlig visuell tilbakemelding (skjermristing/flash). Kjemiske produkter kan nå tilordnes hurtigbruk
- **Gift tikker for raskt (#56):** Gift-tick økt fra 0.9s til 2.5s, brann-tick fra 0.8s til 2.0s – gir spilleren tid til å bruke motgift
- **Menyrulling (#57):** Mushjul-rulling lagt til i ledertavle og kjemisk laboratorium
- **Ledertavle (#58):** Filtrering etter rase/vanskelighetsgrad fungerer nå korrekt. Ledertavlen oppdateres kun ved fullført verden, ikke ved død
- **Potion-dropp (#59):** Økt sjanse for helsepotion- og motgift-dropp på høyere nivåer. Ekstra 15% sjanse for helsegjenstander fra verden 3+

### Tekniske endringer
- Inventory._getItemDef() og Pet.getItemDef() slår nå opp i MOLECULE_DEFS i tillegg til ITEM_DEFS, MINERAL_DEFS og FUEL_DEFS
- Kjemiske gjenstander bevarer sin use()-funksjon gjennom hurtigbruk-systemet via _chemItem-referanse
- Serialisering/deserialisering støtter nå molekyl-gjenstander i ryggsekk og kjæledyr
- Serialisering/deserialisering støtter nå legeringsutstyr (ALLOY_EQUIPMENT) i tillegg til ITEM_DEFS
- Alle craftbare kjemiske produkter har nå brukbare effekter – ingen «døde» gjenstander

---

## v0.26 – 2026-04-05

### Nye funksjoner
- **Elements-mod Fase 4 – Verdensekspansjon:**
  - **Sonesystem:** Verdener 1-25 delt inn i 5 geologiske soner: Overflatelag (1-3), Grunnfjell (4-7), Dyplag (8-12), Underverden (13-18), Jordens kjerne (19-25)
  - **3 nye visuelle temaer:** Dyplag (magma-sprekker), Underverden (lilla krystaller), Jordens kjerne (smeltende gull)
  - **Soneboss:** Ekstra tøff boss på siste etasje i hver sone med høyere HP/ATK/XP og forsvar
  - **4 nye spesialrom:** Malmkammer (verden 5+, T2-T3 årer), Hydrotermalkilde (verden 8+, T4 mineraler), Gasslomme (verden 10+, ekstra kull), Magmakammer (verden 18+, T5-T6 mineraler)
  - **Sone-UI:** HUD viser nå «Sonens navn Etasje/Total» i stedet for bare verdensnummer
  - **Soneprogresjon:** Fullførte soner lagres for fremtidig hurtigreise-funksjon
  - **Gulvdekorasjoner:** Alle 3 nye temaer har unike prosedyrelle gulvmønstre

---

## v0.25 – 2026-04-05

### Nye funksjoner
- **Elements-mod Fase 3 – Kjemi:**
  - **Molekyl-dataset:** 15 kjemiske produkter i 5 kategorier: base-forbindelser, syrer, potions, medisiner og eksplosiver
  - **Kjemisk laboratorium:** Nytt spesialrom fra verden 3+ (30% sjanse) med grønn glød. Trykk C for å åpne
  - **Syntese:** Kombiner rene grunnstoffer til kjemiske produkter – potions healer mer, bomber gjør mer skade, medisiner kurerer alt
  - **Kjemiske produkter:**
    - *Potions:* Kjemisk livselixir (+4 HP), Styrkeelixir (+3 ATK 90s), Forsvarselixir (+2 DEF 90s), Usynlighetsdrikk (30s)
    - *Bomber:* Krutt (8 dmg radius 3), Røykbombe (stun alle radius 4), Syrebombe (6 dmg + etsende), Dynamitt (15 dmg radius 4)
    - *Medisiner:* Universell motgift (kurerer alt + 2 HP), Smertestillende (+3 DEF 60s)
    - *Syrer:* Svovelsyre og Saltsyre som kastbare AoE-våpen
  - **Kjemiker-skillsti:** Ny 9. spesialiseringsvei (låses opp ved første syntese) med 3 tiers: Potente potions (+50% varighet), Syremestring (+30% bombeskade), Eksplosjonsgenial (+50% skade +1 radius)
  - **Synergier:** «Giftklinger» (Kjemiker + Krigar) → +2 ATK, 15% gift ved angrep. «Alkymist» (Kjemiker + Metallurg) → +20% potens, -15% energi
  - **Touch-støtte:** Ny grønn LAB-knapp for touch-enheter

### Balanseendringer
- **Nye mineraler for kjemi:** Iskrystall (H×5, O×3), Sylvitt (K×4, Cl×3) og Salpeter-mineral (K×3, N×3) lagt til i MINERAL_POOL slik at hydrogen, kalium og nitrogen faktisk kan samles
- **Forenklede kjemi-oppskrifter:** Alle oppskrifter redusert til 1-3 elementer (ned fra 4-8). Fokus på spillbarhet fremfor kjemisk nøyaktighet

---

## v0.24 – 2026-04-04

### Nye funksjoner
- **Elements-mod Fase 2 – Metallurgi:**
  - **Smelting:** Mineraler kan nå smeltes til rene grunnstoffer i leirplasser. Bruker brensel (tre/kull) som energikilde
  - **Legeringer:** 8 legeringer kan craftes fra rene grunnstoffer: Bronse, Messing, Stål, Rustfritt stål, Elektrum, Duraluminium, Titanleger., Pt-Ir
  - **Smiing:** Legeringer kan smis til våpen og rustning (12 nye utstyrsgjenstander) med stats som overgår vanlig utstyr
  - **Leirplass (Camp Room):** Garantert fra verden 2+, 50% sjanse i verden 1. Trygg sone med smelteovn og lager. Trykk V for å åpne
  - **Lager (Stash):** Lagre mineraler og brensel i leirplassen mellom besøk – frigjør ryggsekken for utstyr og potions
  - **Brensel:** Tre og kull spawner i labyrinten (1-3 per etasje). Kull fra verden 3+
  - **Metallurg-skillsti:** Ny 8. spesialiseringsvei (låses opp ved første smelting) med 3 tiers: Rask smelting (-25% energi/tid), Legeringsmester (+15% stats), Mestersmie (+25% smidd utstyr)
  - **Synergier:** «Smiekunst» (Metallurg + Krigar) → +3 ATK, +20% malmeffekt. «Malmkjenne» (Metallurg + Geolog) → +1 mineralsynsradius, -10% smeltetid
  - **Smelteovn-UI:** Fire faner – Lager, Smelt mineral, Lag legering, Smi utstyr – med oversikt over grunnstoffer, oppskrifter og brensel

---

## v0.23 – 2026-04-04

### Nye funksjoner
- **Elements-mod Fase 1 – Geologi-grunnlag:**
  - **Grunnstoff-dataset:** ~50 grunnstoffer fra det periodiske system med tier 1-6 (sjeldenhetsgrad basert på geokjemisk forekomst)
  - **Mineral-dataset:** ~20 malmer og ~10 krystaller/edelstener som kan finnes i labyrinten
  - **Mineral-spawning:** Mineraler spawner på gulvet i labyrinten (2-5 per etasje, skalerer med verden). Monstre har 15% sjanse for mineral-drop (boss = 100%)
  - **Spesialrom:** Steinbrott (verden 1+, konsentrerte malmer) og Krystallhule (verden 3+, edelstener) genereres i dead-ends
  - **Element-oppdagelse:** Å plukke opp et mineral avslører automatisk dets bestanddeler i det periodiske system med flytende tekst
  - **Elementbok-UI:** Nytt periodisk system-overlay (B-tast eller knapp i inventar) som viser oppdagede/uoppdagede grunnstoffer, gruppeprestasjoner og tooltip-info
  - **Geolog-skillsti:** Ny 6. spesialiseringsvei (låses opp ved første mineral-funn) med 3 tiers: Malmøye (mineralsynsradius), Effektiv utvinning (+25% utbytte), Mesterprospektør (garantert T4+ mineral)
  - **Synergi:** «Jordens kraft» (Geolog + Vokter) gir +1 forsvar og +1 mineralsynsradius
  - **Mineralsynsradius:** Malmøye-skillen avslører mineraler gjennom tåke innen ekstra radius
  - **Inventarstøtte:** Mineraler stabler til 10 per plass, med prosedyrelle ikoner (malm = steinbit, krystall = fasettert edelsten)
  - **Bakoverkompatibilitet:** Gamle saves laster uten problemer – nye felter får standardverdier

---

## v0.22 – 2026-04-03

### Feilrettinger
- **Fjerne gjenstander fra inventar på touchskjerm (#45):** Lang-trykk for å droppe gjenstander fra utstyr, hurtigplass og ryggsekk frøs skjermen. Årsaken var kall til en ikke-eksisterende metode (`_spawnItemAt`), nå rettet til `itemSpawner.spawnItemAt()`

---

## v0.21 – 2026-04-01

### Balanseendringer
- **Saktere boss-angrep, mer boss-HP (#40):** Boss angriper nå hvert 570ms (opp fra 380ms), ca. 50% saktere. Fase 2 dobbeltangrep fjernet. Boss-HP økt til 50 + verden×35 (opp fra 35 + verden×25). Gir spilleren mer tid til å bruke potions og reagere i bosskamp

---

## v0.20 – 2026-04-01

### Nye funksjoner
- **Forbedret kjæledyr-system (#41):**
  - **Pet re-spawn:** Når kjæledyret dør i et level, kan nye kjæledyr-egg spawne i neste level (35% sjanse) slik at helten kan få en ny følgesvenn
  - **Økt kjæledyr-HP:** Alle kjæledyr har nå dobbelt så mye base-HP (Rev: 8, Katt: 6, Drage: 10, Ugle: 6) for bedre overlevelse mot monstre
  - **Kjæledyr-healing:** Dyrevokter T2 «Dyrisk livskraft» lar nå livspotion også heale kjæledyret. Vanlig livspotte healer 2 HP, stor livspotte full-healer kjæledyret
  - **Kjæledyr-ryggsekk:** Kjæledyret har nå 4 ekstra ryggsekk-plasser for å bære gjenstander for helten. Gjenstander overflyter automatisk til kjæledyrets ryggsekk når heltens er full. Visning i inventory-overlay med mulighet for å flytte gjenstander mellom helt og kjæledyr

---

## v0.19 – 2026-03-31

### Nye funksjoner
- **Midlertidige styrke-/forsvarsbrygg (#34):** Styrkebrygg (+2 ATK) og Forsvarsbrygg (+1 DEF) gir nå midlertidige buffs som varer i 60 sekunder, i stedet for permanente stat-økninger. Aktive buffs vises med sanntids-nedtelling i HUD-statuslinjen

### Balanseendringer
- **Hardere monsterskalering (#35):** Monster-HP skalerer nå +50% per verden (opp fra +30%). Monsterangrep skalerer +25% per verden (nytt). Boss-HP: 35 + verden×25 (opp fra ×18). Boss-ATK: 3 + verden×2 (opp fra +1). Sterkere monstertyper dukker opp tidligere

### UI-forbedringer
- **Kompakt evnevelger (#38):** SkillScene-panelet er mer kompakt (mindre kort, reduserte fontstørrelser) slik at alle 5 spesialiseringsveier passer i vinduet
- **Strengere evneprogresjon (#38):** Man må nå fullføre alle nivåer (maks stack) av en evne før neste tier i samme vei låses opp

---

## v0.18 – 2026-03-31

### Nye funksjoner
- **Kjæledyr-system (#32):** Finn et mystisk egg i labyrinten og få en følgesvenn:
  - Fire kjæledyrtyper: Rev, Katt, Drage og Ugle – med unike sprites og stats
  - Kjæledyret følger helten automatisk gjennom labyrinten
  - Angriper monstre som er i nærheten (1 rute)
  - Monstre kan angripe kjæledyret (25% sjanse når nærme)
  - Vises i HUD med navn, HP-bar og angrepsverdi
  - Vises som rosa prikk på minikartet
  - Lagres og gjenopprettes mellom verdener
  - Egg spawner med 80% sjanse i verden 1, deretter 35%

### Feilrettinger
- **HUD overlapper spillkartet (#30):** Kameraets viewport er nå forskjøvet 54px ned slik at kartinnhold ikke skjules bak HUD-baren
- **Helse øker ved utstyrsbytte og level-up (#31):** Utstyr og ferdigheter som gir maks-hjerter øker nå kun kapasiteten, uten å helbrede spilleren
- **Utstyrsbonuser er nå midlertidige (#31):** Attack, defense og maxHearts fra utstyr lagres som base stats uten utstyrsbonuser, og påføres kun mens utstyret er aktivt. Forhindrer permanent stacking ved lagring/lasting

---

## v0.17 – 2026-03-30

### Tekniske endringer
- **Refaktorering av GameScene.js (#7):** Delt opp i 5 fokuserte moduler:
  - `MapRenderer` – kartrendering, tåke, portal-animasjon
  - `ItemSpawner` – kister, verktøy, gjenstander, kjøpmann
  - `MonsterManager` – monsterplassering, AI, statuseffekter
  - `CombatManager` – nærkamp, bue, skadeberegning, drap
  - `InputHandler` – tastatur/touch-inndata, bevegelse, zoom
  - GameScene er nå orkestrator (~230 linjer, ned fra ~1800)

---

## v0.16 – 2026-03-30

### Nye funksjoner
- **Tidssporing per verden (#25):** Ledertavlen viser nå tid brukt per verden:
  - Timer starter ved verdenstart (GameScene.create) og stopper ved exit/død
  - Tid vises i mm:ss-format i ledertavle og på game-over/victory-skjerm
  - Ny «Tid»-kolonne i LeaderboardScene
  - Bakoverkompatibel med eldre lagrede resultater (viser 0:00)
- **Forbedret labyrintgrafikk (#20):** Mer detaljerte og varierte fliser:
  - Mur-/steinmønster med murverk og variasjon per flis
  - Vegg-gulv-skygger langs tilstøtende vegger
  - Skog: Mosepatcher, vinstokker med blad, blomsterstilker, jordflekker
  - Grotte: Stalaktitter, vannpytter, gulvsprekker, grussprut
  - Is: Forgreinende sprekker, snøstøv, frostring på kanter, istapper
  - Vulkan: Glødepytter med halo, svimerker, lavaseep fra vegger
  - Tempel: Søylekapitel, utslitte hjørner, støvpartikler, utskåret motiv

### Tekniske endringer
- `GameScene.create()` – `_worldStartTime` timer initialiseres
- `GameScene._checkExit()` / `_heroDied()` – beregner og sender `timeSeconds`
- `GameOverScene` – mottar og viser tid, sender til Leaderboard
- `Leaderboard.record()` – lagrer `timeSeconds`-felt
- `LeaderboardScene` – ny «Tid»-kolonne med mm:ss-formatering
- `GameScene._drawMap()` – murverk/brickwork på vegger, skygger på gulv
- `GameScene._drawWallDeco()` / `_drawFloorDeco()` – utvidet med ~30 nye dekorasjoner

---

## v0.15 – 2026-03-30

### Nye funksjoner
- **Kryss-vei-synergier (#3):** Fire automatiske bonuser som aktiveres når helten har evner fra to forskjellige spesialiseringsveier:
  - **Motangrep** (Krigar + Jeger): 20% sjanse for automatisk motangrep ved treff
  - **Tornehud** (Vokter + Skurk): Angripere tar 1 skade
  - **Uovervinnelig** (Krigar + Vokter): +2 Angrep, +1 Forsvar, +1 Hjerte
  - **Skyggejeger** (Jeger + Skurk): +15% unnvikelse, +1 synsfelt
  - Synergier vises i SkillScene med aktiv/inaktiv status
  - Flytende tekst varsler nye synergier ved aktivering
- **Unike gjenstandsgrafikk (#19):** Hvert våpen, rustning og forbruksgjenstand har nå distinkt prosedyregrafikk:
  - Våpen: Dolk, tresverd, jernsverd, spyd, stridsøks, krigshammer, trollstav, buer
  - Rustning: Lær, vest, ringbrynje, platedrakt, magikappe, drageskjell (med skjellmønster)
  - Forbruk: Drikker med korker, bomber med lunte, ruller med segl, hjertekrystall-form
  - Unike ikoner vises både på bakken og i inventory

### Tekniske endringer
- `skills.js` – `SKILL_SYNERGIES[]`, `getActiveSynergies()`, `applySynergies()` – kryssvei-system
- `Hero.counterChance`, `Hero.thornsDamage` – nye stats for synergier, med serialisering
- `GameScene._onSkillPicked()` – sjekker og aktiverer synergier etter evnevalg
- `GameScene._monsterAttack()` – tornehud reflekterer skade; motangrep trigges ved treff
- `SkillScene._drawSynergies()` – viser alle 4 synergier med aktiv/inaktiv status
- `GameScene._drawItemGraphic()` – ny metode med unike ikoner for 20+ gjenstander
- `InventoryScene._drawItemIcon()` – oppgradert med distinkte ikoner per gjenstandstype

---

## v0.14 – 2026-03-30

### Nye funksjoner
- **Flere statuseffekter (#6):** Tre nye statuseffekter i tillegg til gift:
  - **Frostbitt (❄):** Halverer bevegelseshastighet i 4 runder. Påføres av monstre i Iskrystall-verdenen (25% sjanse)
  - **Brann (🔥):** 2 skade per ~800ms i 3 runder. Påføres av monstre i Vulkandungeon (20% sjanse)
  - **Lammet (⚡):** Blokkerer all input i 1 runde. Boss fase 2 har 15% sjanse til å lamme
  - Visuelle tint-overlays for alle effekter (blå, oransje, gul)
  - Motgift kurerer nå ALLE statuseffekter (ikke bare gift)
  - Nye forbruksvarer: Frostsalve (kurerer frostbitt) og Brannsalve (kurerer brannsår)
- **Ledertavle (#5):** Persistent high-score-system:
  - Registrerer verdener fullført, nivå, monsterdrap, gull for hvert forsøk
  - LeaderboardScene med topp-15-tabell tilgjengelig fra hovedmenyen
  - Filtrering etter rase og vanskelighetsgrad
  - Medaljer for topp 3 (gull/sølv/bronse)
  - Lagres i localStorage uavhengig av save-system

### Tekniske endringer
- `Hero.burnTurns`, `slowTurns`, `stunTurns` – nye statuseffekt-felt med serialisering
- `Hero.applyBurn()`, `applySlow()`, `applyStun()`, `clearAllEffects()` – nye metoder
- `GameScene._tickMonsters()` – separate timere for brann (800ms), slow (1000ms) og stun (600ms)
- `GameScene._monsterAttack()` – tema-baserte statuseffekter (is→slow, vulkan→burn, boss→stun)
- `GameScene._handleInput()` – stun blokkerer input; slow dobler bevegelsesdelay
- `GameScene.monstersKilled` – teller for ledertavle
- `items.js` – nye consumables `frost_salve` og `burn_salve`; motgift kurerer alle effekter
- `UIScene.statusText` – viser alle aktive statuseffekter i HUD
- Ny fil: `Leaderboard.js` – localStorage-basert high-score-lagring
- Ny fil: `LeaderboardScene.js` – filtrerbar ledertavle
- `GameOverScene` – registrerer resultater til ledertavle
- `MenuScene` – ledertavle-knapp

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
