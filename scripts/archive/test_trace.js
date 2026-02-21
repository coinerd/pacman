const tileSize = 20;

const ghost = {
    gridX: 13,
    gridY: 14,
    x: 270,
    y: 290,
    direction: { x: 1, y: 0 },
    speed: 100,
    isMoving: true,
    nextDirection: { x: 0, y: 0 }
};

console.log('Initial ghost state:');
console.log('  x:', ghost.x, 'y:', ghost.y);
console.log('  gridX:', ghost.gridX, 'gridY:', ghost.gridY);

if (ghost.gridY === 14) {
    console.log('Tunnel row detected, applying speed multiplier 0.4');
    ghost.speed = 100 * 0.4;
}

const delta = 1000;
console.log('\nCalling performGridMovementStep with delta:', delta, 'speed:', ghost.speed);

const rawMoveDist = ghost.speed * (delta / 1000);
console.log('rawMoveDist:', rawMoveDist);

const EPS = 3;
const cappedMoveDist = Math.min(rawMoveDist, tileSize * 2 - 1);
console.log('cappedMoveDist:', cappedMoveDist);

const moveDist = Math.max(0, cappedMoveDist - (cappedMoveDist <= EPS ? 0.01 : 0));
console.log('moveDist:', moveDist);

console.log('\nUpdating entity.x:', ghost.x, 'by', ghost.direction.x * moveDist);
ghost.x += ghost.direction.x * moveDist;
console.log('After update entity.x:', ghost.x);
