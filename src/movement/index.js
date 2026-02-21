/**
 * Movement System
 * Tile-center based movement system with no external dependencies
 *
 * @module movement
 */

// Core interfaces
export {
    MovementInterface,
    MOVEMENT_RESULTS,
    MOVEMENT_EVENTS
} from './MovementInterface.js';

export {
    MazeQueryInterface
} from './MazeQueryInterface.js';

// Engine
export {
    MovementEngine
} from './MovementEngine.js';

// Strategies
export {
    TileCenterMovementStrategy
} from './strategies/TileCenterMovementStrategy.js';

// Adapters
export {
    MazeQueryAdapter
} from './adapters/MazeQueryAdapter.js';
