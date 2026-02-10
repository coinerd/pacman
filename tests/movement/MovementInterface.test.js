/**
 * Tests for MovementInterface
 */

import {
    MovementInterface,
    MOVEMENT_RESULTS,
    MOVEMENT_EVENTS
} from '../../src/movement/MovementInterface.js';

describe('MovementInterface', () => {
    describe('abstract methods', () => {
        test('move() must be implemented', () => {
            const iface = new MovementInterface();
            expect(() => iface.move({}, {}, 0.1)).toThrow('MovementInterface.move() must be implemented by subclass');
        });

        test('canMove() must be implemented', () => {
            const iface = new MovementInterface();
            expect(() => iface.canMove({}, {}, { x: 1, y: 0 })).toThrow('MovementInterface.canMove() must be implemented by subclass');
        });
    });

    describe('MOVEMENT_RESULTS', () => {
        test('has all expected result types', () => {
            expect(MOVEMENT_RESULTS.MOVED).toBe('moved');
            expect(MOVEMENT_RESULTS.BLOCKED).toBe('blocked');
            expect(MOVEMENT_RESULTS.WARPED).toBe('warped');
            expect(MOVEMENT_RESULTS.TURNED).toBe('turned');
            expect(MOVEMENT_RESULTS.STOPPED).toBe('stopped');
            expect(MOVEMENT_RESULTS.NONE).toBe('none');
        });
    });

    describe('MOVEMENT_EVENTS', () => {
        test('has all expected event types', () => {
            expect(MOVEMENT_EVENTS.TILE_ENTER).toBe('tile_enter');
            expect(MOVEMENT_EVENTS.CENTER_REACHED).toBe('center_reached');
            expect(MOVEMENT_EVENTS.WALL_HIT).toBe('wall_hit');
            expect(MOVEMENT_EVENTS.WARP).toBe('warp');
        });
    });

    describe('calculateMoveDistance', () => {
        test('calculates distance correctly', () => {
            const iface = new MovementInterface();
            // 100 pixels/second * 0.1 seconds = 10 pixels
            expect(iface.calculateMoveDistance(100, 0.1)).toBe(10);
        });

        test('handles zero speed', () => {
            const iface = new MovementInterface();
            expect(iface.calculateMoveDistance(0, 0.1)).toBe(0);
        });

        test('handles zero time', () => {
            const iface = new MovementInterface();
            expect(iface.calculateMoveDistance(100, 0)).toBe(0);
        });

        test('handles high speed', () => {
            const iface = new MovementInterface();
            expect(iface.calculateMoveDistance(1000, 1)).toBe(1000);
        });
    });
});
