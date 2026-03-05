/**
 * Game Configuration
 * Contains all constants and settings for ADA-Woman tech-themed maze game
 */

export const gameConfig = {
    width: 500,
    height: 660,
    tileSize: 20,
    mazePadding: 0,
    mazeWidth: 25,
    mazeHeight: 33,
    targetFPS: 60,
    tunnelRow: 15,
    debug: false
};

export const collisionConfig = {
    radius: gameConfig.tileSize * 0.6,
    budgetMs: 2.5,
    warnCooldownMs: 1000,
    emaAlpha: 0.2
};

export const colors = {
    background: 0x0d1b0d,
    wall: 0x2a3f5f,
    wallShadow: 0x1a2e45,
    player: 0x00ced1,
    enemy: {
        alpha: 0x9b59b6,
        beta: 0x7fff00,
        gamma: 0xff4444,
        delta: 0xffa500
    },
    pellet: 0xffffff,
    powerPellet: 0xffffff,
    decryptedEnemy: 0x00ffaa,
    decryptedEnemyEnd: 0xffffff,
    text: 0xffffff,
    score: 0x00ff7f,
    level: 0x00ff00,
    fruit: {
        dataFragment: 0x00ced1,
        powerCore: 0x9b59b6
    },
    key: 0xffffff
};

export const directions = {
    UP: { x: 0, y: -1, angle: 270 },
    DOWN: { x: 0, y: 1, angle: 90 },
    LEFT: { x: -1, y: 0, angle: 180 },
    RIGHT: { x: 1, y: 0, angle: 0 },
    NONE: { x: 0, y: 0, angle: 0 }
};

directions.ALL = [
    directions.UP,
    directions.DOWN,
    directions.LEFT,
    directions.RIGHT
];

export const getOpposite = (dir) => {
    if (!dir || dir === directions.NONE) {
        return directions.NONE;
    }
    return directions.ALL.find((d) => d.x === -dir.x && d.y === -dir.y);
};

export const ghostModes = {
    SCATTER: 'SCATTER',
    CHASE: 'CHASE',
    FRIGHTENED: 'FRIGHTENED',
    EATEN: 'EATEN'
};

// Phase 5: Virus modes (tech-themed naming)
export const virusModes = {
    PATROL: 'PATROL', // Viruses move to patrol targets (was SCATTER)
    HUNT: 'HUNT', // Viruses actively pursue ADA-Woman (was CHASE)
    DECRYPTED: 'DECRYPTED', // Viruses move randomly and can be eliminated (was FRIGHTENED)
    ELIMINATED: 'ELIMINATED' // Virus returns to virus core (was EATEN)
};

// Backward compatibility: ghostModes aliased to virusModes values
ghostModes.SCATTER = virusModes.PATROL;
ghostModes.CHASE = virusModes.HUNT;
ghostModes.FRIGHTENED = virusModes.DECRYPTED;
ghostModes.EATEN = virusModes.ELIMINATED;

// Virus color configuration (backward compatibility: ghostColors)
export const ghostColors = {
    alpha: 0x9b59b6,
    beta: 0x7fff00,
    gamma: 0xff4444,
    delta: 0xffa500
};

export const enemyColors = {
    ALPHA: 0x9b59b6,
    BETA: 0x7fff00,
    GAMMA: 0xff4444,
    DELTA: 0xffa500
};

export const ghostNames = {
    BLINKY: 'alpha',
    PINKY: 'beta',
    INKY: 'gamma',
    CLYDE: 'delta'
};

export const enemyNames = {
    ALPHA: 'alpha',
    BETA: 'beta',
    GAMMA: 'gamma',
    DELTA: 'delta'
};

export const scoreValues = {
    pellet: 15, // Data bits (Phase 5: was 10)
    powerPellet: 75, // Power packets - decrypt viruses temporarily (Phase 5: was 50)
    ghost: [250, 500, 1000, 2000], // Virus elimination combo (Phase 5: was [200, 400, 800, 1600])
    fruit: [100, 300, 500, 700, 1000, 2000, 3000, 5000],
    bossDefeat: 5000 // Base bonus for defeating boss viruses (Phase 5)
};

export const ghostSpeedMultipliers = {
    normal: 1.0,
    frightened: 0.5,
    eaten: 2.0,
    tunnel: 0.4
};

export const levelConfig = {
    baseSpeed: 150, // Increased from 100
    pacmanSpeedMultiplier: 0.8, // 120 pixels/sec
    ghostSpeedMultiplier: 0.75, // 112.5 pixels/sec
    frightenedDuration: 8,
    scatterDuration: 7,
    chaseDuration: 20,
    speedIncreasePerLevel: 10, // Increased from 5
    frightenedDecreasePerLevel: 0.5
};

