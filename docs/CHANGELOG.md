# Endringslogg – Labyrint Hero

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
