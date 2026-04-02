import React from 'react'
import { motion } from 'framer-motion'

const SEVERITY_STYLES = {
  high:     { bg: 'var(--risk-red-dim)',   border: 'rgba(239,68,68,0.3)',   color: 'var(--risk-red)',   label: 'High' },
  moderate: { bg: 'var(--risk-amber-dim)', border: 'rgba(245,158,11,0.3)',  color: 'var(--amber)',      label: 'Moderate' },
  low:      { bg: 'var(--risk-green-dim)', border: 'rgba(34,197,94,0.25)',  color: 'var(--risk-green)', label: 'Low' },
}

export default function ConcernCards({ concerns = [], recommendations = [] }) {
  if (!concerns.length && !recommendations.length) return null

  return (
    <div style={styles.wrap}>
      {concerns.length > 0 && (
        <>
          <h4 style={styles.sectionTitle}>Top Concerns</h4>
          {concerns.map((c, i) => {
            const sev = SEVERITY_STYLES[c.severity] ?? SEVERITY_STYLES.low
            return (
              <motion.div
                key={i}
                style={{
                  ...styles.card,
                  background: sev.bg,
                  borderColor: sev.border,
                }}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, duration: 0.3 }}
              >
                <div style={styles.cardHeader}>
                  <span style={{ ...styles.sevBadge, color: sev.color }}>{sev.label}</span>
                  <span style={styles.cardTitle}>{c.title}</span>
                </div>
                <p style={styles.cardDesc}>{c.description}</p>
                {c.drugs?.length > 0 && (
                  <div style={styles.drugTags}>
                    {c.drugs.map(d => (
                      <span key={d} style={styles.drugTag}>{d}</span>
                    ))}
                  </div>
                )}
              </motion.div>
            )
          })}
        </>
      )}

      {recommendations.length > 0 && (
        <>
          <h4 style={{ ...styles.sectionTitle, marginTop: 16 }}>Recommendations</h4>
          <ul style={styles.recList}>
            {recommendations.map((rec, i) => (
              <motion.li
                key={i}
                style={styles.recItem}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (concerns.length + i) * 0.06 }}
              >
                <span style={styles.recDot} />
                <span style={styles.recText}>{rec}</span>
              </motion.li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 8 },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
    marginBottom: 4,
  },
  card: {
    border: '1px solid',
    borderRadius: 'var(--radius-md)',
    padding: '11px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  sevBadge: {
    fontSize: 10,
    fontFamily: 'var(--font-mono)',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    fontWeight: 500,
    flexShrink: 0,
  },
  cardTitle: {
    fontSize: 13,
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-mono)',
    fontWeight: 500,
  },
  cardDesc: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    lineHeight: 1.55,
    fontFamily: 'var(--font-mono)',
  },
  drugTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 5,
  },
  drugTag: {
    fontSize: 10,
    padding: '2px 8px',
    borderRadius: 10,
    background: 'rgba(255,255,255,0.06)',
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
    border: '1px solid var(--border-subtle)',
  },
  recList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 7,
    listStyle: 'none',
  },
  recItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
  },
  recDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'var(--teal)',
    flexShrink: 0,
    marginTop: 5,
  },
  recText: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    lineHeight: 1.55,
    fontFamily: 'var(--font-mono)',
  },
}
