#!/usr/bin/env node

// Test with Center Spot - likely what Webb uses for self-replicating patterns

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

// Center spot initialization
const seedRadius = 15;
const centerX = Math.floor(gridSize / 2);
const centerY = Math.floor(gridSize / 2);
for (let dy = -seedRadius; dy <= seedRadius; dy++) {
    for (let dx = -seedRadius; dx <= seedRadius; dx++) {
        if (dx * dx + dy * dy <= seedRadius * seedRadius) {
            const x = (centerX + dx + gridSize) % gridSize;
            const y = (centerY + dy + gridSize) % gridSize;
            const idx = y * gridSize + x;
            gridB[idx] = 1.0;
        }
    }
}

console.log('=== INITIAL STATE (CENTER SPOT) ===');
console.log('Grid size:', gridSize, 'x', gridSize);
console.log('Parameters: Du=%s, Dv=%s, f=%s, k=%s, dt=%s', Du, Dv, feedRate, killRate, dt);
console.log('Seed radius:', seedRadius, 'pixels');

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
for (let frame = 1; frame <= 20; frame++) {
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

    // Check for patterns forming
    if (frame === 20) {
        if (avgB < 0.01) {
            console.error('\n❌ PROBLEM: B has decayed to near zero (avg=%s)', avgB.toFixed(6));
            console.error('Pattern died instead of self-replicating.');
            console.error('\nLikely causes:');
            console.error('1. Parameters (f=%s, k=%s) wrong for self-replication with Du=%s, Dv=%s', feedRate, killRate, Du, Dv);
            console.error('2. Seed size (%d pixels) may be too large or small', seedRadius);
        } else if (avgB > 0.5) {
            console.error('\n❌ PROBLEM: B has grown too large (avg=%s)', avgB.toFixed(4));
            console.error('This would appear RED on screen.');
        } else {
            console.log('\n✓ Pattern appears to be stable/evolving (B avg=%s)', avgB.toFixed(4));
        }
    }
}

console.log('\n=== TEST COMPLETE ===');
