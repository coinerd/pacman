/**
 * Collision Shapes
 * Pure geometric shapes for collision detection
 * No external dependencies - completely self-contained
 */

/**
 * Abstract base class for all collision shapes
 */
export class CollisionShape {
    /**
     * Check if this shape intersects with another shape
     * @param {CollisionShape} other - Other shape to test
     * @returns {boolean} True if shapes intersect
     */
    intersects(_other) {
        throw new Error('CollisionShape.intersects() must be implemented by subclass');
    }

    /**
     * Check if shape contains a point
     * @param {number} x - Point X coordinate
     * @param {number} y - Point Y coordinate
     * @returns {boolean} True if point is inside shape
     */
    contains(_x, _y) {
        throw new Error('CollisionShape.contains() must be implemented by subclass');
    }

    /**
     * Get the bounding box of the shape
     * @returns {{minX: number, minY: number, maxX: number, maxY: number}}
     */
    getBounds() {
        throw new Error('CollisionShape.getBounds() must be implemented by subclass');
    }
}

/**
 * Point shape - represents a single point in space
 */
export class Point extends CollisionShape {
    /**
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    constructor(x, y) {
        super();
        this.x = x;
        this.y = y;
    }

    intersects(other) {
        if (other instanceof Point) {
            return this.x === other.x && this.y === other.y;
        }
        if (other instanceof Circle) {
            return other.contains(this.x, this.y);
        }
        if (other instanceof AABB) {
            return other.contains(this.x, this.y);
        }
        if (other instanceof Capsule) {
            return other.contains(this.x, this.y);
        }
        return false;
    }

    contains(x, y) {
        return this.x === x && this.y === y;
    }

    getBounds() {
        return { minX: this.x, minY: this.y, maxX: this.x, maxY: this.y };
    }

    distanceTo(other) {
        if (other instanceof Point) {
            const dx = this.x - other.x;
            const dy = this.y - other.y;
            return Math.sqrt(dx * dx + dy * dy);
        }
        throw new Error('Point.distanceTo() only supports Point');
    }
}

/**
 * Circle shape - represents a circle with center and radius
 */
export class Circle extends CollisionShape {
    /**
     * @param {number} x - Center X coordinate
     * @param {number} y - Center Y coordinate
     * @param {number} radius - Circle radius
     */
    constructor(x, y, radius) {
        super();
        this.x = x;
        this.y = y;
        this.radius = radius;
    }

    contains(x, y) {
        const dx = this.x - x;
        const dy = this.y - y;
        return Math.sqrt(dx * dx + dy * dy) <= this.radius;
    }

    intersects(other) {
        if (other instanceof Circle) {
            const dx = this.x - other.x;
            const dy = this.y - other.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= (this.radius + other.radius);
        }
        if (other instanceof Point) {
            return other.intersects(this);
        }
        if (other instanceof AABB) {
            return this.intersectsAABB(other);
        }
        if (other instanceof Capsule) {
            return other.intersects(this);
        }
        return false;
    }

    intersectsAABB(aabb) {
        // Find closest point on AABB to circle center
        const closestX = Math.max(aabb.minX, Math.min(this.x, aabb.maxX));
        const closestY = Math.max(aabb.minY, Math.min(this.y, aabb.maxY));

        const dx = this.x - closestX;
        const dy = this.y - closestY;
        const distanceSquared = dx * dx + dy * dy;

        return distanceSquared <= (this.radius * this.radius);
    }

    getBounds() {
        return {
            minX: this.x - this.radius,
            minY: this.y - this.radius,
            maxX: this.x + this.radius,
            maxY: this.y + this.radius
        };
    }
}

/**
 * AABB (Axis-Aligned Bounding Box) shape
 */
export class AABB extends CollisionShape {
    /**
     * @param {number} minX - Minimum X coordinate
     * @param {number} minY - Minimum Y coordinate
     * @param {number} maxX - Maximum X coordinate
     * @param {number} maxY - Maximum Y coordinate
     */
    constructor(minX, minY, maxX, maxY) {
        super();
        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;
    }

