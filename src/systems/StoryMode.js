import { storyConfig } from '../config/gameConfig.js';
import { GAME_EVENTS, gameEvents } from '../core/EventBus.js';

/**
 * StoryMode system for narrative progression
 * Tracks chapter progress and emits story events
 */
export default class StoryMode {
    constructor(gameModel) {
        this.gameModel = gameModel;

        this.currentChapter = null;
        this.completedChapters = new Set();
        this.isStoryActive = false;
    }

    /**
	 * Start level - check if level has story chapter
	 */
    startLevel(level) {
        const chapter = this.findChapterForLevel(level);

        if (chapter) {
            this.currentChapter = chapter;
            this.isStoryActive = true;

            gameEvents.emit(GAME_EVENTS.CHAPTER_STARTED, {
                level,
                chapterName: chapter.name,
                description: chapter.description,
                isBossBattle: chapter.bossBattle,
                bossType: chapter.bossType
            });
        } else {
            this.currentChapter = null;
            this.isStoryActive = false;
        }
    }

    /**
	 * Find chapter configuration for level
	 */
    findChapterForLevel(level) {
        return (
            storyConfig.chapters.find((chapter) => chapter.level === level) || null
        );
    }

    /**
	 * Complete chapter - apply bonus and mark complete
	 */
    completeChapter() {
        if (!this.currentChapter) {
            return null;
        }

        const chapterName = this.currentChapter.name;
        const bonusPoints = storyConfig.chapterCompleteBonus;

        this.completedChapters.add(chapterName);
        this.gameModel.score += bonusPoints;

        gameEvents.emit(GAME_EVENTS.CHAPTER_COMPLETED, {
            chapterName: this.currentChapter.name,
            bonusPoints,
            level: this.gameModel.level,
            score: this.gameModel.score
        });

        const result = {
            chapterName: this.currentChapter.name,
            bonusPoints,
            score: this.gameModel.score
        };

        this.currentChapter = null;
        this.isStoryActive = false;

        return result;
    }

    /**
	 * Get current chapter info
	 */
    getCurrentChapter() {
        return this.currentChapter;
    }

    /**
	 * Get chapter progress info
	 */
    getChapterProgress() {
        const totalChapters = storyConfig.chapters.length;
        const completedCount = this.completedChapters.size;

        if (!this.currentChapter) {
            return {
                current: null,
                completedCount,
                totalChapters,
                currentIndex: null,
                isComplete: false
            };
        }

        const currentChapterIndex = storyConfig.chapters.findIndex(
            (ch) => ch.level === this.currentChapter.level
        );

        return {
            current: this.currentChapter,
            completedCount,
            totalChapters,
            currentIndex: currentChapterIndex + 1,
            isComplete: this.completedChapters.has(this.currentChapter.name)
        };
    }

    /**
	 * Reset story progress (for new game)
	 */
    reset() {
        this.currentChapter = null;
        this.completedChapters.clear();
        this.isStoryActive = false;
    }

    /**
	 * Get story snapshot
	 */
    getSnapshot() {
        return {
            currentChapter: this.currentChapter,
            completedChapters: Array.from(this.completedChapters),
            isStoryActive: this.isStoryActive
        };
    }
}
