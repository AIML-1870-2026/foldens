import React, { useState } from 'react'
import EventsChart from './EventsChart.jsx'
import CoAdminHeatmap from './CoAdminHeatmap.jsx'

function toTitleCase(str) {
  if (!str) return ''
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

export default function EventsPanel({ drugs = [], eventsMap = {}, coAdminMatrix = {} }) {
  const [activeTab, setActiveTab] = useState('stack')

  const stackEvents = buildStackEvents(drugs, eventsMap)

  const tabs = [
    { id: 'stack', label: 'Stack View' },
    ...drugs.map(d => ({ id: d.generic, label: toTitleCase(d.brand || d.generic) })),
  ]

  return (
    <div style={styles.wrap}>
      <div style={styles.tabBar} role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            style={{
              ...styles.tab,
              color: activeTab === tab.id ? 'var(--teal)' : 'var(--text-muted)',
              borderBottom: activeTab === tab.id
                ? '2px solid var(--teal)'
                : '2px solid transparent',
            }}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={styles.content}>
        {activeTab === 'stack' ? (
          <>
            <StackViewEvents events={stackEvents} drugs={drugs} />
            <div style={styles.divider} />
            <CoAdminHeatmap drugs={drugs} coAdminMatrix={coAdminMatrix} />
          </>
        ) : (
          <DrugEvents
            drug={drugs.find(d => d.generic === activeTab)}
            events={eventsMap[activeTab] ?? []}
          />
        )}
      </div>
    </div>
  )
}

function DrugEvents({ drug, events }) {
  if (!drug) return null
  return (
    <div>
      <div style={styles.drugHeader}>
        <span style={styles.drugName}>{drug.display}</span>
        <span style={styles.eventCount}>{events.length} reactions tracked</span>
      </div>
      <EventsChart events={events} />
    </div>
  )
}

function StackViewEvents({ events, drugs }) {
  if (!events.length) {
    return <div style={styles.empty}>No adverse event data for this stack.</div>
  }

  // Events appearing across 3+ drugs get flagged
  return (
    <div>
      <div style={styles.stackHeader}>
        <span style={styles.subLabel}>Cross-drug adverse events</span>
        <span style={styles.crossNote}>
          <span style={styles.crossDot} /> = appears in 3+ drugs
        </span>
      </div>
      <div style={styles.termGrid}>
        {events.slice(0, 20).map((e, i) => (
          <div
            key={i}
            style={{
              ...styles.termChip,
              background: e.drugCount >= 3 ? 'var(--risk-amber-dim)' : 'var(--bg-elevated)',
              border: `1px solid ${e.drugCount >= 3 ? 'rgba(245,158,11,0.3)' : 'var(--border-subtle)'}`,
              color: e.drugCount >= 3 ? 'var(--amber)' : 'var(--text-secondary)',
            }}
            title={`Reported in ${e.drugCount} drug(s): ${e.term}`}
          >
            {e.drugCount >= 3 && <span style={styles.crossDotInline} />}
            <span style={styles.termLabel}>
              {e.term.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
            </span>
            <span style={styles.termCount}>{e.totalCount.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function buildStackEvents(drugs, eventsMap) {
  const termMap = {}
  for (const drug of drugs) {
    const events = eventsMap[drug.generic] ?? []
    for (const e of events) {
      if (!termMap[e.term]) {
        termMap[e.term] = { term: e.term, totalCount: 0, drugCount: 0 }
      }
      termMap[e.term].totalCount += e.count
      termMap[e.term].drugCount++
    }
  }
  return Object.values(termMap).sort((a, b) => b.totalCount - a.totalCount)
}

const styles = {
  wrap: { display: 'flex', flexDirection: 'column' },
  tabBar: {
    display: 'flex',
    gap: 2,
    overflowX: 'auto',
    borderBottom: '1px solid var(--border-subtle)',
    marginBottom: 16,
    paddingBottom: 0,
  },
  tab: {
    background: 'none',
    border: 'none',
    borderRadius: 0,
    padding: '7px 12px',
    fontSize: 12,
    fontFamily: 'var(--font-mono)',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'color 0.2s',
  },
  content: { minHeight: 200 },
  drugHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  drugName: { fontSize: 13, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' },
  eventCount: { fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' },
  divider: {
    height: 1,
    background: 'var(--border-subtle)',
    margin: '20px 0',
  },
  stackHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  subLabel: {
    fontSize: 11,
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  crossNote: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 10,
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
  },
  crossDot: {
    display: 'inline-block',
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: 'var(--amber)',
  },
  termGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 7,
  },
  termChip: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '5px 10px',
    borderRadius: 20,
    fontSize: 11,
    fontFamily: 'var(--font-mono)',
    cursor: 'default',
  },
  crossDotInline: {
    display: 'inline-block',
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'var(--amber)',
    flexShrink: 0,
  },
  termLabel: { flex: 1 },
  termCount: { fontSize: 10, opacity: 0.7 },
  empty: {
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
    fontSize: 13,
    padding: '24px 0',
    textAlign: 'center',
  },
}
