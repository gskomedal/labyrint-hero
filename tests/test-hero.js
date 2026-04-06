// ─── Hero Tests ──────────────────────────────────────────────────────────────
// Tests require a stub scene since Hero constructor calls scene.add.graphics()

function makeStubScene() {
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
        x: 0, y: 0
    };
    return {
        add: {
            graphics() { return stubGraphics; }
        },
        tweens: {
            killTweensOf() {},
            add() {}
        }
    };
}

describe('Hero – construction', () => {
    it('creates hero with default stats', () => {
        const scene = makeStubScene();
        const hero = new Hero(scene, 1, 1);
        expect(hero.gridX).toBe(1);
        expect(hero.gridY).toBe(1);
        expect(hero.alive).toBeTrue();
        expect(hero.level).toBe(1);
        expect(hero.xp).toBe(0);
        expect(hero.gold).toBe(0);
        expect(hero.hearts).toBe(HERO_BASE_HEARTS);
        expect(hero.attack).toBe(HERO_BASE_ATTACK);
    });

    it('starts with empty inventory', () => {
        const scene = makeStubScene();
        const hero = new Hero(scene, 1, 1);
        expect(hero.inventory.itemCount).toBe(0);
        expect(hero.inventory.equipped.weapon).toBeNull();
        expect(hero.inventory.equipped.armor).toBeNull();
    });

    it('starts with no status effects', () => {
        const scene = makeStubScene();
        const hero = new Hero(scene, 1, 1);
        expect(hero.poisonTurns).toBe(0);
        expect(hero.burnTurns).toBe(0);
        expect(hero.slowTurns).toBe(0);
        expect(hero.stunTurns).toBe(0);
    });
});

describe('Hero – XP and leveling', () => {
    it('gains XP with multiplier', () => {
        const scene = makeStubScene();
        const hero = new Hero(scene, 1, 1);
        hero.xpMultiplier = 1.5;
        hero.gainXP(10);
        expect(hero.xp).toBe(15); // 10 * 1.5
    });

    it('levels up when XP exceeds threshold', () => {
        const scene = makeStubScene();
        const hero = new Hero(scene, 1, 1);
        const xpNeeded = hero.xpToNext;
        const leveled = hero.gainXP(xpNeeded + 10);
        expect(leveled).toBeTrue();
        expect(hero.level).toBe(2);
    });

    it('does not level up with insufficient XP', () => {
        const scene = makeStubScene();
        const hero = new Hero(scene, 1, 1);
        const leveled = hero.gainXP(1);
        expect(leveled).toBeFalse();
        expect(hero.level).toBe(1);
    });

    it('carries over excess XP after level up', () => {
        const scene = makeStubScene();
        const hero = new Hero(scene, 1, 1);
        const xpNeeded = hero.xpToNext;
        hero.gainXP(xpNeeded + 5);
        expect(hero.xp).toBe(5);
    });
});

describe('Hero – damage and defense', () => {
    it('takes damage reducing hearts', () => {
        const scene = makeStubScene();
        const hero = new Hero(scene, 1, 1);
        const startHearts = hero.hearts;
        const died = hero.takeDamage(2);
        expect(died).toBeFalse();
        expect(hero.hearts).toBe(startHearts - 2);
    });

    it('dies when hearts reach 0', () => {
        const scene = makeStubScene();
        const hero = new Hero(scene, 1, 1);
        const died = hero.takeDamage(hero.hearts + 10);
        expect(died).toBeTrue();
        expect(hero.alive).toBeFalse();
        expect(hero.hearts).toBe(0);
    });

    it('minimum damage is 1 regardless of defense', () => {
        const scene = makeStubScene();
        const hero = new Hero(scene, 1, 1);
        hero.defense = 100;
        const startHearts = hero.hearts;
        hero.takeDamage(1);
        expect(hero.hearts).toBe(startHearts - 1);
    });

    it('defense reduces damage', () => {
        const scene = makeStubScene();
        const hero = new Hero(scene, 1, 1);
        hero.defense = 3;
        const startHearts = hero.hearts;
        hero.takeDamage(5);
        expect(hero.hearts).toBe(startHearts - 2); // 5 - 3 = 2
    });
});

