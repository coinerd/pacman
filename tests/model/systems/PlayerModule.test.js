// tests/model/systems/PlayerModule.test.js

import PlayerModule from '../../../src/model/systems/PlayerModule.js';

describe('PlayerModule', () => {
    let playerModule;

    beforeEach(() => {
        playerModule = new PlayerModule({
            level: 1,
            spawnPoint: { x: 13, y: 23 }
        });
    });

    describe('constructor', () => {
        test('should initialize with config values', () => {
            expect(playerModule.level).toBe(1);
            expect(playerModule.spawnPoint).toEqual({ x: 13, y: 23 });
        });

        test('should use default spawn point if not provided', () => {
            const defaultModule = new PlayerModule();

            expect(defaultModule.spawnPoint).toBeDefined();
        });

        test('should initialize isDying to false', () => {
            expect(playerModule.isDying).toBe(false);
        });
    });

    describe('setLevel', () => {
        test('should update level', () => {
            playerModule.setLevel(5);

            expect(playerModule.level).toBe(5);
        });
    });

    describe('setSpawnPoint', () => {
        test('should update spawn point', () => {
            playerModule.setSpawnPoint({ x: 10, y: 15 });

            expect(playerModule.spawnPoint).toEqual({ x: 10, y: 15 });
        });
    });

    describe('createPlayer', () => {
        test('should create player at spawn point', () => {
            const player = playerModule.createPlayer();

            expect(player).toBeDefined();
            expect(player.gridX).toBe(13);
            expect(player.gridY).toBe(23);
        });

        test('should create player with current level', () => {
            playerModule.setLevel(3);

            const player = playerModule.createPlayer();

            expect(player).toBeDefined();
        });
    });

    describe('onPacmanDeath', () => {
        test('should set isDying to true', () => {
            const mockPlayer = { die: jest.fn() };

            playerModule.onPacmanDeath(mockPlayer);

            expect(playerModule.isDying).toBe(true);
        });

        test('should call player.die()', () => {
            const mockPlayer = { die: jest.fn() };

            playerModule.onPacmanDeath(mockPlayer);

            expect(mockPlayer.die).toHaveBeenCalled();
        });

        test('should handle null player', () => {
            expect(() => playerModule.onPacmanDeath(null)).not.toThrow();
        });
    });

    describe('resetPlayer', () => {
        test('should set isDying to false', () => {
            playerModule.isDying = true;
            const mockPlayer = { reset: jest.fn() };

            playerModule.resetPlayer(mockPlayer);

            expect(playerModule.isDying).toBe(false);
        });

        test('should call player.reset() with spawn point', () => {
            const mockPlayer = { reset: jest.fn() };

            playerModule.resetPlayer(mockPlayer);

            expect(mockPlayer.reset).toHaveBeenCalledWith(13, 23);
        });

        test('should handle null player', () => {
            expect(() => playerModule.resetPlayer(null)).not.toThrow();
        });
    });
});
