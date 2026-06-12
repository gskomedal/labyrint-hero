// ─── Labyrint Hero 2 – Player ────────────────────────────────────────────────
// Procedural low-poly figure (boxes) with walk/mine animation, WASD movement
// relative to camera yaw, gravity + ground snap against the active area.

class Player {
    constructor() {
        this.group = new THREE.Group();
        this.vy = 0;
        this.onGround = true;
        this.walkPhase = 0;
        this.moving = false;
        this.mining = false;
        this.swingTimer = 0;

        this._buildBody(null, 'human');

        // Lantern: lights up the tunnels around the hero (off on the surface)
        this.lantern = new THREE.PointLight(0xffcc88, 0, 20, 1.5);
        this.lantern.position.set(0, 2.4, 0);
        this.group.add(this.lantern);
    }

    /** (Re)build the body from the hero's appearance + race – the character
     *  creator's choices show up directly on the 3D figure. */
    applyAppearance(hero) {
        if (this.body) {
            this.group.remove(this.body);
            this.body.traverse(o => { if (o.geometry) o.geometry.dispose(); });
        }
        this._buildBody(hero ? hero.appearance : null, hero ? hero.race : 'human');
    }

    _buildBody(appearance, race) {
        const mat = (hex) => new THREE.MeshLambertMaterial({ color: hex });
        this.body = new THREE.Group();
        const box = (w, h, d, color, x, y, z) => {
            const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
            m.position.set(x, y, z);
            m.castShadow = true;
            return m;
        };

        const a = appearance || {};
        const SKIN = a.skinColor !== undefined ? a.skinColor : 0xd9a878;
        const CLOTH = a.clothColor !== undefined ? a.clothColor : 0x3a6e9e;
        const HAIR = a.hairColor !== undefined ? a.hairColor : 0x4a3220;
        const PANTS = new THREE.Color(CLOTH).multiplyScalar(0.55).getHex();

        this.torso = box(0.7, 0.85, 0.4, CLOTH, 0, 1.25, 0);
        this.head = box(0.5, 0.5, 0.45, SKIN, 0, 1.95, 0);
        const hairH = a.hairStyle === 'long' ? 0.45 : 0.18;
        const hair = box(0.54, hairH, 0.49, HAIR, 0, 2.22 - (hairH - 0.18) / 2 + (a.hairStyle === 'long' ? 0 : 0), 0);
        if (a.hairStyle === 'long') hair.position.z = -0.04;
        let beard = null;
        if (a.beardStyle && a.beardStyle !== 'none') {
            beard = box(0.4, a.beardStyle === 'long' ? 0.45 : 0.22, 0.12, HAIR, 0, 1.66, 0.22);
        }

        // Limbs pivot at the shoulder/hip: mesh offset inside a pivot group
        const limb = (w, h, d, color, px, py, pz) => {
            const pivot = new THREE.Group();
            pivot.position.set(px, py, pz);
            const m = box(w, h, d, color, 0, -h / 2, 0);
            pivot.add(m);
            return pivot;
        };

        this.armL = limb(0.22, 0.75, 0.22, SKIN, -0.47, 1.62, 0);
        this.armR = limb(0.22, 0.75, 0.22, SKIN, 0.47, 1.62, 0);
        this.legL = limb(0.26, 0.85, 0.26, PANTS, -0.2, 0.85, 0);
        this.legR = limb(0.26, 0.85, 0.26, PANTS, 0.2, 0.85, 0);

        // Pickaxe in right hand: handle + head
        const pick = new THREE.Group();
        const handle = box(0.08, 0.7, 0.08, 0x8a6a3a, 0, -0.3, 0);
        const head = box(0.45, 0.1, 0.1, 0x999aa5, 0, -0.62, 0);
        pick.add(handle, head);
        pick.position.set(0, -0.7, 0);
        pick.rotation.z = Math.PI / 2.2;
        this.pickaxe = pick;
        this.pickaxe.visible = false;
        this.armR.add(pick);

        this.body.add(this.torso, this.head, hair, this.armL, this.armR, this.legL, this.legR);
        if (beard) this.body.add(beard);

        // Race proportions: stocky dwarves, slender elves, small hobbits
        const scales = {
            dwarf: [1.15, 0.8, 1.15],
            elf: [0.92, 1.08, 0.92],
            hobbit: [0.8, 0.68, 0.8],
        };
        const s = scales[race];
        if (s) this.body.scale.set(s[0], s[1], s[2]);

        this.group.add(this.body);
    }

    get pos() { return this.group.position; }

    setPosition(x, y, z) {
        this.group.position.set(x, y, z);
        this.vy = 0;
    }

