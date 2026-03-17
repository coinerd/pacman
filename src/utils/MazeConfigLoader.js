/**
 * MazeConfigLoader
 * Loads, merges, and manages maze configuration presets
 *
 * Responsibilities:
 * - Load JSON preset files
 * - Merge with default configuration
 * - Apply level-based scaling for progressive difficulty
 * - Provide runtime configuration overrides
 */

// Import preset configurations
import defaultConfig from '../config/mazePresets/default.json';
import easyConfig from '../config/mazePresets/easy.json';
import mediumConfig from '../config/mazePresets/medium.json';
import hardConfig from '../config/mazePresets/hard.json';
import expertConfig from '../config/mazePresets/expert.json';

/**
 * @typedef {Object} MazeConfig
 * @property {Object} meta - Metadata (name, description, version)
 * @property {Object} dimensions - Maze dimensions (width, height)
 * @property {Object} generation - Generation parameters (algorithm, pathDensity, etc.)
 * @property {Object} rules - Validation rules (connectivity, deadEnds, etc.)
 * @property {Object} aesthetics - Visual styling options
 * @property {Object} retry - Retry configuration
 * @property {Object} difficulty - Difficulty metadata
 */

/**
 * Preset configuration registry
 * @type {Object.<string, MazeConfig>}
 */
const PRESETS = {
    default: defaultConfig,
    easy: easyConfig,
    medium: mediumConfig,
    hard: hardConfig,
    expert: expertConfig
};

/**
 * Default level scaling parameters for progressive difficulty
 */
const DEFAULT_LEVEL_SCALING = {
    pathDensityReduction: 0.15,    // Reduce path density at higher levels
    deadEndIncrease: 0.2,          // Increase dead ends at higher levels
    corridorLengthIncrease: 0.1    // Allow longer corridors at higher levels
};

/**
 * MazeConfigLoader class
 * Manages maze configuration loading, merging, and scaling
 */
export class MazeConfigLoader {
    /**
     * Creates a new MazeConfigLoader instance
     */
    constructor() {
        /** @type {MazeConfig|null} */
        this.customConfig = null;

        /** @type {Object} */
        this.levelScaling = { ...DEFAULT_LEVEL_SCALING };
    }

    /**
     * Loads configuration for a specific level and preset
     *
     * @param {number} [level=1] - Current level (1-based)
     * @param {string} [presetName='default'] - Preset name ('default', 'easy', 'medium', 'hard', 'expert')
     * @param {Object} [overrides={}] - Optional parameter overrides
     * @returns {MazeConfig} Final merged configuration
     *
     * @example
     * // Load default config for level 1
     * const config = loader.loadConfig(1, 'default');
     *
     * @example
     * // Load hard preset with custom override
     * const config = loader.loadConfig(5, 'hard', {
     *   generation: { pathDensity: 0.5 }
     * });
     */
    loadConfig(level = 1, presetName = 'default', overrides = {}) {
        // 1. Get base preset (fallback to default if not found)
        const basePreset = PRESETS[presetName] || PRESETS.default;

        // 2. Deep merge with default config (ensures all fields exist)
        const mergedWithDefault = this.deepMerge(defaultConfig, basePreset);

        // 3. Apply level-based scaling
        const scaled = this.applyLevelScaling(mergedWithDefault, level);

        // 4. Apply custom overrides
        const finalConfig = this.deepMerge(scaled, overrides);

        // 5. Ensure level is set in difficulty metadata
        finalConfig._level = level;
        finalConfig._preset = presetName;

        return finalConfig;
    }

