// ─── Labyrint Hero – UI Theme ─────────────────────────────────────────────────
// Shared visual constants for overlay scenes. Use these instead of inlining
// hex literals so the look-and-feel can be tuned in one place.

const UI_COLORS = {
    // Panel backgrounds
    panelBgDark:    0x0a0608,   // smeltery / forge
    panelBgBlue:    0x0a0918,   // chem lab / accelerator
    panelBgPurple:  0x1a1830,   // skill tree
    panelBgAlpha:   0.82,
    overlayDim:     0x000000,
    overlayDimAlpha: 0.78,

    // Accents (numeric, for Phaser fillStyle / Rectangle)
    accentOrange:   0xff7722,
    accentYellow:   0xffcc44,
    accentBlue:     0x44aacc,
    accentGreen:    0x44cc88,
    accentRed:      0xcc4444,
    accentPurple:   0x8866ff,
    border:         0x44332a,
    borderLight:    0x665544,
};

// CSS hex strings, for Phaser Text style.color
const UI_TEXT = {
    primary:    '#ff7722',
    primaryHover: '#ffaa44',
    secondary:  '#ffcc44',
    secondaryHover: '#ffee88',
    info:       '#44aacc',
    infoHover:  '#88ccee',
    success:    '#44cc88',
    danger:     '#cc4444',
    muted:      '#667788',
    mutedDim:   '#556677',
    label:      '#887766',
    disabled:   '#445566',
    white:      '#ffffff',
};

const UI_FONTS = {
    family:     'monospace',
    title:      '20px',
    heading:    '18px',
    label:      '14px',
    body:       '13px',
    small:      '12px',
    tiny:       '11px',
};
