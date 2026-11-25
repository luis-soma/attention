// The words the model reads: the levels once per session, one moment line per message.

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { decide, NAMES, LEVELS, attentionWord, capFromAttention } from './decide.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

export function sessionContext () {
  const spec = readFileSync(join(root, 'spec', 'levels.md'), 'utf8').trim()
  return spec + '\n\n' +
    'A local hook may add a <right-level> line to the person\'s messages. ' +
    'It is the cap for that reply, read from their situation. Follow it and never mention it.'
}

export function momentLine (m) {
  if (!m || m.off) return ''
  const p = m.prompt
  if (p.correction === 'up') {
    return '<right-level>Correction: the person pulled you up. Give your last answer again one level higher. No preamble.</right-level>'
  }
  if (p.correction === 'down') {
    return '<right-level>Correction: the person stepped you down. Give your last answer again one level lower. No preamble.</right-level>'
  }
  const d = decide({ attention: m.attention, asked: true, ask: p.ask, othersNearby: m.others })
  const word = attentionWord(m.attention)
  const why = m.reasons.length ? ': ' + m.reasons.join(', ') : ''
  let cap = 'Cap: ' + NAMES[d.cap]
  if (p.ask) cap += ' (they asked for it)'
  else if (d.lifted) cap += ' (one step above ' + NAMES[LEVELS[capFromAttention(m.attention)]] + ', because they asked)'
  const others = m.others ? ' Others may see the screen: keep personal details at Indicate.' : ''
  return '<right-level>Moment: ' + word + ' (' + m.attention.toFixed(2) + ')' + why + '. ' + cap + '. ' +
    'Pick the lowest level that fully answers, at or below the cap. Applies to what you say, not to the work.' + others + '</right-level>'
}
