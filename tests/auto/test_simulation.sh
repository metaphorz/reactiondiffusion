#!/bin/zsh

# Navigate to project root
cd /Users/paul/ReactionDiffusion

# Open the simulator
open index.html

# Wait for page to load
sleep 3

# Use AppleScript to click the Play button
osascript <<EOF
tell application "Google Chrome"
    activate
    delay 1
end tell

tell application "System Events"
    keystroke "r" using {command down}
    delay 2

    # Click Play button (approximate position)
    click at {1007, 259}
    delay 5
end tell
EOF

# Capture screenshot
screencapture -W /Users/paul/ReactionDiffusion/tests/auto/simulation_running.png

echo "Test complete. Screenshot saved to tests/auto/simulation_running.png"
