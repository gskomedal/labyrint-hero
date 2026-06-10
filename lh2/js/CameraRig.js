// ─── Labyrint Hero 2 – Third-person camera ───────────────────────────────────
// Spherical orbit around a point above the player. Mouse drag rotates,
// wheel zooms, pitch clamped, lerped follow, kept above the terrain.
// Deliberately no pointer-lock: drag-orbit is simpler and touch-friendlier.

class CameraRig {
    constructor(camera, domElement) {
        this.camera = camera;
        this.yaw = Math.PI;          // around Y
        this.pitch = 0.45;           // 0 = horizontal, up to ~1.4
        this.dist = 10;
        this.targetOffset = 1.6;     // look-at height above player feet

        this._dragging = false;
        this._lastX = 0;
        this._lastY = 0;
        this._smoothPos = null;

        domElement.addEventListener('mousedown', (e) => {
            this._dragging = true;
            this._lastX = e.clientX;
            this._lastY = e.clientY;
        });
        window.addEventListener('mouseup', () => { this._dragging = false; });
        window.addEventListener('mousemove', (e) => {
            if (!this._dragging) return;
            const dx = e.clientX - this._lastX;
            const dy = e.clientY - this._lastY;
            this._lastX = e.clientX;
            this._lastY = e.clientY;
            this.yaw -= dx * 0.008;
            this.pitch = Math.min(1.4, Math.max(0.05, this.pitch + dy * 0.006));
        });
        domElement.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.dist = Math.min(22, Math.max(4, this.dist + e.deltaY * 0.012));
        }, { passive: false });

        // Touch: one-finger drag orbits
        domElement.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                this._dragging = true;
                this._lastX = e.touches[0].clientX;
                this._lastY = e.touches[0].clientY;
            }
        }, { passive: true });
        window.addEventListener('touchend', () => { this._dragging = false; });
        window.addEventListener('touchmove', (e) => {
            if (!this._dragging || e.touches.length !== 1) return;
            const t = e.touches[0];
            const dx = t.clientX - this._lastX;
            const dy = t.clientY - this._lastY;
            this._lastX = t.clientX;
            this._lastY = t.clientY;
            this.yaw -= dx * 0.008;
            this.pitch = Math.min(1.4, Math.max(0.05, this.pitch + dy * 0.006));
        }, { passive: true });
    }

    update(dt, playerPos, getHeightAt) {
        const target = new THREE.Vector3(
            playerPos.x,
            playerPos.y + this.targetOffset,
            playerPos.z,
        );

        const cosP = Math.cos(this.pitch);
        const desired = new THREE.Vector3(
            target.x + Math.sin(this.yaw) * cosP * this.dist,
            target.y + Math.sin(this.pitch) * this.dist,
            target.z + Math.cos(this.yaw) * cosP * this.dist,
        );

        // Keep the camera above the ground
        const minY = getHeightAt(desired.x, desired.z) + 0.8;
        if (desired.y < minY) desired.y = minY;

        if (!this._smoothPos) this._smoothPos = desired.clone();
        const k = Math.min(1, dt * 8);
        this._smoothPos.lerp(desired, k);

        this.camera.position.copy(this._smoothPos);
        this.camera.lookAt(target);
    }
}
