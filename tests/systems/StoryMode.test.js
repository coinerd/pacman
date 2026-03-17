import StoryMode from '../../src/systems/StoryMode.js';
import { GAME_EVENTS, gameEvents } from '../../src/core/EventBus.js';

// Mock gameConfig
jest.mock('../../src/config/gameConfig.js', () => ({
    storyConfig: {
        chapters: [
            { level: 1, name: 'The Beginning', description: 'Start your journey', bossBattle: false },
            { level: 5, name: 'First Boss', description: 'Face the first challenge', bossBattle: true, bossType: 'alpha' },
            { level: 10, name: 'Final Showdown', description: 'The ultimate battle', bossBattle: true, bossType: 'omega' }
        ],
        chapterCompleteBonus: 1000
    }
}));

describe('StoryMode', () => {
    let storyMode;
    let eventHandler;

    beforeEach(() => {
        storyMode = new StoryMode();
        eventHandler = jest.fn();
        gameEvents.on(GAME_EVENTS.CHAPTER_STARTED, eventHandler);
        gameEvents.on(GAME_EVENTS.CHAPTER_COMPLETED, eventHandler);
    });

    afterEach(() => {
        gameEvents.off(GAME_EVENTS.CHAPTER_STARTED, eventHandler);
        gameEvents.off(GAME_EVENTS.CHAPTER_COMPLETED, eventHandler);
        storyMode.reset();
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(storyMode.currentChapter).toBeNull();
            expect(storyMode.completedChapters).toBeInstanceOf(Set);
            expect(storyMode.completedChapters.size).toBe(0);
            expect(storyMode.isStoryActive).toBe(false);
        });
    });

    describe('startLevel', () => {
        it('should start a chapter for a level with story', () => {
            storyMode.startLevel(1);

            expect(storyMode.currentChapter).not.toBeNull();
            expect(storyMode.currentChapter.name).toBe('The Beginning');
            expect(storyMode.isStoryActive).toBe(true);
            expect(eventHandler).toHaveBeenCalledWith({
                level: 1,
                chapterName: 'The Beginning',
                description: 'Start your journey',
                isBossBattle: false,
                bossType: undefined
            });
        });

        it('should start a boss battle chapter', () => {
            storyMode.startLevel(5);

            expect(storyMode.currentChapter).not.toBeNull();
            expect(storyMode.currentChapter.bossBattle).toBe(true);
            expect(storyMode.currentChapter.bossType).toBe('alpha');
            expect(eventHandler).toHaveBeenCalledWith(expect.objectContaining({
                isBossBattle: true,
                bossType: 'alpha'
            }));
        });

        it('should not start chapter for level without story', () => {
            storyMode.startLevel(3);

            expect(storyMode.currentChapter).toBeNull();
            expect(storyMode.isStoryActive).toBe(false);
        });

        it('should replace previous chapter when starting new one', () => {
            storyMode.startLevel(1);
            storyMode.startLevel(5);

            expect(storyMode.currentChapter.name).toBe('First Boss');
        });
    });

    describe('findChapterForLevel', () => {
        it('should find chapter for existing level', () => {
            const chapter = storyMode.findChapterForLevel(1);
            expect(chapter).toEqual({
                level: 1,
                name: 'The Beginning',
                description: 'Start your journey',
                bossBattle: false
            });
        });

        it('should return null for non-existent level', () => {
            const chapter = storyMode.findChapterForLevel(999);
            expect(chapter).toBeNull();
        });
    });

    describe('completeChapter', () => {
        it('should complete current chapter and return result', () => {
            storyMode.startLevel(1);
            const result = storyMode.completeChapter();

            expect(result).toEqual({
                chapterName: 'The Beginning',
                bonusPoints: 1000,
                level: 1
            });
            expect(storyMode.completedChapters.has('The Beginning')).toBe(true);
            expect(storyMode.currentChapter).toBeNull();
            expect(storyMode.isStoryActive).toBe(false);
        });

        it('should return null if no chapter is active', () => {
            const result = storyMode.completeChapter();
            expect(result).toBeNull();
        });

        it('should emit CHAPTER_COMPLETED event', () => {
            storyMode.startLevel(1);
            storyMode.completeChapter();

            expect(eventHandler).toHaveBeenCalledWith(expect.objectContaining({
                chapterName: 'The Beginning',
                bonusPoints: 1000
            }));
        });
    });

    describe('getCurrentChapter', () => {
        it('should return current chapter when active', () => {
            storyMode.startLevel(1);
            expect(storyMode.getCurrentChapter()).toEqual(storyMode.currentChapter);
        });

        it('should return null when no chapter is active', () => {
            expect(storyMode.getCurrentChapter()).toBeNull();
        });
    });

    describe('getChapterProgress', () => {
        it('should return progress for active chapter', () => {
            storyMode.startLevel(5);
            const progress = storyMode.getChapterProgress();

            expect(progress.current).toEqual(storyMode.currentChapter);
            expect(progress.completedCount).toBe(0);
            expect(progress.totalChapters).toBe(3);
            expect(progress.currentIndex).toBe(2);
            expect(progress.isComplete).toBe(false);
        });

        it('should return progress without current chapter', () => {
            const progress = storyMode.getChapterProgress();

            expect(progress.current).toBeNull();
            expect(progress.completedCount).toBe(0);
            expect(progress.totalChapters).toBe(3);
            expect(progress.currentIndex).toBeNull();
            expect(progress.isComplete).toBe(false);
        });

        it('should track completed chapters', () => {
            storyMode.startLevel(1);
            storyMode.completeChapter();

            const progress = storyMode.getChapterProgress();
            expect(progress.completedCount).toBe(1);
        });
    });

    describe('reset', () => {
        it('should reset all story progress', () => {
            storyMode.startLevel(1);
            storyMode.completeChapter();
            storyMode.startLevel(5);

            storyMode.reset();

            expect(storyMode.currentChapter).toBeNull();
            expect(storyMode.completedChapters.size).toBe(0);
            expect(storyMode.isStoryActive).toBe(false);
        });
    });

    describe('getSnapshot', () => {
        it('should return current state snapshot', () => {
            storyMode.startLevel(1);

            const snapshot = storyMode.getSnapshot();

            expect(snapshot.currentChapter).toEqual(storyMode.currentChapter);
            expect(snapshot.completedChapters).toEqual([]);
            expect(snapshot.isStoryActive).toBe(true);
        });

        it('should include completed chapters in snapshot', () => {
            storyMode.startLevel(1);
            storyMode.completeChapter();

            const snapshot = storyMode.getSnapshot();

            expect(snapshot.completedChapters).toContain('The Beginning');
        });
    });
});
