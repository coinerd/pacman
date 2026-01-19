import { BaseEntity } from '../../src/entities/BaseEntity.js';
import Pacman from '../../src/entities/Pacman.js';
import Ghost from '../../src/entities/Ghost.js';
import { createMockScene } from '../utils/testHelpers.js';
import { colors, directions, ghostModes } from '../../src/config/gameConfig.js';

describe('Entity Initialization', () => {
    let mockScene;

    beforeEach(() => {
        mockScene = createMockScene();
        mockScene.gameState = { level: 1 };
    });

    describe('BaseEntity initialization', () => {
        test('should initialize prevGridX and prevGridY to starting position', () => {
            const gridX = 5;
            const gridY = 7;
            const entity = new BaseEntity(mockScene, gridX, gridY, 10, 0xFFFFFF);

            expect(entity.gridX).toBe(gridX);
            expect(entity.gridY).toBe(gridY);
            expect(entity.prevGridX).toBe(gridX);
            expect(entity.prevGridY).toBe(gridY);
        });

        test('should initialize previous grid positions correctly for different positions', () => {
            const testPositions = [
                { x: 0, y: 0 },
                { x: 10, y: 10 },
                { x: 5, y: 12 },
                { x: 13, y: 14 }
            ];

            testPositions.forEach(pos => {
                const entity = new BaseEntity(mockScene, pos.x, pos.y, 10, 0xFFFFFF);
                expect(entity.prevGridX).toBe(pos.x);
                expect(entity.prevGridY).toBe(pos.y);
            });
        });

        test('should set pixel position to tile center', () => {
            const entity = new BaseEntity(mockScene, 2, 3, 10, 0xFFFFFF);

            expect(entity.x).toBe(50);
            expect(entity.y).toBe(70);
        });

        test('should initialize with default direction NONE', () => {
            const entity = new BaseEntity(mockScene, 2, 3, 10, 0xFFFFFF);

            expect(entity.direction).toEqual(directions.NONE);
        });

        test('should initialize isMoving to false', () => {
            const entity = new BaseEntity(mockScene, 2, 3, 10, 0xFFFFFF);

            expect(entity.isMoving).toBe(false);
        });

        test('should initialize with default speed of 100', () => {
            const entity = new BaseEntity(mockScene, 2, 3, 10, 0xFFFFFF);

            expect(entity.speed).toBe(100);
        });
    });

    describe('Pacman initialization', () => {
        test('should initialize all Pacman-specific properties', () => {
            const gridX = 10;
            const gridY = 15;
            const pacman = new Pacman(mockScene, gridX, gridY);

            expect(pacman.gridX).toBe(gridX);
            expect(pacman.gridY).toBe(gridY);
            expect(pacman.type).toBeUndefined();
        });

        test('should initialize prevX and prevY to initial position', () => {
            const gridX = 10;
            const gridY = 15;
            const pacman = new Pacman(mockScene, gridX, gridY);

            expect(pacman.prevX).toBe(210);
            expect(pacman.prevY).toBe(310);
            expect(pacman.x).toBe(pacman.prevX);
            expect(pacman.y).toBe(pacman.prevY);
        });

        test('should initialize prevGridX and prevGridY to starting position', () => {
            const gridX = 10;
            const gridY = 15;
            const pacman = new Pacman(mockScene, gridX, gridY);

            expect(pacman.prevGridX).toBe(gridX);
            expect(pacman.prevGridY).toBe(gridY);
            expect(pacman.gridX).toBe(gridX);
            expect(pacman.gridY).toBe(gridY);
        });

        test('should initialize with speed based on level', () => {
            mockScene.gameState.level = 1;
            const pacman = new Pacman(mockScene, 10, 15);

            expect(pacman.speed).toBeGreaterThan(100);
            expect(pacman.baseSpeed).toBe(pacman.speed);
        });

        test('should initialize mouth animation properties', () => {
            const pacman = new Pacman(mockScene, 10, 15);

            expect(pacman.mouthAngle).toBe(0);
            expect(pacman.mouthDirection).toBe(1);
            expect(pacman.mouthSpeed).toBeGreaterThan(0);
            expect(pacman.maxMouthAngle).toBe(30);
        });

        test('should initialize isDying to false', () => {
            const pacman = new Pacman(mockScene, 10, 15);

            expect(pacman.isDying).toBe(false);
        });

        test('should initialize with NONE direction', () => {
            const pacman = new Pacman(mockScene, 10, 15);

            expect(pacman.direction).toEqual(directions.NONE);
        });

        test('should initialize nextDirection to NONE', () => {
            const pacman = new Pacman(mockScene, 10, 15);

            expect(pacman.nextDirection).toEqual(directions.NONE);
        });

        test('should have correct color', () => {
            const pacman = new Pacman(mockScene, 10, 15);

            expect(pacman.color).toBe(colors.pacman);
        });

        test('should initialize previous position correctly at tile center', () => {
            const gridX = 5;
            const gridY = 7;
            const pacman = new Pacman(mockScene, gridX, gridY);

            const expectedX = (gridX * 20) + 10;
            const expectedY = (gridY * 20) + 10;

            expect(pacman.prevX).toBe(expectedX);
            expect(pacman.prevY).toBe(expectedY);
            expect(pacman.x).toBe(expectedX);
            expect(pacman.y).toBe(expectedY);
        });

        test('should track all position properties consistently', () => {
            const gridX = 8;
            const gridY = 12;
            const pacman = new Pacman(mockScene, gridX, gridY);

            expect(pacman.gridX).toBe(gridX);
            expect(pacman.gridY).toBe(gridY);
            expect(pacman.prevGridX).toBe(gridX);
            expect(pacman.prevGridY).toBe(gridY);

            expect(pacman.x).toBe((gridX * 20) + 10);
            expect(pacman.y).toBe((gridY * 20) + 10);
            expect(pacman.prevX).toBe((gridX * 20) + 10);
            expect(pacman.prevY).toBe((gridY * 20) + 10);
        });
    });

    describe('Ghost initialization', () => {
        test('should initialize all Ghost-specific properties', () => {
            const ghost = new Ghost(mockScene, 10, 15, 'blinky', colors.blinky);

            expect(ghost.gridX).toBe(10);
            expect(ghost.gridY).toBe(15);
            expect(ghost.type).toBe('blinky');
            expect(ghost.color).toBe(colors.blinky);
        });

        test('should initialize prevX and prevY to initial position', () => {
            const gridX = 10;
            const gridY = 15;
            const ghost = new Ghost(mockScene, gridX, gridY, 'pinky', colors.pinky);

            expect(ghost.prevX).toBe(210);
            expect(ghost.prevY).toBe(310);
            expect(ghost.x).toBe(ghost.prevX);
            expect(ghost.y).toBe(ghost.prevY);
        });

        test('should initialize prevGridX and prevGridY to starting position', () => {
            const gridX = 10;
            const gridY = 15;
            const ghost = new Ghost(mockScene, gridX, gridY, 'inky', colors.inky);

            expect(ghost.prevGridX).toBe(gridX);
            expect(ghost.prevGridY).toBe(gridY);
            expect(ghost.gridX).toBe(gridX);
            expect(ghost.gridY).toBe(gridY);
        });

        test('should initialize startGridX and startGridY', () => {
            const gridX = 13;
            const gridY = 14;
            const ghost = new Ghost(mockScene, gridX, gridY, 'clyde', colors.clyde);

            expect(ghost.startGridX).toBe(gridX);
            expect(ghost.startGridY).toBe(gridY);
        });

        test('should initialize with speed based on level', () => {
            mockScene.gameState.level = 1;
            const ghost = new Ghost(mockScene, 10, 15, 'blinky', colors.blinky);

            expect(ghost.speed).toBeGreaterThan(100);
            expect(ghost.baseSpeed).toBe(ghost.speed);
        });

        test('should initialize mode to SCATTER', () => {
            const ghost = new Ghost(mockScene, 10, 15, 'blinky', colors.blinky);

            expect(ghost.mode).toBe(ghostModes.SCATTER);
        });

        test('should initialize targetX and targetY to 0', () => {
            const ghost = new Ghost(mockScene, 10, 15, 'blinky', colors.blinky);

            expect(ghost.targetX).toBe(0);
            expect(ghost.targetY).toBe(0);
        });

        test('should initialize isEaten to false', () => {
            const ghost = new Ghost(mockScene, 10, 15, 'blinky', colors.blinky);

            expect(ghost.isEaten).toBe(false);
        });

        test('should initialize isFrightened to false', () => {
            const ghost = new Ghost(mockScene, 10, 15, 'blinky', colors.blinky);

            expect(ghost.isFrightened).toBe(false);
        });

        test('should initialize frightenedTimer to 0', () => {
            const ghost = new Ghost(mockScene, 10, 15, 'blinky', colors.blinky);

            expect(ghost.frightenedTimer).toBe(0);
        });

        test('should initialize isBlinking to false', () => {
            const ghost = new Ghost(mockScene, 10, 15, 'blinky', colors.blinky);

            expect(ghost.isBlinking).toBe(false);
        });

        test('should initialize blinkTimer to 0', () => {
            const ghost = new Ghost(mockScene, 10, 15, 'blinky', colors.blinky);

            expect(ghost.blinkTimer).toBe(0);
        });

        test('should initialize houseTimer to 0', () => {
            const ghost = new Ghost(mockScene, 10, 15, 'blinky', colors.blinky);

            expect(ghost.houseTimer).toBe(0);
        });

        test('should initialize inGhostHouse to false', () => {
            const ghost = new Ghost(mockScene, 10, 15, 'blinky', colors.blinky);

            expect(ghost.inGhostHouse).toBe(false);
        });

        test('should initialize with NONE direction', () => {
            const ghost = new Ghost(mockScene, 10, 15, 'blinky', colors.blinky);

            expect(ghost.direction).toEqual(directions.NONE);
        });

        test('should initialize nextDirection to NONE', () => {
            const ghost = new Ghost(mockScene, 10, 15, 'blinky', colors.blinky);

            expect(ghost.nextDirection).toEqual(directions.NONE);
        });

        test('should initialize previous position correctly at tile center', () => {
            const gridX = 5;
            const gridY = 7;
            const ghost = new Ghost(mockScene, gridX, gridY, 'blinky', colors.blinky);

            const expectedX = (gridX * 20) + 10;
            const expectedY = (gridY * 20) + 10;

            expect(ghost.prevX).toBe(expectedX);
            expect(ghost.prevY).toBe(expectedY);
            expect(ghost.x).toBe(expectedX);
            expect(ghost.y).toBe(expectedY);
        });

        test('should track all position properties consistently', () => {
            const gridX = 8;
            const gridY = 12;
            const ghost = new Ghost(mockScene, gridX, gridY, 'blinky', colors.blinky);

            expect(ghost.gridX).toBe(gridX);
            expect(ghost.gridY).toBe(gridY);
            expect(ghost.prevGridX).toBe(gridX);
            expect(ghost.prevGridY).toBe(gridY);

            expect(ghost.x).toBe((gridX * 20) + 10);
            expect(ghost.y).toBe((gridY * 20) + 10);
            expect(ghost.prevX).toBe((gridX * 20) + 10);
            expect(ghost.prevY).toBe((gridY * 20) + 10);
        });

        test('should initialize all ghost state flags correctly', () => {
            const ghost = new Ghost(mockScene, 10, 15, 'blinky', colors.blinky);

            expect(ghost.isEaten).toBe(false);
            expect(ghost.isFrightened).toBe(false);
            expect(ghost.isBlinking).toBe(false);
            expect(ghost.inGhostHouse).toBe(false);
            expect(ghost.frightenedTimer).toBe(0);
            expect(ghost.blinkTimer).toBe(0);
            expect(ghost.houseTimer).toBe(0);
        });

        test('should work for all ghost types', () => {
            const ghostTypes = [
                { type: 'blinky', color: colors.blinky },
                { type: 'pinky', color: colors.pinky },
                { type: 'inky', color: colors.inky },
                { type: 'clyde', color: colors.clyde }
            ];

            ghostTypes.forEach(({ type, color }) => {
                const ghost = new Ghost(mockScene, 10, 15, type, color);

                expect(ghost.type).toBe(type);
                expect(ghost.color).toBe(color);
                expect(ghost.prevX).toBeDefined();
                expect(ghost.prevY).toBeDefined();
                expect(ghost.prevGridX).toBe(10);
                expect(ghost.prevGridY).toBe(15);
            });
        });
    });

    describe('Previous position tracking consistency', () => {
        test('BaseEntity should initialize prevGridX and prevGridY correctly', () => {
            const entity = new BaseEntity(mockScene, 7, 9, 10, 0xFFFFFF);

            expect(entity.prevGridX).toBe(7);
            expect(entity.prevGridY).toBe(9);
        });

        test('Pacman should initialize all previous position properties', () => {
            const gridX = 6;
            const gridY = 11;
            const pacman = new Pacman(mockScene, gridX, gridY);

            expect(pacman.prevX).toBe((gridX * 20) + 10);
            expect(pacman.prevY).toBe((gridY * 20) + 10);
            expect(pacman.prevGridX).toBe(gridX);
            expect(pacman.prevGridY).toBe(gridY);
        });

        test('Ghost should initialize all previous position properties', () => {
            const gridX = 6;
            const gridY = 11;
            const ghost = new Ghost(mockScene, gridX, gridY, 'blinky', colors.blinky);

            expect(ghost.prevX).toBe((gridX * 20) + 10);
            expect(ghost.prevY).toBe((gridY * 20) + 10);
            expect(ghost.prevGridX).toBe(gridX);
            expect(ghost.prevGridY).toBe(gridY);
        });

        test('All entities should start with current and previous positions equal', () => {
            const gridX = 8;
            const gridY = 10;

            const baseEntity = new BaseEntity(mockScene, gridX, gridY, 10, 0xFFFFFF);
            const pacman = new Pacman(mockScene, gridX, gridY);
            const ghost = new Ghost(mockScene, gridX, gridY, 'blinky', colors.blinky);

            expect(baseEntity.gridX).toBe(baseEntity.prevGridX);
            expect(baseEntity.gridY).toBe(baseEntity.prevGridY);

            expect(pacman.x).toBe(pacman.prevX);
            expect(pacman.y).toBe(pacman.prevY);

            expect(ghost.x).toBe(ghost.prevX);
            expect(ghost.y).toBe(ghost.prevY);
        });
    });
});
