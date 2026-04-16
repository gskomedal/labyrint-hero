// ─── Labyrint Hero – Headless CI Test Runner ────────────────────────────────
// Boots a minimal static HTTP server, opens tests/test-runner.html in a
// headless Chromium via Playwright, waits for the suite to finish, and exits
// with a non-zero status if any test failed or a page error occurred.
//
// Run locally:
//   npm install --no-save playwright
//   npx playwright install chromium
//   node tests/ci-runner.js

const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const PORT = 8123;

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js':   'text/javascript; charset=utf-8',
    '.css':  'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg':  'image/svg+xml',
    '.png':  'image/png',
    '.ico':  'image/x-icon',
};

function serveFile(req, res) {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    const safe = path.normalize(urlPath).replace(/^([.][.][/\\])+/, '');
    let filePath = path.join(ROOT, safe);
    // Prevent escape from ROOT
    if (!filePath.startsWith(ROOT)) {
        res.writeHead(403); res.end('forbidden'); return;
    }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
    }
    fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end('not found: ' + safe); return; }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(data);
    });
}

(async () => {
    const server = http.createServer(serveFile);
    await new Promise(resolve => server.listen(PORT, resolve));
    console.log(`[ci] serving ${ROOT} on :${PORT}`);

    const browser = await chromium.launch();
    const page = await browser.newPage();

    const pageErrors = [];
    const consoleErrors = [];
    page.on('pageerror', err => pageErrors.push(err.message || String(err)));
    page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    let exitCode = 0;
    try {
        await page.goto(`http://localhost:${PORT}/tests/test-runner.html`, {
            waitUntil: 'load', timeout: 30000,
        });

        // The test framework updates document.title to start with ✓ or ✗ when done.
        await page.waitForFunction(
            () => /^[\u2713\u2717]/.test(document.title),
            null,
            { timeout: 30000 },
        );

        const title = await page.title();
        const summary = await page.$eval('.summary', el => el.textContent.trim());
        const failedTests = await page.$$eval('.test.fail', els =>
            els.map(e => e.textContent.trim()),
        );
        const errorDetails = await page.$$eval('.error-detail', els =>
            els.map(e => e.textContent.trim()),
        );

        console.log(`\n[ci] ${title}`);
        console.log(`[ci] ${summary}`);

        if (failedTests.length > 0) {
            console.log('\n[ci] failures:');
            failedTests.forEach((name, i) => {
                console.log(`  ${name}`);
                if (errorDetails[i]) console.log(`    ${errorDetails[i]}`);
            });
            exitCode = 1;
        }

        if (pageErrors.length > 0) {
            console.log('\n[ci] uncaught page errors:');
            pageErrors.forEach(e => console.log(`  ${e}`));
            exitCode = 1;
        }

        if (consoleErrors.length > 0) {
            console.log('\n[ci] console errors:');
            consoleErrors.forEach(e => console.log(`  ${e}`));
            exitCode = 1;
        }
    } catch (e) {
        console.error('[ci] runner failed:', e.message);
        exitCode = 1;
    } finally {
        await browser.close();
        server.close();
    }

    process.exit(exitCode);
})();
