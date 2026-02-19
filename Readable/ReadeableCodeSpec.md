# Readable — Project Specification

## Overview

**Readable** is a single-page web application for exploring how color and font size affect digital readability. Users can interactively adjust background color, text color, and font size, then immediately see the effect on sample text alongside calculated contrast ratios, WCAG compliance indicators, color vision simulations, and preset color schemes.

---

## Visual Design

### Style
- **Aesthetic:** Clean, minimal — generous white space, muted UI chrome, subtle shadows and borders
- **Font:** System UI stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`)
- **Color palette (UI chrome):** Near-white backgrounds (`#f8f8f8`), medium-gray borders (`#e0e0e0`), dark-gray labels (`#444`), accent blue for active states (`#3b82f6`)
- **Borders/radius:** Soft `4px` border-radius on controls and panels; `1px` borders in `#ddd`
- **No dark mode** (clean/minimal per brief)

### Layout — Side-by-Side (Two Columns)
```
┌─────────────────────────────────────────────────────────────┐
│  READABLE                                          [subtitle]│
├──────────────────────────┬──────────────────────────────────┤
│   CONTROLS (left)        │   PREVIEW (right)                │
│                          │                                  │
│  [Preset Dropdown]       │  ┌──── Original ──────────────┐ │
│                          │  │  [Sample Text Block]        │ │
│  Background Color        │  └────────────────────────────┘ │
│    R [ slider ] [field]  │  ┌──── Simulated ─────────────┐ │
│    G [ slider ] [field]  │  │  [Same text, CSS filter]    │ │
│    B [ slider ] [field]  │  └────────────────────────────┘ │
│    [Color swatch]        │                                  │
│                          │  Vision Simulation Buttons:      │
│  Text Color              │  [Normal] [Protan] [Deutan]      │
│    R [ slider ] [field]  │  [Tritan] [Mono]                 │
│    G [ slider ] [field]  │                                  │
│    B [ slider ] [field]  │  Contrast Ratio: X.XX:1          │
│    [Color swatch]        │  BG Luminance:   0.XXX           │
│                          │  Text Luminance: 0.XXX           │
│  Font Size               │                                  │
│    [ slider ] [field]px  │  WCAG Normal Text (4.5:1):       │
│                          │    ● PASS / ✗ FAIL               │
│                          │  WCAG Large Text (3:1):          │
│                          │    ● PASS / ✗ FAIL               │
└──────────────────────────┴──────────────────────────────────┘
```

---

## Sample Text

The preview panels display the following passage from *The Hitchhiker's Guide to the Galaxy* by Douglas Adams:

> *"The ships hung in the sky in much the same way that bricks don't."*
>
> Far out in the uncharted backwaters of the unfashionable end of the western spiral arm of the Galaxy lies a small unregarded yellow sun. Orbiting this at a distance of roughly ninety-two million miles is an utterly insignificant little blue-green planet whose ape-descended life forms are so amazingly primitive that they still think digital watches are a pretty neat idea.

Two paragraphs shown — enough to test readability across multiple lines, including a famous one-liner.

---

## Controls Panel (Left Column)

### Preset Color Schemes Dropdown
Positioned at the **top of the controls panel**, above all color controls.

**Label:** "Load Preset"

| Preset Name       | BG Color        | Text Color     | Notes                        |
|-------------------|-----------------|----------------|------------------------------|
| — (none) —        | —               | —              | Default / no selection       |
| High Contrast     | `#ffffff` white | `#000000` black| Maximum contrast             |
| Low Contrast      | `#cccccc` gray  | `#999999` gray | Barely distinguishable       |
| Classic Web       | `#ffffff` white | `#333333` dark | Standard body text           |
| Night Mode        | `#1a1a2e` navy  | `#e0e0e0` lt-gray | Dark background reading   |
| Solarized Light   | `#fdf6e3` cream | `#657b83` slate| Popular dev color scheme     |
| Ocean Blue        | `#0077b6` blue  | `#ffffff` white| High-contrast colored BG     |

Selecting a preset immediately updates all RGB sliders/fields and the preview. Changing any slider manually resets the dropdown to "— (none) —".

---

### Background Color Controls

**Label:** "Background Color"

- Color swatch: a `48×48px` rounded square showing the current background color (live-updating)
- R slider (`0–255`) + numeric input field (integer, clamped `0–255`)
- G slider (`0–255`) + numeric input field
- B slider (`0–255`) + numeric input field
- Slider ↔ field sync: bidirectional, immediate on `input` event

---

### Text Color Controls

**Label:** "Text Color"

Identical layout to Background Color controls.

---

### Font Size Control

**Label:** "Font Size"

