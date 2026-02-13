import Phaser from 'phaser';
import { themeConfig } from '../config/themeConfig.js';
import { StorageManager } from '../managers/StorageManager.js';

export default class SettingsScene extends Phaser.Scene {
    constructor() {
        super('SettingsScene');
    }

    init() {
        this.storageManager = new StorageManager();
        this.settings = this.storageManager.getSettings();
    }

    create() {
        this.createBackground();
        this.createTitle();
        this.createSettings();
        this.createNavigation();
    }

    createBackground() {
        this.add
            .rectangle(
                0,
                0,
                this.scale.width,
                this.scale.height,
                themeConfig.colors.background
            )
            .setOrigin(0, 0);

        const graphics = this.add.graphics();
        const gridSize = 40;
        const gridAlpha = 0.1;

        for (let x = 0; x <= this.scale.width; x += gridSize) {
            graphics.lineStyle(1, themeConfig.colors.circuit.traceDim, gridAlpha);
            graphics.lineBetween(x, 0, x, this.scale.height);
        }

        for (let y = 0; y <= this.scale.height; y += gridSize) {
            graphics.lineStyle(1, themeConfig.colors.circuit.traceDim, gridAlpha);
            graphics.lineBetween(0, y, this.scale.width, y);
        }

        const nodeSpacing = 120;
        for (let x = nodeSpacing; x < this.scale.width; x += nodeSpacing) {
            for (let y = nodeSpacing; y < this.scale.height; y += nodeSpacing) {
                graphics.fillStyle(themeConfig.colors.circuit.node, 0.15);
                graphics.fillCircle(x, y, 2);

                if ((x + y) % (nodeSpacing * 3) === 0) {
                    graphics.fillStyle(themeConfig.colors.circuit.nodeGlow, 0.3);
                    graphics.fillCircle(x, y, 4);
                }
            }
        }
    }

    createTitle() {
        const titleConfig = themeConfig.fonts.tech.title;

        this.add
            .text(this.scale.width / 2, this.scale.height * 0.12, 'SYSTEM CONFIG', {
                fontSize: titleConfig.size,
                fontFamily: titleConfig.family,
                color:
					'#' + themeConfig.colors.text.primary.toString(16).padStart(6, '0'),
                fontStyle: titleConfig.style,
                fontWeight: titleConfig.weight,
                letterSpacing: titleConfig.letterSpacing,
                shadow: {
                    offsetX: 0,
                    offsetY: 0,
                    color:
						'#' + themeConfig.colors.effect.pulse.toString(16).padStart(6, '0'),
                    blur: titleConfig.shadowBlur
                }
            })
            .setOrigin(0.5);

        const subtitleConfig = themeConfig.fonts.tech.subtitle;
        this.add
            .text(this.scale.width / 2, this.scale.height * 0.18, '// SETTINGS', {
                fontSize: subtitleConfig.size,
                fontFamily: subtitleConfig.family,
                color:
					'#' + themeConfig.colors.text.accent.toString(16).padStart(6, '0'),
                fontStyle: subtitleConfig.style,
                fontWeight: subtitleConfig.weight,
                letterSpacing: subtitleConfig.letterSpacing
            })
            .setOrigin(0.5);
    }

    createSettings() {
        this.settingsGroup = this.add.container(
            this.scale.width / 2,
            this.scale.height * 0.38
        );

        this.createSettingsPanel();
        const startY = -100;
        const spacing = 70;

        this.createSoundToggle(startY);
        this.createVolumeSlider(startY + spacing);
        this.createFpsToggle(startY + spacing * 2);
        this.createDifficultySelector(startY + spacing * 3);
    }

    createSettingsPanel() {
        const panelWidth = 500;
        const panelHeight = 320;
        const graphics = this.add.graphics();

        graphics.fillStyle(themeConfig.colors.panel.background, 0.95);
        graphics.lineStyle(2, themeConfig.colors.panel.border, 1);

        graphics.fillRoundedRect(
            -panelWidth / 2,
            -panelHeight / 2,
            panelWidth,
            panelHeight,
            themeConfig.circuit.panel.cornerRadius
        );

        graphics.strokeRoundedRect(
            -panelWidth / 2,
            -panelHeight / 2,
            panelWidth,
            panelHeight,
            themeConfig.circuit.panel.cornerRadius
        );

        this.createCircuitDecorations(
            graphics,
            -panelWidth / 2,
            -panelHeight / 2,
            panelWidth,
            panelHeight
        );

        this.settingsGroup.add(graphics);
    }