    /**
     * Applies level-based scaling for progressive difficulty
     *
     * Higher levels result in:
     * - Lower path density (fewer escape routes)
     * - Higher dead end factor (more traps)
     * - Longer allowed corridors (more dangerous straightaways)
     *
     * @param {MazeConfig} config - Base configuration
     * @param {number} level - Current level (1-based)
     * @returns {MazeConfig} Scaled configuration
     */
    applyLevelScaling(config, level) {
        const scaling = this.levelScaling;

        // Scale factor: 0 at level 1, approaches 1 at level 10+
        const scaleFactor = Math.min((level - 1) / 9, 1);

        // If no scaling needed (level 1 or scaling disabled), return as-is
        if (scaleFactor === 0) {
            return config;
        }

        // Apply scaling to generation parameters
        const scaledGeneration = {
            ...config.generation,
            pathDensity: this._scaleValue(
                config.generation.pathDensity,
                scaling.pathDensityReduction,
                scaleFactor,
                'decrease'
            ),
            deadEndFactor: this._scaleValue(
                config.generation.deadEndFactor,
                scaling.deadEndIncrease,
                scaleFactor,
                'increase'
            )
        };

        // Apply scaling to rules
        const scaledRules = {
            ...config.rules,
            deadEnds: {
                ...config.rules.deadEnds,
                maxDensity: this._scaleValue(
                    config.rules.deadEnds.maxDensity,
                    0.2,
                    scaleFactor,
                    'increase'
                )
            },
            corridors: {
                ...config.rules.corridors,
                maxLength: Math.round(
                    config.rules.corridors.maxLength * (1 + scaleFactor * scaling.corridorLengthIncrease)
                )
            },
            alternativePaths: {
                ...config.rules.alternativePaths,
                minPaths: Math.max(
                    1,
                    config.rules.alternativePaths.minPaths - Math.floor(level / 5)
                )
            }
        };

        return {
            ...config,
            generation: scaledGeneration,
            rules: scaledRules
        };
    }

    /**
     * Helper: Scale a value by a factor
     * @private
     */
    _scaleValue(baseValue, changeFactor, scaleFactor, direction) {
        if (direction === 'decrease') {
            return baseValue * (1 - changeFactor * scaleFactor);
        } else {
            return baseValue * (1 + changeFactor * scaleFactor);
        }
    }

    /**
     * Deep merges two objects
     * Source values override target values
     * Arrays are replaced, not merged
     *
     * @param {Object} target - Base object
     * @param {Object} source - Override object
     * @returns {Object} Merged object
     */
    deepMerge(target, source) {
        const result = { ...target };

        for (const key of Object.keys(source)) {
            if (
                source[key] instanceof Object &&
                !Array.isArray(source[key]) &&
                key in target &&
                target[key] instanceof Object &&
                !Array.isArray(target[key])
            ) {
                // Recursively merge nested objects
                result[key] = this.deepMerge(target[key], source[key]);
            } else {
                // Override with source value (including arrays)
                result[key] = source[key];
            }
        }

        return result;
    }

    /**
     * Saves a custom configuration for runtime use
     * Optionally persists to localStorage
     *
     * @param {MazeConfig} config - Custom configuration to save
     * @param {boolean} [persist=false] - Whether to persist to localStorage
     */
    saveCustomConfig(config, persist = false) {
        this.customConfig = config;

        if (persist) {
            try {
                localStorage.setItem('maze_custom_config', JSON.stringify(config));
            } catch (e) {
                console.warn('MazeConfigLoader: Could not save custom config to localStorage', e);
            }
        }
    }

    /**
     * Loads a previously saved custom configuration
     *
     * @param {boolean} [fromStorage=false] - Whether to load from localStorage
     * @returns {MazeConfig|null} Loaded custom config or null
     */
    loadCustomConfig(fromStorage = false) {
        if (fromStorage) {
            try {
                const saved = localStorage.getItem('maze_custom_config');
                if (saved) {
                    this.customConfig = JSON.parse(saved);
                }
            } catch (e) {
                console.warn('MazeConfigLoader: Could not load custom config from localStorage', e);
            }
        }

        return this.customConfig;
    }

    /**
     * Clears any saved custom configuration
     */
    clearCustomConfig() {
        this.customConfig = null;

        try {
            localStorage.removeItem('maze_custom_config');
        } catch {
            // Ignore localStorage errors
        }
    }

