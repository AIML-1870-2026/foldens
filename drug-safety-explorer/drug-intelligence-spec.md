# RxLens — Drug Intelligence Dashboard
### Spec v1.0 | React + Vite | Inspired by Drug Safety Explorer (frontiersof.tech)

---

## 1. Project Overview

**RxLens** is a polypharmacy intelligence dashboard that goes beyond side-by-side comparison. Where Drug Safety Explorer answers "how do two drugs compare?", RxLens answers: **"What is the full risk picture of my medication stack?"**

The central metaphor is a **drug constellation** — users build a personal med list (up to 6 drugs), and the app renders a live interaction network graph showing every drug-drug relationship, AI-synthesized risk scoring, adverse event timelines, and recall intelligence, all in one unified view.

**Target user:** Anyone on multiple medications — elderly patients, caregivers, clinicians doing quick lookups, or curious people who just want to understand what they're taking.

---

## 2. Aesthetic Direction

**Theme: Clinical Dark — "The Lab at Night"**

- Dark background (`#0a0d12`) with cool slate midtones
- Accent: electric teal (`#00e5c8`) + warm amber (`#f59e0b`) for risk severity
- Typography: `DM Mono` for data/numbers (monospaced clinical feel), `Instrument Serif` for headers (elegant contrast)
- Atmosphere: subtle grid texture overlay, glowing node halos on the graph, frosted-glass cards
- Motion: nodes animate in on mount, edges pulse when a pair has high co-admin reports, AI summary streams in letter by letter
- **The one unforgettable thing:** The drug constellation graph — floating glowing nodes connected by color-coded risk edges, like a star map of your medications

---

## 3. Core Features

### 3.1 Drug Stack Builder
- Prominent central search with OpenFDA autocomplete (same `drug/label.json` endpoint as the original)
- Add up to **6 drugs** to your stack (chips with remove buttons)
- Preset "common stacks" dropdown: e.g., "Elderly Cardiac Patient", "SSRI + OTC Combo", "Diabetes Stack"
- Keyboard-first UX: type → arrow keys → Enter to add

### 3.2 Constellation Graph (D3 Force-Directed)
- Each drug = a glowing circular node, labeled with brand name
- Each drug pair = an edge colored by risk level:
  - 🟢 Green — no known interactions found
  - 🟡 Amber — possible interaction (FDA label mentions)
  - 🔴 Red — known significant interaction + co-admin adverse reports
- Edge thickness = proportional to co-administration report count (FAERS)
- Click an edge → opens an interaction detail panel
- Click a node → highlights all edges connected to that drug
- Nodes repel each other with D3 physics; drag to rearrange

### 3.3 AI Risk Summary (Claude API)
- After stack is built, a **"Analyze My Stack"** button triggers a Claude API call
- Sends: drug names + extracted FDA interaction text + top adverse events
- Claude returns a structured JSON:
  ```json
  {
    "overallRiskLevel": "moderate",
    "topConcerns": [...],
    "stackSummary": "Plain English paragraph",
    "recommendations": [...]
  }
  ```
- UI renders:
  - A **Risk Meter** (0–100 composite score, styled like a gauge)
  - Streaming plain-English summary that types in character by character
  - Color-coded concern cards sorted by severity
- Disclaimer: "Educational only. Always consult a healthcare professional."

### 3.4 Adverse Events Panel
- Tabbed per drug OR unified "stack view"
- **Stack view:** Aggregates top adverse events across all drugs in the stack, highlights terms that appear for 3+ drugs (flagged as "cross-drug pattern")
- Bar charts (Recharts) for top 10 FAERS reactions per drug
- Toggle: absolute counts vs. normalized view (per 10,000 reports, estimated)
- Co-administration heatmap: N×N grid showing co-admin report counts for every drug pair in the stack

### 3.5 Recall Intelligence Timeline
- Scrollable vertical timeline (newest → oldest) for all drugs in stack combined
- Color-coded by recall class:
  - Class I → Red badge ("Serious")
  - Class II → Amber badge ("Moderate")
  - Class III → Gray badge ("Minor")
