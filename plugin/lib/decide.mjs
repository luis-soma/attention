// The decision rule, shared by every host.
// Value sets how far, attention caps it, the lower one wins.
// When the person asked, attention is already given, so the cap lifts one step.

export const LEVELS = ['indicate', 'show', 'explain', 'elaborate']
export const NAMES = { indicate: 'Indicate', show: 'Show', explain: 'Explain', elaborate: 'Elaborate' }

// Attention words, matching the slider in the thesis prototype.
export const ATTENTION_WORDS = { absorbed: 0.1, busy: 0.35, open: 0.6, free: 0.85 }

export function attentionWord (a) {
  if (a < 0.2) return 'Absorbed'
  if (a < 0.45) return 'Busy'
  if (a < 0.7) return 'Open'
  return 'Free'
}

// Attention caps the level: below 0.2 Indicate, below 0.45 Show, below 0.7 Explain, otherwise Elaborate.
export function capFromAttention (a) {
  if (a < 0.2) return 0
  if (a < 0.45) return 1
  if (a < 0.7) return 2
  return 3
}

// Value sets how far: below 0.2 Hold, below 0.4 Indicate, below 0.6 Show, below 0.8 Explain, otherwise Elaborate.
export function levelFromValue (v) {
  if (v < 0.2) return -1
  if (v < 0.4) return 0
  if (v < 0.6) return 1
  if (v < 0.8) return 2
  return 3
}

export const clamp = (x, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x))

/**
 * @param {object} o
 * @param {number} o.attention 0..1, what the person can give right now
 * @param {number} [o.value] 0..1, what the message is worth. Unknown for replies: the model judges it.
 * @param {boolean} [o.asked] true when the person asked (reactive)
 * @param {'oneword'|'brief'|'explain'|'detail'|null} [o.ask] an explicit ask in the prompt, which wins
 * @param {boolean} [o.othersNearby]
 * @param {boolean} [o.personal]
 */
export function decide ({ attention, value = null, asked = true, ask = null, othersNearby = false, personal = false }) {
  let cap = capFromAttention(attention)
  const lifted = asked && cap < 3
  if (asked) cap = Math.min(3, cap + 1)
  if (ask === 'oneword') cap = 0
  else if (ask === 'brief') cap = Math.min(cap, 1)
  else if (ask === 'explain') cap = Math.max(cap, 2)
  else if (ask === 'detail') cap = 3
  if (othersNearby && personal) cap = 0
  const out = { cap: LEVELS[cap], lifted: lifted && !ask }
  if (value == null) return out
  const want = levelFromValue(value)
  out.level = want < 0 ? 'hold' : LEVELS[Math.min(want, cap)]
  return out
}
