import React from 'react'
import { motion } from 'framer-motion'

export default function StreamingSummary({ text, isLoading, error }) {
  if (error) {
    return (
      <div style={styles.error}>
        <AlertIcon />
        <span style={{ fontSize: 13 }}>{error}</span>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div style={styles.loading}>
        <div style={styles.pulse} />
        <div style={styles.pulse} />
        <div style={styles.pulse} />
      </div>
    )
  }

  if (!text) return null

  return (
    <motion.div
      style={styles.wrap}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <p style={styles.text}>
        {text}
        <span style={styles.cursor} aria-hidden="true" />
      </p>
    </motion.div>
  )
}

function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="var(--risk-red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

const styles = {
  wrap: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
    padding: '14px 16px',
  },
  text: {
    fontFamily: 'var(--font-mono)',
    fontSize: 13,
    lineHeight: 1.7,
    color: 'var(--text-secondary)',
  },
  cursor: {
    display: 'inline-block',
    width: 2,
    height: '1em',
    background: 'var(--teal)',
    marginLeft: 2,
    verticalAlign: 'text-bottom',
    animation: 'pulse-teal 1s ease-in-out infinite',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  pulse: {
    height: 12,
    borderRadius: 6,
    background: 'var(--bg-elevated)',
    animation: 'shimmer 1.5s ease-in-out infinite',
    backgroundImage: 'linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-card-hover) 50%, var(--bg-elevated) 75%)',
    backgroundSize: '200% 100%',
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'var(--risk-red-dim)',
    border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 14px',
    color: 'var(--risk-red)',
    fontFamily: 'var(--font-mono)',
  },
}
