// ─── Labyrint Hero 2 – Pet companion ─────────────────────────────────────────
// A lightweight 3D follower built from LH1's PET_TYPES data (fox/cat/dragon/
// owl). It trots after the hero, attacks nearby monsters and can take a hit
// (respawns at the hero after a short cooldown). Persisted as { typeId } only;
// stats come from PET_TYPES + the hero's Villmarksjeger bonuses.

const LH2_PET_TYPES = (typeof PET_TYPES !== 'undefined') ? PET_TYPES : {
    fox:    { name: 'Rev',   color: 0xff8833, attack: 1, maxHp: 14 },
    cat:    { name: 'Katt',  color: 0xccaa66, attack: 1, maxHp: 12 },
    dragon: { name: 'Drage', color: 0xff4466, attack: 2, maxHp: 18 },
    owl:    { name: 'Ugle',  color: 0x88aacc, attack: 1, maxHp: 12 },
};

class Pet {
    constructor(typeId, hero) {
        this.typeId = typeId;
        this.hero = hero;
        const def = LH2_PET_TYPES[typeId] || LH2_PET_TYPES.fox;
        this.name = def.name;
        this.color = def.color;
        this.baseAttack = def.attack;
        this.maxHp = def.maxHp;
        this.hp = def.maxHp;
        this.flying = (typeId === 'owl' || typeId === 'dragon');

        this.group = new THREE.Group();
        this._build(def);
        this.attackAt = 0;
        this.downUntil = 0;     // knocked out until this timestamp
        this.walkPhase = 0;
    }

    get attack() {
        return this.baseAttack + (this.hero.petBonusAtk || 0);
    }
    get effectiveMaxHp() {
        return this.maxHp + (this.hero.petBonusHp || 0);
    }

    _build(def) {
        const mat = (hex) => new THREE.MeshLambertMaterial({ color: hex, flatShading: true });
        const box = (w, h, d, color, x, y, z) => {
            const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
            m.position.set(x, y, z);
            m.castShadow = true;
            return m;
        };
        const c = def.color;
        const dark = new THREE.Color(c).multiplyScalar(0.7).getHex();

        // Body + head, scaled small
        this.body = box(0.55, 0.4, 0.85, c, 0, 0.45, 0);
        this.head = box(0.4, 0.4, 0.4, c, 0, 0.62, 0.55);
        const snout = box(0.18, 0.16, 0.18, dark, 0, 0.56, 0.78);
        const eyeL = box(0.07, 0.07, 0.03, 0x222222, -0.1, 0.7, 0.74);
        const eyeR = box(0.07, 0.07, 0.03, 0x222222, 0.1, 0.7, 0.74);
        const earL = box(0.12, 0.2, 0.06, dark, -0.13, 0.86, 0.5);
        const earR = box(0.12, 0.2, 0.06, dark, 0.13, 0.86, 0.5);
        this.group.add(this.body, this.head, snout, eyeL, eyeR, earL, earR);

        if (this.flying) {
            // Wings instead of legs
            this.wingL = box(0.5, 0.05, 0.4, c, -0.45, 0.5, 0);
            this.wingR = box(0.5, 0.05, 0.4, c, 0.45, 0.5, 0);
            this.group.add(this.wingL, this.wingR);
        } else {
            const tail = box(0.12, 0.12, 0.4, dark, 0, 0.5, -0.6);
            this.legFL = box(0.12, 0.32, 0.12, dark, -0.18, 0.16, 0.28);
            this.legFR = box(0.12, 0.32, 0.12, dark, 0.18, 0.16, 0.28);
            this.legBL = box(0.12, 0.32, 0.12, dark, -0.18, 0.16, -0.28);
            this.legBR = box(0.12, 0.32, 0.12, dark, 0.18, 0.16, -0.28);
            this.group.add(tail, this.legFL, this.legFR, this.legBL, this.legBR);
        }

        // Dragons are a touch bigger and glow faintly
        if (this.typeId === 'dragon') {
            this.group.scale.setScalar(1.15);
            this.body.material.emissive = new THREE.Color(c).multiplyScalar(0.25);
        }
    }

    setPosition(x, y, z) {
        this.group.position.set(x, y, z);
    }

    /** Re-parent into the active area and place near the hero. */
    enterArea(area, heroPos) {
        if (this.group.parent) this.group.parent.remove(this.group);
        area.group.add(this.group);
        const y = area.getHeightAt(heroPos.x - 2, heroPos.z);
        this.setPosition(heroPos.x - 2, y, heroPos.z);
    }

