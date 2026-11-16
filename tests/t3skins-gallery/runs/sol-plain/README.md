# T3 Code skins gallery

A self-contained, offline gallery of community T3 Code skins shared after the app became fully customisable (Theo’s announcement on **14 Nov 2026, 9:41 AM IST**: https://x.com/theo/status/2121455838414201200).

Open `index.html` in a browser. No server is required. Animated skins play their real theme CSS inside a mock T3 Code UI.

## Install a skin in T3 Code

1. Download the skin’s `.json` from a card (or copy it from `skins/`).
2. In T3 Code, open **Settings → Appearance**, press **Add**, and drop the file in.
3. Or, on the machine running the T3 server: `t3 theme set path/to/skin.json`.

To undo: pick another theme in Appearance, or run `t3 theme set t3-chat`.

## What’s in this folder

- `index.html` — the gallery
- `data.js` / `data.json` — catalog metadata
- `skins/` — public theme JSON files
- `previews/` — live mock-UI previews (one HTML file per skin and appearance)
- `assets/` — screenshots for X posts that had no public JSON
- `SOURCES.md` — every source, grouped

This is a personal compilation for local preview, not an official T3 product. Theme files remain copyright of their authors; use their repos for licence terms. Previews use a simplified mock of the T3 Code chrome, not the app itself.
