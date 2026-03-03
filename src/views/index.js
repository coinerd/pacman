/**
 * View Module Exports
 * Exports ViewManager as ModelDrivenGameView for backward compatibility
 */

export { ViewManager, default as ModelDrivenGameView } from './core/ViewManager.js';
export { ViewManager } from './core/ViewManager.js';
export { MazeRenderer } from './renderers/MazeRenderer.js';
export { PelletRenderer } from './renderers/PelletRenderer.js';
export { EntityRendererManager } from './renderers/EntityRendererManager.js';
export { BossVisualManager } from './renderers/BossVisualManager.js';
export { PowerUpVisualManager } from './renderers/PowerUpVisualManager.js';
export { NarrativeManager } from './renderers/NarrativeManager.js';
