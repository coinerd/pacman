import BossBattleSystem from '../../src/systems/BossBattleSystem.js';
import { GAME_EVENTS, gameEvents } from '../../src/core/EventBus.js';

// Mock gameConfig
jest.mock('../../src/config/gameConfig.js', () => ({
    bossConfig: {
        spawnLevels: [5, 10, 15],
        bossTypes: {
            alpha: {
                health: 100,
                scoreBonus: 5000,
                phaseTransitionHealth: [0.5, 0.25]
            },
            beta: {
                health: 150,
                scoreBonus: 7500,
                phaseTransitionHealth: [0.6, 0.3]
            },
            gamma: {
                health: 200,
                scoreBonus: 10000,
                phaseTransitionHealth: [0.7, 0.35]
            },
            delta: {
                health: 250,
                scoreBonus: 12500,
                phaseTransitionHealth: [0.8, 0.4]
            }
        }
    },
    virusCore: {
        entrance: { x: 13, y: 14 }
    }
}));

describe('BossBattleSystem', () => {
    let bossSystem;
    let eventHandler;

    beforeEach(() => {
        bossSystem = new BossBattleSystem();
        eventHandler = jest.fn();
        gameEvents.on(GAME_EVENTS.BOSS_SPAWNED, eventHandler);
        gameEvents.on(GAME_EVENTS.BOSS_DAMAGED, eventHandler);
        gameEvents.on(GAME_EVENTS.BOSS_DEFEATED, eventHandler);
        gameEvents.on(GAME_EVENTS.BOSS_PHASE_CHANGED, eventHandler);
    });

    afterEach(() => {
        gameEvents.off(GAME_EVENTS.BOSS_SPAWNED, eventHandler);
        gameEvents.off(GAME_EVENTS.BOSS_DAMAGED, eventHandler);
        gameEvents.off(GAME_EVENTS.BOSS_DEFEATED, eventHandler);
        gameEvents.off(GAME_EVENTS.BOSS_PHASE_CHANGED, eventHandler);
        bossSystem.reset();
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(bossSystem.currentBoss).toBeNull();
            expect(bossSystem.bossHealth).toBe(0);
            expect(bossSystem.bossMaxHealth).toBe(0);
            expect(bossSystem.bossPhase).toBe(1);
            expect(bossSystem.bossType).toBeNull();
            expect(bossSystem.isBossActive).toBe(false);
        });
    });

    describe('spawnBoss', () => {
        it('should spawn a boss successfully', () => {
            const boss = bossSystem.spawnBoss('alpha', 5);

            expect(boss).not.toBeNull();
            expect(boss.isBoss).toBe(true);
            expect(boss.bossType).toBe('alpha');
            expect(boss.health).toBe(100);
            expect(bossSystem.isBossActive).toBe(true);
            expect(bossSystem.bossHealth).toBe(100);
            expect(bossSystem.bossMaxHealth).toBe(100);
        });

        it('should not spawn boss if one is already active', () => {
            bossSystem.spawnBoss('alpha', 5);
            const boss2 = bossSystem.spawnBoss('beta', 10);

            expect(boss2).toBeNull();
            expect(bossSystem.bossType).toBe('alpha');
        });

        it('should return null for unknown boss type', () => {
            const boss = bossSystem.spawnBoss('unknown', 5);
            expect(boss).toBeNull();
        });

        it('should emit BOSS_SPAWNED event', () => {
            bossSystem.spawnBoss('alpha', 5);

            expect(eventHandler).toHaveBeenCalledWith({
                bossType: 'alpha',
                level: 5,
                position: { x: 13, y: 14 }
            });
        });
    });

    describe('createBossEntity', () => {
        it('should create boss entity with correct properties', () => {
            // Set bossMaxHealth first (normally done by spawnBoss)
            bossSystem.bossMaxHealth = 100;
            const boss = bossSystem.createBossEntity('alpha', 5);

            expect(boss.isBoss).toBe(true);
            expect(boss.bossType).toBe('alpha');
            expect(boss.gridX).toBe(13);
            expect(boss.gridY).toBe(14);
            expect(boss.health).toBe(100);
            expect(boss.phase).toBe(1);
            expect(boss.level).toBe(5);
            expect(boss.isFrightened).toBe(false);
            expect(boss.isEaten).toBe(false);
        });
    });

    describe('damageBoss', () => {
        it('should damage boss and return true', () => {
            bossSystem.spawnBoss('alpha', 5);
            const result = bossSystem.damageBoss(20);

            expect(result).toBe(true);
            expect(bossSystem.bossHealth).toBe(80);
        });

        it('should emit BOSS_DAMAGED event', () => {
            bossSystem.spawnBoss('alpha', 5);
            bossSystem.damageBoss(30);

            expect(eventHandler).toHaveBeenCalledWith(expect.objectContaining({
                bossType: 'alpha',
                currentHealth: 70,
                maxHealth: 100,
                damageAmount: 30
            }));
        });

        it('should not go below zero health', () => {
            bossSystem.spawnBoss('alpha', 5);
            bossSystem.damageBoss(200);

            expect(bossSystem.bossHealth).toBe(0);
        });

        it('should return false if no boss is active', () => {
            const result = bossSystem.damageBoss(20);
            expect(result).toBe(false);
        });

        it('should return false if boss health is already zero', () => {
            bossSystem.spawnBoss('alpha', 5);
            bossSystem.damageBoss(100);
            const result = bossSystem.damageBoss(10);

            expect(result).toBe(false);
        });
    });

    describe('shouldPhaseChange', () => {
        it('should return true when health drops below threshold', () => {
            bossSystem.spawnBoss('alpha', 5);
            // Damage to exactly 49% (below 50% threshold)
            bossSystem.bossHealth = 49;

            expect(bossSystem.shouldPhaseChange()).toBe(true);
        });

        it('should return false when health is above threshold', () => {
            bossSystem.spawnBoss('alpha', 5);
            bossSystem.damageBoss(10); // 90% health

            expect(bossSystem.shouldPhaseChange()).toBe(false);
        });

        it('should return false if no boss is active', () => {
            expect(bossSystem.shouldPhaseChange()).toBe(false);
        });
    });

    describe('nextPhase', () => {
        it('should increment boss phase', () => {
            bossSystem.spawnBoss('alpha', 5);
            bossSystem.nextPhase();

            expect(bossSystem.bossPhase).toBe(2);
            expect(bossSystem.currentBoss.phase).toBe(2);
        });

        it('should emit BOSS_PHASE_CHANGED event', () => {
            bossSystem.spawnBoss('alpha', 5);
            bossSystem.nextPhase();

            expect(eventHandler).toHaveBeenCalledWith({
                bossType: 'alpha',
                phase: 2,
                health: 100,
                maxHealth: 100
            });
        });

        it('should not exceed phase 3', () => {
            bossSystem.spawnBoss('alpha', 5);
            bossSystem.nextPhase();
            bossSystem.nextPhase();
            bossSystem.nextPhase(); // Try to go to phase 4

            expect(bossSystem.bossPhase).toBe(3);
        });
    });

    describe('defeatBoss', () => {
        it('should defeat boss and emit event', () => {
            bossSystem.spawnBoss('alpha', 5);
            bossSystem.defeatBoss();

            expect(bossSystem.isBossActive).toBe(false);
            expect(bossSystem.currentBoss).toBeNull();
            expect(eventHandler).toHaveBeenCalledWith(expect.objectContaining({
                bossType: 'alpha',
                scoreBonus: 5000
            }));
        });

        it('should do nothing if no boss is active', () => {
            bossSystem.defeatBoss();
            expect(eventHandler).not.toHaveBeenCalled();
        });
    });

    describe('update', () => {
        it('should not update if no boss is active', () => {
            bossSystem.update(16);
            expect(bossSystem.phaseTimer).toBe(0);
        });

        it('should update phase timer', () => {
            bossSystem.spawnBoss('alpha', 5);
            bossSystem.update(16);
            bossSystem.update(16);

            expect(bossSystem.phaseTimer).toBe(32);
        });

        it('should trigger phase change when health is low', () => {
            bossSystem.spawnBoss('alpha', 5);
            bossSystem.damageBoss(51);
            bossSystem.update(16);

            expect(bossSystem.bossPhase).toBe(2);
        });
    });

    describe('updateBossBehavior', () => {
        it('should update alpha boss behavior', () => {
            bossSystem.spawnBoss('alpha', 5);
            bossSystem.update(16);

            expect(bossSystem.currentBoss.speedMultiplier).toBe(1.0);
        });

        it('should update beta boss behavior', () => {
            bossSystem.spawnBoss('beta', 10);
            bossSystem.update(16);

            expect(bossSystem.currentBoss.speedMultiplier).toBe(1.0);
        });

        it('should update gamma boss behavior with variable speed', () => {
            bossSystem.spawnBoss('gamma', 15);
            bossSystem.update(16);

            expect(bossSystem.currentBoss.speedMultiplier).toBeGreaterThanOrEqual(0.5);
            expect(bossSystem.currentBoss.speedMultiplier).toBeLessThanOrEqual(1.5);
        });

        it('should update delta boss behavior', () => {
            bossSystem.spawnBoss('delta', 5);
            bossSystem.update(16);

            expect(bossSystem.currentBoss.speedMultiplier).toBe(0.8);
        });
    });

    describe('shouldSpawnBoss', () => {
        it('should return true for boss levels', () => {
            expect(bossSystem.shouldSpawnBoss(5)).toBe(true);
            expect(bossSystem.shouldSpawnBoss(10)).toBe(true);
            expect(bossSystem.shouldSpawnBoss(15)).toBe(true);
        });

        it('should return false for non-boss levels', () => {
            expect(bossSystem.shouldSpawnBoss(1)).toBe(false);
            expect(bossSystem.shouldSpawnBoss(7)).toBe(false);
        });
    });

    describe('getBossTypeForLevel', () => {
        it('should return correct boss type for level', () => {
            expect(bossSystem.getBossTypeForLevel(5)).toBe('alpha');
            expect(bossSystem.getBossTypeForLevel(10)).toBe('beta');
            expect(bossSystem.getBossTypeForLevel(15)).toBe('gamma');
        });

        it('should return null for non-boss level', () => {
            expect(bossSystem.getBossTypeForLevel(1)).toBeNull();
        });
    });

    describe('getters', () => {
        beforeEach(() => {
            bossSystem.spawnBoss('alpha', 5);
        });

        it('should return boss health', () => {
            expect(bossSystem.getBossHealth()).toBe(100);
        });

        it('should return boss max health', () => {
            expect(bossSystem.getBossMaxHealth()).toBe(100);
        });

        it('should return boss phase', () => {
            expect(bossSystem.getBossPhase()).toBe(1);
        });

        it('should return boss type', () => {
            expect(bossSystem.getBossType()).toBe('alpha');
        });

        it('should return if boss battle is active', () => {
            expect(bossSystem.isBossBattleActive()).toBe(true);
        });

        it('should return boss entity', () => {
            expect(bossSystem.getBossEntity()).toBe(bossSystem.currentBoss);
        });

        it('should return boss config', () => {
            const config = bossSystem.getBossConfig();
            expect(config.health).toBe(100);
            expect(config.scoreBonus).toBe(5000);
        });
    });

    describe('reset', () => {
        it('should reset all state', () => {
            bossSystem.spawnBoss('alpha', 5);
            bossSystem.damageBoss(30);
            bossSystem.nextPhase();

            bossSystem.reset();

            expect(bossSystem.currentBoss).toBeNull();
            expect(bossSystem.bossHealth).toBe(0);
            expect(bossSystem.bossMaxHealth).toBe(0);
            expect(bossSystem.bossPhase).toBe(1);
            expect(bossSystem.bossType).toBeNull();
            expect(bossSystem.isBossActive).toBe(false);
            expect(bossSystem.phaseTimer).toBe(0);
        });
    });

    describe('getSnapshot', () => {
        it('should return current state snapshot', () => {
            bossSystem.spawnBoss('alpha', 5);

            const snapshot = bossSystem.getSnapshot();

            expect(snapshot.isBossActive).toBe(true);
            expect(snapshot.bossType).toBe('alpha');
            expect(snapshot.bossHealth).toBe(100);
            expect(snapshot.bossMaxHealth).toBe(100);
            expect(snapshot.bossPhase).toBe(1);
            expect(snapshot.boss).toEqual(bossSystem.currentBoss);
        });

        it('should return empty snapshot when no boss', () => {
            const snapshot = bossSystem.getSnapshot();

            expect(snapshot.isBossActive).toBe(false);
            expect(snapshot.bossType).toBeNull();
            expect(snapshot.bossHealth).toBe(0);
        });
    });
});
