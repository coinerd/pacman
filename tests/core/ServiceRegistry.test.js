/**
 * Tests for ServiceRegistry
 * Focusing on branch coverage for service registration functions
 */

import {
    registerCoreServices,
    registerFeatureSystems,
    clearServices,
    getServiceStats
} from '../../src/core/ServiceRegistry.js';
import { globalContainer } from '../../src/core/ServiceContainer.js';

describe('ServiceRegistry', () => {
    beforeEach(() => {
        clearServices();
    });

    afterEach(() => {
        clearServices();
    });

    describe('registerCoreServices', () => {
        it('should register all core services with default config', () => {
            registerCoreServices();

            const stats = getServiceStats();

            expect(stats.registered).toContain('eventBus');
            expect(stats.registered).toContain('gameState');
            expect(stats.registered).toContain('levelSystem');
            expect(stats.registered).toContain('spawningSystem');
            expect(stats.registered).toContain('entityRegistry');
            expect(stats.registered).toContain('collisionHandler');
            expect(stats.registered).toContain('movementSystem');
            expect(stats.registered).toContain('playerModule');
            expect(stats.registered).toContain('scoreModule');
            expect(stats.registered).toContain('sessionModule');
        });

        it('should register view services', () => {
            registerCoreServices();

            const stats = getServiceStats();

            expect(stats.registered).toContain('pelletRenderer');
            expect(stats.registered).toContain('playerRenderer');
            expect(stats.registered).toContain('ghostRenderers');
            expect(stats.registered).toContain('fruitRenderer');
            expect(stats.registered).toContain('soundManager');
            expect(stats.registered).toContain('effectManager');
        });

        it('should accept custom config with level', () => {
            registerCoreServices({ level: 5 });

            const gameState = globalContainer.get('gameState');
            const levelSystem = globalContainer.get('levelSystem');

            expect(gameState.level).toBe(5);
            expect(levelSystem.getLevel()).toBe(5);
        });

        it('should accept custom config with lives', () => {
            registerCoreServices({ lives: 5 });

            const gameState = globalContainer.get('gameState');

            expect(gameState.lives).toBe(5);
        });

        it('should accept custom config with score', () => {
            registerCoreServices({ score: 1000 });

            const gameState = globalContainer.get('gameState');

            expect(gameState.score).toBe(1000);
        });

        it('should accept custom config with highScore', () => {
            registerCoreServices({ highScore: 5000 });

            const gameState = globalContainer.get('gameState');

            expect(gameState.highScore).toBe(5000);
        });

        it('should accept custom config with deathPauseDuration', () => {
            registerCoreServices({ deathPauseDuration: 2 });

            const gameState = globalContainer.get('gameState');

            expect(gameState.deathPauseDuration).toBe(2);
        });

        it('should clear existing services before registering', () => {
            registerCoreServices({ level: 1 });

            // Register again with different config
            registerCoreServices({ level: 3 });

            const gameState = globalContainer.get('gameState');

            expect(gameState.level).toBe(3);
        });

        it('should create singletons for all services', () => {
            registerCoreServices();

            const stats = getServiceStats();

            expect(stats.singletons).toContain('eventBus');
            expect(stats.singletons).toContain('gameState');
            expect(stats.singletons).toContain('levelSystem');
        });

        it('should return same instance for singleton services', () => {
            registerCoreServices();

            const eventBus1 = globalContainer.get('eventBus');
            const eventBus2 = globalContainer.get('eventBus');

            expect(eventBus1).toBe(eventBus2);
        });
    });

    describe('registerFeatureSystems', () => {
        it('should register feature systems', () => {
            registerCoreServices();
            registerFeatureSystems();

            const stats = getServiceStats();

            expect(stats.registered).toContain('bossBattleSystem');
            expect(stats.registered).toContain('storyMode');
            expect(stats.registered).toContain('additionalPowerUpSystem');
        });

        it('should create bossBattleSystem as singleton', () => {
            registerCoreServices();
            registerFeatureSystems();

            const boss1 = globalContainer.get('bossBattleSystem');
            const boss2 = globalContainer.get('bossBattleSystem');

            expect(boss1).toBe(boss2);
        });

        it('should create storyMode as singleton', () => {
            registerCoreServices();
            registerFeatureSystems();

            const story1 = globalContainer.get('storyMode');
            const story2 = globalContainer.get('storyMode');

            expect(story1).toBe(story2);
        });

        it('should create additionalPowerUpSystem as singleton', () => {
            registerCoreServices();
            registerFeatureSystems();

            const powerUp1 = globalContainer.get('additionalPowerUpSystem');
            const powerUp2 = globalContainer.get('additionalPowerUpSystem');

            expect(powerUp1).toBe(powerUp2);
        });
    });

    describe('clearServices', () => {
        it('should clear all registered services', () => {
            registerCoreServices();

            clearServices();

            const stats = getServiceStats();

            expect(stats.registered).toHaveLength(0);
            expect(stats.singletons).toHaveLength(0);
            expect(stats.instantiated).toHaveLength(0);
        });

        it('should allow re-registration after clear', () => {
            registerCoreServices({ level: 1 });
            clearServices();
            registerCoreServices({ level: 5 });

            const gameState = globalContainer.get('gameState');

            expect(gameState.level).toBe(5);
        });
    });

    describe('getServiceStats', () => {
        it('should return empty arrays when no services registered', () => {
            const stats = getServiceStats();

            expect(stats.registered).toEqual([]);
            expect(stats.singletons).toEqual([]);
            expect(stats.instantiated).toEqual([]);
        });

        it('should return registered service names', () => {
            registerCoreServices();

            const stats = getServiceStats();

            expect(stats.registered.length).toBeGreaterThan(0);
        });

        it('should return instantiated services after they are accessed', () => {
            registerCoreServices();

            // Access a service to instantiate it
            globalContainer.get('eventBus');

            const stats = getServiceStats();

            expect(stats.instantiated).toContain('eventBus');
        });
    });

    describe('service dependencies', () => {
        it('should properly wire spawningSystem to levelSystem', () => {
            registerCoreServices({ level: 3 });

            const levelSystem = globalContainer.get('levelSystem');
            const spawningSystem = globalContainer.get('spawningSystem');

            expect(levelSystem.getLevel()).toBe(3);
            // SpawningSystem uses levelSystem internally
            expect(spawningSystem).toBeDefined();
        });

        it('should properly wire entityRegistry to spawningSystem', () => {
            registerCoreServices();

            const spawningSystem = globalContainer.get('spawningSystem');
            const entityRegistry = globalContainer.get('entityRegistry');

            expect(entityRegistry).toBeDefined();
            expect(spawningSystem.getSpawnPoints()).toBeDefined();
        });

        it('should properly wire movementSystem to spawningSystem', () => {
            registerCoreServices();

            const spawningSystem = globalContainer.get('spawningSystem');
            const movementSystem = globalContainer.get('movementSystem');

            expect(movementSystem).toBeDefined();
            expect(spawningSystem.getMaze()).toBeDefined();
        });

        it('should properly wire additionalPowerUpSystem dependencies', () => {
            registerCoreServices();
            registerFeatureSystems();

            const additionalPowerUpSystem = globalContainer.get('additionalPowerUpSystem');

            expect(additionalPowerUpSystem).toBeDefined();
        });
    });

    describe('collision handler registration', () => {
        it('should register collision handler with null callbacks', () => {
            registerCoreServices();

            const collisionHandler = globalContainer.get('collisionHandler');

            expect(collisionHandler).toBeDefined();
            expect(collisionHandler.callbacks).toBeDefined();
        });
    });

    describe('view renderer registration', () => {
        it('should register pelletRenderer (deferred until scene available)', () => {
            registerCoreServices();

            // The pelletRenderer is registered, but accessing it requires a scene
            // Just verify it's in the registered services list
            const stats = getServiceStats();

            expect(stats.registered).toContain('pelletRenderer');
        });

        it('should register playerRenderer (deferred until scene available)', () => {
            registerCoreServices();

            const stats = getServiceStats();

            expect(stats.registered).toContain('playerRenderer');
        });

        it('should register ghostRenderers (deferred until scene available)', () => {
            registerCoreServices();

            const stats = getServiceStats();

            expect(stats.registered).toContain('ghostRenderers');
        });

        it('should register fruitRenderer (deferred until scene available)', () => {
            registerCoreServices();

            const stats = getServiceStats();

            expect(stats.registered).toContain('fruitRenderer');
        });

        it('should register soundManager (deferred until scene available)', () => {
            registerCoreServices();

            const stats = getServiceStats();

            expect(stats.registered).toContain('soundManager');
        });

        it('should register effectManager (deferred until scene available)', () => {
            registerCoreServices();

            const stats = getServiceStats();

            expect(stats.registered).toContain('effectManager');
        });
    });
});
