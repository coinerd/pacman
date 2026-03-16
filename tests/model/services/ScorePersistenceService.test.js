// tests/model/services/ScorePersistenceService.test.js

import ScorePersistenceService from '../../../src/model/services/ScorePersistenceService.js';

describe('ScorePersistenceService', () => {
    let service;
    let mockStorageManager;

    beforeEach(() => {
        mockStorageManager = {
            getHighScore: jest.fn(() => 0),
            saveHighScore: jest.fn(() => true),
            clearHighScore: jest.fn()
        };

        service = new ScorePersistenceService(mockStorageManager);
    });

    describe('constructor', () => {
        test('should use provided storage manager', () => {
            expect(service.storageManager).toBe(mockStorageManager);
        });
    });

    describe('loadHighScore', () => {
        test('should load high score from storage', () => {
            mockStorageManager.getHighScore.mockReturnValue(5000);

            const score = service.loadHighScore();

            expect(score).toBe(5000);
        });
    });

    describe('saveIfHigher', () => {
        test('should save score via storage manager', () => {
            service.saveIfHigher(5000);

            expect(mockStorageManager.saveHighScore).toHaveBeenCalledWith(5000);
        });

        test('should return result from storage manager', () => {
            mockStorageManager.saveHighScore.mockReturnValue(true);

            const result = service.saveIfHigher(5000);

            expect(result).toBe(true);
        });
    });

    describe('clearHighScore', () => {
        test('should clear high score via storage manager', () => {
            service.clearHighScore();

            expect(mockStorageManager.clearHighScore).toHaveBeenCalled();
        });
    });
});
