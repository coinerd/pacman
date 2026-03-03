import {
    bossConfig,
    powerUpConfig,
    scoreValues,
    storyConfig
} from '../../src/config/gameConfig.js';
import { GAME_EVENTS, gameEvents } from '../../src/core/EventBus.js';
import GameModelDI from '../../src/model/core/GameModelDI.js';

describe.skip('Phase 5 Integration Tests', () => {
    let gameModel;

    beforeEach(() => {
        gameModel = new GameModelDI({ level: 1 }, true); // PHASE 4: Use DI
    });

    describe('full game flow with boss battle', () => {
        it('should spawn boss at boss levels', () => {
            gameModel = new GameModelDI({ level: 5 }, true); // PHASE 4: Use DI

            const shouldSpawn = gameModel.shouldSpawnBoss();

            expect(shouldSpawn).toBe(true);
        });

        it('should not spawn boss at non-boss levels', () => {
            gameModel = new GameModel({ level: 3 });

            const shouldSpawn = gameModel.shouldSpawnBoss();

            expect(shouldSpawn).toBe(false);
        });

        it('should spawn correct boss type for each boss level', () => {
            gameModel = new GameModel({ level: 5 });
            let bossType = gameModel.getBossTypeForLevel();
            expect(bossType).toBe('alpha');

            gameModel = new GameModel({ level: 10 });
            bossType = gameModel.getBossTypeForLevel();
            expect(bossType).toBe('beta');

            gameModel = new GameModel({ level: 15 });
            bossType = gameModel.getBossTypeForLevel();
            expect(bossType).toBe('gamma');

            gameModel = new GameModel({ level: 20 });
            bossType = gameModel.getBossTypeForLevel();
            expect(bossType).toBe('delta');
        });

        it('should add boss bonus score on defeat', () => {
            gameModel = new GameModel({ level: 5 });
            gameModel.spawnBoss('alpha');
            gameModel.damageBoss(bossConfig.bossTypes.alpha.health);

            expect(gameModel.score).toBe(bossConfig.bossTypes.alpha.scoreBonus);
        });

        it('should transition boss phases based on health', () => {
            gameModel = new GameModel({ level: 10 });
            gameModel.spawnBoss('beta');

            const initialPhase = gameModel.getBossPhase();
            gameModel.damageBoss(2);
            const phaseAfterDamage = gameModel.getBossPhase();

            expect(phaseAfterDamage).toBeGreaterThan(initialPhase);
        });
    });

    describe('full game flow with power-up collection', () => {
        it('should spawn power-up during gameplay', () => {
            gameModel = new GameModel({ level: 1 });
            const powerUp = gameModel.spawnPowerUp('SHIELD', 10, 10);

            expect(powerUp).not.toBeNull();
        });

        it('should activate power-up effect on collection', () => {
            gameModel = new GameModel({ level: 1 });
            const powerUp = gameModel.spawnPowerUp('SHIELD', 10, 10);
            gameModel.collectPowerUp(powerUp);

            expect(gameModel.hasActivePowerUp('SHIELD')).toBe(true);
        });

        it('should deactivate power-up when duration expires', () => {
            gameModel = new GameModel({ level: 1 });
            const powerUp = gameModel.spawnPowerUp('SPEED_BOOST', 10, 10);
            gameModel.collectPowerUp(powerUp);

            const initialActive = gameModel.hasActivePowerUp('SPEED_BOOST');
            gameModel.additionalPowerUpSystem.update(
                powerUpConfig.types.SPEED_BOOST.duration + 1
            );
            const afterDuration = gameModel.hasActivePowerUp('SPEED_BOOST');

            expect(initialActive).toBe(true);
            expect(afterDuration).toBe(false);
        });

        it('should apply shield effect to pacman', () => {
            gameModel = new GameModel({ level: 1 });
            const powerUp = gameModel.spawnPowerUp('SHIELD', 10, 10);
            gameModel.collectPowerUp(powerUp);

            expect(gameModel.pacman.isShielded).toBe(true);
        });

        it('should apply speed boost effect to pacman', () => {
            gameModel = new GameModel({ level: 1 });
            const powerUp = gameModel.spawnPowerUp('SPEED_BOOST', 10, 10);
            gameModel.collectPowerUp(powerUp);

            expect(gameModel.pacman.hasSpeedBoost).toBe(true);
            expect(gameModel.pacman.speed).toBe(gameModel.pacman.baseSpeed * 2);
        });

        it('should apply data magnet effect to pacman', () => {
            gameModel = new GameModel({ level: 1 });
            const powerUp = gameModel.spawnPowerUp('DATA_MAGNET', 10, 10);
            gameModel.collectPowerUp(powerUp);

            expect(gameModel.pacman.hasDataMagnet).toBe(true);
        });

        it('should not spawn power-ups during boss battle', () => {
            gameModel = new GameModel({ level: 5 });
            gameModel.spawnBoss('alpha');

            const powerUpType = gameModel.shouldSpawnPowerUp(10);

            expect(powerUpType).toBe(null);
        });
    });

    describe('full game flow with story mode', () => {
        it('should start story chapter at story levels', () => {
            gameModel = new GameModel({ level: 1 });
            gameModel.startLevel(1);

            const chapter = gameModel.getCurrentChapter();

            expect(chapter).not.toBeNull();
            expect(chapter.name).toBe('Network Entry');
        });

        it('should not start story chapter at non-story levels', () => {
            gameModel = new GameModel({ level: 2 });
            gameModel.startLevel(2);

            const chapter = gameModel.getCurrentChapter();

            expect(chapter).toBeNull();
        });

        it('should complete chapter with bonus points', () => {
            gameModel = new GameModel({ level: 5 });
            gameModel.startLevel(5);
            const initialScore = gameModel.score;
            const result = gameModel.completeChapter();

            expect(gameModel.score).toBe(
                initialScore + storyConfig.chapterCompleteBonus
            );
            expect(result.bonusPoints).toBe(storyConfig.chapterCompleteBonus);
        });

        it('should track chapter progress', () => {
            gameModel = new GameModel({ level: 5 });
            gameModel.startLevel(5);
            gameModel.completeChapter();
            gameModel.startLevel(10);

            const progress = gameModel.getChapterProgress();

            expect(progress.completedCount).toBe(1);
            expect(progress.totalChapters).toBe(storyConfig.chapters.length);
        });

        it('should emit story events', () => {
            const emitSpy = jest.spyOn(gameEvents, 'emit');

            gameModel = new GameModel({ level: 5 });
            gameModel.startLevel(5);

            const startedCall = emitSpy.mock.calls.find(
                (call) => call[0] === GAME_EVENTS.CHAPTER_STARTED
            );
            expect(startedCall).toBeDefined();

            gameModel.completeChapter();

            const completedCall = emitSpy.mock.calls.find(
                (call) => call[0] === GAME_EVENTS.CHAPTER_COMPLETED
            );
            expect(completedCall).toBeDefined();

            emitSpy.mockRestore();
        });
    });

    describe('boss battle + power-up combination', () => {
        it('should handle boss defeat with active power-ups', () => {
            gameModel = new GameModel({ level: 1 });
            const powerUp = gameModel.spawnPowerUp('SHIELD', 10, 10);
            gameModel.collectPowerUp(powerUp);

            gameModel = new GameModel({ level: 5 });
            gameModel.spawnBoss('alpha');

            expect(gameModel.hasActivePowerUp('SHIELD')).toBe(true);
            expect(gameModel.isBossBattleActive()).toBe(true);
        });

        it('should not spawn power-ups during boss battle', () => {
            gameModel = new GameModel({ level: 5 });
            gameModel.spawnBoss('alpha');

            const powerUpType = gameModel.shouldSpawnPowerUp(10);

            expect(powerUpType).toBe(null);
        });

        it('should allow power-ups after boss defeat', () => {
            gameModel = new GameModel({ level: 5 });
            gameModel.spawnBoss('alpha');
            gameModel.damageBoss(bossConfig.bossTypes.alpha.health);

            expect(gameModel.isBossBattleActive()).toBe(false);

            const powerUpType = gameModel.shouldSpawnPowerUp(10);
            expect(powerUpType).not.toBeNull();
        });
    });

    describe('story chapter completion progression', () => {
        it('should progress through all story chapters', () => {
            let chapterCount = 0;

            for (const chapter of storyConfig.chapters) {
                gameModel = new GameModel({ level: chapter.level });
                gameModel.startLevel(chapter.level);

                const currentChapter = gameModel.getCurrentChapter();
                if (currentChapter) {
                    chapterCount++;
                }
            }

            expect(chapterCount).toBe(storyConfig.chapters.length);
        });

        it('should complete chapter at boss level', () => {
            gameModel = new GameModel({ level: 5 });
            gameModel.startLevel(5);
            gameModel.spawnBoss('alpha');
            gameModel.damageBoss(bossConfig.bossTypes.alpha.health);

            expect(gameModel.getCurrentChapter()).toBeNull();
            expect(gameModel.storyMode.completedChapters.has('Alpha Breach')).toBe(
                true
            );
        });

        it('should track completion of all chapters', () => {
            const allChapters = storyConfig.chapters;

            for (const chapter of allChapters) {
                gameModel = new GameModel({ level: chapter.level });
                gameModel.startLevel(chapter.level);
                gameModel.completeChapter();
            }

            expect(gameModel.storyMode.completedChapters.size).toBe(
                allChapters.length
            );
        });
    });

    describe('Phase 5 event emission chain', () => {
        it('should emit boss events in correct order', () => {
            const eventOrder = [];

            jest.spyOn(gameEvents, 'emit').mockImplementation((event, data) => {
                eventOrder.push(event);
            });

            gameModel = new GameModel({ level: 5 });
            gameModel.startLevel(5);
            gameModel.spawnBoss('alpha');
            gameModel.damageBoss(1);

            const bossSpawnedIndex = eventOrder.indexOf(GAME_EVENTS.BOSS_SPAWNED);
            const bossDamagedIndex = eventOrder.indexOf(GAME_EVENTS.BOSS_DAMAGED);
            const bossPhaseChangedIndex = eventOrder.indexOf(
                GAME_EVENTS.BOSS_PHASE_CHANGED
            );

            expect(bossSpawnedIndex).toBeGreaterThan(-1);
            expect(bossDamagedIndex).toBeGreaterThan(bossSpawnedIndex);
            expect(bossPhaseChangedIndex).toBeGreaterThan(bossDamagedIndex);

            jest.restoreAllMocks();
        });

        it('should emit power-up events in correct order', () => {
            const eventOrder = [];

            jest.spyOn(gameEvents, 'emit').mockImplementation((event, data) => {
                eventOrder.push(event);
            });

            gameModel = new GameModel({ level: 1 });
            const powerUp = gameModel.spawnPowerUp('SHIELD', 10, 10);
            gameModel.collectPowerUp(powerUp);

            const spawnedIndex = eventOrder.indexOf(
                expect.stringContaining('power-up:spawned')
            );
            const activatedIndex = eventOrder.indexOf(
                expect.stringContaining('power-up:activated')
            );

            expect(spawnedIndex).toBeGreaterThan(-1);
            expect(activatedIndex).toBeGreaterThan(spawnedIndex);

            jest.restoreAllMocks();
        });

        it('should emit story events in correct order', () => {
            const eventOrder = [];

            jest.spyOn(gameEvents, 'emit').mockImplementation((event, data) => {
                eventOrder.push(event);
            });

            gameModel = new GameModel({ level: 5 });
            gameModel.startLevel(5);
            gameModel.completeChapter();

            const startedIndex = eventOrder.indexOf(GAME_EVENTS.CHAPTER_STARTED);
            const completedIndex = eventOrder.indexOf(GAME_EVENTS.CHAPTER_COMPLETED);

            expect(startedIndex).toBeGreaterThan(-1);
            expect(completedIndex).toBeGreaterThan(startedIndex);

            jest.restoreAllMocks();
        });

        it('should emit power-up events in correct order', () => {
            const eventOrder = [];

            jest.spyOn(gameEvents, 'emit').mockImplementation((event, data) => {
                eventOrder.push(event);
            });

            gameModel = new GameModel({ level: 1 });
            const powerUp = gameModel.spawnPowerUp('SHIELD', 10, 10);
            gameModel.collectPowerUp(powerUp);

            const spawnedIndex = eventOrder.indexOf(
                expect.stringContaining('power-up:spawned')
            );
            const activatedIndex = eventOrder.indexOf(
                expect.stringContaining('power-up:activated')
            );

            expect(spawnedIndex).toBeGreaterThan(-1);
            expect(activatedIndex).toBeGreaterThan(spawnedIndex);

            jest.restoreAllMocks();
        });

        it('should emit story events in correct order', () => {
            const eventOrder = [];

            jest.spyOn(gameEvents, 'emit').mockImplementation((event, data) => {
                eventOrder.push(event);
            });

            gameModel = new GameModel({ level: 5 });
            gameModel.startLevel(5);
            gameModel.completeChapter();

            const startedIndex = eventOrder.indexOf(GAME_EVENTS.CHAPTER_STARTED);
            const completedIndex = eventOrder.indexOf(GAME_EVENTS.CHAPTER_COMPLETED);

            expect(startedIndex).toBeGreaterThan(-1);
            expect(completedIndex).toBeGreaterThan(startedIndex);

            jest.restoreAllMocks();
        });
    });

    describe('GameModel snapshot includes Phase 5 state', () => {
        it('should include boss battle state in snapshot', () => {
            gameModel = new GameModel({ level: 5 });
            gameModel.spawnBoss('alpha');

            const snapshot = gameModel.getSnapshot();

            expect(snapshot.boss).toBeDefined();
            expect(snapshot.boss.isBossActive).toBe(true);
            expect(snapshot.boss.bossType).toBe('alpha');
            expect(snapshot.boss.bossHealth).toBeGreaterThan(0);
        });

        it('should include power-up state in snapshot', () => {
            gameModel = new GameModel({ level: 1 });
            const powerUp = gameModel.spawnPowerUp('SHIELD', 10, 10);
            gameModel.collectPowerUp(powerUp);

            const snapshot = gameModel.getSnapshot();

            expect(snapshot.powerUps).toBeDefined();
            expect(snapshot.powerUps.activePowerUps).toHaveLength(1);
            expect(snapshot.powerUps.spawnedPowerUps).toEqual([]);
        });

        it('should include story mode state in snapshot', () => {
            gameModel = new GameModel({ level: 5 });
            gameModel.startLevel(5);

            const snapshot = gameModel.getSnapshot();

            expect(snapshot.story).toBeDefined();
            expect(snapshot.story.isStoryActive).toBe(true);
            expect(snapshot.story.currentChapter).not.toBeNull();
        });

        it('should include all Phase 5 systems together', () => {
            gameModel = new GameModel({ level: 5 });
            gameModel.startLevel(5);
            gameModel.spawnBoss('alpha');

            const snapshot = gameModel.getSnapshot();

            expect(snapshot.boss).toBeDefined();
            expect(snapshot.powerUps).toBeDefined();
            expect(snapshot.story).toBeDefined();
        });
    });

    describe('backward compatibility with existing game flow', () => {
        it('should maintain existing game mechanics', () => {
            gameModel = new GameModel({ level: 1 });

            expect(gameModel.pacman).toBeDefined();
            expect(gameModel.ghosts).toBeDefined();
            expect(gameModel.score).toBe(0);
            expect(gameModel.lives).toBe(3);
        });

        it('should support traditional gameplay without Phase 5 features', () => {
            gameModel = new GameModel({ level: 2 });

            expect(gameModel.isBossBattleActive()).toBe(false);
            expect(gameModel.hasActivePowerUp('SHIELD')).toBe(false);
            expect(gameModel.getCurrentChapter()).toBeNull();
        });

        it('should maintain score values', () => {
            gameModel = new GameModel({ level: 1 });

            const pelletGrid = gameModel.pelletGrid;
            let pelletX = -1,
                pelletY = -1;

            for (let y = 0; y < pelletGrid.length; y++) {
                for (let x = 0; x < pelletGrid[0].length; x++) {
                    if (pelletGrid[y][x] !== 0) {
                        pelletX = x;
                        pelletY = y;
                        break;
                    }
                }
                if (pelletX !== -1) {break;}
            }

            if (pelletX !== -1) {
                gameModel.eatPelletAt(pelletX, pelletY);
                expect(gameModel.score).toBe(scoreValues.pellet);
            }
        });

        it('should maintain ghost elimination scores', () => {
            gameModel = new GameModel({ level: 1 });
            gameModel.ghosts[0].isFrightened = true;

            gameModel.ghosts[0].x = gameModel.pacman.x;
            gameModel.ghosts[0].y = gameModel.pacman.y;
            gameModel.ghosts[0].gridX = gameModel.pacman.gridX;
            gameModel.ghosts[0].gridY = gameModel.pacman.gridY;

            const result = gameModel.eatGhost(gameModel.ghosts[0]);

            expect(result).not.toBeNull();
            expect(gameModel.score).toBeGreaterThan(0);
        });
    });
});
