// tests/utils/testHelpers.js

import { PlayerState } from '../../src/model/entities/PlayerState.js';
import { TILE_TYPES } from '../../src/utils/MazeLayout.js';
import { createGameModel } from './modelTestUtils.js';

/**
 * Create mock maze for testing
 * @param {Array<Array<number>>} layout - 2D array of tile types
 * @returns {Array} Maze data structure
 */
/**
 * Create mock maze for testing
 * @param {Array<Array<number>>} layout - 2D array of tile types
 * @returns {Array} Maze data structure
 */
export const createMockMaze = (layout) => {
    return layout.map((row) => [...row]);
};

/**
 * Create simple test maze
 * @param {number} width - Width in tiles
 * @param {number} height - Height in tiles
 * @returns {Array} Maze with walls around edges
 */
/**
 * Create simple test maze
 * @param {number} width - Width in tiles
 * @param {number} height - Height in tiles
 * @returns {Array} Maze with walls around edges
 */
export const createSimpleMaze = (width = 5, height = 5) => {
    const maze = [];
    for (let y = 0; y < height; y++) {
        const row = [];
        for (let x = 0; x < width; x++) {
            if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
                row.push(TILE_TYPES.WALL);
            } else {
                row.push(TILE_TYPES.PATH);
            }
        }
        maze.push(row);
    }
    return maze;
};

/**
 * Create mock Pacman entity for testing
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock Pacman object
 */
/**
 * Create mock Pacman entity for testing
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock Pacman object
 */
export const createMockPlayer = (overrides = {}) => ({
    gridX: 1,
    gridY: 1,
    direction: { x: 0, y: 0 },
    nextDirection: { x: 0, y: 0 },
    isMoving: false,
    isDying: false,
    mouthAngle: 0,
    speed: 120,
    setDirection: jest.fn(),
    update: jest.fn(),
    ...overrides
});

// Backward compatibility: export createMockPacman as alias for createMockPlayer
export const createMockPacman = createMockPlayer;

/**
 * Create mock ghost entity for testing
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock ghost object
 */
export const createMockGhost = (overrides = {}) => ({
    gridX: 1,
    gridY: 1,
    type: 'alpha',
    mode: 'SCATTER',
    targetX: 0,
    targetY: 0,
    isFrightened: false,
    isEaten: false,
    frightenedTimer: 0,
    direction: { x: 0, y: 0 },
    speed: 100,
    setFrightened: jest.fn(),
    eat: jest.fn(),
    reset: jest.fn(),
    ...overrides
});

/**
 * Create mock collision system
 * @returns {Object} Mock collision system
 */
export const createMockCollisionSystem = () => ({
    setPacman: jest.fn(),
    setEnemies: jest.fn(),
    setMaze: jest.fn(),
    setPelletSprites: jest.fn(),
    checkPelletCollision: jest.fn().mockReturnValue(0),
    checkPowerPelletCollision: jest.fn().mockReturnValue(0),
    checkEnemyCollision: jest.fn().mockReturnValue(null),
    checkAllCollisions: jest.fn().mockReturnValue({
        pelletScore: 0,
        powerPelletScore: 0,
        enemyCollision: null
    }),
    checkWinCondition: jest.fn().mockReturnValue(false),
    reset: jest.fn()
});

/**
 * Create mock Ghost AI system
 * @returns {Object} Mock AI system
 */
export const createMockGhostAISystem = () => ({
    setEnemies: jest.fn(),
    update: jest.fn(),
    chooseDirection: jest.fn().mockReturnValue({ x: 1, y: 0 }),
    updateEnemyTarget: jest.fn(),
    updateGlobalMode: jest.fn(),
    reset: jest.fn()
});

/**
 * Create mock scene for testing
 * @returns {Object} Mock Phaser scene
 */
