// ─── Labyrint Hero 2 – Character model ───────────────────────────────────────
// Builds a detailed low-poly humanoid from an LH1 appearance object
// (skinColor, hairColor, clothColor, eyeColor, clothStyle, hairStyle,
// beardStyle, gender) + race. Shared by the in-world Player and the 3D
// character creator preview, so they always match.
//
// Returns { group, parts: { head, armL, armR, legL, legR, pickaxe, cloak } }
// where the limbs are PIVOT groups (rotate about the shoulder/hip) for
// walk/mine animation.

const CharacterModel = {
    build(appearance, race) {
        const a = appearance || {};
        const SKIN = a.skinColor !== undefined ? a.skinColor : 0xffd5a0;
        const CLOTH = a.clothColor !== undefined ? a.clothColor : 0x1a3a88;
        const HAIR = a.hairColor !== undefined ? a.hairColor : 0x4a2008;
        const EYE = a.eyeColor !== undefined ? a.eyeColor : 0x1a1028;
        const female = a.gender === 'female';
        const clothStyle = a.clothStyle || 'tunic';
        const hairStyle = a.hairStyle || 'short';
        const beardStyle = a.beardStyle || 'none';

        const cloth = new THREE.Color(CLOTH);
        const clothDark = cloth.clone().multiplyScalar(0.6).getHex();
        const clothLight = cloth.clone().lerp(new THREE.Color(0xffffff), 0.18).getHex();
        const skin = new THREE.Color(SKIN);
        const skinDark = skin.clone().multiplyScalar(0.82).getHex();
        const BOOT = 0x3a2a1a, BELT = 0x2a1c10, BUCKLE = 0xc9a227;

        const lambert = (hex, opts = {}) => new THREE.MeshLambertMaterial({
            color: hex, flatShading: true, ...opts,
        });

        const group = new THREE.Group();
        const parts = {};

        const addMesh = (parent, geo, mat, x, y, z) => {
            const m = new THREE.Mesh(geo, mat);
            m.position.set(x, y, z);
            m.castShadow = true;
            parent.add(m);
            return m;
        };
        // Tapered limb/torso segment (low-poly cylinder)
        const capsuleGeo = (rTop, rBot, h, seg = 7) => new THREE.CylinderGeometry(rTop, rBot, h, seg);

        const skinMat = lambert(SKIN);
        const clothMat = lambert(CLOTH);
        const clothDarkMat = lambert(clothDark);
        const hairMat = lambert(HAIR);
        const bootMat = lambert(BOOT);

        // ── Torso ──────────────────────────────────────────────────────────
        const shoulderW = female ? 0.62 : 0.74;
        const torso = new THREE.Group();
        torso.position.y = 1.28;
        group.add(torso);

        // Chest: tapered box-ish cylinder (8-sided reads as a soft torso)
        const chest = addMesh(torso, capsuleGeo(shoulderW * 0.62, shoulderW * 0.5, 0.62, 8), clothMat, 0, 0.12, 0);
        chest.scale.z = 0.62;
        // Hips/pelvis
        const pelvis = addMesh(torso, capsuleGeo(shoulderW * 0.5, shoulderW * 0.44, 0.34, 8),
            clothStyle === 'vest' ? lambert(0x3a3024) : clothMat, 0, -0.32, 0);
        pelvis.scale.z = 0.6;

        // Cloth style flourishes
        if (clothStyle === 'robe' || clothStyle === 'cloak') {
            // Long skirt of the robe
            const skirt = addMesh(torso, capsuleGeo(shoulderW * 0.46, shoulderW * 0.72, 0.7, 8),
                clothStyle === 'cloak' ? clothMat : lambert(clothDark), 0, -0.78, 0);
            skirt.scale.z = 0.7;
            parts.skirt = skirt;
        }
        if (clothStyle === 'vest') {
            // Bare-armed look: shoulders show skin; add a vest front panel
            addMesh(torso, new THREE.BoxGeometry(shoulderW * 0.7, 0.5, 0.1), lambert(clothLight), 0, 0.14, 0.3 * 0.62);
        }
        // Belt
        const belt = addMesh(torso, capsuleGeo(shoulderW * 0.52, shoulderW * 0.52, 0.12, 8), lambert(BELT), 0, -0.16, 0);
        belt.scale.z = 0.62;
        addMesh(torso, new THREE.BoxGeometry(0.14, 0.12, 0.06), lambert(BUCKLE), 0, -0.16, shoulderW * 0.34);

        // Cloak cape on the back
        if (clothStyle === 'cloak') {
            const cape = new THREE.Group();
            cape.position.set(0, 0.28, -0.2);
            const capeMesh = addMesh(cape, capsuleGeo(shoulderW * 0.55, shoulderW * 0.78, 1.25, 6), lambert(clothDark), 0, -0.5, 0);
            capeMesh.scale.z = 0.28;
            torso.add(cape);
            parts.cloak = cape;
        }

        // ── Head + face ────────────────────────────────────────────────────
        const head = new THREE.Group();
        head.position.y = 0.62;
        torso.add(head);
        parts.head = head;

        const skull = addMesh(head, new THREE.IcosahedronGeometry(0.3, 1), skinMat, 0, 0.05, 0);
        skull.scale.set(0.95, 1.05, 0.95);
        // Neck
        addMesh(torso, capsuleGeo(0.12, 0.14, 0.18, 6), skinMat, 0, 0.42, 0);

        // Eyes (whites + colored iris), set into the face (+z)
        const eyeWhiteMat = lambert(0xf4f4ee, { emissive: 0x222222 });
        const irisMat = new THREE.MeshLambertMaterial({ color: EYE, flatShading: true });
        for (const sx of [-0.11, 0.11]) {
            addMesh(head, new THREE.BoxGeometry(0.1, 0.09, 0.04), eyeWhiteMat, sx, 0.04, 0.27);
            addMesh(head, new THREE.BoxGeometry(0.05, 0.06, 0.04), irisMat, sx, 0.04, 0.29);
            // Brow
            addMesh(head, new THREE.BoxGeometry(0.13, 0.03, 0.03), hairMat, sx, 0.13, 0.28);
        }
        // Nose
        addMesh(head, new THREE.BoxGeometry(0.07, 0.12, 0.08), lambert(skinDark), 0, -0.04, 0.3);
        // Mouth
        addMesh(head, new THREE.BoxGeometry(0.14, 0.03, 0.03), lambert(0x8a4a3a), 0, -0.16, 0.28);

        // ── Hair ───────────────────────────────────────────────────────────
        this._buildHair(head, hairStyle, hairMat, addMesh);

        // ── Beard ──────────────────────────────────────────────────────────
        if (beardStyle && beardStyle !== 'none') {
            const beardMat = beardStyle === 'stubble'
                ? new THREE.MeshLambertMaterial({ color: HAIR, transparent: true, opacity: 0.5, flatShading: true })
                : hairMat;
            const bh = beardStyle === 'full' ? 0.34 : beardStyle === 'short' ? 0.2 : 0.12;
            const beard = addMesh(head, new THREE.BoxGeometry(0.34, bh, 0.16), beardMat, 0, -0.16 - bh / 2 + 0.04, 0.2);
            beard.scale.z = 1;
        }

        // ── Limbs (pivot groups so they swing from the joint) ──────────────
        // Arms hang from the shoulders (torso-local y), legs from the group
        // root (world y at the hip) so the feet reach the ground at y≈0.
        const sleeve = clothStyle === 'vest' ? skinMat : clothMat;
        const makeArm = (side) => {
            const pivot = new THREE.Group();
            pivot.position.set(side * shoulderW * 0.62, 0.3, 0); // torso-local shoulder
            addMesh(pivot, capsuleGeo(0.13, 0.11, 0.42, 6), sleeve, 0, -0.21, 0);
            addMesh(pivot, capsuleGeo(0.1, 0.09, 0.4, 6), skinMat, 0, -0.6, 0);
            addMesh(pivot, new THREE.IcosahedronGeometry(0.11, 0), skinMat, 0, -0.83, 0);
            return pivot;
        };
        parts.armL = makeArm(-1);
        parts.armR = makeArm(1);
        torso.add(parts.armL, parts.armR);

        const makeLeg = (side) => {
            const pivot = new THREE.Group();
            pivot.position.set(side * shoulderW * 0.26, 0.95, 0); // world hip height
            addMesh(pivot, capsuleGeo(0.16, 0.13, 0.5, 6), lambert(clothDark), 0, -0.25, 0);
            addMesh(pivot, capsuleGeo(0.12, 0.1, 0.46, 6), lambert(clothDark), 0, -0.7, 0);
            addMesh(pivot, new THREE.BoxGeometry(0.2, 0.18, 0.34), bootMat, 0, -0.93, 0.05);
            return pivot;
        };
        parts.legL = makeLeg(-1);
        parts.legR = makeLeg(1);
        group.add(parts.legL, parts.legR);

        // ── Pickaxe (held in the right hand, hidden until used) ────────────
        const pick = new THREE.Group();
        const handleMat = lambert(0x6a4a2a);
        addMesh(pick, capsuleGeo(0.035, 0.05, 0.95, 5), handleMat, 0, -0.1, 0);
        const headMat = lambert(0x9aa0aa, { emissive: 0x111316 });
        const ph = addMesh(pick, new THREE.BoxGeometry(0.5, 0.12, 0.12), headMat, 0, 0.38, 0);
        ph.rotation.z = 0.15;
        // Pointed ends
        addMesh(pick, new THREE.ConeGeometry(0.08, 0.18, 4), headMat, 0.3, 0.38, 0).rotation.z = -Math.PI / 2;
        pick.position.set(0, -0.83, 0.05);
        pick.rotation.x = -0.4;
        pick.visible = false;
        parts.armR.add(pick);
        parts.pickaxe = pick;

        // ── Race proportions ───────────────────────────────────────────────
        const scales = {
            dwarf: { s: [1.12, 0.82, 1.12], y: 0 },
            elf: { s: [0.94, 1.08, 0.94], y: 0 },
            hobbit: { s: [0.78, 0.72, 0.78], y: 0 },
            human: { s: [1, 1, 1], y: 0 },
        };
        const sc = scales[race] || scales.human;
        group.scale.set(sc.s[0], sc.s[1], sc.s[2]);

        group.userData.parts = parts;
        return { group, parts };
    },

    _buildHair(head, style, hairMat, addMesh) {
        const box = (w, h, d, x, y, z) => addMesh(head, new THREE.BoxGeometry(w, h, d), hairMat, x, y, z);
        switch (style) {
            case 'bald':
                return;
            case 'long':
                box(0.62, 0.2, 0.6, 0, 0.26, 0);          // cap
                box(0.6, 0.55, 0.18, 0, 0.0, -0.22);      // back length
                break;
            case 'mohawk':
                for (let i = 0; i < 5; i++) box(0.1, 0.22 - Math.abs(i - 2) * 0.04, 0.5, 0, 0.32, 0.18 - i * 0.09);
                break;
            case 'ponytail':
                box(0.62, 0.2, 0.6, 0, 0.26, 0);
                addMesh(head, new THREE.CylinderGeometry(0.07, 0.05, 0.5, 5), hairMat, 0, 0.05, -0.32);
                break;
            case 'bun':
                box(0.62, 0.2, 0.6, 0, 0.26, 0);
                addMesh(head, new THREE.IcosahedronGeometry(0.14, 0), hairMat, 0, 0.34, -0.18);
                break;
            case 'braids':
                box(0.62, 0.2, 0.6, 0, 0.26, 0);
                for (const sx of [-0.26, 0.26]) addMesh(head, new THREE.CylinderGeometry(0.05, 0.04, 0.5, 5), hairMat, sx, -0.05, 0.05);
                break;
            case 'curly':
                box(0.6, 0.22, 0.58, 0, 0.28, 0);
                for (const [dx, dz] of [[-0.22, 0.1], [0.22, 0.1], [-0.22, -0.18], [0.22, -0.18], [0, -0.28]])
                    addMesh(head, new THREE.IcosahedronGeometry(0.13, 0), hairMat, dx, 0.22, dz);
                break;
            case 'hood':
                addMesh(head, new THREE.IcosahedronGeometry(0.4, 1), hairMat, 0, 0.06, -0.04).scale.set(1, 1.05, 1.05);
                break;
            case 'side':
                box(0.62, 0.2, 0.6, 0, 0.26, 0);
                box(0.66, 0.34, 0.62, 0.06, 0.14, 0);
                break;
            case 'short':
            default:
                box(0.62, 0.22, 0.62, 0, 0.26, 0);
                box(0.64, 0.34, 0.64, 0, 0.18, -0.02);
                break;
        }
    },
};
