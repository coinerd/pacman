/**
 * ViewEvents.test.js
 * Tests for ViewEvents and ViewEventEmitter
 * Phase 3: View-Events Interface
 */

import { VIEW_EVENTS, ViewEventEmitter } from '../../src/views/ViewEvents.js';
import { gameEvents } from '../../src/core/EventBus.js';

describe('VIEW_EVENTS', () => {
    it('should define all expected event types', () => {
        // Snapshot events
        expect(VIEW_EVENTS.STATE_UPDATED).toBeDefined();
        expect(VIEW_EVENTS.SNAPSHOT_READY).toBeDefined();

        // Entity events
        expect(VIEW_EVENTS.ENTITY_MOVED).toBeDefined();
        expect(VIEW_EVENTS.ENTITY_SPAWNED).toBeDefined();
        expect(VIEW_EVENTS.ENTITY_DESPAWNED).toBeDefined();
        expect(VIEW_EVENTS.ENTITY_STATE_CHANGED).toBeDefined();

        // Pacman events
        expect(VIEW_EVENTS.PACMAN_DIRECTION_CHANGED).toBeDefined();
        expect(VIEW_EVENTS.PACMAN_ANIMATION_FRAME).toBeDefined();
        expect(VIEW_EVENTS.PACMAN_DEATH_STARTED).toBeDefined();
        expect(VIEW_EVENTS.PACMAN_DEATH_PROGRESS).toBeDefined();
        expect(VIEW_EVENTS.PACMAN_DEATH_COMPLETE).toBeDefined();

        // Ghost events
        expect(VIEW_EVENTS.GHOST_MODE_CHANGED).toBeDefined();
        expect(VIEW_EVENTS.GHOST_DIRECTION_CHANGED).toBeDefined();
        expect(VIEW_EVENTS.GHOST_FRIGHTENED).toBeDefined();
        expect(VIEW_EVENTS.GHOST_EATEN).toBeDefined();
        expect(VIEW_EVENTS.GHOST_RETURNING).toBeDefined();

        // Maze events
        expect(VIEW_EVENTS.MAZE_CREATED).toBeDefined();
        expect(VIEW_EVENTS.MAZE_UPDATED).toBeDefined();
        expect(VIEW_EVENTS.PELLET_SPAWNED).toBeDefined();
        expect(VIEW_EVENTS.PELLET_EATEN).toBeDefined();
        expect(VIEW_EVENTS.PELLET_BATCH_UPDATED).toBeDefined();

        // Effect events
        expect(VIEW_EVENTS.EFFECT_CREATED).toBeDefined();
        expect(VIEW_EVENTS.EFFECT_DESTROYED).toBeDefined();
        expect(VIEW_EVENTS.PARTICLE_EMIT).toBeDefined();
        expect(VIEW_EVENTS.SCREEN_FLASH).toBeDefined();
        expect(VIEW_EVENTS.SCREEN_SHAKE).toBeDefined();

        // Audio events
        expect(VIEW_EVENTS.AUDIO_PLAY).toBeDefined();
        expect(VIEW_EVENTS.AUDIO_STOP).toBeDefined();
        expect(VIEW_EVENTS.AUDIO_VOLUME_CHANGE).toBeDefined();
        expect(VIEW_EVENTS.AUDIO_MUTE_TOGGLE).toBeDefined();

        // UI events
        expect(VIEW_EVENTS.UI_SHOW).toBeDefined();
        expect(VIEW_EVENTS.UI_HIDE).toBeDefined();
        expect(VIEW_EVENTS.UI_UPDATE).toBeDefined();
        expect(VIEW_EVENTS.MESSAGE_DISPLAY).toBeDefined();
        expect(VIEW_EVENTS.MESSAGE_HIDE).toBeDefined();

        // Boss events
        expect(VIEW_EVENTS.BOSS_SPAWNED).toBeDefined();
        expect(VIEW_EVENTS.BOSS_PHASE_CHANGED).toBeDefined();
        expect(VIEW_EVENTS.BOSS_DAMAGED).toBeDefined();
        expect(VIEW_EVENTS.BOSS_DEFEATED).toBeDefined();
        expect(VIEW_EVENTS.BOSS_HEALTH_UPDATE).toBeDefined();

        // Power-up events
        expect(VIEW_EVENTS.POWERUP_SPAWNED).toBeDefined();
        expect(VIEW_EVENTS.POWERUP_COLLECTED).toBeDefined();
        expect(VIEW_EVENTS.POWERUP_EXPIRED).toBeDefined();
        expect(VIEW_EVENTS.POWERUP_ACTIVATED).toBeDefined();

        // Story events
        expect(VIEW_EVENTS.STORY_CHAPTER_START).toBeDefined();
        expect(VIEW_EVENTS.STORY_CHAPTER_COMPLETE).toBeDefined();
        expect(VIEW_EVENTS.STORY_NARRATIVE_SHOW).toBeDefined();
        expect(VIEW_EVENTS.STORY_NARRATIVE_HIDE).toBeDefined();
    });

    it('should have unique event names', () => {
        const eventNames = Object.values(VIEW_EVENTS);
        const uniqueNames = new Set(eventNames);
        expect(eventNames.length).toBe(uniqueNames.size);
    });

    it('should use view: prefix for events', () => {
        Object.values(VIEW_EVENTS).forEach(eventName => {
            expect(eventName).toMatch(/^view:/);
        });
    });
});

