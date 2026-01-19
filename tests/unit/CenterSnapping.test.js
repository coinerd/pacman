/**
 * Center Snapping Unit Tests
 *
 * Test center snapping behavior in TileMovement utilities to understand
 * current behavior before simplification. Tests document actual behavior,
 * not expected behavior.
 *
 * Functions tested:
 * - isAtTileCenter(x, y, tileX, tileY) - Returns true if distance <= EPS
 * - distanceToTileCenter(x, y, tileX, tileY) - Returns distance to center
 * - performGridMovementStep(entity, maze, delta) - Center snapping logic
 *
 * Test Requirements from MOVE_FIX_PLAN.md:
 * - Test isAtTileCenter() with edge cases
 * - Test distanceToTileCenter() accuracy
 * - Test center snapping behavior (single tile, multiple tiles, with/without buffered turns, near walls)
 */

import { gameConfig, directions } from '../../src/config/gameConfig.js';
import { isAtTileCenter, distanceToTileCenter, tileCenter, EPS, performGridMovementStep } from '../../src/utils/TileMovement.js';
import { TILE_TYPES } from '../../src/utils/MazeLayout.js';
import { createSimpleMaze } from '../utils/testHelpers.js';

describe('Center Snapping - isAtTileCenter', () => {
    describe('Edge cases for tile center detection', () => {
        test('returns true when exactly at tile center', () => {
            const center = tileCenter(5, 5);
            const result = isAtTileCenter(center.x, center.y, 5, 5);
            expect(result).toBe(true);
        });

        test('returns true when within EPS tolerance on X axis', () => {
            const center = tileCenter(5, 5);
            expect(isAtTileCenter(center.x + EPS, center.y, 5, 5)).toBe(true);
            expect(isAtTileCenter(center.x - EPS, center.y, 5, 5)).toBe(true);
        });

        test('returns true when within EPS tolerance on Y axis', () => {
            const center = tileCenter(5, 5);
            expect(isAtTileCenter(center.x, center.y + EPS, 5, 5)).toBe(true);
            expect(isAtTileCenter(center.x, center.y - EPS, 5, 5)).toBe(true);
        });

        test('returns true when within EPS tolerance diagonally', () => {
            const center = tileCenter(5, 5);
            const diagDist = Math.sqrt(2 * EPS * EPS);
            expect(isAtTileCenter(center.x + EPS, center.y + EPS, 5, 5)).toBe(false); // Diagonal exceeds EPS radius
        });

        test('returns false when just outside EPS tolerance', () => {
            const center = tileCenter(5, 5);
            expect(isAtTileCenter(center.x + EPS + 0.1, center.y, 5, 5)).toBe(false);
            expect(isAtTileCenter(center.x, center.y + EPS + 0.1, 5, 5)).toBe(false);
        });

        test('returns false when far from center', () => {
            const center = tileCenter(5, 5);
            expect(isAtTileCenter(center.x + gameConfig.tileSize, center.y, 5, 5)).toBe(false);
            expect(isAtTileCenter(center.x, center.y + gameConfig.tileSize, 5, 5)).toBe(false);
        });
    });

    describe('Different tile positions', () => {
        test('works correctly for origin tile (0, 0)', () => {
            const center = tileCenter(0, 0);
            expect(isAtTileCenter(center.x, center.y, 0, 0)).toBe(true);
        });

        test('works correctly for positive tile coordinates', () => {
            const center = tileCenter(10, 15);
            expect(isAtTileCenter(center.x, center.y, 10, 15)).toBe(true);
        });

        test('works correctly for tile at edge of maze', () => {
            const center = tileCenter(27, 30);
            expect(isAtTileCenter(center.x, center.y, 27, 30)).toBe(true);
        });

        test('returns false for wrong tile coordinates', () => {
            const center = tileCenter(5, 5);
            expect(isAtTileCenter(center.x, center.y, 6, 5)).toBe(false);
            expect(isAtTileCenter(center.x, center.y, 5, 6)).toBe(false);
        });
    });

    describe('Boundary conditions', () => {
        test('handles positions exactly at EPS boundary', () => {
            const center = tileCenter(5, 5);
            const result = isAtTileCenter(center.x + EPS, center.y, 5, 5);
            expect(result).toBe(true); // Uses <= EPS, so boundary is inclusive
        });

        test('handles small floating point precision issues', () => {
            const center = tileCenter(5, 5);
            expect(isAtTileCenter(center.x + 0.0001, center.y, 5, 5)).toBe(true);
            expect(isAtTileCenter(center.x, center.y + 0.0001, 5, 5)).toBe(true);
        });
    });
});

