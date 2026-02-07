/**
 * GameModel
 * Encapsulates core game state and rules without rendering dependencies.
 * This model must remain free of Phaser objects and scene references.
 */

import { gameEvents, GAME_EVENTS } from './EventBus.js';
import { countPellets } from '../utils/MazeLayout.js';

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
            levelComplete: false,
            desiredDirection: null
        };
        this.levelConfig = null;
        this.levelData = null;
    }

    setLevelConfig(levelConfig) {
        this.levelConfig = levelConfig;
    }

    setLevelData({ maze, pelletGrid }) {
        this.levelData = { maze, pelletGrid };
        this.setPelletCounts(countPellets(pelletGrid));
    }

    getLevelData() {
        return this.levelData;
    }

    getLevelSnapshot() {
        if (!this.levelData) {
            return null;
        }

        const { maze, pelletGrid } = this.levelData;
        return {
            maze: maze.map((row) => [...row]),
            pelletGrid: pelletGrid.map((row) => [...row])
        };
    }

    getStateSnapshot() {
        return { ...this.state };
    }

    getLevel() {
        return this.state.level;
    }

    setHighScore(highScore) {
        this.state.highScore = highScore;
        this.emitEvent(GAME_EVENTS.HIGH_SCORE_CHANGED, { highScore });
    }

    setDesiredDirection(direction) {
        this.state.desiredDirection = direction;
    }

    consumeDesiredDirection() {
        const direction = this.state.desiredDirection;
        this.state.desiredDirection = null;
        return direction;
    }

    setPaused(isPaused) {
        this.state.isPaused = isPaused;
        this.emitEvent(GAME_EVENTS.PAUSE_TOGGLED, { isPaused });
    }

    togglePaused() {
        this.state.isPaused = !this.state.isPaused;
        this.emitEvent(GAME_EVENTS.PAUSE_TOGGLED, { isPaused: this.state.isPaused });
        return this.state.isPaused;
    }

    setGameOver(isGameOver) {
        this.state.isGameOver = isGameOver;
        if (isGameOver) {
            this.emitEvent(GAME_EVENTS.GAME_OVER, {});
        }
    }

    addScore(amount) {
        const previousHighScore = this.state.highScore;
        this.state.score += amount;
        if (this.state.score > this.state.highScore) {
            this.state.highScore = this.state.score;
        }
        this.emitEvent(GAME_EVENTS.SCORE_CHANGED, {
            score: this.state.score,
            level: this.state.level,
            highScore: this.state.highScore
        });
        if (this.state.highScore > previousHighScore) {
            this.emitEvent(GAME_EVENTS.HIGH_SCORE_CHANGED, {
                highScore: this.state.highScore
            });
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
        this.emitEvent(GAME_EVENTS.PELLET_EATEN, {
            score,
            pelletsRemaining: this.state.pelletsRemaining
        });
    }

    onPowerPelletEaten(score, pelletsRemaining) {
        this.addScore(score);
        this.state.currentComboGhosts = 0;
        if (pelletsRemaining !== undefined) {
            this.state.pelletsRemaining = pelletsRemaining;
        }
        this.emitEvent(GAME_EVENTS.POWER_PELLET_EATEN, {
            score,
            pelletsRemaining: this.state.pelletsRemaining,
            frightenedDuration: this.getFrightenedDuration()
        });
    }

    onGhostEaten(score) {
        this.addScore(score);
        this.state.ghostsEaten += 1;
        this.state.currentComboGhosts += 1;
        this.state.maxComboGhosts = Math.max(
            this.state.maxComboGhosts,
            this.state.currentComboGhosts
        );
        this.emitEvent(GAME_EVENTS.GHOST_EATEN, { score });
    }

    onPacmanDeath() {
        this.state.levelDeaths += 1;
        this.state.levelComplete = false;
        this.emitEvent(GAME_EVENTS.LIVES_LOST, {});
    }

    onFruitEaten(score) {
        this.addScore(score);
        this.state.fruitsCollected += 1;
        this.emitEvent(GAME_EVENTS.FRUIT_EATEN, { score });
    }

    onLevelComplete() {
        this.state.level += 1;
        this.state.levelComplete = true;
        this.emitEvent(GAME_EVENTS.LEVEL_COMPLETE, {});
    }

    beginDeath() {
        this.state.isDying = true;
        this.state.deathTimer = 0;
    }

    applyPelletCollision({ pelletScore, powerPelletScore, pelletsConsumed }) {
        if (typeof pelletsConsumed === 'number' && pelletsConsumed > 0) {
            this.state.pelletsRemaining = Math.max(
                0,
                this.state.pelletsRemaining - pelletsConsumed
            );
        }

        if (pelletScore > 0) {
            this.onPelletEaten(pelletScore, this.state.pelletsRemaining);
        }

        if (powerPelletScore > 0) {
            this.onPowerPelletEaten(powerPelletScore, this.state.pelletsRemaining);
        }

        if (this.state.pelletsRemaining === 0 && !this.state.levelComplete) {
            this.onLevelComplete();
        }
    }

    applyGhostCollision(result) {
        if (!result) {
            return;
        }

        if (result.type === 'ghost_eaten') {
            this.onGhostEaten(result.score);
            return;
        }

        if (result.type === 'pacman_died') {
            this.onPacmanDeath();
            this.beginDeath();
        }
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
                this.emitEvent(GAME_EVENTS.GAME_OVER, {});
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

    emitEvent(event, payload) {
        gameEvents.emit(event, {
            ...payload,
            state: this.getStateSnapshot()
        });
    }
}
