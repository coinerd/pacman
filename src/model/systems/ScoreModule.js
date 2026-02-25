/**
 * Holds score/high-score and combo-driven scoring logic.
 */
export default class ScoreModule {
    /**
     * @param {Object} config
     * @param {number} [config.score=0]
     * @param {number} [config.highScore=0]
     */
    constructor(config = {}) {
        this.score = config.score ?? 0;
        this.highScore = config.highScore ?? 0;
        this.ghostsEaten = 0;
        this.currentComboGhosts = 0;
        this.maxComboGhosts = 0;
        this.pelletsEaten = 0;
    }

    applyPelletScore(score) {
        this.score += score;
        this.pelletsEaten++;
        this.checkHighScore();
    }

    applyGhostScore(score) {
        this.score += score;
        this.ghostsEaten++;
        this.currentComboGhosts++;
        this.maxComboGhosts = Math.max(this.maxComboGhosts, this.currentComboGhosts);
        this.checkHighScore();
    }

    applyFruitScore(score) {
        this.score += score;
        this.checkHighScore();
    }

    resetCombo() {
        this.currentComboGhosts = 0;
    }

    /**
     * Central score event handler.
     * @param {Object} event
     */
    applyEvent(event) {
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
        }
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
