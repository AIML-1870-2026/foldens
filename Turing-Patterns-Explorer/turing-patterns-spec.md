# Turing Patterns Explorer — spec.md

## What This Project Is

In 1952, mathematician Alan Turing proposed that the spots on a leopard, the stripes on a zebra, and the whorls on your fingertips all emerge from the same simple process: two chemicals reacting and diffusing across a surface. No blueprint is needed — the patterns organize themselves. This process is called **reaction-diffusion**, and the patterns it produces are called **Turing patterns**.

This project is a **real-time, interactive web application** that lets users watch these patterns grow, tweak the underlying chemistry, and explore how tiny changes in parameters produce wildly different results — spots, stripes, mazes, coral-like growths, and more.

The simulation runs on the **GPU** for high performance, the interface is styled in a sleek dark theme suitable for a developer portfolio, and the entire app is built with zero external dependencies (vanilla HTML, CSS, JavaScript, and WebGL).

---

## How Reaction-Diffusion Works (The Science Behind the Simulation)

Imagine a flat surface covered with two chemicals — call them **A** and **B**:

1. **Chemical A** (the activator) is continuously fed into the system and spreads (diffuses) quickly across the surface.
2. **Chemical B** (the inhibitor) is produced wherever A is concentrated, but B spreads more slowly and also decays over time.

This creates a tug-of-war: A tries to spread everywhere, but B suppresses it locally. The result is that regions of high-B concentration form stable islands surrounded by seas of A — and depending on the exact rates of feeding, killing, and diffusion, those islands arrange themselves into spots, stripes, labyrinths, or chaotic turbulence.

The two key numbers that determine which pattern emerges are:

- **Feed rate (F):** How fast chemical A is replenished. Higher values mean more "fuel" for pattern formation.
- **Kill rate (K):** How fast chemical B decays. Higher values suppress B, leading to simpler or sparser patterns.

By varying just F and K, you can traverse an entire zoo of natural-looking patterns — which is exactly what this explorer lets you do.

---

## Architecture

### How the GPU Simulation Works

Rather than computing the chemical reactions on the CPU (which would be far too slow for real-time interaction), this app offloads the entire simulation to the **GPU** using **WebGL 2.0**. Here's how:

1. **The simulation grid is stored as a texture.** Each pixel in the texture represents one cell on the surface. The red channel stores the concentration of chemical A, and the green channel stores chemical B.

2. **A "ping-pong" technique uses two textures that alternate roles each frame.** On any given frame, one texture is the "current state" (read-only) and the other is the "next state" (write target). A GPU program (called a **fragment shader**) reads every pixel of the current state, computes the reaction-diffusion math, and writes the result to the next-state texture. Then the two textures swap roles, and the process repeats.

3. **A separate display shader converts concentrations to colors.** The raw simulation data (concentrations of A and B) isn't visually meaningful on its own, so a second GPU program maps those values to the user's chosen color scheme (e.g., ocean blues, plasma fire, grayscale) and draws the result to the screen.

4. **Multiple simulation steps run per animation frame** to speed up pattern evolution. The user can control how many steps occur per frame via a Speed slider.

### Technical Requirements
- **WebGL 2.0** with the `EXT_color_buffer_float` extension (for floating-point precision in the simulation textures)
- Graceful fallback message displayed if the user's browser doesn't support WebGL 2

### Simulation Models

The app supports three different mathematical models of reaction-diffusion, each producing a distinct family of patterns:

1. **Gray-Scott** (default) — The most widely studied model. Uses two parameters: feed rate (F) and kill rate (K). Produces the classic spots, stripes, and mazes. This is the model with the famous "parameter space map" where every F/K combination yields a different pattern.

2. **Brusselator** — An oscillatory model originally developed to study chemical oscillations (like the Belousov-Zhabotinsky reaction). Uses parameters A and B. Tends to produce pulsing, wave-like patterns.

3. **Schnakenberg** — A minimal activator-inhibitor model. Simpler math, but still produces spots and stripes. Good for demonstrating the core Turing mechanism with fewer moving parts.

Each model has its own GPU shader program, its own parameter sliders with appropriate ranges, and its own set of curated presets.

---

## Layout

The application uses a two-column layout: a large simulation canvas on the left and a scrollable control sidebar on the right.

