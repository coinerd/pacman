/**
 * Tests for CollisionShapes
 */

import {
    Point,
    Circle,
    AABB,
    Capsule,
    lineSegmentsIntersect,
    distance,
    distanceSquared
} from '../../src/collision/shapes/CollisionShapes.js';

describe('Point', () => {
    test('constructor sets x and y', () => {
        const point = new Point(10, 20);
        expect(point.x).toBe(10);
        expect(point.y).toBe(20);
    });

    test('intersects with same point', () => {
        const p1 = new Point(10, 10);
        const p2 = new Point(10, 10);
        expect(p1.intersects(p2)).toBe(true);
    });

    test('does not intersect with different point', () => {
        const p1 = new Point(10, 10);
        const p2 = new Point(20, 20);
        expect(p1.intersects(p2)).toBe(false);
    });

    test('intersects with circle containing point', () => {
        const point = new Point(10, 10);
        const circle = new Circle(10, 10, 5);
        expect(point.intersects(circle)).toBe(true);
    });

    test('intersects with AABB containing point', () => {
        const point = new Point(10, 10);
        const aabb = new AABB(0, 0, 20, 20);
        expect(point.intersects(aabb)).toBe(true);
    });

    test('contains returns true for same point', () => {
        const point = new Point(10, 10);
        expect(point.contains(10, 10)).toBe(true);
    });

    test('contains returns false for different point', () => {
        const point = new Point(10, 10);
        expect(point.contains(11, 10)).toBe(false);
    });

    test('getBounds returns point bounds', () => {
        const point = new Point(10, 20);
        expect(point.getBounds()).toEqual({
            minX: 10, minY: 20, maxX: 10, maxY: 20
        });
    });

    test('distanceTo calculates correct distance', () => {
        const p1 = new Point(0, 0);
        const p2 = new Point(3, 4);
        expect(p1.distanceTo(p2)).toBe(5);
    });
});

describe('Circle', () => {
    test('constructor sets properties', () => {
        const circle = new Circle(10, 20, 5);
        expect(circle.x).toBe(10);
        expect(circle.y).toBe(20);
        expect(circle.radius).toBe(5);
    });

    test('contains point inside circle', () => {
        const circle = new Circle(10, 10, 5);
        expect(circle.contains(10, 10)).toBe(true);
        expect(circle.contains(12, 12)).toBe(true);
    });

    test('does not contain point outside circle', () => {
        const circle = new Circle(10, 10, 5);
        expect(circle.contains(20, 20)).toBe(false);
    });

    test('intersects with overlapping circle', () => {
        const c1 = new Circle(0, 0, 5);
        const c2 = new Circle(8, 0, 5);
        expect(c1.intersects(c2)).toBe(true);
    });

    test('does not intersect with distant circle', () => {
        const c1 = new Circle(0, 0, 5);
        const c2 = new Circle(20, 0, 5);
        expect(c1.intersects(c2)).toBe(false);
    });

    test('intersects with point inside', () => {
        const circle = new Circle(10, 10, 5);
        const point = new Point(10, 10);
        expect(circle.intersects(point)).toBe(true);
    });

    test('intersects with overlapping AABB', () => {
        const circle = new Circle(10, 10, 5);
        const aabb = new AABB(8, 8, 15, 15);
        expect(circle.intersects(aabb)).toBe(true);
    });

    test('getBounds returns correct bounds', () => {
        const circle = new Circle(10, 10, 5);
        expect(circle.getBounds()).toEqual({
            minX: 5, minY: 5, maxX: 15, maxY: 15
        });
    });
});