    createCircuitDecorations(graphics, x, y, width, height) {
        const { trace, node } = themeConfig.colors.circuit;
        const circuitOffset = 15;

        graphics.lineStyle(1, trace, 0.6);

        const points = [
            { x: x + circuitOffset, y: y + circuitOffset },
            { x: x + width - circuitOffset, y: y + circuitOffset },
            { x: x + width - circuitOffset, y: y + height - circuitOffset },
            { x: x + circuitOffset, y: y + height - circuitOffset }
        ];

        for (let i = 0; i < points.length; i++) {
            const current = points[i];
            const next = points[(i + 1) % points.length];
            graphics.moveTo(current.x, current.y);
            graphics.lineTo(next.x, next.y);
        }
        graphics.strokePath();

        graphics.fillStyle(node, 0.8);
        points.forEach((point) => {
            graphics.fillCircle(point.x, point.y, 3);
        });
    }

    createSoundToggle(y) {
        const labelConfig = themeConfig.fonts.tech.body;
        const label = this.add
            .text(-150, y, 'AUDIO SYSTEM', {
                fontSize: labelConfig.size,
                fontFamily: labelConfig.family,
                color:
					'#' + themeConfig.colors.text.primary.toString(16).padStart(6, '0'),
                fontStyle: labelConfig.style,
                fontWeight: labelConfig.weight
            })
            .setOrigin(0, 0.5);

        const toggleWidth = 70;
        const toggleHeight = 32;

        const toggleGroup = this.add.container(150, y);

        const toggleBg = this.add
            .rectangle(
                0,
                0,
                toggleWidth,
                toggleHeight,
                themeConfig.colors.panel.background
            )
            .setStrokeStyle(
                2,
                this.settings.soundEnabled
                    ? themeConfig.colors.status.online
                    : themeConfig.colors.status.offline
            );

        const toggleKnob = this.add.rectangle(
            this.settings.soundEnabled ? toggleWidth / 4 : -toggleWidth / 4,
            0,
            24,
            24,
            this.settings.soundEnabled
                ? themeConfig.colors.status.online
                : themeConfig.colors.status.offline
        );

        toggleGroup.add([toggleBg, toggleKnob]);
        this.settingsGroup.add([label, toggleGroup]);

        toggleGroup.setSize(toggleWidth, toggleHeight);
        toggleGroup.setInteractive({ useHandCursor: true });

        const updateToggle = () => {
            const isOn = this.settings.soundEnabled;
            toggleKnob.x = isOn ? toggleWidth / 4 : -toggleWidth / 4;
            toggleKnob.fillColor = isOn
                ? themeConfig.colors.status.online
                : themeConfig.colors.status.offline;
            toggleBg.strokeColor = isOn
                ? themeConfig.colors.status.online
                : themeConfig.colors.status.offline;
        };

        toggleGroup.on('pointerover', () => {
            toggleBg.setAlpha(0.8);
            toggleKnob.setAlpha(0.8);
        });

        toggleGroup.on('pointerout', () => {
            toggleBg.setAlpha(1);
            toggleKnob.setAlpha(1);
        });

        toggleGroup.on('pointerdown', () => {
            this.toggleSetting('soundEnabled');
            updateToggle();
        });
    }

    createVolumeSlider(y) {
        const labelConfig = themeConfig.fonts.tech.body;
        const label = this.add
            .text(-150, y, 'VOLUME LEVEL', {
                fontSize: labelConfig.size,
                fontFamily: labelConfig.family,
                color:
					'#' + themeConfig.colors.text.primary.toString(16).padStart(6, '0'),
                fontStyle: labelConfig.style,
                fontWeight: labelConfig.weight
            })
            .setOrigin(0, 0.5);

        const sliderWidth = 200;
        const sliderHeight = 10;
        const sliderGroup = this.add.container(100, y);

        const track = this.add
            .rectangle(
                0,
                0,
                sliderWidth,
                sliderHeight,
                themeConfig.colors.panel.background
            )
            .setStrokeStyle(2, themeConfig.colors.panel.border);

        const fillWidth = sliderWidth * this.settings.volume;
        const fill = this.add
            .rectangle(
                -(sliderWidth - fillWidth) / 2,
                0,
                fillWidth,
                sliderHeight,
                themeConfig.colors.circuit.trace
            )
            .setAlpha(0.8);

        const handle = this.add
            .circle(
                -(sliderWidth - fillWidth) / 2,
                0,
                14,
                themeConfig.colors.circuit.node
            )
            .setStrokeStyle(2, themeConfig.colors.circuit.traceGlow);

        sliderGroup.add([track, fill, handle]);
        this.settingsGroup.add([label, sliderGroup]);

        sliderGroup.setSize(sliderWidth, 30);
        sliderGroup.setInteractive({ useHandCursor: true });

        let isDragging = false;

        sliderGroup.on('pointerdown', (pointer) => {
            isDragging = true;
            updateVolumeFromPointer(pointer);
        });

        this.input.on('pointermove', (pointer) => {
            if (isDragging) {
                updateVolumeFromPointer(pointer);
            }
        });

        this.input.on('pointerup', () => {
            isDragging = false;
        });

        const updateVolumeFromPointer = (pointer) => {
            const localX = pointer.x - sliderGroup.x - this.settingsGroup.x;
            const newX = Phaser.Math.Clamp(localX, -sliderWidth / 2, sliderWidth / 2);
            const newVolume = (newX + sliderWidth / 2) / sliderWidth;

            this.updateVolume(newVolume);

            const newFillWidth = sliderWidth * newVolume;
            fill.width = newFillWidth;
            fill.x = -(sliderWidth - newFillWidth) / 2;
            handle.x = newX;

            this.createVolumeDisplay(y + 25);
        };

        sliderGroup.on('pointerover', () => {
            handle.setAlpha(0.8);
        });

        sliderGroup.on('pointerout', () => {
            handle.setAlpha(1);
        });
    }

