# Labyrint Hero – Elements-modifikasjon
**Versjon:** 0.5 (fase 1–5 implementert)
**Sist oppdatert:** 2026-04-16
**Status:** Alle 5 faser implementert. 118 grunnstoffer, 28 transuranske synteseoppskrifter, partikkelakselerator, fysiker-skillsti, fisjon/fusjon-energi og «Guds periodiske system»-endgame.

**v0.40-oppdatering:** 2 nye mineraler (molybdenitt, barytt) og 5 nye legeringer + 8 nye molekyler gir praktisk bruk for Mn, Mo, W, Ta, Ba, B, Ce, La, Nd, Zn. Bombeskade er separert fra potionskala og skalerer +60% per verden (mot +40% før) med flat bombgulv; radius +1 fra verden 5 og +2 fra verden 8. Geolog/Metallurg/Kjemiker har fått T4-ferdigheter (Geode-splitter, Reforge, Volatil mestring) og en 3-sti-synergi Transmutasjon (5 → 1 nabo på atomnummer). Se CHANGELOG v0.40 for full diff.

---

## 1. Oversikt og filosofi

Elements-modifikasjonen fletter inn det periodiske system, geologi, metallurgi og kjemi som en naturlig del av spillverdenen. Målet er at grunnstoffenes egenskaper og sjeldenhet i spillet gjenspeiler virkeligheten – slik at spilleren ubevisst lærer noe reelt mens de spiller.

**Kjerneprinsipp:** Det skal aldri føles som en leksjon. Det skal føles som oppdagelse.

Et av spillets overordnede mål er å samle alle grunnstoffene. Når man fullfører rader, grupper eller kategorier i det periodiske system, får man bonuser og låser opp ny teknologi.

---

## 2. Sjeldenhetsgrader

Sjeldenhetsgraden til hvert grunnstoff og mineral gjenspeiler den faktiske geokjemiske forekomsten på jord. Rammeverket mapper inn i eksisterende rarity-system:

| Tier | Navn (NO) | Navn (EN) | Farge | Eksempel-grunnstoffer |
|------|-----------|-----------|-------|----------------------|
| 1 | Vanlig | Common | Grå | O, Si, Al, Fe, Ca, Na, K, Mg |
| 2 | Uvanlig | Uncommon | Grønn | Ti, Mn, P, S, Cl, C (kull) |
| 3 | Sjelden | Rare | Blå | Cu, Zn, Ni, Cr, V, Li, F |
| 4 | Episk | Epic | Lilla | Pb, Sn, Co, As, Mo, Sb, Bi |
| 5 | Legendarisk | Legendary | Gull | Au, Ag, Pt, Pd, Ir, Os, Re, Te |
| 6 | Mytisk | Mythic | Regnbue | U, Th, Ra, He, Ne (edelgasser), PGM |

> Edelgasser (He, Ne, Ar, Kr, Xe) er vanlige i universet men svært sjeldne å isolere på jord – de plasseres i Episk/Legendarisk.

---

## 3. Grunnstoffdataset

### 3.1 Vanlige grunnstoffer (Tier 1–2)
Disse finnes ofte i mineralform og er utgangspunktet for metallurgi.

| Symbol | Navn | Atomnr | Kategori | Tier | Primær kilde (mineral) |
|--------|------|--------|----------|------|----------------------|
| O | Oksygen | 8 | Ikke-metall | 1 | Quartz (SiO₂), mange oksider |
| Si | Silisium | 14 | Halvleder | 1 | Quartz, feltspat |
| Al | Aluminium | 13 | Metall | 1 | Bauxitt (Al₂O₃) |
| Fe | Jern | 26 | Metall | 1 | Hematitt (Fe₂O₃), magnetitt |
| Ca | Kalsium | 20 | Alkalimetall | 1 | Kalkstein (CaCO₃), gips |
| Na | Natrium | 11 | Alkalimetall | 1 | Halit (NaCl – steinsalt) |
| K | Kalium | 19 | Alkalimetall | 1 | Sylvitt (KCl) |
| Mg | Magnesium | 12 | Alkalimetall | 1 | Dolomitt, olivin |
| Ti | Titan | 22 | Metall | 2 | Ilmenitt (FeTiO₃), rutil |
| Mn | Mangan | 25 | Metall | 2 | Pyrolusitt (MnO₂) |
| P | Fosfor | 15 | Ikke-metall | 2 | Apatitt |
| S | Svovel | 16 | Ikke-metall | 2 | Pyritt (FeS₂), ren svovel |
| C | Karbon | 6 | Ikke-metall | 2 | Kull, grafitt, diamant (T5) |

### 3.2 Sjeldne og edle grunnstoffer (Tier 3–5)
Disse finnes i lavere konsentrasjoner og noen kan finnes rene i naturen.

