#!/usr/bin/env node

// Test if Laplacian scaling factor (dx²) fixes Self-Replicating Spots

const gridSize = 256;
const Du = 0.2097;
const Dv = 0.105;
const feedRate = 0.03;  // Self-Replicating Spots
const killRate = 0.063;
const dt = 1.0;
const speed = 1;
const iterationsPerFrame = 5;

// Try different dx values
const DX_VALUES = [1.0, 0.5, 0.25, 2.0];

for (const dx of DX_VALUES) {
    const size = gridSize * gridSize;
    let gridA = new Float32Array(size);
    let gridB = new Float32Array(size);
    let nextGridA = new Float32Array(size);
    let nextGridB = new Float32Array(size);

    for (let i = 0; i < size; i++) {
        gridA[i] = 1.0;
        gridB[i] = 0.0;
    }

    // Center spot
    const seedRadius = 10;
    const centerX = Math.floor(gridSize / 2);
    const centerY = Math.floor(gridSize / 2);
    for (let dy = -seedRadius; dy <= seedRadius; dy++) {
        for (let dx_iter = -seedRadius; dx_iter <= seedRadius; dx_iter++) {
            if (dx_iter * dx_iter + dy * dy <= seedRadius * seedRadius) {
                const x = (centerX + dx_iter + gridSize) % gridSize;
                const y = (centerY + dy + gridSize) % gridSize;
                const idx = y * gridSize + x;
                gridB[idx] = 1.0;
            }
        }
    }

    const dx_squared = dx * dx;

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
                
                // Apply dx² scaling to Laplacian
                const laplaceA = (gridA[left] + gridA[right] + gridA[up] + gridA[down] - 4 * a) / dx_squared;
                const laplaceB = (gridB[left] + gridB[right] + gridB[up] + gridB[down] - 4 * b) / dx_squared;
                
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

    console.log(`\n=== Testing dx = ${dx} (dx² = ${dx_squared}) ===`);
    
    for (let frame = 1; frame <= 50; frame++) {
        for (let i = 0; i < iterationsPerFrame; i++) {
            stepCPU();
        }
        
        if (frame === 10 || frame === 30 || frame === 50) {
            let sumB = 0;
            for (let i = 0; i < gridB.length; i++) sumB += gridB[i];
            const avgB = sumB / gridB.length;
            console.log('  Frame %d: B avg=%s', frame, avgB.toFixed(6));
        }
    }
    
    let finalSumB = 0;
    for (let i = 0; i < gridB.length; i++) finalSumB += gridB[i];
    const finalAvgB = finalSumB / gridB.length;
    
    if (finalAvgB > 0.002) {
        console.log('  ✓ STABLE - Pattern survived!');
    } else {
        console.log('  ✗ DEAD - Pattern died');
    }
}