    createVolumeDisplay(y) {
        const volumePercent = Math.round(this.settings.volume * 100);
        const displayConfig = themeConfig.fonts.tech.monospace;

        if (this.volumeDisplay) {
            this.volumeDisplay.setText(`[ ${volumePercent}% ]`);
        } else {
            this.volumeDisplay = this.add
                .text(100, y, `[ ${volumePercent}% ]`, {
                    fontSize: displayConfig.size,
                    fontFamily: displayConfig.family,
                    color:
						'#' + themeConfig.colors.text.accent.toString(16).padStart(6, '0'),
                    fontStyle: displayConfig.style,
                    letterSpacing: displayConfig.letterSpacing
                })
                .setOrigin(0.5);
            this.settingsGroup.add(this.volumeDisplay);
        }
    }

    createFpsToggle(y) {
        const labelConfig = themeConfig.fonts.tech.body;
        const label = this.add
            .text(-150, y, 'FPS DISPLAY', {
                fontSize: labelConfig.size,
                fontFamily: labelConfig.family,
                color:
					'#' + themeConfig.colors.text.primary.toString(16).padStart(6, '0'),
                fontStyle: labelConfig.style,
                fontWeight: labelConfig.weight
            })
            .setOrigin(0, 0.5);

        const toggleWidth = 70;
        const toggleHeight = 32;

        const toggleGroup = this.add.container(150, y);

        const toggleBg = this.add
            .rectangle(
                0,
                0,
                toggleWidth,
                toggleHeight,
                themeConfig.colors.panel.background
            )
            .setStrokeStyle(
                2,
                this.settings.showFps
                    ? themeConfig.colors.status.online
                    : themeConfig.colors.status.offline
            );

        const toggleKnob = this.add.rectangle(
            this.settings.showFps ? toggleWidth / 4 : -toggleWidth / 4,
            0,
            24,
            24,
            this.settings.showFps
                ? themeConfig.colors.status.online
                : themeConfig.colors.status.offline
        );

        toggleGroup.add([toggleBg, toggleKnob]);
        this.settingsGroup.add([label, toggleGroup]);

        toggleGroup.setSize(toggleWidth, toggleHeight);
        toggleGroup.setInteractive({ useHandCursor: true });

        const updateToggle = () => {
            const isOn = this.settings.showFps;
            toggleKnob.x = isOn ? toggleWidth / 4 : -toggleWidth / 4;
            toggleKnob.fillColor = isOn
                ? themeConfig.colors.status.online
                : themeConfig.colors.status.offline;
            toggleBg.strokeColor = isOn
                ? themeConfig.colors.status.online
                : themeConfig.colors.status.offline;
        };

        toggleGroup.on('pointerover', () => {
            toggleBg.setAlpha(0.8);
            toggleKnob.setAlpha(0.8);
        });

        toggleGroup.on('pointerout', () => {
            toggleBg.setAlpha(1);
            toggleKnob.setAlpha(1);
        });

        toggleGroup.on('pointerdown', () => {
            this.toggleSetting('showFps');
            updateToggle();
        });
    }

