// Mock Phaser and Enemy before importing BossEntity
jest.mock('../../src/entities/Enemy.js', () => {
    return {
        __esModule: true,
        default: class MockEnemy {
            constructor(scene, x, y, type, color) {
                this.scene = scene;
                this.x = x;
                this.y = y;
                this.prevX = x;
                this.prevY = y;
                this.gridX = x;
                this.gridY = y;
                this.prevGridX = x;
                this.prevGridY = y;
                this.type = type;
                this.color = color;
                this.radius = 8;
                this.baseSpeed = 100;
                this.speedMultiplier = 1.0;
                this.speedModifier = 1.0;
                this.nextDirection = { x: 0, y: 0, angle: 0 };
                this.direction = { x: 0, y: 0, angle: 0 };
                this.mode = 'PATROL';
                this.targetX = 0;
                this.targetY = 0;
                this.isEaten = false;
                this.isFrightened = false;
                this.frightenedTimer = 0;
                this.isBlinking = false;
                this.blinkTimer = 0;
                this.houseTimer = 0;
                this.inGhostHouse = false;
                this.depth = 100;
                this.visible = true;
            }
            updateVisuals() {}
            update(deltaSeconds, maze, pacman) {
                this.prevX = this.x;
                this.prevY = this.y;
            }
            destroy() {}
        }
    };
});

// Mock Phaser module before importing BossEntity

jest.mock('phaser', () => {
    const mockGameObjects = {
        Rectangle: jest
            .fn()
            .mockImplementation((scene, x, y, width, height, color) => ({
                x,
                y,
                width,
                height,
                color,
                setDepth: jest.fn().mockReturnThis(),
                setOrigin: jest.fn().mockReturnThis(),
                setStrokeStyle: jest.fn().mockReturnThis(),
                setFillStyle: jest.fn().mockReturnThis(),
                setWidth: jest.fn().mockReturnThis(),
                destroy: jest.fn()
            })),
        Text: jest.fn().mockImplementation((scene, x, y, text, style) => ({
            x,
            y,
            text,
            style,
            setDepth: jest.fn().mockReturnThis(),
            setOrigin: jest.fn().mockReturnThis(),
            setText: jest.fn().mockReturnThis(),
            destroy: jest.fn()
        })),
        Polygon: jest.fn().mockImplementation((scene, x, y, points, color) => ({
            x,
            y,
            points,
            color,
            setDepth: jest.fn().mockReturnThis(),
            setFillStyle: jest.fn().mockReturnThis(),
            setRotation: jest.fn().mockReturnThis(),
            destroy: jest.fn()
        })),
        Arc: jest
            .fn()
            .mockImplementation(
                (
                    scene,
                    x,
                    y,
                    radius,
                    startAngle,
                    endAngle,
                    anticlockwise,
                    color,
                    alpha
                ) => ({
                    x,
                    y,
                    radius,
                    startAngle,
                    endAngle,
                    anticlockwise,
                    color,
                    alpha,
                    setDepth: jest.fn().mockReturnThis(),
                    setScale: jest.fn().mockReturnThis(),
                    setPosition: jest.fn().mockReturnThis(),
                    destroy: jest.fn()
                })
            ),
        Graphics: jest.fn().mockImplementation((scene) => ({
            scene,
            setDepth: jest.fn().mockReturnThis(),
            lineStyle: jest.fn().mockReturnThis(),
            strokeCircle: jest.fn().mockReturnThis(),
            clear: jest.fn().mockReturnThis(),
            destroy: jest.fn()
        }))
    };

    return {
        GameObjects: mockGameObjects
    };
});

import { bossConfig, enemyColors } from '../../src/config/gameConfig.js';
import { GAME_EVENTS, gameEvents } from '../../src/core/EventBus.js';
import BossEntity from '../../src/entities/BossEntity.js';

