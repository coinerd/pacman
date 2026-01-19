import { GhostFactory } from '../../src/entities/GhostFactory.js';
import Ghost from '../../src/entities/Ghost.js';
import { ghostNames, ghostColors, ghostStartPositions } from '../../src/config/gameConfig.js';
import { msToSeconds } from '../../src/utils/Time.js';

jest.mock('../../src/entities/Ghost.js');

describe('GhostFactory', () => {
    let mockScene;

    beforeEach(() => {
        mockScene = {
            add: {
                sprite: jest.fn(),
                graphics: jest.fn()
            },
            children: [],
            maze: Array(31).fill(null).map(() => Array(28).fill(0))
        };

        Ghost.mockClear();
        Ghost.mockImplementation((scene, startX, startY, type, color) => {
            return {
                scene,
                x: startX * 16 + 8,
                y: startY * 16 + 8,
                gridX: startX,
                gridY: startY,
                type,
                color,
                direction: { x: 0, y: 0 },
                speed: 80,
                baseSpeed: 80,
                isFrightened: false,
                isEaten: false,
                mode: 'SCATTER',
                frightenedTimer: 0,
                houseTimer: 0,
                inGhostHouse: false,
                targetX: 0,
                targetY: 0,
                reset: jest.fn(),
                setFrightened: jest.fn(),
                update: jest.fn()
            };
        });
    });

    describe('createGhosts()', () => {
        test('creates array of 4 ghosts', () => {
            const ghosts = GhostFactory.createGhosts(mockScene);

            expect(Array.isArray(ghosts)).toBe(true);
            expect(ghosts.length).toBe(4);
        });

        test('creates Ghost instances for each ghost', () => {
            const ghosts = GhostFactory.createGhosts(mockScene);

            expect(Ghost).toHaveBeenCalledTimes(4);
        });

        test('creates Blinky with correct properties', () => {
            const ghosts = GhostFactory.createGhosts(mockScene);
            const blinky = ghosts.find(g => g.type === ghostNames.BLINKY);

            expect(blinky).toBeDefined();
            expect(blinky.gridX).toBe(ghostStartPositions.blinky.x);
            expect(blinky.gridY).toBe(ghostStartPositions.blinky.y);
            expect(blinky.color).toBe(ghostColors.BLINKY);
            expect(blinky.scene).toBe(mockScene);
        });

        test('creates Pinky with correct properties', () => {
            const ghosts = GhostFactory.createGhosts(mockScene);
            const pinky = ghosts.find(g => g.type === ghostNames.PINKY);

            expect(pinky).toBeDefined();
            expect(pinky.gridX).toBe(ghostStartPositions.pinky.x);
            expect(pinky.gridY).toBe(ghostStartPositions.pinky.y);
            expect(pinky.color).toBe(ghostColors.PINKY);
            expect(pinky.scene).toBe(mockScene);
        });

        test('creates Inky with correct properties', () => {
            const ghosts = GhostFactory.createGhosts(mockScene);
            const inky = ghosts.find(g => g.type === ghostNames.INKY);

            expect(inky).toBeDefined();
            expect(inky.gridX).toBe(ghostStartPositions.inky.x);
            expect(inky.gridY).toBe(ghostStartPositions.inky.y);
            expect(inky.color).toBe(ghostColors.INKY);
            expect(inky.scene).toBe(mockScene);
        });

        test('creates Clyde with correct properties', () => {
            const ghosts = GhostFactory.createGhosts(mockScene);
            const clyde = ghosts.find(g => g.type === ghostNames.CLYDE);

            expect(clyde).toBeDefined();
            expect(clyde.gridX).toBe(ghostStartPositions.clyde.x);
            expect(clyde.gridY).toBe(ghostStartPositions.clyde.y);
            expect(clyde.color).toBe(ghostColors.CLYDE);
            expect(clyde.scene).toBe(mockScene);
        });

        test('creates ghosts in order: Blinky, Pinky, Inky, Clyde', () => {
            const ghosts = GhostFactory.createGhosts(mockScene);

            expect(ghosts[0].type).toBe(ghostNames.BLINKY);
            expect(ghosts[1].type).toBe(ghostNames.PINKY);
            expect(ghosts[2].type).toBe(ghostNames.INKY);
            expect(ghosts[3].type).toBe(ghostNames.CLYDE);
        });

        test('all ghosts have unique types', () => {
            const ghosts = GhostFactory.createGhosts(mockScene);
            const types = ghosts.map(g => g.type);

            expect(new Set(types).size).toBe(4);
        });

        test('all ghosts have correct start positions', () => {
            const ghosts = GhostFactory.createGhosts(mockScene);

            ghosts.forEach(ghost => {
                const expectedPos = ghostStartPositions[ghost.type.toLowerCase()];
                expect(ghost.gridX).toBe(expectedPos.x);
                expect(ghost.gridY).toBe(expectedPos.y);
            });
        });

        test('all ghosts have correct colors', () => {
            const ghosts = GhostFactory.createGhosts(mockScene);

            ghosts.forEach(ghost => {
                const expectedColor = ghostColors[ghost.type.toUpperCase()];
                expect(ghost.color).toBe(expectedColor);
            });
        });
    });

    describe('resetGhosts()', () => {
        test('calls reset() on all ghosts', () => {
            const ghosts = GhostFactory.createGhosts(mockScene);

            GhostFactory.resetGhosts(ghosts);

            ghosts.forEach(ghost => {
                expect(ghost.reset).toHaveBeenCalledTimes(1);
            });
        });

        test('does not modify ghost array', () => {
            const ghosts = GhostFactory.createGhosts(mockScene);
            const originalLength = ghosts.length;

            GhostFactory.resetGhosts(ghosts);

            expect(ghosts.length).toBe(originalLength);
        });
    });

    describe('setGhostsFrightened()', () => {
        test('calls setFrightened() on all non-eaten ghosts', () => {
            const ghosts = GhostFactory.createGhosts(mockScene);
            ghosts[0].isEaten = false;
            ghosts[1].isEaten = false;
            ghosts[2].isEaten = true;
            ghosts[3].isEaten = false;

            GhostFactory.setGhostsFrightened(ghosts, msToSeconds(5000));

            expect(ghosts[0].setFrightened).toHaveBeenCalledWith(msToSeconds(5000));
            expect(ghosts[1].setFrightened).toHaveBeenCalledWith(msToSeconds(5000));
            expect(ghosts[2].setFrightened).not.toHaveBeenCalled();
            expect(ghosts[3].setFrightened).toHaveBeenCalledWith(msToSeconds(5000));
        });

        test('does not call setFrightened() on eaten ghosts', () => {
            const ghosts = GhostFactory.createGhosts(mockScene);
            ghosts.forEach(ghost => {
                ghost.isEaten = true;
            });

            GhostFactory.setGhostsFrightened(ghosts, msToSeconds(5000));

            ghosts.forEach(ghost => {
                expect(ghost.setFrightened).not.toHaveBeenCalled();
            });
        });

        test('calls setFrightened() with correct duration', () => {
            const ghosts = GhostFactory.createGhosts(mockScene);
            const duration = msToSeconds(8000);

            GhostFactory.setGhostsFrightened(ghosts, duration);

            ghosts.forEach(ghost => {
                if (!ghost.isEaten) {
                    expect(ghost.setFrightened).toHaveBeenCalledWith(duration);
                }
            });
        });

        test('handles mixed ghost states correctly', () => {
            const ghosts = GhostFactory.createGhosts(mockScene);
            ghosts[0].isEaten = false;
            ghosts[1].isEaten = true;
            ghosts[2].isEaten = false;
            ghosts[3].isEaten = false;

            GhostFactory.setGhostsFrightened(ghosts, msToSeconds(6000));

            expect(ghosts[0].setFrightened).toHaveBeenCalledTimes(1);
            expect(ghosts[1].setFrightened).not.toHaveBeenCalled();
            expect(ghosts[2].setFrightened).toHaveBeenCalledTimes(1);
            expect(ghosts[3].setFrightened).toHaveBeenCalledTimes(1);
        });
    });

    describe('getGhostsByType()', () => {
        test('returns empty array when no ghosts match type', () => {
            const ghosts = GhostFactory.createGhosts(mockScene);

            const result = GhostFactory.getGhostsByType(ghosts, 'unknown');

            expect(result).toEqual([]);
        });

        test('returns single ghost when one ghost matches type', () => {
            const ghosts = GhostFactory.createGhosts(mockScene);

            const blinkyGhosts = GhostFactory.getGhostsByType(ghosts, ghostNames.BLINKY);

            expect(blinkyGhosts.length).toBe(1);
            expect(blinkyGhosts[0].type).toBe(ghostNames.BLINKY);
        });

        test('returns all ghosts of specified type', () => {
            const ghosts = GhostFactory.createGhosts(mockScene);

            const result = GhostFactory.getGhostsByType(ghosts, ghostNames.BLINKY);

            expect(Array.isArray(result)).toBe(true);
            result.forEach(ghost => {
                expect(ghost.type).toBe(ghostNames.BLINKY);
            });
        });

        test('returns ghost array in same order as input', () => {
            const ghosts = GhostFactory.createGhosts(mockScene);

            const result = GhostFactory.getGhostsByType(ghosts, ghostNames.PINKY);

            expect(result[0]).toBe(ghosts[1]);
        });

        test('handles case sensitivity of type parameter', () => {
            const ghosts = GhostFactory.createGhosts(mockScene);

            const result1 = GhostFactory.getGhostsByType(ghosts, 'BLINKY');
            const result2 = GhostFactory.getGhostsByType(ghosts, 'blinky');

            expect(result1.length).toBe(0);
            expect(result2.length).toBe(1);
        });

        test('does not modify original ghost array', () => {
            const ghosts = GhostFactory.createGhosts(mockScene);
            const originalLength = ghosts.length;

            GhostFactory.getGhostsByType(ghosts, ghostNames.BLINKY);

            expect(ghosts.length).toBe(originalLength);
        });
    });

    describe('Integration: Complete ghost lifecycle', () => {
        test('creates ghosts, resets, and applies frightened state', () => {
            const ghosts = GhostFactory.createGhosts(mockScene);

            expect(ghosts.length).toBe(4);

            GhostFactory.resetGhosts(ghosts);

            ghosts.forEach(ghost => {
                expect(ghost.reset).toHaveBeenCalled();
            });

            GhostFactory.setGhostsFrightened(ghosts, msToSeconds(5000));

            ghosts.forEach(ghost => {
                if (!ghost.isEaten) {
                    expect(ghost.setFrightened).toHaveBeenCalledWith(msToSeconds(5000));
                }
            });
        });

        test('can filter and manipulate specific ghost types', () => {
            const ghosts = GhostFactory.createGhosts(mockScene);

            const blinky = GhostFactory.getGhostsByType(ghosts, ghostNames.BLINKY);
            const pinky = GhostFactory.getGhostsByType(ghosts, ghostNames.PINKY);

            expect(blinky[0].type).toBe(ghostNames.BLINKY);
            expect(pinky[0].type).toBe(ghostNames.PINKY);
            expect(blinky[0]).toBe(ghosts[0]);
            expect(pinky[0]).toBe(ghosts[1]);
        });
    });

    describe('Edge Cases', () => {
        test('handles empty ghost array for resetGhosts', () => {
            const ghosts = [];

            expect(() => {
                GhostFactory.resetGhosts(ghosts);
            }).not.toThrow();
        });

        test('handles empty ghost array for setGhostsFrightened', () => {
            const ghosts = [];

            expect(() => {
                GhostFactory.setGhostsFrightened(ghosts, msToSeconds(5000));
            }).not.toThrow();
        });

        test('handles empty ghost array for getGhostsByType', () => {
            const ghosts = [];

            const result = GhostFactory.getGhostsByType(ghosts, ghostNames.BLINKY);

            expect(result).toEqual([]);
        });

        test('handles ghost array with no matching types', () => {
            const ghosts = GhostFactory.createGhosts(mockScene);

            const result = GhostFactory.getGhostsByType(ghosts, 'nonexistent');

            expect(result).toEqual([]);
        });
    });
});
