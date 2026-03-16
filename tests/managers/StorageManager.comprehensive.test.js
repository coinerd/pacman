/**
 * Comprehensive tests for StorageManager
 * Tests actual localStorage operations with mocking
 */

import { StorageManager } from '../../src/managers/StorageManager.js';

// Mock localStorage
const mockStorage = {
    store: {},
    getItem: jest.fn((key) => mockStorage.store[key] || null),
    setItem: jest.fn((key, value) => { mockStorage.store[key] = value; }),
    removeItem: jest.fn((key) => { delete mockStorage.store[key]; }),
    clear: jest.fn(() => { mockStorage.store = {}; })
};

// Store original window.localStorage
const originalLocalStorage = window.localStorage;

describe('StorageManager Comprehensive', () => {
    let storageManager;

    beforeAll(() => {
        Object.defineProperty(window, 'localStorage', {
            value: mockStorage,
            writable: true
        });
    });

    afterAll(() => {
        Object.defineProperty(window, 'localStorage', {
            value: originalLocalStorage,
            writable: true
        });
    });

    beforeEach(() => {
        mockStorage.store = {};
        jest.clearAllMocks();
        storageManager = new StorageManager();
    });

    describe('getHighScore', () => {
        test('should return 0 when no high score is stored', () => {
            const result = storageManager.getHighScore();
            expect(result).toBe(0);
        });

        test('should return stored high score', () => {
            mockStorage.store['pacman_high_score'] = '10000';
            const result = storageManager.getHighScore();
            expect(result).toBe(10000);
        });

        test('should return 0 for invalid stored value', () => {
            mockStorage.store['pacman_high_score'] = 'invalid';
            const result = storageManager.getHighScore();
            expect(result).toBe(0);
        });

        test('should return 0 for NaN value', () => {
            mockStorage.store['pacman_high_score'] = 'NaN';
            const result = storageManager.getHighScore();
            expect(result).toBe(0);
        });

        test('should handle null value', () => {
            mockStorage.store['pacman_high_score'] = null;
            const result = storageManager.getHighScore();
            expect(result).toBe(0);
        });

        test('should parse string numbers correctly', () => {
            mockStorage.store['pacman_high_score'] = ' 5000 ';
            const result = storageManager.getHighScore();
            expect(result).toBe(5000);
        });
    });

    describe('saveHighScore', () => {
        test('should save new high score when higher than current', () => {
            mockStorage.store['pacman_high_score'] = '5000';
            const result = storageManager.saveHighScore(10000);
            expect(result).toBe(true);
            expect(mockStorage.setItem).toHaveBeenCalledWith('pacman_high_score', '10000');
        });

        test('should not save when score is lower', () => {
            mockStorage.store['pacman_high_score'] = '10000';
            const result = storageManager.saveHighScore(5000);
            expect(result).toBe(false);
        });

        test('should not save when score is equal', () => {
            mockStorage.store['pacman_high_score'] = '10000';
            const result = storageManager.saveHighScore(10000);
            expect(result).toBe(false);
        });

        test('should save when no current high score', () => {
            const result = storageManager.saveHighScore(100);
            expect(result).toBe(true);
            expect(mockStorage.setItem).toHaveBeenCalledWith('pacman_high_score', '100');
        });
    });

    describe('clearHighScore', () => {
        test('should remove high score from storage', () => {
            mockStorage.store['pacman_high_score'] = '10000';
            storageManager.clearHighScore();
            expect(mockStorage.removeItem).toHaveBeenCalledWith('pacman_high_score');
        });
    });

    describe('getSettings', () => {
        test('should return default settings when none stored', () => {
            const result = storageManager.getSettings();
            expect(result.soundEnabled).toBe(true);
            expect(result.volume).toBe(0.5);
            expect(result.showFps).toBe(false);
            expect(result.difficulty).toBe('Normal');
        });

        test('should return stored settings', () => {
            const settings = { soundEnabled: false, volume: 0.8, showFps: true, difficulty: 'Hard' };
            mockStorage.store['pacman_settings'] = JSON.stringify(settings);
            const result = storageManager.getSettings();
            expect(result).toEqual(settings);
        });

        test('should return defaults for invalid JSON', () => {
            mockStorage.store['pacman_settings'] = 'invalid json';
            const result = storageManager.getSettings();
            expect(result.soundEnabled).toBe(true);
        });
    });

    describe('saveSettings', () => {
        test('should save settings to storage', () => {
            const settings = { soundEnabled: false, volume: 0.7 };
            storageManager.saveSettings(settings);
            expect(mockStorage.setItem).toHaveBeenCalledWith(
                'pacman_settings',
                JSON.stringify(settings)
            );
        });
    });

    describe('clearAll', () => {
        test('should clear both high score and settings', () => {
            mockStorage.store['pacman_high_score'] = '10000';
            mockStorage.store['pacman_settings'] = '{"soundEnabled":false}';
            storageManager.clearAll();
            expect(mockStorage.removeItem).toHaveBeenCalledWith('pacman_high_score');
            expect(mockStorage.removeItem).toHaveBeenCalledWith('pacman_settings');
        });
    });
});
