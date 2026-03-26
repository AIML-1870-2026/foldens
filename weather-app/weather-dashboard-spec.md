# Weather Dashboard — Project Specification

## Overview

A premium weather dashboard web app featuring frosted-glass UI cards floating over a full-screen, layered parallax weather scene that dynamically reflects current conditions. The app pulls real-time data from OpenWeatherMap APIs and includes a 5-day forecast, air quality index, interactive weather map, and a custom **Snow Day Calculator**.

**Design language:** Clean, minimal glassmorphism — translucent frosted cards with subtle borders, soft shadows, and smooth micro-animations. The entire background is a living, animated weather scene (rain, snow, sun, clouds, lightning) that responds to the fetched weather data.

---

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | React + Vite | Multi-file project; complexity warrants proper module structure |
| Styling | CSS Modules or Tailwind CSS | Scoped styles, utility-first for glassmorphism tokens |
| Charts | Recharts | Clean aesthetic, composable, pairs well with glassmorphism |
| Maps | Leaflet + React-Leaflet | Free, open-source, supports OpenWeatherMap tile overlays |
| Animations | CSS + Canvas (parallax scene) | Canvas for particle weather; CSS for UI transitions |
| State | React Context or Zustand | Lightweight; shares weather data across all panels |
| HTTP | fetch (native) | No need for Axios; simple GET requests |

**Claude Code:** Decide between CSS Modules or Tailwind based on what produces the cleanest glassmorphism implementation. If Tailwind, use `@apply` for reusable glass card classes.

---

## API Endpoints (OpenWeatherMap)

All endpoints use the same API key, passed as `&appid={API_KEY}`.

| Endpoint | URL | Purpose |
|----------|-----|---------|
| Current Weather | `api.openweathermap.org/data/2.5/weather?q={city}&units={units}&appid={key}` | Main weather card |
| 5-Day Forecast | `api.openweathermap.org/data/2.5/forecast?q={city}&units={units}&appid={key}` | Forecast charts (3-hour intervals) |
| Air Quality | `api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={key}` | AQI panel (requires lat/lon from current weather response) |
| Weather Map Tiles | `tile.openweathermap.org/map/{layer}/{z}/{x}/{y}.png?appid={key}` | Leaflet overlay layers (precipitation, clouds, temperature, wind) |

### API Key Handling

- Store the API key in a `.env` file: `VITE_OWM_API_KEY=your_key_here`
- Access via `import.meta.env.VITE_OWM_API_KEY`
- Add `.env` to `.gitignore`
- Include a `.env.example` file with `VITE_OWM_API_KEY=your_api_key_here`

### Units

- Support both `metric` (Celsius, m/s) and `imperial` (Fahrenheit, mph)
- User toggles units via a switch in the header
- Default to `imperial` (user is in Omaha, NE)

---

## Layout & UI Architecture

### Overall Structure

