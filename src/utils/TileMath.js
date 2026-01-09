import { gameConfig, physicsConfig } from '../config/gameConfig.js';

const origin = { x: 0, y: 0 };

export const EPS = gameConfig.tileSize * 0.15;

export function worldToTile(a, b, c) {
    if (typeof a === 'object' && a !== null && 'x' in a && 'y' in a) {
        const worldPos = a;
        const origin = b;
        const tileSize = c;
        const tileX = Math.floor((worldPos.x - origin.x) / tileSize);
        const tileY = Math.floor((worldPos.y - origin.y) / tileSize);
        return { tileX, tileY };
    }
    const x = a;
    const y = b;
    const tileX = Math.floor((x - origin.x) / gameConfig.tileSize);
    const tileY = Math.floor((y - origin.y) / gameConfig.tileSize);
    return { x: tileX, y: tileY };
}

export function tileCenter(tileX, tileY, customOrigin, tileSize) {
    if (typeof customOrigin === 'object' && customOrigin !== null && typeof tileSize === 'number') {
        const x = customOrigin.x + tileX * tileSize + tileSize / 2;
        const y = customOrigin.y + tileY * tileSize + tileSize / 2;
        return { x, y };
    }
    const worldX = tileX * gameConfig.tileSize + gameConfig.tileSize / 2;
    const worldY = tileY * gameConfig.tileSize + gameConfig.tileSize / 2;
    return { x: worldX, y: worldY };
}

export function encodeTile(tileX, tileY, mazeWidth) {
    return tileY * mazeWidth + tileX;
}

export function decodeTile(encodedIndex, mazeWidth) {
    const tileX = encodedIndex % mazeWidth;
    const tileY = Math.floor(encodedIndex / mazeWidth);
    return { tileX, tileY };
}

export function tileToWorld(tileX, tileY) {
    const pixelX = tileX * gameConfig.tileSize + origin.x;
    const pixelY = tileY * gameConfig.tileSize + origin.y;
    return { x: pixelX, y: pixelY };
}

export function isAtTileCenter(x, y, tileX, tileY) {
    const center = tileCenter(tileX, tileY);
    const dx = x - center.x;
    const dy = y - center.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= physicsConfig.EPS;
}

export function distanceToTileCenter(x, y, tileX, tileY) {
    const center = tileCenter(tileX, tileY);
    const dx = x - center.x;
    const dy = y - center.y;
    return Math.sqrt(dx * dx + dy * dy);
}

export function isExactlyAtTileCenter(x, y, tileX, tileY) {
    const center = tileCenter(tileX, tileY);
    const dx = x - center.x;
    const dy = y - center.y;
    return Math.abs(dx) <= 1 && Math.abs(dy) <= 1;
}
