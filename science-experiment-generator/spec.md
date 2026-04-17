# Science Experiment Generator — spec.md

## Project Overview

A single-file (`index.html`) AI-powered science experiment generator for K-12 students and educators. Users select a grade level and enter available supplies; the app calls the OpenAI API and returns a richly formatted, grade-appropriate experiment. Built as a polished, standalone webpage deployable to GitHub Pages.

---

## Reference Implementation

The `temp/` folder contains the complete LLM Switchboard project (HTML, CSS, and JS files). This is **NOT** part of the current project — do not include it in the final build or deployment.

Use it as a reference for:
- How to parse a `.env` file for API keys (in-memory only)
- The `fetch()` call structure for OpenAI's chat completions API
- Error handling patterns for failed API requests
- How the code is organized across separate files
- The general approach to building a single-page LLM tool

Ignore these Switchboard features (not needed here):
- Anthropic/Google integration — this project is **OpenAI-only**
- The model selection dropdown / provider switching
- Structured output mode and JSON schema handling

This project uses **unstructured (free-form) responses only**. Render the model's markdown output as properly formatted HTML using a markdown parser (e.g., `marked.js` from CDN).

---

## Key Design Constraints

| Constraint | Decision |
|---|---|
| LLM Provider | OpenAI only (CORS-compatible with browser requests) |
| Response Format | Unstructured free-form text, rendered as markdown → HTML |
| API Key Loading | `.env` file, in-memory only — never stored or persisted |
| Deployment Target | Single `index.html` file, GitHub Pages |
| Markdown Rendering | Use `marked.js` via CDN |

---

## Visual Aesthetic — Claymorphism + Lab

**Concept:** A bubbly, tactile science lab. The interface feels like a toy chemistry set — rounded, inflated UI elements with soft 3D depth (claymorphism shadows + subtle gradients), layered on a warm lab notebook paper texture. Scientific iconography (beakers, atoms, bubbles) appear as decorative accents. The whole app should feel friendly enough for a 3rd grader but polished enough for a teacher's dashboard.

### Typography
- **Display / Headers:** `Nunito` (Google Fonts) — rounded letterforms that complement the clay aesthetic
- **Body / Experiment Output:** `DM Sans` — clean and readable for long-form experiment text
- **Monospace accents (supply tags):** `JetBrains Mono` — gives a "lab notation" feel

### Color Palette (CSS Variables)
```css
--clay-bg: #f5efe6;           /* warm parchment / lab notebook */
--clay-surface: #ffffff;       /* card surface */
--clay-blue: #6cb4f5;          /* primary interactive — sky blue */
--clay-green: #7de8b0;         /* success / safe indicator */
--clay-yellow: #fde68a;        /* warning / caution */
--clay-red: #fca5a5;           /* danger / high school safety */
--clay-purple: #c4b5fd;        /* accent / difficulty badge */
--clay-shadow: rgba(0,0,0,0.12);
--clay-text: #1e1b2e;
--clay-muted: #6b7280;
```

### Claymorphism Style Rules
- `border-radius: 20px–32px` on all cards and inputs
- Box shadow: layered — `0 8px 0px <darker-tint>` (bottom "depth" shadow) + `0 4px 24px rgba(0,0,0,0.1)` (ambient)
- Inputs have an inner glow on focus: `box-shadow: inset 0 2px 6px rgba(0,0,0,0.06), 0 0 0 3px var(--clay-blue)`
- Buttons use a "press" animation: `transform: translateY(3px)` on `:active`, shadow collapses
- Background: subtle dot-grid or graph-paper SVG pattern in `--clay-bg` color, evoking a lab notebook

---

## UI Layout

```
┌─────────────────────────────────────────────┐
│  🧪  Science Experiment Generator            │
│       subtitle: "Science from what you have" │
├─────────────────────────────────────────────┤
│  [Grade Level Dropdown ▾]                    │
│                                              │
│  [Available Supplies textarea              ] │
│   e.g. "baking soda, vinegar, food coloring" │
│                                              │
│  [ ⚗️  Generate Experiment ]                 │
├─────────────────────────────────────────────┤
│  ← RESULT CARD (animated in on load) →      │
│                                              │
│  🧪 Experiment Title          ⏱ 20 min      │
│  ⭐ Difficulty: Intermediate   📋 [Copy]     │
│                                              │
│  ⚠️  Safety Warning (grade-appropriate)     │
│                                              │
│  [Rendered Markdown: Hypothesis, Materials,  │
│   Procedure, Expected Results, Extension]    │
│                                              │
│  💡 Supply Substitutions                    │
│  • Vinegar → Lemon juice                    │
│                                              │
│  [ 🖨️ Print / Save as PDF ]                 │
└─────────────────────────────────────────────┘
```

---

## Input Controls

### Grade Level Dropdown
```
K–2   (Early Elementary)
3–5   (Elementary)
6–8   (Middle School)
9–12  (High School)
```

### Available Supplies Textarea
- Placeholder: `"e.g. baking soda, vinegar, food coloring, balloons, water"`
- Min height: 100px, auto-grows with content
- Character hint below: `"Separate items with commas"`

