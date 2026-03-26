import { useEffect, useRef, useState, useMemo } from 'react'
import { useWeather } from '../hooks/useWeather'
import { calculateSnowDay, getVerdict } from '../utils/snowDayAlgorithm'
import GlassCard from './GlassCard'
import styles from './SnowDayCalculator.module.css'

const RING_RADIUS = 70
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

function ScoreRing({ score }) {
  const [animated, setAnimated] = useState(0)
  const rafRef = useRef(null)

  useEffect(() => {
    const target = score
    const duration = 1400
    const startTime = performance.now()

    function animate(now) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setAnimated(Math.round(target * ease))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [score])

  const dashOffset = RING_CIRCUMFERENCE * (1 - animated / 100)

  // Color: blue at 0% → cyan at 50% → white-glow at 100%
  let strokeColor
  if (animated < 40) strokeColor = '#3b82f6'
  else if (animated < 70) strokeColor = '#38bdf8'
  else strokeColor = '#e0f2fe'

  const svgSize = 180

  return (
    <svg viewBox={`0 0 ${svgSize} ${svgSize}`} className={styles.ring}>
      <circle
        cx={svgSize / 2}
        cy={svgSize / 2}
        r={RING_RADIUS}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="10"
      />
      <circle
        cx={svgSize / 2}
        cy={svgSize / 2}
        r={RING_RADIUS}
        fill="none"
        stroke={strokeColor}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={RING_CIRCUMFERENCE}
        strokeDashoffset={dashOffset}
        transform={`rotate(-90 ${svgSize / 2} ${svgSize / 2})`}
        style={{
          filter: animated > 70 ? `drop-shadow(0 0 8px ${strokeColor})` : 'none',
          transition: 'filter 0.5s'
        }}
      />
      <text
        x={svgSize / 2}
        y={svgSize / 2 - 6}
        textAnchor="middle"
        fill="rgba(255,255,255,0.95)"
        className={styles.ringScore}
      >
        {animated}%
      </text>
      <text
        x={svgSize / 2}
        y={svgSize / 2 + 16}
        textAnchor="middle"
        fill="rgba(255,255,255,0.5)"
        className={styles.ringLabel}
      >
        SNOW DAY
      </text>
    </svg>
  )
}

function FactorBar({ factor }) {
  const pct = factor.max > 0 ? (factor.value / factor.max) * 100 : 0
  return (
    <div className={styles.factor}>
      <div className={styles.factorHeader}>
        <span className={styles.factorLabel}>{factor.label}</span>
        <span className={styles.factorDetail}>{factor.detail}</span>
        <span className={styles.factorScore}>{factor.value}/{factor.max}</span>
      </div>
      <div className={styles.factorTrack}>
        <div
          className={styles.factorFill}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function SnowflakeParticles({ count = 12 }) {
  const particles = useMemo(() => (
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${5 + Math.random() * 90}%`,
      bottom: `${Math.random() * 30}%`,
      delay: `${Math.random() * 2}s`,
      duration: `${2 + Math.random() * 2}s`,
      size: `${12 + Math.random() * 16}px`,
    }))
  ), [count])

  return (
    <div className={styles.snowflakes} aria-hidden="true">
      {particles.map(p => (
        <div
          key={p.id}
          className={styles.snowflake}
          style={{
            left: p.left,
            bottom: p.bottom,
            animationDelay: p.delay,
            animationDuration: p.duration,
            fontSize: p.size,
          }}
        >
          ❄
        </div>
      ))}
    </div>
  )
}

export default function SnowDayCalculator() {
  const { current, forecast, units, loading } = useWeather()

  const { score, factors } = useMemo(
    () => calculateSnowDay(current, forecast, units),
    [current, forecast, units]
  )
  const verdict = getVerdict(score)
  const isHighScore = score >= 70
  const snowFactor = factors.find(f => f.label === 'Snowfall')
  const noSnow = snowFactor?.value === 0 && score < 20

  if (loading && !current) {
    return <GlassCard title="Snow Day Calculator" loading={true} className={styles.card} />
  }

  return (
    <GlassCard
      title="Snow Day Calculator"
      className={`${styles.card} ${isHighScore ? styles.glowCard : ''}`}
    >
      {isHighScore && <SnowflakeParticles />}
      <div className={styles.content}>
        <div className={styles.ringSection}>
          <ScoreRing score={score} />
          <div className={styles.verdict}>
            <span className={styles.verdictEmoji}>{verdict.emoji}</span>
            <p className={styles.verdictText}>{verdict.text}</p>
          </div>
        </div>

        {noSnow && (
          <div className={styles.noSnowMsg}>
            No snow in the forecast — but winter can surprise!
          </div>
        )}

        <div className={styles.factors}>
          <div className={styles.factorsTitle}>Score Breakdown</div>
          {factors.map(f => (
            <FactorBar key={f.label} factor={f} />
          ))}
        </div>
      </div>
    </GlassCard>
  )
}
