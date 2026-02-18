# RGB Color Studio — Claude Code Project Specification

## Project Overview

Build a fully interactive **RGB Color Studio** as a single-file React application (`.jsx`). The Studio is a feature-rich, visually immersive tool for exploring, generating, and evaluating colors. It should feel polished and professional, suitable as a portfolio-worthy web app.

---

## Visual Theme

**Glassmorphism**

- Frosted-glass card surfaces with `backdrop-filter: blur()` and semi-transparent backgrounds
- Subtle border highlights (`1px solid rgba(255,255,255,0.2)`)
- Deep, rich background (e.g. dark purple-to-indigo gradient) behind all glass panels
- Soft drop shadows and glowing color accents throughout
- Typography: clean sans-serif (e.g. Inter or system-ui)

---

## Layout

**Dashboard Grid**

- Responsive CSS Grid layout filling the viewport
- Each major feature lives in its own glass card / panel
- Panels should be clearly labeled and visually distinct but cohesive
- Grid should reflow gracefully on smaller screens (min 2-column, ideally 3-column on desktop)

---

## Core Feature 1 — Animated Color Explorer

### Behavior
- **Generative / auto-cycling animation** — colors evolve autonomously without user input required
- Animation style: **Particle / blob animation**
  - Soft, organic blobs of color that drift, merge, and shift across the panel
  - Blobs should use the current active color(s) as their fill, blending with `mix-blend-mode` or canvas compositing
  - Animation should feel fluid and ambient — not jarring or flashy
- Users can **pause/resume** the animation
- Users can **click anywhere on the animation canvas** to seed a new color from that point
- The currently "active" color extracted from the animation is displayed live in all four formats (see Color Formats below)

### Controls
- Speed slider (slow / medium / fast)
- Blob count slider (3–20 blobs)
- "Freeze & pick" button — pauses animation and lets user click a pixel to lock that color

---

## Core Feature 2 — Palette Generator

### Harmony Schemes Supported
All of the following must be selectable via a dropdown or tab:
- Complementary
- Analogous
- Triadic
- Split-complementary

### Palette Size
- **User-defined count** — number input (range: 2–12 colors)
- Default: 5

### Seed Color Input
- User can type a hex value, or use the active color from the Color Explorer as the seed
- "Use current explorer color" button syncs the two panels

### Display
- Render each palette color as a large swatch tile
- Show all four color formats beneath each swatch (Hex, RGB, HSL, OKLCH)
- Swatches are clickable to set as the new seed color

### Export Options (all three must be present)
1. **Copy hex to clipboard** — per-swatch copy button
2. **Download as PNG swatch sheet** — full palette as a labeled PNG image
3. **Export as CSS variables** — copies a `:root { --color-1: ...; }` block to clipboard

---

## Extra Challenge 1 — Contrast Checker (WCAG)

- User selects a **foreground color** and a **background color** (hex input or eyedropper from palette)
- Calculates relative luminance per WCAG 2.1 spec
- Displays the **contrast ratio** (e.g. `4.73:1`)
- Shows **pass/fail badges** for both:
  - WCAG AA (normal text: 4.5:1, large text: 3:1)
  - WCAG AAA (normal text: 7:1, large text: 4.5:1)
- Live preview area: shows sample text rendered with the chosen color pair
- Sample text includes normal size and large size examples

---

## Extra Challenge 2 — Color Blindness Simulator

### Supported Vision Types (full spectrum)
- Protanopia (no red cones)
- Deuteranopia (no green cones)
- Tritanopia (no blue cones)
- Protanomaly (weak red)
- Deuteranomaly (weak green)
- Tritanomaly (weak blue)
- Achromatopsia (full monochromacy)
- Achromatomaly (partial monochromacy)

### Behavior
- Takes the **current active palette** or a user-uploaded/input color set
- Applies a color transformation matrix for each vision type
- Displays a side-by-side grid: **Original** vs **Simulated** swatches for the selected vision type
- Dropdown to switch between vision types
- "Compare all" mode — shows a compact grid of all 8 simulations at once