### Generate Button
- Label: `⚗️ Generate Experiment`
- Shows a loading spinner + animated text while waiting (`"Mixing reagents…"`, `"Consulting the lab…"`)
- Disabled while request is in flight

---

## OpenAI API Integration

### Model
`gpt-4o-mini` — fast, cost-effective, sufficient for experiment generation

### System Prompt
```
You are a K-12 science education expert. Generate safe, engaging, 
hands-on science experiments appropriate for the given grade level 
using only the supplies listed. Format your response in markdown with 
these exact sections:

## [Experiment Title]
**Estimated Time:** X minutes  
**Difficulty:** Beginner / Intermediate / Advanced

### ⚠️ Safety Notes
[Grade-appropriate safety warnings]

### Hypothesis
### Materials Needed
### Procedure
### Expected Results
### The Science Behind It
### 💡 Supply Substitutions
[Suggest 2–3 substitutions for listed supplies if alternatives exist]
### Extension Challenge
[One optional harder challenge for advanced students]
```

### User Prompt Template
```
Grade Level: {selectedGrade}
Available Supplies: {suppliesInput}

Generate a science experiment using these supplies for this grade level.
```

### API Call Pattern (from Switchboard reference)
```javascript
const response = await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`
  },
  body: JSON.stringify({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt }
    ],
    max_tokens: 1200,
    temperature: 0.8
  })
});
```

---

## Bonus Features

### 1. Safety Warnings (Grade-Adaptive)
- The system prompt instructs the model to calibrate safety language by grade band
- K–2: simple reminders ("Ask a grown-up for help!")
- 3–5: basic lab safety ("Wear safety glasses if available")
- 6–8: standard precautions ("Keep away from open flames")
- 9–12: chemical safety language ("Handle with gloves; dispose properly")
- Safety section rendered in a visually distinct yellow/amber clay card

### 2. Estimated Time & Difficulty Rating
- Parsed from the model's markdown response (`**Estimated Time:**`, `**Difficulty:**`)
- Displayed as badge chips on the result card header
- Difficulty maps to colors: Beginner → `--clay-green`, Intermediate → `--clay-blue`, Advanced → `--clay-purple`

### 3. Supply Substitutions
- Rendered from the `💡 Supply Substitutions` section in the model response
- Displayed as a separate visually distinct block below the main experiment

### 4. Animate Result Card on Load
- Result card starts at `opacity: 0; transform: translateY(30px) scale(0.97)`
- On render: transitions to `opacity: 1; transform: translateY(0) scale(1)` over `0.5s ease-out`
- Each markdown section staggers in with `animation-delay` increments
- Triggered by adding a CSS class after the card is injected into the DOM

### 5. Copy to Clipboard Button
- `📋 Copy` button in the result card header
- Copies the raw markdown text (pre-render) to clipboard via `navigator.clipboard.writeText()`
- Button briefly changes to `✅ Copied!` with a green flash animation, then resets after 2s

### 6. Print / Save as PDF
- `🖨️ Print / Save as PDF` button at the bottom of the result card
- Calls `window.print()`
- A `@media print` CSS block hides all UI except the result card, applies clean white background and `font-size: 12pt`
- Print header auto-inserts: experiment title + grade level + date generated

---

## File Structure

```
science-experiment-generator/
├── index.html          ← entire app (HTML + CSS + JS inline)
├── .env                ← OPENAI_API_KEY=sk-... (gitignored)
├── .gitignore          ← includes .env
├── README.md
└── temp/               ← Switchboard reference code (not deployed)
    ├── index.html
    ├── style.css
    └── app.js
```

---

## `.gitignore`
```
.env
temp/
node_modules/
```

---

## CDN Dependencies (loaded in `<head>`)
```html
<!-- Markdown rendering -->
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<!-- Google Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800&family=DM+Sans:wght@400;500&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet">
```

---

## Error Handling

| Scenario | Behavior |
|---|---|
| Missing API key | Red clay alert card: "No API key found. Add `OPENAI_API_KEY` to your `.env` file." |
| Empty supplies input | Inline validation: input border turns red, shake animation, tooltip "Please enter at least one supply" |
| API error / non-200 | Error card with status code and message rendered in the result area |
| Network failure | Friendly message: "Couldn't reach the lab. Check your connection and try again." |

---

## Prompt to Claude Code

> Build the Science Experiment Generator as described in this `spec.md`. Reference the `temp/` folder for API key loading and `fetch()` patterns from the LLM Switchboard — do not include `temp/` in the final build.
>
> The app is a single `index.html` file. Use `marked.js` from CDN to render the model's markdown response as HTML. Apply the claymorphism + lab aesthetic as described: rounded inflated cards, layered clay shadows, `Nunito` headers, `DM Sans` body, warm parchment background with a subtle dot-grid pattern.
>
> Implement all six bonus features: PDF print styles, grade-adaptive safety warnings, supply substitutions block, time/difficulty badges, result card entry animation, and copy-to-clipboard button.
>
> OpenAI only. No provider switching. Free-form responses only. API key loaded from `.env` in-memory.
