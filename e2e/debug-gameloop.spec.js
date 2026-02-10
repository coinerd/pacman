// @ts-check
import { test, expect } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const gameURL = `${baseURL}/?e2e`;

test('Debug game loop step calling', async ({ page }) => {
  await page.goto(gameURL);
  await page.waitForTimeout(1000);

  // Start game
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);

  // Trace fixedUpdate calls
  const traces = [];
  
  for (let i = 0; i < 10; i++) {
    const state = await page.evaluate(() => {
      const game = window.game;
      const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
      
      return {
        // FixedTimeStepLoop state
        accumulator: gameScene.fixedTimeStepLoop?.getAccumulator?.(),
        lastStepCount: gameScene.fixedTimeStepLoop?.getLastStepCount?.(),
        lastRealDt: gameScene.fixedTimeStepLoop?.getLastRealDt?.(),
        
        // Model state
        tickCount: gameScene.gameModel?.tickCount,
        pacmanX: gameScene.gameModel?.pacman?.x,
        
        // Step count history
        stepCountHistory: gameScene.fixedTimeStepLoop?.lastStepCount
      };
    });
    
    traces.push({ frame: i, ...state });
    await page.waitForTimeout(100);
  }

  console.log('=== GAME LOOP TRACE ===');
  console.log('Frame | Accumulator | LastStepCount | TickCount | PacmanX');
  for (const t of traces) {
    console.log(
      `${t.frame.toString().padStart(5)} | ` +
      `${t.accumulator?.toFixed(4).padStart(11)} | ` +
      `${t.lastStepCount?.toString().padStart(13)} | ` +
      `${t.tickCount?.toString().padStart(9)} | ` +
      `${t.pacmanX?.toFixed(2).padStart(7)}`
    );
  }
});

test('Manually step game model', async ({ page }) => {
  await page.goto(gameURL);
  await page.waitForTimeout(1000);

  // Start game
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);

  // Manually call gameModel.step() multiple times
  const results = [];
  
  for (let i = 0; i < 10; i++) {
    const result = await page.evaluate(() => {
      const game = window.game;
      const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
      const model = gameScene.gameModel;
      const pacman = model.pacman;
      
      const beforeX = pacman.x;
      const beforeY = pacman.y;
      
      // Manually step the model with 1/60 second
      const events = model.step(1/60);
      
      return {
        beforeX,
        beforeY,
        afterX: pacman.x,
        afterY: pacman.y,
        deltaX: pacman.x - beforeX,
        deltaY: pacman.y - beforeY,
        direction: pacman.direction,
        isMoving: pacman.isMoving,
        events: events.length
      };
    });
    
    results.push({ frame: i, ...result });
  }

  console.log('=== MANUAL STEP RESULTS ===');
  console.log('Frame | Before(x,y) | After(x,y) | Delta(x,y) | Direction | Events');
  for (const r of results) {
    const dirStr = r.direction ? `${r.direction.x},${r.direction.y}` : 'none';
    console.log(
      `${r.frame.toString().padStart(5)} | ` +
      `(${r.beforeX.toFixed(2)},${r.beforeY.toFixed(2)}) | ` +
      `(${r.afterX.toFixed(2)},${r.afterY.toFixed(2)}) | ` +
      `(${r.deltaX.toFixed(2)},${r.deltaY.toFixed(2)}) | ` +
      `${dirStr.padStart(9)} | ` +
      `${r.events}`
    );
  }

  // Check that manual stepping caused movement
  const totalMove = results.reduce((sum, r) => sum + Math.abs(r.deltaX) + Math.abs(r.deltaY), 0);
  console.log(`\nTotal movement from manual steps: ${totalMove.toFixed(2)} pixels`);
  
  // At least some frames should have movement
  const framesWithMovement = results.filter(r => Math.abs(r.deltaX) > 0 || Math.abs(r.deltaY) > 0).length;
  console.log(`Frames with movement: ${framesWithMovement}/${results.length}`);
  
  expect(framesWithMovement).toBeGreaterThan(0);
});

test('Debug Pacman update method directly', async ({ page }) => {
  await page.goto(gameURL);
  await page.waitForTimeout(1000);

  // Start game and press right
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(100);

  // Check Pacman state before and after manual update
  const result = await page.evaluate(() => {
    const game = window.game;
    const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
    const model = gameScene.gameModel;
    const pacman = model.pacman;
    
    const before = {
      x: pacman.x,
      y: pacman.y,
      direction: { ...pacman.direction },
      isMoving: pacman.isMoving
    };
    
    // Get desired direction from model
    const desiredDir = model.desiredDirection;
    
    // Manually call pacman.update
    const events = pacman.update(1/60, model.maze, desiredDir);
    
    const after = {
      x: pacman.x,
      y: pacman.y,
      direction: pacman.direction,
      isMoving: pacman.isMoving
    };
    
    return { before, after, desiredDir, events };
  });

  console.log('=== PACMAN UPDATE DEBUG ===');
  console.log('Before:', result.before);
  console.log('Desired direction:', result.desiredDir);
  console.log('After:', result.after);
  console.log('Events:', result.events);
  
  const moved = Math.abs(result.after.x - result.before.x) > 0.01 || 
                Math.abs(result.after.y - result.before.y) > 0.01;
  
  console.log('Moved:', moved);
  expect(moved).toBe(true);
});
