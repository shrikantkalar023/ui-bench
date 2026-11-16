# Design plan

A collection of workspace skins should feel like browsing small, personal worlds. Keep the gallery light so each skin supplies its own color.

Palette: canvas `#F7F5FB`, paper `#FFFFFF`, ink `#30283C`, muted `#716A7C`, violet `#7450B5`, lilac `#E9E1F6`. Peach and sage appear only on the stacked theme samples.

Type: Bricolage Grotesque for the expressive headline and skin names. Instrument Sans for controls and reading. System sans fallbacks.

Layout: left-aligned copy; right-aligned stack of live theme specimens. Below, a quiet filter rail and three-column preview collection. Two columns on tablet, one on mobile; mobile filters open on request.

Desktop:
```
[ T3 skins             Explore   How to install   Sources ]
[ Your code.           [        live theme stack        ] ]
[ Your atmosphere.     [                                ] ]
[ description / browse [ theme selector / creator       ] ]
[ Search                                             /  ]
[ All skins / Saved                            Sort      ]
[ filters | preview      | preview      | preview        ]
[         | name / action| name / action| name / action  ]
```

Principles: spend the visual emphasis on the stacked specimen; use actual theme previews and actual palette colors; keep discovery controls legible and secondary; keep install and source actions explicit. No decorative gradients, page animation, or repeated marketing badges.

Plan review: a dark, neon-accented gallery would compete with the themes. Replaced it with lilac and white. A full-width marketing hero would hide the product; limited the split hero to one compact specimen stack. The original ten-chip filter row obscures the separate filter groups; replaced it with named groups in a rail. Keep real live previews rather than invented illustrations.

Additions: saved skins with local persistence when available; clear filters; empty-state reset; accessible details dialog with focus return; theme selection in the hero; dark/light controls in the details view; reduced-motion support inside same-origin previews where accessible.
