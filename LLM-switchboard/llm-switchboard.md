# LLM Switchboard — spec.md

## Overview

A single-file (`index.html`) LLM Switchboard web app that lets users interact with large language models via their APIs. The interface feels like an Apple-ecosystem product: dark glassmorphism, tight spacing, fluid interactions, zero clutter. Every interaction should feel intentional and premium.

---

## Visual Design

### Aesthetic
- **Dark glassmorphism**: deep dark background (#0a0a0f or similar near-black), frosted glass panels with `backdrop-filter: blur(20px)`, subtle `rgba` white borders (1px, ~0.12 opacity), soft inner glow on active elements
- **Apple-inspired feel**: SF Pro-style typography (use system-ui), generous whitespace, smooth cubic-bezier transitions (300–400ms), no harsh edges
- **Color palette**: near-black base, blue accent (#0A84FF — Apple blue), muted white text, soft gray secondary text, green for success, red for errors
- **No gradients on backgrounds** — solid dark surfaces with glass overlays only
- **Micro-interactions**: hover states lift cards subtly (translateY -1px), active states compress, toggles animate smoothly

### Typography
- Font: `system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif`
- Headings: weight 500–600, tight letter-spacing
- Body: weight 400, 15–16px, line-height 1.6
- Code/JSON: `'SF Mono', 'Fira Code', monospace`

---

## Layout

### Structure: Left Sidebar + Main Content

```
┌─────────────────────────────────────────────────────┐
│  [Logo / Title]                                      │
├──────────────┬──────────────────────────────────────┤
│              │                                       │
│   SIDEBAR    │         MAIN WORKSPACE                │
│   (280px)    │         (flex-grow)                   │
│              │                                       │
│  Provider    │  [Prompt Input Area]                  │
│  Model       │  [Mode Toggle]                        │
│  API Keys    │  [Schema Editor — if structured]      │
│  ─────────   │  [Send Button]                        │
│  Example     │  ─────────────────────────────────    │
│  Prompts     │  [Response Panel / Compare View]      │
│              │  [Metrics Bar]                         │
│  ─────────   │                                       │
│  Prompt      │                                       │
│  Library     │                                       │
│              │                                       │
└──────────────┴──────────────────────────────────────┘
```

- Sidebar: fixed width 280px, full height, scrollable, glass panel
- Main workspace: fills remaining width, vertically scrollable
- Sidebar collapses to icon rail on narrow viewports (≤768px)

---

## API Key Handling

- **Input methods**: manual text field entry OR paste raw key directly into the same field
- Both OpenAI and Anthropic have their own key input fields in the sidebar
- Keys are stored in JavaScript memory only — never in `localStorage`, `sessionStorage`, cookies, or anywhere persistent
- Each key field shows a masked input (`type="password"`) with a show/hide toggle (eye icon)
- Small lock icon + label: *"Key stored in memory only. Never saved."* displayed beneath each field
- "Clear Keys" button wipes all keys from memory instantly

---

## Provider & Model Selection

### Providers
- **OpenAI** (fully functional)
- **Anthropic** (CORS-restricted — see CORS handling section)

### OpenAI Models (hardcoded list)
- gpt-4o
- gpt-4o-mini
- gpt-4-turbo
- gpt-3.5-turbo

### Anthropic Models (hardcoded list)
- claude-opus-4-5
- claude-sonnet-4-5
- claude-haiku-4-5

### Selection UI
- Provider: segmented pill control (OpenAI | Anthropic) at top of sidebar
- Model: dropdown/select below provider selector
- Selecting Anthropic triggers CORS modal (see below)

---

## Output Modes

### Toggle
- A single pill toggle in the main workspace header: **Unstructured ↔ Structured**
- Smooth animated slide transition between states
- When switching, the schema editor panel animates in/out (slide + fade, ~300ms)

### Unstructured Mode
- Free-form prompt input (textarea, auto-expanding, min 4 rows)
- Response displayed as plain text in scrollable fixed-height box (400px, overflow-y: scroll)
- Syntax highlighting for any code blocks in the response (use highlight.js from CDN)

### Structured Mode
- Same prompt input
- **JSON Schema Editor** appears below prompt — a resizable `<textarea>` with monospace font, pre-populated with the active schema template
- Response displayed as formatted JSON with syntax highlighting
- **Schema Validator** runs automatically after each response (see stretch features)

---

## Example Prompts & Schema Templates

### Example Prompts (pre-loaded, selectable from sidebar)

**Engineering / Science themed:**
1. "Explain how a PID controller works and give a real-world application example."
2. "Describe the difference between static and kinetic friction with a practical engineering scenario."
3. "What are the key tradeoffs between SQL and NoSQL databases for a high-throughput application?"
4. "Explain Kirchhoff's current and voltage laws with an example circuit."

**General / Variety:**
5. "You are a Socratic tutor. Ask me a question that challenges my assumptions about how I learn."
6. "Summarize the current state of large language model research in exactly 3 bullet points."
7. "Write a haiku about debugging code at 2am."
8. "Give me a counterintuitive fact from any field of science."

### Schema Templates (structured mode, selectable from sidebar)

**Element profile:**
```json
{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "symbol": { "type": "string" },
    "atomic_number": { "type": "integer" },
    "fun_fact": { "type": "string" }
  },
  "required": ["name", "symbol", "atomic_number", "fun_fact"]
}
```

**Engineering concept:**
```json
{
  "type": "object",
  "properties": {
    "concept": { "type": "string" },
    "definition": { "type": "string" },
    "formula": { "type": "string" },
    "example_application": { "type": "string" },
    "difficulty": { "type": "string", "enum": ["beginner", "intermediate", "advanced"] }
  },
  "required": ["concept", "definition", "example_application", "difficulty"]
}
```

**Research summary:**
```json
{
  "type": "object",
  "properties": {
    "topic": { "type": "string" },
    "key_findings": { "type": "array", "items": { "type": "string" } },
    "confidence": { "type": "string", "enum": ["low", "medium", "high"] },
    "sources_needed": { "type": "boolean" }
  },
  "required": ["topic", "key_findings", "confidence"]
}
```

Users can also edit any schema template directly in the editor and save it to the Prompt Library.

---

## CORS Handling (Anthropic)

When the user selects Anthropic as provider:
1. A **friendly modal** slides in (centered, glass panel, blurred backdrop)
2. Modal content:
   - **Title**: "Why Anthropic works differently"
   - **Explanation**: Browsers can only call APIs that explicitly permit cross-origin requests (CORS). OpenAI allows this. Anthropic's API is designed to be called from a backend server, not a browser — so your browser blocks the request before it even reaches Anthropic's servers.
   - **Visual**: simple two-column diagram — "Browser → OpenAI ✓" vs "Browser → Anthropic ✗ (CORS blocked)" vs "Browser → Your Server → Anthropic ✓"
   - **What this means**: "You can still select Anthropic models and compose prompts — but sending will return a CORS explanation instead of a model response. This is intentional — it's a real engineering constraint, not a bug."
   - **Close button**: "Got it"
3. After dismissal, the Anthropic panel remains selectable but the Send button is labeled "Send (CORS Demo)" — clicking it returns a formatted CORS explanation message in the response panel rather than an API error

---

## Stretch Features

### 1. Side-by-Side Model Comparison
- A **"Compare"** button in the workspace header activates split view
- In compare mode, two model selector dropdowns appear (Model A | Model B)
- The prompt is sent to both models simultaneously (parallel `fetch` calls)
- Responses render side by side in equal-width panels
- Each panel has its own metrics bar (see below)
- A subtle **"Diff"** highlight on text differences between responses (optional, best-effort)

### 2. Response Metrics Bar
- Displayed below each response panel as a slim row
- Metrics shown:
  - **Response time**: `Xms` (measured from send to first response token, or full response for non-streaming)
  - **Token count**: `~X tokens` (from API response `usage` field if available; estimated from character count as fallback)
  - **Response length**: `X characters / Y words`
- Metrics animate in after response completes (count-up effect)
- In compare mode, faster response panel gets a subtle green "faster" badge

### 3. In-Memory Prompt Library
- A collapsible **"Library"** section at the bottom of the sidebar
- Users can save the current prompt + schema + provider/model config as a named entry
- Each saved entry shows: name, truncated prompt preview, provider badge
- Clicking a saved entry loads it into the workspace (prompt, schema, mode, provider)
- Delete button (×) per entry
- All data is in-memory — cleared on page refresh; a small notice confirms this
- Max 20 saved prompts (soft cap with user-facing message)

### 4. JSON Schema Validator
- Runs automatically after every structured mode response
- Parses the response JSON and validates it against the active schema
- Displays a **"Schema Report"** below the response panel:
  - ✓ Green checkmark per field that matched expected type
  - ✗ Red × per required field that was missing
  - ⚠ Yellow warning per field with unexpected type
  - Summary line: *"5/6 fields valid — 1 missing: `formula`"*
- If response is not valid JSON at all, shows: *"Response is not valid JSON"* with the raw text

---

## Error States

| Scenario | Behavior |
|---|---|
| No API key entered | Send button disabled; tooltip "Enter your API key in the sidebar" |
| Invalid API key | Response panel shows: "Authentication failed — check your API key" |
| Rate limit hit | Response panel shows: "Rate limit reached — wait a moment and try again" |
| Network timeout (>15s) | Shows: "Request timed out — the model may be overloaded" |
| Invalid JSON schema | Schema editor outline turns red; tooltip "Invalid JSON — fix before sending" |
| Empty prompt | Send button disabled |

All error messages use the same glass-panel style as responses — no raw browser alerts.

---

## Send Button Behavior
- Disabled when: no API key, empty prompt, or invalid schema (in structured mode)
- Active state: Apple-blue fill, white text, "Send" label
- Loading state: spinning indicator replaces text, button disabled
- Complete state: brief green flash, then resets to active

---

## File Structure

```
index.html   ← entire app, single file
```

All CSS, JavaScript, and HTML in one file. External CDN dependencies only:
- `highlight.js` (syntax highlighting for JSON and code in responses)

---

## Technical Notes

- All API calls via `fetch()` with `async/await`
- OpenAI endpoint: `https://api.openai.com/v1/chat/completions`
- Anthropic endpoint: `https://api.anthropic.com/v1/messages` (CORS-blocked from browser — handled gracefully)
- Structured mode: append schema instructions to system prompt, e.g. *"Respond only with valid JSON matching this schema: {schema}"*
- Response timing: `performance.now()` before and after fetch
- Token count: use `response.usage.completion_tokens` from OpenAI; estimate from Anthropic (not available via CORS anyway)
- No build tools, no npm, no bundler — plain HTML/CSS/JS

---

## Deployment

- Deploy as GitHub Pages from the repo root
- Single `index.html` at root — no build step needed
- Submit live GitHub Pages URL to Canvas
