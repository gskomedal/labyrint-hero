// ─── Labyrint Hero 2 – Ore deposits ──────────────────────────────────────────
// Procedural crystal/rock nodes placed per area, colored by mineral def.
// Mineral choice follows the area's tier (with a chance of tier+1 in caves),
// preserving LH1's depth→tier principle. Node ids are deterministic so
// depletion state can be saved.

const OreDeposits = {
    /** All minerals of a given tier (ores and crystals alike). */
    _mineralsOfTier(tier) {
        return Object.values(MINERAL_DEFS).filter(m => m.tier === tier);
    },

    /**
     * Populate an area with ore nodes (and some coal in caves).
     * @param {object} area  area record (group, getHeightAt, interactables, nodes)
     * @param {function} rand seeded PRNG
     * @param {number} count number of nodes
     */
    populate(area, rand, count) {
        const tier = area.tier;
        const pool = this._mineralsOfTier(tier);
        const poolUp = this._mineralsOfTier(Math.min(6, tier + 1));

        for (let i = 0; i < count; i++) {
            const spot = area.findSpot(rand, { maxSlope: 0.9 });
            if (!spot) continue;

            let def;
            const isCave = area.id !== 'surface';
            if (isCave && rand() < 0.15) {
                // Coal seams underground keep the smelter running
                def = FUEL_DEFS.coal;
            } else if (isCave && poolUp.length > 0 && rand() < 0.2) {
                def = poolUp[Math.floor(rand() * poolUp.length)];
            } else {
                def = pool[Math.floor(rand() * pool.length)];
            }
            if (!def) continue;

            this.addNode(area, `${area.id}:${i}`, def, spot, rand);
        }
    },

    /** Maze rewards: better minerals (tier+1) at given spots. */
    populateAt(area, spots, rand, idPrefix) {
        const pool = this._mineralsOfTier(Math.min(6, area.tier + 1));
        spots.forEach((spot, i) => {
            const def = pool[Math.floor(rand() * pool.length)];
            if (def) this.addNode(area, `${idPrefix}:${i}`, def, spot, rand);
        });
    },

    /** One mineral/fuel node with mesh + interactable. */
    addNode(area, id, def, spot, rand) {
        const node = {
            id,
            itemId: def.id,
            isFuel: def.type === 'fuel',
            pos: spot,
            maxCharges: 2 + Math.floor(rand() * 3), // 2–4
            charges: 0, // set below
            respawnAt: 0,
            mesh: this._buildMesh(def, spot, rand),
        };
        node.charges = node.maxCharges;

        area.group.add(node.mesh);
        area.nodes.push(node);

        area.interactables.push({
            type: node.isFuel ? 'fuel-node' : 'ore',
            pos: spot,
            node,
            getLabel: () => LH2Mining.nodeLabel(node),
            isActive: () => node.charges > 0,
            onInteract: () => LH2Mining.mineNode(node),
        });
        return node;
    },

    /**
     * Rare direct element sources, like LH1's gas pockets and native gold:
     * at most one gas vent and one native nugget per deep zone. Everything
     * else must be smelted from minerals.
     */
    addElementNodes(area, rand) {
        const gases = LH2.GAS_BY_TIER[area.tier] || [];
        const natives = LH2.NATIVE_BY_TIER[area.tier] || [];

        if (gases.length > 0 && rand() < 0.7) {
            const spot = area.findSpot(rand, { maxSlope: 0.6 });
            if (spot) {
                const symbol = gases[Math.floor(rand() * gases.length)];
                this._addElementNode(area, `${area.id}:gas:0`, symbol, spot, rand, true);
            }
        }
        if (natives.length > 0 && rand() < 0.6) {
            const spot = area.findSpot(rand, { maxSlope: 0.8 });
            if (spot) {
                const symbol = natives[Math.floor(rand() * natives.length)];
                this._addElementNode(area, `${area.id}:nat:0`, symbol, spot, rand, false);
            }
        }
    },

    _addElementNode(area, id, symbol, spot, rand, isGas) {
        const elem = ELEMENTS[symbol];
        const node = {
            id,
            itemId: symbol,
            isElement: true,
            isGas,
            pos: spot,
            maxCharges: isGas ? 3 : 2,
            charges: 0,
            respawnAt: 0,
            mesh: isGas ? this._buildGasVent(elem, spot) : this._buildNugget(elem, spot, rand),
        };
        node.charges = node.maxCharges;

        area.group.add(node.mesh);
        area.nodes.push(node);

        area.interactables.push({
            type: 'element',
            pos: spot,
            node,
            getLabel: () => LH2Mining.nodeLabel(node),
            isActive: () => node.charges > 0,
            onInteract: () => LH2Mining.mineNode(node),
        });
    },

    /** Fumarole: rock rim + glowing translucent gas plume. */
    _buildGasVent(elem, spot) {
        const group = new THREE.Group();
        group.position.set(spot.x, spot.y, spot.z);

        const rim = new THREE.Mesh(
            new THREE.CylinderGeometry(0.9, 1.2, 0.5, 7),
            new THREE.MeshLambertMaterial({ color: 0x4a4742, flatShading: true }),
        );
        rim.position.y = 0.2;

        const plumeMat = new THREE.MeshStandardMaterial({
            color: elem.color, emissive: elem.color, emissiveIntensity: 0.7,
            transparent: true, opacity: 0.45, flatShading: true,
        });
        const plume = new THREE.Mesh(new THREE.ConeGeometry(0.5, 2.2, 6), plumeMat);
        plume.position.y = 1.4;

        group.add(rim, plume);
        group.userData.shardMat = plumeMat;
        group.userData.plume = plume;
        return group;
    },

    /** Shiny metallic chunk for native elements (gold, silver, sulfur...). */
    _buildNugget(elem, spot, rand) {
        const group = new THREE.Group();
        group.position.set(spot.x, spot.y, spot.z);

        const mat = new THREE.MeshStandardMaterial({
            color: elem.color, emissive: elem.color, emissiveIntensity: 0.25,
            metalness: 0.7, roughness: 0.35, flatShading: true,
        });
        for (let i = 0; i < 3; i++) {
            const chunk = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3 + rand() * 0.25, 0), mat);
            chunk.position.set((rand() - 0.5) * 0.9, 0.3 + rand() * 0.3, (rand() - 0.5) * 0.9);
            chunk.rotation.set(rand() * 3, rand() * 3, rand() * 3);
            group.add(chunk);
        }
        group.userData.shardMat = mat;
        return group;
    },

    /** Cluster of 3–5 crystal shards on a rock base, colored per def. */
    _buildMesh(def, spot, rand) {
        const group = new THREE.Group();
        group.position.set(spot.x, spot.y, spot.z);

        const base = new THREE.Mesh(
            new THREE.IcosahedronGeometry(0.85, 0),
            new THREE.MeshLambertMaterial({ color: 0x55524e, flatShading: true }),
        );
        base.position.y = 0.25;
        base.scale.y = 0.55;
        group.add(base);

        const shardMat = new THREE.MeshStandardMaterial({
            color: def.color,
            emissive: def.color,
            emissiveIntensity: 0.18,
            flatShading: true,
            roughness: 0.4,
        });

        const shards = 3 + Math.floor(rand() * 3);
        for (let s = 0; s < shards; s++) {
            const h = 0.6 + rand() * 0.9;
            const shard = new THREE.Mesh(new THREE.ConeGeometry(0.22 + rand() * 0.15, h, 5), shardMat);
            const ang = rand() * Math.PI * 2;
            const r = rand() * 0.5;
            shard.position.set(Math.cos(ang) * r, 0.4 + h / 2 - 0.2, Math.sin(ang) * r);
            shard.rotation.set((rand() - 0.5) * 0.5, rand() * Math.PI, (rand() - 0.5) * 0.5);
            group.add(shard);
        }

        group.userData.shardMat = shardMat;
        return group;
    },

    /** Visual state for depleted/respawned nodes. */
    setDepleted(node, depleted) {
        const mat = node.mesh.userData.shardMat;
        if (depleted) {
            node.mesh.scale.setScalar(0.55);
            mat.emissiveIntensity = 0;
            mat.color.setHex(0x4a4a4a);
        } else {
            node.mesh.scale.setScalar(1);
            const def = node.isElement
                ? ELEMENTS[node.itemId]
                : (MINERAL_DEFS[node.itemId] || FUEL_DEFS[node.itemId]);
            mat.color.setHex(def.color);
            mat.emissive.setHex(def.color);
            mat.emissiveIntensity = node.isGas ? 0.7 : (node.isElement ? 0.25 : 0.18);
        }
    },

    /** Tick respawns + geologi-3 highlight pulse. Called every frame. */
    update(area, sciences, playerPos, time) {
        const now = Date.now();
        for (const node of area.nodes) {
            if (node.charges <= 0 && node.respawnAt > 0 && now >= node.respawnAt) {
                node.charges = node.maxCharges;
                node.respawnAt = 0;
                this.setDepleted(node, false);
            }

            // "Malmøye": pulse nearby deposits (skill or geologi >= 3)
            const highlight = sciences.hasOreHighlight()
                || (typeof LH2Main !== 'undefined' && LH2Main.hero && LH2Main.hero.oreMapSkill);
            if (node.charges > 0 && !node.isElement && highlight) {
                const dx = node.pos.x - playerPos.x;
                const dz = node.pos.z - playerPos.z;
                if (dx * dx + dz * dz < 25 * 25) {
                    node.mesh.userData.shardMat.emissiveIntensity =
                        0.25 + 0.2 * Math.sin(time * 0.004 + node.pos.x);
                }
            }
        }
    },
};
