set dotenv-load := true

ext_dir := ".pi/extensions"

default:
    @just --list

# g1

# 1. default pi
pi:
    pi

# 2. Pure focus pi: strip footer and status line entirely
ext-pure-focus:
    pi -e {{ext_dir}}/pure-focus.ts

# 3. Minimal pi: model name + 10-block context meter
ext-minimal:
    pi -e {{ext_dir}}/minimal.ts -e {{ext_dir}}/theme-cycler.ts

# 4. Customized footer pi: Tool counter, model, branch, cwd, cost, etc.
ext-tool-counter:
    pi -e {{ext_dir}}/tool-counter.ts

# 5. Tool counter widget: tool call counts in a below-editor widget
ext-tool-counter-widget:
    pi -e {{ext_dir}}/tool-counter-widget.ts -e {{ext_dir}}/minimal.ts

#g2

# 6. Launch with Damage-Control safety auditing
ext-damage-control:
    pi -e {{ext_dir}}/damage-control.ts -e {{ext_dir}}/minimal.ts -e {{ext_dir}}/theme-cycler.ts

# 7. Agent chain: sequential pipeline orchestrator
ext-agent-chain:
    pi -e {{ext_dir}}/agent-chain.ts -e {{ext_dir}}/theme-cycler.ts

# 8. Agent team: dispatcher-based multi-agent orchestration
ext-agent-team:
    pi -e {{ext_dir}}/agent-team.ts -e {{ext_dir}}/theme-cycler.ts

#g3

#ext

# 9. Session Replay: scrollable timeline overlay of session history (legit)
ext-session-replay:
    pi -e {{ext_dir}}/session-replay.ts -e {{ext_dir}}/minimal.ts

# 10. Theme cycler: Ctrl+X forward, Ctrl+Q backward, /theme picker
ext-theme-cycler:
    pi -e {{ext_dir}}/theme-cycler.ts -e {{ext_dir}}/minimal.ts

# utils

# Open pi with one or more stacked extensions in a new terminal: just open minimal tool-counter
open +exts:
    #!/usr/bin/env bash
    args=""
    for ext in {{exts}}; do
        args="$args -e .pi/extensions/$ext.ts"
    done
    cmd="cd '{{justfile_directory()}}' && pi$args"
    escaped="${cmd//\\/\\\\}"
    escaped="${escaped//\"/\\\"}"
    osascript -e "tell application \"Terminal\" to do script \"$escaped\""

# Open every extension in its own terminal window
all:
    just open pi
    just open pure-focus 
    just open minimal theme-cycler
    just open tool-counter
    just open tool-counter-widget minimal
    just open damage-control minimal theme-cycler
    just open agent-chain theme-cycler
    just open agent-team theme-cycler
