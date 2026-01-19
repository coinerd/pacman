import Ghost from './src/entities/Ghost.js';

const mockScene = {
    gameState: { level: 1 },
    add: {
        existing: () => {},
        circle: (x, y, radius, startAngle, endAngle, anticlockwise, color, alpha) => ({
            x, y, radius, startAngle, endAngle, anticlockwise, color, alpha,
            setDepth: () => {},
            setFillStyle: () => {}
        })
    }
};

const ghost = new Ghost(mockScene, 13, 14, 'blinky', 0xFF0000);

console.log('Ghost initialization:');
console.log('  x:', ghost.x, 'type:', typeof ghost.x);
console.log('  y:', ghost.y, 'type:', typeof ghost.y);
console.log('  gridX:', ghost.gridX, 'type:', typeof ghost.gridX);
console.log('  gridY:', ghost.gridY, 'type:', typeof ghost.gridY);
console.log('  speed:', ghost.speed, 'type:', typeof ghost.speed);
console.log('  direction:', ghost.direction);
