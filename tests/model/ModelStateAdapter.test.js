/**
 * ModelStateAdapter Tests
 * Tests syncing between visual entities and model entities
 */

import { directions } from '../../src/config/gameConfig.js';
import { GameState } from '../../src/model/GameState.js';
import { ModelStateAdapter } from '../../src/model/ModelStateAdapter.js';

// Mock visual entities
function createMockPlayer(overrides = {}) {
    return {
        x: overrides.x ?? 100,
        y: overrides.y ?? 100,
        direction: overrides.direction ?? directions.RIGHT,
        isDying: overrides.isDying ?? false,
        isMoving: overrides.isMoving ?? true,
        die: jest.fn()
    };
}

function createMockGhost(type, overrides = {}) {
    return {
        ghostType: type,
        x: overrides.x ?? 100,
        y: overrides.y ?? 100,
        direction: overrides.direction ?? directions.LEFT,
        isFrightened: overrides.isFrightened ?? false,
        isEaten: overrides.isEaten ?? false,
        isBlinking: overrides.isBlinking ?? false,
        inGhostHouse: overrides.inGhostHouse ?? false,
        mode: overrides.mode ?? 'scatter',
        eat: jest.fn()
    };
}

function createMockFruit(overrides = {}) {
    return {
        x: overrides.x ?? 150,
        y: overrides.y ?? 150,
        active: overrides.active ?? true,
        timer: overrides.timer ?? 5,
        deactivate: jest.fn()
    };
}