describe('ViewEventEmitter', () => {
    let emitter;

    beforeEach(() => {
        emitter = new ViewEventEmitter(gameEvents);
        gameEvents.clear();
    });

    afterEach(() => {
        gameEvents.clear();
    });

    describe('Snapshot events', () => {
        it('should emit snapshot event', () => {
            const listener = jest.fn();
            gameEvents.on(VIEW_EVENTS.SNAPSHOT_READY, listener);

            const snapshot = { score: 100, level: 1 };
            emitter.emitSnapshot(snapshot);

            expect(listener).toHaveBeenCalledWith(snapshot);
            expect(listener).toHaveBeenCalledTimes(1);
        });
    });

    describe('Entity events', () => {
        it('should emit entity moved event', () => {
            const listener = jest.fn();
            gameEvents.on(VIEW_EVENTS.ENTITY_MOVED, listener);

            emitter.emitEntityMoved('pacman', 5, 5, { x: 1, y: 0 });

            expect(listener).toHaveBeenCalledWith({
                entityId: 'pacman',
                x: 5,
                y: 5,
                direction: { x: 1, y: 0 },
                timestamp: expect.any(Number)
            });
            expect(listener).toHaveBeenCalledTimes(1);
        });
    });

    describe('Pellet events', () => {
        it('should emit pellet eaten event', () => {
            const listener = jest.fn();
            gameEvents.on(VIEW_EVENTS.PELLET_EATEN, listener);

            emitter.emitPelletEaten(5, 5, 'power_pellet');

            expect(listener).toHaveBeenCalledWith({
                gridX: 5,
                gridY: 5,
                type: 'power_pellet',
                timestamp: expect.any(Number)
            });
            expect(listener).toHaveBeenCalledTimes(1);
        });

        it('should include timestamp in events', () => {
            const listener = jest.fn();
            gameEvents.on(VIEW_EVENTS.PELLET_EATEN, listener);

            const beforeTime = Date.now();
            emitter.emitPelletEaten(5, 5, 'pellet');
            const afterTime = Date.now();

            expect(listener).toHaveBeenCalledWith(
                expect.objectContaining({
                    timestamp: expect.any(Number)
                })
            );

            const timestamp = listener.mock.calls[0][0].timestamp;
            expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
            expect(timestamp).toBeLessThanOrEqual(afterTime);
        });
    });

    describe('Effect events', () => {
        it('should emit effect created event', () => {
            const listener = jest.fn();
            gameEvents.on(VIEW_EVENTS.EFFECT_CREATED, listener);

            emitter.emitEffectCreate('explosion', 100, 200, { damage: 50 });

            expect(listener).toHaveBeenCalledWith({
                effectType: 'explosion',
                x: 100,
                y: 200,
                damage: 50,
                timestamp: expect.any(Number)
            });
            expect(listener).toHaveBeenCalledTimes(1);
        });

        it('should emit effect with default data', () => {
            const listener = jest.fn();
            gameEvents.on(VIEW_EVENTS.EFFECT_CREATED, listener);

            emitter.emitEffectCreate('flash', 50, 50);

            expect(listener).toHaveBeenCalledWith({
                effectType: 'flash',
                x: 50,
                y: 50,
                timestamp: expect.any(Number)
            });
        });
    });

    describe('Boss events', () => {
        it('should emit boss spawned event', () => {
            const listener = jest.fn();
            gameEvents.on(VIEW_EVENTS.BOSS_SPAWNED, listener);

            emitter.emitBossSpawned('alpha', 100, 200);

            expect(listener).toHaveBeenCalledWith({
                bossType: 'alpha',
                x: 100,
                y: 200,
                timestamp: expect.any(Number)
            });
            expect(listener).toHaveBeenCalledTimes(1);
        });
    });

    describe('Story events', () => {
        it('should emit story chapter start event', () => {
            const listener = jest.fn();
            gameEvents.on(VIEW_EVENTS.STORY_CHAPTER_START, listener);

            emitter.emitStoryChapterStart('Chapter 1', 'The Beginning');

            expect(listener).toHaveBeenCalledWith({
                chapterName: 'Chapter 1',
                description: 'The Beginning',
                timestamp: expect.any(Number)
            });
            expect(listener).toHaveBeenCalledTimes(1);
        });
    });
});

