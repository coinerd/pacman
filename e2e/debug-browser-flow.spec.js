// @ts-check
import { test, expect } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const gameURL = `${baseURL}/?e2e`;

test('Trace input through entire system', async ({ page }) => {
  // Capture console logs
  const logs = [];
  page.on('console', msg => {
    logs.push(msg.text());
  });

  await page.goto(gameURL);
  await page.waitForTimeout(1000);

  // Inject logging
  await page.evaluate(() => {
    // Log key game loop steps
    const game = window.game;
    const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
    
    // Override key methods to add logging
    const originalStep = gameScene.gameModel.step.bind(gameScene.gameModel);
    gameScene.gameModel.step = function(deltaSeconds, input) {
      console.log('[MODEL] step called, delta:', deltaSeconds.toFixed(4), 
                  'input:', input, 
                  'desired:', this.desiredDirection,
                  'inputDir:', this.inputDirection);
      const result = originalStep(deltaSeconds, input);
      console.log('[MODEL] step done, pacman pos:', this.pacman.x.toFixed(2), this.pacman.y.toFixed(2),
                  'dir:', this.pacman.direction);
      return result;
    };
    
    const originalPacmanUpdate = gameScene.gameModel.pacman.update.bind(gameScene.gameModel.pacman);
    gameScene.gameModel.pacman.update = function(deltaSeconds, maze, inputDirection) {
      console.log('[PACMAN] update called, inputDir:', inputDirection, 
                  'current dir:', this.direction,
                  'pos:', this.x.toFixed(2), this.y.toFixed(2));
      const result = originalPacmanUpdate(deltaSeconds, maze, inputDirection);
      console.log('[PACMAN] update done, new pos:', this.x.toFixed(2), this.y.toFixed(2),
                  'new dir:', this.direction);
      return result;
    };
  });

  // Start game
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);

  // Press right
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(500);

  console.log('=== BROWSER CONSOLE LOGS ===');
  for (const log of logs) {
    if (log.includes('[MODEL]') || log.includes('[PACMAN]')) {
      console.log(log);
    }
  }
});

test('Check InputManager and GameController', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const game = window.game;
    const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
    
    // Simulate pressing right
    const keyboardAdapter = gameScene.inputManager.adapters.keyboard;
    keyboardAdapter.nativeKeys.ArrowRight = true;
    
    // Get input from adapter
    const input = keyboardAdapter.getCurrentInput();
    
    // Check input manager
    let inputManagerOutput = null;
    gameScene.inputManager.onInput((inp) => {
      inputManagerOutput = inp;
    });
    
    // Update input manager
    gameScene.inputManager.update(16.67);
    
    return {
      nativeKeys: keyboardAdapter.nativeKeys.ArrowRight,
      adapterInput: input,
      inputManagerOutput: inputManagerOutput,
      gameModelInput: gameScene.gameModel.inputDirection,
      gameModelDesired: gameScene.gameModel.desiredDirection
    };
  });

  console.log('=== INPUT FLOW ===', result);
  
  expect(result.nativeKeys).toBe(true);
  expect(result.adapterInput).not.toBeNull();
});

test('Force continuous input and trace', async ({ page }) => {
  await page.goto(gameURL);
  await page.waitForTimeout(1000);

  // Start game
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);

  // Force set desired direction in model
  await page.evaluate(() => {
    const game = window.game;
    const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
    
    // Override to always set desired direction
    const originalStep = gameScene.gameModel.step.bind(gameScene.gameModel);
    gameScene.gameModel.step = function(deltaSeconds) {
      // Always force RIGHT direction
      this.desiredDirection = { x: 1, y: 0, angle: 0 };
      return originalStep(deltaSeconds);
    };
  });

  // Trace positions
  const traces = [];
  for (let i = 0; i < 20; i++) {
    const state = await page.evaluate(() => {
      const game = window.game;
      const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
      const pacman = gameScene.gameModel.pacman;
      
      return {
        x: pacman.x,
        y: pacman.y,
        direction: pacman.direction,
        isMoving: pacman.isMoving
      };
    });
    
    traces.push({ frame: i, ...state });
    await page.waitForTimeout(50);
  }

  console.log('=== CONTINUOUS MOVEMENT TRACE ===');
  for (const t of traces) {
    console.log(`Frame ${t.frame}: pos(${t.x.toFixed(2)}, ${t.y.toFixed(2)}) dir=(${t.direction.x},${t.direction.y}) isMoving=${t.isMoving}`);
  }

  // Calculate movement
  const totalMove = Math.abs(traces[traces.length - 1].x - traces[0].x);
  console.log(`Total movement: ${totalMove.toFixed(2)} pixels`);
  
  expect(totalMove).toBeGreaterThan(10);
});
