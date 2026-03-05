/**
 * AIController
 * Zentraler AI Controller für alle Entity-Typen
 * Implementiert IAIController
 */

import { IAIController } from '../interfaces/IAIController.js';
import { Direction } from '../core/Direction.js';
import {
    AIStrategies,
    chooseDirectionToTarget,
    calculateTarget,
    getDistance
} from '../core/AIStrategies.js';

/**
 * Standard-Mode-Durations (in Sekunden)
 * Wie im Original-Pacman
 */
export const DEFAULT_MODE_DURATIONS = [
    { mode: 'SCATTER', duration: 7 },
    { mode: 'CHASE', duration: 20 },
    { mode: 'SCATTER', duration: 7 },
    { mode: 'CHASE', duration: 20 },
    { mode: 'SCATTER', duration: 5 },
    { mode: 'CHASE', duration: 20 },
    { mode: 'SCATTER', duration: 5 },
    { mode: 'CHASE', duration: Infinity }
];

/**
 * AI-Konfiguration für eine Entity
 */
class AIConfig {
    constructor(aiType, options = {}) {
        this.aiType = aiType;
        this.mode = options.initialMode || 'SCATTER';
        this.scatterTarget = options.scatterTarget || { x: 0, y: 0 };

        // Zustände
        this.isFrightened = false;
        this.isEaten = false;
        this.inHouse = false;

        // Timer
        this.frightenedTimer = 0;
        this.houseTimer = 0;
        this.blinkTimer = 0;
        this.isBlinking = false;

        // Eaten-Verhalten
        this.houseDuration = options.houseDuration || 2;
        this.virusCoreCenter = options.virusCoreCenter || { x: 13, y: 14 };
        this.virusCoreEntrance = options.virusCoreEntrance || { x: 13, y: 11 };

        // Speed-Multiplier (für frightened)
        this.speedMultiplier = 1.0;
    }
}

/**
 * Zentraler AI Controller
 */
export class AIController {
    /**
     * @param {IMazeAdapter} mazeAdapter - Adapter für Maze-Zugriff
     * @param {Object} config - Konfiguration
     */
    constructor(mazeAdapter, config = {}) {
        this.mazeAdapter = mazeAdapter;
        this.config = {
            modeDurations: config.modeDurations || DEFAULT_MODE_DURATIONS,
            virusCoreCenter: config.virusCoreCenter || { x: 13, y: 14 },
            virusCoreEntrance: config.virusCoreEntrance || { x: 13, y: 11 },
            frightenedDuration: config.frightenedDuration || 8,
            randomnessFactor: config.randomnessFactor || 0,
            frightenedSpeedMultiplier: config.frightenedSpeedMultiplier || 0.5,
            eatenSpeedMultiplier: config.eatenSpeedMultiplier || 2.0,
            blinkStartTime: config.blinkStartTime || 2 // Blinken beginnt 2 Sekunden vor Ende
        };

        // Map: entityId -> AIConfig
        this.aiConfigs = new Map();

        // Globaler Mode-Timer
        this.modeIndex = 0;
        this.modeTimer = 0;
        this.currentGlobalMode = 'SCATTER';
        this.isRunning = true;

        // Statistiken
        this.stats = {
            decisionsMade: 0,
            modeSwitches: 0,
            frightenedActivations: 0
        };
    }

    /**
     * Registriert eine Entity für AI
     * @param {string} entityId - Entity-ID
     * @param {string} aiType - AI-Typ (alpha, beta, gamma, delta)
     * @param {Object} options - Optionen
     */
    registerEntity(entityId, aiType, options = {}) {
        const config = new AIConfig(aiType, {
            ...options,
            virusCoreCenter: this.config.virusCoreCenter,
            virusCoreEntrance: this.config.virusCoreEntrance
        });

        this.aiConfigs.set(entityId, config);
    }

    /**
     * Entfernt eine Entity
     * @param {string} entityId - Entity-ID
     */
    unregisterEntity(entityId) {
        this.aiConfigs.delete(entityId);
    }

