# HOTLINE Phase 2 asset list

Drop every file below into `public/assets/hotline/` (loose PNGs, no atlas). Format is PNG with a real PNG signature, alpha channel where noted. Layout reference: `.planning/phases/02-hotline-base-playable/witch-pots-layout-ref.jpg` (portrait, phones above the monitor, reels in a framed window).

Decisions: D-05 (real art, user generates and places), D-06 (must-have plus inert phones), D-07 (loose PNGs, no atlas), D-08 (dirty CRT/VHS look baked into the frame).

## Must-have scene art

| File | Role | Size (px) | Alpha | Notes |
|------|------|-----------|-------|-------|
| `backdrop-rooftop.png` | Motel rooftop at sunset, full-bleed behind everything | 1080x1920 | opaque | portrait; keep the middle band calmer so the CRT frame reads; neon sign glow lower third |
| `frame-crt.png` | Dirty CRT/VHS monitor bezel around the reels | 900x720 outer | transparent center | center window about 5 columns by 4 rows of symbol cells; scanline grime and glass wear baked in, nothing opaque inside the window |
| `phone-green.png` | Left rotary phone, inert silhouette | 256x256 | transparent bg | green body; matches the future free spins meter |
| `phone-red.png` | Center rotary phone, inert silhouette | 256x256 | transparent bg | red body; matches the future hold and win meter |
| `phone-purple.png` | Right rotary phone, inert silhouette | 256x256 | transparent bg | purple body; matches the future pick em meter |
| `sym-wild-mask.png` | Wild, animal mask (config id `mask`) | 128x128 | transparent bg | most readable symbol on the board; substitutes for all pays |

## Paying symbols

Filenames map to the symbol ids in `src/games/hotline/config/hotline.config.json`. All 128x128, transparent background, same visual weight and padding so cells line up.

### High pays (3)

| File | Config id | Subject |
|------|-----------|---------|
| `sym-hi-pistol.png` | `pistol` | revolver or pistol, top pay |
| `sym-hi-cassette.png` | `cassette` | VHS or audio cassette tape |
| `sym-hi-car.png` | `car` | 80s sports car, front three quarter view |

### Low pays (5)

| File | Config id | Subject |
|------|-----------|---------|
| `sym-lo-ace.png` | `ace` | letter A in neon 80s style |
| `sym-lo-king.png` | `king` | letter K, same style |
| `sym-lo-queen.png` | `queen` | letter Q, same style |
| `sym-lo-jack.png` | `jack` | letter J, same style |
| `sym-lo-ten.png` | `ten` | number 10, same style |

## Optional

| File | Role | Size (px) | Notes |
|------|------|-----------|-------|
| `cell-frame.png` | Winning cell chrome, only if you do not want it drawn in code | 128x128 | transparent center, glowing border |

## Scope rules

- No diskette art and no meter fill art in Phase 2. Collectors arrive in Phase 3.
- No spritesheet or atlas for v1 base, loose PNGs only.
- Files are placed by the user at exactly these paths. The agent does not generate or invent final art.
- Every file must be a real PNG (signature `89 50 4E 47`). The handoff check rejects anything else.
- Font is not part of this pack, the Retro Computer TTF in `src/shared/fonts/` is reused.

## Placement checklist

- [ ] `public/assets/hotline/backdrop-rooftop.png`
- [ ] `public/assets/hotline/frame-crt.png`
- [ ] `public/assets/hotline/phone-green.png`
- [ ] `public/assets/hotline/phone-red.png`
- [ ] `public/assets/hotline/phone-purple.png`
- [ ] `public/assets/hotline/sym-wild-mask.png`
- [ ] `public/assets/hotline/sym-hi-pistol.png`
- [ ] `public/assets/hotline/sym-hi-cassette.png`
- [ ] `public/assets/hotline/sym-hi-car.png`
- [ ] `public/assets/hotline/sym-lo-ace.png`
- [ ] `public/assets/hotline/sym-lo-king.png`
- [ ] `public/assets/hotline/sym-lo-queen.png`
- [ ] `public/assets/hotline/sym-lo-jack.png`
- [ ] `public/assets/hotline/sym-lo-ten.png`
