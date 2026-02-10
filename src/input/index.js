/**
 * Input System Index
 * Central export point for all input-related classes
 */

// Base classes
export {
    InputAdapter,
    INPUT_TYPES,
    INPUT_ACTIONS,
    InputEventNormalizer
} from './InputAdapter.js';

export { InputManager } from './InputManager.js';

// Adapter implementations
export { KeyboardAdapter } from './adapters/KeyboardAdapter.js';
export {
    ReplayAdapter,
    ReplayRecorder
} from './adapters/ReplayAdapter.js';
export {
    AIInputAdapter,
    ScriptedAIAdapter
} from './adapters/AIInputAdapter.js';

// Default export for convenience
export { InputManager as default } from './InputManager.js';
