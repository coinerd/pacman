/**
 * GameModel
 * Encapsulates core game state and rules without rendering dependencies.
 */

export default class GameModel {
    constructor({
        score = 0,
        lives = 3,
        level = 1,
        highScore = 0,
        deathPauseDuration = 0,
        totalPellets = 0,
        pelletsRemaining = 0
    } = {}) {
        this.deathPauseDuration = deathPauseDuration;
        this.state = {
            score,
            lives,
            level,
            highScore,
            isPaused: false,
            isGameOver: false,
            isDying: false,
            deathTimer: 0,
            pelletsEaten: 0,
            pelletsRemaining,
            totalPellets,
            ghostsEaten: 0,
            maxComboGhosts: 0,
            currentComboGhosts: 0,
            levelDeaths: 0,
            fruitsCollected: 0,
            levelComplete: false
        };
        this.levelConfig = null;
    }

    setLevelConfig(levelConfig) {
        this.levelConfig = levelConfig;
    }

    getLevel() {
        return this.state.level;
    }

    setHighScore(highScore) {
        this.state.highScore = highScore;
    }

    setPaused(isPaused) {
        this.state.isPaused = isPaused;
    }

    togglePaused() {
        this.state.isPaused = !this.state.isPaused;
        return this.state.isPaused;
    }

    setGameOver(isGameOver) {
        this.state.isGameOver = isGameOver;
    }

    addScore(amount) {
        this.state.score += amount;
        if (this.state.score > this.state.highScore) {
            this.state.highScore = this.state.score;
        }
    }

    setPelletCounts(totalPellets) {
        this.state.totalPellets = totalPellets;
        this.state.pelletsRemaining = totalPellets;
    }

    updatePelletsRemaining(remaining) {
        this.state.pelletsRemaining = remaining;
    }

    onPelletEaten(score, pelletsRemaining) {
        this.addScore(score);
        this.state.pelletsEaten += 1;
        if (pelletsRemaining !== undefined) {
            this.state.pelletsRemaining = pelletsRemaining;
        }
    }

    onPowerPelletEaten(score, pelletsRemaining) {
        this.addScore(score);
        this.state.currentComboGhosts = 0;
        if (pelletsRemaining !== undefined) {
            this.state.pelletsRemaining = pelletsRemaining;
        }
    }

    onGhostEaten(score) {
        this.addScore(score);
        this.state.ghostsEaten += 1;
        this.state.currentComboGhosts += 1;
        this.state.maxComboGhosts = Math.max(
            this.state.maxComboGhosts,
            this.state.currentComboGhosts
        );
    }

    onPacmanDeath() {
        this.state.levelDeaths += 1;
        this.state.levelComplete = false;
    }

    onFruitEaten(score) {
        this.addScore(score);
        this.state.fruitsCollected += 1;
    }

    onLevelComplete() {
        this.state.level += 1;
        this.state.levelComplete = true;
    }

    beginDeath() {
        this.state.isDying = true;
        this.state.deathTimer = 0;
    }

    step(deltaSeconds, _inputState = null) {
        if (!this.state.isDying) {
            return null;
        }

        this.state.deathTimer += deltaSeconds;

        if (this.state.deathTimer >= this.deathPauseDuration) {
            this.state.deathTimer = 0;
            this.state.isDying = false;

            if (this.state.lives <= 0) {
                this.state.isGameOver = true;
                return { event: 'gameOver' };
            }

            this.state.lives -= 1;
            return { event: 'respawn' };
        }

        return { event: 'deathTick' };
    }

    shouldSpawnFruit(pelletThreshold) {
        const totalPellets = this.state.totalPellets;
        if (!totalPellets) {
            return false;
        }

        const eatenPercentage = ((totalPellets - this.state.pelletsRemaining) / totalPellets) * 100;
        return eatenPercentage >= pelletThreshold;
    }

    getSpeedMultiplier() {
        return 1 + (this.state.level - 1) * 0.05;
    }

    getFrightenedDuration() {
        if (!this.levelConfig) {
            return null;
        }

        return Math.max(
            2,
            this.levelConfig.frightenedDuration -
                (this.state.level - 1) * this.levelConfig.frightenedDecreasePerLevel
        );
    }

    decrementLives() {
        this.state.lives -= 1;
        return this.state.lives <= 0;
    }
}