- Filter by drug, class, date range
- Status chips: Ongoing (pulsing dot) vs. Terminated
- Each card expands to show reason for recall

### 3.6 Interaction Deep-Dive Drawer
- Clicking an edge or a drug pair card opens a right-side drawer
- Contents:
  - Full FDA label interaction text (both directions)
  - CYP450 enzyme overlap table (parsed from label text)
  - FAERS co-admin report count + top 5 reactions in co-admin reports
  - Mechanism tags: Pharmacokinetic / Pharmacodynamic / Additive Risk
  - AI one-liner: "In plain English: these two drugs both thin the blood — taking them together significantly raises bleeding risk."

---

## 4. Data Sources

| Source | Endpoint | Used For |
|--------|----------|----------|
| OpenFDA Drug Label | `api.fda.gov/drug/label.json` | Interaction warnings, CYP450 info, warnings/contraindications |
| OpenFDA FAERS | `api.fda.gov/drug/event.json` | Adverse event counts, co-administration reports |
| OpenFDA Enforcement | `api.fda.gov/drug/enforcement.json` | Recall history + classification |
| Anthropic Claude API | `/v1/messages` | AI risk synthesis, plain-English summaries |
| RxNorm API (NIH) *(stretch)* | `rxnav.nlm.nih.gov/REST/interaction` | Verified drug-drug interaction data from NIH |
| DailyMed *(stretch)* | `dailymed.nlm.nih.gov/dailymed/` | Richer label data, structured tables |

> **Note on RxNorm:** The NIH RxNorm Interaction API (`rxnav.nlm.nih.gov/REST/interaction/list.json?rxcuis=...`) returns structured interaction data with severity levels and sources (DrugBank, ONCHigh, etc.). This is higher-signal than raw FDA label text parsing and should be the **primary interaction source**, with FDA labels as supplemental detail.

---

## 5. Architecture

```
rxlens/
├── public/
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── components/
│   │   ├── DrugStackBuilder/
│   │   │   ├── DrugSearch.jsx        ← autocomplete + chip builder
│   │   │   └── PresetStacks.jsx
│   │   ├── ConstellationGraph/
│   │   │   ├── Graph.jsx             ← D3 force layout
│   │   │   ├── GraphNode.jsx
│   │   │   └── GraphEdge.jsx
│   │   ├── RiskSummary/
│   │   │   ├── RiskMeter.jsx         ← gauge chart
│   │   │   ├── StreamingSummary.jsx  ← character-by-character typing
│   │   │   └── ConcernCards.jsx
│   │   ├── AdverseEvents/
│   │   │   ├── EventsPanel.jsx
│   │   │   ├── CoAdminHeatmap.jsx
│   │   │   └── EventsChart.jsx       ← Recharts bar chart
│   │   ├── RecallTimeline/
│   │   │   └── Timeline.jsx
│   │   └── InteractionDrawer/
│   │       └── Drawer.jsx
│   ├── hooks/
│   │   ├── useOpenFDA.js             ← label, events, enforcement fetchers
│   │   ├── useRxNorm.js              ← interaction data
│   │   └── useClaudeAnalysis.js      ← AI summary hook
│   ├── utils/
│   │   ├── riskScoring.js            ← composite score logic
│   │   └── drugParser.js             ← CYP450 extraction from label text
│   └── styles/
│       └── theme.css                 ← CSS variables
├── index.html
├── vite.config.js
└── package.json
```

**Key deps:**
```json
{
  "react": "^18",
  "vite": "^5",
  "d3": "^7",
  "recharts": "^2",
  "@anthropic-ai/sdk": "latest",
  "framer-motion": "^11"
}
```

---

## 6. Risk Scoring Logic

Composite score (0–100) per drug pair, summed across stack:

| Signal | Weight | Source |
|--------|--------|--------|
| RxNorm interaction severity (high/moderate/low) | 40% | RxNorm API |
| FDA label mentions other drug by name | 20% | OpenFDA label |
| Co-admin FAERS report count (log scale) | 20% | OpenFDA events |
| Recall Class I in last 2 years | 10% | OpenFDA enforcement |
| CYP450 enzyme overlap (same inhibitor/inducer) | 10% | Parsed label text |

