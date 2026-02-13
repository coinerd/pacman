import { bossConfig } from '../../src/config/gameConfig.js';
import { GAME_EVENTS, gameEvents } from '../../src/core/EventBus.js';
import BossBattleSystem from '../../src/systems/BossBattleSystem.js';

describe('BossBattleSystem', () => {
    let mockGameModel;
    let bossSystem;

    beforeEach(() => {
        mockGameModel = {
            score: 0,
            level: 5
        };
        bossSystem = new BossBattleSystem(mockGameModel);
    });

    afterEach(() => {
        bossSystem.reset();
    });

    describe('constructor', () => {
        it('should initialize with null boss', () => {
            expect(bossSystem.currentBoss).toBeNull();
            expect(bossSystem.bossHealth).toBe(0);
            expect(bossSystem.bossMaxHealth).toBe(0);
            expect(bossSystem.bossPhase).toBe(1);
            expect(bossSystem.bossType).toBeNull();
            expect(bossSystem.isBossActive).toBe(false);
        });

        it('should store reference to gameModel', () => {
            expect(bossSystem.gameModel).toBe(mockGameModel);
        });
    });

    describe('spawnBoss', () => {
        it('should spawn alpha boss with correct health', () => {
            const boss = bossSystem.spawnBoss('alpha', 5);

            expect(boss).not.toBeNull();
            expect(bossSystem.isBossActive).toBe(true);
            expect(bossSystem.bossHealth).toBe(3);
            expect(bossSystem.bossMaxHealth).toBe(3);
            expect(bossSystem.bossType).toBe('alpha');
            expect(boss.bossType).toBe('alpha');
            expect(boss.health).toBe(3);
        });

        it('should spawn beta boss with correct health', () => {
            const boss = bossSystem.spawnBoss('beta', 10);

            expect(bossSystem.bossHealth).toBe(4);
            expect(bossSystem.bossMaxHealth).toBe(4);
            expect(boss.health).toBe(4);
        });

        it('should spawn gamma boss with correct health', () => {
            const boss = bossSystem.spawnBoss('gamma', 15);

            expect(bossSystem.bossType).toBe('gamma');
            expect(bossSystem.bossHealth).toBe(2);
            expect(bossSystem.bossMaxHealth).toBe(2);
            expect(boss.health).toBe(2);
        });

        it('should spawn delta boss with correct health', () => {
            const boss = bossSystem.spawnBoss('delta', 20);

            expect(bossSystem.bossHealth).toBe(5);
            expect(bossSystem.bossMaxHealth).toBe(5);
            expect(boss.health).toBe(5);
        });

        it('should create boss at virus core entrance', () => {
            const boss = bossSystem.spawnBoss('alpha', 5);

            expect(boss.gridX).toBe(12);
            expect(boss.gridY).toBe(15);
        });

        it('should initialize boss phase to 1', () => {
            bossSystem.spawnBoss('alpha', 5);

            expect(bossSystem.bossPhase).toBe(1);
            expect(bossSystem.currentBoss.phase).toBe(1);
        });

        it('should return null for invalid boss type', () => {
            const boss = bossSystem.spawnBoss('invalid', 5);

            expect(boss).toBeNull();
            expect(bossSystem.isBossActive).toBe(false);
        });

        it('should not spawn boss if already active', () => {
            bossSystem.spawnBoss('alpha', 5);
            const secondBoss = bossSystem.spawnBoss('beta', 10);

            expect(secondBoss).toBeNull();
            expect(bossSystem.bossType).toBe('alpha');
        });

        it('should emit BOSS_SPAWNED event', () => {
            const emitSpy = jest.spyOn(gameEvents, 'emit');

            bossSystem.spawnBoss('alpha', 5);

            expect(emitSpy).toHaveBeenCalledWith(GAME_EVENTS.BOSS_SPAWNED, {
                bossType: 'alpha',
                level: 5,
                position: { x: 12, y: 15 }
            });

            emitSpy.mockRestore();
        });
    });

    describe('damageBoss', () => {
        beforeEach(() => {
            bossSystem.spawnBoss('alpha', 5);
        });

        it('should reduce boss health', () => {
            const result = bossSystem.damageBoss(1);

            expect(result).toBe(true);
            expect(bossSystem.bossHealth).toBe(2);
            expect(bossSystem.currentBoss.health).toBe(2);
        });

        it('should not reduce health below zero', () => {
            bossSystem.damageBoss(2);
            bossSystem.damageBoss(2);

            expect(bossSystem.bossHealth).toBe(0);
            expect(bossSystem.isBossActive).toBe(false);
        });

        it('should return false if no active boss', () => {
            bossSystem.reset();
            const result = bossSystem.damageBoss(1);

            expect(result).toBe(false);
        });

        it('should return false if boss already defeated', () => {
            bossSystem.damageBoss(3);
            const result = bossSystem.damageBoss(1);

            expect(result).toBe(false);
        });

        it('should emit BOSS_DAMAGED event', () => {
            const emitSpy = jest.spyOn(gameEvents, 'emit');

            bossSystem.damageBoss(1);

            expect(emitSpy).toHaveBeenCalledWith(GAME_EVENTS.BOSS_DAMAGED, {
                bossType: 'alpha',
                currentHealth: 2,
                maxHealth: 3,
                damageAmount: 1
            });

            emitSpy.mockRestore();
        });

        it('should defeat boss when health reaches zero', () => {
            const emitSpy = jest.spyOn(gameEvents, 'emit');

            bossSystem.damageBoss(3);

            expect(emitSpy).toHaveBeenCalledWith(GAME_EVENTS.BOSS_DEFEATED, {
                bossType: 'alpha',
                scoreBonus: 5000,
                timeTaken: expect.any(Number),
                finalScore: 5000
            });

            emitSpy.mockRestore();
        });
    });

    describe('boss phase transitions', () => {
        it('should transition alpha boss to phase 2 at 50% health', () => {
            const emitSpy = jest.spyOn(gameEvents, 'emit');

            bossSystem.spawnBoss('alpha', 5);
            expect(bossSystem.bossPhase).toBe(1);

            bossSystem.damageBoss(1);
            bossSystem.update(0);

            expect(bossSystem.bossPhase).toBe(1);

            bossSystem.damageBoss(1);
            bossSystem.update(0);

            expect(bossSystem.bossPhase).toBe(2);
            expect(emitSpy).toHaveBeenCalledWith(GAME_EVENTS.BOSS_PHASE_CHANGED, {
                bossType: 'alpha',
                phase: 2,
                health: 1,
                maxHealth: 3
            });

            emitSpy.mockRestore();
        });

        it('should transition beta boss through all phases', () => {
            const emitSpy = jest.spyOn(gameEvents, 'emit');

            bossSystem.spawnBoss('beta', 10);
            expect(bossSystem.bossPhase).toBe(1);

            bossSystem.damageBoss(2);
            bossSystem.update(0);

            expect(bossSystem.bossPhase).toBe(2);
            expect(emitSpy).toHaveBeenCalledWith(GAME_EVENTS.BOSS_PHASE_CHANGED, {
                bossType: 'beta',
                phase: 2,
                health: 2,
                maxHealth: 4
            });

            bossSystem.damageBoss(1);
            bossSystem.update(0);

            expect(bossSystem.bossPhase).toBe(3);
            expect(emitSpy).toHaveBeenCalledWith(GAME_EVENTS.BOSS_PHASE_CHANGED, {
                bossType: 'beta',
                phase: 3,
                health: 1,
                maxHealth: 4
            });

            emitSpy.mockRestore();
        });

        it('should not transition past max phases', () => {
            bossSystem.spawnBoss('alpha', 5);
            bossSystem.damageBoss(3);

            expect(bossSystem.bossPhase).toBe(1);
        });
    });

    describe('boss behavior updates', () => {
        it('should update alpha boss speed in phase 2', () => {
            bossSystem.spawnBoss('alpha', 5);
            bossSystem.bossPhase = 2;
            bossSystem.updateBossBehavior(0);

            expect(bossSystem.currentBoss.speedMultiplier).toBe(1.5);
        });

        it('should update alpha boss speed in phase 1', () => {
            bossSystem.spawnBoss('alpha', 5);
            bossSystem.updateBossBehavior(0);

            expect(bossSystem.currentBoss.speedMultiplier).toBe(1.0);
        });

        it('should update beta boss speed in each phase', () => {
            bossSystem.spawnBoss('beta', 10);

            bossSystem.bossPhase = 1;
            bossSystem.updateBossBehavior(0);
            expect(bossSystem.currentBoss.speedMultiplier).toBe(1.0);

            bossSystem.bossPhase = 2;
            bossSystem.updateBossBehavior(0);
            expect(bossSystem.currentBoss.speedMultiplier).toBe(1.2);

            bossSystem.bossPhase = 3;
            bossSystem.updateBossBehavior(0);
            expect(bossSystem.currentBoss.speedMultiplier).toBe(1.0);
        });

        it('should update gamma boss with variable speed in phase 1', () => {
            bossSystem.spawnBoss('gamma', 15);
            bossSystem.updateBossBehavior(0);

            expect(bossSystem.currentBoss.speedMultiplier).toBeGreaterThan(0.5);
            expect(bossSystem.currentBoss.speedMultiplier).toBeLessThanOrEqual(1.5);
        });

        it('should update gamma boss speed in phase 2', () => {
            bossSystem.spawnBoss('gamma', 15);
            bossSystem.bossPhase = 2;
            bossSystem.updateBossBehavior(0);

            expect(bossSystem.currentBoss.speedMultiplier).toBe(1.0);
        });

        it('should update delta boss speed in phase 1', () => {
            bossSystem.spawnBoss('delta', 20);
            bossSystem.updateBossBehavior(0);

            expect(bossSystem.currentBoss.speedMultiplier).toBe(0.8);
        });

        it('should update delta boss speed in phase 2', () => {
            bossSystem.spawnBoss('delta', 20);
            bossSystem.bossPhase = 2;
            bossSystem.updateBossBehavior(0);

            expect(bossSystem.currentBoss.speedMultiplier).toBe(1.0);
        });
    });

    describe('defeatBoss', () => {
        it('should add score bonus to game model', () => {
            bossSystem.spawnBoss('alpha', 5);
            bossSystem.bossHealth = 0;
            bossSystem.defeatBoss();

            expect(mockGameModel.score).toBe(5000);
        });

        it('should reset boss state after defeat', () => {
            bossSystem.spawnBoss('alpha', 5);
            bossSystem.defeatBoss();

            expect(bossSystem.isBossActive).toBe(false);
            expect(bossSystem.currentBoss).toBeNull();
            expect(bossSystem.bossHealth).toBe(0);
            expect(bossSystem.bossType).toBeNull();
        });

        it('should not emit defeat event if no active boss', () => {
            const emitSpy = jest.spyOn(gameEvents, 'emit');

            bossSystem.defeatBoss();

            expect(emitSpy).not.toHaveBeenCalledWith(GAME_EVENTS.BOSS_DEFEATED);

            emitSpy.mockRestore();
        });
    });

    describe('reset', () => {
        it('should reset all boss state', () => {
            bossSystem.spawnBoss('alpha', 5);
            bossSystem.damageBoss(1);
            bossSystem.bossPhase = 2;
            bossSystem.phaseTimer = 5;

            bossSystem.reset();

            expect(bossSystem.currentBoss).toBeNull();
            expect(bossSystem.bossHealth).toBe(0);
            expect(bossSystem.bossMaxHealth).toBe(0);
            expect(bossSystem.bossPhase).toBe(1);
            expect(bossSystem.bossType).toBeNull();
            expect(bossSystem.isBossActive).toBe(false);
            expect(bossSystem.phaseTimer).toBe(0);
            expect(bossSystem.bossStartTime).toBe(0);
        });
    });

    describe('shouldSpawnBoss', () => {
        it('should return true for boss spawn levels', () => {
            expect(bossSystem.shouldSpawnBoss(5)).toBe(true);
            expect(bossSystem.shouldSpawnBoss(10)).toBe(true);
            expect(bossSystem.shouldSpawnBoss(15)).toBe(true);
            expect(bossSystem.shouldSpawnBoss(20)).toBe(true);
        });

        it('should return false for non-boss levels', () => {
            expect(bossSystem.shouldSpawnBoss(1)).toBe(false);
            expect(bossSystem.shouldSpawnBoss(2)).toBe(false);
            expect(bossSystem.shouldSpawnBoss(3)).toBe(false);
            expect(bossSystem.shouldSpawnBoss(4)).toBe(false);
            expect(bossSystem.shouldSpawnBoss(6)).toBe(false);
        });
    });

    describe('getBossTypeForLevel', () => {
        it('should return alpha for level 5', () => {
            expect(bossSystem.getBossTypeForLevel(5)).toBe('alpha');
        });

        it('should return beta for level 10', () => {
            expect(bossSystem.getBossTypeForLevel(10)).toBe('beta');
        });

        it('should return gamma for level 15', () => {
            expect(bossSystem.getBossTypeForLevel(15)).toBe('gamma');
        });

        it('should return delta for level 20', () => {
            expect(bossSystem.getBossTypeForLevel(20)).toBe('delta');
        });

        it('should return null for non-boss levels', () => {
            expect(bossSystem.getBossTypeForLevel(1)).toBeNull();
            expect(bossSystem.getBossTypeForLevel(6)).toBeNull();
        });
    });

    describe('getter methods', () => {
        beforeEach(() => {
            bossSystem.spawnBoss('alpha', 5);
        });

        it('should get boss health', () => {
            expect(bossSystem.getBossHealth()).toBe(3);
        });

        it('should get boss max health', () => {
            expect(bossSystem.getBossMaxHealth()).toBe(3);
        });

        it('should get boss phase', () => {
            expect(bossSystem.getBossPhase()).toBe(1);
        });

        it('should get boss type', () => {
            expect(bossSystem.getBossType()).toBe('alpha');
        });

        it('should check if boss battle is active', () => {
            expect(bossSystem.isBossBattleActive()).toBe(true);
        });

        it('should get boss entity', () => {
            const boss = bossSystem.getBossEntity();

            expect(boss).not.toBeNull();
            expect(boss.bossType).toBe('alpha');
        });

        it('should get boss config', () => {
            const config = bossSystem.getBossConfig();

            expect(config).toEqual(bossConfig.bossTypes.alpha);
        });
    });

    describe('getSnapshot', () => {
        it('should return complete boss state snapshot', () => {
            bossSystem.spawnBoss('alpha', 5);
            bossSystem.damageBoss(1);

            const snapshot = bossSystem.getSnapshot();

            expect(snapshot).toEqual({
                isBossActive: true,
                bossType: 'alpha',
                bossHealth: 2,
                bossMaxHealth: 3,
                bossPhase: 1,
                boss: expect.any(Object)
            });
        });

        it('should return empty snapshot when no boss active', () => {
            const snapshot = bossSystem.getSnapshot();

            expect(snapshot).toEqual({
                isBossActive: false,
                bossType: null,
                bossHealth: 0,
                bossMaxHealth: 0,
                bossPhase: 1,
                boss: null
            });
        });
    });

    describe('update', () => {
        it('should not update when boss is not active', () => {
            const updateSpy = jest.spyOn(bossSystem, 'updateBossBehavior');

            bossSystem.update(0.016);

            expect(updateSpy).not.toHaveBeenCalled();

            updateSpy.mockRestore();
        });

        it('should update phase timer when boss is active', () => {
            bossSystem.spawnBoss('alpha', 5);

            bossSystem.update(0.016);

            expect(bossSystem.phaseTimer).toBe(0.016);
        });

        it('should update boss behavior when boss is active', () => {
            const updateSpy = jest.spyOn(bossSystem, 'updateBossBehavior');

            bossSystem.spawnBoss('alpha', 5);
            bossSystem.update(0.016);

            expect(updateSpy).toHaveBeenCalled();

            updateSpy.mockRestore();
        });
    });

    describe('boss score bonuses', () => {
        it('should give correct bonus for alpha boss', () => {
            bossSystem.spawnBoss('alpha', 5);
            bossSystem.defeatBoss();

            expect(mockGameModel.score).toBe(5000);
        });

        it('should give correct bonus for beta boss', () => {
            bossSystem.spawnBoss('beta', 10);
            bossSystem.defeatBoss();

            expect(mockGameModel.score).toBe(10000);
        });

        it('should give correct bonus for gamma boss', () => {
            bossSystem.spawnBoss('gamma', 15);
            bossSystem.defeatBoss();

            expect(mockGameModel.score).toBe(7500);
        });

        it('should give correct bonus for delta boss', () => {
            bossSystem.spawnBoss('delta', 20);
            bossSystem.defeatBoss();

            expect(mockGameModel.score).toBe(15000);
        });
    });

    describe('edge cases', () => {
        it('should handle damage greater than current health', () => {
            bossSystem.spawnBoss('gamma', 15);
            bossSystem.damageBoss(10);

            expect(bossSystem.bossHealth).toBe(0);
        });

        it('should handle multiple small damages', () => {
            bossSystem.spawnBoss('alpha', 5);
            bossSystem.damageBoss(1);
            bossSystem.damageBoss(1);
            bossSystem.damageBoss(1);

            expect(bossSystem.bossHealth).toBe(0);
        });

        it('should handle phase transition on exact threshold', () => {
            bossSystem.spawnBoss('beta', 10);

            bossSystem.damageBoss(2);
            expect(bossSystem.bossPhase).toBe(2);
        });

        it('should handle reset during active battle', () => {
            bossSystem.spawnBoss('alpha', 5);
            bossSystem.reset();

            expect(bossSystem.isBossActive).toBe(false);
        });
    });

    describe('integration with GameModel', () => {
        it('should update gameModel score on boss defeat', () => {
            const initialScore = mockGameModel.score;
            bossSystem.spawnBoss('alpha', 5);
            bossSystem.damageBoss(3);

            expect(mockGameModel.score).toBe(initialScore + 5000);
        });

        it('should track time taken from boss spawn to defeat', () => {
            const emitSpy = jest.spyOn(gameEvents, 'emit');
            const nowSpy = jest.spyOn(Date, 'now');

            bossSystem.spawnBoss('alpha', 5);

            nowSpy.mockReturnValue(Date.now() + 5000);

            bossSystem.defeatBoss();

            const defeatCalls = emitSpy.mock.calls.filter(
                (call) => call[0] === GAME_EVENTS.BOSS_DEFEATED
            );
            expect(defeatCalls.length).toBeGreaterThan(0);
            expect(defeatCalls[0][1].timeTaken).toBeGreaterThan(0);

            nowSpy.mockRestore();
            emitSpy.mockRestore();
        });

        it('should handle multiple boss spawns sequentially', () => {
            bossSystem.spawnBoss('alpha', 5);
            bossSystem.damageBoss(3); // Defeat

            expect(bossSystem.isBossActive).toBe(false);

            // Spawn next boss
            const nextBoss = bossSystem.spawnBoss('beta', 10);

            expect(nextBoss).not.toBeNull();
            expect(bossSystem.bossType).toBe('beta');
            expect(bossSystem.isBossActive).toBe(true);
        });
    });

    describe('event emission verification', () => {
        let emitSpy;
        beforeEach(() => {
            emitSpy = jest.spyOn(gameEvents, 'emit');
        });
        afterEach(() => {
            emitSpy.mockRestore();
        });

        it('should emit correct boss type in events', () => {
            bossSystem.spawnBoss('gamma', 15);
            bossSystem.damageBoss(1);
            bossSystem.damageBoss(1); // Phase change

            const bossSpawnedCalls = emitSpy.mock.calls.filter(
                (call) => call[0] === GAME_EVENTS.BOSS_SPAWNED
            );
            const bossDamagedCalls = emitSpy.mock.calls.filter(
                (call) => call[0] === GAME_EVENTS.BOSS_DAMAGED
            );
            const phaseChangedCalls = emitSpy.mock.calls.filter(
                (call) => call[0] === GAME_EVENTS.BOSS_PHASE_CHANGED
            );

            expect(bossSpawnedCalls.length).toBeGreaterThan(0);
            expect(bossSpawnedCalls[0][1].bossType).toBe('gamma');
            expect(bossDamagedCalls.length).toBeGreaterThan(0);
            expect(bossDamagedCalls[0][1].bossType).toBe('gamma');
            expect(phaseChangedCalls.length).toBeGreaterThan(0);
            expect(phaseChangedCalls[0][1].bossType).toBe('gamma');

            emitSpy.mockRestore();
        });
    });
});
