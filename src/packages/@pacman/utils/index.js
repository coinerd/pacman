/**
 * @pacman/utils - Unified Exports
 * Utility functions and helpers
 * 
 * This package provides utility functions:
 * - MazeGenerator: Procedural maze generation
 * - MazeLayout: Maze layout utilities and data
 * - EventBus: Generic event bus
 * - Random: Random number utilities
 */

// Maze
export { default as MazeGenerator } from '../../utils/MazeGenerator.js';
export { createMazeData, countPellets, PELLET_TYPES } from '../../utils/MazeLayout.js';

// Events
export { GAME_EVENTS, gameEvents, EventBus } from '../../core/EventBus.js';

// Config (shared)
export { gameConfig, scoreValues, bossConfig, powerUpConfig, storyConfig, fruitConfig, virusCore, enemyStartPositions, playerStartPosition } from '../../config/gameConfig.js';

// Default export (convenience)
export default {
    // Maze
    MazeGenerator,
    createMazeData,
    countPellets,
    PELLET_TYPES,

    // Events
    GAME_EVENTS,
    gameEvents,
    EventBus,

    // Config
    gameConfig,
    scoreValues,
    bossConfig,
    powerUpConfig,
    storyConfig,
    fruitConfig,
    virusCore,
    enemyStartPositions,
    playerStartPosition
};
