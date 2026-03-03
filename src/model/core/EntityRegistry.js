/**
 * EntityRegistry
 * Zentralisierte Entity-Verwaltung.
 * Verwaltet alle Entities (Player, Ghosts, Fruit) und deren Lebenszyklus.
 */

import { PlayerState } from '../entities/PlayerState.js';
import { EnemyState } from '../entities/EnemyState.js';
import { FruitState } from '../entities/FruitState.js';
import { directions, enemyStartPositions, playerStartPosition } from '../../config/gameConfig.js';

export class EntityRegistry {
    /**
     * @param {Object} config - Konfiguration
     * @param {number} config.level - Aktuelles Level
     * @param {Object} config.spawnPoints - Spawn-Punkte
     */
    constructor(config = {}) {
        this.level = config.level || 1;
        this.spawnPoints = config.spawnPoints || {};

        // Entities
        this.pacman = null;
        this.ghosts = [];
        this.fruit = null;

        // Entity State Tracking (für View Events)
        this.lastPacmanDirection = null;
        this.lastGhostModes = new Map(); // ghostType -> mode
    }

    // === Entity-Erstellung ===

    createPacman() {
        const spawnPoint = this.spawnPoints?.player || playerStartPosition;
        this.pacman = new PlayerState(spawnPoint.x, spawnPoint.y, {
            speed: 100 + (this.level - 1) * 5, // 5% speed increase per level
            type: 'player'
        });
        this.lastPacmanDirection = this.pacman.direction;
        return this.pacman;
    }

    createGhosts() {
        const ghostTypes = ['alpha', 'beta', 'gamma', 'delta'];
        const ghosts = [];

        for (const enemyType of ghostTypes) {
            const pos = enemyStartPositions[enemyType];
            if (pos) {
                const ghost = new EnemyState(pos.x, pos.y, enemyType, this.level);
                ghosts.push(ghost);
                this.lastGhostModes.set(enemyType, ghost.mode);
            }
        }

        this.ghosts = ghosts;
        return ghosts;
    }

    createFruit() {
        this.fruit = new FruitState(0, 0, {
            type: 'fruit'
        });
        return this.fruit;
    }

    // === Entity-Zugriff ===

    getPacman() {
        return this.pacman;
    }

    getGhosts() {
        return this.ghosts;
    }

    getGhostByType(ghostType) {
        return this.ghosts.find(g => g.ghostType === ghostType) || null;
    }

    getFruit() {
        return this.fruit;
    }

    getAllEntities() {
        const entities = [];
        if (this.pacman) {entities.push(this.pacman);}
        entities.push(...this.ghosts);
        if (this.fruit) {entities.push(this.fruit);}
        return entities;
    }

    // === Entity-Updates ===

    updateAllEntities(deltaSeconds, maze) {
        this.pacman?.update(deltaSeconds, maze);
        this.ghosts.forEach(ghost => ghost.update(deltaSeconds, maze));
        this.fruit?.update(deltaSeconds);
    }

    // === Entity-State Tracking ===

    trackPacmanDirectionChange() {
        if (!this.pacman) {return null;}

        const currentDirection = this.pacman.direction;
        if (this.lastPacmanDirection !== currentDirection) {
            const previousDirection = this.lastPacmanDirection;
            this.lastPacmanDirection = currentDirection;
            return { previousDirection, currentDirection };
        }
        return null;
    }

    trackGhostModeChange(ghost) {
        if (!ghost) {return null;}

        const ghostType = ghost.ghostType;
        const lastMode = this.lastGhostModes.get(ghostType);
        const currentMode = ghost.mode;

        if (lastMode !== currentMode) {
            this.lastGhostModes.set(ghostType, currentMode);
            return { ghostType, previousMode: lastMode, currentMode };
        }
        return null;
    }

    // === Entity-Positionen ===

    resetPositions() {
        const playerSpawn = this.spawnPoints?.player || playerStartPosition;
        this.pacman?.reset(playerSpawn.x, playerSpawn.y);

        for (const ghost of this.ghosts) {
            const pos = enemyStartPositions[ghost.ghostType];
            if (pos) {
                ghost.reset(pos.x, pos.y);
            }
        }

        this.fruit?.reset();
    }

    // === Entity-Lifecycle ===

    destroyAll() {
        this.pacman = null;
        this.ghosts = [];
        this.fruit = null;
        this.lastPacmanDirection = null;
        this.lastGhostModes.clear();
    }

    // === PHASE 6: Generic Entity Access (for DI) ===

    /**
     * Get a single entity by name
     * @param {string} name - Entity name ('pacman', 'gameState', 'pelletGrid', etc.)
     * @returns {Object|null}
     */
    getEntity(name) {
        switch (name) {
        case 'pacman':
            return this.pacman;
        case 'ghost':
            return this.ghosts[0]; // First ghost (for compatibility)
        case 'fruit':
            return this.fruit;
        case 'gameState':
        case 'pelletGrid':
            return this._genericEntities?.get(name) || null;
        default:
            return null;
        }
    }

    /**
     * Get multiple entities by type
     * @param {string} type - Entity type ('ghost', etc.)
     * @returns {Array}
     */
    getEntities(type) {
        switch (type) {
        case 'ghost':
            return [...this.ghosts];
        default:
            return [];
        }
    }

    /**
     * Register a generic entity (for DI)
     * @param {string} name - Entity name
     * @param {Object} entity - Entity object
     */
    registerEntity(name, entity) {
        if (!this._genericEntities) {
            this._genericEntities = new Map();
        }
        this._genericEntities.set(name, entity);
    }

    // === Entity-State Snapshot ===

    getEntitySnapshot() {
        return {
            pacman: this.pacman?.getSnapshot(),
            ghosts: this.ghosts.map(g => g.getSnapshot()),
            fruit: this.fruit?.getSnapshot()
        };
    }
}
