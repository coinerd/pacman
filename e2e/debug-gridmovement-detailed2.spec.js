// @ts-check
import { test, expect } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const gameURL = `${baseURL}/?e2e`;

test('Inject detailed logging into GridMovement', async ({ page }) => {
  await page.goto(gameURL);
  await page.waitForTimeout(1000);

  // Inject a custom moveEntityOnGrid with logging
  await page.evaluate(() => {
    const game = window.game;
    const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
    
    // Store reference to GridMovement functions we'll need
    const gameConfig = {
      tileSize: 20,
      tunnelRow: 12
    };
    
    const TILE_SIZE = 20;
    const EPS = 2;
    const MAX_TILES_PER_FRAME = 3;
    
    function tileCenter(gridX, gridY) {
      return {
        x: gridX * TILE_SIZE + TILE_SIZE / 2,
        y: gridY * TILE_SIZE + TILE_SIZE / 2
      };
    }
    
    function isInBounds(tileX, tileY, maze) {
      return tileY >= 0 && tileY < maze.length && tileX >= 0 && tileX < maze[0].length;
    }
    
    function canMove(maze, tileX, tileY, direction) {
      if (!direction || (direction.x === 0 && direction.y === 0)) {
        return false;
      }
      const nextGridX = tileX + direction.x;
      const nextGridY = tileY + direction.y;
      if (!isInBounds(nextGridX, nextGridY, maze)) {
        return false;
      }
      return maze[nextGridY][nextGridX] === 0;
    }
    
    // Create a traced version of moveEntityOnGrid
    window.tracedMoveEntityOnGrid = function(entity, maze, deltaSeconds) {
      const events = [];
      
      if (!entity) {
        return { entity, events };
      }
      
      const applyBufferedTurn = (canMoveFn) => {
        if (entity.directionBuffer?.applyIfCanMove) {
          return entity.directionBuffer.applyIfCanMove(canMoveFn);
        }
        const nextDirection = entity.nextDirection ?? {x:0,y:0,angle:0};
        if (nextDirection.x !== 0 || nextDirection.y !== 0) {
          if (canMoveFn(nextDirection)) {
            entity.direction = nextDirection;
            entity.nextDirection = {x:0,y:0,angle:0};
            return true;
          }
        }
        return false;
      };
      
      const rawMoveDist = entity.speed * deltaSeconds;
      const cappedMoveDist = Math.min(rawMoveDist, TILE_SIZE * 2 - 1);
      let remainingDist = Math.max(0, cappedMoveDist - (cappedMoveDist <= EPS ? 0.01 : 0));
      
      console.log('[GRID] START', {
        pos: {x: entity.x.toFixed(2), y: entity.y.toFixed(2)},
        grid: {x: entity.gridX, y: entity.gridY},
        direction: entity.direction,
        remainingDist: remainingDist.toFixed(2),
        speed: entity.speed
      });
      
      let steps = 0;
      let movedAwayFromCenter = false;
      
      while (remainingDist > 0 && steps < MAX_TILES_PER_FRAME) {
        const center = tileCenter(entity.gridX, entity.gridY);
        const distToCenter = Math.hypot(center.x - entity.x, center.y - entity.y);
        const atCenter = distToCenter <= EPS;
        
        console.log('[GRID] LOOP', {
          step: steps,
          atCenter,
          distToCenter: distToCenter.toFixed(2),
          remainingDist: remainingDist.toFixed(2)
        });
        
        if (atCenter) {
          entity.x = center.x;
          entity.y = center.y;
          const applied = applyBufferedTurn((dir) => canMove(maze, entity.gridX, entity.gridY, dir));
          console.log('[GRID] atCenter', { applied, newDir: entity.direction });
          if (applied) {
            entity.isMoving = true;
          }
        }
        
        if (entity.direction.x === 0 && entity.direction.y === 0) {
          console.log('[GRID] DIRECTION IS NONE, BREAKING');
          entity.isMoving = false;
          break;
        }
        entity.isMoving = true;
        
        if (!atCenter) {
          console.log('[GRID] NOT AT CENTER BLOCK');
          // ... (same logic as original)
          const movingTowardCenter = entity.direction.x !== 0
            ? Math.sign(center.x - entity.x) === entity.direction.x
            : Math.sign(center.y - entity.y) === entity.direction.y;
          
          if (!movingTowardCenter) {
            console.log('[GRID] MOVING AWAY FROM CENTER');
            const blockedAhead = !canMove(maze, entity.gridX, entity.gridY, entity.direction);
            if (blockedAhead) {
              const boundary = {
                x: center.x + entity.direction.x * (TILE_SIZE / 2),
                y: center.y + entity.direction.y * (TILE_SIZE / 2)
              };
              const distToBoundary = entity.direction.x !== 0
                ? Math.abs(boundary.x - entity.x)
                : Math.abs(boundary.y - entity.y);
              const travel = Math.min(distToBoundary, remainingDist);
              entity.x += entity.direction.x * travel;
              entity.y += entity.direction.y * travel;
              remainingDist -= travel;
              if (distToBoundary <= travel + EPS) {
                entity.x = boundary.x;
                entity.y = boundary.y;
                entity.direction = {x:0,y:0,angle:0};
                entity.isMoving = false;
              }
            } else {
              entity.x += entity.direction.x * remainingDist;
              entity.y += entity.direction.y * remainingDist;
              remainingDist = 0;
            }
            break;
          }
          
          const distAxis = entity.direction.x !== 0
            ? Math.abs(center.x - entity.x)
            : Math.abs(center.y - entity.y);
          const travel = Math.min(distAxis, remainingDist);
          entity.x += entity.direction.x * travel;
          entity.y += entity.direction.y * travel;
          remainingDist -= travel;
          
          if (distAxis <= travel + EPS) {
            entity.x = center.x;
            entity.y = center.y;
          } else {
            break;
          }
          
          steps += 1;
          continue;
        }
        
        // atCenter is true
        const canMoveResult = canMove(maze, entity.gridX, entity.gridY, entity.direction);
        console.log('[GRID] canMove check', { canMove: canMoveResult, direction: entity.direction });
        
        if (!canMoveResult) {
          console.log('[GRID] CANNOT MOVE, STOPPING');
          entity.direction = {x:0,y:0,angle:0};
          entity.isMoving = false;
          events.push({ type: 'hit_wall', tileX: entity.gridX, tileY: entity.gridY });
          break;
        }
        
        console.log('[GRID] remainingDist vs tileSize', { remainingDist, tileSize: TILE_SIZE });
        
        if (remainingDist < TILE_SIZE) {
          console.log('[GRID] MOVING', { 
            from: {x: entity.x.toFixed(2), y: entity.y.toFixed(2)},
            delta: {x: entity.direction.x * remainingDist, y: entity.direction.y * remainingDist}
          });
          entity.x += entity.direction.x * remainingDist;
          entity.y += entity.direction.y * remainingDist;
          remainingDist = 0;
          movedAwayFromCenter = true;
          console.log('[GRID] MOVED TO', { x: entity.x.toFixed(2), y: entity.y.toFixed(2) });
          break;
        }
        
        // Move full tile
        const nextGridX = entity.gridX + entity.direction.x;
        const nextGridY = entity.gridY + entity.direction.y;
        entity.gridX = nextGridX;
        entity.gridY = nextGridY;
        const nextCenter = tileCenter(nextGridX, nextGridY);
        entity.x = nextCenter.x;
        entity.y = nextCenter.y;
        remainingDist -= TILE_SIZE;
        events.push({ type: 'tile_enter', tileX: nextGridX, tileY: nextGridY });
        steps += 1;
      }
      
      console.log('[GRID] END', { 
        pos: {x: entity.x.toFixed(2), y: entity.y.toFixed(2)},
        remainingDist: remainingDist.toFixed(2)
      });
      
      return { entity, events };
    };
  });

  // Start game
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);

  // Test the traced function
  const result = await page.evaluate(() => {
    const game = window.game;
    const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
    const pacman = gameScene.gameModel.pacman;
    const maze = gameScene.gameModel.maze;
    
    // Set state like after first movement
    pacman.x = 271.99;
    pacman.y = 450;
    pacman.gridX = 13;
    pacman.gridY = 22;
    pacman.direction = { x: 1, y: 0, angle: 0 };
    pacman.isMoving = true;
    
    console.log('=== CALLING TRACED MOVE ===');
    const result = window.tracedMoveEntityOnGrid(pacman, maze, 1/60);
    
    return {
      finalPos: { x: pacman.x, y: pacman.y },
      events: result.events
    };
  });

  console.log('Result:', result);
});
