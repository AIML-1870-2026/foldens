# Turing Patterns Explorer - Implementation Plan

## File Structure
```
Turing-Patterns-Explorer/
  index.html      - Markup: header, canvas, sidebar controls, footer
  style.css       - Dark theme, responsive layout, custom controls
  shaders.js      - All GLSL shaders as JS template strings
  app.js          - WebGL init, simulation loop, UI wiring, interactions
```

---

## Phase 1: WebGL Foundation + Gray-Scott Simulation
**Goal:** Get a working Gray-Scott reaction-diffusion running on the GPU.

- [ ] **1a. WebGL 2 boilerplate** - Initialize WebGL2 context with `EXT_color_buffer_float`, handle fallback error message
- [ ] **1b. Ping-pong framebuffers** - Create two float textures (RGBA32F), attach to framebuffers, implement swap logic
- [ ] **1c. Gray-Scott simulation shader** - Fragment shader implementing the Gray-Scott equations (read neighbor texels, compute Laplacian, apply reaction + diffusion, write output)
- [ ] **1d. Display shader** - Fragment shader that reads simulation texture and maps A/B concentrations to grayscale color output
- [ ] **1e. Fullscreen quad rendering** - Vertex shader + geometry for drawing a screen-filling quad (simulation and display passes)
- [ ] **1f. Animation loop** - `requestAnimationFrame` loop running N simulation steps per frame, then one display pass
- [ ] **1g. Canvas initialization** - Fill texture with A=1.0 everywhere, seed center region with random B patches
- [ ] **1h. Canvas resize handling** - Debounced resize observer that recreates textures at new resolution

**Deliverable:** A canvas showing Gray-Scott spots evolving in real time (grayscale).

---

## Phase 2: Dark Theme UI + Sidebar Layout
**Goal:** Build the full control panel with dark styling.

- [ ] **2a. CSS dark theme** - Background colors (#0d1117, #161b22, #30363d), accent teal (#58a6ff), fonts, card-style groups
- [ ] **2b. Two-column layout** - Canvas fills left, 280px scrollable sidebar on right
- [ ] **2c. Responsive breakpoint** - Below 768px: sidebar becomes bottom drawer, canvas goes full-width
- [ ] **2d. Header + footer** - Header with title, footer status bar (FPS, resolution, iterations) in monospace
- [ ] **2e. Control group cards** - Styled containers for each sidebar section (model, presets, params, brush, colors, actions)
- [ ] **2f. Custom slider styling** - Dark-themed range inputs with teal track, numerical readout next to each

**Deliverable:** Polished dark UI shell with all control groups laid out (wired up in later phases).

---

## Phase 3: Parameter Controls + Presets
**Goal:** Wire up sliders and preset buttons to the live simulation.

- [ ] **3a. Parameter sliders** - F, K, dA, dB sliders with correct ranges, real-time readout, live uniform updates to shader
- [ ] **3b. Speed slider** - Controls steps-per-frame (1-20)
- [ ] **3c. Preset buttons** - 8 Gray-Scott presets (Spots, Stripes, Maze, Coral, Mitosis, Chaos, Worms, Holes) with correct F/K values
- [ ] **3d. Preset click behavior** - Animate sliders to new values, reset simulation
- [ ] **3e. Tooltips** - Hover tooltips on every control with plain-language descriptions

**Deliverable:** Users can tweak parameters live and jump between presets.

---

## Phase 4: Brush Interaction
**Goal:** Let users paint disturbances on the canvas.

- [ ] **4a. Mouse/touch tracking** - Convert screen coordinates to simulation texture coordinates
- [ ] **4b. Brush cursor overlay** - Faint circle following the mouse showing brush radius
- [ ] **4c. Paint on click/drag** - Inject chemical (A or B) into the simulation texture at brush location
- [ ] **4d. Brush controls** - Size slider (2-50px), chemical toggle (A/B) in sidebar

**Deliverable:** Click and drag on canvas to seed patterns.

---

## Phase 5: Color Schemes
**Goal:** Multiple color mapping options.

- [ ] **5a. Color LUT system** - Pass gradient lookup data as uniform array to display shader
- [ ] **5b. 8 color schemes** - Grayscale, Ocean, Plasma, Inferno, Neon, Earth, Ice, Matrix
- [ ] **5c. Swatch selector UI** - Row of circular swatches in sidebar, click to switch
- [ ] **5d. Display shader update** - Modify display shader to use LUT for color mapping

**Deliverable:** 8 beautiful color schemes, switchable without simulation reset.

---

## Phase 6: Actions + Keyboard Shortcuts
**Goal:** Play/Pause, Reset, Save, and keyboard controls.

- [ ] **6a. Play/Pause button** - Toggle simulation, spacebar shortcut
- [ ] **6b. Reset button** - Re-seed canvas, R key shortcut
- [ ] **6c. Save Image button** - Download canvas as PNG, S key shortcut
- [ ] **6d. Keyboard shortcuts** - Space, R, S, J, 1-8 for presets
- [ ] **6e. Footer status updates** - Live FPS counter, resolution display, iteration counter

**Deliverable:** Full action bar and keyboard-driven workflow.

---

## Phase 7: Multiple Models (Brusselator + Schnakenberg)
**Goal:** Add two more reaction-diffusion models.

- [ ] **7a. Model selector UI** - Segmented button group (Gray-Scott / Brusselator / Schnakenberg)
- [ ] **7b. Brusselator shader** - GLSL implementation with A, B, Du, Dv parameters
- [ ] **7c. Schnakenberg shader** - GLSL implementation with a, b, Du, Dv parameters
- [ ] **7d. Dynamic parameter panel** - Swap slider labels/ranges when model changes
- [ ] **7e. Model-specific presets** - Curated presets for Brusselator and Schnakenberg
- [ ] **7f. Model switch behavior** - Reset simulation, swap shader program, update UI

**Deliverable:** Three working models with distinct pattern families.

---

## Phase 8: Parameter Space Diagram + Journey
**Goal:** The clickable F/K map and automated tour.

- [ ] **8a. Parameter space diagram** - 200x200 canvas showing pattern regions for Gray-Scott F/K space
- [ ] **8b. Crosshair indicator** - Glowing dot showing current F/K position on the diagram
- [ ] **8c. Click-to-navigate** - Click on diagram to jump to that F/K value
- [ ] **8d. Journey mode** - Smooth interpolation through curated F/K waypoints (Catmull-Rom or eased linear)
- [ ] **8e. Journey UI sync** - Sliders and crosshair animate during journey, J key toggle

**Deliverable:** Bird's-eye parameter exploration and cinematic tour.

---

## Phase Order Recommendation
Build in this order (each phase produces a working, committable milestone):

1. **Phase 1** - Core simulation (most critical, everything depends on this)
2. **Phase 2** - UI shell (gives structure for wiring controls)
3. **Phase 3** - Parameters + presets (makes it interactive)
4. **Phase 4** - Brush (adds creative control)
5. **Phase 5** - Colors (visual polish)
6. **Phase 6** - Actions + keyboard (usability)
7. **Phase 7** - Multiple models (feature expansion)
8. **Phase 8** - Diagram + journey (stretch/polish)
