# WeatherDash

A premium glassmorphism weather dashboard built with React + Vite.

## Features

- **Live Current Weather** — Temperature, feels like, humidity, wind direction, pressure, visibility, sunrise/sunset
- **5-Day Forecast** — Recharts ComposedChart with high/low area, precipitation bars, OWM icons, and daily summary rows
- **Air Quality** — SVG arc gauge (AQI 1-5), PM2.5, PM10, CO, NO2, O3, SO2 progress bars, health recommendations
- **Snow Day Calculator** — Algorithmic score (0–100) based on snowfall, wind chill, wind speed, visibility, temperature, and time of day; animated ring + verdict
- **Weather Map** — react-leaflet with CartoDB Dark Matter tiles and OWM overlay layers (precipitation, clouds, temp, wind)
- **Animated Canvas Background** — Full-viewport canvas with sky gradients, clouds, rain/snow particles, fog, lightning, sun/moon, and stars that respond to live weather conditions
- **Unit Toggle** — Switch between °F (imperial) and °C (metric)
- **Geolocation** — Fetch weather for your current GPS position
- **Glassmorphism UI** — CSS Modules, backdrop-filter blur, hover lift, skeleton loading states

## Setup

### 1. Install dependencies

```bash
cd weather-app
npm install
```

### 2. Add your API key

Copy `.env.example` to `.env` and add your OpenWeatherMap API key:

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_OWM_API_KEY=your_actual_api_key_here
```

Get a free API key at: https://openweathermap.org/api

### 3. Run the dev server

```bash
npm run dev
```

Open http://localhost:5173

### 4. Build for production

```bash
npm run build
npm run preview
```

## Tech Stack

| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| Vite 5 | Build tool & dev server |
| CSS Modules | Scoped glassmorphism styles |
| Recharts | Forecast ComposedChart |
| react-leaflet + Leaflet | Interactive weather map |
| Canvas 2D API | Animated weather background |
| React Context + hooks | Global weather state |
| OpenWeatherMap API | Weather, forecast, air quality data |

## Snow Day Calculator

The Snow Day Calculator scores conditions on a 0–100 scale:

| Factor | Weight | Details |
|---|---|---|
| Snowfall | 30 pts | Accumulation over next 12 hours |
| Wind Chill | 20 pts | Feels-like temperature |
| Wind Speed | 15 pts | Current wind speed |
| Visibility | 15 pts | Current visibility |
| Temperature | 10 pts | Actual temperature |
| Timing | 10 pts | Hour of day (early morning scores highest) |

**Verdicts:**
- 81-100: SNOW DAY! Build a snowman!
- 61-80: Looking good! Start the hot cocoa.
- 41-60: It's a coin flip — stay tuned!
- 21-40: Unlikely, but keep your fingers crossed.
- 0-20: Not a chance. Do your homework.
