import ScoreModule from '../../src/model/systems/ScoreModule.js';

describe('ScoreModule', () => {
    const createModule = ({ storedHighScore = 0, config = {} } = {}) => {
        const saveIfHigher = jest.fn();
        const scorePersistenceService = {
            loadHighScore: jest.fn(() => storedHighScore),
            saveIfHigher
        };

        const module = new ScoreModule({
            ...config,
            scorePersistenceService,
            eventBus: { emit: jest.fn() }
        });

        return { module, scorePersistenceService, saveIfHigher };
    };

    it('falls back to 0 when persisted high score is invalid', () => {
        const { module } = createModule({ storedHighScore: 'invalid' });

        expect(module.highScore).toBe(0);
    });

    it('handles string score payloads as numbers', () => {
        const { module } = createModule();

        module.applyPelletScore('10');

        expect(module.score).toBe(10);
    });

    it('ignores invalid score payloads instead of producing NaN', () => {
        const { module } = createModule();

        module.applyGhostScore(undefined);
        module.applyFruitScore('not-a-number');

        expect(module.score).toBe(0);
    });
});
