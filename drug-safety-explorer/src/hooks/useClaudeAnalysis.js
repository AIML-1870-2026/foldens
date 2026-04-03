import { useState, useCallback } from 'react'

/**
 * Generates an AI-style risk summary from structured data already fetched —
 * no API key required, no external calls.
 */
export function useClaudeAnalysis() {
  const [result, setResult]         = useState(null)
  const [isLoading, setIsLoading]   = useState(false)
  const [error, setError]           = useState(null)
  const [streamText, setStreamText] = useState('')

  const analyze = useCallback(async ({ drugs, interactions, topEvents }) => {
    setIsLoading(true)
    setError(null)
    setResult(null)
    setStreamText('')

    // Simulate async processing
    await sleep(400)

    const highPairs     = interactions.filter(ix => ix.total >= 60)
    const moderatePairs = interactions.filter(ix => ix.total >= 30 && ix.total < 60)
    const maxScore      = interactions.length ? Math.max(...interactions.map(ix => ix.total)) : 0

    const overallRiskLevel =
      highPairs.length > 0    ? 'high'     :
      moderatePairs.length > 0 ? 'moderate' : 'low'

    const compositeScore = interactions.length
      ? Math.round(
          interactions.reduce((s, ix) => s + ix.total, 0) / interactions.length * 0.6 +
          maxScore * 0.4
        )
      : 0

    // Build top concerns from pair scores + top events
    const topConcerns = []

    for (const ix of [...interactions].sort((a, b) => b.total - a.total).slice(0, 3)) {
      if (ix.total < 10) continue
      const severity = ix.total >= 60 ? 'high' : ix.total >= 30 ? 'moderate' : 'low'
      const rxDesc = ix.rxnormData?.description
      topConcerns.push({
        title: `${shortName(ix.displayA || ix.drugA)} + ${shortName(ix.displayB || ix.drugB)} Interaction`,
        description: rxDesc
          ? rxDesc
          : `Co-administration reports detected. Risk score ${ix.total}/100. Monitor closely if taken together.`,
        severity,
        drugs: [ix.drugA, ix.drugB],
      })
    }

    // Cross-drug adverse event patterns
    const termCounts = {}
    for (const drug of drugs) {
      for (const e of (topEvents[drug.generic] ?? []).slice(0, 5)) {
        termCounts[e.term] = (termCounts[e.term] ?? 0) + 1
      }
    }
    const crossTerms = Object.entries(termCounts)
      .filter(([, n]) => n >= Math.min(2, drugs.length))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)

    for (const [term] of crossTerms) {
      topConcerns.push({
        title: `Shared Adverse Effect: ${titleCase(term)}`,
        description: `"${titleCase(term)}" appears across multiple drugs in your stack. Combined exposure may increase this risk.`,
        severity: 'moderate',
        drugs: drugs.map(d => d.generic),
      })
    }

    // Stack summary
    const drugNames = drugs.map(d => shortName(d.display)).join(', ')
    let stackSummary = `Your ${drugs.length}-drug stack (${drugNames}) has a composite risk score of ${compositeScore}/100. `

    if (highPairs.length > 0) {
      const p = highPairs[0]
      stackSummary += `The most significant concern is the ${shortName(p.displayA || p.drugA)} + ${shortName(p.displayB || p.drugB)} combination, which carries a high interaction score. `
    } else if (moderatePairs.length > 0) {
      stackSummary += `${moderatePairs.length} drug pair${moderatePairs.length > 1 ? 's' : ''} show moderate interaction potential. `
    } else {
      stackSummary += `No high-severity interactions were detected between these drugs. `
    }

    stackSummary += `Always inform your healthcare provider about all medications you take, including over-the-counter drugs and supplements.`

    // Recommendations
    const recommendations = [
      'Share this complete medication list with your pharmacist or prescribing physician.',
    ]
    if (highPairs.length > 0) {
      recommendations.push(`Ask your doctor specifically about the ${shortName(highPairs[0].displayA || highPairs[0].drugA)} + ${shortName(highPairs[0].displayB || highPairs[0].drugB)} combination before continuing both.`)
    }
    if (crossTerms.length > 0) {
      recommendations.push(`Monitor for ${titleCase(crossTerms[0][0])} — this side effect appears in multiple drugs in your stack.`)
    }
    recommendations.push('Do not stop or adjust any medication without consulting a healthcare professional.')
    recommendations.push('Keep an updated medication list in your wallet or phone in case of emergencies.')

    const parsed = {
      overallRiskLevel,
      compositeScore,
      topConcerns: topConcerns.slice(0, 4),
      stackSummary,
      recommendations,
    }

    setResult(parsed)

    // Stream summary text character by character
    let i = 0
    const interval = setInterval(() => {
      i++
      setStreamText(stackSummary.slice(0, i))
      if (i >= stackSummary.length) clearInterval(interval)
    }, 16)

  }, [])

  return { analyze, result, isLoading, error, streamText }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function shortName(display) {
  if (!display) return ''
  return display.split('(')[0].trim().split(' ')[0]
}

function titleCase(str) {
  if (!str) return ''
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}