```
┌─────────────────────────────────────────────────────────┐
│  FULL-SCREEN ANIMATED WEATHER CANVAS (background)       │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  HEADER BAR (frosted glass)                     │    │
│  │  [Search Input] [Unit Toggle °F/°C] [Settings]  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌──────────────────┐  ┌───────────────────────────┐    │
│  │  CURRENT WEATHER  │  │  5-DAY FORECAST CHART     │    │
│  │  (hero card)      │  │  (Recharts area/line)     │    │
│  │                   │  │                           │    │
│  │  City Name        │  │  Temp highs/lows curve    │    │
│  │  Temp (big)       │  │  Precipitation bars       │    │
│  │  Condition icon   │  │  Hover tooltips           │    │
│  │  Feels like       │  │                           │    │
│  │  Humidity / Wind   │  │  Day labels along X-axis  │    │
│  │  Sunrise/Sunset   │  │                           │    │
│  └──────────────────┘  └───────────────────────────┘    │
│                                                         │
│  ┌──────────────────┐  ┌───────────────────────────┐    │
│  │  AIR QUALITY      │  │  SNOW DAY CALCULATOR      │    │
│  │                   │  │                           │    │
│  │  AQI gauge/ring   │  │  Probability %  (big)     │    │
│  │  PM2.5 / PM10     │  │  Factor breakdown bars    │    │
│  │  CO / NO2 / O3    │  │  Verdict message          │    │
│  │  Health advice     │  │  Fun animation if >70%    │    │
│  └──────────────────┘  └───────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  INTERACTIVE MAP (Leaflet)                      │    │
│  │  Weather tile overlay selector:                 │    │
│  │  [Precipitation] [Clouds] [Temperature] [Wind]  │    │
│  │                                                 │    │
│  │  Map centered on searched city                  │    │
│  │  Marker with current temp popup                 │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Responsive Behavior

- **Desktop (≥1024px):** 2-column grid for the four main cards, full-width map below
- **Tablet (768–1023px):** 2-column grid, cards may stack where needed
- **Mobile (<768px):** Single column, all cards stacked vertically, map goes full-width

---

## Component Breakdown

### 1. `App.jsx`
- Root component
- Wraps everything in the weather context provider
- Renders `WeatherCanvas`, `Header`, and `Dashboard`

### 2. `WeatherCanvas.jsx` — Full-Screen Animated Background
- **Position:** Fixed behind all content, `z-index: 0`
- **Implementation:** HTML5 `<canvas>` element, full viewport
- **Renders a layered parallax weather scene based on current conditions:**

#### Weather Scene Layers (back to front):

| Layer | Content | Parallax Speed |
|-------|---------|----------------|
| Sky gradient | Dynamic gradient that shifts based on time of day + weather | Static |
| Far clouds | Large, slow-drifting translucent cloud shapes | 0.2x |
| Mid clouds | Medium clouds, slightly faster | 0.5x |
| Precipitation | Rain streaks, snowflakes, or nothing | 1.0x |
| Fog / mist | Low-opacity overlay when conditions warrant | 0.3x |
| Lightning | Random flash overlay for thunderstorm conditions | Instant |
| Sun / Moon | Positioned based on time of day; glow effect | 0.1x |
| Near particles | Close rain drops, large snowflakes for depth | 1.5x |

#### Condition-to-Scene Mapping:

| OWM Condition Code | Scene |
|-------------------|-------|
| 800 (Clear) | Bright sun/moon, no clouds, warm/cool gradient |
| 801-804 (Clouds) | Increasing cloud density per code, dimmer sky |
| 300-321 (Drizzle) | Light rain streaks, gray-blue gradient, scattered clouds |
| 500-531 (Rain) | Heavy rain streaks, dark gradient, dense clouds |
| 200-232 (Thunderstorm) | Rain + random lightning flashes + dark gradient |
| 600-622 (Snow) | Snowflake particles (varying density), white-blue gradient |
| 701-781 (Atmosphere) | Fog/mist overlay, muted colors, minimal visibility |

#### Time-of-Day Gradients:

| Time | Gradient |
|------|----------|
| Dawn (5-7 AM) | Deep purple → warm orange → soft blue |
| Day (7 AM - 5 PM) | Light blue → white (clear) or gray (overcast) |
| Dusk (5-7 PM) | Orange → pink → deep purple |
| Night (7 PM - 5 AM) | Dark navy → deep indigo, stars if clear |

- **Performance:** Use `requestAnimationFrame`, target 60fps, limit particle counts on mobile
- **Transitions:** When new weather data loads, smoothly crossfade between scenes over ~2 seconds

### 3. `Header.jsx`
- Frosted glass bar, fixed at top
- **Search input:** City name, triggers fetch on Enter or search button click
- **Unit toggle:** `°F / °C` pill switch, updates all displayed data
- **Optional:** Geolocation button to auto-detect user's city
- Subtle frosted glass: `backdrop-filter: blur(16px); background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25);`

### 4. `GlassCard.jsx` — Reusable Wrapper
- Shared glassmorphism card component used by all panels
- Props: `title`, `className`, `children`
- Styles:
  ```css
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  padding: 24px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  ```
- Hover: subtle lift (`translateY(-2px)`) and increased shadow
- Loading state: skeleton shimmer animation inside card

### 5. `CurrentWeather.jsx` — Hero Card
- Largest card, displays:
  - City name + country flag emoji
  - Current temperature (large, bold, ~72px font)
  - Weather condition text + animated icon (from OWM icon codes or custom SVG set)
  - "Feels like" temperature
  - Humidity percentage with droplet icon
  - Wind speed + direction arrow (rotate arrow SVG to match `wind.deg`)
  - Sunrise / sunset times (converted from Unix timestamps to local time)
  - Atmospheric pressure
- **Data source:** `/weather` endpoint

### 6. `Forecast.jsx` — 5-Day Forecast Chart
- Uses **Recharts** `<AreaChart>` or `<ComposedChart>`
- X-axis: Day labels (Mon, Tue, Wed...)
- Primary Y-axis: Temperature
- Data processing: The `/forecast` endpoint returns 3-hour intervals; aggregate to daily:
  - **High:** max temp per day
  - **Low:** min temp per day
  - **Precipitation:** sum of `rain.3h` or `snow.3h` per day
  - **Condition:** most frequent condition code per day
- Chart elements:
  - Gradient-filled area between high and low temps
  - Small weather condition icons above each day
  - Precipitation bar overlay (secondary Y-axis)
  - Custom tooltip showing detailed info on hover
- Chart styling:
  - Transparent background (inherits glass card)
  - Soft gradient fills (e.g., warm orange-to-blue for temp range)
  - Grid lines: very subtle, `rgba(255,255,255,0.1)`
  - Labels: white text, clean sans-serif

### 7. `AirQuality.jsx` — AQI Panel
- **Data source:** `/air_pollution` endpoint (requires lat/lon from weather response)
- Displays:
  - **AQI Index (1-5)** as a circular gauge or arc meter
  - Color-coded: 1=Green (Good), 2=Yellow (Fair), 3=Orange (Moderate), 4=Red (Poor), 5=Purple (Very Poor)
  - Individual pollutant readings in a mini grid:
    - PM2.5, PM10, CO, NO₂, O₃, SO₂
    - Each with a small bar or value + unit
  - **Health recommendation** text based on AQI level:
    - 1: "Air quality is great — enjoy outdoor activities!"
    - 2: "Air quality is acceptable for most people."
    - 3: "Sensitive groups should limit prolonged outdoor exertion."
    - 4: "Everyone should reduce outdoor activity."
    - 5: "Health alert — avoid outdoor activity."

### 8. `SnowDayCalculator.jsx` — Custom Feature ⭐
- **The crown jewel / unique feature.** Calculates probability of a snow day based on current + forecast weather data.
- Displays a large probability percentage, a verdict, and a breakdown of contributing factors.

#### Scoring Algorithm

Each factor contributes weighted points to a 0–100 score:

| Factor | Weight | Data Source | Scoring Logic |
|--------|--------|-------------|---------------|
| **Snowfall amount** | 30% | Forecast `snow.3h` summed over next 12h | 0" = 0pts, 1-2" = 10pts, 3-5" = 20pts, 6+" = 30pts |
| **Wind chill** | 20% | Current `feels_like` | > 20°F = 0pts, 10-20°F = 8pts, 0-10°F = 14pts, < 0°F = 20pts |
| **Wind speed** | 15% | Current `wind.speed` | < 10mph = 0pts, 10-20mph = 5pts, 20-30mph = 10pts, 30+mph = 15pts |
| **Visibility** | 15% | Current `visibility` (meters) | > 5km = 0pts, 2-5km = 5pts, 1-2km = 10pts, < 1km = 15pts |
| **Temperature** | 10% | Current `temp` | > 35°F = 0pts, 28-35°F = 5pts, 20-28°F = 8pts, < 20°F = 10pts |
| **Time factor** | 10% | Current time | Already school hours = 0pts, Evening before = 8pts, Early morning (2-6 AM) = 10pts |

#### Verdict Messages

| Score | Verdict | Emoji | Card Behavior |
|-------|---------|-------|---------------|
| 0–20 | "Not a chance. Do your homework." | 📚 | Normal card |
| 21–40 | "Unlikely, but keep your fingers crossed." | 🤞 | Normal card |
| 41–60 | "It's a coin flip — stay tuned!" | 🎲 | Subtle pulse glow |
| 61–80 | "Looking good! Start the hot cocoa." | ☕ | Snowflake particles inside card |
| 81–100 | "SNOW DAY! Build a snowman!" | ⛄ | Celebration animation — snowflakes burst from card, card glows blue-white |

#### UI Elements

- **Probability ring:** Large circular progress ring showing the percentage, color transitions from blue (low) to white-glow (high)
- **Factor breakdown:** Horizontal bar chart showing each factor's contribution (mini Recharts bars or custom SVG)
- **Verdict text:** Large, centered, with emoji
- **Celebration animation (>70%):** Snowflakes burst outward from the card using CSS or a small canvas overlay; gentle pulsing glow on the card border

### 9. `WeatherMap.jsx` — Interactive Map
- **Library:** Leaflet via `react-leaflet`
- **Base tiles:** OpenStreetMap or CartoDB Dark Matter (to match dark glassmorphism aesthetic)
- **Weather overlays:** OpenWeatherMap tile layers, toggled via pill buttons:
  - Precipitation (`precipitation_new`)
  - Clouds (`clouds_new`)
  - Temperature (`temp_new`)
  - Wind speed (`wind_new`)
- **Behavior:**
  - Centers on searched city (use lat/lon from weather response)
  - Marker at city location with popup showing current temp + condition
  - Smooth fly-to animation on city change
  - Default zoom: 8
- **Styling:** Round the map corners to match glass card aesthetic; add subtle glass border

---

## State Management

Use React Context (or Zustand if preferred) with this shape:

```typescript
interface WeatherState {
  city: string;
  units: 'metric' | 'imperial';
  loading: boolean;
  error: string | null;
  current: CurrentWeatherData | null;   // from /weather
  forecast: ForecastData | null;         // from /forecast
  airQuality: AirQualityData | null;     // from /air_pollution
}
```

### Data Flow

1. User enters city → dispatch search action
2. Fetch `/weather` first (need lat/lon for AQI + map)
3. In parallel, fetch `/forecast` and `/air_pollution` using lat/lon
4. Update state → all cards re-render with new data
5. Weather canvas transitions to new scene based on condition code
6. Map flies to new coordinates

---

## Error Handling & Edge Cases

- **Invalid city:** Show inline error message in search bar area ("City not found — try again")
- **API rate limit:** Cache last successful response in state; show "Rate limited — showing cached data" notice
- **No snow data:** Snow Day Calculator gracefully shows 0% with message "No snow in the forecast for {city}"
- **Missing AQI data:** Show "Air quality data unavailable for this location" in AQI card
- **Network error:** Glass card shows retry button with error message
- **Loading states:** Each card independently shows a skeleton/shimmer animation while its data loads

---

## Animations & Micro-Interactions

| Element | Animation |
|---------|-----------|
| Card entry | Staggered fade-in + slide-up on initial load |
| Card hover | Subtle lift + enhanced shadow |
| Data refresh | Numbers count up/down to new values (animated counter) |
| Unit toggle | Temperature numbers flip/morph between °F and °C |
| Search | Input expands on focus; results slide in |
| Weather canvas | 2-second crossfade between weather scenes |
| Snow Day >70% | Snowflake burst + card glow pulse |
| AQI gauge | Arc animates from 0 to current value on load |
| Forecast chart | Lines draw in from left to right |
| Map | Fly-to animation on city change |

---

## Color Palette

### Glass Card Tokens

```css
--glass-bg: rgba(255, 255, 255, 0.12);
--glass-bg-hover: rgba(255, 255, 255, 0.18);
--glass-border: rgba(255, 255, 255, 0.2);
--glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
--glass-blur: 20px;
--glass-radius: 20px;
```

### Semantic Colors

```css
--text-primary: rgba(255, 255, 255, 0.95);
--text-secondary: rgba(255, 255, 255, 0.65);
--accent-blue: #60A5FA;
--accent-warm: #F59E0B;
--aqi-good: #4ADE80;
--aqi-fair: #FACC15;
--aqi-moderate: #FB923C;
--aqi-poor: #EF4444;
--aqi-very-poor: #A855F7;
--snow-glow: rgba(200, 220, 255, 0.6);
```

### Typography

- **Font:** `'Inter', -apple-system, BlinkMacSystemFont, sans-serif` (import Inter from Google Fonts)
- **Temperature display:** 72px, font-weight 200 (ultra-light for elegance)
- **Card titles:** 14px, font-weight 600, uppercase, letter-spacing 1px, `--text-secondary`
- **Body text:** 16px, font-weight 400, `--text-primary`

---

## File Structure (Suggested)

```
weather-dashboard/
├── public/
│   └── index.html
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── context/
│   │   └── WeatherContext.jsx
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── GlassCard.jsx
│   │   ├── CurrentWeather.jsx
│   │   ├── Forecast.jsx
│   │   ├── AirQuality.jsx
│   │   ├── SnowDayCalculator.jsx
│   │   ├── WeatherMap.jsx
│   │   └── WeatherCanvas.jsx
│   ├── hooks/
│   │   └── useWeather.js          # Custom hook wrapping context
│   ├── utils/
│   │   ├── api.js                 # All OWM fetch functions
│   │   ├── snowDayAlgorithm.js    # Scoring logic, isolated for testability
│   │   └── weatherScenes.js       # Canvas rendering functions per condition
│   ├── styles/
│   │   ├── globals.css            # CSS variables, reset, glass tokens
│   │   └── *.module.css           # Per-component if using CSS Modules
│   └── assets/
│       └── (any static icons or images)
├── .env.example
├── .gitignore
├── package.json
├── vite.config.js
└── README.md
```

---

## README Content

The generated `README.md` should include:

1. Project title + one-line description
2. Screenshot placeholder
3. Features list (bullet points)
4. Setup instructions:
   - Clone repo
   - `npm install`
   - Create `.env` with API key
   - `npm run dev`
5. API key instructions (link to OpenWeatherMap signup)
6. Tech stack list
7. Snow Day Calculator explanation (how scoring works)

---

## Implementation Priority

Build in this order to ensure incremental progress:

1. **Project scaffolding** — Vite + React setup, CSS variables, GlassCard component
2. **Header + Search** — City input, unit toggle, basic state management
3. **Current Weather card** — Fetch + display, validates API key works
4. **Weather Canvas** — Animated background responding to conditions
5. **5-Day Forecast** — Data aggregation + Recharts
6. **Air Quality** — AQI gauge + pollutant grid
7. **Snow Day Calculator** — Algorithm + UI + celebration animations
8. **Weather Map** — Leaflet integration + tile overlays
9. **Polish** — Loading states, error handling, responsive design, animation timing
10. **README** — Documentation

---

## Key Constraints & Notes

- The OpenWeatherMap free tier allows 60 calls/minute — be mindful of rapid re-fetching
- Debounce search input (300ms) to avoid unnecessary API calls
- Leaflet CSS must be imported (`leaflet/dist/leaflet.css`) or the map tiles break
- The weather canvas should NOT block interaction — use `pointer-events: none`
- Test with diverse cities: Omaha (mid-continent), London (frequent rain), Dubai (hot/clear), Tromsø (arctic/snow), Singapore (tropical humidity)
- All timestamps from OWM are Unix UTC — convert using the `timezone` offset from the weather response
