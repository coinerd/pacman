/**
 * Main Game Entry Point
 * Initializes the Phaser game engine with all scenes
 */

import Phaser from 'phaser';
import { gameConfig } from './config/gameConfig.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import PauseScene from './scenes/PauseScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import WinScene from './scenes/WinScene.js';
import SettingsScene from './scenes/SettingsScene.js';

const config = {
    type: Phaser.AUTO,
    width: gameConfig.width,
    height: gameConfig.height,
    parent: 'game-container',
    backgroundColor: '#000000',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: gameConfig.width,
        height: gameConfig.height
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    fps: {
        target: gameConfig.targetFPS,
        forceSetTimeOut: true,
        smoothStep: true
    },
    scene: [MenuScene, GameScene, PauseScene, GameOverScene, WinScene, SettingsScene]
};

const game = new Phaser.Game(config);
window.game = game;



