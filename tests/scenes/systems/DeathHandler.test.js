/**
 * Tests for DeathHandler
 * Manages death animation and respawn logic
 */

import { DeathHandler } from '../../../src/scenes/systems/DeathHandler.js';

describe('DeathHandler', () => {
    let deathHandler;
    let mockScene;
    let mockGameModel;

    beforeEach(() => {
        mockGameModel = {
            isDying: false,
            deathTimer: 0,
            step: jest.fn()
        };

        mockScene = {
            pacman: {
                die: jest.fn()
            },
            resetPositions: jest.fn(),
            uiController: {
                showReadyMessage: jest.fn()
            }
        };

        deathHandler = new DeathHandler(mockScene, mockGameModel);
    });

    describe('constructor', () => {
        test('stores scene reference', () => {
            expect(deathHandler.scene).toBe(mockScene);
        });

        test('stores game model reference', () => {
            expect(deathHandler.gameModel).toBe(mockGameModel);
        });
    });

    describe('handleDeath', () => {
        test('calls die on pacman', () => {
            deathHandler.handleDeath();

            expect(mockScene.pacman.die).toHaveBeenCalled();
        });
    });

    describe('update', () => {
        test('returns false when not dying', () => {
            mockGameModel.isDying = false;

            const result = deathHandler.update(0.1);

            expect(result).toBe(false);
        });

        test('returns true when dying', () => {
            mockGameModel.isDying = true;
            mockGameModel.step.mockReturnValue(null);

            const result = deathHandler.update(0.1);

            expect(result).toBe(true);
        });

        test('steps game model when dying', () => {
            mockGameModel.isDying = true;
            mockGameModel.step.mockReturnValue(null);

            deathHandler.update(0.016);

            expect(mockGameModel.step).toHaveBeenCalledWith(0.016);
        });

        test('resets positions on respawn event', () => {
            mockGameModel.isDying = true;
            mockGameModel.step.mockReturnValue({ event: 'respawn' });

            deathHandler.update(1);

            expect(mockScene.resetPositions).toHaveBeenCalled();
        });

        test('shows ready message on respawn event', () => {
            mockGameModel.isDying = true;
            mockGameModel.step.mockReturnValue({ event: 'respawn' });

            deathHandler.update(1);

            expect(mockScene.uiController.showReadyMessage).toHaveBeenCalled();
        });

        test('does not reset positions without respawn event', () => {
            mockGameModel.isDying = true;
            mockGameModel.step.mockReturnValue({ event: 'death' });

            deathHandler.update(0.1);

            expect(mockScene.resetPositions).not.toHaveBeenCalled();
        });

        test('handles null step result', () => {
            mockGameModel.isDying = true;
            mockGameModel.step.mockReturnValue(null);

            const result = deathHandler.update(0.1);

            expect(result).toBe(true);
            expect(mockScene.resetPositions).not.toHaveBeenCalled();
        });
    });

    describe('isDying', () => {
        test('returns gameModel.isDying', () => {
            mockGameModel.isDying = true;
            expect(deathHandler.isDying()).toBe(true);

            mockGameModel.isDying = false;
            expect(deathHandler.isDying()).toBe(false);
        });
    });

    describe('reset', () => {
        test('resets death timer to 0', () => {
            mockGameModel.deathTimer = 5;

            deathHandler.reset();

            expect(mockGameModel.deathTimer).toBe(0);
        });

        test('sets isDying to false', () => {
            mockGameModel.isDying = true;

            deathHandler.reset();

            expect(mockGameModel.isDying).toBe(false);
        });
    });
});
