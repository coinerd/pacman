import GameModelDI from '../../src/model/core/GameModelDI.js';
import { globalContainer } from '../../src/core/ServiceContainer.js';

// Mock Services for DI mode
function createMockGameState(config) {
    return {
        level: config.level || 1,
        lives: config.lives || 3,
        score: config.score || 0,
        highScore: config.highScore || 0,
        isPaused: false,
        isGameOver: false,
        isDying: false,
        isDeathComplete: () => false,
        levelComplete: false,
        deathTimer: 0,
        tick: 0,
        ghostsEaten: 0,
        levelDeaths: 0,
        updateProfiling: () => {},
        startProfiling: () => {},
        incrementTick: function() { this.tick++; },
        startDeathTimer: function() { this.deathTimer = 0; this.isDying = true; },
        updateDeathTimer: function(delta) { this.deathTimer += delta; },
        getProfilingStats: () => ({}),
        resetForLevel: function(level) { this.level = level; this.levelComplete = false; }
    };
}

function createMockLevelSystem() {
    return {
        getLevelConfig: () => ({ scatterDuration: 7, chaseDuration: 20 }),
        getFrightenedDuration: () => 8,
        getModeDurations: () => ({ scatter: 7, chase: 20 }),
        setLevel: function(level) { this.level = level; },
        getLevel: () => 1,
        getLevelInfo: () => ({ level: 1 }),
        getScoreMultiplier: () => 1,
        getFruitScore: () => 100,
        shouldSpawnFruit: () => false,
        setLevelConfig: function(config) { this.config = config; },
        getSpeedMultiplier: () => 1
    };
}

function createMockSpawningSystem() {
    const maze = Array(20).fill(null).map(() => Array(20).fill(0));
    const pelletGrid = Array(20).fill(null).map(() => Array(20).fill(0));
    const spawnPoints = {
        pacman: { x: 10, y: 15 },
        player: { x: 10, y: 15 },
        ghosts: [
            { x: 10, y: 10, type: 'red' },
            { x: 9, y: 10, type: 'pink' },
            { x: 11, y: 10, type: 'cyan' },
            { x: 10, y: 9, type: 'orange' }
        ],
        red: { x: 10, y: 10 },
        pink: { x: 9, y: 10 },
        cyan: { x: 11, y: 10 },
        orange: { x: 10, y: 9 }
    };

    return {
        getMaze: () => maze,
        getPelletGrid: () => pelletGrid,
        getSpawnPoints: () => spawnPoints,
        generateMazeForLevel: function(_level) { return { maze, pelletGrid, spawnPoints }; },
        setMaze: function(_m, _pg, _sp) { },
        getPelletsRemaining: () => 100,
        getTotalPellets: () => 200,
        removePelletAt: () => true,
        setPelletsRemaining: function(_val) { }
    };
}

function createMockEntityRegistry() {
    const entities = {};

    return {
        getPacman: () => ({
            id: 'pacman',
            gridX: 10,
            gridY: 15,
            x: 200,
            y: 300,
            direction: 0,
            isMoving: false,
            update: () => {},
            setDesiredDirection: () => {},
            getSnapshot: () => ({ id: 'pacman', gridX: 10, gridY: 15 })
        }),
        getGhosts: () => [
            { id: 'ghost-red', gridX: 10, gridY: 10, x: 200, y: 200, ghostType: 'red', isFrightened: false, isEaten: false, inHouse: true, update: () => {}, setFrightened: () => {}, eat: () => {}, getSnapshot: () => ({ id: 'ghost-red' }) },
            { id: 'ghost-pink', gridX: 9, gridY: 10, x: 180, y: 200, ghostType: 'pink', isFrightened: false, isEaten: false, inHouse: true, update: () => {}, setFrightened: () => {}, eat: () => {}, getSnapshot: () => ({ id: 'ghost-pink' }) },
            { id: 'ghost-cyan', gridX: 11, gridY: 10, x: 220, y: 200, ghostType: 'cyan', isFrightened: false, isEaten: false, inHouse: true, update: () => {}, setFrightened: () => {}, eat: () => {}, getSnapshot: () => ({ id: 'ghost-cyan' }) },
            { id: 'ghost-orange', gridX: 10, gridY: 9, x: 200, y: 180, ghostType: 'orange', isFrightened: false, isEaten: false, inHouse: true, update: () => {}, setFrightened: () => {}, eat: () => {}, getSnapshot: () => ({ id: 'ghost-orange' }) }
        ],
        getFruit: () => null,
        getGhostByType: (type) => ({ id: `ghost-${type}`, ghostType: type, eat: () => {}, eatenCount: 0 }),
        createPacman: () => {},
        createGhosts: () => {},
        createFruit: () => {},
        resetPositions: () => {},
        update: () => {},
        registerEntity: (name, entity) => { entities[name] = entity; },
        getEntity: (name) => entities[name]
    };
}

function createMockCollisionHandler() {
    return {
        checkAllCollisions: () => [],
        checkPelletCollision: () => null,
        checkGhostCollision: () => null,
        checkFruitCollision: () => null,
        reset: () => {},
        getStats: () => ({})
    };
}

function createMockMovementSystem() {
    return {
        update: () => [],
        initialize: () => {},
        registerEntity: () => ({}),
        unregisterEntity: () => {},
        setDirection: () => {},
        getMovementState: () => null,
        setFrightened: () => {},
        setEaten: () => {},
        resetEntity: () => {},
        reset: () => {},
        pause: () => {},
        resume: () => {},
        syncToEntities: () => {},
        getStats: () => ({})
    };
}

/**
 * Register mock services for DI mode tests
 * @param {Object} config - Configuration options
 */
export function registerMockServices(config = {}) {
    globalContainer.clear();

    globalContainer.register('gameState', () => createMockGameState(config), true);
    globalContainer.register('levelSystem', () => createMockLevelSystem(), true);
    globalContainer.register('spawningSystem', () => createMockSpawningSystem(), true);
    globalContainer.register('entityRegistry', () => createMockEntityRegistry(), true);
    globalContainer.register('collisionHandler', () => createMockCollisionHandler(), true);
    globalContainer.register('movementSystem', () => createMockMovementSystem(), true);
    globalContainer.register('playerModule', () => ({}), true);
    globalContainer.register('scoreModule', () => ({ pelletsEaten: 0, ghostsEaten: 0, currentComboGhosts: 0 }), true);
    globalContainer.register('sessionModule', () => ({}), true);
}

/**
 * Clear mock services after tests
 */
export function clearMockServices() {
    globalContainer.clear();
}

/**
 * Create a GameModel with optional state, level config, and level data.
 * @param {Object} options
 * @param {Object} [options.state] - Overrides for initial GameModel state.
 * @param {Object} [options.levelConfig] - Level configuration to apply.
 * @param {Object} [options.levelData] - Level data to apply ({ maze, pelletGrid }).
 * @returns {GameModelDI}
 */
export const createGameModel = ({ state = {}, levelConfig, levelData } = {}) => {
    // Register mock services for DI mode
    registerMockServices(state);

    const model = new GameModelDI(state, true); // PHASE 4: Use DI

    if (levelConfig) {
        model.setLevelConfig(levelConfig);
    }

    if (levelData) {
        model.setLevelData(levelData);
    }

    return model;
};
