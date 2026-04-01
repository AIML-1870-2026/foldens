# NEO Dashboard — spec.md
## Project Overview

A single-page asteroid tracking dashboard deployed as one `index.html` file to GitHub Pages. Pulls live data from three NASA/JPL APIs. Four tabs. Cinematic dark aesthetic. Optional 3D globe stretch goal included.

**Live URL target:** `https://aiml-1870-2026.github.io/<your-gamertag>/`

---

## Tech Stack

- **Vanilla HTML/CSS/JS** — single `index.html`, no build step, no bundler
- **Chart.js** (CDN) — timeline and data visualizations
- **globe.gl** (CDN) — 3D Earth globe stretch goal
- **Google Fonts** — display: `Orbitron` (headers), body: `Rajdhani` (data-heavy readability)
- **No frameworks** — pure DOM manipulation for simplicity and portability

---

## APIs

### 1. NeoWs — NASA Asteroids API
- **Base URL:** `https://api.nasa.gov/neo/rest/v1/feed`
- **Key required:** Yes — user must insert their own free key from `api.nasa.gov` as a `const API_KEY` at the top of the file
- **Usage:** Fetch current week's asteroid close approaches (`start_date` = today, `end_date` = today + 7 days)
- **Used in:** Tab 1 (Flybys), Tab 4 (Scale Explorer), Globe

### 2. SBDB Close-Approach API — JPL
- **Base URL:** `https://ssd-api.jpl.nasa.gov/cad.api`
- **Key required:** No
- **Params used:** `dist-max=0.2` (AU), `date-min=1900-01-01`, `date-max=2100-01-01`, `sort=date`, `limit=500`
- **Used in:** Tab 3 (Archive)

### 3. Sentry — JPL Impact Risk API
- **Base URL:** `https://ssd-api.jpl.nasa.gov/sentry.api`
- **Key required:** No
- **Params used:** default (returns all ~1,900 monitored objects), `ps-min=-10` for Palermo Scale filtering
- **Used in:** Tab 2 (Threat Watchlist)

### 4. NASA Image and Video Library
- **Base URL:** `https://images-api.nasa.gov/search`
- **Key required:** No
- **Usage:** Search by asteroid designation/name (e.g. `q=2024+YR4`), pick first result's thumbnail
- **Fallback:** If no image found, use a procedurally generated CSS asteroid silhouette (dark gray blob shape unique per object, seeded by asteroid ID)
- **Used in:** Tab 1 cards, Tab 4 cards

---

## Global Layout & Aesthetic

### Color Palette (CSS variables)
```css
--bg:          #03050a      /* near-black space void */
--surface:     #0a0e1a      /* card/panel background */
--surface-2:   #111827      /* elevated surface */
--border:      #1e2d45      /* subtle panel borders */
--accent:      #00d4ff      /* cold cyan — primary accent */
--accent-2:    #ff4444      /* danger red — hazardous objects */
--accent-3:    #f59e0b      /* amber — warning tier */
--text:        #e2e8f0      /* primary text */
--text-muted:  #64748b      /* secondary/label text */
--glow-cyan:   0 0 20px rgba(0, 212, 255, 0.4)
--glow-red:    0 0 20px rgba(255, 68, 68, 0.4)
```

### Typography
- **Headers / tab names / asteroid designations:** `Orbitron` (Google Fonts), weight 700
- **Body / data values / labels:** `Rajdhani` (Google Fonts), weight 400/600
- **Monospace numbers (countdowns, distances):** `Courier New` or `monospace` stack

### Background
- Pure `--bg` black with a subtle animated **star field canvas** — 200 dots, slow parallax drift on mouse move (JS, lightweight)
- Horizontal scan-line overlay via CSS `repeating-linear-gradient` at 4% opacity for CRT texture

### Header (fixed top bar)
- Logo: `⬡ NEO WATCH` in Orbitron, cyan
- Subtitle: `Near-Earth Object Surveillance Dashboard` in Rajdhani, muted
- Live clock (UTC) updating every second top-right
- Thin cyan bottom border with glow

### Tab Bar
- Four tabs: **FLYBYS / THREAT WATCHLIST / ARCHIVE / SCALE EXPLORER**
- Active tab: cyan underline + glow, text bright white
- Inactive: muted text, no underline
- Tab switching is instant (CSS `display: none/block`), no animation needed

### Loading States
- Each tab shows a centered pulsing cyan ring spinner while fetching
- Spinner label: `ACQUIRING DATA...` in Orbitron