export const enemyAIConfig = {
    stateCycle: [
        { state: ghostModes.SCATTER, duration: 7 },
        { state: ghostModes.CHASE, duration: 20 },
        { state: ghostModes.SCATTER, duration: 7 },
        { state: ghostModes.CHASE, duration: 20 },
        { state: ghostModes.SCATTER, duration: 5 },
        { state: ghostModes.CHASE, duration: 20 },
        { state: ghostModes.SCATTER, duration: 5 },
        { state: ghostModes.CHASE, duration: Infinity }
    ],
    recoverThresholdSeconds: 2,
    modeSwitchTelegraphSeconds: 0.35,
    eliminatedHouseDurationSeconds: 2,
    deltaChaseDistanceThreshold: 8,
    betaLookAheadTiles: 4,
    gammaPivotLookAheadTiles: 2
};

export const enemyStartPositions = {
    alpha: { x: 2, y: 1 },
    beta: { x: 22, y: 1 },
    gamma: { x: 2, y: 26 },
    delta: { x: 21, y: 26 }
};

export const virusCore = {
    entrance: { x: 12, y: 15 },
    center: { x: 12, y: 13 }
};

// Backward compatibility: ghostHouse is the old name for virusCore
export const ghostHouse = virusCore;

export const playerStartPosition = { x: 13, y: 27 };
export const pacmanStartPosition = { x: 13, y: 27 };

export const powerPelletPositions = [
    { x: 1, y: 1 },
    { x: 23, y: 1 },
    { x: 1, y: 26 },
    { x: 23, y: 26 }
];

// Phase 5: Power Packets (was Power Pellets) - decrypt viruses temporarily
export const powerPacketPositions = powerPelletPositions;

export const scatterTargets = {
    alpha: { x: 24, y: 0 },
    beta: { x: 0, y: 0 },
    gamma: { x: 24, y: 32 },
    delta: { x: 0, y: 32 }
};

/**
 * Fruit configuration (Data Fragments)
 * Data fragments appear at specific data bit collection counts and give bonus points
 */
export const fruitConfig = {
    positions: [{ x: 13, y: 27 }],
    types: [
        { name: 'dataFragment', score: 100, color: colors.fruit.dataFragment },
        { name: 'powerCore', score: 300, color: colors.fruit.powerCore },
        { name: 'algorithm', score: 500, color: 0x00ced1 },
        { name: 'firewall', score: 700, color: 0xff4444 },
        { name: 'encryption', score: 1000, color: 0x9b59b6 },
        { name: 'network', score: 2000, color: 0x7fff00 },
        { name: 'kernel', score: 3000, color: 0xffa500 },
        { name: 'quantum', score: 5000, color: 0x00ffff }
    ],
    duration: 10, // Time data fragment stays on screen (seconds)
    pelletThreshold: 70 // Percentage of data bits eaten to spawn data fragment
};

/**
 * Animation timing configuration
 */
export const animationConfig = {
    pacmanMouthSpeed: 15, // degrees per second
    pacmanDeathSpeed: 30, // degrees per second
    powerPelletPulseSpeed: 500, // milliseconds (Phaser tween duration) - power packet pulse
    ghostBlinkSpeed: 0.2, // seconds - virus blink speed
    textFadeSpeed: 800, // milliseconds (not currently used)
    countdownDuration: 3000, // milliseconds (Phaser delayedCall duration)
    deathPauseDuration: 2 // seconds (accumulated with delta in seconds)
};

/**
 * Touch control configuration for mobile
 */
export const touchConfig = {
    swipeThreshold: 30,
    dpadSize: 120,
    dpadButtonSize: 40,
    dpadSpacing: 10
};

/**
 * Sound effect configuration
 */
export const soundConfig = {
    enabled: true,
    volume: 0.5,
    wakaWaka: { frequency: 400, duration: 0.1 },
    powerPellet: { frequency: 600, duration: 0.3 }, // Power packet activation
    ghostEaten: { frequency: 800, duration: 0.2 }, // Virus elimination
    death: { frequency: 200, duration: 0.5 },
    levelComplete: { frequency: 1000, duration: 0.4 },
    fruitEat: { frequency: 500, duration: 0.15 } // Data fragment collection
};

/**
 * Local storage keys
 */
export const storageKeys = {
    highScore: 'pacman_high_score', // Keep for backward compatibility with old saves
    settings: 'pacman_settings' // Keep for backward compatibility with old saves
};

/**
 * UI styling configuration
 */
