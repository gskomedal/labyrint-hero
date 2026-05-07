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

describe('UIHelper – attachHover', () => {
    function fakeText(initialColor) {
        return {
            input: null,
            _color: initialColor,
            _handlers: {},
            setInteractive() { this.input = {}; return this; },
            setColor(c) { this._color = c; return this; },
            on(evt, fn) { this._handlers[evt] = fn; return this; },
            fire(evt) { if (this._handlers[evt]) this._handlers[evt](); }
        };
    }

    it('makes target interactive and wires hover/out/click', () => {
        const t = fakeText('#ff7722');
        let clicks = 0;
        UIHelper.attachHover(t, {
            hoverColor: '#ffaa44',
            normalColor: '#ff7722',
            onClick: () => clicks++,
        });
        expect(t.input).not.toBe(null);
        t.fire('pointerover'); expect(t._color).toBe('#ffaa44');
        t.fire('pointerout');  expect(t._color).toBe('#ff7722');
        t.fire('pointerdown'); expect(clicks).toBe(1);
    });

    it('skips hover handlers when colors not provided', () => {
        const t = fakeText('#ff7722');
        UIHelper.attachHover(t, { onClick: () => {} });
        expect(t._handlers.pointerover).toBe(undefined);
        expect(t._handlers.pointerout).toBe(undefined);
        expect(typeof t._handlers.pointerdown).toBe('function');
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
