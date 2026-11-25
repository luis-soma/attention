#!/usr/bin/env node
// Tell the agents how much attention you have.
//
//   attention                       show the current moment and cap
//   attention busy                  absorbed | busy | open | free, or a number 0..1
//   attention busy --for 90m        how long it holds (default 3h)
//   attention open --others         others can see your screen
//   attention auto                  go back to reading the moment
//   attention off | on              turn the plugin off or on

import { rmSync } from 'node:fs'
import { join } from 'node:path'
import { readMoment, writeState, readState, home } from '../lib/moment.mjs'
import { ATTENTION_WORDS, attentionWord, decide, NAMES } from '../lib/decide.mjs'

const args = process.argv.slice(2)
const cmd = (args[0] || 'status').toLowerCase()
const flag = name => args.includes('--' + name)
const opt = name => { const i = args.indexOf('--' + name); return i > -1 ? args[i + 1] : null }

function duration (s) {
  const m = /^(\d+(?:\.\d+)?)(m|h)?$/.exec(s || '')
  if (!m) return 3 * 3600e3
  return Number(m[1]) * (m[2] === 'm' ? 60e3 : 3600e3)
}

async function status () {
  const m = await readMoment({ prompt: '' })
  if (m.off) return console.log('off')
  const d = decide({ attention: m.attention, asked: true, othersNearby: m.others })
  const s = readState()
  const until = s?.until ? ' until ' + new Date(s.until).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
  console.log(attentionWord(m.attention) + ' (' + m.attention.toFixed(2) + ') · replies up to ' + NAMES[d.cap] +
    (m.reasons.length ? ' · ' + m.reasons.join(', ') : '') + until)
}

if (cmd === 'status') {
  await status()
} else if (cmd === 'auto') {
  rmSync(join(home(), 'state.json'), { force: true })
  await status()
} else if (cmd === 'off') {
  writeState({ off: true })
  console.log('off')
} else if (cmd === 'on') {
  rmSync(join(home(), 'state.json'), { force: true })
  await status()
} else {
  const n = Number(cmd)
  const attention = cmd in ATTENTION_WORDS ? ATTENTION_WORDS[cmd] : n
  if (!(attention >= 0 && attention <= 1)) {
    console.error('Use absorbed, busy, open, free, a number from 0 to 1, auto, off or on.')
    process.exit(1)
  }
  writeState({ attention, word: cmd in ATTENTION_WORDS ? cmd : attentionWord(attention).toLowerCase(), others: flag('others'), until: Date.now() + duration(opt('for')) })
  await status()
}
