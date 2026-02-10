// @ts-check
import { test, expect } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const gameURL = `${baseURL}/?e2e`;

test('Debug GridMovement in browser with manual stepping', async ({ page }) => {
  await page.goto(gameURL);
  await page.waitForTimeout(1000);

  // Start game
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);

  const result = await page.evaluate(() => {
    // Access the GridMovement module
    // We need to import it in the browser context
    const logs = [];
    
    // Define the tileCenter function
    const TILE_SIZE = 20;
    const EPS = 2;
    
    function tileCenter(gridX, gridY) {
      return {
        x: gridX * TILE_SIZE + TILE_SIZE / 2,
        y: gridY * TILE_SIZE + TILE_SIZE / 2
      };
    }
    
    function canMove(maze, tileX, tileY, direction) {
      if (!direction || (direction.x === 0 && direction.y === 0)) return false;
      const nextX = tileX + direction.x;
      const nextY = tileY + direction.y;
      if (nextY < 0 || nextY >= maze.length || nextX < 0 || nextX >= maze[0].length) {
        return false;
      }
      return maze[nextY][nextX] === 0;
    }
    
    const game = window.game;
    const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
    const pacman = gameScene.gameModel.pacman;
    const maze = gameScene.gameModel.maze;
    
    // Set initial state
    pacman.x = 272.0;
    pacman.y = 450;
    pacman.gridX = 13;
    pacman.gridY = 22;
    pacman.direction = { x: 1, y: 0, angle: 0 };
    pacman.isMoving = true;
    
    const trace = [];
    
    for (let i = 0; i < 3; i++) {
      const center = tileCenter(pacman.gridX, pacman.gridY);
      const distToCenter = Math.hypot(center.x - pacman.x, center.y - pacman.y);
      const atCenter = distToCenter <= EPS;
      
      const canMoveRight = canMove(maze, pacman.gridX, pacman.gridY, pacman.direction);
      
      const before = {
        x: pacman.x,
        y: pacman.y,
        direction: { ...pacman.direction }
      };
      
      // Call update
      pacman.update(1/60, maze, null);
      
      trace.push({
        step: i,
        before,
        after: {
          x: pacman.x,
          y: pacman.y,
          direction: pacman.direction
        },
        delta: {
          x: pacman.x - before.x,
          y: pacman.y - before.y
        },
        diagnostics: {
          center,
          distToCenter,
          atCenter,
          canMoveRight
        }
      });
    }
    
    return trace;
  });

  console.log('=== MANUAL TRACE ===');
  for (const t of result) {
    console.log(`\nStep ${t.step}:`);
    console.log('  Diagnostics:', t.diagnostics);
    console.log('  Before:', t.before);
    console.log('  After:', t.after);
    console.log('  Delta:', t.delta);
  }
  
  const totalMove = result.reduce((sum, t) => sum + Math.abs(t.delta.x), 0);
  console.log(`\nTotal movement: ${totalMove.toFixed(2)} pixels`);
  
  expect(totalMove).toBeGreaterThan(0);
});

test('Simulate GridMovement logic step by step', async ({ page }) => {
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
    
    // Simulate GridMovement logic
    const TILE_SIZE = 20;
    const EPS = 2;
    const MAX_TILES_PER_FRAME = 3;
    
    function tileCenter(gridX, gridY) {
      return {
        x: gridX * TILE_SIZE + TILE_SIZE / 2,
        y: gridY * TILE_SIZE + TILE_SIZE / 2
      };
    }
    
    function canMove(maze, tileX, tileY, direction) {
      if (!direction || (direction.x === 0 && direction.y === 0)) return false;
      const nextX = tileX + direction.x;
      const nextY = tileY + direction.y;
      if (nextY < 0 || nextY >= maze.length || nextX < 0 || nextX >= maze[0].length) {
        return false;
      }
      return maze[nextY][nextX] === 0;
    }
    
    // Create a mock entity
    const entity = {
      x: 272.0,
      y: 450,
      gridX: 13,
      gridY: 22,
      direction: { x: 1, y: 0, angle: 0 },
      isMoving: true,
      speed: 120
    };
    
    const trace = [];
    
    // Simulate one call to moveEntityOnGrid
    const deltaSeconds = 1/60;
    const rawMoveDist = entity.speed * deltaSeconds;
    const cappedMoveDist = Math.min(rawMoveDist, TILE_SIZE * 2 - 1);
    let remainingDist = Math.max(0, cappedMoveDist - (cappedMoveDist <= EPS ? 0.01 : 0));
    
    let steps = 0;
    
    while (remainingDist > 0 && steps < MAX_TILES_PER_FRAME) {
      const center = tileCenter(entity.gridX, entity.gridY);
      const distToCenter = Math.hypot(center.x - entity.x, center.y - entity.y);
      const atCenter = distToCenter <= EPS;
      
      const before = { x: entity.x, y: entity.y };
      
      trace.push({
        step: steps,
        before,
        diagnostics: {
          center,
          distToCenter,
          atCenter,
          remainingDist: remainingDist.toFixed(2)
        }
      });
      
      if (atCenter) {
        entity.x = center.x;
        entity.y = center.y;
        // No buffered turn applied in this test
        const canMoveResult = canMove(maze, entity.gridX, entity.gridY, entity.direction);
        if (!canMoveResult) {
          trace[trace.length - 1].result = 'cannot_move';
          break;
        }
        trace[trace.length - 1].result = 'at_center_can_move';
      }
      
      if (entity.direction.x === 0 && entity.direction.y === 0) {
        trace[trace.length - 1].result = 'no_direction';
        break;
      }
      
      if (!atCenter) {
        trace[trace.length - 1].result = 'not_at_center';
        // Simplified: just move
        entity.x += entity.direction.x * remainingDist;
        entity.y += entity.direction.y * remainingDist;
        remainingDist = 0;
        break;
      }
      
      // At center, can move
      if (remainingDist < TILE_SIZE) {
        entity.x += entity.direction.x * remainingDist;
        entity.y += entity.direction.y * remainingDist;
        remainingDist = 0;
        trace[trace.length - 1].result = 'moved';
        break;
      }
      
      // Move full tile
      entity.gridX += entity.direction.x;
      entity.gridY += entity.direction.y;
      const nextCenter = tileCenter(entity.gridX, entity.gridY);
      entity.x = nextCenter.x;
      entity.y = nextCenter.y;
      remainingDist -= TILE_SIZE;
      
      steps += 1;
    }
    
    return {
      trace,
      finalPos: { x: entity.x, y: entity.y }
    };
  });

  console.log('=== SIMULATION ===');
  for (const t of result.trace) {
    console.log(`Step ${t.step}:`, t);
  }
  console.log('Final position:', result.finalPos);
});
