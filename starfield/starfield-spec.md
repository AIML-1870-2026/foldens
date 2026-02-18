# Starfield Particle Editor Specification

## Overview

An interactive starfield particle simulation with a retro arcade aesthetic. Features a control panel with sliders to adjust particle properties in real-time, plus randomize and fullscreen functionality.

---

## Core Requirements

### Visual Style: **Retro Arcade**

Channel the look of classic 80s arcade games and early computer graphics:

- **CRT-inspired effects**: Subtle scanlines, slight screen curvature (optional), phosphor glow
- **Pixel-perfect stars**: Sharp edges, no anti-aliasing on shapes
- **Neon color palette**: Electric blues, hot pinks, laser greens, amber yellows
- **Chunky UI**: Beveled buttons, pixel fonts, glowing borders
- **Dark void background**: Pure black (#000) or very dark blue (#0a0a12)

### Typography

- **Font**: Pixel/bitmap style font
  - Options: "Press Start 2P", "VT323", "Silkscreen", "Perfect DOS VGA"
- **Text styling**: ALL CAPS, optional text-shadow glow effect
- **Colors**: Cyan, magenta, or green on dark backgrounds

---

## Slider Controls

### 1. Star Count
| Property | Value |
|----------|-------|
| Label | `STARS` |
| Range | 50 - 2000 |
| Default | 500 |
| Step | 10 |
| Effect | Number of particles rendered |

### 2. Size
| Property | Value |
|----------|-------|
| Label | `SIZE` |
| Range | 1 - 10 |
| Default | 3 |
| Step | 1 |
| Effect | Base pixel size of stars (actual size varies by depth) |

### 3. Color
| Property | Value |
|----------|-------|
| Label | `COLOR` |
| Type | Hue slider (0 - 360) OR preset palette selector |
| Default | 180 (cyan) |
| Effect | Star color hue; saturation/brightness fixed for arcade look |

**Arcade Palette Option** (alternative to hue slider):
- Cyan (#00ffff)
- Magenta (#ff00ff)
- Green (#00ff00)
- Amber (#ffbf00)
- White (#ffffff)
- Red (#ff0044)

### 4. Travel Speed
| Property | Value |
|----------|-------|
| Label | `SPEED` |
| Range | 0.5 - 20 |
| Default | 5 |
| Step | 0.5 |
| Effect | How fast stars travel toward viewer (z-velocity) |

### 5. Direction
| Property | Value |
|----------|-------|
| Label | `DIRECTION` |
| Range | 0 - 360 (degrees) |
| Default | Center (null/disabled = toward viewer) |
| Step | 15 |
| Effect | Angle stars travel; 0° = right, 90° = down, etc. |

**Implementation Note**: 
- Default behavior: Stars fly *toward* the viewer (classic warp effect, vanishing point at center)
- With direction set: Stars travel in a uniform 2D direction across the screen

Consider a toggle: `WARP MODE` (toward viewer) vs `DRIFT MODE` (directional)

### 6. Trail Length
| Property | Value |
|----------|-------|
| Label | `TRAIL` |
| Range | 0 - 50 |
| Default | 0 |
| Step | 1 |
| Effect | Length of motion trail behind each star (0 = no trail) |

**Visual Style**: Trails should look like laser streaks—sharp, not blurred. Draw as lines extending behind the star based on velocity.

### 7. Shape
| Property | Value |
|----------|-------|
| Label | `SHAPE` |
| Type | Cycle button or dropdown |
| Options | `POINT` · `SQUARE` · `CROSS` · `DIAMOND` · `STAR` |
| Default | POINT |
| Effect | Rendered shape of each particle |

**Shape Definitions**:
- **POINT**: Single pixel (or small circle at larger sizes)
- **SQUARE**: Filled square, no anti-aliasing
- **CROSS**: + shape (3px cross at size 1, scales up)
- **DIAMOND**: 45° rotated square
- **STAR**: 4-point star/sparkle shape ✦

### 8. Mouse Repel
| Property | Value |
|----------|-------|
| Label | `REPEL` |
| Range | 0 - 200 |
| Default | 0 (off) |
| Step | 10 |
| Effect | Radius of cursor influence; stars push away from mouse |

**Behavior**:
- Stars within radius are pushed outward from cursor position
- Force strength decreases with distance (inverse square or linear falloff)
- Stars smoothly return when cursor moves away
- Set to 0 to disable interaction entirely

---

## Buttons

### Randomize Button
| Property | Value |
|----------|-------|
| Label | `RANDOMIZE` or `RND` |
| Style | Arcade button look (beveled, glowing border) |
| Action | Randomizes all slider values within their ranges |
| Feedback | Brief flash/pulse animation on click |

### Fullscreen Button
| Property | Value |
|----------|-------|
| Label | `FULLSCREEN` or `[ ]` icon |
| Style | Matching arcade button |
| Action | Toggles browser fullscreen mode (Fullscreen API) |
| Behavior | Control panel remains visible in fullscreen (or toggle to hide) |

---

## Layout

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                                                             │
│                    ★  STARFIELD CANVAS  ★                   │
│                         (full area)                         │
│                                                             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │              ═══ CONTROL PANEL ═══                  │    │
│  │                                                     │    │
│  │  STARS ████████████░░░░ 500                         │    │
│  │  SIZE  ███░░░░░░░░░░░░░ 3                           │    │
│  │  COLOR ████████████░░░░ CYAN                        │    │
│  │  SPEED █████░░░░░░░░░░░ 5.0                         │    │
│  │  DIR   ░░░░░░░░░░░░░░░░ WARP                        │    │
│  │  TRAIL ░░░░░░░░░░░░░░░░ 0                           │    │
│  │  SHAPE [POINT ▼]                                    │    │
│  │  REPEL ░░░░░░░░░░░░░░░░ 0                           │    │
│  │                                                     │    │
│  │  [ RANDOMIZE ]              [ FULLSCREEN ]          │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Layout Options

**Option A: Bottom Panel (Recommended)**
- Control panel fixed to bottom of screen
- Semi-transparent dark background
- Starfield extends behind panel
- Collapsible with a `▲ CONTROLS` toggle

**Option B: Side Panel**
- Vertical panel on right side
- Good for widescreen displays
- May feel more like a "tool"

**Option C: Floating Panel**
- Draggable window
- Can be minimized
- More complex to implement

---

## Technical Specifications

### Canvas Implementation

- Use HTML5 `<canvas>` for rendering
- Target 60fps with `requestAnimationFrame`
- Star data structure:
  ```javascript
  {
    x: number,      // screen x position
    y: number,      // screen y position  
    z: number,      // depth (for warp effect)
    size: number,   // base size
    hue: number,    // color hue (if varying)
  }
  ```

### Warp Effect Math

For classic "flying through space" effect:
```javascript
// Project 3D position to 2D screen
screenX = (star.x - centerX) / star.z * focalLength + centerX
screenY = (star.y - centerY) / star.z * focalLength + centerY
apparentSize = baseSize / star.z

// Move star toward viewer
star.z -= speed
if (star.z <= 0) respawnStar(star)  // Reset when passing viewer
```

### Directional Mode Math

For uniform 2D movement:
```javascript
star.x += Math.cos(directionRadians) * speed
star.y += Math.sin(directionRadians) * speed
// Wrap around screen edges
```

### Mouse Repel Implementation

```javascript
const dx = star.x - mouseX
const dy = star.y - mouseY
const distance = Math.sqrt(dx * dx + dy * dy)

if (distance < repelRadius && distance > 0) {
  const force = (repelRadius - distance) / repelRadius
  star.x += (dx / distance) * force * repelStrength
  star.y += (dy / distance) * force * repelStrength
}
```

### Retro Visual Effects

**Scanlines (CSS overlay)**:
```css
.scanlines::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    transparent 0px,
    transparent 2px,
    rgba(0, 0, 0, 0.3) 2px,
    rgba(0, 0, 0, 0.3) 4px
  );
  pointer-events: none;
}
```

**Pixel-perfect rendering**:
```css
canvas {
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
```

**Glow effect on UI**:
```css
.arcade-text {
  color: #0ff;
  text-shadow: 
    0 0 5px #0ff,
    0 0 10px #0ff,
    0 0 20px #0ff;
}
```

---

## Responsive Behavior

### Desktop (> 768px)
- Full control panel visible
- All sliders in view

### Mobile (< 768px)
- Compact control panel
- Sliders stack vertically
- Consider hamburger menu or collapsible panel
- Touch interaction for repel effect

---

## Accessibility

- Sliders use proper `<input type="range">` with labels
- Keyboard navigation for all controls
- `prefers-reduced-motion`: Reduce speed, disable trails
- High contrast text on control panel
- ARIA labels for buttons

---

## File Structure

```
/
├── index.html          # Main HTML structure
├── style.css           # Retro arcade styling
├── starfield.js        # Particle system & controls
└── fonts/              # Pixel font files (or use Google Fonts)
```

Or single self-contained HTML file with embedded CSS/JS.

---

## Success Criteria

1. ✅ Starfield renders smoothly at 60fps
2. ✅ All 8 sliders function and update in real-time
3. ✅ Randomize button sets all values randomly
4. ✅ Fullscreen mode works across browsers
5. ✅ Mouse repel effect responds to cursor
6. ✅ Retro arcade aesthetic is cohesive and authentic
7. ✅ Works on desktop and mobile

---

## Stretch Goals (Future Enhancements)

- **Preset buttons**: "WARP SPEED", "CALM DRIFT", "RAINBOW"
- **Export settings**: Copy URL with encoded parameters
- **Sound toggle**: Retro synth hum or whoosh sounds
- **Screenshot button**: Save canvas as image
- **Multiple star layers**: Foreground/background parallax
- **Nebula background**: Colorful gradient clouds behind stars

---

## Inspiration References

- Classic arcade attract screens (Galaga, Tempest, Star Wars)
- Windows "Starfield" screensaver
- Retro demo scene visuals
- Synthwave/outrun aesthetic