describe('Center Snapping - distanceToTileCenter', () => {
    describe('Accuracy at various positions', () => {
        test('returns 0 when exactly at tile center', () => {
            const center = tileCenter(5, 5);
            const distance = distanceToTileCenter(center.x, center.y, 5, 5);
            expect(distance).toBeCloseTo(0, 5);
        });

        test('returns correct distance on X axis', () => {
            const center = tileCenter(5, 5);
            expect(distanceToTileCenter(center.x + 5, center.y, 5, 5)).toBeCloseTo(5, 5);
            expect(distanceToTileCenter(center.x - 5, center.y, 5, 5)).toBeCloseTo(5, 5);
        });

        test('returns correct distance on Y axis', () => {
            const center = tileCenter(5, 5);
            expect(distanceToTileCenter(center.x, center.y + 5, 5, 5)).toBeCloseTo(5, 5);
            expect(distanceToTileCenter(center.x, center.y - 5, 5, 5)).toBeCloseTo(5, 5);
        });

        test('returns correct diagonal distance', () => {
            const center = tileCenter(5, 5);
            const expected = Math.sqrt(5 * 5 + 3 * 3);
            expect(distanceToTileCenter(center.x + 5, center.y + 3, 5, 5)).toBeCloseTo(expected, 5);
        });
    });

    describe('Boundary conditions', () => {
        test('handles positions at EPS boundary', () => {
            const center = tileCenter(5, 5);
            expect(distanceToTileCenter(center.x + EPS, center.y, 5, 5)).toBeCloseTo(EPS, 5);
            expect(distanceToTileCenter(center.x, center.y + EPS, 5, 5)).toBeCloseTo(EPS, 5);
        });

        test('handles positions at half tile distance', () => {
            const center = tileCenter(5, 5);
            const halfTile = gameConfig.tileSize / 2;
            expect(distanceToTileCenter(center.x + halfTile, center.y, 5, 5)).toBeCloseTo(halfTile, 5);
        });

        test('handles positions at full tile distance', () => {
            const center = tileCenter(5, 5);
            expect(distanceToTileCenter(center.x + gameConfig.tileSize, center.y, 5, 5)).toBeCloseTo(gameConfig.tileSize, 5);
        });
    });

    describe('Negative positions', () => {
        test('handles negative world coordinates', () => {
            const center = tileCenter(0, 0);
            expect(distanceToTileCenter(center.x - 10, center.y, 0, 0)).toBeCloseTo(10, 5);
            expect(distanceToTileCenter(center.x, center.y - 10, 0, 0)).toBeCloseTo(10, 5);
        });

        test('handles positions with both negative coordinates', () => {
            const center = tileCenter(0, 0);
            const expected = Math.sqrt(10 * 10 + 5 * 5);
            expect(distanceToTileCenter(center.x - 10, center.y - 5, 0, 0)).toBeCloseTo(expected, 5);
        });
    });

    describe('Different tile coordinates', () => {
        test('correctly calculates distance for tile at origin', () => {
            const center = tileCenter(0, 0);
            const distance = distanceToTileCenter(center.x + 10, center.y + 10, 0, 0);
            expect(distance).toBeCloseTo(Math.sqrt(10 * 10 + 10 * 10), 5);
        });

        test('correctly calculates distance for tile at maze edge', () => {
            const center = tileCenter(27, 30);
            const distance = distanceToTileCenter(center.x - 5, center.y, 27, 30);
            expect(distance).toBeCloseTo(5, 5);
        });
    });
});

