# HOTLINE Phase 5 asset list - VHS gamble chrome

Drop every file below into `public/assets/hotline/` beside the existing pack. Loose PNGs only, real PNG signature (`89 50 4E 47`). No atlas.

Decisions: D-08 (VHS art is optional polish, css neon fallback ships first), D-15 (list then user places art).

## Must-have VHS files

| File | Role | Size (px) | Alpha | Notes |
|------|------|-----------|-------|-------|
| `vhs-gamble-panel.png` | Gamble panel backdrop behind CURRENT WIN, GAMBLE TO WIN and the result line | 640x720 | transparent edges ok | stretched to fill the panel, keep the middle calm so text stays readable, panel is at most 20rem wide in a 34rem column |
| `vhs-btn-survive.png` | SURVIVE button face | 320x128 | transparent bg | green accent to match the survive result, label text is drawn by the page on top |
| `vhs-btn-die.png` | DIE button face | 320x128 | transparent bg | red accent to match the die result, label text is drawn by the page on top |

## Scope rules

- DOM and css use only. These three files are loaded by the browser as plain images from `/assets/hotline/`.
- Do NOT add them to `HOTLINE_ASSET_URLS` in `loadHotlineAssets.ts`. The pixi loader list stays at 17 files and the assets test pins that length.
- Each image is attached only when it loads. When a file is missing or not decodable, the css neon panel and buttons stay as they are. Art can land late or one file at a time.
- No button labels baked into the art, text comes from the page.
- Every file must be a real PNG. The handoff check rejects anything else.
- Agent does not invent or generate final binary art in this handoff (D-15).

## Placement checklist

- [ ] `public/assets/hotline/vhs-gamble-panel.png`
- [ ] `public/assets/hotline/vhs-btn-survive.png`
- [ ] `public/assets/hotline/vhs-btn-die.png`
