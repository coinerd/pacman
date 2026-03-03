/**
 * RefactoredViewExample
 * Beispiel-Implementierung eines entkoppelten Views
 * Zeigt, wie die verbesserte Architektur in der Praxis aussieht
 */

import { GameSnapshot, ViewContext, ViewState } from './ViewInterface.js';
import { SceneTransitionHandler } from './SceneTransitionHandler.js';
import { VIEW_EVENTS } from './ViewEvents.js';
import { gameEvents } from '../core/EventBus.js';
import { PlayerRenderer } from '../view/components/PlayerRenderer.js';
import { GhostRenderer } from '../view/components/GhostRenderer.js';
import { FruitRenderer } from '../view/components/FruitRenderer.js';

/**
 * Entkoppelter GameView
 * - Kein direkter Zugriff auf GameModel
 * - Nur Events und Snapshots
 * - Scene-Transitions über Handler
 */
export class DecoupledGameView {
    /**
     * @param {ViewContext} context - ViewContext mit nötigen Abhängigkeiten
     */
    constructor(context) {
        // Context statt direkter gameModel-Zugriff ✅
        this.scene = context.scene;
        this.storageManager = context.storageManager;
        this.eventBus = context.eventBus;

        // View-spezifischer Zustand (nicht geteilt) ✅
        this.viewState = new ViewState();

        // Scene-Transition Handler (keine direkten Aufrufe) ✅
        this.transitionHandler = new SceneTransitionHandler({
            eventBus: this.eventBus
        });

        // Renderers
        this.playerRenderer = null;
        this.ghostRenderers = new Map();
        this.fruitRenderer = null;

        // Event unsubscribers
        this.unsubscribers = [];

        // Performance tracking
        this.lastSnapshot = null;
        this.frameCount = 0;
    }

    /**
     * Initialize view
     */
    create() {
        this.createBackground();
        this.createRenderers();
        this.bindEvents();
    }

    /**
     * Create visual renderers (ohne Model-Zugriff) ✅
     */
    createRenderers() {
        // Renderers werden später mit Snapshot-Daten initialisiert
        this.playerRenderer = new PlayerRenderer(this.scene);

        // Ghost-Renderers initialisieren (werden mit Snapshot befüllt)
        ['alpha', 'beta', 'gamma', 'delta'].forEach(ghostType => {
            this.ghostRenderers.set(
                ghostType,
                new GhostRenderer(this.scene)
            );
        });

        this.fruitRenderer = new FruitRenderer(this.scene);
    }

    /**
     * Bind to View-Events (nicht GAME_EVENTS) ✅
     */
    bindEvents() {
        this.unsubscribers.push(
            // Snapshot updates
            this.eventBus.on(VIEW_EVENTS.SNAPSHOT_READY, (snapshot) => {
                this.updateFromSnapshot(snapshot);
            }),

            // Entity events
            this.eventBus.on(VIEW_EVENTS.ENTITY_MOVED, (data) => {
                this.onEntityMoved(data);
            }),

            // Pellet events
            this.eventBus.on(VIEW_EVENTS.PELLET_EATEN, (data) => {
                this.onPelletEaten(data);
            }),

            // Boss events
            this.eventBus.on(VIEW_EVENTS.BOSS_SPAWNED, (data) => {
                this.onBossSpawned(data);
            }),

            // Story events
            this.eventBus.on(VIEW_EVENTS.STORY_CHAPTER_START, (data) => {
                this.showChapterStart(data);
            }),

            // Audio events
            this.eventBus.on(VIEW_EVENTS.AUDIO_PLAY, (data) => {
                this.playAudio(data);
            })
        );
    }

    /**
     * Haupt-Update-Methode: Snapshot-basiert ✅
     * @param {GameSnapshot} snapshot - Immutable state snapshot
     */
    updateFromSnapshot(snapshot) {
        // Dirty-Check: Nur updaten, wenn Snapshot geändert
        if (this.lastSnapshot && this.snapshotEquals(this.lastSnapshot, snapshot)) {
            return;
        }

        this.frameCount++;
        this.lastSnapshot = snapshot;

        // Maze updaten (falls geändert)
        if (this.shouldUpdateMaze(snapshot)) {
            this.updateMazeVisuals(snapshot.maze);
        }

        // Pellets updaten
        this.updatePelletVisuals(snapshot.pelletGrid);

        // Entity Renderers updaten
        if (snapshot.pacman) {
            this.playerRenderer.updateFromSnapshot(snapshot.pacman);
        }

        snapshot.ghosts.forEach(ghost => {
            const renderer = this.ghostRenderers.get(ghost.ghostType);
            if (renderer) {
                renderer.updateFromSnapshot(ghost);
            }
        });

        if (snapshot.fruit) {
            this.fruitRenderer.updateFromSnapshot(snapshot.fruit);
        }

        // Boss visuals
        if (snapshot.boss) {
            this.updateBossVisuals(snapshot.boss);
        }

        // Power-ups
        if (snapshot.powerUps) {
            this.updatePowerUpVisuals(snapshot.powerUps);
        }
    }

