import { playerStartPosition } from '../../config/gameConfig.js';
import { PlayerState } from '../entities/PlayerState.js';

/**
 * Handles player lifecycle state transitions.
 */
export default class PlayerModule {
    /**
     * @param {Object} options
     * @param {number} [options.level=1]
     * @param {Object} [options.spawnPoint]
     */
    constructor(options = {}) {
        this.level = options.level ?? 1;
        this.spawnPoint = options.spawnPoint || playerStartPosition;
        this.isDying = false;
    }

    /**
     * Updates current level to keep newly-created players in sync.
     * @param {number} level
     */
    setLevel(level) {
        this.level = level;
    }

    /**
     * Update player spawn position.
     * @param {{x:number,y:number}} spawnPoint
     */
    setSpawnPoint(spawnPoint) {
        this.spawnPoint = spawnPoint || playerStartPosition;
    }

    /**
     * Creates a new player for the current level.
     * @returns {PlayerState}
     */
    createPlayer() {
        return new PlayerState(this.spawnPoint.x, this.spawnPoint.y, this.level);
    }

    /**
     * Handles death lifecycle transition.
     * @param {PlayerState} player
     */
    onPacmanDeath(player) {
        this.isDying = true;
        player?.die();
    }

    /**
     * Resets player state/position after death.
     * @param {PlayerState} player
     */
    resetPlayer(player) {
        this.isDying = false;
        player?.reset(this.spawnPoint.x, this.spawnPoint.y);
    }

    /**
     * @param {boolean} isDying
     */
    setDying(isDying) {
        this.isDying = Boolean(isDying);
    }
}
