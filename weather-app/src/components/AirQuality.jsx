import { useEffect, useRef, useState } from 'react'
import { useWeather } from '../hooks/useWeather'
import GlassCard from './GlassCard'
import styles from './AirQuality.module.css'

const AQI_LABELS = ['', 'Good', 'Fair', 'Moderate', 'Poor', 'Very Poor']
const AQI_COLORS = ['', 'var(--aqi-good)', 'var(--aqi-fair)', 'var(--aqi-moderate)', 'var(--aqi-poor)', 'var(--aqi-very-poor)']
const AQI_HEALTH = [
  '',
  'Air quality is good. Ideal for outdoor activities.',
  'Air quality is acceptable. Sensitive groups may experience minor discomfort.',
  'Members of sensitive groups may experience health effects. General public is less likely to be affected.',
  'Everyone may begin to experience health effects. Sensitive groups may experience more serious effects.',
  'Health warnings of emergency conditions. The entire population is more likely to be affected.',
]

// Arc parameters: sweep from ~210° to ~-30° (270° total sweep)
const RADIUS = 60
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const ARC_SWEEP = 0.75 // fraction of circle (270/360)

function ArcGauge({ aqi }) {
  const [animatedFraction, setAnimatedFraction] = useState(0)
  const rafRef = useRef(null)

  useEffect(() => {
    const target = (aqi - 1) / 4 // AQI 1-5 → 0-1
    const duration = 1200
    const startTime = performance.now()

    function animate(now) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setAnimatedFraction(target * ease)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [aqi])

  const svgSize = 160
  const cx = svgSize / 2
  const cy = svgSize / 2

  // Arc from 135° to 405° (135 + 270), convert to rad
  const startAngle = 135 * (Math.PI / 180)
  const totalAngle = 270 * (Math.PI / 180)
  const filledAngle = totalAngle * animatedFraction

  // Background arc
  const bgD = describeArc(cx, cy, RADIUS, 135, 135 + 270)
  // Filled arc
  const fillD = animatedFraction > 0.001 ? describeArc(cx, cy, RADIUS, 135, 135 + 270 * animatedFraction) : ''

  const color = AQI_COLORS[aqi] || AQI_COLORS[1]

  return (
    <svg viewBox={`0 0 ${svgSize} ${svgSize}`} className={styles.gauge}>
      {/* Background track */}
      <path
        d={bgD}
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="10"
        strokeLinecap="round"
      />
      {/* Filled arc */}
      {fillD && (
        <path
          d={fillD}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      )}
      {/* AQI number */}
      <text x={cx} y={cy - 4} textAnchor="middle" className={styles.gaugeNum} fill="rgba(255,255,255,0.95)">
        {aqi}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" className={styles.gaugeLabel} fill="rgba(255,255,255,0.55)">
        AQI
      </text>
    </svg>
  )
}

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (angleDeg - 90) * (Math.PI / 180)
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function describeArc(cx, cy, r, startDeg, endDeg) {
  const start = polarToCartesian(cx, cy, r, startDeg)
  const end = polarToCartesian(cx, cy, r, endDeg)
  const sweep = endDeg - startDeg
  const largeArc = sweep > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`
}

function PollutantBar({ label, value, max, unit }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className={styles.pollutant}>
      <div className={styles.pollutantHeader}>
        <span className={styles.pollutantLabel}>{label}</span>
        <span className={styles.pollutantValue}>{value?.toFixed(1)} {unit}</span>
      </div>
      <div className={styles.pollutantTrack}>
        <div
          className={styles.pollutantFill}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function AirQuality() {
  const { airQuality, loading } = useWeather()

  if (loading && !airQuality) {
    return <GlassCard title="Air Quality" loading={true} className={styles.card} />
  }

  if (!airQuality || !airQuality.list || airQuality.list.length === 0) {
    return (
      <GlassCard title="Air Quality" className={styles.card}>
        <div className={styles.empty}>No air quality data</div>
      </GlassCard>
    )
  }

  const item = airQuality.list[0]
  const aqi = item.main.aqi
  const comp = item.components
  const color = AQI_COLORS[aqi]
  const label = AQI_LABELS[aqi]
  const health = AQI_HEALTH[aqi]

  return (
    <GlassCard title="Air Quality" className={styles.card}>
      <div className={styles.content}>
        <div className={styles.gaugeSection}>
          <ArcGauge aqi={aqi} />
          <div className={styles.aqiLabel} style={{ color }}>
            {label}
          </div>
        </div>

        <div className={styles.pollutants}>
          <PollutantBar label="PM2.5" value={comp.pm2_5} max={75} unit="µg/m³" />
          <PollutantBar label="PM10" value={comp.pm10} max={150} unit="µg/m³" />
          <PollutantBar label="CO" value={comp.co} max={10000} unit="µg/m³" />
          <PollutantBar label="NO₂" value={comp.no2} max={200} unit="µg/m³" />
          <PollutantBar label="O₃" value={comp.o3} max={180} unit="µg/m³" />
          <PollutantBar label="SO₂" value={comp.so2} max={350} unit="µg/m³" />
        </div>

        <div className={styles.healthTip}>
          <svg className={styles.healthIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p>{health}</p>
        </div>
      </div>
    </GlassCard>
  )
}
