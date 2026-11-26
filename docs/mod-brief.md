# Brief: the Attention mod for Claude Code

Luis Somasundaram · MDes thesis *Worth the Attention*, UC Berkeley · written Nov 25 2026

Read this before you change anything. It carries the whole context from the ideation chat. Build only the Claude Code mod. Claude chat and Codex are out of scope for now: leave `chat/`, `codex/` and `plugin/hooks/codex.json` as they are.

---

## 1. What we are building, in one paragraph

Claude Code answers almost every moment the same way: a paragraph. This mod makes it answer at the right level for the attention the person has right now, and lets them move a reply up or down **inside the reply**, instantly, with no new turn. Claude writes every final answer as a ladder of four levels, smallest first. The mod reads the person's attention from context (no manual setting), shows only the level that fits, and holds the rest one step away. Changing the level is one action. Every change teaches the mod where to start next time.

It is the same idea as Luis's own thesis system (a standalone Mac app with its own models), applied to an agent people already use every day. It should feel like a sibling of that system, not a different product.

**What it is not**
- Not a notification project. It is about how a person and a working agent talk.
- Not "make Claude terse". Short is not the goal. The right level is the goal, plus a correction that costs almost nothing.
- Not adaptive UI or generative UI as a claim.
- Never cuts the work. Code, file edits, commands, tool calls and documents Claude was asked to write stay complete. Only what Claude says to the person adapts.

---

## 2. The thesis in short (why this exists)

- AI agents talk in language by default, not because language fits every moment but because language models made it cheap.
- As more agents work for us, more of them ask for our attention. Luis's line: "More and more agents will ask for our attention. I want to find a way for them to respect it."
- The framework is a **matching** argument, not anti-language and not minimalism. "Language is good, just not always the right level."
- Evidence from Study 1 (adapted vs full answers, heavy daily AI users, lab and lecture):
  - Shorter worked: 11 vs 114 words, 96% vs 89% solved.
  - Only 4 of 16 people used More. **The default level must be right, and pulling up must cost almost nothing.**
  - In a lecture, one participant could not finish on the full answers: the cost is paid in the senses already in use.
  - People skim for bold, so levels need to be real steps, not just length.
- Gate feedback: don't over-compress; look at "the dance" (how you ask sets how it answers).
- Experts: answer style is set per product today, not per moment. Per moment is the gap this fills.

### The framework (v3)
- Two axes, both properties of the message: **information capacity** (how much a signal can express) and **comprehension demand** (what it takes to understand it).
- Two forces act on the whole plane: **value** (what the message is worth to this person now) and **available attention** (what they can give right now).
- Four regions as system verbs: **Indicate** (bottom left), **Show** (bottom right), **Explain** (top right), **Elaborate** (top left).
- **Hold** is not a level: nothing reached the threshold. **Needs you** is not a level: high value plus an ask, at any level.
- Foundation: Wickens' SEEV (salience, effort, expectancy, value). **Expectancy is a constraint: a level's meaning never changes. Adaptation only changes which level is chosen.**
- Lineage: Horvitz 1999 (mixed-initiative), Iqbal and Horvitz 2007, Mark et al. 2008, Ju and Leifer 2008, Bakker et al. 2014. Fatigue from heavy LLM use: Tankelevitch et al. 2024, Fan et al. 2026.

### The decision rule (identical in every prototype, keep it identical here)
- **Value sets how far:** below 0.2 Hold, below 0.4 Indicate, below 0.6 Show, below 0.8 Explain, otherwise Elaborate.
- **Attention caps it:** below 0.2 Indicate, below 0.45 Show, below 0.7 Explain, otherwise Elaborate.
- **The lower one wins.**
- When the person asked (reactive), the cap lifts one step: attention is already given.
- Never say more than there is to say (scope).
- An explicit ask wins ("quick", "one word", "walk me through it").
- Others nearby: personal content stays at Indicate.
- Risks, irreversible actions, errors and requests for consent are never cut.
- Corrections win and teach.

This rule already exists as code in `plugin/lib/decide.mjs`. Reuse it. Do not fork it.

---

## 3. What Luis's own system does (the sibling to align with)

As of Nov 25 2026. The mod should feel like the same family.