### Error States
- If an API call fails: red bordered card reading `SIGNAL LOST — [API name] unreachable. Check console.`

---

## Tab 1 — FLYBYS
**API:** NeoWs  
**Purpose:** This week's asteroid close approaches, visualized as a mission briefing

### Layout
- **Hero stat bar** at top (3 large numbers side by side):
  - Total asteroids this week
  - Closest approach (AU, colored red if < 0.05 AU)
  - Fastest object (km/s)

- **Asteroid cards grid** (2-col desktop, 1-col mobile):
  - Each card contains:
    - NASA Image Library photo (thumbnail, cover-fit, dark overlay gradient on bottom half)
    - Fallback: procedural CSS blob if no image found
    - Asteroid designation + name in Orbitron
    - **"⚠ POTENTIALLY HAZARDOUS"** red badge if `is_potentially_hazardous_asteroid: true`
    - Close approach date
    - Miss distance in lunar distances (LD) and km — LD highlighted, < 5 LD shown in red
    - Diameter range (min–max meters)
    - Relative velocity (km/s)
    - Small cyan `VIEW DETAIL` button — expands card inline to show all raw fields

- Cards sorted by closest miss distance ascending (scariest first)
- Cards with `is_potentially_hazardous_asteroid: true` get a red glow border

### Interactions
- Click `VIEW DETAIL` → card expands with full data (all NeoWs fields for that object)
- Hover on card → subtle scale(1.02) lift with border glow brightening

---

## Tab 2 — THREAT WATCHLIST
**API:** Sentry  
**Purpose:** Dramatized impact risk list — the "things that could actually hit us" tab

### Layout
- **Top warning banner:** `${n} OBJECTS CURRENTLY TRACKED WITH NON-ZERO IMPACT PROBABILITY` in red, full-width

- **Sortable data table** with columns:
  - Designation
  - **Countdown** — live ticking `DD:HH:MM:SS` timer to next close approach date (Sentry provides `date` field) — rendered in monospace, cyan
  - Impact Probability (%) — shown large, colored: green < 0.001%, amber 0.001–0.1%, red > 0.1%
  - Potential Energy (Mt TNT) — Sentry provides `energy` field
  - Diameter (km)
  - Palermo Scale score — shown as a horizontal bar, labeled "BACKGROUND RISK LEVEL"
  - Torino Scale value — shown as a colored badge (0 = gray, 1–3 = yellow, 4–7 = orange, 8–10 = red)
  - Year range of potential impacts

- Default sort: highest impact probability descending
- Click any column header to re-sort
- Search bar to filter by designation

### Interactions
- Clicking a row expands it inline to show full Sentry data for that object
- Countdown timers update every second via `setInterval`
- "SORT BY: PROBABILITY / ENERGY / DATE" toggle buttons above table

---

## Tab 3 — ARCHIVE
**API:** SBDB Close-Approach  
**Purpose:** Historical + future close approach timeline, explorable and filterable

### Layout
- **Filter bar** (row of controls):
  - Date range: two `<input type="date">` fields (default: 1900-01-01 to 2100-01-01)
  - Max miss distance: slider (0.01 AU to 0.5 AU)
  - Min diameter: dropdown (any / >10m / >100m / >1km)
  - Apply button → re-fetches with new params

- **Chart.js scatter plot** (full-width, ~300px tall):
  - X axis: date
  - Y axis: miss distance in lunar distances
  - Dots colored by size: small = gray, medium = amber, large = red
  - Moon reference line at 1 LD (horizontal dashed cyan line, labeled "🌙 MOON")
  - Hover tooltip shows designation, date, miss distance, diameter

- **Scrollable data table** below chart:
  - Columns: Designation, Date, Miss Distance (LD), Relative Velocity (km/s), Diameter (m)
  - Clicking a row highlights the corresponding dot on the chart

### Notes
- SBDB returns up to 500 results by default — implement pagination or "load more" if needed
- Past approaches shown with 50% opacity dots; future approaches full opacity

---

