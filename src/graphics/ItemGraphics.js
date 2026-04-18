// ─── Labyrint Hero – Item Graphics ───────────────────────────────────────────
// Extracted from ItemSpawner.js – procedural icon drawing for items.
// Used by both ItemSpawner (world tiles) and InventoryScene (UI icons).

const ItemGraphics = {

    /**
     * Draw a unique procedural icon for an item at pixel position (px, py).
     * Used for items placed on the map (chests, drops, minerals, etc.)
     */
    drawWorldIcon(g, px, py, s, item) {
        const cx = px + s / 2, cy = py + s / 2;
        const col = item.color;
        g.fillStyle(col, 0.9);

        if (item.id === 'key') {
            g.fillCircle(cx, cy - 4, 5);
            g.fillRect(cx - 1, cy + 1, 3, 9);
            g.fillRect(cx + 2, cy + 5, 4, 2);
            g.fillRect(cx + 2, cy + 8, 3, 2);
        } else if (item.id === 'pickaxe') {
            g.fillRect(cx - 1, py + 10, 3, s - 18);
            g.fillStyle(0x888888, 0.9);
            g.fillTriangle(cx - 8, py + 10, cx + 8, py + 10, cx, py + 6);
            g.fillStyle(col, 0.7);
            g.fillRect(cx - 1, py + 8, 3, 4);
        } else if (item.id === 'dagger') {
            g.fillRect(cx - 1, py + 6, 3, 14);
            g.fillStyle(0x665544, 0.9);
            g.fillRect(cx - 4, py + 18, 9, 3);
            g.fillStyle(0x886644, 0.9);
            g.fillRect(cx - 2, py + 21, 5, 6);
        } else if (item.id === 'wood_sword') {
            g.fillRect(cx - 2, py + 5, 4, 16);
            g.fillStyle(0x664422, 0.9);
            g.fillRect(cx - 5, py + 19, 10, 3);
            g.fillRect(cx - 2, py + 22, 4, 5);
        } else if (item.id === 'spear') {
            g.fillRect(cx - 1, py + 4, 3, 24);
            g.fillStyle(0xaaaacc, 0.9);
            g.fillTriangle(cx - 4, py + 8, cx + 4, py + 8, cx, py + 2);
        } else if (item.id === 'iron_sword') {
            g.fillStyle(0xaaaacc, 0.9);
            g.fillRect(cx - 2, py + 4, 4, 16);
            g.fillStyle(0x886644, 0.9);
            g.fillRect(cx - 5, py + 18, 11, 3);
            g.fillStyle(0x664422, 0.9);
            g.fillRect(cx - 2, py + 21, 5, 6);
        } else if (item.id === 'battle_axe') {
            g.fillStyle(0x886644, 0.9);
            g.fillRect(cx - 1, py + 4, 3, 22);
            g.fillStyle(col, 0.9);
            g.fillTriangle(cx - 8, py + 6, cx - 1, py + 6, cx - 1, py + 16);
            g.fillTriangle(cx + 8, py + 6, cx + 1, py + 6, cx + 1, py + 16);
        } else if (item.id === 'war_hammer') {
            g.fillStyle(0x886644, 0.9);
            g.fillRect(cx - 1, py + 10, 3, 18);
            g.fillStyle(col, 0.9);
            g.fillRoundedRect(cx - 7, py + 4, 14, 10, 2);
        } else if (item.id === 'magic_staff') {
            g.fillStyle(0x664422, 0.9);
            g.fillRect(cx - 1, py + 8, 3, 20);
            g.fillStyle(0xaa44ff, 0.8);
            g.fillCircle(cx, py + 8, 5);
            g.fillStyle(0xffffff, 0.4);
            g.fillCircle(cx - 1, py + 7, 2);
        } else if (item.subtype === 'bow') {
            g.lineStyle(3, col, 0.9);
            g.beginPath();
            g.arc(cx + 3, cy, 10, -1.8, 1.8, false);
            g.strokePath();
            g.lineStyle(1, 0xccaa66, 0.7);
            g.lineBetween(cx + 3, cy - 10, cx + 3, cy + 10);
        } else if (item.id === 'leather_armor') {
            g.fillStyle(0x886633, 0.9);
            g.fillRoundedRect(cx - 8, py + 6, 16, 18, 2);
            g.fillStyle(0x775522, 0.8);
            g.fillRect(cx - 6, py + 12, 12, 2);
        } else if (item.id === 'padded_vest') {
            g.fillStyle(0x998866, 0.9);
            g.fillRoundedRect(cx - 8, py + 6, 16, 18, 2);
            g.fillStyle(0x887755, 0.8);
            g.fillRect(cx - 6, py + 10, 12, 2);
            g.fillRect(cx - 6, py + 14, 12, 2);
            g.fillRect(cx - 6, py + 18, 12, 2);
        } else if (item.id === 'chain_mail') {
            g.fillStyle(0x8899aa, 0.9);
            g.fillRoundedRect(cx - 8, py + 6, 16, 18, 2);
            for (let r = 0; r < 4; r++) {
                for (let c = 0; c < 3; c++) {
                    g.fillStyle(0x667788, 0.6);
                    g.fillCircle(cx - 5 + c * 5, py + 10 + r * 4, 2);
                }
            }
        } else if (item.id === 'plate_armor') {
            g.fillStyle(0xccccdd, 0.9);
            g.fillRoundedRect(cx - 9, py + 5, 18, 20, 3);
            g.fillStyle(0xaaaacc, 0.7);
            g.fillRect(cx - 1, py + 6, 2, 18);
            g.fillRect(cx - 7, py + 13, 14, 2);
        } else if (item.id === 'robe_magic') {
            g.fillStyle(0x6633aa, 0.9);
            g.fillRoundedRect(cx - 9, py + 5, 18, 22, 3);
            g.fillStyle(0xaa66ff, 0.5);
            g.fillCircle(cx, py + 14, 4);
            g.fillStyle(0xffffff, 0.3);
            g.fillCircle(cx - 1, py + 13, 1);
        } else if (item.id === 'dragon_scale') {
            g.fillStyle(0xff6622, 0.9);
            g.fillRoundedRect(cx - 9, py + 5, 18, 20, 3);
            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 3; c++) {
                    g.fillStyle(0xcc4411, 0.7);
                    g.fillTriangle(cx - 6 + c * 5, py + 8 + r * 6, cx - 4 + c * 5, py + 12 + r * 6, cx - 8 + c * 5, py + 12 + r * 6);
                }
            }
        } else if (item.type === 'armor') {
            g.fillRoundedRect(cx - 8, py + 6, 16, 18, 3);
        } else if (item.id === 'health_pot' || item.id === 'big_health_pot') {
            g.fillStyle(col, 0.9);
            g.fillRoundedRect(cx - 5, py + 10, 10, 14, 3);
            g.fillRect(cx - 3, py + 7, 6, 5);
            g.fillStyle(0xffffff, 0.3);
            g.fillCircle(cx - 2, py + 14, 2);
        } else if (item.id === 'strength_brew' || item.id === 'defense_brew') {
            g.fillStyle(col, 0.9);
            g.fillRoundedRect(cx - 4, py + 12, 8, 12, 2);
            g.fillRect(cx - 3, py + 8, 6, 5);
            g.fillStyle(0xffffff, 0.25);
            g.fillRect(cx - 1, py + 14, 2, 6);
        } else if (item.id === 'antidote' || item.id === 'frost_salve' || item.id === 'burn_salve') {
            g.fillStyle(col, 0.9);
            g.fillRoundedRect(cx - 5, py + 10, 10, 14, 3);
            g.fillRect(cx - 3, py + 7, 6, 5);
            g.fillStyle(0xffffff, 0.2);
            g.fillRect(cx - 3, py + 12, 1, 8);
        } else if (item.id === 'bomb') {
            g.fillStyle(0x333333, 0.9);
            g.fillCircle(cx, cy + 2, 8);
            g.fillStyle(0x111111, 0.9);
            g.fillCircle(cx, cy + 2, 5);
            g.fillStyle(0xff6600, 0.8);
            g.fillRect(cx - 1, py + 6, 2, 6);
            g.fillCircle(cx, py + 5, 3);
        } else if (item.id === 'flashbang') {
            g.fillStyle(col, 0.9);
            g.fillCircle(cx, cy, 7);
            g.fillStyle(0xffffff, 0.6);
            g.fillCircle(cx, cy, 4);
            g.fillStyle(0xffffff, 0.9);
            g.fillCircle(cx - 1, cy - 1, 2);
        } else if (item.id === 'xp_scroll' || item.id === 'map_scroll') {
            g.fillStyle(col, 0.9);
            g.fillRoundedRect(cx - 6, py + 8, 12, 18, 2);
            g.fillStyle(col, 1);
            g.fillCircle(cx - 6, py + 8, 3);
            g.fillCircle(cx + 6, py + 8, 3);
            g.fillCircle(cx - 6, py + 26, 3);
            g.fillCircle(cx + 6, py + 26, 3);
            g.fillStyle(0x000000, 0.3);
            g.fillRect(cx - 3, py + 13, 6, 1);
            g.fillRect(cx - 3, py + 16, 6, 1);
            g.fillRect(cx - 3, py + 19, 4, 1);
        } else if (item.id === 'heart_crystal') {
            g.fillStyle(col, 0.9);
            g.fillTriangle(cx, py + 26, cx - 9, py + 14, cx + 9, py + 14);
            g.fillCircle(cx - 5, py + 12, 5);
            g.fillCircle(cx + 5, py + 12, 5);
            g.fillStyle(0xffffff, 0.3);
            g.fillCircle(cx - 3, py + 11, 2);
        } else if (item._chemType === 'potion' || item._chemType === 'medicine') {
            // Flask shape
            g.fillRoundedRect(cx - 4, cy - 2, 8, 12, 3);
            g.fillRect(cx - 2, cy - 6, 4, 5);
            g.fillStyle(0xffffff, 0.3);
            g.fillCircle(cx - 2, cy + 2, 2);
        } else if (item._chemType === 'explosive' && (item.id === 'dynamite' || item.id === 'potassium_nitrate')) {
            // Dynamite sticks
            g.fillRoundedRect(cx - 5, cy - 4, 4, 14, 1);
            g.fillRoundedRect(cx - 1, cy - 6, 4, 16, 1);
            g.fillRoundedRect(cx + 3, cy - 3, 4, 13, 1);
            g.fillStyle(0xffcc00, 0.9);
            g.fillRect(cx, cy - 10, 1, 5);
            g.fillCircle(cx, cy - 10, 2);
        } else if (item._chemType === 'explosive') {
            // Round bomb
            g.fillCircle(cx, cy + 2, 8);
            g.fillStyle(0x222222, 0.6);
            g.fillCircle(cx, cy + 2, 6);
            g.fillStyle(col, 0.9);
            g.fillCircle(cx, cy + 2, 5);
            g.fillStyle(0xffcc00, 0.9);
            g.fillRect(cx - 1, cy - 8, 2, 5);
            g.fillCircle(cx, cy - 9, 2);
        } else if (item._chemType === 'acid') {
            // Bubbling vial
            g.fillRoundedRect(cx - 4, cy - 2, 8, 12, 2);
            g.fillRect(cx - 2, cy - 6, 4, 5);
            g.fillStyle(0xffffff, 0.4);
            g.fillCircle(cx - 2, cy + 1, 2);
            g.fillCircle(cx + 2, cy - 1, 1.5);
            g.fillCircle(cx, cy + 4, 1);
        } else if (item.type === 'consumable') {
            g.fillCircle(cx, cy, s / 4.5);
            g.fillStyle(0xffffff, 0.3);
            g.fillCircle(cx - 3, cy - 3, s / 10);
        } else {
            g.fillRoundedRect(px + 6, py + 6, s - 12, s - 12, 4);
        }
    },

    /**
     * Draw a compact item icon centered at (x, y) with given size.
     * Used for inventory UI slots.
     */
    drawInventoryIcon(g, x, y, item, size) {
        const s  = size;
        const hs = s / 2;
        const col = item.rarityColor || item.color || (
            item.type === 'weapon' ? 0xff8800
          : item.type === 'armor'  ? 0x4488ff
          : 0xff2244);
        g.fillStyle(col, 0.8);

        if (item.id === 'dagger') {
            g.fillRect(x - 1, y - hs + 2, 3, s * 0.5);
            g.fillStyle(0x886644, 0.9);
            g.fillRect(x - 4, y + 2, 8, 3);
            g.fillRect(x - 2, y + 5, 4, 4);
        } else if (item.id === 'wood_sword' || item.id === 'iron_sword') {
            g.fillRect(x - 2, y - hs + 2, 4, s * 0.55);
            g.fillStyle(0x886644, 0.9);
            g.fillRect(x - 5, y + 4, 10, 3);
            g.fillRect(x - 2, y + 7, 4, 4);
        } else if (item.id === 'spear') {
            g.fillRect(x - 1, y - hs + 1, 3, s * 0.75);
            g.fillStyle(0xaaaacc, 0.9);
            g.fillTriangle(x - 4, y - hs + 8, x + 4, y - hs + 8, x, y - hs + 1);
        } else if (item.id === 'battle_axe') {
            g.fillStyle(0x886644, 0.9);
            g.fillRect(x - 1, y - hs + 4, 3, s * 0.65);
            g.fillStyle(col, 0.9);
            g.fillTriangle(x - 8, y - hs + 5, x - 1, y - hs + 5, x - 1, y + 2);
            g.fillTriangle(x + 8, y - hs + 5, x + 1, y - hs + 5, x + 1, y + 2);
        } else if (item.id === 'war_hammer') {
            g.fillStyle(0x886644, 0.9);
            g.fillRect(x - 1, y - 2, 3, s * 0.45);
            g.fillStyle(col, 0.9);
            g.fillRoundedRect(x - 7, y - hs + 2, 14, 10, 2);
        } else if (item.id === 'magic_staff') {
            g.fillStyle(0x664422, 0.9);
            g.fillRect(x - 1, y - 2, 3, s * 0.5);
            g.fillStyle(0xaa44ff, 0.8);
            g.fillCircle(x, y - hs + 6, 5);
            g.fillStyle(0xffffff, 0.4);
            g.fillCircle(x - 1, y - hs + 5, 2);
        } else if (item.subtype === 'bow') {
            g.lineStyle(3, col, 0.9);
            g.beginPath();
            g.arc(x + 3, y, s / 3, -1.8, 1.8, false);
            g.strokePath();
            g.lineStyle(1, 0xccaa66, 0.7);
            g.lineBetween(x + 3, y - s / 3, x + 3, y + s / 3);
        } else if (item.id === 'chain_mail') {
            g.fillStyle(0x8899aa, 0.9);
            g.fillRoundedRect(x - hs / 2, y - hs / 2, hs, hs * 1.1, 3);
            for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
                g.fillStyle(0x667788, 0.5);
                g.fillCircle(x - hs / 3 + c * (hs / 3), y - hs / 3 + r * (hs / 3), 2);
            }
        } else if (item.id === 'plate_armor') {
            g.fillStyle(0xccccdd, 0.9);
            g.fillRoundedRect(x - hs / 2, y - hs / 2, hs, hs * 1.1, 3);
            g.fillStyle(0xaaaacc, 0.5);
            g.fillRect(x - 1, y - hs / 2 + 2, 2, hs);
        } else if (item.id === 'dragon_scale') {
            g.fillStyle(0xff6622, 0.9);
            g.fillRoundedRect(x - hs / 2, y - hs / 2, hs, hs * 1.1, 3);
            g.fillStyle(0xcc4411, 0.6);
            for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
                g.fillTriangle(x - 6 + c * 5, y - 4 + r * 7, x - 4 + c * 5, y + r * 7, x - 8 + c * 5, y + r * 7);
            }
        } else if (item.type === 'armor') {
            g.fillRoundedRect(x - hs / 2, y - hs / 2, hs, hs * 1.1, 4);
        } else if (item.id === 'health_pot' || item.id === 'big_health_pot') {
            g.fillRoundedRect(x - 5, y - 2, 10, 12, 3);
            g.fillRect(x - 3, y - 5, 6, 4);
            g.fillStyle(0xffffff, 0.3);
            g.fillCircle(x - 2, y + 2, 2);
        } else if (item.id === 'bomb') {
            g.fillStyle(0x333333, 0.9);
            g.fillCircle(x, y + 2, 8);
            g.fillStyle(0xff6600, 0.8);
            g.fillRect(x - 1, y - 8, 2, 5);
            g.fillCircle(x, y - 8, 3);
        } else if (item.id === 'heart_crystal') {
            g.fillTriangle(x, y + 8, x - 9, y - 2, x + 9, y - 2);
            g.fillCircle(x - 5, y - 4, 5);
            g.fillCircle(x + 5, y - 4, 5);
        } else if (item.id === 'xp_scroll' || item.id === 'map_scroll') {
            g.fillRoundedRect(x - 6, y - 6, 12, 16, 2);
            g.fillCircle(x - 6, y - 6, 3);
            g.fillCircle(x + 6, y - 6, 3);
            g.fillCircle(x - 6, y + 10, 3);
            g.fillCircle(x + 6, y + 10, 3);
        } else if (item.type === 'consumable') {
            g.fillRoundedRect(x - 5, y - 2, 10, 12, 3);
            g.fillRect(x - 3, y - 5, 6, 4);
            g.fillStyle(0xffffff, 0.3);
            g.fillCircle(x - 2, y + 2, 2);
        } else if (item.type === 'weapon') {
            g.fillRect(x - 2, y - hs + 2, 4, s * 0.55);
            g.fillRect(x - hs / 2, y, hs, s / 5);
        } else if (item.type === 'mineral' && item.subtype === 'crystal') {
            g.fillTriangle(x, y - 8, x - 6, y, x + 6, y);
            g.fillTriangle(x - 6, y, x + 6, y, x, y + 8);
            g.fillStyle(0xffffff, 0.4);
            g.fillTriangle(x, y - 8, x - 3, y - 1, x + 2, y - 1);
            g.fillStyle(0xffffff, 0.6);
            g.fillCircle(x - 1, y - 3, 1);
        } else if (item.type === 'mineral') {
            g.fillTriangle(x - 7, y + 5, x + 8, y + 6, x + 2, y - 7);
            g.fillTriangle(x - 8, y + 5, x + 3, y + 6, x - 4, y - 5);
            g.fillStyle(0xffffff, 0.2);
            g.fillTriangle(x - 2, y - 6, x + 4, y - 2, x - 4, y);
        } else if (item.type === 'fuel' && item.id === 'coal') {
            g.fillStyle(0x222222, 0.85);
            g.fillCircle(x - 2, y + 2, 5);
            g.fillCircle(x + 3, y - 1, 4);
        } else if (item.type === 'fuel') {
            g.fillRoundedRect(x - 7, y - 3, 14, 6, 2);
            g.fillStyle(0x664422, 0.7);
            g.fillCircle(x - 7, y, 3);
            g.fillCircle(x + 7, y, 3);
        } else if (item._chemType === 'potion' || item._chemType === 'medicine') {
            g.fillRoundedRect(x - 3, y - 1, 6, 9, 2);
            g.fillRect(x - 1, y - 4, 3, 4);
            g.fillStyle(0xffffff, 0.3);
            g.fillCircle(x - 1, y + 2, 1.5);
        } else if (item._chemType === 'explosive') {
            g.fillCircle(x, y + 1, 6);
            g.fillStyle(0xffcc00, 0.9);
            g.fillRect(x, y - 6, 1, 4);
            g.fillCircle(x, y - 7, 1.5);
        } else if (item._chemType === 'acid') {
            g.fillRoundedRect(x - 3, y - 1, 6, 9, 2);
            g.fillRect(x - 1, y - 4, 3, 4);
            g.fillStyle(0xffffff, 0.4);
            g.fillCircle(x - 1, y + 1, 1.5);
            g.fillCircle(x + 1, y + 3, 1);
        } else {
            g.fillCircle(x, y, s / 3.5);
            g.fillStyle(0xffffff, 0.35);
            g.fillCircle(x - s / 8, y - s / 8, s / 8);
        }
    },

    drawOreIcon(g, px, py, s, mineral) {
        const cx = px + s / 2, cy = py + s / 2;
        const col = mineral.color;
        g.fillStyle(col, 0.85);
        g.fillTriangle(cx - 7, cy + 5, cx + 8, cy + 6, cx + 2, cy - 7);
        g.fillTriangle(cx - 8, cy + 5, cx + 3, cy + 6, cx - 4, cy - 5);
        g.fillStyle(0xffffff, 0.2);
        g.fillTriangle(cx - 2, cy - 6, cx + 4, cy - 2, cx - 4, cy);
        g.fillStyle(0x000000, 0.15);
        g.fillTriangle(cx - 7, cy + 5, cx + 8, cy + 6, cx, cy + 8);
    },

    drawCrystalIcon(g, px, py, s, crystal) {
        const cx = px + s / 2, cy = py + s / 2;
        const col = crystal.color;
        g.fillStyle(col, 0.9);
        g.fillTriangle(cx, cy - 8, cx - 6, cy, cx + 6, cy);
        g.fillTriangle(cx - 6, cy, cx + 6, cy, cx, cy + 8);
        g.fillStyle(0xffffff, 0.4);
        g.fillTriangle(cx, cy - 8, cx - 3, cy - 1, cx + 2, cy - 1);
        g.fillStyle(0xffffff, 0.6);
        g.fillCircle(cx - 1, cy - 3, 1);
    }
};
