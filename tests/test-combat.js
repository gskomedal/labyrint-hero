// ─── CombatManager Tests ─────────────────────────────────────────────────────
// Tests the pure damage calculation helpers extracted from CombatManager.

describe('CombatManager.calculateHeroDamage – basic', () => {
    it('returns base attack + roll when no crystal bonuses', () => {
        const result = CombatManager.calculateHeroDamage(
            5,                          // heroAttack
            { attack: 0, critChance: 0 }, // crystalBonuses
            0,                          // heroCritChance
            2,                          // roll = 2
            0.99                        // critRoll = no crit
        );
        expect(result.damage).toBe(7); // 5 + 0 + 2
        expect(result.isCrit).toBeFalse();
    });

    it('adds crystal attack bonus', () => {
        const result = CombatManager.calculateHeroDamage(
            5,
            { attack: 3, critChance: 0 },
            0,
            1,   // roll
            0.99 // no crit
        );
        expect(result.damage).toBe(9); // 5 + 3 + 1
    });

    it('doubles damage on critical hit', () => {
        const result = CombatManager.calculateHeroDamage(
            5,
            { attack: 0, critChance: 0 },
            0.5,  // 50% crit chance
            0,    // roll = 0
            0.1   // critRoll < 0.5, so crit
        );
        expect(result.damage).toBe(10); // (5 + 0 + 0) * 2
        expect(result.isCrit).toBeTrue();
    });

    it('does not crit when roll exceeds crit chance', () => {
        const result = CombatManager.calculateHeroDamage(
            5,
            { attack: 0, critChance: 0.1 },
            0.1,
            0,
            0.99 // 0.99 > 0.2 total crit, no crit
        );
        expect(result.isCrit).toBeFalse();
    });

    it('combines hero and crystal crit chance', () => {
        const result = CombatManager.calculateHeroDamage(
            3,
            { attack: 0, critChance: 0.3 },
            0.2, // total = 0.5
            0,
            0.4  // 0.4 < 0.5, crit!
        );
        expect(result.isCrit).toBeTrue();
        expect(result.damage).toBe(6); // (3 + 0 + 0) * 2
    });
});

describe('CombatManager.calculateMonsterDamage', () => {
    it('returns base attack when bonus roll >= 0.3', () => {
        const dmg = CombatManager.calculateMonsterDamage(4, 0.5);
        expect(dmg).toBe(4);
    });

    it('returns base attack + 1 when bonus roll < 0.3', () => {
        const dmg = CombatManager.calculateMonsterDamage(4, 0.1);
        expect(dmg).toBe(5);
    });

    it('works with zero attack', () => {
        const dmg = CombatManager.calculateMonsterDamage(0, 0.5);
        expect(dmg).toBe(0);
    });

    it('boundary: roll exactly 0.3 gives no bonus', () => {
        const dmg = CombatManager.calculateMonsterDamage(3, 0.3);
        expect(dmg).toBe(3);
    });
});
