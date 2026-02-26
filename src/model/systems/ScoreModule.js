import { GAME_EVENTS, gameEvents } from '../../core/EventBus.js';
import ScorePersistenceService from '../services/ScorePersistenceService.js';

/**
 * Holds score/high-score and combo-driven scoring logic.
 */
export default class ScoreModule {
    /**
     * @param {Object} config
     * @param {number} [config.score=0]
     * @param {number} [config.highScore=0]
     * @param {ScorePersistenceService} [config.scorePersistenceService]
     * @param {{emit: Function}} [config.eventBus]
     */
    constructor(config = {}) {
        this.score = this.normalizeScoreValue(config.score);
        this.scorePersistenceService =
            config.scorePersistenceService ?? new ScorePersistenceService();
        this.eventBus = config.eventBus ?? gameEvents;

        const savedHighScore = this.normalizeScoreValue(this.scorePersistenceService.loadHighScore());
        const configuredHighScore = this.normalizeScoreValue(config.highScore);
        this.highScore = Math.max(configuredHighScore, savedHighScore);

        this.ghostsEaten = 0;
        this.currentComboGhosts = 0;
        this.maxComboGhosts = 0;
        this.pelletsEaten = 0;
    }

    applyPelletScore(score) {
        const previousScore = this.score;
        this.score += this.normalizeScoreValue(score);
        this.pelletsEaten++;
        console.log('[ScoreModule.applyPelletScore]', { previousScore, added: this.normalizeScoreValue(score), newScore: this.score });
        const isNewHighScore = this.checkHighScore();
        this.emitScoreChanged(isNewHighScore);
    }

    applyGhostScore(score) {
        this.score += this.normalizeScoreValue(score);
        this.ghostsEaten++;
        this.currentComboGhosts++;
        this.maxComboGhosts = Math.max(this.maxComboGhosts, this.currentComboGhosts);
        const isNewHighScore = this.checkHighScore();
        this.emitScoreChanged(isNewHighScore);
    }

    applyFruitScore(score) {
        this.score += this.normalizeScoreValue(score);
        const isNewHighScore = this.checkHighScore();
        this.emitScoreChanged(isNewHighScore);
    }

    /**
     * Normalize score-like values to finite numbers.
     * @param {unknown} value
     * @returns {number}
     */
    normalizeScoreValue(value) {
        const numericValue = Number(value);
        return Number.isFinite(numericValue) ? numericValue : 0;
    }

    resetCombo() {
        this.currentComboGhosts = 0;
    }

    /**
     * Central score event handler.
     * @param {Object} event
     */
    applyEvent(event) {
        console.log('[ScoreModule.applyEvent] Event:', event);
        switch (event.type) {
        case 'pellet_eaten':
            this.applyPelletScore(event.score);
            break;
        case 'power_pellet_eaten':
            this.applyPelletScore(event.score);
            this.resetCombo();
            break;
        case 'ghost_eaten':
            this.applyGhostScore(event.score);
            break;
        case 'fruit_eaten':
            this.applyFruitScore(event.score);
            break;
        default:
            break;
        }
    }

    checkHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.scorePersistenceService.saveIfHigher(this.highScore);
            return true;
        }

        return false;
    }

    emitScoreChanged(isNewHighScore = false) {
        this.eventBus.emit(GAME_EVENTS.SCORE_CHANGED, {
            score: this.score,
            highScore: this.highScore,
            isNewHighScore
        });
    }

    getSnapshot() {
        return {
            score: this.score,
            highScore: this.highScore,
            ghostsEaten: this.ghostsEaten,
            currentComboGhosts: this.currentComboGhosts,
            maxComboGhosts: this.maxComboGhosts,
            pelletsEaten: this.pelletsEaten
        };
    }
}