describe('ViewEventEmitter Integration', () => {
    let emitter;

    beforeEach(() => {
        emitter = new ViewEventEmitter(gameEvents);
        gameEvents.clear();
    });

    afterEach(() => {
        gameEvents.clear();
    });

    it('should emit multiple events correctly', () => {
        const pelletListener = jest.fn();
        const entityListener = jest.fn();
        const effectListener = jest.fn();

        gameEvents.on(VIEW_EVENTS.PELLET_EATEN, pelletListener);
        gameEvents.on(VIEW_EVENTS.ENTITY_MOVED, entityListener);
        gameEvents.on(VIEW_EVENTS.EFFECT_CREATED, effectListener);

        // Emit multiple events
        emitter.emitEntityMoved('pacman', 5, 5, { x: 1, y: 0 });
        emitter.emitPelletEaten(5, 5, 'pellet');
        emitter.emitEffectCreate('explosion', 100, 100);

        expect(pelletListener).toHaveBeenCalledTimes(1);
        expect(entityListener).toHaveBeenCalledTimes(1);
        expect(effectListener).toHaveBeenCalledTimes(1);
    });

    it('should support unsubscribing from events', () => {
        const listener = jest.fn();
        const unsubscribe = gameEvents.on(VIEW_EVENTS.ENTITY_MOVED, listener);

        emitter.emitEntityMoved('pacman', 5, 5, { x: 1, y: 0 });
        expect(listener).toHaveBeenCalledTimes(1);

        unsubscribe();

        emitter.emitEntityMoved('pacman', 6, 6, { x: 0, y: 1 });
        expect(listener).toHaveBeenCalledTimes(1); // Still 1, not 2
    });

    it('should handle multiple listeners for same event', () => {
        const listener1 = jest.fn();
        const listener2 = jest.fn();

        gameEvents.on(VIEW_EVENTS.PELLET_EATEN, listener1);
        gameEvents.on(VIEW_EVENTS.PELLET_EATEN, listener2);

        emitter.emitPelletEaten(5, 5, 'pellet');

        expect(listener1).toHaveBeenCalledTimes(1);
        expect(listener2).toHaveBeenCalledTimes(1);
    });
});
