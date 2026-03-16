// tests/model/ModelEntity.test.js

import {
    ModelEntity,
    generateEntityId,
    resetEntityCounters,
    getEntityCounters
} from '../../src/model/ModelEntity.js';
import { Direction } from '../../src/movement/core/Direction.js';

describe('ModelEntity', () => {
    let entity;

    beforeEach(() => {
        resetEntityCounters();
    });

    describe('generateEntityId', () => {
        test('should generate unique IDs with type prefix', () => {
            const id1 = generateEntityId('player');
            const id2 = generateEntityId('player');

            expect(id1).toBe('player_1');
            expect(id2).toBe('player_2');
        });

        test('should track counters per type', () => {
            const playerId = generateEntityId('player');
            const enemyId = generateEntityId('enemy');

            expect(playerId).toBe('player_1');
            expect(enemyId).toBe('enemy_1');
        });

        test('should use generic counter for unknown types', () => {
            const id = generateEntityId('unknown');
            expect(id).toBe('unknown_1');
        });
    });

    describe('resetEntityCounters', () => {
        test('should reset all counters to zero', () => {
            generateEntityId('player');
            generateEntityId('player');
            generateEntityId('enemy');

            resetEntityCounters();

            const counters = getEntityCounters();
            expect(counters.player).toBe(0);
            expect(counters.enemy).toBe(0);
        });
    });

    describe('constructor', () => {
        test('should initialize with grid position', () => {
            entity = new ModelEntity(5, 10);

            expect(entity.gridX).toBe(5);
            expect(entity.gridY).toBe(10);
            expect(entity.prevGridX).toBe(5);
            expect(entity.prevGridY).toBe(10);
        });

        test('should calculate pixel position from grid', () => {
            entity = new ModelEntity(5, 10, { type: 'test' });

            // Grid 5,10 with tileSize 20 = pixel 110, 210 (center)
            expect(entity.x).toBe(110);
            expect(entity.y).toBe(210);
        });

        test('should set default type', () => {
            entity = new ModelEntity(0, 0);

            expect(entity.type).toBe('generic');
            // Speed may be undefined if gameConfig.defaultSpeed is not set
        });

        test('should accept custom config', () => {
            entity = new ModelEntity(0, 0, { type: 'custom', speed: 100 });

            expect(entity.type).toBe('custom');
            expect(entity.speed).toBe(100);
        });

        test('should initialize direction buffer', () => {
            entity = new ModelEntity(0, 0);

            expect(entity.directionBuffer).toBeDefined();
        });

        test('should generate unique entity ID', () => {
            const e1 = new ModelEntity(0, 0, { type: 'player' });
            const e2 = new ModelEntity(0, 0, { type: 'player' });

            expect(e1.id).toBe('player_1');
            expect(e2.id).toBe('player_2');
        });
    });

    describe('setDesiredDirection', () => {
        beforeEach(() => {
            entity = new ModelEntity(0, 0);
        });

        test('should queue direction in buffer', () => {
            entity.setDesiredDirection(Direction.UP);

            expect(entity.nextDirection).toBe(Direction.UP);
        });
    });

    describe('getBufferedDirection', () => {
        beforeEach(() => {
            entity = new ModelEntity(0, 0);
        });

        test('should return buffered direction', () => {
            entity.setDesiredDirection(Direction.LEFT);

            const buffered = entity.getBufferedDirection();
            expect(buffered).toBe(Direction.LEFT);
        });
    });

    describe('clearDirectionBuffer', () => {
        beforeEach(() => {
            entity = new ModelEntity(0, 0);
        });

        test('should clear buffered direction', () => {
            entity.setDesiredDirection(Direction.UP);
            entity.clearDirectionBuffer();

            expect(entity.nextDirection).toBe(Direction.NONE);
        });
    });

    describe('setSpeedMultiplier', () => {
        beforeEach(() => {
            entity = new ModelEntity(0, 0, { speed: 100 });
        });

        test('should set speed multiplier', () => {
            entity.setSpeedMultiplier(2.0);

            expect(entity.speedMultiplier).toBe(2.0);
        });

        test('should affect effective speed', () => {
            entity.setSpeedMultiplier(2.0);

            expect(entity.getEffectiveSpeed()).toBe(200);
        });
    });

    describe('getGridPosition', () => {
        test('should return grid coordinates', () => {
            entity = new ModelEntity(5, 10);

            const pos = entity.getGridPosition();

            expect(pos.x).toBe(5);
            expect(pos.y).toBe(10);
        });
    });

    describe('getPixelPosition', () => {
        test('should return pixel coordinates', () => {
            entity = new ModelEntity(5, 10);

            const pos = entity.getPixelPosition();

            expect(pos.x).toBe(110);
            expect(pos.y).toBe(210);
        });
    });

    describe('getSnapshot', () => {
        test('should return serializable state', () => {
            entity = new ModelEntity(5, 10, { type: 'test', speed: 50 });

            const snapshot = entity.getSnapshot();

            expect(snapshot.id).toBeDefined();
            expect(snapshot.type).toBe('test');
            expect(snapshot.gridX).toBe(5);
            expect(snapshot.gridY).toBe(10);
            expect(snapshot.speed).toBe(50);
        });
    });

    describe('resetPosition', () => {
        test('should reset to new position', () => {
            entity = new ModelEntity(5, 10);
            entity.direction = Direction.UP;
            entity.moveProgress = 0.5;

            entity.resetPosition(3, 7);

            expect(entity.gridX).toBe(3);
            expect(entity.gridY).toBe(7);
            expect(entity.prevGridX).toBe(3);
            expect(entity.prevGridY).toBe(7);
            expect(entity.direction).toBe(Direction.NONE);
            expect(entity.moveProgress).toBe(0);
        });
    });

    describe('movement', () => {
        beforeEach(() => {
            entity = new ModelEntity(5, 10);
        });

        test('startMove should set movement state', () => {
            entity.startMove(5, 9, Direction.UP);

            expect(entity.targetGridX).toBe(5);
            expect(entity.targetGridY).toBe(9);
            expect(entity.direction).toBe(Direction.UP);
            expect(entity.isMoving).toBe(true);
            expect(entity.moveProgress).toBeGreaterThan(0);
        });

        test('completeMove should update grid position', () => {
            entity.startMove(5, 9, Direction.UP);
            entity.completeMove();

            expect(entity.gridX).toBe(5);
            expect(entity.gridY).toBe(9);
            expect(entity.isMoving).toBe(false);
            expect(entity.moveProgress).toBe(0);
        });

        test('updatePixelPosition should interpolate position', () => {
            entity.startMove(5, 9, Direction.UP);
            entity.moveProgress = 0.5;
            entity.updatePixelPosition();

            // Should be halfway between grid positions
            // Start: (110, 210), End: (110, 190)
            // Midpoint: (110, 200)
            expect(entity.x).toBe(110);
            expect(entity.y).toBe(200);
        });
    });

    describe('visual state', () => {
        beforeEach(() => {
            entity = new ModelEntity(0, 0);
        });

        test('should have default visual state', () => {
            expect(entity.visualState.scaleX).toBe(1);
            expect(entity.visualState.scaleY).toBe(1);
            expect(entity.visualState.alpha).toBe(1);
            expect(entity.visualState.visible).toBe(true);
        });
    });
});