- Slider range: `10–72` (px), step `1`
- Numeric integer input field (clamped `10–72`)
- Unit label: `px`
- Slider ↔ field sync: bidirectional, immediate

---

## Preview Panel (Right Column)

### Side-by-Side Simulation Layout

Two stacked panels with clear labels:
- **"Original"** — top panel, shows sample text with the exact selected background and text colors, no filter
- **"Simulated"** — bottom panel, shows the same text with a CSS `filter` applied for the active vision type

Both panels use the selected font size. Both have identical padding and minimum height.

---

### Vision Simulation Buttons

A row of 5 toggle buttons below (or adjacent to) the two preview panels:

| Button     | Filter Applied                                         |
|------------|--------------------------------------------------------|
| Normal     | No filter (identity)                                   |
| Protanopia | `url(#protanopia)` — SVG matrix filter (red-blind)     |
| Deuteranopia | `url(#deuteranopia)` — SVG matrix (green-blind)      |
| Tritanopia | `url(#tritanopia)` — SVG matrix (blue-blind)           |
| Monochromacy | `url(#monochromacy)` — desaturate to grayscale       |

Only one button is active at a time. Active state: filled accent-blue background, white text. Default: Normal.

**SVG filter matrices** (embedded in the HTML, not visible):

```
Protanopia matrix (approx):
  0.567, 0.433, 0,     0, 0
  0.558, 0.442, 0,     0, 0
  0,     0.242, 0.758, 0, 0
  0,     0,     0,     1, 0

Deuteranopia matrix (approx):
  0.625, 0.375, 0,   0, 0
  0.7,   0.3,   0,   0, 0
  0,     0.3,   0.7, 0, 0
  0,     0,     0,   1, 0

Tritanopia matrix (approx):
  0.95, 0.05,  0,    0, 0
  0,    0.433, 0.567,0, 0
  0,    0.475, 0.525,0, 0
  0,    0,     0,    1, 0

Monochromacy (luminance desaturate):
  0.299, 0.587, 0.114, 0, 0
  0.299, 0.587, 0.114, 0, 0
  0.299, 0.587, 0.114, 0, 0
  0,     0,     0,     1, 0
```

---

### Contrast & Luminance Display

Below or beside the preview panels, always visible:

```
Contrast Ratio     7.43 : 1
BG Luminance       0.874
Text Luminance     0.082
```

**Calculation:**
1. Convert each RGB channel to linear:
   - If `c / 255 <= 0.04045`: `linear = c / 255 / 12.92`
   - Else: `linear = ((c / 255 + 0.055) / 1.055) ^ 2.4`
2. Relative luminance: `L = 0.2126 * R + 0.7152 * G + 0.0722 * B`
3. Contrast ratio: `(L_lighter + 0.05) / (L_darker + 0.05)`
4. Display as `X.XX : 1` (two decimal places)

---

### WCAG Compliance Indicators

Two rows, always visible, with color-coded badges:

| Row              | Threshold | Badge PASS        | Badge FAIL       |
|------------------|-----------|-------------------|------------------|
| Normal Text      | ≥ 4.5:1   | 🟢 `PASS` green   | 🔴 `FAIL` red    |
| Large Text (≥24px) | ≥ 3:1   | 🟢 `PASS` green   | 🔴 `FAIL` red    |

Large Text threshold is relative to the current font size setting: if font size ≥ 24px, the large text row applies; otherwise only the normal text row is relevant (both are always shown for clarity with an explanatory note).

---

## Technical Requirements

### File Structure
```
readable/
├── index.html       # All HTML, CSS, JS in a single file
└── (no dependencies — pure vanilla HTML/CSS/JS)
```

### Synchronization
- Sliders and number inputs are bidirectional and sync on every `input` event (no debounce)
- All displays update in real-time with no lag
- Preset dropdown resets to "— (none) —" on any manual slider change

### Accessibility (meta-ironic, but required)
- Labels are properly associated with inputs via `for`/`id`
- Color swatches have `aria-label` describing the current color
- WCAG badges have `role="status"` for live region updates

### Browser Target
Modern Chrome, Firefox, Safari (no IE). No build tools required — pure HTML/CSS/JS single file.

---

## Stretch Challenges Summary

| Option | Status   | Implementation                                      |
|--------|----------|-----------------------------------------------------|
| A      | ✅ Done   | 5 SVG matrix filters, toggle buttons, simulated panel |
| B      | ✅ Done   | Pass/Fail badges with green/red, live-updating       |
| C      | ✅ Done   | Preset dropdown at top of controls panel             |

---

## Out of Scope

- Editable sample text (static passage only)
- Dark mode toggle for the UI chrome
- Saving or exporting color combinations
- Mobile/responsive layout (desktop-only, side-by-side)
