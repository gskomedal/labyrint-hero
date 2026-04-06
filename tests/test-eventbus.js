// ─── EventBus Tests ──────────────────────────────────────────────────────────

describe('EventBus – on/emit', () => {
    it('calls listener when event is emitted', () => {
        EventBus.off(); // reset
        let received = null;
        EventBus.on('test', (data) => { received = data; });
        EventBus.emit('test', 42);
        expect(received).toBe(42);
        EventBus.off();
    });

    it('supports multiple listeners', () => {
        EventBus.off();
        let a = 0, b = 0;
        EventBus.on('multi', () => { a++; });
        EventBus.on('multi', () => { b++; });
        EventBus.emit('multi');
        expect(a).toBe(1);
        expect(b).toBe(1);
        EventBus.off();
    });

    it('does nothing when emitting unknown event', () => {
        EventBus.off();
        EventBus.emit('nonexistent', { data: true });
        // Should not throw
        expect(true).toBeTrue();
    });
});

describe('EventBus – once', () => {
    it('fires only once', () => {
        EventBus.off();
        let count = 0;
        EventBus.once('singlefire', () => { count++; });
        EventBus.emit('singlefire');
        EventBus.emit('singlefire');
        expect(count).toBe(1);
        EventBus.off();
    });
});

describe('EventBus – unsubscribe', () => {
    it('stops receiving after unsubscribe', () => {
        EventBus.off();
        let count = 0;
        const unsub = EventBus.on('unsub-test', () => { count++; });
        EventBus.emit('unsub-test');
        expect(count).toBe(1);
        unsub();
        EventBus.emit('unsub-test');
        expect(count).toBe(1); // should still be 1
        EventBus.off();
    });
});

describe('EventBus – off', () => {
    it('removes all listeners for specific event', () => {
        EventBus.off();
        let count = 0;
        EventBus.on('specific', () => { count++; });
        EventBus.off('specific');
        EventBus.emit('specific');
        expect(count).toBe(0);
    });

    it('removes all listeners when called with no args', () => {
        EventBus.off();
        let a = 0, b = 0;
        EventBus.on('ev1', () => { a++; });
        EventBus.on('ev2', () => { b++; });
        EventBus.off();
        EventBus.emit('ev1');
        EventBus.emit('ev2');
        expect(a).toBe(0);
        expect(b).toBe(0);
    });
});
