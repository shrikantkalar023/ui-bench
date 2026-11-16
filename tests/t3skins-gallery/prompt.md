# Task: redesign the T3 Code skins gallery

The folder you own contains a working, self-contained gallery of community T3 Code skins.
`index.html` already has the right content, intent, and core functionality: search, filters,
sort, live iframe previews of each skin in a mock T3 Code UI, dark/light switching, a details
view, and JSON downloads.

Redesign `index.html`. Improve its design, UI, and UX. You may also improve its functionality
where that helps people find, compare, preview, and install skins.

## Constraints

- Edit only inside your folder. The main file stays `index.html`. You may add CSS, JS, or image files in the folder.
- Do not change `data.js`, `data.json`, `skins/`, `previews/`, or `assets/`. Read them to learn the data.
- Static site, no build step, no framework install. It must work from a static file server and from `file://`.
- Web fonts from a CDN are allowed. The page must still be usable when they fail to load.
- Keep every skin, every link, the install guidance, and the source credits. Do not invent data.
- Responsive down to 360 px wide. Keyboard accessible. Respect `prefers-reduced-motion`.
- Do not mention your model name, vendor, or this benchmark anywhere in the page.

## Done means

- `index.html` loads with no console errors and all skins render.
- Every filter, sort, search, preview mode switch, details view, and download still works.
- You checked the result yourself in a browser or headless browser at desktop and mobile widths, if your environment allows it.

End your reply with a short list of the design choices you made and any functionality you added.
