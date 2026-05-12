// ─── TooltipManager Tests ────────────────────────────────────────────────────

function fakeScene() {
    const tips = [];
    const events = {};
    return {
        _tips: tips,
        cameras: { main: { width: 800, height: 600 } },
        add: {
            text(x, y, t, style) {
                const obj = {
                    x, y, t, style,
                    _depth: 0, _origin: { x: 0, y: 0 },
                    destroyed: false,
                    setOrigin(ox, oy) { this._origin = { x: ox, y: oy }; return this; },
                    setDepth(d) { this._depth = d; return this; },
                    setX(v) { this.x = v; return this; },
                    setY(v) { this.y = v; return this; },
                    getBounds() {
                        return { left: this.x - 50, right: this.x + 50, top: this.y - 20, bottom: this.y };
                    },
                    destroy() { this.destroyed = true; },
                };
                tips.push(obj);
                return obj;
            }
        },
        events: {
            once(name, fn) { events[name] = fn; },
            _fire(name) { if (events[name]) events[name](); }
        },
    };
}

describe('TooltipManager – show/hide', () => {
    it('creates a tooltip text on show', () => {
        const s = fakeScene();
        const tm = new TooltipManager(s);
        tm.show(100, 100, 'Hi');
        expect(s._tips.length).toBe(1);
        expect(s._tips[0].t).toBe('Hi');
        expect(s._tips[0].destroyed).toBe(false);
    });

    it('replaces previous tooltip on consecutive show', () => {
        const s = fakeScene();
        const tm = new TooltipManager(s);
        tm.show(100, 100, 'first');
        tm.show(200, 200, 'second');
        expect(s._tips.length).toBe(2);
        expect(s._tips[0].destroyed).toBe(true);
        expect(s._tips[1].destroyed).toBe(false);
    });

    it('hide() destroys the active tooltip', () => {
        const s = fakeScene();
        const tm = new TooltipManager(s);
        tm.show(100, 100, 'x');
        tm.hide();
        expect(s._tips[0].destroyed).toBe(true);
    });

    it('hide() is idempotent', () => {
        const s = fakeScene();
        const tm = new TooltipManager(s);
        tm.hide();  // no-op
        tm.show(100, 100, 'x');
        tm.hide();
        tm.hide();  // again
        expect(s._tips[0].destroyed).toBe(true);
    });
});

describe('TooltipManager – auto-cleanup', () => {
    it('destroys active tooltip on scene shutdown', () => {
        const s = fakeScene();
        const tm = new TooltipManager(s);
        tm.show(50, 50, 'foo');
        s.events._fire('shutdown');
        expect(s._tips[0].destroyed).toBe(true);
    });
});
