# @pacman/movement

Generic movement system for tile-based games.

## Features

- **MovementEngine**: Core movement logic with interpolation
- **MovementComponent**: Entity movement state management
- **Direction**: Direction constants and utilities
- **MazeAdapter**: Tile-to-world coordinate conversion
- **AIController**: AI movement behavior
- **TileCenterMovement**: Tile-center movement feature

## Installation

```bash
npm install @pacman/movement
```

## Usage

```javascript
import {
    MovementEngine,
    MovementComponent,
    Direction
} from '@pacman/movement';

const engine = new MovementEngine();
const component = new MovementComponent({ x: 100, y: 100, speed: 100 });
```

## API

### MovementEngine

Core movement logic with interpolation, tunnel wrapping, and statistics.

### MovementComponent

Entity movement state with position, velocity, and direction.

### Direction

Direction constants (UP, DOWN, LEFT, RIGHT) and utilities.

## License

MIT