describe('AABB', () => {
    test('constructor sets bounds', () => {
        const aabb = new AABB(0, 0, 10, 10);
        expect(aabb.minX).toBe(0);
        expect(aabb.minY).toBe(0);
        expect(aabb.maxX).toBe(10);
        expect(aabb.maxY).toBe(10);
    });

    test('fromCenter creates AABB from center', () => {
        const aabb = AABB.fromCenter(10, 10, 5, 5);
        expect(aabb.minX).toBe(5);
        expect(aabb.minY).toBe(5);
        expect(aabb.maxX).toBe(15);
        expect(aabb.maxY).toBe(15);
    });

    test('contains point inside', () => {
        const aabb = new AABB(0, 0, 10, 10);
        expect(aabb.contains(5, 5)).toBe(true);
        expect(aabb.contains(0, 0)).toBe(true);
        expect(aabb.contains(10, 10)).toBe(true);
    });

    test('does not contain point outside', () => {
        const aabb = new AABB(0, 0, 10, 10);
        expect(aabb.contains(11, 5)).toBe(false);
        expect(aabb.contains(5, 11)).toBe(false);
    });

    test('intersects with overlapping AABB', () => {
        const a1 = new AABB(0, 0, 10, 10);
        const a2 = new AABB(5, 5, 15, 15);
        expect(a1.intersects(a2)).toBe(true);
    });

    test('does not intersect with separate AABB', () => {
        const a1 = new AABB(0, 0, 10, 10);
        const a2 = new AABB(20, 20, 30, 30);
        expect(a1.intersects(a2)).toBe(false);
    });

    test('intersects with circle inside', () => {
        const aabb = new AABB(0, 0, 20, 20);
        const circle = new Circle(10, 10, 5);
        expect(aabb.intersects(circle)).toBe(true);
    });

    test('intersects with point inside', () => {
        const aabb = new AABB(0, 0, 10, 10);
        const point = new Point(5, 5);
        expect(aabb.intersects(point)).toBe(true);
    });

    test('getCenter returns correct center', () => {
        const aabb = new AABB(0, 0, 10, 10);
        expect(aabb.getCenter()).toEqual({ x: 5, y: 5 });
    });

    test('getSize returns correct size', () => {
        const aabb = new AABB(0, 0, 10, 20);
        expect(aabb.getSize()).toEqual({ width: 10, height: 20 });
    });
});

