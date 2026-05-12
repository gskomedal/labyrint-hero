// ─── Labyrint Hero – Smeltery Tab Renderers ─────────────────────────────────
// Pure-render classes lifted out of SmelteryScene so the scene can stay an
// orchestrator. Each class exposes `static draw(scene)` and reads/writes
// state on the passed scene reference (heroRef, smelter, _dyn, _scrollOffsets,
// _elementFilter, contentY, panelW, etc.).
//
// Action handlers (_doSmelt, _doForge, _depositItem, etc.) intentionally
// remain on the scene — the renderers call back via `scene.<handler>`. This
// keeps the split focused on UI rendering without splitting the scene's
// transactional behavior across multiple files.

// Helper for dynamic-object tracking shared by all tab draws.
function _d(scene, obj) { return scene._d(obj); }

// ════════════════════════════════════════════════════════════════════════════
// STASH TAB
// ════════════════════════════════════════════════════════════════════════════

class StashTabRenderer {
    static draw(scene) {
        const hero = scene.heroRef;
        const cx = scene.px + scene.panelW / 2;
        let y = scene.contentY;
        const colW = Math.min(460, scene.panelW / 2 - 30);
        const leftX = scene.px + 20;
        const rightX = cx + 10;
        const scrollOff = scene._scrollOffsets.stash || 0;
        const visTop = scene.contentY - 10;
        const visBot = scene.py + scene.panelH - 40;

        // ── Left side: Backpack (deposit from) ──────────────────────────────
        const hdrLeftY = y - scrollOff;
        if (hdrLeftY >= visTop && hdrLeftY <= visBot) {
            _d(scene, scene.add.text(leftX, hdrLeftY, 'RYGGSEKK → Lager', {
                fontSize: '14px', color: '#887766', fontFamily: 'monospace', fontStyle: 'bold'
            }));
        }
        y += 20;

        let bpY = y;
        let hasDepositable = false;
        for (let i = 0; i < hero.inventory.backpack.length; i++) {
            const entry = hero.inventory.backpack[i];
            if (!entry) continue;
            const def = hero.inventory._getItemDef(entry);
            if (!def) continue;
            if (def.type !== 'mineral' && def.type !== 'fuel') continue;
            hasDepositable = true;

            const adjY = bpY - scrollOff;
            bpY += 22;
            if (adjY > visBot) continue;
            if (adjY < visTop) continue;

            const col = def.color || 0xaaaaaa;
            const hexCol = '#' + col.toString(16).padStart(6, '0');

            const stashDepName = (def.type === 'mineral' && typeof getMineralDisplayName !== 'undefined')
                ? getMineralDisplayName(def, hero) : def.name;
            const nameText = _d(scene, scene.add.text(leftX + 4, adjY, `${stashDepName} ×${entry.count}`, {
                fontSize: '14px', color: hexCol, fontFamily: 'monospace'
            }).setInteractive());
            if (def.type === 'mineral' && def.yields) {
                const yieldStr = def.yields.map(y => y.symbol).join(', ');
                nameText.on('pointerover', () => {
                    scene.tooltips.show(leftX + 4, adjY - 18, `T${def.tier} → ${yieldStr}`, {
                        color: '#bbaa88', backgroundColor: '#0a0608',
                        padding: { x: 4, y: 2 }, stroke: '', strokeThickness: 0,
                    }, { origin: { x: 0, y: 1 }, clampToCamera: false });
                });
                nameText.on('pointerout', () => scene.tooltips.hide());
            }

            const btn = _d(scene, scene.add.text(leftX + colW - 10, adjY, '→', {
                fontSize: '16px', color: '#ff7722', fontFamily: 'monospace', fontStyle: 'bold'
            }).setOrigin(1, 0).setInteractive({ useHandCursor: true }));
            const slotIdx = i;
            UIHelper.attachHover(btn, {
                hoverColor: '#ffaa44', normalColor: '#ff7722',
                onClick: () => scene._depositItem(slotIdx),
            });
        }
        if (!hasDepositable) {
            const adjY = y - scrollOff;
            if (adjY >= visTop && adjY <= visBot) {
                _d(scene, scene.add.text(leftX + 4, adjY, 'Ingen mineraler/brensel', {
                    fontSize: '14px', color: '#444433', fontFamily: 'monospace'
                }));
            }
        }

        // ── Right side: Stash (withdraw from) ──────────────────────────────
        let sBaseY = scene.contentY;
        const hdrRightY = sBaseY - scrollOff;
        if (hdrRightY >= visTop && hdrRightY <= visBot) {
            _d(scene, scene.add.text(rightX, hdrRightY, 'LAGER → Ryggsekk', {
                fontSize: '14px', color: '#887766', fontFamily: 'monospace', fontStyle: 'bold'
            }));
        }
        sBaseY += 20;

        let sY = sBaseY;
        if (hero.campStash.length === 0) {
            const adjY = sBaseY - scrollOff;
            if (adjY >= visTop && adjY <= visBot) {
                _d(scene, scene.add.text(rightX + 4, adjY, 'Lageret er tomt.', {
                    fontSize: '14px', color: '#444433', fontFamily: 'monospace'
                }));
            }
            sY = sBaseY + 22;
        } else {
            for (let si = 0; si < hero.campStash.length; si++) {
                const stashEntry = hero.campStash[si];
                if (!stashEntry || stashEntry.count <= 0) continue;

                const adjY = sY - scrollOff;
                sY += 22;
                if (adjY > visBot) continue;
                if (adjY < visTop) continue;

                const def = scene._getStashItemDef(stashEntry.id);
                const rawStName = def ? def.name : stashEntry.id;
                const stName = (def && def.type === 'mineral' && typeof getMineralDisplayName !== 'undefined')
                    ? getMineralDisplayName(def, hero) : rawStName;
                const col = def ? def.color : 0xaaaaaa;
                const hexCol = '#' + col.toString(16).padStart(6, '0');

                const stText = _d(scene, scene.add.text(rightX + 4, adjY, `${stName} ×${stashEntry.count}`, {
                    fontSize: '14px', color: hexCol, fontFamily: 'monospace'
                }).setInteractive());
                if (def && def.type === 'mineral' && def.yields) {
                    const yieldStr = def.yields.map(y => y.symbol).join(', ');
                    stText.on('pointerover', () => {
                        scene.tooltips.show(rightX + 4, adjY - 18, `T${def.tier} → ${yieldStr}`, {
                            color: '#bbaa88', backgroundColor: '#0a0608',
                            padding: { x: 4, y: 2 }, stroke: '', strokeThickness: 0,
                        }, { origin: { x: 0, y: 1 }, clampToCamera: false });
                    });
                    stText.on('pointerout', () => scene.tooltips.hide());
                }

                const btn = _d(scene, scene.add.text(rightX + colW - 10, adjY, '←', {
                    fontSize: '16px', color: '#ff7722', fontFamily: 'monospace', fontStyle: 'bold'
                }).setOrigin(1, 0).setInteractive({ useHandCursor: true }));
                const idx = si;
                UIHelper.attachHover(btn, {
                    hoverColor: '#ffaa44', normalColor: '#ff7722',
                    onClick: () => scene._withdrawItem(idx),
                });
            }
        }

        scene._contentEndY = Math.max(bpY, sY);

        const totalStashed = hero.campStash.reduce((s, e) => s + (e.count || 0), 0);
        _d(scene, scene.add.text(cx, scene.py + scene.panelH - 24,
            `Lagret: ${totalStashed} gjenstander  |  Klikk → for å lagre, ← for å hente`, {
            fontSize: '14px', color: '#665544', fontFamily: 'monospace'
        }).setOrigin(0.5));
    }
}

