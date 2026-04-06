// ─── Monster Tests ───────────────────────────────────────────────────────────
// Tests the pure logic of Monster (stats, damage, phase transitions).
// Monster requires a stub scene for Phaser graphics.

function makeMonsterStubScene(worldNum) {
    const stubGraphics = {
        setDepth() { return this; },
        clear() {},
        fillStyle() {},
        fillRect() {},
        fillCircle() {},
        fillEllipse() {},
        fillRoundedRect() {},
        fillTriangle() {},
        lineStyle() {},
        strokeRect() {},
        beginPath() {},
        arc() {},
        strokePath() {},
        lineBetween() {},
        x: 0, y: 0, scene: true, destroy() {}
    };
    return {
        worldNum: worldNum || 1,
        add: { graphics() { return { ...stubGraphics }; } },
        tweens: { killTweensOf() {}, add() {} }
    };
}

describe('Monster – construction', () => {
    it('creates goblin with correct defaults', () => {
        const scene = makeMonsterStubScene(1);
        const m = new Monster(scene, 5, 5, 'goblin');
        expect(m.type).toBe('goblin');
        expect(m.alive).toBeTrue();
        expect(m.hp).toBe(m.maxHp);
        expect(m.hp).toBeGreaterThan(0);
        expect(m.attack).toBeGreaterThan(0);
        expect(m.phase).toBe(1);
    });

    it('creates boss with scaling stats', () => {
        const scene = makeMonsterStubScene(5);
        const boss = new Monster(scene, 5, 5, 'boss');
        expect(boss.type).toBe('boss');
        expect(boss.maxHp).toBeGreaterThan(50);
        expect(boss.attack).toBeGreaterThan(3);
    });

    it('creates zone boss with higher stats than regular boss', () => {
        const scene = makeMonsterStubScene(5);
        const boss = new Monster(scene, 5, 5, 'boss');
        const zboss = new Monster(scene, 5, 5, 'zone_boss');
        expect(zboss.maxHp).toBeGreaterThan(boss.maxHp);
        expect(zboss.attack).toBeGreaterThan(boss.attack);
    });

    it('scales stats with world number', () => {
        const scene1 = makeMonsterStubScene(1);
        const scene5 = makeMonsterStubScene(5);
        const m1 = new Monster(scene1, 5, 5, 'orc');
        const m5 = new Monster(scene5, 5, 5, 'orc');
        expect(m5.maxHp).toBeGreaterThan(m1.maxHp);
    });
});

describe('Monster – takeDamage', () => {
    it('reduces HP', () => {
        const scene = makeMonsterStubScene(1);
        const m = new Monster(scene, 5, 5, 'goblin');
        const startHp = m.hp;
        m.takeDamage(2);
        expect(m.hp).toBe(startHp - 2);
        expect(m.alive).toBeTrue();
    });

    it('kills monster when HP reaches 0', () => {
        const scene = makeMonsterStubScene(1);
        const m = new Monster(scene, 5, 5, 'goblin');
        const result = m.takeDamage(m.hp + 10);
        expect(result).toBeTrue(); // true = died
        expect(m.alive).toBeFalse();
        expect(m.hp).toBe(0);
    });

    it('returns false when monster survives', () => {
        const scene = makeMonsterStubScene(1);
        const m = new Monster(scene, 5, 5, 'goblin');
        const result = m.takeDamage(1);
        expect(result).toBeFalse();
    });
});

describe('Monster – boss phase transition', () => {
    it('boss enters phase 2 at 50% HP', () => {
        const scene = makeMonsterStubScene(3);
        const boss = new Monster(scene, 5, 5, 'boss');
        expect(boss.phase).toBe(1);
        expect(boss.enraged).toBeFalse();

        // Deal enough damage to get below 50%
        const dmgNeeded = Math.ceil(boss.maxHp * 0.6);
        const result = boss.takeDamage(dmgNeeded);
        expect(result).toBe('enraged');
        expect(boss.phase).toBe(2);
        expect(boss.enraged).toBeTrue();
    });

    it('zone boss also enters phase 2', () => {
        const scene = makeMonsterStubScene(5);
        const zboss = new Monster(scene, 5, 5, 'zone_boss');
        const dmgNeeded = Math.ceil(zboss.maxHp * 0.6);
        const result = zboss.takeDamage(dmgNeeded);
        expect(result).toBe('enraged');
        expect(zboss.phase).toBe(2);
    });

    it('regular monster has no phase transition', () => {
        const scene = makeMonsterStubScene(1);
        const m = new Monster(scene, 5, 5, 'goblin');
        const result = m.takeDamage(1);
        expect(result).toBeFalse();
        expect(m.phase).toBe(1);
    });

    it('boss attack increases on enrage', () => {
        const scene = makeMonsterStubScene(3);
        const boss = new Monster(scene, 5, 5, 'boss');
        const baseAtk = boss.attack;
        const dmgNeeded = Math.ceil(boss.maxHp * 0.6);
        boss.takeDamage(dmgNeeded);
        expect(boss.attack).toBeGreaterThan(baseAtk);
    });
});
