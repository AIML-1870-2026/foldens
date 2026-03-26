import { useState, useEffect, useRef } from 'react'
import { useWeather } from '../hooks/useWeather'
import GlassCard from './GlassCard'
import styles from './CurrentWeather.module.css'

function countryToFlag(countryCode) {
  if (!countryCode) return ''
  return countryCode
    .toUpperCase()
    .split('')
    .map(c => String.fromCodePoint(0x1F1E6 - 65 + c.charCodeAt(0)))
    .join('')
}

function formatTime(unix, timezoneOffset) {
  const date = new Date((unix + timezoneOffset) * 1000)
  const h = date.getUTCHours()
  const m = date.getUTCMinutes().toString().padStart(2, '0')
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${m} ${ampm}`
}

function getWindDirection(deg) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(deg / 45) % 8]
}

function AnimatedNumber({ value, unit }) {
  const [displayed, setDisplayed] = useState(value)
  const prevRef = useRef(value)
  const rafRef = useRef(null)

  useEffect(() => {
    if (value === prevRef.current) return
    const start = prevRef.current
    const end = value
    const duration = 600
    const startTime = performance.now()

    function animate(now) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(start + (end - start) * ease)
      setDisplayed(current)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        prevRef.current = end
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [value])

  return <span>{displayed}{unit}</span>
}

export default function CurrentWeather() {
  const { current, units, loading } = useWeather()

  if (loading && !current) {
    return <GlassCard title="Current Weather" loading={true} className={styles.card} />
  }

  if (!current) {
    return (
      <GlassCard title="Current Weather" className={styles.card}>
        <div className={styles.empty}>No weather data</div>
      </GlassCard>
    )
  }

  const { main, weather, wind, visibility, sys, timezone, dt, name } = current
  const condition = weather[0]
  const iconUrl = `https://openweathermap.org/img/wn/${condition.icon}@2x.png`
  const isImperial = units === 'imperial'
  const tempUnit = isImperial ? '°F' : '°C'
  const windUnit = isImperial ? 'mph' : 'm/s'
  const windDeg = wind?.deg || 0

  return (
    <GlassCard title="Current Weather" className={styles.card}>
      <div className={styles.main}>
        <div className={styles.locationRow}>
          <span className={styles.cityName}>{name}</span>
          <span className={styles.countryFlag}>{countryToFlag(sys?.country)}</span>
          <span className={styles.country}>{sys?.country}</span>
        </div>

        <div className={styles.tempRow}>
          <img
            src={iconUrl}
            alt={condition.description}
            className={styles.weatherIcon}
          />
          <div className={styles.temp}>
            <AnimatedNumber value={Math.round(main.temp)} unit={tempUnit} />
          </div>
        </div>

        <div className={styles.description}>{condition.description}</div>

        <div className={styles.statsGrid}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Feels like</span>
            <span className={styles.statValue}>
              <AnimatedNumber value={Math.round(main.feels_like)} unit={tempUnit} />
            </span>
          </div>
          <div className={styles.stat}>
            <svg className={styles.statIcon} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a5 5 0 0 0-5 5c0 2.63 1.63 5.07 3.42 7.31C11.13 15.3 12 16.24 12 16.24s.87-.94 1.58-1.93C15.37 12.07 17 9.63 17 7a5 5 0 0 0-5-5Zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" opacity="0.2"/>
              <path d="M12 22c-4 0-7-3-7-7 0-1.5.5-3 1.5-4.2L12 2l5.5 8.8C18.5 12 19 13.5 19 15c0 4-3 7-7 7Z"/>
            </svg>
            <span className={styles.statLabel}>Humidity</span>
            <span className={styles.statValue}>{main.humidity}%</span>
          </div>
          <div className={styles.stat}>
            <div className={styles.windArrow} style={{ transform: `rotate(${windDeg}deg)` }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="19" x2="12" y2="5"/>
                <polyline points="5 12 12 5 19 12"/>
              </svg>
            </div>
            <span className={styles.statLabel}>Wind</span>
            <span className={styles.statValue}>
              {wind?.speed?.toFixed(0)} {windUnit} {getWindDirection(windDeg)}
            </span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Pressure</span>
            <span className={styles.statValue}>{main.pressure} hPa</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Visibility</span>
            <span className={styles.statValue}>{visibility ? `${(visibility / 1000).toFixed(1)} km` : 'N/A'}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>High / Low</span>
            <span className={styles.statValue}>
              {Math.round(main.temp_max)}{tempUnit} / {Math.round(main.temp_min)}{tempUnit}
            </span>
          </div>
        </div>

        <div className={styles.sunRow}>
          <div className={styles.sunItem}>
            <svg className={styles.sunIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
            <div>
              <div className={styles.sunLabel}>Sunrise</div>
              <div className={styles.sunValue}>{formatTime(sys.sunrise, timezone)}</div>
            </div>
          </div>
          <div className={styles.sunItem}>
            <svg className={styles.sunIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#F59E0B' }}>
              <path d="M12 8a4 4 0 0 0 0 8"/>
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
              <path d="M2 20h20" strokeWidth="1.5"/>
            </svg>
            <div>
              <div className={styles.sunLabel}>Sunset</div>
              <div className={styles.sunValue}>{formatTime(sys.sunset, timezone)}</div>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  )
}
