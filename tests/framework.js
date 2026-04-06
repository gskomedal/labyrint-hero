// ─── Minimal Test Framework ──────────────────────────────────────────────────
// Browser-based test runner for Labyrint Hero. No dependencies.

const TestRunner = (() => {
    const suites = [];
    let currentSuite = null;

    function describe(name, fn) {
        currentSuite = { name, tests: [], passed: 0, failed: 0, errors: [] };
        suites.push(currentSuite);
        fn();
        currentSuite = null;
    }

    function it(name, fn) {
        if (!currentSuite) throw new Error('it() must be called inside describe()');
        currentSuite.tests.push({ name, fn });
    }

    function expect(actual) {
        return {
            toBe(expected) {
                if (actual !== expected) {
                    throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
                }
            },
            toEqual(expected) {
                const a = JSON.stringify(actual), b = JSON.stringify(expected);
                if (a !== b) throw new Error(`Expected ${b}, got ${a}`);
            },
            toBeTrue() {
                if (actual !== true) throw new Error(`Expected true, got ${JSON.stringify(actual)}`);
            },
            toBeFalse() {
                if (actual !== false) throw new Error(`Expected false, got ${JSON.stringify(actual)}`);
            },
            toBeNull() {
                if (actual !== null) throw new Error(`Expected null, got ${JSON.stringify(actual)}`);
            },
            toBeGreaterThan(n) {
                if (!(actual > n)) throw new Error(`Expected ${actual} > ${n}`);
            },
            toBeLessThan(n) {
                if (!(actual < n)) throw new Error(`Expected ${actual} < ${n}`);
            },
            toBeGreaterThanOrEqual(n) {
                if (!(actual >= n)) throw new Error(`Expected ${actual} >= ${n}`);
            },
            toContain(item) {
                if (Array.isArray(actual)) {
                    if (!actual.includes(item)) throw new Error(`Array does not contain ${JSON.stringify(item)}`);
                } else {
                    throw new Error('toContain requires an array');
                }
            },
            toBeDefined() {
                if (actual === undefined) throw new Error('Expected value to be defined');
            },
            toBeInstanceOf(cls) {
                if (!(actual instanceof cls)) throw new Error(`Expected instance of ${cls.name}`);
            }
        };
    }

    function run() {
        const output = document.getElementById('output');
        let totalPassed = 0, totalFailed = 0;

        for (const suite of suites) {
            const div = document.createElement('div');
            div.className = 'suite';
            let html = `<div class="suite-name">${suite.name}</div>`;

            for (const test of suite.tests) {
                try {
                    test.fn();
                    suite.passed++;
                    totalPassed++;
                    html += `<div class="test pass">✓ ${test.name}</div>`;
                } catch (e) {
                    suite.failed++;
                    totalFailed++;
                    suite.errors.push({ test: test.name, error: e.message });
                    html += `<div class="test fail">✗ ${test.name}</div>`;
                    html += `<div class="error-detail">${e.message}</div>`;
                }
            }

            div.innerHTML = html;
            output.appendChild(div);
        }

        const summary = document.createElement('div');
        summary.className = 'summary';
        const color = totalFailed === 0 ? 'pass' : 'fail';
        summary.innerHTML = `<span class="${color}">${totalPassed} passed, ${totalFailed} failed</span> (${totalPassed + totalFailed} total)`;
        output.appendChild(summary);

        // Set document title for quick status check
        document.title = totalFailed === 0
            ? `✓ All ${totalPassed} tests passed`
            : `✗ ${totalFailed} failed / ${totalPassed + totalFailed} total`;
    }

    // Expose globally
    window.describe = describe;
    window.it = it;
    window.expect = expect;

    return { run };
})();
