import { AdaptiveDifficultySystem } from '../../../src/scenes/systems/AdaptiveDifficultySystem.js';

describe('AdaptiveDifficultySystem', () => {
    const createScene = () => {
        const aiController = {
            setModeDurations: jest.fn(),
            setRandomnessFactor: jest.fn()
        };

        const movementSystem = {
            getAIController: () => aiController,
            getAllPositions: () => [{ entityId: 'g1', type: 'ai' }],
            setSpeedMultiplier: jest.fn()
        };

        return {
            gameModel: { movementSystem },
            debugOverlay: {}
        };
    };

    test('queues and applies profile only at section boundaries', () => {
        const scene = createScene();
        const system = new AdaptiveDifficultySystem(scene);

        const baseSnapshot = {
            isPaused: false,
            isGameOver: false,
            totalPellets: 100,
            pelletsRemaining: 100,
            pacman: { gridX: 1, gridY: 1 },
            levelComplete: false
        };

        system.resetForRound(baseSnapshot);
        system.update(1 / 60, baseSnapshot, []);

        expect(scene.gameModel.movementSystem.setSpeedMultiplier).not.toHaveBeenCalled();

        const sectionSnapshot = {
            ...baseSnapshot,
            pelletsRemaining: 70,
            pacman: { gridX: 4, gridY: 4 }
        };

        system.update(1, sectionSnapshot, []);

        expect(scene.gameModel.movementSystem.setSpeedMultiplier).toHaveBeenCalledWith('g1', expect.any(Number));
        expect(scene.gameModel.movementSystem.getAIController().setRandomnessFactor).toHaveBeenCalled();
    });

    test('keeps adaptive profile values in configured hard clamps', () => {
        const system = new AdaptiveDifficultySystem(createScene());
        const profile = system.buildProfile(10);

        expect(profile.enemySpeedBand).toBeLessThanOrEqual(1.25);
        expect(profile.scatterDuration).toBeGreaterThanOrEqual(4);
        expect(profile.randomness).toBeLessThanOrEqual(0.38);
        expect(profile.mazeComplexity).toBeLessThanOrEqual(1.15);
    });
});
