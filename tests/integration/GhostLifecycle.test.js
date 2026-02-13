import { directions, ghostModes } from '../../src/config/gameConfig.js';
import Enemy from '../../src/entities/Enemy.js';
import { CollisionSystem } from '../../src/systems/CollisionSystem.js';
import { EnemyAISystem } from '../../src/systems/EnemyAISystem.js';
import { TILE_TYPES } from '../../src/utils/MazeLayout.js';
import { msToSeconds } from '../../src/utils/Time.js';
import {
    createMockMaze,
    createMockPlayer,
    createMockScene
} from '../utils/testHelpers.js';

describe('Enemy Lifecycle Integration', () => {
    let mockScene;
    let enemy;
    let aiSystem;
    let collisionSystem;
    let mockMaze;

    beforeEach(() => {
        mockScene = createMockScene();
        mockMaze = createMockMaze(createSimpleTestMaze());
        enemy = new Enemy(mockScene, 13, 14, 'alpha', 0xff0000);
        aiSystem = new EnemyAISystem();
        aiSystem.setEnemies([enemy]);
        collisionSystem = new CollisionSystem(mockScene);
        collisionSystem.setMaze(mockMaze);
    });

    test('normal -> frightened -> eaten -> respawn cycle', () => {
        expect(enemy.isFrightened).toBe(false);
        expect(enemy.isEaten).toBe(false);
        expect(enemy.mode).toBe(ghostModes.SCATTER);

        enemy.setFrightened(msToSeconds(8000));
        expect(enemy.isFrightened).toBe(true);
        expect(enemy.speed).toBe(enemy.baseSpeed * 0.5);

        enemy.updateFrightened(msToSeconds(8000));
        expect(enemy.isFrightened).toBe(false);
        expect(enemy.speed).toBe(enemy.baseSpeed);

        const pacman = {
            ...createMockPlayer(),
            x: enemy.x,
            y: enemy.y,
            gridX: Math.floor(enemy.x / 20),
            gridY: Math.floor(enemy.y / 20)
        };
        collisionSystem.setPacman(pacman);
        collisionSystem.setGhosts([enemy]);
        enemy.isFrightened = true;

        const result = collisionSystem.checkGhostCollision();
        expect(result.type).toBe('ghost_eaten');
        expect(enemy.isEaten).toBe(true);

        enemy.gridX = 13;
        enemy.gridY = 14;
        enemy.inGhostHouse = true;
        enemy.houseTimer = 2000;

        enemy.updateEaten(2000, mockMaze);
        expect(enemy.inGhostHouse).toBe(false);
        expect(enemy.isEaten).toBe(false);
        expect(enemy.mode).toBe(ghostModes.SCATTER);
    });

    test('multiple ghosts with combo scoring', () => {
        const ghosts = [
            new Enemy(mockScene, 10, 10, 'alpha', 0xff0000),
            new Enemy(mockScene, 12, 10, 'beta', 0xffb8ff),
            new Enemy(mockScene, 14, 10, 'gamma', 0x00ffff),
            new Enemy(mockScene, 16, 10, 'delta', 0xffb852)
        ];

        ghosts.forEach((g) => {
            g.isFrightened = true;
        });
        ghosts.forEach((g) => {
            g.x = 100;
        });
        ghosts.forEach((g) => {
            g.y = 100;
        });

        const pacman = {
            ...createMockPlayer(),
            x: 100,
            y: 100,
            gridX: Math.floor(100 / 20),
            gridY: Math.floor(100 / 20)
        };
        collisionSystem.setPacman(pacman);
        collisionSystem.setGhosts(ghosts);

        const scores = [];
        for (let i = 0; i < 4; i++) {
            const result = collisionSystem.checkGhostCollision();
            if (result) {
                scores.push(result.score);
            }
        }

        expect(scores).toEqual([250, 500, 1000, 2000]);
    });

    test('ghost behavior across level progression', () => {
        mockScene.gameState.level = 1;
        enemy = new Enemy(mockScene, 13, 14, 'alpha', 0xff0000);
        const level1Speed = enemy.speed;

        mockScene.gameState.level = 2;
        enemy = new Enemy(mockScene, 13, 14, 'alpha', 0xff0000);
        const level2Speed = enemy.speed;

        expect(level2Speed).toBeGreaterThan(level1Speed);
    });
});

function createSimpleTestMaze() {
    const maze = [];
    for (let y = 0; y < 31; y++) {
        const row = [];
        for (let x = 0; x < 28; x++) {
            if (x === 0 || x === 27 || y === 0 || y === 30) {
                row.push(TILE_TYPES.WALL);
            } else {
                row.push(TILE_TYPES.PATH);
            }
        }
        maze.push(row);
    }
    return maze;
}
