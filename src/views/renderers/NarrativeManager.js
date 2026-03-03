/**
 * NarrativeManager
 * Manages story narrative display, chapter complete messages
 */

export class NarrativeManager {
    constructor(scene) {
        this.scene = scene;

        // Story overlay and elements
        this.storyOverlay = null;
        this.storyDescription = null;
    }

    /**
     * Show story narrative overlay
     * @param {Object} data - Narrative data
     * @param {string} data.chapterName - Chapter name
     * @param {string} data.description - Chapter description
     * @param {boolean} data.isBossBattle - Whether this is a boss battle
     */
    showStoryNarrative(data) {
        if (this.storyOverlay) {
            this.hideStoryNarrative();
        }

        this.storyOverlay = this.scene.add.container(
            this.scene.scale.width / 2,
            this.scene.scale.height / 4
        );

        // Background
        const bg = this.scene.add
            .rectangle(0, 0, 500, 120, 0x001a00)
            .setAlpha(0.95)
            .setStrokeStyle(2, 0x00ffaa);

        // Title
        const title = this.scene.add
            .text(0, -30, data.chapterName, {
                fontSize: '22px',
                color: '#00ffaa',
                fontStyle: 'bold'
            })
            .setOrigin(0.5);

        // Description
        this.storyDescription = this.scene.add
            .text(0, 10, data.description, {
                fontSize: '14px',
                color: '#00cc88',
                wordWrap: { width: 460 }
            })
            .setOrigin(0.5);

        // Boss warning hint
        const hint = data.isBossBattle
            ? this.scene.add
                .text(0, 40, '⚠ BOSS BATTLE AHEAD', {
                    fontSize: '12px',
                    color: '#ff4444',
                    fontStyle: 'bold'
                })
                .setOrigin(0.5)
            : null;

        const elements = [bg, title, this.storyDescription];
        if (hint) {
            elements.push(hint);
        }

        this.storyOverlay.add(elements);
        this.storyOverlay.setAlpha(0);

        // Animate in
        this.scene.tweens.add({
            targets: this.storyOverlay,
            alpha: 1,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                this.scene.time.delayedCall(3000, () => {
                    this.hideStoryNarrative();
                });
            }
        });
    }

    /**
     * Hide story narrative overlay
     */
    hideStoryNarrative() {
        if (!this.storyOverlay) {
            return;
        }

        this.scene.tweens.add({
            targets: this.storyOverlay,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                this.storyOverlay.destroy();
                this.storyOverlay = null;
                this.storyDescription = null;
            }
        });
    }

    /**
     * Show chapter complete message
     * @param {Object} data - Chapter complete data
     * @param {string} data.chapterName - Chapter name
     * @param {number} data.bonusPoints - Bonus points
     */
    showChapterCompleteMessage(data) {
        if (this.storyOverlay) {
            this.hideStoryNarrative();
        }

        this.storyOverlay = this.scene.add.container(
            this.scene.scale.width / 2,
            this.scene.scale.height / 4
        );

        // Background
        const bg = this.scene.add
            .rectangle(0, 0, 500, 100, 0x002200)
            .setAlpha(0.95)
            .setStrokeStyle(3, 0xffd700);

        // Title
        const title = this.scene.add
            .text(0, -20, `${data.chapterName} COMPLETE`, {
                fontSize: '20px',
                color: '#FFD700',
                fontStyle: 'bold'
            })
            .setOrigin(0.5);

        // Bonus points
        const bonus = this.scene.add
            .text(0, 15, `+${data.bonusPoints} CHAPTER BONUS`, {
                fontSize: '18px',
                color: '#FFFFFF'
            })
            .setOrigin(0.5);

        this.storyOverlay.add([bg, title, bonus]);
        this.storyOverlay.setAlpha(0);

        // Animate in
        this.scene.tweens.add({
            targets: this.storyOverlay,
            alpha: 1,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                this.scene.time.delayedCall(2000, () => {
                    this.hideStoryNarrative();
                });
            }
        });
    }

    /**
     * Show achievement notification
     * @param {Object} achievement - Achievement data
     * @param {string} achievement.title - Achievement title
     * @param {string} achievement.description - Achievement description
     */
    showAchievementNotification(achievement) {
        const notification = this.scene.add.container(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2
        );

        const bg = this.scene.add
            .rectangle(0, 0, 400, 80, 0x001a00)
            .setAlpha(0.95)
            .setStrokeStyle(2, 0xffd700);

        const title = this.scene.add
            .text(0, -15, '🏆 ACHIEVEMENT UNLOCKED', {
                fontSize: '16px',
                color: '#FFD700',
                fontStyle: 'bold'
            })
            .setOrigin(0.5);

        const desc = this.scene.add
            .text(0, 15, achievement.title, {
                fontSize: '14px',
                color: '#FFFFFF'
            })
            .setOrigin(0.5);

        notification.add([bg, title, desc]);
        notification.setAlpha(0);

        this.scene.tweens.add({
            targets: notification,
            alpha: 1,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                this.scene.time.delayedCall(2000, () => {
                    this.scene.tweens.add({
                        targets: notification,
                        alpha: 0,
                        duration: 500,
                        ease: 'Power2',
                        onComplete: () => notification.destroy()
                    });
                });
            }
        });
    }

    /**
     * Check if narrative overlay is currently showing
     * @returns {boolean}
     */
    isShowingNarrative() {
        return this.storyOverlay !== null;
    }

    /**
     * Update narrative description (for typing effects or updates)
     * @param {string} text - New description text
     */
    updateDescription(text) {
        if (this.storyDescription) {
            this.storyDescription.setText(text);
        }
    }

    /**
     * Clean up narrative resources
     */
    cleanup() {
        if (this.storyOverlay) {
            this.storyOverlay.destroy();
            this.storyOverlay = null;
            this.storyDescription = null;
        }
    }
}
