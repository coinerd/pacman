import {
    checkCrossingCollision,
    checkSameTileCollision,
    checkGhostCollision,
    checkAllGhostCollisions,
    getGhostScore,
    resetGhostEatenCount
} from '../../src/utils/CollisionDetection.js';
import { scoreValues } from '../../src/config/gameConfig.js';

describe('CollisionDetection - checkCrossingCollision', () => {
    describe('Basic crossing detection', () => {
        test('returns collision when pacman and ghost cross paths', () => {
            const pacman = {
                gridX: 6,
                gridY: 5,
                prevGridX: 5,
                prevGridY: 5
            };

            const ghost = {
                gridX: 5,
                gridY: 5,
                prevGridX: 6,
                prevGridY: 5,
                name: 'blinky',
                isFrightened: false,
                isEaten: false
            };

            const result = checkCrossingCollision(pacman, ghost);

            expect(result).not.toBeNull();
            expect(result.type).toBe('pacman_died');
            expect(result.ghostIndex).toBe('blinky');
        });

        test('returns null when entities do not cross', () => {
            const pacman = {
                gridX: 5,
                gridY: 5,
                prevGridX: 4,
                prevGridY: 5
            };

            const ghost = {
                gridX: 3,
                gridY: 5,
                prevGridX: 2,
                prevGridY: 5,
                name: 'blinky',
                isFrightened: false,
                isEaten: false
            };

            const result = checkCrossingCollision(pacman, ghost);

            expect(result).toBeNull();
        });

        test('returns null when entities move parallel', () => {
            const pacman = {
                gridX: 6,
                gridY: 5,
                prevGridX: 5,
                prevGridY: 5
            };

            const ghost = {
                gridX: 6,
                gridY: 6,
                prevGridX: 5,
                prevGridY: 6,
                name: 'blinky',
                isFrightened: false,
                isEaten: false
            };

            const result = checkCrossingCollision(pacman, ghost);

            expect(result).toBeNull();
        });
    });

    describe('Missing prevGrid values', () => {
        test('returns null when pacman has no prevGrid values', () => {
            const pacman = {
                gridX: 5,
                gridY: 5
            };

            const ghost = {
                gridX: 5,
                gridY: 5,
                prevGridX: 6,
                prevGridY: 5,
                name: 'blinky',
                isFrightened: false,
                isEaten: false
            };

            const result = checkCrossingCollision(pacman, ghost);

            expect(result).toBeNull();
        });

        test('returns null when ghost has no prevGrid values', () => {
            const pacman = {
                gridX: 6,
                gridY: 5,
                prevGridX: 5,
                prevGridY: 5
            };

            const ghost = {
                gridX: 5,
                gridY: 5,
                name: 'blinky',
                isFrightened: false,
                isEaten: false
            };

            const result = checkCrossingCollision(pacman, ghost);

            expect(result).toBeNull();
        });

        test('returns null when both entities have no prevGrid values', () => {
            const pacman = {
                gridX: 5,
                gridY: 5
            };

            const ghost = {
                gridX: 5,
                gridY: 5,
                name: 'blinky',
                isFrightened: false,
                isEaten: false
            };

            const result = checkCrossingCollision(pacman, ghost);

            expect(result).toBeNull();
        });
    });

    describe('Frightened ghost crossing', () => {
        test('returns ghost_eaten when crossing with frightened ghost', () => {
            const pacman = {
                gridX: 6,
                gridY: 5,
                prevGridX: 5,
                prevGridY: 5
            };

            const ghost = {
                gridX: 5,
                gridY: 5,
                prevGridX: 6,
                prevGridY: 5,
                name: 'pinky',
                isFrightened: true,
                isEaten: false
            };

            const result = checkCrossingCollision(pacman, ghost);

            expect(result).not.toBeNull();
            expect(result.type).toBe('ghost_eaten');
            expect(result.ghostIndex).toBe('pinky');
        });

        test('returns null when crossing with eaten ghost', () => {
            const pacman = {
                gridX: 6,
                gridY: 5,
                prevGridX: 5,
                prevGridY: 5
            };

            const ghost = {
                gridX: 5,
                gridY: 5,
                prevGridX: 6,
                prevGridY: 5,
                name: 'inky',
                isFrightened: true,
                isEaten: true
            };

            const result = checkCrossingCollision(pacman, ghost);

            expect(result).toBeNull();
        });
    });

    describe('Crossing patterns', () => {
        test('detects horizontal crossing', () => {
            const pacman = {
                gridX: 6,
                gridY: 5,
                prevGridX: 5,
                prevGridY: 5
            };

            const ghost = {
                gridX: 5,
                gridY: 5,
                prevGridX: 6,
                prevGridY: 5,
                name: 'blinky',
                isFrightened: false,
                isEaten: false
            };

            const result = checkCrossingCollision(pacman, ghost);

            expect(result).not.toBeNull();
        });

        test('detects vertical crossing', () => {
            const pacman = {
                gridX: 5,
                gridY: 6,
                prevGridX: 5,
                prevGridY: 5
            };

            const ghost = {
                gridX: 5,
                gridY: 5,
                prevGridX: 5,
                prevGridY: 6,
                name: 'pinky',
                isFrightened: false,
                isEaten: false
            };

            const result = checkCrossingCollision(pacman, ghost);

            expect(result).not.toBeNull();
        });
    });
});

