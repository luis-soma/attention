import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { decide } from '../plugin/lib/decide.mjs'
import { readPrompt, readMoment, writeState } from '../plugin/lib/moment.mjs'
import { momentLine } from '../plugin/lib/context.mjs'

const env = () => ({ ATTENTION_HOME: mkdtempSync(join(tmpdir(), 'rl-')), ATTENTION_NO_DEVICE: '1' })
const hook = join(import.meta.dirname, '../plugin/scripts/hook.mjs')

test('value sets how far, attention caps it, the lower one wins', () => {
  assert.equal(decide({ attention: 0.9, value: 0.5, asked: false }).level, 'show')
  assert.equal(decide({ attention: 0.3, value: 0.9, asked: false }).level, 'show')
  assert.equal(decide({ attention: 0.9, value: 0.1, asked: false }).level, 'hold')
})

test('asking lifts the cap one step', () => {
  assert.equal(decide({ attention: 0.1, asked: false }).cap, 'indicate')
  assert.equal(decide({ attention: 0.1, asked: true }).cap, 'show')
  assert.equal(decide({ attention: 0.9, asked: true }).cap, 'elaborate')
})

test('an explicit ask wins', () => {
  assert.equal(decide({ attention: 0.9, ask: 'oneword' }).cap, 'indicate')
  assert.equal(decide({ attention: 0.9, ask: 'brief' }).cap, 'show')
  assert.equal(decide({ attention: 0.1, ask: 'detail' }).cap, 'elaborate')
  assert.equal(decide({ attention: 0.1, ask: 'explain' }).cap, 'explain')
})

test('personal content stays at Indicate with others nearby', () => {
  assert.equal(decide({ attention: 0.9, othersNearby: true, personal: true }).cap, 'indicate')
})

test('reads asks and corrections from the prompt', () => {
  assert.equal(readPrompt('more').correction, 'up')
  assert.equal(readPrompt('Shorter.').correction, 'down')
  assert.equal(readPrompt('quick question: which port?').ask, 'brief')
  assert.equal(readPrompt('walk me through the auth flow').ask, 'detail')
  assert.equal(readPrompt('more tests for the parser please').correction, null)
  assert.equal(readPrompt('```\nlog\n```').pasted, true)
})

test('a short message lowers attention, pasted logs do not', async () => {
  const e = env()
  const short = await readMoment({ prompt: 'port?', env: e, mac: {} })
  const pasted = await readMoment({ prompt: 'why?\n```\n' + 'x\n'.repeat(30) + '```', env: e, mac: {} })
  assert.ok(short.attention < 0.4)
  assert.equal(pasted.attention, 0.55)
})

test('a call lowers attention', async () => {
  const m = await readMoment({ prompt: 'what changed in the last commit and why', env: env(), mac: { call: 'Zoom' } })
  assert.ok(m.attention < 0.4)
  assert.ok(m.reasons.includes('in a call (Zoom)'))
})

test('what you set beats the guess, until it expires', async () => {
  const e = env()
  writeState({ attention: 0.1, word: 'absorbed', until: Date.now() + 1000 }, e)
  assert.equal((await readMoment({ prompt: 'can you tell me what the build output says about the failing step', env: e, mac: {} })).attention, 0.1)
  writeState({ attention: 0.1, until: Date.now() - 1 }, e)
  assert.equal((await readMoment({ prompt: 'can you tell me what the build output says about the failing step', env: e, mac: {} })).attention, 0.55)
})

test('corrections teach the session', async () => {
  const e = env()
  await readMoment({ prompt: 'more', sessionId: 's1', env: e, mac: {} })
  await readMoment({ prompt: 'more', sessionId: 's1', env: e, mac: {} })
  const m = await readMoment({ prompt: 'can you tell me what the build output says about the failing step', sessionId: 's1', env: e, mac: {} })
  assert.ok(Math.abs(m.attention - 0.75) < 1e-9)
})

test('off means silent', async () => {
  const e = env()
  writeState({ off: true }, e)
  assert.equal(momentLine(await readMoment({ prompt: 'hi', env: e })), '')
})

test('moment line names the cap and the reason', async () => {
  const line = momentLine(await readMoment({ prompt: 'port?', env: env(), mac: {} }))
  assert.match(line, /^<attention>Moment: Busy \(0\.30\): very short message\. Cap: Explain \(one step above Show, because they asked\)\./)
})

test('the hook speaks the hook protocol', () => {
  const run = (input) => spawnSync('node', [hook], { input: JSON.stringify(input), env: { ...process.env, ...env() }, encoding: 'utf8' })
  const start = JSON.parse(run({ hook_event_name: 'SessionStart' }).stdout)
  assert.equal(start.hookSpecificOutput.hookEventName, 'SessionStart')
  assert.match(start.hookSpecificOutput.additionalContext, /## Levels/)
  const prompt = JSON.parse(run({ hook_event_name: 'UserPromptSubmit', prompt: 'more', session_id: 'x' }).stdout)
  assert.match(prompt.hookSpecificOutput.additionalContext, /pulled you up/)
  const broken = spawnSync('node', [hook], { input: 'not json', encoding: 'utf8' })
  assert.equal(broken.status, 0)
  assert.equal(broken.stdout, '')
})