describe('Capsule', () => {
    test('constructor sets properties', () => {
        const capsule = new Capsule(0, 0, 10, 10, 5);
        expect(capsule.x1).toBe(0);
        expect(capsule.y1).toBe(0);
        expect(capsule.x2).toBe(10);
        expect(capsule.y2).toBe(10);
        expect(capsule.radius).toBe(5);
    });

    test('fromEntity creates capsule from entity', () => {
        const entity = { x: 10, y: 10, prevX: 0, prevY: 0 };
        const capsule = Capsule.fromEntity(entity, 5);
        expect(capsule.x1).toBe(0);
        expect(capsule.y1).toBe(0);
        expect(capsule.x2).toBe(10);
        expect(capsule.y2).toBe(10);
        expect(capsule.radius).toBe(5);
    });

    test('fromEntity uses current position when prev is undefined', () => {
        const entity = { x: 10, y: 10 };
        const capsule = Capsule.fromEntity(entity, 5);
        expect(capsule.x1).toBe(10);
        expect(capsule.y1).toBe(10);
        expect(capsule.x2).toBe(10);
        expect(capsule.y2).toBe(10);
    });

    test('contains point near line segment', () => {
        const capsule = new Capsule(0, 0, 10, 0, 2);
        expect(capsule.contains(5, 1)).toBe(true);
        expect(capsule.contains(5, 3)).toBe(false);
    });

    test('capsuleCapsuleIntersect with overlapping capsules', () => {
        const c1 = new Capsule(0, 0, 10, 0, 2);
        const c2 = new Capsule(5, 0, 15, 0, 2);
        expect(c1.intersects(c2)).toBe(true);
    });

    test('capsuleCapsuleIntersect with crossing lines', () => {
        const c1 = new Capsule(0, 0, 10, 10, 1);
        const c2 = new Capsule(0, 10, 10, 0, 1);
        expect(c1.intersects(c2)).toBe(true);
    });

    test('capsuleCapsuleIntersect with distant capsules', () => {
        const c1 = new Capsule(0, 0, 10, 0, 1);
        const c2 = new Capsule(0, 100, 10, 100, 1);
        expect(c1.intersects(c2)).toBe(false);
    });

    test('capsuleCircleIntersect with overlapping', () => {
        const capsule = new Capsule(0, 0, 10, 0, 2);
        const circle = new Circle(5, 2, 2);
        expect(capsule.intersects(circle)).toBe(true);
    });

    test('capsuleCircleIntersect with distant', () => {
        const capsule = new Capsule(0, 0, 10, 0, 1);
        const circle = new Circle(5, 100, 1);
        expect(capsule.intersects(circle)).toBe(false);
    });

    test('capsuleAABBIntersect with overlapping', () => {
        const capsule = new Capsule(0, 0, 10, 0, 2);
        const aabb = new AABB(5, -1, 15, 1);
        expect(capsule.intersects(aabb)).toBe(true);
    });

    test('capsuleAABBIntersect with endpoint inside', () => {
        const capsule = new Capsule(0, 0, 10, 0, 1);
        const aabb = new AABB(8, -5, 15, 5);
        expect(capsule.intersects(aabb)).toBe(true);
    });

    test('capsuleAABBIntersect with distant', () => {
        const capsule = new Capsule(0, 0, 10, 0, 1);
        const aabb = new AABB(20, 20, 30, 30);
        expect(capsule.intersects(aabb)).toBe(false);
    });

    test('getBounds returns correct bounds', () => {
        const capsule = new Capsule(0, 0, 10, 10, 2);
        const bounds = capsule.getBounds();
        expect(bounds.minX).toBe(-2);
        expect(bounds.minY).toBe(-2);
        expect(bounds.maxX).toBe(12);
        expect(bounds.maxY).toBe(12);
    });

    test('pointToLineSegmentDistance with closest point on segment', () => {
        const capsule = new Capsule(0, 0, 10, 0, 1);
        const dist = capsule.pointToLineSegmentDistance(5, 3, 0, 0, 10, 0);
        expect(dist).toBe(3);
    });

    test('pointToLineSegmentDistance with closest point at start', () => {
        const capsule = new Capsule(0, 0, 10, 0, 1);
        const dist = capsule.pointToLineSegmentDistance(-3, 0, 0, 0, 10, 0);
        expect(dist).toBe(3);
    });

    test('pointToLineSegmentDistance with closest point at end', () => {
        const capsule = new Capsule(0, 0, 10, 0, 1);
        const dist = capsule.pointToLineSegmentDistance(13, 0, 0, 0, 10, 0);
        expect(dist).toBe(3);
    });
});

describe('lineSegmentsIntersect', () => {
    test('returns true for crossing lines', () => {
        expect(lineSegmentsIntersect(0, 0, 10, 10, 0, 10, 10, 0)).toBe(true);
    });

    test('returns false for parallel lines', () => {
        expect(lineSegmentsIntersect(0, 0, 10, 0, 0, 5, 10, 5)).toBe(false);
    });

    test('returns true for overlapping collinear lines', () => {
        expect(lineSegmentsIntersect(0, 0, 10, 0, 5, 0, 15, 0)).toBe(true);
    });

    test('returns false for non-overlapping collinear lines', () => {
        expect(lineSegmentsIntersect(0, 0, 5, 0, 10, 0, 15, 0)).toBe(false);
    });

    test('returns false for lines that would intersect if extended', () => {
        expect(lineSegmentsIntersect(0, 0, 5, 5, 10, 0, 15, 5)).toBe(false);
    });
});

describe('distance', () => {
    test('calculates correct distance horizontally', () => {
        expect(distance(0, 0, 3, 0)).toBe(3);
    });

    test('calculates correct distance vertically', () => {
        expect(distance(0, 0, 0, 4)).toBe(4);
    });

    test('calculates correct distance diagonally', () => {
        expect(distance(0, 0, 3, 4)).toBe(5);
    });

    test('returns 0 for same point', () => {
        expect(distance(10, 10, 10, 10)).toBe(0);
    });
});

describe('distanceSquared', () => {
    test('calculates correct squared distance', () => {
        expect(distanceSquared(0, 0, 3, 4)).toBe(25);
    });

    test('returns 0 for same point', () => {
        expect(distanceSquared(10, 10, 10, 10)).toBe(0);
    });
});
