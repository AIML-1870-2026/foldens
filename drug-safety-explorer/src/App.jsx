import React, { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import DrugSearch   from './components/DrugStackBuilder/DrugSearch.jsx'
import PresetStacks from './components/DrugStackBuilder/PresetStacks.jsx'
import Graph         from './components/ConstellationGraph/Graph.jsx'
import RiskMeter     from './components/RiskSummary/RiskMeter.jsx'
import StreamingSummary from './components/RiskSummary/StreamingSummary.jsx'
import ConcernCards  from './components/RiskSummary/ConcernCards.jsx'
import EventsPanel   from './components/AdverseEvents/EventsPanel.jsx'
import Timeline      from './components/RecallTimeline/Timeline.jsx'
import Drawer        from './components/InteractionDrawer/Drawer.jsx'

import { fetchStackData, fetchCoAdminCount, fetchCoAdminReactions } from './hooks/useOpenFDA.js'
import { resolveAndFetchInteractions, getPairInteraction }           from './hooks/useRxNorm.js'
import { useClaudeAnalysis }  from './hooks/useClaudeAnalysis.js'
import { scorePair, scoreStack, generatePairs } from './utils/riskScoring.js'
import { parseCYP450 } from './utils/drugParser.js'

const MAX_DRUGS = 6

export default function App() {
  const [stack,        setStack]        = useState([])
  const [isAnalyzing,  setIsAnalyzing]  = useState(false)
  const [hasAnalyzed,  setHasAnalyzed]  = useState(false)
  const [stackData,    setStackData]    = useState({})     // generic → { drug, label, events, recalls }
  const [pairScores,   setPairScores]   = useState([])     // array of scored pairs
  const [stackScore,   setStackScore]   = useState(null)
  const [eventsMap,    setEventsMap]    = useState({})     // generic → [{term, count}]
  const [recallsMap,   setRecallsMap]   = useState({})
  const [coAdminMatrix, setCoAdminMatrix] = useState({})
  const [rightTab,     setRightTab]     = useState('events')

  // Graph interaction state
  const [selectedPair, setSelectedPair] = useState(null)
  const [drawerOpen,   setDrawerOpen]   = useState(false)
  const [drawerPair,   setDrawerPair]   = useState(null)
  const [coAdminRxns,  setCoAdminRxns]  = useState([])

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
      // 1. Fetch all stack data in parallel
      const rawStackData = await fetchStackData(stack)
      setStackData(rawStackData)

      // Build events/recalls maps
      const newEventsMap = {}
      const newRecallsMap = {}
      for (const [generic, data] of Object.entries(rawStackData)) {
        newEventsMap[generic]  = data.events
        newRecallsMap[generic] = data.recalls
      }
      setEventsMap(newEventsMap)
      setRecallsMap(newRecallsMap)

      // 2. Resolve RxNorm interactions
      const { interactions: rxnormInteractions } = await resolveAndFetchInteractions(stack)

      // 3. Score all pairs
      const pairs = generatePairs(stack)

      // Fetch co-admin counts (rate-limit aware — sequential with small gap)
      const newMatrix = {}
      for (const [drugA, drugB] of pairs) {
        const count = await fetchCoAdminCount(drugA.generic, drugB.generic)
        newMatrix[`${drugA.generic}|${drugB.generic}`] = count
        // Small yield to avoid hammering the API
        await sleep(80)
      }
      setCoAdminMatrix(newMatrix)

      const scored = pairs.map(([drugA, drugB]) => {
        const labelA   = rawStackData[drugA.generic]?.label
        const labelB   = rawStackData[drugB.generic]?.label
        const cyp450A  = parseCYP450(labelA?.drug_interactions)
        const cyp450B  = parseCYP450(labelB?.drug_interactions)
        const coCount  = newMatrix[`${drugA.generic}|${drugB.generic}`] ?? 0

        // Check label cross-mention
        const interactionTextA = (labelA?.drug_interactions ?? []).join(' ').toUpperCase()
        const interactionTextB = (labelB?.drug_interactions ?? []).join(' ').toUpperCase()
        const labelMention = interactionTextA.includes(drugB.generic.toUpperCase()) ||
                             interactionTextB.includes(drugA.generic.toUpperCase())

        // RxNorm
        const rxnorm = getPairInteraction(rxnormInteractions, drugA.generic, drugB.generic)

        // Recall check
        const now = new Date()
        const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate())
        const hasClassIRecall = [...(rawStackData[drugA.generic]?.recalls ?? []),
                                 ...(rawStackData[drugB.generic]?.recalls ?? [])]
          .some(r => {
            if (r.classification !== 'Class I') return false
            const d = r.recall_initiation_date
            if (!d || d.length < 8) return false
            const dt = new Date(d.slice(0,4), d.slice(4,6)-1, d.slice(6,8))
            return dt >= twoYearsAgo
          })

        const result = scorePair({
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
          ...result,
          coAdminCount: coCount,
          rxnormData: rxnorm,
        }
      })

      setPairScores(scored)
      setStackScore(scoreStack(scored.map(s => ({ total: s.total }))))

      // 4. AI analysis
      await analyze({
        drugs: stack,
        interactions: scored,
        topEvents: newEventsMap,
      })

      setHasAnalyzed(true)

      // Scroll to dashboard
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
    // Fetch co-admin reactions
    const rxns = await fetchCoAdminReactions(pair.drugA, pair.drugB)
    setCoAdminRxns(rxns)
  }, [pairScores])

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false)
    setSelectedPair(null)
  }, [])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={styles.appWrap}>
      {/* Disclaimer banner */}
      <div style={styles.disclaimer} role="alert">
        <InfoIcon />
        <span>
          <strong>Educational only.</strong> RxLens is not a substitute for professional medical advice.
          Always consult a licensed healthcare provider before changing your medications.
        </span>
      </div>

      {/* Hero / Stack builder */}
      <section style={styles.hero} aria-label="Drug stack builder">
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
              Polypharmacy intelligence — build your medication stack and explore every interaction, adverse event, and recall in one unified view.
            </p>
          </motion.div>

          {/* Search + preset */}
          <div style={styles.searchRow}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <DrugSearch stack={stack} onAdd={addDrug} maxDrugs={MAX_DRUGS} />
            </div>
            <PresetStacks onLoad={loadPreset} disabled={false} />
          </div>

          {/* Stack chips */}
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
                <span style={styles.stackCount}>
                  {stack.length}/{MAX_DRUGS}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Analyze button */}
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
            {isAnalyzing ? (
              <>
                <Spinner small /> Analyzing…
              </>
            ) : (
              <>
                <ZapIcon />
                Analyze Stack
              </>
            )}
          </motion.button>

          {stack.length < 2 && (
            <p style={styles.hint}>Add at least 2 drugs to analyze interactions</p>
          )}
        </div>
      </section>

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
            <div style={styles.dashboardGrid}>
              {/* LEFT — Constellation graph */}
              <div style={styles.leftCol}>
                <SectionCard title="Drug Constellation" subtitle="Click edges to explore interactions · Drag nodes to rearrange">
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
                        // Highlight connected pairs
                        const related = pairScores.find(
                          p => p.drugA === drugId || p.drugB === drugId
                        )
                        if (related) openDrawer({ drugA: related.drugA, drugB: related.drugB })
                      }}
                    />
                  </div>

                  {/* Legend */}
                  <div style={styles.graphLegend}>
                    {[
                      { color: '#22c55e', label: 'No interaction' },
                      { color: '#f59e0b', label: 'Possible' },
                      { color: '#ef4444', label: 'Significant' },
                    ].map(l => (
                      <div key={l.label} style={styles.legendItem}>
                        <div style={{ width: 24, height: 2, background: l.color, borderRadius: 1 }} />
                        <span style={styles.legendText}>{l.label}</span>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>

              {/* CENTER — AI Risk Summary */}
              <div style={styles.centerCol}>
                <SectionCard title="AI Risk Summary" subtitle="Powered by Claude">
                  {stackScore && (
                    <div style={styles.meterRow}>
                      <RiskMeter score={stackScore.score} riskLevel={stackScore.riskLevel} />
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

                {/* Pair scores table */}
                {pairScores.length > 0 && (
                  <SectionCard title="Pair Scores" subtitle="Click a row to deep-dive">
                    <div style={styles.pairTable}>
                      {pairScores
                        .sort((a, b) => b.total - a.total)
                        .map((ps, i) => (
                          <div
                            key={i}
                            style={{
                              ...styles.pairRow,
                              borderColor: ps.riskLevel.color + '33',
                              cursor: 'pointer',
                            }}
                            onClick={() => openDrawer({ drugA: ps.drugA, drugB: ps.drugB })}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <div style={styles.pairNames}>
                              <span style={styles.pairDrug}>{toShortName(ps.displayA)}</span>
                              <span style={styles.pairPlus}>+</span>
                              <span style={styles.pairDrug}>{toShortName(ps.displayB)}</span>
                            </div>
                            <div style={styles.pairRight}>
                              <span style={{ ...styles.pairScore, color: ps.riskLevel.color }}>
                                {ps.total}
                              </span>
                              <div style={{
                                ...styles.pairDot,
                                background: ps.riskLevel.color,
                              }} />
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
                  {rightTab === 'events' ? (
                    <EventsPanel
                      drugs={stack}
                      eventsMap={eventsMap}
                      coAdminMatrix={coAdminMatrix}
                    />
                  ) : (
                    <Timeline
                      drugs={stack}
                      recallsMap={recallsMap}
                    />
                  )}
                </SectionCard>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

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

// ── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ title, subtitle, titleAction, children }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div>
          <h3 style={styles.cardTitle}>{title}</h3>
          {subtitle && <p style={styles.cardSubtitle}>{subtitle}</p>}
        </div>
        {titleAction}
      </div>
      <div style={styles.cardBody}>{children}</div>
    </div>
  )
}

// ── Icons ────────────────────────────────────────────────────────────────────

function InfoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function ZapIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

function Spinner({ small }) {
  const size = small ? 14 : 20
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      border: `${small ? 2 : 2.5}px solid var(--border-dim)`,
      borderTopColor: 'var(--teal)',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    }} aria-hidden="true" />
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toShortName(display) {
  if (!display) return ''
  const base = display.split('(')[0].trim()
  return base.length > 14 ? base.slice(0, 14) + '…' : base
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  appWrap: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  disclaimer: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 24px',
    background: 'rgba(0,229,200,0.06)',
    borderBottom: '1px solid rgba(0,229,200,0.15)',
    color: 'var(--text-secondary)',
    fontSize: 12,
    fontFamily: 'var(--font-mono)',
    position: 'sticky',
    top: 0,
    zIndex: 'var(--z-overlay)',
  },
  hero: {
    padding: '60px 24px 48px',
    display: 'flex',
    justifyContent: 'center',
  },
  heroInner: {
    width: '100%',
    maxWidth: 680,
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    alignItems: 'stretch',
  },
  heroText: {
    textAlign: 'center',
    marginBottom: 8,
  },
  heroTitle: {
    fontFamily: 'var(--font-serif)',
    fontSize: 54,
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
    marginBottom: 12,
  },
  heroSub: {
    fontFamily: 'var(--font-mono)',
    fontSize: 14,
    color: 'var(--text-secondary)',
    lineHeight: 1.7,
    maxWidth: 520,
    margin: '0 auto',
  },
  searchRow: {
    display: 'flex',
    gap: 10,
    alignItems: 'stretch',
  },
  chipRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
    overflow: 'hidden',
  },
  chip: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'var(--teal-dim)',
    border: '1px solid rgba(0,229,200,0.25)',
    borderRadius: 20,
    padding: '6px 12px',
  },
  chipLabel: {
    fontSize: 12,
    color: 'var(--teal)',
    fontFamily: 'var(--font-mono)',
    whiteSpace: 'nowrap',
  },
  chipRemove: {
    background: 'none',
    border: 'none',
    color: 'rgba(0,229,200,0.6)',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    padding: 2,
    borderRadius: 4,
    transition: 'color 0.2s',
  },
  stackCount: {
    fontSize: 11,
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
    marginLeft: 'auto',
  },
  analyzeBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    background: 'var(--teal)',
    color: '#0a0d12',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    padding: '13px 28px',
    fontSize: 14,
    fontFamily: 'var(--font-mono)',
    fontWeight: 500,
    letterSpacing: '0.02em',
    transition: 'opacity 0.2s, box-shadow 0.2s',
    boxShadow: '0 0 20px rgba(0,229,200,0.3)',
    alignSelf: 'center',
    minWidth: 180,
  },
  hint: {
    textAlign: 'center',
    fontSize: 12,
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
    marginTop: -8,
  },
  dashboard: {
    padding: '0 24px 64px',
    flex: 1,
  },
  dashboardGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 20,
    maxWidth: 1440,
    margin: '0 auto',
    alignItems: 'start',
  },
  leftCol:   { display: 'flex', flexDirection: 'column', gap: 16 },
  centerCol: { display: 'flex', flexDirection: 'column', gap: 16 },
  rightCol:  { display: 'flex', flexDirection: 'column', gap: 16 },
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: '16px 20px 12px',
    borderBottom: '1px solid var(--border-subtle)',
    gap: 10,
  },
  cardTitle: {
    fontFamily: 'var(--font-serif)',
    fontSize: 16,
    color: 'var(--text-primary)',
    fontStyle: 'italic',
    lineHeight: 1.2,
  },
  cardSubtitle: {
    fontSize: 11,
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
    marginTop: 3,
  },
  cardBody: {
    padding: '16px 20px',
  },
  graphWrap: {
    height: 380,
    borderRadius: 8,
    overflow: 'hidden',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
  },
  graphLegend: {
    display: 'flex',
    gap: 16,
    justifyContent: 'center',
    marginTop: 12,
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  legendText: {
    fontSize: 10,
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
  },
  meterRow: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 12,
  },
  pairTable: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  pairRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid',
    transition: 'background 0.15s',
  },
  pairNames: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  pairDrug: {
    fontSize: 11,
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-mono)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  pairPlus: {
    fontSize: 10,
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
    flexShrink: 0,
  },
  pairRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  pairScore: {
    fontSize: 13,
    fontFamily: 'var(--font-mono)',
    fontWeight: 500,
    minWidth: 24,
    textAlign: 'right',
  },
  pairDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
  },
  tabSwitch: {
    display: 'flex',
    gap: 4,
    background: 'var(--bg-elevated)',
    borderRadius: 8,
    padding: 3,
  },
  tabBtn: {
    background: 'none',
    border: 'none',
    fontSize: 11,
    fontFamily: 'var(--font-mono)',
    cursor: 'pointer',
    padding: '4px 10px',
    borderRadius: 6,
    transition: 'color 0.2s',
  },
}
