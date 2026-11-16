# Verification

Checked in Chromium on 16 November 2026.

- 32 browser control checks passed: all appearance, motion, style and source filters; tags; multi-word search; empty-state reset; all four sorts; saved skins; light/dark switching; detail views; sampler; install guide; all 74 download links and 78 source links.
- 16 headless checks passed with networking disabled and the page opened through file://. Results are in verification.json.
- All 74 live mock previews and four image previews loaded. No console or runtime errors.
- Downloaded JSON matched the original file byte for byte.
- Layout checked at 360, 768, 1024 and 1440 pixels. No horizontal overflow.
- Native dialogs keep keyboard focus inside, close with Escape, and return focus to the opener.
- Reduced-motion mode pauses all 39 animated live previews until requested. The remaining animated catalog entry has a static screenshot.
- Local fonts, previews, saved skins and downloads work offline.

Review images: desktop-review.png and mobile-review.png.

The original data, skin files, assets and preview files are unchanged. preview-documents.js contains copies of the supplied previews with a correction to the mock workspace layout and reduced-motion styles. skin-files.js contains the original JSON text, used for browser downloads that also work from file://.
