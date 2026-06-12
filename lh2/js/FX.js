// ─── Labyrint Hero 2 – Particle effects ──────────────────────────────────────
// Tiny physics-free particle bursts: mining sparks, combat hits, wood chips.
// One THREE.Points object per burst; updated each frame, auto-removed.

const FX = {
    _bursts: [],

    /** Spawn a burst of n colored particles at a world position. */
    burst(group, pos, color, n = 14, speed = 4) {
        const positions = new Float32Array(n * 3);
        const velocities = [];
        for (let i = 0; i < n; i++) {
            positions[i * 3] = pos.x;
            positions[i * 3 + 1] = (pos.y || 0) + 0.8;
            positions[i * 3 + 2] = pos.z;
            const ang = Math.random() * Math.PI * 2;
            const up = 2 + Math.random() * 3;
            velocities.push({
                x: Math.cos(ang) * speed * (0.4 + Math.random() * 0.6),
                y: up,
                z: Math.sin(ang) * speed * (0.4 + Math.random() * 0.6),
            });
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({
            color, size: 0.22, transparent: true, opacity: 1, sizeAttenuation: true,
        });
        const points = new THREE.Points(geo, mat);
        group.add(points);
        this._bursts.push({ points, velocities, group, life: 0.7 });
    },

    update(dt) {
        for (let i = this._bursts.length - 1; i >= 0; i--) {
            const b = this._bursts[i];
            b.life -= dt;
            const pos = b.points.geometry.attributes.position;
            for (let p = 0; p < b.velocities.length; p++) {
                const v = b.velocities[p];
                v.y -= 12 * dt; // gravity
                pos.array[p * 3] += v.x * dt;
                pos.array[p * 3 + 1] += v.y * dt;
                pos.array[p * 3 + 2] += v.z * dt;
            }
            pos.needsUpdate = true;
            b.points.material.opacity = Math.max(0, b.life / 0.7);

            if (b.life <= 0) {
                b.group.remove(b.points);
                b.points.geometry.dispose();
                b.points.material.dispose();
                this._bursts.splice(i, 1);
            }
        }
    },
};
