import Ghost from '../../src/entities/Ghost.js';
import { GhostAISystem } from '../../src/systems/GhostAISystem.js';
import { CollisionSystem } from '../../src/systems/CollisionSystem.js';
import { ghostModes, directions } from '../../src/config/gameConfig.js';
import { TILE_TYPES } from '../../src/utils/MazeLayout.js';
import { msToSeconds } from '../../src/utils/Time.js';
import { createMockScene, createMockMaze, createMockPacman } from '../utils/testHelpers.js';

describe('Ghost Lifecycle Integration', () => {
    let mockScene;
    let ghost;
    let aiSystem;
    let collisionSystem;
    let mockMaze;

    beforeEach(() => {
        mockScene = createMockScene();
        mockMaze = createMockMaze(createSimpleTestMaze());
        ghost = new Ghost(mockScene, 13, 14, 'blinky', 0xFF0000);
        aiSystem = new GhostAISystem();
        aiSystem.setGhosts([ghost]);
        collisionSystem = new CollisionSystem(mockScene);
        collisionSystem.setMaze(mockMaze);
    });

    test('normal -> frightened -> eaten -> respawn cycle', () => {
        expect(ghost.isFrightened).toBe(false);
        expect(ghost.isEaten).toBe(false);
        expect(ghost.mode).toBe(ghostModes.SCATTER);

        ghost.setFrightened(msToSeconds(8000));
        expect(ghost.isFrightened).toBe(true);
        expect(ghost.speed).toBe(ghost.baseSpeed * 0.5);

        ghost.updateFrightened(msToSeconds(8000));
        expect(ghost.isFrightened).toBe(false);
        expect(ghost.speed).toBe(ghost.baseSpeed);

        const pacman = { ...createMockPacman(), x: ghost.x, y: ghost.y, gridX: Math.floor(ghost.x / 20), gridY: Math.floor(ghost.y / 20) };
        collisionSystem.setPacman(pacman);
        collisionSystem.setGhosts([ghost]);
        ghost.isFrightened = true;

        const result = collisionSystem.checkGhostCollision();
        expect(result.type).toBe('ghost_eaten');
        expect(ghost.isEaten).toBe(true);

        ghost.gridX = 13;
        ghost.gridY = 14;
        ghost.inGhostHouse = true;
        ghost.houseTimer = 2000;

        ghost.updateEaten(2000, mockMaze);
        expect(ghost.inGhostHouse).toBe(false);
        expect(ghost.isEaten).toBe(false);
        expect(ghost.mode).toBe(ghostModes.SCATTER);
    });

    test('multiple ghosts with combo scoring', () => {
        const ghosts = [
            new Ghost(mockScene, 10, 10, 'blinky', 0xFF0000),
            new Ghost(mockScene, 12, 10, 'pinky', 0xFFB8FF),
            new Ghost(mockScene, 14, 10, 'inky', 0x00FFFF),
            new Ghost(mockScene, 16, 10, 'clyde', 0xFFB852)
        ];

        ghosts.forEach(g => g.isFrightened = true);
        ghosts.forEach(g => g.x = 100);
        ghosts.forEach(g => g.y = 100);

        const pacman = { ...createMockPacman(), x: 100, y: 100, gridX: Math.floor(100 / 20), gridY: Math.floor(100 / 20) };
        collisionSystem.setPacman(pacman);
        collisionSystem.setGhosts(ghosts);

        const scores = [];
        for (let i = 0; i < 4; i++) {
            const result = collisionSystem.checkGhostCollision();
            if (result) {scores.push(result.score);}
        }

        expect(scores).toEqual([200, 400, 800, 1600]);
    });

    test('ghost behavior across level progression', () => {
        mockScene.gameState = { level: 1 };
        ghost = new Ghost(mockScene, 13, 14, 'blinky', 0xFF0000);
        const level1Speed = ghost.speed;

        mockScene.gameState = { level: 2 };
        ghost = new Ghost(mockScene, 13, 14, 'blinky', 0xFF0000);
        const level2Speed = ghost.speed;

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
