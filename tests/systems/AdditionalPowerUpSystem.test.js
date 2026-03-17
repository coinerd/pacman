import { AdditionalPowerUpSystem, POWER_UP_TYPES } from '../../src/systems/AdditionalPowerUpSystem.js';
import { GAME_EVENTS } from '../../src/core/EventBus.js';

// Mock gameConfig
jest.mock('../../src/config/gameConfig.js', () => ({
    powerUpConfig: {
        maxOnScreen: 3,
        spawnRadius: 5,
        types: {
            SHIELD: { duration: 10, spawnChance: 5 },
            SPEED_BOOST: { duration: 8, spawnChance: 3 },
            DATA_MAGNET: { duration: 5, spawnChance: 2 }
        }
    }
}));

describe('AdditionalPowerUpSystem', () => {
    let powerUpSystem;
    let mockEntityRegistry;
    let mockEventBus;

    beforeEach(() => {
        mockEntityRegistry = {
            getEntity: jest.fn(),
            getEntities: jest.fn(() => [])
        };

        mockEventBus = {
            emit: jest.fn(),
            on: jest.fn(),
            off: jest.fn()
        };

        powerUpSystem = new AdditionalPowerUpSystem(mockEntityRegistry, mockEventBus);

        // Use real performance.now for timing tests
        jest.useRealTimers();
    });

    afterEach(() => {
        powerUpSystem.reset();
    });

    describe('constructor', () => {
        it('should initialize with empty state', () => {
            expect(powerUpSystem.activePowerUps.size).toBe(0);
            expect(powerUpSystem.powerUpTimers.size).toBe(0);
            expect(powerUpSystem.spawnedPowerUps).toEqual([]);
        });

        it('should use default eventBus if not provided', () => {
            const system = new AdditionalPowerUpSystem(mockEntityRegistry);
            expect(system.eventBus).toBeDefined();
        });
    });

    describe('spawnPowerUp', () => {
        it('should spawn a power-up successfully', () => {
            const powerUp = powerUpSystem.spawnPowerUp('SHIELD', 10, 20);

            expect(powerUp).not.toBeNull();
            expect(powerUp.type).toBe('SHIELD');
            expect(powerUp.x).toBe(10);
            expect(powerUp.y).toBe(20);
            expect(powerUpSystem.spawnedPowerUps).toHaveLength(1);
        });

        it('should emit POWER_UP_SPAWNED event', () => {
            powerUpSystem.spawnPowerUp('SHIELD', 10, 20);

            expect(mockEventBus.emit).toHaveBeenCalledWith(
                GAME_EVENTS.POWER_UP_SPAWNED,
                { type: 'SHIELD', x: 10, y: 20 }
            );
        });

        it('should return null if max on screen reached', () => {
            powerUpSystem.spawnPowerUp('SHIELD', 1, 1);
            powerUpSystem.spawnPowerUp('SPEED_BOOST', 2, 2);
            powerUpSystem.spawnPowerUp('DATA_MAGNET', 3, 3);

            const result = powerUpSystem.spawnPowerUp('SHIELD', 4, 4);
            expect(result).toBeNull();
        });

        it('should return null for unknown power-up type', () => {
            const result = powerUpSystem.spawnPowerUp('UNKNOWN', 10, 20);
            expect(result).toBeNull();
        });
    });

    describe('collectPowerUp', () => {
        it('should collect and activate power-up', () => {
            const mockPacman = { gridX: 10, gridY: 20 };
            mockEntityRegistry.getEntity.mockImplementation((key) => {
                if (key === 'pacman') {return mockPacman;}
                return null;
            });

            const powerUp = powerUpSystem.spawnPowerUp('SHIELD', 10, 20);
            const result = powerUpSystem.collectPowerUp(powerUp);

            expect(result).not.toBeNull();
            expect(result.type).toBe('SHIELD');
            expect(powerUpSystem.spawnedPowerUps).toHaveLength(0);
        });

        it('should emit POWER_UP_COLLECTED event', () => {
            const mockPacman = { gridX: 10, gridY: 20 };
            mockEntityRegistry.getEntity.mockReturnValue(mockPacman);

            const powerUp = powerUpSystem.spawnPowerUp('SHIELD', 10, 20);
            powerUpSystem.collectPowerUp(powerUp);

            expect(mockEventBus.emit).toHaveBeenCalledWith(
                GAME_EVENTS.POWER_UP_COLLECTED,
                expect.objectContaining({ type: 'SHIELD' })
            );
        });

        it('should return null if power-up not found', () => {
            const fakePowerUp = { type: 'SHIELD', x: 999, y: 999 };
            const result = powerUpSystem.collectPowerUp(fakePowerUp);
            expect(result).toBeNull();
        });
    });

    describe('activatePowerUp', () => {
        beforeEach(() => {
            const mockPacman = {
                gridX: 10,
                gridY: 20,
                baseSpeed: 100,
                speed: 100,
                isShielded: false,
                hasSpeedBoost: false,
                hasDataMagnet: false
            };
            mockEntityRegistry.getEntity.mockReturnValue(mockPacman);
        });

        it('should activate a power-up', () => {
            const result = powerUpSystem.activatePowerUp('SHIELD', 10);

            expect(result).not.toBeNull();
            expect(result.type).toBe('SHIELD');
            expect(result.duration).toBe(10);
            expect(powerUpSystem.activePowerUps.has('SHIELD')).toBe(true);
        });

        it('should emit POWER_UP_ACTIVATED event', () => {
            powerUpSystem.activatePowerUp('SHIELD', 10);

            expect(mockEventBus.emit).toHaveBeenCalledWith(
                GAME_EVENTS.POWER_UP_ACTIVATED,
                { type: 'SHIELD', duration: 10 }
            );
        });

        it('should use default duration if not specified', () => {
            const result = powerUpSystem.activatePowerUp('SHIELD');
            expect(result.duration).toBe(10); // From mock config
        });

        it('should return null for unknown type', () => {
            const result = powerUpSystem.activatePowerUp('UNKNOWN');
            expect(result).toBeNull();
        });

        it('should deactivate existing power-up of same type', () => {
            powerUpSystem.activatePowerUp('SHIELD', 10);
            powerUpSystem.activatePowerUp('SHIELD', 5);

            expect(mockEventBus.emit).toHaveBeenCalledWith(
                GAME_EVENTS.POWER_UP_EXPIRED,
                expect.objectContaining({ type: 'SHIELD' })
            );
        });
    });

    describe('deactivatePowerUp', () => {
        beforeEach(() => {
            const mockPacman = {
                gridX: 10,
                gridY: 20,
                isShielded: true,
                hasSpeedBoost: false,
                hasDataMagnet: false,
                baseSpeed: 100,
                speed: 100
            };
            mockEntityRegistry.getEntity.mockReturnValue(mockPacman);
        });

        it('should deactivate power-up', () => {
            powerUpSystem.activatePowerUp('SHIELD', 10);
            powerUpSystem.deactivatePowerUp('SHIELD');

            expect(powerUpSystem.activePowerUps.has('SHIELD')).toBe(false);
        });

        it('should emit POWER_UP_EXPIRED event', () => {
            powerUpSystem.activatePowerUp('SHIELD', 10);
            powerUpSystem.deactivatePowerUp('SHIELD');

            expect(mockEventBus.emit).toHaveBeenCalledWith(
                GAME_EVENTS.POWER_UP_EXPIRED,
                expect.objectContaining({ type: 'SHIELD' })
            );
        });

        it('should do nothing if power-up not active', () => {
            powerUpSystem.deactivatePowerUp('SHIELD');
            // No exception means success
        });
    });

    describe('applyPowerUpEffect', () => {
        it('should apply SHIELD effect', () => {
            const mockPacman = { isShielded: false };
            mockEntityRegistry.getEntity.mockReturnValue(mockPacman);

            powerUpSystem.applyPowerUpEffect(POWER_UP_TYPES.SHIELD);

            expect(mockPacman.isShielded).toBe(true);
        });

        it('should apply SPEED_BOOST effect', () => {
            const mockPacman = { hasSpeedBoost: false, baseSpeed: 100, speed: 100 };
            mockEntityRegistry.getEntity.mockReturnValue(mockPacman);

            powerUpSystem.applyPowerUpEffect(POWER_UP_TYPES.SPEED_BOOST);

            expect(mockPacman.hasSpeedBoost).toBe(true);
            expect(mockPacman.speed).toBe(200);
        });

        it('should apply DATA_MAGNET effect', () => {
            const mockPacman = { hasDataMagnet: false };
            mockEntityRegistry.getEntity.mockReturnValue(mockPacman);

            powerUpSystem.applyPowerUpEffect(POWER_UP_TYPES.DATA_MAGNET);

            expect(mockPacman.hasDataMagnet).toBe(true);
        });

        it('should do nothing if pacman not found', () => {
            mockEntityRegistry.getEntity.mockReturnValue(null);

            powerUpSystem.applyPowerUpEffect(POWER_UP_TYPES.SHIELD);
            // No exception means success
        });
    });

    describe('removePowerUpEffect', () => {
        it('should remove SHIELD effect', () => {
            const mockPacman = { isShielded: true };
            mockEntityRegistry.getEntity.mockReturnValue(mockPacman);

            powerUpSystem.removePowerUpEffect(POWER_UP_TYPES.SHIELD);

            expect(mockPacman.isShielded).toBe(false);
        });

        it('should remove SPEED_BOOST effect', () => {
            const mockPacman = { hasSpeedBoost: true, baseSpeed: 100, speed: 200 };
            mockEntityRegistry.getEntity.mockReturnValue(mockPacman);

            powerUpSystem.removePowerUpEffect(POWER_UP_TYPES.SPEED_BOOST);

            expect(mockPacman.hasSpeedBoost).toBe(false);
            expect(mockPacman.speed).toBe(100);
        });

        it('should remove DATA_MAGNET effect', () => {
            const mockPacman = { hasDataMagnet: true };
            mockEntityRegistry.getEntity.mockReturnValue(mockPacman);

            powerUpSystem.removePowerUpEffect(POWER_UP_TYPES.DATA_MAGNET);

            expect(mockPacman.hasDataMagnet).toBe(false);
        });
    });

    describe('update', () => {
        beforeEach(() => {
            const mockPacman = {
                gridX: 10,
                gridY: 20,
                isShielded: false,
                baseSpeed: 100,
                speed: 100,
                hasDataMagnet: false
            };
            mockEntityRegistry.getEntity.mockReturnValue(mockPacman);
        });

        it('should update power-up timers', () => {
            powerUpSystem.activatePowerUp('SHIELD', 10);

            // Update with small delta (should not expire)
            powerUpSystem.update(1);

            expect(powerUpSystem.activePowerUps.has('SHIELD')).toBe(true);
        });

        it('should deactivate expired power-ups', () => {
            powerUpSystem.activatePowerUp('SHIELD', 0.001); // Very short duration

            // Wait for expiration
            powerUpSystem.update(0.01);

            expect(powerUpSystem.activePowerUps.has('SHIELD')).toBe(false);
        });
    });

    describe('hasActivePowerUp', () => {
        it('should return true for active power-up', () => {
            const mockPacman = { isShielded: false };
            mockEntityRegistry.getEntity.mockReturnValue(mockPacman);

            powerUpSystem.activatePowerUp('SHIELD', 10);

            expect(powerUpSystem.hasActivePowerUp('SHIELD')).toBe(true);
        });

        it('should return false for inactive power-up', () => {
            expect(powerUpSystem.hasActivePowerUp('SHIELD')).toBe(false);
        });
    });

    describe('getRemainingTime', () => {
        it('should return remaining time for active power-up', () => {
            const mockPacman = { isShielded: false };
            mockEntityRegistry.getEntity.mockReturnValue(mockPacman);

            powerUpSystem.activatePowerUp('SHIELD', 10);

            const remaining = powerUpSystem.getRemainingTime('SHIELD');
            expect(remaining).toBeGreaterThan(0);
            expect(remaining).toBeLessThanOrEqual(10);
        });

        it('should return 0 for inactive power-up', () => {
            expect(powerUpSystem.getRemainingTime('SHIELD')).toBe(0);
        });
    });

    describe('getActivePowerUps', () => {
        it('should return array of active power-ups', () => {
            const mockPacman = {
                isShielded: false,
                hasSpeedBoost: false,
                speed: 100,
                baseSpeed: 100
            };
            mockEntityRegistry.getEntity.mockReturnValue(mockPacman);

            powerUpSystem.activatePowerUp('SHIELD', 10);
            powerUpSystem.activatePowerUp('SPEED_BOOST', 8);

            const active = powerUpSystem.getActivePowerUps();
            expect(active).toHaveLength(2);
        });

        it('should return empty array if no active power-ups', () => {
            expect(powerUpSystem.getActivePowerUps()).toEqual([]);
        });
    });

    describe('getSpawnedPowerUps', () => {
        it('should return copy of spawned power-ups', () => {
            powerUpSystem.spawnPowerUp('SHIELD', 10, 20);

            const spawned = powerUpSystem.getSpawnedPowerUps();
            expect(spawned).toHaveLength(1);

            // Verify it's a copy
            spawned.push({ type: 'FAKE' });
            expect(powerUpSystem.spawnedPowerUps).toHaveLength(1);
        });
    });

    describe('shouldSpawnPowerUp', () => {
        it('should return false if boss battle is active', () => {
            mockEntityRegistry.getEntity.mockImplementation((key) => {
                if (key === 'gameState') {return { isBossBattleActive: true };}
                return null;
            });

            const result = powerUpSystem.shouldSpawnPowerUp(100);
            expect(result).toBe(false);
        });

        it('should return false if max on screen reached', () => {
            mockEntityRegistry.getEntity.mockReturnValue(null);

            powerUpSystem.spawnPowerUp('SHIELD', 1, 1);
            powerUpSystem.spawnPowerUp('SPEED_BOOST', 2, 2);
            powerUpSystem.spawnPowerUp('DATA_MAGNET', 3, 3);

            const result = powerUpSystem.shouldSpawnPowerUp(100);
            expect(result).toBe(false);
        });
    });

    describe('findValidSpawnPosition', () => {
        it('should find valid spawn position', () => {
            const maze = [
                [1, 0, 1],
                [0, 0, 0],
                [1, 0, 1]
            ];

            mockEntityRegistry.getEntity.mockReturnValue(null);
            mockEntityRegistry.getEntities.mockReturnValue([]);

            const pos = powerUpSystem.findValidSpawnPosition(maze);

            // Position should be a walkable tile (0)
            if (pos) {
                expect(maze[pos.y][pos.x]).toBe(0);
            }
        });

        it('should return null if no valid position found', () => {
            // Maze with no walkable tiles
            const maze = [[1, 1], [1, 1]];

            const pos = powerUpSystem.findValidSpawnPosition(maze);
            expect(pos).toBeNull();
        });
    });

    describe('isPositionOccupied', () => {
        it('should return true if power-up at position', () => {
            powerUpSystem.spawnPowerUp('SHIELD', 10, 20);

            expect(powerUpSystem.isPositionOccupied(10, 20)).toBe(true);
        });

        it('should return true if pacman at position', () => {
            mockEntityRegistry.getEntity.mockReturnValue({ gridX: 10, gridY: 20 });

            expect(powerUpSystem.isPositionOccupied(10, 20)).toBe(true);
        });

        it('should return true if ghost at position', () => {
            mockEntityRegistry.getEntity.mockReturnValue(null);
            mockEntityRegistry.getEntities.mockReturnValue([{ gridX: 10, gridY: 20 }]);

            expect(powerUpSystem.isPositionOccupied(10, 20)).toBe(true);
        });

        it('should return false if position is free', () => {
            mockEntityRegistry.getEntity.mockReturnValue(null);
            mockEntityRegistry.getEntities.mockReturnValue([]);

            expect(powerUpSystem.isPositionOccupied(10, 20)).toBe(false);
        });
    });

    describe('reset', () => {
        it('should reset all state', () => {
            const mockPacman = {
                isShielded: true,
                hasSpeedBoost: false,
                hasDataMagnet: false,
                speed: 100,
                baseSpeed: 100
            };
            mockEntityRegistry.getEntity.mockReturnValue(mockPacman);

            powerUpSystem.spawnPowerUp('SHIELD', 10, 20);
            powerUpSystem.activatePowerUp('SHIELD', 10);

            powerUpSystem.reset();

            expect(powerUpSystem.activePowerUps.size).toBe(0);
            expect(powerUpSystem.powerUpTimers.size).toBe(0);
            expect(powerUpSystem.spawnedPowerUps).toEqual([]);
        });
    });

    describe('getSnapshot', () => {
        it('should return current state snapshot', () => {
            const mockPacman = {
                isShielded: false,
                speed: 100,
                baseSpeed: 100
            };
            mockEntityRegistry.getEntity.mockReturnValue(mockPacman);

            powerUpSystem.spawnPowerUp('SHIELD', 10, 20);
            powerUpSystem.activatePowerUp('SHIELD', 10);

            const snapshot = powerUpSystem.getSnapshot();

            expect(snapshot.activePowerUps).toHaveLength(1);
            expect(snapshot.spawnedPowerUps).toHaveLength(1);
        });
    });
});
