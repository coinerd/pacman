# @pacman/utils

Utility functions and helpers for Pacman.

## Features

- **MazeGenerator**: Procedural maze generation
- **MazeLayout**: Maze layout utilities and data
- **EventBus**: Generic event bus
- **Config**: Shared game configuration

## Installation

```bash
npm install @pacman/utils
```

## Usage

```javascript
import {
    MazeGenerator,
    createMazeData,
    gameEvents
} from '@pacman/utils';

const mazeGenerator = new MazeGenerator({
    width: 28,
    height: 31,
    tileSize: 20,
    complexity: 0.1,
    seed: 1
});

const maze = mazeGenerator.generate();
const { pelletGrid, spawnPoints } = createMazeData(maze);
```

## API

### MazeGenerator

Procedural maze generation with configurable parameters.

### MazeLayout

Maze layout utilities for creating pellet grids and spawn points.

### EventBus

Central event management with pub/sub pattern.

## License

MIT
