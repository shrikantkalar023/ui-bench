# ui-bench

A frontend UI/UX benchmark for frontier LLMs. Each test case gives every model the same page and the same brief. Each model runs twice: once with Anthropic's [frontend-design skill](skills/frontend-design/SKILL.md), and once without any design skill. The site lets you switch models, turn the skill on or off, and compare the two side by side.

## Use the viewer

Live site: https://ui-bench-iota.vercel.app. Locally, open `index.html` through any static server.

- Pick a model in the top bar. "Original" shows the page before any redesign.
- **Design skill** switches between the run with the skill and the run without it.
- **Compare** shows the skill-off and skill-on runs side by side.
- **Mobile** renders the page in a 390 px frame.
- **Brief** shows the exact prompt and model settings.

Keys: `0` to `5` pick a model, `S` switches the skill, `C` compares, and `M` toggles the mobile frame. The URL hash keeps the current view, so you can share a link to it.

## Layout

- `bench.js` lists the models and test cases. The viewer reads only this file.
- `tests/<test>/prompt.md` is the brief every run received.
- `tests/<test>/original/` is the unchanged input.
- `tests/<test>/runs/<model>-skill/` and `runs/<model>-plain/` are the outputs. Each run started from a copy of `original/`.
- `skills/frontend-design/` is a copy of Anthropic's skill (Apache 2.0, see its `LICENSE.txt`).

## Run settings

| Model | Harness and model ID | Reasoning |
| --- | --- | --- |
| Fable 5.1 | Claude Code, `claude-fable-5-1` | high |
| Fable 5.2 | Claude Code, `claude-fable-5-2` | high |
| Opus 5.5 | Claude Code, `claude-opus-5-5` | high |
| Astra | Codex, `gpt-6-astra` | high |
| Sol | Codex, `gpt-6.1-sol` | high |

Each run was one agent session with no human edits to its output. A run with the skill was told to read and follow `skills/frontend-design/SKILL.md`. A run without the skill was told not to load any design skill.

## Add a test case

1. Put the input page in `tests/<id>/original/` and the brief in `tests/<id>/prompt.md`.
2. Copy `original/` to `runs/<model>-skill/` and `runs/<model>-plain/` for each model.
3. Run each model on its folder, then add the test to `bench.js`.

## Test case: T3 Code skins gallery

The input is a gallery of community T3 Code skins. The skin files, previews, and screenshots belong to their authors; see `tests/t3skins-gallery/original/SOURCES.md`. This project is not affiliated with T3 Tools.
