/**
 * LevelSystem
 * Verwaltet Level-Progression und Level-Konfiguration.
 */

import { gameConfig, scoreValues } from '../../config/gameConfig.js';

export class LevelSystem {
    constructor() {
        this.currentLevel = 1;
        this.levelConfig = null;
    }

    /**
     * Setzt das Level
     * @param {number} level - Level-Nummer
     */
    setLevel(level) {
        this.currentLevel = level;
        this.updateLevelConfig();
    }

    /**
     * Gibt das aktuelle Level zurück
     * @returns {number}
     */
    getLevel() {
        return this.currentLevel;
    }

    /**
     * Aktualisiert die Level-Konfiguration basierend auf dem Level
     */
    updateLevelConfig() {
        const level = this.currentLevel;

        this.levelConfig = {
            // Speed Multiplier (5% increase per level)
            speedMultiplier: 1 + (level - 1) * 0.05,

            // Ghost Speed (4% increase per level)
            ghostSpeedMultiplier: 1 + (level - 1) * 0.04,

            // Score Multiplier (optional for higher levels)
            scoreMultiplier: level > 10 ? 1 + (level - 10) * 0.1 : 1,

            // Ghost Mode Durations (shorter on higher levels)
            scatterDuration: Math.max(5, 7 - Math.floor(level / 2)),
            chaseDuration: Math.max(15, 20 - Math.floor(level / 3)),
            frightenedDuration: Math.max(4, 8 - Math.floor(level / 2)),

            // Power Pellet Count (can increase on higher levels)
            powerPelletCount: 4,

            // Fruit Spawn Threshold (pellets eaten)
            fruitSpawnThreshold: 70,

            // Level-specific rules
            rules: {
                allowTunnels: true,
                allowGhostHouse: true,
                allowPowerPellets: true
            }
        };
    }

    /**
     * Gibt die aktuelle Level-Konfiguration zurück
     * @returns {Object}
     */
    getLevelConfig() {
        return this.levelConfig;
    }

    /**
     * Gibt den Speed-Multiplier zurück
     * @returns {number}
     */
    getSpeedMultiplier() {
        return this.levelConfig?.speedMultiplier || 1;
    }

    /**
     * Gibt den Ghost-Speed-Multiplier zurück
     * @returns {number}
     */
    getGhostSpeedMultiplier() {
        return this.levelConfig?.ghostSpeedMultiplier || 1;
    }

    /**
     * Gibt den Score-Multiplier zurück
     * @returns {number}
     */
    getScoreMultiplier() {
        return this.levelConfig?.scoreMultiplier || 1;
    }

    /**
     * Gibt die frightened-Duration zurück
     * @returns {number} Dauer in Sekunden
     */
    getFrightenedDuration() {
        return this.levelConfig?.frightenedDuration || 8;
    }

    /**
     * Prüft ob Fruit gespawnt werden soll
     * @param {number} pelletsEaten - Anzahl gefressener Pellets
     * @param {number} totalPellets - Gesamtanzahl Pellets
     * @returns {boolean}
     */
    shouldSpawnFruit(pelletsEaten, totalPellets) {
        if (!this.levelConfig) {
            return false;
        }

        const percentage = (pelletsEaten / totalPellets) * 100;
        return percentage >= this.levelConfig.fruitSpawnThreshold;
    }

    /**
     * Gibt den Fruit-Typ für das aktuelle Level zurück
     * @returns {string}
     */
    getFruitType() {
        const fruits = ['cherry', 'strawberry', 'orange', 'apple', 'melon', 'galaxian', 'bell', 'key'];
        const fruitIndex = Math.min(this.currentLevel - 1, fruits.length - 1);
        return fruits[fruitIndex];
    }

    /**
     * Gibt den Score-Wert für einen Fruit-Typ zurück
     * @param {string} fruitType
     * @returns {number}
     */
    getFruitScore(fruitType) {
        const scores = scoreValues?.fruit || {
            cherry: 100,
            strawberry: 300,
            orange: 500,
            apple: 700,
            melon: 1000,
            galaxian: 2000,
            bell: 3000,
            key: 5000
        };
        return scores[fruitType] || 100;
    }

    /**
     * Setzt das Level für das nächste Level zurück
     */
    nextLevel() {
        this.setLevel(this.currentLevel + 1);
    }

    /**
     * Setzt das Level zurück
     * @param {number} level - Start-Level (default: 1)
     */
    reset(level = 1) {
        this.setLevel(level);
    }

    /**
     * Gibt Level-Informationen zurück
     * @returns {Object}
     */
    getLevelInfo() {
        return {
            level: this.currentLevel,
            speedMultiplier: this.getSpeedMultiplier(),
            ghostSpeedMultiplier: this.getGhostSpeedMultiplier(),
            scoreMultiplier: this.getScoreMultiplier(),
            frightenedDuration: this.getFrightenedDuration(),
            fruitType: this.getFruitType(),
            config: this.levelConfig
        };
    }
}
