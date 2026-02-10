// @ts-check
import { test, expect } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const gameURL = `${baseURL}/?e2e`;

test('Debug ghost AI and movement', async ({ page }) => {
  await page.goto(gameURL);
  await page.waitForTimeout(1000);

  // Start game
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);

  // Check ghost initialization and valid directions
  const ghostDebug = await page.evaluate(() => {
    const game = window.game;
    const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
    const model = gameScene.gameModel;
    
    // Import the getValidDirections function by evaluating it inline
    const results = [];
    
    for (const ghost of model.ghosts) {
      // Check maze at ghost position
      const gridX = ghost.gridX;
      const gridY = ghost.gridY;
      const maze = model.maze;
      
      // Check surrounding tiles manually
      const neighbors = [
        { dir: 'UP', x: 0, y: -1, dx: 0, dy: -1 },
        { dir: 'DOWN', x: 0, y: 1, dx: 0, dy: 1 },
        { dir: 'LEFT', x: -1, y: 0, dx: -1, dy: 0 },
        { dir: 'RIGHT', x: 1, y: 0, dx: 1, dy: 0 }
      ];
      
      const walkableNeighbors = [];
      for (const n of neighbors) {
        const nx = gridX + n.x;
        const ny = gridY + n.y;
        if (ny >= 0 && ny < maze.length && nx >= 0 && nx < maze[0].length) {
          const isWalkable = maze[ny][nx] === 0;
          walkableNeighbors.push({
            dir: n.dir,
            nx, ny,
            isWalkable,
            value: maze[ny][nx]
          });
        }
      }
      
      results.push({
        type: ghost.ghostType,
        x: ghost.x,
        y: ghost.y,
        gridX: ghost.gridX,
        gridY: ghost.gridY,
        direction: ghost.direction,
        isMoving: ghost.isMoving,
        mode: ghost.mode,
        targetX: ghost.targetX,
        targetY: ghost.targetY,
        mazeValueAtPos: maze[gridY][gridX],
        walkableNeighbors
      });
    }
    
    return results;
  });

  console.log('=== GHOST DEBUG INFO ===');
  for (const g of ghostDebug) {
    console.log(`\n${g.type.toUpperCase()}:`);
    console.log(`  Position: (${g.x}, ${g.y}) grid(${g.gridX}, ${g.gridY})`);
    console.log(`  Direction: ${JSON.stringify(g.direction)}`);
    console.log(`  Target: (${g.targetX}, ${g.targetY})`);
    console.log(`  Mode: ${g.mode}, isMoving: ${g.isMoving}`);
    console.log(`  Walkable neighbors:`, g.walkableNeighbors.filter(n => n.isWalkable).map(n => n.dir));
  }

  // Now let's manually trigger an AI update and see if it works
  await page.waitForTimeout(1000);
  
  const afterWait = await page.evaluate(() => {
    const game = window.game;
    const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
    const model = gameScene.gameModel;
    
    return model.ghosts.map(g => ({
      type: g.ghostType,
      x: g.x,
      y: g.y,
      direction: g.direction,
      isMoving: g.isMoving
    }));
  });

  console.log('\n=== AFTER 1 SECOND ===');
  for (const g of afterWait) {
    console.log(`${g.type}: pos(${g.x.toFixed(1)}, ${g.y.toFixed(1)}) dir=${JSON.stringify(g.direction)} isMoving=${g.isMoving}`);
  }
});

test('Debug ghost updateAI function', async ({ page }) => {
  await page.goto(gameURL);
  await page.waitForTimeout(1000);

  // Start game
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);

  // Check if updateAI is accessible and works
  const aiTest = await page.evaluate(() => {
    const game = window.game;
    const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
    const model = gameScene.gameModel;
    const ghost = model.ghosts[0]; // Blinky
    
    const before = {
      direction: ghost.direction,
      targetX: ghost.targetX,
      targetY: ghost.targetY
    };
    
    // Check if methods exist
    const hasUpdateAI = typeof ghost.updateAI === 'function';
    const hasChooseDirection = typeof ghost.chooseDirectionToTarget === 'function';
    const hasUpdateTarget = typeof ghost.updateTarget === 'function';
    
    // Try calling updateAI manually
    let error = null;
    try {
      ghost.updateAI(model.maze, model.pacman);
    } catch (e) {
      error = e.message;
    }
    
    const after = {
      direction: ghost.direction,
      targetX: ghost.targetX,
      targetY: ghost.targetY
    };
    
    return {
      ghostType: ghost.ghostType,
      hasUpdateAI,
      hasChooseDirection,
      hasUpdateTarget,
      before,
      after,
      error
    };
  });

  console.log('=== AI FUNCTION TEST ===', aiTest);
  expect(aiTest.hasUpdateAI).toBe(true);
  expect(aiTest.hasChooseDirection).toBe(true);
  expect(aiTest.hasUpdateTarget).toBe(true);
  expect(aiTest.error).toBeNull();
});

test('Debug tile center check', async ({ page }) => {
  await page.goto(gameURL);
  await page.waitForTimeout(1000);

  // Start game
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);

  // Check if ghosts are at tile center
  const centerCheck = await page.evaluate(() => {
    const game = window.game;
    const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
    const model = gameScene.gameModel;
    
    // Import isAtTileCenter logic
    const TILE_SIZE = 20;
    const CENTER_EPSILON = 3;
    
    function isAtTileCenter(x, y, gridX, gridY) {
      const centerX = gridX * TILE_SIZE + TILE_SIZE / 2;
      const centerY = gridY * TILE_SIZE + TILE_SIZE / 2;
      const dx = Math.abs(x - centerX);
      const dy = Math.abs(y - centerY);
      return dx <= CENTER_EPSILON && dy <= CENTER_EPSILON;
    }
    
    return model.ghosts.map(g => {
      const centerX = g.gridX * TILE_SIZE + TILE_SIZE / 2;
      const centerY = g.gridY * TILE_SIZE + TILE_SIZE / 2;
      return {
        type: g.ghostType,
        x: g.x,
        y: g.y,
        gridX: g.gridX,
        gridY: g.gridY,
        centerX,
        centerY,
        dx: Math.abs(g.x - centerX),
        dy: Math.abs(g.y - centerY),
        isAtCenter: isAtTileCenter(g.x, g.y, g.gridX, g.gridY)
      };
    });
  });

  console.log('=== TILE CENTER CHECK ===');
  for (const g of centerCheck) {
    console.log(`${g.type}: pos(${g.x}, ${g.y}) center(${g.centerX}, ${g.centerY})`);
    console.log(`  dx=${g.dx.toFixed(1)}, dy=${g.dy.toFixed(1)}, isAtCenter=${g.isAtCenter}`);
  }
});
