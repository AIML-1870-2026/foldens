# Julia Set Explorer — Complete Product Specification

> **What this document is:** A complete, self-contained specification for building an interactive fractal explorer as a single-page web application. It covers the mathematics, the user experience, the visual design, the technical architecture, and every feature in enough detail that a developer with no prior fractal knowledge can build the entire application from this document alone.

---

## Table of Contents

1. [Background: What Are Fractals?](#1-background-what-are-fractals)
2. [Product Vision](#2-product-vision)
3. [Technology and Architecture](#3-technology-and-architecture)
4. [The Mathematics: How Fractal Rendering Works](#4-the-mathematics-how-fractal-rendering-works)
5. [Feature Specification](#5-feature-specification)
6. [User Interface Design](#6-user-interface-design)
7. [State Management](#7-state-management)
8. [Rendering Pipeline and Performance](#8-rendering-pipeline-and-performance)
9. [Technical Constraints and Implementation Notes](#9-technical-constraints-and-implementation-notes)
10. [Implementation Phases](#10-implementation-phases)
11. [Acceptance Criteria](#11-acceptance-criteria)

---

## 1. Background: What Are Fractals?

This section exists so that the implementer understands the *meaning* behind the math, not just the formulas. This understanding is essential for building correct educational content, writing good UI labels, and making sound design decisions.

### 1.1 Complex Numbers (Quick Refresher)

A **complex number** has two parts: a real part and an imaginary part. Written as `z = a + bi`, where `a` is the real part, `b` is the imaginary part, and `i` is the imaginary unit (where i squared equals -1).

Complex numbers can be thought of as points on a 2D plane (the **complex plane**), where the horizontal axis is the real part and the vertical axis is the imaginary part. This is why fractals, which are computed over complex numbers, produce 2D images.

**Key operations we need:**

- **Addition:** `(a+bi) + (c+di) = (a+c) + (b+d)i` — Add the real and imaginary parts separately.
- **Multiplication:** `(a+bi)(c+di) = (ac-bd) + (ad+bc)i` — Use FOIL, remembering that i squared is -1.
- **Squaring:** `(a+bi)^2 = (a^2 - b^2) + (2ab)i` — This is the special case of multiplication used in every fractal iteration.
- **Magnitude:** `|z| = sqrt(a^2 + b^2)` — The distance from the origin.
- **Magnitude squared:** `|z|^2 = a^2 + b^2` — Cheaper to compute (avoids the square root), and we almost always compare against a threshold squared anyway.
- **Absolute parts:** `|Re(z)| + |Im(z)|i = |a| + |b|i` — Used only in the Burning Ship fractal.

In code, a complex number is simply two floating-point numbers: `re` and `im`. There is no need for a complex number library.

### 1.2 The Core Idea: Iteration and Escape

All three fractals in this app (Julia, Mandelbrot, Burning Ship) work on the same core principle:

1. **Start with a complex number z0.**
2. **Repeatedly apply a formula** to produce z1, z2, z3, and so on. This sequence is called the **orbit** of the starting point.
3. **Ask: does the orbit escape to infinity, or does it stay bounded?**

In practice, "escape to infinity" means the magnitude |z| exceeds a threshold called the **escape radius**. We use an escape radius of 2, which means we check whether `a^2 + b^2 > 4` (comparing the squared magnitude against 4 to avoid computing a square root). Once a point escapes past this radius, mathematical proof guarantees it will continue growing forever, so we can stop iterating.

The **color** of each pixel depends on **how quickly** it escapes:

- Points that escape quickly are colored one way (typically lighter or warmer colors).
- Points that take many iterations to escape are colored differently.
- Points that **never** escape within our iteration limit are considered to be **in the set** and are rendered black.

This produces the intricate, infinitely detailed boundary patterns that make fractals beautiful. The boundary between "escapes quickly" and "never escapes" is where all the visual complexity lives.

### 1.3 Julia Sets

**Formula:** `z(n+1) = z(n)^2 + c`

For a Julia set:

- **c is a fixed constant** chosen by the user. It does not change between pixels.
- **z0 is the pixel coordinate** — each pixel on screen maps to a point in the complex plane, and that point becomes the starting value z0.
- We iterate: `z1 = z0^2 + c`, then `z2 = z1^2 + c`, then `z3 = z2^2 + c`, and so on.
- We count how many iterations pass until `|z| > 2` (the escape condition).

**The key insight:** Different values of c produce *completely different* Julia sets. Some are connected (one piece), some are disconnected ("fractal dust"), and some are breathtakingly intricate. This is why c-parameter exploration is the heart of the app.

**Famous Julia sets and their c values:**

| Name | c value | Visual character |
|------|---------|------------------|
| Dendrite | 0 + 1i | Tree-like branching, like frost on a window |
| Douady Rabbit | -0.1226 + 0.7449i | Three-lobed shape resembling a rabbit |
| San Marco | -0.75 + 0i | Basilica/cathedral-like symmetry |
| Siegel Disk | -0.3905 + 0.5868i | Smooth circular regions floating in chaos |
| Spiral | -0.7455 + 0.1130i | Elegant spiral arms extending outward |
| Star | -0.5251 + 0.5251i | Star-shaped symmetry pattern |
| Lightning | -0.0305 + 0.6210i | Jagged, electrical-discharge-like tendrils |
| Galaxy | 0.355 + 0.355i | Swirling structure reminiscent of a spiral galaxy |

### 1.4 The Mandelbrot Set

**Formula:** `z(n+1) = z(n)^2 + c` (the same formula as Julia!)

But the roles of z0 and c are swapped:

- **z0 is always 0** for every pixel.
- **c is the pixel coordinate** — each pixel represents a different c value.
- We iterate: `z1 = 0^2 + c = c`, then `z2 = c^2 + c`, then `z3 = (c^2 + c)^2 + c`, and so on.

The Mandelbrot set is essentially a **map of all possible Julia sets**. Every single point in the Mandelbrot set corresponds to the c value of a Julia set:

- Points **inside** the Mandelbrot set (the black region) produce **connected** Julia sets (one piece).
- Points **outside** the Mandelbrot set produce **disconnected** Julia sets ("Fatou dust" — scattered points).
- Points **near the boundary** of the Mandelbrot set produce the most intricate and beautiful Julia sets.

This Mandelbrot-Julia correspondence is one of the most beautiful ideas in mathematics, and the split-view feature (Section 5.5) is designed to make this tangible and interactive.

### 1.5 The Burning Ship Fractal

**Formula:** `z(n+1) = (|Re(z(n))| + i * |Im(z(n))|)^2 + c`

The only difference from the Mandelbrot set: before squaring z at each step, we take the **absolute value** of the real and imaginary parts independently. This breaks the smooth rotational symmetry of the Mandelbrot set and creates a jagged, asymmetric shape that vaguely resembles a burning ship reflected in water.

In code, one iteration step looks like:

```
re_abs = abs(re)
im_abs = abs(im)
new_re = re_abs * re_abs - im_abs * im_abs + c_re
new_im = 2 * re_abs * im_abs + c_im
```

The Burning Ship uses the Mandelbrot convention: c is the pixel coordinate and z0 = 0. The interesting region of the Burning Ship is not centered at the origin; the default view should be centered around (-0.4, -0.6) with a zoom level that shows the entire ship shape.

### 1.6 Smooth Coloring (Eliminating Banding)

If we color pixels purely by their integer iteration count, we get ugly color "bands" — discrete stripes rather than smooth gradients. The **normalized iteration count** fixes this by producing a floating-point value that transitions smoothly between integer iterations.

The formula, applied after a point escapes:

```
smooth_iteration = iteration + 1 - log2(log2(|z_final|))
```

where `|z_final|` is the magnitude of z at the moment it escaped (when we stopped iterating).

In code:

```javascript
// After the iteration loop, if the point escaped at iteration n with z = (re, im):
const log_zn = Math.log(re * re + im * im) / 2;  // This is log(|z|)
const nu = Math.log(log_zn / Math.LN2) / Math.LN2;  // This is log2(log2(|z|))
const smoothed = iteration + 1 - nu;
```

This `smoothed` value is what gets mapped to a color gradient, producing the beautiful continuous color transitions that distinguish a polished fractal renderer from a basic one.

### 1.7 The Orbit of a Point

The **orbit** is the sequence of z values that a point passes through during iteration: `z0, z1, z2, z3, ... , zn`.

Visualizing this orbit is educational because:

- For points **inside** the set, the orbit stays bounded — it may spiral inward toward an attractor, cycle between a few fixed points, or wander chaotically within a bounded region.
- For points **outside** the set, the orbit eventually shoots off toward infinity — you can watch it spiral outward and escape.
- For points **near the boundary**, the orbit may hover for many iterations before finally escaping, showing why the boundary is where the visual complexity lives.

The educational mode (Section 5.7) draws these orbits as connected colored dots on the canvas overlay, making the abstract iteration process visible and intuitive.

---

## 2. Product Vision

### 2.1 What This App Is

An interactive, visually stunning fractal explorer that runs entirely in the browser. It lets users:

- Explore Julia sets by manipulating the c parameter in real-time and watching the fractal morph
- Discover the deep connection between the Mandelbrot set and Julia sets through a linked split-view
- Create beautiful fractal images and export them at high resolution for wallpapers or printing
- Learn the mathematics behind what they are seeing through interactive educational features
- Watch mesmerizing animations as fractals morph continuously between forms

### 2.2 Who It Is For

- **Curious learners** who have heard of fractals but never explored them interactively
- **Math enthusiasts** who want to understand the Mandelbrot-Julia connection viscerally, not just theoretically
- **Generative art lovers** who want to create and export beautiful fractal images
- **Educators** who want a classroom tool to demonstrate iteration, complex dynamics, and chaos theory
- **Casual visitors** who just want to see something beautiful and zoom around

### 2.3 Design Philosophy

- **The fractal is the star.** The UI should be minimal and dark — a frame for the artwork, not a distraction from it. Think planetarium control room: dark, focused, with the image commanding attention.
- **Instant feedback.** Every parameter change should produce visible results within one frame (approximately 16ms for the preview). The user should never wonder "did something happen?"
- **Progressive disclosure.** Basic controls (presets, zoom, color palette) are immediately visible and obvious. Advanced features (custom gradients, orbit visualization, animation path selection) are behind toggles and expandable panels, available when the user is ready for them.
- **No dead ends.** Every state should be interesting. If the user drags c to a boring value, the presets are right there to get back to beauty instantly.

---

## 3. Technology and Architecture

### 3.1 Technology Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | React (single `.jsx` file) | Deployed as a Claude artifact; must be completely self-contained |
| Rendering | HTML5 Canvas element | Direct pixel manipulation needed for fractal image construction |
| Computation | Web Worker (inline, via Blob URL) | Keeps UI thread free during heavy per-pixel math |
| Styling | Tailwind CSS utility classes | Available in artifact environment; pre-defined classes only, no compiler |
| State | React useReducer + useRef | Single state tree for predictable updates; refs for canvas, worker, animation |
| Fonts | Google Fonts via CSS import | For distinctive typography beyond system defaults |
| Icons | lucide-react | Icon library available in the artifact environment |

### 3.2 What "Single .jsx File" Means

The entire application — all React components, the Web Worker JavaScript code, all color palette data, all preset definitions, all educational text, all styling — must live in **one .jsx file** that exports a default React component.

This is a hard constraint of the deployment environment.

**Practical implications:**

- **Web Workers** cannot be loaded from a separate `.js` file. Instead, construct the worker by creating a `Blob` from a string of JavaScript code, creating a URL with `URL.createObjectURL(blob)`, and passing that URL to `new Worker(url)`.
- **No separate CSS files.** All styling is via Tailwind utility classes on JSX elements, or inline `style` attributes for values Tailwind does not cover.
- **No image assets.** Any icons come from `lucide-react`. Decorative elements use CSS, inline SVG, or Unicode characters.
- **All data is inline.** Color palettes, presets, educational text — everything is defined as JavaScript constants within the file.

### 3.3 Available Libraries

These libraries are pre-loaded in the artifact environment and can be imported directly:

- `react` — all hooks: useState, useReducer, useRef, useEffect, useCallback, useMemo, memo
- `lucide-react@0.263.1` — icon components such as Play, Pause, Download, ZoomIn, ZoomOut, RotateCcw, Info, ChevronLeft, ChevronRight, Settings, X, Columns, Sliders
- `lodash` — utility functions if needed (debounce, throttle, clamp, etc.)
- `d3` — could be useful for color interpolation, though manual interpolation works fine

### 3.4 What Is NOT Available

- **localStorage / sessionStorage** — these APIs do not work in the artifact environment. All state must live in React state.
- **No runtime network requests** — no API calls, no fetching data. Google Fonts can be loaded via a CSS `@import` statement, but no fetch() or XMLHttpRequest for data.
- **No WebGL / GPU compute** — we use CPU-based computation in a Web Worker. (WebGL could theoretically be used for rendering but adds complexity without guaranteed compatibility.)
- **No Node.js modules** — no npm install, no require(), only the pre-loaded libraries listed above.
- **No `<form>` elements** — use onClick, onChange, onInput event handlers directly on individual elements instead.

---

## 4. The Mathematics: How Fractal Rendering Works

This section provides the exact algorithms the implementer needs to translate into code. The mathematical background in Section 1 explains *why* these work; this section shows *how* to implement them.

### 4.1 Mapping Pixels to Complex Numbers

The canvas has pixel coordinates (px, py) ranging from (0, 0) at the top-left to (width-1, height-1) at the bottom-right. We need to map these to points in the complex plane.

The **viewport** is defined by three numbers:

- `centerX`, `centerY`: the complex plane coordinates at the center of the canvas.
- `zoom`: a scale factor. At zoom=1, the x-axis spans approximately -2 to +2 (a total range of 4 units). At zoom=2, it spans -1 to +1. At zoom=100, it spans -0.02 to +0.02.

The mapping for each pixel:

```javascript
const aspectRatio = canvasWidth / canvasHeight;
const xRange = 4.0 / zoom;  // Total width in complex plane units
const yRange = xRange / aspectRatio;  // Height, adjusted for aspect ratio

// For pixel (px, py), the corresponding complex number is:
const re = centerX + (px / canvasWidth - 0.5) * xRange;
const im = centerY - (py / canvasHeight - 0.5) * yRange;
// Note the minus sign: screen y goes DOWN, but complex plane y (imaginary axis) goes UP
```

**The inverse mapping** (complex plane coordinates back to pixel coordinates) is needed for drawing orbit visualizations:

```javascript
const px = ((re - centerX) / xRange + 0.5) * canvasWidth;
const py = (-(im - centerY) / yRange + 0.5) * canvasHeight;
```

### 4.2 Julia Set Iteration (Per Pixel)

```javascript
function computeJulia(z_re, z_im, c_re, c_im, maxIter) {
    let re = z_re;  // Starting point = pixel coordinate
    let im = z_im;
    let iteration = 0;

    // Iterate until escape or max iterations reached
    while (re * re + im * im <= 4.0 && iteration < maxIter) {
        // z = z^2 + c
        const newRe = re * re - im * im + c_re;
        const newIm = 2.0 * re * im + c_im;
        re = newRe;
        im = newIm;
        iteration++;
    }

    if (iteration === maxIter) {
        return -1;  // Point did not escape: it is IN the set
    }

    // Smooth coloring: compute fractional iteration count
    const log_zn = Math.log(re * re + im * im) / 2;
    const nu = Math.log(log_zn / Math.LN2) / Math.LN2;
    return iteration + 1 - nu;  // Smooth floating-point iteration count
}
```

For the Julia set: `z_re` and `z_im` come from the pixel-to-complex mapping (Section 4.1). `c_re` and `c_im` are the user-selected c parameter (the same for every pixel in the image).

### 4.3 Mandelbrot Set Iteration (Per Pixel)

```javascript
function computeMandelbrot(c_re, c_im, maxIter) {
    let re = 0;  // z0 is always 0 for Mandelbrot
    let im = 0;
    let iteration = 0;

    while (re * re + im * im <= 4.0 && iteration < maxIter) {
        const newRe = re * re - im * im + c_re;
        const newIm = 2.0 * re * im + c_im;
        re = newRe;
        im = newIm;
        iteration++;
    }

    if (iteration === maxIter) {
        return -1;  // In the set
    }

    const log_zn = Math.log(re * re + im * im) / 2;
    const nu = Math.log(log_zn / Math.LN2) / Math.LN2;
    return iteration + 1 - nu;
}
```

For the Mandelbrot set: `c_re` and `c_im` come from the pixel-to-complex mapping. z0 is always (0, 0).

### 4.4 Burning Ship Iteration (Per Pixel)

```javascript
function computeBurningShip(c_re, c_im, maxIter) {
    let re = 0;
    let im = 0;
    let iteration = 0;

    while (re * re + im * im <= 4.0 && iteration < maxIter) {
        // Take absolute values BEFORE squaring — this is the only difference
        const absRe = Math.abs(re);
        const absIm = Math.abs(im);
        const newRe = absRe * absRe - absIm * absIm + c_re;
        const newIm = 2.0 * absRe * absIm + c_im;
        re = newRe;
        im = newIm;
        iteration++;
    }

    if (iteration === maxIter) {
        return -1;
    }

    const log_zn = Math.log(re * re + im * im) / 2;
    const nu = Math.log(log_zn / Math.LN2) / Math.LN2;
    return iteration + 1 - nu;
}
```

### 4.5 Color Mapping: From Iteration Count to RGB

A **color palette** is defined as an ordered array of color stops, where each stop has a position (0 to 1) and an RGB color value:

```javascript
// Example: the "Classic" palette
const classicPalette = [
    { pos: 0.0,    color: [0, 7, 100] },      // dark blue
    { pos: 0.16,   color: [32, 107, 203] },    // medium blue
    { pos: 0.42,   color: [237, 255, 255] },   // near-white
    { pos: 0.6425, color: [255, 170, 0] },     // orange
    { pos: 0.8575, color: [0, 2, 0] },         // near-black
    { pos: 1.0,    color: [0, 7, 100] },       // wraps back to dark blue
];
```

To convert a smooth iteration count to an RGB color:

```javascript
function iterationToColor(smoothIter, maxIter, palette, colorOffset) {
    if (smoothIter < 0) {
        return [0, 0, 0];  // Inside the set is ALWAYS black, regardless of palette
    }

    // Normalize iteration to 0-1 range, then apply color offset
    let t = (smoothIter / maxIter + colorOffset) % 1.0;
    if (t < 0) t += 1.0;  // Ensure positive after modulo

    // Find which two palette stops bracket this t value
    let lowerStop = palette[0];
    let upperStop = palette[palette.length - 1];
    for (let i = 0; i < palette.length - 1; i++) {
        if (t >= palette[i].pos && t < palette[i + 1].pos) {
            lowerStop = palette[i];
            upperStop = palette[i + 1];
            break;
        }
    }

    // Linear interpolation between the two stops
    const range = upperStop.pos - lowerStop.pos;
    const fraction = range === 0 ? 0 : (t - lowerStop.pos) / range;

    return [
        Math.round(lowerStop.color[0] + fraction * (upperStop.color[0] - lowerStop.color[0])),
        Math.round(lowerStop.color[1] + fraction * (upperStop.color[1] - lowerStop.color[1])),
        Math.round(lowerStop.color[2] + fraction * (upperStop.color[2] - lowerStop.color[2])),
    ];
}
```

**Critical performance note about color cycling:** Changing the `colorOffset` only changes how iteration counts map to colors. It does NOT require recomputing any fractal iterations. The implementation should cache the iteration count buffer (as a Float32Array) and rerun only the color mapping step when the offset changes. This makes the color offset slider feel instant even on large canvases.

### 4.6 Orbit Computation (For Educational Mode)

To visualize the orbit of a single clicked point:

```javascript
function computeOrbit(z_re, z_im, c_re, c_im, maxIter, fractalType) {
    // For Julia: start at the clicked point, use the global c parameter
    // For Mandelbrot/BurningShip: start at z=0, use clicked point as c
    let re = fractalType === "julia" ? z_re : 0;
    let im = fractalType === "julia" ? z_im : 0;
    const cRe = fractalType === "julia" ? c_re : z_re;
    const cIm = fractalType === "julia" ? c_im : z_im;

    const orbit = [{ re, im }];  // Record every point in the sequence

    for (let i = 0; i < maxIter; i++) {
        if (re * re + im * im > 4.0) break;  // Escaped — stop recording

        let nextRe, nextIm;
        if (fractalType === "burningship") {
            const absRe = Math.abs(re);
            const absIm = Math.abs(im);
            nextRe = absRe * absRe - absIm * absIm + cRe;
            nextIm = 2 * absRe * absIm + cIm;
        } else {
            nextRe = re * re - im * im + cRe;
            nextIm = 2 * re * im + cIm;
        }
        re = nextRe;
        im = nextIm;
        orbit.push({ re, im });
    }

    return orbit;  // Array of { re, im } complex number objects
}
```

The orbit is drawn as connected dots overlaid on the fractal canvas image. Each dot is mapped from complex coordinates back to pixel coordinates using the inverse pixel mapping from Section 4.1.

### 4.7 Checking if c is Inside the Mandelbrot Set

This check is needed for the educational mode, which reports whether the current Julia set is connected or disconnected:

```javascript
function isInMandelbrotSet(c_re, c_im, maxIter) {
    // Run the Mandelbrot iteration for this c value
    // Returns true if c is inside the set (orbit does not escape)
    let re = 0, im = 0;
    for (let i = 0; i < maxIter; i++) {
        if (re * re + im * im > 4.0) return false;  // Escaped = c is outside
        const newRe = re * re - im * im + c_re;
        const newIm = 2.0 * re * im + c_im;
        re = newRe;
        im = newIm;
    }
    return true;  // Did not escape = c is inside the Mandelbrot set
}
```

**The rule:** If `isInMandelbrotSet(c_re, c_im)` returns true, the Julia set for this c value is **connected** (one piece). If it returns false, the Julia set is **disconnected** (fractal dust). This is a deep theorem in complex dynamics and one of the key educational points of the app.

---

## 5. Feature Specification

### 5.1 Fractal Rendering Engine

#### 5.1.1 Supported Fractal Types

The app supports three fractal types, selectable via a toggle group or dropdown in the header bar:

| Fractal Type | Label in UI | z0 (starting value) | c (constant) | Default Viewport Center | Default Zoom |
|-------------|-------------|---------------------|--------------|------------------------|-------------|
| Julia Set | "Julia" | pixel coordinate | user-controlled via sliders | (0, 0) | 1 |
| Mandelbrot Set | "Mandelbrot" | always 0 | pixel coordinate | (-0.5, 0) | 1 |
| Burning Ship | "Burning Ship" | always 0 | pixel coordinate | (-0.4, -0.6) | 0.7 |

**Switching behavior:** When the user switches fractal types:

- **Julia to Mandelbrot:** Reset viewport to the Mandelbrot default center and zoom. Hide the c-parameter sliders (in Mandelbrot mode, c is determined by pixel position, not user input).
- **Mandelbrot to Julia:** Reset viewport to Julia default. Show c-parameter sliders, defaulting to c = -0.7269 + 0.1889i (the Spiral preset, a visually appealing starting point).
- **To/from Burning Ship:** Reset viewport to the Burning Ship default. Burning Ship uses the same c-equals-pixel-coordinate convention as Mandelbrot, so hide c sliders.
- **Always preserved across switches:** color scheme, color offset, max iterations, control panel state.

#### 5.1.2 Max Iterations Control

A slider labeled **"Iterations"** in the control panel:

- **Range:** 50 to 2000
- **Default:** 200
- **Step:** 10 (for slider granularity)
- **Display:** Show current numeric value next to the slider

**Why this matters to the user:** More iterations reveals more detail, especially at deep zoom levels. But more iterations means slower rendering. At the default zoom, 200 is plenty. When zoomed in 1000x or more, the user may need to increase to 500-1000 to see crisp detail instead of muddy boundaries.

The information panel (Section 5.7) should explain this tradeoff when education mode is active.

#### 5.1.3 c-Parameter Controls (Julia Set Only)

These controls are **only visible when Julia Set is the selected fractal type.** They are hidden for Mandelbrot and Burning Ship.

**Two sliders with text inputs:**

Real part (a) slider:
- Label: "Real (a)"
- Range: -2.0 to 2.0
- Step: 0.001 (allows fine control)
- Default: -0.7269
- A small text input field to the right showing the current numeric value, which the user can type into for precise entry

Imaginary part (b) slider:
- Label: "Imag (b)"
- Range: -2.0 to 2.0
- Step: 0.001
- Default: 0.1889
- Same text input behavior as the real part

**Prominent c value display:** Above or near the sliders, prominently show the current c value in mathematical notation: `c = -0.7269 + 0.1889i`. Use the monospace font for this. Update in real-time as sliders move.

**Real-time update behavior during slider drag:**

1. On each slider onChange event, update the c value in React state.
2. Immediately trigger a low-resolution render (1/4 canvas resolution) using the main thread — this is fast enough to feel instant.
3. After the slider stops moving (200ms debounce with no new onChange events), trigger a full-resolution render via the Web Worker.

This two-step approach gives the user the feeling of "sculpting" the fractal with the sliders — they see a blurry preview that responds immediately, followed by a crisp full render once they pause.

**Text input behavior:** When the user types a value into the text input and presses Enter (or the input loses focus via blur), validate that it is a valid number in the range [-2, 2], update the c value, and trigger a full-resolution render. If the input is invalid, revert to the previous value.

---

### 5.2 Navigation and Viewport Controls

The user needs to pan around the fractal and zoom into areas of interest. These interactions must feel fluid and responsive — they are the primary way users explore.

#### 5.2.1 Panning (Click-and-Drag)

**Mouse interaction flow:**

1. User presses and holds the left mouse button on the canvas.
2. The cursor changes from crosshair to a "grabbing" hand cursor.
3. As the user drags, the viewport center shifts by the corresponding displacement in complex plane coordinates. The fractal image appears to move with the mouse.
4. During the drag, render at low resolution (1/4 canvas resolution, scaled up with CSS or canvas imageSmoothingEnabled) for smooth, fluid movement with no lag.
5. When the user releases the mouse button, immediately trigger a full-resolution render.

**Calculating the pan offset (pseudocode):**

```
On mousedown:
    Record startPixelX = event.clientX
    Record startPixelY = event.clientY
    Record startCenterX = current viewport.centerX
    Record startCenterY = current viewport.centerY

On mousemove (while dragging):
    deltaPixelX = event.clientX - startPixelX
    deltaPixelY = event.clientY - startPixelY
    xRange = 4.0 / viewport.zoom
    yRange = xRange / aspectRatio
    new centerX = startCenterX - (deltaPixelX / canvasWidth) * xRange
    new centerY = startCenterY + (deltaPixelY / canvasHeight) * yRange
    // Plus sign on Y because screen-Y is inverted relative to complex plane Y
```

#### 5.2.2 Zooming (Mouse Wheel)

**Mouse wheel behavior:**

- Scroll up (positive delta) zooms IN (magnifies).
- Scroll down (negative delta) zooms OUT.
- **Zoom center:** The zoom is centered on the **cursor position**, not the canvas center. The point under the cursor stays fixed while everything around it expands or contracts. This is the standard behavior users expect from map applications like Google Maps.

**Zoom factor:** 1.5x per normalized wheel tick.

**Calculating cursor-centered zoom (pseudocode):**

```
// Step 1: Find the complex-plane coordinates under the cursor BEFORE zooming
mouseRe = centerX + (mousePixelX / canvasWidth - 0.5) * (4.0 / currentZoom)
mouseIm = centerY - (mousePixelY / canvasHeight - 0.5) * (4.0 / currentZoom / aspectRatio)

// Step 2: Apply the zoom factor
if (scrolling up)  newZoom = currentZoom * 1.5
if (scrolling down) newZoom = currentZoom / 1.5

// Step 3: Adjust the viewport center so that (mouseRe, mouseIm) remains
// at the same pixel position after zooming
newCenterX = mouseRe - (mousePixelX / canvasWidth - 0.5) * (4.0 / newZoom)
newCenterY = mouseIm + (mousePixelY / canvasHeight - 0.5) * (4.0 / newZoom / aspectRatio)
```

**Zoom level display:** Show the current magnification somewhere visible (status bar or control panel). Format as a human-readable magnification factor:
- zoom = 1 displays as "x1"
- zoom = 100 displays as "x100"
- zoom = 1500 displays as "x1.5K"
- zoom = 1500000 displays as "x1.5M"

#### 5.2.3 Touch Support (Mobile and Tablet)

- **Single-finger drag** pans the viewport (same logic as mouse drag).
- **Two-finger pinch** zooms in or out. Track the distance between two touch points. As the distance increases, zoom in; as it decreases, zoom out. The zoom should be centered on the midpoint between the two fingers.
- **Two-finger drag** pans while pinching (simultaneous pan and zoom).

Implementation: use touchstart, touchmove, touchend events. Track active touches by their `identifier` property. Call `event.preventDefault()` to prevent the browser from scrolling the page.

#### 5.2.4 Zoom Buttons

Two buttons in the toolbar or control panel: a plus button and a minus button. These zoom in/out centered on the **canvas center** (not a cursor position, since there is no cursor involved in a button click). Each click applies the 1.5x zoom factor.

Use `ZoomIn` and `ZoomOut` icon components from lucide-react.

#### 5.2.5 Reset View Button

A button in the toolbar (use `RotateCcw` icon from lucide-react, or label it "Reset") that:

1. Resets the viewport to the default center and zoom for the current fractal type (see table in Section 5.1.1).
2. Resets the c parameter to the default (-0.7269 + 0.1889i) if currently in Julia mode.
3. Resets max iterations to 200.
4. Does NOT reset the color scheme or color offset (those are aesthetic preferences the user likely wants to keep).
5. Triggers a full-resolution render.

---

### 5.3 Color System

Color is what makes fractals visually stunning rather than just mathematically interesting. The color system has three layers: built-in palettes, a color cycling offset slider, and an advanced custom gradient editor.

#### 5.3.1 Built-in Color Palettes

Provide at least 8 palettes. The user selects one via a dropdown, or preferably a visual **palette strip** — a row of small horizontal gradient preview rectangles, each about 60px wide and 20px tall, that the user can click to select.

Each palette is defined as an array of color stops: `{ pos: 0-1, color: [r, g, b] }`. The `pos` value indicates where on the 0-to-1 normalized iteration scale that color appears. Colors between stops are linearly interpolated (see Section 4.5).

**Complete palette definitions (use these exact values or close approximations):**

**1. Classic (the default palette)**
```
pos 0.0    -> rgb(0, 7, 100)       dark blue
pos 0.16   -> rgb(32, 107, 203)    medium blue
pos 0.42   -> rgb(237, 255, 255)   near-white
pos 0.6425 -> rgb(255, 170, 0)     orange
pos 0.8575 -> rgb(0, 2, 0)         near-black
pos 1.0    -> rgb(0, 7, 100)       wraps back to dark blue
```
Character: A blue-gold cycle evoking the classic "Ultra Fractal" aesthetic.

**2. Inferno**
```
pos 0.0  -> rgb(0, 0, 4)          nearly black
pos 0.25 -> rgb(100, 15, 80)      dark magenta
pos 0.5  -> rgb(210, 50, 10)      deep red-orange
pos 0.75 -> rgb(255, 175, 15)     bright amber
pos 1.0  -> rgb(255, 255, 224)    pale yellow-white
```
Character: Fire/heat-map progression. Dramatic and warm.

**3. Ocean**
```
pos 0.0  -> rgb(0, 0, 40)         abyssal dark blue
pos 0.3  -> rgb(0, 50, 120)       deep ocean
pos 0.6  -> rgb(0, 150, 180)      teal
pos 0.85 -> rgb(150, 230, 240)    shallow tropical water
pos 1.0  -> rgb(240, 255, 255)    near-white foam
```
Character: Deep ocean to tropical shallows. Cool and serene.

**4. Neon**
```
pos 0.0  -> rgb(0, 0, 0)          black
pos 0.25 -> rgb(80, 0, 180)       electric violet
pos 0.5  -> rgb(255, 0, 128)      hot pink
pos 0.75 -> rgb(0, 255, 255)      cyan
pos 1.0  -> rgb(0, 0, 0)          black (wraps)
```
Character: Saturated neon on black. High contrast, dramatic.

**5. Earth**
```
pos 0.0  -> rgb(30, 15, 5)        dark soil
pos 0.3  -> rgb(120, 60, 10)      rich brown
pos 0.55 -> rgb(200, 150, 50)     warm amber
pos 0.8  -> rgb(230, 210, 160)    pale sand
pos 1.0  -> rgb(250, 240, 220)    cream
```
Character: Natural earth tones. Warm and organic.

**6. Grayscale**
```
pos 0.0 -> rgb(0, 0, 0)           black
pos 1.0 -> rgb(255, 255, 255)     white
```
Character: Pure structural detail with no color distraction. Elegant in its simplicity.

**7. Psychedelic**
```
pos 0.0    -> rgb(255, 0, 0)      red
pos 0.167  -> rgb(255, 255, 0)    yellow
pos 0.333  -> rgb(0, 255, 0)      green
pos 0.5    -> rgb(0, 255, 255)    cyan
pos 0.667  -> rgb(0, 0, 255)      blue
pos 0.833  -> rgb(255, 0, 255)    magenta
pos 1.0    -> rgb(255, 0, 0)      red (wraps)
```
Character: Full rainbow HSL rotation. Maximally colorful. Great for seeing fine detail.

**8. Ice**
```
pos 0.0  -> rgb(0, 10, 60)        deep arctic blue
pos 0.35 -> rgb(30, 80, 180)      cold blue
pos 0.65 -> rgb(160, 210, 255)    pale ice blue
pos 0.85 -> rgb(240, 245, 255)    frozen white
pos 1.0  -> rgb(255, 220, 230)    faint warm pink tinge
```
Character: Arctic cold with a whisper of warmth. Ethereal.

**Universal rule for set interior:** Regardless of which palette is active, points that do not escape (smooth iteration returns -1) are **always rendered as pure black** rgb(0, 0, 0). This is the mathematical convention, provides essential visual contrast, and makes the set boundary clearly visible.

#### 5.3.2 Color Cycling Offset

A slider labeled **"Color Offset"** in the control panel:

- **Range:** 0.0 to 1.0
- **Step:** 0.005 (fine enough for smooth visual changes)
- **Default:** 0.0

This slider shifts the starting position within the gradient, effectively "rotating" colors around the fractal. Mathematically, it adds the offset to the normalized iteration value before looking up the color (see Section 4.5).

**Performance:** Because this only remaps existing iteration data to new colors (no iteration recomputation needed), the slider should produce immediate visual feedback with no preview/full-res distinction. The implementation caches the iteration buffer and reruns only the color mapping.

#### 5.3.3 Custom Gradient Editor (Phase 3 Feature)

An expandable panel (collapsed by default, opened by a "Custom" button in the color section) that lets the user build their own color palette.

**UI elements:**

1. **Gradient preview bar** — A horizontal rectangle (full width of the panel, about 30px tall) showing the current custom gradient as a smooth color band.
2. **Color stop handles** — Small circles (about 12px diameter) positioned along the bottom edge of the gradient bar. Each circle sits at its stop's position and is filled with its stop's color. The user can drag these left and right to reposition stops.
3. **Add stop** — Clicking on an empty area of the gradient bar adds a new color stop at that position. The new stop's color is interpolated from its neighbors.
4. **Remove stop** — Right-clicking a stop handle (or clicking a small X icon that appears on hover) removes it. Minimum of 2 stops must remain.
5. **Color picker** — Clicking a stop handle opens a native HTML color input (`<input type="color">`) for that stop, letting the user choose any color.
6. **"Apply" button** — Sets the custom gradient as the active color palette for the fractal.

**Data format:** Same as built-in palettes: an array of `{ pos, color: [r, g, b] }` objects, sorted by `pos`.

**Storage:** Custom gradients are stored in React state only. They persist for the duration of the browser session but are lost on page refresh (no localStorage is available).

---

### 5.4 Preset Library

A collection of one-click buttons that load famous Julia set configurations, giving the user instant access to beautiful starting points.

#### 5.4.1 Preset Data

Each preset consists of:

```javascript
{
    name: "Display Name",          // Shown on the button
    c: { re: number, im: number }, // The c parameter value
    description: "...",            // 1-2 sentence explanation for the info panel
    suggestedPalette: "classic",   // Which palette key looks best with this set
    suggestedZoom: 1.0,            // Optional: override the default zoom level
}
```

**Complete preset list:**

| # | Name | c real | c imag | Description | Palette |
|---|------|--------|--------|-------------|---------|
| 1 | Dendrite | 0 | 1 | Tree-like branching pattern forming the boundary between connected and disconnected Julia sets. Named for its resemblance to crystal dendrites or frost patterns. | ice |
| 2 | Douady Rabbit | -0.1226 | 0.7449 | Three-lobed shape resembling a rabbit, discovered by mathematician Adrien Douady. The three "ears" correspond to a period-3 attracting cycle. | classic |
| 3 | San Marco | -0.75 | 0 | Named after St. Mark's Basilica in Venice for its cathedral-like symmetrical arches. Located at the cusp of the main Mandelbrot cardioid. | earth |
| 4 | Siegel Disk | -0.3905 | 0.5868 | Contains smooth circular regions (Siegel disks) floating amid chaotic fractal detail. Named after mathematician Carl Ludwig Siegel. | ocean |
| 5 | Spiral | -0.7455 | 0.1130 | Elegant double-spiral arms extending outward. One of the most aesthetically popular Julia sets. | neon |
| 6 | Star | -0.5251 | 0.5251 | Star-shaped pattern with pointed symmetry. The equal real and imaginary parts create balanced diagonal structure. | psychedelic |
| 7 | Lightning | -0.0305 | 0.6210 | Jagged tendrils branching outward, reminiscent of electrical discharge or Lichtenberg figures. | inferno |
| 8 | Galaxy | 0.355 | 0.355 | Swirling arms reminiscent of a spiral galaxy. Located in a disconnected region, producing intricate fractal dust. | classic |

#### 5.4.2 Preset Selection Behavior

When the user clicks a preset button:

1. **Smoothly animate the c transition.** Do not jump instantly. Linearly interpolate from the current c value to the preset's c value over approximately 300ms (about 18 frames at 60fps). During this interpolation, render low-resolution previews at each frame, creating a brief but satisfying morphing effect.
2. **Apply the suggested palette** immediately (no animation needed for color switch).
3. **Reset the viewport** to center (0, 0) and zoom 1 (or the preset's suggestedZoom if specified).
4. **Switch to Julia mode** if not already active (presets only apply to Julia sets).
5. **Trigger a full-resolution render** after the c interpolation completes.

#### 5.4.3 Preset UI Layout

**Desktop:** Display presets as a horizontal row of compact buttons in the header area or just below the header. Each button shows just the preset name in a small font. On hover, show a tooltip with the c value and a one-line description.

**Mobile:** Display presets in a horizontally scrollable strip that the user can swipe through.

---

### 5.5 Mandelbrot-Julia Connection (Split View)

This is the most educationally significant feature in the app. It makes the abstract mathematical relationship between the Mandelbrot set and Julia sets tangible and interactive.

#### 5.5.1 What It Is

A toggle button labeled "Split View" (or with a `Columns` icon from lucide-react) activates a side-by-side display:

```
+---------------------------+---------------------------+
|                           |                           |
|      MANDELBROT SET       |        JULIA SET          |
|       (left panel)        |      (right panel)        |
|                           |                           |
|         + <-- crosshair   |                           |
|                           |                           |
+---------------------------+---------------------------+
```

- **Left panel:** Always renders the Mandelbrot set.
- **Right panel:** Renders the Julia set for the currently selected or hovered c value.
- A thin vertical divider (1px, semi-transparent white) separates the two panels.
- Small labels at the top of each panel: "Mandelbrot Set" (left) and "Julia Set: c = ..." (right).

#### 5.5.2 Interaction Flow

**Hover mode (real-time exploration):**

1. The user moves their mouse over the Mandelbrot set in the left panel.
2. The cursor's position in complex-plane coordinates IS the c value for the Julia set.
3. As the mouse moves, the right panel updates in real-time with a low-resolution Julia set preview computed for that c value.
4. A crosshair indicator (thin intersecting lines, or a small + marker) follows the cursor on the Mandelbrot image, showing exactly which point is being sampled.
5. The c value display in the control panel updates in real-time as the mouse moves.

This creates a mesmerizing experience: as you sweep your mouse across the Mandelbrot set boundary, you see Julia sets morphing continuously in the right panel. Points near the Mandelbrot boundary produce the most intricate Julia sets. Points far outside produce simple disconnected dust. Points deep inside the black region produce simple filled shapes.

**Click to lock:**

1. Clicking on the Mandelbrot set "locks" that c value.
2. The right panel re-renders the Julia set at full resolution.
3. The crosshair becomes a fixed marker (does not follow the mouse anymore).
4. The c-parameter sliders in the control panel update to the clicked value.
5. Hover no longer updates the Julia set (the view is "locked") until the user clicks a different point.

**Independent navigation:**

- Each panel maintains its own independent viewport (center and zoom level).
- Mouse wheel and drag on the left panel control the Mandelbrot set's zoom and pan.
- Mouse wheel and drag on the right panel control the Julia set's zoom and pan.
- The panels do not affect each other's viewports. This lets the user zoom into the Mandelbrot boundary to pick precise c values while simultaneously zooming into Julia set detail.

#### 5.5.3 Educational Callout

When split view is first activated, display a brief banner or tooltip overlay message (dismissable):

> "The Mandelbrot set is a map of all Julia sets. Hover over the Mandelbrot set to preview the Julia set at each point. Points inside the black region produce connected Julia sets; points outside produce disconnected 'dust.' The most beautiful Julia sets are found near the boundary."

This message should be dismissable by clicking an X or clicking anywhere. It should not reappear after being dismissed in the same session.

#### 5.5.4 Exiting Split View

Clicking the "Split View" toggle again returns to the single-canvas view:

- The canvas shows whichever fractal type was active before entering split view (defaults to Julia if split view was the first mode used).
- The c value from the last clicked/locked point is preserved and applied to the Julia set.
- The viewport resets to the default for the active fractal type.

---

### 5.6 Animation and Parameter Morphing

#### 5.6.1 What It Is

An "Animate" button in the toolbar starts a continuous animation that smoothly changes the c parameter over time, causing the Julia set to morph like a living kaleidoscope. This is purely visual — a hypnotic, screen-saver-like experience.

#### 5.6.2 Animation Paths

The c parameter traces a predefined mathematical path through the complex plane. Each path is a function `c(t)` where t goes from 0 to 1 and loops continuously.

**Path definitions:**

**Circle:**
- Formula: `c_re = 0.7885 * cos(2 * PI * t)`, `c_im = 0.7885 * sin(2 * PI * t)`
- Description: Traces a circle of radius 0.7885 centered at the origin. This radius is carefully chosen because it passes near the Mandelbrot set boundary, producing maximally interesting Julia sets throughout the entire rotation.

**Figure Eight:**
- Formula: `c_re = 0.7 * sin(2 * 2 * PI * t)`, `c_im = 0.7 * sin(2 * PI * t)`
- Description: A Lissajous figure-eight curve that passes through diverse regions of the c parameter space, producing varied visual effects.

**Cardioid Trace:**
- Formula: `c_re = 0.5 * cos(2*PI*t) - 0.25 * cos(4*PI*t)`, `c_im = 0.5 * sin(2*PI*t) - 0.25 * sin(4*PI*t)`
- Description: Traces the main cardioid boundary of the Mandelbrot set, where the most intricate and beautiful Julia sets live. Produces an especially rich visual journey.

**Preset Tour:**
- Formula: Linear interpolation between the c values of all 8 presets in sequence, with cubic ease-in-out transitions between each pair.
- Description: Visits each famous Julia set in order, spending about 2 seconds at each before smoothly transitioning to the next. Provides a curated tour of the highlights.

#### 5.6.3 Animation Controls

When the "Animate" button is clicked:

1. A **playback control bar** appears — either below the header bar or floating at the bottom of the canvas. It contains:
   - **Play/Pause** toggle button (use `Play` and `Pause` icons from lucide-react)
   - **Path selector** dropdown listing the available paths: "Circle", "Figure Eight", "Cardioid Trace", "Preset Tour"
   - **Speed slider** labeled "Speed" — range 0.25x to 4x, default 1x, step 0.25x

2. The animation begins immediately upon clicking "Animate." At each animation frame:
   - Advance t by `deltaTime * speed * baseRate`, where baseRate is calibrated so that one full loop takes approximately 10 seconds at 1x speed.
   - Compute c(t) from the selected path formula.
   - Update the c-parameter display and slider positions to reflect the current c value.
   - Render the Julia set at low resolution for responsive motion.
   - Every approximately 500ms (or when the user pauses), trigger a full-resolution render for the current frame.

3. **Pausing:** Clicking Pause freezes the animation at the current t value. The full-resolution render completes for the paused frame, giving a crisp image. Clicking Play resumes from where it stopped.

4. **Manual override:** While the animation is playing, the c-parameter sliders still visually reflect the current c value (they move in sync). If the user manually grabs and drags a slider, the animation should automatically pause, returning control to the user.

5. **Stopping:** Clicking the "Animate" button again (or pressing Escape) stops the animation completely and hides the playback control bar. The c value at the moment of stopping is preserved.

#### 5.6.4 Implementation Notes

Use `requestAnimationFrame` for the animation loop. Store a ref to the animation frame ID so it can be cancelled on cleanup or when the user stops the animation.

```javascript
const animationRef = useRef(null);
const tRef = useRef(0);
const lastTimestampRef = useRef(null);

function animationLoop(timestamp) {
    if (!lastTimestampRef.current) lastTimestampRef.current = timestamp;
    const deltaSeconds = (timestamp - lastTimestampRef.current) / 1000;
    lastTimestampRef.current = timestamp;

    tRef.current = (tRef.current + deltaSeconds * speed * 0.1) % 1.0;
    const c = getPathPosition(tRef.current, selectedPath);
    dispatch({ type: 'SET_C', c });

    // Trigger low-res render...

    animationRef.current = requestAnimationFrame(animationLoop);
}
```

Cancel with `cancelAnimationFrame(animationRef.current)` when stopping or on component unmount.

---

### 5.7 Educational Mode

#### 5.7.1 Iteration Orbit Visualizer

When education mode is toggled on (via an "Education" or "Learn" button with an `Info` or `GraduationCap` icon), clicking on the fractal canvas computes and displays the **orbit** of that point — the sequence of z values produced by iteration.

**Visual representation of the orbit:**

- Draw the orbit as a series of **connected dots** overlaid on the fractal image (using a second canvas layer or by drawing on top of the fractal canvas after the fractal is rendered).
- Each dot is a filled circle of approximately 4px radius.
- **Color-code the dots** from cool to warm based on their position in the sequence: the first dot is blue, transitioning through cyan, green, yellow, and finally red for the last dot. This lets the user see the temporal progression at a glance.
- **Connect consecutive dots** with thin lines (1px wide, semi-transparent white or matching the dot colors).
- The **first point (z0)** is drawn as a slightly larger dot (6px radius) with a distinct white border, marking the starting position.
- If the orbit escapes the viewport (later orbit points are outside the visible area), draw an arrow from the last visible point indicating the direction of escape, rather than drawing off-screen dots.

**Information display when an orbit is visible:**

Show a small info box (either floating near the clicked point, or in the control panel) with:
- Clicked coordinates: `z0 = 0.342 - 0.171i`
- Escape status: `Escaped after 47 iterations` or `Did not escape (bounded — in the set)`
- Final magnitude: `|z| = 2.034` (for escaped points)
- Total orbit points: `48 points in orbit`

**Clearing the orbit:** Clicking a new point on the canvas replaces the previous orbit with the new one. Clicking the same point again, or pressing Escape, clears the orbit entirely.

#### 5.7.2 Information Panel

A collapsible panel (either a section within the right-side control panel, or a separate overlay) that displays contextual educational content. This panel is visible whenever education mode is toggled on.

**Content structure — the panel shows different text depending on the active fractal type:**

**Section always shown (regardless of fractal type):**

- Heading: **"What You're Seeing"**
- **Current formula** — Show the mathematical formula being computed, with actual current values substituted in. Examples:
  - Julia mode: `z(n+1) = z(n)^2 + (-0.7269 + 0.1889i)`
  - Mandelbrot mode: `z(n+1) = z(n)^2 + c, where c = each pixel's coordinate`
  - Burning Ship mode: `z(n+1) = (|Re(z(n))| + i|Im(z(n))|)^2 + c`
- **Iteration limit:** `Computing up to 200 iterations per pixel`
- **Zoom depth:** `Magnification: x1,234 — viewing features at scale 0.003`

**Julia Set specific content:**

- Heading: **"Julia Sets"**
- Explanation: "A Julia set is the boundary between points whose orbits escape to infinity and points whose orbits stay bounded, when iterating the formula z -> z^2 + c. The constant c is fixed for the entire image and determines the shape. You're currently viewing the Julia set for c = -0.7269 + 0.1889i."
- **Connectedness indicator:** A visual badge showing whether the current Julia set is connected or disconnected. Compute this by checking whether the current c value is inside the Mandelbrot set (using the function from Section 4.7). Display as:
  - Green circle + "Connected" — if c is inside the Mandelbrot set
  - Red circle + "Disconnected" — if c is outside the Mandelbrot set
- Connectedness explanation: "This Julia set is [connected/disconnected] because c = [value] is [inside/outside] the Mandelbrot set. A deep theorem of complex dynamics guarantees that Julia sets are connected when c is in the Mandelbrot set, and are 'fractal dust' (infinitely many disconnected pieces) when c is outside."

**Mandelbrot Set specific content:**

- Heading: **"The Mandelbrot Set"**
- Explanation: "The Mandelbrot set is the collection of all complex numbers c for which the iteration z -> z^2 + c, starting from z = 0, produces an orbit that never escapes to infinity. The black region IS the Mandelbrot set. The colored region outside shows how quickly orbits escape — brighter colors mean faster escape."
- Connection hint: "Every point in this image corresponds to a Julia set. Use Split View to see the Julia set for any point you hover over. The most intricate Julia sets are found near the boundary of the Mandelbrot set."

**Burning Ship specific content:**

- Heading: **"The Burning Ship Fractal"**
- Explanation: "The Burning Ship fractal uses a variation of the Mandelbrot formula: before squaring z at each step, the real and imaginary parts are replaced by their absolute values. This tiny change breaks the smooth symmetry and produces jagged, asymmetric structures. The name comes from the main shape's resemblance to a ship engulfed in flames, reflected in water."

**Writing style:** All educational text should be clear, concise, and jargon-free. Assume the reader is an intelligent adult who has not studied complex analysis. Mathematical notation should be accompanied by plain-language explanation. Use analogies where helpful.

---

### 5.8 Export and Sharing

#### 5.8.1 Quick Download (Screen Resolution)

A "Download" button in the header toolbar (use the `Download` icon from lucide-react). Clicking it:

1. Ensures the canvas has a completed full-resolution render (if a render is in progress, wait for it to finish).
2. Converts the canvas content to a PNG data URL via `canvas.toDataURL('image/png')`.
3. Creates a temporary invisible `<a>` element with the `download` attribute set to a descriptive filename.
4. Programmatically clicks the `<a>` element to trigger the browser's file download dialog.
5. Removes the temporary element from the DOM.

**Filename format:** `{fractalType}_c{re}{sign}{im}i_{iterations}iter.png`

Examples:
- `julia_c-0.7269+0.1889i_200iter.png`
- `mandelbrot_zoom1234x_200iter.png`
- `burningship_zoom1x_200iter.png`

#### 5.8.2 High-Resolution Export

A dropdown or secondary action on the Download button (for example, a small chevron arrow next to the download icon, or a long-press) that opens a resolution picker dialog overlay.

**Available resolutions:**

| Label in UI | Pixel Dimensions | Typical File Size | Intended Use |
|------------|-----------------|-------------------|-------------|
| Screen | (current canvas size) | 1-3 MB | Quick sharing, social media |
| Full HD | 1920 x 1080 | 3-6 MB | Desktop wallpaper |
| 4K | 3840 x 2160 | 10-20 MB | High-resolution displays |
| Print Quality | 4800 x 3600 | 15-30 MB | Physical printing at 300 DPI (16x12 inches) |

**High-resolution export process:**

1. User selects a resolution option in the dialog.
2. Show a modal overlay with a progress bar and the text: "Rendering at [width] x [height]..."
3. Create an off-screen canvas element at the target resolution (this canvas is not added to the DOM — it exists only in JavaScript memory).
4. Send a render job to the Web Worker with the larger dimensions but the exact same viewport, fractal type, c value, max iterations, and color scheme as the current view.
5. The Web Worker computes the iteration data for every pixel at the target resolution and sends progress updates (percentage of rows completed).
6. Update the progress bar as messages arrive from the worker.
7. When complete, map iterations to colors and write to the off-screen canvas.
8. Convert the off-screen canvas to a PNG blob and trigger a download.
9. Release the off-screen canvas and large buffers to free memory.
10. Close the modal.

**Progress communication:** The Web Worker sends `{ type: 'progress', progress: 0.0 to 1.0 }` messages at regular intervals during computation (for example, after every 50 rows). The main thread updates the progress bar UI accordingly.

#### 5.8.3 Share Parameters (Stretch Goal — Phase 3)

A "Copy Link" button (use `Link` or `Share` icon) that encodes the current application state into URL query parameters:

```
?type=julia&re=-0.7269&im=0.1889&cx=0&cy=0&zoom=1&iter=200&palette=classic&offset=0
```

Clicking the button copies this URL to the clipboard and shows a brief toast notification: "Link copied!" that fades after 2 seconds.

On page load, the app checks `window.location.search` for these query parameters and initializes state from them if present. This allows users to share exact fractal views with others.

---

### 5.9 Burning Ship Fractal

The Burning Ship is available as a fractal type option alongside Julia and Mandelbrot. Most behavior is inherited from the general rendering engine (Section 5.1), but here are Burning Ship-specific details:

#### 5.9.1 Default Viewport

The interesting region of the Burning Ship is NOT centered at the origin (unlike Julia and Mandelbrot). The default viewport when selecting Burning Ship should be:

- **Center:** (-0.4, -0.6)
- **Zoom:** 0.7 (slightly zoomed out to show the full ship shape)

#### 5.9.2 Orientation

The Burning Ship fractal is conventionally displayed with the ship hull at the top and "flames" extending downward. Since our canvas mapping flips the y-axis (screen y goes down, complex plane y goes up), the default rendering should produce the conventional orientation. If the ship appears upside-down during implementation, negate the imaginary component in the viewport mapping to correct it.

#### 5.9.3 Interesting Zoom Targets (For Information Panel)

When Burning Ship is active and education mode is on, the info panel can mention these interesting regions to explore:

- The main "ship" body centered around (-1.8, 0.0)
- Miniature copies of the entire ship scattered throughout the boundary
- The "antenna" structures near (-1.75, 0.02)
- The "mast" structure extending upward from the main hull

#### 5.9.4 No Julia Variant

In this app, the Burning Ship uses only the Mandelbrot-style convention (c = pixel coordinate, z0 = 0). We are NOT implementing a "Burning Ship Julia" variant. This simplifies the interface without losing educational value — the Burning Ship is included primarily as an interesting variation that demonstrates how small formula changes create dramatically different fractals.

---

## 6. User Interface Design

### 6.1 Overall Layout

The interface follows a cinema/observatory metaphor: the fractal image dominates the screen, and all controls are secondary, appearing as translucent overlays on a dark backdrop.

#### 6.1.1 Desktop Layout (screen width 1024px and above)

```
+---------------------------------------------------------------------+
|  HEADER BAR (48px tall, full width, translucent dark background)     |
|                                                                      |
|  [Fractal Title]  [Julia v]  [Dendrite|Rabbit|Spiral|Star|...]     |
|  [Split View] [Animate] [Education] [Download v] [Reset]            |
+----------------------------------------------+-----------------------+
|                                              |                       |
|                                              |  CONTROL PANEL        |
|                                              |  (280px wide)         |
|                                              |  (translucent glass)  |
|          MAIN CANVAS                         |  (collapsible)        |
|      (fills all remaining space)             |                       |
|                                              |  -- Parameters --     |
|      This is where the fractal renders.      |  c = -0.7269+0.1889i  |
|      It should be as large as possible.      |  Real (a) [slider]    |
|                                              |  Imag (b) [slider]    |
|      Background: the fractal image           |                       |
|      Cursor: crosshair                       |  -- Rendering --      |
|      During drag: grab cursor                |  Iterations [slider]  |
|                                              |                       |
|                                              |  -- Colors --         |
|                                              |  [palette strip]      |
|                                              |  Offset [slider]      |
|                                              |                       |
|                                              |  -- Viewport --       |
|                                              |  Zoom: x1,234         |
|                                              |  Center: (0.1, -0.3)  |
|                                              |  [+] [-]              |
|                                              |                       |
+----------------------------------------------+  -- Education --      |
|  STATUS BAR (24px tall, below canvas)        |  (shown when enabled) |
|  Render: 142ms | 1200x800 | Julia Set       |  [info content]       |
+----------------------------------------------+-----------------------+
```

**Key measurements:**
- Header bar: 48px tall, spans full window width
- Control panel: 280px wide, right side, stretches from below header to bottom of window, scrolls internally if content overflows
- Main canvas: fills all remaining horizontal space (window width minus 280px) and vertical space (window height minus 48px header minus 24px status bar)
- Status bar: 24px tall, below the canvas, width matches the canvas (not the control panel)

**Control panel collapse:** A small toggle icon (ChevronRight when open, ChevronLeft when collapsed) at the left edge. When collapsed, the panel slides off-screen and the canvas expands to full width.

#### 6.1.2 Split View Layout

When split view is active, the canvas area divides into two equal-width panels with a thin 1px divider. Left panel always shows Mandelbrot; right panel shows the Julia set. Small text labels at the top of each panel identify them.

#### 6.1.3 Tablet Layout (768-1023px)

Canvas is full-width. Controls become a bottom drawer with a drag handle, collapsed by default to a thin 40px bar. Header condenses to icons only. Presets in a horizontal scroll strip.

#### 6.1.4 Mobile Layout (below 768px)

Canvas is full-screen minus a minimal 40px header. All controls in a swipe-up bottom sheet. Touch gestures for canvas interaction. Split view disabled below 600px width.

### 6.2 Visual Design Specification

**Aesthetic: Dark observatory / planetarium control room.**

#### 6.2.1 UI Colors

- Page background: #08080f (near-black with faint blue tint)
- Header/panel background: rgba(255,255,255,0.03) with backdrop-filter blur(12px) (glass-morphism)
- Panel borders: rgba(255,255,255,0.06)
- Primary text: rgba(255,255,255,0.87)
- Secondary text: rgba(255,255,255,0.5)
- Muted text: rgba(255,255,255,0.3)
- Accent color: derived from active palette midpoint
- Button background: rgba(255,255,255,0.05) default, rgba(255,255,255,0.1) on hover
- Slider track: rgba(255,255,255,0.1); slider thumb: active palette accent color

#### 6.2.2 Typography (load via Google Fonts @import)

- App title: **Syne** 800 weight, 18px
- Section headers: **DM Sans** 600 weight, 13px, uppercase, letter-spacing 0.05em
- Body text and labels: **DM Sans** 400 weight, 13px
- Numeric values: **JetBrains Mono** 400 weight, 13px
- Educational content: **DM Sans** 400 weight, 14px, line-height 1.6
- Preset buttons: **DM Sans** 500 weight, 12px
- Status bar: **JetBrains Mono** 300 weight, 11px

#### 6.2.3 Spacing

- Panel padding: 16px; Section spacing: 20px; Label-to-control: 6px
- Slider: 4px track, 16px thumb; Button padding: 8px 12px
- Border radius: 6px buttons, 8px panels; Icon sizes: 16px toolbar, 14px inline

#### 6.2.4 Transitions

- Panel open/close: 300ms ease-out; Hover states: 150ms ease
- Preset morph: 300ms linear; Color switch: instant
- Fractal type switch: 150ms fade out + in; Split view: 300ms ease-out
- Slider glow: 200ms ease; Toast notification: 200ms in, 1500ms hold, 300ms out

#### 6.2.5 Cursors

- Canvas (default): crosshair; Canvas (dragging): grabbing
- Interactive controls: pointer; Gradient editor bar: crosshair; Dragging color stops: grabbing

---

## 7. State Management

### 7.1 State Shape

Use React useReducer with this state object (all application state lives here):

```javascript
const initialState = {
    fractalType: "julia",              // "julia" | "mandelbrot" | "burningship"
    c: { re: -0.7269, im: 0.1889 },   // Julia set c parameter
    viewport: { centerX: 0, centerY: 0, zoom: 1 },
    maxIterations: 200,
    colorScheme: "classic",
    colorOffset: 0.0,
    customGradients: [],
    splitView: false,
    mandelbrotViewport: { centerX: -0.5, centerY: 0, zoom: 1 },
    splitViewLocked: false,
    hoverC: null,
    animation: { playing: false, speed: 1.0, path: "circle" },
    educationMode: false,
    orbitPoint: null,
    orbitData: null,
    controlPanelOpen: true,
    showAnimationControls: false,
    showExportDialog: false,
    showCustomGradientEditor: false,
};
```

### 7.2 Reducer Actions

| Action Type | Payload | Effect |
|-------------|---------|--------|
| SET_FRACTAL_TYPE | { fractalType } | Sets fractal type, resets viewport to defaults for that type |
| SET_C | { re, im } | Updates c parameter |
| SET_VIEWPORT | { centerX, centerY, zoom } | Updates main viewport |
| SET_MAX_ITERATIONS | { maxIterations } | Updates iteration limit |
| SET_COLOR_SCHEME | { colorScheme } | Switches palette |
| SET_COLOR_OFFSET | { colorOffset } | Updates color offset |
| ADD_CUSTOM_GRADIENT | { name, stops } | Appends a new custom gradient to the customGradients array. |
| TOGGLE_SPLIT_VIEW | (none) | Toggles splitView boolean. Resets splitViewLocked and hoverC. |
| SET_MANDELBROT_VIEWPORT | { centerX, centerY, zoom } | Updates the Mandelbrot panel's independent viewport. |
| SET_HOVER_C | { re, im } or null | Updates the hover position in split view (for real-time Julia preview). |
| LOCK_SPLIT_VIEW_C | { re, im } | Locks a c value from a split view click. Sets splitViewLocked to true and updates c. |
| SET_ANIMATION | { playing?, speed?, path? } | Partial update to the animation sub-state. Only provided fields are changed. |
| SET_ORBIT_POINT | { re, im } or null | Sets or clears the point selected for orbit visualization. |
| SET_ORBIT_DATA | { orbit: Array } | Stores the computed orbit array after orbit computation completes. |
| TOGGLE_CONTROL_PANEL | (none) | Toggles controlPanelOpen boolean. |
| TOGGLE_EDUCATION_MODE | (none) | Toggles educationMode boolean. Clears orbitPoint and orbitData when turning off. |
| SET_EXPORT_DIALOG | { show: boolean } | Shows or hides the high-resolution export dialog. |
| RESET_VIEW | (none) | Resets viewport to default for current fractal type, resets c to default, resets maxIterations to 200. Does NOT reset color settings. |
| APPLY_PRESET | { preset: object } | Applies a preset: sets c value, suggested palette, suggested zoom, switches to Julia mode. |

### 7.3 Refs (Mutable Values That Should Not Trigger Re-renders)

Some values change frequently during interactions (like drag position or animation timing) and should NOT be stored in React state because they would cause excessive re-renders. Use `useRef` for these:

```javascript
const canvasRef = useRef(null);               // Reference to the main <canvas> DOM element
const mandelbrotCanvasRef = useRef(null);     // Reference to the split-view left <canvas>
const juliaCanvasRef = useRef(null);          // Reference to the split-view right <canvas>
const workerRef = useRef(null);               // Reference to the Web Worker instance
const iterationBufferRef = useRef(null);      // Cached iteration data (Float32Array) for color-only updates
const animationFrameRef = useRef(null);       // The requestAnimationFrame ID (for cancellation)
const renderTimeoutRef = useRef(null);        // The debounce setTimeout ID for full-res renders
const isDraggingRef = useRef(false);          // Whether the user is currently dragging (panning)
const dragStartRef = useRef({ x: 0, y: 0 }); // The pixel position where the drag started
const dragStartViewportRef = useRef(null);    // The viewport state at the start of the drag
const lastTimestampRef = useRef(null);        // Previous animation frame timestamp (for delta-time calculation)
```

---

## 8. Rendering Pipeline and Performance

### 8.1 The Two-Tier Rendering Strategy

Every parameter change that affects the fractal image triggers a two-step rendering process designed to balance responsiveness with quality:

**Step 1 — Instant Low-Resolution Preview (main thread, synchronous):**

- Compute the fractal at **1/4 resolution** — if the canvas is 1200x800, compute at 300x200 pixels.
- Run this computation **on the main thread** (not in the Web Worker), because at this low resolution it completes in approximately 10-50ms, which is fast enough to not cause perceptible UI lag.
- Draw the low-res result to the full-size canvas with `ctx.imageSmoothingEnabled = true`, which applies bilinear interpolation to scale it up. This produces a blurry but recognizable preview.
- This step happens synchronously within the event handler, so the user sees feedback before the next animation frame.

**Step 2 — Debounced Full-Resolution Render (Web Worker, asynchronous):**

- Start a debounce timer of 200ms. If another parameter change arrives before the timer fires, reset the timer. This prevents wasted computation when the user is actively dragging a slider or panning.
- When the timer fires (200ms of no changes), send the render job to the Web Worker at full canvas resolution.
- The Web Worker computes the iteration value for every pixel and returns a Float32Array buffer.
- On the main thread, map each iteration value to an RGB color using the current palette and offset, write the results to an ImageData object, and paint it to the canvas with putImageData.
- Store the Float32Array in iterationBufferRef for future color-only updates.

### 8.2 Web Worker Architecture

Since the app is a single .jsx file, the Web Worker must be created from an inline string:

```javascript
function createFractalWorker() {
    const workerCode = `
        // The worker receives render jobs and returns iteration data
        self.onmessage = function(event) {
            const {
                width, height,
                centerX, centerY, zoom,
                maxIter, fractalType,
                cRe, cIm
            } = event.data;

            const buffer = new Float32Array(width * height);
            const aspectRatio = width / height;
            const xRange = 4.0 / zoom;
            const yRange = xRange / aspectRatio;

            for (let py = 0; py < height; py++) {
                for (let px = 0; px < width; px++) {
                    const re = centerX + (px / width - 0.5) * xRange;
                    const im = centerY - (py / height - 0.5) * yRange;

                    let smoothIter;
                    // ... dispatch to appropriate iteration function based on fractalType
                    // Store result:
                    buffer[py * width + px] = smoothIter;
                }

                // Send progress updates every 50 rows
                if (py % 50 === 0) {
                    self.postMessage({
                        type: 'progress',
                        progress: py / height
                    });
                }
            }

            // Transfer the buffer (zero-copy) back to the main thread
            self.postMessage(
                { type: 'complete', buffer: buffer },
                [buffer.buffer]  // Transferable list
            );
        };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);
    URL.revokeObjectURL(url);  // URL can be revoked after worker is created
    return worker;
}
```

**Message protocol between main thread and worker:**

Messages FROM main thread TO worker:
```javascript
{
    width: 1200,              // Canvas width in pixels
    height: 800,              // Canvas height in pixels
    centerX: 0,               // Viewport center (real axis)
    centerY: 0,               // Viewport center (imaginary axis)
    zoom: 1,                  // Zoom level
    maxIter: 200,             // Maximum iterations
    fractalType: "julia",     // "julia", "mandelbrot", or "burningship"
    cRe: -0.7269,             // c parameter real part (only used for Julia)
    cIm: 0.1889,              // c parameter imaginary part (only used for Julia)
}
```

Messages FROM worker TO main thread:
```javascript
// Progress update (sent periodically during computation):
{ type: 'progress', progress: 0.0 to 1.0 }

// Final result (sent once computation is complete):
{ type: 'complete', buffer: Float32Array }
// The buffer contains one float per pixel: the smooth iteration count,
// or -1 for points inside the set.
// The buffer is TRANSFERRED (not copied) via the Transferable mechanism.
```

**Worker lifecycle:**

- Create the worker once when the component mounts (in a useEffect with empty dependency array).
- Terminate the worker and revoke the blob URL when the component unmounts (in the useEffect cleanup function).
- If a new render job arrives while the previous one is still running, the simplest approach is to let the old job complete and ignore its result if the parameters have changed. Alternatively, terminate and recreate the worker.

### 8.3 Color Mapping on the Main Thread

After receiving the iteration buffer from the worker, convert it to canvas pixels:

```javascript
function paintCanvas(canvas, iterationBuffer, width, height, palette, colorOffset, maxIter) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(width, height);
    const pixels = imageData.data;  // Uint8ClampedArray, 4 bytes per pixel (R, G, B, A)

    for (let i = 0; i < iterationBuffer.length; i++) {
        const smoothIter = iterationBuffer[i];
        const [r, g, b] = iterationToColor(smoothIter, maxIter, palette, colorOffset);
        const pixelIndex = i * 4;
        pixels[pixelIndex]     = r;
        pixels[pixelIndex + 1] = g;
        pixels[pixelIndex + 2] = b;
        pixels[pixelIndex + 3] = 255;  // Full opacity
    }

    ctx.putImageData(imageData, 0, 0);
}
```

This color mapping step is fast — typically under 20ms even for 1920x1080 — because it is simple arithmetic with no branching. It runs on the main thread.

### 8.4 Optimization: Color-Only Updates

When the user changes ONLY the color scheme or color offset (without changing the fractal parameters, viewport, or iterations), we can skip the expensive iteration computation entirely:

1. Check if `iterationBufferRef.current` exists and was computed with the same fractal parameters, viewport, and iteration count as the current state.
2. If yes, call `paintCanvas()` directly with the cached buffer and the new color settings.
3. This makes color palette switches and offset slider changes feel truly instant.

**Implementation detail:** Store metadata alongside the cached buffer (fractal type, c value, viewport, maxIter) and compare it with current state to determine if the cache is valid.

### 8.5 Canvas Sizing

The canvas must fill its container and resize responsively when the browser window changes size.

```javascript
useEffect(() => {
    const container = canvasRef.current.parentElement;
    const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
            const { width, height } = entry.contentRect;
            const w = Math.floor(width);
            const h = Math.floor(height);
            if (canvasRef.current.width !== w || canvasRef.current.height !== h) {
                canvasRef.current.width = w;
                canvasRef.current.height = h;
                // Invalidate the iteration cache and trigger a new render
                iterationBufferRef.current = null;
                triggerFullRender();
            }
        }
    });
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
}, []);
```

**HiDPI / Retina consideration:** For sharp rendering on high-DPI screens, you can multiply the canvas dimensions by `window.devicePixelRatio` and scale the canvas element with CSS (`style={{ width: '100%', height: '100%' }}`). However, this doubles or triples the pixel count, which significantly impacts rendering performance. A reasonable compromise: use device pixel ratio for the final full-res render but NOT for the low-res preview.

### 8.6 Performance Targets

| Scenario | Target Time | Notes |
|----------|-------------|-------|
| Low-res preview after parameter change | Under 50ms | Should feel instant; runs on main thread |
| Full render at 800x600, 200 iterations | Under 300ms | Standard laptop performance |
| Full render at 1200x800, 200 iterations | Under 500ms | Typical canvas size on desktop |
| Full render at 1920x1080, 200 iterations | Under 1.5 seconds | Full HD, acceptable wait time |
| Full render at 1200x800, 1000 iterations | Under 2 seconds | Deep zoom with high detail |
| Color-only update (any resolution) | Under 20ms | Cache reuse, no iteration needed |
| Animation frame (low-res) | Under 33ms | 30fps target for smooth animation |

**If performance targets are not met, consider these optimizations:**

1. Reduce preview resolution further (1/6 or 1/8 instead of 1/4).
2. Use **multiple Web Workers** (one per CPU core) to parallelize the computation. Divide the canvas into horizontal strips and assign each strip to a different worker. Use `navigator.hardwareConcurrency` to determine how many workers to create.
3. Reduce the default max iteration count.
4. Increase the debounce interval for full-res renders.
5. Implement **early bailout** for Mandelbrot: points inside the main cardioid or period-2 bulb can be detected with a simple formula and immediately marked as "in the set" without any iteration.

---

## 9. Technical Constraints and Implementation Notes

### 9.1 Hard Constraints (Must Be Followed)

1. **Single `.jsx` file.** The entire application — every component, the Web Worker code string, all palette and preset data constants, all educational text content, all inline styles — must exist in one .jsx file that exports a default React component.

2. **React artifact environment.** The file is rendered in an isolated iframe with React and ReactDOM pre-loaded. The default export is instantiated and rendered automatically.

3. **No localStorage or sessionStorage.** These browser APIs are NOT functional in the artifact environment. All application state must live in React state (useState or useReducer). Nothing persists between page refreshes.

4. **No `<form>` elements.** Use standard React event handlers (onClick, onChange, onInput, onMouseDown, etc.) directly on individual elements.

5. **Tailwind CSS pre-defined classes only.** A subset of Tailwind's base stylesheet is available. Standard classes like `w-72`, `p-4`, `bg-black`, `text-white`, `flex`, `gap-2`, `rounded-lg` all work. Arbitrary value classes like `w-[280px]` may not work reliably. For precise values not covered by Tailwind, use inline `style` attributes.

6. **No runtime network requests for data.** Google Fonts can be loaded via a CSS `@import` rule at the top of a `<style>` tag. But no `fetch()`, no `XMLHttpRequest`, no loading JSON data at runtime.

7. **Available imports:** react (all hooks), lucide-react@0.263.1, lodash, d3. Do not attempt to import other packages.

### 9.2 Implementation Guidance

8. **Web Worker creation via Blob URL.** The complete JavaScript code for the worker must be written as a template string, converted to a Blob, and then to a URL:
   ```javascript
   const code = `self.onmessage = function(e) { ... }`;
   const blob = new Blob([code], { type: 'application/javascript' });
   const url = URL.createObjectURL(blob);
   const worker = new Worker(url);
   ```
   In the useEffect cleanup, call `worker.terminate()` and `URL.revokeObjectURL(url)`.

9. **Numerical precision.** JavaScript's Number type (IEEE 754 double-precision float, 64-bit) provides approximately 15-17 significant decimal digits. This allows zoom levels up to approximately 10^13 (ten trillion times magnification) before floating-point precision becomes the limiting factor and you see pixelation artifacts that more iterations cannot resolve. This is far more zoom depth than the vast majority of users will ever reach. No arbitrary-precision math library is needed.

10. **Memory budget.** A Float32Array for a 1920x1080 canvas is about 8.3 MB. A 4800x3600 high-res export buffer is about 69 MB. Both are within browser memory limits for modern devices, but avoid keeping multiple large buffers alive simultaneously. After a high-res export download completes, null out the buffer reference to allow garbage collection.

11. **Color palette data structure.** Define all built-in palettes as a constant object near the top of the file:
    ```javascript
    const PALETTES = {
        classic: { name: "Classic", stops: [
            { pos: 0.0, color: [0, 7, 100] },
            // ... remaining stops
        ]},
        inferno: { name: "Inferno", stops: [...] },
        // ... all 8 palettes
    };
    ```

12. **Preset data structure.** Similarly, define presets as a constant array:
    ```javascript
    const PRESETS = [
        {
            name: "Dendrite",
            c: { re: 0, im: 1 },
            description: "Tree-like branching pattern...",
            suggestedPalette: "ice",
            suggestedZoom: 1,
        },
        // ... all 8 presets
    ];
    ```

13. **Educational text.** Store as string constants or write directly as JSX. Keep all text concise and accessible. Use Unicode math symbols where possible (multiplication sign, right arrow, superscript 2, square root symbol, pi, etc.) instead of LaTeX or ASCII math notation.

14. **Event handler performance.** Mouse move and wheel events can fire very rapidly (60+ times per second). Use `requestAnimationFrame` or lodash `throttle` to limit how frequently these handlers trigger re-renders and canvas repaints. The debounced full-res render (Section 8.1) naturally handles this for the expensive computation, but the low-res preview should also be throttled if necessary.

15. **Canvas context settings.** When drawing the low-res preview scaled up, set `ctx.imageSmoothingEnabled = true` and `ctx.imageSmoothingQuality = 'medium'` for decent-looking bilinear interpolation. When drawing the full-res render, smoothing settings don't matter (pixels map 1:1).

---

## 10. Implementation Phases

Build the application in three phases. Each phase produces a fully functional (though progressively more featured) application. At no point should the app be in a broken or half-working state.

### Phase 1 — Core Explorer (Essential Foundation)

**Goal:** A complete, polished Julia set explorer with real-time parameter control, navigation, multiple color palettes, presets, and image download.

| # | Feature | Details |
|---|---------|---------|
| 1 | Julia set rendering with smooth coloring | Web Worker computation, smooth iteration count formula, proper color mapping |
| 2 | c-parameter sliders with real-time preview | Two sliders for real and imaginary parts, text inputs, prominent c value display, low-res preview during drag |
| 3 | Click-and-drag panning | Grab cursor, low-res during drag, full-res on mouse release |
| 4 | Mouse wheel zoom (cursor-centered) | 1.5x per tick, zoom centered on cursor position, correct viewport math |
| 5 | 5 built-in color palettes with visual selector | Classic, Inferno, Neon, Grayscale, Psychedelic — palette strip with click-to-select |
| 6 | 8 preset buttons for famous Julia sets | All 8 presets from Section 5.4, brief c-value morph animation on click |
| 7 | Max iterations slider | Range 50-2000, default 200, numeric display |
| 8 | Reset view button | Resets viewport, c, iterations to defaults |
| 9 | PNG download at canvas resolution | Descriptive filename, instant download |
| 10 | Complete UI layout | Header bar, main canvas, collapsible right-side control panel, status bar, dark observatory theme |

**Phase 1 acceptance:** A user can open the app, see a beautiful Julia set with smooth coloring, drag the c-parameter sliders and watch the fractal morph in real-time, zoom into interesting details with the mouse wheel, click presets to visit famous Julia sets, switch between 5 color palettes, adjust iterations, and download a PNG image.

### Phase 2 — Multi-Fractal and Split View

**Goal:** Add Mandelbrot and Burning Ship fractals, the split-view educational feature, more palettes, and high-resolution export.

| # | Feature | Details |
|---|---------|---------|
| 11 | Mandelbrot set rendering | Fractal type selector, correct iteration math, hide c sliders in Mandelbrot mode |
| 12 | Burning Ship fractal rendering | Correct iteration with absolute values, custom default viewport at (-0.4, -0.6) |
| 13 | Split view (Mandelbrot-Julia connection) | Two-panel layout, hover for real-time Julia preview, click to lock c, crosshair indicator, independent zoom/pan per panel |
| 14 | All 8+ color palettes | Add Ocean, Earth, Ice palette definitions |
| 15 | Color cycling offset slider | Instant recoloring from cached iteration data |
| 16 | Zoom level and coordinate display | In status bar: magnification factor, viewport center coordinates |
| 17 | High-resolution export | Resolution picker dialog (Screen/HD/4K/Print), progress bar, off-screen canvas rendering |
| 18 | Zoom buttons (+/-) | Accessible buttons that zoom centered on canvas center |

**Phase 2 acceptance:** Users can explore all three fractal types. Split view creates a compelling demonstration of the Mandelbrot-Julia relationship with real-time hover preview. All 8 palettes are available with instant color cycling. High-res export produces correct images at 4K and print resolutions.

### Phase 3 — Animation, Education, and Polish

**Goal:** The complete feature set — animations, orbit visualization, educational content, custom gradients, responsive design, and visual polish.

| # | Feature | Details |
|---|---------|---------|
| 19 | Parameter morphing animation | Play/pause, speed slider, 4 path types (Circle, Figure Eight, Cardioid, Preset Tour), smooth continuous rendering |
| 20 | Educational information panel | Contextual explanations for each fractal type, formula display with current values, connectedness indicator |
| 21 | Orbit visualizer | Click-to-show iteration path, color-coded connected dots, escape info display |
| 22 | Custom gradient editor | Add/remove/drag color stops, native color picker, apply custom palette |
| 23 | Responsive tablet layout | Bottom drawer controls, full-width canvas, condensed header |
| 24 | Responsive mobile layout | Bottom sheet controls, touch gestures (single-finger pan, two-finger pinch-zoom), horizontal preset scroll |
| 25 | Touch support | touchstart/touchmove/touchend handlers, pinch-to-zoom with midpoint centering |
| 26 | URL parameter sharing (stretch) | Encode/decode state in query params, "Copy Link" button with toast notification |
| 27 | Performance optimizations | Progressive rendering (row-by-row painting), multi-worker parallelism, Mandelbrot cardioid/bulb early bailout |
| 28 | Visual polish | All transition animations (Section 6.2.4), slider glow effects, smooth panel animations, consistent dark theme throughout |

**Phase 3 acceptance:** All features from the acceptance criteria (Section 11) are met.

---

## 11. Acceptance Criteria

The application is considered complete when ALL of the following are verified:

### Functionality

- A user can render a Julia set for any c value in the range [-2, 2] for both real and imaginary parts, and the result is mathematically correct (verified by comparing a few known presets against reference images).
- The Mandelbrot set renders correctly, showing the characteristic cardioid main body, the period-2 bulb to its left, and detailed boundary structures.
- The Burning Ship fractal renders correctly, showing the recognizable "ship" shape in its conventional orientation (hull at top, flames below).
- Smooth coloring is working: there are no visible discrete color bands/stripes. Gradients transition smoothly.
- All 8 preset Julia sets load correctly and produce recognizable, visually interesting shapes matching their descriptions.
- Switching between the three fractal types works correctly: the viewport resets appropriately, c-parameter controls show/hide as expected, and the correct fractal is rendered.

### Interaction

- Panning via click-and-drag moves the fractal view fluidly with no perceptible lag during the drag.
- Zooming via mouse wheel is correctly centered on the cursor position (the point under the cursor stays fixed).
- The c-parameter sliders update the Julia set in real-time with a visible (though blurry) preview during active dragging, followed by a crisp render after releasing.
- Zoom buttons (+/-) zoom in and out correctly, centered on the canvas.
- The Reset button returns all parameters to sensible defaults and produces a correct re-render.
- Preset buttons apply the correct c value, suggested palette, and viewport, with a brief morph animation.

### Color System

- All 8+ color palettes are available in the selector and are visually distinct from each other.
- Color cycling offset slider updates colors instantly with no visible computation delay.
- Points inside the set (non-escaping points) are always rendered as pure black, regardless of which palette is active.
- (If implemented) Custom gradient editor allows creating, editing, and applying custom palettes.

### Split View

- Split view divides the canvas into two side-by-side panels: Mandelbrot (left) and Julia (right).
- Hovering over the Mandelbrot set shows a real-time low-resolution Julia set preview in the right panel for the c value under the cursor.
- Clicking on the Mandelbrot set locks that c value, triggers a full-resolution Julia render, and updates the c sliders.
- Each panel has fully independent zoom and pan controls.
- The educational callout text appears when split view is first activated.

### Animation

- Animation smoothly morphs the Julia set along at least 3 predefined paths without stuttering or freezing.
- Play/Pause controls work correctly: pause freezes the frame, play resumes from the same position.
- Speed slider visibly affects animation speed.
- Animation stops cleanly: no orphaned requestAnimationFrame loops, no continued c-value changes after stopping.

### Education

- Orbit visualizer correctly draws the iteration sequence for a clicked point as connected, color-coded dots overlaid on the fractal.
- Orbit display shows accurate information: starting coordinates, iteration count, escape/bounded status.
- Information panel shows correct, contextual educational content for each fractal type, including the current formula with substituted values.
- Connectedness indicator correctly reports whether the current Julia set is connected (c inside Mandelbrot) or disconnected (c outside Mandelbrot).

### Export

- Quick download produces a correctly rendered PNG file at the current canvas resolution.
- High-resolution export produces correct images at all offered resolutions (HD, 4K, Print) that match the on-screen view.
- Exported images accurately reflect the current fractal type, viewport, c value, color scheme, and iteration count.
- Download filenames are descriptive and include the fractal type, c value (for Julia), zoom level, and iteration count.

### UI and Visual Quality

- The dark theme is consistent throughout the entire interface: no jarring white or light-colored elements.
- Typography uses the specified fonts: Syne for the app title, DM Sans for UI labels and text, JetBrains Mono for all numeric values and coordinates.
- The control panel is collapsible and does not permanently obscure any part of the fractal canvas.
- The status bar displays useful information: render time, canvas resolution, and active fractal type.
- All interactive elements have visible hover states.
- All transitions and animations are smooth with no visible jank or stuttering.
- The application remains responsive during all user interactions: the UI never freezes, buttons remain clickable, and the browser tab never shows a "page unresponsive" warning. This is the most critical quality requirement.
- The canvas resizes correctly when the browser window is resized, and the fractal re-renders at the new dimensions.

### Performance

- Low-resolution preview appears within 50ms of any parameter change.
- Full-resolution render completes within 2 seconds for a 1920x1080 canvas at 200 iterations.
- Color-only updates (palette switch, offset change) complete in under 20ms (effectively instant).
- Animation maintains at least 30 frames per second during morphing.
- No memory leaks during extended use: Web Workers are properly terminated on cleanup, animation frames are properly cancelled, and large temporary buffers (especially from high-res export) are released after use.