| Symbol | Navn | Atomnr | Kategori | Tier | Funnet rent? | Primær kilde |
|--------|------|--------|----------|------|-------------|--------------|
| Cu | Kobber | 29 | Metall | 3 | Ja | Malakit, kobberkis |
| Zn | Sink | 30 | Metall | 3 | Nei | Sfaleritt (ZnS) |
| Ni | Nikkel | 28 | Metall | 3 | Sjelden | Pentlanditt |
| Cr | Krom | 24 | Metall | 3 | Nei | Kromitt |
| Li | Litium | 3 | Alkalimetall | 3 | Nei | Spodumen, petalitt |
| Pb | Bly | 82 | Metall | 4 | Nei | Galena (PbS) |
| Sn | Tinn | 50 | Metall | 4 | Nei | Kassiteritt (SnO₂) |
| Hg | Kvikksølv | 80 | Metall | 4 | Ja | Sinnobar (HgS) |
| Ag | Sølv | 47 | Edelmetall | 5 | Ja | Argentitt, nativt sølv |
| Au | Gull | 79 | Edelmetall | 5 | Ja | Nativt gull, elektrum |
| Pt | Platina | 78 | Edelmetall | 5 | Ja | Nativt platina |
| Pd | Palladium | 46 | Edelmetall | 5 | Ja | PGM-malmer |

### 3.3 Mytiske grunnstoffer (Tier 6)
Ekstremt sjeldne – endgame.

| Symbol | Navn | Atomnr | Kategori | Kilde | Spesiell egenskap |
|--------|------|--------|----------|-------|------------------|
| U | Uran | 92 | Aktinide | Uraninitt (blendens) | Muliggjør fisjon |
| Th | Thorium | 90 | Aktinide | Monazitt | Alternativ fisjon |
| Ra | Radium | 88 | Aktinide | Uranmalm (biprodukt) | Magisk glød, boost |
| He | Helium | 2 | Edelgass | Gasslommer i berg | Biprodukt av fusjon. Samles fra gasslommer (v10+) |
| Ir | Iridium | 77 | PGM | Ekstremt sjelden malm | Hardeste legering |

---

## 4. Mineraldataset

Mineraler er det spilleren faktisk finner i labyrinten. De smeltes/bearbeides til rene grunnstoffer.

### 4.1 Ordinære mineraler

| Mineral | Kjemisk formel | Gir grunnstoff(er) | Tier | Utseende (farge) |
|---------|---------------|-------------------|------|-----------------|
| Quartz | SiO₂ | Si, O | 1 | Hvit/gjennomsiktig |
| Hematitt | Fe₂O₃ | Fe | 1 | Rød-brun |
| Magnetitt | Fe₃O₄ | Fe | 1 | Sort, magnetisk |
| Kalkstein | CaCO₃ | Ca, C | 1 | Hvit/grå |
| Halit | NaCl | Na, Cl | 1 | Hvit, kubisk |
| Bauxitt | Al₂O₃·nH₂O | Al | 1 | Rød-brun, jord |
| Olivin | (Mg,Fe)₂SiO₄ | Mg, Fe, Si | 1 | Grønn |
| Pyritt | FeS₂ | Fe, S | 2 | Gulaktig («narregull») |
| Ilmenitt | FeTiO₃ | Fe, Ti | 2 | Sort |
| Apatitt | Ca₅(PO₄)₃(OH) | Ca, P | 2 | Grønn/blå |
| Kalkopyritt | CuFeS₂ | Cu, Fe, S | 3 | Messing-gul |
| Malakit | Cu₂CO₃(OH)₂ | Cu | 3 | Klargrønn |
| Sfaleritt | ZnS | Zn, S | 3 | Sort/brun |
| Galena | PbS | Pb, S | 4 | Grå, metallisk |
| Kassiteritt | SnO₂ | Sn | 4 | Brun/sort |
| Sinnobar | HgS | Hg, S | 4 | Knallrød |
| Argentitt | Ag₂S | Ag | 5 | Sølvgrå |
| Nativt gull | Au | Au | 5 | Gull |
| Nativt sølv | Ag | Ag | 5 | Sølv |
| Uraninitt | UO₂ | U | 6 | Sort, tung |

### 4.2 Krystaller og edelstener

Disse bearbeides ikke til grunnstoffer, men brukes direkte til smykker, amuletter og oppgraderinger.

| Stein | Formel | Tier | Farge | Effekt (i spill) |
|-------|--------|------|-------|-----------------|
| Kvarts (klar) | SiO₂ | 1 | Hvit | +1 mana-regenerering |
| Ametyst | SiO₂ + Mn | 2 | Lilla | +magi-resistans |
| Citrin | SiO₂ + Fe | 2 | Gul | +gull-funn |
| Smaragd | Be₃Al₂Si₆O₁₈ + Cr | 3 | Grønn | +giftresistans |
| Akvamarin | Be₃Al₂Si₆O₁₈ | 3 | Lyseblå | +vann-magi |
| Rubin | Al₂O₃ + Cr | 4 | Rød | +angrep |
| Safir | Al₂O₃ + Fe/Ti | 4 | Blå | +forsvar |
| Turmalin | Kompleks borsilikat | 4 | Variabel | +elementresistans |
| Diamant | C | 5 | Klar | +alle stats |
| Alexandritt | BeAl₂O₄ + Cr | 5 | Fargeskiftende | +magisk kraft |
| Rød beryl | Be₃Al₂Si₆O₁₈ + Mn | 6 | Rød-rosa | Unik effekt: Tidsforvrengning |