export const uiConfig = {
    fonts: {
        title: { family: 'Arial', size: '48px', style: 'bold' },
        subtitle: { family: 'Arial', size: '32px', style: 'bold' },
        text: { family: 'Arial', size: '20px', style: 'normal' },
        small: { family: 'Arial', size: '16px', style: 'normal' }
    },
    colors: {
        primary: '#FFFFFF',
        accent: '#FFD700',
        success: '#00FF00',
        danger: '#FF0000',
        info: '#00BFFF'
    }
};

/**
 * Physics configuration for grid-centered movement
 * Fixed timestep ensures consistent physics regardless of frame rate
 */
export const physicsConfig = {
    FIXED_DT: 1 / 60,
    MAX_DT: 0.1,
    EPS: 2
};

/**
 * Boss battle configuration
 * Defines boss spawning levels, types, and phase transitions
 */
export const bossConfig = {
    spawnLevels: [5, 10, 15, 20],

    bossTypes: {
        alpha: {
            health: 3,
            scoreBonus: 5000,
            name: 'Alpha Virus',
            phases: 2,
            phaseTransitionHealth: [0.5]
        },
        beta: {
            health: 4,
            scoreBonus: 10000,
            name: 'Beta Virus',
            phases: 3,
            phaseTransitionHealth: [0.5, 0.25]
        },
        gamma: {
            health: 2,
            scoreBonus: 7500,
            name: 'Gamma Virus',
            phases: 2,
            phaseTransitionHealth: [0.5]
        },
        delta: {
            health: 5,
            scoreBonus: 15000,
            name: 'Delta Virus',
            phases: 2,
            phaseTransitionHealth: [0.5]
        }
    },

    phaseTransitionHealth: [0.5, 0.25]
};

export const powerUpConfig = {
    types: {
        SHIELD: {
            duration: 8,
            spawnChance: 0.15,
            color: 0x00ced1,
            name: 'Shield',
            icon: '⛨',
            effect: 'Temporary immunity to viruses'
        },
        SPEED_BOOST: {
            duration: 5,
            spawnChance: 0.2,
            color: 0xffd700,
            name: 'Speed Boost',
            icon: '⚡',
            effect: 'Double movement speed'
        },
        DATA_MAGNET: {
            duration: 10,
            spawnChance: 0.1,
            color: 0x00ff7f,
            name: 'Data Magnet',
            icon: '⧲',
            effect: 'Attract nearby data bits'
        }
    },
    despawnTime: 15,
    maxOnScreen: 3,
    spawnRadius: 3
};

/**
 * Additional power-up configuration for Phase 5
 * Extended power-ups with fragment-based spawning
 */
export const additionalPowerUpConfig = {
    types: {
        SHIELD: {
            id: 'shield',
            name: 'Shield',
            description: 'Temporary immunity to viruses',
            duration: 8,
            spawnChance: 0.15,
            color: 0x00ced1,
            icon: '⛨',
            spawnChancePerFragment: 0.15
        },
        SPEED_BOOST: {
            id: 'speed_boost',
            name: 'Speed Boost',
            description: 'Double movement speed for 5 seconds',
            duration: 5,
            spawnChance: 0.2,
            color: 0xffd700,
            icon: '⚡',
            spawnChancePerFragment: 0.2
        },
        DATA_MAGNET: {
            id: 'data_magnet',
            name: 'Data Magnet',
            description: 'Attracts nearby data bits',
            duration: 10,
            spawnChance: 0.1,
            color: 0x00ff7f,
            icon: '⧲',
            spawnChancePerFragment: 0.1
        }
    },
    despawnTime: 15,
    maxOnScreen: 3,
    spawnRadius: 3
};

/**
 * Story mode configuration for Phase 5
 * Defines narrative chapters and boss battle progression
 */
export const storyConfig = {
    enabled: true,
    chapters: [
        {
            level: 1,
            name: 'Network Entry',
            description:
				'ADA-Woman enters the corrupted network to begin data recovery.',
            bossBattle: false
        },
        {
            level: 5,
            name: 'Alpha Breach',
            description:
				'The Alpha virus has established a stronghold. Eliminate it to continue.',
            bossBattle: true,
            bossType: 'alpha'
        },
        {
            level: 10,
            name: 'Beta Ambush',
            description:
				'The Beta virus has created ambush protocols. Counter its strategies.',
            bossBattle: true,
            bossType: 'beta'
        },
        {
            level: 15,
            name: 'Gamma Glitch',
            description:
				'The Gamma virus is causing network instability. Find and eliminate it.',
            bossBattle: true,
            bossType: 'gamma'
        },
        {
            level: 20,
            name: 'Delta Core',
            description:
				'The Delta virus protects the core corruption. Defeat it to complete the mission.',
            bossBattle: true,
            bossType: 'delta'
        }
    ],
    storyModeLevels: [1, 5, 10, 15, 20], // Levels with narrative
    chapterCompleteBonus: 5000 // Bonus points for completing story chapters
};
