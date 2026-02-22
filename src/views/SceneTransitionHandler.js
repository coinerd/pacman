/**
 * SceneTransitionHandler
 * Handles scene transitions on behalf of View
 * Delegates to Controller via events
 */

import { GAME_EVENTS } from '../core/EventBus.js';

export class SceneTransitionHandler {
    constructor({ eventBus }) {
        this.eventBus = eventBus;
    }

    /**
     * Navigate to scene (via event to Controller)
     * View should not directly call scene transitions
     */
    requestSceneTransition(sceneKey, data = {}) {
        const transitions = {
            'WinScene': 'GAME_WIN',
            'GameOverScene': 'GAME_OVER',
            'MenuScene': 'RETURN_TO_MENU',
            'PauseScene': 'PAUSE_GAME',
            'SettingsScene': 'OPEN_SETTINGS'
        };

        const event = transitions[sceneKey] || `NAVIGATE_TO_${sceneKey.toUpperCase()}`;

        this.eventBus.emit(event, {
            sceneKey,
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Request pause
     */
    requestPause() {
        this.eventBus.emit(GAME_EVENTS.PAUSE_REQUESTED);
    }

    /**
     * Request resume
     */
    requestResume() {
        this.eventBus.emit(GAME_EVENTS.RESUME_REQUESTED);
    }

    /**
     * Request restart
     */
    requestRestart() {
        this.eventBus.emit(GAME_EVENTS.RESTART_LEVEL_REQUESTED);
    }

    /**
     * Request return to menu
     */
    requestReturnToMenu() {
        this.eventBus.emit(GAME_EVENTS.RETURN_TO_MENU_REQUESTED);
    }
}
