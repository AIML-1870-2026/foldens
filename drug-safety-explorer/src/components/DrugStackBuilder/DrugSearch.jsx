import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { searchDrugNames } from '../../hooks/useOpenFDA.js'

const DEBOUNCE_MS = 300

export default function DrugSearch({ stack, onAdd, maxDrugs = 6 }) {
  const [query, setQuery]           = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading]       = useState(false)
  const [activeIdx, setActiveIdx]   = useState(-1)
  const [open, setOpen]             = useState(false)
  const inputRef   = useRef(null)
  const timerRef   = useRef(null)
  const listRef    = useRef(null)

  const fetchSuggestions = useCallback(async (q) => {
    setLoading(true)
    try {
      const results = await searchDrugNames(q)
      setSuggestions(results)
      setOpen(results.length > 0)
    } catch {
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([])
      setOpen(false)
      return
    }
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => fetchSuggestions(query), DEBOUNCE_MS)
    return () => clearTimeout(timerRef.current)
  }, [query, fetchSuggestions])

  const handleSelect = (item) => {
    const generic = item.generic?.toLowerCase() ?? ''
    const brand   = item.brand ?? ''
    const display = brand
      ? `${toTitleCase(brand)} (${toTitleCase(generic)})`
      : toTitleCase(generic)

    const already = stack.some(d => d.generic === generic)
    if (!already && stack.length < maxDrugs) {
      onAdd({ generic, brand, display, label: item.label })
    }
    setQuery('')
    setSuggestions([])
    setOpen(false)
    setActiveIdx(-1)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault()
      handleSelect(suggestions[activeIdx])
    } else if (e.key === 'Escape') {
      setOpen(false)
      setActiveIdx(-1)
    }
  }

  const isFull = stack.length >= maxDrugs

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={styles.inputWrap}>
        <SearchIcon />
        <input
          ref={inputRef}
          style={styles.input}
          type="text"
          placeholder={isFull ? `Stack full (${maxDrugs}/${maxDrugs})` : 'Search drug name…'}
          value={query}
          disabled={isFull}
          onChange={e => { setQuery(e.target.value); setActiveIdx(-1) }}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          aria-label="Search for a drug"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="drug-suggestions"
        />
        {loading && <Spinner />}
      </div>

      <AnimatePresence>
        {open && (
          <motion.ul
            id="drug-suggestions"
            ref={listRef}
            role="listbox"
            style={styles.dropdown}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {suggestions.map((item, idx) => {
              const generic = item.generic ?? ''
              const brand   = item.brand ?? ''
              const inStack = stack.some(d => d.generic === generic.toLowerCase())
              return (
                <li
                  key={`${generic}-${idx}`}
                  role="option"
                  aria-selected={idx === activeIdx}
                  style={{
                    ...styles.suggestion,
                    background: idx === activeIdx ? 'var(--bg-elevated)' : 'transparent',
                    opacity: inStack ? 0.45 : 1,
                    cursor: inStack ? 'default' : 'pointer',
                  }}
                  onMouseDown={() => !inStack && handleSelect(item)}
                  onMouseEnter={() => setActiveIdx(idx)}
                >
                  <span style={styles.sugBrand}>{toTitleCase(brand || generic)}</span>
                  {brand && generic && (
                    <span style={styles.sugGeneric}>{toTitleCase(generic)}</span>
                  )}
                  {inStack && <span style={styles.inStackBadge}>Added</span>}
                </li>
              )
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

function toTitleCase(str) {
  if (!str) return ''
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function Spinner() {
  return (
    <div style={{
      width: 14, height: 14, flexShrink: 0,
      border: '2px solid var(--border-dim)',
      borderTopColor: 'var(--teal)',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    }} aria-label="Loading" />
  )
}

const styles = {
  inputWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'var(--bg-card)',
    border: '1px solid var(--border-dim)',
    borderRadius: 'var(--radius-md)',
    padding: '10px 14px',
    transition: 'border-color 0.2s',
  },
  input: {
    flex: 1,
    background: 'none',
    border: 'none',
    outline: 'none',
    color: 'var(--text-primary)',
    fontSize: 15,
    fontFamily: 'var(--font-mono)',
    letterSpacing: '0.01em',
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    left: 0,
    right: 0,
    background: 'var(--bg-card)',
    border: '1px solid var(--border-dim)',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
    zIndex: 'var(--z-overlay)',
    listStyle: 'none',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  },
  suggestion: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    borderBottom: '1px solid var(--border-subtle)',
    transition: 'background 0.15s',
  },
  sugBrand: {
    color: 'var(--text-primary)',
    fontSize: 14,
    fontWeight: 500,
    flex: 1,
  },
  sugGeneric: {
    color: 'var(--text-muted)',
    fontSize: 12,
  },
  inStackBadge: {
    fontSize: 11,
    padding: '2px 6px',
    borderRadius: 4,
    background: 'var(--teal-dim)',
    color: 'var(--teal)',
    fontFamily: 'var(--font-mono)',
  },
}
