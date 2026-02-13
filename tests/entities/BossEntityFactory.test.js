jest.mock('../../src/entities/BossEntity.js', () => {
    const MockBossEntity = function (scene, x, y, bossType, color) {
        this.bossType = bossType;
        this.color = color;
        this.maxHealth = 3;
        this.currentPhase = 1;
        this.health = 3;
        this.phaseIndicator = { text: 'P1' };
        this.healthBar = { width: 60, fillColor: 0x00ff00 };
        this.bossPolygon = {};
        this.extraEyes = [];
        this.glowBorder = null;
        this.damageFlashTimer = 0;
        this.speedMultiplier = 1.0;
        this.updateBossVisualsForPhase = jest.fn();
        this.updatePhaseIndicator = jest.fn();
        this.updateHealthBar = jest.fn();
        this.destroy = jest.fn();
    };
    MockBossEntity.prototype = {};
    return { __esModule: true, default: MockBossEntity };
});

import { bossConfig, enemyColors } from '../../src/config/gameConfig.js';
import BossEntityFactory from '../../src/entities/BossEntityFactory.js';

const mockScene = {
    add: {
        existing: jest.fn()
    }
};

describe('BossEntityFactory', () => {
    describe('create', () => {
        let boss;

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('should create alpha boss', () => {
            boss = BossEntityFactory.create(mockScene, 'alpha');

            expect(boss).toBeTruthy();
            expect(boss.bossType).toBe('alpha');
            expect(boss.color).toBe(enemyColors.ALPHA);
            expect(boss.maxHealth).toBe(3);
            expect(boss.currentPhase).toBe(1);
        });

        it('should create beta boss', () => {
            boss = BossEntityFactory.create(mockScene, 'beta');

            expect(boss).toBeTruthy();
            expect(boss.bossType).toBe('beta');
            expect(boss.color).toBe(enemyColors.BETA);
            expect(boss.maxHealth).toBe(4);
        });

        it('should create gamma boss', () => {
            boss = BossEntityFactory.create(mockScene, 'gamma');

            expect(boss).toBeTruthy();
            expect(boss.bossType).toBe('gamma');
            expect(boss.color).toBe(enemyColors.GAMMA);
            expect(boss.maxHealth).toBe(2);
        });

        it('should create delta boss', () => {
            boss = BossEntityFactory.create(mockScene, 'delta');

            expect(boss).toBeTruthy();
            expect(boss.bossType).toBe('delta');
            expect(boss.color).toBe(enemyColors.DELTA);
            expect(boss.maxHealth).toBe(5);
        });

        it('should return null for unknown boss type', () => {
            boss = BossEntityFactory.create(mockScene, 'unknown');

            expect(boss).toBeNull();
        });
    });

    describe('getAvailableBossTypes', () => {
        it('should return all boss types', () => {
            const types = BossEntityFactory.getAvailableBossTypes();

            expect(types).toEqual(['alpha', 'beta', 'gamma', 'delta']);
        });
    });

    describe('getBossConfig', () => {
        it('should return alpha config', () => {
            const config = BossEntityFactory.getBossConfig('alpha');

            expect(config).toBe(bossConfig.bossTypes.alpha);
        });

        it('should return beta config', () => {
            const config = BossEntityFactory.getBossConfig('beta');

            expect(config).toBe(bossConfig.bossTypes.beta);
        });

        it('should return gamma config', () => {
            const config = BossEntityFactory.getBossConfig('gamma');

            expect(config).toBe(bossConfig.bossTypes.gamma);
        });

        it('should return delta config', () => {
            const config = BossEntityFactory.getBossConfig('delta');

            expect(config).toBe(bossConfig.bossTypes.delta);
        });
    });

    describe('getBossColor', () => {
        it('should return alpha color', () => {
            const color = BossEntityFactory.getBossColor('alpha');

            expect(color).toBe(enemyColors.ALPHA);
        });

        it('should return beta color', () => {
            const color = BossEntityFactory.getBossColor('beta');

            expect(color).toBe(enemyColors.BETA);
        });

        it('should return gamma color', () => {
            const color = BossEntityFactory.getBossColor('gamma');

            expect(color).toBe(enemyColors.GAMMA);
        });

        it('should return delta color', () => {
            const color = BossEntityFactory.getBossColor('delta');

            expect(color).toBe(enemyColors.DELTA);
        });
    });
});
