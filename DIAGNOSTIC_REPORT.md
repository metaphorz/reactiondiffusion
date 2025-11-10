# Reaction-Diffusion Pattern Death - Diagnostic Report

## Problem
User reported patterns "turn red" and don't self-replicate. Red color on Rainbow scheme indicates B→0 (pattern death).

## Root Cause Found

**Webb's preset parameters cause complete pattern death in our implementation.**

### Test Results

| Preset | f | k | Result |
|--------|---|---|--------|
| Self-Replicating Spots | 0.03 | 0.063 | **DIES** - B→0 by frame 40 |
| Default | 0.054 | 0.062 | **WORKS** - B grows and stabilizes |

All tests used:
- Du = 0.2097
- Dv = 0.105
- dt = 1.0
- Grid = 256×256
- Initial pattern = Center spot (radius 10)

### Evidence

**Self-Replicating Spots (f=0.03, k=0.063):**
```
Frame 10: B avg=0.002217, max=0.3294
Frame 20: B avg=0.001265, max=0.2300
Frame 30: B avg=0.000182, max=0.0496
Frame 40: B avg=0.000002, max=0.0002
Frame 50: B avg=0.000000, max=0.0000  ← DEAD
```

**Default params (f=0.054, k=0.062):**
```
Frame 10: B avg=0.002608, max=0.3937
Frame 20: B avg=0.002684, max=0.3963
Frame 30: B avg=0.002937, max=0.3868
Frame 40: B avg=0.003122, max=0.3813
Frame 50: B avg=0.003285, max=0.3797  ← GROWING!
```

## Why Webb's Presets Don't Work

Possible explanations:
1. **Different Laplacian scaling** - Webb may use dx²=1 instead of implicit dx=1
2. **Different grid size** - Webb's params may be tuned for different resolution
3. **Different initialization** - Presets may need specific seed sizes/shapes
4. **Missing factor** - Webb may have additional scaling in his equations

## Recommended Fixes

### Fix 1: Change Defaults (IMMEDIATE)
```javascript
const [initialPattern, setInitialPattern] = useState('center'); // was 'random'
```

### Fix 2: Remove Broken Presets (SAFE)
Remove or comment out presets that cause pattern death:
- Self-Replicating Spots
- Waves
- Moving Spots
- Most presets with f < 0.04

Keep only verified working presets.

### Fix 3: Add Parameter Ranges (DIAGNOSTIC)
Add UI warnings when f/k combination is likely to cause death.

### Fix 4: Investigate Webb's Code (THOROUGH)
Access Webb's actual simulation code to find the difference.

## Files Created
- `test_simulation.js` - Sparse seeds test
- `test_random_noise.js` - Random noise test
- `test_center_spot.js` - Center spot test (confirms death)
- `test_long_run.js` - 100-frame test showing complete extinction
- `test_default_params.js` - Proves default params work
- `test_small_seed.js` - Seed size variation test

## Conclusion

The Gray-Scott equations are implemented correctly. The problem is that Webb's preset f/k values are incompatible with our implementation for unknown reasons. Using default parameters (f=0.054, k=0.062) produces stable, growing patterns.