```
┌──────────────────────────────────────────────────────────┐
│  Header: "Turing Patterns Explorer"        [GitHub icon] │
├────────────────────────────────┬─────────────────────────┤
│                                │  SIDEBAR (280px)        │
│                                │                         │
│                                │  ┌─ Model Selector ──┐  │
│                                │  │ Gray-Scott │ Brus. │  │
│                                │  └────────────────────┘  │
│                                │                         │
│     SIMULATION CANVAS          │  ┌─ Presets ──────────┐  │
│     (fills remaining space,    │  │ Spots │ Stripes    │  │
│      responsive)               │  │ Maze  │ Coral      │  │
│                                │  │ Mitosis│ Chaos     │  │
│                                │  └────────────────────┘  │
│                                │                         │
│                                │  ┌─ Parameter Space ──┐  │
│                                │  │  [clickable F/K    │  │
│                                │  │   diagram]         │  │
│                                │  └────────────────────┘  │
│                                │                         │
│                                │  ┌─ Parameters ───────┐  │
│                                │  │ F: ═══●══════      │  │
│                                │  │ K: ════════●═      │  │
│                                │  │ dA: ══●═══════     │  │
│                                │  │ dB: ═══●══════     │  │
│                                │  │ Speed: ════●══     │  │
│                                │  └────────────────────┘  │
│                                │                         │
│                                │  ┌─ Brush ────────────┐  │
│                                │  │ Size: ═══●═══      │  │
│                                │  │ Chemical: [A] [B]  │  │
│                                │  └────────────────────┘  │
│                                │                         │
│                                │  ┌─ Color Scheme ─────┐  │
│                                │  │ ● ● ● ● ● ● ● ●  │  │
│                                │  │ (swatches)         │  │
│                                │  └────────────────────┘  │
│                                │                         │
│                                │  ┌─ Actions ──────────┐  │
│                                │  │ ▶ Pause │ ↺ Reset  │  │
│                                │  │ 📷 Save │ 🎬 Journey│  │
│                                │  └────────────────────┘  │
│                                │                         │
├────────────────────────────────┴─────────────────────────┤
│  Footer: FPS counter, grid resolution, iteration count   │
└──────────────────────────────────────────────────────────┘
```

On narrow screens (below 768px), the sidebar collapses into a bottom drawer so the canvas can use the full width.

---

## Visual Design

### Theme
- **Dark mode** throughout, inspired by VS Code and GitHub Dark
- Background: `#0d1117`, sidebar: `#161b22`, borders: `#30363d`
- Accent color: vibrant teal `#58a6ff` for active states, slider tracks, and highlights
- Font: system sans-serif for UI labels, monospace for numerical readouts (parameter values, FPS)
- Control groups have subtle shadows and rounded corners (`border-radius: 8px`) for a polished, card-like feel
- Smooth CSS transitions on all interactive elements (hover, active, focus states)

### Tooltips
- Every slider, button, and control has a tooltip that appears on hover
- Tooltips are written in plain language so users unfamiliar with the math can still understand what each control does
- Example: hovering over the Feed Rate slider shows "How fast chemical A is replenished. Higher values = more pattern activity."

---

## Features (Detailed)

### 1. Simulation Canvas
**What the user sees:** A large, animated canvas showing Turing patterns evolving in real time.

**Behavior:**
- Fills all horizontal space to the left of the sidebar; height fills the viewport
- Resizes responsively when the browser window changes (minimum 256px on the shortest side)
- When the canvas resizes, the GPU textures (framebuffers) are re-created at the new resolution
- Targets 60 frames per second, with a configurable number of simulation steps computed per frame (default: 8)

**Interaction:**
- Users can click and drag on the canvas to "paint" a disturbance — injecting a burst of one of the two chemicals at the mouse position
- A faint circular outline follows the cursor to show the brush size
- This lets users seed new patterns, break apart existing ones, or create interesting collisions between pattern regions

### 2. Model Selector
**What it does:** Lets the user switch between three reaction-diffusion models (Gray-Scott, Brusselator, Schnakenberg).

**Behavior:**
- Appears as a segmented button group (like iOS-style tabs)
- Switching models resets the simulation canvas and loads the corresponding GPU shader
- All parameter sliders update to show the new model's parameters with appropriate labels and ranges
- Presets update to show model-specific options

### 3. Preset Buttons
**What they do:** One-click shortcuts to interesting parameter combinations that produce recognizable patterns.

**Gray-Scott presets (with their F and K values):**

