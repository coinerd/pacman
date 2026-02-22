/**
 * Tests für PredictiveMovement Features
 */

import {
    MovementPredictor,
    DecisionTree,
    ZoneMovementPlanner
} from '../../../src/movement/features/PredictiveMovement.js';
import { MazeAdapter } from '../../../src/movement/adapters/MazeAdapter.js';
import { Direction } from '../../../src/movement/core/Direction.js';

describe('PredictiveMovement', () => {
    const createTestMaze = () => [
        [1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1]
    ];

    describe('MovementPredictor', () => {
        test('should predict future positions', () => {
            const maze = createTestMaze();
            const adapter = new MazeAdapter(maze);
            const predictor = new MovementPredictor(adapter);

            const entity = {
                gridX: 1,
                gridY: 1,
                direction: Direction.RIGHT,
                speed: 100
            };

            const positions = predictor.predictPositions(entity, 1.0, 0.5);

            expect(positions.length).toBeGreaterThan(0);
        });
    });

    describe('DecisionTree', () => {
        test('should evaluate valid moves', () => {
            const maze = createTestMaze();
            const adapter = new MazeAdapter(maze);
            const tree = new DecisionTree(adapter);

            const entity = {
                gridX: 1,
                gridY: 1,
                direction: Direction.NONE,
                speed: 100
            };

            const context = {
                target: { gridX: 5, gridY: 1 }
            };

            const bestMove = tree.evaluateBestMove(entity, context);

            expect(bestMove).not.toBe(Direction.NONE);
        });
    });

    describe('ZoneMovementPlanner', () => {
        test('should calculate zones', () => {
            const maze = createTestMaze();
            const adapter = new MazeAdapter(maze);
            const planner = new ZoneMovementPlanner(adapter);

            expect(planner.zones.length).toBeGreaterThan(0);
        });

        test('should find zone for position', () => {
            const maze = createTestMaze();
            const adapter = new MazeAdapter(maze);
            const planner = new ZoneMovementPlanner(adapter);

            const zone = planner.getZoneForPosition(1, 1);

            expect(zone).not.toBeNull();
        });
    });
});
