import { useState, useCallback } from 'react'

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${GEMINI_KEY}`

/**
 * Hook for calling Gemini API to analyze a drug stack.
 * Returns { analyze, result, isLoading, error, streamText }
 */
export function useClaudeAnalysis() {
  const [result, setResult]         = useState(null)
  const [isLoading, setIsLoading]   = useState(false)
  const [error, setError]           = useState(null)
  const [streamText, setStreamText] = useState('')

  const analyze = useCallback(async ({ drugs, interactions, topEvents }) => {
    if (!GEMINI_KEY) {
      setError('No Gemini API key set. Add VITE_GEMINI_API_KEY to .env')
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)
    setStreamText('')

    const drugSummaries = drugs.map(d => {
      const events = (topEvents[d.generic] ?? [])
        .slice(0, 5)
        .map(e => e.term)
        .join(', ')
      return `- ${d.display} (${d.generic}): top reactions: ${events || 'none found'}`
    }).join('\n')

    const interactionSummaries = interactions
      .filter(ix => ix.total >= 20)
      .slice(0, 8)
      .map(ix => `- ${ix.drugA} + ${ix.drugB}: score ${ix.total}/100, ${ix.riskLevel?.label ?? 'unknown'} risk`)
      .join('\n')

    const prompt = `You are a clinical pharmacology assistant. Analyze this medication stack:

DRUGS:
${drugSummaries}

INTERACTION SCORES (0-100):
${interactionSummaries || 'No significant interactions detected.'}

Respond ONLY with valid JSON — no markdown, no code fences — matching exactly this shape:
{
  "overallRiskLevel": "low" | "moderate" | "high",
  "compositeScore": <number 0-100>,
  "topConcerns": [
    { "title": "...", "description": "...", "severity": "low"|"moderate"|"high", "drugs": ["..."] }
  ],
  "stackSummary": "<plain English paragraph, 2-4 sentences>",
  "recommendations": ["...", "...", "..."]
}

topConcerns: up to 4 items, most important first.
recommendations: 3-5 actionable items for a patient or caregiver.`

    try {
      const res = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024,
          },
        }),
      })

      if (!res.ok) {
        const errBody = await res.text()
        throw new Error(`Gemini API ${res.status}: ${errBody}`)
      }

      const data = await res.json()
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'

      let parsed
      try {
        parsed = JSON.parse(raw)
      } catch {
        const match = raw.match(/\{[\s\S]*\}/)
        parsed = match ? JSON.parse(match[0]) : {}
      }

      setResult(parsed)

      // Stream the summary text character by character
      const summary = parsed.stackSummary ?? ''
      let i = 0
      const interval = setInterval(() => {
        i++
        setStreamText(summary.slice(0, i))
        if (i >= summary.length) clearInterval(interval)
      }, 18)

    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { analyze, result, isLoading, error, streamText }
}
