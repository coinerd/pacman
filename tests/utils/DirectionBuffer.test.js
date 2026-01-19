import { DirectionBuffer } from '../../src/utils/movement/DirectionBuffer.js';
import { directions } from '../../src/config/gameConfig.js';

describe('DirectionBuffer initialization', () => {
    let buffer;

    beforeEach(() => {
        buffer = new DirectionBuffer();
    });

    test('starts with NONE for current direction', () => {
        expect(buffer.getCurrent()).toBe(directions.NONE);
    });

    test('starts with NONE for buffered direction', () => {
        expect(buffer.getBuffered()).toBe(directions.NONE);
    });
});

describe('DirectionBuffer.queue()', () => {
    let buffer;

    beforeEach(() => {
        buffer = new DirectionBuffer();
        buffer.apply(directions.RIGHT);
    });

    test('queues non-opposite direction without changing current', () => {
        buffer.queue(directions.DOWN);
        expect(buffer.getCurrent()).toBe(directions.RIGHT);
        expect(buffer.getBuffered()).toBe(directions.DOWN);
    });

    test('applies opposite direction immediately', () => {
        buffer.queue(directions.LEFT);
        expect(buffer.getCurrent()).toBe(directions.LEFT);
        expect(buffer.getBuffered()).toBe(directions.NONE);
    });

    test('handles NONE direction correctly', () => {
        buffer.queue(directions.NONE);
        expect(buffer.getCurrent()).toBe(directions.RIGHT);
        expect(buffer.getBuffered()).toBe(directions.NONE);
    });

    test('queues UP when current is RIGHT', () => {
        buffer.queue(directions.UP);
        expect(buffer.getCurrent()).toBe(directions.RIGHT);
        expect(buffer.getBuffered()).toBe(directions.UP);
    });

    test('applies DOWN immediately when current is UP', () => {
        buffer.apply(directions.UP);
        buffer.queue(directions.DOWN);
        expect(buffer.getCurrent()).toBe(directions.DOWN);
        expect(buffer.getBuffered()).toBe(directions.NONE);
    });

    test('applies RIGHT immediately when current is LEFT', () => {
        buffer.apply(directions.LEFT);
        buffer.queue(directions.RIGHT);
        expect(buffer.getCurrent()).toBe(directions.RIGHT);
        expect(buffer.getBuffered()).toBe(directions.NONE);
    });
});

describe('DirectionBuffer.applyIfCanMove()', () => {
    let buffer;

    beforeEach(() => {
        buffer = new DirectionBuffer();
        buffer.apply(directions.RIGHT);
    });

    test('applies direction when canMoveFunction returns true', () => {
        buffer.queue(directions.DOWN);
        const canMove = jest.fn(() => true);
        const applied = buffer.applyIfCanMove(canMove);
        expect(applied).toBe(true);
        expect(buffer.getCurrent()).toBe(directions.DOWN);
        expect(canMove).toHaveBeenCalledWith(directions.DOWN);
    });

    test('does not apply when canMoveFunction returns false', () => {
        buffer.queue(directions.DOWN);
        const canMove = jest.fn(() => false);
        const applied = buffer.applyIfCanMove(canMove);
        expect(applied).toBe(false);
        expect(buffer.getCurrent()).toBe(directions.RIGHT);
        expect(buffer.getBuffered()).toBe(directions.DOWN);
    });

    test('returns false when no buffered direction', () => {
        const canMove = jest.fn(() => true);
        const applied = buffer.applyIfCanMove(canMove);
        expect(applied).toBe(false);
        expect(canMove).not.toHaveBeenCalled();
    });

    test('clears buffer after successful application', () => {
        buffer.queue(directions.DOWN);
        const canMove = jest.fn(() => true);
        buffer.applyIfCanMove(canMove);
        expect(buffer.getBuffered()).toBe(directions.NONE);
    });

    test('preserves buffer when application fails', () => {
        buffer.queue(directions.DOWN);
        const canMove = jest.fn(() => false);
        buffer.applyIfCanMove(canMove);
        expect(buffer.getBuffered()).toBe(directions.DOWN);
    });
});