| Preset | F | K | What it looks like |
|---|---|---|---|
| Spots | 0.030 | 0.062 | Round dots that self-replicate like cells dividing |
| Stripes | 0.035 | 0.065 | Parallel lines and branching filaments |
| Maze | 0.029 | 0.057 | Winding labyrinthine corridors |
| Coral | 0.055 | 0.062 | Branching structures resembling coral reef growth |
| Mitosis | 0.028 | 0.062 | Blobs that split apart like dividing cells |
| Chaos | 0.018 | 0.051 | Turbulent, constantly shifting regions |
| Worms | 0.038 | 0.061 | Elongated wriggling shapes |
| Holes | 0.039 | 0.058 | Negative-space dots (holes in a filled field) |

**Behavior:**
- Clicking a preset smoothly animates the sliders to the new values and resets the simulation
- Each preset has a tooltip describing the visual result
- Brusselator and Schnakenberg models have their own preset sets

### 4. Clickable Parameter Space Diagram
**What it is:** A small map (~200×200 pixels) in the sidebar that visualizes the entire landscape of possible Gray-Scott patterns.

**How it works:**
- Each pixel in the diagram corresponds to a unique (F, K) combination
- The pixel's color represents what type of pattern forms at that combination (e.g., blue for stripes, red for spots, black for extinction)
- A crosshair or glowing dot marks the current F/K position
- Clicking anywhere on the diagram immediately jumps the simulation to that (F, K) value
- This gives users an intuitive "bird's eye view" of the pattern landscape — they can see where spots live, where stripes live, and explore the transitions between them

**Note:** This diagram is only displayed when the Gray-Scott model is selected, as the other models don't have a well-established 2D parameter space visualization.

### 5. Parameter Sliders
**What they do:** Give the user fine-grained control over the simulation's behavior.

**Each slider shows:**
- A descriptive label (e.g., "Feed Rate (F)")
- A custom-styled range input matching the dark theme
- A real-time numerical readout that updates as the slider moves

**Parameters adjust the simulation live** — the user doesn't need to reset; the pattern will gradually reorganize to match the new values. (Exception: switching models does reset the canvas.)

**Parameter ranges by model:**

| Model | Parameter | Range | What it controls |
|---|---|---|---|
| Gray-Scott | F (Feed Rate) | 0.01 – 0.08 | How fast chemical A is replenished |
| Gray-Scott | K (Kill Rate) | 0.03 – 0.07 | How fast chemical B decays |
| Gray-Scott | dA (Diffusion of A) | 0.5 – 1.2 | How quickly chemical A spreads spatially |
| Gray-Scott | dB (Diffusion of B) | 0.1 – 0.5 | How quickly chemical B spreads spatially |
| All models | Speed | 1 – 20 | Simulation steps computed per animation frame |
| Brusselator | A | 0.5 – 4.0 | Production rate of activator |
| Brusselator | B | 1.0 – 5.0 | Conversion rate |
| Brusselator | Du | 1.0 – 5.0 | Diffusion of chemical U |
| Brusselator | Dv | 5.0 – 20.0 | Diffusion of chemical V |
| Schnakenberg | a | 0.05 – 0.3 | Base production of activator |
| Schnakenberg | b | 0.5 – 2.0 | Base production of inhibitor |
| Schnakenberg | Du / Dv | (similar ranges) | Diffusion rates |

### 6. Brush Controls
**What they do:** Let the user customize how they paint disturbances on the canvas.

- **Size slider:** Adjusts the brush radius from 2 to 50 pixels. The circular cursor overlay on the canvas updates in real time to reflect the current size.
- **Chemical toggle:** Two buttons — [A] and [B] — let the user choose which chemical to inject when painting. By default, chemical B is selected (painting B into an A-dominated field is the most visually dramatic way to seed new patterns).

### 7. Color Scheme Selector
**What it does:** Changes how chemical concentrations are mapped to visible colors. The underlying simulation doesn't change — only the visual representation.

**Appears as:** A row of small circular color swatches in the sidebar. Click any swatch to switch immediately.

**Available schemes:**

| Name | Gradient | Visual character |
|---|---|---|
| Grayscale | White → Black | Clean, scientific |
| Ocean | Deep navy → Cyan → White | Underwater, calming |
| Plasma | Magenta → Orange → Yellow | Vibrant, scientific visualization |
| Inferno | Black → Red → Orange → Yellow | Intense heat map |
| Neon | Black → Electric blue → Hot pink | Cyberpunk aesthetic |
| Earth | Dark brown → Sand → Green | Natural, organic |
| Ice | Dark blue → Light blue → White | Frozen, crystalline |
| Matrix | Black → Green | Retro hacker aesthetic |