---

## 5. Metallurgisystemet

### 5.1 Smelteprosessen
For å utvinne et rent grunnstoff fra et mineral trenger man:
1. **Mineralet** (i inventaret)
2. **Energikilde** (se Energisystemet)
3. **En smelteovn** (craftet eller funnet)

Prosessen tar N «ticks» (runder/tid), avhengig av materialets vanskelighetsgrad. Spillerens **Metallurg-skills** reduserer tid og øker utbytte.

```
Hematitt (Fe₂O₃) + Kull (C) + Smelteovn → Jern (Fe) + CO₂
Malakit (Cu₂CO₃) + Varme → Kobber (Cu)
Kassiteritt (SnO₂) + Karbon → Tinn (Sn)
```

### 5.2 Legeringer

Rene grunnstoffer kan kombineres til legeringer med overlegne egenskaper:

| Legering | Bestanddeler | Egenskaper | Bruk |
|----------|-------------|------------|------|
| Bronse | Cu + Sn (9:1) | Hardere enn kobber | Våpen T2, rustning T2 |
| Messing | Cu + Zn | Korrosjonsbestandig | Amuletter, låser |
| Stål | Fe + C (lite) | Sterkere enn jern | Våpen T3, rustning T3 |
| Rustfritt stål | Fe + Cr + Ni | Ikke-rustende | Rustning T4 |
| Elektrum | Au + Ag | Magisk ledende | Magiske gjenstander |
| Hastelloy | Ni + Mo + Cr | Syrebestandig | Kjemisk utstyr |
| Duraluminium | Al + Cu + Mg | Lett og sterkt | Lett rustning T3 |
| Titan-legering | Ti + Al + V | Ekstremt sterkt, lett | Endgame-rustning |
| Platina-iridium | Pt + Ir | Hardeste legering | Legendariske gjenstander |

### 5.3 Halvledere og keramikk

Avansert teknologi krever ikke-metalliske materialer:

| Material | Bestanddeler | Bruk |
|----------|-------------|------|
| Silisiumkarbid | Si + C | Avanserte verktøy, halvleder |
| Aluminiumoksid (Al₂O₃) | Al + O | Keramisk rustning |
| Silikon (halvleder) | Rent Si | Avanserte enheter, golem-tech |
| Galliumarsenid | Ga + As | Magiske krystaller, T6-tech |

---

## 6. Kjemisystemet

### 6.1 Grunnleggende kjemikalier

Disse produseres ved å kombinere grunnstoffer og/eller mineraler:

| Kjemikalie | Formel | Fremstilling | Bruk |
|------------|--------|-------------|------|
| Syre (svovelsyre) | H₂SO₄ | S + O + H₂O | Etse rustning, oppløse malmer |
| Saltsyre | HCl | H + Cl | Rengjøre metaller, oppløse karbonater |
| Kongevann | HNO₃ + HCl | Syre + mer kjemi | Oppløse gull/platina |
| Kalk (lesket) | Ca(OH)₂ | CaO + H₂O | Nøytralisere syre |
| Kaliumnitrat | KNO₃ | K + N + O | Krutt-ingrediens |
| Natronlut | NaOH | Na + O + H | Såpemakeri, base |
| Kloroform | CHCl₃ | Avansert kjemi | Sovepotjon |

### 6.2 Drikker og potions

| Drikk/Potions | Ingredienser | Effekt |
|---------------|-------------|--------|
| Helbredelsespotions | Fe + organisk materiale + vann | +2 hjerte |
| Giftmotgift | As-binding + kalk | Fjerner gift |
| Styrkedrikk | Fe + P + karbonat | +ATK midlertidig |
| Usynlighetsdrikk | Cr + Si-halfledere | Usynlig 30 sek |
| Eksplosiv bombe | KNO₃ + S + C (krutt) + beholder | AoE-skade |
| Røykbombe | KNO₃ + S + organisk | Røykteppe |
| Syrebombe | H₂SO₄ + beholder | Etser rustning |
| Radium-elixir | Ra (mikrodose) | +maks HP, risiko |
| Kjernepotions | U-ekstrakt | Massiv boost, strålingsskade |

### 6.3 Medisiner

| Medisin | Ingredienser | Effekt |
|---------|-------------|--------|
| Antiseptisk | Ag (kolloidalt) + alkohol | Forhindrer infeksjon |
| Febermedisin | K + organisk | Fjerner statuseffekt «syk» |
| Smertestillende | Ca + Mg + organisk | Tåler mer skade |
| Antidot | Universell base | Fjerner alle giftstatus |

---

## 7. Energisystemet

Energi er en ressurs som kreves for smelteprosesser og avansert teknologi. Spillere starter med primitive energikilder og progresjonerer til avanserte.

### 7.1 Energikilder

