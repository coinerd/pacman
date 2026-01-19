import { CollisionSystem } from '../../src/systems/CollisionSystem.js';
import { gameConfig, scoreValues } from '../../src/config/gameConfig.js';
import { TILE_TYPES } from '../../src/utils/MazeLayout.js';
import { sweptAABBCollision, distanceCollision } from '../../src/utils/CollisionUtils.js';

describe('CollisionSystem', () => {
    let collisionSystem;
    let mockScene;
    let mockPacman;
    let mockGhosts;
    let mockMaze;
    let mockPelletPool;
    let mockPowerPelletPool;

    beforeEach(() => {
        mockScene = {
            add: {
                sprite: jest.fn()
            }
        };

        mockPacman = {
            x: 2 * 16,
            y: 2 * 16,
            prevX: 2 * 16,
            prevY: 2 * 16,
            gridX: 2,
            gridY: 2
        };

        mockGhosts = [
            {
                x: 3 * 16,
                y: 2 * 16,
                prevX: 3 * 16,
                prevY: 2 * 16,
                isFrightened: false,
                isEaten: false,
                eat: jest.fn()
            },
            {
                x: 1 * 16,
                y: 2 * 16,
                prevX: 1 * 16,
                prevY: 2 * 16,
                isFrightened: true,
                isEaten: false,
                eat: jest.fn()
            },
            {
                x: 2 * 16,
                y: 1 * 16,
                prevX: 2 * 16,
                prevY: 1 * 16,
                isFrightened: false,
                isEaten: true,
                eat: jest.fn()
            }
        ];

        mockMaze = [
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 2, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 1, 1, 1, 1]
        ];

        mockPelletPool = {
            active: [
                { x: 1 * 16 + 8, y: 1 * 16 + 8 },
                { x: 2 * 16 + 8, y: 1 * 16 + 8 }
            ],
            release: jest.fn(),
            getByGrid: jest.fn((gridX, gridY) => {
                return mockPelletPool.active.find(pellet => {
                    const spriteGrid = { x: Math.floor(pellet.x / 16), y: Math.floor(pellet.y / 16) };
                    return spriteGrid.x === gridX && spriteGrid.y === gridY;
                });
            })
        };

        mockPowerPelletPool = {
            active: [
                { x: 2 * 16 + 8, y: 2 * 16 + 8 }
            ],
            release: jest.fn(),
            getByGrid: jest.fn((gridX, gridY) => {
                return mockPowerPelletPool.active.find(powerPellet => {
                    const spriteGrid = { x: Math.floor(powerPellet.x / 16), y: Math.floor(powerPellet.y / 16) };
                    return spriteGrid.x === gridX && spriteGrid.y === gridY;
                });
            })
        };

        collisionSystem = new CollisionSystem(mockScene);
        collisionSystem.setPacman(mockPacman);
        collisionSystem.setGhosts(mockGhosts);
        collisionSystem.setMaze(mockMaze);
        collisionSystem.setPelletSprites([], []);
        collisionSystem.setPelletPool(mockPelletPool);
        collisionSystem.setPowerPelletPool(mockPowerPelletPool);
    });

    describe('Constructor', () => {
        test('initializes with scene parameter', () => {
            expect(collisionSystem.scene).toBe(mockScene);
        });

        test('initializes pacman as null', () => {
            const system = new CollisionSystem(mockScene);
            expect(system.pacman).toBeNull();
        });

        test('initializes ghosts as empty array', () => {
            const system = new CollisionSystem(mockScene);
            expect(system.ghosts).toEqual([]);
        });

        test('initializes maze as null', () => {
            const system = new CollisionSystem(mockScene);
            expect(system.maze).toBeNull();
        });

        test('initializes ghostsEatenCount to 0', () => {
            expect(collisionSystem.ghostsEatenCount).toBe(0);
        });
    });

    describe('setPacman()', () => {
        test('sets pacman reference', () => {
            const system = new CollisionSystem(mockScene);
            system.setPacman(mockPacman);
            expect(system.pacman).toBe(mockPacman);
        });
    });

    describe('setGhosts()', () => {
        test('sets ghosts array', () => {
            const system = new CollisionSystem(mockScene);
            system.setGhosts(mockGhosts);
            expect(system.ghosts).toBe(mockGhosts);
        });
    });

    describe('setMaze()', () => {
        test('sets maze reference', () => {
            const system = new CollisionSystem(mockScene);
            system.setMaze(mockMaze);
            expect(system.maze).toBe(mockMaze);
        });
    });

    describe('setPelletSprites()', () => {
        test('sets pellet and power pellet sprite arrays', () => {
            const system = new CollisionSystem(mockScene);
            const pelletSprites = [{ x: 0, y: 0 }];
            const powerPelletSprites = [{ x: 0, y: 0 }];
            system.setPelletSprites(pelletSprites, powerPelletSprites);
            expect(system.pelletSprites).toBe(pelletSprites);
            expect(system.powerPelletSprites).toBe(powerPelletSprites);
        });
    });

    describe('setPelletPool()', () => {
        test('sets pellet pool', () => {
            const system = new CollisionSystem(mockScene);
            system.setPelletPool(mockPelletPool);
            expect(system.pelletPool).toBe(mockPelletPool);
        });
    });

    describe('setPowerPelletPool()', () => {
        test('sets power pellet pool', () => {
            const system = new CollisionSystem(mockScene);
            system.setPowerPelletPool(mockPowerPelletPool);
            expect(system.powerPelletPool).toBe(mockPowerPelletPool);
        });
    });

    describe('checkPelletCollision()', () => {
        test('returns 0 when no pellet collision', () => {
            mockPacman.x = 0;
            mockPacman.y = 0;

            const score = collisionSystem.checkPelletCollision();

            expect(score).toBe(0);
        });

        test('returns pellet score when colliding with pellet', () => {
            mockPacman.x = 1 * 16 + 8;
            mockPacman.y = 1 * 16 + 8;

            const score = collisionSystem.checkPelletCollision();

            expect(score).toBe(scoreValues.pellet);
        });

        test('removes pellet from maze when eaten', () => {
            mockPacman.x = 1 * 16 + 8;
            mockPacman.y = 1 * 16 + 8;

            collisionSystem.checkPelletCollision();

            expect(mockMaze[1][1]).toBe(TILE_TYPES.EMPTY);
        });

        test('releases pellet from pool when eaten', () => {
            mockPacman.x = 1 * 16 + 8;
            mockPacman.y = 1 * 16 + 8;

            collisionSystem.checkPelletCollision();

            expect(mockPelletPool.release).toHaveBeenCalled();
        });

        test('only removes the specific pellet that was collided with', () => {
            mockPacman.x = 1 * 16 + 8;
            mockPacman.y = 1 * 16 + 8;

            collisionSystem.checkPelletCollision();

            expect(mockMaze[2][1]).toBe(TILE_TYPES.PELLET);
        });
    });

    describe('checkPowerPelletCollision()', () => {
        test('returns 0 when no power pellet collision', () => {
            mockPacman.x = 0;
            mockPacman.y = 0;

            const score = collisionSystem.checkPowerPelletCollision();

            expect(score).toBe(0);
        });

        test('returns power pellet score when colliding with power pellet', () => {
            mockPacman.x = 2 * 16 + 8;
            mockPacman.y = 2 * 16 + 8;

            const score = collisionSystem.checkPowerPelletCollision();

            expect(score).toBe(scoreValues.powerPellet);
        });

        test('removes power pellet from maze when eaten', () => {
            mockPacman.x = 2 * 16 + 8;
            mockPacman.y = 2 * 16 + 8;

            collisionSystem.checkPowerPelletCollision();

            expect(mockMaze[2][2]).toBe(TILE_TYPES.EMPTY);
        });

        test('releases power pellet from pool when eaten', () => {
            mockPacman.x = 2 * 16 + 8;
            mockPacman.y = 2 * 16 + 8;

            collisionSystem.checkPowerPelletCollision();

            expect(mockPowerPelletPool.release).toHaveBeenCalled();
        });

        test('resets ghostsEatenCount to 0', () => {
            collisionSystem.ghostsEatenCount = 5;
            mockPacman.x = 2 * 16 + 8;
            mockPacman.y = 2 * 16 + 8;

            collisionSystem.checkPowerPelletCollision();

            expect(collisionSystem.ghostsEatenCount).toBe(0);
        });
    });

    describe('checkGhostCollision()', () => {
        test('returns null when no ghost collision', () => {
            mockGhosts[0].x = 1000;
            mockGhosts[0].prevX = 1000;
            mockGhosts[1].x = 1000;
            mockGhosts[1].prevX = 1000;
            mockGhosts[2].x = 1000;
            mockGhosts[2].prevX = 1000;

            const result = collisionSystem.checkGhostCollision();

            expect(result).toBeNull();
        });

        test('returns pacman_died when colliding with normal ghost', () => {
            mockGhosts[0].x = 2 * 16 + 5;
            mockGhosts[0].y = 2 * 16 + 5;

            const result = collisionSystem.checkGhostCollision();

            expect(result).toEqual({
                type: 'pacman_died',
                score: 0
            });
        });

        test('returns ghost_eaten when colliding with frightened ghost', () => {
            mockGhosts[1].x = 2 * 16 + 5;
            mockGhosts[1].y = 2 * 16 + 5;

            const result = collisionSystem.checkGhostCollision();

            expect(result).toEqual({
                type: 'ghost_eaten',
                score: scoreValues.ghost[0]
            });
        });

        test('eats frightened ghost', () => {
            mockGhosts[1].x = 2 * 16 + 5;
            mockGhosts[1].y = 2 * 16 + 5;

            collisionSystem.checkGhostCollision();

            expect(mockGhosts[1].eat).toHaveBeenCalled();
        });

        test('increments ghostsEatenCount when eating frightened ghost', () => {
            mockGhosts[1].x = 2 * 16 + 5;
            mockGhosts[1].y = 2 * 16 + 5;

            collisionSystem.checkGhostCollision();

            expect(collisionSystem.ghostsEatenCount).toBe(1);
        });

        test('increases score for each consecutive ghost eaten', () => {
            collisionSystem.ghostsEatenCount = 0;
            mockGhosts[1].x = 2 * 16 + 5;
            mockGhosts[1].y = 2 * 16 + 5;

            const result1 = collisionSystem.checkGhostCollision();
            expect(result1.score).toBe(scoreValues.ghost[0]);

            collisionSystem.ghostsEatenCount = 1;
            const result2 = collisionSystem.checkGhostCollision();
            expect(result2.score).toBe(scoreValues.ghost[1]);

            collisionSystem.ghostsEatenCount = 2;
            const result3 = collisionSystem.checkGhostCollision();
            expect(result3.score).toBe(scoreValues.ghost[2]);

            collisionSystem.ghostsEatenCount = 3;
            const result4 = collisionSystem.checkGhostCollision();
            expect(result4.score).toBe(scoreValues.ghost[3]);
        });

        test('caps score at maximum when eating more than 4 ghosts', () => {
            collisionSystem.ghostsEatenCount = 10;
            mockGhosts[1].x = 2 * 16 + 5;
            mockGhosts[1].y = 2 * 16 + 5;

            const result = collisionSystem.checkGhostCollision();

            expect(result.score).toBe(scoreValues.ghost[3]);
        });

        test('ignores eaten ghosts', () => {
            mockGhosts[2].x = 2 * 16 + 5;
            mockGhosts[2].y = 2 * 16 + 5;
            mockGhosts[2].isEaten = true;

            const result = collisionSystem.checkGhostCollision();

            expect(result).toBeNull();
        });

        test('uses collision threshold from gameConfig', () => {
            const threshold = gameConfig.tileSize * 0.8;
            mockGhosts[0].x = mockPacman.x + threshold - 1;
            mockGhosts[0].y = mockPacman.y;

            const result = collisionSystem.checkGhostCollision();

            expect(result).not.toBeNull();
        });
    });

    describe('checkAllCollisions()', () => {
        test('returns object with all collision results', () => {
            const results = collisionSystem.checkAllCollisions();

            expect(results).toHaveProperty('pelletScore');
            expect(results).toHaveProperty('powerPelletScore');
            expect(results).toHaveProperty('ghostCollision');
        });

        test('calls checkPelletCollision and includes result', () => {
            mockPacman.x = 1 * 16 + 8;
            mockPacman.y = 1 * 16 + 8;

            const results = collisionSystem.checkAllCollisions();

            expect(results.pelletScore).toBe(scoreValues.pellet);
        });

        test('calls checkPowerPelletCollision and includes result', () => {
            mockPacman.x = 2 * 16 + 8;
            mockPacman.y = 2 * 16 + 8;

            const results = collisionSystem.checkAllCollisions();

            expect(results.powerPelletScore).toBe(scoreValues.powerPellet);
        });

        test('calls checkGhostCollision and includes result', () => {
            mockGhosts[0].x = 2 * 16 + 5;
            mockGhosts[0].y = 2 * 16 + 5;

            const results = collisionSystem.checkAllCollisions();

            expect(results.ghostCollision).toEqual({
                type: 'pacman_died',
                score: 0
            });
        });

        test('combines all collision results', () => {
            mockPacman.x = 1 * 16 + 8;
            mockPacman.y = 1 * 16 + 8;
            mockGhosts[1].x = 1 * 16 + 8;
            mockGhosts[1].y = 1 * 16 + 8;

            const results = collisionSystem.checkAllCollisions();

            expect(results.pelletScore).toBe(scoreValues.pellet);
            expect(results.powerPelletScore).toBe(0);
            expect(results.ghostCollision).toEqual({
                type: 'ghost_eaten',
                score: expect.any(Number)
            });
        });
    });

    describe('checkWinCondition()', () => {
        test('returns false when pellets remain', () => {
            const result = collisionSystem.checkWinCondition();
            expect(result).toBe(false);
        });

        test('returns true when no pellets remain', () => {
            mockMaze[1][1] = TILE_TYPES.EMPTY;
            mockMaze[1][2] = TILE_TYPES.EMPTY;
            mockMaze[1][3] = TILE_TYPES.EMPTY;
            mockMaze[2][1] = TILE_TYPES.EMPTY;
            mockMaze[2][2] = TILE_TYPES.EMPTY;
            mockMaze[2][3] = TILE_TYPES.EMPTY;
            mockMaze[3][1] = TILE_TYPES.EMPTY;
            mockMaze[3][2] = TILE_TYPES.EMPTY;
            mockMaze[3][3] = TILE_TYPES.EMPTY;

            const result = collisionSystem.checkWinCondition();

            expect(result).toBe(true);
        });
    });

    describe('reset()', () => {
        test('resets ghostsEatenCount to 0', () => {
            collisionSystem.ghostsEatenCount = 5;

            collisionSystem.reset();

            expect(collisionSystem.ghostsEatenCount).toBe(0);
        });
    });

    describe('Integration: Complete collision scenario', () => {
        test('handles eating all pellets and winning', () => {
            mockPacman.x = 1 * 16 + 8;
            mockPacman.y = 1 * 16 + 8;

            let totalScore = 0;
            totalScore += collisionSystem.checkPelletCollision();

            mockPacman.x = 2 * 16 + 8;
            mockPacman.y = 1 * 16 + 8;
            totalScore += collisionSystem.checkPelletCollision();

            expect(totalScore).toBeGreaterThan(0);
        });

        test('handles power pellet activation and ghost eating sequence', () => {
            mockPacman.x = 2 * 16 + 8;
            mockPacman.y = 2 * 16 + 8;

            collisionSystem.checkPowerPelletCollision();
            expect(collisionSystem.ghostsEatenCount).toBe(0);

            mockGhosts[1].x = 2 * 16 + 5;
            mockGhosts[1].y = 2 * 16 + 5;
            mockGhosts[1].prevX = 2 * 16 + 5;
            mockGhosts[1].prevY = 2 * 16 + 5;

            mockGhosts[0].x = 1000;
            mockGhosts[0].y = 1000;
            mockGhosts[0].prevX = 1000;
            mockGhosts[0].prevY = 1000;

            const result1 = collisionSystem.checkGhostCollision();
            expect(result1.type).toBe('ghost_eaten');
            expect(collisionSystem.ghostsEatenCount).toBe(1);
            expect(mockGhosts[1].eat).toHaveBeenCalled();
            mockGhosts[1].isEaten = true;

            mockGhosts[0].x = 2 * 16 + 5;
            mockGhosts[0].y = 2 * 16 + 5;
            mockGhosts[0].prevX = 2 * 16 + 5;
            mockGhosts[0].prevY = 2 * 16 + 5;
            mockGhosts[0].isFrightened = true;

            const result2 = collisionSystem.checkGhostCollision();
            expect(result2.type).toBe('ghost_eaten');
            expect(collisionSystem.ghostsEatenCount).toBe(2);
        });

        test('handles pacman death collision', () => {
            mockGhosts[0].x = 2 * 16 + 5;
            mockGhosts[0].y = 2 * 16 + 5;

            const result = collisionSystem.checkAllCollisions();

            expect(result.ghostCollision.type).toBe('pacman_died');
            expect(result.ghostCollision.score).toBe(0);
        });
    });

    describe('Swept Collision Detection', () => {
        test('detects collision when ghost passes through Pac-Man in one frame', () => {
            const ghostPrevX = 50;
            const ghostPrevY = 100;
            const ghostCurrX = 110;
            const ghostCurrY = 100;
            const pacmanX = 100;
            const pacmanY = 100;
            const radius = 10;

            const result = sweptAABBCollision(
                ghostPrevX, ghostPrevY, ghostCurrX, ghostCurrY,
                pacmanX, pacmanY,
                radius
            );

            expect(result).toBe(true);
        });

        test('does not detect collision when ghost is too far', () => {
            const ghostPrevX = 50;
            const ghostPrevY = 100;
            const ghostCurrX = 80;
            const ghostCurrY = 100;
            const pacmanX = 100;
            const pacmanY = 100;
            const radius = 10;

            const result = sweptAABBCollision(
                ghostPrevX, ghostPrevY, ghostCurrX, ghostCurrY,
                pacmanX, pacmanY,
                radius
            );

            expect(result).toBe(false);
        });

        test('detects collision with vertical movement', () => {
            const ghostPrevX = 100;
            const ghostPrevY = 50;
            const ghostCurrX = 100;
            const ghostCurrY = 110;
            const pacmanX = 100;
            const pacmanY = 100;
            const radius = 10;

            const result = sweptAABBCollision(
                ghostPrevX, ghostPrevY, ghostCurrX, ghostCurrY,
                pacmanX, pacmanY,
                radius
            );

            expect(result).toBe(true);
        });

        test('detects collision with diagonal movement', () => {
            const ghostPrevX = 50;
            const ghostPrevY = 50;
            const ghostCurrX = 110;
            const ghostCurrY = 110;
            const pacmanX = 80;
            const pacmanY = 80;
            const radius = 10;

            const result = sweptAABBCollision(
                ghostPrevX, ghostPrevY, ghostCurrX, ghostCurrY,
                pacmanX, pacmanY,
                radius
            );

            expect(result).toBe(true);
        });

        test('detects collision when ghost starts inside Pac-Man', () => {
            const ghostPrevX = 100;
            const ghostPrevY = 100;
            const ghostCurrX = 120;
            const ghostCurrY = 100;
            const pacmanX = 100;
            const pacmanY = 100;
            const radius = 10;

            const result = sweptAABBCollision(
                ghostPrevX, ghostPrevY, ghostCurrX, ghostCurrY,
                pacmanX, pacmanY,
                radius
            );

            expect(result).toBe(true);
        });

        test('distance collision detects nearby objects', () => {
            const x1 = 100;
            const y1 = 100;
            const x2 = 105;
            const y2 = 100;
            const threshold = 10;

            const result = distanceCollision(x1, y1, x2, y2, threshold);

            expect(result).toBe(true);
        });

        test('distance collision does not detect far objects', () => {
            const x1 = 100;
            const y1 = 100;
            const x2 = 120;
            const y2 = 120;
            const threshold = 10;

            const result = distanceCollision(x1, y1, x2, y2, threshold);

            expect(result).toBe(false);
        });
    });
});
