import React from 'react'
import { motion } from 'framer-motion'

const SIZE = 160
const STROKE = 14
const R = (SIZE - STROKE) / 2
const CIRCUMFERENCE = Math.PI * R  // half circle
const CX = SIZE / 2
const CY = SIZE / 2 + 10

/**
 * A semicircular SVG gauge showing 0-100 composite risk score.
 */
export default function RiskMeter({ score = 0, riskLevel }) {
  const clampedScore = Math.min(100, Math.max(0, score))
  const pct = clampedScore / 100
  const dashOffset = CIRCUMFERENCE * (1 - pct)

  const color = riskLevel?.color ?? '#22c55e'
  const label = riskLevel?.label ?? 'None'

  return (
    <div style={styles.wrap} aria-label={`Risk score: ${clampedScore} out of 100, level: ${label}`}>
      <svg width={SIZE} height={SIZE / 2 + 20} viewBox={`0 0 ${SIZE} ${SIZE / 2 + 20}`}
        overflow="visible">
        {/* Track */}
        <path
          d={describeArc(CX, CY, R, 180, 0)}
          fill="none"
          stroke="var(--bg-elevated)"
          strokeWidth={STROKE}
          strokeLinecap="round"
        />
        {/* Value arc */}
        <motion.path
          d={describeArc(CX, CY, R, 180, 0)}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          initial={{ strokeDashoffset: CIRCUMFERENCE }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          filter="url(#gauge-glow)"
        />

        {/* Glow filter */}
        <defs>
          <filter id="gauge-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Score text */}
        <text x={CX} y={CY + 2} textAnchor="middle"
          fill="var(--text-primary)"
          fontSize="28" fontFamily="var(--font-mono)" fontWeight="500">
          {clampedScore}
        </text>
        <text x={CX} y={CY + 18} textAnchor="middle"
          fill="var(--text-muted)"
          fontSize="10" fontFamily="var(--font-mono)">
          / 100
        </text>
      </svg>

      <div style={{ ...styles.badge, background: color + '22', color }}>
        {label} Risk
      </div>
    </div>
  )
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCart(cx, cy, r, startAngle)
  const end   = polarToCart(cx, cy, r, endAngle)
  return `M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`
}

function polarToCart(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

const styles = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    fontSize: 12,
    fontFamily: 'var(--font-mono)',
    padding: '4px 12px',
    borderRadius: 20,
    letterSpacing: '0.05em',
  },
}
