#!/usr/bin/env node

// Test script to debug Gray-Scott simulation without manual browser testing

const gridSize = 256;

// Self-Replicating Spots parameters
const Du = 0.2097;
const Dv = 0.105;
const feedRate = 0.03;  // f
const killRate = 0.063; // k
const dt = 1.0;
const speed = 1;
const iterationsPerFrame = 5;

// Initialize grids
const size = gridSize * gridSize;
let gridA = new Float32Array(size);
let gridB = new Float32Array(size);
let nextGridA = new Float32Array(size);
let nextGridB = new Float32Array(size);

// Initialize base state
for (let i = 0; i < size; i++) {
    gridA[i] = 1.0;
    gridB[i] = 0.0;
}

// Sparse seeds initialization
const seedRadius = 15;
const seedPositions = [
    [gridSize * 0.25, gridSize * 0.25],
    [gridSize * 0.75, gridSize * 0.25],
    [gridSize * 0.5, gridSize * 0.5],
    [gridSize * 0.25, gridSize * 0.75],
    [gridSize * 0.75, gridSize * 0.75],
];

for (const [sx, sy] of seedPositions) {
    const cx = Math.floor(sx);
    const cy = Math.floor(sy);
    for (let dy = -seedRadius; dy <= seedRadius; dy++) {
        for (let dx = -seedRadius; dx <= seedRadius; dx++) {
            if (dx * dx + dy * dy <= seedRadius * seedRadius) {
                const x = (cx + dx + gridSize) % gridSize;
                const y = (cy + dy + gridSize) % gridSize;
                const idx = y * gridSize + x;
                gridB[idx] = 1.0;
            }
        }
    }
}

console.log('=== INITIAL STATE ===');
console.log('Grid size:', gridSize, 'x', gridSize);
console.log('Parameters: Du=%s, Dv=%s, f=%s, k=%s, dt=%s', Du, Dv, feedRate, killRate, dt);

let minB = gridB[0], maxB = gridB[0], sumB = 0;
for (let i = 0; i < gridB.length; i++) {
    if (gridB[i] < minB) minB = gridB[i];
    if (gridB[i] > maxB) maxB = gridB[i];
    sumB += gridB[i];
}
console.log('GridB: min=%s, max=%s, avg=%s', minB.toFixed(6), maxB.toFixed(6), (sumB / gridB.length).toFixed(6));

// Simulation step function
function stepCPU() {
    const timestep = dt * speed;

    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const idx = y * gridSize + x;
            const left = y * gridSize + ((x - 1 + gridSize) % gridSize);
            const right = y * gridSize + ((x + 1) % gridSize);
            const up = ((y - 1 + gridSize) % gridSize) * gridSize + x;
            const down = ((y + 1) % gridSize) * gridSize + x;

            const a = gridA[idx];
            const b = gridB[idx];

            // Laplacian calculation
            const laplaceA = gridA[left] + gridA[right] + gridA[up] + gridA[down] - 4 * a;
            const laplaceB = gridB[left] + gridB[right] + gridB[up] + gridB[down] - 4 * b;

            // Gray-Scott equations
            const reaction = a * b * b;
            const newA = a + (Du * laplaceA - reaction + feedRate * (1 - a)) * timestep;
            const newB = b + (Dv * laplaceB + reaction - (killRate + feedRate) * b) * timestep;

            // Clamp values to [0, 1]
            nextGridA[idx] = Math.max(0, Math.min(1, newA));
            nextGridB[idx] = Math.max(0, Math.min(1, newB));
        }
    }

    // Swap buffers
    [gridA, nextGridA] = [nextGridA, gridA];
    [gridB, nextGridB] = [nextGridB, gridB];
}

// Run simulation for a few frames
console.log('\n=== RUNNING SIMULATION ===');
for (let frame = 1; frame <= 10; frame++) {
    // Run multiple iterations per frame
    for (let i = 0; i < iterationsPerFrame; i++) {
        stepCPU();
    }

    // Calculate statistics
    let minB = gridB[0], maxB = gridB[0], sumB = 0;
    let minA = gridA[0], maxA = gridA[0], sumA = 0;
    for (let i = 0; i < gridB.length; i++) {
        if (gridB[i] < minB) minB = gridB[i];
        if (gridB[i] > maxB) maxB = gridB[i];
        sumB += gridB[i];
        if (gridA[i] < minA) minA = gridA[i];
        if (gridA[i] > maxA) maxA = gridA[i];
        sumA += gridA[i];
    }

    const avgA = sumA / gridA.length;
    const avgB = sumB / gridB.length;

    console.log('Frame %d: A[%s, %s] avg=%s | B[%s, %s] avg=%s',
        frame,
        minA.toFixed(4), maxA.toFixed(4), avgA.toFixed(4),
        minB.toFixed(4), maxB.toFixed(4), avgB.toFixed(4)
    );

    // Check for runaway growth
    if (avgB > 0.5) {
        console.error('\n❌ PROBLEM DETECTED: B average is %s (>0.5) at frame %d', avgB.toFixed(4), frame);
        console.error('This indicates B is overwhelming the system (will appear RED)');
        console.error('\nPossible causes:');
        console.error('1. Timestep too large causing numerical instability');
        console.error('2. Parameters (f=%s, k=%s) incompatible with these diffusion rates', feedRate, killRate);
        console.error('3. Initial seed concentration (B=1.0) too high');
        console.error('4. Seed radius (%d pixels) too large', seedRadius);
        break;
    }
}

console.log('\n=== TEST COMPLETE ===');
