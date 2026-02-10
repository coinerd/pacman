// @ts-check
import { test, expect } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const gameURL = `${baseURL}/?e2e`;

test('Debug GameModel step internals', async ({ page }) => {
  await page.goto(gameURL);
  await page.waitForTimeout(1000);

  // Start game
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);

  // Check model state before stepping
  const beforeState = await page.evaluate(() => {
    const game = window.game;
    const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
    const model = gameScene.gameModel;
    
    return {
      isPaused: model.isPaused,
      isGameOver: model.isGameOver,
      isDying: model.isDying,
      inputDirection: model.inputDirection,
      desiredDirection: model.desiredDirection,
      pacman: {
        x: model.pacman.x,
        y: model.pacman.y,
        direction: model.pacman.direction,
        isMoving: model.pacman.isMoving,
        speed: model.pacman.speed
      }
    };
  });

  console.log('=== BEFORE STEP ===', beforeState);

  // Set a desired direction manually
  await page.evaluate(() => {
    const game = window.game;
    const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
    const model = gameScene.gameModel;
    
    // Set direction manually
    model.desiredDirection = { x: 1, y: 0, angle: 0 };
  });

  // Step the model
  const stepResult = await page.evaluate(() => {
    const game = window.game;
    const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
    const model = gameScene.gameModel;
    
    const beforeX = model.pacman.x;
    const beforeY = model.pacman.y;
    const beforeDir = { ...model.pacman.direction };
    
    // Step with 1/60 second
    const events = model.step(1/60);
    
    return {
      beforeX,
      beforeY,
      beforeDir,
      afterX: model.pacman.x,
      afterY: model.pacman.y,
      afterDir: model.pacman.direction,
      deltaX: model.pacman.x - beforeX,
      deltaY: model.pacman.y - beforeY,
      events,
      desiredAfter: model.desiredDirection,
      inputAfter: model.inputDirection
    };
  });

  console.log('=== STEP RESULT ===', stepResult);

  // Check if movement occurred
  expect(Math.abs(stepResult.deltaX) + Math.abs(stepResult.deltaY)).toBeGreaterThan(0);
});

test('Debug Pacman update with forced direction', async ({ page }) => {
  await page.goto(gameURL);
  await page.waitForTimeout(1000);

  // Start game
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);

  // Directly test Pacman.update
  const result = await page.evaluate(() => {
    const game = window.game;
    const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
    const model = gameScene.gameModel;
    const pacman = model.pacman;
    const maze = model.maze;
    
    const before = {
      x: pacman.x,
      y: pacman.y,
      gridX: pacman.gridX,
      gridY: pacman.gridY,
      direction: { ...pacman.direction }
    };
    
    // Force a direction
    const forcedDirection = { x: 1, y: 0, angle: 0 };
    
    // Call update directly
    const events = pacman.update(1/60, maze, forcedDirection);
    
    const after = {
      x: pacman.x,
      y: pacman.y,
      gridX: pacman.gridX,
      gridY: pacman.gridY,
      direction: pacman.direction,
      isMoving: pacman.isMoving
    };
    
    return { before, after, events, forcedDirection };
  });

  console.log('=== FORCED DIRECTION TEST ===');
  console.log('Forced direction:', result.forcedDirection);
  console.log('Before:', result.before);
  console.log('After:', result.after);
  console.log('Events:', result.events);
  
  const moved = Math.abs(result.after.x - result.before.x) > 0.01 || 
                Math.abs(result.after.y - result.before.y) > 0.01;
  
  console.log('Moved:', moved);
  expect(moved).toBe(true);
});

test('Debug direction buffer behavior', async ({ page }) => {
  await page.goto(gameURL);
  await page.waitForTimeout(1000);

  // Start game
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);

  // Test direction buffer
  const result = await page.evaluate(() => {
    const game = window.game;
    const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
    const pacman = gameScene.gameModel.pacman;
    
    const trace = [];
    
    // Initial state
    trace.push({
      step: 'initial',
      direction: { ...pacman.direction },
      buffered: pacman.directionBuffer.getBuffered(),
      current: pacman.directionBuffer.getCurrent()
    });
    
    // Call setDirection
    pacman.setDirection({ x: 1, y: 0, angle: 0 });
    trace.push({
      step: 'after_setDirection',
      direction: { ...pacman.direction },
      buffered: pacman.directionBuffer.getBuffered(),
      current: pacman.directionBuffer.getCurrent()
    });
    
    // Call applyIfCanMove
    const maze = gameScene.gameModel.maze;
    const applied = pacman.directionBuffer.applyIfCanMove((dir) => {
      const nextX = pacman.gridX + dir.x;
      const nextY = pacman.gridY + dir.y;
      return maze[nextY][nextX] === 0;
    });
    
    trace.push({
      step: 'after_applyIfCanMove',
      applied,
      direction: { ...pacman.direction },
      buffered: pacman.directionBuffer.getBuffered(),
      current: pacman.directionBuffer.getCurrent()
    });
    
    return trace;
  });

  console.log('=== DIRECTION BUFFER TRACE ===');
  for (const t of result) {
    console.log(t);
  }
});
