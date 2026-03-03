/**
 * @pacman/core - Unified Exports
 * Core game systems and utilities
 *
 * This package provides core game systems:
 * - LevelSystem: Level progression and configuration
 * - SpawningSystem: Entity spawning and maze generation
 * - AchievementSystem: Achievement tracking
 * - ReplaySystem: Game recording and playback
 * - EntityRegistry: Central entity management
 * - ServiceContainer: Dependency injection container
 * - ServiceRegistry: Service registration and management
 */

// Systems
export { LevelSystem } from '../../model/systems/LevelSystem.js';
export { SpawningSystem } from '../../model/systems/SpawningSystem.js';
export { AchievementSystem } from '../../systems/AchievementSystem.js';
export { ReplaySystem } from '../../systems/ReplaySystem.js';

// Entities
export { PlayerState } from '../../model/entities/PlayerState.js';
export { EnemyState } from '../../model/entities/EnemyState.js';
export { FruitState } from '../../model/entities/FruitState.js';
export { EntityRegistry } from '../../model/core/EntityRegistry.js';

// Core
export { GameState } from '../../model/core/GameState.js';
export { GameModelDI } from '../../model/core/GameModelDI.js';

// Dependency Injection
export { ServiceContainer } from '../../core/ServiceContainer.js';
export { globalContainer } from '../../core/ServiceContainer.js';
export { registerCoreServices, registerFeatureSystems } from '../../core/ServiceRegistry.js';

// Events
export { GAME_EVENTS, gameEvents, EventBus } from '../../core/EventBus.js';

// Modules
export { PlayerModule } from '../../model/systems/PlayerModule.js';
export { ScoreModule } from '../../model/systems/ScoreModule.js';
export { SessionModule } from '../../model/systems/SessionModule.js';

// Collision
export { CollisionHandler } from '../../model/systems/CollisionHandler.js';
