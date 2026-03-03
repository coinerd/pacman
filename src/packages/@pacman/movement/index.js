/**
 * @pacman/movement - Unified Exports
 * Generic movement system for tile-based games
 * 
 * This package provides a complete movement solution for tile-based games:
 * - MovementEngine: Core movement logic
 * - MovementComponent: Entity movement state
 * - Direction: Direction constants and utilities
 * - MazeAdapter: Tile-to-world coordinate conversion
 * - AIController: AI movement behavior
 * - MovementSystem: Main facade (Pacman-specific)
 */

// Core
export { MovementEngine } from '../../movement/core/MovementEngine.js';
export { MovementComponent } from '../../movement/core/MovementComponent.js';
export { Direction } from '../../movement/core/Direction.js';

// Adapters
export { MazeAdapter } from '../../movement/adapters/MazeAdapter.js';

// AI
export { AIController } from '../../movement/ai/AIController.js';

// Features
export { TileCenterMovement } from '../../movement/features/TileCenterMovement.js';

// Facade (Pacman-specific)
export { MovementSystem } from '../../movement/MovementSystem.js';

// Interface
export { IMovementSystem } from '../../movement/interfaces/IMovementSystem.js';

// Default export (convenience)
export default {
    // Core
    MovementEngine,
    MovementComponent,
    Direction,

    // Adapters
    MazeAdapter,

    // AI
    AIController,

    // Features
    TileCenterMovement,

    // Facade
    MovementSystem,

    // Interface
    IMovementSystem
};
