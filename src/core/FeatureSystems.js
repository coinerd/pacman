/**
 * Phase 4: Feature-Systeme DI-Integration
 * BossBattleSystem, AdditionalPowerUpSystem, StoryMode
 */

import { globalContainer } from './ServiceContainer.js';
import BossBattleSystem from '../../systems/BossBattleSystem.js';
import AdditionalPowerUpSystem from '../../systems/AdditionalPowerUpSystem.js';
import StoryMode from '../../systems/StoryMode.js';

export function registerFeatureSystems(gameModel) {
    // BossBattleSystem (Singleton - depends on GameModel)
    if (!globalContainer.has('bossBattleSystem')) {
        const system = new BossBattleSystem(gameModel);
        // Add getSnapshot method for DI compatibility
        if (!system.getSnapshot) {
            system.getSnapshot = () => ({
                isActive: system.isActive || false,
                bossHealth: system.bossHealth || 0,
                bossLevel: system.bossLevel || 0
            });
        }
        globalContainer.register('bossBattleSystem', (_container) => system, true);
    }

    // AdditionalPowerUpSystem (Singleton - depends on GameModel)
    if (!globalContainer.has('additionalPowerUpSystem')) {
        const system = new AdditionalPowerUpSystem(gameModel);
        // Add getSnapshot method for DI compatibility
        if (!system.getSnapshot) {
            system.getSnapshot = () => ({
                activePowerUps: system.activePowerUps || []
            });
        }
        globalContainer.register('additionalPowerUpSystem', (_container) => system, true);
    }

    // StoryMode (Singleton - depends on GameModel)
    if (!globalContainer.has('storyMode')) {
        const system = new StoryMode(gameModel);
        // Add getSnapshot method for DI compatibility
        if (!system.getSnapshot) {
            system.getSnapshot = () => ({
                isActive: system.isActive || false,
                currentChapter: system.currentChapter || 0,
                storyProgress: system.storyProgress || 0
            });
        }
        globalContainer.register('storyMode', (_container) => system, true);
    }
}
