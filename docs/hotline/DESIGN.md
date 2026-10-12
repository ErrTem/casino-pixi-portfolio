# HOTLINE design

HOTLINE is a portfolio slot demo, 5x4 reels with 40 lines. The layout and feature flow follow a classic three collector slot, the look is Hotline Miami inspired: a motel rooftop at sunset seen through a dirty CRT/VHS monitor. The hex values below come from the shipped build, so mocks made from this page match the game.

## Mood

Hot, grimy and loud. Flat graphic shapes, chunky pixel era grit, and two hero neons on a deep violet night. Think a rented tape playing on a tired monitor.

Keywords Stitch reacts to:

- 1989 Miami
- synthwave sunset
- dirty motel rooftop
- neon tube signage
- sodium streetlight haze
- CRT phosphor glow
- VHS tracking lines
- scanlines
- chromatic aberration
- film grain
- grimy
- violent pop
- high contrast
- flat graphic shapes
- chunky pixel era grit
- hot pink and cyan

## Palette

| token | hex | role |
|-------|-----|------|
| neon-pink | #FF2E93 | title, win line glow, primary accent |
| pink-line | #FF4DA6 | panel borders, active button fill |
| neon-core | #FFE3F1 | win line core, text on pink |
| cyan | #39FFE8 | phone meter bars, diskette flight, empty hold cells |
| ice | #9BE7FF | HUD borders and labels |
| gold | #FFE566 | win amounts, dollar callout |
| jackpot | #FFD24A | jackpot strip hot state |
| purple | #C44DFF | purple phone, lockers |
| green | #7DFFB3 | green phone accents, SURVIVE |
| red | #FF3B3B | red phone accents, DIE |
| night | #12061F | HUD background |
| panel | #1A0A2E | panels and buttons |
| deep | #0B0420 | overlay backdrop |
| screen | #0A0614 | CRT glass behind reels |
| outline | #1A0B2E | title stroke |
| disabled | #6B5A80 | disabled controls |

Sunset, art only. These stops are for the backdrop gradient, top to horizon, and are not used in code. Tune them if needed but keep a violet to pink to orange to amber run.

| stop | hex |
|------|-----|
| sky top | #2B0A3D |
| upper sky | #7A1E6C |
| glow band | #FF2E93 |
| low sky | #FF7A3D |
| horizon | #FFC46B |

Usage rules:

- Pink and cyan are the two hero neons.
- Gold is only for money.
- Phone colors only appear on their own feature.

## Typography

Retro Computer, from `src/shared/fonts/retrocomputerrusbydaymarius.ttf`, for the title, labels, buttons and numbers. All uppercase. The title is neon pink with the outline token as a dark stroke.

Stitch only offers web fonts, so mocks use VT323 or Press Start 2P as a stand-in and the build swaps in Retro Computer. The shipped info sheet uses a plain sans for long descriptions only. Mocks never put Inter, Roboto, Segoe UI or a system UI font on any chrome.

## Layout

Portrait first (D-11). Reference frame 1080x1920, phone viewport around 390x844. Top to bottom:

1. Shell bar (DOM): balance with a $ icon and the last win on the left, Menu and Sound on the right.
2. HOTLINE title in the scene near the top (D-12).
3. Three rotary phones in one row above the monitor (D-10): green left, red center, purple right. Each has a cyan meter bar and a small label such as 24 FREE SPINS, HOLD AND WIN, LOCKERS.
4. A dirty CRT/VHS monitor bezel around a 5 columns by 4 rows reel window. Grime is baked into the frame art (D-08).
5. DOM HUD below the canvas (D-09, D-13 plus the later actions row), exactly as `index.html` ships it:
   - actions row: info button with I on the left, TURBO, AUTO and a 2x gamble button on the right
   - bet row: minus button, bet value with a $ sign, plus button, and a big round SPIN button
   - a small status line under the bar

Desktop is a centered tall column with the rooftop filling the sides.

## Components

- Rotary phones: inert body art, the meter is drawn in code.
- Diskette tokens: three colors matching the phones, they fly from a cell into the matching phone.
- Symbols: the animal mask Wild is the most readable thing on the board. Highs are pistol, cassette, car. Lows are A, K, Q, J, 10 as neon letters.
- Win feedback (D-15, D-16): a pink polyline through winning cells, framed cells, a gold dollar callout, lines cycle one at a time.
- Hold and Win: a red jackpot strip with MIN, MID, MAX, ULTRA.
- Lockers: a purple grid for the pick feature.
- VHS gamble panel: tape label look, with SURVIVE and DIE buttons.

## Do not

- No green fantasy art from Witch Pots: no witches, cauldrons, pumpkins, mushrooms, frogs, spooky forest.
- No cartoon casino cliches: no raining coins, cherries, sevens, bells, clovers, red velvet, Vegas marquee, slot lever, smiling mascots.
- No Inter, Roboto, Segoe UI or system UI fonts on chrome.
- No recognizable Hotline Miami characters, masks, logos or publisher marks, and no Endorphina or Witch Pots branding. Every design is original.
- No glossy 3D renders, clean corporate gradients, or stock photo look.
- No text baked into art except the HOTLINE title in mocks and the letter symbols.

## Asset handoff

The asset table follows.
