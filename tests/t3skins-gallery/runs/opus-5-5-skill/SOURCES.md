# Sources for the T3 Code skins gallery

Compiled on 16 Nov 2026 for Shrikant Kalar. Times below are in Asia/Calcutta (IST).
Nothing here is fabricated: every skin is tied to a public page, API record, git repo, or X post.

## Totals

- **78 skins** in the gallery
- 41 from t3skins.dev
- 33 additional from GitHub (not already counted on t3skins.dev, except companions such as Pixel-Koi Pond Light)
- 4 X-only shares with no public theme file found
- 74 include a downloadable JSON file
- 40 detected as animated (CSS `@keyframes` / `@property` / `animation`, or an explicit animated tag / video share)
- 69 ship custom CSS

## Official / product context

- T3 Code announcement of in-app UI customisation, including asking an agent to restyle the app: [Theo, 14 Nov 2026, 9:41 AM IST](https://x.com/theo/status/2121455838414201200) (5,149 likes at the time of capture).
- Theme format and custom CSS rules (no remote `url()`, use `data-` selectors, `t3 theme set`): [docs/user/appearance.md](https://github.com/pingdotgg/t3code/blob/main/docs/user/appearance.md).
- Custom CSS + agent theme tools: [pingdotgg/t3code PR #35247](https://github.com/pingdotgg/t3code/pull/35247).

## t3skins.dev

- Site: https://www.t3skins.dev/
- Public JSON API (used to list every skin): https://www.t3skins.dev/api/skins?perPage=100
- Upload: https://www.t3skins.dev/upload
- Launch post by Sotiris Kaniras ([@itssotsot](https://x.com/itssotsot/status/2122052122598674630)), 16 Nov 2026, 1:10 AM IST, 173 likes.
- I did not find a public GitHub repo for the site itself (it is a Next.js app on Vercel). Individual skins are at `https://www.t3skins.dev/skins/{slug}`, JSON at `/skins/{slug}/skin.json`, live official preview at `/skins/{slug}/preview?live=1`.
- A HEAD request to the bare host without a normal browser User-Agent can return a Next.js 404 shell; `https://www.t3skins.dev/` with a normal UA, and the API, work.
- There is no sitemap.xml.

Skins on t3skins.dev, newest first in the API at capture:

- **Gotham Noir** · by Fayeque Peerzade · 16 Nov 2026, 07:33 PM IST. dark · animated, custom CSS, `skins/gotham-noir.json`. [t3skins.dev](https://www.t3skins.dev/skins/gotham-noir) · [Download JSON](https://www.t3skins.dev/skins/gotham-noir/download) · [Live official preview](https://www.t3skins.dev/skins/gotham-noir/preview?live=1)
- **Stillwater** · by Kayzel · 16 Nov 2026, 06:53 PM IST. dark, light · animated, custom CSS, `skins/stillwater.json`. [t3skins.dev](https://www.t3skins.dev/skins/stillwater) · [Download JSON](https://www.t3skins.dev/skins/stillwater/download) · [Live official preview](https://www.t3skins.dev/skins/stillwater/preview?live=1)
- **Minimalist color edges** · by rgrvlsk · 16 Nov 2026, 06:37 PM IST. light, dark · custom CSS, `skins/minimalist-color-edges.json`. [t3skins.dev](https://www.t3skins.dev/skins/minimalist-color-edges) · [Download JSON](https://www.t3skins.dev/skins/minimalist-color-edges/download) · [Live official preview](https://www.t3skins.dev/skins/minimalist-color-edges/preview?live=1)
- **Vercel** · by Hüsam 🥑 · 16 Nov 2026, 05:31 PM IST. dark · custom CSS, `skins/vercel.json`. [t3skins.dev](https://www.t3skins.dev/skins/vercel) · [Download JSON](https://www.t3skins.dev/skins/vercel/download) · [Live official preview](https://www.t3skins.dev/skins/vercel/preview?live=1)
- **Telemetry** · by xayot.dmg · 16 Nov 2026, 04:30 PM IST. dark · custom CSS, `skins/telemetry.json`. [t3skins.dev](https://www.t3skins.dev/skins/telemetry) · [Download JSON](https://www.t3skins.dev/skins/telemetry/download) · [Live official preview](https://www.t3skins.dev/skins/telemetry/preview?live=1)
- **Spider** · by bzhsf · 16 Nov 2026, 03:33 PM IST. dark · custom CSS, `skins/spider.json`. [t3skins.dev](https://www.t3skins.dev/skins/spider) · [Download JSON](https://www.t3skins.dev/skins/spider/download) · [Live official preview](https://www.t3skins.dev/skins/spider/preview?live=1)
- **Drafting Table** · by Unknown · 16 Nov 2026, 01:43 PM IST. dark, light · custom CSS, `skins/drafting-table.json`. [t3skins.dev](https://www.t3skins.dev/skins/drafting-table) · [Download JSON](https://www.t3skins.dev/skins/drafting-table/download) · [Live official preview](https://www.t3skins.dev/skins/drafting-table/preview?live=1)
- **Aurora Sky** · by Yash Mahajan · 16 Nov 2026, 01:35 PM IST. dark, light · animated, custom CSS, `skins/aurora-sky.json`. [t3skins.dev](https://www.t3skins.dev/skins/aurora-sky) · [Download JSON](https://www.t3skins.dev/skins/aurora-sky/download) · [Live official preview](https://www.t3skins.dev/skins/aurora-sky/preview?live=1)
- **Orng Dither** · by Khushal · 16 Nov 2026, 12:52 PM IST. dark, light · custom CSS, `skins/orng-dither.json`. [t3skins.dev](https://www.t3skins.dev/skins/orng-dither) · [Download JSON](https://www.t3skins.dev/skins/orng-dither/download) · [Live official preview](https://www.t3skins.dev/skins/orng-dither/preview?live=1)
- **Pixel Orbit Glass** · by xski · 16 Nov 2026, 12:48 PM IST. dark · animated, custom CSS, `skins/pixel-orbit-glass.json`. [t3skins.dev](https://www.t3skins.dev/skins/pixel-orbit-glass) · [Download JSON](https://www.t3skins.dev/skins/pixel-orbit-glass/download) · [Live official preview](https://www.t3skins.dev/skins/pixel-orbit-glass/preview?live=1)
- **Panda Syntax** · by MatiasCiccone · 16 Nov 2026, 08:50 AM IST. dark · `skins/panda-syntax.json`. [t3skins.dev](https://www.t3skins.dev/skins/panda-syntax) · [Download JSON](https://www.t3skins.dev/skins/panda-syntax/download) · [Live official preview](https://www.t3skins.dev/skins/panda-syntax/preview?live=1)
- **Visual Studio 2017** · by Blake Connally (@blakeconnall) · 16 Nov 2026, 08:47 AM IST. dark, light · custom CSS, `skins/visual-studio-2017.json`. [t3skins.dev](https://www.t3skins.dev/skins/visual-studio-2017) · [Download JSON](https://www.t3skins.dev/skins/visual-studio-2017/download) · [Live official preview](https://www.t3skins.dev/skins/visual-studio-2017/preview?live=1)
- **Tritium** · by Blake Connally (@blakeconnall) · 16 Nov 2026, 08:46 AM IST. dark · custom CSS, `skins/tritium.json`. [t3skins.dev](https://www.t3skins.dev/skins/tritium) · [Download JSON](https://www.t3skins.dev/skins/tritium/download) · [Live official preview](https://www.t3skins.dev/skins/tritium/preview?live=1)
- **Vitesse Nyx Emerald** · by Liam · 16 Nov 2026, 07:13 AM IST. dark · custom CSS, `skins/vitesse-nyx-emerald.json`. [t3skins.dev](https://www.t3skins.dev/skins/vitesse-nyx-emerald) · [Download JSON](https://www.t3skins.dev/skins/vitesse-nyx-emerald/download) · [Live official preview](https://www.t3skins.dev/skins/vitesse-nyx-emerald/preview?live=1)
- **Pixel-Koi Pond** · by kanigaraa · 16 Nov 2026, 04:32 AM IST. dark · animated, custom CSS, `skins/pixel-koi-pond.json`. [t3skins.dev](https://www.t3skins.dev/skins/pixel-koi-pond) · [Download JSON](https://www.t3skins.dev/skins/pixel-koi-pond/download) · [Live official preview](https://www.t3skins.dev/skins/pixel-koi-pond/preview?live=1)
- **Starry Ridge** · by DeepExtrema · 16 Nov 2026, 04:07 AM IST. dark · animated, custom CSS, `skins/starry-ridge.json`. [t3skins.dev](https://www.t3skins.dev/skins/starry-ridge) · [Download JSON](https://www.t3skins.dev/skins/starry-ridge/download) · [Live official preview](https://www.t3skins.dev/skins/starry-ridge/preview?live=1)
- **JetBrains Islands** · by Blake Connally · 16 Nov 2026, 03:25 AM IST. dark, light · custom CSS, `skins/jetbrains-islands.json`. [t3skins.dev](https://www.t3skins.dev/skins/jetbrains-islands) · [Download JSON](https://www.t3skins.dev/skins/jetbrains-islands/download) · [Live official preview](https://www.t3skins.dev/skins/jetbrains-islands/preview?live=1)
- **T3 Aurora** · by jimg4 · 16 Nov 2026, 03:04 AM IST. dark, light · animated, custom CSS, `skins/t3-aurora.json`. [t3skins.dev](https://www.t3skins.dev/skins/t3-aurora) · [Download JSON](https://www.t3skins.dev/skins/t3-aurora/download) · [Live official preview](https://www.t3skins.dev/skins/t3-aurora/preview?live=1)
- **Firefly Dream** · by Dev Gupta · 16 Nov 2026, 02:37 AM IST. dark · animated, custom CSS, `skins/firefly-dream.json`. [t3skins.dev](https://www.t3skins.dev/skins/firefly-dream) · [Download JSON](https://www.t3skins.dev/skins/firefly-dream/download) · [Live official preview](https://www.t3skins.dev/skins/firefly-dream/preview?live=1)
- **Ember Blade** · by Unknown · 16 Nov 2026, 02:35 AM IST. dark · animated, custom CSS, `skins/ember-blade.json`. [t3skins.dev](https://www.t3skins.dev/skins/ember-blade) · [Download JSON](https://www.t3skins.dev/skins/ember-blade/download) · [Live official preview](https://www.t3skins.dev/skins/ember-blade/preview?live=1)
- **Orange Space** · by vertopolkaLF · 16 Nov 2026, 02:30 AM IST. dark · animated, custom CSS, `skins/orange-space.json`. [t3skins.dev](https://www.t3skins.dev/skins/orange-space) · [Download JSON](https://www.t3skins.dev/skins/orange-space/download) · [Live official preview](https://www.t3skins.dev/skins/orange-space/preview?live=1)
- **Rainy Window** · by @BobzHolmes · 16 Nov 2026, 02:28 AM IST. light, dark · custom CSS, `skins/rainy-window.json`. [t3skins.dev](https://www.t3skins.dev/skins/rainy-window) · [Download JSON](https://www.t3skins.dev/skins/rainy-window/download) · [Live official preview](https://www.t3skins.dev/skins/rainy-window/preview?live=1)
- **Little Guardian** · by Wesley Smits · 16 Nov 2026, 02:21 AM IST. dark · animated, custom CSS, `skins/little-guardian.json`. [t3skins.dev](https://www.t3skins.dev/skins/little-guardian) · [Download JSON](https://www.t3skins.dev/skins/little-guardian/download) · [Live official preview](https://www.t3skins.dev/skins/little-guardian/preview?live=1)
- **Nyx** · by Deepu · 16 Nov 2026, 01:51 AM IST. dark · custom CSS, `skins/nyx.json`. [t3skins.dev](https://www.t3skins.dev/skins/nyx) · [Download JSON](https://www.t3skins.dev/skins/nyx/download) · [Live official preview](https://www.t3skins.dev/skins/nyx/preview?live=1)
- **Paper Lantern** · by itssotsot · 16 Nov 2026, 01:32 AM IST. light · custom CSS, `skins/paper-lantern.json`. [t3skins.dev](https://www.t3skins.dev/skins/paper-lantern) · [Download JSON](https://www.t3skins.dev/skins/paper-lantern/download) · [Live official preview](https://www.t3skins.dev/skins/paper-lantern/preview?live=1)
- **Fjord** · by itssotsot · 16 Nov 2026, 01:32 AM IST. dark · animated, custom CSS, `skins/fjord.json`. [t3skins.dev](https://www.t3skins.dev/skins/fjord) · [Download JSON](https://www.t3skins.dev/skins/fjord/download) · [Live official preview](https://www.t3skins.dev/skins/fjord/preview?live=1)
- **Matcha** · by itssotsot · 16 Nov 2026, 01:32 AM IST. light, dark · custom CSS, `skins/matcha.json`. [t3skins.dev](https://www.t3skins.dev/skins/matcha) · [Download JSON](https://www.t3skins.dev/skins/matcha/download) · [Live official preview](https://www.t3skins.dev/skins/matcha/preview?live=1)
- **Solar Flare** · by itssotsot · 16 Nov 2026, 01:32 AM IST. dark · animated, custom CSS, `skins/solar-flare.json`. [t3skins.dev](https://www.t3skins.dev/skins/solar-flare) · [Download JSON](https://www.t3skins.dev/skins/solar-flare/download) · [Live official preview](https://www.t3skins.dev/skins/solar-flare/preview?live=1)
- **Blueprint** · by itssotsot · 16 Nov 2026, 01:32 AM IST. dark · custom CSS, `skins/blueprint.json`. [t3skins.dev](https://www.t3skins.dev/skins/blueprint) · [Download JSON](https://www.t3skins.dev/skins/blueprint/download) · [Live official preview](https://www.t3skins.dev/skins/blueprint/preview?live=1)
- **Rosé** · by itssotsot · 16 Nov 2026, 01:32 AM IST. light · custom CSS, `skins/rose.json`. [t3skins.dev](https://www.t3skins.dev/skins/rose) · [Download JSON](https://www.t3skins.dev/skins/rose/download) · [Live official preview](https://www.t3skins.dev/skins/rose/preview?live=1)
- **Midnight Mono** · by itssotsot · 16 Nov 2026, 01:32 AM IST. dark · custom CSS, `skins/midnight-mono.json`. [t3skins.dev](https://www.t3skins.dev/skins/midnight-mono) · [Download JSON](https://www.t3skins.dev/skins/midnight-mono/download) · [Live official preview](https://www.t3skins.dev/skins/midnight-mono/preview?live=1)
- **Lagoon** · by itssotsot · 16 Nov 2026, 01:32 AM IST. dark · animated, custom CSS, `skins/lagoon.json`. [t3skins.dev](https://www.t3skins.dev/skins/lagoon) · [Download JSON](https://www.t3skins.dev/skins/lagoon/download) · [Live official preview](https://www.t3skins.dev/skins/lagoon/preview?live=1)
- **Sandstone** · by itssotsot · 16 Nov 2026, 01:32 AM IST. light, dark · custom CSS, `skins/sandstone.json`. [t3skins.dev](https://www.t3skins.dev/skins/sandstone) · [Download JSON](https://www.t3skins.dev/skins/sandstone/download) · [Live official preview](https://www.t3skins.dev/skins/sandstone/preview?live=1)
- **Arctic** · by itssotsot · 16 Nov 2026, 01:32 AM IST. light · custom CSS, `skins/arctic.json`. [t3skins.dev](https://www.t3skins.dev/skins/arctic) · [Download JSON](https://www.t3skins.dev/skins/arctic/download) · [Live official preview](https://www.t3skins.dev/skins/arctic/preview?live=1)
- **T3 Clawd** · by rohit3a · 16 Nov 2026, 01:13 AM IST. dark, light · animated, custom CSS, `skins/t3-clawd.json`. [t3skins.dev](https://www.t3skins.dev/skins/t3-clawd) · [Download JSON](https://www.t3skins.dev/skins/t3-clawd/download) · [Live official preview](https://www.t3skins.dev/skins/t3-clawd/preview?live=1)
- **Your Deepest Darkest Black** · by Vaibhav Pathak (vkpdeveloper) · 16 Nov 2026, 01:01 AM IST. dark · `skins/your-deepest-darkest-black.json`. [t3skins.dev](https://www.t3skins.dev/skins/your-deepest-darkest-black) · [Download JSON](https://www.t3skins.dev/skins/your-deepest-darkest-black/download) · [Live official preview](https://www.t3skins.dev/skins/your-deepest-darkest-black/preview?live=1)
- **Neon Arcade** · by itssotsot · 16 Nov 2026, 12:54 AM IST. dark · animated, custom CSS, `skins/neon-arcade.json`. [t3skins.dev](https://www.t3skins.dev/skins/neon-arcade) · [Download JSON](https://www.t3skins.dev/skins/neon-arcade/download) · [Live official preview](https://www.t3skins.dev/skins/neon-arcade/preview?live=1)
- **Biscuit** · by itssotsot · 16 Nov 2026, 12:54 AM IST. dark · animated, custom CSS, `skins/biscuit.json`. [t3skins.dev](https://www.t3skins.dev/skins/biscuit) · [Download JSON](https://www.t3skins.dev/skins/biscuit/download) · [Live official preview](https://www.t3skins.dev/skins/biscuit/preview?live=1)
- **Matrix** · by itssotsot · 16 Nov 2026, 12:54 AM IST. dark · animated, custom CSS, `skins/matrix.json`. [t3skins.dev](https://www.t3skins.dev/skins/matrix) · [Download JSON](https://www.t3skins.dev/skins/matrix/download) · [Live official preview](https://www.t3skins.dev/skins/matrix/preview?live=1)
- **Nebula** · by itssotsot · 16 Nov 2026, 12:54 AM IST. dark · animated, custom CSS, `skins/nebula.json`. [t3skins.dev](https://www.t3skins.dev/skins/nebula) · [Download JSON](https://www.t3skins.dev/skins/nebula/download) · [Live official preview](https://www.t3skins.dev/skins/nebula/preview?live=1)
- **Pixel Pal** · by itssotsot · 16 Nov 2026, 12:54 AM IST. dark · animated, custom CSS, `skins/pixel-pal.json`. [t3skins.dev](https://www.t3skins.dev/skins/pixel-pal) · [Download JSON](https://www.t3skins.dev/skins/pixel-pal/download) · [Live official preview](https://www.t3skins.dev/skins/pixel-pal/preview?live=1)

## X

Searched the X archive from 10 Nov 2026 with queries covering `t3skins`, `t3skins.dev`, and T3 Code theme/skin posts, then fetched key posts by id (including quotes of Theo's announcement). The search API capped each page at 25 posts; two pages of the main query were read, plus a `from:theo` search and a direct id lookup. Some retweets were skipped in the first query (`-is:retweet`) and still appeared as retweet objects on later pages.

Notable posts:

- [Theo, 14 Nov 2026, 9:41 AM IST](https://x.com/theo/status/2121455838414201200) — customisation announcement, video demo.
- [Deepu / @Deepusleepy, 15 Nov 2026, 11:54 AM IST](https://x.com/Deepusleepy/status/2121851722977161534) — Introducing Nyx (425 likes), later [live on t3skins](https://x.com/Deepusleepy/status/2122063774064717997) and a [showcase video](https://x.com/Deepusleepy/status/2121884604760265107).
- [@itssotsot, 16 Nov 2026, 1:10 AM IST](https://x.com/itssotsot/status/2122052122598674630) — launched t3skins.dev.
- [@kanigaraafg, 16 Nov 2026, 4:46 AM IST](https://x.com/kanigaraafg/status/2122106372917690720) — Pixel Koi Pond live on t3skins, with video.
- [@haozhangzh, 16 Nov 2026, 2:11 AM IST](https://x.com/haozhangzh/status/2122067508777881665) — whack-a-mole theme; JSON is on GitHub as Tool Flow.
- [@nitesh_btc, 15 Nov 2026, 11:25 PM IST](https://x.com/nitesh_btc/status/2122025707895152971) — live Nasdaq / S&P / Bitcoin ticker theme. Video only; no JSON found.
- [@Libes66, 15 Nov 2026, 6:07 PM IST](https://x.com/Libes66/status/2121945694797697451) — gradient theme with flipped usage-limits. Post says a link is below, but only screenshots were attached; no JSON found.
- [@zwb44, 16 Nov 2026, 12:45 AM IST](https://x.com/zwb44/status/2122045867876135169) — work-in-progress pixel theme, screenshot only.
- [@YulDavr, 16 Nov 2026, 1:02 AM IST](https://x.com/YulDavr/status/2122050167348350986) — five light+dark themes (Orbit and others); files are in Dave93/t3code-themes.
- [@yachtyyachty, 16 Nov 2026, 1:48 PM IST](https://x.com/yachtyyachty/status/2122242925459550553) — screenshots quoting Theo; no theme file attached.

X-only entries in the gallery (no public JSON located):

- **Market ticker (untitled)** · by @nitesh_btc · 15 Nov 2026, 11:25 PM IST. dark · animated. [X post (video)](https://x.com/nitesh_btc/status/2122025707895152971)
- **Flipped usage + gradient (untitled)** · by @Libes66 · 15 Nov 2026, 06:07 PM IST. dark. [X post](https://x.com/Libes66/status/2121945694797697451)
- **Pixel WIP (untitled)** · by @zwb44 · 16 Nov 2026, 12:45 AM IST. dark. [X post](https://x.com/zwb44/status/2122045867876135169)
- **Quoted skins preview (untitled)** · by @yachtyyachty · 16 Nov 2026, 01:48 PM IST. dark. [X post](https://x.com/yachtyyachty/status/2122242925459550553)

## GitHub

Searched repositories created from 1 Nov and 10 Nov 2026 for T3 Code themes, then listed and downloaded theme JSON from each relevant repo. Repos whose only theme was already on t3skins.dev (for example `celeroncoder/t3code-orng-dither`, `DeepExtrema/t3code-starry-ridge`, and the dark Pixel-Koi Pond file) are cited here but not duplicated as extra gallery cards, except the light Koi companion which is not on t3skins.

Repos used for extra skins:

- [Dave93/t3code-themes](https://github.com/Dave93/t3code-themes) — Orbit, Canopy, Blueprint (Dave93), Sage Paper, Pixel Quest (Dave93)
- [Jonathon-Sherrouse/t3code-pixel-quest](https://github.com/Jonathon-Sherrouse/t3code-pixel-quest) — Pixel Quest
- [KevinXC5/t3code-claude-desktop-theme](https://github.com/KevinXC5/t3code-claude-desktop-theme) — Claude Desktop
- [Marve10s/t3code-dotted-gradient](https://github.com/Marve10s/t3code-dotted-gradient) — Dither Live — Dither, Dither Live — Streaks, Dither Live — Horizon, Dither Live — Flutes, Dither Live — Arcs, Dither Live — Ember, Dither Live — Dusk, Dither Live — Neon, Dither Live — Gold, Dither Live — Glint
- [MistanKh/t3code-groknight](https://github.com/MistanKh/t3code-groknight) — GrokNight
- [PeytonWDYM/t3code-space-night](https://github.com/PeytonWDYM/t3code-space-night) — Catppuccin Space Night
- [StivenKN/t3code-deep-field](https://github.com/StivenKN/t3code-deep-field) — Deep Field (pixel-art)
- [beardwhocodes/t3-themes](https://github.com/beardwhocodes/t3-themes) — Deep Field
- [haozhanghz/tool-flow-t3code](https://github.com/haozhanghz/tool-flow-t3code) — Tool Flow
- [kanigaraa/t3code-pixelkoi](https://github.com/kanigaraa/t3code-pixelkoi) — Pixel-Koi Pond Light
- [marcosotomac/t3code-themes](https://github.com/marcosotomac/t3code-themes) — Aurora Azul, Medianoche, Nebulosa, Vía Láctea
- [mark-vella/t3code-habamax](https://github.com/mark-vella/t3code-habamax) — Habamax
- [mr-karan/verdigris](https://github.com/mr-karan/verdigris) — Verdigris
- [mths-mcfs/t3code-yorha-theme](https://github.com/mths-mcfs/t3code-yorha-theme) — YoRHa
- [vatana7/t3code-bookshelf-themes](https://github.com/vatana7/t3code-bookshelf-themes) — Bookshelf Calm, Bookshelf Paper
- [wellbrained/t3code-stargazer](https://github.com/wellbrained/t3code-stargazer) — Stargazer

Other related GitHub sources (catalogues or already-on-t3skins):

- [Dwite/awesome-t3-code-themes](https://github.com/Dwite/awesome-t3-code-themes) (created 14 Nov 2026) — catalogue of many themes, including older Omarchy/Nous/Dracula palettes. Used as an index, not fully inlined, because most of those predate the CSS customisation wave.
- [SunkenInTime/t3-themes](https://github.com/SunkenInTime/t3-themes) / [t3themes.com](https://t3themes.com/) — older community colour-theme gallery with real-app photographs, active since August 2026. Useful context, not the 'last few days' set.
- [celeroncoder/t3code-orng-dither](https://github.com/celeroncoder/t3code-orng-dither) — source for Orng Dither, also on t3skins.dev.
- [DeepExtrema/t3code-starry-ridge](https://github.com/DeepExtrema/t3code-starry-ridge) — source for Starry Ridge, also on t3skins.dev.
- [kanigaraa/t3code-pixelkoi](https://github.com/kanigaraa/t3code-pixelkoi) — dark + light Pixel-Koi Pond. Dark is on t3skins.dev; light is in this gallery as an extra.
- [haozhanghz/tool-flow-t3code](https://github.com/haozhanghz/tool-flow-t3code) — also [posted on X](https://x.com/haozhangzh/status/2122067508777881665).

GitHub skins in the gallery:

- **Dither Live — Dither** · by Marve10s · 16 Nov 2026, 08:07 PM IST. dark · animated, custom CSS, `skins/dither-live-dither.json`. [GitHub](https://github.com/Marve10s/t3code-dotted-gradient) · [Theme JSON](https://raw.githubusercontent.com/Marve10s/t3code-dotted-gradient/main/themes/01-dither.json)
- **Dither Live — Streaks** · by Marve10s · 16 Nov 2026, 08:07 PM IST. dark · animated, custom CSS, `skins/dither-live-streaks.json`. [GitHub](https://github.com/Marve10s/t3code-dotted-gradient) · [Theme JSON](https://raw.githubusercontent.com/Marve10s/t3code-dotted-gradient/main/themes/02-streaks.json)
- **Dither Live — Horizon** · by Marve10s · 16 Nov 2026, 08:07 PM IST. dark · animated, custom CSS, `skins/dither-live-horizon.json`. [GitHub](https://github.com/Marve10s/t3code-dotted-gradient) · [Theme JSON](https://raw.githubusercontent.com/Marve10s/t3code-dotted-gradient/main/themes/03-horizon.json)
- **Dither Live — Flutes** · by Marve10s · 16 Nov 2026, 08:07 PM IST. dark · animated, custom CSS, `skins/dither-live-flutes.json`. [GitHub](https://github.com/Marve10s/t3code-dotted-gradient) · [Theme JSON](https://raw.githubusercontent.com/Marve10s/t3code-dotted-gradient/main/themes/04-flutes.json)
- **Dither Live — Arcs** · by Marve10s · 16 Nov 2026, 08:07 PM IST. dark · animated, custom CSS, `skins/dither-live-arcs.json`. [GitHub](https://github.com/Marve10s/t3code-dotted-gradient) · [Theme JSON](https://raw.githubusercontent.com/Marve10s/t3code-dotted-gradient/main/themes/05-arcs.json)
- **Dither Live — Ember** · by Marve10s · 16 Nov 2026, 08:07 PM IST. dark · animated, custom CSS, `skins/dither-live-ember.json`. [GitHub](https://github.com/Marve10s/t3code-dotted-gradient) · [Theme JSON](https://raw.githubusercontent.com/Marve10s/t3code-dotted-gradient/main/themes/06-ember.json)
- **Dither Live — Dusk** · by Marve10s · 16 Nov 2026, 08:07 PM IST. dark · animated, custom CSS, `skins/dither-live-dusk.json`. [GitHub](https://github.com/Marve10s/t3code-dotted-gradient) · [Theme JSON](https://raw.githubusercontent.com/Marve10s/t3code-dotted-gradient/main/themes/07-dusk.json)
- **Dither Live — Neon** · by Marve10s · 16 Nov 2026, 08:07 PM IST. dark · animated, custom CSS, `skins/dither-live-neon.json`. [GitHub](https://github.com/Marve10s/t3code-dotted-gradient) · [Theme JSON](https://raw.githubusercontent.com/Marve10s/t3code-dotted-gradient/main/themes/08-neon.json)
- **Dither Live — Gold** · by Marve10s · 16 Nov 2026, 08:07 PM IST. dark · animated, custom CSS, `skins/dither-live-gold.json`. [GitHub](https://github.com/Marve10s/t3code-dotted-gradient) · [Theme JSON](https://raw.githubusercontent.com/Marve10s/t3code-dotted-gradient/main/themes/09-gold.json)
- **Dither Live — Glint** · by Marve10s · 16 Nov 2026, 08:07 PM IST. dark · animated, custom CSS, `skins/dither-live-glint.json`. [GitHub](https://github.com/Marve10s/t3code-dotted-gradient) · [Theme JSON](https://raw.githubusercontent.com/Marve10s/t3code-dotted-gradient/main/themes/10-glint.json)
- **GrokNight** · by MistanKh · 16 Nov 2026, 06:10 PM IST. dark · `skins/groknight.json`. [GitHub](https://github.com/MistanKh/t3code-groknight) · [Theme JSON](https://raw.githubusercontent.com/MistanKh/t3code-groknight/main/themes/groknight.json)
- **Aurora Azul** · by marcosotomac · 16 Nov 2026, 10:30 AM IST. dark · custom CSS, `skins/aurora-azul.json`. [GitHub](https://github.com/marcosotomac/t3code-themes) · [Theme JSON](https://raw.githubusercontent.com/marcosotomac/t3code-themes/main/themes/aurora-azul.json)
- **Medianoche** · by marcosotomac · 16 Nov 2026, 10:30 AM IST. dark · custom CSS, `skins/medianoche.json`. [GitHub](https://github.com/marcosotomac/t3code-themes) · [Theme JSON](https://raw.githubusercontent.com/marcosotomac/t3code-themes/main/themes/medianoche.json)
- **Nebulosa** · by marcosotomac · 16 Nov 2026, 10:30 AM IST. dark · custom CSS, `skins/nebulosa.json`. [GitHub](https://github.com/marcosotomac/t3code-themes) · [Theme JSON](https://raw.githubusercontent.com/marcosotomac/t3code-themes/main/themes/nebulosa.json)
- **Vía Láctea** · by marcosotomac · 16 Nov 2026, 10:30 AM IST. dark · custom CSS, `skins/via-lactea.json`. [GitHub](https://github.com/marcosotomac/t3code-themes) · [Theme JSON](https://raw.githubusercontent.com/marcosotomac/t3code-themes/main/themes/via-lactea.json)
- **Deep Field** · by @beardwhocodes · 16 Nov 2026, 06:31 AM IST. light, dark · animated, custom CSS, `skins/deep-field-beard.json`. [GitHub](https://github.com/beardwhocodes/t3-themes) · [Theme JSON](https://raw.githubusercontent.com/beardwhocodes/t3-themes/main/themes/deep-field/deep-field.json) · [Repo README](https://github.com/beardwhocodes/t3-themes)
- **Tool Flow** · by haozhanghz / @haozhangzh · 16 Nov 2026, 01:55 AM IST. dark, light · animated, custom CSS, `skins/tool-flow.json`. [GitHub](https://github.com/haozhanghz/tool-flow-t3code) · [Theme JSON](https://raw.githubusercontent.com/haozhanghz/tool-flow-t3code/main/tool-flow.json) · [X post](https://x.com/haozhangzh/status/2122067508777881665)
- **Orbit** · by Dave93 / @YulDavr · 16 Nov 2026, 12:42 AM IST. dark, light · custom CSS, `skins/orbit-dave93.json`. [GitHub](https://github.com/Dave93/t3code-themes) · [Theme JSON](https://raw.githubusercontent.com/Dave93/t3code-themes/main/dist/orbit.json) · [X post](https://x.com/YulDavr/status/2122050167348350986)
- **Canopy** · by Dave93 / @YulDavr · 16 Nov 2026, 12:42 AM IST. dark, light · custom CSS, `skins/canopy-dave93.json`. [GitHub](https://github.com/Dave93/t3code-themes) · [Theme JSON](https://raw.githubusercontent.com/Dave93/t3code-themes/main/dist/canopy.json)
- **Blueprint (Dave93)** · by Dave93 / @YulDavr · 16 Nov 2026, 12:42 AM IST. dark, light · custom CSS, `skins/blueprint-dave93.json`. [GitHub](https://github.com/Dave93/t3code-themes) · [Theme JSON](https://raw.githubusercontent.com/Dave93/t3code-themes/main/dist/blueprint.json)
- **Sage Paper** · by Dave93 / @YulDavr · 16 Nov 2026, 12:42 AM IST. light, dark · custom CSS, `skins/sage-paper.json`. [GitHub](https://github.com/Dave93/t3code-themes) · [Theme JSON](https://raw.githubusercontent.com/Dave93/t3code-themes/main/dist/sage-paper.json)
- **Pixel Quest (Dave93)** · by Dave93 / @YulDavr · 16 Nov 2026, 12:42 AM IST. dark, light · custom CSS, `skins/pixel-quest-dave93.json`. [GitHub](https://github.com/Dave93/t3code-themes) · [Theme JSON](https://raw.githubusercontent.com/Dave93/t3code-themes/main/dist/pixel-quest.json)
- **Claude Desktop** · by KevinXC5 · 15 Nov 2026, 09:16 PM IST. dark, light · animated, custom CSS, `skins/claude-desktop.json`. [GitHub](https://github.com/KevinXC5/t3code-claude-desktop-theme) · [Theme JSON](https://raw.githubusercontent.com/KevinXC5/t3code-claude-desktop-theme/main/claude-desktop.json)
- **Pixel-Koi Pond Light** · by kanigaraa · 15 Nov 2026, 07:12 PM IST. light · animated, custom CSS, `skins/pixel-koi-pond-light.json`. [GitHub](https://github.com/kanigaraa/t3code-pixelkoi) · [Theme JSON](https://raw.githubusercontent.com/kanigaraa/t3code-pixelkoi/main/themes/pixel-koi-pond-light.json) · [Dark on t3skins](https://www.t3skins.dev/skins/pixel-koi-pond)
- **Verdigris** · by mr-karan · 15 Nov 2026, 04:48 PM IST. light, dark · custom CSS, `skins/verdigris.json`. [GitHub](https://github.com/mr-karan/verdigris) · [Theme JSON](https://raw.githubusercontent.com/mr-karan/verdigris/main/ports/t3code/verdigris.json)
- **Stargazer** · by wellbrained · 14 Nov 2026, 10:46 PM IST. dark · animated, custom CSS, `skins/stargazer.json`. [GitHub](https://github.com/wellbrained/t3code-stargazer) · [Theme JSON](https://raw.githubusercontent.com/wellbrained/t3code-stargazer/main/stargazer.json)
- **Deep Field (pixel-art)** · by StivenKN · 14 Nov 2026, 10:31 PM IST. dark · animated, custom CSS, `skins/deep-field-stiven.json`. [GitHub](https://github.com/StivenKN/t3code-deep-field) · [Theme JSON](https://raw.githubusercontent.com/StivenKN/t3code-deep-field/main/deep-field.json)
- **YoRHa** · by mths-mcfs · 14 Nov 2026, 10:18 PM IST. light, dark · animated, custom CSS, `skins/yorha.json`. [GitHub](https://github.com/mths-mcfs/t3code-yorha-theme) · [Theme JSON](https://raw.githubusercontent.com/mths-mcfs/t3code-yorha-theme/main/yorha.theme.json)
- **Catppuccin Space Night** · by PeytonWDYM · 14 Nov 2026, 08:05 PM IST. light, dark · animated, custom CSS, `skins/catppuccin-space-night.json`. [GitHub](https://github.com/PeytonWDYM/t3code-space-night) · [Theme JSON](https://raw.githubusercontent.com/PeytonWDYM/t3code-space-night/main/catppuccin-space-night.json)
- **Habamax** · by mark-vella · 14 Nov 2026, 05:15 PM IST. dark, light · custom CSS, `skins/habamax.json`. [GitHub](https://github.com/mark-vella/t3code-habamax) · [Theme JSON](https://raw.githubusercontent.com/mark-vella/t3code-habamax/main/habamax.json)
- **Pixel Quest** · by Jonathon-Sherrouse · 14 Nov 2026, 10:53 AM IST. dark · animated, custom CSS, `skins/pixel-quest-js.json`. [GitHub](https://github.com/Jonathon-Sherrouse/t3code-pixel-quest) · [Theme JSON](https://raw.githubusercontent.com/Jonathon-Sherrouse/t3code-pixel-quest/main/pixel-quest.json)
- **Bookshelf Calm** · by vatana7 · 10 Nov 2026, 11:08 AM IST. light · `skins/bookshelf-calm.json`. [GitHub](https://github.com/vatana7/t3code-bookshelf-themes) · [Theme JSON](https://raw.githubusercontent.com/vatana7/t3code-bookshelf-themes/main/themes/Bookshelf-Calm.json)
- **Bookshelf Paper** · by vatana7 · 10 Nov 2026, 11:08 AM IST. light · `skins/bookshelf-paper.json`. [GitHub](https://github.com/vatana7/t3code-bookshelf-themes) · [Theme JSON](https://raw.githubusercontent.com/vatana7/t3code-bookshelf-themes/main/themes/Bookshelf-Paper.json)

## What I could not access or finish

- No public git repo was found for t3skins.dev itself.
- t3skins.dev has no sitemap; the catalogue came from `/api/skins`.
- A Cursor-managed canvas skill file was not present at `/home/box/agent-data/managed-skills/skills/canvas/SKILL.md`, and a Page would not have been a good fit anyway: this needs live CSS animation, filters, and downloadable JSON, so a static site was built instead.
- I did not exhaustively page every T3 Code-related X conversation after the first 50 posts of the main query, so a late or oddly worded share could have been missed.
- [@Libes66](https://x.com/Libes66/status/2121945694797697451) said a theme link was below the post; it was not in the post entities, and I did not find a public file.
- [@nitesh_btc](https://x.com/nitesh_btc/status/2122025707895152971), [@zwb44](https://x.com/zwb44/status/2122045867876135169) and [@yachtyyachty](https://x.com/yachtyyachty/status/2122242925459550553) were screenshot/video shares without an installable file.
- I did not clone or vendor the full T3 Code web app, so previews are a mock chrome with the official `--app-theme-*` variables and common `data-` hooks, not t3skins.dev's official live iframe.
- pingdotgg/t3code issues/discussions were not exhaustively scraped; the recent shares lived on t3skins, X and independent repos rather than in the core issue tracker.
- t3themes.com's large historical catalogue was noted, not fully imported, because it is the older colour-theme gallery rather than the post-custom-CSS wave.
