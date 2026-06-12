// ─── Labyrint Hero 2 – Interaction system ────────────────────────────────────
// Finds the nearest active interactable in front of the player each frame and
// dispatches mouse buttons FPS-style:
//   Left click  – mine/chop (ore, fuel seams, trees); empty swing otherwise
//   Right click – use (portals, smelter, lab table)
//   E           – still works for everything (keyboard fallback)

const MINE_TYPES = { ore: true, 'fuel-node': true, tree: true, element: true };
const USE_TYPES = { portal: true, smelter: true, labtable: true, merchant: true };

class Interactions {
    constructor(player, cameraRig) {
        this.player = player;
        this.cameraRig = cameraRig;
        this.area = null;
        this.current = null;
        this.promptEl = document.getElementById('prompt');

        window.addEventListener('keydown', (e) => {
            if (e.code !== 'KeyE' || e.repeat) return;
            if (LH2Main.uiOpen || LH2Mining.isActive()) return;
            if (this.current) this.current.onInteract();
        });

        const canvas = document.querySelector('#game-container canvas');
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        canvas.addEventListener('mousedown', (e) => {
            if (!this.cameraRig.locked || LH2Main.uiOpen || LH2Mining.isActive()) return;
            if (e.button === 0) {
                if (this.current && MINE_TYPES[this.current.type]) {
                    this.current.onInteract();
                } else {
                    // Combat swing: hit a monster in front, or just swing
                    this.player.swingOnce();
                    Creatures.tryHit(this.area, this.cameraRig.forward);
                }
            } else if (e.button === 2) {
                if (this.current && USE_TYPES[this.current.type]) {
                    this.current.onInteract();
                }
            }
        });
    }

    setArea(area) {
        this.area = area;
        this.current = null;
    }

    update(playerPos) {
        if (!this.area || LH2Main.uiOpen) {
            this._setPrompt(null);
            return;
        }

        const fwd = this.cameraRig.forward;
        let best = null;
        let bestD2 = LH2.INTERACT_RADIUS * LH2.INTERACT_RADIUS;
        for (const it of this.area.interactables) {
            if (!it.isActive()) continue;
            const dx = it.pos.x - playerPos.x;
            const dy = (it.pos.y || 0) - playerPos.y;
            const dz = it.pos.z - playerPos.z;
            const d2 = dx * dx + dy * dy * 0.25 + dz * dz;
            if (d2 >= bestD2) continue;
            // Must be roughly in front of the player (or right on top of it)
            const d = Math.sqrt(dx * dx + dz * dz) || 1;
            const facing = (dx * fwd.x + dz * fwd.z) / d;
            if (d > 1.2 && facing < 0.25) continue;
            bestD2 = d2;
            best = it;
        }

        this.current = best;
        this._setPrompt(best && !LH2Mining.isActive() ? this._labelFor(best) : null);
    }

    _labelFor(it) {
        const action = MINE_TYPES[it.type] ? 'Venstreklikk' : 'Høyreklikk';
        return `[${action} / E] ${it.getLabel()}`;
    }

    _setPrompt(text) {
        if (text) {
            this.promptEl.textContent = text;
            this.promptEl.classList.remove('hidden');
        } else {
            this.promptEl.classList.add('hidden');
        }
    }
}
