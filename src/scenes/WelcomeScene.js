// ─── Labyrint Hero – WelcomeScene ────────────────────────────────────────────
// Multi-page intro overlay launched the first time the player visits the
// main menu. Auto-marks itself as seen on dismissal. Can be re-opened from
// MenuScene's [ INTRO ]-button at any time.
//
// Pages:
//   1. Atmospheric lore — who you are and where you have descended
//   2. The hero — race, level, ability tree
//   3. The labyrinth — worlds, special rooms, mineral collection
//   4. Controls and basic mechanics
//
// Closes via [ START EVENTYRET ] on the last page, the [×] button, ESC,
// or by clicking outside the panel. Every dismissal calls
// SaveManager.markIntroSeen() so the popup stops auto-opening.

class WelcomeScene extends Phaser.Scene {
    constructor() { super({ key: 'WelcomeScene' }); }

    create() {
        const { width: W, height: H } = this.cameras.main;
        const cx = W / 2, cy = H / 2;

        this._currentPage = 0;
        this._pages = this._buildPageContent();

        // ── Dim backdrop (click-outside dismisses) ────────────────────────────
        this.add.rectangle(cx, cy, W, H, 0x000000, 0.85)
            .setInteractive()
            .on('pointerdown', () => this._close());

        // ── Panel ─────────────────────────────────────────────────────────────
        const panelW = Math.min(W - 60, 760);
        const panelH = Math.min(H - 60, 620);
        const px = cx - panelW / 2;
        const py = cy - panelH / 2;

        // Block click-through inside the panel
        const panelHit = this.add.rectangle(cx, cy, panelW, panelH, 0x000000, 0.001)
            .setInteractive();
        panelHit.on('pointerdown', (p, _x, _y, ev) => ev.stopPropagation());

        const panel = this.add.graphics();
        panel.fillStyle(0x0c0a1c, 0.98);
        panel.fillRoundedRect(px, py, panelW, panelH, 10);
        panel.lineStyle(2, 0xb89766);
        panel.strokeRoundedRect(px, py, panelW, panelH, 10);

        // Decorative inner border
        panel.lineStyle(1, 0x6a4a22, 0.6);
        panel.strokeRoundedRect(px + 8, py + 8, panelW - 16, panelH - 16, 8);

        // Decorative corner runes (mirrors MenuScene aesthetic)
        const drawRune = (rx, ry) => {
            panel.fillStyle(0x6a4a22, 0.55);
            panel.fillRect(rx - 6, ry - 1, 12, 2);
            panel.fillRect(rx - 1, ry - 6, 2, 12);
        };
        drawRune(px + 22, py + 22);
        drawRune(px + panelW - 22, py + 22);
        drawRune(px + 22, py + panelH - 22);
        drawRune(px + panelW - 22, py + panelH - 22);

        // ── Header (title + close X) ──────────────────────────────────────────
        this._titleText = this.add.text(cx, py + 30, '', {
            fontSize: '20px', color: '#f5e642', fontFamily: 'monospace',
            fontStyle: 'bold', stroke: '#5a4a00', strokeThickness: 2
        }).setOrigin(0.5);

        this._subtitleText = this.add.text(cx, py + 56, '', {
            fontSize: '12px', color: '#b89766', fontFamily: 'monospace', fontStyle: 'italic'
        }).setOrigin(0.5);

        this.add.rectangle(cx, py + 76, panelW - 80, 1, 0x6a4a22);

        const closeBtn = this.add.text(px + panelW - 24, py + 24, '✕', {
            fontSize: '20px', color: '#887766', fontFamily: 'monospace'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        closeBtn.on('pointerover', () => closeBtn.setColor('#ff8866'));
        closeBtn.on('pointerout',  () => closeBtn.setColor('#887766'));
        closeBtn.on('pointerdown', (p, _x, _y, ev) => { ev.stopPropagation(); this._close(); });

        // ── Body text area ────────────────────────────────────────────────────
        this._bodyArea = {
            x: px + 32,
            y: py + 90,
            w: panelW - 64,
            h: panelH - 90 - 70, // leave room for nav row
        };
        this._bodyText = this.add.text(this._bodyArea.x, this._bodyArea.y, '', {
            fontSize: '14px', color: '#ddd2b8', fontFamily: 'monospace',
            wordWrap: { width: this._bodyArea.w }, lineSpacing: 6
        });

        // ── Page-dot indicator ────────────────────────────────────────────────
        this._dotsGfx = this.add.graphics();

        // ── Navigation buttons ────────────────────────────────────────────────
        const navY = py + panelH - 32;
        this._prevBtn = this.add.text(px + 28, navY, '< FORRIGE', {
            fontSize: '14px', color: '#8899bb', fontFamily: 'monospace'
        }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
        this._prevBtn.on('pointerover', () => { if (this._currentPage > 0) this._prevBtn.setColor('#bbccdd'); });
        this._prevBtn.on('pointerout',  () => this._prevBtn.setColor(this._currentPage > 0 ? '#8899bb' : '#33445a'));
        this._prevBtn.on('pointerdown', (p, _x, _y, ev) => { ev.stopPropagation(); this._prev(); });

        this._nextBtn = this.add.text(px + panelW - 28, navY, 'NESTE >', {
            fontSize: '14px', color: '#ccaa77', fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
        this._nextBtn.on('pointerover', () => this._nextBtn.setAlpha(0.7));
        this._nextBtn.on('pointerout',  () => this._nextBtn.setAlpha(1));
        this._nextBtn.on('pointerdown', (p, _x, _y, ev) => { ev.stopPropagation(); this._next(); });

        // Skip hint (only shown when intro auto-opened on first visit)
        const wasFirstVisit = !SaveManager.hasSeenIntro();
        if (wasFirstVisit) {
            this.add.text(cx, py + panelH + 18, 'Klikk utenfor eller trykk ESC for å hoppe over',
                { fontSize: '11px', color: '#556677', fontFamily: 'monospace' }
            ).setOrigin(0.5);
        }

        // ── Keyboard navigation ───────────────────────────────────────────────
        this.input.keyboard.on('keydown-ESC',   () => this._close());
        this.input.keyboard.on('keydown-RIGHT', () => this._next());
        this.input.keyboard.on('keydown-LEFT',  () => this._prev());
        this.input.keyboard.on('keydown-SPACE', () => this._next());

        // ── Render initial page ───────────────────────────────────────────────
        this._renderPage();
    }

    // ── Page navigation ───────────────────────────────────────────────────────

    _next() {
        if (this._currentPage < this._pages.length - 1) {
            this._currentPage++;
            this._renderPage();
        } else {
            this._close();
        }
    }

    _prev() {
        if (this._currentPage > 0) {
            this._currentPage--;
            this._renderPage();
        }
    }

    _renderPage() {
        const page = this._pages[this._currentPage];
        this._titleText.setText(page.title);
        this._subtitleText.setText(page.subtitle || '');
        this._bodyText.setText(page.body);

        // Prev button enabled state
        const canPrev = this._currentPage > 0;
        this._prevBtn.setColor(canPrev ? '#8899bb' : '#33445a');
        this._prevBtn.input.cursor = canPrev ? 'pointer' : 'default';

        // Next button label changes on last page
        const isLast = this._currentPage === this._pages.length - 1;
        this._nextBtn.setText(isLast ? '[ START EVENTYRET ]' : 'NESTE >');

        // Page dots
        this._renderDots();
    }

    _renderDots() {
        this._dotsGfx.clear();
        const cx = this.cameras.main.width / 2;
        const y = this.cameras.main.height / 2 + 270;
        const total = this._pages.length;
        const spacing = 14;
        const startX = cx - ((total - 1) * spacing) / 2;
        for (let i = 0; i < total; i++) {
            const active = i === this._currentPage;
            this._dotsGfx.fillStyle(active ? 0xccaa77 : 0x554433, 1);
            this._dotsGfx.fillCircle(startX + i * spacing, y, active ? 4 : 3);
        }
    }

    _close() {
        SaveManager.markIntroSeen();
        this.scene.stop();
    }

    // ── Page content (Norwegian) ──────────────────────────────────────────────

    _buildPageContent() {
        return [
            {
                title: 'LABYRINT HERO',
                subtitle: 'Et eventyr i stein, ild og grunnstoffer',
                body:
                    'Langt under verdens grønne overflate ligger de eldgamle ' +
                    'labyrintene. Fjellet selv puster — sprekker hvisker, ' +
                    'krystaller gløder svakt, og skygger beveger seg der ingen ' +
                    'fakkel når.\n\n' +
                    'Du er en geolog-helt: en eventyrer som har studert berg ' +
                    'og malm i årevis, og som nå går ned for å samle alt det ' +
                    'periodiske systemet kan tilby.\n\n' +
                    'Fem geologiske soner skiller deg fra kjernen — ' +
                    'skoglabyrinten, grunnfjellet, dyplagene, underverden og ' +
                    'kjernens hjerte. Hver sone har sin egen estetikk, sine ' +
                    'monstre, og sine sjeldne mineraler.\n\n' +
                    'Bare den som henter alle 118 grunnstoffene blir kronet ' +
                    'med «Guds periodiske system».'
            },
            {
                title: 'HELTEN',
                subtitle: 'Velg rase, voks i kraft',
                body:
                    'Før du stiger ned velger du hvem du vil være. Fire raser, ' +
                    'fire spillestiler:\n\n' +
                    '  • Menneske  — balansert, +25% XP\n' +
                    '  • Dverg     — ekstra forsvar, ser malm lettere\n' +
                    '  • Alv       — lengre synsfelt, lettere på foten\n' +
                    '  • Hobbit    — motstand mot feller, raskere fottrinn\n\n' +
                    'Du velger også en startbonus (et ekstra hjerte, mer angrep ' +
                    'eller bedre syn) og vanskelighetsgrad.\n\n' +
                    'Etter hvert som du dreper monstre stiger du i nivå, og hver ' +
                    'gang får du velge én av tre tilfeldige evner fra seks tre: ' +
                    'Kriger, Villmarksjeger, Geolog, Metallurg, Kjemiker eller ' +
                    'Fysiker. Geologen ser mineraler tydeligere; kjemikeren lager ' +
                    'bomber og giftpiler; fysikeren bygger akseleratoren som ' +
                    'syntetiserer de tyngste grunnstoffene.\n\n' +
                    'Helten din lever videre mellom forsøk: død nullstiller bare ' +
                    'verden — nivå, evner, gull og inventar består.'
            },
            {
                title: 'LABYRINTEN',
                subtitle: '25 verdener · 5 soner · uendelige mineraler',
                body:
                    'Hver verden er en prosedyregenerert labyrint. Du leter deg ' +
                    'frem til utgangen — men før du kan gå videre må verdens ' +
                    'boss falle.\n\n' +
                    'Underveis møter du spesielle rom som belønner utforsking:\n\n' +
                    '  • Steinbrudd        — vanlige malmer (T1–T2)\n' +
                    '  • Krystallhule      — gemstones med passive bonuser\n' +
                    '  • Malmkammer        — sjeldne malmer (T3+)\n' +
                    '  • Hydrotermisk åre  — episke mineraler (T4+)\n' +
                    '  • Magmakammer       — legendariske/mytiske (T5–T6)\n' +
                    '  • Gasslomme         — fanger edelgasser direkte (V10+)\n' +
                    '  • Leir              — smelt malm, hvil ut, lag kjemi\n\n' +
                    'Plukk opp mineraler ved å gå over dem. I leiren kan du ' +
                    'smelte dem til rene grunnstoffer, lage legeringer (Smelter), ' +
                    'kjemiske forbindelser (Kjemilab) og — etter hvert — ' +
                    'syntetisere transurane grunnstoffer (Akselerator).\n\n' +
                    'Hver sone-boss du beseirer låser opp et nytt verksted og ' +
                    'fører deg dypere mot kjernen.'
            },
            {
                title: 'SLIK SPILLER DU',
                subtitle: 'Kontroller, kjernemekanikk og snarveier',
                body:
                    'Bevegelse:\n' +
                    '  WASD eller Piltaster   — gå ett tile om gangen\n' +
                    '  Mus / touch            — klikk en tile for å gå dit\n\n' +
                    'Kamp:\n' +
                    '  SPACE eller F          — angrep nærkamp / hakk vegg\n' +
                    '  R                      — skyt pil (krever piler)\n' +
                    '  Bump-angrep            — gå inn i monster = angrep\n\n' +
                    'Inventar og fremgang:\n' +
                    '  E                      — åpne inventar (med mineral-wiki)\n' +
                    '  T                      — ferdighetstre\n' +
                    '  B                      — elementbok (periodisk system)\n' +
                    '  M                      — toggle minikart\n' +
                    '  ESC                    — meny / lukke overlay\n\n' +
                    'Tips:\n' +
                    '  • Alle endringer lagres automatisk når du går til neste verden\n' +
                    '  • Sjekk MINERAL-WIKI fra hovedmenyen for å se hvilke ' +
                    'mineraler som gir hvilke grunnstoffer\n' +
                    '  • MANGLENDE-fanen i wikien viser hvilke grunnstoffer du ' +
                    'fortsatt jakter på\n' +
                    '  • Geolog-evner identifiserer ukjente mineraler\n' +
                    '  • Brann, gift og frost varer i flere ticks — bruk dem på bosser'
            }
        ];
    }
}