    static fromCenter(centerX, centerY, halfWidth, halfHeight) {
        return new AABB(
            centerX - halfWidth,
            centerY - halfHeight,
            centerX + halfWidth,
            centerY + halfHeight
        );
    }

    contains(x, y) {
        return x >= this.minX && x <= this.maxX &&
               y >= this.minY && y <= this.maxY;
    }

    intersects(other) {
        if (other instanceof AABB) {
            return this.minX <= other.maxX && this.maxX >= other.minX &&
                   this.minY <= other.maxY && this.maxY >= other.minY;
        }
        if (other instanceof Circle) {
            return other.intersects(this);
        }
        if (other instanceof Point) {
            return other.intersects(this);
        }
        if (other instanceof Capsule) {
            return other.intersects(this);
        }
        return false;
    }

    getBounds() {
        return { minX: this.minX, minY: this.minY, maxX: this.maxX, maxY: this.maxY };
    }

    getCenter() {
        return {
            x: (this.minX + this.maxX) / 2,
            y: (this.minY + this.maxY) / 2
        };
    }

    getSize() {
        return {
            width: this.maxX - this.minX,
            height: this.maxY - this.minY
        };
    }
}

/**
 * Capsule shape - represents a line segment with radius
 * Used for swept collision detection (tunneling prevention)
 */
export class Capsule extends CollisionShape {
    /**
     * @param {number} x1 - Start X coordinate
     * @param {number} y1 - Start Y coordinate
     * @param {number} x2 - End X coordinate
     * @param {number} y2 - End Y coordinate
     * @param {number} radius - Capsule radius
     */
    constructor(x1, y1, x2, y2, radius) {
        super();
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.radius = radius;
    }

    /**
     * Create a capsule from an entity's movement (prev position to current position)
     * @param {Object} entity - Entity with x, y, and optionally prevX, prevY
     * @param {number} radius - Collision radius
     * @returns {Capsule}
     */
    static fromEntity(entity, radius) {
        const x1 = entity.prevX ?? entity.x;
        const y1 = entity.prevY ?? entity.y;
        return new Capsule(x1, y1, entity.x, entity.y, radius);
    }

    contains(x, y) {
        return this.pointToLineSegmentDistance(x, y, this.x1, this.y1, this.x2, this.y2) <= this.radius;
    }

    intersects(other) {
        if (other instanceof Capsule) {
            return this.capsuleCapsuleIntersect(other);
        }
        if (other instanceof Circle) {
            return this.capsuleCircleIntersect(other);
        }
        if (other instanceof Point) {
            return other.intersects(this);
        }
        if (other instanceof AABB) {
            return this.capsuleAABBIntersect(other);
        }
        return false;
    }

    getBounds() {
        return {
            minX: Math.min(this.x1, this.x2) - this.radius,
            minY: Math.min(this.y1, this.y2) - this.radius,
            maxX: Math.max(this.x1, this.x2) + this.radius,
            maxY: Math.max(this.y1, this.y2) + this.radius
        };
    }

    /**
     * Check if two capsules intersect
     */
    capsuleCapsuleIntersect(other) {
        // Check if line segments intersect
        if (lineSegmentsIntersect(
            this.x1, this.y1, this.x2, this.y2,
            other.x1, other.y1, other.x2, other.y2
        )) {
            return true;
        }

        // Check minimum distance between line segments
        const distances = [
            this.pointToLineSegmentDistance(this.x1, this.y1, other.x1, other.y1, other.x2, other.y2),
            this.pointToLineSegmentDistance(this.x2, this.y2, other.x1, other.y1, other.x2, other.y2),
            this.pointToLineSegmentDistance(other.x1, other.y1, this.x1, this.y1, this.x2, this.y2),
            this.pointToLineSegmentDistance(other.x2, other.y2, this.x1, this.y1, this.x2, this.y2)
        ];

        const minDistance = Math.min(...distances);
        return minDistance <= (this.radius + other.radius);
    }