// ════════════════════════════════════════════════════════════════════════════
// SMELT TAB
// ════════════════════════════════════════════════════════════════════════════

class SmeltTabRenderer {
    static draw(scene) {
        const hero = scene.heroRef;
        const cx = scene.px + scene.panelW / 2;
        let y = scene.contentY;
        const scrollOff = scene._scrollOffsets.smelt || 0;
        const visTop = scene.contentY - 10;
        const visBot = scene.py + scene.panelH - 40;

        _d(scene, scene.add.text(cx, y, 'Velg et mineral å smelte (ryggsekk + lager):', {
            fontSize: '14px', color: '#887766', fontFamily: 'monospace'
        }).setOrigin(0.5));
        y += 22;

        if (scene._elementFilter) {
            const filterElem = typeof ELEMENTS !== 'undefined' ? ELEMENTS[scene._elementFilter] : null;
            const fCol = filterElem ? '#' + filterElem.color.toString(16).padStart(6, '0') : '#ff7722';
            _d(scene, scene.add.text(scene.px + 20, y, `Filter: ${scene._elementFilter}`, {
                fontSize: '14px', color: fCol, fontFamily: 'monospace', fontStyle: 'bold'
            }));
            const clearBtn = _d(scene, scene.add.text(scene.px + 110, y, '✕ Fjern filter', {
                fontSize: '14px', color: '#886644', fontFamily: 'monospace'
            }).setInteractive({ useHandCursor: true }));
            UIHelper.attachHover(clearBtn, {
                hoverColor: '#ffaa44', normalColor: '#886644',
                onClick: () => { scene._elementFilter = null; scene._scrollOffsets.smelt = 0; scene._refresh(); },
            });
            y += 20;
        }

        const minerals = [];
        for (let i = 0; i < hero.inventory.backpack.length; i++) {
            const entry = hero.inventory.backpack[i];
            if (!entry) continue;
            const def = hero.inventory._getItemDef(entry);
            if (def && def.type === 'mineral' && def.subtype === 'ore' && def.yields) {
                minerals.push({ source: 'backpack', slot: i, def, count: entry.count || 1 });
            }
        }
        for (let i = 0; i < hero.campStash.length; i++) {
            const stashEntry = hero.campStash[i];
            if (!stashEntry || stashEntry.count <= 0) continue;
            const def = scene._getStashItemDef(stashEntry.id);
            if (def && def.type === 'mineral' && def.subtype === 'ore' && def.yields) {
                minerals.push({ source: 'stash', slot: i, def, count: stashEntry.count });
            }
        }

        const filtered = scene._elementFilter
            ? minerals.filter(m => m.def.yields.some(y => y.symbol === scene._elementFilter))
            : minerals;

        if (filtered.length === 0) {
            const msg = scene._elementFilter
                ? `Ingen mineraler gir ${scene._elementFilter}.`
                : 'Ingen mineraler i ryggsekk eller lager.';
            _d(scene, scene.add.text(cx, y + 30, msg, {
                fontSize: '14px', color: '#444433', fontFamily: 'monospace'
            }).setOrigin(0.5));
            scene._drawElementInventory(scene.px + 20, y + 60, Math.min(560, scene.panelW - 40));
            scene._contentEndY = y + 60 + 120;
            return;
        }

        const fuel = scene.smelter.calculateFuelEnergy(hero);
        const colW = Math.min(560, scene.panelW - 40);
        const startX = scene.px + 20;
        const rowStep = 54;

        filtered.forEach((m, idx) => {
            const baseY = y + idx * rowStep;
            const my = baseY - scrollOff;
            if (my > visBot) return;
            if (my < visTop - 50) return;
            const check = scene.smelter.canSmelt(m.def, fuel, hero);
            const col = check.canSmelt ? 0xff7722 : 0x443322;
            const hexCol = '#' + col.toString(16).padStart(6, '0');

            const bg = _d(scene, scene.add.graphics());
            bg.fillStyle(col, 0.08);
            bg.fillRoundedRect(startX, my, colW, 48, 4);
            bg.lineStyle(1, col, 0.3);
            bg.strokeRoundedRect(startX, my, colW, 48, 4);

            const srcLabel = m.source === 'stash' ? ' [lager]' : '';
            const canId = (hero.mineralIdentifyLevel || 0) > 0;
            const rawName = (typeof getMineralDisplayName !== 'undefined')
                ? getMineralDisplayName(m.def, hero) : m.def.name;
            const mName = rawName.length > 28 ? rawName.slice(0, 27) + '…' : rawName;
            _d(scene, scene.add.text(startX + 8, my + 6, `${mName} (×${m.count})${srcLabel}`, {
                fontSize: '15px', color: hexCol, fontFamily: 'monospace', fontStyle: 'bold'
            }));

            if (canId) {
                let yieldX = startX + 8;
                _d(scene, scene.add.text(yieldX, my + 26, '→ ', {
                    fontSize: '14px', color: '#776655', fontFamily: 'monospace'
                }));
                yieldX += 22;
                m.def.yields.forEach((yld, yi) => {
                    const isMatch = scene._elementFilter && yld.symbol === scene._elementFilter;
                    const yCol = isMatch ? '#ffcc44' : '#776655';
                    const txt = `${yld.symbol}×${yld.amount}${yi < m.def.yields.length - 1 ? ', ' : ''}`;
                    const t = _d(scene, scene.add.text(yieldX, my + 26, txt, {
                        fontSize: '14px', color: yCol, fontFamily: 'monospace',
                        fontStyle: isMatch ? 'bold' : 'normal'
                    }));
                    yieldX += t.width;
                });
                _d(scene, scene.add.text(yieldX + 4, my + 26, `|  Energi: ${check.energyCost}`, {
                    fontSize: '14px', color: '#776655', fontFamily: 'monospace'
                }));
            } else {
                _d(scene, scene.add.text(startX + 8, my + 26, `→ ???  |  Energi: ${check.energyCost}`, {
                    fontSize: '14px', color: '#776655', fontFamily: 'monospace'
                }));
            }

            if (check.canSmelt) {
                const btn = _d(scene, scene.add.text(startX + colW - 70, my + 14, '[ Smelt ]', {
                    fontSize: '15px', color: '#ff7722', fontFamily: 'monospace', fontStyle: 'bold'
                }).setInteractive({ useHandCursor: true }));
                UIHelper.attachHover(btn, {
                    hoverColor: '#ffaa44', normalColor: '#ff7722',
                    onClick: () => (m.source === 'stash')
                        ? scene._doSmeltFromStash(m.slot, m.def)
                        : scene._doSmelt(m.slot, m.def),
                });
                const batchN = hero.batchSmeltSize || 1;
                if (batchN > 1 && m.count > 1) {
                    const label = `[ ×${Math.min(batchN, m.count)} ]`;
                    const bbtn = _d(scene, scene.add.text(startX + colW - 140, my + 14, label, {
                        fontSize: '14px', color: '#ffcc44', fontFamily: 'monospace', fontStyle: 'bold'
                    }).setInteractive({ useHandCursor: true }));
                    UIHelper.attachHover(bbtn, { hoverColor: '#ffee88', normalColor: '#ffcc44' });
                    bbtn.on('pointerdown', () => {
                        for (let i = 0; i < batchN; i++) {
                            const entry = m.source === 'stash'
                                ? hero.campStash[m.slot]
                                : hero.inventory.backpack[m.slot];
                            if (!entry || entry.count <= 0) break;
                            const fuelNow = scene.smelter.calculateFuelEnergy(hero);
                            const chk = scene.smelter.canSmelt(m.def, fuelNow, hero);
                            if (!chk.canSmelt) break;
                            if (m.source === 'stash') scene._doSmeltFromStash(m.slot, m.def);
                            else scene._doSmelt(m.slot, m.def);
                        }
                    });
                }
            } else {
                _d(scene, scene.add.text(startX + colW - 80, my + 14, 'Lite brensel', {
                    fontSize: '14px', color: '#443322', fontFamily: 'monospace'
                }));
            }
        });

        const elemBaseY = y + filtered.length * rowStep + 10;
        const elemY = elemBaseY - scrollOff;
        if (elemY <= visBot) {
            scene._drawElementInventory(startX, Math.max(elemY, visTop), colW);
        }

        // Pyrolysis section
        const pyroBaseY = elemBaseY + 130;
        const pyroHeaderY = pyroBaseY - scrollOff;
        if (pyroHeaderY <= visBot) {
            _d(scene, scene.add.text(cx, pyroHeaderY, 'Pyrolyse brensel → grunnstoffer:', {
                fontSize: '14px', color: '#887766', fontFamily: 'monospace'
            }).setOrigin(0.5));
        }

        const pyroFuels = [];
        for (let i = 0; i < hero.inventory.backpack.length; i++) {
            const entry = hero.inventory.backpack[i];
            if (!entry) continue;
            const def = typeof FUEL_DEFS !== 'undefined' ? FUEL_DEFS[entry.id] : null;
            if (def && def.pyrolysisYields) pyroFuels.push({ source: 'backpack', slot: i, def, count: entry.count || 1 });
        }
        if (hero.campStash) {
            for (let i = 0; i < hero.campStash.length; i++) {
                const entry = hero.campStash[i];
                if (!entry || entry.count <= 0) continue;
                const def = typeof FUEL_DEFS !== 'undefined' ? FUEL_DEFS[entry.id] : null;
                if (def && def.pyrolysisYields) pyroFuels.push({ source: 'stash', slot: i, def, count: entry.count });
            }
        }

        let pyroRowY = pyroBaseY + 22;
        if (pyroFuels.length === 0) {
            const noFuelY = pyroRowY - scrollOff;
            if (noFuelY >= visTop && noFuelY <= visBot) {
                _d(scene, scene.add.text(cx, noFuelY, 'Ingen organisk brensel å pyrolysere.', {
                    fontSize: '13px', color: '#443322', fontFamily: 'monospace'
                }).setOrigin(0.5));
            }
            pyroRowY += 20;
        } else {
            for (const pf of pyroFuels) {
                const adjY = pyroRowY - scrollOff;
                pyroRowY += 44;
                if (adjY > visBot) continue;
                if (adjY < visTop - 44) continue;
                const pyroCheck = scene.smelter.pyrolyseFuel
                    ? { canPyro: scene.smelter.calculateFuelEnergy(hero) >= (pf.def.pyrolysisCost || 2) }
                    : { canPyro: false };
                const pCol = pyroCheck.canPyro ? 0x44aacc : 0x443322;
                const pHex = '#' + pCol.toString(16).padStart(6, '0');
                const bg = _d(scene, scene.add.graphics());
                bg.fillStyle(pCol, 0.08);
                bg.fillRoundedRect(startX, adjY, colW, 40, 4);
                const srcLabel = pf.source === 'stash' ? ' [lager]' : '';
                _d(scene, scene.add.text(startX + 8, adjY + 4, `${pf.def.name} (×${pf.count})${srcLabel}`, {
                    fontSize: '14px', color: pHex, fontFamily: 'monospace', fontStyle: 'bold'
                }));
                const yieldStr = pf.def.pyrolysisYields.map(yld => `${yld.symbol}×${yld.amount}`).join(', ');
                _d(scene, scene.add.text(startX + 8, adjY + 22, `→ ${yieldStr}  |  Energi: ${pf.def.pyrolysisCost || 2}`, {
                    fontSize: '13px', color: '#776655', fontFamily: 'monospace'
                }));
                if (pyroCheck.canPyro) {
                    const btn = _d(scene, scene.add.text(startX + colW - 100, adjY + 10, '[ Pyrolyse ]', {
                        fontSize: '13px', color: '#44aacc', fontFamily: 'monospace', fontStyle: 'bold'
                    }).setInteractive({ useHandCursor: true }));
                    UIHelper.attachHover(btn, {
                        hoverColor: '#88ccee', normalColor: '#44aacc',
                        onClick: () => scene._doPyrolysis(pf),
                    });
                }
            }
        }
        scene._contentEndY = pyroRowY;
    }
}

