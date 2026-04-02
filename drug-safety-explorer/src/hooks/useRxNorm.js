const RXNORM_BASE = 'https://rxnav.nlm.nih.gov/REST'

/**
 * Resolve a drug name to its RxCUI identifier.
 */
export async function resolveRxCUI(drugName) {
  try {
    const res = await fetch(
      `${RXNORM_BASE}/rxcui.json?name=${encodeURIComponent(drugName)}&search=1`
    )
    if (!res.ok) return null
    const data = await res.json()
    return data?.idGroup?.rxnormId?.[0] ?? null
  } catch {
    return null
  }
}

/**
 * Fetch drug-drug interactions from RxNorm for a list of RxCUIs.
 * @param {string[]} rxcuis
 * @returns {Array} interaction objects
 */
export async function fetchRxNormInteractions(rxcuis) {
  if (!rxcuis.length) return []
  try {
    const res = await fetch(
      `${RXNORM_BASE}/interaction/list.json?rxcuis=${rxcuis.join('+')}`
    )
    if (!res.ok) return []
    const data = await res.json()

    const interactions = []
    const groups = data?.fullInteractionTypeGroup ?? []
    for (const group of groups) {
      for (const type of (group.fullInteractionType ?? [])) {
        const pair = type.minConcept ?? []
        const drugA = pair[0]?.name
        const drugB = pair[1]?.name
        for (const ix of (type.interactionPair ?? [])) {
          interactions.push({
            drugA,
            drugB,
            severity: normalizeSeverity(ix.severity),
            description: ix.description,
            source: group.sourceName,
          })
        }
      }
    }
    return interactions
  } catch {
    return []
  }
}

function normalizeSeverity(raw) {
  if (!raw) return 'low'
  const s = raw.toLowerCase()
  if (s.includes('high') || s.includes('major') || s.includes('contraindicat')) return 'high'
  if (s.includes('moderate') || s.includes('medium')) return 'moderate'
  return 'low'
}

/**
 * Get the highest-severity interaction between two named drugs from a list
 * of interactions returned by fetchRxNormInteractions.
 */
export function getPairInteraction(interactions, nameA, nameB) {
  const a = nameA.toLowerCase()
  const b = nameB.toLowerCase()
  const matches = interactions.filter(ix => {
    const da = (ix.drugA ?? '').toLowerCase()
    const db = (ix.drugB ?? '').toLowerCase()
    return (da.includes(a) && db.includes(b)) || (da.includes(b) && db.includes(a))
  })
  if (!matches.length) return null

  const order = { high: 3, moderate: 2, low: 1 }
  return matches.sort((a, b) => (order[b.severity] ?? 0) - (order[a.severity] ?? 0))[0]
}

/**
 * Resolve all drugs in a stack to RxCUIs, then fetch all interactions.
 * Returns { rxcuiMap, interactions }
 */
export async function resolveAndFetchInteractions(drugs) {
  const rxcuiEntries = await Promise.allSettled(
    drugs.map(async (d) => {
      const cui = await resolveRxCUI(d.generic)
      return { generic: d.generic, rxcui: cui }
    })
  )

  const rxcuiMap = {}
  for (const r of rxcuiEntries) {
    if (r.status === 'fulfilled' && r.value.rxcui) {
      rxcuiMap[r.value.generic] = r.value.rxcui
    }
  }

  const rxcuis = Object.values(rxcuiMap).filter(Boolean)
  const interactions = rxcuis.length >= 2
    ? await fetchRxNormInteractions(rxcuis)
    : []

  return { rxcuiMap, interactions }
}