    createDifficultySelector(y) {
        const labelConfig = themeConfig.fonts.tech.body;
        this.add
            .text(-150, y, 'DIFFICULTY MODE', {
                fontSize: labelConfig.size,
                fontFamily: labelConfig.family,
                color:
					'#' + themeConfig.colors.text.primary.toString(16).padStart(6, '0'),
                fontStyle: labelConfig.style,
                fontWeight: labelConfig.weight
            })
            .setOrigin(0, 0.5);

        const difficulties = ['Easy', 'Normal', 'Hard'];
        const buttonWidth = 90;
        const buttonHeight = 36;
        const spacing = 100;
        const startX = -110;

        difficulties.forEach((diff, index) => {
            const x = startX + index * spacing;
            const isSelected = this.settings.difficulty === diff;

            const buttonGroup = this.add.container(x, y);

            const buttonBg = this.add
                .rectangle(
                    0,
                    0,
                    buttonWidth,
                    buttonHeight,
                    themeConfig.colors.panel.background
                )
                .setStrokeStyle(
                    2,
                    isSelected
                        ? themeConfig.colors.primary
                        : themeConfig.colors.panel.border
                );

            const buttonText = this.add.text(0, 0, diff.toUpperCase(), {
                fontSize: '14px',
                fontFamily: themeConfig.fonts.tech.body.family,
                color: isSelected
                    ? '#' + themeConfig.colors.primary.toString(16).padStart(6, '0')
                    : '#' +
						themeConfig.colors.text.secondary.toString(16).padStart(6, '0'),
                fontStyle: 'bold',
                fontWeight: '700',
                letterSpacing: '1px'
            });

            buttonGroup.add([buttonBg, buttonText]);
            this.settingsGroup.add(buttonGroup);

            buttonGroup.setSize(buttonWidth, buttonHeight);
            buttonGroup.setInteractive({ useHandCursor: true });

            buttonGroup.on('pointerover', () => {
                if (!isSelected) {
                    buttonBg.setStrokeStyle(2, themeConfig.colors.text.accent);
                    buttonText.setColor(
                        '#' + themeConfig.colors.text.accent.toString(16).padStart(6, '0')
                    );
                }
            });

            buttonGroup.on('pointerout', () => {
                if (!isSelected) {
                    buttonBg.setStrokeStyle(2, themeConfig.colors.panel.border);
                    buttonText.setColor(
                        '#' +
							themeConfig.colors.text.secondary.toString(16).padStart(6, '0')
                    );
                }
            });

            buttonGroup.on('pointerdown', () => {
                this.setDifficulty(diff);
                this.createSettings();
            });
        });
    }

    createNavigation() {
        const navTextConfig = themeConfig.fonts.menu.item;

        const backGroup = this.add.container(
            this.scale.width / 2,
            this.scale.height * 0.85
        );

        const buttonWidth = 280;
        const buttonHeight = 50;

        const buttonBg = this.add
            .rectangle(
                0,
                0,
                buttonWidth,
                buttonHeight,
                themeConfig.colors.panel.background
            )
            .setStrokeStyle(2, themeConfig.colors.panel.border);

        const buttonText = this.add.text(0, 0, '[ESC] RETURN TO MENU', {
            fontSize: navTextConfig.size,
            fontFamily: navTextConfig.family,
            color:
				'#' + themeConfig.colors.text.primary.toString(16).padStart(6, '0'),
            fontStyle: navTextConfig.style,
            fontWeight: navTextConfig.weight,
            letterSpacing: navTextConfig.letterSpacing
        });

        backGroup.add([buttonBg, buttonText]);

        backGroup.setSize(buttonWidth, buttonHeight);
        backGroup.setInteractive({ useHandCursor: true });

        backGroup.on('pointerover', () => {
            buttonBg.setStrokeStyle(2, themeConfig.colors.primary);
            buttonBg.fillColor = themeConfig.colors.primary;
            buttonText.setColor(
                '#' + themeConfig.colors.background.toString(16).padStart(6, '0')
            );
        });

        backGroup.on('pointerout', () => {
            buttonBg.setStrokeStyle(2, themeConfig.colors.panel.border);
            buttonBg.fillColor = themeConfig.colors.panel.background;
            buttonText.setColor(
                '#' + themeConfig.colors.text.primary.toString(16).padStart(6, '0')
            );
        });

        backGroup.on('pointerdown', () => {
            this.returnToMenu();
        });

        this.input.keyboard.on('keydown-ESC', () => {
            this.returnToMenu();
        });
    }

    toggleSetting(key) {
        this.settings[key] = !this.settings[key];
        this.saveSettings();
    }

    updateVolume(value) {
        this.settings.volume = Phaser.Math.Clamp(value, 0, 1);
        this.saveSettings();
    }

    setDifficulty(difficulty) {
        if (['Easy', 'Normal', 'Hard'].includes(difficulty)) {
            this.settings.difficulty = difficulty;
            this.saveSettings();
        }
    }

    saveSettings() {
        this.storageManager.saveSettings(this.settings);
    }

    getSettings() {
        return { ...this.settings };
    }

    resetSettings() {
        this.settings = {
            soundEnabled: true,
            volume: 0.5,
            showFps: false,
            difficulty: 'Normal'
        };
        this.saveSettings();
        this.createSettings();
    }

    returnToMenu() {
        this.scene.start('MenuScene');
    }
}
