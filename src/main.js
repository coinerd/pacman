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
import { gameEvents, GAME_EVENTS } from './core/EventBus.js';

const args = window.location.search.substring(1).split('&');
const isDemo = args.some(arg => arg === 'demo');
const isE2E = args.some(arg => arg === 'e2e');

if (isDemo) {
    window.DEBUG = true;
}

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
window.game.isDemo = isDemo;
window.game.isE2E = isE2E;

if (isE2E) {
    window.addEventListener('adawoman:e2e-command', (event) => {
        const action = event?.detail?.action;
        if (!action) {
            return;
        }

        switch (action) {
        case 'win':
            gameEvents.emit(GAME_EVENTS.LEVEL_COMPLETE, { source: 'e2e' });
            break;
        case 'lose':
            gameEvents.emit(GAME_EVENTS.GAME_OVER, { source: 'e2e' });
            break;
        default:
            break;
        }
    });
}



