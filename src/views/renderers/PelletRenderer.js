/**
 * PelletRenderer
 * Handles pellet and power pellet rendering with pooling
 *
 * OPTIMIZED: Pellets werden nur einmal beim Level-Start erstellt
 * und nur bei Events entfernt - nie bei jedem Frame das Grid scannen!
 */

import { PelletPool } from '../../pools/PelletPool.js';
import { PowerPelletPool } from '../../pools/PowerPelletPool.js';
import { PELLET_TYPES } from '../../utils/MazeLayout.js';
import { GAME_EVENTS, gameEvents } from '../../core/EventBus.js';

export class PelletRenderer {
    constructor(scene) {
        this.scene = scene;
        this.pelletPool = null;
        this.powerPelletPool = null;
        this.eventUnsubscribers = [];
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
     * Create pellets from pellet grid - WIRD NUR EINMAL BEIM LEVEL-START AUFGERUFEN
     * @param {Array<Array<number>>} pelletGrid - 2D pellet grid
     */
    createPellets(pelletGrid) {
        if (!pelletGrid) {
            return;
        }

        // Erstelle alle Pellets einmalig beim Start
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

        // Setup Event Listener für Pellet-Essen
        this.setupEventListeners();
    }

    /**
     * Setup event listeners for pellet removal
     */
    setupEventListeners() {
        // PELLET_EATEN Event - entferne das gefressene Pellet
        this.eventUnsubscribers.push(
            gameEvents.on(GAME_EVENTS.PELLET_EATEN, (data) => {
                if (data && data.gridX !== undefined && data.gridY !== undefined) {
                    this.removePelletAt(data.gridX, data.gridY, 'pellet');
                }
            })
        );

        // POWER_PELLET_EATEN Event - entferne das gefressene Power-Pellet
        this.eventUnsubscribers.push(
            gameEvents.on(GAME_EVENTS.POWER_PELLET_EATEN, (data) => {
                if (data && data.gridX !== undefined && data.gridY !== undefined) {
                    this.removePelletAt(data.gridX, data.gridY, 'power_pellet');
                }
            })
        );
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
     * DEPRECATED: Wird nicht mehr bei jedem Frame aufgerufen!
     * Pellets werden nur via Events entfernt.
     * Diese Methode bleibt für Kompatibilität aber macht nichts mehr.
     */
    updatePelletVisuals(pelletGrid) {
        // NOP - Pellets werden nur einmal erstellt und via Events entfernt
        // Kein Grid-Scanning mehr bei jedem Frame!
    }

    /**
     * Remove a pellet at the specified grid position
     * Wird aufgerufen wenn ein Pellet gefressen wurde (via Event)
     * @param {number} gridX - Grid X position
     * @param {number} gridY - Grid Y position
     * @param {string} type - Pellet type ('pellet' or 'power_pellet')
     * @returns {boolean} True if pellet was removed
     */
    removePelletAt(gridX, gridY, type) {
        if (type === 'power_pellet' || type === 'powerPellet') {
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
     * Release all pellets (alias for clearAllPellets for compatibility)
     */
    releaseAll() {
        this.clearAllPellets();
    }

    /**
     * Clean up renderer resources
     */
    cleanup() {
        // Unsubscribe event listeners
        this.eventUnsubscribers.forEach(unsubscribe => unsubscribe());
        this.eventUnsubscribers = [];

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
