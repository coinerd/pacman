/**
 * Collision Utilities
 * Provides swept collision detection for fast-moving objects
 */

/**
 * Swept AABB (Axis-Aligned Bounding Box) collision detection
 * Detects if two objects' movement paths intersect, preventing tunneling
 *
 * @param {number} x1 - Start X of first object's movement
 * @param {number} y1 - Start Y of first object's movement
 * @param {number} x2 - End X of first object's movement
 * @param {number} y2 - End Y of first object's movement
 * @param {number} targetX - Target object's X position
 * @param {number} targetY - Target object's Y position
 * @param {number} radius - Target object's radius
 * @returns {boolean} - True if movement paths intersect
 */
export function sweptAABBCollision(
    x1, y1, x2, y2,
    targetX, targetY,
    radius
) {
    const halfSize = radius;

    // Target object's bounding box
    const targetMinX = targetX - halfSize;
    const targetMaxX = targetX + halfSize;
    const targetMinY = targetY - halfSize;
    const targetMaxY = targetY + halfSize;

    // Check if target is potentially on the movement path
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    // Quick rejection: if target AABB doesn't overlap movement AABB, no collision
    if (maxX < targetMinX || minX > targetMaxX || maxY < targetMinY || minY > targetMaxY) {
        return false;
    }

    // Detailed check: does the movement line segment intersect the target AABB?
    // Check horizontal movement first
    if (y1 === y2) {
        // Horizontal line
        return targetX >= minX && targetX <= maxX && targetY === y1;
    }

    // Check vertical movement
    if (x1 === x2) {
        // Vertical line
        return targetY >= minY && targetY <= maxY && targetX === x1;
    }

    // General case: line segment intersects AABB
    // Check if either endpoint is inside the target
    if ((x1 >= targetMinX && x1 <= targetMaxX && y1 >= targetMinY && y1 <= targetMaxY) ||
        (x2 >= targetMinX && x2 <= targetMaxX && y2 >= targetMinY && y2 <= targetMaxY)) {
        return true;
    }

    // Check if line segment crosses any of the target's edges
    // This is a simplified check using line-rectangle intersection
    const dx = x2 - x1;
    const dy = y2 - y1;

    // Check intersection with each edge of target AABB
    const edges = [
        { x1: targetMinX, y1: targetMinY, x2: targetMaxX, y2: targetMinY }, // Top
        { x1: targetMaxX, y1: targetMinY, x2: targetMaxX, y2: targetMaxY }, // Right
        { x1: targetMaxX, y1: targetMaxY, x2: targetMinX, y2: targetMaxY }, // Bottom
        { x1: targetMinX, y1: targetMaxY, x2: targetMinX, y2: targetMinY }  // Left
    ];

    for (const edge of edges) {
        if (lineSegmentsIntersect(x1, y1, x2, y2, edge.x1, edge.y1, edge.x2, edge.y2)) {
            return true;
        }
    }

    return false;
}

/**
 * Check if two line segments intersect
 * Uses cross-product based line intersection test
 *
 * @param {number} x1 - First line start X
 * @param {number} y1 - First line start Y
 * @param {number} x2 - First line end X
 * @param {number} y2 - First line end Y
 * @param {number} x3 - Second line start X
 * @param {number} y3 - Second line start Y
 * @param {number} x4 - Second line end X
 * @param {number} y4 - Second line end Y
 * @returns {boolean} - True if line segments intersect
 */
export function lineSegmentsIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
    const denominator = ((y4 - y3) * (x2 - x1)) - ((x4 - x3) * (y2 - y1));

    if (denominator === 0) {
        return false;
    }

    const ua = (((x4 - x3) * (y1 - y3)) - ((y4 - y3) * (x1 - x3))) / denominator;
    const ub = (((x2 - x1) * (y1 - y3)) - ((y2 - y1) * (x1 - x3))) / denominator;

    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
}

/**
 * Simple distance-based collision as fallback
 * Used when previous positions are not available
 *
 * @param {number} x1 - First object X
 * @param {number} y1 - First object Y
 * @param {number} x2 - Second object X
 * @param {number} y2 - Second object Y
 * @param {number} threshold - Collision distance threshold
 * @returns {boolean} - True if objects are within threshold
 */
export function distanceCollision(x1, y1, x2, y2, threshold) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance < threshold;
}

export function pointToLineSegmentDistance(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) {param = dot / lenSq;}

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