describe('CollisionDetection - checkSameTileCollision', () => {
    describe('Basic same-tile detection', () => {
        test('returns collision when entities in same tile', () => {
            const pacman = {
                gridX: 5,
                gridY: 5,
                prevGridX: 4,
                prevGridY: 5
            };

            const ghost = {
                gridX: 5,
                gridY: 5,
                prevGridX: 6,
                prevGridY: 5,
                name: 'blinky',
                isFrightened: false,
                isEaten: false
            };

            const result = checkSameTileCollision(pacman, ghost);

            expect(result).not.toBeNull();
            expect(result.type).toBe('pacman_died');
            expect(result.ghostIndex).toBe('blinky');
        });

        test('returns null when entities in different tiles', () => {
            const pacman = {
                gridX: 5,
                gridY: 5,
                prevGridX: 4,
                prevGridY: 5
            };

            const ghost = {
                gridX: 6,
                gridY: 5,
                prevGridX: 7,
                prevGridY: 5,
                name: 'blinky',
                isFrightened: false,
                isEaten: false
            };

            const result = checkSameTileCollision(pacman, ghost);

            expect(result).toBeNull();
        });
    });

    describe('Missing grid values', () => {
        test('returns null when pacman has no grid values', () => {
            const pacman = {};

            const ghost = {
                gridX: 5,
                gridY: 5,
                name: 'blinky',
                isFrightened: false,
                isEaten: false
            };

            const result = checkSameTileCollision(pacman, ghost);

            expect(result).toBeNull();
        });

        test('returns null when ghost has no grid values', () => {
            const pacman = {
                gridX: 5,
                gridY: 5
            };

            const ghost = {
                name: 'blinky',
                isFrightened: false,
                isEaten: false
            };

            const result = checkSameTileCollision(pacman, ghost);

            expect(result).toBeNull();
        });
    });

    describe('Frightened ghost same-tile', () => {
        test('returns ghost_eaten with frightened ghost in same tile', () => {
            const pacman = {
                gridX: 5,
                gridY: 5
            };

            const ghost = {
                gridX: 5,
                gridY: 5,
                name: 'pinky',
                isFrightened: true,
                isEaten: false
            };

            const result = checkSameTileCollision(pacman, ghost);

            expect(result).not.toBeNull();
            expect(result.type).toBe('ghost_eaten');
            expect(result.ghostIndex).toBe('pinky');
        });

        test('returns null with eaten ghost in same tile', () => {
            const pacman = {
                gridX: 5,
                gridY: 5
            };

            const ghost = {
                gridX: 5,
                gridY: 5,
                name: 'inky',
                isFrightened: true,
                isEaten: true
            };

            const result = checkSameTileCollision(pacman, ghost);

            expect(result).toBeNull();
        });
    });

    describe('Same-tile patterns', () => {
        test('detects same tile regardless of prevGrid values', () => {
            const pacman = {
                gridX: 5,
                gridY: 5,
                prevGridX: 5,
                prevGridY: 5
            };

            const ghost = {
                gridX: 5,
                gridY: 5,
                prevGridX: 5,
                prevGridY: 5,
                name: 'blinky',
                isFrightened: false,
                isEaten: false
            };

            const result = checkSameTileCollision(pacman, ghost);

            expect(result).not.toBeNull();
        });
    });
});

