# Plan for Fixing Playtest Issues (#164–#187)

## Goals
- Ship the bug fixes first, then UX, then balance, then larger systems work.
- Each batch is independently shippable. One PR per batch is recommended; small bugs can be folded into a single PR.
- All work happens on `claude/<short-description>` branches per CLAUDE.md, with CHANGELOG.md and GDD.md updated on each gameplay/system change.

---

## Batch 1 — Quick UX fixes (low risk, high value)
**Branch:** `claude/playtest-ux-quickfixes`
- #171 Black "UTSTYR" text → change color in `src/scenes/InventoryScene.js`
- #180 Larger close-X button → audit X usage across scenes; introduce a `UIHelper.makeCloseButton(scene, x, y, onClose)` in `src/utils/UIHelper.js`, migrate scenes (`InventoryScene`, `MerchantScene`, `SmelteryScene`, `MineralWikiScene`, `ElementBookScene`, `SkillScene`, `SettingsScene`, `ChemLabScene`, `AcceleratorScene`)
- #179 Mineral Wiki in top menu + larger top-menu buttons → `src/scenes/UIScene.js`
- #167 Completed-skill visual state → `src/scenes/SkillScene.js`: add a "completed" style (bright border + checkmark), distinct from locked
- #168 Monster arrows visibility → projectile rendering in `MonsterManager` / `CombatManager`: bigger sprite, glow trail
- #169 Merchant window sizing → `src/scenes/MerchantScene.js`: resize panel and/or add scroll

**Verification:** open `index.html`, sweep each scene.

---

## Batch 2 — Inventory / Scandium belt cluster
**Branch:** `claude/scandium-belt-inventory`
- #170 Scandium belt grants slots → trace equip path in `src/entities/Hero.js`, `src/systems/Inventory.js`, and `src/entities/HeroCrafting.js`; ensure capacity bonus applies on equip and on load
- #172 Backpack count duplicated, unfillable slots → likely same root cause; remove dual capacity sources, make `Inventory.capacity` single source of truth, refactor `InventoryScene` display
- Verify save/load round-trip preserves capacity

**Verification:** forge & equip Scandium belt; check `InventoryScene` shows one capacity number; fill all visible slots; reload save.

---

## Batch 3 — Smelting / discovery bug cluster
**Branch:** `claude/smelting-discovery-fixes`
- #164 Bauxite vanishes during batch smelt → step through `SmelteryScene` batch loop and `SmeltingSystem.smelt()`; suspect state shared between queue items
- #176 Transmutation discovery popup → in transmutation system, after producing element call `ElementTracker.discover()` and trigger `DiscoveryPopupScene`. Make `ElementTracker.discover()` the single funnel that any source (smelt, transmute, alloy, molecule) routes through
- #178 Popup ordering: element popup before group/period achievement → introduce a priority queue in `DiscoveryPopupScene`: element=1, alloy/molecule=2, group/period=3; show in priority order, then chronologically

**Verification:** queue 3 minerals incl. Bauxite, confirm none disappear; transmute to undiscovered element → popup appears; complete a period that contains an undiscovered element → element popup first, then period popup.

---

## Batch 4 — Skill / shop gating
**Branch:** `claude/skill-gating`
- #166 Hide minerals in merchant inventory when Geology not learned → filter in `MerchantScene` stock generation
- #165 Add pet-speed skill node → `src/scenes/SkillScene.js` + skill data; apply in `Pet.update()` movement multiplier

**Verification:** new save without Geology → no minerals at merchant; unlock pet-speed skill → pet visibly faster.

---

## Batch 5 — World theme & lighting
**Branch:** `claude/world-theme-alignment`
- #181 Theme/music aligned to world-type ranges → audit world config (likely `src/constants.js` or a `data/worlds.js`); make theme/music boundaries match world-type boundaries
- #177 Dark-world contrast → tweak palette in `MapRenderer` per theme (especially Underverden); brighten corridor tiles or darken walls

**Verification:** play through worlds 1/3 → 3/3 of Overworld, confirm theme/music consistent; explore Underverden, walls vs corridors clearly distinguishable.

---

## Batch 6 — Combat / VFX
**Branch:** `claude/bombs-and-doors`
- #173 Bomb effects + wall destruction radius/probability → in bomb detonation path: bigger VFX (flash, particles, shake), implement probabilistic wall break per bomb type
- #186 Doors only unlock on attack press → remove proximity auto-unlock in door interaction code; require attack input within range

**Verification:** detonate thermite next to walls, confirm visual + occasional wall break; approach locked door, no auto-unlock; press attack adjacent → unlocks.

---

## Batch 7 — Balance pass (data-only changes)
**Branch:** `claude/balance-pass`
- #175 More Cr, Mn, Ni, Sn → adjust mineral spawn weights in `ItemSpawner` / mineral data
- #182 Less Uraninite/Thorite at high levels; add minerals for N, noble gases, F, period 4 & 5 transition metals → expand mineral table in `src/data/minerals.js` (or equivalent); update spawn distribution by world tier
- #174 Add at least one brass forging recipe → `HeroCrafting.js` / forge recipes
- #184 Gold inflation → tune late-game prices/rewards; iterate with `simulator.html`
- #187 Forged items slightly stronger → bump stats in forging recipes

**Verification:** run `simulator.html` across world tiers; confirm Bronze achievable mid-game; spot-check element coverage.

---

## Batch 8 — Larger systems work (last; biggest scope)
**Branch:** `claude/sell-and-fog`
- #183 Sell items → add Sell tab in `MerchantScene`; define sell price (e.g. 30% of buy price); persist via existing save system
- #185 Line-of-sight fog of war on Normal/Hard → shadowcasting in `MapRenderer` or new `VisibilitySystem`; gate on difficulty; keep Easy as today

**Verification:** sell items round-trip with save/load; play Normal & Hard, confirm corridor-only vision; performance stable on largest maps.

---

## Cross-cutting hygiene
- Update `docs/CHANGELOG.md` per batch under the current version section (Norwegian, existing convention).
- Update `docs/GDD.md` sections for: skill tree (pet speed, completed state), forging (brass, forged stats), economy (sell, prices), fog of war, mineral table, world themes.
- Where a batch touches files already cited in earlier refactor issues (#146–#152), prefer absorbing the tiny refactor when it's cheap; otherwise leave untouched.

## Estimated sequencing
1. Batch 1 (UX) — 1 short PR
2. Batch 2 (inventory) — 1 PR (debug-heavy)
3. Batch 3 (smelting/discovery) — 1 PR
4. Batch 4 (gating) — 1 PR
5. Batch 5 (themes/lighting) — 1 PR
6. Batch 6 (bombs/doors) — 1 PR
7. Batch 7 (balance) — 1 PR (data + simulator iterations)
8. Batch 8 (sell + LOS fog) — 2 PRs if needed