    /**
     * Haupt-Update-Methode
     * @param {number} deltaSeconds - Zeit seit letztem Frame
     * @param {Object} context - Kontext
     * @returns {Array<Object>} - Array von AI-Entscheidungen
     */
    update(deltaSeconds, context) {
        if (!this.isRunning) {return [];}

        // Update globalen Mode-Timer
        this.updateModeTimer(deltaSeconds);

        const decisions = [];



        for (const [entityId, aiConfig] of this.aiConfigs) {
            // Hole Entity-State aus dem Kontext
            const entity = context.getEntityState(entityId);
            if (!entity) {continue;}

            // AI macht nur Entscheidungen am Tile-Center
            if (entity.moveProgress !== 0) {continue;}

            const decision = this.makeDecision(
                entityId,
                entity,
                aiConfig,
                context
            );

            if (decision) {
                decisions.push(decision);
                this.stats.decisionsMade++;
            }
        }

        return decisions;
    }

    /**
     * Macht eine AI-Entscheidung für eine Entity
     * @param {string} entityId - Entity-ID
     * @param {Object} entity - Entity-State
     * @param {AIConfig} aiConfig - AI-Konfiguration
     * @param {Object} context - Kontext
     * @returns {Object|null}
     */
    makeDecision(entityId, entity, aiConfig, context) {
        // Update Timer
        this.updateTimers(aiConfig, context.deltaSeconds || 0);

        // Bestimme aktuellen Zustand
        const state = this.determineState(aiConfig);

        // Berechne Target basierend auf Zustand
        const target = this.calculateTargetForState(
            aiConfig,
            entity,
            state,
            context
        );

        // Hole gültige Richtungen
        const validDirections = this.mazeAdapter.getValidDirections(
            entity.gridX,
            entity.gridY
        );

        if (validDirections.length === 0) {
            return null;
        }

        // Wähle beste Richtung
        const direction = this.chooseDirectionWithRandomness(
            entity,
            target,
            validDirections
        );

        if (!direction) {
            return null;
        }

        return {
            entityId,
            direction,
            mode: state === 'normal' ? this.currentGlobalMode : state,
            aiType: aiConfig.aiType,
            target
        };
    }

    chooseDirectionWithRandomness(entity, target, validDirections) {
        if (validDirections.length === 0) {
            return null;
        }

        if (Math.random() < this.config.randomnessFactor) {
            const randomIndex = Math.floor(Math.random() * validDirections.length);
            return validDirections[randomIndex];
        }

        return chooseDirectionToTarget(
            entity,
            target,
            validDirections,
            (x1, y1, x2, y2) => this.mazeAdapter.getDistance(x1, y1, x2, y2)
        );
    }

    /**
     * Updated Timer für eine AI-Config
     * @param {AIConfig} aiConfig - AI-Konfiguration
     * @param {number} deltaSeconds - Delta-Zeit
     */
    updateTimers(aiConfig, deltaSeconds) {
        // Frightened Timer
        if (aiConfig.isFrightened) {
            aiConfig.frightenedTimer -= deltaSeconds;
            aiConfig.blinkTimer += deltaSeconds;

            // Blinken in den letzten X Sekunden
            if (aiConfig.frightenedTimer <= this.config.blinkStartTime) {
                aiConfig.isBlinking = true;
            }

            // Frightened beendet
            if (aiConfig.frightenedTimer <= 0) {
                aiConfig.isFrightened = false;
                aiConfig.frightenedTimer = 0;
                aiConfig.isBlinking = false;
                aiConfig.speedMultiplier = 1.0;
            }
        }

        // House Timer (für eaten Entities)
        if (aiConfig.inHouse) {
            aiConfig.houseTimer -= deltaSeconds;
            if (aiConfig.houseTimer <= 0) {
                this.respawnEntity(aiConfig);
            }
        }
    }

    /**
     * Bestimmt den aktuellen Zustand einer Entity
     * @param {AIConfig} aiConfig - AI-Konfiguration
     * @returns {string} - 'normal', 'frightened', 'eaten'
     */
    determineState(aiConfig) {
        if (aiConfig.isEaten) {return 'eaten';}
        if (aiConfig.isFrightened) {return 'frightened';}
        return 'normal';
    }

