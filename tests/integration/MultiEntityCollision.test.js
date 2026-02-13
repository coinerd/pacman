import {
    collisionConfig,
    directions,
    gameConfig,
    scoreValues
} from '../../src/config/gameConfig.js';
import Enemy from '../../src/entities/Enemy.js';
import Pacman from '../../src/entities/Pacman.js';
import { CollisionSystem } from '../../src/systems/CollisionSystem.js';
import { TILE_TYPES } from '../../src/utils/MazeLayout.js';
import { createMockMaze, createMockScene } from '../utils/testHelpers.js';

describe('Multi Entity Collision Integration', () => {
    let mockScene;
    let mockMaze;
    let collisionSystem;
    let pacman;
    let enemies;

    beforeEach(() => {
        mockScene = createMockScene();
        mockScene.gameState = { level: 1 };
        mockMaze = createMockMaze(createTestMaze());
        collisionSystem = new CollisionSystem(mockScene);
        collisionSystem.setMaze(mockMaze);
    });

    describe('Pacman-Enemy Collision Detection', () => {
        beforeEach(() => {
            pacman = new Pacman(mockScene, 3, 3);
            enemies = [
                new Enemy(mockScene, 5, 3, 'blinky', 0xff0000),
                new Enemy(mockScene, 3, 5, 'pinky', 0xffb8ff)
            ];
            collisionSystem.setPacman(pacman);
            collisionSystem.setGhosts(enemies);
        });

        test('detects collision with normal ghost (pacman dies)', () => {
            enemies[0].x = pacman.x + 5;
            enemies[0].y = pacman.y;
            enemies[0].prevX = enemies[0].x;
            enemies[0].prevY = enemies[0].y;

            const result = collisionSystem.checkGhostCollision();

            expect(result).not.toBeNull();
            expect(result.type).toBe('pacman_died');
            expect(result.score).toBe(0);
        });

        test('detects collision with frightened ghost (ghost eaten)', () => {
            enemies[0].isFrightened = true;
            enemies[0].x = pacman.x + 5;
            enemies[0].y = pacman.y;
            enemies[0].prevX = enemies[0].x;
            enemies[0].prevY = enemies[0].y;

            const result = collisionSystem.checkGhostCollision();

            expect(result).not.toBeNull();
            expect(result.type).toBe('ghost_eaten');
            expect(result.score).toBe(scoreValues.ghost[0]);
            expect(enemies[0].isEaten).toBe(true);
        });

        test('ignores eaten enemies', () => {
            enemies[0].isEaten = true;
            enemies[0].x = pacman.x;
            enemies[0].y = pacman.y;

            const result = collisionSystem.checkGhostCollision();

            expect(result).toBeNull();
        });

        test('detects collision with multiple enemies', () => {
            enemies[0].x = pacman.x + 100;
            enemies[0].y = pacman.y + 5;
            enemies[1].x = pacman.x + 5;
            enemies[1].y = pacman.y;
            enemies[0].prevX = enemies[0].x;
            enemies[0].prevY = enemies[0].y;
            enemies[1].prevX = enemies[1].x;
            enemies[1].prevY = enemies[1].y;

            const result = collisionSystem.checkGhostCollision();

            expect(result).not.toBeNull();
            expect(result.type).toBe('pacman_died');
        });

        test('increases score for consecutive ghost eating', () => {
            enemies[0].isFrightened = true;
            enemies[1].isFrightened = true;

            enemies[0].x = pacman.x + 5;
            enemies[0].y = pacman.y;
            enemies[0].prevX = enemies[0].x;
            enemies[0].prevY = enemies[0].y;

            const result1 = collisionSystem.checkGhostCollision();
            expect(result1.score).toBe(scoreValues.ghost[0]);
            expect(collisionSystem.enemiesEatenCount).toBe(1);

            enemies[0].isEaten = true;
            enemies[1].x = pacman.x + 5;
            enemies[1].y = pacman.y;
            enemies[1].prevX = enemies[1].x;
            enemies[1].prevY = enemies[1].y;

            const result2 = collisionSystem.checkGhostCollision();
            expect(result2.score).toBe(scoreValues.ghost[1]);
            expect(collisionSystem.enemiesEatenCount).toBe(2);
        });
    });

    describe('Crossed Path Detection', () => {
        beforeEach(() => {
            pacman = new Pacman(mockScene, 3, 3);
            pacman.prevX = pacman.x;
            pacman.prevY = pacman.y;
            enemies = [new Enemy(mockScene, 5, 3, 'blinky', 0xff0000)];
            collisionSystem.setPacman(pacman);
            collisionSystem.setGhosts(enemies);
        });

        test('detects crossed paths - horizontal crossing', () => {
            pacman.prevX = pacman.x - gameConfig.tileSize;
            pacman.x = pacman.prevX + gameConfig.tileSize * 2;

            enemies[0].prevX = pacman.x - gameConfig.tileSize;
            enemies[0].prevY = pacman.y + 5;
            enemies[0].x = enemies[0].prevX + gameConfig.tileSize * 2;
            enemies[0].y = pacman.y - 5;

            const result = collisionSystem.checkGhostCollision();

            expect(result).not.toBeNull();
            expect(result.type).toBe('pacman_died');
        });

        test('detects crossed paths - vertical crossing', () => {
            pacman.prevY = pacman.y - gameConfig.tileSize;
            pacman.y = pacman.prevY + gameConfig.tileSize * 2;

            enemies[0].prevX = pacman.x + 5;
            enemies[0].prevY = pacman.y - gameConfig.tileSize;
            enemies[0].x = pacman.x - 5;
            enemies[0].y = enemies[0].prevY + gameConfig.tileSize * 2;

            const result = collisionSystem.checkGhostCollision();

            expect(result).not.toBeNull();
            expect(result.type).toBe('pacman_died');
        });

        test('detects crossed paths with frightened ghost', () => {
            enemies[0].isFrightened = true;
            pacman.prevX = pacman.x - gameConfig.tileSize;
            pacman.x = pacman.prevX + gameConfig.tileSize * 2;

            enemies[0].prevX = pacman.x - gameConfig.tileSize;
            enemies[0].prevY = pacman.y + 5;
            enemies[0].x = enemies[0].prevX + gameConfig.tileSize * 2;
            enemies[0].y = pacman.y - 5;

            const result = collisionSystem.checkGhostCollision();

            expect(result).not.toBeNull();
            expect(result.type).toBe('ghost_eaten');
            expect(enemies[0].isEaten).toBe(true);
        });

        test('returns null when paths do not cross', () => {
            pacman.prevX = pacman.x - gameConfig.tileSize;
            pacman.x = pacman.prevX + gameConfig.tileSize;

            enemies[0].prevX = pacman.x + gameConfig.tileSize * 3;
            enemies[0].prevY = pacman.y;
            enemies[0].x = enemies[0].prevX + gameConfig.tileSize;
            enemies[0].y = pacman.y;

            const result = collisionSystem.checkGhostCollision();

            expect(result).toBeNull();
        });

        test('handles pacman moving past stationary ghost', () => {
            pacman.prevX = pacman.x - gameConfig.tileSize * 2;
            pacman.x = pacman.x + gameConfig.tileSize;

            enemies[0].x = pacman.x + gameConfig.tileSize / 2;
            enemies[0].y = pacman.y;
            enemies[0].prevX = enemies[0].x;
            enemies[0].prevY = enemies[0].y;

            const result = collisionSystem.checkGhostCollision();

            expect(result).not.toBeNull();
            expect(result.type).toBe('pacman_died');
        });

        test('handles ghost moving past stationary pacman', () => {
            enemies[0].prevX = pacman.x - gameConfig.tileSize * 2;
            enemies[0].x = pacman.x + gameConfig.tileSize;
            enemies[0].y = pacman.y;

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
            enemies = [new Enemy(mockScene, 3, 3, 'blinky', 0xff0000)];
            collisionSystem.setPacman(pacman);
            collisionSystem.setGhosts(enemies);
        });

        test('detects ghost passing through pacman in one frame', () => {
            const threshold = collisionConfig.radius;

            enemies[0].prevX = pacman.x - threshold * 2;
            enemies[0].prevY = pacman.y;
            enemies[0].x = pacman.x + threshold * 2;
            enemies[0].y = pacman.y;

            pacman.prevX = pacman.x;
            pacman.prevY = pacman.y;

            const result = collisionSystem.checkGhostCollision();

            expect(result).not.toBeNull();
            expect(result.type).toBe('pacman_died');
        });

        test('detects swept collision with vertical movement', () => {
            const threshold = collisionConfig.radius;

            enemies[0].prevX = pacman.x;
            enemies[0].prevY = pacman.y - threshold * 2;
            enemies[0].x = pacman.x;
            enemies[0].y = pacman.y + threshold * 2;

            pacman.prevX = pacman.x;
            pacman.prevY = pacman.y;

            const result = collisionSystem.checkGhostCollision();

            expect(result).not.toBeNull();
        });

        test('detects swept collision with diagonal movement', () => {
            const threshold = collisionConfig.radius;

            enemies[0].prevX = pacman.x - threshold * 2;
            enemies[0].prevY = pacman.y - threshold * 2;
            enemies[0].x = pacman.x + threshold * 2;
            enemies[0].y = pacman.y + threshold * 2;

            pacman.prevX = pacman.x;
            pacman.prevY = pacman.y;

            const result = collisionSystem.checkGhostCollision();

            expect(result).not.toBeNull();
        });

        test('does not detect collision when ghost path misses pacman', () => {
            const threshold = collisionConfig.radius;

            enemies[0].prevX = pacman.x - threshold * 2;
            enemies[0].prevY = pacman.y - threshold * 4;
            enemies[0].x = pacman.x + threshold * 2;
            enemies[0].y = pacman.y - threshold * 4;

            pacman.prevX = pacman.x;
            pacman.prevY = pacman.y;

            const result = collisionSystem.checkGhostCollision();

            expect(result).toBeNull();
        });

        test('handles bidirectional swept collision', () => {
            const threshold = collisionConfig.radius;

            pacman.prevX = pacman.x - threshold;
            pacman.x = pacman.x + threshold;

            enemies[0].prevX = enemies[0].x;
            enemies[0].prevY = enemies[0].y;

            const result = collisionSystem.checkGhostCollision();

            expect(result).not.toBeNull();
        });
    });

    describe('Distance-Based Collision Fallback', () => {
        beforeEach(() => {
            pacman = new Pacman(mockScene, 3, 3);
            enemies = [new Enemy(mockScene, 3, 3, 'blinky', 0xff0000)];
            collisionSystem.setPacman(pacman);
            collisionSystem.setGhosts(enemies);
        });

        test('uses distance collision when prev positions undefined', () => {
            enemies[0].x = pacman.x + gameConfig.tileSize * 0.5;
            enemies[0].y = pacman.y;

            const result = collisionSystem.checkGhostCollision();

            expect(result).not.toBeNull();
        });

        test('detects collision within threshold', () => {
            const threshold = collisionConfig.radius;
            enemies[0].x = pacman.x + threshold - 1;
            enemies[0].y = pacman.y;
            enemies[0].prevX = enemies[0].x;
            enemies[0].prevY = enemies[0].y;

            const result = collisionSystem.checkGhostCollision();

            expect(result).not.toBeNull();
        });

        test('does not detect collision outside threshold', () => {
            const threshold = collisionConfig.radius;
            enemies[0].x = pacman.x + threshold + 1;
            enemies[0].y = pacman.y;
            enemies[0].prevX = enemies[0].x;
            enemies[0].prevY = enemies[0].y;

            const result = collisionSystem.checkGhostCollision();

            expect(result).toBeNull();
        });

        test('handles stationary entities with distance check', () => {
            enemies[0].x = pacman.x + gameConfig.tileSize * 0.4;
            enemies[0].y = pacman.y;
            enemies[0].prevX = enemies[0].x;
            enemies[0].prevY = enemies[0].y;

            pacman.prevX = pacman.x;
            pacman.prevY = pacman.y;

            const result = collisionSystem.checkGhostCollision();

            expect(result).not.toBeNull();
        });

        test('distance collision with frightened ghost', () => {
            enemies[0].isFrightened = true;
            enemies[0].x = pacman.x + gameConfig.tileSize * 0.4;
            enemies[0].y = pacman.y;

            const result = collisionSystem.checkGhostCollision();

            expect(result).not.toBeNull();
            expect(result.type).toBe('ghost_eaten');
        });
    });

    describe('Enemy-Enemy Collision', () => {
        let ghost1, ghost2, ghost3;

        beforeEach(() => {
            pacman = new Pacman(mockScene, 3, 3);
            ghost1 = new Enemy(mockScene, 5, 3, 'blinky', 0xff0000);
            ghost2 = new Enemy(mockScene, 3, 5, 'pinky', 0xffb8ff);
            ghost3 = new Enemy(mockScene, 5, 5, 'inky', 0x00ffff);

            enemies = [ghost1, ghost2, ghost3];
            collisionSystem.setPacman(pacman);
            collisionSystem.setGhosts(enemies);
        });

        test('enemies can occupy same position', () => {
            ghost1.x = ghost2.x;
            ghost1.y = ghost2.y;

            expect(ghost1.x).toBe(ghost2.x);
            expect(ghost1.y).toBe(ghost2.y);
        });

        test('eaten ghost does not collide with other enemies', () => {
            ghost1.isEaten = true;
            ghost2.isFrightened = false;

            ghost1.x = ghost2.x;
            ghost1.y = ghost2.y;

            const result = collisionSystem.checkGhostCollision();
            expect(result).toBeNull();
        });

        test('frightened and normal enemies can overlap', () => {
            ghost1.isFrightened = true;
            ghost2.isFrightened = false;

            ghost1.x = ghost2.x;
            ghost1.y = ghost2.y;

            expect(ghost1.x).toBe(ghost2.x);
        });

        test('multiple frightened enemies at same position', () => {
            ghost1.isFrightened = true;
            ghost2.isFrightened = true;
            ghost3.isFrightened = true;

            ghost1.x = ghost2.x = ghost3.x;
            ghost1.y = ghost2.y = ghost3.y;

            expect(collisionSystem.checkGhostCollision()).toBeNull();
        });

        test('enemies can cross paths without collision', () => {
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
            enemies = [
                new Enemy(mockScene, 5, 3, 'blinky', 0xff0000),
                new Enemy(mockScene, 3, 5, 'pinky', 0xffb8ff),
                new Enemy(mockScene, 5, 5, 'inky', 0x00ffff),
                new Enemy(mockScene, 7, 7, 'clyde', 0xffb852)
            ];
            collisionSystem.setPacman(pacman);
            collisionSystem.setGhosts(enemies);
        });

        test('power pellet activates and enemies can be eaten sequentially', () => {
            collisionSystem.reset();

            enemies.forEach((g) => (g.isFrightened = true));

            enemies[0].x = pacman.x + 5;
            enemies[0].y = pacman.y;
            enemies[0].prevX = enemies[0].x;
            enemies[0].prevY = enemies[0].y;

            let result = collisionSystem.checkGhostCollision();
            expect(result.type).toBe('ghost_eaten');
            expect(result.score).toBe(scoreValues.ghost[0]);

            enemies[0].isEaten = true;
            enemies[1].x = pacman.x + 5;
            enemies[1].y = pacman.y;
            enemies[1].prevX = enemies[1].x;
            enemies[1].prevY = enemies[1].y;

            result = collisionSystem.checkGhostCollision();
            expect(result.type).toBe('ghost_eaten');
            expect(result.score).toBe(scoreValues.ghost[1]);

            enemies[1].isEaten = true;
            enemies[2].x = pacman.x + 5;
            enemies[2].y = pacman.y;
            enemies[2].prevX = enemies[2].x;
            enemies[2].prevY = enemies[2].y;

            result = collisionSystem.checkGhostCollision();
            expect(result.type).toBe('ghost_eaten');
            expect(result.score).toBe(scoreValues.ghost[2]);
        });

        test('mixed collision methods in single frame', () => {
            enemies[0].x = pacman.x + gameConfig.tileSize * 0.5;
            enemies[0].y = pacman.y;

            enemies[1].prevX = pacman.x - gameConfig.tileSize;
            enemies[1].prevY = pacman.y + 5;
            enemies[1].x = pacman.x + gameConfig.tileSize;
            enemies[1].y = pacman.y - 5;

            const result = collisionSystem.checkGhostCollision();
            expect(result).not.toBeNull();
            expect(result.type).toBe('pacman_died');
        });

        test('fast ghost passes through pacman detection', () => {
            const threshold = collisionConfig.radius;

            pacman.prevX = pacman.x;
            pacman.prevY = pacman.y;

            enemies[0].prevX = pacman.x - threshold * 3;
            enemies[0].prevY = pacman.y;
            enemies[0].x = pacman.x + threshold * 3;
            enemies[0].y = pacman.y;

            const result = collisionSystem.checkGhostCollision();
            expect(result).not.toBeNull();
        });

        test('collision system resets correctly', () => {
            enemies[0].isFrightened = true;
            enemies[0].x = pacman.x + 5;
            enemies[0].y = pacman.y;

            collisionSystem.checkGhostCollision();
            expect(collisionSystem.enemiesEatenCount).toBeGreaterThan(0);

            collisionSystem.reset();
            expect(collisionSystem.enemiesEatenCount).toBe(0);
        });
    });

    describe('Edge Cases', () => {
        beforeEach(() => {
            pacman = new Pacman(mockScene, 3, 3);
            enemies = [new Enemy(mockScene, 5, 3, 'blinky', 0xff0000)];
            collisionSystem.setPacman(pacman);
            collisionSystem.setGhosts(enemies);
        });

        test('handles ghost at exact threshold distance', () => {
            const threshold = collisionConfig.radius;
            enemies[0].x = pacman.x + threshold - 0.1;
            enemies[0].y = pacman.y;

            const result = collisionSystem.checkGhostCollision();
            expect(result).not.toBeNull();
        });

        test('handles ghost just outside threshold', () => {
            const threshold = collisionConfig.radius;
            enemies[0].x = pacman.x + threshold + 0.1;
            enemies[0].y = pacman.y;

            const result = collisionSystem.checkGhostCollision();
            expect(result).toBeNull();
        });

        test('handles ghost with zero movement', () => {
            enemies[0].x = pacman.x + gameConfig.tileSize * 0.5;
            enemies[0].y = pacman.y;
            enemies[0].prevX = enemies[0].x;
            enemies[0].prevY = enemies[0].y;

            pacman.prevX = pacman.x;
            pacman.prevY = pacman.y;

            const result = collisionSystem.checkGhostCollision();
            expect(result).not.toBeNull();
        });

        test('handles pacman with zero movement', () => {
            pacman.prevX = pacman.x;
            pacman.prevY = pacman.y;

            enemies[0].x = pacman.x + gameConfig.tileSize * 0.5;
            enemies[0].y = pacman.y;
            enemies[0].prevX = enemies[0].x - 10;
            enemies[0].prevY = enemies[0].y;

            const result = collisionSystem.checkGhostCollision();
            expect(result).not.toBeNull();
        });

        test('handles very small movement increments', () => {
            enemies[0].x = pacman.x + 0.1;
            enemies[0].y = pacman.y;
            enemies[0].prevX = enemies[0].x;
            enemies[0].prevY = enemies[0].y;

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
