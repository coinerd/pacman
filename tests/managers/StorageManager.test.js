// tests/managers/StorageManager.test.js

import { StorageManager } from '../../src/managers/StorageManager.js';

// Mock the StorageManager for unit testing since localStorage is hard to mock
describe('StorageManager', () => {
    describe('methods', () => {
        test('getHighScore should be defined', () => {
            expect(typeof StorageManager.prototype.getHighScore).toBe('function');
        });

        test('saveHighScore should be defined', () => {
            expect(typeof StorageManager.prototype.saveHighScore).toBe('function');
        });

        test('clearHighScore should be defined', () => {
            expect(typeof StorageManager.prototype.clearHighScore).toBe('function');
        });

        test('getSettings should be defined', () => {
            expect(typeof StorageManager.prototype.getSettings).toBe('function');
        });

        test('saveSettings should be defined', () => {
            expect(typeof StorageManager.prototype.saveSettings).toBe('function');
        });

        test('getDefaultSettings should be defined', () => {
            expect(typeof StorageManager.prototype.getDefaultSettings).toBe('function');
        });

        test('clearAll should be defined', () => {
            expect(typeof StorageManager.prototype.clearAll).toBe('function');
        });
    });

    describe('getDefaultSettings', () => {
        test('should return expected defaults', () => {
            // Create a mock instance to test the method
            const manager = {
                getDefaultSettings: StorageManager.prototype.getDefaultSettings
            };

            const defaults = manager.getDefaultSettings();

            expect(defaults.soundEnabled).toBe(true);
            expect(defaults.volume).toBe(0.5);
            expect(defaults.showFps).toBe(false);
            expect(defaults.difficulty).toBe('Normal');
        });
    });
});
