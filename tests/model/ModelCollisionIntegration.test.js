/**
 * Model Collision Integration Tests
 * Tests the full integration of model-based collision detection
 */

import { directions, ghostModes } from '../../src/config/gameConfig.js';
import { GameState } from '../../src/model/GameState.js';
import { GameStateController } from '../../src/model/GameStateController.js';
import { ModelStateAdapter } from '../../src/model/ModelStateAdapter.js';
import { ModelCollisionSystem } from '../../src/model/systems/ModelCollisionSystem.js';
import { PELLET_TYPES } from '../../src/utils/MazeLayout.js';

describe('Model Collision Integration', () => {
    describe('Enemy Collision Detection', () => {
        let gameState;
        let collisionSystem;

        beforeEach(() => {
            gameState = new GameState({ level: 1 });
            collisionSystem = new ModelCollisionSystem(gameState);
        });

        it('should detect collision when pacman and ghost overlap', () => {
            // Position pacman and ghost at same location
            gameState.pacman.x = 100;
            gameState.pacman.y = 100;
            gameState.pacman.prevX = 100;
            gameState.pacman.prevY = 100;

            gameState.ghosts[0].x = 100;
            gameState.ghosts[0].y = 100;
            gameState.ghosts[0].prevX = 100;
            gameState.ghosts[0].prevY = 100;

            const collision = collisionSystem.checkGhostCollisions();

            expect(collision).not.toBeNull();
            expect(collision.type).toBe('pacman_died');
        });

        it('should detect ghost_eaten when ghost is frightened', () => {
            // Set ghost as frightened
            gameState.ghosts[0].isFrightened = true;
            gameState.ghosts[0].mode = ghostModes.FRIGHTENED;

            // Position at same location
            gameState.pacman.x = 100;
            gameState.pacman.y = 100;
            gameState.pacman.prevX = 100;
            gameState.pacman.prevY = 100;

            gameState.ghosts[0].x = 100;
            gameState.ghosts[0].y = 100;
            gameState.ghosts[0].prevX = 100;
            gameState.ghosts[0].prevY = 100;

            const collision = collisionSystem.checkGhostCollisions();

            expect(collision).not.toBeNull();
            expect(collision.type).toBe('ghost_eaten');
            expect(collision.score).toBeGreaterThan(0);
        });

        it('should not detect collision with eaten ghost', () => {
            // Mark ghost as eaten
            gameState.ghosts[0].isEaten = true;

            // Position at same location
            gameState.pacman.x = 100;
            gameState.pacman.y = 100;
            gameState.ghosts[0].x = 100;
            gameState.ghosts[0].y = 100;

            const collision = collisionSystem.checkGhostCollisions();

            expect(collision).toBeNull();
        });

        it('should detect swept collision when entities cross paths', () => {
            // Entities moving past each other between frames
            gameState.pacman.x = 100;
            gameState.pacman.y = 100;
            gameState.pacman.prevX = 0; // Moving right
            gameState.pacman.prevY = 50;

            gameState.ghosts[0].x = 0;
            gameState.ghosts[0].y = 50;
            gameState.ghosts[0].prevX = 100; // Moving left
            gameState.ghosts[0].prevY = 100;

            const collision = collisionSystem.checkGhostCollisions();

            // Should detect path crossing
            expect(collision).not.toBeNull();
        });

        it('should combo ghosts eaten in sequence', () => {
            // Set all ghosts as frightened
            for (const ghost of gameState.ghosts) {
                ghost.isFrightened = true;
                ghost.mode = ghostModes.FRIGHTENED;
            }

            // Eat first ghost
            gameState.pacman.x = 100;
            gameState.pacman.y = 100;
            gameState.ghosts[0].x = 100;
            gameState.ghosts[0].y = 100;

            const result1 = collisionSystem.handleGhostCollision(gameState.ghosts[0]);
            expect(result1.combo).toBe(1);
            expect(result1.score).toBe(200);

            // Eat second ghost
            gameState.pacman.x = 150;
            gameState.pacman.y = 150;
            gameState.ghosts[1].x = 150;
            gameState.ghosts[1].y = 150;

            const result2 = collisionSystem.handleGhostCollision(gameState.ghosts[1]);
            expect(result2.combo).toBe(2);
            expect(result2.score).toBe(400);
        });
    });

    describe('Pellet Collision Detection', () => {
        let gameState;
        let collisionSystem;

        beforeEach(() => {
            gameState = new GameState({ level: 1 });
            collisionSystem = new ModelCollisionSystem(gameState);
        });

        it('should detect regular pellet collision', () => {
            // Place pacman on a pellet tile (tileSize is 20)
            gameState.pacman.x = 40; // Grid x = 2
            gameState.pacman.y = 40; // Grid y = 2
            gameState.pacman.gridX = 2;
            gameState.pacman.gridY = 2;

            // Ensure there's a pellet at that position (and no power pellet)
            // Reset pellet grid first
            gameState.pelletGrid = gameState.pelletGrid.map((row) =>
                row.map(() => PELLET_TYPES.NONE)
            );
            gameState.pelletGrid[2][2] = PELLET_TYPES.PELLET;
            gameState.pelletsRemaining = 1;

            const event = collisionSystem.checkPelletCollision();

            expect(event).not.toBeNull();
            expect(event.type).toBe('pellet_eaten');
            expect(event.score).toBe(15);
        });

        it('should detect power pellet collision', () => {
            // Place pacman on power pellet
            gameState.pacman.x = 32;
            gameState.pacman.y = 32;
            gameState.pacman.gridX = 2;
            gameState.pacman.gridY = 2;

            gameState.pelletGrid[2][2] = PELLET_TYPES.POWER_PELLET;

            const event = collisionSystem.checkPelletCollision();

            expect(event).not.toBeNull();
            expect(event.type).toBe('power_pellet_eaten');
            expect(event.score).toBe(75);
            expect(event.frightenedDuration).toBeDefined();
        });

        it('should not double-count same pellet', () => {
            // Position on pellet
            gameState.pacman.x = 32;
            gameState.pacman.y = 32;
            gameState.pacman.gridX = 2;
            gameState.pacman.gridY = 2;

            gameState.pelletGrid[2][2] = PELLET_TYPES.PELLET;

            // First check
            const event1 = collisionSystem.checkPelletCollision();
            expect(event1).not.toBeNull();

            // Second check (same position)
            const event2 = collisionSystem.checkPelletCollision();
            expect(event2).toBeNull();
        });

        it('should decrement pellets remaining', () => {
            const initialPellets = gameState.pelletsRemaining;

            gameState.pacman.x = 32;
            gameState.pacman.y = 32;
            gameState.pelletGrid[2][2] = PELLET_TYPES.PELLET;

            collisionSystem.checkPelletCollision();

            expect(gameState.pelletsRemaining).toBe(initialPellets - 1);
        });

        it('should detect level complete when all pellets eaten', () => {
            // Set only one pellet
            gameState.pelletGrid = gameState.pelletGrid.map((row) =>
                row.map(() => PELLET_TYPES.NONE)
            );
            gameState.pelletGrid[2][2] = PELLET_TYPES.PELLET;
            gameState.pelletsRemaining = 1;
            gameState.totalPellets = 1;

            gameState.pacman.x = 40;
            gameState.pacman.y = 40;
            gameState.pacman.gridX = 2;
            gameState.pacman.gridY = 2;

            // Reset collision system last pellet tracking
            collisionSystem.reset();

            const event = collisionSystem.checkPelletCollision();

            expect(event).not.toBeNull();
            expect(event.levelComplete).toBe(true);
        });
    });

    describe('Fruit Collision Detection', () => {
        let gameState;
        let collisionSystem;

        beforeEach(() => {
            gameState = new GameState({ level: 1 });
            collisionSystem = new ModelCollisionSystem(gameState);
        });

        it('should detect fruit collision when pacman touches fruit', () => {
            // Activate fruit with level (sets score)
            gameState.fruit.activate(1);
            gameState.fruit.x = 100;
            gameState.fruit.y = 100;

            // Place pacman close enough
            gameState.pacman.x = 100;
            gameState.pacman.y = 100;

            const event = collisionSystem.checkFruitCollision();

            expect(event).not.toBeNull();
            expect(event.type).toBe('fruit_eaten');
            expect(event.score).toBeGreaterThan(0);
        });

        it('should not detect collision when fruit inactive', () => {
            gameState.fruit.active = false;
            gameState.fruit.x = 100;
            gameState.fruit.y = 100;

            gameState.pacman.x = 100;
            gameState.pacman.y = 100;

            const event = collisionSystem.checkFruitCollision();

            expect(event).toBeNull();
        });

        it('should not detect collision when too far', () => {
            gameState.fruit.active = true;
            gameState.fruit.x = 0;
            gameState.fruit.y = 0;

            gameState.pacman.x = 100; // More than tileSize away
            gameState.pacman.y = 100;

            const event = collisionSystem.checkFruitCollision();

            expect(event).toBeNull();
        });
    });

    describe('Full Game Loop Integration', () => {
        it('should run complete update cycle', () => {
            const controller = new GameStateController({ level: 1 });

            // Set initial positions
            controller.state.pacman.x = 100;
            controller.state.pacman.y = 100;
            controller.state.ghosts[0].x = 200;
            controller.state.ghosts[0].y = 200;

            // Add a pellet
            controller.state.pelletGrid[6][6] = PELLET_TYPES.PELLET;

            // Run update
            const events = controller.update(1 / 60);

            // Should have events array
            expect(Array.isArray(events)).toBe(true);

            // Should track tick count
            expect(controller.state.tickCount).toBe(1);
        });

        it('should detect collision when entities at same position', () => {
            const controller = new GameStateController({ level: 1 });

            // Position ghost to be eaten (already overlapping positions)
            controller.state.ghosts[0].isFrightened = true;
            controller.state.ghosts[0].mode = ghostModes.FRIGHTENED;
            controller.state.ghosts[0].x = 50;
            controller.state.ghosts[0].y = 50;
            controller.state.ghosts[0].prevX = 50;
            controller.state.ghosts[0].prevY = 50;

            controller.state.pacman.x = 50;
            controller.state.pacman.y = 50;
            controller.state.pacman.prevX = 50;
            controller.state.pacman.prevY = 50;

            // Check collisions directly (simulating what happens in game loop)
            const collisionEvents = controller.collisionSystem.checkAllCollisions();

            // Should have ghost_eaten event
            const ghostEatenEvent = collisionEvents.find(
                (e) => e.type === 'ghost_eaten'
            );
            expect(ghostEatenEvent).toBeDefined();
            expect(ghostEatenEvent.score).toBe(200);
        });
    });

    describe('ModelStateAdapter Integration', () => {
        it('should sync and detect collision', () => {
            const gameState = new GameState({ level: 1 });
            const adapter = new ModelStateAdapter(gameState);
            const collisionSystem = new ModelCollisionSystem(gameState);

            // Create mock visual entities
            const visualPacman = {
                x: 100,
                y: 100,
                direction: directions.RIGHT,
                isDying: false,
                isMoving: true
            };

            const visualGhost = {
                ghostType: 'blinky',
                x: 100,
                y: 100,
                direction: directions.LEFT,
                isFrightened: true,
                isEaten: false
            };

            adapter.registerVisualEntities({
                pacman: visualPacman,
                ghosts: [visualGhost]
            });

            // Sync to model
            adapter.syncToModel();

            // Check collision using model
            const collision = collisionSystem.checkGhostCollisions();

            expect(collision).not.toBeNull();
            expect(collision.type).toBe('ghost_eaten');
        });

        it('should apply collision results to visual entities', () => {
            const gameState = new GameState({ level: 1 });
            const adapter = new ModelStateAdapter(gameState);

            const visualGhost = {
                ghostType: 'blinky',
                x: 100,
                y: 100,
                eat: jest.fn()
            };

            adapter.registerVisualEntities({
                ghosts: [visualGhost]
            });

            adapter.applyCollisionResults([
                {
                    type: 'ghost_eaten',
                    ghostType: 'blinky'
                }
            ]);

            expect(visualGhost.eat).toHaveBeenCalled();
        });
    });
});