describe('ModelStateAdapter', () => {
    let adapter;
    let gameState;

    beforeEach(() => {
        gameState = new GameState({ level: 1 });
        adapter = new ModelStateAdapter(gameState);
    });

    describe('registerVisualEntities', () => {
        it('should register pacman visual entity', () => {
            const pacman = createMockPlayer();
            adapter.registerVisualEntities({ pacman });

            expect(adapter.visualEntities.pacman).toBe(pacman);
        });

        it('should register ghost visual entities', () => {
            const ghosts = [createMockGhost('blinky'), createMockGhost('pinky')];
            adapter.registerVisualEntities({ ghosts });

            expect(adapter.visualEntities.enemies).toHaveLength(2);
        });

        it('should register fruit visual entity', () => {
            const fruit = createMockFruit();
            adapter.registerVisualEntities({ fruit });

            expect(adapter.visualEntities.fruit).toBe(fruit);
        });
    });

    describe('syncPacmanToModel', () => {
        beforeEach(() => {
            const pacman = createMockPlayer({
                x: 50,
                y: 60,
                direction: directions.UP
            });
            adapter.registerVisualEntities({ pacman });
        });

        it('should sync position from visual to model', () => {
            adapter.syncToModel();

            expect(gameState.pacman.x).toBe(50);
            expect(gameState.pacman.y).toBe(60);
        });

        it('should calculate grid position from pixel position', () => {
            adapter.syncToModel();

            // 50/16 = 3.125, rounded to 3
            expect(gameState.pacman.gridX).toBe(3);
            expect(gameState.pacman.gridY).toBe(4); // 60/16 = 3.75, rounded to 4
        });

        it('should store previous position before updating', () => {
            // Initial position
            gameState.pacman.x = 0;
            gameState.pacman.y = 0;

            adapter.syncToModel();

            expect(gameState.pacman.prevX).toBe(0);
            expect(gameState.pacman.prevY).toBe(0);
            expect(gameState.pacman.x).toBe(50);
            expect(gameState.pacman.y).toBe(60);
        });

        it('should sync direction from visual to model', () => {
            adapter.syncToModel();

            expect(gameState.pacman.direction).toBe(directions.UP);
        });

        it('should sync death state', () => {
            adapter.visualEntities.pacman.isDying = true;
            adapter.syncToModel();

            expect(gameState.pacman.isDying).toBe(true);
        });
    });

    describe('syncGhostsToModel', () => {
        beforeEach(() => {
            const ghosts = [
                createMockGhost('blinky', { x: 32, y: 32, isFrightened: true }),
                createMockGhost('pinky', { x: 64, y: 64, isEaten: true })
            ];
            adapter.registerVisualEntities({ ghosts });
        });

        it('should sync ghost positions to model', () => {
            adapter.syncToModel();

            expect(gameState.ghosts[0].x).toBe(32);
            expect(gameState.ghosts[0].y).toBe(32);
            expect(gameState.ghosts[1].x).toBe(64);
            expect(gameState.ghosts[1].y).toBe(64);
        });

        it('should sync ghost grid positions', () => {
            adapter.syncToModel();

            expect(gameState.ghosts[0].gridX).toBe(2); // 32/16
            expect(gameState.ghosts[0].gridY).toBe(2);
        });

        it('should sync frightened state', () => {
            adapter.syncToModel();

            expect(gameState.ghosts[0].isFrightened).toBe(true);
            expect(gameState.ghosts[1].isFrightened).toBe(false);
        });

        it('should sync eaten state', () => {
            adapter.syncToModel();

            expect(gameState.ghosts[0].isEaten).toBe(false);
            expect(gameState.ghosts[1].isEaten).toBe(true);
        });

        it('should store previous positions for swept collision', () => {
            gameState.ghosts[0].x = 0;
            gameState.ghosts[0].y = 0;

            adapter.syncToModel();

            expect(gameState.ghosts[0].prevX).toBe(0);
            expect(gameState.ghosts[0].prevY).toBe(0);
        });
    });

    describe('syncFruitToModel', () => {
        beforeEach(() => {
            const fruit = createMockFruit({ x: 150, y: 150, active: true });
            adapter.registerVisualEntities({ fruit });
        });

        it('should sync fruit position to model', () => {
            adapter.syncToModel();

            expect(gameState.fruit.x).toBe(150);
            expect(gameState.fruit.y).toBe(150);
        });

        it('should sync active state', () => {
            adapter.syncToModel();

            expect(gameState.fruit.active).toBe(true);
        });
    });

    describe('applyCollisionResults', () => {
        it('should call eat() on ghost when ghost_eaten event received', () => {
            const ghosts = [createMockGhost('blinky'), createMockGhost('pinky')];
            adapter.registerVisualEntities({ ghosts });

            adapter.applyCollisionResults([
                {
                    type: 'ghost_eaten',
                    ghostType: 'blinky'
                }
            ]);

            expect(ghosts[0].eat).toHaveBeenCalled();
            expect(ghosts[1].eat).not.toHaveBeenCalled();
        });

        it('should call die() on pacman when pacman_died event received', () => {
            const pacman = createMockPlayer();
            adapter.registerVisualEntities({ pacman });

            adapter.applyCollisionResults([
                {
                    type: 'pacman_died'
                }
            ]);

            expect(pacman.die).toHaveBeenCalled();
        });

        it('should call deactivate() on fruit when fruit_eaten event received', () => {
            const fruit = createMockFruit();
            adapter.registerVisualEntities({ fruit });

            adapter.applyCollisionResults([
                {
                    type: 'fruit_eaten'
                }
            ]);

            expect(fruit.deactivate).toHaveBeenCalled();
        });
    });

    describe('applyDirectUpdate', () => {
        it('should update pacman model directly', () => {
            adapter.applyDirectUpdate({
                pacman: { x: 200, y: 200 }
            });

            expect(gameState.pacman.x).toBe(200);
            expect(gameState.pacman.y).toBe(200);
        });

        it('should update ghost model by type', () => {
            adapter.applyDirectUpdate({
                ghosts: [
                    {
                        ghostType: 'blinky',
                        x: 100,
                        y: 100
                    }
                ]
            });

            expect(gameState.ghosts[0].x).toBe(100);
            expect(gameState.ghosts[0].y).toBe(100);
        });
    });

    describe('getModelState', () => {
        it('should return the model state', () => {
            const state = adapter.getModelState();
            expect(state).toBe(gameState);
        });
    });
});
