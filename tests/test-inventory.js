// ─── Inventory Tests ─────────────────────────────────────────────────────────

describe('Inventory – basic operations', () => {
    it('starts with 10 empty backpack slots', () => {
        const inv = new Inventory();
        expect(inv.backpack.length).toBe(10);
        expect(inv.itemCount).toBe(0);
        expect(inv.isFull).toBeFalse();
    });

    it('adds a non-stackable item to first empty slot', () => {
        const inv = new Inventory();
        const sword = { id: 'iron_sword', type: 'weapon', name: 'Iron Sword', atk: 3 };
        expect(inv.addItem(sword)).toBeTrue();
        expect(inv.itemCount).toBe(1);
        expect(inv.backpack[0]).toBe(sword);
    });

    it('adds stackable consumables to same slot', () => {
        const inv = new Inventory();
        const pot = ITEM_DEFS.health_pot;
        expect(inv.addItem(pot)).toBeTrue();
        expect(inv.addItem(pot)).toBeTrue();
        expect(inv.itemCount).toBe(1);
        expect(inv.backpack[0].count).toBe(2);
    });

    it('limits stack size to 10', () => {
        const inv = new Inventory();
        const pot = ITEM_DEFS.health_pot;
        for (let i = 0; i < 10; i++) inv.addItem(pot);
        expect(inv.backpack[0].count).toBe(10);
        // 11th should create new stack
        inv.addItem(pot);
        expect(inv.backpack[1].count).toBe(1);
    });

    it('returns false when backpack is full', () => {
        const inv = new Inventory();
        const sword = { id: 'test_sword', type: 'weapon', name: 'Test' };
        for (let i = 0; i < 10; i++) inv.addItem({ ...sword, id: `sword_${i}` });
        expect(inv.isFull).toBeTrue();
        expect(inv.addItem(sword)).toBeFalse();
    });

    it('expands backpack with extra slots', () => {
        const inv = new Inventory();
        inv.expandBackpack(5);
        expect(inv.backpack.length).toBe(15);
    });

    it('drops a slot and returns the item def', () => {
        const inv = new Inventory();
        const pot = ITEM_DEFS.health_pot;
        inv.addItem(pot);
        inv.addItem(pot);
        const dropped = inv.dropSlot(0);
        expect(dropped).toBeDefined();
        expect(dropped.id).toBe('health_pot');
        expect(inv.backpack[0].count).toBe(1);
    });

    it('clears slot completely when last item dropped', () => {
        const inv = new Inventory();
        const pot = ITEM_DEFS.health_pot;
        inv.addItem(pot);
        inv.dropSlot(0);
        expect(inv.backpack[0]).toBeNull();
    });
});

describe('Inventory – equipment', () => {
    it('starts with no equipment', () => {
        const inv = new Inventory();
        expect(inv.equipped.weapon).toBeNull();
        expect(inv.equipped.armor).toBeNull();
    });
});

describe('Inventory – serialization', () => {
    it('serializes and deserializes backpack round-trip', () => {
        const inv = new Inventory();
        const pot = ITEM_DEFS.health_pot;
        inv.addItem(pot);
        inv.addItem(pot);
        inv.addItem(pot);

        const data = inv.serialize();
        expect(data.backpack[0].id).toBe('health_pot');
        expect(data.backpack[0].count).toBe(3);

        const hero = { attack: 1, defense: 0, critChance: 0, counterChance: 0, dodgeChance: 0, thornsDamage: 0 };
        const restored = Inventory.deserialize(data, hero);
        expect(restored.backpack[0].id).toBe('health_pot');
        expect(restored.backpack[0].count).toBe(3);
        expect(restored.itemCount).toBe(1);
    });

    it('preserves expanded backpack size', () => {
        const inv = new Inventory();
        inv.expandBackpack(5);
        const data = inv.serialize();
        expect(data.backpackSize).toBe(15);

        const hero = { attack: 1, defense: 0, critChance: 0, counterChance: 0, dodgeChance: 0, thornsDamage: 0 };
        const restored = Inventory.deserialize(data, hero);
        expect(restored.backpack.length).toBe(15);
    });
});