    /**
     * Maze visuals updaten (lazy) ✅
     */
    updateMazeVisuals(maze) {
        // Erstelle/aktualisiere Maze-Grafik
        // Kein direct Model-Zugriff, nur aus Snapshot
        if (!this.mazeTexture || this.mazeTexture.needsUpdate) {
            const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
            // TODO: Zeichne Maze aus maze-Daten
            // graphics.generateTexture('mazeWalls', mazeWidth, mazeHeight);
            graphics.destroy();
        }
    }

    /**
     * Pellet visuals updaten ✅
     */
    updatePelletVisuals(pelletGrid) {
        // Entferne nicht mehr sichtbare Pellets
        const visibleKeys = this.viewState.visiblePellets;

        // Finde entfernte Pellets
        for (const key of visibleKeys) {
            const [x, y] = key.split(',').map(Number);
            if (!this.hasPelletInGrid(pelletGrid, x, y)) {
                this.removePelletVisual(x, y);
                visibleKeys.delete(key);
            }
        }

        // Füge neue Pellets hinzu
        for (let y = 0; y < pelletGrid.length; y++) {
            for (let x = 0; x < pelletGrid[y].length; x++) {
                const key = `${x},${y}`;
                if (pelletGrid[y][x] !== 0 && !visibleKeys.has(key)) {
                    this.addPelletVisual(x, y, pelletGrid[y][x]);
                    visibleKeys.add(key);
                }
            }
        }
    }

    /**
     * Entity-Moved Event Handler ✅
     */
    onEntityMoved(data) {
        const { entityId, x, y, direction } = data;

        // Update visual entity
        const visual = this.viewState.getVisual(entityId);
        if (visual) {
            visual.x = x;
            visual.y = y;
            visual.setDirection(direction);
        }
    }

    /**
     * Pellet-Eaten Event Handler ✅
     */
    onPelletEaten(data) {
        const { gridX, gridY, type } = data;
        this.removePelletVisual(gridX, gridY);
        this.viewState.visiblePellets.delete(`${gridX},${gridY}`);
    }

    /**
     * Boss-Spawned Event Handler ✅
     */
    onBossSpawned(data) {
        const { bossType, x, y } = data;
        this.createBossVisual(bossType, x, y);
    }

    /**
     * Scene-Transition via Handler ✅
     * Kein direkter Aufruf von scene.start()
     */
    onLevelComplete(snapshot) {
        // Save high score (via storageManager, nicht über Model)
        this.storageManager.saveHighScore(snapshot.highScore);

        // Request transition (nicht direkt) ✅
        this.transitionHandler.requestSceneTransition('WinScene', {
            score: snapshot.score,
            level: snapshot.level,
            highScore: snapshot.highScore
        });
    }

    onGameOver(snapshot) {
        this.storageManager.saveHighScore(snapshot.highScore);

        this.transitionHandler.requestSceneTransition('GameOverScene', {
            score: snapshot.score,
            highScore: snapshot.highScore
        });
    }

    /**
     * Hilfsmethoden
     */
    shouldUpdateMaze(snapshot) {
        return !this.lastSnapshot ||
            !this.mazeEquals(this.lastSnapshot.maze, snapshot.maze);
    }

    snapshotEquals(s1, s2) {
        return s1.tickCount === s2.tickCount;
    }

    mazeEquals(m1, m2) {
        if (m1.length !== m2.length) {
            return false;
        }
        for (let i = 0; i < m1.length; i++) {
            if (m1[i].length !== m2[i].length) {
                return false;
            }
            for (let j = 0; j < m1[i].length; j++) {
                if (m1[i][j] !== m2[i][j]) {
                    return false;
                }
            }
        }
        return true;
    }

    hasPelletInGrid(pelletGrid, x, y) {
        return pelletGrid[y] && pelletGrid[y][x] !== 0;
    }

    /**
     * Cleanup
     */
    cleanup() {
        // Unsubscribe from events
        this.unsubscribers.forEach(unsub => unsub());
        this.unsubscribers = [];

        // Clear view state
        this.viewState.clear();

        // Destroy renderers
        if (this.playerRenderer) {
            this.playerRenderer.destroy();
        }

        for (const renderer of this.ghostRenderers.values()) {
            renderer.destroy();
        }

        if (this.fruitRenderer) {
            this.fruitRenderer.destroy();
        }

        this.lastSnapshot = null;
    }
}

/**
 * Factory function für einfache View-Erstellung
 */
export function createDecoupledView(scene, gameModel, storageManager) {
    const context = new ViewContext({
        scene,
        storageManager,
        eventBus: gameEvents // Import from EventBus
    });

    return new DecoupledGameView(context);
}
