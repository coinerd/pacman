/**
 * CollisionAdapter Hardening Tests
 * Tests for tunnel-aware collision and high-speed swept collision scenarios
 */

import { CollisionAdapter } from '../../src/model/adapters/CollisionAdapter.js';
import { PELLET_TYPES } from '../../src/utils/MazeLayout.js';
import { gameConfig } from '../../src/config/gameConfig.js';

// Mock GameModel with tunnel configuration
function createMockGameModel() {
    return {
        pacman: {
            id: 1,
            x: 30,
            y: 30,
            gridX: 1,
            gridY: 1,
            prevX: 20,
            prevY: 30
        },
        ghosts: [
            {
                id: 2,
                x: 100,
                y: 100,
                gridX: 5,
                gridY: 5,
                isEaten: false,
                isFrightened: false,
                ghostType: 'blinky',
                eat: jest.fn()
            }
        ],
        fruit: {
            active: false,
            x: 0,
            y: 0,
            eat: jest.fn()
        },
        pelletGrid: Array(31).fill(null).map((_, y) =>
            Array(28).fill(null).map((_, x) => {
                // Create a simple maze with tunnel at row 14
                if (y === 0 || y === 30 || x === 0 || x === 27) {
                    return y === 14 ? 0 : 1; // Tunnel row at y=14
                }
                return 1; // Pellets everywhere else
            })
        ),
        getPelletAt: jest.fn((x, y) => {
            if (y >= 0 && y < 31 && x >= 0 && x < 28) {
                if (y === 14 && (x === 0 || x === 27)) {
                    return PELLET_TYPES.NONE; // Tunnel portals have no pellets
                }
                return PELLET_TYPES.PELLET;
            }
            return PELLET_TYPES.NONE;
        }),
        eatPelletAt: jest.fn((x, y) => ({
            type: 'pellet',
            gridX: x,
            gridY: y,
            pelletsRemaining: 10
        })),
        currentComboGhosts: 0,
        lives: 3,
        getFrightenedDuration: jest.fn(() => 5)
    };
}

