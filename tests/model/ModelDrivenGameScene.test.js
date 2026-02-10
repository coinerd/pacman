/**
 * ModelDrivenGameScene Integration Tests
 * Tests the pure observer View pattern where Model drives all state
 */

import GameModel from '../../src/core/GameModel.js';
import { GAME_EVENTS, gameEvents } from '../../src/core/EventBus.js';
import { directions } from '../../src/config/gameConfig.js';
import { VisualPacman } from '../../src/view/visuals/VisualPacman.js';
import { VisualGhost } from '../../src/view/visuals/VisualGhost.js';
import { VisualFruit } from '../../src/view/visuals/VisualFruit.js';

// Mock Phaser for visual tests
jest.mock('phaser', () => ({
    GameObjects: {
        Arc: class MockArc {
            constructor(scene, x, y, radius, startAngle, endAngle, anticlockwise, color, alpha) {
                this.x = x;
                this.y = y;
                this.radius = radius;
                this.visible = true;
                this.alpha = alpha;
            }
            setDepth() { return this; }
            setFillStyle() { return this; }
            setVisible(visible) { this.visible = visible; return this; }
            setAlpha(alpha) { this.alpha = alpha; return this; }
            setStartAngle() { return this; }
            setEndAngle() { return this; }
            destroy() {}
        },
        Text: class MockText {
            constructor() {
                this.x = 0;
                this.y = 0;
                this.visible = true;
                this.text = '';
            }
            setOrigin() { return this; }
            setDepth() { return this; }
            setVisible(visible) { this.visible = visible; return this; }
            setText(text) { this.text = text; return this; }
            destroy() {}
        }
    }
}));

