// benchmarks/performance-benchmarks.js
// Simple performance benchmarks for critical game systems

import { EventBus } from '../src/core/EventBus.js';

// Simple benchmark harness
class Benchmark {
    constructor(name) {
        this.name = name;
        this.results = [];
    }

    measure(fn, iterations = 10000) {
        // Warm-up
        for (let i = 0; i < 100; i++) {
            fn();
        }

        // Actual measurement
        const start = performance.now();
        for (let i = 0; i < iterations; i++) {
            fn();
        }
        const end = performance.now();
        const duration = end - start;
        const opsPerSecond = (iterations / duration) * 1000;
        const avgTime = duration / iterations;

        this.results.push({
            name: this.name,
            iterations,
            duration: duration.toFixed(3),
            avgTime: avgTime.toFixed(6),
            opsPerSecond: Math.round(opsPerSecond)
        });

        return this.results[this.results.length - 1];
    }

    report() {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`Benchmark: ${this.name}`);
        console.log('='.repeat(60));
        this.results.forEach(r => {
            console.log(`Iterations: ${r.iterations}`);
            console.log(`Total time: ${r.duration}ms`);
            console.log(`Average time: ${r.avgTime}ms`);
            console.log(`Ops/second: ${r.opsPerSecond.toLocaleString()}`);
        });
        console.log('='.repeat(60));
    }
}

// Benchmark 1: EventBus emit performance
function benchmarkEventBus() {
    const eventBus = new EventBus();
    let counter = 0;
    
    // Subscribe to an event
    eventBus.on('test:event', (data) => {
        counter++;
    });

    const bench = new Benchmark('EventBus.emit()');
    bench.measure(() => {
        eventBus.emit('test:event', { value: 1 });
    }, 10000);
    bench.report();

    return bench.results[0];
}

// Benchmark 2: Collision detection (simple circle collision)
function benchmarkCollisionDetection() {
    function checkCircleCollision(x1, y1, r1, x2, y2, r2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < r1 + r2;
    }

    const bench = new Benchmark('Collision Detection (Circle)');
    bench.measure(() => {
        checkCircleCollision(100, 100, 20, 120, 120, 20);
    }, 10000);
    bench.report();

    return bench.results[0];
}

// Benchmark 3: Multiple collision checks
function benchmarkMultipleCollisions() {
    function checkCircleCollision(x1, y1, r1, x2, y2, r2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < r1 + r2;
    }

    // Create some test entities
    const entities = [];
    for (let i = 0; i < 10; i++) {
        entities.push({
            x: Math.random() * 500,
            y: Math.random() * 500,
            radius: 20
        });
    }

    const bench = new Benchmark('Multiple Collision Checks (10 entities)');
    bench.measure(() => {
        for (let i = 0; i < entities.length; i++) {
            for (let j = i + 1; j < entities.length; j++) {
                checkCircleCollision(
                    entities[i].x, entities[i].y, entities[i].radius,
                    entities[j].x, entities[j].y, entities[j].radius
                );
            }
        }
    }, 1000);
    bench.report();

    return bench.results[0];
}

// Benchmark 4: EventBus with multiple listeners
function benchmarkEventBusMultipleListeners() {
    const eventBus = new EventBus();
    let counter = 0;
    
    // Subscribe multiple listeners
    for (let i = 0; i < 10; i++) {
        eventBus.on('test:event', (data) => {
            counter++;
        });
    }

    const bench = new Benchmark('EventBus.emit() with 10 listeners');
    bench.measure(() => {
        eventBus.emit('test:event', { value: 1 });
    }, 10000);
    bench.report();

    return bench.results[0];
}

// Run all benchmarks
console.log('\n' + '='.repeat(60));
console.log('PERFORMANCE BENCHMARKS - Pacman Game');
console.log('='.repeat(60));
console.log(`Date: ${new Date().toISOString()}`);
console.log(`Node: ${process.version}`);
console.log('='.repeat(60));

const results = {
    eventBus: benchmarkEventBus(),
    collision: benchmarkCollisionDetection(),
    multipleCollisions: benchmarkMultipleCollisions(),
    eventBusMultipleListeners: benchmarkEventBusMultipleListeners()
};

// Summary
console.log('\n' + '='.repeat(60));
console.log('BENCHMARK SUMMARY');
console.log('='.repeat(60));
Object.entries(results).forEach(([key, result]) => {
    console.log(`${result.name}: ${result.opsPerSecond.toLocaleString()} ops/sec (${result.avgTime}ms avg)`);
});
console.log('='.repeat(60));

export { results };