// ════════════════════════════════════════════════════════════════════════════
// ALLOY TAB
// ════════════════════════════════════════════════════════════════════════════

class AlloyTabRenderer {
    static draw(scene) {
        const hero = scene.heroRef;
        const cx = scene.px + scene.panelW / 2;
        let y = scene.contentY;
        const scrollOff = scene._scrollOffsets.alloy || 0;
        const visTop = scene.contentY - 10;
        const visBot = scene.py + scene.panelH - 40;

        _d(scene, scene.add.text(cx, y, 'Kombiner grunnstoffer til legeringer:', {
            fontSize: '14px', color: '#887766', fontFamily: 'monospace'
        }).setOrigin(0.5));
        y += 22;

        const fuel = scene.smelter.calculateFuelEnergy(hero);
        let alloys = scene.smelter.getAvailableAlloys(hero, fuel);
        if (scene._elementFilter) {
            alloys = alloys.filter(e => e.alloy.recipe.some(r => r.symbol === scene._elementFilter));
        }
        const colW = Math.min(560, scene.panelW - 40);
        const startX = scene.px + 20;
        const rowStep = 60;

        if (alloys.length === 0) {
            _d(scene, scene.add.text(cx, y + 30, 'Ingen legeringer tilgjengelig.', {
                fontSize: '14px', color: '#444433', fontFamily: 'monospace'
            }).setOrigin(0.5));
            scene._drawElementInventory(startX, y + 60, colW);
            scene._contentEndY = y + 60 + 120;
            return;
        }

        alloys.forEach((entry, idx) => {
            const baseY = y + idx * rowStep;
            const ay = baseY - scrollOff;
            if (ay > visBot) return;
            if (ay < visTop - 54) return;
            const a = entry.alloy;
            const col = entry.canCraft ? 0xff7722 : 0x443322;
            const hexCol = '#' + col.toString(16).padStart(6, '0');

            const bg = _d(scene, scene.add.graphics());
            bg.fillStyle(col, 0.08);
            bg.fillRoundedRect(startX, ay, colW, 54, 4);
            bg.lineStyle(1, col, 0.3);
            bg.strokeRoundedRect(startX, ay, colW, 54, 4);

            _d(scene, scene.add.text(startX + 8, ay + 6, `${a.name} (${a.formula})`, {
                fontSize: '15px', color: hexCol, fontFamily: 'monospace', fontStyle: 'bold'
            }));

            const recipeStr = a.recipe.map(r => {
                const have = hero.elementTracker.getCount(r.symbol);
                const ok = have >= r.amount;
                return `${r.symbol}: ${have}/${r.amount}${ok ? '' : '!'}`;
            }).join('  ');
            _d(scene, scene.add.text(startX + 8, ay + 24, recipeStr, {
                fontSize: '14px', color: '#776655', fontFamily: 'monospace'
            }));

            const stats = a.statBonuses;
            const statStr = Object.entries(stats).map(([k, v]) => `+${v} ${k}`).join(', ');
            _d(scene, scene.add.text(startX + 8, ay + 38, `Stats: ${statStr}  |  Energi: ${entry.energyCost}`, {
                fontSize: '13px', color: '#665544', fontFamily: 'monospace'
            }));

            if (entry.canCraft) {
                const btn = _d(scene, scene.add.text(startX + colW - 60, ay + 16, '[ Lag ]', {
                    fontSize: '15px', color: '#ff7722', fontFamily: 'monospace', fontStyle: 'bold'
                }).setInteractive({ useHandCursor: true }));
                UIHelper.attachHover(btn, {
                    hoverColor: '#ffaa44', normalColor: '#ff7722',
                    onClick: () => scene._doCraftAlloy(a.id),
                });
            }
        });

        const elemBaseY = y + alloys.length * rowStep + 10;
        const elemY = elemBaseY - scrollOff;
        if (elemY <= visBot) {
            scene._drawElementInventory(startX, Math.max(elemY, visTop), colW);
        }
        scene._contentEndY = elemBaseY + 120;
    }
}

