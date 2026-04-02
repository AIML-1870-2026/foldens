const API_KEY = import.meta.env.VITE_OPENFDA_API_KEY || ''
const BASE    = 'https://api.fda.gov'

function buildUrl(path, params) {
  const url = new URL(BASE + path)
  if (API_KEY) url.searchParams.set('api_key', API_KEY)
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v)
  }
  return url.toString()
}

async function fetchFDA(path, params) {
  const url = buildUrl(path, params)
  const res = await fetch(url)
  if (!res.ok) {
    if (res.status === 404) return null
    throw new Error(`FDA API ${res.status}: ${path}`)
  }
  return res.json()
}

/**
 * Autocomplete: search drug names matching a query.
 */
export async function searchDrugNames(query) {
  if (!query || query.length < 2) return []
  const encoded = encodeURIComponent(query.toUpperCase())
  try {
    const data = await fetchFDA('/drug/label.json', {
      search: `openfda.generic_name:"${encoded}"`,
      limit: 5,
    })
    const results = []
    if (data?.results) {
      for (const r of data.results) {
        const generic = r.openfda?.generic_name?.[0]
        const brand   = r.openfda?.brand_name?.[0]
        if (generic) results.push({ generic, brand, label: r })
      }
    }
    return results
  } catch {
    // Try brand name search as fallback
    try {
      const data2 = await fetchFDA('/drug/label.json', {
        search: `openfda.brand_name:"${encoded}"`,
        limit: 5,
      })
      const results = []
      if (data2?.results) {
        for (const r of data2.results) {
          const generic = r.openfda?.generic_name?.[0]
          const brand   = r.openfda?.brand_name?.[0]
          if (brand) results.push({ generic, brand, label: r })
        }
      }
      return results
    } catch {
      return []
    }
  }
}

/**
 * Fetch full drug label for a given generic name.
 */
export async function fetchDrugLabel(genericName) {
  const encoded = encodeURIComponent(genericName.toUpperCase())
  const data = await fetchFDA('/drug/label.json', {
    search: `openfda.generic_name:"${encoded}"`,
    limit: 1,
  })
  return data?.results?.[0] ?? null
}

/**
 * Fetch top N adverse event reactions for a drug.
 */
export async function fetchAdverseEvents(genericName, limit = 10) {
  const encoded = encodeURIComponent(genericName.toUpperCase())
  try {
    const data = await fetchFDA('/drug/event.json', {
      search: `patient.drug.openfda.generic_name:"${encoded}"`,
      count: 'patient.reaction.reactionmeddrapt.exact',
      limit,
    })
    return data?.results ?? []
  } catch {
    return []
  }
}

/**
 * Fetch co-administration report count for two drugs.
 */
export async function fetchCoAdminCount(genericA, genericB) {
  const encA = encodeURIComponent(genericA.toUpperCase())
  const encB = encodeURIComponent(genericB.toUpperCase())
  try {
    const data = await fetchFDA('/drug/event.json', {
      search: `patient.drug.openfda.generic_name:"${encA}"+AND+patient.drug.openfda.generic_name:"${encB}"`,
      limit: 1,
    })
    return data?.meta?.results?.total ?? 0
  } catch {
    return 0
  }
}

/**
 * Fetch top co-admin reactions for two drugs together.
 */
export async function fetchCoAdminReactions(genericA, genericB, limit = 5) {
  const encA = encodeURIComponent(genericA.toUpperCase())
  const encB = encodeURIComponent(genericB.toUpperCase())
  try {
    const data = await fetchFDA('/drug/event.json', {
      search: `patient.drug.openfda.generic_name:"${encA}"+AND+patient.drug.openfda.generic_name:"${encB}"`,
      count: 'patient.reaction.reactionmeddrapt.exact',
      limit,
    })
    return data?.results ?? []
  } catch {
    return []
  }
}

/**
 * Fetch recalls for a drug by generic name or brand name.
 */
export async function fetchRecalls(genericName, brandName, limit = 10) {
  const encG = encodeURIComponent(genericName || '')
  const encB = encodeURIComponent(brandName || '')
  let search = ''
  if (encG) search = `openfda.generic_name:"${encG}"`
  if (encB) search += (search ? '+' : '') + `openfda.brand_name:"${encB}"`
  if (!search) return []

  try {
    const data = await fetchFDA('/drug/enforcement.json', { search, limit })
    return data?.results ?? []
  } catch {
    return []
  }
}

/**
 * Fetch all data for a full stack (parallelized).
 * Returns a map of drugId → { label, events, recalls }
 */
export async function fetchStackData(drugs) {
  const results = await Promise.allSettled(
    drugs.map(async (drug) => {
      const [label, events, recalls] = await Promise.all([
        fetchDrugLabel(drug.generic),
        fetchAdverseEvents(drug.generic),
        fetchRecalls(drug.generic, drug.brand),
      ])
      return { drug, label, events, recalls }
    })
  )

  const map = {}
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value) {
      map[r.value.drug.generic] = r.value
    }
  }
  return map
}
