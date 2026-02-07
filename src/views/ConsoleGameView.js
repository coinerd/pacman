/**
 * ConsoleGameView
 * Lightweight view adapter for non-Phaser environments (CLI/test harness).
 */

import { gameEvents, GAME_EVENTS } from '../core/EventBus.js';

export default class ConsoleGameView {
    constructor({ model, logger = console }) {
        this.model = model;
        this.logger = logger;
        this.unsubscribers = [];
    }

    bindModelEvents() {
        this.unsubscribers.push(
            gameEvents.on(GAME_EVENTS.PELLET_EATEN, (data) => {
                this.logger.info('Pellet eaten', data?.state);
            }),
            gameEvents.on(GAME_EVENTS.POWER_PELLET_EATEN, (data) => {
                this.logger.info('Power pellet eaten', data?.state);
            }),
            gameEvents.on(GAME_EVENTS.GHOST_EATEN, (data) => {
                this.logger.info('Ghost eaten', data?.state);
            }),
            gameEvents.on(GAME_EVENTS.FRUIT_EATEN, (data) => {
                this.logger.info('Fruit eaten', data?.state);
            }),
            gameEvents.on(GAME_EVENTS.LEVEL_COMPLETE, (data) => {
                this.logger.info('Level complete', data?.state);
            }),
            gameEvents.on(GAME_EVENTS.GAME_OVER, (data) => {
                this.logger.info('Game over', data?.state);
            })
        );
    }

    cleanup() {
        this.unsubscribers.forEach((unsubscribe) => unsubscribe());
        this.unsubscribers = [];
    }
}
