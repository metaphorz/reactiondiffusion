#!/bin/zsh

# Open the simulator and capture console logs
cd /Users/paul/ReactionDiffusion

echo "Opening simulator with debug logging..."
open index.html

echo "Please manually:"
echo "1. Open Chrome DevTools Console (Cmd+Option+J)"
echo "2. Click the Play button"
echo "3. Watch the console logs for 5 seconds"
echo "4. Copy all console output"
echo "5. Paste into tests/auto/console_output.txt"
echo ""
echo "What to look for:"
echo "- Grid initialization values"
echo "- Frame count progressing"
echo "- Parameter values being used"
echo "- Any errors or warnings"
