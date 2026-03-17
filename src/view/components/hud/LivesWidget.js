/**
 * LivesWidget - Zeigt Leben als Herz-Icons an
 */
export class LivesWidget {
    constructor() {
        this.scene = null;
        this.container = null;
        this.heartIcons = [];
        this.lastLives = 3;
        this.activeTweens = [];
    }

    create(scene, x, y) {
        this.scene = scene;

        // Container für das gesamte Widget
        this.container = scene.add.container(x, y);
        this.container.setDepth(1100);
        this.container.setScrollFactor(0);

        // Initialisiere Herz-Icons (zentriert)
        this.createHeartIcons(3);
    }

    createHeartIcons(maxLives) {
        this.heartIcons.forEach(icon => icon.destroy());
        this.heartIcons = [];

        const spacing = 16;
        const totalWidth = (maxLives - 1) * spacing;
        const startX = -totalWidth / 2;

        for (let i = 0; i < maxLives; i++) {
            const heart = this.scene.add.text(
                startX + (i * spacing),
                8,
                '♥',
                {
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '18px',
                    color: '#ff4444'
                }
            );
            heart.setOrigin(0.5, 0);
            heart.setDepth(1101);
            heart.setShadow(0, 0, '#ff0000', 4, false, true);

            this.heartIcons.push(heart);
            this.container.add(heart);
        }
    }

    update(lives) {
        if (!this.container) {return;}

        const safeLives = Math.max(0, Math.min(lives, this.heartIcons.length));

        this.heartIcons.forEach((heart, index) => {
            const isActive = index < safeLives;

            if (isActive) {
                heart.setVisible(true);
                heart.setAlpha(1);
                heart.setColor('#ff4444');
                heart.setScale(1);
                heart.setShadow(0, 0, '#ff0000', 4, false, true);
            } else {
                heart.setVisible(true);
                heart.setAlpha(0.25);
                heart.setColor('#666666');
                heart.setScale(0.9);
                heart.setShadow(0, 0, '#000000', 0, false, true);
            }
        });

        if (safeLives < this.lastLives && this.scene) {
            this.animateLifeLost(safeLives);
        }

        this.lastLives = safeLives;
    }

    animateLifeLost(remainingLives) {
        const lastActiveHeart = this.heartIcons[remainingLives - 1];
        if (lastActiveHeart && this.scene) {
            // Kill existing tweens on this heart
            this.scene.tweens.killTweensOf(lastActiveHeart);

            const tween = this.scene.tweens.add({
                targets: lastActiveHeart,
                scale: { from: 1.3, to: 1 },
                duration: 300,
                ease: 'Back.easeOut'
            });
            this.activeTweens.push(tween);
        }
    }

    destroy() {
        // Stop all active tweens
        this.activeTweens.forEach(tween => {
            if (tween && tween.stop) {
                tween.stop();
            }
        });
        this.activeTweens = [];

        // Kill tweens on all hearts
        if (this.scene && this.scene.tweens) {
            this.scene.tweens.killTweensOf(this.heartIcons);
        }

        this.heartIcons.forEach(icon => icon.destroy());
        this.heartIcons = [];

        if (this.container) {
            this.container.destroy();
            this.container = null;
        }
    }
}
