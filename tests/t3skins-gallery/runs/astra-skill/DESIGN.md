# Design plan

A skin is a change of atmosphere for a working tool. Make the actual T3 Code previews the visual subject. The surrounding gallery is light, quiet, and precise.

Palette: porcelain #f8f7fb, paper #ffffff, ink #2d2538, muted plum #756c80, violet #7451a8, lilac #ece5f5.
Type: Space Grotesk for the main headline and skin names; Manrope for navigation, controls, and descriptions. System sans-serif fallback.
Layout: left-aligned introduction and a working skin sampler, followed by a narrow filter column and a three-column preview gallery. Mobile stacks the sampler and uses a collapsible filter panel.

```
T3 / skins                         Gallery   Sources   How to install
A new look.                        [ live preview             ]
Same T3 Code.                      [ Nyx | Rosé | Matrix       ]
Browse community skins             [ credit + palette         ]
------------------------------------------------------------------
Explore skins       [ Search                              ]
All skins / Saved   Showing 78 skins              Sort: Most installs
Appearance          [ preview ]   [ preview ]   [ preview ]
Motion              Name          Name          Name
Style               author        author        author
Source / Tag        modes + actions
```

Review: a large decorative palette would repeat generic design-gallery imagery. Replace it with a functional sampler of three real skins. Default to most installs, with unavailable counts sorted last, to show distinct community work first. Keep the original newest sort available. Avoid duplicated badges and dense metadata on cards; show full metadata and all links in the details dialog. Save skins for a personal shortlist without an account.

Quality: native dialog keyboard handling; visible focus; lazy iframes; resettable filters; reduced-motion preference carried into previews without editing source files; local-only saved state with a safe storage fallback. Preserve all original credits, source links, and install instructions.