// ════════════════════════════════════════════════════════════════════════════
// FORGE TAB
// ════════════════════════════════════════════════════════════════════════════

class ForgeTabRenderer {
    static draw(scene) {
        const hero = scene.heroRef;
        const cx = scene.px + scene.panelW / 2;
        let y = scene.contentY;
        const scrollOff = scene._scrollOffsets.forge || 0;
        const visTop = scene.contentY - 10;
        const visBot = scene.py + scene.panelH - 40;

        _d(scene, scene.add.text(cx, y, 'Smi utstyr fra legeringer:', {
            fontSize: '14px', color: '#887766', fontFamily: 'monospace'
        }).setOrigin(0.5));
        y += 22;

        // Metallurg T4 "Reforge"
        if (hero.reforgeUnlocked) {
            const rx = scene.px + 20;
            const ry = y;
            const fuel = scene.smelter.calculateFuelEnergy(hero);
            _d(scene, scene.add.text(rx, ry, `Reforge (5 energi) – ruller stats på nytt på utstyrt gjenstand:`, {
                fontSize: '13px', color: '#ffcc88', fontFamily: 'monospace'
            }));
            const makeBtn = (offset, slot, label) => {
                const eq = hero.inventory && hero.inventory.equipped ? hero.inventory.equipped[slot] : null;
                const txt = eq ? `[ ${label}: ${eq.name} ]` : `[ ${label}: — ]`;
                const t = _d(scene, scene.add.text(rx + offset, ry + 18, txt, {
                    fontSize: '13px',
                    color: (eq && fuel >= 5) ? '#ffcc44' : '#554433',
                    fontFamily: 'monospace', fontStyle: 'bold'
                }));
                if (eq && fuel >= 5) {
                    t.setInteractive({ useHandCursor: true });
                    UIHelper.attachHover(t, {
                        hoverColor: '#ffee88', normalColor: '#ffcc44',
                        onClick: () => scene._doReforge(slot),
                    });
                }
            };
            makeBtn(0, 'weapon', 'Reforge våpen');
            makeBtn(260, 'armor', 'Reforge rustning');
            y += 44;
        }

        const alloyInv = hero.alloyInventory || {};
        const available = Object.entries(alloyInv).filter(([, count]) => count > 0);
        const colW = Math.min(560, scene.panelW - 40);
        const startX = scene.px + 20;

        if (available.length === 0) {
            _d(scene, scene.add.text(cx, y + 30, 'Ingen legeringer å smi med.\nLag legeringer i "Legering"-fanen først.', {
                fontSize: '14px', color: '#444433', fontFamily: 'monospace', align: 'center'
            }).setOrigin(0.5));
            scene._contentEndY = y + 80;
            return;
        }

        let rowY = y;
        for (const [alloyId, count] of available) {
            const alloy = ALLOY_DEFS[alloyId];
            if (!alloy) continue;

            const adjHdr = rowY - scrollOff;
            if (adjHdr >= visTop && adjHdr <= visBot) {
                _d(scene, scene.add.text(startX, adjHdr, `${alloy.name} (×${count}):`, {
                    fontSize: '15px', color: '#ff7722', fontFamily: 'monospace', fontStyle: 'bold'
                }));
            }
            rowY += 22;

            const equipment = scene.smelter.getForgeableEquipment(alloyId);
            equipment.forEach(equip => {
                const adjY = rowY - scrollOff;
                rowY += 44;
                if (adjY > visBot) return;
                if (adjY < visTop - 40) return;

                const isPet = !!equip.petSlot;
                const hexCol = '#' + (equip.color || 0xaabbcc).toString(16).padStart(6, '0');
                const typeLabel = isPet
                    ? (equip.petSlot === 'weapon' ? '🐾 Kjæledyr-klo' : '🐾 Kjæledyr-rust')
                    : (equip.type === 'weapon' ? 'Våpen' : equip.type === 'tool' ? 'Verktøy' : 'Rustning');

                const bg = _d(scene, scene.add.graphics());
                bg.fillStyle(equip.color || 0xaabbcc, 0.08);
                bg.fillRoundedRect(startX + 10, adjY, colW - 20, 40, 3);

                _d(scene, scene.add.text(startX + 18, adjY + 6, `${equip.name} (${typeLabel})`, {
                    fontSize: '14px', color: hexCol, fontFamily: 'monospace'
                }));
                _d(scene, scene.add.text(startX + 18, adjY + 22, equip.desc, {
                    fontSize: '13px', color: '#776655', fontFamily: 'monospace',
                    wordWrap: { width: colW - 120 }
                }));

                const btn = _d(scene, scene.add.text(startX + colW - 70, adjY + 12, '[ Smi ]', {
                    fontSize: '14px', color: isPet ? '#ffaadd' : '#ff7722', fontFamily: 'monospace', fontStyle: 'bold'
                }).setInteractive({ useHandCursor: true }));
                UIHelper.attachHover(btn, {
                    hoverColor:  isPet ? '#ffccee' : '#ffaa44',
                    normalColor: isPet ? '#ffaadd' : '#ff7722',
                    onClick: () => isPet ? scene._doPetForge(alloyId, equip) : scene._doForge(alloyId, equip.id),
                });
            });
            rowY += 8;
        }
        scene._contentEndY = rowY;
    }
}

