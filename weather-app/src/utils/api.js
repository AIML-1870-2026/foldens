const API_KEY = import.meta.env.VITE_OWM_API_KEY
const BASE = 'https://api.openweathermap.org/data/2.5'

async function apiFetch(url) {
  const res = await fetch(url)
  if (!res.ok) {
    const err = new Error(`API error ${res.status}`)
    err.status = res.status
    throw err
  }
  return res.json()
}

export const fetchCurrentWeather = (city, units) =>
  apiFetch(`${BASE}/weather?q=${encodeURIComponent(city)}&units=${units}&appid=${API_KEY}`)

export const fetchForecast = (city, units) =>
  apiFetch(`${BASE}/forecast?q=${encodeURIComponent(city)}&units=${units}&appid=${API_KEY}`)

export const fetchAirQuality = (lat, lon) =>
  apiFetch(`${BASE}/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`)

export const fetchCurrentWeatherByCoords = (lat, lon, units) =>
  apiFetch(`${BASE}/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`)

export const fetchForecastByCoords = (lat, lon, units) =>
  apiFetch(`${BASE}/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`)

export const fetchCitySuggestions = (query) =>
  apiFetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`)

export { API_KEY }
