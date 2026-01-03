/**
 * Storage Manager
 * Handles localStorage operations for high scores and game settings
 */

export class StorageManager {
    constructor() {
        this.storage = window.localStorage;
    }

    /**
     * Get the high score from storage
     * @returns {number} High score value
     */
    getHighScore() {
        try {
            const highScore = this.storage.getItem('pacman_high_score');
            return highScore ? parseInt(highScore, 10) : 0;
        } catch (error) {
            console.warn('Error reading high score:', error);
            return 0;
        }
    }

    /**
     * Save a new high score if it's higher than the current one
     * @param {number} score - The score to check
     * @returns {boolean} True if a new high score was set
     */
    saveHighScore(score) {
        try {
            const currentHighScore = this.getHighScore();
            if (score > currentHighScore) {
                this.storage.setItem('pacman_high_score', score.toString());
                return true;
            }
            return false;
        } catch (error) {
            console.warn('Error saving high score:', error);
            return false;
        }
    }

    /**
     * Get game settings from storage
     * @returns {Object} Settings object
     */
    getSettings() {
        try {
            const settings = this.storage.getItem('pacman_settings');
            return settings ? JSON.parse(settings) : this.getDefaultSettings();
        } catch (error) {
            console.warn('Error reading settings:', error);
            return this.getDefaultSettings();
        }
    }

    /**
     * Save game settings to storage
     * @param {Object} settings - Settings object to save
     */
    saveSettings(settings) {
        try {
            this.storage.setItem('pacman_settings', JSON.stringify(settings));
        } catch (error) {
            console.warn('Error saving settings:', error);
        }
    }

    /**
     * Get default settings
     * @returns {Object} Default settings object
     */
    getDefaultSettings() {
        return {
            soundEnabled: true,
            volume: 0.5,
            showFps: false,
            difficulty: 'Normal'
        };
    }

    /**
     * Clear all stored data
     */
    clearAll() {
        try {
            this.storage.removeItem('pacman_high_score');
            this.storage.removeItem('pacman_settings');
        } catch (error) {
            console.warn('Error clearing storage:', error);
        }
    }
}