| Energikilde | Tier | Energiverdi | Krav | Beskrivelse |
|-------------|------|-------------|------|-------------|
| Tre | 1 | 1 | Ingen | Grunnleggende brensel |
| Kull (koks) | 1 | 3 | Ingen | Finn C-mineral, bren ved |
| Trekull | 1 | 2 | Ingen | Laget av tre i begrenset luft |
| Olje (råolje) | 2 | 8 | Bore-skill | Finnes i dype lag |
| Naturgass | 2 | 10 | Bore-skill | Finnes med olje |
| Fisjon (U/Th) | 3 | 50/40 per enhet | Fysiker T3 | U og Th gir virtuell energi (×2 med skill) |
| Fusjon (D-T) | 4 | H:80, Li:150 | Fysiker T4 | Deuterium + Li (tritiumkilde), ×5 med skill |

### 7.2 Energiteknologi-tre

```
Tre/Kull → Smelteovn (bronse/jern)
         → Dampmaskin (Fe + Cu)
              → Elektrisitet (Cu-ledninger + magneter)
                   → Fisjon-reaktor (U + stål + keramikk)
                        → Fusjon-reaktor (He-3 + magneter + Pt-Ir)
```

---

## 8. Det periodiske system som collectible

### 8.1 Oversikt
Spilleren har en "Elementbok" (tilgjengelig fra inventaret) som viser det periodiske systemet. Hvert grunnstoff farges inn når det er oppdaget/samlet i ren form.

### 8.2 Bonuser for å fullføre grupper/rader

| Prestasjon | Krav | Bonus |
|------------|------|-------|
| **Alkalimetaller** | Li, Na, K, Rb, Cs | +20% kjemisk effektivitet |
| **Alkaliske jordmetaller** | Be, Mg, Ca, Sr, Ba | +15% rustnings-stat |
| **Jernmetaller** | Fe, Co, Ni | «Jernhjertet» – +2 maks HP |
| **Myntmetaller** | Cu, Ag, Au | +50% gull-funn |
| **Platinametaller (PGM)** | Ru, Rh, Pd, Os, Ir, Pt | «Mesterkjemiker» – +30% legering-kvalitet |
| **Halogener** | F, Cl, Br, I | Giftstatus gjør 50% mindre skade |
| **Edelgasser** | He, Ne, Ar, Kr, Xe | «Evighetsgnist» – Fusjon-teknologi ulåst |
| **Aktinider** (del) | U, Th, Pa | Fisjonsteknologi oppgradert |
| **Periode 1** | H, He | «Big Bang» – Kosmisk kraft aktivert |
| **Periode 2** | Li→Ne | +10% XP permanent |
| **Periode 3** | Na→Ar | +Ny merchant-kategori |
| **Periode 4** | K→Kr | «Industrialist» tittel + rustning-blue |
| **Alle 92 naturlige** | H–U | «Elementmester» – Legendarisk tittel + unik gjenstand |
| **Alle 118** | Inkl. syntetiske | «Guds periodiske system» – Skjult ending |

### 8.3 Kategoribonuser

| Kategori | Elementer | Bonus |
|----------|-----------|-------|
| Alle metaller | ~80 elementer | «Metallurg» – smelting 2× raskere |
| Alle halvledere | Si, Ge, As, Sb, Te, Se | Golem-teknologi ulåst |
| Alle ikke-metaller | H, C, N, O, F, P, S, Cl, Se | «Kjemiker» – potions 2× sterkere |
| Alle lantanider | La–Lu | «Jordmagiker» – magisk AoE-angrep |

---

## 9. Nye skill-stier

Elements-modifikasjonen legger til fire nye skill-stier som erstatter den ene «Alkymist»-stien. Disse legges til utover de eksisterende fire (Krigar, Vokter, Jeger, Skurk), og låses gradvis opp ettersom spillverdenen og kompleksiteten øker. En spiller kan ikke mestre alle – valget av sti definerer spillestilen.

> **Merk til implementasjon:** De fire nye stiene trenger ikke å være tilgjengelige fra start. Geologi låses opp tidlig, Metallurg etter første smelting, Kjemi etter første kjemikalie, og Fysikk kan låses bak et endgame-krav (f.eks. fullføre periode 3 i elementboken).

---

### Sti 1: Geolog (⛏️)
**Farge:** Brun (0x997755)
**Fokus:** Finne, identifisere og utvinne mineraler mer effektivt.

| Tier | Skill-ID | Navn | Effekt | Maks stacks |
|------|----------|------|--------|-------------|
| T1 | `mineral_eye` | **Malmøye** | Ser skjulte mineralårer gjennom vegger (radius +1 per stack) | 3 |
| T1 | `efficient_mining` | **Effektiv utvinning** | +25% mineralutbytte ved bryting | 3 |
| T2 | `deep_survey` | **Dypkartlegging** | Avslører mineralforekomster i hele etasjen på minikartet | 2 |
| T2 | `crystal_sense` | **Krystallsans** | Edelstener og krystaller lyser opp i mørket | 2 |
| T3 | `master_prospector` | **Mesterprospektør** | Garantert minst én T4+ mineral per dungeon-etasje | 1 |
| T3 | `geological_memory` | **Geologisk minne** | Mineralårer regenererer mellom besøk (50% sjanse) | 1 |

---

### Sti 2: Metallurg (🔥)
**Farge:** Oransje (0xff7722)
**Fokus:** Smelte mineraler til rene grunnstoffer og lage legeringer med overlegne egenskaper.