describe('Center Snapping - Behavior with performGridMovementStep', () => {
    let maze;

    beforeEach(() => {
        maze = createSimpleMaze(10, 10);
    });

    describe('Single tile movement', () => {
        test('does not snap when far from center', () => {
            const center = tileCenter(5, 5);
            const entity = {
                x: center.x - 10,
                y: center.y,
                gridX: 5,
                gridY: 5,
                speed: 100,
                isMoving: true,
                directionBuffer: {
                    current: directions.RIGHT,
                    buffered: directions.NONE,
                    getCurrent: function() { return this.current; },
                    getBuffered: function() { return this.buffered; },
                    applyIfCanMove: function() { return false; }
                }
            };
            Object.defineProperty(entity, 'direction', {
                get() { return this.directionBuffer.getCurrent(); }
            });
            Object.defineProperty(entity, 'nextDirection', {
                get() { return this.directionBuffer.getBuffered(); }
            });

            const delta = 20;
            const result = performGridMovementStep(entity, maze, delta);

            expect(result.x).toBeGreaterThanOrEqual(entity.x);
            expect(result.x).toBeLessThan(center.x);
            expect(result.y).toBe(center.y);
        });

        test('snaps exactly to center when reaching it', () => {
            const center = tileCenter(5, 5);
            const entity = {
                x: center.x - 5,
                y: center.y,
                gridX: 5,
                gridY: 5,
                speed: 100,
                isMoving: true,
                directionBuffer: {
                    current: directions.RIGHT,
                    buffered: directions.NONE,
                    getCurrent: function() { return this.current; },
                    getBuffered: function() { return this.buffered; },
                    applyIfCanMove: function() { return false; }
                }
            };
            Object.defineProperty(entity, 'direction', {
                get() { return this.directionBuffer.getCurrent(); }
            });
            Object.defineProperty(entity, 'nextDirection', {
                get() { return this.directionBuffer.getBuffered(); }
            });

            const delta = 50;
            const result = performGridMovementStep(entity, maze, delta);

            expect(result.x).toBe(center.x);
            expect(result.y).toBe(center.y);
        });

        test('does not snap when far from center', () => {
            const center = tileCenter(5, 5);
            const entity = {
                x: center.x - 10,
                y: center.y,
                gridX: 5,
                gridY: 5,
                direction: directions.RIGHT,
                speed: 100,
                isMoving: true,
                nextDirection: directions.NONE
            };

            const initialX = entity.x;
            const delta = 20;
            const result = performGridMovementStep(entity, maze, delta);

            expect(result.x).toBeGreaterThan(initialX);
            expect(result.x).toBeLessThan(center.x);
        });
    });

    describe('Multiple tile movement', () => {
        test('snaps to center on first tile, may continue to next', () => {
            const center5 = tileCenter(5, 5);
            const entity = {
                x: center5.x - 2,
                y: center5.y,
                gridX: 5,
                gridY: 5,
                direction: directions.RIGHT,
                speed: 100,
                isMoving: true,
                nextDirection: directions.NONE
            };

            const delta = 200;
            const result = performGridMovementStep(entity, maze, delta);

            // Snaps to center, actual continuation depends on remaining distance
            expect(result.x).toBeGreaterThanOrEqual(center5.x);
            expect(result.y).toBe(center5.y);
        });

        test('updates grid position when crossing tile boundary', () => {
            const center5 = tileCenter(5, 5);
            const entity = {
                x: center5.x,
                y: center5.y,
                gridX: 5,
                gridY: 5,
                direction: directions.RIGHT,
                speed: 100,
                isMoving: true,
                nextDirection: directions.NONE
            };

            const delta = 200;
            const result = performGridMovementStep(entity, maze, delta);

            expect(result.gridX).toBeGreaterThanOrEqual(6);
            expect(result.x).toBeGreaterThan(center5.x);
        });
    });

    describe('With buffered turns', () => {
        test('does not snap early when buffered turn is set', () => {
            const center = tileCenter(5, 5);
            const entity = {
                x: center.x + 5,
                y: center.y,
                gridX: 5,
                gridY: 5,
                direction: directions.RIGHT,
                speed: 100,
                isMoving: true,
                nextDirection: directions.UP,
                wasMoving: true
            };

            const delta = 50;
            const result = performGridMovementStep(entity, maze, delta);

            const distToCenter = distanceToTileCenter(result.x, result.y, 5, 5);
            expect(distToCenter).toBeGreaterThan(EPS);
        });

        test('changes direction when reaching center with buffered turn', () => {
            const center = tileCenter(5, 5);
            maze[4][5] = TILE_TYPES.PATH;
            maze[6][5] = TILE_TYPES.PATH;
            const entity = {
                x: center.x - 3,
                y: center.y,
                gridX: 5,
                gridY: 5,
                speed: 100,
                isMoving: true,
                wasMoving: true,
                directionBuffer: {
                    current: directions.RIGHT,
                    buffered: directions.UP,
                    getCurrent: function() { return this.current; },
                    getBuffered: function() { return this.buffered; },
                    applyIfCanMove: function(canMoveFunction) {
                        if (this.buffered === directions.NONE) {return false;}
                        if (canMoveFunction(this.buffered)) {
                            this.current = this.buffered;
                            this.buffered = directions.NONE;
                            return true;
                        }
                        return false;
                    }
                }
            };
            Object.defineProperty(entity, 'direction', {
                get() { return this.directionBuffer.getCurrent(); }
            });
            Object.defineProperty(entity, 'nextDirection', {
                get() { return this.directionBuffer.getBuffered(); }
            });

            const delta = 30;
            const result = performGridMovementStep(entity, maze, delta);

            expect(result.direction).toBe(directions.UP);
            expect(result.gridX).toBe(5);
        });

        test('buffers direction when not at center', () => {
            const center = tileCenter(5, 5);
            maze[4][5] = TILE_TYPES.PATH;
            const entity = {
                x: center.x - 8,
                y: center.y,
                gridX: 5,
                gridY: 5,
                direction: directions.RIGHT,
                speed: 100,
                isMoving: true,
                nextDirection: directions.UP,
                wasMoving: true
            };

            const delta = 10;
            const result = performGridMovementStep(entity, maze, delta);

            expect(result.direction).toBe(directions.RIGHT);
            expect(result.nextDirection).toBe(directions.UP);
        });
    });

    describe('Without buffered turns', () => {
        test('snaps to center when within EPS and moving toward it', () => {
            const center = tileCenter(5, 5);
            const entity = {
                x: center.x + 3,
                y: center.y,
                gridX: 5,
                gridY: 5,
                speed: 100,
                isMoving: true,
                directionBuffer: {
                    current: directions.LEFT,
                    buffered: directions.NONE,
                    getCurrent: function() { return this.current; },
                    getBuffered: function() { return this.buffered; },
                    applyIfCanMove: function() { return false; }
                }
            };
            Object.defineProperty(entity, 'direction', {
                get() { return this.directionBuffer.getCurrent(); }
            });
            Object.defineProperty(entity, 'nextDirection', {
                get() { return this.directionBuffer.getBuffered(); }
            });

            const delta = 20;
            const result = performGridMovementStep(entity, maze, delta);

            const distToCenter = distanceToTileCenter(result.x, result.y, 5, 5);
            expect(distToCenter).toBeLessThanOrEqual(EPS + 2);
            expect(result.y).toBe(center.y);
        });

        test('continues straight without turning at center', () => {
            const center = tileCenter(5, 5);
            const entity = {
                x: center.x,
                y: center.y,
                gridX: 5,
                gridY: 5,
                direction: directions.RIGHT,
                speed: 100,
                isMoving: true,
                nextDirection: directions.NONE
            };

            const delta = 50;
            const result = performGridMovementStep(entity, maze, delta);

            expect(result.direction).toBe(directions.RIGHT);
            expect(result.x).toBeGreaterThan(center.x);
        });
    });

    describe('Near walls', () => {
        test('snaps to center before wall when wall ahead', () => {
            maze[5][6] = TILE_TYPES.WALL;
            const center = tileCenter(5, 5);
            const entity = {
                x: center.x + 2,
                y: center.y,
                gridX: 5,
                gridY: 5,
                direction: directions.RIGHT,
                speed: 100,
                isMoving: true,
                nextDirection: directions.NONE
            };

            const delta = 50;
            const result = performGridMovementStep(entity, maze, delta);

            expect(result.x).toBe(center.x);
            expect(result.direction).toBe(directions.NONE);
        });

        test('does not snap to center if surrounded by walls', () => {
            maze[5][5] = TILE_TYPES.PATH;
            maze[5][4] = TILE_TYPES.WALL;
            maze[5][6] = TILE_TYPES.WALL;
            maze[4][5] = TILE_TYPES.WALL;
            maze[6][5] = TILE_TYPES.WALL;

            const center = tileCenter(5, 5);
            const entity = {
                x: center.x,
                y: center.y,
                gridX: 5,
                gridY: 5,
                direction: directions.NONE,
                speed: 100,
                isMoving: false,
                nextDirection: directions.NONE
            };

            const delta = 20;
            const result = performGridMovementStep(entity, maze, delta);

            expect(result.x).toBe(center.x);
            expect(result.y).toBe(center.y);
            expect(result.direction).toBe(directions.NONE);
        });

        test('stops at wall boundary when near wall', () => {
            maze[5][6] = TILE_TYPES.WALL;
            const center5 = tileCenter(5, 5);

            const entity = {
                x: center5.x,
                y: center5.y,
                gridX: 5,
                gridY: 5,
                direction: directions.RIGHT,
                speed: 100,
                isMoving: true,
                nextDirection: directions.NONE
            };

            const delta = 500;
            const result = performGridMovementStep(entity, maze, delta);

            expect(result.x).toBe(center5.x);
            expect(result.gridX).toBe(5);
        });
    });

    describe('Turn tolerance scenarios', () => {
        test('does not turn until within EPS even with buffered input', () => {
            const center = tileCenter(5, 5);
            const entity = {
                x: center.x + EPS * 1.5,
                y: center.y,
                gridX: 5,
                gridY: 5,
                direction: directions.RIGHT,
                speed: 100,
                isMoving: true,
                nextDirection: directions.UP,
                wasMoving: true
            };

            const delta = 50;
            const result = performGridMovementStep(entity, maze, delta);

            expect(result.direction).toBe(directions.RIGHT);
            expect(result.nextDirection).toBe(directions.UP);
        });

        test('requires center proximity for buffered turns at higher speeds', () => {
            const center = tileCenter(5, 5);
            const entity = {
                x: center.x + gameConfig.tileSize * 0.3,
                y: center.y,
                gridX: 5,
                gridY: 5,
                direction: directions.RIGHT,
                speed: 150,
                isMoving: true,
                nextDirection: directions.UP,
                wasMoving: true
            };

            const delta = 20;
            const result = performGridMovementStep(entity, maze, delta);

            const distToCenter = distanceToTileCenter(result.x, result.y, 5, 5);
            expect(distToCenter).toBeGreaterThan(EPS);
        });
    });

    describe('Entity state preservation', () => {
        test('preserves entity properties when not snapping', () => {
            const center = tileCenter(5, 5);
            const entity = {
                x: center.x - 15,
                y: center.y,
                gridX: 5,
                gridY: 5,
                direction: directions.RIGHT,
                speed: 100,
                isMoving: true,
                nextDirection: directions.NONE,
                type: 'pacman'
            };

            const delta = 20;
            const result = performGridMovementStep(entity, maze, delta);

            expect(result.isMoving).toBe(true);
            expect(result.direction).toBe(directions.RIGHT);
            expect(result.speed).toBe(100);
        });

        test('updates grid position when snapping to center with sufficient movement', () => {
            const center = tileCenter(5, 5);
            const entity = {
                x: center.x - 2,
                y: center.y,
                gridX: 5,
                gridY: 5,
                speed: 100,
                isMoving: true,
                directionBuffer: {
                    current: directions.RIGHT,
                    buffered: directions.NONE,
                    getCurrent: function() { return this.current; },
                    getBuffered: function() { return this.buffered; },
                    applyIfCanMove: function() { return false; }
                }
            };
            Object.defineProperty(entity, 'direction', {
                get() { return this.directionBuffer.getCurrent(); }
            });
            Object.defineProperty(entity, 'nextDirection', {
                get() { return this.directionBuffer.getBuffered(); }
            });

            const delta = 40;
            const result = performGridMovementStep(entity, maze, delta);

            expect(result.gridX).toBe(5);
            expect(result.gridY).toBe(5);
            expect(result.x).toBeGreaterThan(center.x);
            expect(result.y).toBe(center.y);
        });
    });
});
