/**
 * Fruit Entity Tests (Optimized with Sprites)
 */

import Fruit from '../../src/entities/Fruit.js';
import { createMockScene } from '../utils/testHelpers.js';
import { fruitConfig } from '../../src/config/gameConfig.js';
import { msToSeconds } from '../../src/utils/Time.js';

describe('Fruit (Optimized with Sprites)', () => {
    let scene;
    let fruit;

    beforeEach(() => {
        scene = createMockScene();
        fruit = new Fruit(scene, 13, 17, 0);
    });

    describe('initialization', () => {
        test('should create sprite at correct position', () => {
            expect(fruit.x).toBe(270); // 13 * 20 + 10
            expect(fruit.y).toBe(350); // 17 * 20 + 10
        });

        test('should set correct fruit type', () => {
            expect(fruit.typeIndex).toBe(0);
            expect(fruit.fruitType).toEqual(fruitConfig.types[0]);
        });

        test('should be initially inactive', () => {
            expect(fruit.active).toBe(false);
            expect(fruit.visible).toBe(false);
        });
    });

    describe('activation', () => {
        test('should show and animate when activated', () => {
            fruit.activate();

            expect(fruit.active).toBe(true);
            expect(fruit.visible).toBe(true);
        });

        test('should deactivate after timeout', () => {
            fruit.activate(msToSeconds(100));
            fruit.update(msToSeconds(150));

            expect(fruit.active).toBe(false);
        });
    });

    describe('scoring', () => {
        test('should return correct score for each fruit type', () => {
            fruit.reset(0);
            expect(fruit.getScore()).toBe(100); // cherry

            fruit.reset(1);
            expect(fruit.getScore()).toBe(300); // strawberry

            fruit.reset(2);
            expect(fruit.getScore()).toBe(500); // orange

            fruit.reset(3);
            expect(fruit.getScore()).toBe(700); // apple

            fruit.reset(4);
            expect(fruit.getScore()).toBe(1000); // melon

            fruit.reset(5);
            expect(fruit.getScore()).toBe(2000); // galaxian

            fruit.reset(6);
            expect(fruit.getScore()).toBe(3000); // bell

            fruit.reset(7);
            expect(fruit.getScore()).toBe(5000); // key
        });
    });

    describe('position getters', () => {
        test('should return correct grid position', () => {
            const gridPos = fruit.getGridPosition();
            expect(gridPos.x).toBe(13);
            expect(gridPos.y).toBe(17);
        });

        test('should return correct pixel position', () => {
            const pixelPos = fruit.getPixelPosition();
            expect(pixelPos.x).toBe(270);
            expect(pixelPos.y).toBe(350);
        });
    });

    describe('reset', () => {
        test('should reset fruit to initial state', () => {
            fruit.activate();
            fruit.reset(1);

            expect(fruit.typeIndex).toBe(1);
            expect(fruit.fruitType).toEqual(fruitConfig.types[1]);
            expect(fruit.active).toBe(false);
            expect(fruit.visible).toBe(false);
            expect(fruit.scale).toBe(1);
        });

        test('should handle type index out of bounds', () => {
            fruit.reset(99);

            expect(fruit.typeIndex).toBe(99);
            expect(fruit.fruitType).toEqual(fruitConfig.types[7]); // Last type
        });
    });

    describe('update', () => {
        test('should decrement timer when active', () => {
            fruit.activate(msToSeconds(5000));
            fruit.update(msToSeconds(1000));

            expect(fruit.active).toBe(true);
        });

        test('should deactivate when timer expires', () => {
            fruit.activate(msToSeconds(100));
            fruit.update(msToSeconds(150));

            expect(fruit.active).toBe(false);
        });

        test('should not update when inactive', () => {
            fruit.update(msToSeconds(1000));

            expect(fruit.active).toBe(false);
        });
    });

    describe('deactivate', () => {
        test('should stop pulse tween when deactivating', () => {
            fruit.activate();
            fruit.deactivate();

            expect(fruit.active).toBe(false);
        });
    });
});
