/**
 * @pacman/movement - Unified Exports
 * Movement and AI systems
 *
 * This package provides movement systems:
 * - MovementEngine: Core movement logic
 * - MovementComponent: Entity movement state
 * - Direction: Direction constants and utilities
 * - MazeAdapter: Maze grid interface
 * - AIController: AI decision-making
 * - MovementSystem: High-level movement management
 * - IMovementSystem: Movement system interface
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

// System
export { MovementSystem } from '../../movement/MovementSystem.js';

// Interfaces
export { IMovementSystem } from '../../movement/interfaces/IMovementSystem.js';
