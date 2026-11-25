#!/usr/bin/env node
// One hook for Claude Code and Codex.
// SessionStart: gives the model the levels once.
// UserPromptSubmit: reads the moment and adds one short line with the cap.
// It never blocks a prompt. If anything fails, it stays silent.

import { readFileSync } from 'node:fs'
import { readMoment } from '../lib/moment.mjs'
import { sessionContext, momentLine } from '../lib/context.mjs'

async function main () {
  let input = {}
  try { input = JSON.parse(readFileSync(0, 'utf8') || '{}') } catch {}
  const event = input.hook_event_name || process.argv[2]

  let context = ''
  if (event === 'SessionStart') {
    const m = await readMoment({ prompt: '' })
    if (!m.off) context = sessionContext()
  } else if (event === 'UserPromptSubmit') {
    const m = await readMoment({ prompt: input.prompt || '', sessionId: input.session_id })
    context = momentLine(m)
  }
  if (!context) return
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: event, additionalContext: context } }))
}

// No process.exit: on macOS a pipe write is async and exiting early can cut the output.
main().catch(() => {})
