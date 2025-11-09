# Manual Test Instructions

## Test GPU Reaction-Diffusion

1. Open `index.html` in Chrome or Safari
2. Set **Initial Pattern** to "Random Noise"
3. Click **Play**
4. Observe for 10-15 seconds

### Expected Behavior:
- Random noise should grow into spot patterns
- Spots should remain stable and not disappear
- Pattern should evolve slowly over time

### If pattern disappears:
- The timestep may still be too large
- The diffusion coefficients may need further adjustment
- There may be a GPU synchronization issue

## Alternative Test:
1. Try the "Grid" initial pattern
2. This has multiple seeds that should be more robust
3. If these also disappear, there's a fundamental issue with the simulation step

## Debug Information to Collect:
- Browser console errors (if any)
- WebGPU adapter information
- Grid initialization values (check first few cells)
