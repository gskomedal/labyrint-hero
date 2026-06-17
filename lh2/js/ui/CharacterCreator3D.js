// ─── Labyrint Hero 2 – 3D Character Creator ──────────────────────────────────
// Replaces LH1's 2D pixel-sprite creator with a live, rotating 3D figure
// (the same CharacterModel used in the world). HTML/CSS controls on the sides
// drive the appearance; a dedicated WebGL preview renders the result.

const CharacterCreator3D = {
    el: null,
    renderer: null,
    scene: null,
    camera: null,
    modelGroup: null,
    _raf: null,
    onComplete: null,

    // Working appearance + choices
    race: 'human',
    bonus: 'heart',
    name: '',
    appearance: null,

    open(onComplete) {
        this.onComplete = onComplete;
        this.el = document.getElementById('creator3d');
        this.race = 'human';
        this.bonus = 'heart';
        this.name = '';
        this.appearance = { ...defaultAppearance('human') };

        LH2Main.uiOpen = true;
        if (LH2Main.cameraRig) LH2Main.cameraRig.unlock();

        this._initPreview();   // create the persistent renderer/scene once
        this._buildDOM();      // builds controls + re-attaches the canvas
        this._rebuildModel();
        this.el.classList.remove('hidden');
        this._loop();
    },

    _close() {
        this.el.classList.add('hidden');
        if (this._raf) cancelAnimationFrame(this._raf);
        this._raf = null;
        LH2Main.uiOpen = false;
    },

    // ── Preview renderer ─────────────────────────────────────────────────────

    _initPreview() {
        if (this.renderer) return; // persistent across DOM rebuilds
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
        this.renderer.domElement.classList.add('cc-canvas-el');

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(40, 0.78, 0.1, 100);
        this.camera.position.set(0, 1.5, 6.4);
        this.camera.lookAt(0, 1.2, 0);

        // Studio lighting
        const key = new THREE.DirectionalLight(0xfff1dd, 2.6);
        key.position.set(4, 7, 6);
        key.castShadow = true;
        key.shadow.mapSize.set(1024, 1024);
        const rim = new THREE.DirectionalLight(0x88aaff, 1.4);
        rim.position.set(-5, 4, -4);
        const fill = new THREE.HemisphereLight(0xdde6ff, 0x404048, 1.1);
        this.scene.add(key, rim, fill);

        // Turntable pedestal
        const disc = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.7, 0.3, 24),
            new THREE.MeshLambertMaterial({ color: 0x2a2d3a, flatShading: true }),
        );
        disc.position.y = -0.15;
        disc.receiveShadow = true;
        this.scene.add(disc);

        this.turntable = new THREE.Group();
        this.scene.add(this.turntable);
    },

    /** Move the persistent renderer canvas into the current DOM + size it. */
    _attachCanvas() {
        const holder = this.el.querySelector('#cc-canvas-holder');
        if (!holder) return;
        holder.appendChild(this.renderer.domElement);
        const w = holder.clientWidth || 440, h = holder.clientHeight || 540;
        this.renderer.setSize(w, h, false);
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
    },

    _rebuildModel() {
        if (this.modelGroup) {
            this.turntable.remove(this.modelGroup);
            this.modelGroup.traverse(o => { if (o.geometry) o.geometry.dispose(); });
        }
        const built = CharacterModel.build(this.appearance, this.race);
        built.group.traverse(o => { if (o.isMesh) o.castShadow = true; });
        this.modelGroup = built.group;
        this.turntable.add(this.modelGroup);
    },

    _loop() {
        this._raf = requestAnimationFrame(() => this._loop());
        if (this.turntable) this.turntable.rotation.y += 0.012;
        if (this.renderer) this.renderer.render(this.scene, this.camera);
    },

    // ── DOM ────────────────────────────────────────────────────────────────

    _swatches(palette, current, onPick) {
        return palette.map((hex, i) => {
            const sel = hex === current ? ' sel' : '';
            return `<button class="cc-sw${sel}" data-i="${i}" style="background:#${hex.toString(16).padStart(6, '0')}"></button>`;
        }).join('');
    },

    _pills(values, labels, current, key) {
        return values.map(v =>
            `<button class="cc-pill${v === current ? ' sel' : ''}" data-key="${key}" data-val="${v}">${labels[v] || v}</button>`
        ).join('');
    },

    _buildDOM() {
        const a = this.appearance;
        const raceCards = Object.entries(RACE_DEFS).map(([id, r]) => `
            <button class="cc-race${id === this.race ? ' sel' : ''}" data-race="${id}">
                <div class="cc-race-name">${r.name}</div>
                <div class="cc-race-special">${r.special}</div>
                <div class="cc-race-stats">♥${r.hearts} ⚔${r.attack} ⛊${r.defense} 👁${r.visionRadius}</div>
            </button>`).join('');

        const bonusCards = START_BONUSES.map(b => `
            <button class="cc-bonus${b.id === this.bonus ? ' sel' : ''}" data-bonus="${b.id}"
                style="border-color:#${b.col.toString(16).padStart(6, '0')}">
                <b>${b.label}</b><br><span>${b.desc}</span></button>`).join('');

        this.el.innerHTML = `
          <div class="cc-wrap">
            <h1>LAG HELTEN DIN</h1>
            <div class="cc-cols">
              <div class="cc-col cc-left">
                <h3>Rase</h3>
                <div class="cc-races">${raceCards}</div>
                <div class="cc-race-desc">${RACE_DEFS[this.race].desc}</div>
              </div>
              <div class="cc-col cc-mid">
                <div id="cc-canvas-holder" class="cc-canvas"></div>
                <input id="cc-name" type="text" maxlength="14" placeholder="Heltenavn..." value="${this.name}">
              </div>
              <div class="cc-col cc-right">
                <h3>Utseende</h3>
                <label>Kjønn</label><div class="cc-row">${this._pills(GENDERS, GENDER_LABELS, a.gender, 'gender')}</div>
                <label>Hud</label><div class="cc-row" data-pal="skin">${this._swatches(SKIN_TONES, a.skinColor)}</div>
                <label>Hår</label><div class="cc-row" data-pal="hair">${this._swatches(HAIR_COLORS, a.hairColor)}</div>
                <label>Øyne</label><div class="cc-row" data-pal="eye">${this._swatches(EYE_COLORS, a.eyeColor)}</div>
                <label>Klesfarge</label><div class="cc-row" data-pal="cloth">${this._swatches(CLOTH_COLORS, a.clothColor)}</div>
                <label>Frisyre</label><div class="cc-row cc-wrap-row">${this._pills(HAIR_STYLES, HAIR_STYLE_LABELS, a.hairStyle, 'hairStyle')}</div>
                <label>Skjegg</label><div class="cc-row">${this._pills(BEARD_STYLES, BEARD_STYLE_LABELS, a.beardStyle, 'beardStyle')}</div>
                <label>Antrekk</label><div class="cc-row">${this._pills(CLOTH_STYLES, CLOTH_STYLE_LABELS, a.clothStyle, 'clothStyle')}</div>
              </div>
            </div>
            <div class="cc-foot">
              <div class="cc-bonuses"><span>Startbonus:</span>${bonusCards}</div>
              <button id="cc-start">START EVENTYR</button>
            </div>
          </div>`;

        // Race
        this.el.querySelectorAll('.cc-race').forEach(b => b.addEventListener('click', () => {
            this.race = b.dataset.race;
            // Reset appearance defaults for the race but keep it editable
            this.appearance = { ...defaultAppearance(this.race) };
            this._buildDOM(); this._rebuildModel();
        }));
        // Bonus
        this.el.querySelectorAll('.cc-bonus').forEach(b => b.addEventListener('click', () => {
            this.bonus = b.dataset.bonus; this._refreshSel('.cc-bonus', b);
        }));
        // Color swatches
        this.el.querySelectorAll('[data-pal]').forEach(row => {
            const pal = row.dataset.pal;
            const palette = { skin: SKIN_TONES, hair: HAIR_COLORS, eye: EYE_COLORS, cloth: CLOTH_COLORS }[pal];
            const field = { skin: 'skinColor', hair: 'hairColor', eye: 'eyeColor', cloth: 'clothColor' }[pal];
            row.querySelectorAll('.cc-sw').forEach(sw => sw.addEventListener('click', () => {
                this.appearance[field] = palette[+sw.dataset.i];
                this._refreshSel('[data-pal="' + pal + '"] .cc-sw', sw);
                this._rebuildModel();
            }));
        });
        // Style pills
        this.el.querySelectorAll('.cc-pill').forEach(p => p.addEventListener('click', () => {
            this.appearance[p.dataset.key] = p.dataset.val;
            this.el.querySelectorAll(`.cc-pill[data-key="${p.dataset.key}"]`).forEach(x => x.classList.remove('sel'));
            p.classList.add('sel');
            this._rebuildModel();
        }));
        // Name
        const nameInput = this.el.querySelector('#cc-name');
        nameInput.addEventListener('input', () => { this.name = nameInput.value; });
        nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') this._finish(); e.stopPropagation(); });
        // Start
        this.el.querySelector('#cc-start').addEventListener('click', () => this._finish());

        // Re-attach the persistent 3D preview canvas into the (re)built DOM
        this._attachCanvas();
    },

    _refreshSel(selector, active) {
        this.el.querySelectorAll(selector).forEach(x => x.classList.remove('sel'));
        active.classList.add('sel');
    },

    _finish() {
        const name = (this.name || '').trim() || RACE_DEFS[this.race].name;
        const result = {
            race: this.race,
            heroName: name,
            appearance: { ...this.appearance },
            startBonus: this.bonus,
        };
        this._close();
        if (this.onComplete) this.onComplete(result);
    },
};
