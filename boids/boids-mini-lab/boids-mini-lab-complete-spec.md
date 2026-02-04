# Boids Mini-Lab
## Complete Project Specification

---

## Document Purpose

This specification provides everything needed to build "Boids Mini-Lab" — an interactive simulation of flocking behavior. Hand this document to a developer (or Claude Code) for implementation.

---

# Table of Contents

1. [What Is This Project?](#1-what-is-this-project)
2. [Core Concepts Explained](#2-core-concepts-explained)
3. [Technical Architecture](#3-technical-architecture)
4. [Initial State & Defaults](#4-initial-state--defaults)
5. [Visual Design](#5-visual-design)
6. [Perception System](#6-perception-system)
7. [Species & Flocking Behavior](#7-species--flocking-behavior)
8. [The Shepherd (Mouse Interaction)](#8-the-shepherd-mouse-interaction)
9. [User Interface](#9-user-interface)
10. [Interaction Features](#10-interaction-features)
11. [Scenarios & Experiments](#11-scenarios--experiments)
12. [Accessibility](#12-accessibility)
13. [Export Features](#13-export-features)
14. [Mathematical Foundations](#14-mathematical-foundations)
15. [File Structure](#15-file-structure)
16. [Success Criteria](#16-success-criteria)
17. [Future Expansion Ideas](#17-future-expansion-ideas)

---

# 1. What Is This Project?

## 1.1 The Concept

**Boids Mini-Lab** is an interactive simulation that demonstrates how complex group behaviors (like flocks of birds or schools of fish) emerge from simple individual rules.

Imagine watching a murmuration of starlings — thousands of birds moving as one fluid shape, splitting and merging, never colliding. There's no leader bird giving orders. Each bird simply follows three basic rules about its nearby neighbors, and the beautiful group behavior emerges automatically.

This project lets users:
- Watch artificial "boids" (bird-like objects) flock together
- Adjust the rules to see how behavior changes
- Interact with the flock using their mouse cursor
- Learn about emergence, swarm intelligence, and computational biology

## 1.2 Origin: Craig Reynolds' Boids

In 1986, computer graphics researcher **Craig Reynolds** created a simulation called "Boids" (short for "bird-oids"). He discovered that realistic flocking behavior could be generated with just three simple rules:

1. **Separation** — Don't crowd your neighbors
2. **Alignment** — Fly in the same direction as your neighbors
3. **Cohesion** — Stay close to your neighbors

This project implements these rules with modern optimizations and an interactive "lab" interface for experimentation.

## 1.3 Who Is This For?

- **Students** learning about emergent behavior and algorithms
- **Educators** demonstrating complex systems concepts
- **Hobbyists** who enjoy mesmerizing visualizations
- **Developers** exploring spatial partitioning and simulation techniques

---

# 2. Core Concepts Explained

Before diving into specifications, here are key concepts you'll encounter:

## 2.1 What Is a "Boid"?

A **boid** is a simulated agent (think of it as a virtual bird or fish). Each boid:
- Has a position (where it is on screen)
- Has a velocity (how fast and in what direction it's moving)
- Follows simple rules based on nearby boids
- Has no awareness of the "big picture" — only its local neighbors

## 2.2 What Is "Emergence"?

**Emergence** is when complex patterns arise from simple rules. No single boid knows how to create a beautiful flock pattern — the pattern emerges from many individuals following basic rules simultaneously.

Real-world examples:
- Ant colonies building complex structures
- Traffic jams forming and dissolving
- Snowflake patterns from water molecules

## 2.3 What Is a "Quadtree"?

A **Quadtree** is a data structure that makes the simulation fast.

**The Problem:** Each boid needs to know about its neighbors. Checking every boid against every other boid is slow — with 1,000 boids, that's 1,000,000 checks per frame!

**The Solution:** Divide the screen into sections (quadrants). Each boid only checks neighbors in its own section and adjacent sections. This reduces checks dramatically.

```
Without Quadtree:          With Quadtree:
┌─────────────────┐        ┌────────┬────────┐
│ Check ALL boids │        │ Check  │ Check  │
│ against ALL     │        │ only   │ only   │
│ other boids     │   →    │ nearby │ nearby │
│                 │        ├────────┼────────┤
│ 1,000,000 checks│        │ ~4,000 │        │
└─────────────────┘        │ checks │        │
                           └────────┴────────┘
```

## 2.4 What Is a "Perception Cone"?

Real birds can't see behind themselves. A **perception cone** simulates this — each boid only "sees" other boids within a wedge-shaped area in front of it.

```
        270° Perception Cone
        
              ╱ · · · · · ╲
            ╱ · · · · · · · ╲
          ╱ · · · · · · · · · ╲
        ╱ · · · VISIBLE · · · · ╲
       │· · · · AREA · · · · · · │
        ╲ · · · · · · · · · · · ╱
          ╲ · · · · · · · · · ╱
            ──────●──────        ← Boid (facing up)
                BLIND
                SPOT
```

## 2.5 What Is "Wrap" vs "Bounce"?

How boids behave at screen edges:

| Mode | Behavior | Analogy |
|------|----------|---------|
| **Wrap** | Exit right side, appear on left | Pac-Man screen |
| **Bounce** | Reflect off edges like a ball | Billiard table |

---

# 3. Technical Architecture

## 3.1 Technology Stack

| Component | Technology | Why |
|-----------|------------|-----|
| **Structure** | Plain HTML + separate JS/CSS files | Clean organization, easy to maintain |
| **Rendering** | HTML5 Canvas 2D | Fast drawing, widely supported |
| **Storage** | Browser LocalStorage | Save user presets without a server |

## 3.2 Performance Target

| Metric | Target |
|--------|--------|
| **Frame Rate** | 60 FPS (frames per second) |
| **Boid Capacity** | 2,000+ boids at 60 FPS |
| **Hardware** | Mid-range laptop (2020 or newer) |

## 3.3 Canvas Sizing

- **Aspect Ratio:** Fixed (e.g., 16:9)
- **Behavior:** Scales to fit browser window while maintaining ratio
- **Minimum Size:** 800 × 450 pixels

## 3.4 Quadtree Implementation

The Quadtree enables high performance:

| Parameter | Value | Explanation |
|-----------|-------|-------------|
| **Max Boids Per Node** | 10 | Node subdivides when exceeded |
| **Max Tree Depth** | 8 | Prevents infinite subdivision |
| **Rebuild Frequency** | Every frame | Boids move, so tree must update |

---

# 4. Initial State & Defaults

When the simulation first loads:

## 4.1 Starting Configuration

| Setting | Default Value |
|---------|---------------|
| **Boid Count** | 100 |
| **Starting Positions** | Random, scattered across canvas |
| **Boundary Mode** | Wrap (toroidal) |
| **Species Count** | 2 species |
| **Species Colors** | User's palette preference (warm or cool) |

## 4.2 Default Behavior Weights

These sliders control how strongly each rule affects boid movement:

| Parameter | Min | Max | Default | What It Does |
|-----------|-----|-----|---------|--------------|
| **Separation** | 0 | 5 | 1.5 | How strongly boids avoid crowding |
| **Alignment** | 0 | 5 | 1.0 | How strongly boids match neighbors' direction |
| **Cohesion** | 0 | 5 | 1.0 | How strongly boids stick together |
| **Max Speed** | 1 | 10 | 4 | Fastest a boid can move (pixels per frame) |
| **Neighbor Radius** | 20 | 150 | 50 | How far a boid can "see" (pixels) |
| **Perception Angle** | 180° | 360° | 270° | Field of view width |

---

# 5. Visual Design

## 5.1 Theme Options

Users can toggle between two visual themes:

### Nature/Organic Theme (Default)

| Element | Specification |
|---------|---------------|
| **Background** | Deep blue-green (#0a1628) |
| **Mood** | Underwater school or twilight murmuration |
| **Accents** | Subtle gradients, organic feel |

### Scientific/Minimal Theme

| Element | Specification |
|---------|---------------|
| **Background** | Off-white (#f5f5f5) |
| **Mood** | Research paper, data visualization |
| **Accents** | Clean lines, high contrast |

## 5.2 Boid Appearance

| Property | Specification |
|----------|---------------|
| **Shape** | Bird silhouette (stylized wings pointing in travel direction) |
| **Per-Species Shapes** | Different silhouettes (bird, fish, arrow) distinguish species |
| **Base Size** | 6-10 pixels (small, emphasizes flock over individuals) |
| **Size Variation** | Faster boids appear slightly elongated |

## 5.3 Species Color Palettes

Users choose between warm and cool color schemes:

### Warm Palette

| Species | Color | Hex Code |
|---------|-------|----------|
| Species A | Coral | #FF6B6B |
| Species B | Amber | #FFE66D |
| Species C | Peach | #FDA085 |

### Cool Palette

| Species | Color | Hex Code |
|---------|-------|----------|
| Species A | Teal | #4ECDC4 |
| Species B | Indigo | #6C5CE7 |
| Species C | Sky | #74B9FF |

### Colorblind-Friendly Alternative

| Species | Color | Hex Code |
|---------|-------|----------|
| Species A | Blue | #0066CC |
| Species B | Orange | #FF9900 |

## 5.4 The "Ghost" Trail Effect

Boids leave fading trails as they move, creating beautiful visual patterns:

| Property | Specification |
|----------|---------------|
| **Technique** | Canvas not fully cleared each frame; semi-transparent overlay applied |
| **Default Intensity** | Subtle — trails fade quickly |
| **Adjustability** | Slider controls trail persistence (0% to 50% opacity) |
| **Result** | Dense areas glow brighter (natural "heatmap" effect) |

**How it works:**
```
Frame 1: Draw boids
Frame 2: Apply 95% transparent black overlay, then draw boids
Frame 3: Apply overlay again, then draw boids
Result: Old positions fade gradually, creating trails
```

## 5.5 Quadtree Visualization

Users can visualize the spatial partitioning (helpful for learning/debugging):

| Mode | Description |
|------|-------------|
| **Off** | No visualization (default) |
| **Grid Lines** | Shows subdivision boundaries |
| **Active Regions** | Grid + highlights regions being queried |
| **Heat Map** | Colors nodes by how many boids they contain |
| **Animated** | Nodes flash briefly when queried |

---

# 6. Perception System

## 6.1 Perception Cone

Each boid has a limited field of view:

| Property | Specification |
|----------|---------------|
| **Default Angle** | 270° (can't see directly behind) |
| **Adjustability** | Slider from 180° (half vision) to 360° (omnidirectional) |
| **Orientation** | Centered on direction of travel |

### Visual Representation

```
         Field of View (270°)
         
              ╱▓▓▓▓▓▓▓▓▓╲
            ╱▓▓▓▓▓▓▓▓▓▓▓▓▓╲
          ╱▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓╲
        ╱▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓╲
        ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
        ╲▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓╱
          ╲▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓╱
            ──────▲──────
                  │
            Boid facing up
            
      (45° blind spot behind)
```

## 6.2 Inspecting Individual Boids

Users can click on any boid to inspect it:

| Property | Specification |
|----------|---------------|
| **Selection Method** | Click directly on a boid |
| **Visual Feedback** | Selected boid gets a glowing highlight |

### Perception Overlay Layers

When a boid is selected, users can toggle these visualizations:

| Layer | What It Shows |
|-------|---------------|
| **Cone** | Wedge shape showing the boid's field of view |
| **Neighbors** | Highlights all boids within perception range |
| **Connections** | Lines drawn from selected boid to each neighbor |
| **Velocity** | Arrow showing direction and speed |

All layers can be turned on/off independently.

---

# 7. Species & Flocking Behavior

## 7.1 Multi-Species Support

The simulation supports 1-3 distinct species:

| Setting | Options |
|---------|---------|
| **Species Count** | 1, 2, or 3 (user selects) |
| **Default** | 2 species |
| **Visual Distinction** | Different colors AND different shapes |

## 7.2 How Species Interact

All species share the same behavior parameters (speed, radius, etc.), but interact differently:

| Rule | Applies To | Behavior |
|------|------------|----------|
| **Separation** | ALL species | Every boid avoids crowding ANY other boid |
| **Alignment** | Same species only | Boids match direction of their own kind |
| **Cohesion** | Same species only | Boids stick with their own kind |

### What This Creates

- Species naturally form separate flocks (cohesion + alignment with same species)
- Flocks don't collide (separation applies to everyone)
- When flocks meet, they flow around each other like oil and water

---

# 8. The Shepherd (Mouse Interaction)

## 8.1 Concept

The user's mouse cursor acts as a "Shepherd" — an invisible force that influences nearby boids. This lets users interact with and manipulate flocks.

## 8.2 Configuration

| Property | Specification |
|----------|---------------|
| **Influence Radius** | Adjustable via slider (50px to 200px) |
| **Visual Indicator** | Subtle circle showing area of influence |
| **Default State** | Repel mode |

## 8.3 Behavior Modes

Users can toggle between three modes:

| Mode | Effect | Use Case |
|------|--------|----------|
| **Repel** | Boids flee from cursor | Scatter flocks, observe reactions |
| **Attract** | Boids drawn toward cursor | Gather boids, guide movement |
| **Neutral** | Cursor has no effect | Observe without interference |

### Repel Mode Visualization

```
    Boids fleeing from cursor
    
         ↖ 🐦   🐦 ↗
           ↖   ↗
        🐦 ← ◯ → 🐦      ◯ = Cursor
           ↙   ↘
         ↙ 🐦   🐦 ↘
```

---

# 9. User Interface

## 9.1 Layout Overview

```
┌─────────────────────────────────────────────────────────────────┐
│ ┌───────────────┐                                               │
│ │   SIDEBAR     │                                               │
│ │   (Controls)  │         SIMULATION CANVAS                     │
│ │               │                                               │
│ │  [Collapse →] │              🐦  🐦    🐦                      │
│ │               │         🐦        🐦      🐦                   │
│ │  Boid Count   │              🐦  🐦                            │
│ │  [====] 100   │                     🐦   🐦                    │
│ │               │         🐦    🐦  🐦                           │
│ │  Separation   │                                               │
│ │  [====] 1.5   │                                               │
│ │               │    ┌─────────────────┐                        │
│ │  ...          │    │ FPS: 60         │  ← Metrics Overlay     │
│ │               │    │ Boids: 100      │                        │
│ └───────────────┘    │ 🔴 50 | 🔵 50   │                        │
│                      └─────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

## 9.2 Sidebar Structure

The sidebar is **collapsible** (can be hidden to maximize canvas space):

### Section: Simulation

| Control | Type | Function |
|---------|------|----------|
| Boid Count | Slider (10-2000+) | Add or remove boids in real-time |
| Pause/Play | Button | Freeze/resume simulation |
| Reset | Button | Return to initial state |

### Section: Behavior

| Control | Type | Range | Default |
|---------|------|-------|---------|
| Separation | Slider | 0 - 5 | 1.5 |
| Alignment | Slider | 0 - 5 | 1.0 |
| Cohesion | Slider | 0 - 5 | 1.0 |
| Max Speed | Slider | 1 - 10 | 4 |
| Neighbor Radius | Slider | 20 - 150 | 50 |
| Perception Angle | Slider | 180° - 360° | 270° |

### Section: Presets

| Control | Function |
|---------|----------|
| Schooling | Load schooling preset |
| Chaotic Swarm | Load swarm preset |
| Tight Cluster | Load cluster preset |
| Save | Save current settings as custom preset |
| Load | Load a previously saved preset |

### Section: Species

| Control | Type | Function |
|---------|------|----------|
| Count | Buttons (1/2/3) | Set number of species |
| Palette | Toggle (Warm/Cool) | Switch color scheme |

### Section: Shepherd

| Control | Type | Function |
|---------|------|----------|
| Mode | Buttons (Repel/Attract/Neutral) | Set cursor behavior |
| Radius | Slider (50-200) | Set influence area size |

### Section: Display

| Control | Type | Function |
|---------|------|----------|
| Theme | Toggle (Nature/Minimal) | Switch visual theme |
| Trails | Slider (0%-50%) | Adjust trail persistence |
| Quadtree | Dropdown | Select visualization mode |

### Section: Debug (Hidden by Default)

| Control | Function |
|---------|----------|
| Show Quadtree Stats | Display node count, tree depth |
| Quadtree Parameters | Advanced tuning options |

## 9.3 Slider Design

All sliders use a detailed format for clarity:

```
Parameter Name
[Min]═══════●═══════[Max]  Value
  0                   5     1.5
```

Components:
- Parameter name above
- Min value on left
- Max value on right
- Current value displayed
- Draggable handle (●)

## 9.4 Preset System

| Feature | Behavior |
|---------|----------|
| **Built-in Presets** | Three presets always available |
| **Custom Save** | User can save current settings with a name |
| **Custom Load** | User can load previously saved settings |
| **Storage** | Saved to browser's LocalStorage (persists between sessions) |

### Built-in Preset Values

| Preset | Separation | Alignment | Cohesion | Radius | Description |
|--------|------------|-----------|----------|--------|-------------|
| **Schooling** | 1.5 | 2.5 | 1.5 | 60 | Organized, parallel movement |
| **Chaotic Swarm** | 1.0 | 0.5 | 0.5 | 30 | Disorganized, buzzing motion |
| **Tight Cluster** | 1.0 | 1.0 | 3.0 | 80 | Dense, cohesive groups |

## 9.5 On-Screen Metrics

Small overlay in corner showing live statistics:

| Metric | Example | Description |
|--------|---------|-------------|
| **FPS** | 60 | Current frame rate |
| **Total Boids** | 100 | Total count |
| **Per Species** | 🔴 50 \| 🔵 50 | Count by species with color indicator |

---

# 10. Interaction Features

## 10.1 Real-Time Boid Control

| Feature | Implementation |
|---------|----------------|
| **Add/Remove Boids** | Slider adjusts count instantly |
| **New Boid Spawn** | Appear at random positions |
| **Boid Removal** | Random boids removed (not biased) |

## 10.2 Simulation Controls

| Control | Behavior |
|---------|----------|
| **Pause** | Freezes all boid movement; UI remains interactive |
| **Resume** | Continues from exact paused state |
| **Reset** | Returns to initial state with default settings |

## 10.3 Keyboard Shortcuts

Essential shortcuts only (easy to remember):

| Key | Action |
|-----|--------|
| `Space` | Pause / Resume simulation |
| `R` | Reset to initial state |

---

# 11. Scenarios & Experiments

Two pre-configured experiments help users understand key concepts:

## 11.1 Experiment: "Wave Propagation"

**Learning Goal:** See how information travels through a flock without central coordination.

| Setup | Value |
|-------|-------|
| **Boid Count** | 500+ |
| **Preset** | Tight Cluster |
| **Shepherd Mode** | Repel |

**Instructions:**
1. Let the flock settle into a dense formation
2. Move cursor to the edge of the flock
3. Watch the "wave" of avoidance ripple through the group
4. Notice how boids that never "saw" your cursor still react (via their neighbors)

**What You Learn:** Individual boids only know about their immediate neighbors, yet information propagates across the entire flock — an emergent communication network.

## 11.2 Experiment: "Species Segregation"

**Learning Goal:** Watch how simple rules create complex social structures.

| Setup | Value |
|-------|-------|
| **Boid Count** | 200 (100 per species) |
| **Species** | 2 |
| **Starting Positions** | Random (mixed together) |
| **Preset** | Schooling |

**Instructions:**
1. Observe the initially mixed population
2. Wait 30-60 seconds without interacting
3. Watch as same-species boids gradually find each other
4. Notice distinct flocks forming

**What You Learn:** Without any "desire" to segregate, species naturally separate because they only align and cohere with their own kind. Simple local rules create global structure.

---

# 12. Accessibility

## 12.1 Colorblind Support

| Feature | Implementation |
|---------|----------------|
| **Alternative Palette** | Blue (#0066CC) + Orange (#FF9900) option in Display settings |
| **Shape Differentiation** | Each species has a distinct silhouette (not just color) |

## 12.2 Reduced Motion Mode

For users sensitive to motion:

| When Enabled | Effect |
|--------------|--------|
| **Simulation Speed** | Reduced by 50% |
| **Trails** | Disabled |
| **Particle Effects** | Minimized |
| **Quadtree Animations** | Disabled |

## 12.3 Help System

| Feature | Implementation |
|---------|----------------|
| **Tooltip Hints** | Hover over any control to see explanation |
| **Format** | Brief, clear description of what the control does |

**Example Tooltips:**
- *Separation: "How strongly boids avoid crowding. Higher = more personal space."*
- *Alignment: "How strongly boids match their neighbors' direction. Higher = more uniform movement."*
- *Cohesion: "How strongly boids stick together. Higher = tighter groups."*

## 12.4 Platform Support

| Platform | Support Level |
|----------|---------------|
| **Desktop (mouse + keyboard)** | Full support |
| **Tablet** | Not optimized |
| **Mobile** | Not supported |

---

# 13. Export Features

## 13.1 Configuration Export

Users can save their settings as a JSON file:

| Feature | Behavior |
|---------|----------|
| **Export** | Downloads a `.json` file with all settings |
| **Import** | Load a `.json` file to restore settings |
| **Use Case** | Share configurations, backup experiments |

### Example Export File

```json
{
  "version": "1.0",
  "name": "My Custom Setup",
  "behavior": {
    "separation": 1.5,
    "alignment": 1.0,
    "cohesion": 1.0,
    "maxSpeed": 4,
    "neighborRadius": 50,
    "perceptionAngle": 270
  },
  "simulation": {
    "boidCount": 100,
    "boundaryMode": "wrap"
  },
  "species": {
    "count": 2,
    "palette": "warm"
  },
  "shepherd": {
    "mode": "repel",
    "radius": 100
  },
  "display": {
    "theme": "nature",
    "trailOpacity": 0.2,
    "quadtreeVisualization": "off"
  }
}
```

---

# 14. Mathematical Foundations

## 14.1 The Steering Formula

Each rule calculates a "steering force" that influences the boid's movement:

```
Steering Force = Desired Velocity − Current Velocity
```

The boid then adjusts its velocity based on this force.

## 14.2 Rule Calculations

### Separation

**Goal:** Avoid crowding nearby boids.

**Calculation:**
1. Find all neighbors within radius
2. For each neighbor, calculate a vector pointing AWAY from it
3. Weight each vector by inverse distance (closer = stronger repulsion)
4. Average all these vectors
5. Result is the "desired velocity" away from crowds

```
         🐦 ← Neighbor
          ╲
           ╲ Repulsion vector
            ╲
             ●  ← This boid wants to move this way
            ╱
           ╱
          ╱
         🐦 ← Another neighbor
```

### Alignment

**Goal:** Match the direction of nearby same-species boids.

**Calculation:**
1. Find all same-species neighbors within radius
2. Average their velocity vectors (direction + speed)
3. Result is the "desired velocity" matching the group's heading

```
    🐦→  🐦→  🐦→
              ↓
         Average = →
              ↓
    This boid wants to go →
```

### Cohesion

**Goal:** Move toward the center of nearby same-species boids.

**Calculation:**
1. Find all same-species neighbors within radius
2. Calculate their average position (center of mass)
3. Create vector from this boid toward that center
4. Result is the "desired velocity" toward the group

```
         🐦        🐦
              ◯ ← Center of mass
         🐦    ↑
               │
               ● ← This boid steers toward center
```

## 14.3 Combining Forces

Each frame, a boid calculates all three steering forces, then combines them:

```
Final Steering = (Separation × Weight₁) + (Alignment × Weight₂) + (Cohesion × Weight₃)
```

The weights are the slider values, letting users emphasize different behaviors.

## 14.4 Quadtree Efficiency

**Without Quadtree:**
- Each boid checks against ALL other boids
- Complexity: O(n²)
- 1,000 boids = 1,000,000 comparisons per frame

**With Quadtree:**
- Each boid only checks nearby boids in same/adjacent tree nodes
- Complexity: O(n log n)
- 1,000 boids ≈ 10,000 comparisons per frame (100× faster!)

---

# 15. File Structure

```
boids-mini-lab/
│
├── index.html              # Main HTML file
│
├── css/
│   └── styles.css          # All styling
│
├── js/
│   ├── main.js             # Entry point, game loop
│   ├── boid.js             # Boid class and behavior rules
│   ├── quadtree.js         # Spatial partitioning system
│   ├── flock.js            # Manages all boids
│   ├── shepherd.js         # Mouse interaction system
│   ├── renderer.js         # Canvas drawing functions
│   ├── ui.js               # Sidebar and controls
│   ├── presets.js          # Preset management
│   ├── config.js           # Default values and constants
│   └── utils.js            # Math helpers, vector operations
│
└── README.md               # Project documentation
```

---

# 16. Success Criteria

## 16.1 Performance

| Metric | Target |
|--------|--------|
| **Frame Rate** | 60 FPS with 2,000 boids |
| **UI Response** | Controls respond within 16ms |
| **Load Time** | Under 2 seconds |

## 16.2 Visual Quality

| Requirement | Specification |
|-------------|---------------|
| **Smooth Movement** | No stuttering or frame drops |
| **Trail Effect** | Clean fade, no artifacts |
| **Boid Visibility** | Clear shapes, distinguishable species |

## 16.3 Usability

| Requirement | Specification |
|-------------|---------------|
| **Learning Curve** | New user understands controls within 30 seconds |
| **Discoverability** | All features accessible without documentation |
| **Feedback** | UI responds visibly to all interactions |

---

# 17. Future Expansion Ideas

These features are **NOT included** in the initial build, but are prioritized for potential future development:

## 17.1 Priority 1: Predator Boids

**Concept:** AI-controlled "hunter" boids that chase prey.

| Feature | Description |
|---------|-------------|
| **Behavior** | Predators pursue nearest prey boid |
| **Prey Reaction** | Prey species flee from predators |
| **Visual Effect** | Dramatic flock-splitting when predator dives in |
| **Food Chain** | Could have predator → prey → food hierarchy |

## 17.2 Priority 2: Audio Reactivity

**Concept:** Soundscape that responds to flock behavior.

| Feature | Description |
|---------|-------------|
| **Density → Richness** | Denser clusters produce richer, layered tones |
| **Speed → Pitch** | Faster movement creates higher pitch |
| **Splits → Percussion** | Flock splitting triggers percussive sounds |
| **Optional Input** | React to microphone audio |

---

# Appendix A: Glossary

| Term | Definition |
|------|------------|
| **Boid** | A simulated bird-like agent that follows flocking rules |
| **Cohesion** | The rule that makes boids stay close to their neighbors |
| **Alignment** | The rule that makes boids move in the same direction as neighbors |
| **Separation** | The rule that makes boids avoid crowding |
| **Emergence** | Complex patterns arising from simple rules |
| **Quadtree** | A data structure that divides space for efficient neighbor-finding |
| **Perception Cone** | The limited field of view each boid has |
| **Steering Force** | A vector that changes a boid's velocity |
| **Wrap** | Boundary mode where boids exit one edge and appear on the opposite |
| **Bounce** | Boundary mode where boids reflect off edges |

---

# Appendix B: Quick Reference Card

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Pause / Resume |
| `R` | Reset |

## Default Values

| Parameter | Default |
|-----------|---------|
| Boid Count | 100 |
| Separation | 1.5 |
| Alignment | 1.0 |
| Cohesion | 1.0 |
| Max Speed | 4 |
| Neighbor Radius | 50 |
| Perception Angle | 270° |

## Preset Summary

| Preset | Best For |
|--------|----------|
| **Schooling** | Organized, parallel movement like fish |
| **Chaotic Swarm** | Buzzing, insect-like motion |
| **Tight Cluster** | Dense, cohesive groups like starlings |

---

*End of Specification*

---

**Document Version:** 1.0  
**Status:** Ready for Implementation

**Instructions for Developer:**
> Build "Boids Mini-Lab" according to this specification. Start with the core simulation (boids + quadtree), then add UI controls, then visual polish. Test performance with 2,000 boids before considering the feature complete.
