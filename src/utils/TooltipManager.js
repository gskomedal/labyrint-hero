// ─── Labyrint Hero – TooltipManager ──────────────────────────────────────────
// Owns a single tooltip Text per scene. Auto-cancels the previous tooltip
// when a new one is shown, and auto-cleans on scene shutdown to prevent
// orphaned text objects after rapid hover or scene close.
//
// Usage:
//   this.tooltips = new TooltipManager(this);
//   this.tooltips.show(x, y, 'Hello', { color: '#fff' });
//   this.tooltips.hide();
//
// All styles default to the standard panel-tooltip look.

class TooltipManager {
    constructor(scene) {
        this.scene = scene;
        this._tip = null;
        this._defaultStyle = {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#ccddff',
            backgroundColor: '#0a0918',
            padding: { x: 6, y: 4 },
            stroke: '#334466',
            strokeThickness: 1,
            wordWrap: { width: 300 },
        };
        // Auto-cleanup on scene shutdown.
        scene.events.once('shutdown', () => this.destroy());
        scene.events.once('destroy',  () => this.destroy());
    }

    /**
     * Show a tooltip at (x, y). Replaces any current tooltip.
     * @param {number} x
     * @param {number} y
     * @param {string} text
     * @param {object} styleOverrides - merged into default style
     * @param {object} opts - { origin: {x,y}, depth, clampToCamera }
     */
    show(x, y, text, styleOverrides = {}, opts = {}) {
        this.hide();
        const style = { ...this._defaultStyle, ...styleOverrides };
        const tip = this.scene.add.text(x, y, text, style);
        const origin = opts.origin || { x: 0.5, y: 1 };
        tip.setOrigin(origin.x, origin.y);
        tip.setDepth(opts.depth ?? 30);

        if (opts.clampToCamera !== false) {
            const cam = this.scene.cameras.main;
            const b = tip.getBounds();
            if (b.left  < 4)            tip.setX(x + (4 - b.left));
            if (b.right > cam.width - 4) tip.setX(x - (b.right - cam.width + 4));
            if (b.top   < 4)            tip.setOrigin(origin.x, 0).setY(y + 8);
        }

        this._tip = tip;
        return tip;
    }

    /** Hide the current tooltip if any. Idempotent. */
    hide() {
        if (this._tip) {
            this._tip.destroy();
            this._tip = null;
        }
    }

    /** Tear down. Called automatically on scene shutdown. */
    destroy() {
        this.hide();
        this.scene = null;
    }
}
