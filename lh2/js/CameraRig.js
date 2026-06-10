// ─── Labyrint Hero 2 – Third-person camera (FPS-style controls) ──────────────
// Pointer-lock mouse look: the mouse steers character + camera together, like
// a standard FPS/third-person action game. Click the canvas to capture the
// mouse, Esc releases it. Wheel zooms the follow distance.

class CameraRig {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        this.yaw = Math.PI;          // around Y – also the character's heading
        this.pitch = 0.42;           // camera elevation angle
        this.dist = 7;
        this.targetOffset = 1.6;     // look-at height above player feet
        this.locked = false;

        this._smoothPos = null;

        domElement.addEventListener('click', () => {
            if (!this.locked && !LH2Main.uiOpen) {
                domElement.requestPointerLock();
            }
        });

        document.addEventListener('pointerlockchange', () => {
            this.locked = document.pointerLockElement === domElement;
            const ch = document.getElementById('crosshair');
            if (ch) ch.classList.toggle('hidden', !this.locked);
            const hint = document.getElementById('mouse-hint');
            if (hint) hint.classList.toggle('hidden', this.locked);
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.locked) return;
            this.yaw -= e.movementX * 0.0024;
            this.pitch = Math.min(1.35, Math.max(-0.1, this.pitch + e.movementY * 0.0022));
        });

        domElement.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.dist = Math.min(20, Math.max(2.5, this.dist + e.deltaY * 0.012));
        }, { passive: false });

        // Touch fallback: one-finger drag orbits (no pointer lock on mobile)
        let lastT = null;
        domElement.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) lastT = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }, { passive: true });
        window.addEventListener('touchend', () => { lastT = null; });
        window.addEventListener('touchmove', (e) => {
            if (!lastT || e.touches.length !== 1) return;
            const t = e.touches[0];
            this.yaw -= (t.clientX - lastT.x) * 0.008;
            this.pitch = Math.min(1.35, Math.max(-0.1, this.pitch + (t.clientY - lastT.y) * 0.006));
            lastT = { x: t.clientX, y: t.clientY };
        }, { passive: true });
    }

    /** Release the mouse (used when overlays open). */
    unlock() {
        if (this.locked) document.exitPointerLock();
    }

    /** Forward unit vector (x,z) of the current heading. */
    get forward() {
        return { x: -Math.sin(this.yaw), z: -Math.cos(this.yaw) };
    }

    update(dt, playerPos, getHeightAt) {
        const target = new THREE.Vector3(
            playerPos.x,
            playerPos.y + this.targetOffset,
            playerPos.z,
        );

        const cosP = Math.cos(Math.max(0.02, this.pitch));
        const elev = Math.sin(Math.max(0.02, this.pitch));
        const desired = new THREE.Vector3(
            target.x + Math.sin(this.yaw) * cosP * this.dist,
            target.y + elev * this.dist + (this.pitch < 0.02 ? this.pitch * 4 : 0),
            target.z + Math.cos(this.yaw) * cosP * this.dist,
        );

        // Keep the camera above the ground
        const minY = getHeightAt(desired.x, desired.z) + 0.6;
        if (desired.y < minY) desired.y = minY;

        if (!this._smoothPos) this._smoothPos = desired.clone();
        const k = Math.min(1, dt * 10);
        this._smoothPos.lerp(desired, k);

        this.camera.position.copy(this._smoothPos);
        this.camera.lookAt(target);
    }
}