    /**
     * Check if capsule intersects with circle
     */
    capsuleCircleIntersect(circle) {
        const distance = this.pointToLineSegmentDistance(
            circle.x, circle.y, this.x1, this.y1, this.x2, this.y2
        );
        return distance <= (this.radius + circle.radius);
    }

    /**
     * Check if capsule intersects with AABB
     */
    capsuleAABBIntersect(aabb) {
        // Check if either endpoint is inside the AABB
        if (aabb.contains(this.x1, this.y1) || aabb.contains(this.x2, this.y2)) {
            return true;
        }

        // Check distance from AABB edges to capsule line segment
        const corners = [
            { x: aabb.minX, y: aabb.minY },
            { x: aabb.maxX, y: aabb.minY },
            { x: aabb.maxX, y: aabb.maxY },
            { x: aabb.minX, y: aabb.maxY }
        ];

        for (const corner of corners) {
            const dist = this.pointToLineSegmentDistance(
                corner.x, corner.y, this.x1, this.y1, this.x2, this.y2
            );
            if (dist <= this.radius) {
                return true;
            }
        }

        // Check if capsule line segment intersects AABB edges
        const edges = [
            [aabb.minX, aabb.minY, aabb.maxX, aabb.minY],
            [aabb.maxX, aabb.minY, aabb.maxX, aabb.maxY],
            [aabb.maxX, aabb.maxY, aabb.minX, aabb.maxY],
            [aabb.minX, aabb.maxY, aabb.minX, aabb.minY]
        ];

        for (const [ex1, ey1, ex2, ey2] of edges) {
            if (lineSegmentsIntersect(this.x1, this.y1, this.x2, this.y2, ex1, ey1, ex2, ey2)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Calculate distance from point to line segment
     */
    pointToLineSegmentDistance(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;

        if (lenSq !== 0) {
            param = dot / lenSq;
        }

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

/**
 * Check if two line segments intersect
 * Uses cross-product based line intersection test
 * @param {number} x1 - First line start X
 * @param {number} y1 - First line start Y
 * @param {number} x2 - First line end X
 * @param {number} y2 - First line end Y
 * @param {number} x3 - Second line start X
 * @param {number} y3 - Second line start Y
 * @param {number} x4 - Second line end X
 * @param {number} y4 - Second line end Y
 * @returns {boolean} True if line segments intersect
 */
export function lineSegmentsIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
    const denominator = ((y4 - y3) * (x2 - x1)) - ((x4 - x3) * (y2 - y1));

    if (denominator === 0) {
        // Lines are parallel or collinear
        // Check if they are collinear by checking if one point of segment 2 lies on segment 1
        const cross1 = (x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1);
        if (cross1 !== 0) {
            return false; // Parallel but not collinear
        }

        // Collinear case - check if projections overlap
        const min1 = Math.min(x1, x2);
        const max1 = Math.max(x1, x2);
        const min2 = Math.min(x3, x4);
        const max2 = Math.max(x3, x4);

        return max1 >= min2 && max2 >= min1;
    }

    const ua = (((x4 - x3) * (y1 - y3)) - ((y4 - y3) * (x1 - x3))) / denominator;
    const ub = (((x2 - x1) * (y1 - y3)) - ((y2 - y1) * (x1 - x3))) / denominator;

    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
}

/**
 * Calculate distance between two points
 * @param {number} x1 - First point X
 * @param {number} y1 - First point Y
 * @param {number} x2 - Second point X
 * @param {number} y2 - Second point Y
 * @returns {number} Distance between points
 */
export function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate squared distance between two points (faster, no sqrt)
 * @param {number} x1 - First point X
 * @param {number} y1 - First point Y
 * @param {number} x2 - Second point X
 * @param {number} y2 - Second point Y
 * @returns {number} Squared distance between points
 */
export function distanceSquared(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return dx * dx + dy * dy;
}