**Technical note:** The color mapping is handled entirely in the display fragment shader using a gradient lookup table (LUT) passed as a uniform. Switching schemes only changes the LUT — no simulation reset needed.

### 8. Action Buttons
Four buttons in a grid layout at the bottom of the sidebar:

- **▶ Play / Pause** — Toggles the simulation on and off. Also bound to the spacebar.
- **↺ Reset** — Clears the canvas and re-initializes with a fresh random seed (small square perturbations of chemical B in the center of a uniform chemical A field). Also bound to the R key.
- **📷 Save Image** — Downloads the current canvas as a PNG file at the current resolution. Also bound to the S key.
- **🎬 Journey** — Starts or stops the Parameter Space Journey (see below). Also bound to the J key.

### 9. Parameter Space Journey (Stretch Feature)
**What it is:** An automated, cinematic tour through the Gray-Scott parameter space.

**How it works:**
- When the user clicks the Journey button, the simulation begins smoothly interpolating through a curated sequence of (F, K) values
- The path visits distinct pattern regions in order: spots → stripes → maze → coral → chaos
- The interpolation uses smooth easing (Catmull-Rom spline or linear with ease-in-out) so transitions feel organic
- Duration: approximately 15 seconds for the full journey
- During the journey, the parameter sliders and the crosshair on the parameter space diagram animate in sync, so the user can see exactly where they are in the landscape
- The user can pause or cancel the journey at any time by clicking the Journey button again or pressing J

### 10. Multiple Chemical Systems (Stretch Feature)
**What it is:** Support for three different mathematical models (not just Gray-Scott).

This is implemented through the Model Selector described above. Each model has its own:
- GLSL fragment shader containing the model's specific equations
- Set of parameter sliders with appropriate labels, ranges, and defaults
- Curated presets with interesting parameter combinations
- The parameter space diagram is only shown for Gray-Scott (the other models lack a well-established 2D parameter map)

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| Space | Play / Pause the simulation |
| R | Reset the simulation with a fresh random seed |
| S | Save the current canvas as a PNG image |
| J | Start or stop the parameter space journey |
| 1–8 | Jump to the preset at that position (e.g., 1 = Spots) |

---

## File Structure

The project consists of four files with no external dependencies:

```
index.html    — The single HTML page containing all markup (header, canvas, sidebar, footer)
style.css     — All visual styling (dark theme, responsive layout, custom slider styles, tooltips)
app.js        — Main application logic: WebGL initialization, animation loop, UI event wiring,
                canvas resize handling, brush interaction, parameter journey animation
shaders.js    — All GLSL shader source code stored as JavaScript template strings:
                - One simulation (update) shader per model (Gray-Scott, Brusselator, Schnakenberg)
                - One display (colormap) shader shared across all models
```

---

## Performance Targets

- **60 FPS** at canvas resolutions of 512×512 and above on modern hardware
- **Multiple simulation steps per frame** (default 8, user-adjustable via Speed slider) so patterns evolve visibly each frame
- **No external libraries or frameworks** — pure vanilla JavaScript and WebGL 2.0
- **Debounced resize handling** — when the window resizes, the canvas and GPU textures are re-created after a short delay to avoid excessive reallocation

---

## Initialization Behavior

When the page first loads:
1. The canvas fills the available space and the GPU textures are created at that resolution
2. The simulation grid is initialized with chemical A at full concentration everywhere
3. A cluster of small random square patches of chemical B are placed near the center of the canvas — these serve as "seeds" from which patterns will grow outward
4. The simulation begins playing automatically using the Gray-Scott model with the "Spots" preset
5. The user sees patterns begin to emerge within a few seconds

---

## Responsive Behavior

- On viewports **≥ 768px wide:** Two-column layout. Canvas fills the left side, sidebar scrolls vertically on the right.
- On viewports **< 768px wide:** The sidebar collapses into a bottom drawer. The canvas uses the full width of the screen, and the user scrolls down to access controls.
- The canvas minimum dimension is 256px on its shortest side.
- On resize, the WebGL framebuffers are destroyed and re-created at the new resolution (debounced to avoid rapid re-allocation during drag-resizing).

---

## Footer Status Bar

A thin bar at the bottom of the page displays real-time diagnostics in a monospace font with subtle coloring (`#8b949e`):

- **FPS:** Rolling average frames per second (e.g., "60 FPS")
- **Resolution:** Current canvas dimensions (e.g., "768 × 512")
- **Iterations:** Total simulation steps computed since the last reset (e.g., "12,480 iterations")