export const createMockScene = () => {
    // Phase 3: Unified GameModel has properties directly, not nested in state
    const gameModel = createGameModel({
        score: 0,
        lives: 3,
        level: 1,
        highScore: 0
    });

    // For backward compatibility with tests that use gameState
    const gameState = gameModel;

    return {
        gameState,
        gameModel,
        player: createMockPlayer(),
        enemies: [],
        fruit: { active: false, timer: 0 },
        soundManager: {
            playWakaWaka: jest.fn(),
            playPowerPellet: jest.fn(),
            playGhostEaten: jest.fn(),
            playDeath: jest.fn(),
            playLevelComplete: jest.fn(),
            playFruitEat: jest.fn()
        },
        storageManager: {
            getHighScore: jest.fn().mockReturnValue(0),
            saveHighScore: jest.fn()
        },
        tweens: {
            add: jest.fn(),
            killTweensOf: jest.fn()
        },
        time: {
            delayedCall: jest.fn(),
            now: () => Date.now()
        },
        add: {
            existing: jest.fn(),
            polygon: jest.fn((x, y, points, color) => {
                const mockPolygon = {
                    x,
                    y,
                    points,
                    color,
                    visible: true,
                    depth: 0,
                    scale: 1,
                    alpha: 1,
                    rotation: 0,
                    setDepth: jest.fn(function (val) {
                        this.depth = val;
                        return this;
                    }),
                    setVisible: jest.fn(function (val) {
                        this.visible = val;
                        return this;
                    }),
                    setScale: jest.fn(function (val) {
                        this.scale = val;
                        return this;
                    }),
                    setAlpha: jest.fn(function (val) {
                        this.alpha = val;
                        return this;
                    }),
                    setRotation: jest.fn(function (val) {
                        this.rotation = val;
                        return this;
                    }),
                    setOrigin: jest.fn(function (x, y) {
                        return this;
                    }),
                    setFillStyle: jest.fn(function (color, alpha) {
                        this.color = color;
                        this.alpha = alpha !== undefined ? alpha : 1;
                        return this;
                    }),
                    destroy: jest.fn()
                };
                return mockPolygon;
            }),
            graphics: jest.fn(() => ({
                fillStyle: jest.fn().mockReturnThis(),
                lineStyle: jest.fn().mockReturnThis(),
                clear: jest.fn().mockReturnThis(),
                setDepth: jest.fn().mockReturnThis(),
                setInteractive: jest.fn().mockReturnThis()
            })),
            circle: jest.fn((x, y, radius, _color) => {
                const mockCircle = {
                    x: x,
                    y: y,
                    radius: radius || 3,
                    visible: false,
                    active: false,
                    scale: 1,
                    setDepth: jest.fn().mockReturnThis(),
                    setVisible: jest.fn(function (val) {
                        this.visible = val;
                        return this;
                    }),
                    setActive: jest.fn(function (val) {
                        this.active = val;
                        return this;
                    }),
                    setPosition: jest.fn(function (x, y) {
                        this.x = x;
                        this.y = y;
                        return this;
                    }),
                    destroy: jest.fn()
                };
                return mockCircle;
            }),
            sprite: jest.fn((x, y, texture, frame) => {
                const mockSprite = {
                    x,
                    y,
                    texture,
                    frame: { name: frame || 0 },
                    visible: false,
                    active: false,
                    scale: 1,
                    setDepth: jest.fn().mockReturnThis(),
                    setVisible: jest.fn(function (val) {
                        this.visible = val;
                        return this;
                    }),
                    setFrame: jest.fn(function (val) {
                        this.frame.name = val;
                        return this;
                    }),
                    setScale: jest.fn(function (val) {
                        this.scale = val;
                        return this;
                    }),
                    setActive: jest.fn(function (val) {
                        this.active = val;
                        return this;
                    }),
                    setPosition: jest.fn(function (x, y) {
                        this.x = x;
                        this.y = y;
                        return this;
                    })
                };
                return mockSprite;
            })
        }
    };
};

/**
 * Wait for async operations in tests
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} Promise that resolves after delay
 */
export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Flush all pending promises
 * @returns {Promise} Promise that resolves when microtasks complete
 */
export const flushPromises = () =>
    new Promise((resolve) => setImmediate(resolve));

/**
 * Measure function execution time
 * @param {Function} fn - Function to measure
 * @returns {Object} Object with result and time in ms
 */
export const measureTime = (fn) => {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    return { result, time: end - start };
};

