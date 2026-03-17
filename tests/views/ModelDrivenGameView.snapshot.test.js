/**
 * ModelDrivenGameView.updateFromSnapshot() Tests
 * Tests for snapshot-based view updates
 */

import { ViewContext } from '../../src/views/ViewInterface.js';
import ModelDrivenGameView from '../../src/views/ModelDrivenGameView.js';

// Create mock functions
const mockFn = () => ({});

// Create a chainable mock that returns itself for all methods
const createChainableMock = () => {
    const chainable = {
        x: 0,
        y: 0,
        setDepth: () => chainable,
        setVisible: () => chainable,
        setActive: () => chainable,
        setAlpha: () => chainable,
        setX: (x) => { chainable.x = x; return chainable; },
        setY: (y) => { chainable.y = y; return chainable; },
        setOrigin: () => chainable,
        setScale: () => chainable,
        setText: () => chainable,
        setInteractive: () => chainable,
        on: () => chainable,
        setFillStyle: () => chainable,
        fillPath: () => chainable,
        setPosition: (x, y) => { chainable.x = x; chainable.y = y; return chainable; },
        destroy: () => {}
    };
    return chainable;
};

const mockNestedFn = () => createChainableMock();
const mockTextFn = () => createChainableMock();

// Mock Phaser scene - simplified to avoid syntax errors
const mockScene = {
    add: {
        rectangle: mockNestedFn,
        circle: mockNestedFn,
        image: mockNestedFn,
        text: mockTextFn,
        polygon: mockNestedFn,
        container: () => ({ add: mockFn, setAlpha: mockFn }),
        graphics: () => ({
            setDepth: mockFn,
            setAlpha: mockFn,
            setVisible: mockFn,
            fillStyle: mockFn,
            lineStyle: mockFn,
            fillRect: mockFn,
            fillCircle: mockFn,
            strokeRect: mockFn,
            strokePath: mockFn,
            moveTo: mockFn,
            lineTo: mockFn,
            beginPath: mockFn,
            closePath: mockFn,
            fillPath: mockFn,
            destroy: mockFn,
            clear: mockFn
        })
    },
    make: {
        graphics: () => ({
            fillStyle: mockFn,
            lineStyle: mockFn,
            fillRect: mockFn,
            fillCircle: mockFn,
            strokeRect: mockFn,
            strokePath: mockFn,
            moveTo: mockFn,
            lineTo: mockFn,
            beginPath: mockFn,
            closePath: mockFn,
            generateTexture: mockFn,
            destroy: mockFn
        })
    },
    tweens: {
        add: mockFn
    },
    time: {
        delayedCall: mockFn
    },
    scale: {
        width: 800,
        height: 600
    },
    scene: {
        start: jest.fn(),
        pause: jest.fn(),
        resume: jest.fn(),
        stop: jest.fn(),
        launch: jest.fn(),
        restart: jest.fn()
    },
    textures: {
        exists: jest.fn(() => false),
        remove: jest.fn(),
        get: jest.fn(() => ({ key: 'mock' }))
    }
};

// Mock storage manager
const mockStorageManager = {
    saveHighScore: jest.fn()
};

// Mock event bus
const mockEventBus = {
    on: jest.fn(() => jest.fn()),
    emit: jest.fn()
};

// Helper to create proper direction objects for tests
const createDirection = (angle = 0) => ({ angle, name: 'RIGHT' });
const createPacman = (x = 10, y = 10, angle = 0) => ({
    x,
    y,
    gridX: 0,
    gridY: 0,
    direction: createDirection(angle),
    mouthAngle: 30,
    visualState: { visible: true }
});

