import { CollisionSystem } from '../../src/systems/CollisionSystem.js';
import { gameConfig, scoreValues } from '../../src/config/gameConfig.js';
import { TILE_TYPES } from '../../src/utils/MazeLayout.js';
import { sweptAABBCollision, distanceCollision, lineSegmentsIntersect } from '../../src/utils/CollisionUtils.js';

describe('CollisionSystem - Bug Fixes', () => {
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
            x: 270,
            y: 270,
            prevX: 270,
            prevY: 270,
            gridX: 13,
            gridY: 13
        };

        mockGhosts = [
            {
                x: 270,
                y: 270,
                prevX: 200,
                prevY: 270,
                isFrightened: false,
                isEaten: false,
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
            active: [],
            release: jest.fn()
        };

        mockPowerPelletPool = {
            active: [],
            release: jest.fn()
        };

        collisionSystem = new CollisionSystem(mockScene);
        collisionSystem.setPacman(mockPacman);
        collisionSystem.setGhosts(mockGhosts);
        collisionSystem.setMaze(mockMaze);
        collisionSystem.setPelletSprites([], []);
        collisionSystem.setPelletPool(mockPelletPool);
        collisionSystem.setPowerPelletPool(mockPowerPelletPool);
    });

    describe('Bug Fix: Ghost collision with path crossing', () => {
        test('detects collision when ghost path crosses Pac-Man path', () => {
            mockPacman.x = 270;
            mockPacman.y = 270;
            mockPacman.prevX = 270;
            mockPacman.prevY = 200;

            mockGhosts[0].x = 270;
            mockGhosts[0].y = 270;
            mockGhosts[0].prevX = 200;
            mockGhosts[0].prevY = 270;

            const result = collisionSystem.checkGhostCollision();

            expect(result).not.toBeNull();
            expect(result.type).toBe('pacman_died');
        });

        test('detects collision when path crosses even when entities end far apart', () => {
            mockPacman.x = 280;
            mockPacman.y = 270;
            mockPacman.prevX = 280;
            mockPacman.prevY = 200;

            mockGhosts[0].x = 200;
            mockGhosts[0].y = 270;
            mockGhosts[0].prevX = 280;
            mockGhosts[0].prevY = 270;

            const result = collisionSystem.checkGhostCollision();

            expect(result).not.toBeNull();
        });

        test('eats frightened ghost when paths cross', () => {
            mockGhosts[0].isFrightened = true;
            mockPacman.x = 270;
            mockPacman.y = 270;
            mockPacman.prevX = 270;
            mockPacman.prevY = 200;

            mockGhosts[0].x = 270;
            mockGhosts[0].y = 270;
            mockGhosts[0].prevX = 200;
            mockGhosts[0].prevY = 270;

            const result = collisionSystem.checkGhostCollision();

            expect(result.type).toBe('ghost_eaten');
            expect(mockGhosts[0].eat).toHaveBeenCalled();
        });
    });

    describe('Bug Fix: Path crossing when only one entity moves', () => {
        test('detects collision when only ghost moves through Pac-Man', () => {
            mockPacman.x = 270;
            mockPacman.y = 270;
            mockPacman.prevX = 270;
            mockPacman.prevY = 270;

            mockGhosts[0].x = 300;
            mockGhosts[0].y = 270;
            mockGhosts[0].prevX = 200;
            mockGhosts[0].prevY = 270;

            const result = collisionSystem.checkGhostCollision();

            expect(result).not.toBeNull();
        });

        test('detects collision when only Pac-Man moves through ghost', () => {
            mockPacman.x = 300;
            mockPacman.y = 270;
            mockPacman.prevX = 200;
            mockPacman.prevY = 270;

            mockGhosts[0].x = 270;
            mockGhosts[0].y = 270;
            mockGhosts[0].prevX = 270;
            mockGhosts[0].prevY = 270;

            const result = collisionSystem.checkGhostCollision();

            expect(result).not.toBeNull();
        });
    });

    describe('Bug Fix: Correct collision radius (16px not 8px)', () => {
        test('uses correct collision radius for swept AABB', () => {
            const collisionDistance = gameConfig.tileSize * 0.8;
            mockPacman.x = 270;
            mockPacman.y = 270;
            mockPacman.prevX = 270;
            mockPacman.prevY = 270;

            mockGhosts[0].x = 270 + collisionDistance - 1;
            mockGhosts[0].y = 270;
            mockGhosts[0].prevX = 200;
            mockGhosts[0].prevY = 270;

            const result = collisionSystem.checkGhostCollision();

            expect(result).not.toBeNull();
        });

        test('does not detect collision when distance equals threshold', () => {
            const collisionDistance = gameConfig.tileSize * 0.8;
            mockPacman.x = 270;
            mockPacman.y = 270;
            mockPacman.prevX = 270;
            mockPacman.prevY = 270;

            mockGhosts[0].x = 270 + collisionDistance;
            mockGhosts[0].y = 270;
            mockGhosts[0].prevX = 270 + collisionDistance;
            mockGhosts[0].prevY = 270;

            const result = collisionSystem.checkGhostCollision();

            expect(result).toBeNull();
        });

        test('correctly handles entities at 16px distance', () => {
            const collisionDistance = gameConfig.tileSize * 0.8;
            mockPacman.x = 270;
            mockPacman.y = 270;

            mockGhosts[0].x = 270 + collisionDistance - 0.1;
            mockGhosts[0].y = 270;
            mockGhosts[0].prevX = 270 + collisionDistance - 0.1;
            mockGhosts[0].prevY = 270;

            const result = collisionSystem.checkGhostCollision();

            expect(result).not.toBeNull();
        });
    });

    describe('Bug Fix: Path crossing checked before distance fallback', () => {
        test('checks path crossing when both entities moved', () => {
            mockPacman.x = 300;
            mockPacman.y = 270;
            mockPacman.prevX = 200;
            mockPacman.prevY = 270;

            mockGhosts[0].x = 200;
            mockGhosts[0].y = 270;
            mockGhosts[0].prevX = 300;
            mockGhosts[0].prevY = 270;

            const result = collisionSystem.checkGhostCollision();

            expect(result).not.toBeNull();
        });

        test('prioritizes path crossing over distance check', () => {
            mockPacman.x = 300;
            mockPacman.y = 270;
            mockPacman.prevX = 200;
            mockPacman.prevY = 270;

            mockGhosts[0].x = 200;
            mockGhosts[0].y = 270;
            mockGhosts[0].prevX = 300;
            mockGhosts[0].prevY = 270;

            const checkCrossedPathSpy = jest.spyOn(collisionSystem, 'checkCrossedPathCollision');

            collisionSystem.checkGhostCollision();

            expect(checkCrossedPathSpy).toHaveBeenCalled();
        });
    });

    describe('Swept AABB Collision with Correct Radius', () => {
        test('uses 16px radius for swept detection', () => {
            const ghostPrevX = 100;
            const ghostPrevY = 100;
            const ghostCurrX = 140;
            const ghostCurrY = 100;
            const pacmanX = 120;
            const pacmanY = 100;
            const radius = gameConfig.tileSize * 0.8;

            const result = sweptAABBCollision(
                ghostPrevX, ghostPrevY, ghostCurrX, ghostCurrY,
                pacmanX, pacmanY,
                radius
            );

            expect(result).toBe(true);
        });

        test('detects collision when path passes through larger radius', () => {
            const ghostPrevX = 50;
            const ghostPrevY = 100;
            const ghostCurrX = 130;
            const ghostCurrY = 100;
            const pacmanX = 100;
            const pacmanY = 100;
            const radius = gameConfig.tileSize * 0.8;

            const result = sweptAABBCollision(
                ghostPrevX, ghostPrevY, ghostCurrX, ghostCurrY,
                pacmanX, pacmanY,
                radius
            );

            expect(result).toBe(true);
        });
    });

    describe('Integration: Ghost catching Pac-Man', () => {
        test('Pacman dies when ghost collides at speed', () => {
            mockPacman.x = 270;
            mockPacman.y = 270;
            mockPacman.prevX = 250;
            mockPacman.prevY = 270;

            mockGhosts[0].x = 270;
            mockGhosts[0].y = 270;
            mockGhosts[0].prevX = 290;
            mockGhosts[0].prevY = 270;
            mockGhosts[0].isFrightened = false;

            const result = collisionSystem.checkGhostCollision();

            expect(result).not.toBeNull();
            expect(result.type).toBe('pacman_died');
        });

        test('Pacman can eat frightened ghost', () => {
            mockPacman.x = 270;
            mockPacman.y = 270;
            mockPacman.prevX = 250;
            mockPacman.prevY = 270;

            mockGhosts[0].x = 270;
            mockGhosts[0].y = 270;
            mockGhosts[0].prevX = 290;
            mockGhosts[0].prevY = 270;
            mockGhosts[0].isFrightened = true;

            const result = collisionSystem.checkGhostCollision();

            expect(result).not.toBeNull();
            expect(result.type).toBe('ghost_eaten');
            expect(result.score).toBe(scoreValues.ghost[0]);
            expect(mockGhosts[0].eat).toHaveBeenCalled();
        });

        test('multiple ghost collisions handled correctly', () => {
            const ghost2 = {
                x: 280,
                y: 270,
                prevX: 280,
                prevY: 270,
                isFrightened: true,
                isEaten: false,
                eat: jest.fn()
            };

            collisionSystem.setGhosts([mockGhosts[0], ghost2]);

            mockPacman.x = 275;
            mockPacman.y = 270;

            const result = collisionSystem.checkGhostCollision();

            expect(result).not.toBeNull();
        });
    });
});
