/**
 * ScoreModule Comprehensive Tests
 * Tests for score tracking and persistence
 */

import ScoreModule from '../../../src/model/systems/ScoreModule.js';

// Mock the persistence service and event bus
jest.mock('../../../src/model/services/ScorePersistenceService.js', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
        loadHighScore: jest.fn().mockReturnValue(0),
        saveHighScore: jest.fn(),
        saveIfHigher: jest.fn()
    }))
}));

jest.mock('../../../src/core/EventBus.js', () => ({
    GAME_EVENTS: {
        SCORE_CHANGED: 'score:changed',
        HIGH_SCORE_CHANGED: 'high-score:changed'
    },
    gameEvents: {
        emit: jest.fn()
    }
}));

describe('ScoreModule', () => {
    let scoreModule;

    beforeEach(() => {
        jest.clearAllMocks();
        scoreModule = new ScoreModule({
            score: 0,
            highScore: 1000
        });
    });

    describe('Initialization', () => {
        test('should initialize with config', () => {
            expect(scoreModule.score).toBe(0);
            expect(scoreModule.highScore).toBe(1000);
        });

        test('should initialize with defaults', () => {
            const defaultModule = new ScoreModule();
            expect(defaultModule.score).toBe(0);
        });

        test('should initialize tracking variables', () => {
            expect(scoreModule.pelletsEaten).toBe(0);
            expect(scoreModule.ghostsEaten).toBe(0);
            expect(scoreModule.currentComboGhosts).toBe(0);
            expect(scoreModule.maxComboGhosts).toBe(0);
        });
    });

    describe('Score Management', () => {
        test('should get score', () => {
            expect(scoreModule.score).toBe(0);
        });

        test('should set score', () => {
            scoreModule.score = 500;
            expect(scoreModule.score).toBe(500);
        });

        test('should add score via applyPelletScore', () => {
            scoreModule.applyPelletScore(10);
            expect(scoreModule.score).toBe(10);
            expect(scoreModule.pelletsEaten).toBe(1);
        });

        test('should add score via applyGhostScore', () => {
            scoreModule.applyGhostScore(200);
            expect(scoreModule.score).toBe(200);
            expect(scoreModule.ghostsEaten).toBe(1);
            expect(scoreModule.currentComboGhosts).toBe(1);
        });

        test('should add score via applyFruitScore', () => {
            scoreModule.applyFruitScore(100);
            expect(scoreModule.score).toBe(100);
        });
    });

    describe('High Score Management', () => {
        test('should get high score', () => {
            expect(scoreModule.highScore).toBe(1000);
        });

        test('should set high score', () => {
            scoreModule.highScore = 2000;
            expect(scoreModule.highScore).toBe(2000);
        });

        test('should update high score when score exceeds it', () => {
            scoreModule.score = 1500;
            const isNewHighScore = scoreModule.checkHighScore();
            expect(isNewHighScore).toBe(true);
            expect(scoreModule.highScore).toBe(1500);
        });

        test('should not update high score when score is lower', () => {
            scoreModule.score = 500;
            const isNewHighScore = scoreModule.checkHighScore();
            expect(isNewHighScore).toBe(false);
            expect(scoreModule.highScore).toBe(1000);
        });
    });

    describe('Pellet Tracking', () => {
        test('should track pellets eaten', () => {
            expect(scoreModule.pelletsEaten).toBe(0);
            scoreModule.applyPelletScore(10);
            scoreModule.applyPelletScore(10);
            expect(scoreModule.pelletsEaten).toBe(2);
        });
    });

    describe('Ghost Tracking', () => {
        test('should track ghosts eaten', () => {
            expect(scoreModule.ghostsEaten).toBe(0);
            scoreModule.applyGhostScore(200);
            expect(scoreModule.ghostsEaten).toBe(1);
        });

        test('should track combo ghosts', () => {
            expect(scoreModule.currentComboGhosts).toBe(0);
            scoreModule.applyGhostScore(200);
            expect(scoreModule.currentComboGhosts).toBe(1);
        });

        test('should track max combo ghosts', () => {
            scoreModule.applyGhostScore(200);
            scoreModule.applyGhostScore(400);
            expect(scoreModule.maxComboGhosts).toBe(2);
        });

        test('should reset combo', () => {
            scoreModule.applyGhostScore(200);
            scoreModule.resetCombo();
            expect(scoreModule.currentComboGhosts).toBe(0);
        });
    });

    describe('Score Normalization', () => {
        test('should normalize valid numbers', () => {
            expect(scoreModule.normalizeScoreValue(100)).toBe(100);
        });

        test('should normalize string numbers', () => {
            expect(scoreModule.normalizeScoreValue('100')).toBe(100);
        });

        test('should return 0 for invalid values', () => {
            expect(scoreModule.normalizeScoreValue(null)).toBe(0);
            expect(scoreModule.normalizeScoreValue(undefined)).toBe(0);
            expect(scoreModule.normalizeScoreValue('invalid')).toBe(0);
            expect(scoreModule.normalizeScoreValue(NaN)).toBe(0);
            expect(scoreModule.normalizeScoreValue(Infinity)).toBe(0);
        });
    });

    describe('Event Handling', () => {
        test('should handle pellet_eaten event', () => {
            scoreModule.applyEvent({ type: 'pellet_eaten', score: 10 });
            expect(scoreModule.score).toBe(10);
        });

        test('should handle ghost_eaten event', () => {
            scoreModule.applyEvent({ type: 'ghost_eaten', score: 200 });
            expect(scoreModule.score).toBe(200);
        });

        test('should handle fruit_eaten event', () => {
            scoreModule.applyEvent({ type: 'fruit_eaten', score: 100 });
            expect(scoreModule.score).toBe(100);
        });

        test('should ignore unknown events', () => {
            scoreModule.applyEvent({ type: 'unknown' });
            expect(scoreModule.score).toBe(0);
        });
    });

    describe('Snapshot', () => {
        test('should get snapshot', () => {
            const snapshot = scoreModule.getSnapshot();
            expect(snapshot).toBeDefined();
            expect(snapshot.score).toBe(0);
            expect(snapshot.highScore).toBe(1000);
            expect(snapshot.ghostsEaten).toBe(0);
            expect(snapshot.pelletsEaten).toBe(0);
        });
    });
});
