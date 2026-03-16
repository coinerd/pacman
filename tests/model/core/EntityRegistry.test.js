/**
 * EntityRegistry Tests
 * Comprehensive tests for entity management and lifecycle
 */

import { EntityRegistry } from '../../../src/model/core/EntityRegistry.js';

// Mock dependencies
jest.mock('../../../src/model/entities/PlayerState.js', () => ({
    PlayerState: jest.fn().mockImplementation((x, y, config) => ({
        x,
        y,
        direction: 1,
        speed: config?.speed || 100,
        type: config?.type || 'player',
        reset: jest.fn(),
        update: jest.fn(),
        getSnapshot: jest.fn(() => ({ x, y, direction: 1 }))
    }))
}));

jest.mock('../../../src/model/entities/EnemyState.js', () => ({
    EnemyState: jest.fn().mockImplementation((x, y, ghostType, level) => ({
        x,
        y,
        ghostType,
        level,
        mode: 'scatter',
        isEaten: false,
        isFrightened: false,
        reset: jest.fn(),
        update: jest.fn(),
        getSnapshot: jest.fn(() => ({ x, y, ghostType, mode: 'scatter' }))
    }))
}));

jest.mock('../../../src/model/entities/FruitState.js', () => ({
    FruitState: jest.fn().mockImplementation((x, y, config) => ({
        x,
        y,
        type: config?.type || 'fruit',
        active: false,
        fruitType: 'cherry',
        reset: jest.fn(),
        update: jest.fn(),
        getSnapshot: jest.fn(() => ({ x, y, active: false }))
    }))
}));

jest.mock('../../../src/config/gameConfig.js', () => ({
    directions: { RIGHT: 1, LEFT: 3, UP: 4, DOWN: 2 },
    enemyStartPositions: {
        alpha: { x: 13, y: 14 },
        beta: { x: 11, y: 14 },
        gamma: { x: 15, y: 14 },
        delta: { x: 13, y: 12 }
    },
    playerStartPosition: { x: 13, y: 23 }
}));