Stack-level score = average of all pair scores, weighted by severity max.

---

## 7. UI Flow

```
Landing
  └── Drug Stack Builder (hero section)
        ├── Type to search → autocomplete → add chip
        ├── Or choose preset stack
        └── [Analyze Stack] button (enabled at 2+ drugs)
              ↓
        Dashboard (3-column layout on desktop)
        ├── LEFT: Constellation Graph (tall, fills column)
        ├── CENTER: AI Risk Summary → Concern Cards
        └── RIGHT: Tab strip → Adverse Events | Recalls
              ↓ (click graph edge or concern card)
        Interaction Drawer slides in from right
```

---

## 8. Stretch Goals

- **Share link** — serialize stack to URL params, shareable comparison link
- **PDF Export** — generate a summary PDF via browser print CSS
- **Dosage context** — let user input dose + frequency, adjust risk weighting
- **Drug class grouping** — auto-tag each drug (SSRI, NSAID, anticoagulant, etc.) and warn when two drugs in the same class are added
- **Mobile layout** — stack collapses to accordion sections, graph becomes simplified list view
- **Dark/light toggle** — with smooth CSS variable transition

---

## 9. API Calls Reference

### OpenFDA Label (interaction text)
```
GET https://api.fda.gov/drug/label.json
  ?search=openfda.generic_name:"WARFARIN SODIUM"
  &limit=1
```
Fields used: `drug_interactions`, `warnings`, `contraindications`, `openfda.brand_name`, `openfda.generic_name`

### OpenFDA FAERS (adverse events)
```
GET https://api.fda.gov/drug/event.json
  ?search=patient.drug.openfda.generic_name:"WARFARIN SODIUM"
  &count=patient.reaction.reactionmeddrapt.exact
  &limit=10
```

### OpenFDA FAERS (co-administration)
```
GET https://api.fda.gov/drug/event.json
  ?search=patient.drug.openfda.generic_name:"WARFARIN SODIUM"
    +AND+patient.drug.openfda.generic_name:"IBUPROFEN"
  &limit=5
```

### OpenFDA Enforcement (recalls)
```
GET https://api.fda.gov/drug/enforcement.json
  ?search=openfda.brand_name:"Coumadin"
    +openfda.generic_name:"WARFARIN SODIUM"
  &limit=5
```

### RxNorm Interaction (NIH)
```
GET https://rxnav.nlm.nih.gov/REST/interaction/list.json
  ?rxcuis=11289+5640
```
→ Returns severity, description, source (DrugBank, ONCHigh, etc.)
→ Need to first resolve drug names to RxCUI: `rxnav.nlm.nih.gov/REST/rxcui.json?name=warfarin`

### Claude API (AI Summary)
```js
POST https://api.anthropic.com/v1/messages
{
  model: "claude-sonnet-4-20250514",
  max_tokens: 1000,
  system: "You are a clinical pharmacology assistant...",
  messages: [{
    role: "user",
    content: `Analyze this medication stack: [drug list + FDA interaction text + adverse events].
    Respond ONLY in JSON with shape: { overallRiskLevel, topConcerns, stackSummary, recommendations }`
  }]
}
```

---

## 10. Design Notes for Claude Code

- Use `framer-motion` for all panel transitions, drawer slides, and node entrance animations
- D3 graph should be rendered into an SVG via `useEffect` + `useRef`, not JSX — D3 owns the DOM inside the SVG element
- Recharts `BarChart` with `layout="vertical"` for adverse events (same as original)
- The Risk Meter can be a custom SVG arc — no charting library needed
- Streaming text effect: use `setInterval` to append characters from the AI response string
- CSS variables in `theme.css`, consumed everywhere — no hardcoded colors
- All OpenFDA calls should be parallelized with `Promise.all` for the full stack
- RxNorm requires a 2-step fetch: name → RxCUI, then RxCUI list → interactions
- Rate limit awareness: OpenFDA is ~240 req/min without API key; batch carefully for 6-drug stacks (15 pairs = 15 co-admin queries — consider debouncing or a queue)
- Educational disclaimer banner pinned at top — non-dismissible
