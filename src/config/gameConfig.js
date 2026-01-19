/**
 * Game Configuration
 * Contains all constants and settings for the Pac-Man game
 */

export const gameConfig = {
    width: 560,
    height: 620,
    tileSize: 20,
    mazePadding: 0,
    mazeWidth: 28,
    mazeHeight: 31,
    targetFPS: 60,
    tunnelRow: 14
};

export const colors = {
    background: 0x000000,
    wall: 0x2121DE,
    wallShadow: 0x1919B8,
    pacman: 0xFFFF00,
    blinky: 0xFF0000,
    pinky: 0xFFB8FF,
    inky: 0x00FFFF,
    clyde: 0xFFB852,
    pellet: 0xFFFFFF,
    powerPellet: 0xFFFFFF,
    frightenedGhost: 0x0000FF,
    frightenedGhostEnd: 0xFFFFFF,
    text: 0xFFFFFF,
    score: 0xFFD700,
    level: 0x00FF00,
    cherry: 0xFF0000,
    strawberry: 0xFF69B4,
    orange: 0xFFA500,
    apple: 0x00FF00,
    melon: 0x00CED1,
    galaxian: 0xFF1493,
    bell: 0xFFD700,
    key: 0xFFFFFF
};


export const directions = {
    UP: { x: 0, y: -1, angle: 270 },
    DOWN: { x: 0, y: 1, angle: 90 },
    LEFT: { x: -1, y: 0, angle: 180 },
    RIGHT: { x: 1, y: 0, angle: 0 },
    NONE: { x: 0, y: 0, angle: 0 }
};

directions.ALL = [directions.UP, directions.DOWN, directions.LEFT, directions.RIGHT];

export const getOpposite = (dir) => {
    if (!dir || dir === directions.NONE) {
        return directions.NONE;
    }
    return directions.ALL.find(d => d.x === -dir.x && d.y === -dir.y);
};

export const ghostModes = {
    SCATTER: 'SCATTER',
    CHASE: 'CHASE',
    FRIGHTENED: 'FRIGHTENED',
    EATEN: 'EATEN'
};

export const ghostColors = {
    BLINKY: 0xFF0000,
    PINKY: 0xFFB8FF,
    INKY: 0x00FFFF,
    CLYDE: 0xFFB852
};


export const ghostNames = {
    BLINKY: 'blinky',
    PINKY: 'pinky',
    INKY: 'inky',
    CLYDE: 'clyde'
};

export const scoreValues = {
    pellet: 10,
    powerPellet: 50,
    ghost: [200, 400, 800, 1600],
    fruit: [100, 300, 500, 700, 1000, 2000, 3000, 5000]
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
    frightenedDuration: 8000,
    scatterDuration: 7000,
    chaseDuration: 20000,
    speedIncreasePerLevel: 10,  // Increased from 5
    frightenedDecreasePerLevel: 500
};

export const ghostStartPositions = {
    blinky: { x: 2, y: 1 },
    pinky: { x: 24, y: 1 },
    inky: { x: 2, y: 25 },
    clyde: { x: 24, y: 25 }
};


export const ghostHouse = {
    entrance: { x: 13, y: 11 },
    center: { x: 13, y: 14 }
};

export const pacmanStartPosition = { x: 13, y: 22 };

export const powerPelletPositions = [
    { x: 1, y: 14 },
    { x: 26, y: 14 },
    { x: 1, y: 39 },
    { x: 26, y: 39 }
];

export const scatterTargets = {
    blinky: { x: 26, y: 0 },
    pinky: { x: 2, y: 0 },
    inky: { x: 27, y: 30 },
    clyde: { x: 0, y: 30 }
};

/**
 * Fruit configuration
 * Fruits appear at specific pellet counts and give bonus points
 */
export const fruitConfig = {
    positions: [
        { x: 13, y: 17 }
    ],
    types: [
        { name: 'cherry', score: 100, color: colors.cherry },
        { name: 'strawberry', score: 300, color: colors.strawberry },
        { name: 'orange', score: 500, color: colors.orange },
        { name: 'apple', score: 700, color: colors.apple },
        { name: 'melon', score: 1000, color: colors.melon },
        { name: 'galaxian', score: 2000, color: colors.galaxian },
        { name: 'bell', score: 3000, color: colors.bell },
        { name: 'key', score: 5000, color: colors.key }
    ],
    duration: 10000, // Time fruit stays on screen (ms)
    pelletThreshold: 70 // Percentage of pellets eaten to spawn fruit
};

/**
 * Animation timing configuration
 */
export const animationConfig = {
    pacmanMouthSpeed: 15,  // degrees per second
    pacmanDeathSpeed: 30,  // degrees per second
    powerPelletPulseSpeed: 500,  // milliseconds (Phaser tween duration)
    ghostBlinkSpeed: 200,  // milliseconds (not currently used)
    textFadeSpeed: 800,  // milliseconds (not currently used)
    countdownDuration: 3000,  // milliseconds (Phaser delayedCall duration)
    deathPauseDuration: 2  // seconds (accumulated with delta in seconds)
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
    powerPellet: { frequency: 600, duration: 0.3 },
    ghostEaten: { frequency: 800, duration: 0.2 },
    death: { frequency: 200, duration: 0.5 },
    levelComplete: { frequency: 1000, duration: 0.4 },
    fruitEat: { frequency: 500, duration: 0.15 }
};

/**
 * Local storage keys
 */
export const storageKeys = {
    highScore: 'pacman_high_score',
    settings: 'pacman_settings'
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
