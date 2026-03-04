/**
 * ServiceRegistry
 * Central DI-Setup for all game services
 *
 * Phase 4: Dependency Injection Pattern
 */

import { globalContainer } from './ServiceContainer.js';

// Import all services
import { EventBus } from './EventBus.js';

// Core Systems
import { GameState } from '../model/core/GameState.js';
import { EntityRegistry } from '../model/core/EntityRegistry.js';
import { CollisionHandler } from '../model/core/CollisionHandler.js';
import { LevelSystem } from '../model/systems/LevelSystem.js';
import { SpawningSystem } from '../model/systems/SpawningSystem.js';

// Feature Systems
import PlayerModule from '../model/systems/PlayerModule.js';
import ScoreModule from '../model/systems/ScoreModule.js';
import SessionModule from '../model/systems/SessionModule.js';

// Movement System
import { MovementSystem } from '../movement/MovementSystem.js';

// Additional Systems
import { AdditionalPowerUpSystem } from '../systems/AdditionalPowerUpSystem.js';
import BossBattleSystem from '../systems/BossBattleSystem.js';

// View Systems
import { PelletRenderer } from '../views/renderers/PelletRenderer.js';
import { PlayerRenderer } from '../view/components/PlayerRenderer.js';
import { GhostRenderer } from '../view/components/GhostRenderer.js';
import { FruitRenderer } from '../view/components/FruitRenderer.js';
import { SoundManager } from '../managers/SoundManager.js';
import { EffectManager } from '../scenes/systems/EffectManager.js';
import StoryMode from '../systems/StoryMode.js';

/**
 * Register all singleton services
 */
function registerCoreServices(config = {}) {
    // Clear existing services to ensure fresh instances (important for game restarts)
    globalContainer.clear();

    // Event Bus (Singleton - first service)
    globalContainer.register('eventBus', (container) => new EventBus(), true);

    // Game State (Singleton)
    globalContainer.register('gameState', (container) => new GameState({
        level: config.level || 1,
        lives: config.lives || 3,
        score: config.score || 0,
        highScore: config.highScore || 0,
        deathPauseDuration: config.deathPauseDuration
    }), true);

    // Level System (Singleton)
    globalContainer.register('levelSystem', (container) => {
        const levelSystem = new LevelSystem();
        levelSystem.setLevel(config.level || 1);
        return levelSystem;
    }, true);

    // Spawning System (Singleton - depends on levelSystem)
    globalContainer.register('spawningSystem', (container) => {
        const levelSystem = container.get('levelSystem');
        const spawningSystem = new SpawningSystem(levelSystem);

        // Initialize maze
        if (config.maze && config.pelletGrid) {
            spawningSystem.setMaze(config.maze, config.pelletGrid, config.spawnPoints);
        } else {
            spawningSystem.generateMazeForLevel(config.level || 1);
        }

        return spawningSystem;
    }, true);

    // Entity Registry (Singleton - depends on spawningSystem)
    globalContainer.register('entityRegistry', (container) => {
        const spawningSystem = container.get('spawningSystem');
        return new EntityRegistry({
            level: config.level || 1,
            spawnPoints: spawningSystem.getSpawnPoints()
        });
    }, true);

    // Collision Handler (Singleton - transient because needs callbacks)
    globalContainer.register('collisionHandler', (container) => new CollisionHandler({
        onPelletEaten: null, // Will be set by GameModel
        onPowerPelletEaten: null,
        onGhostEaten: null,
        onPacmanDied: null,
        onFruitEaten: null
    }), true);

    // Movement System (Singleton)
    globalContainer.register('movementSystem', (container) => {
        const spawningSystem = container.get('spawningSystem');
        const levelSystem = container.get('levelSystem');

        const movementSystem = new MovementSystem({
            tileSize: 20,
            tunnelRow: 15,
            virusCoreCenter: { x: 13, y: 14 },
            virusCoreEntrance: { x: 13, y: 11 }
        });

        const scatterDuration = levelSystem.getLevelConfig().scatterDuration || 7;
        const chaseDuration = levelSystem.getLevelConfig().chaseDuration || 20;

        movementSystem.initialize(
            spawningSystem.getMaze(),
            {
                tileSize: 20,
                modeDurations: [
                    { mode: 'SCATTER', duration: scatterDuration },
                    { mode: 'CHASE', duration: chaseDuration },
                    { mode: 'SCATTER', duration: scatterDuration },
                    { mode: 'CHASE', duration: chaseDuration },
                    { mode: 'SCATTER', duration: 5 },
                    { mode: 'CHASE', duration: chaseDuration },
                    { mode: 'SCATTER', duration: 5 },
                    { mode: 'CHASE', duration: Infinity }
                ],
                frightenedDuration: levelSystem.getFrightenedDuration() || 8
            }
        );

        return movementSystem;
    }, true);

    // Player Module (Singleton)
    globalContainer.register('playerModule', (container) => new PlayerModule(), true);

    // Score Module (Singleton)
    globalContainer.register('scoreModule', (container) => new ScoreModule(), true);

    // Session Module (Singleton)
    globalContainer.register('sessionModule', (container) => new SessionModule(), true);

    // View Systems (Singleton)
    globalContainer.register('pelletRenderer', (container) => {
        return new PelletRenderer(null); // Scene will be set later
    }, true);

    globalContainer.register('playerRenderer', (container) => {
        return new PlayerRenderer(null); // Scene will be set later
    }, true);

    globalContainer.register('ghostRenderers', (container) => {
        const ghostRenderers = {};
        const ghostTypes = ['red', 'pink', 'cyan', 'orange'];
        for (const ghostType of ghostTypes) {
            ghostRenderers[ghostType] = new GhostRenderer(null, ghostType); // Scene will be set later
        }
        return ghostRenderers;
    }, true);

    globalContainer.register('fruitRenderer', (container) => {
        return new FruitRenderer(null); // Scene will be set later
    }, true);

    globalContainer.register('soundManager', (container) => {
        return new SoundManager(null); // Scene will be set later
    }, true);

    globalContainer.register('effectManager', (container) => {
        return new EffectManager(null); // Scene will be set later
    }, true);
}

/**
 * Register feature systems that depend on GameModel
 * PHASE 6: Feature Systems no longer depend on GameModel directly
 * They communicate via EventBus
 */
function registerFeatureSystems(container) {
    // Boss Battle System (Singleton - no GameModel dependency!)
    globalContainer.register('bossBattleSystem', () => {
        return new BossBattleSystem();
    }, true);

    // Story Mode (Singleton - no GameModel dependency!)
    globalContainer.register('storyMode', () => {
        return new StoryMode();
    }, true);

    // Additional Power Up System (Singleton - depends on EntityRegistry)
    globalContainer.register('additionalPowerUpSystem', () => {
        const entityRegistry = globalContainer.get('entityRegistry');
        const eventBus = globalContainer.get('eventBus');
        return new AdditionalPowerUpSystem(entityRegistry, eventBus);
    }, true);
}

/**
 * Clear all services (useful for testing)
 */
function clearServices() {
    globalContainer.clear();
}

/**
 * Get service statistics
 */
function getServiceStats() {
    return {
        registered: globalContainer.getServiceNames(),
        singletons: globalContainer.getSingletonNames(),
        instantiated: globalContainer.getInstanceNames()
    };
}

export {
    registerCoreServices,
    registerFeatureSystems,
    clearServices,
    getServiceStats
};
