/**
 * PelletRenderer
 * Handles pellet and power pellet rendering with pooling
 */

import { PelletPool } from '../../pools/PelletPool.js';
import { PowerPelletPool } from '../../pools/PowerPelletPool.js';
import { PELLET_TYPES } from '../../utils/MazeLayout.js';
import { gameConfig } from '../../config/gameConfig.js';

export class PelletRenderer {
    constructor(scene) {
        this.scene = scene;
        this.pelletPool = null;
        this.powerPelletPool = null;
        // Cache für Grid-Hash um unnötige Updates zu vermeiden
        this.lastPelletGridHash = null;
        this.pelletCount = 0;
    }

    /**
     * Initialize pellet pools
     */
    createPelletPools() {
        this.pelletPool = new PelletPool(this.scene);
        this.powerPelletPool = new PowerPelletPool(this.scene);
        this.pelletPool.init();
        this.powerPelletPool.init(4);
    }

    /**
     * Create pellets from pellet grid
     * @param {Array<Array<number>>} pelletGrid - 2D pellet grid
     */
    createPellets(pelletGrid) {
        if (!pelletGrid) {
            return;
        }

        for (let y = 0; y < pelletGrid.length; y++) {
            for (let x = 0; x < pelletGrid[y].length; x++) {
                const pelletType = pelletGrid[y][x];

                if (pelletType === PELLET_TYPES.PELLET) {
                    this.pelletPool.get(x, y);
                } else if (pelletType === PELLET_TYPES.POWER_PELLET) {
                    this.createPowerPellet(x, y);
                }
            }
        }
    }

    /**
     * Create a power pellet with pulse animation
     * @param {number} x - Grid X position
     * @param {number} y - Grid Y position
     */
    createPowerPellet(x, y) {
        const powerPellet = this.powerPelletPool.get(x, y);

        // Add pulse animation
        this.scene.tweens.add({
            targets: powerPellet,
            scale: { from: 1, to: 1.5 },
            alpha: { from: 1, to: 0.7 },
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    /**
     * OPTIMIZED: Update pellet visuals based on current pellet grid
     * Uses hash comparison to avoid processing unchanged grids
     * @param {Array<Array<number>>} pelletGrid - Current pellet grid
     */
    updatePelletVisuals(pelletGrid) {
        if (!pelletGrid) {
            return;
        }

        // OPTIMIZATION: Quick count check first
        let currentPelletCount = 0;
        let powerPelletCount = 0;
        for (let y = 0; y < pelletGrid.length; y++) {
            for (let x = 0; x < pelletGrid[y].length; x++) {
                const type = pelletGrid[y][x];
                if (type === PELLET_TYPES.PELLET) {currentPelletCount++;}
                else if (type === PELLET_TYPES.POWER_PELLET) {powerPelletCount++;}
            }
        }

        // If counts match, grid likely hasn't changed - skip expensive update
        const activePellets = this.pelletPool.active.length;
        const activePowerPellets = this.powerPelletPool.active.length;

        if (currentPelletCount === activePellets && powerPelletCount === activePowerPellets) {
            return; // Nothing changed, skip update
        }

        // Remove pellets that are no longer in the grid
        const pelletsToRemove = this.findPelletsToRemove(pelletGrid);

        // Remove outdated pellets
        for (const { pellet, pool } of pelletsToRemove) {
            pool.release(pellet);
        }

        // Add new pellets from grid
        this.addNewPellets(pelletGrid);
    }

    /**
     * Find pellets that should be removed
     * @param {Array<Array<number>>} pelletGrid - Current pellet grid
     * @returns {Array<{pellet: Object, pool: Object}>}
     */
    findPelletsToRemove(pelletGrid) {
        const pelletsToRemove = [];

        // Check regular pellets
        for (const pellet of [...this.pelletPool.active]) {
            const gridX = Math.floor(pellet.x / gameConfig.tileSize);
            const gridY = Math.floor(pellet.y / gameConfig.tileSize);

            if (!this.pelletExistsAt(gridX, gridY, pelletGrid, PELLET_TYPES.PELLET)) {
                pelletsToRemove.push({ pellet, pool: this.pelletPool });
            }
        }

        // Check power pellets
        for (const pellet of [...this.powerPelletPool.active]) {
            const gridX = Math.floor(pellet.x / gameConfig.tileSize);
            const gridY = Math.floor(pellet.y / gameConfig.tileSize);

            if (!this.pelletExistsAt(gridX, gridY, pelletGrid, PELLET_TYPES.POWER_PELLET)) {
                pelletsToRemove.push({ pellet, pool: this.powerPelletPool });
            }
        }

        return pelletsToRemove;
    }

    /**
     * Check if a pellet of the specified type exists at the given grid position
     * @param {number} gridX - Grid X position
     * @param {number} gridY - Grid Y position
     * @param {Array<Array<number>>} pelletGrid - Pellet grid
     * @param {number} pelletType - Expected pellet type
     * @returns {boolean}
     */
    pelletExistsAt(gridX, gridY, pelletGrid, pelletType) {
        if (gridY < 0 || gridY >= pelletGrid.length ||
            gridX < 0 || gridX >= pelletGrid[0].length) {
            return false;
        }
        return pelletGrid[gridY][gridX] === pelletType;
    }

    /**
     * Add new pellets from the grid that don't exist yet
     * @param {Array<Array<number>>} pelletGrid - Current pellet grid
     */
    addNewPellets(pelletGrid) {
        for (let y = 0; y < pelletGrid.length; y++) {
            for (let x = 0; x < pelletGrid[y].length; x++) {
                const pelletType = pelletGrid[y][x];

                if (pelletType === PELLET_TYPES.PELLET) {
                    // Check if pellet already exists in pool
                    if (!this.pelletPool.getByGrid(x, y)) {
                        this.pelletPool.get(x, y);
                    }
                } else if (pelletType === PELLET_TYPES.POWER_PELLET) {
                    // Check if power pellet already exists in pool
                    if (!this.powerPelletPool.getByGrid(x, y)) {
                        this.createPowerPellet(x, y);
                    }
                }
            }
        }
    }

    /**
     * Clear all pellets
     */
    clearAllPellets() {
        if (this.pelletPool) {
            this.pelletPool.releaseAll?.();
        }
        if (this.powerPelletPool) {
            this.powerPelletPool.releaseAll?.();
        }
    }

    /**
     * Remove a pellet at the specified grid position
     * @param {number} gridX - Grid X position
     * @param {number} gridY - Grid Y position
     * @param {string} type - Pellet type ('pellet' or 'power_pellet')
     * @returns {boolean} True if pellet was removed
     */
    removePelletAt(gridX, gridY, type) {
        if (type === 'power_pellet') {
            const pellet = this.powerPelletPool?.getByGrid(gridX, gridY);
            if (pellet) {
                this.powerPelletPool.release(pellet);
                return true;
            }
        } else {
            const pellet = this.pelletPool?.getByGrid(gridX, gridY);
            if (pellet) {
                this.pelletPool.release(pellet);
                return true;
            }
        }
        return false;
    }

    /**
     * Release all pellets (alias for clearAllPellets for compatibility)
     */
    releaseAll() {
        this.clearAllPellets();
    }

    /**
     * Clean up renderer resources
     */
    cleanup() {
        this.clearAllPellets();
        if (this.pelletPool) {
            this.pelletPool.destroy?.();
        }
        if (this.powerPelletPool) {
            this.powerPelletPool.destroy?.();
        }
        this.pelletPool = null;
        this.powerPelletPool = null;
    }
}