describe('DirectionBuffer.apply()', () => {
    let buffer;

    beforeEach(() => {
        buffer = new DirectionBuffer();
        buffer.queue(directions.DOWN);
    });

    test('applies direction immediately', () => {
        buffer.apply(directions.LEFT);
        expect(buffer.getCurrent()).toBe(directions.LEFT);
    });

    test('clears buffered direction after applying', () => {
        buffer.queue(directions.RIGHT);
        buffer.apply(directions.LEFT);
        expect(buffer.getBuffered()).toBe(directions.NONE);
    });

    test('can apply NONE direction', () => {
        buffer.apply(directions.NONE);
        expect(buffer.getCurrent()).toBe(directions.NONE);
    });

    test('can apply any cardinal direction', () => {
        buffer.apply(directions.UP);
        expect(buffer.getCurrent()).toBe(directions.UP);

        buffer.apply(directions.DOWN);
        expect(buffer.getCurrent()).toBe(directions.DOWN);

        buffer.apply(directions.LEFT);
        expect(buffer.getCurrent()).toBe(directions.LEFT);

        buffer.apply(directions.RIGHT);
        expect(buffer.getCurrent()).toBe(directions.RIGHT);
    });
});

describe('DirectionBuffer.reset()', () => {
    let buffer;

    beforeEach(() => {
        buffer = new DirectionBuffer();
        buffer.apply(directions.RIGHT);
        buffer.queue(directions.DOWN);
    });

    test('resets current direction to NONE', () => {
        buffer.reset();
        expect(buffer.getCurrent()).toBe(directions.NONE);
    });

    test('resets buffered direction to NONE', () => {
        buffer.reset();
        expect(buffer.getBuffered()).toBe(directions.NONE);
    });

    test('can be called multiple times', () => {
        buffer.reset();
        buffer.apply(directions.LEFT);
        buffer.reset();
        expect(buffer.getCurrent()).toBe(directions.NONE);
        expect(buffer.getBuffered()).toBe(directions.NONE);
    });

    test('allows fresh queuing after reset', () => {
        buffer.reset();
        buffer.queue(directions.UP);
        expect(buffer.getCurrent()).toBe(directions.NONE);
        expect(buffer.getBuffered()).toBe(directions.UP);
    });
});

describe('DirectionBuffer edge cases', () => {
    let buffer;

    beforeEach(() => {
        buffer = new DirectionBuffer();
    });

    test('handles null direction in queue', () => {
        buffer.queue(null);
        expect(buffer.getCurrent()).toBe(directions.NONE);
        expect(buffer.getBuffered()).toBe(null);
    });

    test('handles undefined direction in queue', () => {
        buffer.queue(undefined);
        expect(buffer.getCurrent()).toBe(directions.NONE);
        expect(buffer.getBuffered()).toBe(undefined);
    });

    test('consecutive queue operations', () => {
        buffer.queue(directions.RIGHT);
        buffer.queue(directions.DOWN);
        buffer.queue(directions.LEFT);
        expect(buffer.getBuffered()).toBe(directions.LEFT);
        expect(buffer.getCurrent()).toBe(directions.NONE);
    });

    test('queue when current equals buffered', () => {
        buffer.apply(directions.RIGHT);
        buffer.queue(directions.RIGHT);
        expect(buffer.getCurrent()).toBe(directions.RIGHT);
        expect(buffer.getBuffered()).toBe(directions.RIGHT);
    });

    test('multiple applies without queue', () => {
        buffer.apply(directions.UP);
        buffer.apply(directions.DOWN);
        buffer.apply(directions.LEFT);
        expect(buffer.getCurrent()).toBe(directions.LEFT);
        expect(buffer.getBuffered()).toBe(directions.NONE);
    });

    test('queue after apply', () => {
        buffer.apply(directions.RIGHT);
        buffer.queue(directions.DOWN);
        expect(buffer.getCurrent()).toBe(directions.RIGHT);
        expect(buffer.getBuffered()).toBe(directions.DOWN);
    });

    test('opposite direction queue when current is NONE', () => {
        buffer.queue(directions.UP);
        expect(buffer.getCurrent()).toBe(directions.NONE);
        expect(buffer.getBuffered()).toBe(directions.UP);
    });

    test('applyIfCanMove with complex canMove function', () => {
        buffer.apply(directions.UP);
        buffer.queue(directions.RIGHT);

        const canMove = jest.fn((dir) => {
            return dir === directions.RIGHT;
        });

        const applied = buffer.applyIfCanMove(canMove);
        expect(applied).toBe(true);
        expect(buffer.getCurrent()).toBe(directions.RIGHT);
    });

    test('queue same direction multiple times', () => {
        buffer.apply(directions.UP);
        buffer.queue(directions.RIGHT);
        buffer.queue(directions.RIGHT);
        expect(buffer.getBuffered()).toBe(directions.RIGHT);
    });

    test('reset clears all state completely', () => {
        buffer.apply(directions.UP);
        buffer.queue(directions.RIGHT);
        buffer.apply(directions.DOWN);
        buffer.queue(directions.LEFT);

        buffer.reset();

        expect(buffer.getCurrent()).toBe(directions.NONE);
        expect(buffer.getBuffered()).toBe(directions.NONE);
    });

    test('handle rapid direction changes', () => {
        buffer.apply(directions.UP);
        buffer.queue(directions.RIGHT);
        buffer.apply(directions.DOWN);
        buffer.queue(directions.LEFT);
        buffer.apply(directions.RIGHT);

        expect(buffer.getCurrent()).toBe(directions.RIGHT);
        expect(buffer.getBuffered()).toBe(directions.NONE);
    });

    test('applyIfCanMove preserves direction when unable to move', () => {
        buffer.apply(directions.UP);
        buffer.queue(directions.RIGHT);

        const canMove = jest.fn(() => false);
        buffer.applyIfCanMove(canMove);

        expect(buffer.getCurrent()).toBe(directions.UP);
        expect(buffer.getBuffered()).toBe(directions.RIGHT);
    });
});

