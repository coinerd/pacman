/**
 * Test for the complete score flow:
 * GameModel -> PlayerScoreFacade -> UIController -> ScoreBoard
 */

import GameModelDI from '../../src/model/core/GameModelDI.js';
import { PlayerScoreFacade } from '../../src/model/PlayerScoreFacade.js';
import { UIController } from '../../src/scenes/systems/UIController.js';
import { globalContainer } from '../../src/core/ServiceContainer.js';

// Mock services
function createMockGameState(config) {
    const state = {
        level: config.level || 1,
        lives: config.lives || 3,
        score: config.score || 0,
        highScore: config.highScore || 0,
        isPaused: false,
        isGameOver: false,
        isDying: false,
        isDeathComplete: jest.fn(() => false),
        levelComplete: false,
        deathTimer: 0,
        tick: 0,
        ghostsEaten: 0,
        levelDeaths: 0,
        incrementTick: jest.fn(function() { this.tick++; }),
        startDeathTimer: jest.fn(),
        updateDeathTimer: jest.fn(),
        getProfilingStats: jest.fn(() => ({})),
        resetForLevel: jest.fn()
    };
    return state;
}

function createMockLevelSystem() {
    return {
        getLevelConfig: jest.fn(() => ({ scatterDuration: 7, chaseDuration: 20 })),
        getFrightenedDuration: jest.fn(() => 8),
        getModeDurations: jest.fn(() => ({ scatter: 7, chase: 20 })),
        setLevel: jest.fn(),
        getLevel: jest.fn(() => 1),
        getLevelInfo: jest.fn(() => ({ level: 1 })),
        getScoreMultiplier: jest.fn(() => 1),
        getFruitScore: jest.fn(() => 100),
        shouldSpawnFruit: jest.fn(() => false),
        setLevelConfig: jest.fn(),
        getSpeedMultiplier: jest.fn(() => 1)
    };
}

function createMockSpawningSystem() {
    const maze = Array(20).fill(null).map(() => Array(20).fill(0));
    const pelletGrid = Array(20).fill(null).map(() => Array(20).fill(0));
    const spawnPoints = {
        player: { x: 10, y: 15 },
        red: { x: 10, y: 10 },
        pink: { x: 9, y: 10 },
        cyan: { x: 11, y: 10 },
        orange: { x: 10, y: 9 }
    };
    return {
        getMaze: jest.fn(() => maze),
        getPelletGrid: jest.fn(() => pelletGrid),
        getSpawnPoints: jest.fn(() => spawnPoints),
        generateMazeForLevel: jest.fn(),
        setMaze: jest.fn(),
        getPelletsRemaining: jest.fn(() => 100),
        getTotalPellets: jest.fn(() => 200),
        removePelletAt: jest.fn(() => true),
        setPelletsRemaining: jest.fn()
    };
}

function createMockEntityRegistry() {
    const entities = {};
    return {
        getPacman: jest.fn(() => ({
            id: 'pacman',
            gridX: 10,
            gridY: 15,
            x: 200,
            y: 300,
            direction: 0,
            isMoving: false,
            update: jest.fn(),
            setDesiredDirection: jest.fn(),
            getSnapshot: jest.fn(() => ({ id: 'pacman', gridX: 10, gridY: 15 }))
        })),
        getGhosts: jest.fn(() => []),
        getFruit: jest.fn(() => null),
        getGhostByType: jest.fn(() => ({ id: 'ghost', eat: jest.fn(), eatenCount: 0 })),
        createPacman: jest.fn(),
        createGhosts: jest.fn(),
        createFruit: jest.fn(),
        resetPositions: jest.fn(),
        update: jest.fn(),
        registerEntity: jest.fn((name, entity) => { entities[name] = entity; }),
        getEntity: jest.fn((name) => entities[name])
    };
}

function createMockCollisionHandler() {
    return {
        checkAllCollisions: jest.fn(() => []),
        checkPelletCollision: jest.fn(),
        checkGhostCollision: jest.fn(),
        checkFruitCollision: jest.fn(),
        reset: jest.fn(),
        getStats: jest.fn(() => ({}))
    };
}