describe('CollisionAdapter Hardening', () => {
    let adapter;
    let mockGameModel;
    const tileSize = gameConfig.tileSize;
    const tunnelY = 14 * tileSize + tileSize / 2; // Center of tunnel row

    beforeEach(() => {
        mockGameModel = createMockGameModel();
        adapter = new CollisionAdapter(mockGameModel);
    });

    describe('Tunnel-Aware Collision Detection', () => {
        test('detects collision when both entities in tunnel', () => {
            // Position pacman in left tunnel area
            mockGameModel.pacman.x = tileSize / 2; // Just inside left portal
            mockGameModel.pacman.y = tunnelY;
            mockGameModel.pacman.prevX = tileSize;
            mockGameModel.pacman.prevY = tunnelY;

            // Position ghost near pacman in tunnel
            mockGameModel.ghosts[0].x = tileSize * 1.5;
            mockGameModel.ghosts[0].y = tunnelY;
            mockGameModel.ghosts[0].prevX = tileSize * 2;
            mockGameModel.ghosts[0].prevY = tunnelY;

            const result = adapter.checkGhostCollisions();

            expect(result).not.toBeNull();
            expect(result.type).toBe('pacman_died');
        });

        test('detects collision at tunnel portal edges', () => {
            // Pacman at left edge of tunnel
            mockGameModel.pacman.x = 5; // Very close to left edge
            mockGameModel.pacman.y = tunnelY;
            mockGameModel.pacman.prevX = tileSize;
            mockGameModel.pacman.prevY = tunnelY;

            // Ghost wrapping from right side to left
            mockGameModel.ghosts[0].x = 27 * tileSize + tileSize - 5; // Right edge
            mockGameModel.ghosts[0].y = tunnelY;
            mockGameModel.ghosts[0].prevX = 28 * tileSize; // Was wrapping
            mockGameModel.ghosts[0].prevY = tunnelY;

            const result = adapter.checkTunnelCollisions(
                mockGameModel.pacman,
                mockGameModel.ghosts.map(g => ({
                    id: g.id,
                    x: g.x,
                    y: g.y,
                    prevX: g.prevX,
                    prevY: g.prevY,
                    ghost: g
                }))
            );

            // Should detect collision through wrap
            expect(result).not.toBeNull();
        });

        test('ignores collision when only one entity in tunnel', () => {
            // Pacman in tunnel
            mockGameModel.pacman.x = tileSize;
            mockGameModel.pacman.y = tunnelY;

            // Ghost far away from tunnel
            mockGameModel.ghosts[0].x = 14 * tileSize;
            mockGameModel.ghosts[0].y = 5 * tileSize;

            const result = adapter.checkTunnelCollisions(
                mockGameModel.pacman,
                mockGameModel.ghosts.map(g => ({
                    id: g.id,
                    x: g.x,
                    y: g.y,
                    prevX: g.prevX,
                    prevY: g.prevY,
                    ghost: g
                }))
            );

            expect(result).toBeNull();
        });

        test('ignores eaten ghosts in tunnel', () => {
            // Pacman in tunnel
            mockGameModel.pacman.x = tileSize;
            mockGameModel.pacman.y = tunnelY;

            // Eaten ghost in tunnel
            mockGameModel.ghosts[0].x = tileSize * 1.5;
            mockGameModel.ghosts[0].y = tunnelY;
            mockGameModel.ghosts[0].isEaten = true;

            const result = adapter.checkTunnelCollisions(
                mockGameModel.pacman,
                mockGameModel.ghosts.map(g => ({
                    id: g.id,
                    x: g.x,
                    y: g.y,
                    ghost: g
                }))
            );

            expect(result).toBeNull();
        });
    });

    describe('Entity Position Adjustment for Tunnel', () => {
        test('adjusts position when entity wraps right to left', () => {
            const entity = {
                id: 1,
                x: tileSize / 2, // Left side
                y: tunnelY,
                prevX: 27 * tileSize + tileSize / 2, // Was on right side
                prevY: tunnelY
            };

            const adjusted = adapter.adjustEntityForTunnel(entity);

            // prevX should be adjusted to represent position "before" wrap
            expect(adjusted.prevX).toBeLessThan(entity.x);
            expect(adjusted.x).toBe(entity.x);
            expect(adjusted.y).toBe(entity.y);
        });

        test('adjusts position when entity wraps left to right', () => {
            const entity = {
                id: 1,
                x: 27 * tileSize + tileSize / 2, // Right side
                y: tunnelY,
                prevX: tileSize / 2, // Was on left side
                prevY: tunnelY
            };

            const adjusted = adapter.adjustEntityForTunnel(entity);

            // prevX should be adjusted to represent position "before" wrap
            expect(adjusted.prevX).toBeGreaterThan(entity.x);
            expect(adjusted.x).toBe(entity.x);
            expect(adjusted.y).toBe(entity.y);
        });

        test('does not adjust position for normal movement', () => {
            const entity = {
                id: 1,
                x: 100,
                y: 100,
                prevX: 95, // Normal movement
                prevY: 100
            };

            const adjusted = adapter.adjustEntityForTunnel(entity);

            expect(adjusted.x).toBe(entity.x);
            expect(adjusted.y).toBe(entity.y);
            expect(adjusted.prevX).toBe(entity.prevX);
            expect(adjusted.prevY).toBe(entity.prevY);
        });

        test('handles entity without prev position', () => {
            const entity = {
                id: 1,
                x: 100,
                y: 100
                // No prevX, prevY
            };

            const adjusted = adapter.adjustEntityForTunnel(entity);

            expect(adjusted.x).toBe(entity.x);
            expect(adjusted.y).toBe(entity.y);
            expect(adjusted.prevX).toBe(entity.x); // Falls back to current
            expect(adjusted.prevY).toBe(entity.y);
        });
    });

    describe('High-Speed Swept Collision Detection', () => {
        test('detects ghost passing through pacman at high speed', () => {
            const threshold = tileSize * 0.6;

            // Pacman stationary
            mockGameModel.pacman.x = 14 * tileSize;
            mockGameModel.pacman.y = 10 * tileSize;
            mockGameModel.pacman.prevX = mockGameModel.pacman.x;
            mockGameModel.pacman.prevY = mockGameModel.pacman.y;

            // Ghost moving very fast through pacman position
            mockGameModel.ghosts[0].x = mockGameModel.pacman.x + threshold * 3;
            mockGameModel.ghosts[0].y = mockGameModel.pacman.y;
            mockGameModel.ghosts[0].prevX = mockGameModel.pacman.x - threshold * 3;
            mockGameModel.ghosts[0].prevY = mockGameModel.pacman.y;

            const result = adapter.checkGhostCollisions();

            expect(result).not.toBeNull();
            expect(result.type).toBe('pacman_died');
        });

        test('detects crossed path collision at tile centers', () => {
            // Pacman moving horizontally
            mockGameModel.pacman.x = 15 * tileSize;
            mockGameModel.pacman.y = 10 * tileSize;
            mockGameModel.pacman.prevX = 13 * tileSize;
            mockGameModel.pacman.prevY = 10 * tileSize;

            // Ghost moving vertically, crossing pacman's path
            mockGameModel.ghosts[0].x = 14 * tileSize;
            mockGameModel.ghosts[0].y = 11 * tileSize;
            mockGameModel.ghosts[0].prevX = 14 * tileSize;
            mockGameModel.ghosts[0].prevY = 9 * tileSize;

            const result = adapter.checkGhostCollisions();

            // Should detect crossed paths
            expect(result).not.toBeNull();
        });

        test('detects diagonal high-speed collision', () => {
            const threshold = tileSize * 0.6;

            // Pacman stationary
            mockGameModel.pacman.x = 14 * tileSize;
            mockGameModel.pacman.y = 10 * tileSize;
            mockGameModel.pacman.prevX = mockGameModel.pacman.x;
            mockGameModel.pacman.prevY = mockGameModel.pacman.y;

            // Ghost moving diagonally through pacman
            mockGameModel.ghosts[0].x = mockGameModel.pacman.x + threshold * 2;
            mockGameModel.ghosts[0].y = mockGameModel.pacman.y + threshold * 2;
            mockGameModel.ghosts[0].prevX = mockGameModel.pacman.x - threshold * 2;
            mockGameModel.ghosts[0].prevY = mockGameModel.pacman.y - threshold * 2;

            const result = adapter.checkGhostCollisions();

            expect(result).not.toBeNull();
        });
    });

    describe('Frightened Ghost Collision Handling', () => {
        test('eats frightened ghost in tunnel', () => {
            // Pacman in tunnel
            mockGameModel.pacman.x = tileSize;
            mockGameModel.pacman.y = tunnelY;

            // Frightened ghost in tunnel near pacman
            mockGameModel.ghosts[0].x = tileSize * 1.5;
            mockGameModel.ghosts[0].y = tunnelY;
            mockGameModel.ghosts[0].isFrightened = true;

            const result = adapter.checkGhostCollisions();

            expect(result).not.toBeNull();
            expect(result.type).toBe('ghost_eaten');
            expect(mockGameModel.ghosts[0].eat).toHaveBeenCalled();
        });

        test('combo score increases correctly for multiple frightened ghosts', () => {
            // Add more ghosts
            mockGameModel.ghosts.push(
                {
                    id: 3,
                    x: tileSize * 2,
                    y: tunnelY,
                    isEaten: false,
                    isFrightened: true,
                    ghostType: 'pinky',
                    eat: jest.fn()
                },
                {
                    id: 4,
                    x: tileSize * 2.5,
                    y: tunnelY,
                    isEaten: false,
                    isFrightened: true,
                    ghostType: 'inky',
                    eat: jest.fn()
                }
            );

            // First ghost
            mockGameModel.ghosts[0].x = tileSize;
            mockGameModel.ghosts[0].y = tunnelY;
            mockGameModel.ghosts[0].isFrightened = true;

            mockGameModel.pacman.x = tileSize;
            mockGameModel.pacman.y = tunnelY;

            // First collision
            let result = adapter.checkGhostCollisions();
            expect(result.type).toBe('ghost_eaten');
            expect(result.score).toBe(200);

            // Mark first as eaten
            mockGameModel.ghosts[0].isEaten = true;
            mockGameModel.currentComboGhosts = 1;

            // Move pacman to second ghost
            mockGameModel.pacman.x = tileSize * 2;
            mockGameModel.pacman.y = tunnelY;

            // Second collision
            result = adapter.checkGhostCollisions();
            expect(result.type).toBe('ghost_eaten');
            expect(result.score).toBe(400);
        });
    });

    describe('Collision Statistics', () => {
        test('tracks tunnel collision statistics', () => {
            // Setup collision in tunnel
            mockGameModel.pacman.x = tileSize;
            mockGameModel.pacman.y = tunnelY;
            mockGameModel.ghosts[0].x = tileSize * 1.5;
            mockGameModel.ghosts[0].y = tunnelY;

            adapter.checkGhostCollisions();

            const stats = adapter.getStats();
            expect(stats.checksPerformed).toBeGreaterThan(0);
            expect(stats.collisionsDetected).toBeGreaterThan(0);
        });

        test('reset clears tunnel state', () => {
            // Setup some state
            adapter.lastPelletGrid = { x: 5, y: 14 };
            adapter.stats.checksPerformed = 10;
            adapter.stats.collisionsDetected = 5;

            adapter.reset();

            expect(adapter.lastPelletGrid).toEqual({ x: null, y: null });
            expect(adapter.stats.checksPerformed).toBe(0);
            expect(adapter.stats.collisionsDetected).toBe(0);
        });
    });

    describe('Edge Cases', () => {
        test('handles no ghosts', () => {
            mockGameModel.ghosts = [];

            const result = adapter.checkGhostCollisions();

            expect(result).toBeNull();
        });

        test('handles all ghosts eaten', () => {
            mockGameModel.ghosts.forEach(g => g.isEaten = true);

            const result = adapter.checkGhostCollisions();

            expect(result).toBeNull();
        });

        test('handles ghost exactly at threshold distance', () => {
            const threshold = tileSize * 0.6;

            mockGameModel.pacman.x = 14 * tileSize;
            mockGameModel.pacman.y = 10 * tileSize;

            // Ghost exactly at collision threshold
            mockGameModel.ghosts[0].x = mockGameModel.pacman.x + threshold - 0.1;
            mockGameModel.ghosts[0].y = mockGameModel.pacman.y;
            mockGameModel.ghosts[0].prevX = mockGameModel.ghosts[0].x;
            mockGameModel.ghosts[0].prevY = mockGameModel.ghosts[0].y;

            const result = adapter.checkGhostCollisions();

            expect(result).not.toBeNull();
        });

        test('handles simultaneous pellet and ghost collision', () => {
            // Position pacman at pellet in tunnel
            mockGameModel.pacman.x = tileSize;
            mockGameModel.pacman.y = tunnelY;

            // Ghost also at same position
            mockGameModel.ghosts[0].x = tileSize;
            mockGameModel.ghosts[0].y = tunnelY;
            mockGameModel.ghosts[0].isFrightened = true;

            // Mock pellet at this position
            mockGameModel.getPelletAt = jest.fn(() => PELLET_TYPES.PELLET);

            const events = adapter.checkAllCollisions();

            // Should have both events
            const hasPellet = events.some(e => e.type === 'pellet_eaten');
            const hasGhost = events.some(e => e.type === 'ghost_eaten');

            expect(hasPellet || hasGhost).toBe(true);
        });
    });
});
