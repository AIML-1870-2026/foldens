import React from 'react'

function toTitleCase(str) {
  if (!str) return str
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

function shortName(drugName) {
  const name = toTitleCase(drugName)
  return name.length > 10 ? name.slice(0, 10) + '…' : name
}

function heatColor(count, max) {
  if (!count || max === 0) return 'var(--bg-elevated)'
  const pct = Math.min(1, Math.log10(count + 1) / Math.log10(max + 1))
  // teal at low → amber at high
  if (pct < 0.5) {
    const t = pct * 2
    return `rgba(0, ${Math.round(229 * (1 - t) + 229 * t)}, ${Math.round(200 * (1 - t))}, ${0.15 + t * 0.25})`
  } else {
    const t = (pct - 0.5) * 2
    return `rgba(${Math.round(245 * t)}, ${Math.round(158 * (1 - t) + 229 * (1 - t))}, ${Math.round(11 * t)}, ${0.3 + t * 0.4})`
  }
}

export default function CoAdminHeatmap({ drugs = [], coAdminMatrix = {} }) {
  if (drugs.length < 2) return null

  let max = 0
  for (const a of drugs) {
    for (const b of drugs) {
      if (a.generic !== b.generic) {
        const count = coAdminMatrix[`${a.generic}|${b.generic}`] ?? 0
        if (count > max) max = count
      }
    }
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <span style={styles.label}>Co-administration Report Heatmap</span>
        <div style={styles.legend}>
          <div style={{ ...styles.legendCell, background: 'rgba(0,229,200,0.15)' }} />
          <span style={styles.legendText}>Low</span>
          <div style={{ ...styles.legendCell, background: 'rgba(245,158,11,0.6)' }} />
          <span style={styles.legendText}>High</span>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={styles.table} aria-label="Co-administration heatmap">
          <thead>
            <tr>
              <th style={styles.cornerCell} />
              {drugs.map(d => (
                <th key={d.generic} style={styles.colHeader}>
                  {shortName(d.brand || d.generic)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {drugs.map(drugA => (
              <tr key={drugA.generic}>
                <th style={styles.rowHeader}>
                  {shortName(drugA.brand || drugA.generic)}
                </th>
                {drugs.map(drugB => {
                  if (drugA.generic === drugB.generic) {
                    return <td key={drugB.generic} style={styles.selfCell}>—</td>
                  }
                  const key = `${drugA.generic}|${drugB.generic}`
                  const altKey = `${drugB.generic}|${drugA.generic}`
                  const count = coAdminMatrix[key] ?? coAdminMatrix[altKey] ?? 0
                  return (
                    <td
                      key={drugB.generic}
                      style={{
                        ...styles.cell,
                        background: heatColor(count, max),
                      }}
                      title={`${drugA.brand || drugA.generic} + ${drugB.brand || drugB.generic}: ${count.toLocaleString()} reports`}
                    >
                      {count > 0 ? count.toLocaleString() : '—'}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 10 },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 11,
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  legend: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  },
  legendCell: {
    width: 16,
    height: 12,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 10,
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
  },
  table: {
    borderCollapse: 'collapse',
    width: '100%',
    fontSize: 11,
    fontFamily: 'var(--font-mono)',
  },
  cornerCell: { width: 90 },
  colHeader: {
    padding: '6px 8px',
    textAlign: 'center',
    color: 'var(--text-secondary)',
    fontSize: 10,
    fontWeight: 400,
    borderBottom: '1px solid var(--border-subtle)',
    whiteSpace: 'nowrap',
  },
  rowHeader: {
    padding: '6px 8px',
    textAlign: 'right',
    color: 'var(--text-secondary)',
    fontSize: 10,
    fontWeight: 400,
    borderRight: '1px solid var(--border-subtle)',
    whiteSpace: 'nowrap',
  },
  cell: {
    padding: '8px 12px',
    textAlign: 'center',
    color: 'var(--text-primary)',
    fontSize: 10,
    border: '1px solid var(--border-subtle)',
    transition: 'background 0.3s',
  },
  selfCell: {
    padding: '8px 12px',
    textAlign: 'center',
    color: 'var(--text-muted)',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid var(--border-subtle)',
  },
}
