// @ts-check
import { test, expect } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const gameURL = `${baseURL}/?e2e`;

test('Start at 271.99 (offset from center)', async ({ page }) => {
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
    const maze = model.maze;
    
    // Set state at 271.99 (2px from center at 270)
    pacman.x = 271.99;
    pacman.y = 450;
    pacman.gridX = 13;
    pacman.gridY = 22;
    pacman.direction = { x: 1, y: 0, angle: 0 };
    pacman.isMoving = true;
    
    // Calculate diagnostics
    const TILE_SIZE = 20;
    const EPS = 2;
    const centerX = pacman.gridX * TILE_SIZE + TILE_SIZE / 2;
    const distToCenter = Math.abs(centerX - pacman.x);
    const atCenter = distToCenter <= EPS;
    
    const before = {
      x: pacman.x,
      y: pacman.y,
      gridX: pacman.gridX,
      gridY: pacman.gridY,
      direction: pacman.direction,
      isMoving: pacman.isMoving,
      diagnostics: {
        centerX,
        distToCenter,
        atCenter
      }
    };
    
    // Call update
    const events = pacman.update(1/60, maze, null);
    
    const after = {
      x: pacman.x,
      y: pacman.y,
      direction: pacman.direction,
      isMoving: pacman.isMoving
    };
    
    return { before, after, delta: { x: after.x - before.x }, events };
  });

  console.log('=== START AT 271.99 ===');
  console.log('Before:', result.before);
  console.log('After:', result.after);
  console.log('Delta:', result.delta);
  
  // Should have moved
  expect(Math.abs(result.delta.x)).toBeGreaterThan(0);
});

test('Compare 270 vs 271.99 starting position', async ({ page }) => {
  await page.goto(gameURL);
  await page.waitForTimeout(1000);

  // Start game
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);

  const result = await page.evaluate(() => {
    const game = window.game;
    const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
    const model = gameScene.gameModel;
    const maze = model.maze;
    
    const TILE_SIZE = 20;
    const EPS = 2;
    
    function runTest(startX) {
      const pacman = model.pacman;
      
      // Reset state
      pacman.x = startX;
      pacman.y = 450;
      pacman.gridX = 13;
      pacman.gridY = 22;
      pacman.direction = { x: 1, y: 0, angle: 0 };
      pacman.isMoving = true;
      
      const centerX = pacman.gridX * TILE_SIZE + TILE_SIZE / 2;
      const distToCenter = Math.abs(centerX - pacman.x);
      const atCenter = distToCenter <= EPS;
      
      const before = { x: pacman.x, y: pacman.y };
      
      // Call update
      pacman.update(1/60, maze, null);
      
      const after = { x: pacman.x, y: pacman.y };
      
      return {
        startX,
        centerX,
        distToCenter,
        atCenter,
        before,
        after,
        delta: after.x - before.x
      };
    }
    
    return {
      from270: runTest(270),
      from271_99: runTest(271.99)
    };
  });

  console.log('=== FROM 270 ===', result.from270);
  console.log('=== FROM 271.99 ===', result.from271_99);
  
  // Both should move
  expect(Math.abs(result.from270.delta)).toBeGreaterThan(0);
  expect(Math.abs(result.from271_99.delta)).toBeGreaterThan(0);
});

test('Trace what happens at 271.99 step by step', async ({ page }) => {
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
    const maze = model.maze;
    
    const TILE_SIZE = 20;
    const EPS = 2;
    const CENTER_EPSILON = 3;
    
    // Set state at 271.99
    pacman.x = 271.99;
    pacman.y = 450;
    pacman.gridX = 13;
    pacman.gridY = 22;
    pacman.direction = { x: 1, y: 0, angle: 0 };
    pacman.isMoving = true;
    
    // Calculate isAtTileCenter (from TileMath.js)
    function isAtTileCenter(x, y, gridX, gridY) {
      const centerX = gridX * TILE_SIZE + TILE_SIZE / 2;
      const centerY = gridY * TILE_SIZE + TILE_SIZE / 2;
      const dx = Math.abs(x - centerX);
      const dy = Math.abs(y - centerY);
      return dx <= CENTER_EPSILON && dy <= CENTER_EPSILON;
    }
    
    const before = {
      x: pacman.x,
      y: pacman.y,
      isAtCenter: isAtTileCenter(pacman.x, pacman.y, pacman.gridX, pacman.gridY)
    };
    
    // Trace through update step by step
    // 1. Update mouth animation
    pacman.updateMouthAnimation(1/60);
    
    // 2. No input direction
    // 3. Update previous position
    pacman.updatePreviousPosition();
    
    // 4. Check if at tile center
    const isAtCenter = isAtTileCenter(pacman.x, pacman.y, pacman.gridX, pacman.gridY);
    
    // 5. If at center, make decision
    if (isAtCenter) {
      pacman.makeDecisionAtIntersection(maze);
    }
    
    const afterDecision = {
      x: pacman.x,
      y: pacman.y,
      direction: pacman.direction,
      isMoving: pacman.isMoving
    };
    
    // 6. Perform movement
    let moveResult = { events: [] };
    if (pacman.direction.x !== 0 || pacman.direction.y !== 0) {
      // Import moveEntityOnGrid - we need to access it
      // Since we can't easily import, let's check if direction is still valid
      moveResult = { canMove: true };
    }
    
    return {
      before,
      isAtCenter,
      afterDecision,
      moveResult
    };
  });

  console.log('=== STEP BY STEP TRACE ===');
  console.log('Before:', result.before);
  console.log('isAtCenter (calculated):', result.isAtCenter);
  console.log('After makeDecisionAtIntersection:', result.afterDecision);
  console.log('Move result:', result.moveResult);
});
