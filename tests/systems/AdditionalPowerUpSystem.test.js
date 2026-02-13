import { gameEvents } from '../../src/core/EventBus.js';
import AdditionalPowerUpSystem, {
    POWER_UP_TYPES
} from '../../src/systems/AdditionalPowerUpSystem.js';

describe('AdditionalPowerUpSystem', () => {
    let mockGameModel;
    let system;

    beforeEach(() => {
        mockGameModel = {
            pacman: {
                isShielded: false,
                hasSpeedBoost: false,
                hasDataMagnet: false,
                baseSpeed: 120,
                speed: 120,
                gridX: 10,
                gridY: 10
            },
            maze: [],
            pelletGrid: [],
            isBossBattleActive: jest.fn(() => false),
            eatPelletAt: jest.fn()
        };

        system = new AdditionalPowerUpSystem(mockGameModel);
    });

    describe('Constructor', () => {
        test('should initialize with empty power-up maps', () => {
            expect(system.activePowerUps.size).toBe(0);
            expect(system.powerUpTimers.size).toBe(0);
            expect(system.spawnedPowerUps).toEqual([]);
        });

        test('should store reference to game model', () => {
            expect(system.gameModel).toBe(mockGameModel);
        });
    });

    describe('spawnPowerUp', () => {
        test('should spawn power-up at valid position', () => {
            const powerUp = system.spawnPowerUp(POWER_UP_TYPES.SHIELD, 5, 5);

            expect(powerUp).not.toBeNull();
            expect(powerUp.type).toBe(POWER_UP_TYPES.SHIELD);
            expect(powerUp.x).toBe(5);
            expect(powerUp.y).toBe(5);
            expect(powerUp.config).toBeDefined();
        });

        test('should add to spawned power-ups array', () => {
            system.spawnPowerUp(POWER_UP_TYPES.SPEED_BOOST, 5, 5);
            system.spawnPowerUp(POWER_UP_TYPES.DATA_MAGNET, 10, 10);

            expect(system.spawnedPowerUps.length).toBe(2);
        });

        test('should not spawn power-up when max limit reached', () => {
            for (let i = 0; i < 4; i++) {
                system.spawnPowerUp(POWER_UP_TYPES.SHIELD, i, i);
            }

            expect(system.spawnedPowerUps.length).toBe(3);
        });

        test('should return null for invalid power-up type', () => {
            const powerUp = system.spawnPowerUp('INVALID_TYPE', 5, 5);
            expect(powerUp).toBeNull();
        });

        test('should emit POWER_UP_SPAWNED event', () => {
            const emitSpy = jest.spyOn(gameEvents, 'emit');

            system.spawnPowerUp(POWER_UP_TYPES.SHIELD, 5, 5);

            expect(emitSpy).toHaveBeenCalledWith(
                expect.stringContaining('power-up:spawned'),
                expect.objectContaining({
                    type: POWER_UP_TYPES.SHIELD,
                    x: 5,
                    y: 5
                })
            );
        });
    });

    describe('collectPowerUp', () => {
        beforeEach(() => {
            system.spawnPowerUp(POWER_UP_TYPES.SHIELD, 5, 5);
        });

        test('should remove power-up from spawned array', () => {
            const powerUp = system.spawnedPowerUps[0];
            system.collectPowerUp(powerUp);

            expect(system.spawnedPowerUps.length).toBe(0);
        });

        test('should activate power-up effect', () => {
            const powerUp = system.spawnedPowerUps[0];
            system.collectPowerUp(powerUp);

            expect(mockGameModel.pacman.isShielded).toBe(true);
        });

        test('should emit POWER_UP_COLLECTED event', () => {
            const emitSpy = jest.spyOn(gameEvents, 'emit');
            const powerUp = system.spawnedPowerUps[0];

            system.collectPowerUp(powerUp);

            expect(emitSpy).toHaveBeenCalledWith(
                expect.stringContaining('power-up:collected'),
                expect.objectContaining({
                    type: POWER_UP_TYPES.SHIELD
                })
            );
        });

        test('should return null for power-up not in spawned array', () => {
            const fakePowerUp = { type: POWER_UP_TYPES.SHIELD, x: 999, y: 999 };
            const result = system.collectPowerUp(fakePowerUp);

            expect(result).toBeNull();
        });
    });

    describe('activatePowerUp', () => {
        test('should add power-up to active power-ups', () => {
            system.activatePowerUp(POWER_UP_TYPES.SHIELD, 8);

            expect(system.activePowerUps.has(POWER_UP_TYPES.SHIELD)).toBe(true);
        });

        test('should apply power-up effect to player', () => {
            system.activatePowerUp(POWER_UP_TYPES.SPEED_BOOST, 5);

            expect(mockGameModel.pacman.hasSpeedBoost).toBe(true);
            expect(mockGameModel.pacman.speed).toBe(240);
        });

        test('should use default duration if not provided', () => {
            system.activatePowerUp(POWER_UP_TYPES.SHIELD);

            const powerUp = system.activePowerUps.get(POWER_UP_TYPES.SHIELD);
            expect(powerUp.duration).toBe(8000);
        });

        test('should use custom duration if provided', () => {
            system.activatePowerUp(POWER_UP_TYPES.SHIELD, 10);

            const powerUp = system.activePowerUps.get(POWER_UP_TYPES.SHIELD);
            expect(powerUp.duration).toBe(10000);
        });

        test('should emit POWER_UP_ACTIVATED event', () => {
            const emitSpy = jest.spyOn(gameEvents, 'emit');

            system.activatePowerUp(POWER_UP_TYPES.SHIELD, 8);

            expect(emitSpy).toHaveBeenCalledWith(
                expect.stringContaining('power-up:activated'),
                expect.objectContaining({
                    type: POWER_UP_TYPES.SHIELD,
                    duration: 8
                })
            );
        });

        test('should deactivate existing power-up of same type', () => {
            system.activatePowerUp(POWER_UP_TYPES.SHIELD, 5);
            expect(mockGameModel.pacman.isShielded).toBe(true);

            system.activatePowerUp(POWER_UP_TYPES.SHIELD, 10);
            expect(mockGameModel.pacman.isShielded).toBe(true);
        });

        test('should return null for invalid type', () => {
            const result = system.activatePowerUp('INVALID_TYPE');
            expect(result).toBeNull();
        });

        test('should return power-up activation result', () => {
            const result = system.activatePowerUp(POWER_UP_TYPES.SHIELD, 8);

            expect(result).toEqual({
                type: POWER_UP_TYPES.SHIELD,
                duration: 8
            });
        });
    });

    describe('deactivatePowerUp', () => {
        beforeEach(() => {
            system.activatePowerUp(POWER_UP_TYPES.SHIELD, 5);
        });

        test('should remove power-up from active map', () => {
            system.deactivatePowerUp(POWER_UP_TYPES.SHIELD);

            expect(system.activePowerUps.has(POWER_UP_TYPES.SHIELD)).toBe(false);
        });

        test('should remove power-up effect from player', () => {
            system.deactivatePowerUp(POWER_UP_TYPES.SHIELD);

            expect(mockGameModel.pacman.isShielded).toBe(false);
        });

        test('should emit POWER_UP_EXPIRED event', () => {
            const emitSpy = jest.spyOn(gameEvents, 'emit');

            system.deactivatePowerUp(POWER_UP_TYPES.SHIELD);

            expect(emitSpy).toHaveBeenCalledWith(
                expect.stringContaining('power-up:expired'),
                expect.objectContaining({
                    type: POWER_UP_TYPES.SHIELD
                })
            );
        });

        test('should do nothing for non-existent power-up', () => {
            expect(system.activePowerUps.has(POWER_UP_TYPES.SPEED_BOOST)).toBe(false);

            expect(() => {
                system.deactivatePowerUp(POWER_UP_TYPES.SPEED_BOOST);
            }).not.toThrow();
        });
    });

    describe('applyPowerUpEffect', () => {
        test('should set isShielded for SHIELD', () => {
            system.applyPowerUpEffect(POWER_UP_TYPES.SHIELD);

            expect(mockGameModel.pacman.isShielded).toBe(true);
        });

        test('should set hasSpeedBoost and double speed for SPEED_BOOST', () => {
            mockGameModel.pacman.speed = 120;
            system.applyPowerUpEffect(POWER_UP_TYPES.SPEED_BOOST);

            expect(mockGameModel.pacman.hasSpeedBoost).toBe(true);
            expect(mockGameModel.pacman.speed).toBe(240);
        });

        test('should set hasDataMagnet for DATA_MAGNET', () => {
            system.applyPowerUpEffect(POWER_UP_TYPES.DATA_MAGNET);

            expect(mockGameModel.pacman.hasDataMagnet).toBe(true);
        });
    });

    describe('removePowerUpEffect', () => {
        beforeEach(() => {
            mockGameModel.pacman.isShielded = true;
            mockGameModel.pacman.hasSpeedBoost = true;
            mockGameModel.pacman.hasDataMagnet = true;
        });

        test('should reset isShielded for SHIELD', () => {
            system.removePowerUpEffect(POWER_UP_TYPES.SHIELD);

            expect(mockGameModel.pacman.isShielded).toBe(false);
        });

        test('should reset hasSpeedBoost and restore speed for SPEED_BOOST', () => {
            system.removePowerUpEffect(POWER_UP_TYPES.SPEED_BOOST);

            expect(mockGameModel.pacman.hasSpeedBoost).toBe(false);
            expect(mockGameModel.pacman.speed).toBe(120);
        });

        test('should reset hasDataMagnet for DATA_MAGNET', () => {
            system.removePowerUpEffect(POWER_UP_TYPES.DATA_MAGNET);

            expect(mockGameModel.pacman.hasDataMagnet).toBe(false);
        });
    });

    describe('update', () => {
        test('should do nothing when no active power-ups', () => {
            expect(() => {
                system.update(0.016);
            }).not.toThrow();
        });

        test('should deactivate power-up when timer expires', () => {
            system.activatePowerUp(POWER_UP_TYPES.SHIELD, 0.001);
            expect(mockGameModel.pacman.isShielded).toBe(true);

            system.update(1);

            expect(mockGameModel.pacman.isShielded).toBe(false);
        });

        test('should keep power-up active while timer not expired', () => {
            system.activatePowerUp(POWER_UP_TYPES.SHIELD, 5);
            system.update(1);

            expect(mockGameModel.pacman.isShielded).toBe(true);
        });
    });

    describe('hasActivePowerUp', () => {
        test('should return true for active power-up', () => {
            system.activatePowerUp(POWER_UP_TYPES.SHIELD, 5);

            expect(system.hasActivePowerUp(POWER_UP_TYPES.SHIELD)).toBe(true);
        });

        test('should return false for inactive power-up', () => {
            expect(system.hasActivePowerUp(POWER_UP_TYPES.SHIELD)).toBe(false);
        });
    });

    describe('getRemainingTime', () => {
        test('should return 0 for inactive power-up', () => {
            const time = system.getRemainingTime(POWER_UP_TYPES.SHIELD);

            expect(time).toBe(0);
        });

        test('should return remaining time for active power-up', () => {
            system.activatePowerUp(POWER_UP_TYPES.SHIELD, 5);
            const time = system.getRemainingTime(POWER_UP_TYPES.SHIELD);

            expect(time).toBeGreaterThan(0);
            expect(time).toBeLessThanOrEqual(5);
        });

        test('should return 0 when power-up expires', () => {
            system.activatePowerUp(POWER_UP_TYPES.SHIELD, 0.001);
            system.update(1);

            const time = system.getRemainingTime(POWER_UP_TYPES.SHIELD);
            expect(time).toBe(0);
        });
    });

    describe('getActivePowerUps', () => {
        test('should return empty array when no active power-ups', () => {
            const powerUps = system.getActivePowerUps();

            expect(powerUps).toEqual([]);
        });

        test('should return array of active power-ups', () => {
            system.activatePowerUp(POWER_UP_TYPES.SHIELD, 5);
            system.activatePowerUp(POWER_UP_TYPES.SPEED_BOOST, 3);

            const powerUps = system.getActivePowerUps();
            expect(powerUps.length).toBe(2);
        });
    });

    describe('getSpawnedPowerUps', () => {
        test('should return copy of spawned power-ups', () => {
            system.spawnPowerUp(POWER_UP_TYPES.SHIELD, 5, 5);

            const spawned = system.getSpawnedPowerUps();
            expect(spawned).toHaveLength(1);
            expect(spawned[0]).toEqual(system.spawnedPowerUps[0]);
        });
    });

    describe('reset', () => {
        test('should clear all active power-ups', () => {
            system.activatePowerUp(POWER_UP_TYPES.SHIELD, 5);
            system.activatePowerUp(POWER_UP_TYPES.SPEED_BOOST, 3);

            system.reset();

            expect(system.activePowerUps.size).toBe(0);
        });

        test('should clear all power-up timers', () => {
            system.activatePowerUp(POWER_UP_TYPES.SHIELD, 5);

            system.reset();

            expect(system.powerUpTimers.size).toBe(0);
        });

        test('should clear spawned power-ups array', () => {
            system.spawnPowerUp(POWER_UP_TYPES.SHIELD, 5, 5);

            system.reset();

            expect(system.spawnedPowerUps).toEqual([]);
        });

        test('should remove all power-up effects from player', () => {
            system.activatePowerUp(POWER_UP_TYPES.SHIELD, 5);
            system.activatePowerUp(POWER_UP_TYPES.SPEED_BOOST, 3);

            system.reset();

            expect(mockGameModel.pacman.isShielded).toBe(false);
            expect(mockGameModel.pacman.hasSpeedBoost).toBe(false);
            expect(mockGameModel.pacman.hasDataMagnet).toBe(false);
        });

        test('should restore player speed to base', () => {
            system.activatePowerUp(POWER_UP_TYPES.SPEED_BOOST, 5);
            expect(mockGameModel.pacman.speed).toBe(240);

            system.reset();

            expect(mockGameModel.pacman.speed).toBe(120);
        });
    });

    describe('getSnapshot', () => {
        test('should return empty snapshot when no power-ups', () => {
            const snapshot = system.getSnapshot();

            expect(snapshot.activePowerUps).toEqual([]);
            expect(snapshot.spawnedPowerUps).toEqual([]);
        });

        test('should include active power-ups in snapshot', () => {
            system.activatePowerUp(POWER_UP_TYPES.SHIELD, 5);

            const snapshot = system.getSnapshot();

            expect(snapshot.activePowerUps).toHaveLength(1);
            expect(snapshot.activePowerUps[0].type).toBe(POWER_UP_TYPES.SHIELD);
            expect(snapshot.activePowerUps[0].remainingTime).toBeGreaterThan(0);
        });

        test('should include spawned power-ups in snapshot', () => {
            system.spawnPowerUp(POWER_UP_TYPES.SHIELD, 5, 5);

            const snapshot = system.getSnapshot();

            expect(snapshot.spawnedPowerUps).toHaveLength(1);
            expect(snapshot.spawnedPowerUps[0].type).toBe(POWER_UP_TYPES.SHIELD);
            expect(snapshot.spawnedPowerUps[0].x).toBe(5);
            expect(snapshot.spawnedPowerUps[0].y).toBe(5);
        });
    });

    describe('POWER_UP_TYPES', () => {
        test('should export SHIELD constant', () => {
            expect(POWER_UP_TYPES.SHIELD).toBe('SHIELD');
        });

        test('should export SPEED_BOOST constant', () => {
            expect(POWER_UP_TYPES.SPEED_BOOST).toBe('SPEED_BOOST');
        });

        test('should export DATA_MAGNET constant', () => {
            expect(POWER_UP_TYPES.DATA_MAGNET).toBe('DATA_MAGNET');
        });
    });
});
