import { performGridMovementStep, tileCenter, EPS } from '../../src/utils/TileMovement.js';
import { checkGhostCollision, checkAllGhostCollisions } from '../../src/utils/CollisionDetection.js';
import { isPortalTile, handlePortalTraversal } from '../../src/utils/WarpTunnel.js';
import { gameConfig, directions } from '../../src/config/gameConfig.js';
import { createMockMaze } from '../utils/testHelpers.js';

describe('TunnelCrossingCorner Integration Tests', () => {
    let mockMaze;
    const TUNNEL_ROW = 14;
    const TILE_SIZE = gameConfig.tileSize;

    beforeEach(() => {
        mockMaze = createMockMaze(createRealisticMaze());
    });

    describe('Tunnel Traversal Integration (WarpTunnel + TileMovement)', () => {
        test('entity enters left portal and teleports to right portal', () => {
            const entity = createEntity({
                x: -10,
                y: tileCenter(0, TUNNEL_ROW).y,
                gridX: 0,
                gridY: TUNNEL_ROW,
                direction: directions.LEFT
            });

            expect(isPortalTile(entity.gridX, entity.gridY)).toBe(true);

            handlePortalTraversal(entity, TILE_SIZE);

            expect(entity.gridX).toBe(27);
            expect(entity.gridY).toBe(TUNNEL_ROW);
            expect(entity.x).toBe(tileCenter(27, TUNNEL_ROW).x);
            expect(entity.y).toBe(tileCenter(27, TUNNEL_ROW).y);
        });

        test('entity enters right portal and teleports to left portal', () => {
            const entity = createEntity({
                x: gameConfig.mazeWidth * TILE_SIZE + 10,
                y: tileCenter(27, TUNNEL_ROW).y,
                gridX: 27,
                gridY: TUNNEL_ROW,
                direction: directions.RIGHT
            });

            expect(isPortalTile(entity.gridX, entity.gridY)).toBe(true);

            handlePortalTraversal(entity, TILE_SIZE);

            expect(entity.gridX).toBe(0);
            expect(entity.gridY).toBe(TUNNEL_ROW);
            expect(entity.x).toBe(tileCenter(0, TUNNEL_ROW).x);
            expect(entity.y).toBe(tileCenter(0, TUNNEL_ROW).y);
        });

        test('entity traverses tunnel in one timestep', () => {
            const entity = createEntity({
                x: tileCenter(1, TUNNEL_ROW).x,
                y: tileCenter(1, TUNNEL_ROW).y,
                gridX: 1,
                gridY: TUNNEL_ROW,
                prevGridX: 1,
                prevGridY: TUNNEL_ROW,
                direction: directions.LEFT,
                speed: 400
            });

            const delta = 100;
            performGridMovementStep(entity, mockMaze, delta);

            expect(entity.gridX).toBeLessThan(1);
        });

        test('multiple entities in tunnel maintain individual positions', () => {
            const entity1 = createEntity({
                x: tileCenter(1, TUNNEL_ROW).x,
                y: tileCenter(1, TUNNEL_ROW).y,
                gridX: 1,
                gridY: TUNNEL_ROW,
                name: 'entity1',
                direction: directions.LEFT,
                speed: 300
            });

            const entity2 = createEntity({
                x: tileCenter(26, TUNNEL_ROW).x,
                y: tileCenter(26, TUNNEL_ROW).y,
                gridX: 26,
                gridY: TUNNEL_ROW,
                name: 'entity2',
                direction: directions.RIGHT,
                speed: 300
            });

            const delta = 100;
            performGridMovementStep(entity1, mockMaze, delta);
            performGridMovementStep(entity2, mockMaze, delta);

            expect(entity1.gridX).not.toBe(entity2.gridX);
            expect(entity1.x).not.toBe(entity2.x);
        });

        test('entity with nextDirection at portal entry maintains direction', () => {
            const entity = createEntity({
                x: tileCenter(2, TUNNEL_ROW).x,
                y: tileCenter(2, TUNNEL_ROW).y,
                gridX: 2,
                gridY: TUNNEL_ROW,
                prevGridX: 2,
                prevGridY: TUNNEL_ROW,
                direction: directions.LEFT,
                speed: 300
            });

            const delta = 16;
            performGridMovementStep(entity, mockMaze, delta);

            expect(entity.direction).toBe(directions.LEFT);
        });
    });

    describe('Tunnel Traversal Edge Cases', () => {
        test('entity moves exactly at portal boundary triggers immediate traversal', () => {
            const entity = createEntity({
                x: -1,
                y: tileCenter(0, TUNNEL_ROW).y,
                gridX: 0,
                gridY: TUNNEL_ROW,
                direction: directions.LEFT
            });

            expect(isPortalTile(entity.gridX, entity.gridY)).toBe(true);
            handlePortalTraversal(entity, TILE_SIZE);

            expect(entity.gridX).toBe(27);
            expect(entity.x).toBe(tileCenter(27, TUNNEL_ROW).x);
        });

        test('entity moving against portal wall does not traverse', () => {
            const entity = createEntity({
                x: tileCenter(1, TUNNEL_ROW).x,
                y: tileCenter(1, TUNNEL_ROW).y,
                gridX: 1,
                gridY: TUNNEL_ROW,
                direction: directions.RIGHT,
                speed: 300
            });

            const delta = 100;
            performGridMovementStep(entity, mockMaze, delta);

            expect(entity.gridX).toBeGreaterThan(1);
            expect(entity.gridX).not.toBe(27);
        });

        test('entity with speed multiplier in tunnel maintains correct speed', () => {
            const entity = createEntity({
                x: tileCenter(5, TUNNEL_ROW).x,
                y: tileCenter(5, TUNNEL_ROW).y,
                gridX: 5,
                gridY: TUNNEL_ROW,
                direction: directions.LEFT,
                speed: 300 * 0.4
            });

            const startX = entity.x;
            const delta = 100;
            performGridMovementStep(entity, mockMaze, delta);

            const moveDistance = Math.abs(entity.x - startX);
            const expectedDistance = entity.speed * (delta / 1000);

            expect(moveDistance).toBeGreaterThan(0);
            expect(moveDistance).toBeLessThanOrEqual(expectedDistance + 1);
        });

        test('entity without prevGrid at portal handles correctly', () => {
            const entity = createEntity({
                x: -1,
                y: tileCenter(0, TUNNEL_ROW).y,
                gridX: 0,
                gridY: TUNNEL_ROW,
                direction: directions.LEFT
            });

            expect(entity.prevGridX).toBeUndefined();
            handlePortalTraversal(entity, TILE_SIZE);

            expect(entity.prevGridX).toBe(0);
            expect(entity.prevGridY).toBe(TUNNEL_ROW);
            expect(entity.gridX).toBe(27);
        });
    });

    describe('Crossing Detection Integration (CollisionDetection + TileMovement)', () => {
        test('pacman and ghost cross paths - collision detected', () => {
            const pacman = createEntity({
                x: tileCenter(11, 10).x,
                y: tileCenter(11, 10).y,
                gridX: 11,
                gridY: 10,
                prevGridX: 10,
                prevGridY: 11,
                direction: directions.RIGHT
            });

            const ghost = createEntity({
                x: tileCenter(10, 11).x,
                y: tileCenter(10, 11).y,
                gridX: 10,
                gridY: 11,
                prevGridX: 11,
                prevGridY: 10,
                name: 'blinky',
                isFrightened: false,
                direction: directions.DOWN
            });

            const collision = checkGhostCollision(pacman, ghost);

            expect(collision).not.toBeNull();
            expect(collision.type).toBe('pacman_died');
            expect(collision.ghostIndex).toBe('blinky');
        });

        test('pacman and ghost moving parallel - no crossing collision', () => {
            const pacman = createEntity({
                x: tileCenter(10, 10).x,
                y: tileCenter(10, 10).y,
                gridX: 10,
                gridY: 10,
                prevGridX: 9,
                prevGridY: 10,
                direction: directions.RIGHT
            });

            const ghost = createEntity({
                x: tileCenter(11, 11).x,
                y: tileCenter(11, 11).y,
                gridX: 11,
                gridY: 11,
                prevGridX: 10,
                prevGridY: 11,
                name: 'pinky',
                isFrightened: false,
                direction: directions.RIGHT
            });

            const collision = checkGhostCollision(pacman, ghost);

            expect(collision).toBeNull();
        });

        test('pacman crosses frightened ghost - ghost eaten', () => {
            const pacman = createEntity({
                x: tileCenter(11, 10).x,
                y: tileCenter(11, 10).y,
                gridX: 11,
                gridY: 10,
                prevGridX: 10,
                prevGridY: 11,
                direction: directions.RIGHT
            });

            const ghost = createEntity({
                x: tileCenter(10, 11).x,
                y: tileCenter(10, 11).y,
                gridX: 10,
                gridY: 11,
                prevGridX: 11,
                prevGridY: 10,
                name: 'inky',
                isFrightened: true,
                direction: directions.DOWN
            });

            const collision = checkGhostCollision(pacman, ghost);

            expect(collision).not.toBeNull();
            expect(collision.type).toBe('ghost_eaten');
            expect(collision.ghostIndex).toBe('inky');
        });

        test('crossing with eaten ghost - no collision', () => {
            const pacman = createEntity({
                x: tileCenter(11, 10).x,
                y: tileCenter(11, 10).y,
                gridX: 11,
                gridY: 10,
                prevGridX: 10,
                prevGridY: 10,
                direction: directions.RIGHT
            });

            const ghost = createEntity({
                x: tileCenter(10, 11).x,
                y: tileCenter(10, 11).y,
                gridX: 10,
                gridY: 11,
                prevGridX: 11,
                prevGridY: 10,
                name: 'clyde',
                isEaten: true,
                direction: directions.DOWN
            });

            const collision = checkGhostCollision(pacman, ghost);

            expect(collision).toBeNull();
        });
    });

    describe('Crossing Detection Edge Cases', () => {
        test('entities cross in one timestep with high delta - collision detected', () => {
            const pacman = createEntity({
                x: tileCenter(10, 10).x,
                y: tileCenter(10, 10).y,
                gridX: 10,
                gridY: 10,
                prevGridX: 9,
                prevGridY: 10,
                direction: directions.RIGHT
            });

            const ghost = createEntity({
                x: tileCenter(11, 11).x,
                y: tileCenter(11, 11).y,
                gridX: 11,
                gridY: 11,
                prevGridX: 11,
                prevGridY: 10,
                name: 'blinky',
                isFrightened: false,
                direction: directions.DOWN
            });

            const collision = checkGhostCollision(pacman, ghost);

            expect(collision).toBeNull();

            pacman.gridX = 11;
            ghost.gridY = 10;

            const collision2 = checkGhostCollision(pacman, ghost);
            expect(collision2).not.toBeNull();
        });

        test('entities cross perpendicular with EPS touch - collision detected', () => {
            const pacman = createEntity({
                x: tileCenter(11, 10).x,
                y: tileCenter(11, 10).y,
                gridX: 11,
                gridY: 10,
                prevGridX: 10,
                prevGridY: 11,
                direction: directions.RIGHT
            });

            const ghost = createEntity({
                x: tileCenter(10, 11).x,
                y: tileCenter(10, 11).y,
                gridX: 10,
                gridY: 11,
                prevGridX: 11,
                prevGridY: 10,
                name: 'pinky',
                isFrightened: false,
                direction: directions.DOWN
            });

            const collision = checkGhostCollision(pacman, ghost);

            expect(collision).not.toBeNull();
        });

        test('entities cross at tunnel portal - collision detected', () => {
            const pacman = createEntity({
                x: tileCenter(0, TUNNEL_ROW).x,
                y: tileCenter(0, TUNNEL_ROW).y,
                gridX: 0,
                gridY: TUNNEL_ROW,
                prevGridX: 1,
                prevGridY: TUNNEL_ROW + 1,
                direction: directions.LEFT
            });

            const ghost = createEntity({
                x: tileCenter(1, TUNNEL_ROW + 1).x,
                y: tileCenter(1, TUNNEL_ROW + 1).y,
                gridX: 1,
                gridY: TUNNEL_ROW + 1,
                prevGridX: 0,
                prevGridY: TUNNEL_ROW,
                name: 'inky',
                isFrightened: false,
                direction: directions.DOWN
            });

            const collision = checkGhostCollision(pacman, ghost);

            expect(collision).not.toBeNull();
        });

        test('multiple entities cross simultaneously - all collisions detected', () => {
            const pacman = createEntity({
                x: tileCenter(10, 10).x,
                y: tileCenter(10, 10).y,
                gridX: 10,
                gridY: 10,
                prevGridX: 9,
                prevGridY: 10,
                direction: directions.RIGHT
            });

            const ghost1 = createEntity({
                x: tileCenter(11, 11).x,
                y: tileCenter(11, 11).y,
                gridX: 11,
                gridY: 11,
                prevGridX: 11,
                prevGridY: 10,
                name: 'blinky',
                isFrightened: false,
                direction: directions.DOWN
            });

            const ghost2 = createEntity({
                x: tileCenter(9, 9).x,
                y: tileCenter(9, 9).y,
                gridX: 9,
                gridY: 9,
                prevGridX: 9,
                prevGridY: 10,
                name: 'pinky',
                isFrightened: true,
                direction: directions.UP
            });

            pacman.gridX = 11;
            ghost1.gridY = 10;
            ghost2.gridY = 10;

            const ghosts = [ghost1, ghost2];
            const collision = checkAllGhostCollisions(pacman, ghosts);

            expect(collision).not.toBeNull();
        });
    });

    describe('Corner Edge Cases Integration (TileMovement + CollisionDetection)', () => {
        test('pacman and ghost meet at intersection - same-tile collision', () => {
            const pacman = createEntity({
                x: tileCenter(10, 10).x,
                y: tileCenter(10, 10).y,
                gridX: 10,
                gridY: 10,
                prevGridX: 9,
                prevGridY: 10,
                direction: directions.RIGHT
            });

            const ghost = createEntity({
                x: tileCenter(10, 10).x + EPS,
                y: tileCenter(10, 10).y,
                gridX: 10,
                gridY: 10,
                prevGridX: 10,
                prevGridY: 9,
                name: 'blinky',
                isFrightened: false,
                direction: directions.DOWN
            });

            const collision = checkGhostCollision(pacman, ghost);

            expect(collision).not.toBeNull();
            expect(collision.type).toBe('pacman_died');
        });

        test('entities approach corner from different directions - collision detected', () => {
            const pacman = createEntity({
                x: tileCenter(9, 10).x,
                y: tileCenter(9, 10).y,
                gridX: 9,
                gridY: 10,
                prevGridX: 9,
                prevGridY: 11,
                direction: directions.UP
            });

            const ghost = createEntity({
                x: tileCenter(10, 11).x,
                y: tileCenter(10, 11).y,
                gridX: 10,
                gridY: 11,
                prevGridX: 11,
                prevGridY: 11,
                name: 'pinky',
                isFrightened: false,
                direction: directions.LEFT
            });

            pacman.gridX = 10;
            ghost.gridX = 10;
            ghost.gridY = 10;

            const collision = checkGhostCollision(pacman, ghost);

            expect(collision).not.toBeNull();
        });

        test('pacman turns at corner, ghost crosses path - crossing collision', () => {
            const pacman = createEntity({
                x: tileCenter(10, 10).x,
                y: tileCenter(10, 10).y,
                gridX: 10,
                gridY: 10,
                prevGridX: 10,
                prevGridY: 11,
                direction: directions.RIGHT,
                nextDirection: directions.RIGHT
            });

            const ghost = createEntity({
                x: tileCenter(11, 11).x,
                y: tileCenter(11, 11).y,
                gridX: 11,
                gridY: 11,
                prevGridX: 11,
                prevGridY: 10,
                name: 'inky',
                isFrightened: false,
                direction: directions.DOWN
            });

            pacman.gridX = 11;
            ghost.gridY = 10;

            const collision = checkGhostCollision(pacman, ghost);

            expect(collision).not.toBeNull();
        });

        test('entities meet exactly at tile center - collision detected', () => {
            const center = tileCenter(10, 10);

            const pacman = createEntity({
                x: center.x,
                y: center.y,
                gridX: 10,
                gridY: 10,
                prevGridX: 9,
                prevGridY: 10,
                direction: directions.RIGHT
            });

            const ghost = createEntity({
                x: center.x,
                y: center.y,
                gridX: 10,
                gridY: 10,
                prevGridX: 10,
                prevGridY: 9,
                name: 'clyde',
                isFrightened: false,
                direction: directions.DOWN
            });

            const collision = checkGhostCollision(pacman, ghost);

            expect(collision).not.toBeNull();
        });
    });

    describe('Corner Edge Cases with EPS', () => {
        test('entities with EPS touch at corner - collision detected', () => {
            const center = tileCenter(10, 10);

            const pacman = createEntity({
                x: center.x,
                y: center.y,
                gridX: 10,
                gridY: 10,
                prevGridX: 9,
                prevGridY: 10,
                direction: directions.RIGHT
            });

            const ghost = createEntity({
                x: center.x + EPS,
                y: center.y,
                gridX: 10,
                gridY: 10,
                prevGridX: 10,
                prevGridY: 9,
                name: 'blinky',
                isFrightened: false,
                direction: directions.DOWN
            });

            const collision = checkGhostCollision(pacman, ghost);

            expect(collision).not.toBeNull();
        });

        test('entities with < 5px distance at corner - no collision', () => {
            const center = tileCenter(10, 10);

            const pacman = createEntity({
                x: center.x,
                y: center.y,
                gridX: 10,
                gridY: 10,
                prevGridX: 9,
                prevGridY: 10,
                direction: directions.RIGHT
            });

            const ghost = createEntity({
                x: center.x + 6,
                y: center.y,
                gridX: 11,
                gridY: 10,
                prevGridX: 12,
                prevGridY: 10,
                name: 'pinky',
                isFrightened: false,
                direction: directions.LEFT
            });

            const collision = checkGhostCollision(pacman, ghost);

            expect(collision).toBeNull();
        });

        test('entities with buffered turn at corner - correct collision detection', () => {
            const pacman = createEntity({
                x: tileCenter(10, 10).x,
                y: tileCenter(10, 10).y,
                gridX: 10,
                gridY: 10,
                prevGridX: 10,
                prevGridY: 11,
                direction: directions.UP,
                nextDirection: directions.RIGHT,
                isMoving: true
            });

            const ghost = createEntity({
                x: tileCenter(11, 11).x,
                y: tileCenter(11, 11).y,
                gridX: 11,
                gridY: 11,
                prevGridX: 11,
                prevGridY: 10,
                name: 'inky',
                isFrightened: false,
                direction: directions.DOWN
            });

            pacman.gridX = 11;
            ghost.gridY = 10;

            const collision = checkGhostCollision(pacman, ghost);

            expect(collision).not.toBeNull();
        });

        test('entities with isMoving=false at corner - correct handling', () => {
            const pacman = createEntity({
                x: tileCenter(10, 10).x,
                y: tileCenter(10, 10).y,
                gridX: 10,
                gridY: 10,
                prevGridX: 10,
                prevGridY: 10,
                direction: directions.NONE,
                isMoving: false
            });

            const ghost = createEntity({
                x: tileCenter(10, 10).x,
                y: tileCenter(10, 10).y,
                gridX: 10,
                gridY: 10,
                prevGridX: 10,
                prevGridY: 9,
                name: 'clyde',
                isFrightened: false,
                direction: directions.DOWN
            });

            const collision = checkGhostCollision(pacman, ghost);

            expect(collision).not.toBeNull();
        });
    });

    describe('Full Gameplay Scenarios', () => {
        test('ghost chases pacman through tunnel - collision detected', () => {
            const pacman = createEntity({
                x: tileCenter(1, TUNNEL_ROW).x,
                y: tileCenter(1, TUNNEL_ROW).y,
                gridX: 1,
                gridY: TUNNEL_ROW,
                prevGridX: 2,
                prevGridY: TUNNEL_ROW,
                direction: directions.LEFT,
                speed: 300
            });

            const ghost = createEntity({
                x: tileCenter(2, TUNNEL_ROW).x,
                y: tileCenter(2, TUNNEL_ROW).y,
                gridX: 2,
                gridY: TUNNEL_ROW,
                prevGridX: 3,
                prevGridY: TUNNEL_ROW,
                name: 'blinky',
                isFrightened: false,
                direction: directions.LEFT,
                speed: 280
            });

            ghost.gridX = 1;
            ghost.prevGridX = 2;

            const collision = checkGhostCollision(pacman, ghost);

            expect(collision).not.toBeNull();
        });

        test('multiple ghosts with different modes - correct collisions', () => {
            const pacman = createEntity({
                x: tileCenter(10, 10).x,
                y: tileCenter(10, 10).y,
                gridX: 10,
                gridY: 10,
                prevGridX: 9,
                prevGridY: 10,
                direction: directions.RIGHT
            });

            const ghosts = [
                createEntity({
                    x: tileCenter(10, 10).x,
                    y: tileCenter(10, 10).y,
                    gridX: 10,
                    gridY: 10,
                    prevGridX: 11,
                    prevGridY: 10,
                    name: 'blinky',
                    isFrightened: false,
                    direction: directions.LEFT
                }),
                createEntity({
                    x: tileCenter(12, 10).x,
                    y: tileCenter(12, 10).y,
                    gridX: 12,
                    gridY: 10,
                    prevGridX: 13,
                    prevGridY: 10,
                    name: 'pinky',
                    isFrightened: true,
                    direction: directions.LEFT
                }),
                createEntity({
                    x: tileCenter(13, 10).x,
                    y: tileCenter(13, 10).y,
                    gridX: 13,
                    gridY: 10,
                    prevGridX: 14,
                    prevGridY: 10,
                    name: 'inky',
                    isFrightened: true,
                    direction: directions.LEFT
                })
            ];

            const collision = checkAllGhostCollisions(pacman, ghosts);

            expect(collision).not.toBeNull();
            expect(collision.type).toBe('pacman_died');
        });

        test('power pellet scenario - frightened ghosts can be eaten', () => {
            const pacman = createEntity({
                x: tileCenter(10, 10).x,
                y: tileCenter(10, 10).y,
                gridX: 10,
                gridY: 10,
                prevGridX: 9,
                prevGridY: 10,
                direction: directions.RIGHT
            });

            const ghosts = [
                createEntity({
                    x: tileCenter(11, 10).x,
                    y: tileCenter(11, 10).y,
                    gridX: 11,
                    gridY: 10,
                    prevGridX: 12,
                    prevGridY: 10,
                    name: 'blinky',
                    isFrightened: true,
                    direction: directions.LEFT
                }),
                createEntity({
                    x: tileCenter(12, 10).x,
                    y: tileCenter(12, 10).y,
                    gridX: 12,
                    gridY: 10,
                    prevGridX: 13,
                    prevGridY: 10,
                    name: 'pinky',
                    isFrightened: true,
                    direction: directions.LEFT
                })
            ];

            ghosts[0].gridX = 10;

            let collision = checkAllGhostCollisions(pacman, ghosts);

            expect(collision).not.toBeNull();
            expect(collision.type).toBe('ghost_eaten');
            expect(collision.ghostIndex).toBe('blinky');

            ghosts[0].isEaten = true;
            ghosts[1].gridX = 10;

            collision = checkAllGhostCollisions(pacman, ghosts);

            expect(collision).not.toBeNull();
            expect(collision.type).toBe('ghost_eaten');
            expect(collision.ghostIndex).toBe('pinky');
        });

        test('entities teleport and collisions recognized correctly', () => {
            const pacman = createEntity({
                x: tileCenter(1, TUNNEL_ROW).x,
                y: tileCenter(1, TUNNEL_ROW).y,
                gridX: 1,
                gridY: TUNNEL_ROW,
                prevGridX: 2,
                prevGridY: TUNNEL_ROW,
                direction: directions.LEFT
            });

            const ghost = createEntity({
                x: tileCenter(27, TUNNEL_ROW).x,
                y: tileCenter(27, TUNNEL_ROW).y,
                gridX: 27,
                gridY: TUNNEL_ROW,
                prevGridX: 26,
                prevGridY: TUNNEL_ROW,
                name: 'inky',
                isFrightened: false,
                direction: directions.RIGHT
            });

            handlePortalTraversal(pacman, TILE_SIZE);

            pacman.prevGridX = 1;
            pacman.prevGridY = TUNNEL_ROW;
            ghost.gridX = 26;

            const collision = checkGhostCollision(pacman, ghost);

            expect(collision).toBeNull();
        });
    });

    describe('Multi-Entity Integration Tests', () => {
        test('4 ghosts in maze - all collisions detected', () => {
            const pacman = createEntity({
                x: tileCenter(10, 10).x,
                y: tileCenter(10, 10).y,
                gridX: 10,
                gridY: 10,
                prevGridX: 9,
                prevGridY: 10,
                direction: directions.RIGHT
            });

            const ghosts = [
                createEntity({
                    x: tileCenter(10, 10).x,
                    y: tileCenter(10, 10).y,
                    gridX: 10,
                    gridY: 10,
                    prevGridX: 11,
                    prevGridY: 10,
                    name: 'blinky',
                    isFrightened: false,
                    direction: directions.LEFT
                }),
                createEntity({
                    x: tileCenter(12, 10).x,
                    y: tileCenter(12, 10).y,
                    gridX: 12,
                    gridY: 10,
                    prevGridX: 13,
                    prevGridY: 10,
                    name: 'pinky',
                    isFrightened: false,
                    direction: directions.LEFT
                }),
                createEntity({
                    x: tileCenter(13, 10).x,
                    y: tileCenter(13, 10).y,
                    gridX: 13,
                    gridY: 10,
                    prevGridX: 14,
                    prevGridY: 10,
                    name: 'inky',
                    isFrightened: false,
                    direction: directions.LEFT
                }),
                createEntity({
                    x: tileCenter(14, 10).x,
                    y: tileCenter(14, 10).y,
                    gridX: 14,
                    gridY: 10,
                    prevGridX: 15,
                    prevGridY: 10,
                    name: 'clyde',
                    isFrightened: false,
                    direction: directions.LEFT
                })
            ];

            const collision = checkAllGhostCollisions(pacman, ghosts);

            expect(collision).not.toBeNull();
        });

        test('pacman dies by one ghost - no further collisions checked', () => {
            const pacman = createEntity({
                x: tileCenter(10, 10).x,
                y: tileCenter(10, 10).y,
                gridX: 10,
                gridY: 10,
                prevGridX: 9,
                prevGridY: 10,
                direction: directions.RIGHT
            });

            const ghosts = [
                createEntity({
                    x: tileCenter(10, 10).x,
                    y: tileCenter(10, 10).y,
                    gridX: 10,
                    gridY: 10,
                    prevGridX: 9,
                    prevGridY: 10,
                    name: 'blinky',
                    isFrightened: false,
                    direction: directions.LEFT
                }),
                createEntity({
                    x: tileCenter(11, 10).x,
                    y: tileCenter(11, 10).y,
                    gridX: 11,
                    gridY: 10,
                    prevGridX: 12,
                    prevGridY: 10,
                    name: 'pinky',
                    isFrightened: false,
                    direction: directions.LEFT
                })
            ];

            const collision = checkAllGhostCollisions(pacman, ghosts);

            expect(collision).not.toBeNull();
            expect(collision.type).toBe('pacman_died');
            expect(collision.ghostIndex).toBe('blinky');
        });

        test('pacman eats multiple frightened ghosts in one timestep', () => {
            const pacman = createEntity({
                x: tileCenter(10, 10).x,
                y: tileCenter(10, 10).y,
                gridX: 10,
                gridY: 10,
                prevGridX: 9,
                prevGridY: 10,
                direction: directions.RIGHT
            });

            const ghosts = [
                createEntity({
                    x: tileCenter(10, 10).x,
                    y: tileCenter(10, 10).y,
                    gridX: 10,
                    gridY: 10,
                    prevGridX: 9,
                    prevGridY: 10,
                    name: 'blinky',
                    isFrightened: true,
                    direction: directions.LEFT
                }),
                createEntity({
                    x: tileCenter(11, 10).x,
                    y: tileCenter(11, 10).y,
                    gridX: 11,
                    gridY: 10,
                    prevGridX: 12,
                    prevGridY: 10,
                    name: 'pinky',
                    isFrightened: true,
                    direction: directions.LEFT
                })
            ];

            let collision = checkAllGhostCollisions(pacman, ghosts);

            expect(collision).not.toBeNull();
            expect(collision.type).toBe('ghost_eaten');
            expect(collision.ghostIndex).toBe('blinky');

            ghosts[0].isEaten = true;
            ghosts[1].gridX = 10;

            collision = checkAllGhostCollisions(pacman, ghosts);

            expect(collision).not.toBeNull();
            expect(collision.type).toBe('ghost_eaten');
            expect(collision.ghostIndex).toBe('pinky');
        });

        test('entities with different speeds - collisions based on grid', () => {
            const pacman = createEntity({
                x: tileCenter(10, 10).x,
                y: tileCenter(10, 10).y,
                gridX: 10,
                gridY: 10,
                prevGridX: 9,
                prevGridY: 10,
                direction: directions.RIGHT,
                speed: 120
            });

            const ghosts = [
                createEntity({
                    x: tileCenter(11, 10).x,
                    y: tileCenter(11, 10).y,
                    gridX: 11,
                    gridY: 10,
                    prevGridX: 12,
                    prevGridY: 10,
                    name: 'blinky',
                    isFrightened: false,
                    direction: directions.LEFT,
                    speed: 112
                })
            ];

            const collision = checkGhostCollision(pacman, ghosts[0]);

            expect(collision).toBeNull();

            pacman.gridX = 11;
            pacman.prevGridX = 10;
            ghosts[0].gridX = 10;
            ghosts[0].prevGridX = 11;

            const collision2 = checkGhostCollision(pacman, ghosts[0]);

            expect(collision2).not.toBeNull();
        });
    });
});

function createEntity(overrides) {
    return {
        x: 0,
        y: 0,
        gridX: 0,
        gridY: 0,
        prevGridX: undefined,
        prevGridY: undefined,
        direction: directions.NONE,
        nextDirection: directions.NONE,
        isMoving: true,
        isFrightened: false,
        isEaten: false,
        speed: 120,
        name: 'test_entity',
        ...overrides
    };
}

function createRealisticMaze() {
    const maze = [];
    for (let y = 0; y < 31; y++) {
        const row = [];
        for (let x = 0; x < 28; x++) {
            if (y === 0 || y === 30) {
                row.push(1);
            } else if (x === 0 || x === 27) {
                row.push(1);
            } else {
                row.push(0);
            }
        }
        maze.push(row);
    }

    maze[14][0] = 0;
    maze[14][27] = 0;

    return maze;
}
