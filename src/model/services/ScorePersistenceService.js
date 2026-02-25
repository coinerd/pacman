import { StorageManager } from '../../managers/StorageManager.js';

/**
 * Handles high score persistence and shields model code from storage details.
 */
export default class ScorePersistenceService {
    constructor(storageManager = null) {
        this.storageManager = storageManager ?? this.createDefaultStorageManager();
    }

    createDefaultStorageManager() {
        if (typeof window === 'undefined' || !window.localStorage) {
            return null;
        }

        try {
            return new StorageManager();
        } catch (error) {
            console.warn('Unable to initialize score persistence:', error);
            return null;
        }
    }

    loadHighScore() {
        if (!this.storageManager) {
            return 0;
        }

        return this.storageManager.getHighScore();
    }

    saveIfHigher(score) {
        if (!this.storageManager) {
            return false;
        }

        return this.storageManager.saveHighScore(score);
    }

    clearHighScore() {
        if (!this.storageManager) {
            return;
        }

        if (typeof this.storageManager.clearHighScore === 'function') {
            this.storageManager.clearHighScore();
        }
    }
}