// ════════════════════════════════════════════════════════════════════════════
// REFINE TAB
// ════════════════════════════════════════════════════════════════════════════

class RefineTabRenderer {
    static draw(scene) {
        const hero = scene.heroRef;
        const cx = scene.px + scene.panelW / 2;
        let y = scene.contentY;
        const scrollOff = scene._scrollOffsets.refine || 0;
        const visBot = scene.py + scene.panelH - 40;
        const fuel = scene.smelter.calculateFuelEnergy(hero);
        const colW = Math.min(560, scene.panelW - 40);
        const startX = scene.px + 20;

        _d(scene, scene.add.text(cx, y, 'Raffiner grunnstoffer til halvlederkvalitet:', {
            fontSize: '14px', color: '#8866ff', fontFamily: 'monospace'
        }).setOrigin(0.5));
        y += 22;

        const refined = hero.refinedElements || {};
        const refEntries = Object.entries(refined).filter(([, v]) => v > 0);
        if (refEntries.length > 0) {
            let rx = startX;
            for (const [id, count] of refEntries) {
                const recipe = REFINING_RECIPES.find(r => r.id === id);
                const col = recipe ? '#' + recipe.color.toString(16).padStart(6, '0') : '#8866ff';
                const badge = _d(scene, scene.add.text(rx, y, `${recipe ? recipe.name : id}: ${count}`, {
                    fontSize: '13px', color: col, fontFamily: 'monospace',
                    backgroundColor: '#0a0818', padding: { x: 3, y: 1 }
                }));
                rx += badge.width + 8;
                if (rx > startX + colW - 50) { rx = startX; y += 20; }
            }
            y += 22;
        }

        if (typeof REFINING_RECIPES === 'undefined') { scene._contentEndY = y; return; }
        const rowStep = 44;

        REFINING_RECIPES.forEach((recipe, idx) => {
            const baseY = y + idx * rowStep;
            const ry = baseY - scrollOff;
            if (ry > visBot || ry < scene.contentY - rowStep) return;

            const check = scene.smelter.canRefine(recipe.id, hero, fuel);
            const col = check.canRefine ? 0x8866ff : 0x332244;
            const hexCol = '#' + col.toString(16).padStart(6, '0');

            const bg = _d(scene, scene.add.graphics());
            bg.fillStyle(col, 0.08);
            bg.fillRoundedRect(startX, ry, colW, 38, 4);
            bg.lineStyle(1, col, 0.3);
            bg.strokeRoundedRect(startX, ry, colW, 38, 4);

            _d(scene, scene.add.text(startX + 8, ry + 4, recipe.name, {
                fontSize: '15px', color: hexCol, fontFamily: 'monospace', fontStyle: 'bold'
            }));
            const inputStr = recipe.input.map(i => {
                const have = hero.elementTracker.getCount(i.symbol);
                return `${i.symbol}:${have}/${i.amount}`;
            }).join('  ');
            _d(scene, scene.add.text(startX + 8, ry + 22, `${inputStr}  |  ${check.energyCost} energi`, {
                fontSize: '13px', color: '#665588', fontFamily: 'monospace'
            }));

            if (check.canRefine) {
                const btn = _d(scene, scene.add.text(startX + colW - 70, ry + 10, '[ Raffiner ]', {
                    fontSize: '14px', color: '#8866ff', fontFamily: 'monospace', fontStyle: 'bold'
                }).setInteractive({ useHandCursor: true }));
                UIHelper.attachHover(btn, { hoverColor: '#aa88ff', normalColor: '#8866ff' });
                btn.on('pointerdown', () => {
                    const result = scene.smelter.refine(recipe.id, hero);
                    if (result.success) {
                        scene.smelter.consumeFuel(hero, result.energyCost);
                        EventBus.emit('floatingText', { gx: hero.gridX, gy: hero.gridY, msg: `Raffinert: ${recipe.name}`, color: '#8866ff' });
                        Audio.playPickup();
                        scene._refresh();
                    }
                });
            }
        });
        scene._contentEndY = y + REFINING_RECIPES.length * rowStep;
    }
}

