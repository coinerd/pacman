import GameModelDI from '../../src/model/core/GameModelDI.js';

/**
 * Create a GameModel with optional state, level config, and level data.
 * @param {Object} options
 * @param {Object} [options.state] - Overrides for initial GameModel state.
 * @param {Object} [options.levelConfig] - Level configuration to apply.
 * @param {Object} [options.levelData] - Level data to apply ({ maze, pelletGrid }).
 * @returns {GameModelDI}
 */
export const createGameModel = ({ state = {}, levelConfig, levelData } = {}) => {
    const model = new GameModelDI(state, true); // PHASE 4: Use DI

    if (levelConfig) {
        model.setLevelConfig(levelConfig);
    }

    if (levelData) {
        model.setLevelData(levelData);
    }

    return model;
};
