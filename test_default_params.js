#!/usr/bin/env node

const gridSize = 256;
const Du = 0.2097;
const Dv = 0.105;
const feedRate = 0.054;  // DEFAULT (not self-replicating)
const killRate = 0.062;  // DEFAULT
const dt = 1.0;
const speed = 1;
const iterationsPerFrame = 5;

const size = gridSize * gridSize;
let gridA = new Float32Array(size);
let gridB = new Float32Array(size);
let nextGridA = new Float32Array(size);
let nextGridB = new Float32Array(size);

for (let i = 0; i < size; i++) {
    gridA[i] = 1.0;
    gridB[i] = 0.0;
}

const seedRadius = 10;
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
            const laplaceA = gridA[left] + gridA[right] + gridA[up] + gridA[down] - 4 * a;
            const laplaceB = gridB[left] + gridB[right] + gridB[up] + gridB[down] - 4 * b;
            const reaction = a * b * b;
            const newA = a + (Du * laplaceA - reaction + feedRate * (1 - a)) * timestep;
            const newB = b + (Dv * laplaceB + reaction - (killRate + feedRate) * b) * timestep;
            nextGridA[idx] = Math.max(0, Math.min(1, newA));
            nextGridB[idx] = Math.max(0, Math.min(1, newB));
        }
    }
    [gridA, nextGridA] = [nextGridA, gridA];
    [gridB, nextGridB] = [nextGridB, gridB];
}

console.log('Testing DEFAULT parameters: f=0.054, k=0.062\n');

for (let frame = 1; frame <= 50; frame++) {
    for (let i = 0; i < iterationsPerFrame; i++) {
        stepCPU();
    }
    
    if (frame % 5 === 0) {
        let sumB = 0, maxB = 0;
        for (let i = 0; i < gridB.length; i++) {
            sumB += gridB[i];
            if (gridB[i] > maxB) maxB = gridB[i];
        }
        const avgB = sumB / gridB.length;
        console.log('Frame %d: B avg=%s, max=%s', frame, avgB.toFixed(6), maxB.toFixed(4));
    }
}
