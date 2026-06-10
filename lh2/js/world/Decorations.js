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
                getLabel: () => 'Trykk [E] – Hogg ved (+2 Tre)',
                isActive: () => true,
                onInteract: () => onChop(tree),
            });
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
            getLabel: () => 'Trykk [E] – Smelteri',
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
            getLabel: () => 'Trykk [E] – Kjemibord',
            isActive: () => true,
            onInteract: onUse,
        });
    },

    /** Animate smelter fire flicker. */
    update(area, time) {
        if (area.smelterGroup) {
            const f = area.smelterGroup.userData.fire;
            const l = area.smelterGroup.userData.fireLight;
            const flicker = 0.85 + 0.3 * Math.sin(time * 0.013) * Math.sin(time * 0.007 + 1.3);
            f.scale.set(flicker, 0.8 + 0.4 * Math.abs(Math.sin(time * 0.009)), flicker);
            l.intensity = 50 + 25 * flicker;
        }
    },
};
