# @pacman/core

Core game systems and utilities for Pacman.

## Features

- **LevelSystem**: Level progression and configuration
- **SpawningSystem**: Entity spawning and maze generation
- **AchievementSystem**: Achievement tracking
- **ReplaySystem**: Game recording and playback
- **EntityRegistry**: Central entity management
- **GameModelDI**: Main game model with dependency injection
- **ServiceContainer**: Dependency injection container
- **EventBus**: Central event management

## Installation

```bash
npm install @pacman/core
```

## Usage

```javascript
import {
    LevelSystem,
    SpawningSystem,
    EntityRegistry,
    gameEvents
} from '@pacman/core';

const levelSystem = new LevelSystem();
levelSystem.setLevel(1);

const spawningSystem = new SpawningSystem(levelSystem);
const maze = spawningSystem.generateMazeForLevel(1);
```

## API

### LevelSystem

Level progression, configuration, and difficulty scaling.

### SpawningSystem

Entity spawning, maze generation, and pellet management.

### EntityRegistry

Central entity management for player, ghosts, and fruit.

### ServiceContainer

Dependency injection container for service lifecycle management.

## License

MIT
