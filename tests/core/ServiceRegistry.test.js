/**
 * Tests for ServiceRegistry
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
        test('should register core services with default config', () => {
            registerCoreServices();

            const stats = getServiceStats();
            expect(stats.registered).toContain('eventBus');
            expect(stats.registered).toContain('gameState');
            expect(stats.registered).toContain('levelSystem');
            expect(stats.registered).toContain('spawningSystem');
            expect(stats.registered).toContain('entityRegistry');
        });

        test('should register movement system', () => {
            registerCoreServices();

            const stats = getServiceStats();
            expect(stats.registered).toContain('movementSystem');
        });

        test('should register player module', () => {
            registerCoreServices();

            const stats = getServiceStats();
            expect(stats.registered).toContain('playerModule');
        });

        test('should register score module', () => {
            registerCoreServices();

            const stats = getServiceStats();
            expect(stats.registered).toContain('scoreModule');
        });

        test('should register view systems', () => {
            registerCoreServices();

            const stats = getServiceStats();
            expect(stats.registered).toContain('pelletRenderer');
            expect(stats.registered).toContain('playerRenderer');
            expect(stats.registered).toContain('ghostRenderers');
            expect(stats.registered).toContain('fruitRenderer');
        });

        test('should accept custom config', () => {
            registerCoreServices({
                level: 5,
                lives: 2,
                score: 1000
            });

            const gameState = globalContainer.get('gameState');
            expect(gameState).toBeDefined();
        });

        test('should create eventBus as singleton', () => {
            registerCoreServices();

            const eventBus1 = globalContainer.get('eventBus');
            const eventBus2 = globalContainer.get('eventBus');
            expect(eventBus1).toBe(eventBus2);
        });
    });

    describe('registerFeatureSystems', () => {
        test('should register feature systems', () => {
            registerCoreServices();
            registerFeatureSystems(globalContainer);

            const stats = getServiceStats();
            expect(stats.registered).toContain('bossBattleSystem');
            expect(stats.registered).toContain('storyMode');
            expect(stats.registered).toContain('additionalPowerUpSystem');
        });

        test('should create feature systems as singletons', () => {
            registerCoreServices();
            registerFeatureSystems(globalContainer);

            const bossSystem1 = globalContainer.get('bossBattleSystem');
            const bossSystem2 = globalContainer.get('bossBattleSystem');
            expect(bossSystem1).toBe(bossSystem2);
        });
    });

    describe('clearServices', () => {
        test('should clear all registered services', () => {
            registerCoreServices();
            expect(getServiceStats().registered.length).toBeGreaterThan(0);

            clearServices();
            expect(getServiceStats().registered).toHaveLength(0);
        });

        test('should allow re-registration after clearing', () => {
            registerCoreServices({ level: 1 });
            clearServices();
            registerCoreServices({ level: 2 });

            const stats = getServiceStats();
            expect(stats.registered).toContain('eventBus');
        });
    });

    describe('getServiceStats', () => {
        test('should return empty stats when no services registered', () => {
            const stats = getServiceStats();
            expect(stats.registered).toHaveLength(0);
            expect(stats.singletons).toHaveLength(0);
            expect(stats.instantiated).toHaveLength(0);
        });

        test('should return registered service names', () => {
            registerCoreServices();
            const stats = getServiceStats();

            expect(Array.isArray(stats.registered)).toBe(true);
            expect(stats.registered.length).toBeGreaterThan(0);
        });

        test('should return singleton names', () => {
            registerCoreServices();
            const stats = getServiceStats();

            expect(Array.isArray(stats.singletons)).toBe(true);
            expect(stats.singletons.length).toBeGreaterThan(0);
        });

        test('should track instantiated services', () => {
            registerCoreServices();

            // Get a service to instantiate it
            globalContainer.get('eventBus');

            const stats = getServiceStats();
            expect(stats.instantiated).toContain('eventBus');
        });
    });
});
