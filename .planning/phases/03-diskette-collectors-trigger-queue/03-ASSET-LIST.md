# HOTLINE Phase 3 asset list — diskettes

Drop every file below into `public/assets/hotline/` beside the existing `phone-*.png` pack. Loose PNGs only, real PNG signature (`89 50 4E 47`). No atlas.

Decisions: D-15 (list then user places art), D-08 (meters stay procedural Graphics — no meter-fill PNG pack).

## Must-have diskette tokens

| File | Role | Size (px) | Alpha | Notes |
|------|------|-----------|-------|-------|
| `diskette-green.png` | Green token overlay / flight | 128x128 | transparent bg | matches left phone; scales to ~0.7 cell in view |
| `diskette-red.png` | Red token overlay / flight | 128x128 | transparent bg | matches center phone |
| `diskette-purple.png` | Purple token overlay / flight | 128x128 | transparent bg | matches right phone |

## Scope rules

- No meter-fill art. Phone meters are drawn in code (D-08).
- Place beside existing `phone-green.png`, `phone-red.png`, `phone-purple.png`.
- Agent does not invent or generate final binary art in this handoff (D-15).
- Every file must be a real PNG. The handoff check rejects anything else.

## Placement checklist

- [ ] `public/assets/hotline/diskette-green.png`
- [ ] `public/assets/hotline/diskette-red.png`
- [ ] `public/assets/hotline/diskette-purple.png`