describe('ModelDrivenGameView.updateFromSnapshot()', () => {
    let view;
    let context;

    beforeEach(() => {
        // Clear mocks
        jest.clearAllMocks();

        context = new ViewContext({
            scene: mockScene,
            storageManager: mockStorageManager,
            eventBus: mockEventBus
        });

        view = new ModelDrivenGameView(context);

        // Initialize pellet pools (normally done in create())
        // Create mock pellet pools
        view.pelletPool = {
            get: jest.fn(() => ({ gridX: 0, gridY: 0 })),
            getByGrid: jest.fn(() => null),
            release: jest.fn(),
            releaseAll: jest.fn(),
            active: [],
            gridIndex: new Map()
        };
        view.powerPelletPool = {
            get: jest.fn(() => ({ gridX: 0, gridY: 0 })),
            getByGrid: jest.fn(() => null),
            release: jest.fn(),
            releaseAll: jest.fn(),
            active: [],
            gridIndex: new Map()
        };
    });

    it('should handle null snapshot', () => {
        expect(() => {
            view.updateFromSnapshot(null);
        }).not.toThrow();
    });

    it('should store latest snapshot', () => {
        const snapshot = {
            level: 1,
            score: 100,
            lives: 3,
            highScore: 500,
            isPaused: false,
            isGameOver: false,
            isDying: false,
            levelComplete: false,
            pelletsRemaining: 200,
            totalPellets: 240,
            pelletsEatenPercent: 16.67,
            maze: [[0, 1], [1, 0]],
            pelletGrid: [[1, 0], [0, 1]],
            pacman: createPacman(10, 10, 0),
            ghosts: [
                { ghostType: 'alpha', x: 5, y: 5, direction: createDirection(0) },
                { ghostType: 'beta', x: 6, y: 6, direction: createDirection(0) }
            ],
            fruit: { active: false },
            boss: null,
            powerUps: [],
            story: null,
            tickCount: 100
        };

        view.updateFromSnapshot(snapshot);

        expect(view.lastSnapshot).toBeDefined();
        expect(view.lastSnapshot.level).toBe(1);
        expect(view.lastSnapshot.score).toBe(100);
        expect(view.frameCount).toBe(1);
    });

    it('should increment frame count on each update', () => {
        const snapshot = {
            level: 1,
            score: 0,
            lives: 3,
            highScore: 0,
            isPaused: false,
            isGameOver: false,
            isDying: false,
            levelComplete: false,
            pelletsRemaining: 240,
            totalPellets: 240,
            pelletsEatenPercent: 0,
            maze: [[0, 1], [1, 0]],
            pelletGrid: [[1, 0], [0, 1]],
            pacman: createPacman(),
            ghosts: [],
            fruit: { active: false },
            boss: null,
            powerUps: [],
            story: null,
            tickCount: 1
        };

        view.updateFromSnapshot(snapshot);
        expect(view.frameCount).toBe(1);

        view.updateFromSnapshot({ ...snapshot, tickCount: 2 });
        expect(view.frameCount).toBe(2);
    });

    it('should skip update if tick count has not changed', () => {
        const snapshot = {
            level: 1,
            score: 0,
            lives: 3,
            highScore: 0,
            isPaused: false,
            isGameOver: false,
            isDying: false,
            levelComplete: false,
            pelletsRemaining: 240,
            totalPellets: 240,
            pelletsEatenPercent: 0,
            maze: [[0, 1], [1, 0]],
            pelletGrid: [[1, 0], [0, 1]],
            pacman: createPacman(),
            ghosts: [],
            fruit: { active: false },
            boss: null,
            powerUps: [],
            story: null,
            tickCount: 100
        };

        view.updateFromSnapshot(snapshot);
        const frameCount1 = view.frameCount;

        // Same tick count - should skip
        view.updateFromSnapshot(snapshot);
        const frameCount2 = view.frameCount;

        expect(frameCount2).toBe(frameCount1);
    });

    it('should handle maze changes', () => {
        const initialSnapshot = {
            level: 1,
            score: 0,
            lives: 3,
            highScore: 0,
            isPaused: false,
            isGameOver: false,
            isDying: false,
            levelComplete: false,
            pelletsRemaining: 240,
            totalPellets: 240,
            pelletsEatenPercent: 0,
            maze: [[0, 1], [1, 0]],
            pelletGrid: [[1, 0], [0, 1]],
            pacman: createPacman(),
            ghosts: [],
            fruit: { active: false },
            boss: null,
            powerUps: [],
            story: null,
            tickCount: 1
        };

        view.updateFromSnapshot(initialSnapshot);
        const initialMazeSnapshot = view.lastMazeSnapshot;

        // Different maze - should update
        const newSnapshot = {
            ...initialSnapshot,
            tickCount: 2,
            maze: [[1, 0], [0, 1]]
        };

        view.updateFromSnapshot(newSnapshot);
        const newMazeSnapshot = view.lastMazeSnapshot;

        expect(newMazeSnapshot).not.toBe(initialMazeSnapshot);
    });

    it('should handle pellet grid updates', () => {
        const initialSnapshot = {
            level: 1,
            score: 0,
            lives: 3,
            highScore: 0,
            isPaused: false,
            isGameOver: false,
            isDying: false,
            levelComplete: false,
            pelletsRemaining: 2,
            totalPellets: 4,
            pelletsEatenPercent: 50,
            maze: [[0, 1], [1, 0]],
            pelletGrid: [[1, 0], [0, 1]],
            pacman: createPacman(),
            ghosts: [],
            fruit: { active: false },
            boss: null,
            powerUps: [],
            story: null,
            tickCount: 1
        };

        view.updateFromSnapshot(initialSnapshot);

        // Remove pellet
        const updatedSnapshot = {
            ...initialSnapshot,
            tickCount: 2,
            pelletGrid: [[0, 0], [0, 1]],
            pelletsRemaining: 1
        };

        view.updateFromSnapshot(updatedSnapshot);
        expect(view.lastSnapshot.pelletsRemaining).toBe(1);
    });

    it('should handle pacman data updates', () => {
        const snapshot = {
            level: 1,
            score: 0,
            lives: 3,
            highScore: 0,
            isPaused: false,
            isGameOver: false,
            isDying: false,
            levelComplete: false,
            pelletsRemaining: 240,
            totalPellets: 240,
            pelletsEatenPercent: 0,
            maze: [[0, 1], [1, 0]],
            pelletGrid: [[1, 0], [0, 1]],
            pacman: createPacman(10, 10, 0),
            ghosts: [],
            fruit: { active: false },
            boss: null,
            powerUps: [],
            story: null,
            tickCount: 1
        };

        view.updateFromSnapshot(snapshot);

        // Update pacman position
        const updatedSnapshot = {
            ...snapshot,
            tickCount: 2,
            pacman: createPacman(20, 20, 90)
        };

        view.updateFromSnapshot(updatedSnapshot);
        expect(view.lastSnapshot.pacman.x).toBe(20);
        expect(view.lastSnapshot.pacman.y).toBe(20);
    });

    it('should handle ghost data updates', () => {
        const snapshot = {
            level: 1,
            score: 0,
            lives: 3,
            highScore: 0,
            isPaused: false,
            isGameOver: false,
            isDying: false,
            levelComplete: false,
            pelletsRemaining: 240,
            totalPellets: 240,
            pelletsEatenPercent: 0,
            maze: [[0, 1], [1, 0]],
            pelletGrid: [[1, 0], [0, 1]],
            pacman: createPacman(),
            ghosts: [
                { ghostType: 'alpha', x: 5, y: 5, mode: 'chase', direction: createDirection(0) },
                { ghostType: 'beta', x: 6, y: 6, mode: 'scatter', direction: createDirection(0) }
            ],
            fruit: { active: false },
            boss: null,
            powerUps: [],
            story: null,
            tickCount: 1
        };

        view.updateFromSnapshot(snapshot);

        // Update ghost position
        const updatedSnapshot = {
            ...snapshot,
            tickCount: 2,
            ghosts: [
                { ghostType: 'alpha', x: 6, y: 6, mode: 'frightened', direction: createDirection(0) },
                { ghostType: 'beta', x: 7, y: 7, mode: 'scatter', direction: createDirection(0) }
            ]
        };

        view.updateFromSnapshot(updatedSnapshot);
        expect(view.lastSnapshot.ghosts[0].x).toBe(6);
        expect(view.lastSnapshot.ghosts[0].mode).toBe('frightened');
    });

    it('should handle boss snapshot updates', () => {
        const snapshot = {
            level: 1,
            score: 0,
            lives: 3,
            highScore: 0,
            isPaused: false,
            isGameOver: false,
            isDying: false,
            levelComplete: false,
            pelletsRemaining: 240,
            totalPellets: 240,
            pelletsEatenPercent: 0,
            maze: [[0, 1], [1, 0]],
            pelletGrid: [[1, 0], [0, 1]],
            pacman: createPacman(),
            ghosts: [],
            fruit: { active: false },
            boss: { type: 'alpha', x: 100, y: 100, healthPercent: 1.0 },
            powerUps: [],
            story: null,
            tickCount: 1
        };

        view.updateFromSnapshot(snapshot);

        // Update boss health
        const updatedSnapshot = {
            ...snapshot,
            tickCount: 2,
            boss: { type: 'alpha', x: 110, y: 110, healthPercent: 0.5 }
        };

        view.updateFromSnapshot(updatedSnapshot);
        expect(view.lastSnapshot.boss.healthPercent).toBe(0.5);
    });

    it('should handle power-up snapshot updates', () => {
        const snapshot = {
            level: 1,
            score: 0,
            lives: 3,
            highScore: 0,
            isPaused: false,
            isGameOver: false,
            isDying: false,
            levelComplete: false,
            pelletsRemaining: 240,
            totalPellets: 240,
            pelletsEatenPercent: 0,
            maze: [[0, 1], [1, 0]],
            pelletGrid: [[1, 0], [0, 1]],
            pacman: createPacman(),
            ghosts: [],
            fruit: { active: false },
            boss: null,
            powerUps: [
                { type: 'SHIELD', x: 5, y: 5 }
            ],
            story: null,
            tickCount: 1
        };

        view.updateFromSnapshot(snapshot);

        expect(view.lastSnapshot.powerUps.length).toBe(1);
        expect(view.lastSnapshot.powerUps[0].type).toBe('SHIELD');
    });

    it('should handle game state transitions', () => {
        const snapshot = {
            level: 1,
            score: 0,
            lives: 3,
            highScore: 0,
            isPaused: false,
            isGameOver: false,
            isDying: false,
            levelComplete: false,
            pelletsRemaining: 240,
            totalPellets: 240,
            pelletsEatenPercent: 0,
            maze: [[0, 1], [1, 0]],
            pelletGrid: [[1, 0], [0, 1]],
            pacman: createPacman(),
            ghosts: [],
            fruit: { active: false },
            boss: null,
            powerUps: [],
            story: null,
            tickCount: 1
        };

        view.updateFromSnapshot(snapshot);
        expect(view.isDeathAnimating).toBe(false);

        // Pacman dies
        const dyingSnapshot = {
            ...snapshot,
            tickCount: 2,
            isDying: true
        };

        view.updateFromSnapshot(dyingSnapshot);
        expect(view.isDeathAnimating).toBe(true);

        // Respawn
        const respawnSnapshot = {
            ...snapshot,
            tickCount: 3,
            isDying: false
        };

        view.updateFromSnapshot(respawnSnapshot);
        expect(view.isDeathAnimating).toBe(false);
    });

    describe('mazeEquals', () => {
        it('should return true for identical mazes', () => {
            const maze1 = [[0, 1], [1, 0]];
            const maze2 = [[0, 1], [1, 0]];

            expect(view.mazeEquals(maze1, maze2)).toBe(true);
        });

        it('should return false for different mazes', () => {
            const maze1 = [[0, 1], [1, 0]];
            const maze2 = [[1, 0], [0, 1]];

            expect(view.mazeEquals(maze1, maze2)).toBe(false);
        });

        it('should handle null mazes', () => {
            expect(view.mazeEquals(null, null)).toBe(true);
            expect(view.mazeEquals([[0]], null)).toBe(false);
            expect(view.mazeEquals(null, [[0]])).toBe(false);
        });

        it('should handle mazes with different dimensions', () => {
            const maze1 = [[0, 1], [1, 0]];
            const maze2 = [[0, 1, 1], [1, 0, 0]];

            expect(view.mazeEquals(maze1, maze2)).toBe(false);
        });
    });
});
