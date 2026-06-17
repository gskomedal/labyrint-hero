// ─── Labyrint Hero 2 – Player ────────────────────────────────────────────────
// Detailed low-poly humanoid (built by CharacterModel, shared with the
// character creator) with walk/mine animation, WASD movement relative to the
// camera yaw, gravity + ground snap against the active area.

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
        // Detailed low-poly humanoid shared with the character creator preview
        const built = CharacterModel.build(appearance, race);
        this.body = built.group;
        const p = built.parts;
        this.armL = p.armL;
        this.armR = p.armR;
        this.legL = p.legL;
        this.legR = p.legR;
        this.pickaxe = p.pickaxe;
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