    /**
     * @param {number} dt seconds
     * @param {object} input { forward, back, left, right, sprint, jump }
     * @param {object} area active area with getHeightAt(x, z)
     * @param {number} camYaw camera yaw – FPS-style: also the character heading
     */
    update(dt, input, area, camYaw) {
        const speedMul = (LH2Main.hero && LH2Main.hero.moveSpeedMul) || 1;
        const speed = (input.sprint ? LH2.SPRINT_SPEED : LH2.WALK_SPEED) * speedMul;

        // Movement in camera space: W = where the camera looks, A/D strafe
        let mx = 0, mz = 0;
        if (input.forward) mz -= 1;
        if (input.back) mz += 1;
        if (input.left) mx -= 1;
        if (input.right) mx += 1;

        this.moving = (mx !== 0 || mz !== 0);

        // FPS-style: the character always faces the camera heading
        const fx = -Math.sin(camYaw), fz = -Math.cos(camYaw); // forward
        const rx = -fz, rz = fx;                              // right (strafe)
        this.group.rotation.y = Math.atan2(fx, fz);

        if (this.moving) {
            const len = Math.hypot(mx, mz);
            mx /= len; mz /= len;
            const wx = rx * mx - fx * mz;
            const wz = rz * mx - fz * mz;

            const nx = this.pos.x + wx * speed * dt;
            const nz = this.pos.z + wz * speed * dt;
            const groundHere = area.getHeightAt(this.pos.x, this.pos.z);
            const groundThere = area.getHeightAt(nx, nz);

            // Block walking into the ocean and up cliffs/maze walls
            const walkable = groundThere >= (area.minWalkHeight !== undefined ? area.minWalkHeight : LH2.MIN_WALK_HEIGHT)
                && (groundThere - groundHere) <= LH2.MAX_STEP_HEIGHT;
            if (walkable) {
                this.pos.x = nx;
                this.pos.z = nz;
            } else {
                // Slide along the blocked axis so walls don't feel sticky
                const gx = area.getHeightAt(nx, this.pos.z);
                const gz = area.getHeightAt(this.pos.x, nz);
                if (gx >= (area.minWalkHeight ?? LH2.MIN_WALK_HEIGHT) && gx - groundHere <= LH2.MAX_STEP_HEIGHT) {
                    this.pos.x = nx;
                } else if (gz >= (area.minWalkHeight ?? LH2.MIN_WALK_HEIGHT) && gz - groundHere <= LH2.MAX_STEP_HEIGHT) {
                    this.pos.z = nz;
                }
            }
        }

        // Gravity + ground snap
        const ground = area.getHeightAt(this.pos.x, this.pos.z);
        if (input.jump && this.onGround) {
            this.vy = LH2.JUMP_SPEED;
            this.onGround = false;
        }
        this.vy -= LH2.GRAVITY * dt;
        this.pos.y += this.vy * dt;
        if (this.pos.y <= ground) {
            this.pos.y = ground;
            this.vy = 0;
            this.onGround = true;
        }

        this._animate(dt, input.sprint);
    }

    /** One quick pickaxe swing (LMB with nothing in range). */
    swingOnce() {
        this.swingTimer = 0.35;
    }

    _animate(dt, sprinting) {
        if (this.swingTimer > 0) {
            this.swingTimer -= dt;
            const t = 1 - this.swingTimer / 0.35;
            this.armR.rotation.x = -2.2 + Math.sin(t * Math.PI) * 1.4;
            this.pickaxe.visible = true;
            if (this.swingTimer <= 0) this.pickaxe.visible = false;
            return;
        }
        if (this.mining) {
            // Pickaxe swing: fast arc on the right arm
            this.walkPhase += dt * 9;
            this.armR.rotation.x = -1.6 + Math.sin(this.walkPhase) * 0.9;
            this.armL.rotation.x = 0;
            this.legL.rotation.x = 0;
            this.legR.rotation.x = 0;
            this.pickaxe.visible = true;
            return;
        }
        this.pickaxe.visible = false;

        if (this.moving) {
            this.walkPhase += dt * (sprinting ? 11 : 7);
            const swing = Math.sin(this.walkPhase) * 0.6;
            this.armL.rotation.x = swing;
            this.armR.rotation.x = -swing;
            this.legL.rotation.x = -swing;
            this.legR.rotation.x = swing;
        } else {
            // Ease limbs back to rest
            for (const limb of [this.armL, this.armR, this.legL, this.legR]) {
                limb.rotation.x *= Math.max(0, 1 - dt * 10);
            }
        }
    }
}
