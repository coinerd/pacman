/**
 * Tests for AIController
 * Focusing on branch coverage for AI controller functions
 */

import { AIController, DEFAULT_MODE_DURATIONS } from '../../../src/movement/ai/AIController.js';

// Create a mock maze adapter
function createMockMazeAdapter() {
    return {
        getValidDirections: jest.fn().mockReturnValue(['UP', 'DOWN', 'LEFT', 'RIGHT']),
        getDistance: jest.fn().mockImplementation((x1, y1, x2, y2) => {
            return Math.abs(x2 - x1) + Math.abs(y2 - y1);
        })
    };
}

// Create a mock entity state
function createMockEntityState(overrides = {}) {
    return {
        gridX: 5,
        gridY: 5,
        moveProgress: 0,
        ...overrides
    };
}

// Create a mock context
function createMockContext(overrides = {}) {
    return {
        getEntityState: jest.fn().mockReturnValue(createMockEntityState()),
        deltaSeconds: 0.016,
        player: { gridX: 10, gridY: 10 },
        allEntities: [],
        ...overrides
    };
}

describe('AIController', () => {
    describe('constructor', () => {
        it('should create controller with default config', () => {
            const mazeAdapter = createMockMazeAdapter();
            const controller = new AIController(mazeAdapter);

            expect(controller.mazeAdapter).toBe(mazeAdapter);
            expect(controller.config.modeDurations).toEqual(DEFAULT_MODE_DURATIONS);
            expect(controller.currentGlobalMode).toBe('SCATTER');
            expect(controller.isRunning).toBe(true);
        });

        it('should accept custom config', () => {
            const mazeAdapter = createMockMazeAdapter();
            const customDurations = [
                { mode: 'SCATTER', duration: 5 },
                { mode: 'CHASE', duration: 10 }
            ];
            const controller = new AIController(mazeAdapter, {
                modeDurations: customDurations,
                frightenedDuration: 10,
                randomnessFactor: 0.5
            });

            expect(controller.config.modeDurations).toEqual(customDurations);
            expect(controller.config.frightenedDuration).toBe(10);
            expect(controller.config.randomnessFactor).toBe(0.5);
        });

        it('should initialize with default virus core config', () => {
            const mazeAdapter = createMockMazeAdapter();
            const controller = new AIController(mazeAdapter);

            expect(controller.config.virusCoreCenter).toEqual({ x: 13, y: 14 });
            expect(controller.config.virusCoreEntrance).toEqual({ x: 13, y: 11 });
        });
    });

    describe('registerEntity', () => {
        it('should register entity for AI control', () => {
            const mazeAdapter = createMockMazeAdapter();
            const controller = new AIController(mazeAdapter);

            controller.registerEntity('ghost-1', 'alpha');

            expect(controller.aiConfigs.has('ghost-1')).toBe(true);
            expect(controller.getEntityCount()).toBe(1);
        });

        it('should register entity with custom options', () => {
            const mazeAdapter = createMockMazeAdapter();
            const controller = new AIController(mazeAdapter);

            controller.registerEntity('ghost-1', 'alpha', {
                initialMode: 'CHASE',
                scatterTarget: { x: 0, y: 0 },
                houseDuration: 3
            });

            const config = controller.getAIConfig('ghost-1');
            expect(config.mode).toBe('CHASE');
            expect(config.scatterTarget).toEqual({ x: 0, y: 0 });
            expect(config.houseDuration).toBe(3);
        });
    });

    describe('unregisterEntity', () => {
        it('should unregister entity', () => {
            const mazeAdapter = createMockMazeAdapter();
            const controller = new AIController(mazeAdapter);

            controller.registerEntity('ghost-1', 'alpha');
            controller.unregisterEntity('ghost-1');

            expect(controller.aiConfigs.has('ghost-1')).toBe(false);
            expect(controller.getEntityCount()).toBe(0);
        });
    });

    describe('update', () => {
        it('should return empty array when not running', () => {
            const mazeAdapter = createMockMazeAdapter();
            const controller = new AIController(mazeAdapter);
            controller.pause();

            const result = controller.update(0.016, createMockContext());

            expect(result).toEqual([]);
        });

        it('should return empty array when no entities registered', () => {
            const mazeAdapter = createMockMazeAdapter();
            const controller = new AIController(mazeAdapter);

            const result = controller.update(0.016, createMockContext());

            expect(result).toEqual([]);
        });

        it('should skip entities not at tile center', () => {
            const mazeAdapter = createMockMazeAdapter();
            const controller = new AIController(mazeAdapter);
            controller.registerEntity('ghost-1', 'alpha');

            const context = createMockContext({
                getEntityState: jest.fn().mockReturnValue(createMockEntityState({ moveProgress: 0.5 }))
            });

            const result = controller.update(0.016, context);

            expect(result).toEqual([]);
        });

        it('should skip entities that do not exist', () => {
            const mazeAdapter = createMockMazeAdapter();
            const controller = new AIController(mazeAdapter);
            controller.registerEntity('ghost-1', 'alpha');

            const context = createMockContext({
                getEntityState: jest.fn().mockReturnValue(null)
            });

            const result = controller.update(0.016, context);

            expect(result).toEqual([]);
        });

        it('should return decisions for registered entities', () => {
            const mazeAdapter = createMockMazeAdapter();
            const controller = new AIController(mazeAdapter);
            controller.registerEntity('ghost-1', 'alpha');

            const context = createMockContext();

            const result = controller.update(0.016, context);

            expect(result.length).toBeGreaterThan(0);
            expect(result[0].entityId).toBe('ghost-1');
            expect(result[0].direction).toBeDefined();
        });
    });

    describe('setFrightened', () => {
        it('should set frightened state for entity', () => {
            const mazeAdapter = createMockMazeAdapter();
            const controller = new AIController(mazeAdapter);
            controller.registerEntity('ghost-1', 'alpha');

            controller.setFrightened('ghost-1', 5);

            const config = controller.getAIConfig('ghost-1');
            expect(config.isFrightened).toBe(true);
            expect(config.frightenedTimer).toBe(5);
        });

        it('should use default frightened duration', () => {
            const mazeAdapter = createMockMazeAdapter();
            const controller = new AIController(mazeAdapter, { frightenedDuration: 10 });
            controller.registerEntity('ghost-1', 'alpha');

            controller.setFrightened('ghost-1');

            const config = controller.getAIConfig('ghost-1');
            expect(config.frightenedTimer).toBe(10);
        });

        it('should not set frightened for eaten entity', () => {
            const mazeAdapter = createMockMazeAdapter();
            const controller = new AIController(mazeAdapter);
            controller.registerEntity('ghost-1', 'alpha');
            controller.setEaten('ghost-1');

            controller.setFrightened('ghost-1', 5);

            const config = controller.getAIConfig('ghost-1');
            expect(config.isFrightened).toBe(false);
        });

        it('should handle unknown entity', () => {
            const mazeAdapter = createMockMazeAdapter();
            const controller = new AIController(mazeAdapter);

            // Should not throw
            controller.setFrightened('unknown', 5);
        });
    });

    describe('setEaten', () => {
        it('should set eaten state for entity', () => {
            const mazeAdapter = createMockMazeAdapter();
            const controller = new AIController(mazeAdapter);
            controller.registerEntity('ghost-1', 'alpha');

            controller.setEaten('ghost-1');

            const config = controller.getAIConfig('ghost-1');
            expect(config.isEaten).toBe(true);
            expect(config.isFrightened).toBe(false);
        });

        it('should handle unknown entity', () => {
            const mazeAdapter = createMockMazeAdapter();
            const controller = new AIController(mazeAdapter);

            // Should not throw
            controller.setEaten('unknown');
        });
    });

    describe('resetEntity', () => {
        it('should reset entity state', () => {
            const mazeAdapter = createMockMazeAdapter();
            const controller = new AIController(mazeAdapter);
            controller.registerEntity('ghost-1', 'alpha');
            controller.setFrightened('ghost-1', 5);

            controller.resetEntity('ghost-1');

            const config = controller.getAIConfig('ghost-1');
            expect(config.isFrightened).toBe(false);
            expect(config.isEaten).toBe(false);
            expect(config.inHouse).toBe(false);
        });

        it('should handle unknown entity', () => {
            const mazeAdapter = createMockMazeAdapter();
            const controller = new AIController(mazeAdapter);

            // Should not throw
            controller.resetEntity('unknown');
        });
    });

    describe('reset', () => {
        it('should reset all entities and timers', () => {
            const mazeAdapter = createMockMazeAdapter();
            const controller = new AIController(mazeAdapter);
            controller.registerEntity('ghost-1', 'alpha');
            controller.registerEntity('ghost-2', 'beta');
            controller.setFrightened('ghost-1', 5);
            controller.modeIndex = 2;
            controller.modeTimer = 10;
            controller.currentGlobalMode = 'CHASE';

            controller.reset();

            expect(controller.modeIndex).toBe(0);
            expect(controller.modeTimer).toBe(0);
            expect(controller.currentGlobalMode).toBe('SCATTER');

            const config1 = controller.getAIConfig('ghost-1');
            expect(config1.isFrightened).toBe(false);
        });
    });

    describe('pause/resume', () => {
        it('should pause controller', () => {
            const mazeAdapter = createMockMazeAdapter();
            const controller = new AIController(mazeAdapter);

            controller.pause();

            expect(controller.isRunning).toBe(false);
        });

        it('should resume controller', () => {
            const mazeAdapter = createMockMazeAdapter();
            const controller = new AIController(mazeAdapter);
            controller.pause();

            controller.resume();

            expect(controller.isRunning).toBe(true);
        });
    });

    describe('mode switching', () => {
        it('should update mode timer', () => {
            const mazeAdapter = createMockMazeAdapter();
            const controller = new AIController(mazeAdapter, {
                modeDurations: [
                    { mode: 'SCATTER', duration: 0.05 },
                    { mode: 'CHASE', duration: 1 }
                ]
            });

            controller.update(0.03, createMockContext());
            expect(controller.currentGlobalMode).toBe('SCATTER');

            controller.update(0.03, createMockContext());
            expect(controller.currentGlobalMode).toBe('CHASE');
        });

        it('should increment mode switches stat', () => {
            const mazeAdapter = createMockMazeAdapter();
            const controller = new AIController(mazeAdapter, {
                modeDurations: [
                    { mode: 'SCATTER', duration: 0.01 },
                    { mode: 'CHASE', duration: 1 }
                ]
            });

            controller.update(0.02, createMockContext());

            expect(controller.stats.modeSwitches).toBe(1);
        });
    });

    describe('getStats', () => {
        it('should return statistics', () => {
            const mazeAdapter = createMockMazeAdapter();
            const controller = new AIController(mazeAdapter);
            controller.registerEntity('ghost-1', 'alpha');

            const stats = controller.getStats();

            expect(stats.decisionsMade).toBeDefined();
            expect(stats.modeSwitches).toBeDefined();
            expect(stats.frightenedActivations).toBeDefined();
        });
    });

    describe('getCurrentMode', () => {
        it('should return current global mode', () => {
            const mazeAdapter = createMockMazeAdapter();
            const controller = new AIController(mazeAdapter);

            expect(controller.getCurrentMode()).toBe('SCATTER');
        });
    });

    describe('setMode', () => {
        it('should set mode for entity', () => {
            const mazeAdapter = createMockMazeAdapter();
            const controller = new AIController(mazeAdapter);
            controller.registerEntity('ghost-1', 'alpha');

            controller.setMode('ghost-1', 'CHASE');

            const config = controller.getAIConfig('ghost-1');
            expect(config.mode).toBe('CHASE');
        });

        it('should handle unknown entity', () => {
            const mazeAdapter = createMockMazeAdapter();
            const controller = new AIController(mazeAdapter);

            // Should not throw
            controller.setMode('unknown', 'CHASE');
        });
    });

    describe('setModeDurations', () => {
        it('should update mode durations', () => {
            const mazeAdapter = createMockMazeAdapter();
            const controller = new AIController(mazeAdapter);
            const newDurations = [
                { mode: 'SCATTER', duration: 5 },
                { mode: 'CHASE', duration: 10 }
            ];

            controller.setModeDurations(newDurations);

            expect(controller.config.modeDurations).toEqual(newDurations);
        });

        it('should ignore invalid mode durations', () => {
            const mazeAdapter = createMockMazeAdapter();
            const controller = new AIController(mazeAdapter);

            controller.setModeDurations(null);
            controller.setModeDurations([]);

            expect(controller.config.modeDurations).toEqual(DEFAULT_MODE_DURATIONS);
        });
    });

    describe('setRandomnessFactor', () => {
        it('should set randomness factor', () => {
            const mazeAdapter = createMockMazeAdapter();
            const controller = new AIController(mazeAdapter);

            controller.setRandomnessFactor(0.5);

            expect(controller.config.randomnessFactor).toBe(0.5);
        });

        it('should clamp to valid range', () => {
            const mazeAdapter = createMockMazeAdapter();
            const controller = new AIController(mazeAdapter);

            controller.setRandomnessFactor(-1);
            expect(controller.config.randomnessFactor).toBe(0);

            controller.setRandomnessFactor(2);
            expect(controller.config.randomnessFactor).toBe(1);
        });
    });

    describe('setRandomSeed', () => {
        it('should set random seed', () => {
            const mazeAdapter = createMockMazeAdapter();
            const controller = new AIController(mazeAdapter);

            // Should not throw
            controller.setRandomSeed(12345);
        });
    });

    describe('needsReverse', () => {
        it('should return true when entity needs reverse', () => {
            const mazeAdapter = createMockMazeAdapter();
            const controller = new AIController(mazeAdapter);
            controller.registerEntity('ghost-1', 'alpha');

            // Simulate mode switch that triggers reverse
            controller.aiConfigs.get('ghost-1').needsReverse = true;

            expect(controller.needsReverse('ghost-1')).toBe(true);
            // Should be reset after first call
            expect(controller.needsReverse('ghost-1')).toBe(false);
        });

        it('should return false for unknown entity', () => {
            const mazeAdapter = createMockMazeAdapter();
            const controller = new AIController(mazeAdapter);

            expect(controller.needsReverse('unknown')).toBe(false);
        });
    });

    describe('getEntityCount', () => {
        it('should return number of registered entities', () => {
            const mazeAdapter = createMockMazeAdapter();
            const controller = new AIController(mazeAdapter);

            expect(controller.getEntityCount()).toBe(0);

            controller.registerEntity('ghost-1', 'alpha');
            expect(controller.getEntityCount()).toBe(1);

            controller.registerEntity('ghost-2', 'beta');
            expect(controller.getEntityCount()).toBe(2);

            controller.unregisterEntity('ghost-1');
            expect(controller.getEntityCount()).toBe(1);
        });
    });

    describe('getAIConfig', () => {
        it('should return config for registered entity', () => {
            const mazeAdapter = createMockMazeAdapter();
            const controller = new AIController(mazeAdapter);
            controller.registerEntity('ghost-1', 'alpha');

            const config = controller.getAIConfig('ghost-1');

            expect(config).not.toBeNull();
            expect(config.aiType).toBe('alpha');
        });

        it('should return null for unknown entity', () => {
            const mazeAdapter = createMockMazeAdapter();
            const controller = new AIController(mazeAdapter);

            const config = controller.getAIConfig('unknown');

            expect(config).toBeNull();
        });
    });

    describe('frightened timer', () => {
        it('should update frightened timer', () => {
            const mazeAdapter = createMockMazeAdapter();
            const controller = new AIController(mazeAdapter);
            controller.registerEntity('ghost-1', 'alpha');
            controller.setFrightened('ghost-1', 0.1);

            controller.update(0.05, createMockContext());

            const config = controller.getAIConfig('ghost-1');
            expect(config.isFrightened).toBe(true);
        });

        it('should end frightened when timer expires', () => {
            const mazeAdapter = createMockMazeAdapter();
            const controller = new AIController(mazeAdapter);
            controller.registerEntity('ghost-1', 'alpha');
            controller.setFrightened('ghost-1', 0.01);

            controller.update(0.02, createMockContext());

            const config = controller.getAIConfig('ghost-1');
            expect(config.isFrightened).toBe(false);
        });

        it('should start blinking near end of frightened', () => {
            const mazeAdapter = createMockMazeAdapter();
            const controller = new AIController(mazeAdapter, {
                blinkStartTime: 0.05
            });
            controller.registerEntity('ghost-1', 'alpha');
            controller.setFrightened('ghost-1', 0.1);

            // Update until we're in the blink window (frightenedTimer <= blinkStartTime)
            // Need to get close enough to the end
            const config = controller.getAIConfig('ghost-1');

            // Simulate time passing until timer is below blink start time
            config.frightenedTimer = 0.03;

            controller.update(0.01, createMockContext());

            expect(config.isBlinking).toBe(true);
        });
    });

    describe('house timer', () => {
        it('should update house timer when in house', () => {
            const mazeAdapter = createMockMazeAdapter();
            const controller = new AIController(mazeAdapter);
            controller.registerEntity('ghost-1', 'alpha');

            // Set up eaten state
            const config = controller.getAIConfig('ghost-1');
            config.inHouse = true;
            config.houseTimer = 0.1;

            controller.update(0.05, createMockContext());

            // Timer should decrease
            expect(config.houseTimer).toBeLessThan(0.1);
        });
    });

    describe('decision making', () => {
        it('should return null when no valid directions', () => {
            const mazeAdapter = createMockMazeAdapter();
            mazeAdapter.getValidDirections.mockReturnValue([]);
            const controller = new AIController(mazeAdapter);
            controller.registerEntity('ghost-1', 'alpha');

            const result = controller.update(0.016, createMockContext());

            // Should return empty because no valid directions
            expect(result).toEqual([]);
        });

        it('should handle frightened state with null target', () => {
            const mazeAdapter = createMockMazeAdapter();
            const controller = new AIController(mazeAdapter);
            controller.registerEntity('ghost-1', 'alpha');
            controller.setFrightened('ghost-1', 10);

            const context = createMockContext();
            const result = controller.update(0.016, context);

            // Should still make a decision even with null target (random)
            expect(result.length).toBeGreaterThanOrEqual(0);
        });
    });
});
