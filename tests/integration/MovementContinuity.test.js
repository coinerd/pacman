import Pacman from '../../src/entities/Pacman.js';
import Ghost from '../../src/entities/Ghost.js';
import { directions, gameConfig } from '../../src/config/gameConfig.js';
import { TILE_TYPES } from '../../src/utils/MazeLayout.js';
import { createMockScene, createMockMaze } from '../utils/testHelpers.js';

describe('Movement continuity integration', () => {
    let mockScene;
    let mockMaze;

    beforeEach(() => {
        mockScene = createMockScene();
        mockScene.gameState = { level: 1 };
        mockMaze = createMockMaze(createTestMaze());
    });

    test('Pacman and ghosts move every fixed step', () => {
        const pacman = new Pacman(mockScene, 3, 3);
        const ghost = new Ghost(mockScene, 4, 3, 'blinky', 0xFF0000);

        pacman.setSpeed(300);
        ghost.speed = 300;

        pacman.direction = directions.RIGHT;
        ghost.setDirection(directions.LEFT);

        const deltaSeconds = 1 / 60;
        const initialPacmanX = pacman.x;
        const initialGhostX = ghost.x;
        const pacmanCheckpoints = [];
        const ghostCheckpoints = [];

        for (let i = 0; i < 60; i += 1) {
            pacman.update(deltaSeconds, mockMaze);
            ghost.update(deltaSeconds, mockMaze, pacman);

            if ((i + 1) % 10 === 0) {
                pacmanCheckpoints.push(pacman.x);
                ghostCheckpoints.push(ghost.x);
            }
        }

        for (let i = 1; i < pacmanCheckpoints.length; i += 1) {
            expect(pacmanCheckpoints[i]).toBeGreaterThan(pacmanCheckpoints[i - 1]);
            expect(ghostCheckpoints[i]).toBeLessThan(ghostCheckpoints[i - 1]);
        }

        expect(pacman.x).toBeGreaterThan(initialPacmanX);
        expect(ghost.x).toBeLessThan(initialGhostX);
        expect(pacman.x).toBeGreaterThan(0);
        expect(ghost.x).toBeLessThan(ghost.startGridX * gameConfig.tileSize + gameConfig.tileSize / 2);
    });
});

function createTestMaze() {
    const maze = [];
    for (let y = 0; y < 7; y += 1) {
        const row = [];
        for (let x = 0; x < 7; x += 1) {
            if (x === 0 || x === 6 || y === 0 || y === 6) {
                row.push(TILE_TYPES.WALL);
            } else {
                row.push(TILE_TYPES.PATH);
            }
        }
        maze.push(row);
    }
    return maze;
}
