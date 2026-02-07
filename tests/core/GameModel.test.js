import GameModel from '../../src/core/GameModel.js';
import { gameEvents, GAME_EVENTS } from '../../src/core/EventBus.js';

describe('GameModel - Zustandslogik und Regeln', () => {
    beforeEach(() => {
        gameEvents.clear();
    });

    test('Punkte erhöhen Score und Highscore bei Pellet', () => {
        const scoreListener = jest.fn();
        const highScoreListener = jest.fn();
        const model = new GameModel({ score: 90, highScore: 100, pelletsRemaining: 10 });

        gameEvents.on(GAME_EVENTS.SCORE_CHANGED, scoreListener);
        gameEvents.on(GAME_EVENTS.HIGH_SCORE_CHANGED, highScoreListener);

        model.onPelletEaten(20, 9);

        const snapshot = model.getStateSnapshot();
        expect(snapshot.score).toBe(110);
        expect(snapshot.highScore).toBe(110);
        expect(snapshot.pelletsEaten).toBe(1);
        expect(snapshot.pelletsRemaining).toBe(9);
        expect(scoreListener).toHaveBeenCalledTimes(1);
        expect(highScoreListener).toHaveBeenCalledTimes(1);
    });

    test('Power-Pellet setzt Combo zurück und liefert Frightened-Dauer', () => {
        const powerPelletListener = jest.fn();
        const model = new GameModel({ score: 0, level: 3, pelletsRemaining: 5 });
        model.setLevelConfig({ frightenedDuration: 6, frightenedDecreasePerLevel: 1 });

        gameEvents.on(GAME_EVENTS.POWER_PELLET_EATEN, powerPelletListener);

        model.onGhostEaten(200);
        expect(model.getStateSnapshot().currentComboGhosts).toBe(1);

        model.onPowerPelletEaten(50, 4);

        const snapshot = model.getStateSnapshot();
        expect(snapshot.currentComboGhosts).toBe(0);
        expect(snapshot.score).toBe(250);
        expect(powerPelletListener).toHaveBeenCalledTimes(1);
        expect(powerPelletListener.mock.calls[0][0].frightenedDuration).toBe(4);
    });

    test('Pellets aufgebraucht → Level-Up und Level-Complete', () => {
        const levelCompleteListener = jest.fn();
        const model = new GameModel({ level: 1, totalPellets: 1, pelletsRemaining: 1 });

        gameEvents.on(GAME_EVENTS.LEVEL_COMPLETE, levelCompleteListener);

        model.applyPelletCollision({ pelletScore: 10, powerPelletScore: 0, pelletsConsumed: 1 });

        const snapshot = model.getStateSnapshot();
        expect(snapshot.pelletsRemaining).toBe(0);
        expect(snapshot.level).toBe(2);
        expect(snapshot.levelComplete).toBe(true);
        expect(levelCompleteListener).toHaveBeenCalledTimes(1);
    });

    test('Geisterkollision (Tod) setzt Dying-State und Level-Deaths', () => {
        const livesLostListener = jest.fn();
        const model = new GameModel({ lives: 2 });

        gameEvents.on(GAME_EVENTS.LIVES_LOST, livesLostListener);

        model.applyGhostCollision({ type: 'pacman_died' });

        const snapshot = model.getStateSnapshot();
        expect(snapshot.isDying).toBe(true);
        expect(snapshot.levelDeaths).toBe(1);
        expect(livesLostListener).toHaveBeenCalledTimes(1);
    });

    test('Death-Tick: Respawn bei verbleibendem Leben, Game-Over ohne Leben', () => {
        const model = new GameModel({ lives: 1, deathPauseDuration: 0.5 });

        model.beginDeath();
        expect(model.step(0.1)).toEqual({ event: 'deathTick' });
        expect(model.getStateSnapshot().isDying).toBe(true);

        expect(model.step(0.4)).toEqual({ event: 'respawn' });
        expect(model.getStateSnapshot().lives).toBe(0);
        expect(model.getStateSnapshot().isDying).toBe(false);

        const gameOverListener = jest.fn();
        const gameOverModel = new GameModel({ lives: 0, deathPauseDuration: 0.2 });
        gameEvents.on(GAME_EVENTS.GAME_OVER, gameOverListener);

        gameOverModel.beginDeath();
        expect(gameOverModel.step(0.2)).toEqual({ event: 'gameOver' });
        expect(gameOverModel.getStateSnapshot().isGameOver).toBe(true);
        expect(gameOverListener).toHaveBeenCalledTimes(1);
    });
});
