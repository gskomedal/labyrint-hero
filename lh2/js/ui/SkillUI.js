// ─── Labyrint Hero 2 – Skill tree overlay ────────────────────────────────────
// Opened with K (or via the HUD when points are available). Spend skill
// points from level-ups on LH1-style specialization paths.

class SkillUI {
    constructor(hero) {
        this.hero = hero;
        this.el = document.getElementById('overlay-skills');
        this.open = false;

        window.addEventListener('keydown', (e) => {
            if (e.code === 'KeyK') {
                if (this.open) this.hide();
                else if (!LH2Main.uiOpen) this.show();
            } else if (e.code === 'Escape' && this.open) {
                this.hide();
            }
        });
    }

    show() {
        this.open = true;
        LH2Main.uiOpen = true;
        if (LH2Main.cameraRig) LH2Main.cameraRig.unlock();
        this._render();
        this.el.classList.remove('hidden');
    }

    hide() {
        this.open = false;
        LH2Main.uiOpen = false;
        this.el.classList.add('hidden');
    }

    _render() {
        let pathsHtml = '';
        for (const path of SKILLS2) {
            let rows = '';
            for (const skill of path.skills) {
                const stacks = this.hero.skillStacks(skill.id);
                const maxed = stacks >= skill.max;
                const canLearn = this.hero.skillPoints > 0 && !maxed;
                const pips = '●'.repeat(stacks) + '○'.repeat(skill.max - stacks);
                rows += `
                    <div class="smelt-row">
                        <span class="smelt-name"><b>${skill.name}</b> <span style="color:${path.color}">${pips}</span><br>
                            <span class="smelt-meta">${skill.desc}</span></span>
                        <button data-skill="${skill.id}" ${canLearn ? '' : 'disabled'}>${maxed ? 'Maks' : 'Lær'}</button>
                    </div>`;
            }
            pathsHtml += `
                <div class="skill-path">
                    <h3 style="color:${path.color}">${path.name}</h3>
                    ${rows}
                </div>`;
        }

        this.el.innerHTML = `
            <div class="overlay-panel">
                <button class="overlay-close">Lukk [K]</button>
                <h2>Ferdigheter</h2>
                <div class="energy-info">Nivå ${this.hero.level} &middot; ${this.hero.skillPoints} ferdighetspoeng
                    &middot; ATK ${this.hero.attack} &middot; DEF ${this.hero.defense}</div>
                <div class="skill-paths">${pathsHtml}</div>
            </div>`;

        this.el.querySelector('.overlay-close').addEventListener('click', () => this.hide());
        this.el.querySelectorAll('[data-skill]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.hero.learnSkill(btn.dataset.skill)) {
                    const def = SKILLS2_BY_ID[btn.dataset.skill];
                    EventBus.emit('lh2Toast', { text: `Lærte ${def.name}!`, cls: 'levelup' });
                    this._render();
                }
            });
        });
    }
}
