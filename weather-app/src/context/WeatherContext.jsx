import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
import {
  fetchCurrentWeather,
  fetchForecast,
  fetchAirQuality,
  fetchCurrentWeatherByCoords,
  fetchForecastByCoords
} from '../utils/api'

const WeatherContext = createContext(null)

export function WeatherProvider({ children }) {
  const [city, setCity] = useState('Omaha')
  const [units, setUnits] = useState('imperial')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [current, setCurrent] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [airQuality, setAirQuality] = useState(null)
  const [rateLimited, setRateLimited] = useState(false)
  const cacheRef = useRef({})

  const searchCity = useCallback(async (cityName, overrideUnits) => {
    const u = overrideUnits !== undefined ? overrideUnits : units
    setLoading(true)
    setError(null)
    setRateLimited(false)
    try {
      const weatherData = await fetchCurrentWeather(cityName, u)
      const { lat, lon } = weatherData.coord
      const [forecastData, aqiData] = await Promise.all([
        fetchForecast(cityName, u),
        fetchAirQuality(lat, lon)
      ])
      const result = { current: weatherData, forecast: forecastData, airQuality: aqiData }
      cacheRef.current = result
      setCurrent(weatherData)
      setForecast(forecastData)
      setAirQuality(aqiData)
      setCity(cityName)
    } catch (err) {
      if (err.status === 429 && cacheRef.current.current) {
        setRateLimited(true)
        setCurrent(cacheRef.current.current)
        setForecast(cacheRef.current.forecast)
        setAirQuality(cacheRef.current.airQuality)
      } else if (err.status === 404) {
        setError('City not found — try again')
      } else {
        setError(err.message || 'Failed to fetch weather data')
      }
    } finally {
      setLoading(false)
    }
  }, [units])

  const searchByCoords = useCallback(async (lat, lon, overrideUnits) => {
    const u = overrideUnits !== undefined ? overrideUnits : units
    setLoading(true)
    setError(null)
    setRateLimited(false)
    try {
      const weatherData = await fetchCurrentWeatherByCoords(lat, lon, u)
      const [forecastData, aqiData] = await Promise.all([
        fetchForecastByCoords(lat, lon, u),
        fetchAirQuality(lat, lon)
      ])
      const result = { current: weatherData, forecast: forecastData, airQuality: aqiData }
      cacheRef.current = result
      setCurrent(weatherData)
      setForecast(forecastData)
      setAirQuality(aqiData)
      setCity(weatherData.name)
    } catch (err) {
      if (err.status === 429 && cacheRef.current.current) {
        setRateLimited(true)
        setCurrent(cacheRef.current.current)
        setForecast(cacheRef.current.forecast)
        setAirQuality(cacheRef.current.airQuality)
      } else {
        setError(err.message || 'Failed to fetch weather data')
      }
    } finally {
      setLoading(false)
    }
  }, [units])

  const toggleUnits = useCallback(() => {
    const newUnits = units === 'imperial' ? 'metric' : 'imperial'
    setUnits(newUnits)
    if (city) searchCity(city, newUnits)
  }, [units, city, searchCity])

  // Initial load
  React.useEffect(() => {
    searchCity('Omaha', 'imperial')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <WeatherContext.Provider value={{
      city, units, loading, error, rateLimited,
      current, forecast, airQuality,
      searchCity, searchByCoords, toggleUnits
    }}>
      {children}
    </WeatherContext.Provider>
  )
}

export function useWeatherContext() {
  return useContext(WeatherContext)
}
