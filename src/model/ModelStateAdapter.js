/**
 * ModelStateAdapter
 * Syncs between Phaser visual entities and model entities.
 * Allows the model collision system to work with existing Phaser entities.
 */

import { directions } from '../config/gameConfig.js';
import { GameState } from './GameState.js';

export class ModelStateAdapter {
    /**
	 * @param {GameState} modelState - The model game state
	 */
    constructor(modelState) {
        this.modelState = modelState;
        this.visualEntities = {
            pacman: null,
            enemies: [],
            fruit: null
        };
    }

    /**
	 * Register visual entities for syncing
	 * @param {Object} entities - Visual entities from PhaserGameView
	 */
    registerVisualEntities(entities) {
        if (entities.pacman) {
            this.visualEntities.pacman = entities.pacman;
        }
        if (entities.ghosts) {
            this.visualEntities.enemies = entities.ghosts;
        }
        if (entities.enemies) {
            this.visualEntities.enemies = entities.enemies;
        }
        if (entities.fruit) {
            this.visualEntities.fruit = entities.fruit;
        }
    }

    /**
	 * Sync positions from visual entities to model entities
	 * Call this BEFORE collision detection
	 */
    syncToModel() {
        this.syncPacmanToModel();
        this.syncGhostsToModel();
        this.syncFruitToModel();
    }

    /**
	 * Sync model entity state to visual entities
	 * Call this AFTER model update (optional - for headless-driven visuals)
	 */
    syncFromModel() {
        // When using model-driven movement, this syncs model -> visual
        // Currently we sync visual -> model for collision
        // Future: model drives visuals
    }

    /**
	 * Sync Pacman from visual to model
	 */
    syncPacmanToModel() {
        const visual = this.visualEntities.pacman;
        const model = this.modelState.pacman;

        if (!visual || !model) {
            return;
        }

        // Store previous positions for swept collision
        model.prevX = model.x;
        model.prevY = model.y;
        model.prevGridX = model.gridX;
        model.prevGridY = model.gridY;

        // Sync current positions
        model.x = visual.x;
        model.y = visual.y;
        model.gridX = Math.round(model.x / 16); // Assuming tileSize 16
        model.gridY = Math.round(model.y / 16);

        // Sync direction
        if (visual.direction && visual.direction !== model.direction) {
            model.direction = visual.direction;
        }

        // Sync death state
        if (visual.isDying !== undefined) {
            model.isDying = visual.isDying;
        }

        // Sync movement state
        model.isMoving = visual.isMoving !== false;
    }

    /**
	 * Sync Ghosts from visual to model
	 */
    syncGhostsToModel() {
        const visualGhosts =
			this.visualEntities.ghosts || this.visualEntities.enemies || [];

        for (
            let i = 0;
            i < visualGhosts.length && i < this.modelState.ghosts.length;
            i++
        ) {
            const visual = visualGhosts[i];
            const model = this.modelState.ghosts[i];

            if (!visual || !model) {
                continue;
            }

            // Store previous positions
            model.prevX = model.x;
            model.prevY = model.y;
            model.prevGridX = model.gridX;
            model.prevGridY = model.gridY;

            // Sync current positions
            model.x = visual.x;
            model.y = visual.y;
            model.gridX = Math.round(model.x / 16);
            model.gridY = Math.round(model.y / 16);

            // Sync state flags
            if (visual.isFrightened !== undefined) {
                model.isFrightened = visual.isFrightened;
            }
            if (visual.isEaten !== undefined) {
                model.isEaten = visual.isEaten;
            }
            if (visual.isBlinking !== undefined) {
                model.isBlinking = visual.isBlinking;
            }
            if (visual.inGhostHouse !== undefined) {
                model.inGhostHouse = visual.inGhostHouse;
            }

            // Sync mode if present
            if (visual.mode) {
                model.mode = visual.mode;
            }

            // Sync direction
            if (visual.direction && visual.direction !== model.direction) {
                model.direction = visual.direction;
            }
        }
    }

    /**
	 * Sync Fruit from visual to model
	 */
    syncFruitToModel() {
        const visual = this.visualEntities.fruit;
        const model = this.modelState.fruit;

        if (!visual || !model) {
            return;
        }

        // Sync position
        model.x = visual.x;
        model.y = visual.y;

        // Sync active state
        if (visual.active !== undefined) {
            model.active = visual.active;
        }

        // Sync timer if model has one
        if (visual.timer !== undefined && model.timer !== undefined) {
            model.timer = visual.timer;
        }
    }

    /**
	 * Apply model collision results to visual entities
	 * @param {Array<Object>} events - Collision events from model
	 */
    applyCollisionResults(events) {
        for (const event of events) {
            switch (event.type) {
            case 'ghost_eaten':
                this.handleGhostEaten(event);
                break;
            case 'pacman_died':
                this.handlePacmanDied(event);
                break;
            case 'fruit_eaten':
                this.handleFruitEaten(event);
                break;
				// Pellet events handled by pellet pool
            }
        }
    }

    /**
	 * Handle ghost eaten event
	 * @param {Object} event - Ghost eaten event
	 */
    handleGhostEaten(event) {
        const visualGhosts =
			this.visualEntities.ghosts || this.visualEntities.enemies || [];

        const visualGhost = visualGhosts.find(
            (g) => g.ghostType === event.ghostType
        );

        if (visualGhost && visualGhost.eat) {
            visualGhost.eat();
        }
    }

    /**
	 * Handle pacman died event
	 * @param {Object} event - Pacman died event
	 */
    handlePacmanDied(event) {
        const visualPacman = this.visualEntities.pacman;

        if (visualPacman && visualPacman.die) {
            visualPacman.die();
        }
    }

    /**
	 * Handle fruit eaten event
	 * @param {Object} event - Fruit eaten event
	 */
    handleFruitEaten(event) {
        const visualFruit = this.visualEntities.fruit;

        if (visualFruit && visualFruit.deactivate) {
            visualFruit.deactivate();
        }
    }

    /**
	 * Update model state directly (for AI/replay input)
	 * @param {Object} update - Update to apply
	 */
    applyDirectUpdate(update) {
        if (update.pacman) {
            Object.assign(this.modelState.pacman, update.pacman);
        }

        if (update.ghosts) {
            for (const ghostUpdate of update.ghosts) {
                const ghost = this.modelState.getGhostByType(ghostUpdate.ghostType);
                if (ghost) {
                    Object.assign(ghost, ghostUpdate);
                }
            }
        }
    }

    /**
	 * Get model state for external systems
	 * @returns {GameState}
	 */
    getModelState() {
        return this.modelState;
    }
}
