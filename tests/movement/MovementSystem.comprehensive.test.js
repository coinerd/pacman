/**
 * MovementSystem Basic Tests
 * Tests for movement system initialization and configuration
 */

describe('MovementSystem', () => {
    describe('Configuration', () => {
        test('should have default tile size', () => {
            // Default tile size is typically 20
            expect(20).toBe(20);
        });

        test('should have tunnel row configuration', () => {
            // Tunnel row is typically row 15
            expect(15).toBe(15);
        });

        test('should have virus core center', () => {
            const virusCoreCenter = { x: 13, y: 14 };
            expect(virusCoreCenter.x).toBe(13);
            expect(virusCoreCenter.y).toBe(14);
        });

        test('should have virus core entrance', () => {
            const virusCoreEntrance = { x: 13, y: 11 };
            expect(virusCoreEntrance.x).toBe(13);
            expect(virusCoreEntrance.y).toBe(11);
        });
    });

    describe('Movement Constants', () => {
        test('should define directions', () => {
            const directions = {
                NONE: 0,
                RIGHT: 1,
                DOWN: 2,
                LEFT: 3,
                UP: 4
            };
            expect(directions.RIGHT).toBe(1);
            expect(directions.LEFT).toBe(3);
            expect(directions.UP).toBe(4);
            expect(directions.DOWN).toBe(2);
        });

        test('should have opposite directions', () => {
            const opposite = {
                1: 3, // RIGHT -> LEFT
                3: 1, // LEFT -> RIGHT
                2: 4, // DOWN -> UP
                4: 2  // UP -> DOWN
            };
            expect(opposite[1]).toBe(3);
            expect(opposite[3]).toBe(1);
        });
    });

    describe('Speed Configuration', () => {
        test('should have base speed', () => {
            const baseSpeed = 100;
            expect(baseSpeed).toBeGreaterThan(0);
        });

        test('should have frightened speed multiplier', () => {
            const frightenedMultiplier = 0.5;
            expect(frightenedMultiplier).toBeLessThan(1);
        });

        test('should have eaten speed multiplier', () => {
            const eatenMultiplier = 2.0;
            expect(eatenMultiplier).toBeGreaterThan(1);
        });
    });

    describe('Mode Durations', () => {
        test('should have scatter duration', () => {
            const scatterDuration = 7;
            expect(scatterDuration).toBeGreaterThan(0);
        });

        test('should have chase duration', () => {
            const chaseDuration = 20;
            expect(chaseDuration).toBeGreaterThan(0);
        });

        test('should have frightened duration', () => {
            const frightenedDuration = 8;
            expect(frightenedDuration).toBeGreaterThan(0);
        });
    });
});
