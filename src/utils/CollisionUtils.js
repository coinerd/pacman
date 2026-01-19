/**
 * Collision Utilities
 * Provides swept capsule collision detection for fast-moving objects
 */

/**
 * Swept capsule collision detection between two moving points.
 *
 * @param {number} ax1 - Start X of first object's movement
 * @param {number} ay1 - Start Y of first object's movement
 * @param {number} ax2 - End X of first object's movement
 * @param {number} ay2 - End Y of first object's movement
 * @param {number} bx1 - Start X of second object's movement
 * @param {number} by1 - Start Y of second object's movement
 * @param {number} bx2 - End X of second object's movement
 * @param {number} by2 - End Y of second object's movement
 * @param {number} radius - Collision radius (combined)
 * @returns {boolean} - True if movement paths intersect within radius
 */
export function capsuleCollision(
    ax1, ay1, ax2, ay2,
    bx1, by1, bx2, by2,
    radius
) {
    if (lineSegmentsIntersect(ax1, ay1, ax2, ay2, bx1, by1, bx2, by2)) {
        return true;
    }

    const distances = [
        pointToLineSegmentDistance(ax1, ay1, bx1, by1, bx2, by2),
        pointToLineSegmentDistance(ax2, ay2, bx1, by1, bx2, by2),
        pointToLineSegmentDistance(bx1, by1, ax1, ay1, ax2, ay2),
        pointToLineSegmentDistance(bx2, by2, ax1, ay1, ax2, ay2)
    ];

    return Math.min(...distances) <= radius;
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
