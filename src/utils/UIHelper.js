// ─── Labyrint Hero – UI Helper ───────────────────────────────────────────────
// Shared utility functions for overlay scenes (InventoryScene, SmelteryScene, ChemLabScene).

const UIHelper = {

    /** Destroy all objects in a dynamic array and reset it. */
    clearDynamic(dynArray) {
        for (const o of dynArray) { if (o && o.destroy) o.destroy(); }
        dynArray.length = 0;
    },

    /**
     * Update tab/filter button styles for a set of buttons.
     * @param {Phaser.GameObjects.Text[]} buttons - Array of text buttons
     * @param {string[]} ids - Matching array of tab/filter IDs
     * @param {string} activeId - Currently active tab/filter ID
     * @param {string} activeColor - Hex color string for active tab
     * @param {string} inactiveColor - Hex color string for inactive tabs
     */
    updateTabButtons(buttons, ids, activeId, activeColor, inactiveColor) {
        buttons.forEach((btn, i) => {
            btn.setColor(activeId === ids[i] ? activeColor : inactiveColor);
            btn.setFontStyle(activeId === ids[i] ? 'bold' : 'normal');
        });
    },

    /**
     * Convert an integer color to a CSS hex string.
     * @param {number} col - Integer color (e.g. 0xff7722)
     * @returns {string} Hex color string (e.g. '#ff7722')
     */
    colorToHex(col) {
        return '#' + (col || 0).toString(16).padStart(6, '0');
    },

    /**
     * Attach hover/out/click handlers to an existing interactive game object.
     * Idempotent re. interactive flag. Returns the target for chaining.
     * @param {Phaser.GameObjects.GameObject} target
     * @param {object} opts - { hoverColor, normalColor, onClick }
     */
    attachHover(target, { hoverColor, normalColor, onClick } = {}) {
        if (!target.input) target.setInteractive({ useHandCursor: true });
        if (hoverColor && target.setColor) {
            target.on('pointerover', () => target.setColor(hoverColor));
        }
        if (normalColor && target.setColor) {
            target.on('pointerout', () => target.setColor(normalColor));
        }
        if (typeof onClick === 'function') {
            target.on('pointerdown', onClick);
        }
        return target;
    },

    /**
     * Create a Phaser Text button with hover/out/click handlers wired up.
     * @param {Phaser.Scene} scene
     * @param {object} opts - { x, y, text, style, hoverColor, normalColor, onClick, origin }
     * @returns {Phaser.GameObjects.Text}
     */
    makeHoverButton(scene, { x, y, text, style = {}, hoverColor, normalColor, onClick, origin }) {
        const txt = scene.add.text(x, y, text, style);
        if (origin) txt.setOrigin(origin.x ?? origin, origin.y ?? origin);
        const normal = normalColor || style.color;
        return UIHelper.attachHover(txt, { hoverColor, normalColor: normal, onClick });
    }
};