| Tier | Skill-ID | Navn | Effekt | Maks stacks |
|------|----------|------|--------|-------------|
| T1 | `fast_smelting` | **Rask smelting** | Smelteprosess tar 25% kortere tid | 3 |
| T1 | `ore_efficiency` | **Malmeffektivitet** | Får +1 ekstra grunnstoff per smelting (20% sjanse per stack) | 3 |
| T2 | `alloy_mastery` | **Legeringsmester** | Legeringer får +15% til alle stats | 2 |
| T2 | `impurity_removal` | **Rensing** | Fjerner urenheter – ren metall gir +10% ekstra til legering | 2 |
| T3 | `transmutation` | **Transmutasjon** | Kan konvertere 3× Tier N-mineral til 1× Tier N+1 | 1 |
| T3 | `master_smith` | **Mesterskjærer** | Alt utstyr laget av egne legeringer får +1 til alle stats | 1 |

---

### Sti 3: Kjemiker (⚗️)
**Farge:** Grønn (0x33dd88)
**Fokus:** Kombinere grunnstoffer og molekyler til kjemikalier, potions, medisiner og eksplosiver.

| Tier | Skill-ID | Navn | Effekt | Maks stacks |
|------|----------|------|--------|-------------|
| T1 | `basic_synthesis` | **Grunnleggende syntese** | Kan lage tier 1–2 kjemikalier uten smelteovn | 3 |
| T1 | `potent_potions` | **Potente potions** | Potions varer 50% lenger | 3 |
| T2 | `acid_mastery` | **Syremestring** | Syrer og kjemiske bomber gjør +30% skade og etser rustning | 2 |
| T2 | `antidote_expert` | **Motgiftekspert** | Kan lage motgifter mot alle kjemiske statuseffekter | 2 |
| T3 | `explosive_genius` | **Eksplosiv genialitet** | Bomber har dobbelt radius og gjør +50% skade | 1 |
| T3 | `molecular_mastery` | **Molekylmestring** | Kan syntetisere organiske kjemikalier og tier 3+ forbindelser | 1 |

---

### Sti 4: Fysiker (⚛️)
**Farge:** Blå-lilla (0x8866ff)
**Fokus:** Avansert teknologi – halvledere, elektromagnetisme og atomfysikk. Krever kunnskap fra de tre andre stiene.
**Tilgjengelig:** Låses opp etter at spilleren har fullført periode 3 i elementboken (Na→Ar).

| Tier | Skill-ID | Navn | Effekt | Maks stacks |
|------|----------|------|--------|-------------|
| T1 | `semiconductor_basics` | **Halvledergrunnlag** | Kan lage enkle halvledere (Si, Ge) til teknologioppgraderinger | 3 |
| T1 | `electromagnetic` | **Elektromagnetisme** | Magnetisk utstyr tiltrekker mineraler fra nærliggende rom | 3 |
| T2 | `advanced_materials` | **Avanserte materialer** | Kan lage keramikk og komposittmaterialer | 2 |
| T2 | `radiation_shield` | **Strålingsshield** | Radioaktive materialer gir ikke lenger HP-tap ved lagring | 2 |
| T3 | `fission_mastery` | **Fisjonsbeherskelse** | Fisjonreaktor produserer 2× energi; U-235 berikes raskere | 1 |
| T3 | `fusion_pioneer` | **Fusjonspioner** | Låser opp fusjonsteknologi som endgame-energikilde | 1 |

---

## 10. Verdensekspansjon og skalering

Når Elements-modifikasjonen innføres øker spillets kompleksitet betraktelig. For å gi plass til alle nye systemer og ressurser må verdenen skalere tilsvarende.

### 10.1 Dungeon-dybde og etasjeskalering

Labyrinten deles inn i **soner** som øker i dybde og vanskelighetsgrad. Hver sone har sin geologiske karakter:

| Sone | Etasjer | Geologi | Tilgjengelige mineraler | Energikrav |
|------|---------|---------|------------------------|------------|
| **Overflatelag** | 1–3 | Sedimentær berggrunn | T1 (Quartz, Hematitt, Kalkstein) | Tre/Trekull |
| **Grunnfjell** | 4–7 | Metamorf berggrunn | T1–T2 + noen T3 (kobber) | Kull |
| **Dyplag** | 8–12 | Magmatisk berggrunn | T2–T4 (bly, tinn, nikkel) | Olje/Gass |
| **Underverden** | 13–18 | Hydrotermal sone | T4–T5 + PGM-årer | Fisjon |
| **Jordens kjerne** | 19–25 | Ekstrem varme/trykk | T5–T6 (gull, platina, uran) | Fusjon |

### 10.2 Romtyper som skalerer

Jo dypere man kommer, jo flere spesialrom dukker opp:

| Romnavn | Fra etasje | Innhold |
|---------|-----------|---------|
| Steinbrott | 1 | T1-mineralårer, enkelt |
| Krystallhule | 3 | Klynger av edelstener |
| Malmkammer | 5 | Konsentrerte T2–T3 årer |
| Hydrotermalkilde | 8 | T4 mineraler, giftig damp (statuseffekt) |
| Karbonhule | 6 | Kull, grafitt, diamanter dypt nok |
| Gasslomme | 10 | Naturgass (energi), eksplosiv hvis tennt |
| Urangruve | 15 | Uraninitt; krever Strålingsshield |
| Magmakammer | 18 | T5–T6 grunnstoff, ekstrem varme-skade |

### 10.3 Kart og navigasjon

Med en dypere verden trenger spilleren bedre kartlegging:

- **Minikartet** utvides ettersom Geolog-skills oppgraderes
- **Etasjeportaler** mellom soner (ikke bare ned én etasje av gangen)
- **Leirplass-rom** (safe rooms) dukker opp fra etasje 5+, der man kan smelte og lage kjemikalier uten fare
- **Hurtigreise** mellom soner låses opp etter å ha fullført en sone minst én gang

### 10.4 Vanskelighetsgrad og balanse

Økt verdenstørrelse kompenseres med:

- Monstre skaleres kraftigere per sone, ikke bare per etasje
- Sjef-monstre vokter inngangen til nye soner
- Sjeldne mineraler er aldri garantert – bare sannsynligheten øker med dybde
- Tid/runder brukt på crafting og smelting er en reell ressurs (man kan bli angrepet)

---

## 11. Integrasjon med eksisterende systemer

### 11.1 Item-systemet
- Mineraler er en ny item-kategori med egne rarity-farger
- Eksisterende rarity-tiers (Common→Mythic) brukes direkte
- Legeringer er komponenter som oppgraderer eksisterende utstyr

### 11.2 Merchant NPC
- Merchant kan kjøpe/selge råmineraler og grunnstoffer
- Spesielle handelsruter (f.eks.: 10× Quartz → 1× Safir-fragment)
- Nye kategorier: "Råvarer", "Kjemikalier", "Edelstener", "Legeringer"

### 11.3 Dungeon-generering
- Mineralårer genereres prosedyralt basert på dybde (dypere = sjeldnere)
- Spesielle rom: «Krystallhule» (mange edelstener), «Malmåre» (mineral-konsentrasjon)
- Dype lag (> nivå 5) gir tilgang til Tier 4–5 mineraler

### 11.4 Monster-drops
- Noen monstre dropper mineraler (f.eks.: steingolem → Quartz, Hematitt)
- Sjef-monstre: garantert sjelden mineral
- Giftige monstre: S (svovel), As (arsen) – kan brukes til kjemikalier

### 11.5 Statuseffekter fra kjemi
- Syrebombe → «Etsende» (reduserer rustning)
- Kvikksølv-eksponering → «Forgiftet (Hg)» (langsom HP-tap, -INT)
- Radium-eksplosjon → «Strålt» (gradvis HP-tap, glød-effekt)

---

## 12. Teknisk implementasjonsplan

### Fase 1 – Grunnlag: Geologi ✅ (v0.23)
- [x] `src/data/elements.js` – ~50 grunnstoffer med tier 1-6
- [x] `src/data/minerals.js` – ~23 malmer + ~10 krystaller (inkl. iskrystall, sylvitt, salpeter)
- [x] Mineral-items i dungeon-generering (2-5 per etasje, skalert med verden)
- [x] Spesialrom: Steinbrott (verden 1+) og Krystallhule (verden 3+)
- [x] Elementbok UI (B-tast, periodisk system med oppdagelser og gruppeprestasjoner)
- [x] Geolog-sti i skill tree (Malmøye, Effektiv utvinning, Mesterprospektør)
- [x] Monster mineral-drops (15% vanlig, 100% boss)
- [x] Mineralsynsradius gjennom tåke

### Fase 2 – Metallurgi ✅ (v0.24)
- [x] `src/data/alloys.js` – 8 legeringer (Bronse→Pt-Ir) + 3 brenseltyper + 12 smibare utstyr
- [x] Energisystem (tre=1, kull=3 energi, spawner i labyrinten)
- [x] Smelteovn-mekanikk (Leirplass/Camp Room, garantert verden 2+)
- [x] Smelteprosess med energikostnad og skill-modifikatorer
- [x] Legerings-crafting-system (elementer → legering → utstyr)
- [x] 12 nye våpen/rustninger fra legeringer
- [x] Metallurg-sti i skill tree (Rask smelting, Legeringsmester, Mestersmie)
- [x] Persistent lager (stash) i Camp Room for mineraler og brensel
- [x] Vokter T2 «Festning» gir +2 ryggsekk-plasser (dynamisk inventar)

### Fase 3 – Kjemi og molekyler ✅ (v0.25)
- [x] `src/data/molecules.js` – 15 kjemiske produkter (potions, bomber, medisiner, syrer)
- [x] Kjemisk laboratorium-rom i dungeon (verden 3+, 30% sjanse)
- [x] Syntese-mekanikk (grunnstoffer → kjemikalier, forenklede oppskrifter 1-3 elementer)
- [x] Potions: Livselixir (+4 HP), Styrkeelixir (+3 ATK), Forsvarselixir (+2 DEF), Usynlighet
- [x] Eksplosiver: Krutt (8 dmg), Røykbombe (stun), Syrebombe (etsende), Dynamitt (15 dmg)
- [x] Medisiner: Universell motgift, Smertestillende
- [x] Kjemiker-sti i skill tree (Potente potions, Syremestring, Eksplosjonsgenial)
- [x] Energi-utvidelse: Olje/Gass (v0.37)

