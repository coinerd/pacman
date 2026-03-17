/**
 * LevelWidget - Zeigt das aktuelle Level an
 */
export class LevelWidget {
    constructor() {
        this.scene = null;
        this.container = null;
        this.levelText = null;
        this.badgeBg = null;
        this.lastLevel = 1;
        this.activeTweens = [];
    }

    create(scene, x, y) {
        this.scene = scene;

        // Container für das gesamte Widget
        this.container = scene.add.container(x, y);
        this.container.setDepth(1100);
        this.container.setScrollFactor(0);

        // Badge Background
        this.badgeBg = scene.add.rectangle(
            0,
            12,
            32,
            24,
            0x00aaff,
            0.2
        );
        this.badgeBg.setStrokeStyle(1, 0x00aaff, 0.8);
        this.badgeBg.setOrigin(0.5);
        this.badgeBg.setDepth(1100);

        // Level Value
        this.levelText = scene.add.text(
            0,
            12,
            '1',
            {
                fontFamily: 'Courier New, monospace',
                fontSize: '18px',
                fontStyle: 'bold',
                color: '#00ddff'
            }
        );
        this.levelText.setOrigin(0.5);
        this.levelText.setDepth(1102);
        this.levelText.setShadow(0, 0, '#00aaff', 6, false, true);

        this.container.add([this.badgeBg, this.levelText]);
    }

    update(level) {
        if (!this.levelText) {return;}

        const safeLevel = Math.max(1, Number.isFinite(Number(level)) ? Number(level) : 1);

        if (safeLevel > this.lastLevel && this.scene) {
            this.animateLevelUp(safeLevel);
        } else {
            this.levelText.setText(`${safeLevel}`);
        }

        this.updateBadgeColor(safeLevel);
        this.lastLevel = safeLevel;
    }

    updateBadgeColor(level) {
        if (!this.badgeBg || !this.levelText) {return;}

        const colors = [
            { bg: 0x00aaff, text: '#00ddff', border: 0x00aaff },
            { bg: 0x00ffaa, text: '#00ffaa', border: 0x00ffaa },
            { bg: 0xffaa00, text: '#ffcc00', border: 0xffaa00 },
            { bg: 0xff6666, text: '#ff8888', border: 0xff6666 },
            { bg: 0xff00ff, text: '#ff66ff', border: 0xff00ff }
        ];

        const colorIndex = Math.min(level - 1, colors.length - 1);
        const color = colors[colorIndex];

        this.badgeBg.setFillStyle(color.bg, 0.2);
        this.badgeBg.setStrokeStyle(1, color.border, 0.8);
        this.levelText.setColor(color.text);
        this.levelText.setShadow(0, 0, color.border, 6, false, true);
    }

    animateLevelUp(newLevel) {
        if (!this.scene) {return;}

        // Kill existing tweens before creating new ones
        this.scene.tweens.killTweensOf([this.levelText, this.badgeBg]);

        const tween = this.scene.tweens.add({
            targets: [this.levelText, this.badgeBg],
            scale: { from: 1.5, to: 1 },
            duration: 400,
            ease: 'Back.easeOut'
        });
        this.activeTweens.push(tween);

        this.levelText.setText(`${newLevel}`);

        this.badgeBg.setFillStyle(0xffffff, 0.5);
        this.scene.time.delayedCall(100, () => {
            this.updateBadgeColor(newLevel);
        });
    }

    destroy() {
        // Stop all active tweens
        this.activeTweens.forEach(tween => {
            if (tween && tween.stop) {
                tween.stop();
            }
        });
        this.activeTweens = [];

        // Kill tweens on elements
        if (this.scene && this.scene.tweens) {
            this.scene.tweens.killTweensOf([this.levelText, this.badgeBg]);
        }

        if (this.container) {
            this.container.destroy();
            this.container = null;
        }
        this.levelText = null;
        this.badgeBg = null;
    }
}
