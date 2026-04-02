import React, { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

const TEAL = '#00e5c8'

function toTitleCase(str) {
  if (!str) return ''
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

export default function EventsChart({ events = [], totalReports = 0 }) {
  const [normalized, setNormalized] = useState(false)

  if (!events.length) {
    return (
      <div style={styles.empty}>No adverse event data available.</div>
    )
  }

  const data = events.slice(0, 10).map(e => ({
    name: toTitleCase(e.term),
    count: e.count,
    norm: totalReports > 0 ? Math.round((e.count / totalReports) * 10000) : e.count,
  }))

  const dataKey = normalized ? 'norm' : 'count'
  const maxVal  = Math.max(...data.map(d => d[dataKey]))

  return (
    <div style={styles.wrap}>
      <div style={styles.toolbar}>
        <span style={styles.label}>Top Reactions</span>
        <button
          style={{ ...styles.toggle, opacity: normalized ? 1 : 0.5 }}
          onClick={() => setNormalized(n => !n)}
        >
          {normalized ? 'per 10k reports' : 'absolute count'}
        </button>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 24, left: 0, bottom: 0 }}
        >
          <XAxis
            type="number"
            tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={130}
            tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            contentStyle={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-dim)',
              borderRadius: 8,
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: 'var(--text-primary)',
            }}
            formatter={(val) => [
              normalized ? `${val} per 10k` : val.toLocaleString(),
              normalized ? 'Rate' : 'Reports',
            ]}
          />
          <Bar dataKey={dataKey} radius={[0, 4, 4, 0]}>
            {data.map((entry, idx) => (
              <Cell
                key={idx}
                fill={TEAL}
                fillOpacity={0.4 + 0.6 * (entry[dataKey] / maxVal)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 10 },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 11,
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  toggle: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-dim)',
    borderRadius: 6,
    color: 'var(--teal)',
    fontSize: 11,
    padding: '4px 10px',
    cursor: 'pointer',
    fontFamily: 'var(--font-mono)',
    transition: 'opacity 0.2s',
  },
  empty: {
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
    fontSize: 13,
    padding: '16px 0',
    textAlign: 'center',
  },
}
