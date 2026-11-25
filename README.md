# Right Level

Agents that reply at the right level for the attention you have right now.

AI agents answer almost every moment the same way: a paragraph. Not because a paragraph fits every moment, but because language is cheap to produce. More and more agents will ask for our attention. Right Level is a small layer that lets them respect it.

It works with **Claude Code**, **Claude** (chat) and **Codex**. It does not need its own model. The agent still writes the words. Right Level decides how far it should go.

Part of my Master of Design thesis at UC Berkeley, *Worth the Attention*, on how personal agents can decide how much to say, when and in what form.

## The levels

Four levels with fixed meanings. Adaptation changes which level is chosen, never what a level means.

| Level | What you get |
|---|---|
| **Indicate** | One word or a short phrase. "Done." "3 tests failing." |
| **Show** | One line with the answer itself. A value, a name, a command. |
| **Explain** | The answer plus the one reason that matters. One to three sentences. |
| **Elaborate** | The full answer, with structure where it helps. |

## The rule

- **Value sets how far.** What the answer is worth to you now, and how much there is to say.
- **Attention caps it.** What you can give right now.
- **The lower one wins.** When you asked, the cap lifts one step, because you already gave attention.
- **Your asks win.** "Quick", "one word" or "walk me through it" override the guess.
- **Correction is one word.** Say `more` or `less` and the same answer comes back one level up or down. Corrections also teach the session where to start.
- **The work is never cut.** Code, files, commands and documents stay complete. Only what the agent says to you adapts. Risks and requests for consent are never cut either.

## Install

### Claude Code

```
/plugin marketplace add luis-soma/right-level
/plugin install right-level@right-level
```

Set how much attention you have, or leave it on auto:

```
/right-level:attention busy            absorbed, busy, open or free
/right-level:attention busy --for 90m  default is 3 hours
/right-level:attention open --others   others can see your screen
/right-level:attention auto            back to reading the moment
/right-level:attention off
```

### Claude (chat)

Claude chat has no hooks, so it runs on the levels alone and reads the moment from how you ask.

- **Everywhere:** paste [`chat/preferences.md`](chat/preferences.md) into Settings, Profile, personal preferences.
- **One project:** paste it into the project's instructions.
- **As a skill:** zip [`chat/right-level`](chat/right-level) and upload it under Settings, Capabilities, Skills.

### Codex

**Codex CLI:** clone this repo, then copy [`codex/hooks.example.json`](codex/hooks.example.json) into `~/.codex/hooks.json` with your clone's path. Open `/hooks` in Codex once to review and trust them.

**Codex app:** the [`plugin`](plugin) folder is also a Codex plugin (`plugin.json`, `hooks/codex.json`). Codex only runs plugin hooks for plugins installed manually in the desktop app:

```
codex plugin marketplace add luis-soma/right-level
```

Then install Right Level from the Plugins Directory in the app and trust its hooks.

To set your attention for Codex, run the same command from a terminal:

```
node /path/to/right-level/plugin/scripts/attention.mjs busy
```

## How it reads the moment

Strongest first:

1. **What you set** with the attention command. It holds until it expires.
2. **Your own engine**, if you have one. Set `RIGHT_LEVEL_ENGINE=http://localhost:4747` and answer `GET /moment` with `{ "attention": 0.0-1.0, "others": false, "reasons": ["in a lecture"] }`. Anything that knows your situation can plug in here: a calendar, a wearable, a model.
3. **Your Mac.** A call app in front (Zoom, Teams, FaceTime, Webex) lowers attention. No permissions needed.
4. **How you ask.** A two-word message asks for a short answer. A long careful message gives room. Pasted logs and code count as neutral.

Each message then carries one short line for the model, such as:

```
Moment: Busy (0.30): very short message. Cap: Explain (one step above Show, because they asked).
```

The model never mentions it. Nothing leaves your machine except that line, sent to the agent you already use. State lives in `~/.right-level`.

## Limits

This is the instructions-only version. The model is asked to follow the level, so it can miss. Claude Code mods can do more: keep the full answer, show it at the chosen level and step up or down without a new turn. That is the next step.

## Develop

```
npm test                    run the rule and hook tests
node tools/build-chat.mjs   rebuild the chat files from plugin/spec/levels.md
claude plugin validate ./plugin
```

The levels live in one file, [`plugin/spec/levels.md`](plugin/spec/levels.md). Every host reads from it.

## Lineage

Horvitz 1999 (mixed-initiative interfaces), Wickens' SEEV model (salience, effort, expectancy, value), Iqbal and Horvitz 2007, Mark et al. 2008, Ju and Leifer 2008, Bakker et al. 2014.

## License

MIT, Luis Somasundaram