    /**
     * Berechnet das Target basierend auf Zustand
     * @param {AIConfig} aiConfig - AI-Konfiguration
     * @param {Object} entity - Entity-State
     * @param {string} state - Aktueller Zustand
     * @param {Object} context - Kontext
     * @returns {Object|null}
     */
    calculateTargetForState(aiConfig, entity, state, context) {
        const { player, allEntities } = context;



        switch (state) {
        case 'eaten':
            // Zurück zum Virus Core
            if (this.isAtVirusCore(entity)) {
                aiConfig.inHouse = true;
                aiConfig.houseTimer = aiConfig.houseDuration;
                return null;
            }
            return aiConfig.virusCoreCenter;

        case 'frightened':
            // Zufällige Bewegung
            return null;

        case 'normal':
        default: {
            // Verwende AI-Strategie
            const strategyContext = {
                entity,
                player,
                mode: this.currentGlobalMode,
                scatterTarget: aiConfig.scatterTarget,
                allEntities,
                virusCoreCenter: this.config.virusCoreCenter
            };

            const strategy = AIStrategies[aiConfig.aiType];
            if (strategy) {
                return strategy(strategyContext);
            }
            return null;
        }
        }
    }

    /**
     * Updated den globalen Mode-Timer
     * @param {number} deltaSeconds - Delta-Zeit
     */
    updateModeTimer(deltaSeconds) {
        if (this.modeIndex >= this.config.modeDurations.length) {
            return;
        }

        this.modeTimer += deltaSeconds;
        const currentModeConfig = this.config.modeDurations[this.modeIndex];

        if (this.modeTimer >= currentModeConfig.duration) {
            this.modeTimer = 0;
            this.modeIndex++;

            const nextModeConfig = this.config.modeDurations[this.modeIndex];
            if (nextModeConfig) {
                this.currentGlobalMode = nextModeConfig.mode;
                this.stats.modeSwitches++;

                // Kehre alle Entities um (außer frightened/eaten)
                this.reverseAllEntities();
            }
        }
    }

    /**
     * Prüft ob Entity am Virus Core ist
     * @param {Object} entity - Entity-State
     * @returns {boolean}
     */
    isAtVirusCore(entity) {
        const dx = entity.gridX - this.config.virusCoreCenter.x;
        const dy = entity.gridY - this.config.virusCoreCenter.y;
        return Math.abs(dx) <= 1 && Math.abs(dy) <= 1;
    }

    /**
     * Respawnt eine Entity nach eaten-Zustand
     * @param {AIConfig} aiConfig - AI-Konfiguration
     */
    respawnEntity(aiConfig) {
        aiConfig.isEaten = false;
        aiConfig.inHouse = false;
        aiConfig.houseTimer = 0;
        aiConfig.mode = this.currentGlobalMode;
        aiConfig.speedMultiplier = 1.0;
    }

    /**
     * Setzt frightened Zustand für eine Entity
     * @param {string} entityId - Entity-ID
     * @param {number} duration - Dauer in Sekunden
     */
    setFrightened(entityId, duration = null) {
        const aiConfig = this.aiConfigs.get(entityId);
        if (!aiConfig || aiConfig.isEaten) {return;}

        aiConfig.isFrightened = true;
        aiConfig.frightenedTimer = duration ?? this.config.frightenedDuration;
        aiConfig.isBlinking = false;
        aiConfig.blinkTimer = 0;
        aiConfig.speedMultiplier = this.config.frightenedSpeedMultiplier;

        this.stats.frightenedActivations++;
    }

    /**
     * Markiert Entity als eaten
     * @param {string} entityId - Entity-ID
     */
    setEaten(entityId) {
        const aiConfig = this.aiConfigs.get(entityId);
        if (!aiConfig) {return;}

        aiConfig.isEaten = true;
        aiConfig.isFrightened = false;
        aiConfig.frightenedTimer = 0;
        aiConfig.isBlinking = false;
        aiConfig.speedMultiplier = this.config.eatenSpeedMultiplier;
    }