describe('BossEntity', () => {
    let mockScene;
    let bossEntity;
    let mockOnCallbacks;

    beforeEach(() => {
        // Clear mock call counts
        jest.clearAllMocks();

        mockOnCallbacks = [];

        mockScene = {
            add: {
                existing: jest.fn((obj) => obj)
            },
            time: {
                delayedCall: jest.fn()
            },
            on: jest.fn((event, callback, context) => {
                mockOnCallbacks.push({ event, callback, context });
                return () => {
                    // Unsubscribe callback
                };
            })
        };

        // Mock gameEvents.on
        jest
            .spyOn(gameEvents, 'on')
            .mockImplementation((event, callback, context) => {
                mockOnCallbacks.push({ event, callback, context });
                return () => {
                    // Unsubscribe callback
                };
            });
    });

    afterEach(() => {
        if (bossEntity) {
            bossEntity.destroy();
        }
        // Restore gameEvents.on mock
        if (gameEvents.on.mockRestore) {
            gameEvents.on.mockRestore();
        }
    });

    describe('constructor', () => {
        it('should initialize with correct boss type', () => {
            bossEntity = new BossEntity(mockScene, 240, 300, 'alpha', 0x9b59b6);

            expect(bossEntity.bossType).toBe('alpha');
        });

        it('should initialize health from config', () => {
            bossEntity = new BossEntity(mockScene, 240, 300, 'beta', 0x7fff00);

            expect(bossEntity.maxHealth).toBe(4);
            expect(bossEntity.health).toBe(4);
        });

        it('should initialize phase to 1', () => {
            bossEntity = new BossEntity(mockScene, 240, 300, 'gamma', 0xff4444);

            expect(bossEntity.currentPhase).toBe(1);
        });

        it('should initialize damage flash timer to 0', () => {
            bossEntity = new BossEntity(mockScene, 240, 300, 'delta', 0xffa500);

            expect(bossEntity.damageFlashTimer).toBe(0);
        });

        it('should store boss config', () => {
            bossEntity = new BossEntity(mockScene, 240, 300, 'alpha', 0x9b59b6);

            expect(bossEntity.bossConfig).toEqual(bossConfig.bossTypes.alpha);
        });
    });

    describe('getSizeMultiplier', () => {
        it('should return 1.5 for alpha boss', () => {
            expect(BossEntity.getSizeMultiplier('alpha')).toBe(1.5);
        });

        it('should return 1.3 for beta boss', () => {
            expect(BossEntity.getSizeMultiplier('beta')).toBe(1.3);
        });

        it('should return 1.4 for gamma boss', () => {
            expect(BossEntity.getSizeMultiplier('gamma')).toBe(1.4);
        });

        it('should return 1.6 for delta boss', () => {
            expect(BossEntity.getSizeMultiplier('delta')).toBe(1.6);
        });

        it('should return 1.0 for unknown boss type', () => {
            expect(BossEntity.getSizeMultiplier('unknown')).toBe(1.0);
        });
    });

    describe('health bar', () => {
        it('should create health bar visuals', () => {
            bossEntity = new BossEntity(mockScene, 240, 300, 'alpha', 0x9b59b6);

            expect(bossEntity.healthBar).toBeDefined();
            expect(bossEntity.healthBarBg).toBeDefined();
            expect(bossEntity.healthBar.width).toBe(60);
            expect(bossEntity.healthBar.height).toBe(6);
        });

        it('should update health bar width based on health percentage', () => {
            bossEntity = new BossEntity(mockScene, 240, 300, 'alpha', 0x9b59b6);
            bossEntity.health = 1; // 1/3 health

            bossEntity.updateHealthBar();

            const healthBar = bossEntity.healthBar;
            if (healthBar) {
                expect(healthBar.width).toBe(20); // 60 * (1/3)
            }
        });

        it('should change health bar color at 50% health', () => {
            bossEntity = new BossEntity(mockScene, 240, 300, 'alpha', 0x9b59b6);
            bossEntity.health = 2; // 2/4 = 50% (for beta)
            bossEntity.maxHealth = 4;

            bossEntity.updateHealthBar();

            const healthBar = bossEntity.healthBar;
            if (healthBar) {
                expect(healthBar.setFillStyle).toHaveBeenCalledWith(
                    expect.any(Number),
                    1
                );
            }
        });

        it('should change health bar color at 25% health', () => {
            bossEntity = new BossEntity(mockScene, 240, 300, 'beta', 0x7fff00);
            bossEntity.health = 1; // 1/4 = 25%
            bossEntity.maxHealth = 4;

            bossEntity.updateHealthBar();

            const healthBar = bossEntity.healthBar;
            if (healthBar) {
                expect(healthBar.setFillStyle).toHaveBeenCalledWith(
                    expect.any(Number),
                    1
                );
            }
        });

        it('should change health bar color below 25% health', () => {
            bossEntity = new BossEntity(mockScene, 240, 300, 'beta', 0x7fff00);
            bossEntity.health = 0; // 0/4 = 0%
            bossEntity.maxHealth = 4;

            bossEntity.updateHealthBar();

            const healthBar = bossEntity.healthBar;
            if (healthBar) {
                expect(healthBar.setFillStyle).toHaveBeenCalledWith(0xff0000, 1);
            }
        });
    });

    describe('phase indicator', () => {
        it('should create phase indicator text', () => {
            bossEntity = new BossEntity(mockScene, 240, 300, 'alpha', 0x9b59b6);

            expect(bossEntity.phaseIndicator).toBeDefined();
            expect(bossEntity.phaseIndicator.text).toBe('P1');
        });

        it('should update phase indicator text', () => {
            bossEntity = new BossEntity(mockScene, 240, 300, 'alpha', 0x9b59b6);
            bossEntity.currentPhase = 2;

            bossEntity.updatePhaseIndicator();

            expect(bossEntity.phaseIndicator.setText).toHaveBeenCalledWith('P2');
        });
    });

    describe('damage flash', () => {
        it('should set damage flash timer on damage', () => {
            bossEntity = new BossEntity(mockScene, 240, 300, 'alpha', 0x9b59b6);

            bossEntity.onDamage();

            expect(bossEntity.damageFlashTimer).toBe(0.1);
        });

        it('should decrease damage flash timer over time', () => {
            bossEntity = new BossEntity(mockScene, 240, 300, 'alpha', 0x9b59b6);
            bossEntity.damageFlashTimer = 0.1;

            bossEntity.update(0.05, [], null);

            expect(bossEntity.damageFlashTimer).toBe(0.05);
        });

        it('should reset damage flash timer when reaches zero', () => {
            bossEntity = new BossEntity(mockScene, 240, 300, 'alpha', 0x9b59b6);
            bossEntity.damageFlashTimer = 0.1;

            bossEntity.update(0.1, [], null);

            expect(bossEntity.damageFlashTimer).toBe(0);
        });
    });

    describe('takeDamage', () => {
        it('should reduce boss health', () => {
            bossEntity = new BossEntity(mockScene, 240, 300, 'alpha', 0x9b59b6);
            const initialHealth = bossEntity.health;

            bossEntity.takeDamage(1);

            expect(bossEntity.health).toBe(initialHealth - 1);
        });

        it('should not reduce health below zero', () => {
            bossEntity = new BossEntity(mockScene, 240, 300, 'alpha', 0x9b59b6);

            bossEntity.takeDamage(10);

            expect(bossEntity.health).toBe(0);
        });

        it('should not take damage if health is already zero', () => {
            bossEntity = new BossEntity(mockScene, 240, 300, 'alpha', 0x9b59b6);
            bossEntity.health = 0;
            bossEntity.takeDamage(1);

            expect(bossEntity.health).toBe(0);
        });
    });

    describe('updatePhase', () => {
        it('should update current phase', () => {
            bossEntity = new BossEntity(mockScene, 240, 300, 'alpha', 0x9b59b6);

            bossEntity.updatePhase(3);

            expect(bossEntity.currentPhase).toBe(3);
        });

        it('should update phase indicator text', () => {
            bossEntity = new BossEntity(mockScene, 240, 300, 'alpha', 0x9b59b6);

            bossEntity.updatePhase(2);

            expect(bossEntity.phaseIndicator.setText).toHaveBeenCalledWith('P2');
        });

        it('should update boss visuals for new phase', () => {
            bossEntity = new BossEntity(mockScene, 240, 300, 'alpha', 0x9b59b6);
            bossEntity.currentPhase = 1;

            bossEntity.updatePhase(2);

            expect(bossEntity.currentPhase).toBe(2);
        });
    });

    describe('boss shape', () => {
        it('should create polygon for alpha boss', () => {
            bossEntity = new BossEntity(mockScene, 240, 300, 'alpha', 0x9b59b6);

            expect(bossEntity.bossPolygon).toBeDefined();
            expect(bossEntity.bossPolygon.x).toBe(240);
            expect(bossEntity.bossPolygon.y).toBe(300);
        });

        it('should create polygon for beta boss', () => {
            bossEntity = new BossEntity(mockScene, 240, 300, 'beta', 0x7fff00);

            expect(bossEntity.bossPolygon).toBeDefined();
        });

        it('should create polygon for gamma boss', () => {
            bossEntity = new BossEntity(mockScene, 240, 300, 'gamma', 0xff4444);

            expect(bossEntity.bossPolygon).toBeDefined();
        });

        it('should create polygon for delta boss', () => {
            bossEntity = new BossEntity(mockScene, 240, 300, 'delta', 0xffa500);

            expect(bossEntity.bossPolygon).toBeDefined();
        });
    });

    describe('boss-specific visuals', () => {
        it('should create extra eyes for delta boss', () => {
            bossEntity = new BossEntity(mockScene, 240, 300, 'delta', 0xffa500);

            expect(bossEntity.extraEyes).toBeDefined();
            expect(bossEntity.extraEyes.length).toBe(4); // 2 eyes + 2 pupils
        });

        it('should create glow border for alpha boss in phase 2', () => {
            bossEntity = new BossEntity(mockScene, 240, 300, 'alpha', 0x9b59b6);
            bossEntity.currentPhase = 2;
            bossEntity.updateAlphaVisuals();

            expect(bossEntity.glowBorder).not.toBeNull();
        });

        it('should remove glow border for alpha boss in phase 1', () => {
            bossEntity = new BossEntity(mockScene, 240, 300, 'alpha', 0x9b59b6);
            bossEntity.currentPhase = 2;
            bossEntity.updateAlphaVisuals();

            expect(bossEntity.glowBorder).not.toBeNull();
            bossEntity.currentPhase = 1;
            bossEntity.updateAlphaVisuals();

            expect(bossEntity.glowBorder).toBeNull();
        });
    });

    describe('getBossColor', () => {
        it('should return boss color', () => {
            bossEntity = new BossEntity(mockScene, 240, 300, 'alpha', 0x9b59b6);

            expect(bossEntity.getBossColor()).toBe(0x9b59b6);
        });
    });

    describe('getBossShape', () => {
        it('should return boss type', () => {
            bossEntity = new BossEntity(mockScene, 240, 300, 'gamma', 0xff4444);

            expect(bossEntity.getBossShape()).toBe('gamma');
        });
    });

    describe('destroy', () => {
        it('should destroy all boss visual objects', () => {
            bossEntity = new BossEntity(mockScene, 240, 300, 'delta', 0xffa500);
            bossEntity.destroy();

            expect(bossEntity.bossPolygon.destroy).toHaveBeenCalled();
            if (bossEntity.healthBar) {
                expect(bossEntity.healthBar.destroy).toHaveBeenCalled();
            }
            if (bossEntity.healthBarBg) {
                expect(bossEntity.healthBarBg.destroy).toHaveBeenCalled();
            }
            if (bossEntity.phaseIndicator) {
                expect(bossEntity.phaseIndicator.destroy).toHaveBeenCalled();
            }
            if (bossEntity.glowBorder) {
                expect(bossEntity.glowBorder.destroy).toHaveBeenCalled();
            }
            bossEntity.extraEyes.forEach((eye) => {
                expect(eye.destroy).toHaveBeenCalled();
            });
        });
    });

    describe('event listeners', () => {
        it('should subscribe to BOSS_PHASE_CHANGED event', () => {
            bossEntity = new BossEntity(mockScene, 240, 300, 'alpha', 0x9b59b6);

            expect(gameEvents.on).toHaveBeenCalledWith(
                GAME_EVENTS.BOSS_PHASE_CHANGED,
                expect.any(Function),
                bossEntity
            );
        });

        it('should subscribe to BOSS_DAMAGED event', () => {
            bossEntity = new BossEntity(mockScene, 240, 300, 'alpha', 0x9b59b6);

            expect(gameEvents.on).toHaveBeenCalledWith(
                GAME_EVENTS.BOSS_DAMAGED,
                expect.any(Function),
                bossEntity
            );
        });

        it('should update phase when BOSS_PHASE_CHANGED event fired', () => {
            bossEntity = new BossEntity(mockScene, 240, 300, 'alpha', 0x9b59b6);

            const phaseChangedCallback = mockOnCallbacks.find(
                (cb) => cb.event === GAME_EVENTS.BOSS_PHASE_CHANGED
            );

            if (phaseChangedCallback && phaseChangedCallback.callback) {
                phaseChangedCallback.callback({ bossType: 'alpha', phase: 3 });
            }

            expect(bossEntity.currentPhase).toBe(3);
        });

        it('should trigger damage flash when BOSS_DAMAGED event fired', () => {
            bossEntity = new BossEntity(mockScene, 240, 300, 'alpha', 0x9b59b6);

            const damagedCallback = mockOnCallbacks.find(
                (cb) => cb.event === GAME_EVENTS.BOSS_DAMAGED
            );

            if (damagedCallback && damagedCallback.callback) {
                damagedCallback.callback({ bossType: 'alpha' });
            }

            expect(bossEntity.damageFlashTimer).toBe(0.1);
        });
    });

    describe('integration with BossBattleSystem', () => {
        it('should sync health from boss entity', () => {
            bossEntity = new BossEntity(mockScene, 240, 300, 'alpha', 0x9b59b6);
            bossEntity.takeDamage(1);

            expect(bossEntity.health).toBe(2);
        });

        it('should reflect phase changes from system', () => {
            bossEntity = new BossEntity(mockScene, 240, 300, 'beta', 0x7fff00);
            bossEntity.updatePhase(2);

            expect(bossEntity.currentPhase).toBe(2);
            expect(bossEntity.phaseIndicator.setText).toHaveBeenCalledWith('P2');
        });
    });
});