### Structure
- **One agent, one space. Not a chatbot.** No chat history, no conversation list. One thing in focus at a time, with one lifecycle.
- **The stage** holds what is in focus now. **Tasks** sit above the agent as the near layer (active and previous, a work chip that unfolds in place). **Themes** sit below as the far layer (saved things to dive back into, simple titles, sorted by most recent).
- **The ring** is the agent: Luis's own mark, a circle with a thick stroke (about 22% of the diameter), a progressive blur (soft on one side, sharp on the other) and fine grain. It sits at the bottom centre and is also the main animation for every agent state. Its shape never changes. Only focus, stroke weight and size move.
- **Input** is Wispr Flow-like: press, talk, let go. The text bar arrives with motion when you start typing.

### How it decides
- Two stages, for speed: a fast decision step (reading the moment, value, urgency, scope), then the content.
- **One structured call returns the whole ladder for a reply**: every level written at once, so switching level is instant. This mod copies that exactly.
- Reading the moment uses Mac signals: calendar, the typed or spoken prompt, trackpad and pointer movement. Luis is training a small local model for this step.
- A local Node server on port 4747 holds the rule and broadcasts to every surface (Mac app, iPad, home object).

### How it shows a reply
- **The ladder:** the reply sits next to the level marks and is centred on them. Luis likes this a lot. He scrolls through levels by swiping up or down (natural macOS direction) with trackpad haptic feedback.
- **The less it says, the larger it says it.** Indicate is a small token, Show is one line at display size, Explain is a sentence, Elaborate is the full answer.
- **Text rules he set (Nov 25):**
  - One left edge for every level. Only the measure (line length) changes.
  - Two type sizes per reply: the level's size, plus one small size for the question, links and sources.
  - Neue Haas. Display cut tracked tight only for big type, Text cut with normal tracking for reading.
  - **Every level shows different content.** A level is not the previous level with words cut off.
  - Dive-deeper links stay inside the text with their arrow. The row under the reply holds only sources.
- **Arrival:** text forms out of blur and noise into its final layout before it becomes sharp. One smooth motion, no scaling or stretching of letters. The thinking state is motion with depth that is not legible, which then forms into the sentence.
- **Never:** indicators of sensed state, attention or "why" on the interface. Grey text. AI clichés (glowing orb, shimmer, spinner, three typing dots, radial dot marks). Colour on surfaces.

