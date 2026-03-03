import { storyConfig } from '../../src/config/gameConfig.js';
import { GAME_EVENTS, gameEvents } from '../../src/core/EventBus.js';
import StoryMode from '../../src/systems/StoryMode.js';

describe('StoryMode', () => {
    let mockGameModel;
    let storyMode;

    beforeEach(() => {
        mockGameModel = {
            score: 0,
            level: 1
        };
        storyMode = new StoryMode(mockGameModel);
    });

    afterEach(() => {
        storyMode.reset();
    });

    describe('constructor', () => {
        it('should initialize with null current chapter', () => {
            expect(storyMode.currentChapter).toBeNull();
        });

        it('should initialize with empty completed chapters', () => {
            expect(storyMode.completedChapters.size).toBe(0);
        });

        it('should initialize with story inactive', () => {
            expect(storyMode.isStoryActive).toBe(false);
        });

        it('should store reference to gameModel', () => {
            expect(storyMode.gameModel).toBe(mockGameModel);
        });
    });

    describe('startLevel', () => {
        it('should set current chapter for story level', () => {
            storyMode.startLevel(1);

            expect(storyMode.currentChapter).not.toBeNull();
            expect(storyMode.currentChapter.name).toBe('Network Entry');
        });

        it('should set story active for story level', () => {
            storyMode.startLevel(5);

            expect(storyMode.isStoryActive).toBe(true);
        });

        it('should not set chapter for non-story level', () => {
            storyMode.startLevel(2);

            expect(storyMode.currentChapter).toBeNull();
            expect(storyMode.isStoryActive).toBe(false);
        });

        it('should emit CHAPTER_STARTED event', () => {
            const emitSpy = jest.spyOn(gameEvents, 'emit');

            storyMode.startLevel(5);

            expect(emitSpy).toHaveBeenCalledWith(GAME_EVENTS.CHAPTER_STARTED, {
                level: 5,
                chapterName: 'Alpha Breach',
                description:
					'The Alpha virus has established a stronghold. Eliminate it to continue.',
                isBossBattle: true,
                bossType: 'alpha'
            });

            emitSpy.mockRestore();
        });
    });

    describe('findChapterForLevel', () => {
        it('should find chapter for level 1', () => {
            const chapter = storyMode.findChapterForLevel(1);

            expect(chapter).not.toBeNull();
            expect(chapter.name).toBe('Network Entry');
        });

        it('should find chapter for level 5', () => {
            const chapter = storyMode.findChapterForLevel(5);

            expect(chapter).not.toBeNull();
            expect(chapter.name).toBe('Alpha Breach');
            expect(chapter.bossBattle).toBe(true);
        });

        it('should find chapter for level 10', () => {
            const chapter = storyMode.findChapterForLevel(10);

            expect(chapter).not.toBeNull();
            expect(chapter.name).toBe('Beta Ambush');
            expect(chapter.bossBattle).toBe(true);
        });

        it('should find chapter for level 15', () => {
            const chapter = storyMode.findChapterForLevel(15);

            expect(chapter).not.toBeNull();
            expect(chapter.name).toBe('Gamma Glitch');
            expect(chapter.bossBattle).toBe(true);
        });

        it('should find chapter for level 20', () => {
            const chapter = storyMode.findChapterForLevel(20);

            expect(chapter).not.toBeNull();
            expect(chapter.name).toBe('Delta Core');
            expect(chapter.bossBattle).toBe(true);
        });

        it('should return null for non-story level', () => {
            const chapter = storyMode.findChapterForLevel(2);

            expect(chapter).toBeNull();
        });

        it('should return null for level outside story range', () => {
            const chapter = storyMode.findChapterForLevel(100);

            expect(chapter).toBeNull();
        });
    });

    describe('completeChapter', () => {
        beforeEach(() => {
            storyMode.startLevel(5);
        });

        it('should return null if no current chapter', () => {
            storyMode.reset();
            const result = storyMode.completeChapter();

            expect(result).toBeNull();
        });

        it('should add chapter to completed set', () => {
            storyMode.completeChapter();

            expect(storyMode.completedChapters.has('Alpha Breach')).toBe(true);
        });

        it('should add chapter complete bonus to score', () => {
            const initialScore = mockGameModel.score;
            storyMode.completeChapter();

            expect(mockGameModel.score).toBe(
                initialScore + storyConfig.chapterCompleteBonus
            );
        });

        it('should emit CHAPTER_COMPLETED event', () => {
            const emitSpy = jest.spyOn(gameEvents, 'emit');

            storyMode.completeChapter();

            expect(emitSpy).toHaveBeenCalledWith(GAME_EVENTS.CHAPTER_COMPLETED, {
                chapterName: 'Alpha Breach',
                bonusPoints: storyConfig.chapterCompleteBonus,
                level: mockGameModel.level,
                score: mockGameModel.score
            });

            emitSpy.mockRestore();
        });

        it('should clear current chapter', () => {
            storyMode.completeChapter();

            expect(storyMode.currentChapter).toBeNull();
        });

        it('should set story inactive', () => {
            storyMode.completeChapter();

            expect(storyMode.isStoryActive).toBe(false);
        });

        it('should return result object', () => {
            const result = storyMode.completeChapter();

            expect(result).not.toBeNull();
            expect(result.chapterName).toBe('Alpha Breach');
            expect(result.bonusPoints).toBe(storyConfig.chapterCompleteBonus);
            expect(result.score).toBe(mockGameModel.score);
        });
    });

    describe('getCurrentChapter', () => {
        it('should return current chapter when active', () => {
            storyMode.startLevel(5);

            const chapter = storyMode.getCurrentChapter();

            expect(chapter).not.toBeNull();
            expect(chapter.name).toBe('Alpha Breach');
        });

        it('should return null when no active chapter', () => {
            const chapter = storyMode.getCurrentChapter();

            expect(chapter).toBeNull();
        });
    });

    describe('getChapterProgress', () => {
        it('should return progress with null current chapter when no active chapter', () => {
            const progress = storyMode.getChapterProgress();

            expect(progress).not.toBeNull();
            expect(progress.current).toBeNull();
            expect(progress.completedCount).toBe(0);
        });

        it('should return progress for active chapter', () => {
            storyMode.startLevel(5);
            storyMode.completeChapter();

            storyMode.startLevel(10);

            const progress = storyMode.getChapterProgress();

            expect(progress).not.toBeNull();
            expect(progress.current).not.toBeNull();
            expect(progress.completedCount).toBe(1);
            expect(progress.totalChapters).toBe(storyConfig.chapters.length);
        });

        it('should calculate correct chapter index', () => {
            storyMode.startLevel(5);

            const progress = storyMode.getChapterProgress();

            expect(progress.currentIndex).toBe(2); // Level 5 is index 2 in chapters array
        });

        it('should indicate if chapter is complete', () => {
            storyMode.startLevel(5);
            storyMode.completeChapter();
            storyMode.startLevel(5);

            const progress = storyMode.getChapterProgress();

            expect(progress.isComplete).toBe(true);
        });

        it('should indicate if chapter is not complete', () => {
            storyMode.startLevel(5);

            const progress = storyMode.getChapterProgress();

            expect(progress.isComplete).toBe(false);
        });
    });

    describe('boss level detection', () => {
        it('should identify boss battle chapter', () => {
            storyMode.startLevel(5);

            expect(storyMode.currentChapter.bossBattle).toBe(true);
            expect(storyMode.currentChapter.bossType).toBe('alpha');
        });

        it('should identify non-boss chapter', () => {
            storyMode.startLevel(1);

            expect(storyMode.currentChapter.bossBattle).toBe(false);
        });

        it('should return correct boss type for each boss level', () => {
            storyMode.startLevel(10);
            expect(storyMode.currentChapter.bossType).toBe('beta');

            storyMode.startLevel(15);
            expect(storyMode.currentChapter.bossType).toBe('gamma');

            storyMode.startLevel(20);
            expect(storyMode.currentChapter.bossType).toBe('delta');
        });
    });

    describe('narrative display', () => {
        it('should provide chapter description', () => {
            storyMode.startLevel(5);

            expect(storyMode.currentChapter.description).toBeDefined();
            expect(storyMode.currentChapter.description.length).toBeGreaterThan(0);
        });

        it('should provide chapter name for display', () => {
            storyMode.startLevel(1);

            expect(storyMode.currentChapter.name).toBe('Network Entry');
        });
    });

    describe('reset', () => {
        it('should clear current chapter', () => {
            storyMode.startLevel(5);
            storyMode.reset();

            expect(storyMode.currentChapter).toBeNull();
        });

        it('should clear completed chapters', () => {
            storyMode.startLevel(5);
            storyMode.completeChapter();
            storyMode.reset();

            expect(storyMode.completedChapters.size).toBe(0);
        });

        it('should set story inactive', () => {
            storyMode.startLevel(5);
            storyMode.reset();

            expect(storyMode.isStoryActive).toBe(false);
        });
    });

    describe('getSnapshot', () => {
        it('should return snapshot with null current chapter', () => {
            const snapshot = storyMode.getSnapshot();

            expect(snapshot.currentChapter).toBeNull();
            expect(snapshot.completedChapters).toEqual([]);
            expect(snapshot.isStoryActive).toBe(false);
        });

        it('should return snapshot with current chapter', () => {
            storyMode.startLevel(5);

            const snapshot = storyMode.getSnapshot();

            expect(snapshot.currentChapter).not.toBeNull();
            expect(snapshot.currentChapter.name).toBe('Alpha Breach');
            expect(snapshot.isStoryActive).toBe(true);
        });

        it('should return snapshot with completed chapters', () => {
            storyMode.startLevel(5);
            storyMode.completeChapter();
            storyMode.startLevel(10);

            const snapshot = storyMode.getSnapshot();

            expect(snapshot.completedChapters).toContain('Alpha Breach');
            expect(snapshot.isStoryActive).toBe(true);
        });
    });

    describe('integration with GameModel', () => {
        it('should add bonus points to game model on chapter complete', () => {
            const initialScore = mockGameModel.score;
            storyMode.startLevel(5);
            storyMode.completeChapter();

            expect(mockGameModel.score).toBe(
                initialScore + storyConfig.chapterCompleteBonus
            );
        });

        it('should track progress across multiple chapters', () => {
            storyMode.startLevel(5);
            storyMode.completeChapter();
            storyMode.startLevel(10);
            storyMode.completeChapter();
            storyMode.startLevel(15);
            storyMode.completeChapter();

            const progress = storyMode.getChapterProgress();

            expect(progress).not.toBeNull();
            expect(progress.completedCount).toBe(3);
            expect(progress.totalChapters).toBe(storyConfig.chapters.length);
        });

        it('should track progress across multiple chapters', () => {
            storyMode.startLevel(5);
            storyMode.completeChapter();
            storyMode.startLevel(10);
            storyMode.completeChapter();
            storyMode.startLevel(15);

            const progress = storyMode.getChapterProgress();

            expect(progress.completedCount).toBe(2);
            expect(progress.currentIndex).toBe(4);
        });
    });

    describe('storyConfig integration', () => {
        it('should use chapter complete bonus from config', () => {
            storyMode.startLevel(5);
            storyMode.completeChapter();

            expect(mockGameModel.score).toBe(storyConfig.chapterCompleteBonus);
        });

        it('should use chapters array from config', () => {
            storyMode.startLevel(5);
            storyMode.completeChapter();
            storyMode.startLevel(10);
            storyMode.completeChapter();

            expect(storyMode.currentChapter).toBeNull();
            const progress = storyMode.getChapterProgress();

            expect(progress.totalChapters).toBe(storyConfig.chapters.length);
        });

        it('should handle all chapters in config', () => {
            const chapterLevels = storyConfig.chapters.map((ch) => ch.level);

            expect(chapterLevels).toContain(1);
            expect(chapterLevels).toContain(5);
            expect(chapterLevels).toContain(10);
            expect(chapterLevels).toContain(15);
            expect(chapterLevels).toContain(20);
        });
    });
});