## Tab 4 — SCALE EXPLORER
**API:** NeoWs (this week's data reused) + NASA Image Library  
**Purpose:** Make asteroid sizes tangible through interactive comparison

### Layout
- **Asteroid selector** — horizontal scrollable row of asteroid name pills at top. Click one to load its comparison view below.

- **Main comparison panel** for selected asteroid:
  - Left side: NASA Image Library photo (or fallback blob) with asteroid name + diameter range
  - Right side: **Interactive drag slider** comparison

- **Drag slider mechanic:**
  - SVG canvas showing two silhouettes side by side: the asteroid (circle scaled to diameter) vs a landmark
  - Landmark selector: `FOOTBALL FIELD` / `EIFFEL TOWER` / `EMPIRE STATE BLDG` / `MT. EVEREST` / `CITY BLOCK`
  - All landmark heights/widths are hardcoded constants (these are reference data, not from an API)
  - Drag a vertical divider left/right to reveal more of one vs the other (classic image-comparison slider)
  - Label below: `This asteroid is [X]x the size of [landmark]` OR `[landmark] is [X]x larger than this asteroid`

- **Speed comparison panel** below slider:
  - Asteroid's relative velocity displayed as:
    - `[X]× speed of sound`
    - `[X]× speed of a bullet`
    - `[X]× speed of a commercial jet`
    - Animated horizontal bar racing across the panel to show relative speed visually

### Landmark Constants (hardcoded reference data — not from API)
```js
const LANDMARKS = {
  "Football Field":   { size: 91,    unit: "m", axis: "length" },
  "Eiffel Tower":     { size: 330,   unit: "m", axis: "height" },
  "Empire State":     { size: 443,   unit: "m", axis: "height" },
  "Mt. Everest":      { size: 8849,  unit: "m", axis: "height" },
  "City Block":       { size: 80,    unit: "m", axis: "length" },
};
const SPEED_REFS = {
  "Speed of Sound":   0.343,   // km/s
  "Rifle Bullet":     0.9,     // km/s
  "Commercial Jet":   0.25,    // km/s
};
```

---

## Stretch Goal — 3D GLOBE
**Library:** `globe.gl` (CDN)  
**Trigger:** Rendered inside a persistent panel that slides up from the bottom of the page when the user clicks a `🌐 LAUNCH GLOBE` floating action button (bottom-right corner, always visible)

### Globe Setup
- Black background, NASA Blue Marble texture on Earth (`//unpkg.com/three-globe/example/img/earth-blue-marble.jpg`)
- Auto-rotate slowly when idle; user can drag to orbit, scroll to zoom
- Moon reference ring: a static white dashed ring at radius = 1 LD (384,400 km scaled to globe units), labeled "🌙 1 LD"

### Data Layers (both active simultaneously)
1. **Orbital rings** — for each this-week flyby asteroid, draw a horizontal ring at its miss distance (scaled). Ring color: cyan for safe, amber for < 5 LD, red for potentially hazardous. Rings pulse opacity 0.4–1.0 on a slow sine wave.

2. **Trajectory arcs** — glowing curved arcs representing incoming paths. Each arc originates from a point on the outer sphere edge (random longitude, low inclination) and terminates at Earth's surface. Color matches the ring. Arc animated: particle dot travels along the arc every 3 seconds.

### Interaction
- Hover over a ring or arc → tooltip with asteroid name, miss distance in LD, velocity
- Click → focuses camera on that object, shows full detail card overlay on globe

### Close button
- `✕ CLOSE GLOBE` button top-right of globe panel to slide it back down

---

## File Structure

```
index.html          ← entire app, single file
```

All CSS in a `<style>` block in `<head>`.  
All JS in a `<script>` block before `</body>`.  
External dependencies via CDN only:
```html
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700&family=Rajdhani:wght@400;600&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="//unpkg.com/globe.gl"></script>
```

---

## API Key Handling

At the very top of the `<script>` block:
```js
const NASA_API_KEY = 'DEMO_KEY'; // Replace with your key from api.nasa.gov
```
`DEMO_KEY` works for low-traffic testing. User should replace before submission.

---

## Responsive Behavior

- Desktop (>768px): 2-column card grids, full-width charts, side-by-side scale comparisons
- Mobile (<768px): single column, scrollable tables with horizontal scroll, globe panel full-screen
- Tab bar: wraps to 2×2 grid on very small screens

---

## Performance Notes

- All API calls fire in parallel on page load (`Promise.all`) to minimize wait time
- NASA Image Library calls fire lazily (only when a card is in the viewport) using `IntersectionObserver`
- Globe renders only when opened (not on page load)
- SBDB returns max 500 records — no pagination needed for this scope

---

## Deliverable Checklist

- [ ] Single `index.html` file
- [ ] `NASA_API_KEY` const at top, set to `DEMO_KEY` by default
- [ ] All 4 tabs functional with live API data
- [ ] Loading and error states on all tabs
- [ ] Responsive on mobile
- [ ] Globe launches and renders on button click
- [ ] Deployed to `https://aiml-1870-2026.github.io/<gamertag>/`
- [ ] URL submitted to Canvas
