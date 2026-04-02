import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'

const CLASS_STYLES = {
  'Class I':   { color: 'var(--risk-red)',   bg: 'var(--risk-red-dim)',   label: 'Serious',  border: 'rgba(239,68,68,0.3)' },
  'Class II':  { color: 'var(--amber)',      bg: 'var(--risk-amber-dim)', label: 'Moderate', border: 'rgba(245,158,11,0.3)' },
  'Class III': { color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.04)', label: 'Minor',  border: 'var(--border-subtle)' },
}

function getClassStyle(cls) {
  return CLASS_STYLES[cls] ?? CLASS_STYLES['Class III']
}

export default function RecallTimeline({ drugs = [], recallsMap = {} }) {
  const [filterDrug, setFilterDrug]   = useState('all')
  const [filterClass, setFilterClass] = useState('all')
  const [expanded, setExpanded]       = useState({})

  const allRecalls = useMemo(() => {
    const items = []
    for (const drug of drugs) {
      const recalls = recallsMap[drug.generic] ?? []
      for (const r of recalls) {
        items.push({ ...r, _drug: drug })
      }
    }
    return items.sort((a, b) => {
      const da = a.recall_initiation_date || ''
      const db = b.recall_initiation_date || ''
      return db.localeCompare(da)
    })
  }, [drugs, recallsMap])

  const filtered = useMemo(() => allRecalls.filter(r => {
    if (filterDrug !== 'all' && r._drug.generic !== filterDrug) return false
    if (filterClass !== 'all' && r.classification !== filterClass) return false
    return true
  }), [allRecalls, filterDrug, filterClass])

  if (!allRecalls.length) {
    return (
      <div style={styles.empty}>
        <ShieldIcon />
        <p>No recall records found for your stack.</p>
      </div>
    )
  }

  return (
    <div style={styles.wrap}>
      {/* Filters */}
      <div style={styles.filters}>
        <select
          value={filterDrug}
          onChange={e => setFilterDrug(e.target.value)}
          style={styles.select}
          aria-label="Filter by drug"
        >
          <option value="all">All drugs</option>
          {drugs.map(d => (
            <option key={d.generic} value={d.generic}>
              {d.brand || d.generic}
            </option>
          ))}
        </select>

        <select
          value={filterClass}
          onChange={e => setFilterClass(e.target.value)}
          style={styles.select}
          aria-label="Filter by recall class"
        >
          <option value="all">All classes</option>
          <option value="Class I">Class I — Serious</option>
          <option value="Class II">Class II — Moderate</option>
          <option value="Class III">Class III — Minor</option>
        </select>
      </div>

      {filtered.length === 0 && (
        <div style={styles.empty}>No recalls match the current filters.</div>
      )}

      {/* Timeline */}
      <div style={styles.timeline}>
        {filtered.map((recall, i) => {
          const cls = getClassStyle(recall.classification)
          const isOpen = expanded[i]
          const isOngoing = recall.status === 'Ongoing'
          const date = formatDate(recall.recall_initiation_date)

          return (
            <motion.div
              key={i}
              style={{ ...styles.item, borderColor: cls.border, background: cls.bg }}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              {/* Timeline dot */}
              <div style={{ ...styles.dot, background: cls.color }} />
              <div style={{ flex: 1 }}>
                <div style={styles.itemHeader}>
                  <div style={styles.itemMeta}>
                    <span style={{ ...styles.classBadge, color: cls.color, background: cls.bg }}>
                      {recall.classification ?? 'Unknown'}
                    </span>
                    {isOngoing && <span style={styles.ongoingDot} aria-label="Ongoing" />}
                    <span style={styles.date}>{date}</span>
                  </div>
                  <span style={styles.drugChip}>{recall._drug.brand || recall._drug.generic}</span>
                </div>

                <p style={styles.recallBrand}>
                  {recall.product_description?.slice(0, 80) ?? 'Unknown product'}
                  {(recall.product_description?.length ?? 0) > 80 ? '…' : ''}
                </p>

                <button
                  style={styles.expandBtn}
                  onClick={() => setExpanded(e => ({ ...e, [i]: !e[i] }))}
                >
                  {isOpen ? 'Hide details' : 'Show reason'}
                  <ChevronIcon open={isOpen} />
                </button>

                {isOpen && (
                  <div style={styles.expandedBody}>
                    <p style={styles.reasonText}>
                      <strong>Reason:</strong> {recall.reason_for_recall ?? 'Not specified'}
                    </p>
                    {recall.voluntary_mandated && (
                      <p style={styles.reasonText}>
                        <strong>Type:</strong> {recall.voluntary_mandated}
                      </p>
                    )}
                    {recall.recalling_firm && (
                      <p style={styles.reasonText}>
                        <strong>Firm:</strong> {recall.recalling_firm}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function formatDate(str) {
  if (!str || str.length < 8) return 'Unknown date'
  const y = str.slice(0, 4)
  const m = str.slice(4, 6)
  const d = str.slice(6, 8)
  return `${m}/${d}/${y}`
}

function ShieldIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
      stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  )
}

function ChevronIcon({ open }) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 12 },
  filters: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  select: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-dim)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)',
    fontSize: 12,
    fontFamily: 'var(--font-mono)',
    padding: '6px 10px',
    cursor: 'pointer',
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    maxHeight: 400,
    overflowY: 'auto',
    paddingRight: 4,
  },
  item: {
    display: 'flex',
    gap: 12,
    border: '1px solid',
    borderRadius: 'var(--radius-md)',
    padding: '12px 14px',
    position: 'relative',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
    marginTop: 5,
  },
  itemHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
    flexWrap: 'wrap',
    gap: 6,
  },
  itemMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  classBadge: {
    fontSize: 10,
    fontFamily: 'var(--font-mono)',
    padding: '2px 8px',
    borderRadius: 10,
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  ongoingDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: 'var(--risk-red)',
    animation: 'pulse-red 1.5s ease-in-out infinite',
  },
  date: {
    fontSize: 11,
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
  },
  drugChip: {
    fontSize: 10,
    padding: '2px 8px',
    borderRadius: 10,
    background: 'var(--teal-dim)',
    color: 'var(--teal)',
    fontFamily: 'var(--font-mono)',
  },
  recallBrand: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-mono)',
    lineHeight: 1.4,
    marginBottom: 6,
  },
  expandBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: 11,
    fontFamily: 'var(--font-mono)',
    cursor: 'pointer',
    padding: 0,
    transition: 'color 0.2s',
  },
  expandedBody: {
    marginTop: 8,
    padding: '10px 12px',
    background: 'rgba(0,0,0,0.2)',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
  },
  reasonText: {
    fontSize: 11,
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-mono)',
    lineHeight: 1.5,
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
    fontSize: 13,
    padding: '32px 0',
    textAlign: 'center',
  },
}