### The design world (laws)
1. Focus is the operation. Sharp means read this, soft means you don't need to. Text never rests half blurred.
2. One entity. One agent, one mark, many mediums.
3. The less it says, the larger it says it.
4. One medium at a time.
5. Meanings never change.
6. Correction costs one action, up or down.
7. Calm by default. Only "needs you" gets a fast onset.
8. Monochrome, with deep teal (#013845) only in the focus falloff.

Motion timings from the system: focus changes 0.55 s ease out, releases 1.2 to 1.6 s, ambient drift 6 to 8 s, "needs you" 120 ms. Refocusing takes the eye about half a second, so racks sit near that.

Visual taste: minimal, monochrome, soft light, fog and steel, one precious object, depth from layered focus and grain, plain neo-grotesk in sentence case. Not big heavy UI. References: Cosmos boards `cosmos.so/luissoma` ("focus" for motion, "graphic" for type), Dongkyu Lee (dongkyulee.com) for clean motion broken into simple continuous interactions.

---

## 4. What exists in this repo today (v0.1)

- `plugin/` is a Claude Code plugin with **settings hooks**: `SessionStart` gives Claude the levels, `UserPromptSubmit` adds one `<attention>` line with the cap. It is instructions only: Claude is asked to follow a level and can miss.
- `plugin/lib/decide.mjs`: the rule. `plugin/lib/moment.mjs`: reads the moment (manual state, an engine URL, a call app in front, prompt length, asks, corrections). `plugin/lib/context.mjs`: the text Claude reads. `plugin/spec/levels.md`: the one source for the level definitions.
- `plugin/commands/set.md`: `/attention:set busy` and friends.
- `plugin/skills/levels/`: a fallback skill for hosts without hooks.
- `test/`: 12 tests for the rule and the hook. `npm test`.

The mod replaces the settings hooks for Claude Code. Keep `plugin/hooks/codex.json` and the shared `lib/` working for Codex.

---

## 5. What the mod must do

### 5.1 Claude writes every final answer as a ladder

Use `prompt.section` (or `prompt.compose`) to add one stable section to the system prompt, not a per-message context line. Stable text keeps the prompt cache intact. Base it on `plugin/spec/levels.md` and add the format.

Proposed format, smallest first so the chosen level can show as soon as it is written:

```
<ladder fits="show">
<indicate>3 tests failing.</indicate>
<show>3 parser tests fail on empty input since the last commit.</show>
<explain>...</explain>
<elaborate>...</elaborate>
</ladder>
```

Rules for Claude:
- Only the **final message of a turn** is a ladder. Short narration between tool calls ("Reading the config") stays plain.
- `fits` is Claude's own judgment of the lowest level that fully answers. This is the value and scope side of the rule. The mod supplies the attention side.
- **Every level is different content, not a truncation.** Indicate is the state. Show is the answer itself (a value, a name, a command). Explain adds the one reason that matters. Elaborate is the full answer.
- Scope: if there is less to say, leave levels out. A yes/no question may have only Indicate and Show. Missing levels are simply not offered.
- If the answer *is* code or a command, Show is that code or command.
- Risks, errors, irreversible actions and consent requests appear in every level that exists, plainly.
- Never mention the ladder, the levels or attention.

Verify early whether Claude follows this reliably across long agentic turns. If it breaks the format, the mod shows the reply as it is (see 5.6).

### 5.2 The mod shows one level and holds the rest

- Hook `ui.render` on `AssistantMessage`. Parse the reply's text. If it holds a ladder, draw only the chosen level (with `Markdown`) and the ladder control. Otherwise call `next(e)` and leave it alone.
- **Chosen level = min(`fits`, attention cap)**, unless the person already moved this reply, or an explicit ask in the prompt overrides.
- The full ladder stays in the transcript, so Claude keeps the whole answer in its context and "what did you mean by X" still works.
- Keep the chosen level per message id in `$.state` so redraws are cheap and survive a module reload.
- While streaming: show the thinking state until the chosen level's closing tag arrives, then show that level while the deeper levels keep streaming in the background. **Verify how `AssistantMessage` re-renders during streaming first.** This decides whether smallest-first pays off.

### 5.3 More or less inside the reply

One action, up or down, instant, no new turn, no tokens.

- **Inside the reply:** a small ladder control beside or under the reply. In the Desktop app a `Button` or a pressable mark per level. Pressing a level shows it at once.
- **From the keyboard:** the `AbovePrompt` band. A digit `hotkey` on a band button fires when the person types that digit alone into an empty prompt and pauses. Map 1 to 4 to Indicate to Elaborate for the latest reply. Luis does not want people to rely on keyboard shortcuts, so the keys are a convenience, not the main way.
- **By word:** "more" and "less" as a typed prompt should still work. Catch them in `prompt.submit` and answer with `{ drop }` plus a level change, so no turn starts and no tokens are spent.
- Every change is a **correction**: record it (see 5.4).
- Levels that don't exist for this reply can't be chosen.

Design note: in his Mac app the reply is centred on the level marks and you move through them by scrolling. Mirror that relationship (the marks and the text belong together), within what the terminal and the Desktop app can draw.

### 5.4 Attention from context, no manual setting

The mod reads the moment itself. The person never has to set anything. `/attention:set` stays only as a hidden override.

Signals, strongest first:
1. **Luis's engine, if running.** `ATTENTION_ENGINE` URL, `GET /moment` returns `{ attention: 0..1, others?: bool, reasons?: [] }`. This is where his local moment model plugs in, so the mod and the Mac app read the same moment. Already supported in `lib/moment.mjs`.
2. **How you write** (`prompt.submit`, `prompt.edit`):
   - Length and detail of the message. Pasted logs and code count as neutral.
   - Explicit asks ("quick", "one word", "walk me through it", "explain").
   - Composing time and pace, from `prompt.edit`: a two-word prompt typed in two seconds is a different moment from a paragraph written over two minutes.
3. **Pace** (`turn.complete` to `prompt.submit`): a quick follow-up right after an answer means you are in flow and reading fast, so keep it tight. A long careful pause means room.
4. **Absence** (`turn.complete` plus idle time from `$.process.run('ioreg', ...)` HIDIdleTime, and whether the terminal or Desktop app is frontmost via `lsappinfo`): if Claude finished a long task while you were away, the result waits at Indicate until you are back. When you return, it opens at the chosen level.
5. **Your Mac:** a call app in front (Zoom, Teams, FaceTime, Webex), screen sharing (treat as others nearby), a calendar event right now.
6. **Fatigue:** long sessions and many turns lower attention slowly (ties to the LLM fatigue literature).
7. **Your corrections:** per session and slowly across sessions (in `$.store`, per project). If you keep pulling up, it starts higher. If you keep cutting, it starts lower.

Optional, only if it is fast enough to feel instant: `$.model.classify` with a small model on the prompt and recent turns, as a second opinion on attention.

**Privacy and readability:** all sensing stays on the machine. Nothing about the person is shown on the interface (Luis's rule). But the sensing state must be readable on demand (Noé Zufferey's privacy point in Study 3): add `/attention why`, which shows in plain words what the mod read for the last reply and why it chose that level.

### 5.5 Visual language: aligning with the Mac app

The terminal has one font, one size and no blur. The Desktop Code tab has a bit more (`Svg`, hover). Translate the laws, don't imitate the pixels.

| Mac app | Terminal | Desktop Code tab |
|---|---|---|
| The less it says, the larger it says it | Weight and space instead of size. Indicate and Show set in bold with air around them; Explain and Elaborate in regular. No type tricks that hurt reading. | Same, plus try an `Svg` text line at display size for Indicate and Show (check whether Neue Haas renders if installed). |
| One left edge, only the measure changes | Every level starts at the same column. Short levels get a short measure. | Same. |
| Two sizes per reply | One size: use bold for the level, normal for the small things (sources, links). | Same. |
| Focus: arrival out of blur and noise | No blur. Explore a density-noise resolve (a few frames of `░ ▒` settling into the text) with the `Client` element, and a plain in-place swap as the baseline. Avoid "hacker" letter scramble. Calm, around 0.5 s. | `Svg` with blur and noise filters can rack a short level into focus. |
| The ring as the agent | Replace the `Spinner` text with the ring in type: `◌` (soft, out of focus) to `○` (sharp) to `◯` (larger level) to `●` (heavy, needs you). The shape never changes, only focus, size and weight. | Draw the actual ring in `Svg`: thick stroke, blur on one side, grain. Use it for the spinner and in the band. |
| The ladder (level marks) | Four short marks, the current one heavy. Show 2 to 3 options at real size and let Luis pick. | Same, pressable, with labels only on hover. |
| No grey text | Don't use `dimColor` for content. Held levels are simply not shown. | Same. |
| No indicators of sensing | Nothing on screen about attention. `/attention why` only. | Same. |
| Calm by default | No flashing, no colour. Monochrome only. | Deep teal only inside the ring's falloff, if at all. |

Luis judges by looking at the real thing. **For every visual decision, build two or three options and show them at real size in a live session.** Don't pick for him on taste.

### 5.6 Fallbacks and edge cases

- No ladder in the reply (format broken, old message, short narration): draw it unchanged.
- Partial or malformed ladder: show the levels that parsed and offer only those.
- `claude -p`, Agent SDK and cloud sessions: hooks run but nothing is drawn. The ladder tags would show raw. Use `session.append` or another route to keep only the chosen level visible there, or turn the ladder instruction off when `$.session.surfaces()` shows no drawing surface.
- Subagents: only the main conversation's final answers get a ladder.
- Compaction: the ladder section must survive `/compact`; state reloads after `/clear`, `/resume` and `/branch` (`classic.SessionStart`).
- Off switch: `/attention:set off` turns the ladder instruction and the drawing off together.

---

## 6. How to build it

### Files

```
plugin/
  .claude-plugin/plugin.json   add "types": "./types/index.d.ts"
  hooks/hooks.json             { "modules": ["./mod/register.js"] }  (drop the settings hooks for Claude Code)
  hooks/codex.json             unchanged, for Codex
  mod/register.js              the hooks module
  mod/ladder.js                parse and pick levels
  mod/moment.js                context signals for the mod
  mod/render.js                element trees for terminal and Desktop
  mod/*.test.ts                claude plugin test
  types/index.d.ts             PluginState declarations
  lib/                         shared with Codex: decide.mjs, moment.mjs, context.mjs
  spec/levels.md               the one source for the levels
```

Check early that the hooks module can import from `plugin/lib/`. If not, copy what's needed and keep `decide.mjs` as the single source with a build step.

### Events and API you will use
- `prompt.section`: the ladder instruction in the system prompt.
- `prompt.submit`: read the prompt, catch "more" and "less", add a short cap line as `context` if needed.
- `prompt.edit`: composing time and pace.
- `turn.start`, `turn.complete`: pace, duration, absence.
- `ui.render` on `AssistantMessage`, `AbovePrompt`, `Spinner`.
- `$.state` (per-message level), `$.store` (learned bias per project), `$.process.run` (`ioreg`, `lsappinfo`), `$.http.fetch` (engine), `$.command.register` (`/attention why`).
- Optional: `$.model.classify`, `$.audio.play` (only later, one medium at a time).

### Order
1. **Verify** (a few hours, no design yet): how `AssistantMessage` re-renders while streaming; whether a `Markdown` tree can replace a reply; whether `Button`s inside a reply are pressable in the terminal and in Desktop; band digit hotkeys; imports from `lib/`; what `ui.render` gives for long replies.
2. **Ladder in, one level out:** the prompt section, the parser, drawing the chosen level. No controls, no styling.
3. **Correction:** the ladder control, band keys, "more" and "less" without a turn, corrections recorded.
4. **Attention from context:** the signals in 5.4, `/attention why`, the engine hook-up.
5. **Visual pass:** ring in the spinner and band, the level marks, arrival motion, type rules. Options at real size, Luis picks.
6. **Ship v0.2:** tests, README (install, what it reads, privacy, limits), a short screen recording for the GitHub page.

### Testing
- `claude plugin validate ./plugin` and `claude plugin test ./plugin` on every change.
- Unit tests for the parser (full, partial, malformed, missing levels, code-only answers), the rule, and every attention signal.
- `claude --plugin-dir ./plugin` for live work. It reloads on save.
- Try it in the terminal and in the Desktop Code tab. Luis mainly judges in the one he uses most: ask him.

---

## 7. Done means

- Ask a short question: the reply opens at Show or below, and stepping up shows a different, fuller answer instantly, with no new turn.
- Ask for a walkthrough: it opens at Elaborate.
- Claude works ten minutes while Luis is away: the result waits small, and opens at the right level when he is back.
- In a Zoom call: replies open lower than outside it, with no setting touched.
- Pull up three times in a session: the next replies start higher.
- Code and file edits are never shortened.
- Nothing on screen talks about attention. `/attention why` explains the last choice in plain words.
- No grey text, no colour, no spinner cliché. The ring and the ladder read as the same family as the Mac app.
- `npm test`, `claude plugin validate` and `claude plugin test` pass.

---

## 8. Working with Luis

- **Writing:** clear, calm, direct. Short sentences, simple words. No em dashes, no hype, no Oxford comma.
- **Iteration:** he judges by using the real thing. Ship working builds, try them yourself first, then show him.
- **Asking:** ask only when it is his call (taste, direction), and then show options at real size. Otherwise decide and say what you decided.
- **Changes:** don't make changes he didn't ask for. Keep old code tracked, don't delete it. Commit in small steps.
- **Drift:** he redirects bluntly when the framing drifts. Take it as information and fix it.
- Never frame the work around "more" ("say more when it matters"). Frame it as the right level plus easy correction, up or down.

---

## 9. Open questions for Luis

1. Terminal or Desktop Code tab first? The visual ceiling is higher in Desktop.
2. Where does the ladder control live: beside the reply, under it, or only in the band?
3. Should narration between tool calls also adapt at low attention (folded away), or stay as Claude Code draws it?
4. Elaborate always written, or only written when someone steps up to it (cheaper, but costs a turn)?
5. Does the ring appear in Claude Code at all, or is that reserved for his own system?
