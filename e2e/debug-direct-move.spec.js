// @ts-check
import { test, expect } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const gameURL = `${baseURL}/?e2e`;

test('Call moveEntityOnGrid directly on Pacman', async ({ page }) => {
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
    
    // Set initial state
    pacman.x = 270; // At center
    pacman.y = 450;
    pacman.gridX = 13;
    pacman.gridY = 22;
    pacman.direction = { x: 1, y: 0, angle: 0 };
    pacman.isMoving = true;
    
    // Import moveEntityOnGrid
    // We can't easily import it, so let's check what happens with update
    const before = {
      x: pacman.x,
      y: pacman.y,
      direction: pacman.direction,
      buffered: pacman.directionBuffer.getBuffered()
    };
    
    // Call update with null input (no key pressed)
    const events = pacman.update(1/60, maze, null);
    
    const after = {
      x: pacman.x,
      y: pacman.y,
      direction: pacman.direction,
      buffered: pacman.directionBuffer.getBuffered()
    };
    
    return { before, after, delta: { x: after.x - before.x, y: after.y - before.y }, events };
  });

  console.log('=== DIRECT CALL ===');
  console.log('Before:', result.before);
  console.log('After:', result.after);
  console.log('Delta:', result.delta);
  console.log('Events:', result.events);
  
  // Should have moved
  expect(Math.abs(result.delta.x)).toBeGreaterThan(0);
});

test('Bypass makeDecisionAtIntersection', async ({ page }) => {
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
    
    // Override makeDecisionAtIntersection to do nothing
    pacman.makeDecisionAtIntersection = function() {
      console.log('makeDecisionAtIntersection bypassed');
    };
    
    // Set state
    pacman.x = 270;
    pacman.y = 450;
    pacman.direction = { x: 1, y: 0, angle: 0 };
    pacman.isMoving = true;
    
    const before = { x: pacman.x, y: pacman.y };
    
    // Call update
    pacman.update(1/60, maze, null);
    
    const after = { x: pacman.x, y: pacman.y };
    
    return { before, after, delta: { x: after.x - before.x } };
  });

  console.log('=== BYPASSED ===');
  console.log('Delta:', result.delta);
  
  expect(Math.abs(result.delta.x)).toBeGreaterThan(0);
});

test('Check if makeDecisionAtIntersection breaks something', async ({ page }) => {
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
    
    // Set state at center
    pacman.x = 270;
    pacman.y = 450;
    pacman.gridX = 13;
    pacman.gridY = 22;
    pacman.direction = { x: 1, y: 0, angle: 0 };
    pacman.isMoving = true;
    
    const beforeCall = {
      x: pacman.x,
      y: pacman.y,
      direction: pacman.direction,
      buffered: pacman.directionBuffer.getBuffered(),
      current: pacman.directionBuffer.getCurrent()
    };
    
    // Call makeDecisionAtIntersection directly
    pacman.makeDecisionAtIntersection(maze);
    
    const afterCall = {
      x: pacman.x,
      y: pacman.y,
      direction: pacman.direction,
      buffered: pacman.directionBuffer.getBuffered(),
      current: pacman.directionBuffer.getCurrent(),
      isMoving: pacman.isMoving
    };
    
    return { beforeCall, afterCall };
  });

  console.log('=== makeDecisionAtIntersection EFFECT ===');
  console.log('Before:', result.beforeCall);
  console.log('After:', result.afterCall);
  
  // Direction should still be RIGHT and isMoving should be true
  expect(result.afterCall.direction.x).toBe(1);
  expect(result.afterCall.isMoving).toBe(true);
});
