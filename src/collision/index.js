/**
 * Collision System Public API
 * Pure collision detection with no external dependencies
 */

// Main interfaces
export {
    CollisionInterface,
    CollisionResult,
    COLLISION_TYPES,
    COLLISION_EVENTS
} from './CollisionInterface.js';

// Engines
export {
    CollisionEngine,
    SimpleCollisionDetector
} from './CollisionEngine.js';

// Shapes
export {
    CollisionShape,
    Point,
    Circle,
    AABB,
    Capsule,
    lineSegmentsIntersect,
    distance,
    distanceSquared
} from './shapes/CollisionShapes.js';

// Spatial indexing
export {
    SpatialIndex,
    DynamicSpatialIndex
} from './spatial/SpatialIndex.js';
