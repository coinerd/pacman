/**
 * Pacman Game - Unified Exports
 * Main entry point for all Pacman packages
 */

// @pacman/movement
export * from './@pacman/movement/index.js';

// @pacman/core
export * from './@pacman/core/index.js';

// @pacman/utils
export * from './@pacman/utils/index.js';

// Re-export main game model for convenience
export { default as GameModelDI } from '../model/core/GameModelDI.js';

// Re-export main game scene for convenience
export { default as GameScene } from '../scenes/GameScene.js';

// Re-export main view for convenience
export { default as ModelDrivenGameView } from '../views/ModelDrivenGameView.js';

// Re-export main app for convenience
export { default as PacmanGame } from '../PacmanGame.js';
