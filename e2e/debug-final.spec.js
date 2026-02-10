// @ts-check
import { test, expect } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const gameURL = `${baseURL}/?e2e`;

test('Final debug - step by step trace with actual module', async ({ page }) => {
  await page.goto(gameURL);
  await page.waitForTimeout(1000);

  // Start game
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);

  // Trace with direct access to all internals
  const trace = await page.evaluate(() => {
    const game = window.game;
    const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
    const model = gameScene.gameModel;
    const pacman = model.pacman;
    const maze = model.maze;
    
    const steps = [];
    
    // Set initial state like after first movement
    pacman.x = 271.99;
    pacman.y = 450;
    pacman.direction = { x: 1, y: 0, angle: 0 };
    pacman.isMoving = true;
    
    for (let i = 0; i < 3; i++) {
      // Capture detailed state before
      const before = {
        x: pacman.x,
        y: pacman.y,
        gridX: pacman.gridX,
        gridY: pacman.gridY,
        direction: { ...pacman.direction },
        buffered: pacman.directionBuffer.getBuffered(),
        current: pacman.directionBuffer.getCurrent(),
        isMoving: pacman.isMoving
      };
      
      // Calculate tile center
      const TILE_SIZE = 20;
      const centerX = pacman.gridX * TILE_SIZE + TILE_SIZE / 2;
      const centerY = pacman.gridY * TILE_SIZE + TILE_SIZE / 2;
      const distToCenter = Math.hypot(centerX - pacman.x, centerY - pacman.y);
      const atCenter = distToCenter <= 2;
      
      // Check canMove
      const nextX = pacman.gridX + pacman.direction.x;
      const nextY = pacman.gridY + pacman.direction.y;
      const canMove = nextY >= 0 && nextY < maze.length && nextX >= 0 && nextX < maze[0].length 
        ? maze[nextY][nextX] === 0 
        : false;
      
      // Call pacman.update
      const events = pacman.update(1/60, maze, null);
      
      steps.push({
        step: i,
        before,
        after: {
          x: pacman.x,
          y: pacman.y,
          direction: pacman.direction,
          isMoving: pacman.isMoving
        },
        delta: {
          x: pacman.x - before.x,
          y: pacman.y - before.y
        },
        diagnostics: {
          center: { x: centerX, y: centerY },
          distToCenter,
          atCenter,
          canMove,
          nextTile: { x: nextX, y: nextY, value: maze[nextY]?.[nextX] }
        },
        events
      });
    }
    
    return steps;
  });

  console.log('=== DETAILED TRACE ===');
  for (const s of trace) {
    console.log(`\nStep ${s.step}:`);
    console.log('  BEFORE:', s.before);
    console.log('  DIAGNOSTICS:', s.diagnostics);
    console.log('  AFTER:', s.after);
    console.log('  DELTA:', s.delta);
  }
  
  const totalMove = trace.reduce((sum, s) => sum + Math.abs(s.delta.x), 0);
  console.log(`\nTotal X movement: ${totalMove.toFixed(2)}`);
  
  expect(totalMove).toBeGreaterThan(0);
});

test('Check if GridMovement module is loaded correctly', async ({ page }) => {
  await page.goto(gameURL);
  await page.waitForTimeout(1000);

  const result = await page.evaluate(() => {
    // Check if GridMovement is accessible
    try {
      // Try to access the module
      const game = window.game;
      const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
      
      // Check pacman
      const pacman = gameScene.gameModel.pacman;
      
      return {
        pacmanExists: !!pacman,
        pacmanHasUpdate: typeof pacman.update === 'function',
        pacmanHasDirectionBuffer: !!pacman.directionBuffer,
        directionBufferHasApplyIfCanMove: typeof pacman.directionBuffer?.applyIfCanMove === 'function'
      };
    } catch (e) {
      return { error: e.message };
    }
  });

  console.log('Module check:', result);
  expect(result.pacmanExists).toBe(true);
  expect(result.pacmanHasUpdate).toBe(true);
});

test('Ghost vs Pacman movement comparison', async ({ page }) => {
  await page.goto(gameURL);
  await page.waitForTimeout(1000);

  // Start game
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);

  const result = await page.evaluate(() => {
    const game = window.game;
    const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
    const model = gameScene.gameModel;
    const pacman = model.pacman;
    const blinky = model.ghosts.find(g => g.ghostType === 'blinky');
    const maze = model.maze;
    
    // Set both to same initial state
    pacman.x = 271.99;
    pacman.y = 450;
    pacman.direction = { x: 1, y: 0, angle: 0 };
    pacman.isMoving = true;
    
    blinky.x = 271.99;
    blinky.y = 450;
    blinky.direction = { x: 1, y: 0, angle: 0 };
    blinky.isMoving = true;
    
    const trace = [];
    
    for (let i = 0; i < 3; i++) {
      const before = {
        pacman: { x: pacman.x, y: pacman.y, dir: pacman.direction },
        blinky: { x: blinky.x, y: blinky.y, dir: blinky.direction }
      };
      
      // Update both
      pacman.update(1/60, maze, null);
      blinky.update(1/60, maze, pacman);
      
      trace.push({
        step: i,
        before,
        after: {
          pacman: { x: pacman.x, y: pacman.y, dir: pacman.direction },
          blinky: { x: blinky.x, y: blinky.y, dir: blinky.direction }
        }
      });
    }
    
    return trace;
  });

  console.log('=== GHOST vs PACMAN ===');
  for (const t of result) {
    console.log(`\nStep ${t.step}:`);
    console.log('  Pacman before:', t.before.pacman);
    console.log('  Pacman after: ', t.after.pacman);
    console.log('  Blinky before:', t.before.blinky);
    console.log('  Blinky after: ', t.after.blinky);
  }
  
  // Blinky should have moved
  const blinkyMove = result[result.length - 1].after.blinky.x - result[0].before.blinky.x;
  console.log(`\nBlinky moved: ${blinkyMove.toFixed(2)}`);
  
  // Pacman should also have moved
  const pacmanMove = result[result.length - 1].after.pacman.x - result[0].before.pacman.x;
  console.log(`Pacman moved: ${pacmanMove.toFixed(2)}`);
});
