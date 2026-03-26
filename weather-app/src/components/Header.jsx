import { useState, useRef, useCallback, useEffect } from 'react'
import { useWeather } from '../hooks/useWeather'
import { API_KEY, fetchCitySuggestions } from '../utils/api'
import styles from './Header.module.css'

export default function Header() {
  const { city, units, loading, error, rateLimited, searchCity, searchByCoords, toggleUnits } = useWeather()
  const [inputValue, setInputValue] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeSuggestion, setActiveSuggestion] = useState(-1)
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState(null)
  const debounceRef = useRef(null)
  const wrapperRef = useRef(null)

  // Fetch suggestions with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!inputValue.trim() || inputValue.trim().length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await fetchCitySuggestions(inputValue.trim())
        setSuggestions(results || [])
        setShowSuggestions((results || []).length > 0)
        setActiveSuggestion(-1)
      } catch {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [inputValue])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selectSuggestion = useCallback((s) => {
    setInputValue('')
    setSuggestions([])
    setShowSuggestions(false)
    setActiveSuggestion(-1)
    searchByCoords(s.lat, s.lon)
  }, [searchByCoords])

  const handleSearch = useCallback(() => {
    const val = inputValue.trim()
    if (!val) return
    setInputValue('')
    setSuggestions([])
    setShowSuggestions(false)
    searchCity(val)
  }, [inputValue, searchCity])

  const handleKeyDown = (e) => {
    if (!showSuggestions) {
      if (e.key === 'Enter') handleSearch()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveSuggestion(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveSuggestion(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeSuggestion >= 0) {
        selectSuggestion(suggestions[activeSuggestion])
      } else {
        handleSearch()
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation not supported')
      return
    }
    setGeoLoading(true)
    setGeoError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        searchByCoords(pos.coords.latitude, pos.coords.longitude)
        setGeoLoading(false)
      },
      () => {
        setGeoError('Location access denied')
        setGeoLoading(false)
      },
      { timeout: 10000 }
    )
  }

  const noKey = !API_KEY || API_KEY === 'your_api_key_here'

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <svg className={styles.brandIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v1M12 21v1M4.22 4.22l.71.71M18.36 18.36l.71.71M2 12h1M21 12h1M4.22 19.78l.71-.71M18.36 5.64l.71-.71"/>
            <circle cx="12" cy="12" r="4"/>
          </svg>
          <span className={styles.brandName}>Weather</span>
        </div>

        <div className={styles.searchArea}>
          {noKey && (
            <div className={styles.apiWarning}>
              Add your API key to <code>.env</code> — see README for instructions
            </div>
          )}
          {rateLimited && (
            <div className={styles.rateLimitNotice}>
              Rate limited — showing cached data
            </div>
          )}
          <div className={styles.searchRow}>
            <div className={styles.searchBox} ref={wrapperRef}>
              <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                className={styles.searchInput}
                type="text"
                placeholder="Search city..."
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                autoComplete="off"
                aria-label="Search city"
                aria-autocomplete="list"
                aria-expanded={showSuggestions}
              />
              {inputValue && (
                <button
                  className={styles.clearBtn}
                  onClick={() => { setInputValue(''); setSuggestions([]); setShowSuggestions(false) }}
                  aria-label="Clear"
                >
                  ×
                </button>
              )}
              {showSuggestions && suggestions.length > 0 && (
                <ul className={styles.dropdown} role="listbox">
                  {suggestions.map((s, i) => (
                    <li
                      key={`${s.lat}-${s.lon}`}
                      className={`${styles.dropdownItem} ${i === activeSuggestion ? styles.dropdownItemActive : ''}`}
                      onMouseDown={() => selectSuggestion(s)}
                      onMouseEnter={() => setActiveSuggestion(i)}
                      role="option"
                      aria-selected={i === activeSuggestion}
                    >
                      <span className={styles.dropdownCity}>{s.name}</span>
                      <span className={styles.dropdownMeta}>
                        {s.state ? `${s.state}, ` : ''}{s.country}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              className={styles.searchBtn}
              onClick={handleSearch}
              disabled={loading || !inputValue.trim()}
              aria-label="Search"
            >
              {loading ? (
                <span className={styles.spinner} />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              )}
            </button>
            <button
              className={styles.geoBtn}
              onClick={handleGeolocate}
              disabled={geoLoading}
              title="Use my location"
              aria-label="Use current location"
            >
              {geoLoading ? (
                <span className={styles.spinner} />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
                  <circle cx="12" cy="12" r="8" opacity="0.3"/>
                </svg>
              )}
            </button>
          </div>
          {(error || geoError) && (
            <div className={styles.errorMsg}>{error || geoError}</div>
          )}
        </div>

        <div className={styles.controls}>
          <button
            className={styles.unitToggle}
            onClick={toggleUnits}
            aria-label={`Switch to ${units === 'imperial' ? 'Celsius' : 'Fahrenheit'}`}
          >
            <span className={units === 'imperial' ? styles.unitActive : styles.unitInactive}>°F</span>
            <span className={styles.unitDivider}>/</span>
            <span className={units === 'metric' ? styles.unitActive : styles.unitInactive}>°C</span>
          </button>
          {city && (
            <div className={styles.currentCity}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.cityIcon}>
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {city}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