### Fase 4 – Verdensekspansjon ✅ (v0.26)
- [x] Sonesystem: 5 geologiske soner (Overflatelag, Grunnfjell, Dyplag, Underverden, Jordens kjerne)
- [x] 25 etasjer totalt fordelt på soner med stigende vanskelighetsgrad
- [x] 3 nye visuelle temaer: Dyplag (magma), Underverden (lilla), Jordens kjerne (gull)
- [x] Soneboss: Ekstra tøff boss med forsvar på siste etasje i hver sone
- [x] 4 nye spesialrom: Malmkammer (5+), Hydrotermalkilde (8+), Gasslomme (10+), Magmakammer (18+)
- [x] Sone-UI: HUD viser «Sonens navn Etasje/Total»
- [x] Soneprogresjon: Fullførte soner lagres i hero.completedZones
- [x] Hurtigreise mellom fullførte soner (v0.37 – knapp på seiersskjerm)
- [x] Utvidet minikart med Geolog-skills (v0.37 – mineraler vises som fargede prikker)

### Fase 5 – Fysikk og transurane grunnstoffer ✅ (v0.42)
- [x] 28 syntetiske grunnstoffer (Tc, Pm, Np-Og) med `synthetic: true`-flagg
- [x] TRANSURANIC_RECIPES: 28 oppskrifter som gjenspeiler ekte kjernefysikk (nøytron, alfa, tungioner, Ca-48 varmfusjon)
- [x] Partikkelakselerator-rom (verden 13+, P-tast) med komplett AcceleratorScene UI
- [x] Fysiker-skillsti: T1 Halvleder, T2 Strålingsskjold, T3 Fisjon (2× U/Th-energi), T4 Fusjon (5× He-energi)
- [x] Fisjon/fusjon-energi: U=50, Th=40, He=200 virtuell energi i calculateFuelEnergy()
- [x] 15 nye mineraler (V, Br, I, Ge, Sb, Ga, Y, Dy, Er, Yb, Sm, Gd, Pr, Sr, Cs, Rb, Te, In, Th) + PGM-malm med Pt/Ir/Os
- [x] Edelgass-samling fra gasslommer (verden 10+)
- [x] Endgame «Guds periodiske system»: +10/+10/+5/+3 for alle 118
- [x] 2 nye synergier (Atomsmedja, Kvantekjemi)
- [x] Halvleder-system: Raffinering (6 oppskrifter: rå→rent) + 6 halvledermaterialer (Si-wafer m/ B/P-doping, SiC, Ge, GaAs, ITO, CdTe) + 10 teknologi-oppgraderinger (ruteberegner, elementskanner, laserturret, teleporter, EMP, kraftfelt, solcelle, termogenerator, reaktorkontroll, superleder) (v0.43)
- [ ] Jordens kjerne-sone visuelt tema – fremtidig

---

## 13. Datastruturer (JavaScript)

### Element-objekt
```javascript
{
  symbol: 'Fe',
  name: 'Jern',
  atomicNumber: 26,
  category: 'metal',          // 'metal', 'nonmetal', 'metalloid', 'noble', 'actinide', 'lanthanide'
  period: 4,
  group: 8,
  tier: 1,                    // 1–6, sjeldenhetsgrad
  color: 0x888888,            // Farge i sprites
  foundNative: false,         // Kan finnes som rent grunnstoff i naturen
  discovered: false,          // Spillerens fremgang
  stackSize: 99,
  description: 'Det vanligste tungmetallet på jord.'
}
```

### Mineral-objekt
```javascript
{
  id: 'hematite',
  name: 'Hematitt',
  formula: 'Fe₂O₃',
  tier: 1,
  color: 0x8B3A3A,
  yields: [
    { symbol: 'Fe', amount: 2, chance: 1.0 },
    { symbol: 'O', amount: 3, chance: 0.5 }
  ],
  energyCost: 2,              // Energienheter for smelting
  smeltingTime: 3,            // Ticks
  description: 'Rødlig jernmalm. Viktigste jernkilde.'
}
```

### Legering-objekt
```javascript
{
  id: 'steel',
  name: 'Stål',
  tier: 3,
  color: 0xaabbcc,
  recipe: [
    { symbol: 'Fe', amount: 9 },
    { symbol: 'C', amount: 1 }
  ],
  energyCost: 5,
  statBonuses: { attack: 3, defense: 2 },
  description: 'Fe + litt C. Sterkere enn rent jern.'
}
```

### Molekyl/Kjemikalie-objekt

Molekyler representerer kjemiske forbindelser laget av grunnstoffer (og evt. andre molekyler). De er en egen item-kategori mellom grunnstoffer og ferdige gjenstander.

