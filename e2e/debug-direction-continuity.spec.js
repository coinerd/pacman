// @ts-check
import { test, expect } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const gameURL = `${baseURL}/?e2e`;

test('Debug direction continuity - does Pacman keep moving?', async ({ page }) => {
  await page.goto(gameURL);
  await page.waitForTimeout(1000);

  // Start game
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);

  // Inject logging
  await page.evaluate(() => {
    const game = window.game;
    const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
    const model = gameScene.gameModel;
    const pacman = model.pacman;
    
    // Log each step
    const originalStep = model.step.bind(model);
    model.step = function(deltaSeconds) {
      console.log('[STEP START] desired:', this.desiredDirection,
                  'pacman.dir:', pacman.direction,
                  'pacman.pos:', pacman.x.toFixed(2), pacman.y.toFixed(2));
      const result = originalStep(deltaSeconds);
      console.log('[STEP END] desired:', this.desiredDirection,
                  'pacman.dir:', pacman.direction,
                  'pacman.pos:', pacman.x.toFixed(2), pacman.y.toFixed(2));
      return result;
    };
  });

  // Press right once
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(100);

  // Collect logs
  const logs = await page.evaluate(() => {
    // Return console logs (this won't work directly, but let's trace manually)
    return 'Check browser console';
  });

  // Trace manually
  const traces = [];
  for (let i = 0; i < 10; i++) {
    const state = await page.evaluate(() => {
      const game = window.game;
      const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
      const model = gameScene.gameModel;
      const pacman = model.pacman;
      
      return {
        desired: model.desiredDirection,
        input: model.inputDirection,
        pacmanDir: pacman.direction,
        pacmanPos: { x: pacman.x, y: pacman.y },
        pacmanMoving: pacman.isMoving,
        buffered: pacman.directionBuffer.getBuffered(),
        current: pacman.directionBuffer.getCurrent()
      };
    });
    
    traces.push({ frame: i, ...state });
    await page.waitForTimeout(100);
  }

  console.log('=== DIRECTION CONTINUITY TRACE ===');
  console.log('Frame | Desired | PacmanDir | Buffered | Current | Pos(x,y) | Moving');
  for (const t of traces) {
    const des = t.desired ? `${t.desired.x},${t.desired.y}` : 'null';
    const dir = t.pacmanDir ? `${t.pacmanDir.x},${t.pacmanDir.y}` : 'none';
    const buf = t.buffered ? `${t.buffered.x},${t.buffered.y}` : 'none';
    const cur = t.current ? `${t.current.x},${t.current.y}` : 'none';
    console.log(
      `${t.frame.toString().padStart(5)} | ` +
      `${des.padStart(7)} | ` +
      `${dir.padStart(9)} | ` +
      `${buf.padStart(8)} | ` +
      `${cur.padStart(7)} | ` +
      `(${t.pacmanPos.x.toFixed(2)},${t.pacmanPos.y.toFixed(2)}) | ` +
      `${t.pacmanMoving}`
    );
  }
});

test('Test continuous movement with manual direction buffer', async ({ page }) => {
  await page.goto(gameURL);
  await page.waitForTimeout(1000);

  // Start game
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);

  // Inject a fix: always re-queue current direction
  await page.evaluate(() => {
    const game = window.game;
    const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
    const model = gameScene.gameModel;
    const pacman = model.pacman;
    
    // Override makeDecisionAtIntersection to re-queue current direction
    const originalMakeDecision = pacman.makeDecisionAtIntersection.bind(pacman);
    pacman.makeDecisionAtIntersection = function(maze) {
      // Re-queue current direction if we're moving
      if (this.direction !== {x:0,y:0,angle:0} && this.isMoving) {
        this.directionBuffer.queue(this.direction);
      }
      return originalMakeDecision(maze);
    };
  });

  // Press right once
  await page.keyboard.press('ArrowRight');
  
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

  console.log('=== WITH FIX TRACE ===');
  for (const t of traces) {
    const dirStr = t.direction ? `${t.direction.x},${t.direction.y}` : 'none';
    console.log(`Frame ${t.frame}: pos(${t.x.toFixed(2)}, ${t.y.toFixed(2)}) dir=(${dirStr}) isMoving=${t.isMoving}`);
  }

  const totalMove = Math.abs(traces[traces.length - 1].x - traces[0].x);
  console.log(`Total movement: ${totalMove.toFixed(2)} pixels`);
});

test('Debug makeDecisionAtIntersection behavior', async ({ page }) => {
  await page.goto(gameURL);
  await page.waitForTimeout(1000);

  // Start game
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);

  // Test the intersection decision logic step by step
  const result = await page.evaluate(() => {
    const game = window.game;
    const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
    const model = gameScene.gameModel;
    const pacman = model.pacman;
    const maze = model.maze;
    
    const trace = [];
    
    // Initial state
    trace.push({
      step: 'initial',
      pos: { x: pacman.x, y: pacman.y },
      direction: { ...pacman.direction },
      buffered: pacman.directionBuffer.getBuffered(),
      isMoving: pacman.isMoving
    });
    
    // Set direction to RIGHT
    pacman.setDirection({ x: 1, y: 0, angle: 0 });
    trace.push({
      step: 'after_setDirection',
      pos: { x: pacman.x, y: pacman.y },
      direction: { ...pacman.direction },
      buffered: pacman.directionBuffer.getBuffered(),
      isMoving: pacman.isMoving
    });
    
    // Call update once
    pacman.update(1/60, maze, null);
    trace.push({
      step: 'after_first_update',
      pos: { x: pacman.x, y: pacman.y },
      direction: { ...pacman.direction },
      buffered: pacman.directionBuffer.getBuffered(),
      isMoving: pacman.isMoving
    });
    
    // Call update again (no input)
    pacman.update(1/60, maze, null);
    trace.push({
      step: 'after_second_update_no_input',
      pos: { x: pacman.x, y: pacman.y },
      direction: { ...pacman.direction },
      buffered: pacman.directionBuffer.getBuffered(),
      isMoving: pacman.isMoving
    });
    
    // Call update again (no input)
    pacman.update(1/60, maze, null);
    trace.push({
      step: 'after_third_update_no_input',
      pos: { x: pacman.x, y: pacman.y },
      direction: { ...pacman.direction },
      buffered: pacman.directionBuffer.getBuffered(),
      isMoving: pacman.isMoving
    });
    
    return trace;
  });

  console.log('=== MAKE DECISION TRACE ===');
  for (const t of result) {
    const dirStr = t.direction ? `${t.direction.x},${t.direction.y}` : 'none';
    const bufStr = t.buffered ? `${t.buffered.x},${t.buffered.y}` : 'none';
    console.log(`${t.step}:`);
    console.log(`  pos: (${t.pos.x.toFixed(2)}, ${t.pos.y.toFixed(2)})`);
    console.log(`  direction: (${dirStr})`);
    console.log(`  buffered: (${bufStr})`);
    console.log(`  isMoving: ${t.isMoving}`);
  }
});
