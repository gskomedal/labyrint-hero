// ─── Labyrint Hero – Event Bus ───────────────────────────────────────────────
// Lightweight pub/sub system for inter-scene communication.
// Replaces direct scene.get() references with decoupled event passing.

const EventBus = (() => {
    const listeners = {};

    return {
        /** Subscribe to an event. Returns unsubscribe function. */
        on(event, callback) {
            if (!listeners[event]) listeners[event] = [];
            listeners[event].push(callback);
            return () => {
                listeners[event] = listeners[event].filter(cb => cb !== callback);
            };
        },

        /** Subscribe once – automatically removed after first call. */
        once(event, callback) {
            const unsub = this.on(event, (...args) => {
                unsub();
                callback(...args);
            });
            return unsub;
        },

        /** Emit an event with optional data. */
        emit(event, data) {
            if (!listeners[event]) return;
            for (const cb of listeners[event]) cb(data);
        },

        /** Remove all listeners for an event, or all events if no event specified. */
        off(event) {
            if (event) {
                delete listeners[event];
            } else {
                for (const key of Object.keys(listeners)) delete listeners[key];
            }
        }
    };
})();