describe('DirectionBuffer opposite direction detection', () => {
    let buffer;

    beforeEach(() => {
        buffer = new DirectionBuffer();
    });

    test('UP and DOWN are opposites', () => {
        buffer.apply(directions.UP);
        buffer.queue(directions.DOWN);
        expect(buffer.getCurrent()).toBe(directions.DOWN);
        expect(buffer.getBuffered()).toBe(directions.NONE);
    });

    test('LEFT and RIGHT are opposites', () => {
        buffer.apply(directions.LEFT);
        buffer.queue(directions.RIGHT);
        expect(buffer.getCurrent()).toBe(directions.RIGHT);
        expect(buffer.getBuffered()).toBe(directions.NONE);
    });

    test('UP is not opposite to LEFT', () => {
        buffer.apply(directions.UP);
        buffer.queue(directions.LEFT);
        expect(buffer.getCurrent()).toBe(directions.UP);
        expect(buffer.getBuffered()).toBe(directions.LEFT);
    });

    test('DOWN is not opposite to RIGHT', () => {
        buffer.apply(directions.DOWN);
        buffer.queue(directions.RIGHT);
        expect(buffer.getCurrent()).toBe(directions.DOWN);
        expect(buffer.getBuffered()).toBe(directions.RIGHT);
    });

    test('NONE is not opposite to any direction', () => {
        buffer.apply(directions.UP);
        buffer.queue(directions.NONE);
        expect(buffer.getCurrent()).toBe(directions.UP);
        expect(buffer.getBuffered()).toBe(directions.NONE);
    });
});

describe('DirectionBuffer integration scenarios', () => {
    let buffer;

    beforeEach(() => {
        buffer = new DirectionBuffer();
    });

    test('scenario: pacman movement with buffer', () => {
        buffer.apply(directions.RIGHT);

        buffer.queue(directions.UP);
        expect(buffer.getCurrent()).toBe(directions.RIGHT);
        expect(buffer.getBuffered()).toBe(directions.UP);

        const canMoveUP = jest.fn(() => true);
        buffer.applyIfCanMove(canMoveUP);

        expect(buffer.getCurrent()).toBe(directions.UP);
        expect(buffer.getBuffered()).toBe(directions.NONE);
    });

    test('scenario: immediate reverse while moving', () => {
        buffer.apply(directions.RIGHT);
        buffer.queue(directions.LEFT);

        expect(buffer.getCurrent()).toBe(directions.LEFT);
        expect(buffer.getBuffered()).toBe(directions.NONE);
    });

    test('scenario: multiple queued turns', () => {
        buffer.apply(directions.RIGHT);
        buffer.queue(directions.UP);
        buffer.queue(directions.DOWN);

        expect(buffer.getCurrent()).toBe(directions.RIGHT);
        expect(buffer.getBuffered()).toBe(directions.DOWN);
    });

    test('scenario: blocked turn with queued direction', () => {
        buffer.apply(directions.RIGHT);
        buffer.queue(directions.UP);

        const canMoveUP = jest.fn(() => false);
        const result = buffer.applyIfCanMove(canMoveUP);

        expect(result).toBe(false);
        expect(buffer.getCurrent()).toBe(directions.RIGHT);
        expect(buffer.getBuffered()).toBe(directions.UP);
    });

    test('scenario: queue and apply in sequence', () => {
        buffer.apply(directions.RIGHT);
        buffer.queue(directions.UP);
        buffer.queue(directions.DOWN);

        buffer.apply(directions.LEFT);

        expect(buffer.getCurrent()).toBe(directions.LEFT);
        expect(buffer.getBuffered()).toBe(directions.NONE);
    });
});
