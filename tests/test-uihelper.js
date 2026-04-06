// ─── UIHelper Tests ──────────────────────────────────────────────────────────

describe('UIHelper – clearDynamic', () => {
    it('clears an array of destroyable objects', () => {
        let destroyed = 0;
        const dyn = [
            { destroy() { destroyed++; } },
            { destroy() { destroyed++; } },
            null
        ];
        UIHelper.clearDynamic(dyn);
        expect(destroyed).toBe(2);
        expect(dyn.length).toBe(0);
    });

    it('handles empty array', () => {
        const dyn = [];
        UIHelper.clearDynamic(dyn);
        expect(dyn.length).toBe(0);
    });
});

describe('UIHelper – colorToHex', () => {
    it('converts integer to hex string', () => {
        expect(UIHelper.colorToHex(0xff7722)).toBe('#ff7722');
    });

    it('pads short colors with zeros', () => {
        expect(UIHelper.colorToHex(0x0000ff)).toBe('#0000ff');
    });

    it('handles zero', () => {
        expect(UIHelper.colorToHex(0)).toBe('#000000');
    });

    it('handles undefined as zero', () => {
        expect(UIHelper.colorToHex(undefined)).toBe('#000000');
    });
});

describe('UIHelper – updateTabButtons', () => {
    it('sets active button color and bold style', () => {
        const buttons = [
            { _color: '', _style: '', setColor(c) { this._color = c; }, setFontStyle(s) { this._style = s; } },
            { _color: '', _style: '', setColor(c) { this._color = c; }, setFontStyle(s) { this._style = s; } },
        ];
        UIHelper.updateTabButtons(buttons, ['a', 'b'], 'b', '#active', '#inactive');
        expect(buttons[0]._color).toBe('#inactive');
        expect(buttons[0]._style).toBe('normal');
        expect(buttons[1]._color).toBe('#active');
        expect(buttons[1]._style).toBe('bold');
    });
});
