# Gameplay & Systems Deep Dive

This document explains how the Pac-Man mechanics are implemented, including scoring, AI, movement rules, and progression.

## 1. Maze & Tiles

- Maze layout is defined in `src/utils/MazeLayout.js` as a 2D array of tile types.
- Tile types include walls, pellets, power pellets, empty, ghost house, and door tiles.
- Helper functions convert between grid and pixel coordinates, validate movement, and count pellets.

## 2. Movement Model

- **Grid-based movement** is handled by `GridMovement` and `TileMovement`.
- Entities track both **grid coordinates** (`gridX`, `gridY`) and **pixel position** (`x`, `y`).
- Movement steps:
  1. Snap to tile center when aligned.
  2. Apply buffered turns if the next direction becomes valid.
  3. Move along grid axes (no diagonal movement).
  4. Handle tunnel warps on the special row.

### Buffered Direction Changes

The `DirectionBuffer` allows immediate reversals (for responsiveness) and queued turns otherwise, matching classic Pac-Man feel.

## 3. Core Game Loop

- Phaser calls `GameScene.update(time, delta)` with millisecond delta.
- Delta is normalized to seconds via `normalizeDeltaSeconds`.
- `FixedTimeStepLoop` ensures all physics logic runs at a stable 60Hz regardless of frame rate.
- `fixedUpdate()` handles entity movement, AI, collision checks, and fruit timers.

## 4. Scoring & Progression

### Scoring

| Item | Points |
|---|---|
| Pellet | 10 |
| Power Pellet | 50 |
| Ghost (combo) | 200/400/800/1600 |
| Fruit | 100 → 5000 |

### Level Progression

- Ghost speed increases per level.
- Frightened duration decreases per level (floored to a minimum).
- `LevelManager` applies per-level settings and returns frightened duration for power pellets.

## 5. Pellets & Power Pellets

- Pellets and power pellets are pooled via `PelletPool` and `PowerPelletPool`.
- When consumed:
  - Score increases.
  - Pellets are removed from the pool and maze count updated.
- Power pellets activate **frightened mode** for ghosts and reset ghost combo tracking.

## 6. Ghost AI

### Modes

Ghosts alternate between:
- **Scatter**: Targets fixed corner tiles.
- **Chase**: Targets Pacman (with unique ghost behavior).
- **Frightened**: Moves unpredictably and can be eaten.
- **Eaten**: Returns to the ghost house before rejoining play.

### Personality Targets

- **Blinky**: Directly targets Pacman.
- **Pinky**: Targets 4 tiles ahead of Pacman (with classic “up-left” bug).
- **Inky**: Uses Blinky and a pivot point 2 tiles ahead of Pacman.
- **Clyde**: Chases Pacman unless too close, then retreats to scatter corner.

## 7. Collision Model

- Pellet and power pellet collisions are tile-based.
- Ghost collisions use **swept capsule collision** to catch high-speed overlaps.
- Collision system tracks performance metrics to avoid excessive time spent per frame.

## 8. Fruit System

- Fruit spawns once a percentage of pellets are eaten.
- Fruit type depends on the current level (progression aligns with classic Pac-Man).
- Fruit is time-limited and animated via a pulsing tween.

## 9. Achievements

Achievements are defined in `AchievementSystem` and include:
- First pellet eaten
- High score milestones
- Ghost combo achievements
- Survival/progression achievements

Achievement notifications are emitted via the `EventBus` and displayed as UI popups in `GameScene`.

## 10. Replay & Demo Mode

- **Replay**: Records input, score, and level to localStorage.
- **Demo Mode**: If the query string includes `?demo`, PacmanAI takes control.

## 11. Audio

- Audio is generated with the Web Audio API in `SoundManager`.
- Sounds are procedurally generated (no audio assets).

## 12. UI & Feedback

- UI is managed by `UIController` (score, lives, level).
- Effects are handled by `EffectManager` (power pellet flash, ghost eaten flash, fruit flash).
- Debug FPS overlay is optional and controlled by settings.
