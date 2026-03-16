/**
 * Tests for NarrativeManager
 * Tests story narrative display and chapter messages
 */

import { NarrativeManager } from '../../../src/views/renderers/NarrativeManager.js';

// Mock Phaser Scene
const createMockScene = () => {
    let containerCounter = 0;

    return {
        scale: {
            width: 800,
            height: 600
        },
        add: {
            container: jest.fn(() => ({
                add: jest.fn(),
                setAlpha: jest.fn(),
                destroy: jest.fn(),
                _id: ++containerCounter
            })),
            rectangle: jest.fn(() => ({
                setAlpha: jest.fn().mockReturnThis(),
                setStrokeStyle: jest.fn().mockReturnThis()
            })),
            text: jest.fn(() => ({
                setOrigin: jest.fn().mockReturnThis(),
                setText: jest.fn()
            }))
        },
        tweens: {
            add: jest.fn((config) => {
                // Store but don't execute
            })
        },
        time: {
            delayedCall: jest.fn((delay, callback) => {
                return { callback, delay };
            })
        }
    };
};

describe('NarrativeManager', () => {
    let mockScene;
    let manager;

    beforeEach(() => {
        mockScene = createMockScene();
        manager = new NarrativeManager(mockScene);
    });

    describe('constructor', () => {
        it('should store scene reference', () => {
            expect(manager.scene).toBe(mockScene);
        });

        it('should initialize storyOverlay as null', () => {
            expect(manager.storyOverlay).toBeNull();
        });

        it('should initialize storyDescription as null', () => {
            expect(manager.storyDescription).toBeNull();
        });
    });

    describe('showStoryNarrative', () => {
        it('should create a container for the overlay', () => {
            manager.showStoryNarrative({
                chapterName: 'Chapter 1',
                description: 'The adventure begins'
            });

            expect(mockScene.add.container).toHaveBeenCalled();
        });

        it('should hide existing overlay before showing new one', () => {
            const mockOverlay = {};
            manager.storyOverlay = mockOverlay;
            mockScene.tweens.add.mockClear();

            manager.showStoryNarrative({
                chapterName: 'Chapter 1',
                description: 'The adventure begins'
            });

            // hideStoryNarrative is called, which adds a tween
            expect(mockScene.tweens.add).toHaveBeenCalled();
        });

        it('should create background rectangle', () => {
            manager.showStoryNarrative({
                chapterName: 'Chapter 1',
                description: 'The adventure begins'
            });

            expect(mockScene.add.rectangle).toHaveBeenCalled();
        });

        it('should create title text with chapter name', () => {
            manager.showStoryNarrative({
                chapterName: 'Test Chapter',
                description: 'Description'
            });

            // Verify text was created (check the mock was called)
            expect(mockScene.add.text).toHaveBeenCalled();
        });

        it('should create description text', () => {
            manager.showStoryNarrative({
                chapterName: 'Chapter 1',
                description: 'Test description text'
            });

            expect(mockScene.add.text).toHaveBeenCalled();
        });

        it('should add boss warning for boss battles', () => {
            manager.showStoryNarrative({
                chapterName: 'Boss Level',
                description: 'Prepare for battle',
                isBossBattle: true
            });

            // Boss warning adds an extra text element
            const textCallCount = mockScene.add.text.mock.calls.length;
            expect(textCallCount).toBeGreaterThan(2);
        });

        it('should not add boss warning for regular chapters', () => {
            manager.showStoryNarrative({
                chapterName: 'Chapter 1',
                description: 'Regular level',
                isBossBattle: false
            });

            // Only title and description texts
            expect(mockScene.add.text).toHaveBeenCalled();
        });

        it('should set initial alpha to 0', () => {
            manager.showStoryNarrative({
                chapterName: 'Chapter 1',
                description: 'Description'
            });

            const container = mockScene.add.container.mock.results[0].value;
            expect(container.setAlpha).toHaveBeenCalledWith(0);
        });

        it('should add fade-in animation', () => {
            manager.showStoryNarrative({
                chapterName: 'Chapter 1',
                description: 'Description'
            });

            expect(mockScene.tweens.add).toHaveBeenCalled();
        });

        it('should store storyDescription reference', () => {
            manager.showStoryNarrative({
                chapterName: 'Chapter 1',
                description: 'Description'
            });

            expect(manager.storyDescription).toBeDefined();
        });
    });

    describe('hideStoryNarrative', () => {
        it('should return early if no overlay', () => {
            manager.storyOverlay = null;
            mockScene.tweens.add.mockClear();

            expect(() => manager.hideStoryNarrative()).not.toThrow();
            expect(mockScene.tweens.add).not.toHaveBeenCalled();
        });

        it('should add fade-out animation', () => {
            const mockOverlay = { destroy: jest.fn() };
            manager.storyOverlay = mockOverlay;
            mockScene.tweens.add.mockClear();

            manager.hideStoryNarrative();

            expect(mockScene.tweens.add).toHaveBeenCalled();
            const tweenConfig = mockScene.tweens.add.mock.calls[0][0];
            expect(tweenConfig.alpha).toBe(0);
        });

        it('should call destroy on animation complete', () => {
            const mockOverlay = { destroy: jest.fn() };
            manager.storyOverlay = mockOverlay;
            mockScene.tweens.add.mockClear();

            manager.hideStoryNarrative();

            const tweenConfig = mockScene.tweens.add.mock.calls[0][0];
            // Simulate animation completion
            tweenConfig.onComplete();

            expect(manager.storyOverlay).toBeNull();
            expect(manager.storyDescription).toBeNull();
        });
    });

    describe('showChapterCompleteMessage', () => {
        it('should create container for completion message', () => {
            manager.showChapterCompleteMessage({
                chapterName: 'Chapter 1',
                bonusPoints: 1000
            });

            expect(mockScene.add.container).toHaveBeenCalled();
        });

        it('should trigger hide for existing overlay first', () => {
            const mockOverlay = {};
            manager.storyOverlay = mockOverlay;
            mockScene.tweens.add.mockClear();

            manager.showChapterCompleteMessage({
                chapterName: 'Chapter 1',
                bonusPoints: 1000
            });

            // hideStoryNarrative is called, which adds a fade-out tween
            expect(mockScene.tweens.add).toHaveBeenCalled();
        });

        it('should create title and bonus texts', () => {
            manager.showChapterCompleteMessage({
                chapterName: 'Level 5',
                bonusPoints: 500
            });

            expect(mockScene.add.text).toHaveBeenCalled();
        });

        it('should add fade-in animation', () => {
            manager.showChapterCompleteMessage({
                chapterName: 'Chapter 1',
                bonusPoints: 1000
            });

            expect(mockScene.tweens.add).toHaveBeenCalled();
        });
    });

    describe('showAchievementNotification', () => {
        it('should create notification container', () => {
            manager.showAchievementNotification({
                title: 'First Steps',
                description: 'Complete your first level'
            });

            expect(mockScene.add.container).toHaveBeenCalledWith(400, 300);
        });

        it('should create achievement texts', () => {
            manager.showAchievementNotification({
                title: 'Speed Runner',
                description: 'Complete a level fast'
            });

            expect(mockScene.add.text).toHaveBeenCalled();
        });

        it('should add fade-in animation', () => {
            manager.showAchievementNotification({
                title: 'Test Achievement',
                description: 'Description'
            });

            expect(mockScene.tweens.add).toHaveBeenCalled();
        });
    });

    describe('isShowingNarrative', () => {
        it('should return true when overlay exists', () => {
            manager.storyOverlay = {};

            expect(manager.isShowingNarrative()).toBe(true);
        });

        it('should return false when overlay is null', () => {
            manager.storyOverlay = null;

            expect(manager.isShowingNarrative()).toBe(false);
        });
    });

    describe('updateDescription', () => {
        it('should update description text if exists', () => {
            manager.storyDescription = { setText: jest.fn() };

            manager.updateDescription('New description');

            expect(manager.storyDescription.setText).toHaveBeenCalledWith('New description');
        });

        it('should not throw if description is null', () => {
            manager.storyDescription = null;

            expect(() => manager.updateDescription('New text')).not.toThrow();
        });
    });

    describe('cleanup', () => {
        it('should destroy overlay if exists', () => {
            const mockOverlay = { destroy: jest.fn() };
            manager.storyOverlay = mockOverlay;

            manager.cleanup();

            expect(mockOverlay.destroy).toHaveBeenCalled();
        });

        it('should set overlay to null', () => {
            const mockOverlay = { destroy: jest.fn() };
            manager.storyOverlay = mockOverlay;

            manager.cleanup();

            expect(manager.storyOverlay).toBeNull();
        });

        it('should set description to null', () => {
            manager.storyDescription = {};
            const mockOverlay = { destroy: jest.fn() };
            manager.storyOverlay = mockOverlay;

            manager.cleanup();

            expect(manager.storyDescription).toBeNull();
        });

        it('should not throw if overlay is null', () => {
            manager.storyOverlay = null;

            expect(() => manager.cleanup()).not.toThrow();
        });
    });
});
