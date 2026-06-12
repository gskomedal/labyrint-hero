// ─── Labyrint Hero 2 – Creatures ─────────────────────────────────────────────
// Living terrain elements: rabbits and birds on the surface (ambience),
// monsters in the caves (light combat). Monsters wander, chase the hero when
// close, and bite for 1 heart; the hero swings the pickaxe (left click) for
// 1 damage. Kills drop a mineral of the zone's tier. Procedural low-poly
// bodies in the same box style as the player. Transient – not saved.

const MONSTER_TYPES = {
    2: { name: 'Grottegoblin', color: 0x4e8a3c, scale: 0.85, speed: 4.0 },
    3: { name: 'Flaggermus',   color: 0x5a4a6e, scale: 0.6,  speed: 5.5, flying: true },
    4: { name: 'Skjelett',     color: 0xd8d4c8, scale: 1.0,  speed: 3.6 },
    5: { name: 'Magmaånd',     color: 0xff5522, scale: 1.1,  speed: 4.4, emissive: true },
};

const Creatures = {
    hero: null,
    player: null,

    init(hero, player) {
        this.hero = hero;
        this.player = player;
    },

    // ── Builders ─────────────────────────────────────────────────────────────

    _bodyMat(color, emissive) {
        return new THREE.MeshStandardMaterial({
            color,
            emissive: emissive ? color : 0x000000,
            emissiveIntensity: emissive ? 0.55 : 0,
            flatShading: true,
        });
    },

    _buildMonster(type) {
        const g = new THREE.Group();
        const mat = this._bodyMat(type.color, type.emissive);
        const eyeMat = new THREE.MeshBasicMaterial({ color: type.emissive ? 0xffff66 : 0xcc2222 });

        const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 0.55), mat);
        body.position.y = 0.85;
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.55, 0.55), mat);
        head.position.y = 1.6;
        const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.05), eyeMat);
        eyeL.position.set(-0.15, 1.65, 0.3);
        const eyeR = eyeL.clone();
        eyeR.position.x = 0.15;

        const legL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.5, 0.25), mat);
        legL.position.set(-0.22, 0.25, 0);
        const legR = legL.clone();
        legR.position.x = 0.22;

        const armL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.65, 0.2), mat);
        armL.position.set(-0.55, 1.05, 0);
        const armR = armL.clone();
        armR.position.x = 0.55;

        g.add(body, head, eyeL, eyeR, legL, legR, armL, armR);

        if (type.flying) {
            const wingMat = this._bodyMat(type.color);
            const wingL = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.06, 0.5), wingMat);
            wingL.position.set(-0.85, 1.2, 0);
            const wingR = wingL.clone();
            wingR.position.x = 0.85;
            g.add(wingL, wingR);
            g.userData.wings = [wingL, wingR];
        }

        g.scale.setScalar(type.scale);
        g.userData.mat = mat;
        return g;
    },

    _buildRabbit() {
        const g = new THREE.Group();
        const mat = this._bodyMat(0xb8a28a);
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.7), mat);
        body.position.y = 0.35;
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.3, 0.32), mat);
        head.position.set(0, 0.62, 0.4);
        const earL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.1), mat);
        earL.position.set(-0.08, 0.95, 0.38);
        const earR = earL.clone();
        earR.position.x = 0.08;
        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16),
            this._bodyMat(0xf0e8dc));
        tail.position.set(0, 0.4, -0.4);
        g.add(body, head, earL, earR, tail);
        return g;
    },

    _buildBird() {
        const g = new THREE.Group();
        const mat = this._bodyMat(0x3a4a6e);
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 0.55), mat);
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), mat);
        head.position.set(0, 0.12, 0.35);
        const beak = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.15),
            this._bodyMat(0xddaa33));
        beak.position.set(0, 0.1, 0.5);
        const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.05, 0.35), mat);
        wingL.position.set(-0.45, 0.05, 0);
        const wingR = wingL.clone();
        wingR.position.x = 0.45;
        g.add(body, head, beak, wingL, wingR);
        g.userData.wings = [wingL, wingR];
        return g;
    },

    // ── Population ───────────────────────────────────────────────────────────

    /** Surface ambience: hopping rabbits + circling birds. */
    populateSurface(area, rand) {
        area.creatures = [];
        for (let i = 0; i < LH2.SURFACE_RABBITS; i++) {
            const spot = area.findSpot(rand, { minH: 1.5, maxH: 14, maxSlope: 0.5 });
            if (!spot) continue;
            const mesh = this._buildRabbit();
            mesh.position.set(spot.x, spot.y, spot.z);
            area.group.add(mesh);
            area.creatures.push({
                kind: 'rabbit', mesh, home: spot,
                dir: rand() * Math.PI * 2, hopPhase: rand() * 10,
                nextTurn: 0,
            });
        }
        for (let i = 0; i < LH2.SURFACE_BIRDS; i++) {
            const spot = area.findSpot(rand, { minH: 3, maxSlope: 2 });
            if (!spot) continue;
            const mesh = this._buildBird();
            area.group.add(mesh);
            area.creatures.push({
                kind: 'bird', mesh, home: spot,
                angle: rand() * Math.PI * 2,
                radius: 8 + rand() * 10,
                height: spot.y + 8 + rand() * 6,
                speed: 0.4 + rand() * 0.3,
            });
        }
    },

    /** Cave monsters for one zone. */
    populateCave(area, rand) {
        area.creatures = [];
        const type = MONSTER_TYPES[area.tier];
        if (!type) return;
        for (let i = 0; i < LH2.CAVE_MONSTERS; i++) {
            const spot = area.findSpot(rand, { maxSlope: 0.7 });
            if (!spot) continue;
            const mesh = this._buildMonster(type);
            mesh.position.set(spot.x, spot.y, spot.z);
            area.group.add(mesh);
            const hp = 1 + area.tier * 2;
            area.creatures.push({
                kind: 'monster', type, mesh, home: spot,
                hp, maxHp: hp,
                dir: rand() * Math.PI * 2,
                nextTurn: 0, attackAt: 0, respawnAt: 0,
                walkPhase: rand() * 10,
            });
        }
    },

    // ── Combat ───────────────────────────────────────────────────────────────

    /** Left-click swing: hit the nearest living monster in front. */
    tryHit(area, forward) {
        if (!area.creatures) return false;
        const p = this.player.pos;
        let best = null, bestD = LH2.HIT_RANGE;
        for (const c of area.creatures) {
            if (c.kind !== 'monster' || c.hp <= 0) continue;
            const dx = c.mesh.position.x - p.x;
            const dz = c.mesh.position.z - p.z;
            const d = Math.hypot(dx, dz);
            if (d > bestD) continue;
            if ((dx * forward.x + dz * forward.z) / (d || 1) < 0.3) continue;
            best = c; bestD = d;
        }
        if (!best) return false;

        best.hp -= this.hero.attack;
        FX.burst(area.group, best.mesh.position, 0xffffff, 8, 3);
        // Knockback + hit flash
        const kx = best.mesh.position.x - p.x, kz = best.mesh.position.z - p.z;
        const kd = Math.hypot(kx, kz) || 1;
        this._moveOnGround(best, area, (kx / kd) * 1.2, (kz / kd) * 1.2);
        best.mesh.userData.mat.emissiveIntensity = 1;
        best.mesh.userData.mat.emissive.setHex(0xffffff);
        setTimeout(() => {
            const t = best.type;
            best.mesh.userData.mat.emissive.setHex(t.emissive ? t.color : 0x000000);
            best.mesh.userData.mat.emissiveIntensity = t.emissive ? 0.55 : 0;
        }, 120);

        if (best.hp <= 0) {
            this._kill(best, area);
        } else {
            EventBus.emit('lh2Toast', { text: `${best.type.name}: ${best.hp}/${best.maxHp} HP` });
        }
        return true;
    },

    _kill(c, area) {
        c.mesh.visible = false;
        c.respawnAt = Date.now() + LH2.MONSTER_RESPAWN_MS;
        FX.burst(area.group, c.mesh.position, c.type.color, 20, 5);

        // XP + gold (LH1: monsters are the XP and gold source)
        const xp = 12 * area.tier;
        this.hero.addXP(xp);
        const gold = 2 + Math.floor(Math.random() * 4) + area.tier * 2;
        this.hero.gold += gold;

        // Loot: a mineral of the zone's tier straight into the backpack
        const pool = Object.values(MINERAL_DEFS).filter(m => m.tier === area.tier);
        const def = pool[Math.floor(Math.random() * pool.length)];
        const lootText = def && this.hero.inventory.addItem(def)
            ? `, +1 ${LH2Mining.itemName(def)}` : '';
        EventBus.emit('lh2Toast', {
            text: `${c.type.name} beseiret! +${xp} XP, +${gold}g${lootText}`, cls: 'levelup',
        });
        EventBus.emit('lh2InventoryChanged');
    },

    /** Keep a creature on the floor, blocked by walls/cliffs like the player. */
    _moveOnGround(c, area, dx, dz) {
        const nx = c.mesh.position.x + dx;
        const nz = c.mesh.position.z + dz;
        const here = area.getHeightAt(c.mesh.position.x, c.mesh.position.z);
        const there = area.getHeightAt(nx, nz);
        const minH = area.minWalkHeight !== undefined ? area.minWalkHeight : LH2.MIN_WALK_HEIGHT;
        if (there >= minH && Math.abs(there - here) <= LH2.MAX_STEP_HEIGHT) {
            c.mesh.position.x = nx;
            c.mesh.position.z = nz;
            c.mesh.position.y = there;
            return true;
        }
        return false;
    },

    // ── Per-frame update ─────────────────────────────────────────────────────

    update(area, dt, time) {
        if (!area.creatures) return;
        const p = this.player.pos;
        const now = Date.now();

        for (const c of area.creatures) {
            if (c.kind === 'bird') {
                c.angle += c.speed * dt;
                c.mesh.position.set(
                    c.home.x + Math.cos(c.angle) * c.radius,
                    c.height + Math.sin(time * 0.001 + c.radius) * 1.5,
                    c.home.z + Math.sin(c.angle) * c.radius,
                );
                c.mesh.rotation.y = -c.angle;
                const flap = Math.sin(time * 0.02) * 0.6;
                c.mesh.userData.wings[0].rotation.z = flap;
                c.mesh.userData.wings[1].rotation.z = -flap;
                continue;
            }

            if (c.kind === 'rabbit') {
                const dx = p.x - c.mesh.position.x, dz = p.z - c.mesh.position.z;
                const dp = Math.hypot(dx, dz);
                if (dp < 6) {
                    c.dir = Math.atan2(-dx, -dz); // flee
                } else if (time > c.nextTurn) {
                    c.dir += (Math.random() - 0.5) * 2;
                    c.nextTurn = time + 1500 + Math.random() * 2500;
                }
                c.hopPhase += dt * 8;
                const hop = Math.max(0, Math.sin(c.hopPhase));
                const speed = dp < 6 ? 6 : 1.6;
                if (hop > 0.1) {
                    if (!this._moveOnGround(c, area, Math.sin(c.dir) * speed * dt, Math.cos(c.dir) * speed * dt)) {
                        c.dir += Math.PI / 2;
                    }
                }
                c.mesh.position.y = area.getHeightAt(c.mesh.position.x, c.mesh.position.z) + hop * 0.45;
                c.mesh.rotation.y = c.dir;
                continue;
            }

            // Monster
            if (c.hp <= 0) {
                if (c.respawnAt && now >= c.respawnAt) {
                    c.hp = c.maxHp;
                    c.respawnAt = 0;
                    c.mesh.position.set(c.home.x, c.home.y, c.home.z);
                    c.mesh.visible = true;
                }
                continue;
            }

            const dx = p.x - c.mesh.position.x, dz = p.z - c.mesh.position.z;
            const dp = Math.hypot(dx, dz);

            if (dp < LH2.MONSTER_AGGRO_RADIUS && dp > 1.4) {
                // Chase
                c.dir = Math.atan2(dx, dz);
                this._moveOnGround(c, area, (dx / dp) * c.type.speed * dt, (dz / dp) * c.type.speed * dt);
            } else if (dp <= 1.4) {
                // Bite – defense gives a block chance (5% per point, max 50%)
                if (now - c.attackAt > LH2.MONSTER_ATTACK_COOLDOWN_MS) {
                    c.attackAt = now;
                    if (Math.random() < Math.min(0.5, this.hero.defense * 0.05)) {
                        EventBus.emit('lh2Toast', { text: 'Blokkert!' });
                    } else {
                        LH2Main.damageHero(1, c.type.name);
                    }
                }
            } else if (time > c.nextTurn) {
                // Wander
                c.dir += (Math.random() - 0.5) * 1.6;
                c.nextTurn = time + 2000 + Math.random() * 3000;
            } else {
                this._moveOnGround(c, area, Math.sin(c.dir) * c.type.speed * 0.3 * dt, Math.cos(c.dir) * c.type.speed * 0.3 * dt);
            }

            c.mesh.rotation.y = c.dir;
            c.walkPhase += dt * 6;
            if (c.type.flying) {
                c.mesh.position.y = area.getHeightAt(c.mesh.position.x, c.mesh.position.z)
                    + 1.6 + Math.sin(c.walkPhase) * 0.5;
                if (c.mesh.userData.wings) {
                    const flap = Math.sin(time * 0.025) * 0.8;
                    c.mesh.userData.wings[0].rotation.z = flap;
                    c.mesh.userData.wings[1].rotation.z = -flap;
                }
            }
        }
    },
};
