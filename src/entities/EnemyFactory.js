import {
    enemyColors,
    enemyNames,
    enemyStartPositions
} from '../config/gameConfig.js';
import {
    findNearestValidSpawn,
    validateSpawnPoint
} from '../utils/SpawnValidator.js';
import Enemy from './Enemy.js';

/**
 * Enemy Factory
 * Creates and manages enemy entities with spawn validation
 */
export class EnemyFactory {
    /**
	 * Creates all four enemies with spawn validation
	 *
	 * Behavior:
	 * - Creates Alpha, Beta, Gamma, and Delta enemies
	 * - Validates each spawn point using SpawnValidator
	 * - Falls back to nearest valid spawn if original is invalid
	 * - Throws error if no valid spawn point can be found
	 *
	 * @param {Phaser.Scene} scene - The scene to create enemies in
	 * @returns {Enemy[]} Array of four enemy entities
	 * @throws {Error} If no valid spawn point can be found for an enemy
	 */
    static createEnemies(scene) {
        const enemies = [];
        const types = [
            {
                name: 'alpha',
                pos: enemyStartPositions.alpha,
                color: enemyColors.ALPHA
            },
            { name: 'beta', pos: enemyStartPositions.beta, color: enemyColors.BETA },
            {
                name: 'gamma',
                pos: enemyStartPositions.gamma,
                color: enemyColors.GAMMA
            },
            {
                name: 'delta',
                pos: enemyStartPositions.delta,
                color: enemyColors.DELTA
            }
        ];

        for (const { name, pos, color } of types) {
            let spawnX = pos.x;
            let spawnY = pos.y;

            if (!validateSpawnPoint(pos.x, pos.y, scene.maze)) {
                const valid = findNearestValidSpawn(pos.x, pos.y, scene.maze);
                if (valid) {
                    spawnX = valid.x;
                    spawnY = valid.y;
                    console.warn(
                        `Invalid spawn point for ${name}, using (${spawnX}, ${spawnY})`
                    );
                } else {
                    throw new Error(
                        `No valid spawn point found for ${name} near (${pos.x}, ${pos.y})`
                    );
                }
            }

            const enemy = new Enemy(scene, spawnX, spawnY, name, color);
            enemies.push(enemy);
        }

        return enemies;
    }

    /**
	 * Resets all enemies to their initial state
	 *
	 * @param {Enemy[]} enemies - Array of enemy entities to reset
	 */
    static resetEnemies(enemies) {
        for (const enemy of enemies) {
            enemy.reset();
        }
    }

    /**
	 * Sets all enemies to decrypted state for specified duration
	 *
	 * Behavior:
	 * - Skips enemies that are already eaten
	 * - Reverses enemy direction when decrypted
	 * - Reduces enemy speed by 50%
	 *
	 * @param {Enemy[]} enemies - Array of enemy entities to decrypt
	 * @param {number} duration - Duration of decrypted state in seconds
	 */
    static setEnemiesDecrypted(enemies, duration) {
        for (const enemy of enemies) {
            if (!enemy.isEaten) {
                enemy.setFrightened(duration);
            }
        }
    }

    /**
	 * Filters enemies by their type
	 *
	 * @param {Enemy[]} enemies - Array of enemy entities to filter
	 * @param {string} type - Enemy type to filter by ('alpha', 'beta', 'gamma', or 'delta')
	 * @returns {Enemy[]} Array of enemies matching of specified type
	 */
    static getEnemiesByType(enemies, type) {
        return enemies.filter((enemy) => enemy.type === type);
    }
}