describe('CollisionDetection - checkGhostCollision', () => {
    describe('Combined detection', () => {
        test('returns crossing result when crossing detected', () => {
            const pacman = {
                gridX: 6,
                gridY: 5,
                prevGridX: 5,
                prevGridY: 5
            };

            const ghost = {
                gridX: 5,
                gridY: 5,
                prevGridX: 6,
                prevGridY: 5,
                name: 'blinky',
                isFrightened: false,
                isEaten: false
            };

            const result = checkGhostCollision(pacman, ghost);

            expect(result).not.toBeNull();
            expect(result.type).toBe('pacman_died');
        });

        test('returns same-tile result when same-tile detected', () => {
            const pacman = {
                gridX: 5,
                gridY: 5,
                prevGridX: 5,
                prevGridY: 5
            };

            const ghost = {
                gridX: 5,
                gridY: 5,
                prevGridX: 5,
                prevGridY: 5,
                name: 'blinky',
                isFrightened: false,
                isEaten: false
            };

            const result = checkGhostCollision(pacman, ghost);

            expect(result).not.toBeNull();
            expect(result.type).toBe('pacman_died');
        });

        test('returns null when no crossing or same-tile', () => {
            const pacman = {
                gridX: 5,
                gridY: 5,
                prevGridX: 4,
                prevGridY: 5
            };

            const ghost = {
                gridX: 7,
                gridY: 5,
                prevGridX: 6,
                prevGridY: 5,
                name: 'blinky',
                isFrightened: false,
                isEaten: false
            };

            const result = checkGhostCollision(pacman, ghost);

            expect(result).toBeNull();
        });
    });

    describe('Priority: Crossing over same-tile', () => {
        test('prioritizes crossing when both conditions exist', () => {
            const pacman = {
                gridX: 5,
                gridY: 5,
                prevGridX: 4,
                prevGridY: 5
            };

            const ghost = {
                gridX: 5,
                gridY: 5,
                prevGridX: 6,
                prevGridY: 5,
                name: 'blinky',
                isFrightened: false,
                isEaten: false
            };

            const result = checkGhostCollision(pacman, ghost);

            expect(result).not.toBeNull();
            expect(result.type).toBe('pacman_died');
        });
    });

    describe('Frightened ghost combined', () => {
        test('returns ghost_eaten for crossing frightened ghost', () => {
            const pacman = {
                gridX: 6,
                gridY: 5,
                prevGridX: 5,
                prevGridY: 5
            };

            const ghost = {
                gridX: 5,
                gridY: 5,
                prevGridX: 6,
                prevGridY: 5,
                name: 'pinky',
                isFrightened: true,
                isEaten: false
            };

            const result = checkGhostCollision(pacman, ghost);

            expect(result).not.toBeNull();
            expect(result.type).toBe('ghost_eaten');
        });
    });
});

describe('CollisionDetection - checkAllGhostCollisions', () => {
    describe('Single ghost collision', () => {
        test('returns first collision when one ghost collides', () => {
            const pacman = {
                gridX: 5,
                gridY: 5,
                prevGridX: 5,
                prevGridY: 5
            };

            const ghosts = [
                {
                    gridX: 5,
                    gridY: 5,
                    prevGridX: 5,
                    prevGridY: 5,
                    name: 'blinky',
                    isFrightened: false,
                    isEaten: false
                },
                {
                    gridX: 10,
                    gridY: 10,
                    prevGridX: 9,
                    prevGridY: 10,
                    name: 'pinky',
                    isFrightened: false,
                    isEaten: false
                }
            ];

            const result = checkAllGhostCollisions(pacman, ghosts);

            expect(result).not.toBeNull();
            expect(result.ghostIndex).toBe('blinky');
        });

        test('returns null when no ghost collides', () => {
            const pacman = {
                gridX: 5,
                gridY: 5,
                prevGridX: 5,
                prevGridY: 5
            };

            const ghosts = [
                {
                    gridX: 10,
                    gridY: 10,
                    prevGridX: 9,
                    prevGridY: 10,
                    name: 'blinky',
                    isFrightened: false,
                    isEaten: false
                },
                {
                    gridX: 15,
                    gridY: 15,
                    prevGridX: 14,
                    prevGridY: 15,
                    name: 'pinky',
                    isFrightened: false,
                    isEaten: false
                }
            ];

            const result = checkAllGhostCollisions(pacman, ghosts);

            expect(result).toBeNull();
        });
    });

    describe('Multiple ghost collision', () => {
        test('returns first collision when multiple ghosts collide', () => {
            const pacman = {
                gridX: 5,
                gridY: 5,
                prevGridX: 5,
                prevGridY: 5
            };

            const ghosts = [
                {
                    gridX: 5,
                    gridY: 5,
                    prevGridX: 5,
                    prevGridY: 5,
                    name: 'blinky',
                    isFrightened: false,
                    isEaten: false
                },
                {
                    gridX: 5,
                    gridY: 5,
                    prevGridX: 5,
                    prevGridY: 5,
                    name: 'pinky',
                    isFrightened: false,
                    isEaten: false
                }
            ];

            const result = checkAllGhostCollisions(pacman, ghosts);

            expect(result).not.toBeNull();
            expect(result.ghostIndex).toBe('blinky');
        });

        test('returns first collision crossing with second ghost', () => {
            const pacman = {
                gridX: 6,
                gridY: 5,
                prevGridX: 5,
                prevGridY: 5
            };

            const ghosts = [
                {
                    gridX: 10,
                    gridY: 10,
                    prevGridX: 9,
                    prevGridY: 10,
                    name: 'blinky',
                    isFrightened: false,
                    isEaten: false
                },
                {
                    gridX: 5,
                    gridY: 5,
                    prevGridX: 6,
                    prevGridY: 5,
                    name: 'pinky',
                    isFrightened: false,
                    isEaten: false
                }
            ];

            const result = checkAllGhostCollisions(pacman, ghosts);

            expect(result).not.toBeNull();
            expect(result.ghostIndex).toBe('pinky');
        });
    });

    describe('Eaten ghosts', () => {
        test('skips eaten ghosts and returns null', () => {
            const pacman = {
                gridX: 5,
                gridY: 5,
                prevGridX: 5,
                prevGridY: 5
            };

            const ghosts = [
                {
                    gridX: 5,
                    gridY: 5,
                    prevGridX: 5,
                    prevGridY: 5,
                    name: 'blinky',
                    isFrightened: false,
                    isEaten: true
                }
            ];

            const result = checkAllGhostCollisions(pacman, ghosts);

            expect(result).toBeNull();
        });

        test('returns collision with non-eaten ghost after eaten ghost', () => {
            const pacman = {
                gridX: 5,
                gridY: 5,
                prevGridX: 5,
                prevGridY: 5
            };

            const ghosts = [
                {
                    gridX: 5,
                    gridY: 5,
                    prevGridX: 5,
                    prevGridY: 5,
                    name: 'blinky',
                    isFrightened: false,
                    isEaten: true
                },
                {
                    gridX: 5,
                    gridY: 5,
                    prevGridX: 5,
                    prevGridY: 5,
                    name: 'pinky',
                    isFrightened: false,
                    isEaten: false
                }
            ];

            const result = checkAllGhostCollisions(pacman, ghosts);

            expect(result).not.toBeNull();
            expect(result.ghostIndex).toBe('pinky');
        });
    });
});

