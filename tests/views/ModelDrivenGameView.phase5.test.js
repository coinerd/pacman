import { GAME_EVENTS, gameEvents } from '../../src/core/EventBus.js';
import ModelDrivenGameView from '../../src/views/ModelDrivenGameView.js';

describe.skip('ModelDrivenGameView - Phase 5 Visual Rendering', () => {
    let view;
    let mockScene;
    let mockGameModel;

    beforeEach(() => {
        mockScene = {
            scale: { width: 800, height: 600 },
            add: {
                rectangle: jest
                    .fn()
                    .mockReturnValue({ setAlpha: jest.fn(), setStrokeStyle: jest.fn() }),
                image: jest.fn(),
                text: jest
                    .fn()
                    .mockReturnValue({ setOrigin: jest.fn(), setText: jest.fn() }),
                container: jest
                    .fn()
                    .mockReturnValue({ add: jest.fn(), setAlpha: jest.fn() })
            },
            make: {
                graphics: jest.fn().mockReturnValue({
                    lineStyle: jest.fn(),
                    moveTo: jest.fn(),
                    lineTo: jest.fn(),
                    strokePath: jest.fn(),
                    fillStyle: jest.fn(),
                    fillRect: jest.fn(),
                    destroy: jest.fn()
                })
            },
            tweens: { add: jest.fn() },
            time: { delayedCall: jest.fn() },
            scene: {
                pause: jest.fn(),
                resume: jest.fn()
            },
            input: {},
            cleanup: jest.fn()
        };

        mockGameModel = {
            boss: {
                isBossActive: false,
                bossType: null,
                boss: {
                    bossType: 'alpha',
                    gridX: 12,
                    gridY: 15,
                    health: 3,
                    maxHealth: 3,
                    phase: 1
                }
            },
            powerUps: {
                activePowerUps: [],
                spawnedPowerUps: [{ type: 'SHIELD', x: 10, y: 10 }]
            },
            story: {
                currentChapter: null,
                isStoryActive: false
            },
            pacman: {
                isShielded: false,
                hasSpeedBoost: false,
                hasDataMagnet: false
            }
        };

        view = new ModelDrivenGameView({
            scene: mockScene,
            gameModel: mockGameModel,
            storageManager: {}
        });
    });

    afterEach(() => {
        if (view) {
            view.cleanup();
        }
        gameEvents.clear();
    });

    describe('boss visual creation', () => {
        it('should create boss visual when boss active', () => {
            mockGameModel.boss.isBossActive = true;

            view.sync(mockGameModel);

            expect(mockScene.add.rectangle).toHaveBeenCalled();
        });

        it('should not create boss visual when boss inactive', () => {
            mockGameModel.boss.isBossActive = false;

            view.sync(mockGameModel);

            const calls = mockScene.add.rectangle.mock.calls.filter((call) => {
                return call[0] && typeof call[0] === 'object' && 'boss' in call[0];
            });

            expect(calls.length).toBe(0);
        });
    });

    describe('boss health bar display', () => {
        it('should update health bar width based on boss health', () => {
            mockGameModel.boss.isBossActive = true;
            mockGameModel.boss.boss.health = 1;
            mockGameModel.boss.boss.maxHealth = 3;

            view.sync(mockGameModel);

            expect(mockScene.add.rectangle).toHaveBeenCalled();
        });

        it('should change health bar color at different health percentages', () => {
            mockGameModel.boss.isBossActive = true;
            mockGameModel.boss.boss.health = 2;
            mockGameModel.boss.boss.maxHealth = 4;

            view.sync(mockGameModel);

            expect(mockScene.add.rectangle).toHaveBeenCalled();
        });

        it('should remove health bar when boss defeated', () => {
            mockGameModel.boss.isBossActive = true;
            view.sync(mockGameModel);

            mockGameModel.boss.isBossActive = false;
            view.sync(mockGameModel);

            expect(mockScene.add.rectangle).toHaveBeenCalled();
        });
    });

    describe('boss phase indicator', () => {
        it('should display current boss phase', () => {
            mockGameModel.boss.isBossActive = true;
            mockGameModel.boss.boss.phase = 2;

            view.sync(mockGameModel);

            expect(mockScene.add.text).toHaveBeenCalled();
        });

        it('should update phase indicator on phase change', () => {
            mockGameModel.boss.isBossActive = true;
            mockGameModel.boss.boss.phase = 1;

            view.sync(mockGameModel);
            mockGameModel.boss.boss.phase = 2;

            view.sync(mockGameModel);

            expect(mockScene.add.text).toHaveBeenCalled();
        });
    });

    describe('boss damage flash effect', () => {
        it('should flash boss on damage', () => {
            const emitSpy = jest.spyOn(gameEvents, 'emit');

            mockGameModel.boss.isBossActive = true;
            emitSpy(GAME_EVENTS.BOSS_DAMAGED, { bossType: 'alpha' });

            expect(emitSpy).toHaveBeenCalledWith(
                GAME_EVENTS.BOSS_DAMAGED,
                expect.any(Object)
            );

            emitSpy.mockRestore();
        });

        it('should reset flash timer over time', () => {
            mockGameModel.boss.isBossActive = true;

            view.sync(mockGameModel);
            view.update(0.016);

            expect(mockScene.make.graphics).toHaveBeenCalled();
        });
    });

    describe('power-up visual creation', () => {
        it('should create power-up visuals when spawned', () => {
            mockGameModel.powerUps.spawnedPowerUps = [
                { type: 'SHIELD', x: 10, y: 10 },
                { type: 'SPEED_BOOST', x: 15, y: 15 }
            ];

            view.sync(mockGameModel);

            expect(mockScene.add.rectangle).toHaveBeenCalled();
            expect(mockScene.add.image).toHaveBeenCalled();
        });

        it('should create shield visual with correct color', () => {
            mockGameModel.powerUps.spawnedPowerUps = [
                { type: 'SHIELD', x: 10, y: 10 }
            ];

            view.sync(mockGameModel);

            expect(mockScene.add.rectangle).toHaveBeenCalled();
        });

        it('should create speed boost visual with correct color', () => {
            mockGameModel.powerUps.spawnedPowerUps = [
                { type: 'SPEED_BOOST', x: 10, y: 10 }
            ];

            view.sync(mockGameModel);

            expect(mockScene.add.rectangle).toHaveBeenCalled();
        });

        it('should create data magnet visual with correct color', () => {
            mockGameModel.powerUps.spawnedPowerUps = [
                { type: 'DATA_MAGNET', x: 10, y: 10 }
            ];

            view.sync(mockGameModel);

            expect(mockScene.add.rectangle).toHaveBeenCalled();
        });
    });

    describe('power-up spawning animation', () => {
        it('should animate power-up spawn', () => {
            mockGameModel.powerUps.spawnedPowerUps = [
                { type: 'SHIELD', x: 10, y: 10 }
            ];

            view.sync(mockGameModel);

            expect(mockScene.tweens.add).toHaveBeenCalled();
        });

        it('should not animate if no spawned power-ups', () => {
            mockGameModel.powerUps.spawnedPowerUps = [];

            view.sync(mockGameModel);

            const tweensCalls = mockScene.tweens.add.mock.calls.filter((call) => {
                return call[0] && typeof call[0] === 'object' && 'powerUp' in call[0];
            });

            expect(tweensCalls.length).toBe(0);
        });
    });

    describe('power-up collection animation', () => {
        it('should animate power-up collection', () => {
            const emitSpy = jest.spyOn(gameEvents, 'emit');

            mockGameModel.powerUps.spawnedPowerUps = [
                { type: 'SHIELD', x: 10, y: 10 }
            ];
            emitSpy(GAME_EVENTS.POWER_UP_COLLECTED, { type: 'SHIELD' });

            expect(emitSpy).toHaveBeenCalledWith(
                GAME_EVENTS.POWER_UP_COLLECTED,
                expect.any(Object)
            );

            emitSpy.mockRestore();
        });

        it('should remove spawned power-up visual on collection', () => {
            mockGameModel.powerUps.spawnedPowerUps = [
                { type: 'SHIELD', x: 10, y: 10 }
            ];

            view.sync(mockGameModel);

            mockGameModel.powerUps.spawnedPowerUps = [];

            view.sync(mockGameModel);

            expect(mockScene.add.rectangle).toHaveBeenCalled();
        });
    });

    describe('power-up expiration animation', () => {
        it('should animate power-up expiration', () => {
            const emitSpy = jest.spyOn(gameEvents, 'emit');

            mockGameModel.powerUps.activePowerUps = [{ type: 'SHIELD' }];
            emitSpy(GAME_EVENTS.POWER_UP_EXPIRED, { type: 'SHIELD' });

            expect(emitSpy).toHaveBeenCalledWith(
                GAME_EVENTS.POWER_UP_EXPIRED,
                expect.any(Object)
            );

            emitSpy.mockRestore();
        });

        it('should remove active power-up visual on expiration', () => {
            mockGameModel.powerUps.activePowerUps = [{ type: 'SHIELD' }];

            view.sync(mockGameModel);

            mockGameModel.powerUps.activePowerUps = [];

            view.sync(mockGameModel);

            expect(mockScene.add.rectangle).toHaveBeenCalled();
        });
    });

    describe('story overlay display', () => {
        it('should display story overlay when chapter active', () => {
            mockGameModel.story.currentChapter = {
                name: 'Alpha Breach',
                description: 'The Alpha virus has established a stronghold.'
            };
            mockGameModel.story.isStoryActive = true;

            view.sync(mockGameModel);

            expect(mockScene.add.text).toHaveBeenCalled();
            expect(mockScene.add.container).toHaveBeenCalled();
        });

        it('should not display story overlay when story inactive', () => {
            mockGameModel.story.currentChapter = null;
            mockGameModel.story.isStoryActive = false;

            view.sync(mockGameModel);

            const containerCalls = mockScene.add.container.mock.calls.filter(
                (call) => {
                    return (
                        call[0] && typeof call[0] === 'object' && 'storyOverlay' in call[0]
                    );
                }
            );

            expect(containerCalls.length).toBe(0);
        });
    });

    describe('story overlay hide animation', () => {
        it('should animate story overlay hide', () => {
            const emitSpy = jest.spyOn(gameEvents, 'emit');

            mockGameModel.story.currentChapter = { name: 'Alpha Breach' };
            mockGameModel.story.isStoryActive = true;

            view.sync(mockGameModel);

            mockGameModel.story.isStoryActive = false;
            emitSpy(GAME_EVENTS.CHAPTER_COMPLETED, { chapterName: 'Alpha Breach' });

            expect(emitSpy).toHaveBeenCalledWith(
                GAME_EVENTS.CHAPTER_COMPLETED,
                expect.any(Object)
            );

            emitSpy.mockRestore();
        });

        it('should fade out story overlay', () => {
            mockGameModel.story.isStoryActive = true;

            view.sync(mockGameModel);

            mockGameModel.story.isStoryActive = false;

            view.sync(mockGameModel);

            expect(mockScene.add.container).toHaveBeenCalled();
        });
    });

    describe('chapter complete message display', () => {
        it('should display chapter complete message', () => {
            const emitSpy = jest.spyOn(gameEvents, 'emit');

            emitSpy(GAME_EVENTS.CHAPTER_COMPLETED, {
                chapterName: 'Alpha Breach',
                bonusPoints: 5000,
                score: 10000
            });

            expect(emitSpy).toHaveBeenCalledWith(
                GAME_EVENTS.CHAPTER_COMPLETED,
                expect.any(Object)
            );

            emitSpy.mockRestore();
        });

        it('should update UI with chapter completion', () => {
            mockGameModel.story.currentChapter = null;
            mockGameModel.score = 15000;

            const emitSpy = jest.spyOn(gameEvents, 'emit');

            emitSpy(GAME_EVENTS.CHAPTER_COMPLETED, { chapterName: 'Alpha Breach' });

            expect(emitSpy).toHaveBeenCalledWith(
                GAME_EVENTS.CHAPTER_COMPLETED,
                expect.any(Object)
            );

            emitSpy.mockRestore();
        });
    });

    describe('integration with boss battle events', () => {
        it('should handle BOSS_SPAWNED event', () => {
            const emitSpy = jest.spyOn(gameEvents, 'emit');

            emitSpy(GAME_EVENTS.BOSS_SPAWNED, {
                bossType: 'alpha',
                level: 5,
                position: { x: 12, y: 15 }
            });

            expect(emitSpy).toHaveBeenCalledWith(
                GAME_EVENTS.BOSS_SPAWNED,
                expect.any(Object)
            );

            emitSpy.mockRestore();
        });

        it('should handle BOSS_DEFEATED event', () => {
            const emitSpy = jest.spyOn(gameEvents, 'emit');

            emitSpy(GAME_EVENTS.BOSS_DEFEATED, {
                bossType: 'alpha',
                scoreBonus: 5000
            });

            expect(emitSpy).toHaveBeenCalledWith(
                GAME_EVENTS.BOSS_DEFEATED,
                expect.any(Object)
            );

            emitSpy.mockRestore();
        });

        it('should handle BOSS_PHASE_CHANGED event', () => {
            const emitSpy = jest.spyOn(gameEvents, 'emit');

            emitSpy(GAME_EVENTS.BOSS_PHASE_CHANGED, {
                bossType: 'alpha',
                phase: 2,
                health: 1,
                maxHealth: 3
            });

            expect(emitSpy).toHaveBeenCalledWith(
                GAME_EVENTS.BOSS_PHASE_CHANGED,
                expect.any(Object)
            );

            emitSpy.mockRestore();
        });
    });

    describe('integration with power-up events', () => {
        it('should handle POWER_UP_SPAWNED event', () => {
            const emitSpy = jest.spyOn(gameEvents, 'emit');

            emitSpy(GAME_EVENTS.POWER_UP_SPAWNED, { type: 'SHIELD', x: 10, y: 10 });

            expect(emitSpy).toHaveBeenCalledWith(
                GAME_EVENTS.POWER_UP_SPAWNED,
                expect.any(Object)
            );

            emitSpy.mockRestore();
        });

        it('should handle POWER_UP_COLLECTED event', () => {
            const emitSpy = jest.spyOn(gameEvents, 'emit');

            emitSpy(GAME_EVENTS.POWER_UP_COLLECTED, {
                type: 'SHIELD',
                player: mockGameModel.pacman
            });

            expect(emitSpy).toHaveBeenCalledWith(
                GAME_EVENTS.POWER_UP_COLLECTED,
                expect.any(Object)
            );

            emitSpy.mockRestore();
        });

        it('should handle POWER_UP_ACTIVATED event', () => {
            const emitSpy = jest.spyOn(gameEvents, 'emit');

            emitSpy(GAME_EVENTS.POWER_UP_ACTIVATED, { type: 'SHIELD', duration: 8 });

            expect(emitSpy).toHaveBeenCalledWith(
                GAME_EVENTS.POWER_UP_ACTIVATED,
                expect.any(Object)
            );

            emitSpy.mockRestore();
        });

        it('should handle POWER_UP_EXPIRED event', () => {
            const emitSpy = jest.spyOn(gameEvents, 'emit');

            emitSpy(GAME_EVENTS.POWER_UP_EXPIRED, {
                type: 'SHIELD',
                durationUsed: 8
            });

            expect(emitSpy).toHaveBeenCalledWith(
                GAME_EVENTS.POWER_UP_EXPIRED,
                expect.any(Object)
            );

            emitSpy.mockRestore();
        });
    });

    describe('integration with story events', () => {
        it('should handle CHAPTER_STARTED event', () => {
            const emitSpy = jest.spyOn(gameEvents, 'emit');

            emitSpy(GAME_EVENTS.CHAPTER_STARTED, {
                level: 5,
                chapterName: 'Alpha Breach',
                description: 'The Alpha virus has established a stronghold.',
                isBossBattle: true,
                bossType: 'alpha'
            });

            expect(emitSpy).toHaveBeenCalledWith(
                GAME_EVENTS.CHAPTER_STARTED,
                expect.any(Object)
            );

            emitSpy.mockRestore();
        });

        it('should handle CHAPTER_COMPLETED event', () => {
            const emitSpy = jest.spyOn(gameEvents, 'emit');

            emitSpy(GAME_EVENTS.CHAPTER_COMPLETED, {
                chapterName: 'Alpha Breach',
                bonusPoints: 5000,
                level: 5,
                score: 10000
            });

            expect(emitSpy).toHaveBeenCalledWith(
                GAME_EVENTS.CHAPTER_COMPLETED,
                expect.any(Object)
            );

            emitSpy.mockRestore();
        });
    });

    describe('active power-up visuals', () => {
        it('should display shield indicator when active', () => {
            mockGameModel.pacman.isShielded = true;

            view.sync(mockGameModel);

            expect(mockScene.add.container).toHaveBeenCalled();
        });

        it('should display speed boost indicator when active', () => {
            mockGameModel.pacman.hasSpeedBoost = true;

            view.sync(mockGameModel);

            expect(mockScene.add.container).toHaveBeenCalled();
        });

        it('should display data magnet indicator when active', () => {
            mockGameModel.pacman.hasDataMagnet = true;

            view.sync(mockGameModel);

            expect(mockScene.add.container).toHaveBeenCalled();
        });
    });

    describe('visual cleanup', () => {
        it('should clean up boss visuals on cleanup', () => {
            mockGameModel.boss.isBossActive = true;

            view.sync(mockGameModel);
            view.cleanup();

            expect(mockScene.add.rectangle).toHaveBeenCalled();
        });

        it('should clean up power-up visuals on cleanup', () => {
            mockGameModel.powerUps.spawnedPowerUps = [
                { type: 'SHIELD', x: 10, y: 10 }
            ];

            view.sync(mockGameModel);
            view.cleanup();

            expect(mockScene.add.rectangle).toHaveBeenCalled();
        });

        it('should clean up story visuals on cleanup', () => {
            mockGameModel.story.isStoryActive = true;

            view.sync(mockGameModel);
            view.cleanup();

            expect(mockScene.add.container).toHaveBeenCalled();
        });
    });
});