// ════════════════════════════════════════════════════════════════════════════
// SEMI TAB
// ════════════════════════════════════════════════════════════════════════════

class SemiTabRenderer {
    static draw(scene) {
        const hero = scene.heroRef;
        const cx = scene.px + scene.panelW / 2;
        let y = scene.contentY;
        const scrollOff = scene._scrollOffsets.semi || 0;
        const visBot = scene.py + scene.panelH - 40;
        const fuel = scene.smelter.calculateFuelEnergy(hero);
        const colW = Math.min(560, scene.panelW - 40);
        const startX = scene.px + 20;

        _d(scene, scene.add.text(cx, y, 'Lag halvledermateriale fra raffinerte deler:', {
            fontSize: '14px', color: '#8866ff', fontFamily: 'monospace'
        }).setOrigin(0.5));
        y += 22;

        const semiInv = hero.alloyInventory || {};
        const semiEntries = Object.entries(semiInv).filter(([id, v]) =>
            v > 0 && SEMICONDUCTOR_DEFS && SEMICONDUCTOR_DEFS[id]
        );
        if (semiEntries.length > 0) {
            let rx = startX;
            for (const [id, count] of semiEntries) {
                const def = SEMICONDUCTOR_DEFS[id];
                const col = '#' + (def.color || 0x8866ff).toString(16).padStart(6, '0');
                const badge = _d(scene, scene.add.text(rx, y, `${def.name}: ${count}`, {
                    fontSize: '13px', color: col, fontFamily: 'monospace',
                    backgroundColor: '#0a0818', padding: { x: 3, y: 1 }
                }));
                rx += badge.width + 8;
                if (rx > startX + colW - 50) { rx = startX; y += 20; }
            }
            y += 22;
        }

        if (typeof SEMICONDUCTOR_DEFS === 'undefined') { scene._contentEndY = y; return; }
        const semis = Object.values(SEMICONDUCTOR_DEFS);
        const rowStep = 56;

        semis.forEach((semi, idx) => {
            const baseY = y + idx * rowStep;
            const ry = baseY - scrollOff;
            if (ry > visBot || ry < scene.contentY - rowStep) return;

            const check = scene.smelter.canCraftSemiconductor(semi.id, hero, fuel);
            const col = check.canCraft ? 0x8866ff : 0x332244;
            const hexCol = '#' + col.toString(16).padStart(6, '0');

            const bg = _d(scene, scene.add.graphics());
            bg.fillStyle(col, 0.08);
            bg.fillRoundedRect(startX, ry, colW, 50, 4);
            bg.lineStyle(1, col, 0.3);
            bg.strokeRoundedRect(startX, ry, colW, 50, 4);

            _d(scene, scene.add.text(startX + 8, ry + 4, `${semi.name} (T${semi.tier})`, {
                fontSize: '15px', color: hexCol, fontFamily: 'monospace', fontStyle: 'bold'
            }));

            const inputStr = semi.recipe.map(ing => {
                if (ing.refined) {
                    const r = REFINING_RECIPES.find(rec => rec.id === ing.refined);
                    const have = (hero.refinedElements || {})[ing.refined] || 0;
                    return `${r ? r.name : ing.refined}:${have}/${ing.amount}`;
                }
                const have = hero.elementTracker.getCount(ing.symbol);
                return `${ing.symbol}:${have}/${ing.amount}`;
            }).join('  ');
            _d(scene, scene.add.text(startX + 8, ry + 22, inputStr, {
                fontSize: '12px', color: '#665588', fontFamily: 'monospace',
                wordWrap: { width: colW - 100 }
            }));
            _d(scene, scene.add.text(startX + 8, ry + 36, `${check.energyCost} energi`, {
                fontSize: '12px', color: '#554477', fontFamily: 'monospace'
            }));

            if (check.canCraft) {
                const btn = _d(scene, scene.add.text(startX + colW - 70, ry + 16, '[ Lag ]', {
                    fontSize: '14px', color: '#8866ff', fontFamily: 'monospace', fontStyle: 'bold'
                }).setInteractive({ useHandCursor: true }));
                UIHelper.attachHover(btn, { hoverColor: '#aa88ff', normalColor: '#8866ff' });
                btn.on('pointerdown', () => {
                    const result = scene.smelter.craftSemiconductor(semi.id, hero);
                    if (result.success) {
                        scene.smelter.consumeFuel(hero, result.energyCost);
                        EventBus.emit('floatingText', { gx: hero.gridX, gy: hero.gridY, msg: `Laget: ${semi.name}`, color: '#8866ff' });
                        Audio.playPickup();
                        scene._refresh();
                    }
                });
            }
        });
        scene._contentEndY = y + semis.length * rowStep;
    }
}