function createMockMovementSystem() {
    return {
        update: jest.fn(() => []),
        initialize: jest.fn(),
        registerEntity: jest.fn(() => ({})),
        unregisterEntity: jest.fn(),
        setDirection: jest.fn(),
        getMovementState: jest.fn(),
        setFrightened: jest.fn(),
        setEaten: jest.fn(),
        resetEntity: jest.fn(),
        reset: jest.fn(),
        pause: jest.fn(),
        resume: jest.fn(),
        syncToEntities: jest.fn(),
        getStats: jest.fn(() => ({}))
    };
}

describe('Score Flow Integration', () => {
    let gameModel;
    let playerScoreFacade;
    let mockScene;
    let scoreUpdateLog;
    let mockGameState;

    // Helper to create a complete mock text object
    const createMockText = (x, y, text, style) => {
        const textObj = {
            x, y, text, style,
            setOrigin: jest.fn().mockReturnThis(),
            setAlpha: jest.fn().mockReturnThis(),
            setDepth: jest.fn().mockReturnThis(),
            setScrollFactor: jest.fn().mockReturnThis(),
            setVisible: jest.fn().mockReturnThis(),
            setScale: jest.fn().mockReturnThis(),
            setShadow: jest.fn().mockReturnThis(),
            setColor: jest.fn().mockReturnThis(),
            setText: jest.fn(function(newText) {
                this.text = newText;
                scoreUpdateLog.push({ method: 'setText', text: newText });
                return this;
            }),
            destroy: jest.fn()
        };
        return textObj;
    };

    beforeEach(() => {
        scoreUpdateLog = [];

        // Create mock game state first so we can reference it in scoreModule
        mockGameState = createMockGameState({});

        // Clear and register mock services
        globalContainer.clear();
        globalContainer.register('gameState', () => mockGameState, true);
        globalContainer.register('levelSystem', () => createMockLevelSystem(), true);
        globalContainer.register('spawningSystem', () => createMockSpawningSystem(), true);
        globalContainer.register('entityRegistry', () => createMockEntityRegistry(), true);
        globalContainer.register('collisionHandler', () => createMockCollisionHandler(), true);
        globalContainer.register('movementSystem', () => createMockMovementSystem(), true);
        globalContainer.register('playerModule', () => ({}), true);
        globalContainer.register('scoreModule', () => {
            const module = {
                pelletsEaten: 0,
                ghostsEaten: 0,
                currentComboGhosts: 0,
                applyEvent: jest.fn((event) => {
                    if (event.type === 'pellet_eaten') {
                        module.pelletsEaten++;
                        // Actually update the game state score
                        mockGameState.score += event.score || 10;
                    }
                })
            };
            return module;
        }, true);
        globalContainer.register('sessionModule', () => ({}), true);

        // Create a minimal mock scene
        mockScene = {
            scale: { width: 560, height: 620 },
            add: {
                text: jest.fn(createMockText),
                container: jest.fn(() => ({
                    add: jest.fn().mockReturnThis(),
                    setDepth: jest.fn().mockReturnThis(),
                    setScrollFactor: jest.fn().mockReturnThis(),
                    destroy: jest.fn()
                })),
                rectangle: jest.fn(() => ({
                    setStrokeStyle: jest.fn().mockReturnThis(),
                    setFillStyle: jest.fn().mockReturnThis(),
                    setOrigin: jest.fn().mockReturnThis(),
                    setAlpha: jest.fn().mockReturnThis(),
                    setDepth: jest.fn().mockReturnThis(),
                    setScrollFactor: jest.fn().mockReturnThis(),
                    destroy: jest.fn()
                })),
                graphics: jest.fn(() => ({
                    lineStyle: jest.fn().mockReturnThis(),
                    beginPath: jest.fn().mockReturnThis(),
                    moveTo: jest.fn().mockReturnThis(),
                    lineTo: jest.fn().mockReturnThis(),
                    strokePath: jest.fn().mockReturnThis(),
                    strokeRoundedRect: jest.fn().mockReturnThis(),
                    fillRoundedRect: jest.fn().mockReturnThis(),
                    fillStyle: jest.fn().mockReturnThis(),
                    fillCircle: jest.fn().mockReturnThis(),
                    setDepth: jest.fn().mockReturnThis(),
                    setScrollFactor: jest.fn().mockReturnThis(),
                    destroy: jest.fn()
                }))
            },
            tweens: { add: jest.fn(), killTweensOf: jest.fn() },
            time: { delayedCall: jest.fn() }
        };

        // Create GameModel
        gameModel = new GameModelDI({
            score: 0,
            lives: 3,
            level: 1,
            highScore: 0
        }, true);

        // Create PlayerScoreFacade
        playerScoreFacade = new PlayerScoreFacade(gameModel);
    }, true);

    describe('PlayerScoreFacade.toHudSnapshot()', () => {
        it('should return correct initial score', () => {
            const snapshot = playerScoreFacade.toHudSnapshot();
            expect(snapshot.score).toBe(0);
            expect(snapshot.highScore).toBe(0);
            expect(snapshot.lives).toBe(3);
            expect(snapshot.level).toBe(1);
        }, true);

        it('should reflect score changes in GameModel', () => {
            // Directly set score (simulates what handlePelletEaten does)
            gameModel.score = 100;

            const snapshot = playerScoreFacade.toHudSnapshot();
            expect(snapshot.score).toBe(100);
        }, true);

        it('should reflect score changes via gameState', () => {
            // Update score via gameState (what the real handlers do)
            mockGameState.score = 150;

            const snapshot = playerScoreFacade.toHudSnapshot();
            expect(snapshot.score).toBe(150);
        }, true);
    }, true);

    describe('UIController.updateFromSnapshot()', () => {
        let uiController;

        beforeEach(() => {
            uiController = new UIController(mockScene, playerScoreFacade);
            uiController.create();
        }, true);

        it('should update score text when snapshot changes', () => {
            // Initial update
            const snapshot1 = playerScoreFacade.toHudSnapshot();
            uiController.updateFromSnapshot(snapshot1);

            // Change score
            gameModel.score = 500;

            // Update with new snapshot
            const snapshot2 = playerScoreFacade.toHudSnapshot();
            uiController.updateFromSnapshot(snapshot2);

            // ScoreBoard formats score with 6 digits padding
            // So 500 becomes "000500"
            const scoreUpdates = scoreUpdateLog.filter(log => log.text === '000500');
            expect(scoreUpdates.length).toBeGreaterThan(0);
        }, true);

        it('should propagate score changes from GameModel to ScoreBoard', () => {
            // Set up initial state
            const initialSnapshot = playerScoreFacade.toHudSnapshot();
            uiController.updateFromSnapshot(initialSnapshot);

            // Simulate score change (what handlePelletEaten would do)
            gameModel.score = 10;

            // Get new snapshot
            const newSnapshot = playerScoreFacade.toHudSnapshot();

            // Update UI
            uiController.updateFromSnapshot(newSnapshot);

            // Verify score was updated
            expect(newSnapshot.score).toBe(10);
        }, true);
    }, true);

    describe('Complete flow: GameModel -> Facade -> UIController', () => {
        it('should correctly propagate score through the entire chain', () => {
            // Create UIController
            const uiController = new UIController(mockScene, playerScoreFacade);
            uiController.create();

            // Initial state
            expect(gameModel.score).toBe(0);

            // Get initial snapshot
            let snapshot = playerScoreFacade.toHudSnapshot();
            expect(snapshot.score).toBe(0);

            // Update UI
            uiController.updateFromSnapshot(snapshot);

            // Apply score change (simulates what handlePelletEaten does)
            gameModel.score = 10;

            // Verify GameModel has new score
            expect(gameModel.score).toBe(10);

            // Get new snapshot
            snapshot = playerScoreFacade.toHudSnapshot();
            expect(snapshot.score).toBe(10);

            // Update UI
            uiController.updateFromSnapshot(snapshot);

            // Check that ScoreBoard received the update
            // ScoreBoard formats score with 6 digits padding, so 10 becomes "000010"
            const scoreUpdates = scoreUpdateLog.filter(log => log.text === '000010');
            expect(scoreUpdates.length).toBeGreaterThan(0);
        }, true);
    }, true);
}, true);
