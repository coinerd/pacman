/**
 * SessionModule Comprehensive Tests
 * Tests for session state management
 */

import SessionModule from '../../../src/model/systems/SessionModule.js';

describe('SessionModule', () => {
    let sessionModule;

    beforeEach(() => {
        sessionModule = new SessionModule({
            level: 1,
            lives: 3
        });
    });

    describe('Initialization', () => {
        test('should initialize with config', () => {
            expect(sessionModule.level).toBe(1);
            expect(sessionModule.lives).toBe(3);
        });

        test('should initialize with defaults', () => {
            const defaultModule = new SessionModule();
            expect(defaultModule.level).toBe(1);
            expect(defaultModule.lives).toBe(3);
        });

        test('should initialize flags', () => {
            expect(sessionModule.isPaused).toBe(false);
            expect(sessionModule.isGameOver).toBe(false);
            expect(sessionModule.levelComplete).toBe(false);
        });

        test('should initialize counters', () => {
            expect(sessionModule.levelDeaths).toBe(0);
        });
    });

    describe('Level Management', () => {
        test('should get level', () => {
            expect(sessionModule.level).toBe(1);
        });

        test('should set level', () => {
            sessionModule.level = 5;
            expect(sessionModule.level).toBe(5);
        });

        test('should start next level', () => {
            sessionModule.startNextLevel();
            expect(sessionModule.level).toBe(2);
            expect(sessionModule.levelComplete).toBe(false);
        });
    });

    describe('Lives Management', () => {
        test('should get lives', () => {
            expect(sessionModule.lives).toBe(3);
        });

        test('should set lives', () => {
            sessionModule.lives = 2;
            expect(sessionModule.lives).toBe(2);
        });

        test('should consume life', () => {
            const remaining = sessionModule.consumeLife();
            expect(remaining).toBe(2);
            expect(sessionModule.lives).toBe(2);
        });

        test('should detect game over when no lives', () => {
            sessionModule.lives = 0;
            expect(sessionModule.lives).toBe(0);
        });
    });

    describe('Pause State', () => {
        test('should start not paused', () => {
            expect(sessionModule.isPaused).toBe(false);
        });

        test('should set paused', () => {
            const result = sessionModule.setPaused(true);
            expect(sessionModule.isPaused).toBe(true);
            expect(result).toBe(true);
        });

        test('should toggle pause', () => {
            const result = sessionModule.togglePaused();
            expect(result).toBe(true);
            expect(sessionModule.isPaused).toBe(true);
        });
    });

    describe('Game Over State', () => {
        test('should start not game over', () => {
            expect(sessionModule.isGameOver).toBe(false);
        });

        test('should set game over', () => {
            sessionModule.setGameOver(true);
            expect(sessionModule.isGameOver).toBe(true);
        });
    });

    describe('Level Complete State', () => {
        test('should start not complete', () => {
            expect(sessionModule.levelComplete).toBe(false);
        });

        test('should mark level complete', () => {
            sessionModule.markLevelComplete();
            expect(sessionModule.levelComplete).toBe(true);
        });
    });

    describe('Death Tracking', () => {
        test('should track level deaths', () => {
            expect(sessionModule.levelDeaths).toBe(0);
            sessionModule.onPacmanDeath();
            expect(sessionModule.levelDeaths).toBe(1);
        });

        test('should clear level complete on death', () => {
            sessionModule.markLevelComplete();
            sessionModule.onPacmanDeath();
            expect(sessionModule.levelComplete).toBe(false);
        });
    });

    describe('Snapshot', () => {
        test('should get snapshot', () => {
            const snapshot = sessionModule.getSnapshot();
            expect(snapshot).toBeDefined();
            expect(snapshot.level).toBe(1);
            expect(snapshot.lives).toBe(3);
            expect(snapshot.isPaused).toBe(false);
            expect(snapshot.isGameOver).toBe(false);
        });
    });
});