// ════════════════════════════════════════════════════════════════════════════
// TECH TAB
// ════════════════════════════════════════════════════════════════════════════

class TechTabRenderer {
    static draw(scene) {
        const hero = scene.heroRef;
        const cx = scene.px + scene.panelW / 2;
        let y = scene.contentY;
        const scrollOff = scene._scrollOffsets.tech || 0;
        const visBot = scene.py + scene.panelH - 40;
        const colW = Math.min(560, scene.panelW - 40);
        const startX = scene.px + 20;

        _d(scene, scene.add.text(cx, y, 'Installer teknologi fra halvledere:', {
            fontSize: '14px', color: '#8866ff', fontFamily: 'monospace'
        }).setOrigin(0.5));
        y += 22;

        if (typeof TECH_UPGRADES === 'undefined') { scene._contentEndY = y; return; }
        const techs = Object.values(TECH_UPGRADES);
        const rowStep = 52;

        techs.forEach((tech, idx) => {
            const baseY = y + idx * rowStep;
            const ty = baseY - scrollOff;
            if (ty > visBot || ty < scene.contentY - rowStep) return;

            const installed = !!hero[tech.heroFlag];
            const canInstall = !installed && scene.smelter.canInstallTech(tech.id, hero);
            const col = installed ? 0x336633 : (canInstall ? 0x8866ff : 0x332244);
            const hexCol = '#' + col.toString(16).padStart(6, '0');

            const bg = _d(scene, scene.add.graphics());
            bg.fillStyle(col, installed ? 0.12 : 0.08);
            bg.fillRoundedRect(startX, ty, colW, 46, 4);
            bg.lineStyle(1, col, 0.3);
            bg.strokeRoundedRect(startX, ty, colW, 46, 4);

            const checkMark = installed ? ' ✓' : '';
            _d(scene, scene.add.text(startX + 8, ty + 4, `${tech.name}${checkMark}`, {
                fontSize: '15px', color: hexCol, fontFamily: 'monospace', fontStyle: 'bold'
            }));
            _d(scene, scene.add.text(startX + 8, ty + 22, tech.desc, {
                fontSize: '12px', color: '#665588', fontFamily: 'monospace',
                wordWrap: { width: colW - 120 }
            }));

            const semiName = SEMICONDUCTOR_DEFS[tech.semiId] ? SEMICONDUCTOR_DEFS[tech.semiId].name : tech.semiId;
            const have = (hero.alloyInventory || {})[tech.semiId] || 0;
            _d(scene, scene.add.text(startX + 8, ty + 34, `Krever: ${semiName} (${have}/${tech.amount})`, {
                fontSize: '11px', color: '#554477', fontFamily: 'monospace'
            }));

            if (canInstall) {
                const btn = _d(scene, scene.add.text(startX + colW - 80, ty + 12, '[ Installer ]', {
                    fontSize: '14px', color: '#8866ff', fontFamily: 'monospace', fontStyle: 'bold'
                }).setInteractive({ useHandCursor: true }));
                UIHelper.attachHover(btn, { hoverColor: '#aa88ff', normalColor: '#8866ff' });
                btn.on('pointerdown', () => {
                    if (scene.smelter.installTech(tech.id, hero)) {
                        EventBus.emit('floatingText', { gx: hero.gridX, gy: hero.gridY, msg: `Installert: ${tech.name}!`, color: '#8866ff' });
                        Audio.playPickup();
                        scene._refresh();
                    }
                });
            }
        });
        scene._contentEndY = y + techs.length * rowStep;
    }
}