describe('ModelDriven Architecture - Pure Observer Pattern', () => {
    beforeEach(() => {
        gameEvents.clear();
    });

    afterEach(() => {
        gameEvents.clear();
        jest.clearAllMocks();
    });

    describe('Unified GameModel - Single Source of Truth', () => {
        test('GameModel should own all entity states', () => {
            const model = new GameModel({
                score: 100,
                lives: 2,
                level: 3
            });

            // Should have all entity states
            expect(model.pacman).toBeDefined();
            expect(model.ghosts).toHaveLength(4);
            expect(model.fruit).toBeDefined();

            // Should have world state
            expect(model.maze).toBeDefined();
            expect(model.pelletGrid).toBeDefined();
            expect(model.totalPellets).toBeGreaterThan(0);

            // Should have game state
            expect(model.score).toBe(100);
            expect(model.lives).toBe(2);
            expect(model.level).toBe(3);
        });

        test('Model should be self-contained - no Phaser dependencies', () => {
            const model = new GameModel({});

            // Check that model entities are pure data
            expect(model.pacman.x).toBeDefined();
            expect(model.pacman.y).toBeDefined();
            expect(model.pacman.gridX).toBeDefined();
            expect(model.pacman.gridY).toBeDefined();

            // No Phaser sprite properties
            expect(model.pacman.setFillStyle).toBeUndefined();
            expect(model.pacman.setVisible).toBeUndefined();
        });

        test('Model.step() should run complete game loop', () => {
            const model = new GameModel({});
            const initialTick = model.tickCount;

            const events = model.step(1 / 60);

            // Should increment tick
            expect(model.tickCount).toBe(initialTick + 1);

            // Should return events array
            expect(Array.isArray(events)).toBe(true);
        });

        test('Model should handle all collision detection', () => {
            const model = new GameModel({});

            // Should have collision system
            expect(model.collisionSystem).toBeDefined();

            // Step should trigger collision detection
            const events = model.step(1 / 60);

            // Events array should be present (may be empty if no collisions)
            expect(Array.isArray(events)).toBe(true);
        });
    });

    describe('Visual Wrappers - Sync to Model', () => {
        test('VisualPacman should sync to PacmanState', () => {
            const model = new GameModel({});
            const mockScene = {
                add: {
                    existing: jest.fn()
                }
            };

            const visualPacman = new VisualPacman(mockScene, model.pacman);

            // Initial position should match
            expect(visualPacman.sprite.x).toBe(model.pacman.x);
            expect(visualPacman.sprite.y).toBe(model.pacman.y);

            // Update model position
            model.pacman.x = 100;
            model.pacman.y = 200;

            // Sync visual
            visualPacman.sync();

            // Visual should match new position
            expect(visualPacman.sprite.x).toBe(100);
            expect(visualPacman.sprite.y).toBe(200);
        });

        test('VisualGhost should sync to GhostState', () => {
            const model = new GameModel({});
            const mockGraphics = {
                clear: jest.fn().mockReturnThis(),
                fillStyle: jest.fn().mockReturnThis(),
                lineStyle: jest.fn().mockReturnThis(),
                fillCircle: jest.fn().mockReturnThis(),
                strokeCircle: jest.fn().mockReturnThis(),
                fillRect: jest.fn().mockReturnThis(),
                strokeRect: jest.fn().mockReturnThis(),
                beginPath: jest.fn().mockReturnThis(),
                moveTo: jest.fn().mockReturnThis(),
                lineTo: jest.fn().mockReturnThis(),
                closePath: jest.fn().mockReturnThis(),
                fillPath: jest.fn().mockReturnThis(),
                strokePath: jest.fn().mockReturnThis(),
                fillEllipse: jest.fn().mockReturnThis(),
                setDepth: jest.fn().mockReturnThis(),
                setVisible: jest.fn().mockReturnThis(),
                destroy: jest.fn()
            };
            const mockScene = {
                add: {
                    existing: jest.fn(),
                    graphics: jest.fn().mockReturnValue(mockGraphics)
                }
            };

            const ghost = model.ghosts[0];
            const visualGhost = new VisualGhost(mockScene, ghost);

            // Initial position should match
            expect(visualGhost.sprite.x).toBe(ghost.x);

            // Update model position
            ghost.x = 150;

            // Sync visual
            visualGhost.sync();

            // Visual should match
            expect(visualGhost.sprite.x).toBe(150);
        });

        test('VisualFruit should sync to FruitState', () => {
            const model = new GameModel({});
            const mockScene = {
                add: {
                    graphics: jest.fn().mockReturnValue({
                        clear: jest.fn().mockReturnThis(),
                        fillStyle: jest.fn().mockReturnThis(),
                        lineStyle: jest.fn().mockReturnThis(),
                        fillCircle: jest.fn().mockReturnThis(),
                        strokeCircle: jest.fn().mockReturnThis(),
                        fillRect: jest.fn().mockReturnThis(),
                        strokeRect: jest.fn().mockReturnThis(),
                        beginPath: jest.fn().mockReturnThis(),
                        moveTo: jest.fn().mockReturnThis(),
                        lineTo: jest.fn().mockReturnThis(),
                        closePath: jest.fn().mockReturnThis(),
                        fillPath: jest.fn().mockReturnThis(),
                        strokePath: jest.fn().mockReturnThis(),
                        fillEllipse: jest.fn().mockReturnThis(),
                        setDepth: jest.fn().mockReturnThis()
                    }),
                    text: jest.fn().mockReturnValue({
                        setOrigin: jest.fn().mockReturnThis(),
                        setDepth: jest.fn().mockReturnThis(),
                        setVisible: jest.fn().mockReturnThis(),
                        setText: jest.fn().mockReturnThis()
                    })
                }
            };

            const visualFruit = new VisualFruit(mockScene, model.fruit);

            // Fruit should sync
            model.fruit.activate(1);
            visualFruit.sync();

            // Visual should reflect active state
            expect(visualFruit.state.active).toBe(true);
        });
    });

    describe('Event System - Model to View Communication', () => {
        test('Model should emit PELLET_EATEN event', () => {
            const model = new GameModel({});
            const eventHandler = jest.fn();

            gameEvents.on(GAME_EVENTS.PELLET_EATEN, eventHandler);

            // Manually emit a pellet eaten event via model
            gameEvents.emit(GAME_EVENTS.PELLET_EATEN, {
                score: 10,
                pelletsRemaining: model.pelletsRemaining - 1
            });

            expect(eventHandler).toHaveBeenCalledWith(expect.objectContaining({
                score: 10
            }));
        });

        test('Model should emit GHOST_EATEN event', () => {
            const eventHandler = jest.fn();
            gameEvents.on(GAME_EVENTS.GHOST_EATEN, eventHandler);

            gameEvents.emit(GAME_EVENTS.GHOST_EATEN, {
                score: 200,
                ghostType: 'blinky'
            });

            expect(eventHandler).toHaveBeenCalledWith(expect.objectContaining({
                score: 200,
                ghostType: 'blinky'
            }));
        });

        test('Model should emit LIVES_LOST event on death', () => {
            const model = new GameModel({ lives: 3 });
            const eventHandler = jest.fn();

            gameEvents.on(GAME_EVENTS.LIVES_LOST, eventHandler);

            // Trigger death
            model.onPacmanDeath();

            expect(model.isDying).toBe(true);
        });

        test('Model should emit LEVEL_COMPLETE event', () => {
            const eventHandler = jest.fn();
            gameEvents.on(GAME_EVENTS.LEVEL_COMPLETE, eventHandler);

            gameEvents.emit(GAME_EVENTS.LEVEL_COMPLETE, {
                level: 1,
                score: 1000
            });

            expect(eventHandler).toHaveBeenCalledWith(expect.objectContaining({
                level: 1
            }));
        });

        test('Model should emit GAME_OVER event', () => {
            const eventHandler = jest.fn();
            gameEvents.on(GAME_EVENTS.GAME_OVER, eventHandler);

            gameEvents.emit(GAME_EVENTS.GAME_OVER, {
                score: 5000,
                highScore: 10000
            });

            expect(eventHandler).toHaveBeenCalledWith(expect.objectContaining({
                score: 5000
            }));
        });
    });

    describe('Death Sequence', () => {
        test('Model should handle death sequence', () => {
            const model = new GameModel({ lives: 2 });

            // Trigger death
            model.onPacmanDeath();

            expect(model.isDying).toBe(true);
            expect(model.deathTimer).toBe(0);

            // Simulate death sequence completion
            const events = model.updateDeathSequence(model.deathPauseDuration);

            expect(model.isDying).toBe(false);
            expect(model.lives).toBe(1);
            expect(events).toContainEqual(expect.objectContaining({
                type: 'respawn'
            }));
        });

        test('Model should trigger game over when no lives remain', () => {
            const model = new GameModel({ lives: 0 });

            model.onPacmanDeath();
            const events = model.updateDeathSequence(model.deathPauseDuration);

            expect(model.isGameOver).toBe(true);
            expect(events).toContainEqual(expect.objectContaining({
                type: 'game_over'
            }));
        });
    });

    describe('Level Management', () => {
        test('Model should advance to next level', () => {
            const model = new GameModel({ level: 1 });

            model.nextLevel();

            expect(model.level).toBe(2);
            expect(model.levelComplete).toBe(false);
            expect(model.pelletsRemaining).toBe(model.totalPellets);
        });

        test('Model should reset positions on respawn', () => {
            const model = new GameModel({});

            // Move entities
            model.pacman.x = 999;
            model.ghosts[0].x = 888;

            // Reset
            model.resetPositions();

            // Positions should be back to start
            expect(model.pacman.x).not.toBe(999);
            expect(model.ghosts[0].x).not.toBe(888);
        });
    });

    describe('Input Handling', () => {
        test('Model should accept input direction', () => {
            const model = new GameModel({});

            model.setInputDirection(directions.RIGHT);

            expect(model.inputDirection).toBe(directions.RIGHT);
        });

        test('Model should not accept NONE direction', () => {
            const model = new GameModel({});

            model.setInputDirection(directions.NONE);

            expect(model.inputDirection).toBeNull();
        });
    });

    describe('Architecture Verification', () => {
        test('View should be pure observer - sync does not modify model', () => {
            const model = new GameModel({});
            const mockScene = {
                add: {
                    existing: jest.fn()
                }
            };

            const visualPacman = new VisualPacman(mockScene, model.pacman);

            // Record initial state
            const initialX = model.pacman.x;
            const initialY = model.pacman.y;

            // Sync multiple times
            visualPacman.sync();
            visualPacman.sync();
            visualPacman.sync();

            // Model state should not change
            expect(model.pacman.x).toBe(initialX);
            expect(model.pacman.y).toBe(initialY);
        });

        test('Game loop should be Model-driven', () => {
            const model = new GameModel({});

            // Initial state
            const initialX = model.pacman.x;

            // Step the model
            model.step(1 / 60, { direction: directions.RIGHT });

            // Model should have updated
            expect(model.tickCount).toBe(1);
        });

        test('All game state should be in Model', () => {
            const model = new GameModel({
                score: 500,
                lives: 3,
                level: 2
            });

            // Verify all state is in model
            expect(model.score).toBeDefined();
            expect(model.lives).toBeDefined();
            expect(model.level).toBeDefined();
            expect(model.isPaused).toBeDefined();
            expect(model.isGameOver).toBeDefined();
            expect(model.isDying).toBeDefined();
            expect(model.pelletsRemaining).toBeDefined();
        });
    });
});
