# Maze Randomization Examples

This directory contains example code demonstrating the maze randomization system.

## Files

| File | Description |
|------|-------------|
| `basic-usage.js` | Basic maze generation with presets |
| `preset-demo.js` | Comparing different difficulty presets |
| `seed-replay.js` | Using seeds for reproducible mazes and replays |
| `daily-challenge.js` | Implementing a daily challenge mode |
| `custom-config.js` | Creating custom maze configurations |

## Quick Start

```javascript
import { MazeConfigLoader } from '../src/utils/MazeConfigLoader.js';
import MazeGenerator from '../src/utils/MazeGenerator.js';

// Load a preset configuration
const loader = new MazeConfigLoader();
const config = loader.loadConfig(1, 'hard');

// Convert to generator format
const generatorConfig = loader.toGeneratorConfig(config);

// Generate the maze
const generator = new MazeGenerator({
    ...generatorConfig,
    seed: 12345
});

const result = generator.generate();

console.log('Maze generated:', result.maze.length, 'rows');
console.log('Validation:', result.validationResult.isValid ? 'PASSED' : 'FAILED');
```

## Running Examples

These examples are designed to be run in a Node.js environment or imported into your game code.

```bash
# Run with Node.js (requires ES module support)
node examples/maze-randomization/basic-usage.js
```

## Key Concepts

### Presets

- **default**: Standard balanced maze
- **easy**: Beginner-friendly with many paths
- **medium**: Balanced difficulty
- **hard**: Challenging with limited escape routes
- **expert**: For experienced players

### Seed Modes

- **full_random**: Unique random seed each time
- **level_sequence**: Same level = same maze (for speedruns)
- **daily_challenge**: Seed based on date (same for all players)
- **seeded**: Manual seed for debugging/replays

### Validation Rules

All generated mazes are validated against:
- Connectivity (all tiles reachable)
- Alternative paths (multiple routes to targets)
- Dead-end density (balanced number of dead ends)
- Corridor length (no excessively long corridors)
- Spawn safety (adequate starting area)
