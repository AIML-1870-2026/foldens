import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { parseCYP450, extractInteractionSnippets } from '../../utils/drugParser.js'

function toTitleCase(str) {
  if (!str) return ''
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

export default function InteractionDrawer({
  isOpen,
  onClose,
  pairData,
  stackData,
  coAdminReactions = [],
}) {
  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (!pairData) return null

  const { drugA, drugB, score, riskLevel, rxnormData } = pairData
  const dataA = stackData?.[drugA]
  const dataB = stackData?.[drugB]
  const labelA = dataA?.label
  const labelB = dataB?.label

  const cyp450A = parseCYP450(labelA?.drug_interactions)
  const cyp450B = parseCYP450(labelB?.drug_interactions)
  const sharedEnzymes = Object.keys(cyp450A).filter(e => Object.keys(cyp450B).includes(e))

  const snippetsA = extractInteractionSnippets(
    labelA?.drug_interactions, drugB, 3
  )
  const snippetsB = extractInteractionSnippets(
    labelB?.drug_interactions, drugA, 3
  )

  const displayA = dataA?.drug?.display ?? drugA
  const displayB = dataB?.drug?.display ?? drugB

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            style={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.aside
            role="complementary"
            aria-label="Interaction deep-dive"
            style={styles.drawer}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
          >
            {/* Header */}
            <div style={styles.drawerHeader}>
              <div>
                <h2 style={styles.drawerTitle}>
                  Interaction Analysis
                </h2>
                <p style={styles.drawerSubtitle}>
                  {toTitleCase(displayA.split('(')[0])} + {toTitleCase(displayB.split('(')[0])}
                </p>
              </div>
              <button style={styles.closeBtn} onClick={onClose} aria-label="Close drawer">
                <CloseIcon />
              </button>
            </div>

            <div style={styles.drawerBody}>
              {/* Risk score */}
              <div style={{
                ...styles.scoreBlock,
                borderColor: riskLevel?.color + '44',
                background: riskLevel?.color + '11',
              }}>
                <span style={{ fontSize: 28, fontFamily: 'var(--font-mono)', color: riskLevel?.color, fontWeight: 500 }}>
                  {score ?? 0}
                </span>
                <div>
                  <div style={{ fontSize: 12, color: riskLevel?.color, fontFamily: 'var(--font-mono)' }}>
                    {riskLevel?.label} Risk
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Composite score / 100
                  </div>
                </div>
              </div>

              {/* RxNorm interaction */}
              {rxnormData && (
                <Section title="RxNorm Interaction">
                  <div style={styles.rxnormCard}>
                    <div style={styles.rxnormSeverity(rxnormData.severity)}>
                      {rxnormData.severity} severity
                    </div>
                    <p style={styles.snippet}>{rxnormData.description}</p>
                    <div style={styles.source}>Source: {rxnormData.source}</div>
                  </div>
                </Section>
              )}

              {/* Mechanism tags */}
              <Section title="Mechanism Tags">
                <MechanismTags cyp450A={cyp450A} cyp450B={cyp450B} sharedEnzymes={sharedEnzymes} rxnormData={rxnormData} />
              </Section>

              {/* CYP450 overlap */}
              {sharedEnzymes.length > 0 && (
                <Section title="CYP450 Enzyme Overlap">
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Enzyme</th>
                        <th style={styles.th}>{toTitleCase(displayA.split('(')[0])}</th>
                        <th style={styles.th}>{toTitleCase(displayB.split('(')[0])}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sharedEnzymes.map(e => (
                        <tr key={e}>
                          <td style={styles.td}>{e}</td>
                          <td style={{ ...styles.td, color: roleColor(cyp450A[e]) }}>{cyp450A[e]}</td>
                          <td style={{ ...styles.td, color: roleColor(cyp450B[e]) }}>{cyp450B[e]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Section>
              )}

              {/* FDA label snippets */}
              {snippetsA.length > 0 && (
                <Section title={`FDA Label — ${toTitleCase(displayA.split('(')[0])} mentions ${toTitleCase(displayB.split('(')[0])}`}>
                  {snippetsA.map((s, i) => (
                    <p key={i} style={styles.snippet}>{s}</p>
                  ))}
                </Section>
              )}

              {snippetsB.length > 0 && (
                <Section title={`FDA Label — ${toTitleCase(displayB.split('(')[0])} mentions ${toTitleCase(displayA.split('(')[0])}`}>
                  {snippetsB.map((s, i) => (
                    <p key={i} style={styles.snippet}>{s}</p>
                  ))}
                </Section>
              )}

              {/* Co-admin reactions */}
              {coAdminReactions.length > 0 && (
                <Section title="Top Co-Admin Adverse Reactions">
                  <div style={styles.reactionList}>
                    {coAdminReactions.map((r, i) => (
                      <div key={i} style={styles.reactionItem}>
                        <span style={styles.reactionTerm}>
                          {toTitleCase(r.term)}
                        </span>
                        <span style={styles.reactionCount}>{r.count.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

function Section({ title, children }) {
  return (
    <div style={styles.section}>
      <h4 style={styles.sectionTitle}>{title}</h4>
      <div style={styles.sectionBody}>{children}</div>
    </div>
  )
}

function MechanismTags({ cyp450A, cyp450B, sharedEnzymes, rxnormData }) {
  const tags = []

  if (sharedEnzymes.some(e =>
    (cyp450A[e] === 'inhibitor' && cyp450B[e] === 'substrate') ||
    (cyp450B[e] === 'inhibitor' && cyp450A[e] === 'substrate')
  )) tags.push({ label: 'Pharmacokinetic', color: 'var(--teal)' })

  if (rxnormData?.description?.toLowerCase().includes('blood') ||
      rxnormData?.description?.toLowerCase().includes('effect')) {
    tags.push({ label: 'Pharmacodynamic', color: 'var(--amber)' })
  }

  if (rxnormData?.severity === 'high') {
    tags.push({ label: 'Additive Risk', color: 'var(--risk-red)' })
  }

  if (!tags.length) tags.push({ label: 'Unknown Mechanism', color: 'var(--text-muted)' })

  return (
    <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
      {tags.map(t => (
        <span key={t.label} style={{
          ...styles.mechTag,
          color: t.color,
          border: `1px solid ${t.color}44`,
          background: t.color + '11',
        }}>
          {t.label}
        </span>
      ))}
    </div>
  )
}

function roleColor(role) {
  if (role === 'inhibitor') return 'var(--risk-red)'
  if (role === 'inducer')   return 'var(--amber)'
  if (role === 'substrate') return 'var(--teal)'
  return 'var(--text-muted)'
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 'var(--z-drawer)',
    backdropFilter: 'blur(2px)',
  },
  drawer: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: 420,
    maxWidth: '95vw',
    background: 'var(--bg-surface)',
    borderLeft: '1px solid var(--border-dim)',
    zIndex: 'calc(var(--z-drawer) + 1)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  drawerHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: '20px 24px 16px',
    borderBottom: '1px solid var(--border-subtle)',
    flexShrink: 0,
  },
  drawerTitle: {
    fontFamily: 'var(--font-serif)',
    fontSize: 20,
    color: 'var(--text-primary)',
    fontStyle: 'italic',
    marginBottom: 2,
  },
  drawerSubtitle: {
    fontSize: 12,
    color: 'var(--teal)',
    fontFamily: 'var(--font-mono)',
  },
  closeBtn: {
    background: 'none',
    border: '1px solid var(--border-dim)',
    borderRadius: 8,
    color: 'var(--text-muted)',
    padding: 6,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'color 0.2s, border-color 0.2s',
    flexShrink: 0,
  },
  drawerBody: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 24px 32px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  scoreBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '14px 18px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid',
  },
  rxnormCard: {
    background: 'var(--bg-elevated)',
    borderRadius: 'var(--radius-sm)',
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  rxnormSeverity: (sev) => ({
    fontSize: 11,
    fontFamily: 'var(--font-mono)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: sev === 'high' ? 'var(--risk-red)' : sev === 'moderate' ? 'var(--amber)' : 'var(--risk-green)',
  }),
  source: {
    fontSize: 10,
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 11,
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  sectionBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 12,
    fontFamily: 'var(--font-mono)',
  },
  th: {
    padding: '6px 10px',
    textAlign: 'left',
    color: 'var(--text-muted)',
    fontSize: 10,
    borderBottom: '1px solid var(--border-subtle)',
    fontWeight: 400,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  td: {
    padding: '7px 10px',
    color: 'var(--text-secondary)',
    borderBottom: '1px solid var(--border-subtle)',
    fontSize: 12,
  },
  snippet: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    fontFamily: 'var(--font-mono)',
    background: 'var(--bg-elevated)',
    borderRadius: 6,
    padding: '8px 10px',
    borderLeft: '2px solid var(--border-dim)',
  },
  mechTag: {
    fontSize: 11,
    padding: '4px 10px',
    borderRadius: 12,
    fontFamily: 'var(--font-mono)',
    letterSpacing: '0.03em',
  },
  reactionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
  },
  reactionItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 10px',
    background: 'var(--bg-elevated)',
    borderRadius: 6,
  },
  reactionTerm: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-mono)',
  },
  reactionCount: {
    fontSize: 11,
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
  },
}