---

## Extra Challenge 3 — Accessible Palette Mode

- Toggle switch within the Palette Generator panel: **"Accessible Mode"**
- When enabled, each generated swatch is evaluated for contrast against both white and black backgrounds
- Swatches that **fail** WCAG AA are marked with a visible warning badge (⚠️ icon + red glow outline)
- Swatches that **pass** are marked with a checkmark badge
- The user is **warned but not blocked** — they can keep failing colors and adjust manually
- Warning tooltip on hover explains which standard failed and by how much

---

## Color Formats

All four formats must be displayed wherever a color value is shown:

| Format | Example |
|--------|---------|
| Hex | `#A259FF` |
| RGB | `rgb(162, 89, 255)` |
| HSL | `hsl(270, 100%, 67%)` |
| OKLCH | `oklch(0.65 0.22 293)` |

Clicking any format value copies it to clipboard.

---

## State Persistence — Shareable URL

- The full Studio state should be **encoded into the URL** as a query string or hash (e.g. `?state=base64encodedJSON`)
- State to encode includes:
  - Current active/seed color
  - Selected harmony scheme
  - Palette size
  - Palette colors
  - Contrast checker foreground/background
  - Active color blindness simulation type
  - Accessible Mode toggle state
- On page load, decode URL state and restore the Studio to that configuration
- "Share" button in the header copies the current URL to clipboard with a toast notification

---

## Technical Requirements

- **Single `.jsx` file** (React + hooks, no separate CSS or JS files)
- Use **Tailwind CSS utility classes** for layout and spacing
- Use **inline styles** for glassmorphism effects (backdrop-filter, rgba backgrounds, box-shadow) since Tailwind's base stylesheet may not include these
- Animation via **Canvas API** or **CSS animations / keyframes** — no external animation libraries
- Color math (luminance, contrast ratio, color blindness matrices, HSL/OKLCH conversion) implemented from scratch in pure JS utility functions — no color library dependencies
- All exports (PNG, CSS, clipboard) handled via browser-native APIs
- No backend, no API calls — fully client-side

---

## Component Structure (Suggested)

```
<App>
  <Header />                        // Title, Share button
  <DashboardGrid>
    <ColorExplorerPanel />          // Blob animation canvas + controls
    <PaletteGeneratorPanel />       // Harmony picker, swatches, export
    <ContrastCheckerPanel />        // Foreground/background + WCAG results
    <ColorBlindnessPanel />         // Simulation grid
  </DashboardGrid>
  <ToastNotification />             // Clipboard / share feedback
</App>
```

---

## Color Math Reference

### Relative Luminance (WCAG)
```
L = 0.2126 * R + 0.7152 * G + 0.0722 * B
where R,G,B are linearized: c <= 0.04045 ? c/12.92 : ((c+0.055)/1.055)^2.4
```

### Contrast Ratio
```
ratio = (L1 + 0.05) / (L2 + 0.05)  where L1 >= L2
```

### Color Blindness Matrices
Use the Brettel / Viénot simulation matrices for protanopia, deuteranopia, tritanopia, and anomalous variants. Apply as 3×3 RGB matrix transforms.

### OKLCH Conversion
Convert via: RGB → Linear RGB → XYZ (D65) → OKLab → OKLCH

---

## UX Details

- All panels should have **smooth transitions** when values update (CSS transition on color swatches)
- Color swatches should have a **hover scale effect** (`transform: scale(1.05)`)
- Active/selected states should use a glowing border in the swatch's own color
- Use a consistent **toast notification** system for all clipboard copy actions ("Copied!" with a 2s fade-out)
- The dashboard should feel alive — the blob animation running in the background of the Explorer panel ties the whole UI together

---

## Deliverable

A single file: `rgb-color-studio.jsx`

It should run immediately when dropped into a Claude.ai artifact viewer or a Vite/CRA React project with Tailwind configured.
