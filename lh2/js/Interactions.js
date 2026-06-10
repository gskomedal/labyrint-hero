// ─── Labyrint Hero 2 – Interaction system ────────────────────────────────────
// Finds the nearest active interactable within reach each frame, shows the
// "Trykk [E]" prompt, and dispatches E presses to the handler.

class Interactions {
    constructor() {
        this.area = null;
        this.current = null;
        this.promptEl = document.getElementById('prompt');

        window.addEventListener('keydown', (e) => {
            if (e.code !== 'KeyE' || e.repeat) return;
            if (LH2Main.uiOpen || LH2Mining.isActive()) return;
            if (this.current) this.current.onInteract();
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

        let best = null;
        let bestD2 = LH2.INTERACT_RADIUS * LH2.INTERACT_RADIUS;
        for (const it of this.area.interactables) {
            if (!it.isActive()) continue;
            const dx = it.pos.x - playerPos.x;
            const dy = (it.pos.y || 0) - playerPos.y;
            const dz = it.pos.z - playerPos.z;
            const d2 = dx * dx + dy * dy * 0.25 + dz * dz;
            if (d2 < bestD2) {
                bestD2 = d2;
                best = it;
            }
        }

        this.current = best;
        this._setPrompt(best && !LH2Mining.isActive() ? best.getLabel() : null);
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
