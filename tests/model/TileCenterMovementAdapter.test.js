/**
 * TileCenterMovementAdapter Tests
 * Tests for tile-center movement adapter that bridges entities to strategy
 */

import { directions, gameConfig } from '../../src/config/gameConfig.js';
import { TILE_TYPES } from '../../src/utils/MazeLayout.js';
import { TileCenterMovementAdapter } from '../../src/model/adapters/TileCenterMovementAdapter.js';

describe('TileCenterMovementAdapter', () => {
    let adapter;
    let maze;

    beforeEach(() => {
        // Create simple test maze (5x5)
        maze = [
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 1, 1, 1, 1]
        ].map(row => row.map(val => {
            if (val === 1) { return TILE_TYPES.WALL; }
            return TILE_TYPES.PATH; // All non-wall tiles are PATH
        }));

        adapter = new TileCenterMovementAdapter(maze);
    });

    describe('constructor', () => {
        test('creates strategy with maze', () => {
            expect(adapter.maze).toBe(maze);
            expect(adapter.strategy).toBeDefined();
            expect(adapter.stats).toBeDefined();
        });
    });

    describe('updatePacman', () => {
        test('queues input direction', () => {
            const pacman = createMockEntity(1, 1, 'pacman');

            adapter.updatePacman(pacman, 0.016, directions.RIGHT);

            expect(pacman.nextDirection).toBe(directions.RIGHT);
        });

        test('starts movement when at tile center', () => {
            const pacman = createMockEntity(1, 1, 'pacman');
            pacman.nextDirection = directions.RIGHT;

            adapter.updatePacman(pacman, 0.016);

            // Should start movement since moveProgress is 0
            expect(pacman.isMoving).toBe(true);
            expect(pacman.moveProgress).toBeGreaterThan(0);
        });

        test('updates movement progress when moving', () => {
            const pacman = createMockEntity(1, 1, 'pacman');
            pacman.targetGridX = 2;
            pacman.targetGridY = 1;
            pacman.moveProgress = 0.5;
            pacman.isMoving = true;
            pacman.nextDirection = directions.RIGHT; // Damit Bewegung startet

            adapter.updatePacman(pacman, 0.016);

            expect(pacman.moveProgress).toBeGreaterThan(0.5);
            expect(pacman.isMoving).toBe(true);
        });

        test('completes movement and returns event', () => {
            const pacman = createMockEntity(1, 1, 'pacman');
            pacman.targetGridX = 2;
            pacman.targetGridY = 1;
            pacman.moveProgress = 0.99;
            pacman.isMoving = true; // Entity ist bereits am bewegen
            pacman.nextDirection = directions.RIGHT; // Damit Adapter weiterbewegt

            adapter.updatePacman(pacman, 0.016);

            expect(pacman.gridX).toBe(2);
            expect(pacman.gridY).toBe(1);
            expect(pacman.isMoving).toBe(false);
        });

        test('does not move when no direction', () => {
            const pacman = createMockEntity(1, 1, 'pacman');

            const events = adapter.updatePacman(pacman, 0.016);

            expect(events).toHaveLength(0);
            expect(pacman.isMoving).toBe(false);
        });
    });

    describe('updateGhost', () => {
        test('starts movement in ghost direction', () => {
            const ghost = createMockEntity(1, 2, 'ghost');
            ghost.direction = directions.RIGHT; // Direkt direction setzen
            ghost.nextDirection = directions.NONE; // nextDirection ist NONE

            adapter.updateGhost(ghost, 0.016);

            expect(ghost.isMoving).toBe(true);
            expect(ghost.moveProgress).toBeGreaterThan(0);
        });

        test('uses nextDirection if available', () => {
            const ghost = createMockEntity(1, 2, 'ghost');
            ghost.nextDirection = directions.UP;
            ghost.direction = directions.RIGHT;

            adapter.updateGhost(ghost, 0.016);

            expect(ghost.isMoving).toBe(true);
            expect(ghost.moveProgress).toBeGreaterThan(0);
        });

        test('updates movement progress when moving', () => {
            const ghost = createMockEntity(1, 2, 'ghost');
            ghost.direction = directions.RIGHT;
            ghost.targetGridX = 2;
            ghost.targetGridY = 2;
            ghost.moveProgress = 0.5;
            ghost.isMoving = true;

            adapter.updateGhost(ghost, 0.016);

            expect(ghost.moveProgress).toBeGreaterThan(0.5);
        });
    });

    describe('updateMaze', () => {
        test('updates maze data', () => {
            const newMaze = [
                [1, 1, 1],
                [1, 0, 1],
                [1, 1, 1]
            ].map(row => row.map(val => val === 1 ? TILE_TYPES.WALL : TILE_TYPES.PATH));

            adapter.updateMaze(newMaze);

            expect(adapter.maze).toBe(newMaze);
        });
    });

    describe('getStats', () => {
        test('returns adapter statistics', () => {
            const stats = adapter.getStats();

            expect(stats).toBeDefined();
            expect(stats.movesProcessed).toBeDefined();
            expect(stats.movesAttempted).toBeDefined();
        });
    });

    describe('reset', () => {
        test('resets statistics', () => {
            adapter.stats.movesAttempted = 10;
            adapter.stats.movesProcessed = 5;

            adapter.reset();

            expect(adapter.stats.movesAttempted).toBe(0);
            expect(adapter.stats.movesProcessed).toBe(0);
        });
    });
});

function createMockEntity(gridX, gridY, type) {
    const entity = {
        id: `test-${type}`,
        gridX,
        gridY,
        prevGridX: gridX,
        prevGridY: gridY,
        targetGridX: gridX,
        targetGridY: gridY,
        x: gridX * gameConfig.tileSize + gameConfig.tileSize / 2,
        y: gridY * gameConfig.tileSize + gameConfig.tileSize / 2,
        moveProgress: 0,
        isMoving: false,
        direction: directions.NONE, // Start ohne Richtung
        nextDirection: directions.NONE, // Keine gebufferte Richtung
        directionBuffer: {
            getCurrent: () => directions.NONE,
            getBuffered: () => directions.NONE,
            apply: () => {},
            queue: (dir) => { entity.nextDirection = dir; },
            reset: () => {}
        },
        speed: 100,
        type
    };

    // Add method to set direction for tests
    entity.setDirection = function(dir) {
        this.direction = dir;
    };

    return entity;
}