    /**
     * Validates a configuration object
     * Checks for required fields and basic type correctness
     *
     * @param {MazeConfig} config - Configuration to validate
     * @returns {{isValid: boolean, missingFields: string[], errors: string[]}}
     */
    validateConfig(config) {
        const required = ['meta', 'dimensions', 'generation', 'rules'];
        const missing = required.filter(key => !config[key]);

        const errors = [...missing.map(f => `Missing required field: ${f}`)];

        // Additional validation
        if (config.generation) {
            if (config.generation.pathDensity !== undefined) {
                if (config.generation.pathDensity < 0.3 || config.generation.pathDensity > 1.0) {
                    errors.push('generation.pathDensity must be between 0.3 and 1.0');
                }
            }
            if (config.generation.deadEndFactor !== undefined) {
                if (config.generation.deadEndFactor < 0 || config.generation.deadEndFactor > 1) {
                    errors.push('generation.deadEndFactor must be between 0 and 1');
                }
            }
        }

        if (config.dimensions) {
            if (config.dimensions.width !== undefined) {
                if (config.dimensions.width < 15 || config.dimensions.width > 51) {
                    errors.push('dimensions.width must be between 15 and 51');
                }
            }
            if (config.dimensions.height !== undefined) {
                if (config.dimensions.height < 15 || config.dimensions.height > 51) {
                    errors.push('dimensions.height must be between 15 and 51');
                }
            }
        }

        return {
            isValid: errors.length === 0,
            missingFields: missing,
            errors
        };
    }

    /**
     * Lists all available presets with their metadata
     *
     * @returns {Array<{id: string, name: string, description: string, difficulty: string}>}
     */
    listPresets() {
        return Object.entries(PRESETS).map(([key, config]) => ({
            id: key,
            name: config.meta?.name || key,
            description: config.meta?.description || '',
            difficulty: config.difficulty?.level || 'unknown',
            riskFactor: config.difficulty?.riskFactor || 0.5
        }));
    }

    /**
     * Gets a specific preset by name without merging
     *
     * @param {string} presetName - Name of the preset
     * @returns {MazeConfig|null} Preset configuration or null if not found
     */
    getPreset(presetName) {
        return PRESETS[presetName] || null;
    }

    /**
     * Checks if a preset exists
     *
     * @param {string} presetName - Name of the preset
     * @returns {boolean} True if preset exists
     */
    hasPreset(presetName) {
        return presetName in PRESETS;
    }

    /**
     * Sets custom level scaling parameters
     *
     * @param {Object} scaling - Scaling parameters
     * @param {number} [scaling.pathDensityReduction] - Path density reduction factor
     * @param {number} [scaling.deadEndIncrease] - Dead end increase factor
     * @param {number} [scaling.corridorLengthIncrease] - Corridor length increase factor
     */
    setLevelScaling(scaling) {
        this.levelScaling = { ...this.levelScaling, ...scaling };
    }

    /**
     * Gets the default configuration (deep copy)
     *
     * @returns {MazeConfig} Default configuration
     */
    getDefaultConfig() {
        return JSON.parse(JSON.stringify(defaultConfig));
    }

    /**
     * Converts config to MazeGenerator-compatible format
     * Maps new config structure to legacy MazeGenerator config
     *
     * @param {MazeConfig} config - Configuration from loadConfig()
     * @returns {Object} MazeGenerator-compatible config
     */
    toGeneratorConfig(config) {
        return {
            // Dimensions
            width: config.dimensions?.width || 25,
            height: config.dimensions?.height || 33,

            // Generation
            pathDensity: config.generation?.pathDensity || 0.7,
            deadEndFactor: config.generation?.deadEndFactor || 0.3,
            symmetry: config.generation?.symmetry || 'none',
            cellularAutomataIterations: config.generation?.cellularAutomataIterations || 0,

            // Aesthetics
            tunnelRow: config.aesthetics?.tunnelRow || 15,

            // Rules mapped to legacy config
            minAlternativePaths: config.rules?.alternativePaths?.minPaths || 2,
            deadEndDensityThreshold: config.rules?.deadEnds?.maxDensity || 0.2,
            maxStraightCorridorLength: config.rules?.corridors?.maxLength || 8,
            spawnSafetyRadius: config.rules?.spawnSafety?.playerRadius || 2,
            spawnSafetyMinFreedomSteps: config.rules?.spawnSafety?.minFreedomSteps || 12,

            // Retry
            maxRetries: config.retry?.maxAttempts || 20,
            fallbackSeedOffset: config.retry?.fallbackSeedOffset || 1000003,

            // Metadata
            _preset: config._preset,
            _level: config._level
        };
    }
}

// Singleton instance for convenience
export const mazeConfigLoader = new MazeConfigLoader();

// Export presets for direct access if needed
export { PRESETS };
