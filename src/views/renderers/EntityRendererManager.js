/**
 * EntityRendererManager
 * Manages and synchronizes all entity renderers (player, ghosts, fruit)
 */

import { PlayerRenderer } from '../../view/components/PlayerRenderer.js';
import { GhostRenderer } from '../../view/components/GhostRenderer.js';
import { FruitRenderer } from '../../view/components/FruitRenderer.js';

export class EntityRendererManager {
    constructor(scene) {
        this.scene = scene;

        // Entity renderers
        this.playerRenderer = null;
        this.ghostRenderers = new Map(); // ghostType -> GhostRenderer
        this.fruitRenderer = null;
    }

    /**
     * Create entity renderers from snapshot data
     * @param {Object} snapshot - Game snapshot with entity data
     * @returns {boolean} - True if successful
     */
    createRenderersFromSnapshot(snapshot) {
        if (!snapshot.pacman || !snapshot.ghosts || !snapshot.fruit) {
            console.warn('[EntityRendererManager] Cannot create renderers from snapshot - missing data');
            return false;
        }

        // Create PlayerRenderer from snapshot data
        this.playerRenderer = new PlayerRenderer(this.scene, snapshot.pacman);

        // Create GhostRenderer for each ghost from snapshot data
        for (const ghostData of snapshot.ghosts) {
            const ghostRenderer = new GhostRenderer(this.scene, ghostData);
            this.ghostRenderers.set(ghostData.ghostType, ghostRenderer);
        }

        // Create FruitRenderer from snapshot data
        this.fruitRenderer = new FruitRenderer(this.scene, snapshot.fruit);

        return true;
    }

    /**
     * Create entity renderers from legacy model data
     * @param {Object} gameModel - Legacy game model
     * @returns {boolean} - True if successful
     */
    createRenderersFromModel(gameModel) {
        const pacmanData = gameModel?.pacman;
        const ghostsData = gameModel?.ghosts;
        const fruitData = gameModel?.fruit;

        if (!pacmanData || !ghostsData || !fruitData) {
            console.warn('[EntityRendererManager] Cannot create renderers from model - missing data');
            return false;
        }

        // Create PlayerRenderer from model data
        this.playerRenderer = new PlayerRenderer(this.scene, pacmanData);

        // Create GhostRenderer for each ghost from model data
        for (const ghostData of ghostsData) {
            const ghostRenderer = new GhostRenderer(this.scene, ghostData);
            this.ghostRenderers.set(ghostData.ghostType, ghostRenderer);
        }

        // Create FruitRenderer from model data
        this.fruitRenderer = new FruitRenderer(this.scene, fruitData);

        return true;
    }

    /**
     * Update all entity renderers from snapshot
     * @param {Object} snapshot - Game snapshot with entity data
     */
    updateFromSnapshot(snapshot) {
        // Update player renderer
        if (this.playerRenderer && snapshot.pacman) {
            this.playerRenderer.update(snapshot.pacman);
        }

        // Update ghost renderers
        if (snapshot.ghosts) {
            for (const ghostData of snapshot.ghosts) {
                const ghostRenderer = this.ghostRenderers.get(ghostData.ghostType);
                if (ghostRenderer) {
                    ghostRenderer.update(ghostData);
                } else {
                    // Create new ghost renderer if needed
                    const newRenderer = new GhostRenderer(this.scene, ghostData);
                    this.ghostRenderers.set(ghostData.ghostType, newRenderer);
                }
            }
        }

        // Update fruit renderer
        if (this.fruitRenderer && snapshot.fruit) {
            this.fruitRenderer.update(snapshot.fruit);
        }
    }

    /**
     * Get player renderer
     * @returns {PlayerRenderer|null}
     */
    getPlayerRenderer() {
        return this.playerRenderer;
    }

    /**
     * Get ghost renderer by ghost type
     * @param {string} ghostType - Ghost type
     * @returns {GhostRenderer|null}
     */
    getGhostRenderer(ghostType) {
        return this.ghostRenderers.get(ghostType);
    }

    /**
     * Get all ghost renderers
     * @returns {Array<GhostRenderer>}
     */
    getAllGhostRenderers() {
        return Array.from(this.ghostRenderers.values());
    }

    /**
     * Get fruit renderer
     * @returns {FruitRenderer|null}
     */
    getFruitRenderer() {
        return this.fruitRenderer;
    }

    /**
     * Check if entity renderers exist
     * @returns {boolean}
     */
    hasRenderers() {
        return this.playerRenderer !== null &&
               this.ghostRenderers.size > 0 &&
               this.fruitRenderer !== null;
    }

    /**
     * Clean up all entity renderers
     */
    cleanup() {
        if (this.playerRenderer) {
            this.playerRenderer.destroy();
            this.playerRenderer = null;
        }

        for (const ghostRenderer of this.ghostRenderers.values()) {
            ghostRenderer.destroy();
        }
        this.ghostRenderers.clear();

        if (this.fruitRenderer) {
            this.fruitRenderer.destroy();
            this.fruitRenderer = null;
        }
    }
}
