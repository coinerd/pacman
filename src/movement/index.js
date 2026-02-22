/**
 * Movement System
 * Entkoppeltes Movement-System für das Spiel
 *
 * @example
 * import { MovementSystem, MazeAdapter, AIController } from './movement/index.js';
 *
 * // Initialisierung
 * const movementSystem = new MovementSystem({
 *     tileSize: 20,
 *     tunnelRow: 15
 * });
 *
 * movementSystem.initialize(mazeGrid, {
 *     virusCoreCenter: { x: 13, y: 14 }
 * });
 *
 * // Player registrieren
 * movementSystem.registerEntity(pacman);
 *
 * // Ghosts mit AI registrieren
 * movementSystem.registerEntity(ghost, {
 *     aiType: 'alpha',
 *     scatterTarget: { x: 24, y: 0 }
 * });
 *
 * // Im Game Loop
 * const events = movementSystem.update(deltaSeconds, {
 *     player: pacman,
 *     allEntities: ghosts
 * });
 */

// Interfaces
export { IMovementSystem } from './interfaces/IMovementSystem.js';
export { IMazeAdapter } from './interfaces/IMazeAdapter.js';
export { IAIController } from './interfaces/IAIController.js';

// Core
export { Direction, directionsEqual, directionToString } from './core/Direction.js';
export { MovementComponent } from './core/MovementComponent.js';
export { MovementEngine } from './core/MovementEngine.js';
export {
    AIStrategies,
    chooseDirectionToTarget,
    calculateTarget,
    getDistance,
    getManhattanDistance,
    alphaStrategy,
    betaStrategy,
    gammaStrategy,
    deltaStrategy
} from './core/AIStrategies.js';

// AI
export { AIController, DEFAULT_MODE_DURATIONS } from './ai/AIController.js';

// Adapters
export { MazeAdapter, DEFAULT_TILE_CONFIG } from './adapters/MazeAdapter.js';

// Features
export {
    findPathBFS,
    findPathAStar,
    hasDirectPath,
    findEscapeRoutes,
    findPathWithTimeout
} from './features/Pathfinding.js';

export {
    MovementPredictor,
    DecisionTree,
    ZoneMovementPlanner
} from './features/PredictiveMovement.js';

// Main Facade
export { MovementSystem } from './MovementSystem.js';

// Version
export const VERSION = '1.0.0';

// Feature Flags for future extensions
export const FEATURES = {
    PATHFINDING: true,
    PREDICTIVE_MOVEMENT: true,
    ZONE_PLANNING: true,
    CACHE_OPTIMIZATION: true
};
