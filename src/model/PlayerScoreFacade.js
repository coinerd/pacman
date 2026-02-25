/**
 * PlayerScoreFacade
 * Read-only access to player/score HUD state and command-oriented score/player updates.
 */
export class PlayerScoreFacade {
    /**
     * @param {Object} gameModel - GameModel instance
     */
    constructor(gameModel) {
        this.gameModel = gameModel;
    }

    /**
     * Read-only player/session state for UI and input guards.
     * @returns {{lives:number,level:number,isPaused:boolean,isGameOver:boolean,isDying:boolean}}
     */
    getPlayerState() {
        return Object.freeze({
            lives: this.gameModel?.lives ?? 0,
            level: this.gameModel?.level ?? 1,
            isPaused: Boolean(this.gameModel?.isPaused),
            isGameOver: Boolean(this.gameModel?.isGameOver),
            isDying: Boolean(this.gameModel?.isDying)
        });
    }

    /**
     * Read-only scoring state for HUD.
     * @returns {{score:number,highScore:number,combo:number,lives:number}}
     */
    getScoreState() {
        return Object.freeze({
            score: this.gameModel?.score ?? 0,
            highScore: this.gameModel?.highScore ?? 0,
            combo: this.gameModel?.currentComboGhosts ?? 0,
            lives: this.gameModel?.lives ?? 0
        });
    }

    /**
     * Build an immutable HUD snapshot.
     * @returns {{score:number,highScore:number,combo:number,lives:number,level:number}}
     */
    toHudSnapshot() {
        const scoreState = this.getScoreState();
        const playerState = this.getPlayerState();

        return Object.freeze({
            score: scoreState.score,
            highScore: scoreState.highScore,
            combo: scoreState.combo,
            lives: scoreState.lives,
            level: playerState.level
        });
    }

    /**
     * Command: pellet eaten.
     * @param {{score?:number,pelletsRemaining?:number,isPowerPellet?:boolean,frightenedDuration?:number}} payload
     * @returns {{score:number,highScore:number,combo:number,lives:number}}
     */
    onPelletEaten(payload = {}) {
        const event = {
            type: payload.isPowerPellet ? 'power_pellet_eaten' : 'pellet_eaten',
            score: payload.score ?? 0,
            frightenedDuration: payload.frightenedDuration
        };

        this.gameModel?.applyCollisionEffect?.(event);

        if (payload.pelletsRemaining !== undefined && this.gameModel) {
            this.gameModel.pelletsRemaining = payload.pelletsRemaining;
        }

        return this.getScoreState();
    }

    /**
     * Command: ghost eaten.
     * @param {{score?:number,combo?:number}} payload
     * @returns {{score:number,highScore:number,combo:number,lives:number}}
     */
    onGhostEaten(payload = {}) {
        this.gameModel?.applyCollisionEffect?.({
            type: 'ghost_eaten',
            score: payload.score ?? 0,
            combo: payload.combo
        });
        return this.getScoreState();
    }

    /**
     * Command: fruit eaten.
     * @param {{score?:number}} payload
     * @returns {{score:number,highScore:number,combo:number,lives:number}}
     */
    onFruitEaten(payload = {}) {
        this.gameModel?.applyCollisionEffect?.({
            type: 'fruit_eaten',
            score: payload.score ?? 0
        });
        return this.getScoreState();
    }

    /**
     * Command: player death.
     * @returns {{lives:number,level:number,isPaused:boolean,isGameOver:boolean,isDying:boolean}}
     */
    onPlayerDeath() {
        this.gameModel?.applyCollisionEffect?.({ type: 'pacman_died' });
        return this.getPlayerState();
    }
}

export default PlayerScoreFacade;
