// tests/model/entities/FruitState.test.js

import { FruitState } from '../../../src/model/entities/FruitState.js';
import {
    resetEntityCounters
} from '../../../src/model/ModelEntity.js';

describe('FruitState', () => {
    let fruit;

    beforeEach(() => {
        resetEntityCounters();
        fruit = new FruitState(13, 27);
    });

    describe('constructor', () => {
        test('should initialize with grid position', () => {
            expect(fruit.gridX).toBe(13);
            expect(fruit.gridY).toBe(27);
            expect(fruit.type).toBe('fruit');
        });

        test('should initialize inactive', () => {
            expect(fruit.active).toBe(false);
        });

        test('should initialize animation state', () => {
            expect(fruit.bobOffset).toBe(0);
            expect(fruit.bobDirection).toBe(1);
        });
    });

    describe('update', () => {
        test('should return empty events when inactive', () => {
            const events = fruit.update(0.1);

            expect(events).toEqual([]);
        });

        test('should decrease timer when active', () => {
            fruit.activate(1);
            const initialTimer = fruit.timer;

            fruit.update(0.5);

            expect(fruit.timer).toBeLessThan(initialTimer);
        });

        test('should return expired event when timer runs out', () => {
            fruit.activate(1);
            fruit.timer = 0.1;

            const events = fruit.update(0.2);

            expect(events.length).toBeGreaterThan(0);
            expect(events[0].type).toBe('fruit_expired');
        });
    });

    describe('updateBobAnimation', () => {
        test('should update bob offset', () => {
            fruit.updateBobAnimation(0.1);

            expect(fruit.bobOffset).not.toBe(0);
        });

        test('should reverse direction at max bob', () => {
            fruit.bobOffset = fruit.bobAmount - 0.1;

            fruit.updateBobAnimation(0.2);

            expect(fruit.bobDirection).toBe(-1);
        });
    });

    describe('activate', () => {
        test('should set active to true', () => {
            fruit.activate(1);

            expect(fruit.active).toBe(true);
        });

        test('should set timer', () => {
            fruit.activate(1);

            expect(fruit.timer).toBeGreaterThan(0);
        });

        test('should set score based on level', () => {
            fruit.activate(1);

            expect(fruit.score).toBeGreaterThan(0);
        });
    });

    describe('deactivate', () => {
        test('should set active to false', () => {
            fruit.activate(1);
            fruit.deactivate();

            expect(fruit.active).toBe(false);
        });

        test('should reset timer', () => {
            fruit.activate(1);
            fruit.deactivate();

            expect(fruit.timer).toBe(0);
        });
    });

    describe('canBeEaten', () => {
        test('should return false when inactive', () => {
            const result = fruit.canBeEaten({ x: 100, y: 100 });

            expect(result).toBe(false);
        });

        test('should return false when position is null', () => {
            fruit.active = true;

            const result = fruit.canBeEaten(null);

            expect(result).toBe(false);
        });

        test('should return true when close enough', () => {
            fruit.activate(1);
            fruit.x = 100;
            fruit.y = 100;

            const result = fruit.canBeEaten({ x: 100, y: 100 });

            expect(result).toBe(true);
        });
    });

    describe('eat', () => {
        test('should return 0 when inactive', () => {
            const score = fruit.eat();

            expect(score).toBe(0);
        });

        test('should return score when active', () => {
            fruit.activate(1);
            const expectedScore = fruit.score;

            const score = fruit.eat();

            expect(score).toBe(expectedScore);
        });

        test('should deactivate after eating', () => {
            fruit.activate(1);
            fruit.eat();

            expect(fruit.active).toBe(false);
        });
    });

    describe('reset', () => {
        test('should reset to initial state', () => {
            fruit.activate(1);
            fruit.reset();

            expect(fruit.active).toBe(false);
            expect(fruit.timer).toBe(0);
            expect(fruit.score).toBe(0);
        });
    });

    describe('getFruitType', () => {
        test('should return fruit type info', () => {
            const type = fruit.getFruitType();

            expect(type).toBeDefined();
            expect(type.name).toBeDefined();
        });
    });

    describe('getVisualState', () => {
        test('should return visual properties', () => {
            const visual = fruit.getVisualState();

            expect(visual.active).toBeDefined();
            expect(visual.fruitType).toBeDefined();
            expect(visual.bobOffset).toBeDefined();
        });
    });

    describe('getSnapshot', () => {
        test('should return complete state snapshot', () => {
            const snapshot = fruit.getSnapshot();

            expect(snapshot.id).toBeDefined();
            expect(snapshot.type).toBe('fruit');
            expect(snapshot.active).toBeDefined();
            expect(snapshot.visual).toBeDefined();
        });
    });
});
