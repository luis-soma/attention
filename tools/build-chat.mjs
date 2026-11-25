// Builds the Claude chat files from the one spec, so every host reads the same levels.
// Run: node tools/build-chat.mjs

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = join(dirname(fileURLToPath(import.meta.url)), '..')
const spec = readFileSync(join(repo, 'plugin/spec/levels.md'), 'utf8').trim()
const body = spec.replace(/^# Right level\n\n/, '')

const chatNote = 'In chat there is no sensor. Read the moment from how they ask: length, pace, tone and what they ask for.'

mkdirSync(join(repo, 'chat/attention'), { recursive: true })

writeFileSync(join(repo, 'chat/preferences.md'),
`Paste everything below the line into Claude: Settings, Profile, "What personal preferences should Claude consider in responses?". Or paste it into a Project's instructions to use it in one project only.

---

${body}

${chatNote}
`)

writeFileSync(join(repo, 'chat/attention/SKILL.md'),
`---
name: attention
description: Use for every reply in this conversation. Sets how much to say and in what form (Indicate, Show, Explain or Elaborate) from the attention the person has right now, and handles one-word corrections like "more" or "less".
---

${spec}

${chatNote}
`)

console.log('built chat/preferences.md and chat/attention/SKILL.md')