    /**
     * Setzt eine Entity zurück (nach Respawn)
     * @param {string} entityId - Entity-ID
     */
    resetEntity(entityId) {
        const aiConfig = this.aiConfigs.get(entityId);
        if (!aiConfig) {return;}

        aiConfig.isEaten = false;
        aiConfig.isFrightened = false;
        aiConfig.inHouse = false;
        aiConfig.frightenedTimer = 0;
        aiConfig.houseTimer = 0;
        aiConfig.blinkTimer = 0;
        aiConfig.isBlinking = false;
        aiConfig.speedMultiplier = 1.0;
        aiConfig.mode = this.currentGlobalMode;
    }

    /**
     * Setzt den Modus einer Entity
     * @param {string} entityId - Entity-ID
     * @param {string} mode - Neuer Modus
     */
    setMode(entityId, mode) {
        const aiConfig = this.aiConfigs.get(entityId);
        if (aiConfig) {
            aiConfig.mode = mode;
        }
    }

    /**
     * Gibt die AI-Konfiguration zurück
     * @param {string} entityId - Entity-ID
     * @returns {AIConfig|null}
     */
    getAIConfig(entityId) {
        return this.aiConfigs.get(entityId) ?? null;
    }

    /**
     * Kehrt alle Entities um
     */
    reverseAllEntities() {
        // Diese Information wird vom MovementEngine verwendet
        // Wir speichern sie pro Entity
        for (const aiConfig of this.aiConfigs.values()) {
            if (!aiConfig.isFrightened && !aiConfig.isEaten) {
                // Markiere für Umkehr
                aiConfig.needsReverse = true;
            }
        }
    }

    /**
     * Prüft ob eine Entity umkehren muss
     * @param {string} entityId - Entity-ID
     * @returns {boolean}
     */
    needsReverse(entityId) {
        const aiConfig = this.aiConfigs.get(entityId);
        if (aiConfig && aiConfig.needsReverse) {
            aiConfig.needsReverse = false;
            return true;
        }
        return false;
    }

    /**
     * Reset des kompletten Controllers
     */
    reset() {
        this.modeIndex = 0;
        this.modeTimer = 0;
        this.currentGlobalMode = 'SCATTER';

        for (const aiConfig of this.aiConfigs.values()) {
            aiConfig.isFrightened = false;
            aiConfig.isEaten = false;
            aiConfig.inHouse = false;
            aiConfig.frightenedTimer = 0;
            aiConfig.houseTimer = 0;
            aiConfig.blinkTimer = 0;
            aiConfig.isBlinking = false;
            aiConfig.speedMultiplier = 1.0;
            aiConfig.mode = 'SCATTER';
            aiConfig.needsReverse = false;
        }

        this.stats = {
            decisionsMade: 0,
            modeSwitches: 0,
            frightenedActivations: 0
        };
    }

    /**
     * Pausiert den Controller
     */
    pause() {
        this.isRunning = false;
    }

    /**
     * Resumiert den Controller
     */
    resume() {
        this.isRunning = true;
    }

    /**
     * Gibt Statistiken zurück
     * @returns {Object}
     */
    getStats() {
        return { ...this.stats };
    }

    /**
     * Gibt den aktuellen globalen Mode zurück
     * @returns {string}
     */
    getCurrentMode() {
        return this.currentGlobalMode;
    }

    setModeDurations(modeDurations) {
        if (!Array.isArray(modeDurations) || modeDurations.length === 0) {
            return;
        }

        this.config.modeDurations = modeDurations.map((entry) => ({ ...entry }));
        this.modeIndex = Math.min(this.modeIndex, this.config.modeDurations.length - 1);
    }

    setRandomnessFactor(factor) {
        this.config.randomnessFactor = Math.max(0, Math.min(1, factor));
    }

    /**
     * Gibt die Anzahl registrierter Entities zurück
     * @returns {number}
     */
    getEntityCount() {
        return this.aiConfigs.size;
    }
}
