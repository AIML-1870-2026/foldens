/**
 * Composite risk scoring for drug pairs.
 *
 * Score components (0-100 per pair):
 *   40% — RxNorm interaction severity
 *   20% — FDA label cross-mention
 *   20% — FAERS co-admin report count (log scale)
 *   10% — Recall Class I in last 2 years
 *   10% — CYP450 enzyme overlap
 */

export const RISK_LEVELS = {
  NONE:     { label: 'None',     color: '#22c55e', hex: '#22c55e', severity: 0 },
  LOW:      { label: 'Low',      color: '#86efac', hex: '#86efac', severity: 1 },
  MODERATE: { label: 'Moderate', color: '#f59e0b', hex: '#f59e0b', severity: 2 },
  HIGH:     { label: 'High',     color: '#ef4444', hex: '#ef4444', severity: 3 },
}

/**
 * Score a single drug pair.
 * @param {Object} opts
 * @param {string} opts.rxnormSeverity  — 'high'|'moderate'|'low'|null
 * @param {boolean} opts.labelMention   — FDA label cross-mention
 * @param {number}  opts.coAdminCount   — FAERS co-admin report count
 * @param {boolean} opts.hasClassIRecall — recall in last 2 years
 * @param {Object}  opts.cyp450A        — CYP enzyme roles for drug A
 * @param {Object}  opts.cyp450B        — CYP enzyme roles for drug B
 */
export function scorePair({
  rxnormSeverity = null,
  labelMention = false,
  coAdminCount = 0,
  hasClassIRecall = false,
  cyp450A = {},
  cyp450B = {},
}) {
  // 40% — RxNorm
  let rxnormScore = 0
  if (rxnormSeverity === 'high')     rxnormScore = 40
  else if (rxnormSeverity === 'moderate') rxnormScore = 25
  else if (rxnormSeverity === 'low')      rxnormScore = 10

  // 20% — Label mention
  const labelScore = labelMention ? 20 : 0

  // 20% — Co-admin reports (log scale: 100 reports → 10, 1000 → 15, 10000 → 20)
  const coAdminScore = coAdminCount > 0
    ? Math.min(20, Math.round(Math.log10(coAdminCount + 1) * 7))
    : 0

  // 10% — Recall
  const recallScore = hasClassIRecall ? 10 : 0

  // 10% — CYP overlap
  const cypScore = getCypOverlapScore(cyp450A, cyp450B)

  const total = Math.min(100, rxnormScore + labelScore + coAdminScore + recallScore + cypScore)

  return {
    total,
    breakdown: { rxnormScore, labelScore, coAdminScore, recallScore, cypScore },
    riskLevel: getRiskLevel(total),
  }
}

function getCypOverlapScore(a, b) {
  const enzymesA = Object.keys(a)
  const enzymesB = Object.keys(b)
  const shared = enzymesA.filter(e => enzymesB.includes(e))

  // Higher score when roles conflict (inhibitor + substrate, inducer + substrate)
  let score = 0
  for (const enzyme of shared) {
    const roleA = a[enzyme]
    const roleB = b[enzyme]
    if (
      (roleA === 'inhibitor' && roleB === 'substrate') ||
      (roleB === 'inhibitor' && roleA === 'substrate') ||
      (roleA === 'inducer'   && roleB === 'substrate') ||
      (roleB === 'inducer'   && roleA === 'substrate')
    ) {
      score += 5
    } else {
      score += 2
    }
  }
  return Math.min(10, score)
}

export function getRiskLevel(score) {
  if (score >= 60) return RISK_LEVELS.HIGH
  if (score >= 30) return RISK_LEVELS.MODERATE
  if (score >= 10) return RISK_LEVELS.LOW
  return RISK_LEVELS.NONE
}

/**
 * Compute stack-level composite score from all pair scores.
 */
export function scoreStack(pairScores) {
  if (!pairScores.length) return { score: 0, riskLevel: RISK_LEVELS.NONE }

  // Weight by max severity
  const maxScore = Math.max(...pairScores.map(p => p.total))
  const avgScore = pairScores.reduce((s, p) => s + p.total, 0) / pairScores.length
  const stackScore = Math.round(avgScore * 0.6 + maxScore * 0.4)

  return {
    score: Math.min(100, stackScore),
    riskLevel: getRiskLevel(stackScore),
    maxPairScore: maxScore,
  }
}

/**
 * Generate all unique drug pairs from a list of drugs.
 */
export function generatePairs(drugs) {
  const pairs = []
  for (let i = 0; i < drugs.length; i++) {
    for (let j = i + 1; j < drugs.length; j++) {
      pairs.push([drugs[i], drugs[j]])
    }
  }
  return pairs
}
