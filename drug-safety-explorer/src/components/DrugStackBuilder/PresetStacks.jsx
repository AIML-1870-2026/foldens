import React, { useState } from 'react'

const PRESETS = [
  {
    label: 'Elderly Cardiac Patient',
    drugs: [
      { generic: 'warfarin', brand: 'Coumadin', display: 'Coumadin (Warfarin)' },
      { generic: 'metoprolol', brand: 'Lopressor', display: 'Lopressor (Metoprolol)' },
      { generic: 'lisinopril', brand: 'Zestril', display: 'Zestril (Lisinopril)' },
      { generic: 'atorvastatin', brand: 'Lipitor', display: 'Lipitor (Atorvastatin)' },
    ],
  },
  {
    label: 'SSRI + OTC Combo',
    drugs: [
      { generic: 'sertraline', brand: 'Zoloft', display: 'Zoloft (Sertraline)' },
      { generic: 'ibuprofen', brand: 'Advil', display: 'Advil (Ibuprofen)' },
      { generic: 'omeprazole', brand: 'Prilosec', display: 'Prilosec (Omeprazole)' },
    ],
  },
  {
    label: 'Diabetes Stack',
    drugs: [
      { generic: 'metformin', brand: 'Glucophage', display: 'Glucophage (Metformin)' },
      { generic: 'glipizide', brand: 'Glucotrol', display: 'Glucotrol (Glipizide)' },
      { generic: 'lisinopril', brand: 'Zestril', display: 'Zestril (Lisinopril)' },
      { generic: 'atorvastatin', brand: 'Lipitor', display: 'Lipitor (Atorvastatin)' },
    ],
  },
  {
    label: 'Common Pain + Infection',
    drugs: [
      { generic: 'amoxicillin', brand: 'Amoxil', display: 'Amoxil (Amoxicillin)' },
      { generic: 'ibuprofen', brand: 'Advil', display: 'Advil (Ibuprofen)' },
      { generic: 'acetaminophen', brand: 'Tylenol', display: 'Tylenol (Acetaminophen)' },
    ],
  },
]

export default function PresetStacks({ onLoad, disabled }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ position: 'relative' }}>
      <button
        style={styles.trigger}
        onClick={() => setOpen(o => !o)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <LayersIcon />
        <span>Common Stacks</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <ul role="listbox" style={styles.menu}>
          {PRESETS.map((preset) => (
            <li
              key={preset.label}
              role="option"
              style={styles.menuItem}
              onClick={() => {
                onLoad(preset.drugs)
                setOpen(false)
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={styles.presetLabel}>{preset.label}</span>
              <span style={styles.presetCount}>{preset.drugs.length} drugs</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function LayersIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  )
}

function ChevronIcon({ open }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

const styles = {
  trigger: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    background: 'var(--bg-card)',
    border: '1px solid var(--border-dim)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-secondary)',
    padding: '9px 14px',
    fontSize: 13,
    fontFamily: 'var(--font-mono)',
    cursor: 'pointer',
    transition: 'border-color 0.2s, color 0.2s',
    whiteSpace: 'nowrap',
  },
  menu: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    left: 0,
    background: 'var(--bg-card)',
    border: '1px solid var(--border-dim)',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
    zIndex: 'var(--z-overlay)',
    listStyle: 'none',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    minWidth: 220,
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '11px 16px',
    borderBottom: '1px solid var(--border-subtle)',
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  presetLabel: {
    fontSize: 13,
    color: 'var(--text-primary)',
  },
  presetCount: {
    fontSize: 11,
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
  },
}
