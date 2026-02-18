# William Headlee Personal Webpage Specification

## Overview

A single-page personal landing page for **William Headlee** featuring an organic, playful aesthetic with interactive blobby particle effects that respond to cursor movement.

---

## Core Requirements

### Content
- **Name Display**: "William Headlee" as the primary headline
- **Greeting**: A brief, friendly welcome message (e.g., "Hello, welcome to my corner of the internet" or similar warm introduction)
- **Minimal Navigation**: Keep focus on the visual experience; minimal or no navigation elements

### Interactive Elements
- **Blobby Particle System**: Floating, organic blob-shaped particles that:
  - Drift gently across the screen in ambient motion
  - React to cursor proximity (repel, attract, or deform when near)
  - Have soft, rounded edges with subtle color variations
  - Vary in size for visual depth
  - Use smooth, eased animations for natural movement

---

## Design Direction

### Aesthetic Tone: **Organic Dreamscape**
A soft, almost surreal environment that feels alive and responsive—like floating through a bioluminescent sea or a calm, abstract dreamworld.

### Color Palette
| Role | Color | Notes |
|------|-------|-------|
| Background | Deep navy/dark teal (#0a1628 to #0d2137) | Creates depth, lets particles glow |
| Primary Blob | Soft coral/peach (#ff8a80, #ffab91) | Warm, inviting |
| Secondary Blob | Lavender/periwinkle (#b388ff, #8c9eff) | Cool contrast |
| Accent Blob | Mint/seafoam (#80cbc4, #a7ffeb) | Fresh accent |
| Text | Off-white (#f5f5f5) | High contrast, soft on eyes |

### Typography
- **Headline (Name)**: Large, elegant serif or distinctive display font
  - Consider: Playfair Display, Cormorant Garamond, or a softer geometric like Outfit
  - Size: 4-8rem responsive
  - Weight: Light to regular for elegance
- **Greeting**: Complementary sans-serif or the same family
  - Size: 1.2-1.5rem
  - Weight: Light
  - Subtle letter-spacing for airiness

### Layout
- Full viewport height (100vh)
- Content centered both vertically and horizontally
- Text layered above particle canvas
- Generous whitespace around text elements

---

## Technical Specifications

### Particle System Behavior

#### Blob Properties
```
- Count: 15-25 particles
- Size Range: 20px - 120px diameter
- Shape: Organic blob (achieved via border-radius variations or SVG/Canvas)
- Opacity: 0.3 - 0.7 (varied per particle)
- Blur: Subtle gaussian blur (2-8px) for soft edges
```

#### Ambient Motion
```
- Movement: Slow, flowing drift using sine/cosine waves
- Speed: 0.2 - 1.0 pixels per frame
- Direction: Random initial vectors, gentle course corrections
- Rotation: Optional slow rotation for organic feel
```

#### Cursor Interaction
```
- Detection Radius: 100-200px from cursor
- Response Type: Choose one or combine:
  - Repulsion: Particles gently pushed away
  - Attraction: Particles slowly drawn toward cursor
  - Deformation: Blob shape stretches/squishes based on cursor proximity
- Easing: Smooth spring or exponential easing
- Recovery: Particles return to natural state when cursor moves away
```

### Implementation Approach

#### Option A: HTML5 Canvas (Recommended)
- Best performance for many particles
- Full control over blob rendering
- Use `requestAnimationFrame` for smooth 60fps
- Metaball/marching squares for blob fusion effect (optional advanced feature)

#### Option B: CSS + JavaScript
- Individual div elements with `border-radius` and `filter: blur()`
- Transform-based movement via JS
- Simpler to implement, may lag with many particles

#### Option C: WebGL/Three.js
- For advanced effects like blob merging, glow, or 3D depth
- Higher complexity but stunning results

### Responsive Considerations
- Reduce particle count on mobile (10-15)
- Touch interaction support (tap/drag affects particles)
- Smaller max particle size on smaller screens
- Text scales appropriately (clamp() or fluid typography)

---

## Performance Guidelines

- Target: 60fps on modern devices
- Debounce/throttle cursor position updates if needed
- Use `will-change` or hardware acceleration hints
- Consider reduced motion preference (`prefers-reduced-motion`)
  - Disable or minimize particle animation
  - Keep static, subtle background gradient

---

## Accessibility

- Ensure text meets WCAG contrast requirements (4.5:1 minimum)
- Particles should not interfere with text readability
- Provide `prefers-reduced-motion` support
- Semantic HTML structure (h1 for name, p for greeting)
- Focus states if any interactive elements added

---

## Deliverable Structure

```
/
├── index.html      # Main HTML structure
├── styles.css      # Styling (or embedded)
├── particles.js    # Particle system logic (or embedded)
└── README.md       # Setup instructions (optional)
```

Or as a single self-contained HTML file with embedded CSS and JS.

---

## Success Criteria

1. ✅ Name "William Headlee" prominently displayed
2. ✅ Friendly greeting message visible
3. ✅ Blobby particles float organically across screen
4. ✅ Particles respond smoothly to cursor movement
5. ✅ Visual aesthetic feels cohesive and memorable
6. ✅ Performance maintains 60fps
7. ✅ Works on desktop and mobile devices

---

## Inspiration Notes

Think of the experience as:
- Floating through a calm, bioluminescent ocean
- Watching lava lamp blobs drift lazily
- Touching the surface of water and watching ripples form
- A living, breathing digital environment that welcomes visitors

The goal: **Make visitors want to play with the particles while feeling warmly greeted.**
