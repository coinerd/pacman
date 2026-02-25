/**
 * Owns round/session progression state.
 */
export default class SessionModule {
    /**
     * @param {Object} config
     * @param {number} [config.level=1]
     * @param {number} [config.lives=3]
     */
    constructor(config = {}) {
        this.level = config.level || 1;
        this.lives = config.lives ?? 3;
        this.isPaused = false;
        this.isGameOver = false;
        this.levelComplete = false;
        this.levelDeaths = 0;
    }

    setPaused(isPaused) {
        this.isPaused = Boolean(isPaused);
        return this.isPaused;
    }

    togglePaused() {
        this.isPaused = !this.isPaused;
        return this.isPaused;
    }

    setGameOver(isGameOver) {
        this.isGameOver = Boolean(isGameOver);
    }

    onPacmanDeath() {
        this.levelDeaths++;
        this.levelComplete = false;
    }

    consumeLife() {
        this.lives--;
        return this.lives;
    }

    markLevelComplete() {
        this.levelComplete = true;
    }

    startNextLevel() {
        this.level++;
        this.levelComplete = false;
    }

    getSnapshot() {
        return {
            level: this.level,
            lives: this.lives,
            isPaused: this.isPaused,
            isGameOver: this.isGameOver,
            levelComplete: this.levelComplete,
            levelDeaths: this.levelDeaths
        };
    }
}
