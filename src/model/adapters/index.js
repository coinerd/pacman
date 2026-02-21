/**
 * Model Adapters
 * Bridges between decoupled movement/collision systems and existing GameModel
 */

export {
    CollisionAdapter,
    createCollisionAdapter
} from './CollisionAdapter.js';
export { EnemyAIAdapter } from './EnemyAIAdapter.js';
export { TileCenterMovementAdapter } from './TileCenterMovementAdapter.js';
