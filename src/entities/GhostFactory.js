import Ghost from './Ghost.js';
import { ghostColors, ghostNames, ghostStartPositions } from '../config/gameConfig.js';
import { validateSpawnPoint, findNearestValidSpawn } from '../utils/SpawnValidator.js';

/**
 * Ghost Factory
 * Creates and manages ghost entities with spawn validation
 */
export class GhostFactory {
    /**
     * Creates all four ghosts with spawn validation
     *
     * Behavior:
     * - Creates Blinky, Pinky, Inky, and Clyde ghosts
     * - Validates each spawn point using SpawnValidator
     * - Falls back to nearest valid spawn if original is invalid
     * - Throws error if no valid spawn point can be found
     *
     * @param {Phaser.Scene} scene - The scene to create ghosts in
     * @returns {Ghost[]} Array of four ghost entities
     * @throws {Error} If no valid spawn point can be found for a ghost
     */
    static createGhosts(scene) {
        const ghosts = [];
        const types = [
            { name: 'blinky', pos: ghostStartPositions.blinky, color: ghostColors.BLINKY },
            { name: 'pinky', pos: ghostStartPositions.pinky, color: ghostColors.PINKY },
            { name: 'inky', pos: ghostStartPositions.inky, color: ghostColors.INKY },
            { name: 'clyde', pos: ghostStartPositions.clyde, color: ghostColors.CLYDE }
        ];

        for (const { name, pos, color } of types) {
            let spawnX = pos.x;
            let spawnY = pos.y;

            if (!validateSpawnPoint(pos.x, pos.y, scene.maze)) {
                const valid = findNearestValidSpawn(pos.x, pos.y, scene.maze);
                if (valid) {
                    spawnX = valid.x;
                    spawnY = valid.y;
                    console.warn(`Invalid spawn point for ${name}, using (${spawnX}, ${spawnY})`);
                } else {
                    throw new Error(`No valid spawn point found for ${name} near (${pos.x}, ${pos.y})`);
                }
            }

            const ghost = new Ghost(scene, spawnX, spawnY, name, color);
            ghosts.push(ghost);
        }

        return ghosts;
    }

    /**
     * Resets all ghosts to their initial state
     *
     * @param {Ghost[]} ghosts - Array of ghost entities to reset
     */
    static resetGhosts(ghosts) {
        for (const ghost of ghosts) {
            ghost.reset();
        }
    }

    /**
     * Sets all ghosts to frightened state for specified duration
     *
     * Behavior:
     * - Skips ghosts that are already eaten
     * - Reverses ghost direction when frightened
     * - Reduces ghost speed by 50%
     *
     * @param {Ghost[]} ghosts - Array of ghost entities to frighten
     * @param {number} duration - Duration of frightened state in seconds
     */
    static setGhostsFrightened(ghosts, duration) {
        for (const ghost of ghosts) {
            if (!ghost.isEaten) {
                ghost.setFrightened(duration);
            }
        }
    }

    /**
     * Filters ghosts by their type
     *
     * @param {Ghost[]} ghosts - Array of ghost entities to filter
     * @param {string} type - Ghost type to filter by ('blinky', 'pinky', 'inky', or 'clyde')
     * @returns {Ghost[]} Array of ghosts matching the specified type
     */
    static getGhostsByType(ghosts, type) {
        return ghosts.filter(ghost => ghost.type === type);
    }
}
