import Phaser from 'phaser';
import { colors, uiConfig } from '../config/gameConfig.js';
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
        this.add.rectangle(0, 0, this.scale.width, this.scale.height, colors.background)
            .setOrigin(0, 0);
    }

    createTitle() {
        this.add.text(
            this.scale.width / 2,
            this.scale.height * 0.15,
            'SETTINGS',
            {
                fontSize: '48px',
                fontFamily: uiConfig.fontFamily,
                color: colors.text,
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);
    }

    createSettings() {
        const startY = this.scale.height * 0.3;
        const spacing = 80;

        this.createSoundToggle(startY);
        this.createVolumeSlider(startY + spacing);
        this.createFpsToggle(startY + spacing * 2);
        this.createDifficultySelector(startY + spacing * 3);
    }

    createSoundToggle(y) {
        const label = this.add.text(
            this.scale.width / 2 - 100,
            y,
            'Sound Enabled',
            {
                fontSize: '24px',
                fontFamily: uiConfig.fontFamily,
                color: colors.text
            }
        ).setOrigin(0, 0.5);

        const toggleWidth = 60;
        const toggleHeight = 30;
        const toggle = this.add.rectangle(
            this.scale.width / 2 + 100,
            y,
            toggleWidth,
            toggleHeight,
            this.settings.soundEnabled ? colors.pacman : 0x333333
        ).setInteractive({ useHandCursor: true });

        toggle.on('pointerdown', () => {
            this.toggleSetting('soundEnabled');
            toggle.fillColor = this.settings.soundEnabled ? colors.pacman : 0x333333;
        });
    }

    createVolumeSlider(y) {
        const label = this.add.text(
            this.scale.width / 2 - 100,
            y,
            'Volume',
            {
                fontSize: '24px',
                fontFamily: uiConfig.fontFamily,
                color: colors.text
            }
        ).setOrigin(0, 0.5);

        const sliderWidth = 200;
        const sliderHeight = 10;
        const slider = this.add.rectangle(
            this.scale.width / 2 + 100,
            y,
            sliderWidth,
            sliderHeight,
            0x333333
        ).setOrigin(0.5);

        const handle = this.add.circle(
            this.scale.width / 2 + 100 - sliderWidth / 2 + (sliderWidth * this.settings.volume),
            y,
            15,
            colors.pacman
        ).setInteractive({ useHandCursor: true });

        handle.on('pointerdown', (pointer) => {
            const newX = Phaser.Math.Clamp(pointer.x, slider.x - sliderWidth / 2, slider.x + sliderWidth / 2);
            const newVolume = (newX - (slider.x - sliderWidth / 2)) / sliderWidth;
            this.updateVolume(newVolume);
            handle.x = newX;
        });
    }

    createFpsToggle(y) {
        const label = this.add.text(
            this.scale.width / 2 - 100,
            y,
            'Show FPS',
            {
                fontSize: '24px',
                fontFamily: uiConfig.fontFamily,
                color: colors.text
            }
        ).setOrigin(0, 0.5);

        const toggleWidth = 60;
        const toggleHeight = 30;
        const toggle = this.add.rectangle(
            this.scale.width / 2 + 100,
            y,
            toggleWidth,
            toggleHeight,
            this.settings.showFps ? colors.pacman : 0x333333
        ).setInteractive({ useHandCursor: true });

        toggle.on('pointerdown', () => {
            this.toggleSetting('showFps');
            toggle.fillColor = this.settings.showFps ? colors.pacman : 0x333333;
        });
    }

    createDifficultySelector(y) {
        const label = this.add.text(
            this.scale.width / 2 - 100,
            y,
            'Difficulty',
            {
                fontSize: '24px',
                fontFamily: uiConfig.fontFamily,
                color: colors.text
            }
        ).setOrigin(0, 0.5);

        const difficulties = ['Easy', 'Normal', 'Hard'];
        const startX = this.scale.width / 2 + 30;

        difficulties.forEach((diff, index) => {
            const button = this.add.text(
                startX + index * 80,
                y,
                diff,
                {
                    fontSize: '20px',
                    fontFamily: uiConfig.fontFamily,
                    color: this.settings.difficulty === diff ? colors.pacman : colors.text
                }
            ).setOrigin(0.5).setInteractive({ useHandCursor: true });

            button.on('pointerdown', () => {
                this.setDifficulty(diff);
                this.createSettings();
            });
        });
    }

    createNavigation() {
        const backText = this.add.text(
            this.scale.width / 2,
            this.scale.height * 0.85,
            '[ESC] Back to Menu',
            {
                fontSize: '24px',
                fontFamily: uiConfig.fontFamily,
                color: colors.text
            }
        ).setOrigin(0.5).setInteractive({ useHandCursor: true });

        backText.on('pointerdown', () => {
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
