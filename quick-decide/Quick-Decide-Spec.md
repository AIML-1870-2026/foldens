# 🧠 Quick, Decide! — Decision Neuron Sim

## Project Specification v1.0

> A Quick, Draw!-inspired browser game where users sketch objects against a timer, a real neural network guesses in real-time, and an optional educational layer lets you peek inside the neuron. Includes a Decision Boundary Visualizer as a stretch feature.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Core Experience](#2-core-experience)
3. [Visual Design System](#3-visual-design-system)
4. [Game Architecture](#4-game-architecture)
5. [Tab 1: The Game (Draw & Guess)](#5-tab-1-the-game-draw--guess)
6. [Tab 2: Decision Boundary Visualizer](#6-tab-2-decision-boundary-visualizer)
7. [Educational Layer (Toggleable)](#7-educational-layer-toggleable)
8. [ML Model & Recognition Engine](#8-ml-model--recognition-engine)
9. [Object Categories](#9-object-categories)
10. [Scoring & Progression](#10-scoring--progression)
11. [Responsive Design](#11-responsive-design)
12. [Technical Stack](#12-technical-stack)
13. [File Structure](#13-file-structure)
14. [Implementation Phases](#14-implementation-phases)
15. [Acceptance Criteria](#15-acceptance-criteria)

---

## 1. Project Overview

### What Is This?

**Quick, Decide!** is a browser-based drawing game that closely mirrors Google's [Quick, Draw!](https://quickdraw.withgoogle.com/) experience. The user is prompted to draw an object (e.g., "Draw a cat!") within a 20-second timer. A neural network watches the canvas in real-time and tries to guess what the user is drawing. If it guesses correctly before time runs out, the user scores a point.

### What Makes It Different?

1. **Hand-drawn / sketch aesthetic** — the entire UI looks like it was drawn on paper with pencil, including wobbly borders, hand-drawn fonts, and a paper-textured background. The drawing canvas itself also has this sketchy feel.
2. **Toggleable "Peek Inside the Neuron" educational mode** — users can optionally see a live visualization of a single neuron's activation, weights, and sigmoid output as the model processes their drawing. This is educational, not gameplay-critical.
3. **Decision Boundary Visualizer** (Tab 2) — a heatmap showing the neuron's decision landscape for two selected features, with a crosshair tracking the current drawing's position in feature space.

### Goals

- **Fun & engaging** — the game loop must feel snappy, rewarding, and replayable
- **Educational** — users learn how neural networks recognize patterns, without being forced to
- **Portfolio-worthy** — polished enough to impress recruiters and clients
- **Technically sound** — uses a real ML model (not heuristics), runs entirely in-browser

---

## 2. Core Experience

### The 30-Second Pitch

> You're given an object to draw. You have 20 seconds. As your pen moves, a neural network watches and guesses. Can you draw fast enough for it to recognize your sketch?

### Core Loop (per round)

```
1. PROMPT    → "Draw a [object]!" appears with emoji and wobbly text
2. COUNTDOWN → 3... 2... 1... GO! (hand-drawn numbers)
3. DRAW      → 20-second timer, user sketches on canvas
4. GUESS     → Model guesses in real-time, top 5 guesses shown as floating labels
5. RESULT    → Correct: gentle glow + "I knew it!" / Wrong: "I thought it was a [X]..."
6. NEXT      → Brief stats, then next object
```

### Session Structure

- A **game session** = 6 rounds (like Quick, Draw!)
- After 6 rounds: summary screen with score, best drawing, and replay option
- No login required — sessions are ephemeral

---

## 3. Visual Design System

### Core Aesthetic: Hand-Drawn / Sketchy

The entire application should look like it was sketched in a notebook. This is not a subtle accent — it is the dominant visual language.

### Colors

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Paper Background | Warm off-white | `#FFF8F0` | Page background, canvas |
| Pencil Dark | Charcoal | `#2D2D2D` | Primary text, borders |
| Pencil Light | Soft gray | `#8B8B8B` | Secondary text, grid lines |
| Ink Blue | Sketch blue | `#4A90D9` | Links, interactive elements, neuron active |
| Eraser Pink | Soft pink | `#E8A0BF` | Incorrect guess, error states |
| Highlight Yellow | Warm yellow | `#F5D547` | Timer, score, success glow |
| Correct Green | Muted green | `#7BC47F` | Correct guess celebration |
| Paper Lines | Faint blue | `#D4E4F7` | Notebook ruled lines (optional background pattern) |

### Typography

| Element | Font | Fallback | Notes |
|---------|------|----------|-------|
| Headings / Prompts | **Caveat** (Google Fonts) | `cursive` | Hand-drawn feel, thick weight for prompts |
| Body / UI Labels | **Patrick Hand** (Google Fonts) | `cursive` | Readable but sketchy |
| Code / Math | **Architect's Daughter** (Google Fonts) | `monospace` | For the educational neuron math display |
| Timer Numbers | **Caveat Bold** | `cursive` | Large, wobbly countdown |

If Google Fonts are unavailable, fall back to system cursive fonts.

### Border & Line Treatment

All borders, dividers, and outlines should appear **hand-drawn**. Implementation approaches (choose one):

**Option A: SVG Filters (recommended)**
```css
.sketchy-border {
  filter: url(#sketchy);
  border: 2px solid #2D2D2D;
}
```
With an SVG `<feTurbulence>` + `<feDisplacementMap>` filter that wobbles lines.

**Option B: rough.js library**
Use [rough.js](https://roughjs.com/) to render all rectangles, circles, and lines with a hand-drawn look. This is the most authentic approach but adds a dependency.

**Option C: CSS border-image with hand-drawn SVG borders**
Pre-made SVG border images applied via CSS.

> **Recommendation for Claude Code:** Use rough.js for the neuron visualizations and key UI elements. Use CSS with subtle `rotate()` and `border-radius` variations for simpler elements like buttons and cards. This balances authenticity with performance.

### Iconography

- Use emoji liberally for object categories (🐱 🏠 ✈️ etc.)
- UI icons should be simple SVG line drawings that look hand-sketched
- No filled/solid icons — outlines only, with slight wobble

### Animations

- **Wobbly hover** — elements slightly rotate (±1-2°) on hover
- **Pencil draw-in** — borders and lines animate as if being drawn
- **Gentle glow** — correct answers get a soft yellow/green glow (no confetti, no screen shake)
- **Fade & slide** — transitions between states use gentle fades with slight vertical movement
- **Scribble-out** — incorrect guesses get a quick scribble-through animation

### Sound

- No sound effects by default
- Optional: pencil scratch sound on drawing (togglable in settings)

---

## 4. Game Architecture

### State Machine

```
┌──────────┐    ┌──────────┐    ┌──────────┐
│  SPLASH  │───▶│  PROMPT  │───▶│ COUNTDOWN│
│  SCREEN  │    │ (show    │    │ 3..2..1  │
│          │    │  object) │    │          │
└──────────┘    └──────────┘    └──────────┘
                                     │
                ┌──────────┐    ┌────▼─────┐
                │  RESULT  │◀───│ DRAWING  │
                │ (correct │    │ (20 sec  │
                │ or not)  │    │  timer)  │
                └────┬─────┘    └──────────┘
                     │
              ┌──────▼──────┐
              │ round < 6?  │
              │  YES → PROMPT│
              │  NO → SUMMARY│
              └─────────────┘
```

### State Shape (React)

```javascript
{
  // Game state
  gamePhase: 'splash' | 'prompt' | 'countdown' | 'drawing' | 'result' | 'summary',
  currentRound: 1-6,
  currentObject: { name: string, emoji: string, category: string },
  objectQueue: [...], // 6 pre-selected objects for this session
  timeRemaining: 0-20, // seconds
  score: 0-6,
  roundResults: [{ object, guessedCorrectly, timeUsed, topGuesses, drawingData }],

  // Drawing state
  canvasStrokes: [[{x, y, t}]], // array of strokes, each an array of points
  isDrawing: boolean,

  // Model state
  currentPredictions: [{ label: string, confidence: number }], // top 5
  modelReady: boolean,
  modelLoading: boolean,

  // UI state
  activeTab: 'game' | 'visualizer',
  educationalMode: boolean, // toggle for neuron peek
  
  // Educational layer state (when toggled on)
  neuronData: {
    activations: number[],
    weights: number[],
    bias: number,
    sigmoidOutput: number,
    zValue: number
  }
}
```

---

## 5. Tab 1: The Game (Draw & Guess)

### Layout

```
┌─────────────────────────────────────────────────┐
│  [🧠 Game]  [📊 Visualizer]        ⚙️ Settings │  ← Tab bar (hand-drawn underline on active)
├─────────────────────────────────────────────────┤
│                                                 │
│     ✏️ Draw a CAT! 🐱          Round 3/6       │  ← Prompt area (large, wobbly text)
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │                                         │    │
│  │                                         │    │
│  │            DRAWING CANVAS               │    │  ← Main canvas (paper texture bg)
│  │          (touch + mouse)                │    │
│  │                                         │    │
│  │                                         │    │
│  │                                         │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ⏱️ 14s remaining    [Undo] [Clear]    3/6 ⭐   │  ← Controls bar
│                                                 │
│  ┌─ I see... ──────────────────────────────┐    │
│  │  🐱 cat 72%  🐕 dog 15%  🐰 rabbit 8% │    │  ← Live guess bar (top 3-5)
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ┌─ 🔬 Peek Inside (optional) ────────────┐    │  ← Educational panel (collapsed by default)
│  │  [Toggle to expand neuron view]         │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Splash Screen

- App title "Quick, Decide! 🧠" in large hand-drawn text
- Subtitle: "Can a neural network guess what you're drawing?"
- Single **[Let's Draw!]** button (hand-drawn rectangle, wobbly)
- Brief instructions: "You'll draw 6 objects. 20 seconds each. Let's see if the AI can keep up!"
- Small footer: "Powered by a real neural network • [Learn how it works →]"

### Prompt Phase (2 seconds)

- Full-screen display: emoji + object name in huge wobbly text
- Example: `✏️ Draw a BICYCLE! 🚲`
- Brief animation: text draws itself in (pencil stroke effect)
- Auto-transitions to countdown after 2 seconds

### Countdown Phase (3 seconds)

- Large centered numbers: **3... 2... 1...** in hand-drawn style
- Each number slightly wobbles and fades
- Canvas is visible but disabled (grayed out pencil cursor)

### Drawing Phase (20 seconds)

#### Canvas

- **Size:** At least 400×400px on desktop, full-width on mobile
- **Background:** Warm paper texture (`#FFF8F0`) with optional faint grid
- **Stroke style:** 
  - Color: `#2D2D2D` (pencil charcoal)
  - Width: 3px base, with slight pressure variation if available
  - Line cap: round
  - Optional: slight wobble filter on strokes to match sketch aesthetic
- **Touch & mouse support:** Both pointer and touch events
- **Undo:** Remove last stroke (not individual points)
- **Clear:** Wipe canvas entirely (with quick eraser animation)

#### Timer

- Visible countdown from 20 → 0
- Visual treatment: circular progress ring drawn in pencil style, or horizontal bar that depletes
- At 5 seconds: timer turns `#E8A0BF` (pink) and wobbles faster
- At 0 seconds: pencil ✏️ icon drops / breaks

#### Real-Time Guessing

- Model runs inference every ~500ms (or on stroke-end events)
- **Guess display:** Horizontal bar below the canvas showing top 3-5 predictions
  - Each guess: emoji (if available) + label + confidence percentage
  - Bars fill proportionally to confidence
  - The top guess is highlighted / larger
  - Guesses animate in and shuffle smoothly as confidence changes
- **When correct guess appears:**
  - The correct label gets a subtle green glow
  - If confidence exceeds a threshold (e.g., 70%), the round ends early
  - Brief "I knew it!" or "Got it!" text appears in hand-drawn style

#### Stroke Data Collection

Each stroke is an array of `{x, y, timestamp}` points. The full drawing is an array of strokes. This data is:
1. Fed to the model for inference (preprocessed to 28×28 grayscale)
2. Stored in round results for the summary screen replay
3. Available for the Decision Boundary Visualizer (feature extraction)

### Result Phase (3 seconds)

#### Correct Guess

- Canvas border glows soft green
- Text: "I knew it was a [object]! ✨" (hand-drawn text)
- The neuron visualization (if educational mode is on) shows the sigmoid output spiking
- Score increments with a gentle bounce animation
- Subtitle: "Got it in [X] seconds"

#### Incorrect / Timeout

- Canvas border briefly tints pink
- Text: "Hmm, I thought that was a [top_guess]... 🤔" (hand-drawn text)
- Show what the model thought it was vs what it actually was
- Playful, not punishing — "That's a tough one!"

### Summary Screen

After 6 rounds:

```
┌─────────────────────────────────────────┐
│                                         │
│     ⭐ You scored 4 out of 6! ⭐        │
│                                         │
│  Round 1: 🐱 Cat .............. ✅ 8s   │
│  Round 2: 🚲 Bicycle .......... ✅ 14s  │
│  Round 3: 🏠 House ............ ✅ 6s   │
│  Round 4: 🎸 Guitar ........... ❌      │
│  Round 5: ✈️ Airplane ......... ✅ 11s  │
│  Round 6: 🌵 Cactus ........... ❌      │
│                                         │
│  Best drawing: [thumbnail of Round 3]   │
│  Fastest guess: Round 3 (6 seconds!)    │
│                                         │
│       [Play Again!]  [Share Results]    │
│                                         │
│  [🔬 Explore how the AI works →]        │
│                                         │
└─────────────────────────────────────────┘
```

- Each round shows a small thumbnail of the drawing, the object name, and whether the AI guessed correctly
- "Play Again" starts a new session with 6 new random objects
- "Share Results" copies a text summary to clipboard
- "Explore how the AI works" enables educational mode and scrolls to the neuron panel

---

## 6. Tab 2: Decision Boundary Visualizer

### Purpose

After (or during) a game, users can switch to this tab to see a **heatmap** of how the neuron classifies different inputs. This makes the abstract math spatial and visual.

### Layout

```
┌─────────────────────────────────────────────────┐
│  [🧠 Game]  [📊 Visualizer]        ⚙️ Settings │
├─────────────────────────────────────────────────┤
│                                                 │
│  Decision Boundary Visualizer                   │
│  "Where does the neuron say YES vs NO?"         │
│                                                 │
│  Axes: [Feature A ▼] vs [Feature B ▼]          │  ← Dropdown to select 2 features
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │                                         │    │
│  │     HEATMAP (2D grid)                   │    │
│  │     Cool blue = NO (low activation)     │    │
│  │     White = borderline                  │    │
│  │     Magenta = YES (high activation)     │    │
│  │                                         │    │
│  │         ╳ ← crosshair at current pos    │    │
│  │                                         │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  Feature A: ████████░░ 0.72                     │  ← Sliders to move crosshair
│  Feature B: █████░░░░░ 0.45                     │
│                                                 │
│  Current activation: 0.83 (YES)                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

### How It Works

1. **Feature Extraction:** The model extracts intermediate features from the user's drawing (or uses the last drawing from the game). Two features are selected as X and Y axes.
2. **Heatmap Generation:** For a grid of (X, Y) values (e.g., 50×50), compute the neuron's output while holding all other features fixed. Color each cell by the output value.
3. **Color Scale:**
   - Cool blue (`#4A90D9`) → White (`#FFFFFF`) → Magenta (`#D94A8A`)
   - Blue = low activation (neuron says NO)
   - Magenta = high activation (neuron says YES)
4. **Crosshair:** A gold (`#F5D547`) crosshair dot tracks the current (X, Y) position. Moving the sliders moves the crosshair.
5. **Rendering:** Use HTML `<canvas>` for the heatmap (pixel-level control). Overlay the crosshair as an absolutely-positioned element or draw it on a second canvas layer.

### Feature Dropdown Options

The dropdown should list features that are meaningful and educational. Since the model uses a CNN, the "features" would be activations from an intermediate layer. Label them with human-readable names where possible:

- "Curviness" (feature correlated with curved strokes)
- "Symmetry" (horizontal/vertical symmetry)
- "Density" (how much of the canvas is filled)
- "Edge Count" (number of distinct edges/corners)
- "Vertical Extent" (how tall the drawing is)
- "Horizontal Extent" (how wide the drawing is)

If extracting meaningful named features from the CNN is too complex, use generic labels like "Feature 1", "Feature 2", etc., with a tooltip explaining these are intermediate neuron activations.

### Interactivity

- Moving the sliders updates the crosshair position on the heatmap in real-time
- The heatmap itself can be clicked to set the crosshair position (which updates the sliders)
- "Current activation" display updates live as the crosshair moves
- The heatmap should render within 200ms for a responsive feel (precompute if needed)

### Sketch Aesthetic for Heatmap

- The heatmap border should be hand-drawn (wobbly rectangle)
- Axis labels in hand-drawn font
- The crosshair is a hand-drawn "X" mark (not a precise crosshair)
- Color scale legend drawn with pencil-style dividers

---

## 7. Educational Layer (Toggleable)

### Toggle Mechanism

- A collapsible panel below the canvas labeled "🔬 Peek Inside the Neuron"
- Collapsed by default — user clicks to expand
- Toggle state persists across rounds (within a session)
- Can also be toggled from the Settings gear icon

### What It Shows (When Expanded)

```
┌─ 🔬 Peek Inside the Neuron ───────────────────┐
│                                                │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐  │
│  │ INPUTS  │────▶│ NEURON  │────▶│ OUTPUT  │  │
│  │         │     │         │     │         │  │
│  │ feat 1: │  w₁ │  Σ + b  │  σ  │  0.83   │  │
│  │  0.72   │     │         │     │  = CAT  │  │
│  │ feat 2: │  w₂ │ z=2.14  │     │         │  │
│  │  0.45   │     │         │     │         │  │
│  │  ...    │     │         │     │         │  │
│  └─────────┘     └─────────┘     └─────────┘  │
│                                                │
│  Math: z = (0.72 × 1.5) + (0.45 × -0.8) +    │
│           ... + bias(-0.3) = 2.14              │
│        σ(2.14) = 0.83                          │
│                                                │
│  ████████████████░░░░ 83% confident            │
│                                                │
└────────────────────────────────────────────────┘
```

### Elements

1. **Input → Neuron → Output flow diagram** — a simple left-to-right visualization drawn in sketch style
   - Left: input features with their current values
   - Center: the neuron body (a hand-drawn circle) showing the weighted sum
   - Right: the sigmoid output value and what it maps to
   - Connecting lines with weights labeled

2. **Live math display** — shows the actual equation being computed
   - `z = Σ(xᵢ × wᵢ) + b`
   - `σ(z) = 1 / (1 + e^(-z))`
   - Values update in real-time as the drawing changes

3. **Sigmoid curve** — a small plot of the sigmoid function with a marker at the current z value
   - Drawn in sketch style (wobbly line)
   - Marker is a hand-drawn dot

4. **Confidence bar** — fills proportionally to the output, color-coded

### Implementation Notes

- This layer visualizes ONE neuron from the network (e.g., the output neuron for the current target class, or a prominent hidden neuron)
- The weights and activations should be real values from the loaded model
- Update frequency: every time the model runs inference (every ~500ms)

---

## 8. ML Model & Recognition Engine

### Model Architecture

Use a **Convolutional Neural Network (CNN)** trained on Google's Quick, Draw! dataset, running client-side via **TensorFlow.js**.

### Recommended Approach

**Option 1: Pre-trained Quick, Draw! model (easiest)**

Google provides pre-trained models for Quick, Draw! recognition. Use or adapt one of these:
- [Quick, Draw! dataset models](https://github.com/googlecreativelab/quickdraw-dataset)
- Community TensorFlow.js models trained on Quick, Draw! data

**Option 2: Train a custom lightweight CNN**

If a suitable pre-trained TF.js model isn't available, train a small CNN:

```
Input: 28×28 grayscale image (preprocessed from canvas)
Conv2D(32, 3×3) → ReLU → MaxPool(2×2)
Conv2D(64, 3×3) → ReLU → MaxPool(2×2)
Flatten → Dense(128) → ReLU → Dropout(0.5)
Dense(345) → Softmax  (345 = number of Quick Draw categories)
```

Convert to TensorFlow.js format with `tensorflowjs_converter`.

**Option 3: Use ONNX Runtime Web with an ONNX model**

Alternative to TF.js if model availability is better in ONNX format.

### Preprocessing Pipeline

```
Canvas (any size) 
  → Crop to bounding box of strokes (with padding)
  → Resize to 28×28 pixels  
  → Convert to grayscale
  → Normalize pixel values to [0, 1]
  → Invert if needed (white strokes on black bg → black strokes on white bg)
  → Feed to model
```

### Inference Timing

- Run inference on **stroke end** (when user lifts pen) AND on a **500ms interval** during drawing
- Debounce to prevent running more than 2× per second
- Show loading skeleton for predictions while model loads initially

### Model Loading

- Show a progress bar while the model downloads (first visit)
- Cache the model in IndexedDB for subsequent visits
- Model size target: under 15MB
- Fallback: if model fails to load, show a message and offer "practice mode" (drawing without guessing)

### Extracting Neuron Data for Educational Layer

To power the "Peek Inside the Neuron" panel:

```javascript
// Get intermediate layer outputs using TF.js
const intermediateModel = tf.model({
  inputs: model.inputs,
  outputs: [
    model.getLayer('dense_1').output,   // hidden layer activations
    model.getLayer('dense_2').output,   // output logits (pre-softmax)
  ]
});

const [hiddenActivations, outputLogits] = intermediateModel.predict(inputTensor);
```

Select one neuron from the output layer (the one corresponding to the current target class) and display its:
- Input values (from the previous layer)
- Weights (from the model)
- Bias
- Weighted sum (z)
- Sigmoid/softmax output

---

## 9. Object Categories

### Source: Google Quick, Draw! Dataset

Use the full 345 categories from the [Quick, Draw! dataset](https://github.com/googlecreativelab/quickdraw-dataset/blob/master/categories.txt). These are the objects the model was trained on.

### Category Selection Per Session

Each session picks **6 objects** at random from the full list. Selection rules:
- No duplicates within a session
- Optionally weight toward "fun" or well-recognized categories for new players
- Store which categories the user has attempted (via localStorage) to prefer novel ones

### Category Metadata

Each category needs:
- `name`: the Quick, Draw! label (e.g., "cat")
- `displayName`: formatted for display (e.g., "Cat")
- `emoji`: closest matching emoji (e.g., "🐱")
- `difficulty`: easy / medium / hard (based on model accuracy on that category)

### Sample Categories with Emoji Mapping

```javascript
const CATEGORIES = [
  { name: "cat", displayName: "Cat", emoji: "🐱", difficulty: "easy" },
  { name: "dog", displayName: "Dog", emoji: "🐕", difficulty: "easy" },
  { name: "house", displayName: "House", emoji: "🏠", difficulty: "easy" },
  { name: "tree", displayName: "Tree", emoji: "🌳", difficulty: "easy" },
  { name: "car", displayName: "Car", emoji: "🚗", difficulty: "easy" },
  { name: "bicycle", displayName: "Bicycle", emoji: "🚲", difficulty: "medium" },
  { name: "airplane", displayName: "Airplane", emoji: "✈️", difficulty: "medium" },
  { name: "guitar", displayName: "Guitar", emoji: "🎸", difficulty: "medium" },
  { name: "pizza", displayName: "Pizza", emoji: "🍕", difficulty: "easy" },
  { name: "flower", displayName: "Flower", emoji: "🌸", difficulty: "easy" },
  // ... all 345 categories
  // The full list should be generated from the Quick, Draw! categories.txt file
  // Map each to its closest emoji (some may use a generic 🎨 if no good match)
];
```

> **Implementation note for Claude Code:** Generate the full 345-category list with emoji mappings. Use a best-effort emoji match — not every category has a perfect emoji. Default to `"✏️"` for categories without a clear match.

---

## 10. Scoring & Progression

### Per-Round Scoring

- **Correct guess:** +1 point
- **Bonus info** (display only, not scored): time remaining when guessed correctly
- **No penalty for incorrect** — just 0 points for that round

### Session Score

- Displayed as `X/6` (e.g., "⭐ 4/6")
- Stored in sessionStorage for the current session

### Persistent Stats (localStorage)

Track across sessions:
- Total games played
- Total correct guesses
- Best score (e.g., "Personal best: 6/6! 🏆")
- Categories attempted vs total (e.g., "You've drawn 87 of 345 objects")
- Fastest correct guess time

### Streak Tracking

- Track consecutive correct guesses across rounds (within and across sessions)
- Display: "🔥 5 in a row!"
- Resets on incorrect guess

---

## 11. Responsive Design

### Breakpoints

| Size | Width | Layout |
|------|-------|--------|
| Mobile | < 640px | Single column, canvas full-width, tabs stack vertically |
| Tablet | 640-1024px | Single column with wider canvas, side padding |
| Desktop | > 1024px | Centered content, max-width 900px |

### Mobile Considerations

- Canvas must support touch drawing with no scroll interference (use `touch-action: none`)
- Timer and guess bar should be always visible (not scrolled off-screen)
- Educational panel should be fully collapsed on mobile by default
- Tab switching via swipe gesture (optional enhancement)
- Minimum touch target size: 44×44px

### Canvas Sizing

- Desktop: 500×500px (or responsive up to 600×600px)
- Mobile: full viewport width minus padding, square aspect ratio
- Model input is always 28×28 regardless of canvas display size

---

## 12. Technical Stack

### Core

| Technology | Purpose |
|-----------|---------|
| **React 18+** | UI framework |
| **TypeScript** | Type safety (recommended but optional) |
| **Vite** | Build tool & dev server |
| **TensorFlow.js** | ML model inference in browser |
| **rough.js** | Hand-drawn rendering for UI elements |

### Styling

| Technology | Purpose |
|-----------|---------|
| **Tailwind CSS** | Utility-first styling |
| **Google Fonts** | Caveat, Patrick Hand, Architect's Daughter |
| **CSS custom properties** | Theme colors, sketch effects |

### Canvas & Visualization

| Technology | Purpose |
|-----------|---------|
| **HTML Canvas API** | Drawing surface + heatmap rendering |
| **rough.js** | Sketch-style UI elements (borders, buttons, neuron diagram) |

### State Management

| Technology | Purpose |
|-----------|---------|
| **React useState/useReducer** | Game state |
| **React Context** | Settings, model state (shared across tabs) |
| **localStorage** | Persistent stats, preferences |

### Optional / Nice-to-Have

| Technology | Purpose |
|-----------|---------|
| **Zustand** | If state gets complex, lightweight store |
| **Framer Motion** | Polished animations |
| **Web Workers** | Offload model inference to background thread |

---

## 13. File Structure

```
quick-decide/
├── public/
│   ├── fonts/                    # Self-hosted fallback fonts
│   ├── models/                   # TF.js model files (model.json + weight shards)
│   ├── textures/
│   │   └── paper-texture.png     # Paper background texture
│   └── index.html
│
├── src/
│   ├── main.tsx                  # Entry point
│   ├── App.tsx                   # Root component with tab routing
│   │
│   ├── components/
│   │   ├── game/
│   │   │   ├── SplashScreen.tsx       # Start screen
│   │   │   ├── PromptDisplay.tsx      # "Draw a [X]!" display
│   │   │   ├── Countdown.tsx          # 3-2-1 countdown
│   │   │   ├── DrawingCanvas.tsx      # Main drawing canvas (touch + mouse)
│   │   │   ├── Timer.tsx              # Countdown timer (circular or bar)
│   │   │   ├── GuessBar.tsx           # Live prediction display
│   │   │   ├── RoundResult.tsx        # Correct/incorrect result screen
│   │   │   ├── GameSummary.tsx        # End-of-session summary
│   │   │   └── CanvasControls.tsx     # Undo, clear buttons
│   │   │
│   │   ├── education/
│   │   │   ├── NeuronPanel.tsx        # Toggleable "Peek Inside" panel
│   │   │   ├── NeuronDiagram.tsx      # Input → Neuron → Output flow
│   │   │   ├── MathDisplay.tsx        # Live equation rendering
│   │   │   ├── SigmoidPlot.tsx        # Small sigmoid curve with marker
│   │   │   └── ConfidenceBar.tsx      # Activation confidence bar
│   │   │
│   │   ├── visualizer/
│   │   │   ├── BoundaryVisualizer.tsx # Main heatmap component
│   │   │   ├── HeatmapCanvas.tsx      # Canvas-based heatmap rendering
│   │   │   ├── FeatureSelector.tsx    # Dropdown for axis features
│   │   │   ├── FeatureSliders.tsx     # Sliders to control crosshair
│   │   │   └── Crosshair.tsx         # Hand-drawn crosshair overlay
│   │   │
│   │   └── shared/
│   │       ├── SketchyButton.tsx      # Hand-drawn button component
│   │       ├── SketchyCard.tsx        # Hand-drawn card/panel component
│   │       ├── SketchyTabs.tsx        # Tab bar with hand-drawn underlines
│   │       ├── WobblyText.tsx         # Text with slight rotation animation
│   │       └── PaperBackground.tsx    # Paper texture background wrapper
│   │
│   ├── hooks/
│   │   ├── useGameLoop.ts            # Game state machine logic
│   │   ├── useDrawing.ts             # Canvas drawing logic (strokes, undo)
│   │   ├── useModelInference.ts      # TF.js model loading + inference
│   │   ├── useTimer.ts               # Countdown timer hook
│   │   ├── useNeuronData.ts          # Extract neuron weights/activations
│   │   └── useHeatmap.ts             # Heatmap computation for visualizer
│   │
│   ├── model/
│   │   ├── loadModel.ts              # TF.js model loading with caching
│   │   ├── preprocess.ts             # Canvas → 28×28 tensor pipeline
│   │   ├── predict.ts                # Run inference, return top-K predictions
│   │   ├── extractNeuronData.ts      # Get weights, activations for edu layer
│   │   └── extractFeatures.ts        # Get intermediate features for heatmap
│   │
│   ├── data/
│   │   └── categories.ts             # Full 345-category list with emoji + difficulty
│   │
│   ├── utils/
│   │   ├── sketch.ts                 # rough.js helpers, SVG filter setup
│   │   ├── colors.ts                 # Color scale functions (blue → white → magenta)
│   │   ├── scoring.ts                # Score calculation, localStorage helpers
│   │   └── canvasUtils.ts            # Canvas helpers (crop, resize, export)
│   │
│   ├── contexts/
│   │   ├── GameContext.tsx            # Game state provider
│   │   ├── ModelContext.tsx           # Model loading state provider
│   │   └── SettingsContext.tsx        # User preferences (edu mode, sound, etc.)
│   │
│   └── styles/
│       ├── index.css                 # Tailwind imports + global styles
│       ├── paper-texture.css         # Paper background styles
│       ├── animations.css            # Wobble, draw-in, glow keyframes
│       └── sketch-filters.svg        # SVG filters for hand-drawn effect
│
├── scripts/
│   ├── generate-categories.ts        # Script to generate categories.ts from Quick Draw data
│   └── convert-model.ts             # Script to convert trained model to TF.js format
│
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
└── README.md
```

---

## 14. Implementation Phases

### Phase 1: Core Drawing Game (MVP)

**Goal:** Playable drawing game without ML model — uses a placeholder/mock recognizer.

**Tasks:**
1. Set up Vite + React + Tailwind project
2. Implement drawing canvas with touch/mouse support, undo, clear
3. Build game state machine (splash → prompt → countdown → draw → result → summary)
4. Create all 6 game screens with hand-drawn styling
5. Implement timer with visual countdown
6. Build mock prediction engine (random guesses or simple heuristics) as placeholder
7. Create the 345-category list with emoji mappings
8. Build scoring system with localStorage persistence
9. Apply hand-drawn visual treatment (rough.js, fonts, paper texture)
10. Responsive layout for mobile/desktop

**Deliverable:** A fully playable game loop that looks great, with fake guesses.

### Phase 2: ML Model Integration

**Goal:** Real neural network guessing drawings in real-time.

**Tasks:**
1. Source or train a CNN model for Quick, Draw! recognition
2. Convert to TensorFlow.js format
3. Implement model loading with progress indicator and caching
4. Build preprocessing pipeline (canvas → 28×28 tensor)
5. Implement real-time inference on stroke-end + interval
6. Replace mock predictions with model predictions
7. Tune inference frequency and debouncing for performance
8. Add model loading error handling and fallback (practice mode)
9. Test with Web Worker for non-blocking inference (if needed)

**Deliverable:** The game now actually recognizes drawings.

### Phase 3: Educational Layer

**Goal:** Toggleable "Peek Inside the Neuron" panel with live data.

**Tasks:**
1. Build collapsible NeuronPanel component
2. Extract weights and activations from the loaded model
3. Build neuron flow diagram (input → neuron → output) using rough.js
4. Implement live math display showing weighted sum and sigmoid
5. Build small sigmoid curve plot with animated marker
6. Wire up real-time updates (every inference cycle)
7. Add toggle to Settings
8. Test performance impact of educational layer when open

**Deliverable:** Users can see inside the neuron while playing.

### Phase 4: Decision Boundary Visualizer (Stretch)

**Goal:** Tab 2 with a 2D heatmap and crosshair.

**Tasks:**
1. Build Tab 2 layout with SketchyTabs navigation
2. Implement feature extraction from the model's intermediate layers
3. Build heatmap computation (50×50 grid, compute neuron output for each cell)
4. Render heatmap on canvas with blue → white → magenta color scale
5. Implement crosshair overlay that tracks slider position
6. Build feature axis dropdown selector
7. Add click-to-set interaction on heatmap
8. Optimize heatmap rendering (precompute, cache, or use Web Worker)
9. Apply sketch aesthetic to heatmap borders, labels, crosshair

**Deliverable:** A beautiful, interactive decision boundary heatmap.

### Phase 5: Polish & Launch

**Tasks:**
1. Performance optimization (lazy loading, code splitting)
2. Accessibility audit (keyboard navigation, screen reader labels, focus management)
3. Cross-browser testing (Chrome, Firefox, Safari, mobile browsers)
4. Add subtle animations and transitions between all state changes
5. Error boundary components for graceful failure
6. Loading states for all async operations
7. SEO meta tags and Open Graph for sharing
8. README documentation
9. Deploy (Vercel / Netlify / GitHub Pages)

---

## 15. Acceptance Criteria

### Must Have (MVP)

- [ ] User can draw on a canvas with mouse and touch input
- [ ] Game runs 6 timed rounds (20 seconds each) with distinct objects
- [ ] 3-2-1 countdown before each round
- [ ] Real-time guessing (model or placeholder) with top 3-5 predictions displayed
- [ ] Round ends early on correct high-confidence guess
- [ ] Correct/incorrect result screen after each round
- [ ] Summary screen after 6 rounds showing score and round details
- [ ] Score tracking (session and persistent via localStorage)
- [ ] Hand-drawn/sketchy visual aesthetic throughout (wobbly borders, handwriting fonts, paper texture)
- [ ] Canvas supports undo (last stroke) and clear
- [ ] Responsive layout works on mobile and desktop
- [ ] At least 100 drawable object categories with emoji

### Must Have (Full)

- [ ] TensorFlow.js CNN model loaded and running inference in-browser
- [ ] Model cached in IndexedDB after first load
- [ ] Preprocessing pipeline: canvas → crop → resize → normalize → 28×28 tensor
- [ ] All 345 Quick, Draw! categories available
- [ ] Toggleable educational "Peek Inside the Neuron" panel
- [ ] Educational panel shows: input features, weights, bias, weighted sum, sigmoid output, confidence
- [ ] Live math display updates with each inference
- [ ] Small sigmoid curve plot with moving marker

### Stretch (Decision Boundary Visualizer)

- [ ] Tab 2 accessible via tab bar
- [ ] 2D heatmap rendered on canvas (≥50×50 grid)
- [ ] Blue → white → magenta color scale
- [ ] Crosshair tracks current feature position
- [ ] Sliders control crosshair X/Y position
- [ ] Dropdown to select which two features map to axes
- [ ] Clicking the heatmap updates sliders and crosshair
- [ ] Heatmap renders in under 500ms

### Quality Bar

- [ ] First meaningful paint under 2 seconds (excluding model load)
- [ ] Drawing feels instant (no lag between pen movement and stroke rendering)
- [ ] Model inference does not block the UI thread
- [ ] No layout shifts during gameplay
- [ ] All text is readable at all breakpoints
- [ ] Touch targets ≥ 44×44px on mobile
- [ ] Graceful degradation if model fails to load

---

## Appendix A: Quick Reference for Claude Code

### Key Decisions Already Made

| Decision | Choice |
|----------|--------|
| Visual style | Hand-drawn/sketchy (pencil, paper, rough.js) |
| Core loop | Quick, Draw! clone — draw objects, AI guesses in real-time |
| ML model | Real CNN via TensorFlow.js (not heuristics) |
| Dataset | Google Quick, Draw! (345 categories) |
| Educational layer | Toggleable, off by default |
| Stretch feature | Decision Boundary Visualizer (heatmap + crosshair) |
| Tab structure | Tab 1 = Game, Tab 2 = Visualizer |
| Celebration style | Subtle — gentle glow/color shift, no confetti |
| Timer | 20 seconds per round, 6 rounds per session |
| Tech stack | React + Vite + TailwindCSS + TensorFlow.js + rough.js |

### Critical Implementation Notes

1. **The drawing canvas is the star** — it must be buttery smooth, no lag
2. **Model loading is async** — always have a loading state and fallback
3. **rough.js is for UI chrome, not the drawing canvas** — users draw with normal canvas strokes
4. **Educational mode is additive** — the game must work perfectly without it
5. **The heatmap is computationally expensive** — consider precomputing or using a Web Worker
6. **Touch events need special handling** — prevent scroll, handle multi-touch gracefully
7. **Keep the sketch aesthetic consistent** — every border, button, and label should feel hand-drawn
8. **Test with real drawings early** — the preprocessing pipeline (canvas → 28×28) is where most bugs hide

### Emoji Priority

Every object prompt should show an emoji. If a category doesn't have a perfect emoji, use `✏️` as a fallback. The emoji appears in the prompt ("Draw a 🐱 Cat!"), the guess bar, and the summary screen.

---

*End of specification. This document should provide everything needed to build Quick, Decide! from scratch.*
