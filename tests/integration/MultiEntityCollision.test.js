import { CollisionSystem } from '../../src/systems/CollisionSystem.js';
import Pacman from '../../src/entities/Pacman.js';
import Ghost from '../../src/entities/Ghost.js';
import { collisionConfig, gameConfig, scoreValues, directions } from '../../src/config/gameConfig.js';
import { TILE_TYPES } from '../../src/utils/MazeLayout.js';
import { createMockScene, createMockMaze } from '../utils/testHelpers.js';

describe('Multi Entity Collision Integration', () => {
    let mockScene;
    let mockMaze;
    let collisionSystem;
    let pacman;
    let ghosts;

    beforeEach(() => {
        mockScene = createMockScene();
        mockScene.gameState = { level: 1 };
        mockMaze = createMockMaze(createTestMaze());
        collisionSystem = new CollisionSystem(mockScene);
        collisionSystem.setMaze(mockMaze);
    });

    describe('Pacman-Ghost Collision Detection', () => {
        beforeEach(() => {
            pacman = new Pacman(mockScene, 3, 3);
            ghosts = [
                new Ghost(mockScene, 5, 3, 'blinky', 0xFF0000),
                new Ghost(mockScene, 3, 5, 'pinky', 0xFFB8FF)
            ];
            collisionSystem.setPacman(pacman);
            collisionSystem.setGhosts(ghosts);
        });

        test('detects collision with normal ghost (pacman dies)', () => {
            ghosts[0].x = pacman.x + 5;
            ghosts[0].y = pacman.y;
            ghosts[0].prevX = ghosts[0].x;
            ghosts[0].prevY = ghosts[0].y;

            const result = collisionSystem.checkGhostCollision();

            expect(result).not.toBeNull();
            expect(result.type).toBe('pacman_died');
            expect(result.score).toBe(0);
        });

        test('detects collision with frightened ghost (ghost eaten)', () => {
            ghosts[0].isFrightened = true;
            ghosts[0].x = pacman.x + 5;
            ghosts[0].y = pacman.y;
            ghosts[0].prevX = ghosts[0].x;
            ghosts[0].prevY = ghosts[0].y;

            const result = collisionSystem.checkGhostCollision();

            expect(result).not.toBeNull();
            expect(result.type).toBe('ghost_eaten');
            expect(result.score).toBe(scoreValues.ghost[0]);
            expect(ghosts[0].isEaten).toBe(true);
        });

        test('ignores eaten ghosts', () => {
            ghosts[0].isEaten = true;
            ghosts[0].x = pacman.x;
            ghosts[0].y = pacman.y;

            const result = collisionSystem.checkGhostCollision();

            expect(result).toBeNull();
        });

        test('detects collision with multiple ghosts', () => {
            ghosts[0].x = pacman.x + 100;
            ghosts[0].y = pacman.y + 5;
            ghosts[1].x = pacman.x + 5;
            ghosts[1].y = pacman.y;
            ghosts[0].prevX = ghosts[0].x;
            ghosts[0].prevY = ghosts[0].y;
            ghosts[1].prevX = ghosts[1].x;
            ghosts[1].prevY = ghosts[1].y;

            const result = collisionSystem.checkGhostCollision();

            expect(result).not.toBeNull();
            expect(result.type).toBe('pacman_died');
        });

        test('increases score for consecutive ghost eating', () => {
            ghosts[0].isFrightened = true;
            ghosts[1].isFrightened = true;

            ghosts[0].x = pacman.x + 5;
            ghosts[0].y = pacman.y;
            ghosts[0].prevX = ghosts[0].x;
            ghosts[0].prevY = ghosts[0].y;

            const result1 = collisionSystem.checkGhostCollision();
            expect(result1.score).toBe(scoreValues.ghost[0]);
            expect(collisionSystem.ghostsEatenCount).toBe(1);

            ghosts[0].isEaten = true;
            ghosts[1].x = pacman.x + 5;
            ghosts[1].y = pacman.y;
            ghosts[1].prevX = ghosts[1].x;
            ghosts[1].prevY = ghosts[1].y;

            const result2 = collisionSystem.checkGhostCollision();
            expect(result2.score).toBe(scoreValues.ghost[1]);
            expect(collisionSystem.ghostsEatenCount).toBe(2);
        });
    });

    describe('Crossed Path Detection', () => {
        beforeEach(() => {
            pacman = new Pacman(mockScene, 3, 3);
            pacman.prevX = pacman.x;
            pacman.prevY = pacman.y;
            ghosts = [
                new Ghost(mockScene, 5, 3, 'blinky', 0xFF0000)
            ];
            collisionSystem.setPacman(pacman);
            collisionSystem.setGhosts(ghosts);
        });

        test('detects crossed paths - horizontal crossing', () => {
            pacman.prevX = pacman.x - gameConfig.tileSize;
            pacman.x = pacman.prevX + gameConfig.tileSize * 2;

            ghosts[0].prevX = pacman.x - gameConfig.tileSize;
            ghosts[0].prevY = pacman.y + 5;
            ghosts[0].x = ghosts[0].prevX + gameConfig.tileSize * 2;
            ghosts[0].y = pacman.y - 5;

            const result = collisionSystem.checkGhostCollision();

            expect(result).not.toBeNull();
            expect(result.type).toBe('pacman_died');
        });

        test('detects crossed paths - vertical crossing', () => {
            pacman.prevY = pacman.y - gameConfig.tileSize;
            pacman.y = pacman.prevY + gameConfig.tileSize * 2;

            ghosts[0].prevX = pacman.x + 5;
            ghosts[0].prevY = pacman.y - gameConfig.tileSize;
            ghosts[0].x = pacman.x - 5;
            ghosts[0].y = ghosts[0].prevY + gameConfig.tileSize * 2;

            const result = collisionSystem.checkGhostCollision();

            expect(result).not.toBeNull();
            expect(result.type).toBe('pacman_died');
        });

        test('detects crossed paths with frightened ghost', () => {
            ghosts[0].isFrightened = true;
            pacman.prevX = pacman.x - gameConfig.tileSize;
            pacman.x = pacman.prevX + gameConfig.tileSize * 2;

            ghosts[0].prevX = pacman.x - gameConfig.tileSize;
            ghosts[0].prevY = pacman.y + 5;
            ghosts[0].x = ghosts[0].prevX + gameConfig.tileSize * 2;
            ghosts[0].y = pacman.y - 5;

            const result = collisionSystem.checkGhostCollision();

            expect(result).not.toBeNull();
            expect(result.type).toBe('ghost_eaten');
            expect(ghosts[0].isEaten).toBe(true);
        });

        test('returns null when paths do not cross', () => {
            pacman.prevX = pacman.x - gameConfig.tileSize;
            pacman.x = pacman.prevX + gameConfig.tileSize;

            ghosts[0].prevX = pacman.x + gameConfig.tileSize * 3;
            ghosts[0].prevY = pacman.y;
            ghosts[0].x = ghosts[0].prevX + gameConfig.tileSize;
            ghosts[0].y = pacman.y;

            const result = collisionSystem.checkGhostCollision();

            expect(result).toBeNull();
        });

        test('handles pacman moving past stationary ghost', () => {
            pacman.prevX = pacman.x - gameConfig.tileSize * 2;
            pacman.x = pacman.x + gameConfig.tileSize;

            ghosts[0].x = pacman.x + gameConfig.tileSize / 2;
            ghosts[0].y = pacman.y;
            ghosts[0].prevX = ghosts[0].x;
            ghosts[0].prevY = ghosts[0].y;

            const result = collisionSystem.checkGhostCollision();

            expect(result).not.toBeNull();
            expect(result.type).toBe('pacman_died');
        });

        test('handles ghost moving past stationary pacman', () => {
            ghosts[0].prevX = pacman.x - gameConfig.tileSize * 2;
            ghosts[0].x = pacman.x + gameConfig.tileSize;
            ghosts[0].y = pacman.y;

            const result = collisionSystem.checkGhostCollision();

            expect(result).not.toBeNull();
            expect(result.type).toBe('pacman_died');
        });
    });

    describe('Swept AABB Collision', () => {
        beforeEach(() => {
            pacman = new Pacman(mockScene, 3, 3);
            pacman.prevX = pacman.x;
            pacman.prevY = pacman.y;
            ghosts = [
                new Ghost(mockScene, 3, 3, 'blinky', 0xFF0000)
            ];
            collisionSystem.setPacman(pacman);
            collisionSystem.setGhosts(ghosts);
        });

        test('detects ghost passing through pacman in one frame', () => {
            const threshold = collisionConfig.radius;

            ghosts[0].prevX = pacman.x - threshold * 2;
            ghosts[0].prevY = pacman.y;
            ghosts[0].x = pacman.x + threshold * 2;
            ghosts[0].y = pacman.y;

            pacman.prevX = pacman.x;
            pacman.prevY = pacman.y;

            const result = collisionSystem.checkGhostCollision();

            expect(result).not.toBeNull();
            expect(result.type).toBe('pacman_died');
        });

        test('detects swept collision with vertical movement', () => {
            const threshold = collisionConfig.radius;

            ghosts[0].prevX = pacman.x;
            ghosts[0].prevY = pacman.y - threshold * 2;
            ghosts[0].x = pacman.x;
            ghosts[0].y = pacman.y + threshold * 2;

            pacman.prevX = pacman.x;
            pacman.prevY = pacman.y;

            const result = collisionSystem.checkGhostCollision();

            expect(result).not.toBeNull();
        });

        test('detects swept collision with diagonal movement', () => {
            const threshold = collisionConfig.radius;

            ghosts[0].prevX = pacman.x - threshold * 2;
            ghosts[0].prevY = pacman.y - threshold * 2;
            ghosts[0].x = pacman.x + threshold * 2;
            ghosts[0].y = pacman.y + threshold * 2;

            pacman.prevX = pacman.x;
            pacman.prevY = pacman.y;

            const result = collisionSystem.checkGhostCollision();

            expect(result).not.toBeNull();
        });

        test('does not detect collision when ghost path misses pacman', () => {
            const threshold = collisionConfig.radius;

            ghosts[0].prevX = pacman.x - threshold * 2;
            ghosts[0].prevY = pacman.y - threshold * 4;
            ghosts[0].x = pacman.x + threshold * 2;
            ghosts[0].y = pacman.y - threshold * 4;

            pacman.prevX = pacman.x;
            pacman.prevY = pacman.y;

            const result = collisionSystem.checkGhostCollision();

            expect(result).toBeNull();
        });

        test('handles bidirectional swept collision', () => {
            const threshold = collisionConfig.radius;

            pacman.prevX = pacman.x - threshold;
            pacman.x = pacman.x + threshold;

            ghosts[0].prevX = ghosts[0].x;
            ghosts[0].prevY = ghosts[0].y;

            const result = collisionSystem.checkGhostCollision();

            expect(result).not.toBeNull();
        });
    });

    describe('Distance-Based Collision Fallback', () => {
        beforeEach(() => {
            pacman = new Pacman(mockScene, 3, 3);
            ghosts = [
                new Ghost(mockScene, 3, 3, 'blinky', 0xFF0000)
            ];
            collisionSystem.setPacman(pacman);
            collisionSystem.setGhosts(ghosts);
        });

        test('uses distance collision when prev positions undefined', () => {
            ghosts[0].x = pacman.x + gameConfig.tileSize * 0.5;
            ghosts[0].y = pacman.y;

            const result = collisionSystem.checkGhostCollision();

            expect(result).not.toBeNull();
        });

        test('detects collision within threshold', () => {
            const threshold = collisionConfig.radius;
            ghosts[0].x = pacman.x + threshold - 1;
            ghosts[0].y = pacman.y;
            ghosts[0].prevX = ghosts[0].x;
            ghosts[0].prevY = ghosts[0].y;

            const result = collisionSystem.checkGhostCollision();

            expect(result).not.toBeNull();
        });

        test('does not detect collision outside threshold', () => {
            const threshold = collisionConfig.radius;
            ghosts[0].x = pacman.x + threshold + 1;
            ghosts[0].y = pacman.y;
            ghosts[0].prevX = ghosts[0].x;
            ghosts[0].prevY = ghosts[0].y;

            const result = collisionSystem.checkGhostCollision();

            expect(result).toBeNull();
        });

        test('handles stationary entities with distance check', () => {
            ghosts[0].x = pacman.x + gameConfig.tileSize * 0.4;
            ghosts[0].y = pacman.y;
            ghosts[0].prevX = ghosts[0].x;
            ghosts[0].prevY = ghosts[0].y;

            pacman.prevX = pacman.x;
            pacman.prevY = pacman.y;

            const result = collisionSystem.checkGhostCollision();

            expect(result).not.toBeNull();
        });

        test('distance collision with frightened ghost', () => {
            ghosts[0].isFrightened = true;
            ghosts[0].x = pacman.x + gameConfig.tileSize * 0.4;
            ghosts[0].y = pacman.y;

            const result = collisionSystem.checkGhostCollision();

            expect(result).not.toBeNull();
            expect(result.type).toBe('ghost_eaten');
        });
    });

    describe('Ghost-Ghost Collision', () => {
        let ghost1, ghost2, ghost3;

        beforeEach(() => {
            pacman = new Pacman(mockScene, 3, 3);
            ghost1 = new Ghost(mockScene, 5, 3, 'blinky', 0xFF0000);
            ghost2 = new Ghost(mockScene, 3, 5, 'pinky', 0xFFB8FF);
            ghost3 = new Ghost(mockScene, 5, 5, 'inky', 0x00FFFF);

            ghosts = [ghost1, ghost2, ghost3];
            collisionSystem.setPacman(pacman);
            collisionSystem.setGhosts(ghosts);
        });

        test('ghosts can occupy same position', () => {
            ghost1.x = ghost2.x;
            ghost1.y = ghost2.y;

            expect(ghost1.x).toBe(ghost2.x);
            expect(ghost1.y).toBe(ghost2.y);
        });

        test('eaten ghost does not collide with other ghosts', () => {
            ghost1.isEaten = true;
            ghost2.isFrightened = false;

            ghost1.x = ghost2.x;
            ghost1.y = ghost2.y;

            const result = collisionSystem.checkGhostCollision();
            expect(result).toBeNull();
        });

        test('frightened and normal ghosts can overlap', () => {
            ghost1.isFrightened = true;
            ghost2.isFrightened = false;

            ghost1.x = ghost2.x;
            ghost1.y = ghost2.y;

            expect(ghost1.x).toBe(ghost2.x);
        });

        test('multiple frightened ghosts at same position', () => {
            ghost1.isFrightened = true;
            ghost2.isFrightened = true;
            ghost3.isFrightened = true;

            ghost1.x = ghost2.x = ghost3.x;
            ghost1.y = ghost2.y = ghost3.y;

            expect(collisionSystem.checkGhostCollision()).toBeNull();
        });

        test('ghosts can cross paths without collision', () => {
            ghost1.prevX = ghost1.x - gameConfig.tileSize;
            ghost1.x = ghost1.prevX + gameConfig.tileSize * 2;

            ghost2.prevY = ghost2.y - gameConfig.tileSize;
            ghost2.y = ghost2.prevY + gameConfig.tileSize * 2;

            const result = collisionSystem.checkGhostCollision();
            expect(result).toBeNull();
        });
    });

    describe('Integration Scenarios', () => {
        beforeEach(() => {
            pacman = new Pacman(mockScene, 3, 3);
            ghosts = [
                new Ghost(mockScene, 5, 3, 'blinky', 0xFF0000),
                new Ghost(mockScene, 3, 5, 'pinky', 0xFFB8FF),
                new Ghost(mockScene, 5, 5, 'inky', 0x00FFFF),
                new Ghost(mockScene, 7, 7, 'clyde', 0xFFB852)
            ];
            collisionSystem.setPacman(pacman);
            collisionSystem.setGhosts(ghosts);
        });

        test('power pellet activates and ghosts can be eaten sequentially', () => {
            collisionSystem.reset();

            ghosts.forEach(g => g.isFrightened = true);

            ghosts[0].x = pacman.x + 5;
            ghosts[0].y = pacman.y;
            ghosts[0].prevX = ghosts[0].x;
            ghosts[0].prevY = ghosts[0].y;

            let result = collisionSystem.checkGhostCollision();
            expect(result.type).toBe('ghost_eaten');
            expect(result.score).toBe(scoreValues.ghost[0]);

            ghosts[0].isEaten = true;
            ghosts[1].x = pacman.x + 5;
            ghosts[1].y = pacman.y;
            ghosts[1].prevX = ghosts[1].x;
            ghosts[1].prevY = ghosts[1].y;

            result = collisionSystem.checkGhostCollision();
            expect(result.type).toBe('ghost_eaten');
            expect(result.score).toBe(scoreValues.ghost[1]);

            ghosts[1].isEaten = true;
            ghosts[2].x = pacman.x + 5;
            ghosts[2].y = pacman.y;
            ghosts[2].prevX = ghosts[2].x;
            ghosts[2].prevY = ghosts[2].y;

            result = collisionSystem.checkGhostCollision();
            expect(result.type).toBe('ghost_eaten');
            expect(result.score).toBe(scoreValues.ghost[2]);
        });

        test('mixed collision methods in single frame', () => {
            ghosts[0].x = pacman.x + gameConfig.tileSize * 0.5;
            ghosts[0].y = pacman.y;

            ghosts[1].prevX = pacman.x - gameConfig.tileSize;
            ghosts[1].prevY = pacman.y + 5;
            ghosts[1].x = pacman.x + gameConfig.tileSize;
            ghosts[1].y = pacman.y - 5;

            const result = collisionSystem.checkGhostCollision();
            expect(result).not.toBeNull();
            expect(result.type).toBe('pacman_died');
        });

        test('fast ghost passes through pacman detection', () => {
            const threshold = collisionConfig.radius;

            pacman.prevX = pacman.x;
            pacman.prevY = pacman.y;

            ghosts[0].prevX = pacman.x - threshold * 3;
            ghosts[0].prevY = pacman.y;
            ghosts[0].x = pacman.x + threshold * 3;
            ghosts[0].y = pacman.y;

            const result = collisionSystem.checkGhostCollision();
            expect(result).not.toBeNull();
        });

        test('collision system resets correctly', () => {
            ghosts[0].isFrightened = true;
            ghosts[0].x = pacman.x + 5;
            ghosts[0].y = pacman.y;

            collisionSystem.checkGhostCollision();
            expect(collisionSystem.ghostsEatenCount).toBeGreaterThan(0);

            collisionSystem.reset();
            expect(collisionSystem.ghostsEatenCount).toBe(0);
        });
    });

    describe('Edge Cases', () => {
        beforeEach(() => {
            pacman = new Pacman(mockScene, 3, 3);
            ghosts = [new Ghost(mockScene, 5, 3, 'blinky', 0xFF0000)];
            collisionSystem.setPacman(pacman);
            collisionSystem.setGhosts(ghosts);
        });

        test('handles ghost at exact threshold distance', () => {
            const threshold = collisionConfig.radius;
            ghosts[0].x = pacman.x + threshold - 0.1;
            ghosts[0].y = pacman.y;

            const result = collisionSystem.checkGhostCollision();
            expect(result).not.toBeNull();
        });

        test('handles ghost just outside threshold', () => {
            const threshold = collisionConfig.radius;
            ghosts[0].x = pacman.x + threshold + 0.1;
            ghosts[0].y = pacman.y;

            const result = collisionSystem.checkGhostCollision();
            expect(result).toBeNull();
        });

        test('handles ghost with zero movement', () => {
            ghosts[0].x = pacman.x + gameConfig.tileSize * 0.5;
            ghosts[0].y = pacman.y;
            ghosts[0].prevX = ghosts[0].x;
            ghosts[0].prevY = ghosts[0].y;

            pacman.prevX = pacman.x;
            pacman.prevY = pacman.y;

            const result = collisionSystem.checkGhostCollision();
            expect(result).not.toBeNull();
        });

        test('handles pacman with zero movement', () => {
            pacman.prevX = pacman.x;
            pacman.prevY = pacman.y;

            ghosts[0].x = pacman.x + gameConfig.tileSize * 0.5;
            ghosts[0].y = pacman.y;
            ghosts[0].prevX = ghosts[0].x - 10;
            ghosts[0].prevY = ghosts[0].y;

            const result = collisionSystem.checkGhostCollision();
            expect(result).not.toBeNull();
        });

        test('handles very small movement increments', () => {
            ghosts[0].x = pacman.x + 0.1;
            ghosts[0].y = pacman.y;
            ghosts[0].prevX = ghosts[0].x;
            ghosts[0].prevY = ghosts[0].y;

            const result = collisionSystem.checkGhostCollision();
            expect(result).not.toBeNull();
        });
    });
});

function createTestMaze() {
    const maze = [];
    for (let y = 0; y < 10; y++) {
        const row = [];
        for (let x = 0; x < 10; x++) {
            if (x === 0 || x === 9 || y === 0 || y === 9) {
                row.push(TILE_TYPES.WALL);
            } else {
                row.push(TILE_TYPES.PATH);
            }
        }
        maze.push(row);
    }
    return maze;
}
