// ─── Labyrint Hero 2 – Decorations ───────────────────────────────────────────
// Low-poly trees (wood fuel source), boulders, the smelter, the lab table and
// portal arches. All procedural geometry, no assets.

const Decorations = {
    /** Stone arch with a glowing "doorway" – cave entrances and exits. */
    buildPortal(pos, glowColor, labelName) {
        const group = new THREE.Group();
        group.position.set(pos.x, pos.y, pos.z);

        const stone = new THREE.MeshLambertMaterial({ color: 0x6a655c, flatShading: true });
        const pillarL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 4.4, 0.9), stone);
        pillarL.position.set(-1.5, 2.2, 0);
        const pillarR = pillarL.clone();
        pillarR.position.x = 1.5;
        const lintel = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.9, 1.1), stone);
        lintel.position.y = 4.6;

        const doorway = new THREE.Mesh(
            new THREE.PlaneGeometry(2.3, 3.9),
            new THREE.MeshBasicMaterial({ color: glowColor, transparent: true, opacity: 0.55, side: THREE.DoubleSide }),
        );
        doorway.position.y = 2.0;

        group.add(pillarL, pillarR, lintel, doorway);
        return group;
    },

    /** Trunk + cone canopy. Interactable: chop for wood fuel. */
    addTrees(area, rand, count, onChop) {
        const trunkMat = new THREE.MeshLambertMaterial({ color: 0x6a4a2a, flatShading: true });
        const leafMat = new THREE.MeshLambertMaterial({ color: 0x2e6b34, flatShading: true });

        for (let i = 0; i < count; i++) {
            const spot = area.findSpot(rand, { minH: 1.5, maxH: 12, maxSlope: 0.6 });
            if (!spot) continue;

            const tree = new THREE.Group();
            tree.position.set(spot.x, spot.y, spot.z);
            const h = 2.2 + rand() * 1.5;
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, h, 6), trunkMat);
            trunk.position.y = h / 2;
            const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.5 + rand() * 0.6, 3 + rand() * 1.2, 7), leafMat);
            canopy.position.y = h + 1.2;
            tree.add(trunk, canopy);
            area.group.add(tree);

            area.interactables.push({
                type: 'tree',
                pos: spot,
                getLabel: () => 'Hogg ved (+2 Tre)',
                isActive: () => true,
                onInteract: () => onChop(tree),
            });
        }
    },

    /** Small bushes and tufts – pure detail, no interaction. */
    addBushes(area, rand, count) {
        const mats = [
            new THREE.MeshLambertMaterial({ color: 0x3a7a3e, flatShading: true }),
            new THREE.MeshLambertMaterial({ color: 0x4f8a3a, flatShading: true }),
            new THREE.MeshLambertMaterial({ color: 0x6a8a3a, flatShading: true }),
        ];
        for (let i = 0; i < count; i++) {
            const spot = area.findSpot(rand, { minH: 1.2, maxH: 14, maxSlope: 0.7 });
            if (!spot) continue;
            const bush = new THREE.Mesh(
                new THREE.IcosahedronGeometry(0.35 + rand() * 0.45, 0),
                mats[Math.floor(rand() * mats.length)],
            );
            bush.position.set(spot.x, spot.y + 0.2, spot.z);
            bush.scale.y = 0.7;
            bush.rotation.y = rand() * 3;
            area.group.add(bush);
        }
    },

    /** Small flowers – colored heads on thin stems. */
    addFlowers(area, rand, count) {
        const colors = [0xee4466, 0xeecc33, 0xcc66ee, 0xff8844, 0xffffff];
        const stemMat = new THREE.MeshLambertMaterial({ color: 0x3a7a3e });
        for (let i = 0; i < count; i++) {
            const spot = area.findSpot(rand, { minH: 1.5, maxH: 11, maxSlope: 0.5 });
            if (!spot) continue;
            const flower = new THREE.Group();
            flower.position.set(spot.x, spot.y, spot.z);
            const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.5, 4), stemMat);
            stem.position.y = 0.25;
            const head = new THREE.Mesh(
                new THREE.IcosahedronGeometry(0.12, 0),
                new THREE.MeshLambertMaterial({ color: colors[Math.floor(rand() * colors.length)], flatShading: true }),
            );
            head.position.y = 0.55;
            flower.add(stem, head);
            area.group.add(flower);
        }
    },

    /** Decorative boulders. */
    addBoulders(area, rand, count) {
        const mat = new THREE.MeshLambertMaterial({ color: 0x77726a, flatShading: true });
        for (let i = 0; i < count; i++) {
            const spot = area.findSpot(rand, { minH: 1, maxSlope: 1.2 });
            if (!spot) continue;
            const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5 + rand() * 1.1, 0), mat);
            rock.position.set(spot.x, spot.y + 0.2, spot.z);
            rock.rotation.set(rand() * 3, rand() * 3, rand() * 3);
            rock.scale.y = 0.6 + rand() * 0.4;
            area.group.add(rock);
        }
    },

    /** Stone smelter with flickering fire near spawn. Returns its position. */
    addSmelter(area, pos, onUse) {
        const group = new THREE.Group();
        group.position.set(pos.x, pos.y, pos.z);

        const stone = new THREE.MeshLambertMaterial({ color: 0x5d5a57, flatShading: true });
        const body = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.4, 2.2, 8), stone);
        body.position.y = 1.1;
        const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 1.6, 6), stone);
        chimney.position.y = 2.9;

        const fire = new THREE.Mesh(
            new THREE.ConeGeometry(0.45, 0.9, 6),
            new THREE.MeshBasicMaterial({ color: 0xff8822 }),
        );
        fire.position.set(0, 0.5, 1.05);

        const light = new THREE.PointLight(0xff7722, 60, 25, 1.8);
        light.position.set(0, 1.5, 1.2);

        group.add(body, chimney, fire, light);
        group.userData.fire = fire;
        group.userData.fireLight = light;
        area.group.add(group);
        area.smelterGroup = group;

        area.interactables.push({
            type: 'smelter',
            pos,
            getLabel: () => 'Smelteri',
            isActive: () => true,
            onInteract: onUse,
        });
    },

    /** Simple lab table (kjemi) next to the smelter. */
    addLabTable(area, pos, onUse) {
        const group = new THREE.Group();
        group.position.set(pos.x, pos.y, pos.z);

        const wood = new THREE.MeshLambertMaterial({ color: 0x7a5a36, flatShading: true });
        const top = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.15, 1.1), wood);
        top.position.y = 1.0;
        const legL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.0, 0.9), wood);
        legL.position.set(-0.9, 0.5, 0);
        const legR = legL.clone();
        legR.position.x = 0.9;

        const flask = new THREE.Mesh(
            new THREE.ConeGeometry(0.22, 0.5, 8),
            new THREE.MeshStandardMaterial({ color: 0x33dd88, emissive: 0x33dd88, emissiveIntensity: 0.5, transparent: true, opacity: 0.85 }),
        );
        flask.position.set(0.4, 1.33, 0);
        const flask2 = new THREE.Mesh(
            new THREE.SphereGeometry(0.18, 8, 6),
            new THREE.MeshStandardMaterial({ color: 0x4488ff, emissive: 0x4488ff, emissiveIntensity: 0.5, transparent: true, opacity: 0.85 }),
        );
        flask2.position.set(-0.4, 1.26, 0.1);

        group.add(top, legL, legR, flask, flask2);
        area.group.add(group);

        area.interactables.push({
            type: 'labtable',
            pos,
            getLabel: () => 'Kjemibord',
            isActive: () => true,
            onInteract: onUse,
        });
    },

    /** Merchant NPC with a small market stall by the camp. */
    addMerchant(area, pos, onUse) {
        const group = new THREE.Group();
        group.position.set(pos.x, pos.y, pos.z);

        const mat = (hex) => new THREE.MeshLambertMaterial({ color: hex, flatShading: true });
        const box = (w, h, d, color, x, y, z) => {
            const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
            m.position.set(x, y, z);
            m.castShadow = true;
            return m;
        };

        // Figure: purple robe + hat
        const robe = box(0.75, 1.1, 0.5, 0x6a3d8f, 0, 0.95, 0);
        const head = box(0.45, 0.45, 0.42, 0xd9a878, 0, 1.75, 0);
        const hatBrim = box(0.7, 0.08, 0.7, 0x4a2a66, 0, 2.0, 0);
        const hatTop = box(0.34, 0.4, 0.34, 0x4a2a66, 0, 2.22, 0);

        // Stall: counter + striped awning
        const counter = box(2.4, 0.8, 0.9, 0x7a5a36, 0, 0.4, 1.3);
        const poleL = box(0.1, 2.2, 0.1, 0x5a4226, -1.1, 1.1, 1.7);
        const poleR = box(0.1, 2.2, 0.1, 0x5a4226, 1.1, 1.1, 1.7);
        const awning = box(2.6, 0.08, 1.3, 0xcc4444, 0, 2.25, 1.35);
        const awning2 = box(2.6, 0.1, 0.4, 0xeeeedd, 0, 2.26, 1.0);

        group.add(robe, head, hatBrim, hatTop, counter, poleL, poleR, awning, awning2);
        area.group.add(group);

        area.interactables.push({
            type: 'merchant',
            pos,
            getLabel: () => 'Handelsmann',
            isActive: () => true,
            onInteract: onUse,
        });
    },

    /** Drifting low-poly clouds above the island. */
    addClouds(area, rand, count) {
        area.clouds = [];
        const mat = new THREE.MeshLambertMaterial({
            color: 0xffffff, transparent: true, opacity: 0.85, flatShading: true,
        });
        for (let i = 0; i < count; i++) {
            const cloud = new THREE.Group();
            const blobs = 2 + Math.floor(rand() * 3);
            for (let b = 0; b < blobs; b++) {
                const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(3 + rand() * 4, 0), mat);
                blob.position.set((rand() - 0.5) * 9, (rand() - 0.5) * 1.5, (rand() - 0.5) * 5);
                blob.scale.y = 0.45;
                cloud.add(blob);
            }
            cloud.position.set(
                (rand() - 0.5) * LH2.WORLD_SIZE * 1.2,
                55 + rand() * 25,
                (rand() - 0.5) * LH2.WORLD_SIZE * 1.2,
            );
            cloud.userData.speed = 1.2 + rand() * 1.6;
            area.group.add(cloud);
            area.clouds.push(cloud);
        }
    },

    /** Animate smelter fire flicker + cloud drift. */
    update(area, time, dt) {
        if (area.clouds) {
            const limit = LH2.WORLD_SIZE * 0.7;
            for (const cloud of area.clouds) {
                cloud.position.x += cloud.userData.speed * (dt || 0.016);
                if (cloud.position.x > limit) cloud.position.x = -limit;
            }
        }
        if (area.smelterGroup) {
            const f = area.smelterGroup.userData.fire;
            const l = area.smelterGroup.userData.fireLight;
            const flicker = 0.85 + 0.3 * Math.sin(time * 0.013) * Math.sin(time * 0.007 + 1.3);
            f.scale.set(flicker, 0.8 + 0.4 * Math.abs(Math.sin(time * 0.009)), flicker);
            l.intensity = 50 + 25 * flicker;
        }
    },
};
