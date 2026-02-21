/**
 * ViewEvents
 * Events that the View should subscribe to for rendering updates
 * Separated from GAME_EVENTS to clarify View responsibilities
 */

export const VIEW_EVENTS = {
    // === SNAPSHOT EVENTS ===
    // Periodic state updates (alternative to direct model access)
    STATE_UPDATED: 'view:state-updated',
    SNAPSHOT_READY: 'view:snapshot-ready',

    // === ENTITY EVENTS ===
    // Entity movement and state changes
    ENTITY_MOVED: 'view:entity-moved',
    ENTITY_SPAWNED: 'view:entity-spawned',
    ENTITY_DESPAWNED: 'view:entity-despawned',
    ENTITY_STATE_CHANGED: 'view:entity-state-changed',

    // === PACMAN EVENTS ===
    PACMAN_DIRECTION_CHANGED: 'view:pacman-direction-changed',
    PACMAN_ANIMATION_FRAME: 'view:pacman-animation-frame',
    PACMAN_DEATH_STARTED: 'view:pacman-death-started',
    PACMAN_DEATH_PROGRESS: 'view:pacman-death-progress',
    PACMAN_DEATH_COMPLETE: 'view:pacman-death-complete',

    // === GHOST EVENTS ===
    GHOST_MODE_CHANGED: 'view:ghost-mode-changed',
    GHOST_DIRECTION_CHANGED: 'view:ghost-direction-changed',
    GHOST_FRIGHTENED: 'view:ghost-frightened',
    GHOST_EATEN: 'view:ghost-eaten',
    GHOST_RETURNING: 'view:ghost-returning',

    // === MAZE EVENTS ===
    MAZE_CREATED: 'view:maze-created',
    MAZE_UPDATED: 'view:maze-updated',
    PELLET_SPAWNED: 'view:pellet-spawned',
    PELLET_EATEN: 'view:pellet-eaten',
    PELLET_BATCH_UPDATED: 'view:pellet-batch-updated', // For efficiency

    // === EFFECT EVENTS ===
    EFFECT_CREATED: 'view:effect-created',
    EFFECT_DESTROYED: 'view:effect-destroyed',
    PARTICLE_EMIT: 'view:particle-emit',
    SCREEN_FLASH: 'view:screen-flash',
    SCREEN_SHAKE: 'view:screen-shake',

    // === AUDIO EVENTS ===
    AUDIO_PLAY: 'view:audio-play',
    AUDIO_STOP: 'view:audio-stop',
    AUDIO_VOLUME_CHANGE: 'view:audio-volume-change',
    AUDIO_MUTE_TOGGLE: 'view:audio-mute-toggle',

    // === UI EVENTS ===
    UI_SHOW: 'view:ui-show',
    UI_HIDE: 'view:ui-hide',
    UI_UPDATE: 'view:ui-update',
    MESSAGE_DISPLAY: 'view:message-display',
    MESSAGE_HIDE: 'view:message-hide',

    // === BOSS EVENTS ===
    BOSS_SPAWNED: 'view:boss-spawned',
    BOSS_PHASE_CHANGED: 'view:boss-phase-changed',
    BOSS_DAMAGED: 'view:boss-damaged',
    BOSS_DEFEATED: 'view:boss-defeated',
    BOSS_HEALTH_UPDATE: 'view:boss-health-update',

    // === POWER-UP EVENTS ===
    POWERUP_SPAWNED: 'view:powerup-spawned',
    POWERUP_COLLECTED: 'view:powerup-collected',
    POWERUP_EXPIRED: 'view:powerup-expired',
    POWERUP_ACTIVATED: 'view:powerup-activated',

    // === STORY EVENTS ===
    STORY_CHAPTER_START: 'view:story-chapter-start',
    STORY_CHAPTER_COMPLETE: 'view:story-chapter-complete',
    STORY_NARRATIVE_SHOW: 'view:story-narrative-show',
    STORY_NARRATIVE_HIDE: 'view:story-narrative-hide'
};

/**
 * ViewEventEmitter
 * Helper to emit view-specific events
 */
export class ViewEventEmitter {
    constructor(eventBus) {
        this.eventBus = eventBus;
    }

    // Snapshot
    emitSnapshot(snapshot) {
        this.eventBus.emit(VIEW_EVENTS.SNAPSHOT_READY, snapshot);
    }

    // Entity
    emitEntityMoved(entityId, x, y, direction) {
        this.eventBus.emit(VIEW_EVENTS.ENTITY_MOVED, {
            entityId,
            x,
            y,
            direction,
            timestamp: Date.now()
        });
    }

    // Pellet
    emitPelletEaten(gridX, gridY, type) {
        this.eventBus.emit(VIEW_EVENTS.PELLET_EATEN, {
            gridX,
            gridY,
            type,
            timestamp: Date.now()
        });
    }

    // Effect
    emitEffectCreate(effectType, x, y, data = {}) {
        this.eventBus.emit(VIEW_EVENTS.EFFECT_CREATED, {
            effectType,
            x,
            y,
            ...data,
            timestamp: Date.now()
        });
    }

    // Boss
    emitBossSpawned(bossType, x, y) {
        this.eventBus.emit(VIEW_EVENTS.BOSS_SPAWNED, {
            bossType,
            x,
            y,
            timestamp: Date.now()
        });
    }

    // Story
    emitStoryChapterStart(chapterName, description) {
        this.eventBus.emit(VIEW_EVENTS.STORY_CHAPTER_START, {
            chapterName,
            description,
            timestamp: Date.now()
        });
    }
}