    update(dt, area, time, monsters) {
        const now = Date.now();
        const hero = this.hero;
        const hp = this.group.position;
        const target = this.hero ? LH2Main.player.pos : null;
        if (!target) return;

        // Knocked out: lie low, then respawn next to the hero
        if (now < this.downUntil) {
            this.group.visible = false;
            return;
        } else if (!this.group.visible) {
            this.group.visible = true;
            this.hp = this.effectiveMaxHp;
            const gy = area.getHeightAt(target.x - 2, target.z);
            this.setPosition(target.x - 2, gy, target.z);
        }

        // Find the nearest living monster within range
        let prey = null, preyD = 9;
        if (monsters) {
            for (const c of monsters) {
                if (c.kind !== 'monster' || c.hp <= 0 || !c.mesh.visible) continue;
                const d = Math.hypot(c.mesh.position.x - hp.x, c.mesh.position.z - hp.z);
                if (d < preyD) { preyD = d; prey = c; }
            }
        }

        // Decide a goal: chase prey if close, else heel beside the hero
        let gx, gz, goalDist;
        if (prey && Math.hypot(prey.mesh.position.x - target.x, prey.mesh.position.z - target.z) < 12) {
            gx = prey.mesh.position.x; gz = prey.mesh.position.z; goalDist = 1.1;
        } else {
            gx = target.x - Math.cos(LH2Main.cameraRig.yaw) * 1.8;
            gz = target.z + Math.sin(LH2Main.cameraRig.yaw) * 1.8;
            goalDist = 0.6;
        }

        const dx = gx - hp.x, dz = gz - hp.z;
        const dist = Math.hypot(dx, dz);
        // Catch up faster the further behind it is (so it never trails off)
        const speed = (7 + Math.min(8, dist)) * (1 + (hero.petSpeedBonus || 0));
        const moving = dist > goalDist;
        if (moving) {
            const nx = hp.x + (dx / dist) * speed * dt;
            const nz = hp.z + (dz / dist) * speed * dt;
            const here = area.getHeightAt(hp.x, hp.z);
            const there = area.getHeightAt(nx, nz);
            const minH = area.minWalkHeight !== undefined ? area.minWalkHeight : LH2.MIN_WALK_HEIGHT;
            if (there >= minH && Math.abs(there - here) <= LH2.MAX_STEP_HEIGHT) {
                hp.x = nx; hp.z = nz;
            }
            this.group.rotation.y = Math.atan2(dx, dz);
        }
        const ground = area.getHeightAt(hp.x, hp.z);
        hp.y = ground + (this.flying ? 1.2 + Math.sin(time * 0.005) * 0.25 : 0);

        // Teleport if it falls far behind (around a wall corner)
        if (Math.hypot(target.x - hp.x, target.z - hp.z) > 30) {
            this.setPosition(target.x - 2, area.getHeightAt(target.x - 2, target.z), target.z);
        }

        // Bite the prey
        if (prey && preyD < 1.6 && now - this.attackAt > 900) {
            this.attackAt = now;
            prey.hp -= this.attack;
            FX.burst(area.group, prey.mesh.position, this.color, 6, 3);
            if (prey.hp <= 0) Creatures._kill(prey, area);
        }

        // Animation
        this.walkPhase += dt * (moving ? 12 : 4);
        if (this.flying) {
            const flap = Math.sin(time * 0.02) * 0.7;
            if (this.wingL) { this.wingL.rotation.z = flap; this.wingR.rotation.z = -flap; }
        } else if (this.legFL) {
            const s = Math.sin(this.walkPhase) * (moving ? 0.6 : 0.05);
            this.legFL.rotation.x = s; this.legBR.rotation.x = s;
            this.legFR.rotation.x = -s; this.legBL.rotation.x = -s;
        }
    }

    /** Pet takes damage; knocked out (not dead) if it runs out of HP. */
    takeHit(dmg, area) {
        if (Date.now() < this.downUntil) return;
        this.hp -= dmg;
        FX.burst(area.group, this.group.position, 0xff4444, 6, 3);
        if (this.hp <= 0) {
            this.downUntil = Date.now() + 12000;
            EventBus.emit('lh2Toast', { text: `${this.name} ble slått ut! Kommer tilbake snart.` });
        }
    }

    serialize() { return { typeId: this.typeId }; }
}
