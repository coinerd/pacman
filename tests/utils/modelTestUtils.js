import GameModel from '../../src/core/GameModel.js';

/**
 * Create a GameModel with optional state, level config, and level data.
 * @param {Object} options
 * @param {Object} [options.state] - Overrides for initial GameModel state.
 * @param {Object} [options.levelConfig] - Level configuration to apply.
 * @param {Object} [options.levelData] - Level data to apply ({ maze, pelletGrid }).
 * @returns {GameModel}
 */
export const createGameModel = ({ state = {}, levelConfig, levelData } = {}) => {
    const model = new GameModel(state);

    if (levelConfig) {
        model.setLevelConfig(levelConfig);
    }

    if (levelData) {
        model.setLevelData(levelData);
    }

    return model;
};