describe('CollisionDetection - getGhostScore', () => {
    describe('Sequential ghost scores', () => {
        test('returns 200 for 1st ghost eaten', () => {
            const score = getGhostScore(1);
            expect(score).toBe(400);
        });

        test('returns 400 for 2nd ghost eaten', () => {
            const score = getGhostScore(2);
            expect(score).toBe(800);
        });

        test('returns 800 for 3rd ghost eaten', () => {
            const score = getGhostScore(3);
            expect(score).toBe(1600);
        });

        test('returns 1600 for 4th ghost eaten', () => {
            const score = getGhostScore(4);
            expect(score).toBe(1600);
        });
    });

    describe('Score capping', () => {
        test('returns 1600 for 5th ghost eaten (capped)', () => {
            const score = getGhostScore(5);
            expect(score).toBe(1600);
        });

        test('returns 1600 for 10th ghost eaten (capped)', () => {
            const score = getGhostScore(10);
            expect(score).toBe(1600);
        });

        test('returns 1600 for 100th ghost eaten (capped)', () => {
            const score = getGhostScore(100);
            expect(score).toBe(1600);
        });
    });

    describe('Edge cases', () => {
        test('returns 200 for 0 ghosts eaten (default)', () => {
            const score = getGhostScore(0);
            expect(score).toBe(200);
        });

        test('returns 200 for negative count (default)', () => {
            const score = getGhostScore(-1);
            expect(score).toBe(200);
        });

        test('returns 200 for count 0.5 (default)', () => {
            const score = getGhostScore(0.5);
            expect(score).toBe(200);
        });
    });

    describe('Matches scoreValues.ghost array', () => {
        test('scores match scoreValues.ghost array', () => {
            const ghostScores = scoreValues.ghost;

            ghostScores.forEach((expectedScore, index) => {
                const count = index;
                const actualScore = getGhostScore(count);
                expect(actualScore).toBe(expectedScore);
            });
        });
    });
});

describe('CollisionDetection - resetGhostEatenCount', () => {
    describe('Function existence', () => {
        test('resetGhostEatenCount function exists', () => {
            expect(typeof resetGhostEatenCount).toBe('function');
        });

        test('resetGhostEatenCount can be called without error', () => {
            expect(() => resetGhostEatenCount()).not.toThrow();
        });

        test('resetGhostEatenCount returns undefined', () => {
            const result = resetGhostEatenCount();
            expect(result).toBeUndefined();
        });
    });
});
