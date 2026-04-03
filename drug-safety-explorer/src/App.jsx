import React, { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import DrugSearch       from './components/DrugStackBuilder/DrugSearch.jsx'
import PresetStacks     from './components/DrugStackBuilder/PresetStacks.jsx'
import Graph            from './components/ConstellationGraph/Graph.jsx'
import RiskMeter        from './components/RiskSummary/RiskMeter.jsx'
import StreamingSummary from './components/RiskSummary/StreamingSummary.jsx'
import ConcernCards     from './components/RiskSummary/ConcernCards.jsx'
import EventsPanel      from './components/AdverseEvents/EventsPanel.jsx'
import Timeline         from './components/RecallTimeline/Timeline.jsx'
import Drawer           from './components/InteractionDrawer/Drawer.jsx'

import { fetchStackData, fetchCoAdminCount, fetchCoAdminReactions } from './hooks/useOpenFDA.js'
import { resolveAndFetchInteractions, getPairInteraction }          from './hooks/useRxNorm.js'
import { useClaudeAnalysis }                                        from './hooks/useClaudeAnalysis.js'
import { scorePair, scoreStack, generatePairs }                     from './utils/riskScoring.js'
import { parseCYP450 }                                              from './utils/drugParser.js'

const MAX_DRUGS = 6

export default function App() {
  const [stack,         setStack]         = useState([])
  const [isAnalyzing,   setIsAnalyzing]   = useState(false)
  const [hasAnalyzed,   setHasAnalyzed]   = useState(false)
  const [stackData,     setStackData]     = useState({})
  const [pairScores,    setPairScores]    = useState([])
  const [eventsMap,     setEventsMap]     = useState({})
  const [recallsMap,    setRecallsMap]    = useState({})
  const [coAdminMatrix, setCoAdminMatrix] = useState({})
  const [rightTab,      setRightTab]      = useState('events')
  const [selectedPair,  setSelectedPair]  = useState(null)
  const [drawerOpen,    setDrawerOpen]    = useState(false)
  const [drawerPair,    setDrawerPair]    = useState(null)
  const [coAdminRxns,   setCoAdminRxns]   = useState([])

  const { analyze, result, isLoading: aiLoading, error: aiError, streamText } = useClaudeAnalysis()
  const dashboardRef = useRef(null)

  // ── Stack management ──────────────────────────────────────────────────────

  const addDrug = useCallback((drug) => {
    setStack(prev => {
      if (prev.some(d => d.generic === drug.generic)) return prev
      if (prev.length >= MAX_DRUGS) return prev
      return [...prev, drug]
    })
    setHasAnalyzed(false)
  }, [])

  const removeDrug = useCallback((generic) => {
    setStack(prev => prev.filter(d => d.generic !== generic))
    setHasAnalyzed(false)
  }, [])

  const loadPreset = useCallback((drugs) => {
    setStack(drugs.slice(0, MAX_DRUGS))
    setHasAnalyzed(false)
  }, [])

  // ── Analyze ───────────────────────────────────────────────────────────────

  const handleAnalyze = useCallback(async () => {
    if (stack.length < 2 || isAnalyzing) return
    setIsAnalyzing(true)
    setHasAnalyzed(false)

    try {
      const rawStackData = await fetchStackData(stack)
      setStackData(rawStackData)

      const newEventsMap  = {}
      const newRecallsMap = {}
      for (const [generic, data] of Object.entries(rawStackData)) {
        newEventsMap[generic]  = data.events
        newRecallsMap[generic] = data.recalls
      }
      setEventsMap(newEventsMap)
      setRecallsMap(newRecallsMap)

      const { interactions: rxnormInteractions } = await resolveAndFetchInteractions(stack)
      const pairs = generatePairs(stack)

      const newMatrix = {}
      for (const [drugA, drugB] of pairs) {
        const count = await fetchCoAdminCount(drugA.generic, drugB.generic)
        newMatrix[`${drugA.generic}|${drugB.generic}`] = count
        await sleep(80)
      }
      setCoAdminMatrix(newMatrix)

      const now = new Date()
      const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate())

      const scored = pairs.map(([drugA, drugB]) => {
        const labelA  = rawStackData[drugA.generic]?.label
        const labelB  = rawStackData[drugB.generic]?.label
        const cyp450A = parseCYP450(labelA?.drug_interactions)
        const cyp450B = parseCYP450(labelB?.drug_interactions)
        const coCount = newMatrix[`${drugA.generic}|${drugB.generic}`] ?? 0

        const interactionTextA = (labelA?.drug_interactions ?? []).join(' ').toUpperCase()
        const interactionTextB = (labelB?.drug_interactions ?? []).join(' ').toUpperCase()
        const labelMention = interactionTextA.includes(drugB.generic.toUpperCase()) ||
                             interactionTextB.includes(drugA.generic.toUpperCase())

        const rxnorm = getPairInteraction(rxnormInteractions, drugA.generic, drugB.generic)

        const hasClassIRecall = [...(rawStackData[drugA.generic]?.recalls ?? []),
                                 ...(rawStackData[drugB.generic]?.recalls ?? [])]
          .some(r => {
            if (r.classification !== 'Class I') return false
            const d = r.recall_initiation_date
            if (!d || d.length < 8) return false
            const dt = new Date(d.slice(0,4), d.slice(4,6)-1, d.slice(6,8))
            return dt >= twoYearsAgo
          })

        const scoreResult = scorePair({
          rxnormSeverity: rxnorm?.severity ?? null,
          labelMention,
          coAdminCount: coCount,
          hasClassIRecall,
          cyp450A,
          cyp450B,
        })

        return {
          drugA: drugA.generic,
          drugB: drugB.generic,
          displayA: drugA.display,
          displayB: drugB.display,
          ...scoreResult,
          coAdminCount: coCount,
          rxnormData: rxnorm,
        }
      })

      setPairScores(scored)

      await analyze({ drugs: stack, interactions: scored, topEvents: newEventsMap })

      setHasAnalyzed(true)
      setTimeout(() => dashboardRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)

    } catch (err) {
      console.error('Analysis error:', err)
    } finally {
      setIsAnalyzing(false)
    }
  }, [stack, isAnalyzing, analyze])

  // ── Drawer ────────────────────────────────────────────────────────────────

  const openDrawer = useCallback(async (pair) => {
    if (!pair) { setDrawerOpen(false); return }
    setDrawerPair({ ...pair, ...pairScores.find(p => p.drugA === pair.drugA && p.drugB === pair.drugB) })
    setDrawerOpen(true)
    const rxns = await fetchCoAdminReactions(pair.drugA, pair.drugB)
    setCoAdminRxns(rxns)
  }, [pairScores])

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false)
    setSelectedPair(null)
  }, [])

  // Use result's composite score for the gauge so it stays in sync with concerns
  const gaugeScore    = result?.compositeScore ?? 0
  const gaugeRiskLevel = result
    ? { low: { label: 'Low', color: '#22c55e' }, moderate: { label: 'Moderate', color: '#f59e0b' }, high: { label: 'High', color: '#ef4444' } }[result.overallRiskLevel] ?? { label: 'None', color: '#22c55e' }
    : { label: 'None', color: '#22c55e' }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={styles.appWrap}>
      {/* Disclaimer */}
      <div style={styles.disclaimer} role="alert">
        <InfoIcon />
        <span>
          <strong>Educational only.</strong> RxLens is not a substitute for professional medical advice.
          Always consult a licensed healthcare provider before changing your medications.
        </span>
      </div>

      {/* Hero */}
      <section style={styles.hero} className="rxlens-hero" aria-label="Drug stack builder">
        <div style={styles.heroInner}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={styles.heroText}
          >
            <h1 style={styles.heroTitle}>
              Rx<span style={{ color: 'var(--teal)', fontStyle: 'italic' }}>Lens</span>
            </h1>
            <p style={styles.heroSub}>
              Build your medication stack and instantly see every drug-drug interaction,
              adverse event pattern, and recall — all in one view.
            </p>
          </motion.div>

          <div style={styles.searchRow}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <DrugSearch stack={stack} onAdd={addDrug} maxDrugs={MAX_DRUGS} />
            </div>
            <PresetStacks onLoad={loadPreset} disabled={false} />
          </div>

          <AnimatePresence>
            {stack.length > 0 && (
              <motion.div
                style={styles.chipRow}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                {stack.map((drug) => (
                  <motion.div
                    key={drug.generic}
                    style={styles.chip}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span style={styles.chipLabel}>{drug.display}</span>
                    <button
                      style={styles.chipRemove}
                      onClick={() => removeDrug(drug.generic)}
                      aria-label={`Remove ${drug.display}`}
                    >
                      <XIcon />
                    </button>
                  </motion.div>
                ))}
                <span style={styles.stackCount}>{stack.length}/{MAX_DRUGS}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            style={{
              ...styles.analyzeBtn,
              opacity: stack.length < 2 ? 0.4 : 1,
              cursor: stack.length < 2 ? 'not-allowed' : 'pointer',
            }}
            disabled={stack.length < 2 || isAnalyzing}
            onClick={handleAnalyze}
            whileHover={stack.length >= 2 ? { scale: 1.02 } : undefined}
            whileTap={stack.length >= 2 ? { scale: 0.98 } : undefined}
          >
            {isAnalyzing ? <><Spinner small /> Analyzing…</> : <><ZapIcon /> Analyze Stack</>}
          </motion.button>

          {stack.length < 2 && (
            <p style={styles.hint}>Add at least 2 drugs above to analyze interactions</p>
          )}
        </div>
      </section>

      {/* Empty state preview — only when nothing has been analyzed */}
      <AnimatePresence>
        {!hasAnalyzed && !isAnalyzing && (
          <motion.section
            className="rxlens-preview"
            style={styles.previewSection}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            aria-label="What you'll see"
          >
            <p style={styles.previewLabel}>What you'll get after analysis</p>
            <div style={styles.previewGrid}>
              {PREVIEW_CARDS.map((card, i) => (
                <motion.div
                  key={card.title}
                  style={styles.previewCard}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.07 }}
                >
                  <div style={{ ...styles.previewIcon, color: card.color }}>{card.icon}</div>
                  <div>
                    <div style={styles.previewCardTitle}>{card.title}</div>
                    <div style={styles.previewCardDesc}>{card.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
            <p style={styles.tryPrompt}>
              Try a preset — <button style={styles.tryBtn} onClick={() => document.querySelector('[aria-haspopup]')?.click()}>Common Stacks</button> — or type any drug name above.
            </p>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Dashboard */}
      <AnimatePresence>
        {(hasAnalyzed || isAnalyzing) && (
          <motion.section
            ref={dashboardRef}
            style={styles.dashboard}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            aria-label="Analysis dashboard"
          >
            <div style={styles.dashboardGrid} className="rxlens-dashboard-grid">
              {/* LEFT — Constellation graph */}
              <div style={styles.leftCol}>
                <SectionCard
                  title="Drug Constellation"
                  subtitle="Nodes = drugs · Edge color = interaction risk · Click edges for details"
                >
                  <div style={styles.graphWrap}>
                    <Graph
                      drugs={stack}
                      pairScores={pairScores}
                      selectedPair={selectedPair}
                      onSelectPair={(pair) => {
                        setSelectedPair(pair)
                        if (pair) openDrawer(pair)
                      }}
                      onSelectDrug={(drugId) => {
                        const related = pairScores.find(p => p.drugA === drugId || p.drugB === drugId)
                        if (related) openDrawer({ drugA: related.drugA, drugB: related.drugB })
                      }}
                    />
                  </div>
                  <div style={styles.graphLegend}>
                    {[
                      { color: '#22c55e', label: 'No interaction' },
                      { color: '#f59e0b', label: 'Possible'       },
                      { color: '#ef4444', label: 'Significant'    },
                    ].map(l => (
                      <div key={l.label} style={styles.legendItem}>
                        <div style={{ width: 24, height: 2, background: l.color, borderRadius: 1 }} />
                        <span style={styles.legendText}>{l.label}</span>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>

              {/* CENTER — Risk Summary */}
              <div style={styles.centerCol}>
                <SectionCard
                  title="Risk Summary"
                  subtitle="Scored from RxNorm interactions, FAERS reports, CYP450 overlap & recalls"
                >
                  {(hasAnalyzed || result) && (
                    <div style={styles.meterRow}>
                      <RiskMeter score={gaugeScore} riskLevel={gaugeRiskLevel} />
                    </div>
                  )}

                  <StreamingSummary
                    text={streamText}
                    isLoading={aiLoading}
                    error={aiError}
                  />

                  {result && (
                    <ConcernCards
                      concerns={result.topConcerns ?? []}
                      recommendations={result.recommendations ?? []}
                    />
                  )}
                </SectionCard>

                {/* Pair scores */}
                {pairScores.length > 0 && (
                  <SectionCard
                    title="Pair Scores"
                    subtitle="Composite 0–100 signal · 0–9 none · 10–29 low · 30–59 moderate · 60+ high"
                  >
                    <div style={styles.pairTable}>
                      {[...pairScores]
                        .sort((a, b) => b.total - a.total)
                        .map((ps, i) => (
                          <div
                            key={i}
                            style={{ ...styles.pairRow, borderColor: ps.riskLevel.color + '33', cursor: 'pointer' }}
                            onClick={() => openDrawer({ drugA: ps.drugA, drugB: ps.drugB })}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            role="button"
                            tabIndex={0}
                            onKeyDown={e => e.key === 'Enter' && openDrawer({ drugA: ps.drugA, drugB: ps.drugB })}
                          >
                            <div style={styles.pairNames}>
                              <span style={styles.pairDrug}>{toShortName(ps.displayA)}</span>
                              <span style={styles.pairPlus}>+</span>
                              <span style={styles.pairDrug}>{toShortName(ps.displayB)}</span>
                            </div>
                            <div style={styles.pairRight}>
                              <div style={styles.pairBarWrap}>
                                <div style={{
                                  ...styles.pairBar,
                                  width: `${ps.total}%`,
                                  background: ps.riskLevel.color,
                                }} />
                              </div>
                              <span style={{ ...styles.pairScore, color: ps.riskLevel.color }}>
                                {ps.total}
                              </span>
                              <div style={{ ...styles.pairDot, background: ps.riskLevel.color }} />
                            </div>
                          </div>
                        ))}
                    </div>
                  </SectionCard>
                )}
              </div>

              {/* RIGHT — Events + Recalls */}
              <div style={styles.rightCol}>
                <SectionCard
                  title={rightTab === 'events' ? 'Adverse Events' : 'Recall Timeline'}
                  subtitle={rightTab === 'events'
                    ? 'From FDA FAERS spontaneous reports — counts indicate frequency, not causation'
                    : 'From FDA Enforcement database — Class I is most serious'}
                  titleAction={
                    <div style={styles.tabSwitch}>
                      <button
                        style={{ ...styles.tabBtn, color: rightTab === 'events' ? 'var(--teal)' : 'var(--text-muted)' }}
                        onClick={() => setRightTab('events')}
                      >Events</button>
                      <button
                        style={{ ...styles.tabBtn, color: rightTab === 'recalls' ? 'var(--teal)' : 'var(--text-muted)' }}
                        onClick={() => setRightTab('recalls')}
                      >Recalls</button>
                    </div>
                  }
                >
                  {rightTab === 'events'
                    ? <EventsPanel drugs={stack} eventsMap={eventsMap} coAdminMatrix={coAdminMatrix} />
                    : <Timeline    drugs={stack} recallsMap={recallsMap} />
                  }
                </SectionCard>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Data sources footer */}
      <footer style={styles.footer}>
        <span style={styles.footerLabel}>Data sources:</span>
        <a style={styles.footerLink} href="https://open.fda.gov" target="_blank" rel="noreferrer">OpenFDA</a>
        <span style={styles.footerSep}>·</span>
        <a style={styles.footerLink} href="https://rxnav.nlm.nih.gov" target="_blank" rel="noreferrer">NIH RxNorm</a>
        <span style={styles.footerSep}>·</span>
        <span style={styles.footerNote}>FAERS counts reflect spontaneous reports, not incidence rates</span>
      </footer>

      {/* Interaction Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={closeDrawer}
        pairData={drawerPair}
        stackData={stackData}
        coAdminReactions={coAdminRxns}
      />
    </div>
  )
}

// ── Preview cards ─────────────────────────────────────────────────────────────

const PREVIEW_CARDS = [
  {
    title: 'Constellation Graph',
    desc: 'A live network of your drugs — edges glow red for significant interactions.',
    color: 'var(--teal)',
    icon: <GraphIcon />,
  },
  {
    title: 'Risk Score',
    desc: 'A 0–100 composite score built from RxNorm data, FAERS reports, and CYP450 overlap.',
    color: 'var(--amber)',
    icon: <GaugeIcon />,
  },
  {
    title: 'Adverse Events',
    desc: 'Top FDA-reported reactions per drug, plus a cross-drug heatmap of co-administration.',
    color: '#a78bfa',
    icon: <ChartIcon />,
  },
  {
    title: 'Recall Timeline',
    desc: 'All active and past recalls for your stack, color-coded by severity class.',
    color: 'var(--risk-red)',
    icon: <AlertIcon />,
  },
]

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionCard({ title, subtitle, titleAction, children }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={styles.cardTitle}>{title}</h3>
          {subtitle && <p style={styles.cardSubtitle}>{subtitle}</p>}
        </div>
        {titleAction}
      </div>
      <div style={styles.cardBody}>{children}</div>
    </div>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function InfoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  )
}
function XIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}
function ZapIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  )
}
function Spinner({ small }) {
  const s = small ? 14 : 20
  return (
    <div style={{
      width: s, height: s, flexShrink: 0,
      border: `2px solid var(--border-dim)`,
      borderTopColor: 'var(--teal)',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    }} aria-hidden="true" />
  )
}
function GraphIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  )
}
function GaugeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 0 1 7.39 16.74"/><path d="M12 2A10 10 0 0 0 4.61 18.74"/>
      <line x1="12" y1="12" x2="16" y2="8"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  )
}
function ChartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  )
}
function AlertIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toShortName(display) {
  if (!display) return ''
  const base = display.split('(')[0].trim()
  return base.length > 14 ? base.slice(0, 14) + '…' : base
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  appWrap: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },

  disclaimer: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 24px',
    background: 'rgba(0,229,200,0.06)',
    borderBottom: '1px solid rgba(0,229,200,0.15)',
    color: 'var(--text-secondary)',
    fontSize: 12, fontFamily: 'var(--font-mono)',
    position: 'sticky', top: 0, zIndex: 'var(--z-overlay)',
  },

  hero: { padding: '60px 24px 32px', display: 'flex', justifyContent: 'center' },
  heroInner: {
    width: '100%', maxWidth: 680,
    display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'stretch',
  },
  heroText:  { textAlign: 'center', marginBottom: 8 },
  heroTitle: {
    fontFamily: 'var(--font-serif)', fontSize: 'clamp(36px, 8vw, 54px)',
    color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 12,
  },
  heroSub: {
    fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text-secondary)',
    lineHeight: 1.75, maxWidth: 520, margin: '0 auto',
  },
  searchRow: { display: 'flex', gap: 10, alignItems: 'stretch' },
  chipRow:   { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', overflow: 'hidden' },
  chip: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'var(--teal-dim)', border: '1px solid rgba(0,229,200,0.25)',
    borderRadius: 20, padding: '6px 12px',
  },
  chipLabel:  { fontSize: 12, color: 'var(--teal)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' },
  chipRemove: {
    background: 'none', border: 'none', color: 'rgba(0,229,200,0.6)',
    display: 'flex', alignItems: 'center', cursor: 'pointer', padding: 2,
    borderRadius: 4, transition: 'color 0.2s',
  },
  stackCount: { fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginLeft: 'auto' },
  analyzeBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    background: 'var(--teal)', color: '#0a0d12', border: 'none',
    borderRadius: 'var(--radius-md)', padding: '13px 28px',
    fontSize: 14, fontFamily: 'var(--font-mono)', fontWeight: 500,
    letterSpacing: '0.02em', transition: 'opacity 0.2s, box-shadow 0.2s',
    boxShadow: '0 0 20px rgba(0,229,200,0.3)', alignSelf: 'center', minWidth: 180,
  },
  hint: {
    textAlign: 'center', fontSize: 12, color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)', marginTop: -8,
  },

  // Empty state preview
  previewSection: {
    padding: '8px 24px 48px', display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 20,
  },
  previewLabel: {
    fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
    textTransform: 'uppercase', letterSpacing: '0.1em',
  },
  previewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 12, width: '100%', maxWidth: 900,
  },
  previewCard: {
    display: 'flex', alignItems: 'flex-start', gap: 12,
    background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)', padding: '14px 16px',
  },
  previewIcon: { flexShrink: 0, marginTop: 1 },
  previewCardTitle: {
    fontSize: 13, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)',
    fontWeight: 500, marginBottom: 4,
  },
  previewCardDesc: {
    fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', lineHeight: 1.55,
  },
  tryPrompt: {
    fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
    textAlign: 'center',
  },
  tryBtn: {
    background: 'none', border: 'none', color: 'var(--teal)',
    fontFamily: 'var(--font-mono)', fontSize: 13, cursor: 'pointer',
    textDecoration: 'underline', padding: 0,
  },

  // Dashboard
  dashboard: { padding: '0 24px 48px', flex: 1 },
  dashboardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 20, maxWidth: 1440, margin: '0 auto', alignItems: 'start',
  },
  leftCol:   { display: 'flex', flexDirection: 'column', gap: 16 },
  centerCol: { display: 'flex', flexDirection: 'column', gap: 16 },
  rightCol:  { display: 'flex', flexDirection: 'column', gap: 16 },

  card: {
    background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-lg)', overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    padding: '16px 20px 12px', borderBottom: '1px solid var(--border-subtle)', gap: 10,
  },
  cardTitle: {
    fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--text-primary)',
    fontStyle: 'italic', lineHeight: 1.2,
  },
  cardSubtitle: {
    fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
    marginTop: 3, lineHeight: 1.4,
  },
  cardBody: { padding: '16px 20px' },

  graphWrap: {
    height: 360, borderRadius: 8, overflow: 'hidden',
    background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
  },
  graphLegend:  { display: 'flex', gap: 16, justifyContent: 'center', marginTop: 12 },
  legendItem:   { display: 'flex', alignItems: 'center', gap: 6 },
  legendText:   { fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' },

  meterRow: { display: 'flex', justifyContent: 'center', marginBottom: 12 },

  pairTable: { display: 'flex', flexDirection: 'column', gap: 4 },
  pairRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '8px 10px', borderRadius: 8, border: '1px solid',
    transition: 'background 0.15s',
  },
  pairNames: { display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 },
  pairDrug: {
    fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  pairPlus:    { fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 },
  pairRight:   { display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 },
  pairBarWrap: { width: 48, height: 4, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden' },
  pairBar:     { height: '100%', borderRadius: 2, transition: 'width 0.6s ease' },
  pairScore:   { fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 500, minWidth: 22, textAlign: 'right' },
  pairDot:     { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },

  tabSwitch: { display: 'flex', gap: 4, background: 'var(--bg-elevated)', borderRadius: 8, padding: 3 },
  tabBtn: {
    background: 'none', border: 'none', fontSize: 11, fontFamily: 'var(--font-mono)',
    cursor: 'pointer', padding: '4px 10px', borderRadius: 6, transition: 'color 0.2s',
  },

  footer: {
    display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6,
    padding: '14px 24px', borderTop: '1px solid var(--border-subtle)',
    marginTop: 'auto',
  },
  footerLabel: { fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' },
  footerLink: {
    fontSize: 11, color: 'var(--teal)', fontFamily: 'var(--font-mono)',
    textDecoration: 'none', opacity: 0.8,
  },
  footerSep:  { fontSize: 11, color: 'var(--border-dim)' },
  footerNote: { fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' },
}
