// Reads the moment: how much attention the person has right now.
// Sources, strongest first: what you set by hand, your own engine, the Mac, how you asked.
// Everything stays on this machine. Only the short moment line reaches the model.

import { execFile } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { ATTENTION_WORDS, clamp } from './decide.mjs'

export const home = (env = process.env) => env.RIGHT_LEVEL_HOME || join(homedir(), '.right-level')

const CALL_APPS = {
  'zoom.us': 'Zoom',
  'Microsoft Teams': 'Teams',
  'Microsoft Teams (work or school)': 'Teams',
  FaceTime: 'FaceTime',
  Webex: 'Webex',
  'Cisco Webex Meetings': 'Webex',
  Around: 'Around',
  Tuple: 'Tuple'
}

// ---------- how you asked ----------

const UP = /^(more|\+|up|go on|continue|tell me more|mehr|weiter)[.!]?$/i
const DOWN = /^(less|-|down|shorter|too long|kürzer|weniger)[.!]?$/i

export function readPrompt (text = '') {
  const t = String(text).trim()
  const out = { words: 0, ask: null, correction: null, pasted: false }
  if (!t) return out
  if (UP.test(t)) out.correction = 'up'
  else if (DOWN.test(t)) out.correction = 'down'

  out.pasted = t.includes('```') || t.split('\n').length > 15
  out.words = t.split(/\s+/).filter(Boolean).length

  if (/\b(one word|yes or no|y\/n|ja oder nein|in einem wort)\b/i.test(t)) out.ask = 'oneword'
  else if (/\b(quick question|quickly|briefly|tl;?dr|in short|short answer|keep it short|kurz)\b/i.test(t)) out.ask = 'brief'
  else if (/\b(in detail|walk me through|step by step|elaborate|thorough(ly)?|deep dive|full (answer|explanation)|ausführlich)\b/i.test(t)) out.ask = 'detail'
  else if (/\b(explain|why does|why is|how does|erklär)/i.test(t)) out.ask = 'explain'
  return out
}

// A short message asks for a short answer. A long careful one gives room.
// Pasted logs and code say nothing about attention, so they count as neutral.
export function promptShift (p) {
  if (!p.words || p.pasted || p.correction) return { shift: 0 }
  if (p.words <= 3) return { shift: -0.25, reason: 'very short message' }
  if (p.words <= 8) return { shift: -0.12, reason: 'short message' }
  if (p.words >= 120) return { shift: 0.2, reason: 'long message' }
  if (p.words >= 40) return { shift: 0.1, reason: 'longer message' }
  return { shift: 0 }
}

// ---------- what you set ----------

export function readState (env = process.env, now = Date.now()) {
  try {
    const s = JSON.parse(readFileSync(join(home(env), 'state.json'), 'utf8'))
    if (s.until && now > s.until) return null
    return s
  } catch { return null }
}

export function writeState (s, env = process.env) {
  mkdirSync(home(env), { recursive: true })
  writeFileSync(join(home(env), 'state.json'), JSON.stringify(s, null, 2))
}

// Corrections teach: each pull up or step down moves this session's start point.
export function sessionBias (sessionId, correction, env = process.env, now = Date.now()) {
  if (!sessionId) return 0
  const file = join(home(env), 'sessions.json')
  let all = {}
  try { all = JSON.parse(readFileSync(file, 'utf8')) } catch {}
  for (const [k, v] of Object.entries(all)) if (now - (v.t || 0) > 2 * 864e5) delete all[k]
  const cur = all[sessionId] || { bias: 0 }
  if (correction) {
    cur.bias = clamp(cur.bias + (correction === 'up' ? 0.1 : -0.1), -0.3, 0.3)
    cur.t = now
    all[sessionId] = cur
    try { mkdirSync(home(env), { recursive: true }); writeFileSync(file, JSON.stringify(all)) } catch {}
  }
  return cur.bias
}

// ---------- your engine ----------

// Any local service can answer GET <url>/moment with { attention: 0..1, others?: bool, reasons?: [string] }.
export async function readEngine (env = process.env) {
  const url = env.RIGHT_LEVEL_ENGINE
  if (!url) return null
  try {
    const r = await fetch(url.replace(/\/$/, '') + '/moment', { signal: AbortSignal.timeout(250) })
    if (!r.ok) return null
    const m = await r.json()
    if (typeof m.attention !== 'number') return null
    return m
  } catch { return null }
}

// ---------- the Mac ----------

function run (cmd, args, ms = 300) {
  return new Promise(resolve => {
    execFile(cmd, args, { timeout: ms }, (err, stdout) => resolve(err ? '' : String(stdout)))
  })
}

// Front-to-back list of visible apps, without any permission prompt.
export async function readMac ({ env = process.env, platform = process.platform } = {}) {
  if (platform !== 'darwin' || env.RIGHT_LEVEL_NO_DEVICE) return {}
  const out = await run('lsappinfo', ['visibleProcessList'])
  const visible = [...out.matchAll(/"([^"]+)"-ASN/g)].map(m => m[1])
  const call = visible.map(n => CALL_APPS[n]).find(Boolean)
  return { visible, call }
}

// ---------- together ----------

export async function readMoment ({ prompt = '', sessionId = null, env = process.env, now = Date.now(), mac } = {}) {
  const reasons = []
  const p = readPrompt(prompt)
  const state = readState(env, now)
  if (state?.off || env.RIGHT_LEVEL_OFF) return { off: true }

  let attention = 0.55
  let others = false
  let source = 'guess'

  if (state && typeof state.attention === 'number') {
    attention = state.attention
    others = !!state.others
    source = 'you'
    reasons.push('set by you: ' + (state.word || 'manual'))
  } else {
    const engine = await readEngine(env)
    if (engine) {
      attention = clamp(engine.attention)
      others = !!engine.others
      source = 'engine'
      reasons.push(...(engine.reasons?.length ? engine.reasons.slice(0, 3) : ['from your engine']))
    }
    const m = mac ?? await readMac({ env })
    if (m.call) {
      attention -= 0.2
      reasons.push('in a call (' + m.call + ')')
    }
  }

  // How you asked counts fully on its own, and half when something stronger already spoke.
  const ps = promptShift(p)
  if (ps.shift) {
    attention += source === 'guess' ? ps.shift : ps.shift / 2
    reasons.push(ps.reason)
  }

  const bias = sessionBias(sessionId, p.correction, env, now)
  if (bias) {
    attention += bias
    reasons.push(bias > 0 ? 'you pulled up before' : 'you cut answers before')
  }

  return { attention: clamp(attention), others, source, reasons, prompt: p }
}

export { ATTENTION_WORDS }