```javascript
{
  id: 'sulfuric_acid',
  name: 'Svovelsyre',
  formula: 'H₂SO₄',
  type: 'acid',              // 'acid', 'base', 'salt', 'gas', 'organic', 'explosive', 'potion', 'medicine'
  tier: 2,
  color: 0xdddd00,
  state: 'liquid',           // 'solid', 'liquid', 'gas', 'plasma'
  recipe: [
    { symbol: 'S', amount: 1 },
    { symbol: 'O', amount: 4 },
    { moleculeId: 'water', amount: 1 }   // Molekyler kan inngå i andre molekyler
  ],
  requiresSkill: 'kjemiker', // Hvilken skill-sti som trengs
  skillTier: 1,
  energyCost: 1,
  stackSize: 20,
  effects: {
    onUse: { statusEffect: 'acid_burn', duration: 5, damage: 3 },
    onEquip: null,
    crafting: { dissolvesOxides: true, metalCleaning: true }
  },
  description: 'Sterk syre. Etser metaller og kan oppløse karbonholdige mineraler.'
}
```

```javascript
// Eksempel: Enklere molekyl som inngår i resepter
{
  id: 'water',
  name: 'Vann',
  formula: 'H₂O',
  type: 'base_compound',
  tier: 1,
  color: 0x4488ff,
  state: 'liquid',
  recipe: [
    { symbol: 'H', amount: 2 },
    { symbol: 'O', amount: 1 }
  ],
  requiresSkill: null,       // Grunnleggende – ingen skill nødvendig
  stackSize: 99,
  effects: {
    onUse: { healHP: 1 },
    crafting: { solvent: true, coolant: true }
  },
  description: 'Livgivende vann. Grunnleggende løsemiddel.'
}
```

```javascript
// Eksempel: Eksplosiv
{
  id: 'black_powder',
  name: 'Krutt',
  formula: 'KNO₃ + S + C',
  type: 'explosive',
  tier: 2,
  color: 0x333333,
  state: 'solid',
  recipe: [
    { moleculeId: 'potassium_nitrate', amount: 6 },
    { symbol: 'S', amount: 1 },
    { symbol: 'C', amount: 1 }
  ],
  requiresSkill: 'kjemiker',
  skillTier: 1,
  stackSize: 10,
  effects: {
    onUse: { aoe: true, radius: 2, damage: 8, statusEffect: 'stunned' }
  },
  description: 'Klassisk krutt. KNO₃ + S + C. Eksploderer ved antennelse.'
}
```

**Kategorier av molekyler/kjemikalier:**

| Type | Eksempler | Primær bruk |
|------|-----------|-------------|
| `base_compound` | H₂O, CO₂, NaCl | Ingrediens i alt annet |
| `acid` | H₂SO₄, HCl, HNO₃ | Oppløse materialer, bomber |
| `base` | NaOH, Ca(OH)₂, NH₃ | Nøytralisere syrer, potions |
| `salt` | KNO₃, FeSO₄, CuSO₄ | Mellomprodukt, krutt |
| `gas` | H₂, Cl₂, NH₃, SO₂ | Røykbomber, energi, gift |
| `organic` | Etanol, glyserin, kloroform | Medisin, potions, løsemiddel |
| `explosive` | Krutt, nitroglyserol, TNT | Bomber, sprengning av vegger |
| `potion` | Helbredelse, styrke, usynlighet | Direkte bruk av spilleren |
| `medicine` | Antiseptisk, antidot, febermedisin | Fjerne statuseffekter |
| `semiconductor` | SiO₂, GaAs, Si₃N₄ | Avansert teknologi (Fysiker) |

---

## 14. Åpne designspørsmål

1. **Hydrogen** – Atomnr. 1, men vanskelig å isolere og lagre. Skal det inkluderes, og i så fall hvordan?
2. **Radioaktivitet** – Bør radioaktive materialer gi løpende HP-tap ved lagring? Vil gjøre dem dramatiske å samle (og krever Fysiker T2 Strålingsshield for trygg håndtering).
3. **Krystall vs. mineral** – Bør krystaller og edelstener være samme system eller separat?
4. **Dybde-scaling** – Bør mineralenes tier matche sone eksplisitt (se tabell 10.1) eller ha tilfeldig spredning med sone som gulv?
5. **Energi som global ressurs** – Bør energi være noe man alltid har tilgang til (forutsatt brensel i inventar), eller noe som knyttes til en stasjonær ovn i leirplass-rom?
6. **Syntetiske grunnstoffer** – Disse (Tc, Pm, og alle > 92) kan ikke finnes naturlig. Skal de kreve en spesifikk «syntese-prosess» låst bak Fysiker T3?
7. **Antall skill-stier totalt** – Med 4 eksisterende + 4 nye = 8 stier. Er dette for mye å velge mellom? Bør noen slås sammen eller låses bak progresjon?
8. **Crafting i sanntid vs. turbasert** – Smelting og syntese tar «ticks». Skal spilleren kunne bevege seg mens prosessen pågår, eller fryses handlingen?
9. **Inventarkapasitet** – Med mineraler, grunnstoffer, legeringer, molekyler og kjemikalier vil inventaret bli mye større. Trenger vi kategorifaner eller et utvidet lager-system?
