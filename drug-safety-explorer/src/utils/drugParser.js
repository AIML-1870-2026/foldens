/**
 * Parse CYP450 enzyme mentions from FDA label text.
 * Returns an object mapping enzyme names to roles found in the text.
 */
export function parseCYP450(labelText) {
  if (!labelText) return {}
  const text = Array.isArray(labelText) ? labelText.join(' ') : labelText
  const upper = text.toUpperCase()

  const enzymes = [
    'CYP1A2', 'CYP2B6', 'CYP2C8', 'CYP2C9', 'CYP2C19',
    'CYP2D6', 'CYP2E1', 'CYP3A4', 'CYP3A5', 'CYP3A'
  ]

  const roles = {}

  for (const enzyme of enzymes) {
    if (!upper.includes(enzyme)) continue

    const idx = upper.indexOf(enzyme)
    const window = upper.slice(Math.max(0, idx - 60), idx + 80)

    let role = 'involved'
    if (/INHIBIT/.test(window)) role = 'inhibitor'
    else if (/INDUC/.test(window)) role = 'inducer'
    else if (/SUBSTRATE/.test(window)) role = 'substrate'
    else if (/METABOLI/.test(window)) role = 'substrate'

    roles[enzyme] = role
  }

  return roles
}

/**
 * Extract the clearest interaction warning sentences from label text.
 */
export function extractInteractionSnippets(labelText, drugName, limit = 5) {
  if (!labelText) return []
  const text = Array.isArray(labelText) ? labelText.join(' ') : labelText
  const upper = drugName.toUpperCase()

  // Split into sentences (rough)
  const sentences = text
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 30)

  // Score sentences by relevance
  const scored = sentences.map(s => {
    const u = s.toUpperCase()
    let score = 0
    if (u.includes(upper)) score += 3
    if (/INTERACT|CONTRAINDIC|AVOID|CAUTION|WARNING/i.test(u)) score += 2
    if (/CYP|ENZYME|METABOLI/i.test(u)) score += 1
    return { text: s, score }
  })

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.text)
}

/**
 * Build a display name for a drug from its FDA label entry.
 */
export function getDrugDisplayName(labelEntry) {
  if (!labelEntry) return 'Unknown'
  const brand = labelEntry.openfda?.brand_name?.[0]
  const generic = labelEntry.openfda?.generic_name?.[0]
  if (brand && generic && brand.toLowerCase() !== generic.toLowerCase()) {
    return `${titleCase(brand)} (${titleCase(generic)})`
  }
  return titleCase(brand || generic || 'Unknown')
}

function titleCase(str) {
  if (!str) return ''
  return str
    .toLowerCase()
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
