---
description: Set how much attention you have (absorbed, busy, open, free), or go back to auto
argument-hint: "[absorbed|busy|open|free|auto|off|on] [--for 90m] [--others]"
allowed-tools: Bash(node:*)
---

!`node "${CLAUDE_PLUGIN_ROOT}/scripts/attention.mjs" $ARGUMENTS`

Reply with only the first word of the line above. Nothing else.