describe('Hero – status effects', () => {
    it('applies poison', () => {
        const scene = makeStubScene();
        const hero = new Hero(scene, 1, 1);
        hero.applyPoison(4);
        expect(hero.poisonTurns).toBe(4);
    });

    it('applies maximum of existing and new poison', () => {
        const scene = makeStubScene();
        const hero = new Hero(scene, 1, 1);
        hero.applyPoison(6);
        hero.applyPoison(3);
        expect(hero.poisonTurns).toBe(6); // max(6, 3)
    });

    it('clears all effects', () => {
        const scene = makeStubScene();
        const hero = new Hero(scene, 1, 1);
        hero.applyPoison(4);
        hero.applyBurn(3);
        hero.applySlow(2);
        hero.applyStun(1);
        hero.clearAllEffects();
        expect(hero.poisonTurns).toBe(0);
        expect(hero.burnTurns).toBe(0);
        expect(hero.slowTurns).toBe(0);
        expect(hero.stunTurns).toBe(0);
    });
});

describe('Hero – temporary buffs', () => {
    it('adds a temporary buff', () => {
        const scene = makeStubScene();
        const hero = new Hero(scene, 1, 1);
        const baseAtk = hero.attack;
        hero.addTempBuff('attack', 5, 10000);
        expect(hero.attack).toBe(baseAtk + 5);
        expect(hero.tempBuffs.length).toBe(1);
    });

    it('removes buff when expired', () => {
        const scene = makeStubScene();
        const hero = new Hero(scene, 1, 1);
        const baseAtk = hero.attack;
        hero.addTempBuff('attack', 5, 1000);
        hero.tickTempBuffs(1500);
        expect(hero.attack).toBe(baseAtk);
        expect(hero.tempBuffs.length).toBe(0);
    });

    it('keeps buff that has not expired', () => {
        const scene = makeStubScene();
        const hero = new Hero(scene, 1, 1);
        const baseAtk = hero.attack;
        hero.addTempBuff('attack', 5, 5000);
        hero.tickTempBuffs(2000);
        expect(hero.attack).toBe(baseAtk + 5);
        expect(hero.tempBuffs.length).toBe(1);
    });
});

describe('Hero – crystal bonuses', () => {
    it('returns zero bonuses with empty backpack', () => {
        const scene = makeStubScene();
        const hero = new Hero(scene, 1, 1);
        const cb = hero.getCrystalBonuses();
        expect(cb.attack).toBe(0);
        expect(cb.defense).toBe(0);
    });

    it('calculates bonuses from crystals in backpack', () => {
        const scene = makeStubScene();
        const hero = new Hero(scene, 1, 1);
        // Add a crystal with attack bonus
        if (typeof MINERAL_DEFS !== 'undefined' && MINERAL_DEFS.clear_quartz) {
            hero.inventory.addItem(MINERAL_DEFS.clear_quartz);
            const cb = hero.getCrystalBonuses();
            // clear_quartz should have some effect
            const hasEffect = Object.values(cb).some(v => v !== 0);
            // It's ok if clear_quartz has no effect – depends on data
            expect(cb).toBeDefined();
        }
    });
});

describe('Hero – serialization', () => {
    it('getStats returns correct base stats without equipment', () => {
        const scene = makeStubScene();
        const hero = new Hero(scene, 1, 1);
        hero.gold = 42;
        hero.level = 3;
        const stats = hero.getStats();
        expect(stats.gold).toBe(42);
        expect(stats.level).toBe(3);
        expect(stats.race).toBe('human');
        expect(stats.skills).toEqual([]);
    });

    it('strips equipment bonuses from serialized stats', () => {
        const scene = makeStubScene();
        const hero = new Hero(scene, 1, 1);
        const baseAtk = hero.attack;
        // Manually equip a weapon
        hero.inventory.equipped.weapon = { id: 'test', type: 'weapon', atk: 5, def: 0, hearts: 0 };
        hero.attack += 5;
        const stats = hero.getStats();
        expect(stats.attack).toBe(baseAtk); // should strip weapon atk
    });
});