describe('EntityRegistry', () => {
    let registry;

    beforeEach(() => {
        registry = new EntityRegistry({
            level: 1,
            spawnPoints: {
                player: { x: 13, y: 23 },
                ghosts: {
                    alpha: { x: 13, y: 14 },
                    beta: { x: 11, y: 14 },
                    gamma: { x: 15, y: 14 },
                    delta: { x: 13, y: 12 }
                }
            }
        });
    });

    describe('Initialization', () => {
        test('should initialize with level', () => {
            expect(registry.level).toBe(1);
        });

        test('should initialize with default level 1', () => {
            const defaultRegistry = new EntityRegistry();
            expect(defaultRegistry.level).toBe(1);
        });

        test('should initialize with spawn points', () => {
            expect(registry.spawnPoints).toBeDefined();
        });

        test('should initialize with empty entities', () => {
            expect(registry.pacman).toBeNull();
            expect(registry.ghosts).toEqual([]);
            expect(registry.fruit).toBeNull();
        });
    });

    describe('Entity Creation', () => {
        test('should create pacman', () => {
            const pacman = registry.createPacman();
            expect(pacman).toBeDefined();
            expect(registry.pacman).toBe(pacman);
        });

        test('should create pacman at spawn point', () => {
            const pacman = registry.createPacman();
            expect(pacman.x).toBe(13);
            expect(pacman.y).toBe(23);
        });

        test('should create ghosts', () => {
            const ghosts = registry.createGhosts();
            expect(ghosts.length).toBe(4);
            expect(registry.ghosts).toBe(ghosts);
        });

        test('should create all ghost types', () => {
            registry.createGhosts();
            const types = registry.ghosts.map(g => g.ghostType);
            expect(types).toContain('alpha');
            expect(types).toContain('beta');
            expect(types).toContain('gamma');
            expect(types).toContain('delta');
        });

        test('should create fruit', () => {
            const fruit = registry.createFruit();
            expect(fruit).toBeDefined();
            expect(registry.fruit).toBe(fruit);
        });
    });

    describe('Entity Access', () => {
        beforeEach(() => {
            registry.createPacman();
            registry.createGhosts();
            registry.createFruit();
        });

        test('should get pacman', () => {
            const pacman = registry.getPacman();
            expect(pacman).toBeDefined();
        });

        test('should get ghosts', () => {
            const ghosts = registry.getGhosts();
            expect(ghosts.length).toBe(4);
        });

        test('should get ghost by type', () => {
            const alpha = registry.getGhostByType('alpha');
            expect(alpha).toBeDefined();
            expect(alpha.ghostType).toBe('alpha');
        });

        test('should return null for unknown ghost type', () => {
            const unknown = registry.getGhostByType('unknown');
            expect(unknown).toBeNull();
        });

        test('should get fruit', () => {
            const fruit = registry.getFruit();
            expect(fruit).toBeDefined();
        });

        test('should get all entities', () => {
            const entities = registry.getAllEntities();
            expect(entities.length).toBe(6); // 1 pacman + 4 ghosts + 1 fruit
        });
    });

    describe('Entity Updates', () => {
        beforeEach(() => {
            registry.createPacman();
            registry.createGhosts();
            registry.createFruit();
        });

        test('should update all entities', () => {
            registry.updateAllEntities(0.016, []);
            expect(registry.pacman.update).toHaveBeenCalled();
            registry.ghosts.forEach(ghost => {
                expect(ghost.update).toHaveBeenCalled();
            });
        });
    });

    describe('Direction Tracking', () => {
        beforeEach(() => {
            registry.createPacman();
        });

        test('should track pacman direction change', () => {
            registry.pacman.direction = 2; // Change direction
            const change = registry.trackPacmanDirectionChange();
            expect(change).toBeDefined();
            expect(change.previousDirection).toBe(1);
            expect(change.currentDirection).toBe(2);
        });

        test('should return null when direction unchanged', () => {
            registry.trackPacmanDirectionChange(); // First call sets last direction
            const change = registry.trackPacmanDirectionChange();
            expect(change).toBeNull();
        });

        test('should return null when no pacman', () => {
            registry.pacman = null;
            const change = registry.trackPacmanDirectionChange();
            expect(change).toBeNull();
        });
    });

    describe('Ghost Mode Tracking', () => {
        beforeEach(() => {
            registry.createGhosts();
        });

        test('should track ghost mode change', () => {
            const ghost = registry.ghosts[0];
            ghost.mode = 'chase';
            const change = registry.trackGhostModeChange(ghost);
            expect(change).toBeDefined();
            expect(change.previousMode).toBe('scatter');
            expect(change.currentMode).toBe('chase');
        });

        test('should return null when mode unchanged', () => {
            const ghost = registry.ghosts[0];
            registry.trackGhostModeChange(ghost); // First call sets last mode
            const change = registry.trackGhostModeChange(ghost);
            expect(change).toBeNull();
        });

        test('should return null when no ghost', () => {
            const change = registry.trackGhostModeChange(null);
            expect(change).toBeNull();
        });
    });

    describe('Position Reset', () => {
        beforeEach(() => {
            registry.createPacman();
            registry.createGhosts();
            registry.createFruit();
        });

        test('should reset pacman position', () => {
            registry.pacman.x = 0;
            registry.pacman.y = 0;
            registry.resetPositions();
            expect(registry.pacman.reset).toHaveBeenCalled();
        });

        test('should reset ghost positions', () => {
            registry.resetPositions();
            registry.ghosts.forEach(ghost => {
                expect(ghost.reset).toHaveBeenCalled();
            });
        });

        test('should reset fruit', () => {
            registry.resetPositions();
            expect(registry.fruit.reset).toHaveBeenCalled();
        });
    });

    describe('Entity Lifecycle', () => {
        beforeEach(() => {
            registry.createPacman();
            registry.createGhosts();
            registry.createFruit();
        });

        test('should destroy all entities', () => {
            registry.destroyAll();
            expect(registry.pacman).toBeNull();
            expect(registry.ghosts).toEqual([]);
            expect(registry.fruit).toBeNull();
        });

        test('should clear direction tracking on destroy', () => {
            registry.destroyAll();
            expect(registry.lastPacmanDirection).toBeNull();
        });

        test('should clear ghost mode tracking on destroy', () => {
            registry.destroyAll();
            expect(registry.lastGhostModes.size).toBe(0);
        });
    });

    describe('Generic Entity Access (DI)', () => {
        test('should get pacman entity by name', () => {
            registry.createPacman();
            const entity = registry.getEntity('pacman');
            expect(entity).toBe(registry.pacman);
        });

        test('should get ghost entity by name', () => {
            registry.createGhosts();
            const entity = registry.getEntity('ghost');
            expect(entity).toBe(registry.ghosts[0]);
        });

        test('should get fruit entity by name', () => {
            registry.createFruit();
            const entity = registry.getEntity('fruit');
            expect(entity).toBe(registry.fruit);
        });

        test('should return null for unknown entity name', () => {
            const entity = registry.getEntity('unknown');
            expect(entity).toBeNull();
        });

        test('should get entities by type', () => {
            registry.createGhosts();
            const entities = registry.getEntities('ghost');
            expect(entities.length).toBe(4);
        });

        test('should return empty array for unknown type', () => {
            const entities = registry.getEntities('unknown');
            expect(entities).toEqual([]);
        });

        test('should register generic entity', () => {
            const testEntity = { name: 'test' };
            registry.registerEntity('test', testEntity);
            // Check if the entity was stored (may need to check _genericEntities)
            expect(registry._genericEntities).toBeDefined();
            expect(registry._genericEntities.get('test')).toBe(testEntity);
        });
    });

    describe('Entity Snapshot', () => {
        beforeEach(() => {
            registry.createPacman();
            registry.createGhosts();
            registry.createFruit();
        });

        test('should get entity snapshot', () => {
            const snapshot = registry.getEntitySnapshot();
            expect(snapshot).toBeDefined();
            expect(snapshot.pacman).toBeDefined();
            expect(snapshot.ghosts).toBeDefined();
            expect(snapshot.fruit).toBeDefined();
        });

        test('should include pacman in snapshot', () => {
            const snapshot = registry.getEntitySnapshot();
            expect(snapshot.pacman).toBeDefined();
        });

        test('should include all ghosts in snapshot', () => {
            const snapshot = registry.getEntitySnapshot();
            expect(snapshot.ghosts.length).toBe(4);
        });

        test('should include fruit in snapshot', () => {
            const snapshot = registry.getEntitySnapshot();
            expect(snapshot.fruit).toBeDefined();
        });
    });

    describe('Speed Scaling with Level', () => {
        test('should create pacman with level-based config', () => {
            const level5Registry = new EntityRegistry({ level: 5 });
            level5Registry.createPacman();

            // Pacman should be created with the registry's level
            expect(level5Registry.pacman).toBeDefined();
            expect(level5Registry.level).toBe(5);
        });
    });
});
