// @ts-check
import { test, expect } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const gameURL = `${baseURL}/?e2e`;

test.describe('Movement and Collision Diagnosis', () => {
  
  test('Diagnose Pacman movement - position tracking over time', async ({ page }) => {
    await page.goto(gameURL);
    await page.waitForSelector('canvas');

    // Start the game
    await page.keyboard.press('Space');
    await page.waitForTimeout(1000);

    // Track positions over multiple frames
    const positions = [];
    
    for (let i = 0; i < 20; i++) {
      const pos = await page.evaluate(() => {
        const game = window.game;
        if (game && game.scene && game.scene.scenes) {
          const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
          if (gameScene && gameScene.gameModel) {
            const model = gameScene.gameModel;
            return {
              pacman: {
                x: model.pacman.x,
                y: model.pacman.y,
                gridX: model.pacman.gridX,
                gridY: model.pacman.gridY,
                direction: model.pacman.direction,
                isMoving: model.pacman.isMoving,
                desiredDirection: model.desiredDirection,
                inputDirection: model.inputDirection
              },
              ghosts: model.ghosts.map(g => ({
                type: g.ghostType,
                x: g.x,
                y: g.y,
                gridX: g.gridX,
                gridY: g.gridY,
                direction: g.direction,
                isMoving: g.isMoving,
                mode: g.mode
              }))
            };
          }
        }
        return null;
      });
      
      positions.push({ frame: i, ...pos });
      
      // Press right arrow every few frames
      if (i === 2 || i === 8 || i === 14) {
        await page.keyboard.press('ArrowRight');
      }
      
      await page.waitForTimeout(100); // 100ms = 10Hz sample rate
    }

    console.log('=== PACMAN MOVEMENT TRACE ===');
    for (const p of positions) {
      const pac = p.pacman;
      console.log(`Frame ${p.frame}: Pacman at (${pac.x.toFixed(1)}, ${pac.y.toFixed(1)}) grid(${pac.gridX}, ${pac.gridY}) dir=${JSON.stringify(pac.direction)} isMoving=${pac.isMoving}`);
      console.log(`  desired=${JSON.stringify(pac.desiredDirection)} input=${JSON.stringify(pac.inputDirection)}`);
    }

    console.log('\n=== GHOST MOVEMENT TRACE ===');
    for (const p of positions) {
      console.log(`Frame ${p.frame}:`);
      for (const g of p.ghosts) {
        console.log(`  ${g.type}: (${g.x.toFixed(1)}, ${g.y.toFixed(1)}) grid(${g.gridX}, ${g.gridY}) dir=${JSON.stringify(g.direction)} isMoving=${g.isMoving} mode=${g.mode}`);
      }
    }

    // Verify Pacman is actually moving
    const firstPos = positions[0].pacman;
    const lastPos = positions[positions.length - 1].pacman;
    
    console.log(`\nPacman moved from (${firstPos.x.toFixed(1)}, ${firstPos.y.toFixed(1)}) to (${lastPos.x.toFixed(1)}, ${lastPos.y.toFixed(1)})`);
    
    // Check if movement occurred
    const moved = Math.abs(lastPos.x - firstPos.x) > 5 || Math.abs(lastPos.y - firstPos.y) > 5;
    expect(moved, 'Pacman should have moved significantly').toBe(true);
    
    // Check if ghosts are moving
    const firstGhost = positions[0].ghosts[0];
    const lastGhost = positions[positions.length - 1].ghosts[0];
    const ghostMoved = Math.abs(lastGhost.x - firstGhost.x) > 1 || Math.abs(lastGhost.y - firstGhost.y) > 1;
    
    console.log(`Ghost ${firstGhost.type} moved from (${firstGhost.x.toFixed(1)}, ${firstGhost.y.toFixed(1)}) to (${lastGhost.x.toFixed(1)}, ${lastGhost.y.toFixed(1)})`);
    expect(ghostMoved, 'Ghosts should have moved').toBe(true);
  });

  test('Diagnose input flow from keyboard to model', async ({ page }) => {
    await page.goto(gameURL);
    await page.waitForTimeout(1000);

    // Start game
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);

    // Check initial state
    let state = await page.evaluate(() => {
      const game = window.game;
      if (game && game.scene && game.scene.scenes) {
        const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
        if (gameScene) {
          return {
            inputManagerActive: gameScene.inputManager?.activeAdapter,
            keyboardEnabled: gameScene.inputManager?.adapters?.keyboard?.isEnabled,
            gameControllerActive: gameScene.gameController?.isActive,
            modelInputDirection: gameScene.gameModel?.inputDirection,
            modelDesiredDirection: gameScene.gameModel?.desiredDirection,
            pacmanDirection: gameScene.gameModel?.pacman?.direction,
            pacmanNextDirection: gameScene.gameModel?.pacman?.directionBuffer?.peek()
          };
        }
      }
      return null;
    });

    console.log('=== INITIAL STATE ===', state);
    expect(state).not.toBeNull();
    expect(state.inputManagerActive).toBe('keyboard');
    expect(state.keyboardEnabled).toBe(true);
    expect(state.gameControllerActive).toBe(true);

    // Press right arrow
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);

    // Check state after key press
    state = await page.evaluate(() => {
      const game = window.game;
      const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
      return {
        modelInputDirection: gameScene.gameModel?.inputDirection,
        modelDesiredDirection: gameScene.gameModel?.desiredDirection,
        pacmanDirection: gameScene.gameModel?.pacman?.direction,
        pacmanNextDirection: gameScene.gameModel?.pacman?.directionBuffer?.peek(),
        nativeKeys: gameScene.inputManager?.adapters?.keyboard?.nativeKeys
      };
    });

    console.log('=== AFTER KEY PRESS ===', state);
    console.log('Native keys state:', state.nativeKeys);

    // Wait and check again
    await page.waitForTimeout(500);
    
    state = await page.evaluate(() => {
      const game = window.game;
      const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
      const pacman = gameScene.gameModel?.pacman;
      return {
        x: pacman?.x,
        y: pacman?.y,
        direction: pacman?.direction,
        isMoving: pacman?.isMoving,
        gridX: pacman?.gridX,
        gridY: pacman?.gridY
      };
    });

    console.log('=== PACMAN STATE AFTER 500ms ===', state);
    expect(state.direction).not.toBeNull();
  });

  test('Diagnose fixed timestep and game loop', async ({ page }) => {
    await page.goto(gameURL);
    await page.waitForTimeout(1000);

    // Start game
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);

    // Check game loop state
    const loopState = await page.evaluate(() => {
      const game = window.game;
      const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
      if (!gameScene) return null;
      
      return {
        isPaused: gameScene.gameModel?.isPaused,
        isGameOver: gameScene.gameModel?.isGameOver,
        isDying: gameScene.gameModel?.isDying,
        tickCount: gameScene.gameModel?.tickCount,
        fixedTimeStep: gameScene.fixedTimeStepLoop?.accumulator !== undefined,
        lastStepCount: gameScene.fixedTimeStepLoop?.lastStepCount
      };
    });

    console.log('=== GAME LOOP STATE ===', loopState);
    expect(loopState).not.toBeNull();
    expect(loopState.isPaused).toBe(false);
    expect(loopState.isGameOver).toBe(false);

    // Wait and check if tick count increases
    await page.waitForTimeout(1000);
    
    const newLoopState = await page.evaluate(() => {
      const game = window.game;
      const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
      return {
        tickCount: gameScene.gameModel?.tickCount,
        pacmanX: gameScene.gameModel?.pacman?.x,
        pacmanY: gameScene.gameModel?.pacman?.y
      };
    });

    console.log('=== AFTER 1 SECOND ===', newLoopState);
    expect(newLoopState.tickCount).toBeGreaterThan(loopState.tickCount);
    
    // Press right and track movement
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);
    
    const beforeMove = { ...newLoopState };
    
    await page.waitForTimeout(500);
    
    const afterMove = await page.evaluate(() => {
      const game = window.game;
      const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
      return {
        tickCount: gameScene.gameModel?.tickCount,
        pacmanX: gameScene.gameModel?.pacman?.x,
        pacmanY: gameScene.gameModel?.pacman?.y,
        pacmanDir: gameScene.gameModel?.pacman?.direction
      };
    });

    console.log('=== AFTER MOVEMENT ===', afterMove);
    console.log(`Position change: (${beforeMove.pacmanX.toFixed(1)}, ${beforeMove.pacmanY.toFixed(1)}) -> (${afterMove.pacmanX.toFixed(1)}, ${afterMove.pacmanY.toFixed(1)})`);
    
    const distance = Math.sqrt(
      Math.pow(afterMove.pacmanX - beforeMove.pacmanX, 2) + 
      Math.pow(afterMove.pacmanY - beforeMove.pacmanY, 2)
    );
    console.log(`Distance moved: ${distance.toFixed(1)} pixels`);
    
    expect(distance).toBeGreaterThan(5);
  });

  test('Diagnose collision system', async ({ page }) => {
    await page.goto(gameURL);
    await page.waitForTimeout(1000);

    // Start game
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);

    // Check collision system
    const collisionState = await page.evaluate(() => {
      const game = window.game;
      const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
      if (!gameScene) return null;
      
      const collisionSystem = gameScene.gameModel?.collisionSystem;
      return {
        hasCollisionSystem: !!collisionSystem,
        stats: collisionSystem?.getStats?.(),
        pacmanPos: {
          x: gameScene.gameModel?.pacman?.x,
          y: gameScene.gameModel?.pacman?.y,
          gridX: gameScene.gameModel?.pacman?.gridX,
          gridY: gameScene.gameModel?.pacman?.gridY
        },
        ghostPositions: gameScene.gameModel?.ghosts?.map(g => ({
          type: g.ghostType,
          x: g.x,
          y: g.y,
          gridX: g.gridX,
          gridY: g.gridY
        }))
      };
    });

    console.log('=== COLLISION SYSTEM STATE ===', collisionState);
    expect(collisionState).not.toBeNull();
    expect(collisionState.hasCollisionSystem).toBe(true);

    // Check pellet collisions work
    const pelletState = await page.evaluate(() => {
      const game = window.game;
      const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
      const model = gameScene.gameModel;
      
      // Check pellets around pacman
      const pacX = model.pacman.gridX;
      const pacY = model.pacman.gridY;
      const pellets = [];
      
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const x = pacX + dx;
          const y = pacY + dy;
          if (y >= 0 && y < model.pelletGrid.length && x >= 0 && x < model.pelletGrid[0].length) {
            pellets.push({
              x, y,
              value: model.pelletGrid[y][x],
              distance: Math.sqrt(dx*dx + dy*dy)
            });
          }
        }
      }
      
      return {
        pacmanGrid: { x: pacX, y: pacY },
        pelletsRemaining: model.pelletsRemaining,
        nearbyPellets: pellets.filter(p => p.value !== 0)
      };
    });

    console.log('=== PELLET STATE ===', pelletState);
    expect(pelletState.pelletsRemaining).toBeGreaterThan(0);
  });

  test('Diagnose maze and walkability', async ({ page }) => {
    await page.goto(gameURL);
    await page.waitForTimeout(1000);

    // Start game
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);

    // Check maze around pacman
    const mazeState = await page.evaluate(() => {
      const game = window.game;
      const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
      const model = gameScene.gameModel;
      const pacman = model.pacman;
      
      // Get maze tiles around pacman
      const maze = model.maze;
      const tiles = [];
      
      for (let dy = -3; dy <= 3; dy++) {
        const row = [];
        for (let dx = -3; dx <= 3; dx++) {
          const x = pacman.gridX + dx;
          const y = pacman.gridY + dy;
          if (y >= 0 && y < maze.length && x >= 0 && x < maze[0].length) {
            row.push({
              x, y,
              walkable: maze[y][x] === 0,
              value: maze[y][x]
            });
          } else {
            row.push({ x, y, walkable: false, value: -1 });
          }
        }
        tiles.push(row);
      }
      
      // Check if pacman can move in each direction
      const canMove = {
        LEFT: pacman.canMoveInDirection({x: -1, y: 0}, maze),
        RIGHT: pacman.canMoveInDirection({x: 1, y: 0}, maze),
        UP: pacman.canMoveInDirection({x: 0, y: -1}, maze),
        DOWN: pacman.canMoveInDirection({x: 0, y: 1}, maze)
      };
      
      return {
        pacmanGrid: { x: pacman.gridX, y: pacman.gridY },
        pacmanPixel: { x: pacman.x, y: pacman.y },
        tilesAround: tiles,
        canMove
      };
    });

    console.log('=== MAZE STATE ===');
    console.log('Pacman at grid:', mazeState.pacmanGrid);
    console.log('Pacman at pixel:', mazeState.pacmanPixel);
    console.log('Can move:', mazeState.canMove);
    
    console.log('\nTiles around pacman (0=walkable, 1=wall):');
    for (const row of mazeState.tilesAround) {
      console.log(row.map(t => t.value).join(' '));
    }
    
    // Pacman should be able to move in at least 2 directions (left and right)
    const movableDirections = Object.values(mazeState.canMove).filter(v => v).length;
    expect(movableDirections).toBeGreaterThanOrEqual(1);
  });
});
